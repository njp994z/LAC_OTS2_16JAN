"""
plant_orchestrator.py
═══════════════════════════════════════════════════════════════════════════════
Master Orchestrator — Thacker Pass Sulfuric Acid Plant OTS
═══════════════════════════════════════════════════════════════════════════════

Chains ~15 unit-op backends into a single whole-plant Heat & Material Balance.

Physical Process Flow (Ambient → Filter → Drying Tower → Compressor → Furnace → …):
  Streams 1-4 are numbered in physical order, but CALCULATED compressor-first.

CALCULATION ORDER — Compressor is the system driver:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  STEP A: MAIN COMPRESSOR  (sets the air flow via fan law)             │
  │    • RPM % → Q_scfm (fan law: Q ∝ N)                                 │
  │    • Inlet T = f(drying tower acid inlet temperature)                 │
  │    • Inlet P = -13 inwc × (Q / Q_design)^1.5  (system curve)         │
  │    • One iteration: Q(0) → P_inlet → re-solve → Q(1)                 │
  │    • Produces Stream 3 (compressor suction) and Stream 4 (discharge)  │
  │                                                                        │
  │  STEP B: BACK-FILL UPSTREAM (Filter + Drying Tower from solved flow)  │
  │    • Stream 1 = Ambient air at atmospheric                            │
  │    • Stream 2 = After filter (filter ΔP from flow)                    │
  │    • Stream 3 = After drying tower = compressor suction (already set) │
  │    │                                                                   │
  │    ├──────────────────────── Stream 4 → Sulfur Furnace air feed       │
  │    │                                                                   │
  │  [4] Sulfur Furnace     ──► Stream 5 (furnace outlet gas)             │
  │    │                                                                   │
  │    ▼                                                                   │
  │  [5] WHB / Jug Valve    ──► Streams 6 (WHB in), 7 (bypass),          │
  │    │                         8a (WHB out), 8b (damper), 9 (mixed)     │
  │    ▼                                                                   │
  │  [6] Superheater 1B     ──► Stream 10 (Pass 1 inlet)                 │
  │    │                                                                   │
  │    ▼                                                                   │
  │  [7] Converter Pass 1   ──► Stream 11 (Pass 1 outlet)                │
  │    │                                                                   │
  │    ▼                                                                   │
  │  [8] Hot Interpass HX   ──► Stream 12 (HIP in), Stream 13 (HIP out)  │
  │    │                                                                   │
  │    ▼                                                                   │
  │  [9] Converter Pass 2   ──► Stream 14 (Pass 2 outlet)                │
  │    │                                                                   │
  │    ▼                                                                   │
  │ [10] Cold Interpass HX  ──► Stream 15 (CIP out)                      │
  │    │                                                                   │
  │    ▼                                                                   │
  │ [11] Converter Pass 3   ──► Stream 16 (Pass 3 outlet)                │
  │    │                                                                   │
  │    ▼                                                                   │
  │ [12] Economizer 3B      ──► (gas cooling before IPAT)                │
  │    │                                                                   │
  │    ▼                                                                   │
  │ [13] IPAT               ──► Stream 17 (SO3 removed gas)              │
  │    │                                                                   │
  │    ▼                                                                   │
  │ [14] Converter Pass 4   ──► Stream 19 (Pass 4 outlet)                │
  │    │                                                                   │
  │    ▼                                                                   │
  │ [15] SH4A / EC4C / EC4A ──► Streams 20-23 (gas cooling train)        │
  │    │                                                                   │
  │    ▼                                                                   │
  │ [16] FAT                ──► Stream 24+ (stack gas)                    │
  └─────────────────────────────────────────────────────────────────────────┘

Two modes:
  STATIC  — instant steady-state solve on every input change
  DYNAMIC — timestep integration with lag, dead-time, PID loops

Returns:
  - streams{}      : dict of all numbered GasStream / LiquidStream objects
  - kpp{}          : Key Process Parameters block
  - alarms[]       : active alarm list
  - sensor_tags{}  : flat dict keyed by instrument tag (e.g. "1540-TI-4010")

═══════════════════════════════════════════════════════════════════════════════
"""

from __future__ import annotations
import json
import sys
import math
import time
import copy
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum


# ═══════════════════════════════════════════════════════════════════════════════
# COMMON STREAM INTERFACE
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class GasStream:
    """Universal gas stream — every unit op reads/writes this."""
    stream_id: int = 0
    tag: str = ""
    label: str = ""

    # Component flows (scfm at standard conditions: 32°F, 29.92 inHg)
    SO2: float = 0.0
    SO3: float = 0.0
    O2: float = 0.0
    N2: float = 0.0
    H2O: float = 0.0
    H2SO4: float = 0.0
    CO2: float = 0.0
    TOTAL: float = 0.0

    # Conditions
    pressure_inwc: float = 0.0     # gauge, in. w.c.
    temperature_F: float = 0.0     # °F
    temperature_C: float = 0.0     # °C (derived)

    def recalc_total(self):
        self.TOTAL = self.SO2 + self.SO3 + self.O2 + self.N2 + self.H2O + self.H2SO4 + self.CO2
        self.temperature_C = (self.temperature_F - 32.0) * 5.0 / 9.0
        return self

    def to_dict(self) -> dict:
        self.recalc_total()
        return {
            "stream_id": self.stream_id,
            "tag": self.tag,
            "label": self.label,
            "SO2": round(self.SO2, 1),
            "SO3": round(self.SO3, 1),
            "O2": round(self.O2, 1),
            "N2": round(self.N2, 1),
            "H2O": round(self.H2O, 1),
            "H2SO4": round(self.H2SO4, 1),
            "CO2": round(self.CO2, 1),
            "TOTAL": round(self.TOTAL, 1),
            "PRESSURE": round(self.pressure_inwc, 1),
            "TEMPERATURE": round(self.temperature_F, 1),
            "TEMPERATURE_C": round(self.temperature_C, 1),
        }

    def copy(self) -> GasStream:
        return copy.deepcopy(self)

    def mole_fractions(self) -> Dict[str, float]:
        """Return component mole fractions."""
        t = max(self.TOTAL, 1e-9)
        return {
            "SO2": self.SO2 / t,
            "SO3": self.SO3 / t,
            "O2": self.O2 / t,
            "N2": self.N2 / t,
            "H2O": self.H2O / t,
            "H2SO4": self.H2SO4 / t,
            "CO2": self.CO2 / t,
        }


@dataclass
class LiquidStream:
    """Acid or water stream."""
    stream_id: int = 0
    tag: str = ""
    label: str = ""

    x_H2SO4: float = 0.0          # mass fraction
    x_H2O: float = 0.0
    m_total_klbhr: float = 0.0    # klb/hr
    flow_gpm: float = 0.0
    pressure_psig: float = 0.0
    temperature_F: float = 0.0

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class SteamStream:
    """Steam / BFW stream."""
    stream_id: int = 0
    tag: str = ""
    label: str = ""

    flow_lbhr: float = 0.0
    pressure_psig: float = 0.0
    temperature_F: float = 0.0

    def to_dict(self) -> dict:
        return asdict(self)


