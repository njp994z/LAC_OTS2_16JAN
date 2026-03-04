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
    converter_bypass_frac: float = 0.0015  # 0.15% gas bypasses catalyst (wall channeling, seal gaps)

    pass1_catalyst: str = "MECS GR-330"
    pass1_liters: float = 80000.0     # Pass 1: largest bed, ~27% of total
    pass1_activity: float = 100.0
    pass2_catalyst: str = "MECS Super Gear XLP-310"
    pass2_liters: float = 75000.0     # Pass 2
    pass2_activity: float = 100.0
    pass3_catalyst: str = "MECS Super Gear XLP-310"
    pass3_liters: float = 70000.0     # Pass 3
    pass3_activity: float = 100.0
    pass4_catalyst: str = "Topsoe VK69"
    pass4_liters: float = 65000.0     # Pass 4: Cs-promoted for low-T finish
    pass4_activity: float = 100.0

    pass1_inlet_temp_C: float = 415.0     # WHB mixed outlet (dynamic)
    pass2_inlet_temp_C: float = 430.0     # SH1B cools Pass 1 outlet → 806°F
    pass3_inlet_temp_C: float = 430.0     # HIP cools Pass 2 outlet → 806°F
    pass4_inlet_temp_C: float = 415.0     # HIP cold outlet (dynamic from duties)

    # CIP hot side outlet temperature
    cip_hot_outlet_F: float = 548.0       # Cools Pass 3 outlet → EC3B inlet

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
    REF_DP_INWC = 240.0
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

        # Furnace outlet P = compressor discharge minus furnace ΔP
        design_flow = inp.design_air_flow_scfm
        Q_ratio_sq = (total / max(design_flow, 1.0)) ** 2
        furnace_dp = 9.0 * Q_ratio_sq
        P_out = air_stream.pressure_inwc - furnace_dp

        s5 = GasStream(
            stream_id=5, tag="GF1", label="Stream 5 — Furnace Outlet",
            SO2=scfm_so2, SO3=scfm_so3, O2=o2_out, N2=air_stream.N2,
            pressure_inwc=P_out, temperature_F=T_out,
        ).recalc_total()

        return s5