# ═══════════════════════════════════════════════════════════════════════════════
# PLANT INPUT STATE
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class PlantInputs:
    """All operator-adjustable inputs across the entire plant."""

    # --- Ambient / Site ---
    ambient_temp_F: float = 93.0
    ambient_humidity_gr_lb: float = 79.0
    barometric_atm: float = 0.85
    barometric_psia: float = 12.49  # 0.85 * 14.696

    # --- Inlet Air Filter ---
    filter_dp_inwc: float = 2.0

    # --- Main Compressor ---
    compressor_rpm_pct: float = 87.0
    plant_condition: str = "clean"    # "clean" or "dirty"

    # --- Drying Tower ---
    dt_acid_flow_gpm: float = 850.0
    dt_acid_strength: float = 0.93
    dt_acid_inlet_temp_F: float = 180.0   # acid inlet T → sets compressor suction gas T
    dt_packing_depth_ft: float = 8.0
    dt_dp_design_inwc: float = 5.0        # drying tower ΔP at design flow

    # --- System Curve (upstream of compressor) ---
    # Total system ΔP at design: filter + DT + duct losses ≈ -13 inwc
    # Scales as (Q/Q_design)^1.5
    system_dp_design_inwc: float = -13.0  # total suction ΔP at design flow (negative gauge)
    system_dp_exponent: float = 1.5       # resistance curve exponent
    design_air_flow_scfm: float = 115301.0  # design dry air flow, scfm

    # --- Sulfur System ---
    sulfur_flow_sp_gpm: float = 79.0
    sulfur_temp_F: float = 275.0
    sulfur_pit_level_ft: float = 7.0

    # --- Sulfur Furnace ---
    # (derived: air from compressor, sulfur from sulfur system)

    # --- WHB / Jug Valve ---
    jug_valve_pct: float = 10.0
    damper_open_pct: float = 100.0

    # --- Catalytic Converter ---
    pass1_catalyst: str = "MECS GR330"
    pass1_liters: float = 36.0        # total (L1 + L2)
    pass1_activity: float = 100.0
    pass2_catalyst: str = "MECS Super Gear XLP-310"
    pass2_liters: float = 40.0
    pass2_activity: float = 100.0
    pass3_catalyst: str = "MECS Super Gear XLP-310"
    pass3_liters: float = 45.0
    pass3_activity: float = 100.0
    pass4_catalyst: str = "MECS Super Gear XLP-310"
    pass4_liters: float = 50.0
    pass4_activity: float = 100.0

    pass1_inlet_temp_C: float = 390.0
    pass2_inlet_temp_C: float = 420.0
    pass3_inlet_temp_C: float = 440.0
    pass4_inlet_temp_C: float = 390.0

    # Converter inlet pressures (gauge, in. w.c.)
    pass1_inlet_pres_inwc: float = 150.0
    pass2_inlet_pres_inwc: float = 135.0
    pass3_inlet_pres_inwc: float = 100.0
    pass4_inlet_pres_inwc: float = 60.0

    # Feed gas composition (mol %)
    so2_percent: float = 11.3
    o2_percent: float = 9.5
    so3_percent: float = 0.2
    n2_percent: float = 79.0
    co2_percent: float = 0.0

    # --- IPAT ---
    ipat_so3_removal_pct: float = 100.0
    ipat_acid_flow_gpm: float = 900.0
    ipat_acid_strength: float = 0.985
    ipat_acid_temp_F: float = 180.0

    # --- Interpass HX ---
    hip_hot_inlet_F: float = 965.0
    cip_hot_inlet_F: float = 847.0
    cip_cold_feed_F: float = 180.0
    target_pass3_temp_F: float = 806.0
    target_pass4_temp_F: float = 779.0

    # --- EC3B ---
    ec3b_water_flow_lbhr: float = 269418.0
    ec3b_water_temp_F: float = 240.0
    ec3b_water_press_psig: float = 178.55
    ec3b_ipat_setpt_F: float = 330.0

    # --- SH4A / EC4C / EC4A ---
    sh_steam_flow_lbhr: float = 269418.0
    sh_steam_temp_F: float = 540.7
    sh_steam_press_psig: float = 900.0
    sh1b_duty_mmbtu: float = 38.6
    sh1b_out_setpt_F: float = 900.0
    ec4a_gas_setpt_F: float = 275.0

    # --- FAT ---
    fat_acid_flow_gpm: float = 950.0
    fat_acid_strength: float = 0.985
    fat_acid_temp_F: float = 180.0

    # --- Simulation Mode ---
    mode: str = "static"               # "static" or "dynamic"
    dynamic_dt_s: float = 1.0          # timestep for dynamic mode
    dynamic_time_s: float = 0.0        # current sim time


# ═══════════════════════════════════════════════════════════════════════════════
# ALARM SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════

class AlarmPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Alarm:
    tag: str
    message: str
    priority: AlarmPriority
    value: float = 0.0
    limit: float = 0.0
    unit: str = ""
    timestamp: float = 0.0

    def to_dict(self) -> dict:
        return {
            "tag": self.tag,
            "message": self.message,
            "priority": self.priority.value,
            "value": round(self.value, 2),
            "limit": round(self.limit, 2),
            "unit": self.unit,
            "timestamp": self.timestamp,
        }


# ═══════════════════════════════════════════════════════════════════════════════
# UNIT OPERATION WRAPPERS
# Each wraps the existing backend calc module and speaks GasStream in/out
# ═══════════════════════════════════════════════════════════════════════════════

class MainCompressor:
    """
    Unit Op [A]: Main Compressor — Howden SF14, 1540-KC-001.
    CALCULATED FIRST — the compressor is the system driver.

    Calculation logic:
      1. Fan law gives initial flow estimate: Q ∝ N
      2. System resistance curve gives inlet pressure:
           P_inlet_inwc = system_dp_design × (Q / Q_design)^exponent
         where system_dp_design ≈ -13 inwc at design flow, exponent = 1.5
      3. Compressor inlet temperature ≈ drying tower acid inlet temperature
         (the warm acid heats the gas as it dries it; gas leaves DT near acid T_in)
      4. Solve compressor thermodynamics at these inlet conditions
      5. Iterate once: updated flow → updated inlet P → re-solve

    Returns (stream3_suction, stream4_discharge, compressor_details)
    """

    MAX_RPM = 4505.0
    GAMMA = 1.4
    EFFICIENCY = 0.90
    R_AIR = 53.35          # ft·lbf/(lbm·°R)

    # Reference point from Howden SF14 datasheet
    REF_SPEED_RPM = 4174.0
    REF_DP_INWC = 212.0
    REF_FLOW_ACFM = 177051.0

    # Gearbox ratio (compressor RPM / motor RPM)
    GEARBOX_RATIO = 4174.0 / 1654.0  # ≈ 2.524

    @staticmethod
    def calculate(inp: PlantInputs) -> Tuple[GasStream, GasStream, Dict[str, float]]:
        """
        Solve compressor with one iteration on the system curve.

        Returns:
            stream3: Compressor suction (= drying tower outlet)
            stream4: Compressor discharge
            details: Dict of compressor performance metrics
        """
        gamma = MainCompressor.GAMMA
        eta = MainCompressor.EFFICIENCY
        exponent = (gamma - 1.0) / gamma

        rpm = inp.compressor_rpm_pct / 100.0 * MainCompressor.MAX_RPM
        speed_ratio = rpm / MainCompressor.REF_SPEED_RPM

        # Pressure rise: ΔP ∝ N² (fan law), adjusted for plant condition
        dirty_mult = 1.45 if inp.plant_condition == "dirty" else 1.0
        dp_rise_inwc = MainCompressor.REF_DP_INWC * speed_ratio ** 2 * dirty_mult

        # Inlet temperature: gas leaving drying tower is heated by warm acid
        # The countercurrent acid/gas contact brings gas close to acid inlet temp
        # A small approach ΔT (~5-10°F below acid) is typical
        T_inlet_F = inp.dt_acid_inlet_temp_F - 5.0

        # ── Iteration: flow → system ΔP → inlet P → re-solve ────────────
        # Pass 0: estimate flow from fan law at assumed inlet density
        Q_scfm_estimate = inp.design_air_flow_scfm * speed_ratio

        for iteration in range(2):  # one iteration is usually sufficient
            Q_ratio = Q_scfm_estimate / max(inp.design_air_flow_scfm, 1.0)

            # System resistance curve: P_inlet = design_dp × (Q/Q_des)^exponent
            # system_dp_design is negative (suction), e.g. -13 inwc
            P_inlet_inwc = inp.system_dp_design_inwc * (Q_ratio ** inp.system_dp_exponent)

            # Convert to absolute pressures for thermodynamics
            P_in_psia = inp.barometric_atm * 14.696 + P_inlet_inwc * 0.03613
            P_out_psia = P_in_psia + dp_rise_inwc * 0.03613
            P_outlet_inwc = P_inlet_inwc + dp_rise_inwc

            # Isentropic temperature rise
            T_in_R = T_inlet_F + 459.67
            pr = P_out_psia / max(P_in_psia, 0.1)
            T_out_R = T_in_R * (1.0 + (1.0 / eta) * (pr ** exponent - 1.0))
            T_outlet_F = T_out_R - 459.67

            # Actual inlet flow (for next iteration density correction)
            # Q_acfm from ideal gas: ρ = P/(R·T), Q_acfm = m_dot / ρ
            inlet_density = (P_in_psia * 144.0) / (MainCompressor.R_AIR * T_in_R)
            ref_flow_acfm = MainCompressor.REF_FLOW_ACFM * speed_ratio
            mass_flow_lbhr = ref_flow_acfm * inlet_density * 60.0

            # Standard flow (at 32°F, 29.92 inHg per datasheet Note 4)
            std_T_R = 32.0 + 459.67
            std_density = (14.696 * 144.0) / (MainCompressor.R_AIR * std_T_R)
            Q_scfm_new = mass_flow_lbhr / (std_density * 60.0)

            # Update estimate for next iteration
            Q_scfm_estimate = Q_scfm_new

        # ── Final system curve recomputation at converged flow ───────────
        Q_ratio = Q_scfm_estimate / max(inp.design_air_flow_scfm, 1.0)
        P_inlet_inwc = inp.system_dp_design_inwc * (Q_ratio ** inp.system_dp_exponent)
        P_in_psia = inp.barometric_atm * 14.696 + P_inlet_inwc * 0.03613
        P_out_psia = P_in_psia + dp_rise_inwc * 0.03613
        P_outlet_inwc = P_inlet_inwc + dp_rise_inwc
        pr = P_out_psia / max(P_in_psia, 0.1)
        T_out_R = T_in_R * (1.0 + (1.0 / eta) * (pr ** exponent - 1.0))
        T_outlet_F = T_out_R - 459.67
        inlet_density = (P_in_psia * 144.0) / (MainCompressor.R_AIR * T_in_R)
        mass_flow_lbhr = ref_flow_acfm * inlet_density * 60.0

        # ── Final values ─────────────────────────────────────────────────
        Q_scfm = Q_scfm_estimate

        # Decompose total flow into O2/N2 (dry air, H2O removed by drying tower)
        O2_scfm = Q_scfm * 0.2095
        N2_scfm = Q_scfm * 0.7808
        # Trace residual moisture after drying tower (~0.003% typical)
        H2O_scfm = Q_scfm * 0.00003

        # Stream 3: Compressor suction = drying tower outlet
        s3 = GasStream(
            stream_id=3, tag="GC0",
            label="Stream 3 — Compressor Suction (DT Outlet)",
            O2=O2_scfm, N2=N2_scfm, H2O=H2O_scfm,
            pressure_inwc=P_inlet_inwc,
            temperature_F=T_inlet_F,
        ).recalc_total()

        # Stream 4: Compressor discharge
        s4 = GasStream(
            stream_id=4, tag="GC1",
            label="Stream 4 — Compressor Discharge",
            O2=O2_scfm, N2=N2_scfm, H2O=H2O_scfm,
            pressure_inwc=P_outlet_inwc,
            temperature_F=T_outlet_F,
        ).recalc_total()

        # Performance metrics
        isentropic_head = (gamma / (gamma - 1.0)) * MainCompressor.R_AIR * T_in_R * (
            pr ** exponent - 1.0
        )
        brake_power_hp = (mass_flow_lbhr / 60.0) * isentropic_head / (eta * 33000.0)
        motor_power_hp = brake_power_hp / 0.96
        driver_speed = rpm / MainCompressor.GEARBOX_RATIO

        # VFD current (4160V, 3-phase, PF=0.85, VFD η=0.97)
        electric_kw = motor_power_hp * 0.7457 / 0.97
        vfd_current = (electric_kw * 1000.0) / (4160.0 * math.sqrt(3.0) * 0.85)

        details = {
            "compressor_rpm": round(rpm, 0),
            "driver_rpm": round(driver_speed, 0),
            "speed_ratio": round(speed_ratio, 4),
            "inlet_flow_scfm": round(Q_scfm, 0),
            "inlet_flow_acfm": round(ref_flow_acfm, 0),
            "mass_flow_klbhr": round(mass_flow_lbhr / 1000.0, 1),
            "inlet_pressure_inwc": round(P_inlet_inwc, 1),
            "outlet_pressure_inwc": round(P_outlet_inwc, 1),
            "pressure_rise_inwc": round(dp_rise_inwc, 1),
            "inlet_temp_F": round(T_inlet_F, 1),
            "outlet_temp_F": round(T_outlet_F, 1),
            "temp_rise_F": round(T_outlet_F - T_inlet_F, 1),
            "pressure_ratio": round(pr, 4),
            "isentropic_head_ftlblb": round(isentropic_head, 0),
            "brake_power_hp": round(brake_power_hp, 0),
            "motor_power_hp": round(motor_power_hp, 0),
            "motor_power_MW": round(motor_power_hp * 0.0007457, 3),
            "vfd_current_amps": round(vfd_current, 0),
            "iterations": 2,
        }

        return s3, s4, details