class WHBJugValve:
    """Unit Op [5]: Waste Heat Boiler + Jug Valve bypass.

    Fire-tube boiler generating saturated steam at ~900 psig / 540°F.
    Gas cools from ~2080°F to ~705°F through the shell side.
    Jug valve bypasses a fraction at full furnace temp; mixed = converter feed.
    """

    WHB_AREA = 9800.0        # ft² tube area
    WHB_UO = 30.0            # BTU/(hr·ft²·°F) — calibrated 2080→705°F at design
    STEAM_TEMP_F = 540.7     # saturated steam (~900 psig)
    CP_GAS = 0.26            # BTU/(lb·°F) avg furnace gas
    MW_GAS = 30.5            # avg molecular weight
    SCF_PER_LBMOL = 379.0
    WHB_DP = 16.0            # inwc pressure drop
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

        # WHB heat exchange — NTU-effectiveness with MASS-based m_cp
        # Bug fix: old code used m_cp = TOTAL_scfm * 60 * Cp which is volumetric,
        # giving NTU ≈ 0 and almost no cooling. Correct: scfm → lb/hr via MW.
        whb_out_T = s5.temperature_F
        if s6.TOTAL > 0:
            m_dot_lbhr = s6.TOTAL * WHBJugValve.MW_GAS / WHBJugValve.SCF_PER_LBMOL * 60.0
            m_cp = m_dot_lbhr * WHBJugValve.CP_GAS   # BTU/(hr·°F)
            UA = WHBJugValve.WHB_UO * WHBJugValve.WHB_AREA
            ntu = UA / max(m_cp, 1.0)
            eff = 1.0 - math.exp(-ntu)
            whb_out_T = s5.temperature_F - eff * (s5.temperature_F - WHBJugValve.STEAM_TEMP_F)
            whb_out_T = max(WHBJugValve.STEAM_TEMP_F + 10.0, whb_out_T)

        # Stream 8: WHB outlet
        s8a = s6.copy()
        s8a.stream_id = 8
        s8a.tag = "GB1"
        s8a.label = "Stream 8 — WHB Outlet"
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
    """
    Single catalytic converter pass — FULL RK4 SOLVER (inlined from rk_solver.py).

    Integrates dT/dW and dX/dW through the catalyst bed using:
      - Eklund kinetics (V2O5 catalyst, modified Arrhenius)
      - NASA 7-coefficient Cp polynomials
      - Equilibrium bisection (Kp from Eklund thermodynamics)
      - Fogler-style epsilon stoichiometry correction

    Reaction: SO2 + 0.5 O2 → SO3  (delta = -0.5)
    """

    # ── Catalyst database ────────────────────────────────────────────
    CATALYST_DB = {
        "Topsoe VK69": {
            "cesium_promoted": True, "activity_fresh": 3.51,
            "bulk_density_kg_m3": 800.0, "ignition_temp_c": 350.0,
        },
        "MECS Super Gear XLP-310": {
            "cesium_promoted": True, "activity_fresh": 3.35,
            "bulk_density_kg_m3": 815.0, "ignition_temp_c": 390.0,
        },
        "MECS GR-330": {
            "cesium_promoted": False, "activity_fresh": 1.4,
            "bulk_density_kg_m3": 865.0, "ignition_temp_c": 360.0,
        },
    }

    # ── Constants ─────────────────────────────────────────────────────
    DELTA = -0.5                    # stoichiometric mole change
    dHrxn_BTU_lbmol = -42560.0     # ΔH_rxn in BTU/lbmol SO2 (exothermic)
    R_BTU = 1.9858775              # gas constant BTU/(lbmol·°R)
    SCF_PER_LBMOL = 379.0
    KG_TO_LB = 2.20462
    L_TO_M3 = 1.0e-3

    # NASA 7-coefficient polynomial Cp/R = a1 + a2*T + a3*T² + a4*T³ + a5*T⁴
    NASA_COEFFS = {
        "O2":  (3.66096065, 6.56365811e-4, -1.41149627e-7, 2.05797935e-11, -1.29913436e-15),
        "N2":  (2.95257637, 1.39690040e-3, -4.92631603e-7, 7.86010195e-11, -4.60755204e-15),
        "SO2": (5.25449370, 1.97825490e-3, -5.31672630e-7, 5.93886740e-11, -2.37466450e-15),
        "SO3": (7.07573800, 3.17944400e-3, -1.00630500e-6, 1.41851800e-10, -7.31948300e-15),
        "CO2": (4.63659490, 2.74131990e-3, -9.95828530e-7, 1.60373011e-10, -9.16103680e-15),
    }

    # ── Static helper methods (thermodynamics + kinetics) ─────────

    @staticmethod
    def _C_to_K(TC: float) -> float:
        return TC + 273.15

    @staticmethod
    def _C_to_R(TC: float) -> float:
        return (TC + 273.15) * 9.0 / 5.0

    @staticmethod
    def _epsilon(y_so2_0: float) -> float:
        return CatalyticPass.DELTA * y_so2_0

    @staticmethod
    def _y_at_conversion(y0: Dict[str, float], X: float) -> Dict[str, float]:
        """Mole fractions at conversion X using Fogler epsilon correction."""
        ySO2_0 = y0.get("SO2", 0.0)
        yO2_0  = y0.get("O2", 0.0)
        ySO3_0 = y0.get("SO3", 0.0)
        yN2_0  = y0.get("N2", 0.0)
        yCO2_0 = y0.get("CO2", 0.0)

        e = CatalyticPass._epsilon(ySO2_0)
        denom = 1.0 + e * X

        ySO2 = ySO2_0 * (1.0 - X) / denom
        yO2  = (yO2_0 - 0.5 * ySO2_0 * X) / denom
        ySO3 = (ySO3_0 + ySO2_0 * X) / denom
        yN2  = yN2_0 / denom
        yCO2 = yCO2_0 / denom

        yO2  = max(yO2, 0.0)
        ySO2 = max(ySO2, 1e-30)
        ySO3 = max(ySO3, 1e-30)

        s = ySO2 + yO2 + ySO3 + yN2 + yCO2
        return {"SO2": ySO2/s, "O2": yO2/s, "SO3": ySO3/s, "N2": yN2/s, "CO2": yCO2/s}

    @staticmethod
    def _compute_local_composition(y0: Dict[str, float], X: float) -> Dict[str, float]:
        """Local mole fractions at conversion X (for Cp calculation)."""
        ySO2_0 = y0.get("SO2", 0.0)
        ySO3_0 = y0.get("SO3", 0.0)
        yO2_0  = y0.get("O2", 0.0)
        yN2_0  = y0.get("N2", 0.0)
        yCO2_0 = y0.get("CO2", 0.0)

        delta_SO2 = ySO2_0 * X
        ySO2_new = ySO2_0 - delta_SO2
        ySO3_new = ySO3_0 + delta_SO2
        yO2_new  = max(0.0, yO2_0 - 0.5 * delta_SO2)
        total_moles = 1.0 - 0.5 * delta_SO2

        if total_moles <= 0:
            return y0

        return {
            "SO2": ySO2_new / total_moles,
            "SO3": ySO3_new / total_moles,
            "O2":  yO2_new  / total_moles,
            "N2":  yN2_0    / total_moles,
            "CO2": yCO2_0   / total_moles,
        }

    @staticmethod
    def _Kp_eklund(TC: float) -> float:
        """Equilibrium constant Kp (atm^-0.5) from Eklund thermodynamics."""
        TR = CatalyticPass._C_to_R(TC)
        return math.exp(42311.0 / (1.98 * TR) - 11.24)

    @staticmethod
    def _k_eff_arrhenius(TC: float) -> float:
        """Arrhenius rate constant (lbmol SO2 / lb-cat / hr / atm^1.5)."""
        TK = CatalyticPass._C_to_K(TC)
        Ea = 88000.0   # J/mol
        A  = 2.5e6     # pre-exponential (calibrated)
        R  = 8.314     # J/(mol·K)
        return A * math.exp(-Ea / (R * TK))

    @staticmethod
    def _eklund_rate(TC: float, X: float, P_atm: float,
                     y0: Dict[str, float], a_eff: float) -> float:
        """
        SO2 oxidation rate: r = a_eff * k * sqrt(pSO2/pSO3) * [pO2 - (pSO3/(pSO2*Kp))²]
        Returns lbmol SO2 reacted / lb-catalyst / hr
        """
        y = CatalyticPass._y_at_conversion(y0, X)
        pSO2 = max(y["SO2"] * P_atm, 1e-6)
        pSO3_min = 0.001 * P_atm
        pSO3 = max(y["SO3"] * P_atm, pSO3_min)
        pO2  = max(y["O2"]  * P_atm, 1e-6)

        k  = CatalyticPass._k_eff_arrhenius(TC)
        Kp = max(CatalyticPass._Kp_eklund(TC), 1e-30)

        bracket = pO2 - (pSO3 / (pSO2 * Kp)) ** 2
        if bracket <= 0.0:
            return 0.0

        return a_eff * k * math.sqrt(pSO2 / pSO3) * bracket

    @staticmethod
    def _Xeq_at_T(TC: float, P_atm: float, y0: Dict[str, float]) -> float:
        """Equilibrium conversion by bisection on Qp(X) = Kp(T)."""
        Kp = max(CatalyticPass._Kp_eklund(TC), 1e-30)

        def Qp(X: float) -> float:
            y = CatalyticPass._y_at_conversion(y0, X)
            pSO3 = y["SO3"] * P_atm
            pSO2 = max(y["SO2"] * P_atm, 1e-30)
            pO2  = y["O2"]  * P_atm
            if pO2 <= 1e-30:
                return 1e300
            return pSO3 / (pSO2 * math.sqrt(pO2))

        XL, XR = 0.0, 0.999
        fL = Qp(XL) - Kp
        if fL >= 0:
            return 0.0
        fR = Qp(XR) - Kp
        if fR <= 0:
            return XR

        for _ in range(80):
            XM = 0.5 * (XL + XR)
            fM = Qp(XM) - Kp
            if abs(fM) < 1e-8:
                return XM
            if fM < 0:
                XL = XM
            else:
                XR = XM
        return 0.5 * (XL + XR)

    @staticmethod
    def _cp_species(species: str, TK: float) -> float:
        """Species Cp in BTU/(lbmol·°R) from NASA polynomials."""
        coeffs = CatalyticPass.NASA_COEFFS.get(species)
        if coeffs is None:
            return 8.0
        a1, a2, a3, a4, a5 = coeffs
        Cp_over_R = a1 + a2*TK + a3*TK**2 + a4*TK**3 + a5*TK**4
        return Cp_over_R * CatalyticPass.R_BTU

    @staticmethod
    def _cp_mix(TK: float, y: Dict[str, float]) -> float:
        """Mixture Cp in BTU/(lbmol·°R)."""
        cp = 0.0
        for species, mf in y.items():
            if mf > 0:
                cp += mf * CatalyticPass._cp_species(species, TK)
        return cp

    # ── RK4 Integrator ───────────────────────────────────────────────

    @staticmethod
    def _rk4_solve(
        T_in_C: float,
        P_abs_atm: float,
        y0: Dict[str, float],
        F_T0_lbmol_hr: float,
        catalyst_name: str,
        catalyst_liters: float,
        activity_pct: float,
        n_steps: int = 100,
    ) -> Tuple[float, float]:
        """
        RK4 integrate dT/dW and dX/dW through the catalyst bed.

        Returns:
            T_out_C: outlet temperature (°C)
            X_out: fractional conversion at outlet (0-1)
        """
        # Catalyst properties
        cat = CatalyticPass.CATALYST_DB.get(catalyst_name)
        if cat is None:
            # Fallback: try partial match
            for name, props in CatalyticPass.CATALYST_DB.items():
                if catalyst_name in name or name in catalyst_name:
                    cat = props
                    break
            if cat is None:
                cat = CatalyticPass.CATALYST_DB["Topsoe VK69"]  # default

        a_eff = cat["activity_fresh"] * max(activity_pct, 0.0) / 100.0

        # Catalyst weight
        W_total = catalyst_liters * CatalyticPass.L_TO_M3 * cat["bulk_density_kg_m3"] * CatalyticPass.KG_TO_LB
        dW = W_total / n_steps if W_total > 0 else 1.0

        ySO2_0 = y0.get("SO2", 1e-9)
        F_SO2_0 = max(F_T0_lbmol_hr * ySO2_0, 1e-12)

        dHrxn = CatalyticPass.dHrxn_BTU_lbmol

        T = T_in_C
        X = 0.0

        def deriv(TC: float, Xc: float) -> Tuple[float, float]:
            """Returns (dT/dW in °C/lb-cat, dX/dW in 1/lb-cat)"""
            y_local = CatalyticPass._compute_local_composition(y0, Xc)

            Xeq = CatalyticPass._Xeq_at_T(TC, P_abs_atm, y0)
            if Xc >= Xeq:
                r = 0.0
            else:
                r = CatalyticPass._eklund_rate(TC, Xc, P_abs_atm, y0, a_eff)

            dX_dW = r / F_SO2_0

            TK = CatalyticPass._C_to_K(TC)
            Cp_BTU = max(CatalyticPass._cp_mix(TK, y_local), 1e-9)

            # dT/dW in °R/lb-cat, then ×5/9 → °C/lb-cat
            dT_dW_R = (-(dHrxn) * r) / max(F_T0_lbmol_hr * Cp_BTU, 1e-12)
            dT_dW = dT_dW_R * 5.0 / 9.0

            return dT_dW, dX_dW

        # ── RK4 loop ─────────────────────────────────────────────────
        for _ in range(n_steps):
            k1T, k1X = deriv(T, X)
            k2T, k2X = deriv(T + 0.5*dW*k1T, X + 0.5*dW*k1X)
            k3T, k3X = deriv(T + 0.5*dW*k2T, X + 0.5*dW*k2X)
            k4T, k4X = deriv(T + dW*k3T, X + dW*k3X)

            T = T + (dW / 6.0) * (k1T + 2*k2T + 2*k3T + k4T)
            X = X + (dW / 6.0) * (k1X + 2*k2X + 2*k3X + k4X)
            X = max(0.0, min(X, 0.999))

        return T, X

    # ── Main calculate method ────────────────────────────────────────

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
        Full RK4 catalytic pass calculation.

        Converts GasStream (scfm) → mole fractions → RK4 solve → outlet GasStream.
        """
        # ── Convert scfm to mole fractions ───────────────────────────
        total_scfm = max(inlet.TOTAL, 1.0)
        y0 = {
            "SO2": inlet.SO2 / total_scfm,
            "SO3": inlet.SO3 / total_scfm,
            "O2":  inlet.O2  / total_scfm,
            "N2":  inlet.N2  / total_scfm,
            "CO2": inlet.CO2 / total_scfm,
        }

        # Total molar flow: scfm / 379 scf/lbmol × 60 min/hr = lbmol/hr
        F_T0 = total_scfm / CatalyticPass.SCF_PER_LBMOL * 60.0

        # Absolute pressure in atm
        P_inwc = inlet.pressure_inwc
        P_psia = barometric_psia + P_inwc * 0.03613
        P_atm  = P_psia / 14.696

        # ── Solve ────────────────────────────────────────────────────
        T_out_C, X_out = CatalyticPass._rk4_solve(
            T_in_C=inlet_temp_C,
            P_abs_atm=P_atm,
            y0=y0,
            F_T0_lbmol_hr=F_T0,
            catalyst_name=catalyst_name,
            catalyst_liters=catalyst_liters,
            activity_pct=activity_pct,
            n_steps=500,
        )

        # ── Convert outlet composition back to scfm ──────────────────
        y_out = CatalyticPass._y_at_conversion(y0, X_out)

        # Total moles change: n_out/n_in = 1 + ε·X
        eps = CatalyticPass._epsilon(y0["SO2"])
        total_out_scfm = total_scfm * (1.0 + eps * X_out)

        outlet = inlet.copy()
        outlet.stream_id = inlet.stream_id + 1
        outlet.SO2 = y_out["SO2"] * total_out_scfm
        outlet.SO3 = y_out["SO3"] * total_out_scfm
        outlet.O2  = y_out["O2"]  * total_out_scfm
        outlet.N2  = y_out["N2"]  * total_out_scfm
        outlet.CO2 = y_out["CO2"] * total_out_scfm
        outlet.H2O = inlet.H2O  # water unchanged through converter

        outlet.temperature_F = T_out_C * 9.0 / 5.0 + 32.0

        # Pressure drop: ~2-5 inwc per pass
        dp_per_pass = {1: 4.0, 2: 3.5, 3: 3.0, 4: 3.0}
        outlet.pressure_inwc = inlet.pressure_inwc - dp_per_pass.get(pass_number, 3.0)

        outlet.recalc_total()
        return outlet


class InterpassHX:
    """
    Unit Ops: SH1B, HIP, CIP — Interpass Heat Exchangers.

    Correct MECS 3:1 topology:
      HOT SIDE:
        SH1B: Pass 1 outlet (Stm 11) → cooled → Pass 2 inlet (Stm 10)
        HIP:  Pass 2 outlet (Stm 13) → cooled → Pass 3 inlet (Stm 12)
        CIP:  Pass 3 outlet (Stm 14) → cooled → EC3B inlet (Stm 15)
      COLD SIDE (after IPAT, reheat to Pass 4):
        CIP cold: IPAT outlet (Stm 17) → heated → Stm 18
        HIP cold: Stm 18 → heated → Pass 4 inlet (Stm 19)
    """

    CP_AVG = 0.26  # BTU/(lb·°F)
    MW_SPECIES = {"SO2": 64.06, "SO3": 80.06, "O2": 32.0, "N2": 28.01,
                  "H2O": 18.015, "H2SO4": 98.08, "CO2": 44.01}

    @staticmethod
    def _stream_mw(stream: GasStream) -> float:
        """Compute mass-averaged molecular weight from stream composition."""
        total = max(stream.TOTAL, 1.0)
        mw_sum = 0.0
        for species, mw in InterpassHX.MW_SPECIES.items():
            mw_sum += getattr(stream, species, 0.0) * mw
        return mw_sum / total

    @staticmethod
    def cool_stream_with_duty(
        hot_stream: GasStream, target_temp_F: float,
        stream_id: int, tag: str, label: str, dp_inwc: float = 4.0,
    ) -> Tuple[GasStream, float]:
        """Cool a gas stream (hot side) and return the duty in BTU/hr."""
        MW_avg = InterpassHX._stream_mw(hot_stream)
        m_dot_lbhr = hot_stream.TOTAL * MW_avg / 379.0 * 60.0
        delta_T = hot_stream.temperature_F - target_temp_F
        duty_btu_hr = m_dot_lbhr * InterpassHX.CP_AVG * max(delta_T, 0.0)

        cooled = hot_stream.copy()
        cooled.stream_id = stream_id
        cooled.tag = tag
        cooled.label = label
        cooled.temperature_F = target_temp_F
        cooled.pressure_inwc = hot_stream.pressure_inwc - dp_inwc
        cooled.recalc_total()
        return cooled, duty_btu_hr

    @staticmethod
    def heat_stream_with_duty(
        cold_stream: GasStream, duty_btu_hr: float,
        stream_id: int, tag: str, label: str, dp_inwc: float = 3.0,
    ) -> GasStream:
        """Heat a gas stream (cold side) using a known duty."""
        MW_avg = InterpassHX._stream_mw(cold_stream)
        m_dot_lbhr = cold_stream.TOTAL * MW_avg / 379.0 * 60.0
        delta_T = duty_btu_hr / max(m_dot_lbhr * InterpassHX.CP_AVG, 1.0)

        heated = cold_stream.copy()
        heated.stream_id = stream_id
        heated.tag = tag
        heated.label = label
        heated.temperature_F = cold_stream.temperature_F + delta_T
        heated.pressure_inwc = cold_stream.pressure_inwc - dp_inwc
        heated.recalc_total()
        return heated

    @staticmethod
    def cool_stream(
        hot_stream: GasStream, target_temp_F: float,
        stream_id: int, tag: str, label: str, dp_inwc: float = 4.0,
    ) -> GasStream:
        """Legacy wrapper — cool without returning duty."""
        cooled, _ = InterpassHX.cool_stream_with_duty(
            hot_stream, target_temp_F, stream_id, tag, label, dp_inwc
        )
        return cooled


class IPATower:
    """Unit Op [13]: Interpass Absorption Tower — removes SO3.

    Acid outlet temperature rises above inlet based on SO3 duty.
    The acid circulating loop includes an acid cooler that removes most
    of the absorption heat; the acid temp instrument reads the hot acid
    leaving the tower before the cooler.  Design basis: at ~13000 scfm
    SO3 absorbed with 900 gpm acid flow, acid rises ~20°F above inlet.
    """

    DESIGN_SO3_SCFM = 13000.0
    DESIGN_ACID_FLOW_GPM = 900.0
    DESIGN_ACID_DT = 20.0

    @staticmethod
    def calculate(inlet: GasStream, inp: PlantInputs) -> Tuple[GasStream, float]:
        removal_frac = min(inp.ipat_so3_removal_pct / 100.0, 1.0)
        so3_removed = inlet.SO3 * removal_frac

        outlet = inlet.copy()
        outlet.stream_id = 17
        outlet.tag = "GI1"
        outlet.label = "Stream 17 — IPAT Outlet (SO3 Removed)"
        outlet.SO3 = inlet.SO3 - so3_removed
        outlet.pressure_inwc = inlet.pressure_inwc - 23.0
        outlet.temperature_F = 180.0
        outlet.recalc_total()

        so3_ratio = so3_removed / max(IPATower.DESIGN_SO3_SCFM, 1.0)
        flow_ratio = max(inp.ipat_acid_flow_gpm, 1.0) / IPATower.DESIGN_ACID_FLOW_GPM
        acid_dt = IPATower.DESIGN_ACID_DT * so3_ratio / max(flow_ratio, 0.3)
        ipat_acid_out_F = inp.ipat_acid_temp_F + acid_dt

        return outlet, ipat_acid_out_F


class EC3B:
    """Unit Op [12]: Economizer 3B — gas cooling before IPAT.

    Flow-dependent ΔT model matching the SH4A/EC4C/EC4A approach.
    Design basis: gas inlet 548°F, outlet 330°F (ΔT=218°F),
    gas flow ~109k scfm total.  At off-design flows the ΔT scales
    inversely with flow ratio^0.4 (higher flow → less cooling per unit).
    """

    DESIGN_GAS_FLOW_SCFM = 109000.0
    DESIGN_DT = 218.0

    @staticmethod
    def calculate(inlet: GasStream, inp: PlantInputs) -> GasStream:
        flow_ratio = max(inlet.TOTAL, 1.0) / EC3B.DESIGN_GAS_FLOW_SCFM
        eff_factor = max(flow_ratio, 0.3) ** (-0.4)
        dt = EC3B.DESIGN_DT * eff_factor
        T_cold_approach = inp.ec3b_water_temp_F + 20.0
        T_g_out = max(inlet.temperature_F - dt, T_cold_approach)

        cooled = inlet.copy()
        cooled.tag = "GEB1"
        cooled.label = "EC3B Gas Outlet → IPAT Inlet"
        cooled.temperature_F = T_g_out
        cooled.pressure_inwc = inlet.pressure_inwc - 9.0
        cooled.recalc_total()
        return cooled


class SH4A_EC4C_EC4A:
    """Unit Op [15]: Superheater 4A / Economizer 4C / Economizer 4A train.

    Receives Stream 20 (Pass 4 outlet) → SH4A → 21 → EC4C → 22 → EC4A → 23.
    Flow-dependent ΔT model: at design gas flow (~109k scfm), ΔT matches
    reference values.  Higher flow → less cooling (reduced effectiveness).
    """

    DESIGN_GAS_FLOW_SCFM = 109000.0
    DESIGN_DT_SH4A = 170.0
    DESIGN_DT_EC4C = 177.0
    DESIGN_DT_EC4A = 186.0

    @staticmethod
    def calculate(inlet: GasStream, inp: PlantInputs) -> Dict[str, GasStream]:
        flow_ratio = max(inlet.TOTAL, 1.0) / SH4A_EC4C_EC4A.DESIGN_GAS_FLOW_SCFM
        eff_factor = max(flow_ratio, 0.3) ** (-0.4)

        dt_sh4a = SH4A_EC4C_EC4A.DESIGN_DT_SH4A * eff_factor
        dt_ec4c = SH4A_EC4C_EC4A.DESIGN_DT_EC4C * eff_factor
        dt_ec4a = SH4A_EC4C_EC4A.DESIGN_DT_EC4A * eff_factor

        T_steam_approach = inp.sh_steam_temp_F + 20.0
        T_bfw_approach = inp.ec3b_water_temp_F + 20.0

        s21 = inlet.copy()
        s21.stream_id = 21
        s21.tag = "GSA1"
        s21.label = "Stream 21 — SH4A Outlet / EC4C Inlet"
        s21.temperature_F = max(inlet.temperature_F - dt_sh4a, T_steam_approach)
        s21.pressure_inwc = inlet.pressure_inwc - 8.0

        s22 = s21.copy()
        s22.stream_id = 22
        s22.tag = "GEC1"
        s22.label = "Stream 22 — EC4C Outlet / EC4A Inlet"
        s22.temperature_F = max(s21.temperature_F - dt_ec4c, T_bfw_approach)
        s22.pressure_inwc = s21.pressure_inwc - 3.0

        s23 = s22.copy()
        s23.stream_id = 23
        s23.tag = "GEA1"
        s23.label = "Stream 23 — EC4A Outlet / FAT Gas Inlet"
        s23.temperature_F = max(s22.temperature_F - dt_ec4a, T_bfw_approach)
        s23.pressure_inwc = s22.pressure_inwc - 4.0

        for s in (s21, s22, s23):
            s.recalc_total()

        return {"s21": s21, "s22": s22, "s23": s23}


class FATower:
    """Unit Op [16]: Final Absorption Tower.

    Same proportional acid-temp model as IPATower.  FAT sees much less SO3
    (only Pass 4 product ≈ 600-700 scfm at design).  Design acid rise ~8°F.
    """

    DESIGN_SO3_SCFM = 650.0
    DESIGN_ACID_FLOW_GPM = 950.0
    DESIGN_ACID_DT = 8.0

    @staticmethod
    def calculate(inlet: GasStream, inp: PlantInputs) -> Tuple[GasStream, float]:
        efficiency = 0.998
        so3_removed = inlet.SO3 * efficiency

        s24 = inlet.copy()
        s24.stream_id = 24
        s24.tag = "GF1"
        s24.label = "Stream 24 — FAT Outlet (Stack Gas)"
        s24.SO3 = inlet.SO3 - so3_removed
        s24.pressure_inwc = inlet.pressure_inwc - 15.0
        s24.temperature_F = 160.0
        s24.recalc_total()

        so3_ratio = so3_removed / max(FATower.DESIGN_SO3_SCFM, 1.0)
        flow_ratio = max(inp.fat_acid_flow_gpm, 1.0) / FATower.DESIGN_ACID_FLOW_GPM
        acid_dt = FATower.DESIGN_ACID_DT * so3_ratio / max(flow_ratio, 0.3)
        fat_acid_out_F = inp.fat_acid_temp_F + acid_dt

        return s24, fat_acid_out_F


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
# ALARM SETPOINT DATABASE  (from Doc 102-008.00 Rev 0, 9 Jun 2025)
# ═══════════════════════════════════════════════════════════════════════════════
#
# Each entry: tag → { "desc", "units", "LL", "L", "N", "H", "HH", "pid", "remarks" }
# None = not defined or "By Detail" (detail engineer responsibility)
#

ALARM_SETPOINT_DB: Dict[str, Dict[str, Any]] = {
    # ── Analytical / pH / Concentration ────────────────────────────────
    "ADI-0002": {
        "pid": "1530-PR-PID-0000-EXP-5100",
        "desc": "Tail Gas Scrubber Circulating Liquid pH Difference",
        "units": "pH", "LL": None, "L": None, "N": 0.0, "H": 0.5, "HH": None,
    },
    "AI-0002": {
        "pid": "1540-PR-PID-0000-EXP-5100",
        "desc": "Tail Gas Scrubber Circulating Liquid pH",
        "units": "pH", "LL": None, "L": 5.5, "N": 8, "H": 10, "HH": None,
        "remarks": "Detail Engineer to update low and high alarms if needed for effluent disposal.",
    },
    "AI-0241": {
        "pid": "1530-PR-PID-0000-EXP-5102",
        "desc": "SO2 Area Monitor (Tail Gas Scrubber Area)",
        "units": "ppmv SO2", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "AI-0460": {
        "pid": "1530-PR-PID-0000-EXP-5104",
        "desc": "Stack Gas Outlet SO2 (0 - 1000 ppmv)",
        "units": "ppmv SO2", "LL": None, "L": None, "N": 6.8, "H": 6.8, "HH": None,
        "remarks": "Normal < 6.8",
    },
    "AI-0461": {
        "pid": "1530-PR-PID-0000-EXP-5104",
        "desc": "Stack Gas Outlet O2",
        "units": "vol% O2", "LL": None, "L": 3.5, "N": 4.4, "H": None, "HH": None,
    },
    "AI-0465": {
        "pid": "1530-PR-PID-0000-EXP-5104",
        "desc": "Stack Gas Outlet SO2 (0 - 50 ppmv)",
        "units": "ppmv SO2", "LL": None, "L": None, "N": 6.8, "H": 6.8, "HH": None,
        "remarks": "Normal < 6.8",
    },
    "AI-4242": {
        "pid": "1540-PR-PID-0000-EXP-5042",
        "desc": "SO2 Area Monitor (Sulfur Furnace)",
        "units": "ppmv SO2", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "AI-4882": {
        "pid": "1540-PR-PID-0000-EXP-5048",
        "desc": "SO2 Area Monitor (Converter)",
        "units": "ppmv SO2", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "AI-5842": {
        "pid": "1520-PR-PID-0000-EXP-5058",
        "desc": "SO2 Area Monitor (Inlet Air Filter)",
        "units": "ppmv SO2", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "AI-6461": {
        "pid": "1520-PR-PID-0000-EXP-5064",
        "desc": "Product Acid Cooler Cooling Water Return Conductivity",
        "units": "µS/cm", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "AI-6562": {
        "pid": "1520-PR-PID-0000-EXP-5065",
        "desc": "Final Tower Acid Cooler Cooling Water Return Conductivity",
        "units": "µS/cm", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "AI-6641": {
        "pid": "1520-PR-PID-0000-EXP-5066",
        "desc": "SO2 Area Monitor (Final Tower)",
        "units": "ppmv SO2", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "AI-6745": {
        "pid": "1520-PR-PID-0000-EXP-5067",
        "desc": "Boiler Feedwater Preheater Treated Water Outlet Conductivity",
        "units": "µS/cm", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "AI-6746": {
        "pid": "1520-PR-PID-0000-EXP-5067",
        "desc": "Boiler Feedwater Preheater Treated Water Outlet Conductivity",
        "units": "µS/cm", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail (redundant)",
    },
    "AI-6762": {
        "pid": "1520-PR-PID-0000-EXP-5067",
        "desc": "Drying / Interpass Acid Cooler Cooling Water Return Conductivity",
        "units": "µS/cm", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "AI-7241": {
        "pid": "1540-PR-PID-0000-EXP-5072",
        "desc": "SO2 Area Monitor (Economizer / Superheater Area)",
        "units": "ppmv SO2", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "AI-7441": {
        "pid": "1540-PR-PID-0000-EXP-5074",
        "desc": "SO2 Area Monitor (Waste Heat Boiler Area)",
        "units": "ppmv SO2", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "AI-7841": {
        "pid": "1540-PR-PID-0000-EXP-5078",
        "desc": "SO2 Area Monitor (Superheater 1B Area)",
        "units": "ppmv SO2", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },

    # ── Acid Concentration Controllers (alarm setpoints) ──────────────
    "AIC-6060": {
        "pid": "1520-PR-PID-0000-EXP-5060",
        "desc": "Drying Tower / Interpass Tower Acid Concentration",
        "units": "wt.% H2SO4", "LL": 97.5, "L": 98.0, "N": 98.5, "H": 99.0, "HH": None,
    },
    "AIC-6063": {
        "pid": "1520-PR-PID-0000-EXP-5060",
        "desc": "Final Tower Acid Concentration",
        "units": "wt.% H2SO4", "LL": 97.5, "L": 98.0, "N": 98.5, "H": 99.0, "HH": None,
    },
    "AIC-6260": {
        "pid": "1520-PR-PID-0000-EXP-5062",
        "desc": "Dilution Pump Tank Acid Concentration",
        "units": "wt.% H2SO4", "LL": None, "L": 92.7, "N": 93.2, "H": 99.0, "HH": None,
    },

    # ── Density ────────────────────────────────────────────────────────
    "DIC-0006": {
        "pid": "1530-PR-PID-0000-EXP-5100",
        "desc": "Tail Gas Scrubber Circulating Liquid Density",
        "units": "lb/ft3", "LL": None, "L": None, "N": 66.5, "H": 68.5, "HH": None,
    },

    # ── Flow ───────────────────────────────────────────────────────────
    "FI-0003": {
        "pid": "1530-PR-PID-0000-EXP-5100",
        "desc": "Tail Gas Scrubber Reverse Jet Flow",
        "units": "gpm", "LL": 16500, "L": 17500, "N": None, "H": 19500, "HH": 21500,
    },
    "FI-6064": {
        "pid": "1520-PR-PID-0000-EXP-5060",
        "desc": "Drying Tower / Interpass Tower Acid Concentration Analyzer Flowrate",
        "units": "gpm", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "FI-6065": {
        "pid": "1520-PR-PID-0000-EXP-5060",
        "desc": "Final Tower Acid Concentration Analyzer Flowrate",
        "units": "gpm", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "FI-6242": {
        "pid": "1520-PR-PID-0000-EXP-5062",
        "desc": "Dilution Pump Tank Acid Concentration Analyzer Flowrate",
        "units": "gpm", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "FIC-5870": {
        "pid": "1520-PR-PID-0000-EXP-5058",
        "desc": "Drying Tower Acid Inlet Flowrate",
        "units": "gpm", "LL": 2800, "L": 3150, "N": 3500, "H": 4200, "HH": None,
    },
    "FIC-6670": {
        "pid": "1520-PR-PID-0000-EXP-5066",
        "desc": "Final Tower Acid Inlet Flowrate",
        "units": "gpm", "LL": 2400, "L": 2700, "N": 3000, "H": 3300, "HH": None,
    },
    "FIC-6770": {
        "pid": "1520-PR-PID-0000-EXP-5067",
        "desc": "Interpass Tower Acid Inlet Flowrate",
        "units": "gpm", "LL": 4200, "L": 4400, "N": 4800, "H": 5300, "HH": None,
    },

    # ── Level ──────────────────────────────────────────────────────────
    "LI-0014": {
        "pid": "1530-PR-PID-0000-EXP-5100",
        "desc": "Tail Gas Scrubber Sump Level",
        "units": "feet", "LL": None, "L": 24, "N": 25, "H": 26, "HH": 26.5,
        "remarks": "Low-low to be set by Detail Engineer based on pump NPSHr.",
    },
    "LI-5240": {
        "pid": "1540-PR-PID-0000-EXP-5052",
        "desc": "Cold Interpass Vestibule Drain Pot Level",
        "units": "inches", "LL": None, "L": None, "N": 4, "H": 8, "HH": None,
        "remarks": "Normal < 4",
    },
    "LI-5241": {
        "pid": "1540-PR-PID-0000-EXP-5052",
        "desc": "Cold Interpass Inlet Drip Ring Drain Pot Level",
        "units": "inches", "LL": None, "L": None, "N": 4, "H": 8, "HH": None,
        "remarks": "Normal < 4",
    },
    "LI-5871": {
        "pid": "1520-PR-PID-0000-EXP-5058",
        "desc": "Drying Tower Acid Level",
        "units": "inches", "LL": None, "L": None, "N": 20, "H": 27, "HH": None,
        "remarks": "Normal < 20",
    },
    "LI-6093": {
        "pid": "1520-PR-PID-0000-EXP-5060",
        "desc": "Strong Acid Basin Level (Combination Pump Tank Area)",
        "units": "inches", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "LI-6625": {
        "pid": "1520-PR-PID-0000-EXP-5066",
        "desc": "Final Tower Acid Level",
        "units": "inches", "LL": None, "L": None, "N": 18, "H": 25, "HH": None,
        "remarks": "Normal < 18",
    },
    "LI-7240": {
        "pid": "1540-PR-PID-0000-EXP-5072",
        "desc": "Economizer 3B Drain Pot Level",
        "units": "inches", "LL": None, "L": None, "N": 4, "H": 8, "HH": None,
        "remarks": "Normal < 4",
    },
    "LI-7241": {
        "pid": "1540-PR-PID-0000-EXP-5072",
        "desc": "Economizer 4A Drain Pot Level",
        "units": "inches", "LL": None, "L": None, "N": 4, "H": 8, "HH": None,
        "remarks": "Normal < 4",
    },
    "LI-7440": {
        "pid": "1540-PR-PID-0000-EXP-5074",
        "desc": "Waste Heat Boiler Steam Drum Level",
        "units": "inches", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "LI-7441": {
        "pid": "1540-PR-PID-0000-EXP-5074",
        "desc": "Waste Heat Boiler Steam Drum Level",
        "units": "inches", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "LI-7655": {
        "pid": "1540-PR-PID-0000-EXP-5076",
        "desc": "Boiler Blowdown Sump Level",
        "units": "inches", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "LI-8461": {
        "pid": "1520-PR-PID-0000-EXP-5084",
        "desc": "Interpass Tower Acid Level",
        "units": "inches", "LL": None, "L": None, "N": 24, "H": 31, "HH": None,
        "remarks": "Normal < 24",
    },
    "LIC-0013": {
        "pid": "1530-PR-PID-0000-EXP-5100",
        "desc": "Tail Gas Scrubber Sump Level",
        "units": "feet", "LL": None, "L": 24, "N": 25, "H": 26, "HH": 26.5,
        "remarks": "Low-low to be set by Detail Engineer based on pump NPSHr.",
    },
    "LIC-6040": {
        "pid": "1520-PR-PID-0000-EXP-5060",
        "desc": "Combination Pump Tank Level",
        "units": "inches", "LL": 70, "L": 73, "N": 76, "H": 79, "HH": 82,
    },
    "LIC-6240": {
        "pid": "1520-PR-PID-0000-EXP-5062",
        "desc": "Dilution Pump Tank Level",
        "units": "inches", "LL": 26, "L": 32, "N": 38, "H": 44, "HH": 47,
    },
    "LIC-6840": {
        "pid": "1540-PR-PID-0000-EXP-5068",
        "desc": "Deaerator Level",
        "units": "inches", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "LIC-7640": {
        "pid": "1540-PR-PID-0000-EXP-5076",
        "desc": "Pressurized Boiler Blowdown Tank Level",
        "units": "inches", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "LSHH-6841": {
        "pid": "1540-PR-PID-0000-EXP-5068",
        "desc": "Deaerator Level",
        "units": "inches", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "LSLL-6842": {
        "pid": "1540-PR-PID-0000-EXP-5068",
        "desc": "Deaerator Level",
        "units": "inches", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },

    # ── Differential Pressure ──────────────────────────────────────────
    "PDI-0008": {
        "pid": "1530-PR-PID-0000-EXP-5100",
        "desc": "Tail Gas Scrubber Mesh Pad Differential Pressure",
        "units": "in w.c.", "LL": None, "L": None, "N": None, "H": 3.5, "HH": 5,
    },
    "PDI-0009": {
        "pid": "1530-PR-PID-0000-EXP-5100",
        "desc": "Tail Gas Scrubber Chevron Differential Pressure",
        "units": "in w.c.", "LL": None, "L": None, "N": None, "H": 0.5, "HH": 1.5,
    },
    "PDI-4200": {
        "pid": "1540-PR-PID-0000-EXP-5042",
        "desc": "Sulfur Furnace and Waste Heat Boiler Differential Pressure",
        "units": "in w.c.", "LL": 3, "L": 4.5, "N": 24, "H": None, "HH": None,
        "remarks": "Startup Burner Vendor to confirm during commissioning",
    },
    "PDI-5800": {
        "pid": "1520-PR-PID-0000-EXP-5058",
        "desc": "Inlet Air Filter Differential Pressure",
        "units": "in w.c.", "LL": None, "L": None, "N": 2, "H": None, "HH": None,
        "remarks": "HH By Detail",
    },

    # ── Pressure ───────────────────────────────────────────────────────
    "PI-0652": {
        "pid": "1530-PR-PID-0000-EXP-5106",
        "desc": "Oxidation Air Blower Air Outlet Pressure",
        "units": "psig", "LL": None, "L": None, "N": 10, "H": None, "HH": None,
        "remarks": "H and HH By Detail",
    },
    "PI-2604": {
        "pid": "1540-PR-PID-0000-EXP-5026",
        "desc": "Sulfur Furnace Sulfur Header Pressure",
        "units": "psig", "LL": None, "L": 100, "N": 113, "H": 180, "HH": None,
    },
    "PI-4002": {
        "pid": "1540-PR-PID-0000-EXP-5040",
        "desc": "Main Compressor Discharge Pressure",
        "units": "in w.g.", "LL": None, "L": None, "N": 205, "H": None, "HH": None,
        "remarks": "LL, L, H By Detail",
    },
    "PI-5801": {
        "pid": "1520-PR-PID-0000-EXP-5058",
        "desc": "Drying Tower Gas Inlet Duct Pressure",
        "units": "in w.g.", "LL": None, "L": None, "N": None, "H": -4, "HH": -2,
    },
    "PI-5804": {
        "pid": "1520-PR-PID-0000-EXP-5058",
        "desc": "Drying Tower Gas Outlet Duct Pressure",
        "units": "in w.g.", "LL": -25, "L": -15, "N": -12, "H": None, "HH": None,
    },
    "PI-7000": {
        "pid": "1540-PR-PID-0000-EXP-5070",
        "desc": "Boiler Feedwater Pump Discharge Pressure",
        "units": "psig", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "PI-7400": {
        "pid": "1540-PR-PID-0000-EXP-5074",
        "desc": "Waste Heat Boiler Steam Outlet Pressure",
        "units": "psig", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "PI-7401": {
        "pid": "1540-PR-PID-0000-EXP-5074",
        "desc": "Waste Heat Boiler Steam Drum Pressure",
        "units": "psig", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "PIC-0004": {
        "pid": "1530-PR-PID-0000-EXP-5100",
        "desc": "Tail Gas Scrubber Reverse Jet Pressure",
        "units": "psig", "LL": 7, "L": 8, "N": 10, "H": 12, "HH": None,
    },
    "PIC-6801": {
        "pid": "1540-PR-PID-0000-EXP-5068",
        "desc": "Deaerator Pressure",
        "units": "psig", "LL": None, "L": None, "N": 4.9, "H": None, "HH": None,
        "remarks": "LL and H By Detail",
    },
    "PIC-7806": {
        "pid": "1540-PR-PID-0000-EXP-5078",
        "desc": "Superheater 1B Steam Outlet Pressure",
        "units": "psig", "LL": None, "L": None, "N": 870, "H": None, "HH": None,
        "remarks": "L and H By Detail",
    },

    # ── Temperature ────────────────────────────────────────────────────
    "TI-0420": {
        "pid": "1530-PR-PID-0000-EXP-5104",
        "desc": "Tail Gas Scrubber Gas Outlet Temperature",
        "units": "°F", "LL": None, "L": None, "N": 76, "H": 85, "HH": None,
    },
    "TI-0653": {
        "pid": "1530-PR-PID-0000-EXP-5106",
        "desc": "Oxidation Air Blower Air Outlet Temperature",
        "units": "°F", "LL": None, "L": None, "N": None, "H": None, "HH": None,
        "remarks": "By Detail",
    },
    "TI-0654": {
        "pid": "1530-PR-PID-0000-EXP-5106",
        "desc": "Oxidation Air Blower Humidified Air Temperature",
        "units": "°F", "LL": None, "L": None, "N": 120, "H": 130, "HH": 140,
    },
    "TI-4220": {
        "pid": "1540-PR-PID-0000-EXP-5042",
        "desc": "Sulfur Furnace Outlet Temperature",
        "units": "°F", "LL": None, "L": 1900, "N": 2080, "H": 2150, "HH": 2195,
    },
    "TI-4820": {
        "pid": "1540-PR-PID-0000-EXP-5048",
        "desc": "Pass 1 Inlet Duct Gas Temperature",
        "units": "°F", "LL": None, "L": 770, "N": 779, "H": 797, "HH": None,
    },
    "TI-6420": {
        "pid": "1520-PR-PID-0000-EXP-5064",
        "desc": "Product Acid Cooler Acid Outlet Temperature",
        "units": "°F", "LL": None, "L": None, "N": 100, "H": 110, "HH": None,
    },
    "TI-6421": {
        "pid": "1520-PR-PID-0000-EXP-5064",
        "desc": "Product Acid Cooler Acid Inlet Temperature",
        "units": "°F", "LL": None, "L": None, "N": 160, "H": 170, "HH": None,
    },
    "TI-6622": {
        "pid": "1520-PR-PID-0000-EXP-5066",
        "desc": "Final Tower Acid Inlet Temperature",
        "units": "°F", "LL": None, "L": 165, "N": 172, "H": 180, "HH": None,
    },
    "TI-6624": {
        "pid": "1520-PR-PID-0000-EXP-5066",
        "desc": "Final Tower Gas Outlet Temperature",
        "units": "°F", "LL": None, "L": None, "N": 172, "H": 182, "HH": None,
    },
    "TI-6726": {
        "pid": "1520-PR-PID-0000-EXP-5067",
        "desc": "Boiler Feedwater Preheater Treated Water Outlet Temperature (at cooler)",
        "units": "°F", "LL": None, "L": None, "N": 190, "H": 200, "HH": None,
    },
    "TI-6820": {
        "pid": "1540-PR-PID-0000-EXP-5068",
        "desc": "Deaerator Temperature (Trayed Section)",
        "units": "°F", "LL": None, "L": None, "N": 220, "H": None, "HH": None,
        "remarks": "H By Detail",
    },
    "TI-6821": {
        "pid": "1540-PR-PID-0000-EXP-5068",
        "desc": "Deaerator Temperature (Storage Section)",
        "units": "°F", "LL": None, "L": None, "N": 220, "H": None, "HH": None,
        "remarks": "H By Detail",
    },
    "TI-7220": {
        "pid": "1540-PR-PID-0000-EXP-5072",
        "desc": "Economizer 3B Boiler Feedwater Inlet Temperature",
        "units": "°F", "LL": None, "L": None, "N": 275, "H": 295, "HH": None,
    },
    "TI-7223": {
        "pid": "1540-PR-PID-0000-EXP-5072",
        "desc": "Waste Heat Boiler Feedwater Inlet Temperature",
        "units": "°F", "LL": None, "L": None, "N": 465, "H": 535, "HH": None,
    },
    "TI-7821": {
        "pid": "1540-PR-PID-0000-EXP-5078",
        "desc": "Pass 1 Outlet Duct Gas Temperature",
        "units": "°F", "LL": None, "L": None, "N": 1144, "H": 1171, "HH": None,
    },
    "TI-4827": {
        "pid": "1540-PR-PID-0000-EXP-5048",
        "desc": "Pass 1 Catalyst Outlet Temperature A",
        "units": "°F", "LL": None, "L": None, "N": 1144, "H": 1171, "HH": None,
    },
    "TI-4841": {
        "pid": "1540-PR-PID-0000-EXP-5048",
        "desc": "Pass 2 Catalyst Outlet Temperature",
        "units": "°F", "LL": None, "L": None, "N": 900, "H": 920, "HH": None,
    },
    "TI-5231": {
        "pid": "1540-PR-PID-0000-EXP-5052",
        "desc": "Pass 3 Duct Outlet Temperature",
        "units": "°F", "LL": None, "L": None, "N": 880, "H": 900, "HH": None,
    },
    "TI-7225": {
        "pid": "1540-PR-PID-0000-EXP-5072",
        "desc": "Pass 4 Catalyst Outlet Temperature",
        "units": "°F", "LL": None, "L": None, "N": 810, "H": 830, "HH": None,
    },
    "TI-8421": {
        "pid": "1520-PR-PID-0000-EXP-5084",
        "desc": "Interpass Tower Gas Outlet Temperature",
        "units": "°F", "LL": None, "L": None, "N": 180, "H": 200, "HH": None,
    },

    # ── Temperature Controllers (alarm setpoints) ─────────────────────
    "TIC-4822": {
        "pid": "1540-PR-PID-0000-EXP-5048",
        "desc": "Pass 2 Inlet Duct Gas Temperature",
        "units": "°F", "LL": None, "L": 797, "N": 806, "H": 824, "HH": None,
    },
    "TIC-5220": {
        "pid": "1540-PR-PID-0000-EXP-5052",
        "desc": "Pass 3 Inlet Duct Gas Temperature",
        "units": "°F", "LL": None, "L": 797, "N": 806, "H": 824, "HH": None,
    },
    "TIC-5224": {
        "pid": "1540-PR-PID-0000-EXP-5052",
        "desc": "Pass 4 Inlet Duct Gas Temperature",
        "units": "°F", "LL": None, "L": 770, "N": 779, "H": 797, "HH": None,
    },
    "TIC-5823": {
        "pid": "1520-PR-PID-0000-EXP-5058",
        "desc": "Drying Tower Acid Inlet Temperature",
        "units": "°F", "LL": None, "L": 100, "N": 150, "H": 160, "HH": None,
    },
    "TIC-6622": {
        "pid": "1520-PR-PID-0000-EXP-5066",
        "desc": "Final Tower Acid Inlet Temperature",
        "units": "°F", "LL": None, "L": 165, "N": 172, "H": 180, "HH": None,
    },
    "TIC-6722": {
        "pid": "1520-PR-PID-0000-EXP-5067",
        "desc": "Interpass Tower Acid Inlet Temperature",
        "units": "°F", "LL": None, "L": 165, "N": 180, "H": 190, "HH": None,
    },
    "TIC-6731": {
        "pid": "1520-PR-PID-0000-EXP-5067",
        "desc": "Boiler Feedwater Preheater Treated Water Outlet Temperature (after bypass)",
        "units": "°F", "LL": None, "L": None, "N": 190, "H": 200, "HH": 220,
    },
    "TIC-7221": {
        "pid": "1540-PR-PID-0000-EXP-5072",
        "desc": "Final Tower Gas Inlet Temperature",
        "units": "°F", "LL": None, "L": 265, "N": 275, "H": 315, "HH": None,
    },
    "TIC-7224": {
        "pid": "1540-PR-PID-0000-EXP-5072",
        "desc": "Interpass Tower Gas Inlet Temperature",
        "units": "°F", "LL": None, "L": 320, "N": 330, "H": 370, "HH": None,
    },
    "TIC-7810": {
        "pid": "1540-PR-PID-0000-EXP-5078",
        "desc": "Superheater 1B Steam Outlet Temperature",
        "units": "°F", "LL": None, "L": None, "N": 900, "H": None, "HH": None,
        "remarks": "L and H By Detail",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# CONTROLLER SETPOINT DATABASE  (from Doc 102-008.00 Rev 0, Pages 3-5)
# ═══════════════════════════════════════════════════════════════════════════════
#
# Each entry: tag → { "desc", "units", "normal_setpoint", "pid", "remarks" }
#

CONTROLLER_SETPOINT_DB: Dict[str, Dict[str, Any]] = {
    "AIC-0002": {
        "pid": "1530-PR-PID-0000-EXP-5100",
        "desc": "Tail Gas Scrubber Circulating Liquid pH",
        "units": "", "normal_setpoint": 8,
    },
    "AIC-6060": {
        "pid": "1520-PR-PID-0000-EXP-5060",
        "desc": "Drying Tower / Interpass Tower Acid Concentration",
        "units": "wt.% H2SO4", "normal_setpoint": 98.5,
    },
    "AIC-6063": {
        "pid": "1520-PR-PID-0000-EXP-5060",
        "desc": "Final Tower Acid Concentration",
        "units": "wt.% H2SO4", "normal_setpoint": 98.5,
    },
    "AIC-6260": {
        "pid": "1520-PR-PID-0000-EXP-5062",
        "desc": "Dilution Pump Tank Acid Concentration",
        "units": "wt.% H2SO4", "normal_setpoint": 93.2,
        "remarks": "Dilution system isolated when 98.5% is produced.",
    },
    "DIC-0006": {
        "pid": "1530-PR-PID-0000-EXP-5100",
        "desc": "Tail Gas Scrubber Circulating Liquid Density",
        "units": "lb/ft3", "normal_setpoint": 66.5,
    },
    "FIC-2602": {
        "pid": "1540-PR-PID-0000-EXP-5026",
        "desc": "Sulfur Furnace Sulfur Flowrate",
        "units": "lb/h", "normal_setpoint": None,
        "remarks": "Operator Adjusted. Set by Operator to establish plant production rate.",
    },
    "FIC-5870": {
        "pid": "1520-PR-PID-0000-EXP-5058",
        "desc": "Drying Tower Acid Inlet Flowrate",
        "units": "gpm", "normal_setpoint": 3500,
    },
    "FIC-6670": {
        "pid": "1520-PR-PID-0000-EXP-5066",
        "desc": "Final Tower Acid Inlet Flowrate",
        "units": "gpm", "normal_setpoint": 3000,
    },
    "FIC-6770": {
        "pid": "1520-PR-PID-0000-EXP-5067",
        "desc": "Interpass Tower Acid Inlet Flowrate",
        "units": "gpm", "normal_setpoint": 4800,
    },
    "FIC-7070": {
        "pid": "1540-PR-PID-0000-EXP-5070",
        "desc": "Boiler Feedwater Flowrate",
        "units": "gpm", "normal_setpoint": None,
        "remarks": "Remote Setpoint",
    },
    "HIC-1073": {
        "pid": "1540-PR-PID-0000-EXP-5040",
        "desc": "Main Compressor Rotor Speed (Variable Frequency Drive)",
        "units": "rpm", "normal_setpoint": None,
        "remarks": "Operator Adjusted",
    },
    "HIC-4030": {
        "pid": "1540-PR-PID-0000-EXP-5040",
        "desc": "Main Compressor Inlet Guide Vane Position",
        "units": "% Open", "normal_setpoint": None,
        "remarks": "Operator Adjusted",
    },
    "HIC-4081": {
        "pid": "1540-PR-PID-0000-EXP-5040",
        "desc": "Main Compressor Brick Cure Blow-off Valve",
        "units": "% Open", "normal_setpoint": None,
        "remarks": "Operator Adjusted. Valve positioned manually to satisfy Main Compressor flow and Sulfur Furnace temperature requirements during Brick Cure.",
    },
    "HIC-4281": {
        "pid": "1540-PR-PID-0000-EXP-5042",
        "desc": "Waste Heat Boiler Outlet Main Line Valve Position",
        "units": "% Open", "normal_setpoint": 100,
    },
    "HIC-4282": {
        "pid": "1540-PR-PID-0000-EXP-5042",
        "desc": "Waste Heat Boiler Gas Bypass Jug Valve Position",
        "units": "% Open", "normal_setpoint": None,
        "remarks": "Operator Adjusted. Adjusted to maintain Pass 1 inlet temperature.",
    },
    "LIC-0013": {
        "pid": "1530-PR-PID-0000-EXP-5100",
        "desc": "Tail Gas Scrubber Sump Level",
        "units": "feet", "normal_setpoint": 25,
    },
    "LIC-6040": {
        "pid": "1520-PR-PID-0000-EXP-5060",
        "desc": "Combination Pump Tank Level",
        "units": "inches", "normal_setpoint": 76,
    },
    "LIC-6240": {
        "pid": "1520-PR-PID-0000-EXP-5062",
        "desc": "Dilution Pump Tank Level",
        "units": "inches", "normal_setpoint": 38,
    },
    "LIC-6840": {
        "pid": "1540-PR-PID-0000-EXP-5068",
        "desc": "Deaerator Level",
        "units": "inches", "normal_setpoint": None,
        "remarks": "By Detail",
    },
    "LIC-7440": {
        "pid": "1540-PR-PID-0000-EXP-5074",
        "desc": "Waste Heat Boiler Steam Drum Level",
        "units": "inches", "normal_setpoint": None,
        "remarks": "By Detail",
    },
    "LIC-7640": {
        "pid": "1540-PR-PID-0000-EXP-5076",
        "desc": "Pressurized Boiler Blowdown Tank Level",
        "units": "inches", "normal_setpoint": None,
        "remarks": "By Detail",
    },
    "PIC-0004": {
        "pid": "1530-PR-PID-0000-EXP-5100",
        "desc": "Tail Gas Scrubber Reverse Jet Pressure",
        "units": "psig", "normal_setpoint": 10,
    },
    "PIC-6801": {
        "pid": "1540-PR-PID-0000-EXP-5068",
        "desc": "Deaerator Pressure",
        "units": "psig", "normal_setpoint": 4.9,
    },
    "PIC-7806": {
        "pid": "1540-PR-PID-0000-EXP-5078",
        "desc": "Superheater 1B Steam Outlet Pressure",
        "units": "psig", "normal_setpoint": 870,
    },
    "TIC-4220": {
        "pid": "1540-PR-PID-0000-EXP-5042",
        "desc": "Sulfur Furnace Outlet Temperature (Start-up Burner Online)",
        "units": "°F", "normal_setpoint": None,
        "remarks": "Variable. Start-up Only, Defined by Brick Cure or Heat-up Schedule.",
    },
    "TIC-4822": {
        "pid": "1540-PR-PID-0000-EXP-5048",
        "desc": "Pass 2 Inlet Duct Gas Temperature",
        "units": "°F", "normal_setpoint": 806,
    },
    "TIC-5220": {
        "pid": "1540-PR-PID-0000-EXP-5052",
        "desc": "Pass 3 Inlet Duct Gas Temperature",
        "units": "°F", "normal_setpoint": 806,
    },
    "TIC-5224": {
        "pid": "1540-PR-PID-0000-EXP-5052",
        "desc": "Pass 4 Inlet Duct Gas Temperature",
        "units": "°F", "normal_setpoint": 779,
    },
    "TIC-5823": {
        "pid": "1520-PR-PID-0000-EXP-5058",
        "desc": "Drying Tower Acid Inlet Temperature",
        "units": "°F", "normal_setpoint": 150,
    },
    "TIC-6622": {
        "pid": "1520-PR-PID-0000-EXP-5066",
        "desc": "Final Tower Acid Inlet Temperature",
        "units": "°F", "normal_setpoint": 172,
    },
    "TIC-6722": {
        "pid": "1520-PR-PID-0000-EXP-5067",
        "desc": "Interpass Tower Acid Inlet Temperature",
        "units": "°F", "normal_setpoint": 180,
    },
    "TIC-6731": {
        "pid": "1520-PR-PID-0000-EXP-5067",
        "desc": "Boiler Feedwater Preheater Treated Water Outlet Temperature",
        "units": "°F", "normal_setpoint": 190,
    },
    "TIC-7221": {
        "pid": "1540-PR-PID-0000-EXP-5072",
        "desc": "Final Tower Gas Inlet Temperature",
        "units": "°F", "normal_setpoint": 275,
    },
    "TIC-7224": {
        "pid": "1540-PR-PID-0000-EXP-5072",
        "desc": "Interpass Tower Gas Inlet Temperature",
        "units": "°F", "normal_setpoint": 330,
    },
    "TIC-7810": {
        "pid": "1540-PR-PID-0000-EXP-5078",
        "desc": "Superheater 1B Steam Outlet Temperature",
        "units": "°F", "normal_setpoint": 900,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# ALARM CHECKS  (expanded from Doc 102-008.00 alarm setpoint database)
# ═══════════════════════════════════════════════════════════════════════════════

def _check_limit(
    alarms: List[Alarm],
    tag: str,
    value: float,
    alarm_entry: Dict[str, Any],
    now: float,
) -> None:
    """
    Generic helper — checks a process value against LL/L/H/HH limits
    from the ALARM_SETPOINT_DB and appends any active alarms.
    """
    desc = alarm_entry["desc"]
    units = alarm_entry["units"]

    hh = alarm_entry.get("HH")
    h  = alarm_entry.get("H")
    l  = alarm_entry.get("L")
    ll = alarm_entry.get("LL")

    if hh is not None and value >= hh:
        alarms.append(Alarm(
            tag=tag, message=f"{desc} HIGH-HIGH ({value:.1f} >= {hh} {units})",
            priority=AlarmPriority.CRITICAL, value=value, limit=hh, unit=units, timestamp=now,
        ))
    elif h is not None and value >= h:
        alarms.append(Alarm(
            tag=tag, message=f"{desc} HIGH ({value:.1f} >= {h} {units})",
            priority=AlarmPriority.HIGH, value=value, limit=h, unit=units, timestamp=now,
        ))

    if ll is not None and value <= ll:
        alarms.append(Alarm(
            tag=tag, message=f"{desc} LOW-LOW ({value:.1f} <= {ll} {units})",
            priority=AlarmPriority.CRITICAL, value=value, limit=ll, unit=units, timestamp=now,
        ))
    elif l is not None and value <= l:
        alarms.append(Alarm(
            tag=tag, message=f"{desc} LOW ({value:.1f} <= {l} {units})",
            priority=AlarmPriority.MEDIUM, value=value, limit=l, unit=units, timestamp=now,
        ))


def check_alarms(streams: Dict[int, GasStream], inp: PlantInputs, **kwargs) -> List[Alarm]:
    """
    Check all alarm conditions from Doc 102-008.00 alarm setpoint list
    against computed process values and return active alarms.
    """
    alarms: List[Alarm] = []
    now = time.time()

    s = streams  # shorthand
    s4  = s.get(4,  GasStream())
    s5  = s.get(5,  GasStream())
    s10 = s.get(10, GasStream())
    s11 = s.get(11, GasStream())
    s12 = s.get(12, GasStream())
    s14 = s.get(14, GasStream())
    s16 = s.get(16, GasStream())
    s17 = s.get(17, GasStream())
    s18 = s.get(18, GasStream())
    s19 = s.get(19, GasStream())
    s23 = s.get(23, GasStream())
    s24 = s.get(24, GasStream())

    # ── Temperature alarms ────────────────────────────────────────────

    # TI-4220 A/B/C  Sulfur Furnace Outlet Temperature
    _check_limit(alarms, "TI-4220", s5.temperature_F,
                 ALARM_SETPOINT_DB["TI-4220"], now)

    # TI-4820  Pass 1 Inlet Duct Gas Temperature
    # Uses Stream 9 (WHB mixed outlet) — the dynamically computed gas temperature
    # entering the converter inlet duct, responsive to sulfur flow, jug valve, RPM.
    s9 = s.get(9, GasStream())
    _check_limit(alarms, "TI-4820", s9.temperature_F,
                 ALARM_SETPOINT_DB["TI-4820"], now)

    # TI-7821  Pass 1 Outlet Duct Gas Temperature
    _check_limit(alarms, "TI-7821", s11.temperature_F,
                 ALARM_SETPOINT_DB["TI-7821"], now)

    # TIC-4822  Pass 2 Inlet — Stream 10 (SH1B outlet)
    _check_limit(alarms, "TIC-4822", s10.temperature_F,
                 ALARM_SETPOINT_DB["TIC-4822"], now)

    # TIC-5220  Pass 3 Inlet — Stream 12 (HIP hot outlet)
    _check_limit(alarms, "TIC-5220", s12.temperature_F,
                 ALARM_SETPOINT_DB["TIC-5220"], now)

    # TIC-5224  Pass 4 Inlet — Stream 19 (HIP cold outlet)
    _check_limit(alarms, "TIC-5224", s19.temperature_F,
                 ALARM_SETPOINT_DB["TIC-5224"], now)

    # TIC-5823  Drying Tower Acid Inlet Temperature
    _check_limit(alarms, "TIC-5823", inp.dt_acid_inlet_temp_F,
                 ALARM_SETPOINT_DB["TIC-5823"], now)

    # TIC-6722  Interpass Tower Acid Outlet Temperature
    _check_limit(alarms, "TIC-6722", kwargs.get("ipat_acid_out_F", inp.ipat_acid_temp_F),
                 ALARM_SETPOINT_DB["TIC-6722"], now)

    # TIC-7221  Final Tower Gas Inlet Temperature (EC4A outlet → FAT inlet)
    _check_limit(alarms, "TIC-7221", s23.temperature_F,
                 ALARM_SETPOINT_DB["TIC-7221"], now)

    # TIC-7224  Interpass Tower Gas Inlet Temperature (EC3B outlet)
    _check_limit(alarms, "TIC-7224", s16.temperature_F,
                 ALARM_SETPOINT_DB["TIC-7224"], now)

    # TI-8421  Interpass Tower Gas Outlet Temperature
    _check_limit(alarms, "TI-8421", s17.temperature_F,
                 ALARM_SETPOINT_DB["TI-8421"], now)

    # ── Pressure alarms ───────────────────────────────────────────────

    # PDI-4200  Sulfur Furnace and WHB Differential Pressure
    # Approximate: furnace outlet P - WHB outlet P
    s8a = s.get(8, GasStream())
    whb_dp = s5.pressure_inwc - s8a.pressure_inwc if s8a.TOTAL > 0 else 0.0
    _check_limit(alarms, "PDI-4200", whb_dp,
                 ALARM_SETPOINT_DB["PDI-4200"], now)

    # PI-5804  Drying Tower Gas Outlet Duct Pressure (= compressor suction)
    s3 = s.get(3, GasStream())
    _check_limit(alarms, "PI-5804", s3.pressure_inwc,
                 ALARM_SETPOINT_DB["PI-5804"], now)

    # PI-4002  Main Compressor Discharge Pressure
    _check_limit(alarms, "PI-4002", s4.pressure_inwc,
                 ALARM_SETPOINT_DB["PI-4002"], now)

    # ── Stack Gas SO2 ─────────────────────────────────────────────────

    # AI-0460 / AI-0465  Stack Gas Outlet SO2
    so2_ppm = (s24.SO2 / max(s24.TOTAL, 1e-9)) * 1e6
    _check_limit(alarms, "AI-0460", so2_ppm,
                 ALARM_SETPOINT_DB["AI-0460"], now)

    # AI-0461  Stack Gas Outlet O2
    o2_vol_pct = (s24.O2 / max(s24.TOTAL, 1e-9)) * 100.0
    _check_limit(alarms, "AI-0461", o2_vol_pct,
                 ALARM_SETPOINT_DB["AI-0461"], now)

    # ── Flow alarms (acid circuits — check against controller setpoints) ──

    # FIC-5870  Drying Tower Acid Inlet Flowrate
    _check_limit(alarms, "FIC-5870", inp.dt_acid_flow_gpm,
                 ALARM_SETPOINT_DB["FIC-5870"], now)

    # FIC-6770  Interpass Tower Acid Inlet Flowrate
    _check_limit(alarms, "FIC-6770", inp.ipat_acid_flow_gpm,
                 ALARM_SETPOINT_DB["FIC-6770"], now)

    # FIC-6670  Final Tower Acid Inlet Flowrate
    _check_limit(alarms, "FIC-6670", inp.fat_acid_flow_gpm,
                 ALARM_SETPOINT_DB["FIC-6670"], now)

    # ── Acid concentration alarms ─────────────────────────────────────

    # AIC-6060  Drying / Interpass Tower Acid Concentration
    dt_acid_pct = inp.dt_acid_strength * 100.0
    _check_limit(alarms, "AIC-6060", dt_acid_pct,
                 ALARM_SETPOINT_DB["AIC-6060"], now)

    # AIC-6063  Final Tower Acid Concentration
    fat_acid_pct = inp.fat_acid_strength * 100.0
    _check_limit(alarms, "AIC-6063", fat_acid_pct,
                 ALARM_SETPOINT_DB["AIC-6063"], now)

    # ── Compressor surge (supplemental — not in MECS doc) ─────────────
    if s4.TOTAL < 80000:
        alarms.append(Alarm("PI-4002-SURGE", "Main compressor flow LOW — surge risk",
                            AlarmPriority.CRITICAL, s4.TOTAL, 80000, "scfm", now))

    return alarms


# ═══════════════════════════════════════════════════════════════════════════════
# SENSOR TAG MAPPING
# ═══════════════════════════════════════════════════════════════════════════════

def build_sensor_tags(
    streams: Dict[int, GasStream],
    inp: PlantInputs,
    kpp: Dict[str, Any],
    ipat_acid_out_F: float = 180.0,
    fat_acid_out_F: float = 180.0,
) -> Dict[str, Any]:
    """
    Build a flat dict keyed by instrument tag number.
    The React frontend reads these directly: sensorTags["1540-TI-4010"]

    Each tag now returns either a scalar value (backward-compatible) or,
    for tags with alarm setpoints, a dict:
      { "value": <float>, "LL": <float|None>, "L": <float|None>,
        "N": <float|None>, "H": <float|None>, "HH": <float|None>,
        "units": <str>, "desc": <str> }
    """
    tags: Dict[str, Any] = {}

    s = streams  # shorthand

    # ── Helper: build a rich tag entry with alarm limits ──────────────
    def _tag_with_alarms(value: float, alarm_tag: Optional[str] = None) -> Any:
        """If the alarm_tag exists in the DB, return a dict with limits; else scalar."""
        if alarm_tag and alarm_tag in ALARM_SETPOINT_DB:
            entry = ALARM_SETPOINT_DB[alarm_tag]
            return {
                "value": round(value, 2),
                "LL": entry.get("LL"),
                "L": entry.get("L"),
                "N": entry.get("N"),
                "H": entry.get("H"),
                "HH": entry.get("HH"),
                "units": entry.get("units", ""),
                "desc": entry.get("desc", ""),
            }
        return round(value, 2)

    # --- Ambient / Filter ---
    tags["1540-TI-5800"] = s.get(1, GasStream()).temperature_F      # Ambient temp
    tags["1540-PI-5801"] = _tag_with_alarms(
        s.get(2, GasStream()).pressure_inwc, "PI-5801")              # Filter outlet pressure
    tags["1540-PDI-5800"] = _tag_with_alarms(
        inp.filter_dp_inwc, "PDI-5800")                              # Filter dP
    tags["1540-PDI-5801"] = inp.filter_dp_inwc                       # Filter dP (legacy)

    # --- Main Compressor ---
    tags["1540-SIC-4030"] = inp.compressor_rpm_pct                   # Compressor speed %
    tags["1540-TI-4031"] = s.get(4, GasStream()).temperature_F       # Compressor outlet T
    tags["1540-PI-4002"] = _tag_with_alarms(
        s.get(4, GasStream()).pressure_inwc, "PI-4002")              # Compressor discharge P
    tags["1540-PI-4031"] = s.get(4, GasStream()).pressure_inwc       # Compressor outlet P (legacy)
    tags["1540-FI-4030"] = s.get(4, GasStream()).TOTAL               # Compressor flow

    # --- Sulfur System ---
    tags["1530-FIC-2602"] = inp.sulfur_flow_sp_gpm                   # Sulfur flow SP
    tags["1530-TI-2601"] = inp.sulfur_temp_F                         # Sulfur temperature
    tags["1530-LI-2600"] = inp.sulfur_pit_level_ft                   # Sulfur pit level
    tags["1540-PI-2604"] = _tag_with_alarms(
        inp.sulfur_flow_sp_gpm * 1.43, "PI-2604")                   # Sulfur header pressure (approx)

    # --- Furnace ---
    tags["1540-TI-4220"] = _tag_with_alarms(
        s.get(5, GasStream()).temperature_F, "TI-4220")              # Furnace outlet T
    tags["1540-TI-4010"] = s.get(5, GasStream()).temperature_F       # Furnace outlet T (legacy)
    tags["1540-PI-4010"] = s.get(5, GasStream()).pressure_inwc       # Furnace outlet P

    # --- WHB / Jug Valve ---
    tags["1540-ZI-4020"] = inp.jug_valve_pct                         # Jug valve position
    tags["1540-TI-4021"] = s.get(9, GasStream()).temperature_F       # WHB mixed outlet T
    s8a = s.get(8, GasStream())
    whb_dp = s.get(5, GasStream()).pressure_inwc - s8a.pressure_inwc if s8a.TOTAL > 0 else 0.0
    tags["1540-PDI-4200"] = _tag_with_alarms(whb_dp, "PDI-4200")    # Furnace+WHB dP

    # --- Stack Gas Analytical ---
    so2_ppm = (s.get(24, GasStream()).SO2 / max(s.get(24, GasStream()).TOTAL, 1e-9)) * 1e6
    o2_vol_pct = (s.get(24, GasStream()).O2 / max(s.get(24, GasStream()).TOTAL, 1e-9)) * 100.0
    tags["1530-AI-0460"] = _tag_with_alarms(so2_ppm, "AI-0460")     # Stack SO2 (0-1000 ppmv)
    tags["1530-AI-0465"] = _tag_with_alarms(so2_ppm, "AI-0465")     # Stack SO2 (0-50 ppmv)
    tags["1530-AI-0461"] = _tag_with_alarms(o2_vol_pct, "AI-0461")  # Stack O2
    tags["1540-AI-4010"] = kpp.get("SO2_ppm_stack", 0)              # Stack SO2 (legacy)

    # --- Pass 1 Inlet SO2 Strength (converter feed) ---
    s9_data = s.get(9, GasStream())
    tags["1540-AI-4825"] = round(
        (s9_data.SO2 / max(s9_data.TOTAL, 1e-9)) * 100.0, 2)

    # --- Converter Pass Temperatures (with alarm limits) ---
    # Pass 1 inlet — Stream 9 (WHB mixed outlet, dynamic)
    tags["1540-TI-4820"] = _tag_with_alarms(
        s.get(9, GasStream()).temperature_F, "TI-4820")
    # Pass 1 outlet — Stream 11 (hot, before SH1B)
    tags["1540-TI-7821"] = _tag_with_alarms(
        s.get(11, GasStream()).temperature_F, "TI-7821")
    # Pass 2 inlet — Stream 10 (SH1B outlet)
    tags["1540-TIC-4822"] = _tag_with_alarms(
        s.get(10, GasStream()).temperature_F, "TIC-4822")
    # Pass 3 inlet — Stream 12 (HIP hot outlet)
    tags["1540-TIC-5220"] = _tag_with_alarms(
        s.get(12, GasStream()).temperature_F, "TIC-5220")
    # Pass 4 inlet — Stream 19 (HIP cold outlet)
    tags["1540-TIC-5224"] = _tag_with_alarms(
        s.get(19, GasStream()).temperature_F, "TIC-5224")

    # Pass outlet temperatures (catalyst out)
    tags["1540-TI-4827"] = _tag_with_alarms(
        s.get(11, GasStream()).temperature_F, "TI-4827")            # Pass 1 catalyst out A
    tags["1540-TI-4841"] = _tag_with_alarms(
        s.get(13, GasStream()).temperature_F, "TI-4841")            # Pass 2 catalyst out
    tags["1540-TI-5231"] = _tag_with_alarms(
        s.get(14, GasStream()).temperature_F, "TI-5231")            # Pass 3 duct outlet
    tags["1540-TI-7225"] = _tag_with_alarms(
        s.get(20, GasStream()).temperature_F, "TI-7225")            # Pass 4 catalyst out

    # Legacy pass tags (backward compatibility)
    pass_inlet  = {1: 9, 2: 10, 3: 12, 4: 19}
    pass_outlet = {1: 11, 2: 13, 3: 14, 4: 20}
    for p_num in range(1, 5):
        tags[f"1540-TI-41{p_num}0"] = s.get(pass_inlet[p_num], GasStream()).temperature_F
        tags[f"1540-TI-41{p_num}1"] = s.get(pass_outlet[p_num], GasStream()).temperature_F

    # --- Drying Tower Acid ---
    tags["1520-TIC-5823"] = _tag_with_alarms(
        inp.dt_acid_inlet_temp_F, "TIC-5823")                       # DT acid inlet T
    tags["1520-FIC-5870"] = _tag_with_alarms(
        inp.dt_acid_flow_gpm, "FIC-5870")                           # DT acid flow
    tags["1520-AIC-6060"] = _tag_with_alarms(
        inp.dt_acid_strength * 100.0, "AIC-6060")                   # DT acid concentration

    # --- Interpass Tower Acid ---
    tags["1520-TIC-6722"] = _tag_with_alarms(
        ipat_acid_out_F, "TIC-6722")                                # IPAT acid outlet T
    tags["1520-FIC-6770"] = _tag_with_alarms(
        inp.ipat_acid_flow_gpm, "FIC-6770")                         # IPAT acid flow

    # --- Final Tower Acid ---
    tags["1520-TIC-6622"] = _tag_with_alarms(
        fat_acid_out_F, "TIC-6622")                                 # FAT acid outlet T  (TI-6622)
    tags["1520-FIC-6670"] = _tag_with_alarms(
        inp.fat_acid_flow_gpm, "FIC-6670")                          # FAT acid flow
    tags["1520-AIC-6063"] = _tag_with_alarms(
        inp.fat_acid_strength * 100.0, "AIC-6063")                  # FAT acid concentration

    # --- EC3B / IPAT Gas ---
    tags["1540-TIC-7224"] = _tag_with_alarms(
        s.get(16, GasStream()).temperature_F, "TIC-7224")            # EC3B outlet / IPAT gas inlet T
    tags["1540-TI-8421"] = _tag_with_alarms(
        s.get(17, GasStream()).temperature_F, "TI-8421")             # IPAT gas outlet T

    # --- IPAT ---
    tags["1540-TI-4200"] = s.get(16, GasStream()).temperature_F      # IPAT gas inlet T (legacy)
    tags["1540-TI-4201"] = s.get(17, GasStream()).temperature_F      # IPAT gas outlet T (legacy)

    # --- SH4A / EC4C / EC4A ---
    tags["1540-TI-4300"] = s.get(20, GasStream()).temperature_F      # Pass 4 outlet = SH4A gas inlet
    tags["1540-TIC-7221"] = _tag_with_alarms(
        s.get(23, GasStream()).temperature_F, "TIC-7221")            # EC4A gas outlet = FAT gas inlet T
    tags["1540-TI-4301"] = s.get(23, GasStream()).temperature_F      # EC4A gas outlet T (legacy)

    # --- Superheater 1B Steam ---
    tags["1540-TIC-7810"] = _tag_with_alarms(
        inp.sh1b_out_setpt_F, "TIC-7810")                           # SH1B steam outlet T
    tags["1540-PIC-7806"] = _tag_with_alarms(
        inp.sh_steam_press_psig, "PIC-7806")                        # SH1B steam outlet P

    # --- Compressor Suction ---
    tags["1520-PI-5804"] = _tag_with_alarms(
        s.get(3, GasStream()).pressure_inwc, "PI-5804")              # DT gas outlet / compressor suction P

    # --- FAT / Stack ---
    tags["1540-TI-4400"] = s.get(24, GasStream()).temperature_F      # Stack gas T

    # --- KPP ---
    tags["KPP_CONVERSION"] = kpp.get("overall_SO2_conversion_pct", 0)
    tags["KPP_PRODUCTION"] = kpp.get("H2SO4_production_STPD", 0)
    tags["KPP_SO2_STACK"] = kpp.get("SO2_ppm_stack", 0)

    # --- Full Alarm Setpoint Database (for frontend alarm display) ---
    tags["_ALARM_SETPOINTS"] = ALARM_SETPOINT_DB
    tags["_CONTROLLER_SETPOINTS"] = CONTROLLER_SETPOINT_DB

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
        self.comp_details: Dict[str, float] = {}

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
        self.comp_details = comp_details
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

        # ══════════════════════════════════════════════════════════════════
        # CONVERTER SECTION — correct MECS 3:1 double-absorption topology
        #
        # Process flow (stream numbers NOT sequential per MECS convention):
        #   9 → Pass 1 → 11 → SH1B → 10 → Pass 2 → 13 → HIP hot → 12
        #   → Pass 3 → 14 → CIP hot → 15 → EC3B → 16 → IPAT → 17
        #   → CIP cold → 18 → HIP cold → 19 → Pass 4 → 20
        #   → SH4A → 21 → EC4C → 22 → EC4A → 23 → FAT → 24
        #
        # Even/odd pairing: (10,11) (12,13) share composition;
        #   even = cooled (post-HX), odd = hot (pass outlet)
        # ══════════════════════════════════════════════════════════════════

        s9 = streams[9]

        # ── Pass 1: Stream 9 → Converter → Stream 11 (hot outlet) ──────
        pass1_inlet_C = (s9.temperature_F - 32.0) * 5.0 / 9.0
        s11 = CatalyticPass.calculate(
            s9, pass_number=1,
            inlet_temp_C=pass1_inlet_C,
            catalyst_name=inp.pass1_catalyst,
            catalyst_liters=inp.pass1_liters,
            activity_pct=inp.pass1_activity,
            barometric_psia=inp.barometric_psia,
        )
        s11.stream_id = 11
        s11.tag = "G11"
        s11.label = "Stream 11 — Pass 1 Outlet (Hot)"
        s11.pressure_inwc = s9.pressure_inwc - 34.0   # ref: 179→145
        s11.recalc_total()
        streams[11] = s11

        # ── SH1B: Stream 11 → cool → Stream 10 (Pass 2 inlet) ─────────
        s10, sh1b_duty = InterpassHX.cool_stream_with_duty(
            s11,
            target_temp_F=inp.pass2_inlet_temp_C * 9.0 / 5.0 + 32.0,
            stream_id=10, tag="GP10",
            label="Stream 10 — SH1B Outlet / Pass 2 Inlet",
            dp_inwc=4.0,
        )
        streams[10] = s10

        # ── Pass 2: Stream 10 → Converter → Stream 13 (hot outlet) ────
        s13 = CatalyticPass.calculate(
            s10, pass_number=2,
            inlet_temp_C=inp.pass2_inlet_temp_C,
            catalyst_name=inp.pass2_catalyst,
            catalyst_liters=inp.pass2_liters,
            activity_pct=inp.pass2_activity,
            barometric_psia=inp.barometric_psia,
        )
        s13.stream_id = 13
        s13.tag = "G13"
        s13.label = "Stream 13 — Pass 2 Outlet (Hot)"
        s13.pressure_inwc = s10.pressure_inwc - 16.0   # ref: ~16 inwc
        s13.recalc_total()
        streams[13] = s13

        # ── HIP hot: Stream 13 → cool → Stream 12 (Pass 3 inlet) ──────
        s12, hip_duty = InterpassHX.cool_stream_with_duty(
            s13,
            target_temp_F=inp.pass3_inlet_temp_C * 9.0 / 5.0 + 32.0,
            stream_id=12, tag="G12",
            label="Stream 12 — HIP Outlet / Pass 3 Inlet",
            dp_inwc=4.0,
        )
        streams[12] = s12

        # ── Pass 3: Stream 12 → Converter → Stream 14 (hot outlet) ────
        s14 = CatalyticPass.calculate(
            s12, pass_number=3,
            inlet_temp_C=inp.pass3_inlet_temp_C,
            catalyst_name=inp.pass3_catalyst,
            catalyst_liters=inp.pass3_liters,
            activity_pct=inp.pass3_activity,
            barometric_psia=inp.barometric_psia,
        )
        s14.stream_id = 14
        s14.tag = "G14"
        s14.label = "Stream 14 — Pass 3 Outlet (Hot)"
        s14.pressure_inwc = s12.pressure_inwc - 14.0   # ref: ~14 inwc
        s14.recalc_total()
        streams[14] = s14

        # ── CIP hot: Stream 14 → cool → Stream 15 ─────────────────────
        s15, cip_duty = InterpassHX.cool_stream_with_duty(
            s14,
            target_temp_F=inp.cip_hot_outlet_F,
            stream_id=15, tag="G15",
            label="Stream 15 — CIP Outlet",
            dp_inwc=4.0,
        )
        streams[15] = s15

        # ── EC3B: Stream 15 → EC3B → Stream 16 ────────────────────────
        s16 = EC3B.calculate(s15, inp)
        s16.stream_id = 16
        s16.label = "Stream 16 — EC3B Outlet / IPAT Gas Inlet"
        streams[16] = s16

        # ── IPAT: Stream 16 → IPAT → Stream 17 (SO3 removed) ──────────
        s17, ipat_acid_out_F = IPATower.calculate(s16, inp)
        streams[17] = s17

        # ── CIP cold: Stream 17 → heated by CIP duty → Stream 18 ──────
        s18 = InterpassHX.heat_stream_with_duty(
            s17, cip_duty,
            stream_id=18, tag="G18",
            label="Stream 18 — CIP Cold Outlet",
            dp_inwc=8.0,    # ref: 69→61
        )
        streams[18] = s18

        # ── HIP cold: Stream 18 → heated by HIP duty → Stream 19 ──────
        s19 = InterpassHX.heat_stream_with_duty(
            s18, hip_duty,
            stream_id=19, tag="G19",
            label="Stream 19 — HIP Cold Outlet / Pass 4 Inlet",
            dp_inwc=9.0,    # ref: 61→52
        )
        streams[19] = s19

        # ── Pass 4: Stream 19 → Converter → Stream 20 ─────────────────
        pass4_inlet_C = (s19.temperature_F - 32.0) * 5.0 / 9.0
        s20 = CatalyticPass.calculate(
            s19, pass_number=4,
            inlet_temp_C=pass4_inlet_C,
            catalyst_name=inp.pass4_catalyst,
            catalyst_liters=inp.pass4_liters,
            activity_pct=inp.pass4_activity,
            barometric_psia=inp.barometric_psia,
        )
        s20.stream_id = 20
        s20.tag = "G20"
        s20.label = "Stream 20 — Pass 4 Outlet"
        s20.pressure_inwc = s19.pressure_inwc - 8.0    # ref: ~8 inwc
        s20.recalc_total()
        streams[20] = s20

        # ── SH4A / EC4C / EC4A ─────────────────────────────────────────
        sh_streams = SH4A_EC4C_EC4A.calculate(s20, inp)
        streams[21] = sh_streams["s21"]
        streams[22] = sh_streams["s22"]
        streams[23] = sh_streams["s23"]

        # ── FAT ─────────────────────────────────────────────────────────
        s24, fat_acid_out_F = FATower.calculate(streams[23], inp)

        # ── Converter bypass leakage ────────────────────────────────────
        DESIGN_SO2_PCT = 11.5
        MIN_BYPASS = 0.0002
        base_bypass = inp.converter_bypass_frac
        if inp.plant_condition == "dirty":
            base_bypass = max(base_bypass, 0.0020)
        so2_pct = s9.SO2 / max(s9.TOTAL, 1.0) * 100.0
        strength_factor = (so2_pct / DESIGN_SO2_PCT) ** 4.0
        bypass = max(MIN_BYPASS, base_bypass * strength_factor)
        s24.SO2 += s5.SO2 * bypass
        s24.recalc_total()

        streams[24] = s24

        # ── Post-processing ──────────────────────────────────────────────
        self.streams = streams
        self.ipat_acid_out_F = ipat_acid_out_F
        self.fat_acid_out_F = fat_acid_out_F
        self.kpp = compute_kpp(streams, inp)
        self.alarms = check_alarms(streams, inp, ipat_acid_out_F=ipat_acid_out_F)
        self.sensor_tags = build_sensor_tags(
            streams, inp, self.kpp,
            ipat_acid_out_F=ipat_acid_out_F,
            fat_acid_out_F=fat_acid_out_F,
        )

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
            "compressor": self.comp_details,
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
        "converter_bypass_frac": "converter_bypass_frac",
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