class InletAirFilter:
    """
    Unit Op [B-1]: Inlet Air Filter — 1540-FL-001.
    BACK-FILLED from solved compressor flow.

    The filter ΔP is part of the total system ΔP that was already used
    in the compressor system curve. Here we decompose it to populate
    Streams 1 (ambient) and 2 (filter outlet).
    """

    @staticmethod
    def calculate(compressor_flow_scfm: float, inp: PlantInputs) -> Tuple[GasStream, GasStream]:
        """
        Back-fill ambient air (Stream 1) and filter outlet (Stream 2)
        from the solved compressor flow.
        """
        # At ambient, air has humidity; total wet flow > dry flow
        O2_frac = 0.2095
        N2_frac = 0.7808

        # Wet air flow (before drying tower removes moisture)
        dry_scfm = compressor_flow_scfm  # compressor flow ≈ dry air (post-DT)
        O2_scfm = dry_scfm * O2_frac
        N2_scfm = dry_scfm * N2_frac

        # Humidity → H2O scfm
        lb_h2o_per_lb_dry = inp.ambient_humidity_gr_lb / 7000.0
        mole_ratio = lb_h2o_per_lb_dry * (28.97 / 18.015)
        H2O_scfm = dry_scfm * mole_ratio
        total_wet = O2_scfm + N2_scfm + H2O_scfm

        # Stream 1: Ambient air — atmospheric pressure
        s1 = GasStream(
            stream_id=1, tag="GAF0",
            label="Stream 1 — Ambient Air Inlet",
            O2=O2_scfm, N2=N2_scfm, H2O=H2O_scfm,
            pressure_inwc=0.0,
            temperature_F=inp.ambient_temp_F,
        ).recalc_total()

        # Filter ΔP: proportional share of total system ΔP
        # Filter typically accounts for ~15-25% of total upstream ΔP
        # Scale filter ΔP with flow: ΔP_filter = ΔP_rated × (Q/Q_des)^2
        Q_ratio = compressor_flow_scfm / max(inp.design_air_flow_scfm, 1.0)
        filter_dp = inp.filter_dp_inwc * (Q_ratio ** 2)

        # Stream 2: Filter outlet
        s2 = GasStream(
            stream_id=2, tag="GAF1",
            label="Stream 2 — Filter Outlet",
            O2=O2_scfm, N2=N2_scfm, H2O=H2O_scfm,
            pressure_inwc=-filter_dp,
            temperature_F=inp.ambient_temp_F,
        ).recalc_total()

        return s1, s2


class DryingTower:
    """
    Unit Op [B-2]: Drying Tower — removes H2O from process gas.
    BACK-FILLED from solved compressor flow.

    The drying tower sits between the filter outlet and compressor suction.
    Gas enters with ambient moisture and leaves essentially dry at a
    temperature close to the acid inlet temperature (countercurrent contact).
    """

    @staticmethod
    def calculate(
        filter_outlet: GasStream,
        compressor_suction: GasStream,
        inp: PlantInputs,
    ) -> Tuple[GasStream, GasStream]:
        """
        Returns:
            dt_inlet: Gas entering drying tower (= filter outlet, with DT inlet P)
            dt_outlet: Gas leaving drying tower (= compressor suction, already solved)
        
        The dt_outlet IS the compressor suction stream (Stream 3), already calculated.
        We create a dt_inlet stream to show conditions at the tower entrance.
        """
        # Drying tower inlet = filter outlet (Stream 2 with DT entrance conditions)
        # The remaining ΔP between filter outlet and compressor suction is the DT + duct
        dt_inlet = filter_outlet.copy()
        dt_inlet.tag = "GDT0"
        dt_inlet.label = "Stream 2B — Drying Tower Gas Inlet"

        # DT outlet is the compressor suction (already solved)
        dt_outlet = compressor_suction  # This IS Stream 3

        # Drying tower moisture removal efficiency
        efficiency = min(0.96 + 0.004 * inp.dt_packing_depth_ft, 0.995)

        # The compressor suction stream already has near-zero H2O
        # Verify consistency: H2O in Stream 2 should be >> H2O in Stream 3
        # (the difference was absorbed into the acid)

        return dt_inlet, dt_outlet


class SulfurFurnace:
    """Unit Op [4]: Sulfur Furnace — S + O₂ → SO₂ (+ trace SO₃)."""

    MOL_S = 32.06
    SCF_PER_LBMOL = 379.0
    HEAT_COMBUSTION = 8773.0   # BTU/lb S
    CP_GAS_AVG = 0.28
    SO3_FRACTION = 0.018

    @staticmethod
    def calculate(air_stream: GasStream, sulfur_klbhr: float, inp: PlantInputs) -> GasStream:
        m_s_lbhr = sulfur_klbhr * 1000.0
        lbmol_s_hr = m_s_lbhr / SulfurFurnace.MOL_S

        scfm_so2_total = lbmol_s_hr * SulfurFurnace.SCF_PER_LBMOL / 60.0
        scfm_so3 = scfm_so2_total * SulfurFurnace.SO3_FRACTION
        scfm_so2 = scfm_so2_total - scfm_so3

        o2_consumed = scfm_so2 + 0.5 * scfm_so3
        o2_out = max(air_stream.O2 - o2_consumed, 0.0)

        # Temperature from simplified heat balance
        heat_release = m_s_lbhr * SulfurFurnace.HEAT_COMBUSTION
        mol_wt_air = 28.96
        mass_air = (air_stream.TOTAL * mol_wt_air) / SulfurFurnace.SCF_PER_LBMOL
        mass_gas = mass_air + (scfm_so2 * 64.06 + scfm_so3 * 80.06) / SulfurFurnace.SCF_PER_LBMOL
        effective_heat = heat_release * 0.0105
        delta_T = effective_heat / max(mass_gas * SulfurFurnace.CP_GAS_AVG, 1.0)
        T_out = inp.ambient_temp_F + delta_T

        total = scfm_so2 + scfm_so3 + o2_out + air_stream.N2
        P_out = 176.0 + (total - 115000.0) / 1000.0 * 5.0

        s5 = GasStream(
            stream_id=5, tag="GF1", label="Stream 5 — Furnace Outlet",
            SO2=scfm_so2, SO3=scfm_so3, O2=o2_out, N2=air_stream.N2,
            pressure_inwc=P_out, temperature_F=T_out,
        ).recalc_total()

        return s5


class WHBJugValve:
    """Unit Op [5]: Waste Heat Boiler + Jug Valve bypass."""

    WHB_AREA = 9800.0
    WHB_UO = 16.0
    STEAM_TEMP_F = 540.7
    CP_GAS = 0.26
    WHB_DP = 16.0
    DAMPER_DP_MAX = 5.0

    @staticmethod
    def calculate(s5: GasStream, inp: PlantInputs) -> Dict[str, GasStream]:
        jug_frac = min(1.0, max(0.0, inp.jug_valve_pct / 100.0))
        whb_frac = 1.0 - jug_frac

        # Stream 6: WHB inlet
        s6 = s5.copy()
        s6.stream_id = 6
        s6.tag = "GB0"
        s6.label = "Stream 6 — WHB Inlet"
        for attr in ("SO2", "SO3", "O2", "N2", "H2O", "H2SO4"):
            setattr(s6, attr, getattr(s5, attr) * whb_frac)
        s6.recalc_total()

        # Stream 7: Jug valve bypass
        s7 = s5.copy()
        s7.stream_id = 7
        s7.tag = "GJV0"
        s7.label = "Stream 7 — Jug Valve Bypass"
        for attr in ("SO2", "SO3", "O2", "N2", "H2O", "H2SO4"):
            setattr(s7, attr, getattr(s5, attr) * jug_frac)
        s7.recalc_total()

        # WHB heat exchange (NTU-effectiveness)
        whb_out_T = s5.temperature_F
        if s6.TOTAL > 0:
            m_cp = s6.TOTAL * 60.0 * WHBJugValve.CP_GAS
            ntu = (WHBJugValve.WHB_UO * WHBJugValve.WHB_AREA) / max(m_cp, 1.0)
            eff = 1.0 - math.exp(-ntu)
            whb_out_T = s5.temperature_F - eff * (s5.temperature_F - WHBJugValve.STEAM_TEMP_F)
            whb_out_T = max(WHBJugValve.STEAM_TEMP_F + 10.0, whb_out_T)

        # Stream 8a: WHB outlet
        s8a = s6.copy()
        s8a.stream_id = 8
        s8a.tag = "GB1"
        s8a.label = "Stream 8a — WHB Outlet"
        s8a.temperature_F = whb_out_T
        s8a.pressure_inwc = s5.pressure_inwc - WHBJugValve.WHB_DP

        # Stream 8b: After damper
        damper_frac = min(1.0, max(0.0, inp.damper_open_pct / 100.0))
        damper_dp = WHBJugValve.DAMPER_DP_MAX * (1.0 - damper_frac) ** 2
        s8b = s8a.copy()
        s8b.tag = "GPV1"
        s8b.label = "Stream 8b — After Damper"
        s8b.pressure_inwc = s8a.pressure_inwc - damper_dp

        # Stream 9: Mixed
        s9 = GasStream(stream_id=9, tag="GP10", label="Stream 9 — Mixed WHB + Bypass")
        for attr in ("SO2", "SO3", "O2", "N2", "H2O", "H2SO4"):
            setattr(s9, attr, getattr(s8b, attr) + getattr(s7, attr))
        s9.recalc_total()

        total_9 = s9.TOTAL
        if total_9 > 0:
            s9.temperature_F = (s8b.temperature_F * s8b.TOTAL + s7.temperature_F * s7.TOTAL) / total_9
            s9.pressure_inwc = (s8b.pressure_inwc * s8b.TOTAL + s7.pressure_inwc * s7.TOTAL) / total_9
        else:
            s9.temperature_F = s5.temperature_F
            s9.pressure_inwc = s8b.pressure_inwc

        return {"s6": s6, "s7": s7, "s8a": s8a, "s8b": s8b, "s9": s9}


class CatalyticPass:
    """Single catalytic converter pass (simplified steady-state model)."""

    @staticmethod
    def calculate(
        inlet: GasStream,
        pass_number: int,
        inlet_temp_C: float,
        catalyst_name: str,
        catalyst_liters: float,
        activity_pct: float,
        barometric_psia: float,
    ) -> GasStream:
        """
        Simplified pass calculation: uses equilibrium approach.
        For full RK4, call main.py / rk_solver.py backend.
        """
        # Approximate conversion per pass
        # These are typical industrial values for a 3-1 double absorption plant
        pass_conversions = {1: 0.62, 2: 0.27, 3: 0.06, 4: 0.035}
        fractional_conv = pass_conversions.get(pass_number, 0.05)

        # Adjust for catalyst activity
        fractional_conv *= (activity_pct / 100.0)

        so2_in = inlet.SO2
        so2_converted = so2_in * fractional_conv
        so3_produced = so2_converted  # 1:1 molar (SO2 → SO3)
        o2_consumed = so2_converted * 0.5

        outlet = inlet.copy()
        outlet.stream_id = inlet.stream_id + 1
        outlet.SO2 = max(0.0, inlet.SO2 - so2_converted)
        outlet.SO3 = inlet.SO3 + so3_produced
        outlet.O2 = max(0.0, inlet.O2 - o2_consumed)

        # Adiabatic temperature rise (~110°C per 1% SO2 converted at 11% SO2)
        # More precisely: ΔT ≈ (-ΔH_rxn × ySO2_0 × ΔX) / Cp_mix
        delta_T_C = so2_converted / max(inlet.TOTAL, 1.0) * 100.0 * 110.0
        outlet_temp_C = inlet_temp_C + delta_T_C
        outlet.temperature_F = outlet_temp_C * 9.0 / 5.0 + 32.0

        # Pressure drop (~2-5 inwc per pass)
        dp_per_pass = {1: 4.0, 2: 3.5, 3: 3.0, 4: 3.0}
        outlet.pressure_inwc = inlet.pressure_inwc - dp_per_pass.get(pass_number, 3.0)

        outlet.recalc_total()
        return outlet


class InterpassHX:
    """Unit Ops [8,10]: Hot and Cold Interpass Heat Exchangers."""

    @staticmethod
    def cool_stream(
        hot_stream: GasStream,
        target_temp_F: float,
        stream_id: int,
        tag: str,
        label: str,
        dp_inwc: float = 4.0,
    ) -> GasStream:
        """Cool a gas stream to a target temperature (simplified)."""
        cooled = hot_stream.copy()
        cooled.stream_id = stream_id
        cooled.tag = tag
        cooled.label = label
        cooled.temperature_F = target_temp_F
        cooled.pressure_inwc = hot_stream.pressure_inwc - dp_inwc
        cooled.recalc_total()
        return cooled


class IPATower:
    """Unit Op [13]: Interpass Absorption Tower — removes SO3."""

    @staticmethod
    def calculate(inlet: GasStream, inp: PlantInputs) -> GasStream:
        removal_frac = min(inp.ipat_so3_removal_pct / 100.0, 1.0)
        so3_removed = inlet.SO3 * removal_frac

        outlet = inlet.copy()
        outlet.stream_id = 17
        outlet.tag = "GI1"
        outlet.label = "Stream 17 — IPAT Outlet (SO3 Removed)"
        outlet.SO3 = inlet.SO3 - so3_removed
        outlet.pressure_inwc = inlet.pressure_inwc - 6.0
        # Gas cools in IPAT (typically to ~180°F)
        outlet.temperature_F = 180.0
        outlet.recalc_total()
        return outlet


class EC3B:
    """Unit Op [12]: Economizer 3B — gas cooling before IPAT."""

    @staticmethod
    def calculate(inlet: GasStream, target_temp_F: float) -> GasStream:
        cooled = inlet.copy()
        cooled.tag = "GEB1"
        cooled.label = "EC3B Gas Outlet → IPAT Inlet"
        cooled.temperature_F = target_temp_F
        cooled.pressure_inwc = inlet.pressure_inwc - 3.0
        cooled.recalc_total()
        return cooled


class SH4A_EC4C_EC4A:
    """Unit Op [15]: Superheater 4A / Economizer 4C / Economizer 4A train."""

    @staticmethod
    def calculate(inlet: GasStream, inp: PlantInputs) -> Dict[str, GasStream]:
        # SH4A: hot gas → superheat steam
        s20 = inlet.copy()
        s20.stream_id = 20
        s20.tag = "GSA0"
        s20.label = "Stream 20 — SH4A Gas Inlet"

        # Approximate gas cooling through the 3 exchangers
        # SH4A cools ~100°F, EC4C cools ~80°F, EC4A cools to setpoint
        sh4a_dt = 100.0
        ec4c_dt = 80.0

        s21 = s20.copy()
        s21.stream_id = 21
        s21.tag = "GEC0"
        s21.label = "Stream 21 — EC4C Gas Inlet"
        s21.temperature_F = s20.temperature_F - sh4a_dt
        s21.pressure_inwc = s20.pressure_inwc - 4.0

        s22 = s21.copy()
        s22.stream_id = 22
        s22.tag = "GEA0"
        s22.label = "Stream 22 — EC4A Gas Inlet"
        s22.temperature_F = s21.temperature_F - ec4c_dt
        s22.pressure_inwc = s21.pressure_inwc - 3.0

        s23 = s22.copy()
        s23.stream_id = 23
        s23.tag = "GF0"
        s23.label = "Stream 23 — FAT Gas Inlet"
        s23.temperature_F = inp.ec4a_gas_setpt_F
        s23.pressure_inwc = s22.pressure_inwc - 3.0

        for s in (s20, s21, s22, s23):
            s.recalc_total()

        return {"s20": s20, "s21": s21, "s22": s22, "s23": s23}


class FATower:
    """Unit Op [16]: Final Absorption Tower."""

    @staticmethod
    def calculate(inlet: GasStream, inp: PlantInputs) -> GasStream:
        # FAT removes remaining SO3 (>99.8% efficiency)
        efficiency = 0.998
        so3_removed = inlet.SO3 * efficiency

        s24 = inlet.copy()
        s24.stream_id = 24
        s24.tag = "GF1"
        s24.label = "Stream 24 — FAT Outlet (Stack Gas)"
        s24.SO3 = inlet.SO3 - so3_removed
        s24.pressure_inwc = inlet.pressure_inwc - 6.0
        s24.temperature_F = 160.0  # gas exits cool
        s24.recalc_total()
        return s24


# ═══════════════════════════════════════════════════════════════════════════════
# KEY PROCESS PARAMETERS
# ═══════════════════════════════════════════════════════════════════════════════

def compute_kpp(streams: Dict[int, GasStream], inp: PlantInputs) -> Dict[str, Any]:
    """Compute Key Process Parameters from solved streams."""
    s5 = streams.get(5, GasStream())
    s24 = streams.get(24, GasStream())

    # Overall SO2 conversion
    so2_in = s5.SO2
    so2_out = s24.SO2
    overall_conversion = (1.0 - so2_out / max(so2_in, 1e-9)) * 100.0

    # SO2 ppm in stack gas (stream 24)
    so2_ppm_stack = (s24.SO2 / max(s24.TOTAL, 1e-9)) * 1e6

    # Plant production rate (approx from sulfur flow)
    # 1 mol S → 1 mol H2SO4: M_S=32, M_H2SO4=98
    # sulfur_klbhr * (98/32) * 24 / 2000 = STPD H2SO4
    sulfur_klbhr = inp.sulfur_flow_sp_gpm * 1.79 * 500.3 / 1000.0
    h2so4_stpd = sulfur_klbhr * (98.08 / 32.06) * 24.0 / 2.0

    return {
        "overall_SO2_conversion_pct": round(overall_conversion, 2),
        "SO2_ppm_stack": round(so2_ppm_stack, 1),
        "H2SO4_production_STPD": round(h2so4_stpd, 0),
        "furnace_temp_F": round(s5.temperature_F, 0),
        "compressor_rpm_pct": inp.compressor_rpm_pct,
        "plant_condition": inp.plant_condition,
        "sulfur_flow_gpm": inp.sulfur_flow_sp_gpm,
        "jug_valve_pct": inp.jug_valve_pct,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ALARM CHECKS
# ═══════════════════════════════════════════════════════════════════════════════

def check_alarms(streams: Dict[int, GasStream], inp: PlantInputs) -> List[Alarm]:
    """Check all alarm conditions and return active alarms."""
    alarms = []
    now = time.time()

    s5 = streams.get(5, GasStream())
    s9 = streams.get(9, GasStream())
    s24 = streams.get(24, GasStream())

    # Furnace temperature
    if s5.temperature_F > 2200:
        alarms.append(Alarm("1540-TAH-4010", "Furnace outlet temperature HIGH",
                            AlarmPriority.HIGH, s5.temperature_F, 2200, "°F", now))
    if s5.temperature_F < 1800:
        alarms.append(Alarm("1540-TAL-4010", "Furnace outlet temperature LOW",
                            AlarmPriority.MEDIUM, s5.temperature_F, 1800, "°F", now))

    # Converter inlet temperature (Pass 1)
    s10 = streams.get(10, GasStream())
    if s10.temperature_F > 850:
        alarms.append(Alarm("1540-TAH-4101", "Pass 1 inlet temperature HIGH",
                            AlarmPriority.HIGH, s10.temperature_F, 850, "°F", now))

    # Stack SO2
    so2_ppm = (s24.SO2 / max(s24.TOTAL, 1e-9)) * 1e6
    if so2_ppm > 500:
        alarms.append(Alarm("1540-AIH-9001", "Stack SO2 HIGH",
                            AlarmPriority.CRITICAL, so2_ppm, 500, "ppm", now))

    # Compressor surge (low flow warning)
    s4 = streams.get(4, GasStream())
    if s4.TOTAL < 80000:
        alarms.append(Alarm("1540-FAL-4030", "Main compressor flow LOW — surge risk",
                            AlarmPriority.CRITICAL, s4.TOTAL, 80000, "scfm", now))

    return alarms


# ═══════════════════════════════════════════════════════════════════════════════
# SENSOR TAG MAPPING
# ═══════════════════════════════════════════════════════════════════════════════

def build_sensor_tags(
    streams: Dict[int, GasStream],
    inp: PlantInputs,
    kpp: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Build a flat dict keyed by instrument tag number.
    The React frontend reads these directly: sensorTags["1540-TI-4010"]
    """
    tags: Dict[str, Any] = {}

    s = streams  # shorthand

    # --- Ambient / Filter ---
    tags["1540-TI-5800"] = s.get(1, GasStream()).temperature_F      # Ambient temp
    tags["1540-PI-5801"] = s.get(2, GasStream()).pressure_inwc       # Filter outlet pressure
    tags["1540-PDI-5801"] = inp.filter_dp_inwc                       # Filter dP

    # --- Main Compressor ---
    tags["1540-SIC-4030"] = inp.compressor_rpm_pct                   # Compressor speed %
    tags["1540-TI-4031"] = s.get(4, GasStream()).temperature_F       # Compressor outlet T
    tags["1540-PI-4031"] = s.get(4, GasStream()).pressure_inwc       # Compressor outlet P
    tags["1540-FI-4030"] = s.get(4, GasStream()).TOTAL               # Compressor flow

    # --- Sulfur System ---
    tags["1530-FIC-2602"] = inp.sulfur_flow_sp_gpm                   # Sulfur flow SP
    tags["1530-TI-2601"] = inp.sulfur_temp_F                         # Sulfur temperature
    tags["1530-LI-2600"] = inp.sulfur_pit_level_ft                   # Sulfur pit level

    # --- Furnace ---
    tags["1540-TI-4010"] = s.get(5, GasStream()).temperature_F       # Furnace outlet T
    tags["1540-PI-4010"] = s.get(5, GasStream()).pressure_inwc       # Furnace outlet P
    tags["1540-AI-4010"] = kpp.get("SO2_ppm_stack", 0)              # Stack SO2

    # --- WHB / Jug Valve ---
    tags["1540-ZI-4020"] = inp.jug_valve_pct                         # Jug valve position
    tags["1540-TI-4021"] = s.get(9, GasStream()).temperature_F       # WHB mixed outlet T

    # --- Converter Pass Temperatures ---
    pass_streams = {1: 10, 2: 12, 3: 14, 4: 18}
    for p_num, s_id in pass_streams.items():
        stream = s.get(s_id, GasStream())
        tags[f"1540-TI-41{p_num}0"] = stream.temperature_F          # Pass inlet T
        outlet_id = s_id + 1
        outlet = s.get(outlet_id, GasStream())
        tags[f"1540-TI-41{p_num}1"] = outlet.temperature_F          # Pass outlet T

    # --- IPAT ---
    tags["1540-TI-4200"] = s.get(16, GasStream()).temperature_F      # IPAT gas inlet T
    tags["1540-TI-4201"] = s.get(17, GasStream()).temperature_F      # IPAT gas outlet T

    # --- SH4A / EC4C / EC4A ---
    tags["1540-TI-4300"] = s.get(20, GasStream()).temperature_F      # SH4A gas inlet T
    tags["1540-TI-4301"] = s.get(23, GasStream()).temperature_F      # EC4A gas outlet T

    # --- FAT / Stack ---
    tags["1540-TI-4400"] = s.get(24, GasStream()).temperature_F      # Stack gas T

    # --- KPP ---
    tags["KPP_CONVERSION"] = kpp.get("overall_SO2_conversion_pct", 0)
    tags["KPP_PRODUCTION"] = kpp.get("H2SO4_production_STPD", 0)
    tags["KPP_SO2_STACK"] = kpp.get("SO2_ppm_stack", 0)

    return tags


# ═══════════════════════════════════════════════════════════════════════════════
# MASTER ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════════════════

class PlantOrchestrator:
    """
    Master orchestrator — chains all unit ops, returns complete plant state.
    """

    def __init__(self):
        self.streams: Dict[int, GasStream] = {}
        self.liquid_streams: Dict[str, LiquidStream] = {}
        self.steam_streams: Dict[str, SteamStream] = {}
        self.kpp: Dict[str, Any] = {}
        self.alarms: List[Alarm] = []
        self.sensor_tags: Dict[str, Any] = {}
        self.dynamic_state: Dict[str, Any] = {}

    def solve_static(self, inp: PlantInputs) -> Dict[str, Any]:
        """
        Full static H&MB solve — one-shot steady state.
        Call this on every input change.

        CALCULATION ORDER:
          Step A: Main Compressor (system driver — sets flow, suction P)
          Step B: Back-fill Inlet Air Filter + Drying Tower (Streams 1, 2)
          Step C: Sulfur Furnace → downstream as before
        """
        streams = {}

        # ══════════════════════════════════════════════════════════════════
        # STEP A:  MAIN COMPRESSOR  (calculated FIRST — it drives the plant)
        # ══════════════════════════════════════════════════════════════════
        #   Inlet T  = DT acid inlet temp - 5°F approach
        #   Inlet P  = -13 inwc × (Q / Q_design)^1.5   (system curve)
        #   One iteration: Q(0) → P_inlet → re-solve → Q(1)
        s3, s4, comp_details = MainCompressor.calculate(inp)
        streams[3] = s3   # compressor suction = DT outlet
        streams[4] = s4   # compressor discharge

        # ══════════════════════════════════════════════════════════════════
        # STEP B:  BACK-FILL UPSTREAM  (Filter + Drying Tower from solved flow)
        # ══════════════════════════════════════════════════════════════════
        compressor_flow_scfm = s3.TOTAL
        s1, s2 = InletAirFilter.calculate(compressor_flow_scfm, inp)
        streams[1] = s1   # ambient air at atmospheric
        streams[2] = s2   # filter outlet (negative gauge P)

        # Drying tower: inlet = filter outlet, outlet = compressor suction (already s3)
        dt_inlet, dt_outlet = DryingTower.calculate(s2, s3, inp)
        # Stream 3 is already set from the compressor solve — no overwrite

        # ── [4] Sulfur Furnace ───────────────────────────────────────────
        # Sulfur flow: gpm → klb/hr
        sulfur_klbhr = inp.sulfur_flow_sp_gpm * 1.79 * 500.3 / 1000.0
        s5 = SulfurFurnace.calculate(s4, sulfur_klbhr, inp)
        streams[5] = s5

        # ── [5] WHB / Jug Valve ──────────────────────────────────────────
        whb_streams = WHBJugValve.calculate(s5, inp)
        streams[6] = whb_streams["s6"]
        streams[7] = whb_streams["s7"]
        streams[8] = whb_streams["s8a"]
        streams[9] = whb_streams["s9"]

        # ── [6] To Converter — Stream 10 = Pass 1 inlet ─────────────────
        # Stream 9 → cooling → Stream 10 (Pass 1 inlet)
        s10 = InterpassHX.cool_stream(
            streams[9],
            target_temp_F=inp.pass1_inlet_temp_C * 9.0 / 5.0 + 32.0,
            stream_id=10, tag="GP10", label="Stream 10 — Pass 1 Inlet",
            dp_inwc=2.0,
        )
        streams[10] = s10

        # ── [7] Converter Pass 1 ─────────────────────────────────────────
        s11 = CatalyticPass.calculate(
            s10, pass_number=1,
            inlet_temp_C=inp.pass1_inlet_temp_C,
            catalyst_name=inp.pass1_catalyst,
            catalyst_liters=inp.pass1_liters,
            activity_pct=inp.pass1_activity,
            barometric_psia=inp.barometric_psia,
        )
        s11.stream_id = 11
        s11.tag = "G11"
        s11.label = "Stream 11 — Pass 1 Outlet"
        streams[11] = s11

        # ── [8] Hot Interpass HX → Stream 12 (cooled) ────────────────────
        s12 = InterpassHX.cool_stream(
            s11,
            target_temp_F=inp.pass2_inlet_temp_C * 9.0 / 5.0 + 32.0,
            stream_id=12, tag="G12", label="Stream 12 — HIP Outlet / Pass 2 Inlet",
            dp_inwc=4.0,
        )
        streams[12] = s12

        # ── [9] Converter Pass 2 ─────────────────────────────────────────
        s13 = CatalyticPass.calculate(
            s12, pass_number=2,
            inlet_temp_C=inp.pass2_inlet_temp_C,
            catalyst_name=inp.pass2_catalyst,
            catalyst_liters=inp.pass2_liters,
            activity_pct=inp.pass2_activity,
            barometric_psia=inp.barometric_psia,
        )
        s13.stream_id = 13
        s13.tag = "G13"
        s13.label = "Stream 13 — Pass 2 Outlet"
        streams[13] = s13

        # ── [10] Cold Interpass HX → Stream 14 ──────────────────────────
        s14 = InterpassHX.cool_stream(
            s13,
            target_temp_F=inp.pass3_inlet_temp_C * 9.0 / 5.0 + 32.0,
            stream_id=14, tag="G14", label="Stream 14 — CIP Outlet / Pass 3 Inlet",
            dp_inwc=4.0,
        )
        streams[14] = s14

        # ── [11] Converter Pass 3 ────────────────────────────────────────
        s15 = CatalyticPass.calculate(
            s14, pass_number=3,
            inlet_temp_C=inp.pass3_inlet_temp_C,
            catalyst_name=inp.pass3_catalyst,
            catalyst_liters=inp.pass3_liters,
            activity_pct=inp.pass3_activity,
            barometric_psia=inp.barometric_psia,
        )
        s15.stream_id = 15
        s15.tag = "G15"
        s15.label = "Stream 15 — Pass 3 Outlet"
        streams[15] = s15

        # ── [12] EC3B cooling ────────────────────────────────────────────
        s16 = EC3B.calculate(s15, target_temp_F=inp.ec3b_ipat_setpt_F)
        s16.stream_id = 16
        s16.label = "Stream 16 — EC3B Outlet / IPAT Gas Inlet"
        streams[16] = s16

        # ── [13] IPAT ────────────────────────────────────────────────────
        s17 = IPATower.calculate(s16, inp)
        streams[17] = s17

        # ── [14] Converter Pass 4 ────────────────────────────────────────
        # IPAT outlet → interpass HX cooling → Pass 4 inlet (Stream 18)
        s18 = InterpassHX.cool_stream(
            s17,
            target_temp_F=inp.pass4_inlet_temp_C * 9.0 / 5.0 + 32.0,
            stream_id=18, tag="G18", label="Stream 18 — Pass 4 Inlet",
            dp_inwc=3.0,
        )
        streams[18] = s18

        s19 = CatalyticPass.calculate(
            s18, pass_number=4,
            inlet_temp_C=inp.pass4_inlet_temp_C,
            catalyst_name=inp.pass4_catalyst,
            catalyst_liters=inp.pass4_liters,
            activity_pct=inp.pass4_activity,
            barometric_psia=inp.barometric_psia,
        )
        s19.stream_id = 19
        s19.tag = "G19"
        s19.label = "Stream 19 — Pass 4 Outlet"
        streams[19] = s19

        # ── [15] SH4A / EC4C / EC4A ─────────────────────────────────────
        sh_streams = SH4A_EC4C_EC4A.calculate(s19, inp)
        streams[20] = sh_streams["s20"]
        streams[21] = sh_streams["s21"]
        streams[22] = sh_streams["s22"]
        streams[23] = sh_streams["s23"]

        # ── [16] FAT ─────────────────────────────────────────────────────
        s24 = FATower.calculate(streams[23], inp)
        streams[24] = s24

        # ── Post-processing ──────────────────────────────────────────────
        self.streams = streams
        self.kpp = compute_kpp(streams, inp)
        self.alarms = check_alarms(streams, inp)
        self.sensor_tags = build_sensor_tags(streams, inp, self.kpp)

        return self._build_response(inp)

    def solve_dynamic_step(self, inp: PlantInputs) -> Dict[str, Any]:
        """
        Single dynamic timestep. Calls static solve as the target,
        then applies first-order lags to key process variables.
        
        For full dynamic fidelity, replace this with per-unit-op
        dynamic models (compressor transients, thermal lags, PID loops).
        """
        # For now, dynamic mode = static solve + metadata
        # Full dynamic implementation would integrate:
        # - Compressor speed ramp (VFD dynamics)
        # - Furnace thermal mass
        # - WHB steam drum level
        # - Converter bed thermal transients
        # - PID controllers for TCV valves
        result = self.solve_static(inp)
        result["mode"] = "dynamic"
        result["sim_time_s"] = inp.dynamic_time_s
        result["dt_s"] = inp.dynamic_dt_s
        return result

    def solve(self, inp: PlantInputs) -> Dict[str, Any]:
        """Dispatch to static or dynamic solver."""
        if inp.mode == "dynamic":
            return self.solve_dynamic_step(inp)
        return self.solve_static(inp)

    def _build_response(self, inp: PlantInputs) -> Dict[str, Any]:
        """Package everything into the API response."""
        return {
            "success": True,
            "mode": inp.mode,
            "streams": {
                str(sid): s.to_dict()
                for sid, s in sorted(self.streams.items())
            },
            "kpp": self.kpp,
            "alarms": [a.to_dict() for a in self.alarms],
            "sensor_tags": self.sensor_tags,
            "metadata": {
                "timestamp": time.time(),
                "stream_count": len(self.streams),
                "alarm_count": len(self.alarms),
            },
        }


# ═══════════════════════════════════════════════════════════════════════════════
# FLASK API ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

def parse_inputs(data: Dict[str, Any]) -> PlantInputs:
    """Parse JSON request body into PlantInputs dataclass."""
    inp = PlantInputs()
    field_map = {
        "ambient_temp_F": "ambient_temp_F",
        "ambient_humidity_gr_lb": "ambient_humidity_gr_lb",
        "barometric_atm": "barometric_atm",
        "filter_dp_inwc": "filter_dp_inwc",
        "compressor_rpm_pct": "compressor_rpm_pct",
        "plant_condition": "plant_condition",
        "sulfur_flow_sp_gpm": "sulfur_flow_sp_gpm",
        "sulfur_temp_F": "sulfur_temp_F",
        "sulfur_pit_level_ft": "sulfur_pit_level_ft",
        "jug_valve_pct": "jug_valve_pct",
        "damper_open_pct": "damper_open_pct",
        "pass1_inlet_temp_C": "pass1_inlet_temp_C",
        "pass2_inlet_temp_C": "pass2_inlet_temp_C",
        "pass3_inlet_temp_C": "pass3_inlet_temp_C",
        "pass4_inlet_temp_C": "pass4_inlet_temp_C",
        "ipat_so3_removal_pct": "ipat_so3_removal_pct",
        "ec3b_ipat_setpt_F": "ec3b_ipat_setpt_F",
        "ec4a_gas_setpt_F": "ec4a_gas_setpt_F",
        "sh1b_out_setpt_F": "sh1b_out_setpt_F",
        "mode": "mode",
        "dynamic_dt_s": "dynamic_dt_s",
        "dynamic_time_s": "dynamic_time_s",
    }
    for json_key, attr_name in field_map.items():
        if json_key in data:
            val = data[json_key]
            current = getattr(inp, attr_name)
            if isinstance(current, float):
                setattr(inp, attr_name, float(val))
            elif isinstance(current, str):
                setattr(inp, attr_name, str(val))
            else:
                setattr(inp, attr_name, val)

    # Derived
    inp.barometric_psia = inp.barometric_atm * 14.696
    return inp


# ═══════════════════════════════════════════════════════════════════════════════
# STANDALONE CLI
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    """CLI entry: reads JSON from stdin, outputs full plant solve to stdout."""
    try:
        raw = sys.stdin.read()
        data = json.loads(raw) if raw.strip() else {}

        inp = parse_inputs(data)
        orchestrator = PlantOrchestrator()
        result = orchestrator.solve(inp)

        print(json.dumps(result, indent=2, default=str))

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
