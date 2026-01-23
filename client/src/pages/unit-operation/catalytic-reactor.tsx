import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Settings, Play, Save, FolderOpen, Loader2, ChevronDown, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { calculateCatalystWeight, CATALYST_BULK_DENSITIES } from "@/lib/convert_alone_py";
import { SessionHeader } from "@/components/SessionHeader";
import { useSession } from "@/contexts/SessionContext";
import { useSessionWebSocket } from "@/hooks/use-session-websocket";
import { PythonCodeDropdown } from "@/components/PythonCodeDropdown";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import expLogo from "@/assets/exp-logo.png";

const uiInputStoragePythonCode = `# Catalytic Reactor UI Input Storage - Python Variables
# Variable names and data structures for front-end state management

from typing import Dict, Any, TypedDict
from dataclasses import dataclass

# ============================================================================
# UI INPUT STATE STRUCTURE
# ============================================================================

@dataclass
class CatalystLayerConfig:
    """Configuration for a single catalyst layer."""
    catalyst_type: str      # e.g., "MECS GR330", "MECS Super Gear XLP-310", "Topsoe VK69"
    liters: float           # Catalyst volume in liters
    activity: float         # Activity percentage (0-100)


@dataclass
class CatalyticReactorInputs:
    """Complete UI input state for the Catalytic Reactor page."""
    
    # === CATALYST CONFIGURATION (per pass) ===
    # Pass 1 (supports dual catalyst layers)
    pass1_type1: str            # First layer catalyst type
    pass1_liters1: float        # First layer volume (liters)
    pass1_activity1: float      # First layer activity (%)
    pass1_type2: str            # Second layer catalyst type
    pass1_liters2: float        # Second layer volume (liters)
    pass1_activity2: float      # Second layer activity (%)
    
    # Pass 2 (single layer)
    pass2_type1: str            # Catalyst type
    pass2_liters1: float        # Volume (liters)
    pass2_activity1: float      # Activity (%)
    
    # Pass 3 (single layer)
    pass3_type1: str            # Catalyst type
    pass3_liters1: float        # Volume (liters)
    pass3_activity1: float      # Activity (%)
    
    # Pass 4 (supports dual catalyst layers)
    pass4_type1: str            # First layer catalyst type
    pass4_liters1: float        # First layer volume (liters)
    pass4_activity1: float      # First layer activity (%)
    pass4_type2: str            # Second layer catalyst type
    pass4_liters2: float        # Second layer volume (liters)
    pass4_activity2: float      # Second layer activity (%)
    
    # === PASS 1 INLET GAS COMPOSITION ===
    so2_percent: float          # SO2 concentration (mol%)
    so3_percent: float          # SO3 concentration (mol%)
    o2_percent: float           # O2 concentration (mol%)
    co2_percent: float          # CO2 concentration (mol%)
    n2_percent: float           # N2 concentration (mol%) - optional
    total_percent: float        # Total composition (mol%) - calculated
    p_barr: float               # Barometric pressure (atm)
    ipat_so3_removal: float     # IPAT SO3 removal efficiency (%)
    
    # === PROCESS INPUTS ===
    sizing_mode: str            # "velocity" or "fixed" diameter mode
    plant_rate: float           # Production rate (STPD or MTPD)
    pass1_inlet_velocity: float # Gas velocity at Pass 1 inlet (ft/min)
    converter_diameter: float   # Fixed converter diameter (ft)
    
    # Pass inlet temperatures (°C)
    pass1_inlet_temp: float
    pass2_inlet_temp: float
    pass3_inlet_temp: float
    pass4_inlet_temp: float
    
    # Pass inlet pressures (inches WC)
    pass1_inlet_pres: float
    pass2_inlet_pres: float
    pass3_inlet_pres: float
    pass4_inlet_pres: float


# ============================================================================
# DEFAULT VALUES (matching UI defaults)
# ============================================================================

DEFAULT_INPUTS = CatalyticReactorInputs(
    # Pass 1 catalyst (dual layer)
    pass1_type1="MECS GR330",
    pass1_liters1=12.0,
    pass1_activity1=100.0,
    pass1_type2="MECS GR330",
    pass1_liters2=24.0,
    pass1_activity2=100.0,
    
    # Pass 2 catalyst
    pass2_type1="MECS Super Gear XLP-310",
    pass2_liters1=40.0,
    pass2_activity1=100.0,
    
    # Pass 3 catalyst
    pass3_type1="MECS Super Gear XLP-310",
    pass3_liters1=45.0,
    pass3_activity1=100.0,
    
    # Pass 4 catalyst (dual layer)
    pass4_type1="MECS Super Gear XLP-310",
    pass4_liters1=25.0,
    pass4_activity1=100.0,
    pass4_type2="MECS GR330",
    pass4_liters2=25.0,
    pass4_activity2=100.0,
    
    # Inlet gas composition
    so2_percent=11.3,
    so3_percent=0.2,
    o2_percent=9.5,
    co2_percent=0.0,
    n2_percent=79.0,
    total_percent=100.0,
    p_barr=0.85,
    ipat_so3_removal=100.0,
    
    # Process inputs
    sizing_mode="velocity",
    plant_rate=2480.0,
    pass1_inlet_velocity=145.0,
    converter_diameter=42.0,
    
    # Temperatures (°C)
    pass1_inlet_temp=390.0,
    pass2_inlet_temp=420.0,
    pass3_inlet_temp=440.0,
    pass4_inlet_temp=390.0,
    
    # Pressures (inches WC)
    pass1_inlet_pres=150.0,
    pass2_inlet_pres=135.0,
    pass3_inlet_pres=100.0,
    pass4_inlet_pres=60.0,
)


# ============================================================================
# SESSION STATE DICTIONARY FORMAT
# ============================================================================

def inputs_to_session_dict(inputs: CatalyticReactorInputs) -> Dict[str, str]:
    """Convert inputs to session storage format (string values)."""
    return {
        # Catalyst config
        "pass1Type1": inputs.pass1_type1,
        "pass1Liters1": str(inputs.pass1_liters1),
        "pass1Activity1": str(inputs.pass1_activity1),
        "pass1Type2": inputs.pass1_type2,
        "pass1Liters2": str(inputs.pass1_liters2),
        "pass1Activity2": str(inputs.pass1_activity2),
        "pass2Type1": inputs.pass2_type1,
        "pass2Liters1": str(inputs.pass2_liters1),
        "pass2Activity1": str(inputs.pass2_activity1),
        "pass3Type1": inputs.pass3_type1,
        "pass3Liters1": str(inputs.pass3_liters1),
        "pass3Activity1": str(inputs.pass3_activity1),
        "pass4Type1": inputs.pass4_type1,
        "pass4Liters1": str(inputs.pass4_liters1),
        "pass4Activity1": str(inputs.pass4_activity1),
        "pass4Type2": inputs.pass4_type2,
        "pass4Liters2": str(inputs.pass4_liters2),
        "pass4Activity2": str(inputs.pass4_activity2),
        
        # Gas composition
        "so2Percent": str(inputs.so2_percent),
        "so3Percent": str(inputs.so3_percent),
        "o2Percent": str(inputs.o2_percent),
        "co2Percent": str(inputs.co2_percent),
        "n2Percent": str(inputs.n2_percent),
        "pBarr": str(inputs.p_barr),
        "ipatSo3Removal": str(inputs.ipat_so3_removal),
        
        # Process inputs
        "plantRate": str(inputs.plant_rate),
        "pass1InletVelocity": str(inputs.pass1_inlet_velocity),
        "pass1InletTemp": str(inputs.pass1_inlet_temp),
        "pass2InletTemp": str(inputs.pass2_inlet_temp),
        "pass3InletTemp": str(inputs.pass3_inlet_temp),
        "pass4InletTemp": str(inputs.pass4_inlet_temp),
        "pass1InletPres": str(inputs.pass1_inlet_pres),
        "pass2InletPres": str(inputs.pass2_inlet_pres),
        "pass3InletPres": str(inputs.pass3_inlet_pres),
        "pass4InletPres": str(inputs.pass4_inlet_pres),
    }


def session_dict_to_inputs(data: Dict[str, str]) -> CatalyticReactorInputs:
    """Parse session storage format back to inputs dataclass."""
    return CatalyticReactorInputs(
        pass1_type1=data.get("pass1Type1", "MECS GR330"),
        pass1_liters1=float(data.get("pass1Liters1", "12.0")),
        pass1_activity1=float(data.get("pass1Activity1", "100.0")),
        pass1_type2=data.get("pass1Type2", "MECS GR330"),
        pass1_liters2=float(data.get("pass1Liters2", "24.0")),
        pass1_activity2=float(data.get("pass1Activity2", "100.0")),
        pass2_type1=data.get("pass2Type1", "MECS Super Gear XLP-310"),
        pass2_liters1=float(data.get("pass2Liters1", "40.0")),
        pass2_activity1=float(data.get("pass2Activity1", "100.0")),
        pass3_type1=data.get("pass3Type1", "MECS Super Gear XLP-310"),
        pass3_liters1=float(data.get("pass3Liters1", "45.0")),
        pass3_activity1=float(data.get("pass3Activity1", "100.0")),
        pass4_type1=data.get("pass4Type1", "MECS Super Gear XLP-310"),
        pass4_liters1=float(data.get("pass4Liters1", "25.0")),
        pass4_activity1=float(data.get("pass4Activity1", "100.0")),
        pass4_type2=data.get("pass4Type2", "MECS GR330"),
        pass4_liters2=float(data.get("pass4Liters2", "25.0")),
        pass4_activity2=float(data.get("pass4Activity2", "100.0")),
        so2_percent=float(data.get("so2Percent", "11.3")),
        so3_percent=float(data.get("so3Percent", "0.2")),
        o2_percent=float(data.get("o2Percent", "9.5")),
        co2_percent=float(data.get("co2Percent", "0.0")),
        n2_percent=float(data.get("n2Percent", "79.0")),
        total_percent=100.0,
        p_barr=float(data.get("pBarr", "0.85")),
        ipat_so3_removal=float(data.get("ipatSo3Removal", "100.0")),
        sizing_mode="velocity",
        plant_rate=float(data.get("plantRate", "2480").replace(",", "")),
        pass1_inlet_velocity=float(data.get("pass1InletVelocity", "145")),
        converter_diameter=42.0,
        pass1_inlet_temp=float(data.get("pass1InletTemp", "390")),
        pass2_inlet_temp=float(data.get("pass2InletTemp", "420")),
        pass3_inlet_temp=float(data.get("pass3InletTemp", "440")),
        pass4_inlet_temp=float(data.get("pass4InletTemp", "390")),
        pass1_inlet_pres=float(data.get("pass1InletPres", "150")),
        pass2_inlet_pres=float(data.get("pass2InletPres", "135")),
        pass3_inlet_pres=float(data.get("pass3InletPres", "100")),
        pass4_inlet_pres=float(data.get("pass4InletPres", "60")),
    )


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    # Create default inputs
    inputs = DEFAULT_INPUTS
    
    print("=== UI Input Variables ===")
    print(f"Pass 1 Layer 1: {inputs.pass1_type1}, {inputs.pass1_liters1}L @ {inputs.pass1_activity1}%")
    print(f"Pass 1 Layer 2: {inputs.pass1_type2}, {inputs.pass1_liters2}L @ {inputs.pass1_activity2}%")
    print(f"SO2 Inlet: {inputs.so2_percent}%")
    print(f"Plant Rate: {inputs.plant_rate} STPD")
    
    # Convert to session storage format
    session_data = inputs_to_session_dict(inputs)
    print("\\n=== Session Storage Keys ===")
    for key, value in list(session_data.items())[:10]:
        print(f"  {key}: {value}")
`;

const uiOutputStoragePythonCode = `# ui_outputs.py
# Output data structures for catalytic reactor simulation
# (See main.py for combined version with all dataclasses inline)

from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, Any, List


@dataclass
class PassPoint:
    """One row on the pass summary table."""
    bed_depth_pct: float
    bed_depth_ft: float
    temp_c: float

    bed_conv_pct: float
    overall_conv_pct: float
    eq_conv_pct: float

    p_abs_psia: float
    p_gauge_inwc: float

    so2_pct: float
    o2_pct: float
    so3_pct: float
    n2_pct: float

    acfm: float
    v_ft_s: float

    mu_pa_s: float
    rho_kg_m3: float


@dataclass
class PassSummary:
    pass_number: int
    points: List[PassPoint]
    outlet: Dict[str, Any]  # minimal pass outlet summary


@dataclass
class ConverterSummary:
    converter_diameter_ft: float
    total_molar_flow_lbmol_hr: float

    overall_conv_pct: float
    outlet_temp_c: float
    outlet_p_abs_psia: float
    outlet_p_gauge_inwc: float


@dataclass
class XTPlotData:
    """Data for plotting equilibrium + operating line curves."""
    T_C: List[float]
    Xeq_pct: List[float]
    # optional future curves:
    # Xop_pct: List[float]
    # max_rate: List[float]


@dataclass
class ConverterUIOutput:
    """Top-level payload returned to the frontend."""
    converter: ConverterSummary
    passes: List[PassSummary]
    xt_plot: XTPlotData

    # free-form debug bucket (handy during integration)
    debug: Dict[str, Any]
`;

const mainPyCode = `# main.py
# Converter simulation with full pass datasets, RK4 integration, and X-T diagram output
# Combined file: includes UI Output dataclasses inline for easier editing

from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, Any, List
import math
import numpy as np
import matplotlib.pyplot as plt

from ui_inputs import DEFAULT_INPUTS, CatalyticReactorInputs

from rk import (
    ATM_TO_PSIA, INWC_PER_PSI,
    psia_to_atm, bed_depth_ft_from_liters,
    acfm_from_FT_TP_psia, velocity_ft_s,
    CatalystProps, BedSegment, rk4_segment,
    y_at_conversion, Xeq_at_T, eklund_rate
)

# =============================================================================
# UI Output Data Structures (inline from ui_outputs.py)
# =============================================================================

@dataclass
class PassPoint:
    """One row on the pass summary table."""
    bed_depth_pct: float
    bed_depth_ft: float
    temp_c: float

    bed_conv_pct: float
    overall_conv_pct: float
    eq_conv_pct: float

    p_abs_psia: float
    p_gauge_inwc: float

    so2_pct: float
    o2_pct: float
    so3_pct: float
    n2_pct: float

    acfm: float
    v_ft_s: float

    mu_pa_s: float
    rho_kg_m3: float


@dataclass
class PassSummary:
    pass_number: int
    points: List[PassPoint]
    outlet: Dict[str, Any]  # minimal pass outlet summary


@dataclass
class ConverterSummary:
    converter_diameter_ft: float
    total_molar_flow_lbmol_hr: float

    overall_conv_pct: float
    outlet_temp_c: float
    outlet_p_abs_psia: float
    outlet_p_gauge_inwc: float


@dataclass
class XTPlotData:
    """Data for plotting equilibrium + operating line curves."""
    T_C: List[float]
    Xeq_pct: List[float]
    Xmr_pct: List[float] = None        # maximum-rate curve
    operating_T_C: List[float] = None  # operating line temperatures
    operating_X_pct: List[float] = None  # operating line conversions


@dataclass
class ConverterUIOutput:
    """Top-level payload returned to the frontend."""
    converter: ConverterSummary
    passes: List[PassSummary]
    xt_plot: XTPlotData

    # free-form debug bucket (handy during integration)
    debug: Dict[str, Any]

# =============================================================================
# Unit conversions
# =============================================================================
def inwc_to_psi(inwc: float) -> float:
    return inwc / INWC_PER_PSI

def psi_to_inwc(psi: float) -> float:
    return psi * INWC_PER_PSI

def inlet_abs_psia(p_barr_atm: float, p_gauge_inwc: float) -> float:
    return p_barr_atm * ATM_TO_PSIA + inwc_to_psi(p_gauge_inwc)

def psia_to_inwc_gauge(P_abs_psia: float, p_barr_atm: float) -> float:
    P_bar_psia = p_barr_atm * ATM_TO_PSIA
    return psi_to_inwc(P_abs_psia - P_bar_psia)

# =============================================================================
# Gas properties in THIS file (Wilke μ + ideal gas ρ)
# =============================================================================
MW = {"SO2": 64.066, "SO3": 80.066, "O2": 31.999, "N2": 28.014}

SUTHERLAND_PARAMS = {
    "SO2": {"mu_0": 12.4,  "T_0": 293.0, "S": 416.0},
    "SO3": {"mu_0": 12.4,  "T_0": 293.0, "S": 416.0},
    "O2":  {"mu_0": 20.18, "T_0": 293.0, "S": 139.0},
    "N2":  {"mu_0": 17.81, "T_0": 293.0, "S": 111.0},
}

UPA_S_TO_PA_S = 1e-6
R_UNIV = 8.314462618  # J/(mol*K)

def normalize_y(y: Dict[str, float]) -> Dict[str, float]:
    s = sum(max(v, 0.0) for v in y.values())
    if s <= 0:
        raise ValueError("Invalid mole fractions: sum <= 0")
    return {k: max(v, 0.0) / s for k, v in y.items()}

def sutherland_mu_uPa_s(T_K: float, mu0_uPa_s: float, T0: float, S: float) -> float:
    return mu0_uPa_s * (T_K / T0) ** 1.5 * ((T0 + S) / (T_K + S))

def pure_mu_pa_s(species: str, T_C: float) -> float:
    p = SUTHERLAND_PARAMS[species]
    T_K = T_C + 273.15
    return sutherland_mu_uPa_s(T_K, p["mu_0"], p["T_0"], p["S"]) * UPA_S_TO_PA_S

def wilke_phi(mu_i: float, mu_j: float, Mi: float, Mj: float) -> float:
    return (1.0 + math.sqrt(mu_i / mu_j) * (Mj / Mi) ** 0.25) ** 2 / (
        math.sqrt(8.0) * math.sqrt(1.0 + Mi / Mj)
    )

def mu_wilke_pa_s(y: Dict[str, float], T_C: float) -> float:
    x = normalize_y(y)
    mu = {sp: pure_mu_pa_s(sp, T_C) for sp in x}
    M  = {sp: MW[sp] for sp in x}

    mu_mix = 0.0
    for i, xi in x.items():
        denom = 0.0
        for j, xj in x.items():
            denom += xj * wilke_phi(mu[i], mu[j], M[i], M[j])
        mu_mix += xi * mu[i] / max(denom, 1e-30)
    return mu_mix

def mw_mix_kg_per_mol(y: Dict[str, float]) -> float:
    x = normalize_y(y)
    mw_g_mol = sum(x[sp] * MW[sp] for sp in x)
    return mw_g_mol / 1000.0

def rho_ideal_kg_m3(y: Dict[str, float], T_C: float, P_abs_psia: float) -> float:
    T_K = T_C + 273.15
    P_Pa = P_abs_psia * 6894.757293168
    MWmix = mw_mix_kg_per_mol(y)
    return (P_Pa * MWmix) / (R_UNIV * T_K)

# =============================================================================
# Catalyst database used by RK
# =============================================================================
CATALYST_DB: Dict[str, CatalystProps] = {
    "Topsoe VK69": CatalystProps("Topsoe VK69", void_fraction=0.60, sphericity=0.75, diameter_mm=9.0,  bulk_density_kg_m3=800.0, activity_fresh=3.51),
    "MECS Super Gear XLP-310": CatalystProps("MECS Super Gear XLP-310", void_fraction=0.50, sphericity=0.65, diameter_mm=12.5, bulk_density_kg_m3=815.0, activity_fresh=3.35),
    "MECS GR330": CatalystProps("MECS GR330", void_fraction=0.55, sphericity=0.70, diameter_mm=11.0, bulk_density_kg_m3=865.0, activity_fresh=1.40),
}

# =============================================================================
# Inlet composition
# =============================================================================
def inlet_y(inputs: CatalyticReactorInputs) -> Dict[str, float]:
    y = {
        "SO2": inputs.so2_percent / 100.0,
        "SO3": inputs.so3_percent / 100.0,
        "O2":  inputs.o2_percent / 100.0,
        "N2":  inputs.n2_percent / 100.0,
    }
    return normalize_y(y)

# =============================================================================
# Diameter sizing (minimal)
# =============================================================================
def diameter_from_velocity(acfm: float, v_fpm: float) -> float:
    area_ft2 = acfm / max(v_fpm, 1e-12)
    return math.sqrt(4.0 * area_ft2 / math.pi)

def compute_diameter_ft(inputs: CatalyticReactorInputs, P1_psia: float, FT0_lbmol_hr: float) -> float:
    if inputs.sizing_mode == "fixed":
        return inputs.converter_diameter
    acfm = acfm_from_FT_TP_psia(max(FT0_lbmol_hr, 1e-6), inputs.pass1_inlet_temp, P1_psia)
    return diameter_from_velocity(acfm, inputs.pass1_inlet_velocity)

# =============================================================================
# Maximum-rate curve helper
# =============================================================================
def max_rate_conversion_at_T(TC: float, P_atm: float, y0: Dict[str, float], a_eff: float = 1.0) -> float:
    Xeq = Xeq_at_T(TC, P_atm, y0)
    if Xeq <= 1e-12:
        return 0.0

    n = 250
    X_grid = np.linspace(0.0, float(Xeq), n)

    bestX = 0.0
    bestR = -1.0
    for X in X_grid:
        r = eklund_rate(TC, float(X), P_atm, y0, a_eff)
        if r > bestR:
            bestR = r
            bestX = float(X)
    return bestX

# =============================================================================
# IPAT SO3 removal (Option A)
# =============================================================================
def apply_ipat_so3_removal(
    y_out: Dict[str, float],
    FT_lbmol_hr: float,
    removal_percent: float
) -> tuple[Dict[str, float], float]:
    """
    Remove a fraction of SO3 from the gas stream and renormalize remaining mole fractions.
    Returns (new_y, new_FT).

    Option A: remove SO3 only; SO2, O2, N2 flows unchanged.
    """
    rem = max(0.0, min(100.0, float(removal_percent))) / 100.0

    y_out = normalize_y(y_out)
    F_SO3 = FT_lbmol_hr * y_out["SO3"]
    F_SO3_removed = rem * F_SO3

    FT_new = max(1e-12, FT_lbmol_hr - F_SO3_removed)

    # Remaining component flows
    F_SO2 = FT_lbmol_hr * y_out["SO2"]
    F_O2  = FT_lbmol_hr * y_out["O2"]
    F_N2  = FT_lbmol_hr * y_out["N2"]
    F_SO3_new = F_SO3 - F_SO3_removed

    y_new = {
        "SO2": F_SO2 / FT_new,
        "O2":  F_O2  / FT_new,
        "SO3": max(0.0, F_SO3_new / FT_new),
        "N2":  F_N2  / FT_new,
    }
    return normalize_y(y_new), FT_new

# =============================================================================
# Main simulation
# =============================================================================
def run_converter(inputs: CatalyticReactorInputs) -> ConverterUIOutput:
    # Pass inlet absolute pressures for each pass (psia)
    P1 = inlet_abs_psia(inputs.p_barr, inputs.pass1_inlet_pres)
    P2 = inlet_abs_psia(inputs.p_barr, inputs.pass2_inlet_pres)
    P3 = inlet_abs_psia(inputs.p_barr, inputs.pass3_inlet_pres)
    P4 = inlet_abs_psia(inputs.p_barr, inputs.pass4_inlet_pres)

    # Basis (placeholder): replace with real flow later
    FT0 = max(1.0, inputs.plant_rate)
    y0 = inlet_y(inputs)

    D_ft = compute_diameter_ft(inputs, P1, FT0)

    # -----------------------------
    # Run Passes 1-3 on inlet basis y0
    # -----------------------------
    segs_123: List[BedSegment] = [
        BedSegment("Pass1-L1", CATALYST_DB[inputs.pass1_type1], inputs.pass1_liters1, inputs.pass1_activity1,
                   inputs.pass1_inlet_temp, P1, FT0, y0, D_ft),
        BedSegment("Pass1-L2", CATALYST_DB[inputs.pass1_type2], inputs.pass1_liters2, inputs.pass1_activity2,
                   inputs.pass1_inlet_temp, P1, FT0, y0, D_ft),

        BedSegment("Pass2", CATALYST_DB[inputs.pass2_type1], inputs.pass2_liters1, inputs.pass2_activity1,
                   inputs.pass2_inlet_temp, P2, FT0, y0, D_ft),

        BedSegment("Pass3", CATALYST_DB[inputs.pass3_type1], inputs.pass3_liters1, inputs.pass3_activity1,
                   inputs.pass3_inlet_temp, P3, FT0, y0, D_ft),
    ]

    seg_results_123 = []
    overall_X_running = 0.0  # Track overall conversion to update inlet compositions
    
    for seg in segs_123:
        # Update inlet composition based on previous conversion
        if seg_results_123:
            _, prev_res = seg_results_123[-1]
            prev_X = float(prev_res.X[-1])
            
            if seg.name.endswith("-L2"):
                # Layer 2: inherits outlet T,P,composition from layer 1
                seg.Tin_C = float(prev_res.T_C[-1])
                seg.Pin_abs_psia = float(prev_res.P_psia[-1])
                # Update composition: chain conversion with previous layer
                overall_X_running = overall_X_running + (1.0 - overall_X_running) * prev_X
                seg.y0 = y_at_conversion(y0, overall_X_running)
            elif seg.name == "Pass2":
                # Pass 2: use composition after Pass 1 outlet
                overall_X_running = overall_X_running + (1.0 - overall_X_running) * prev_X
                seg.y0 = y_at_conversion(y0, overall_X_running)
            elif seg.name == "Pass3":
                # Pass 3: use composition after Pass 2 outlet
                overall_X_running = overall_X_running + (1.0 - overall_X_running) * prev_X
                seg.y0 = y_at_conversion(y0, overall_X_running)

        res = rk4_segment(seg, mu_wilke_pa_s, rho_ideal_kg_m3)
        seg_results_123.append((seg, res))

    # Calculate overall conversion after Pass 3
    # Need to accumulate from last segment
    _, pass3_res = seg_results_123[-1]
    pass3_X = float(pass3_res.X[-1])
    overall_X3 = overall_X_running + (1.0 - overall_X_running) * pass3_X

    # Compute Pass 3 outlet composition (using y0 and overall_X3)
    y3_out = y_at_conversion(y0, overall_X3)

    # Apply IPAT removal AFTER pass 3
    y4_in, FT4 = apply_ipat_so3_removal(y3_out, FT0, inputs.ipat_so3_removal)

    # -----------------------------
    # Run Pass 4 on NEW inlet basis (after SO3 removal)
    # -----------------------------
    segs_4: List[BedSegment] = [
        BedSegment("Pass4-L1", CATALYST_DB[inputs.pass4_type1], inputs.pass4_liters1, inputs.pass4_activity1,
                   inputs.pass4_inlet_temp, P4, FT4, y4_in, D_ft),
        BedSegment("Pass4-L2", CATALYST_DB[inputs.pass4_type2], inputs.pass4_liters2, inputs.pass4_activity2,
                   inputs.pass4_inlet_temp, P4, FT4, y4_in, D_ft),
    ]

    seg_results_4 = []
    pass4_X_running = 0.0  # Track Pass 4 internal conversion for L2
    
    for seg in segs_4:
        if seg_results_4 and seg.name.endswith("-L2"):
            _, prev_res = seg_results_4[-1]
            prev_X = float(prev_res.X[-1])
            seg.Tin_C = float(prev_res.T_C[-1])
            seg.Pin_abs_psia = float(prev_res.P_psia[-1])
            # Update composition: L2 inlet is L1 outlet composition
            pass4_X_running = prev_X
            seg.y0 = y_at_conversion(y4_in, pass4_X_running)

        res = rk4_segment(seg, mu_wilke_pa_s, rho_ideal_kg_m3)
        seg_results_4.append((seg, res))

    # Pass 4 adds additional conversion on the remaining SO2.
    # Calculate cumulative Pass 4 conversion by chaining L1 and L2
    pass4_L1_seg, pass4_L1_res = seg_results_4[0]
    X4_L1 = float(pass4_L1_res.X[-1])
    
    if len(seg_results_4) > 1:
        pass4_L2_seg, pass4_L2_res = seg_results_4[-1]
        X4_L2 = float(pass4_L2_res.X[-1])
        # Chain L1 and L2 conversions
        X4 = X4_L1 + (1.0 - X4_L1) * X4_L2
    else:
        X4 = X4_L1

    # Convert that to additional overall conversion on original basis:
    # remaining SO2 after pass3 (original basis) = (1 - overall_X3)
    overall_X_out = overall_X3 + (1.0 - overall_X3) * X4

    # -----------------------------
    # Build pass summaries (5 points each) but Pass 4 points need mapping into "overall"
    # -----------------------------
    def sample_idxs(n: int) -> List[int]:
        fracs = [0.0, 0.25, 0.50, 0.75, 1.0]
        return [int(round(f*(n-1))) for f in fracs]

    pass_summaries: List[PassSummary] = []

    # Helper to create points for passes 1-3 (basis y0)
    def make_pass_points_from_concat(
        pass_number: int,
        names: List[str],
        y_basis: Dict[str, float],
        FT_basis: float,
        overall_in: float
    ) -> tuple[List[PassPoint], float]:
        # concat arrays with proper cumulative conversion for multi-layer passes
        T_all, X_bed, P_all, Xeq_all = [], [], [], []
        X_cumulative = 0.0  # Track cumulative conversion across layers within this pass
        
        for k, nm in enumerate(names):
            seg, r = next((s, rr) for (s, rr) in seg_results_123 if s.name == nm)
            if k == 0:
                T_all += r.T_C.tolist()
                # First layer: X values are correct (starting from 0)
                X_bed += r.X.tolist()
                P_all += r.P_psia.tolist()
                Xeq_all += r.Xeq.tolist()
                X_cumulative = float(r.X[-1])  # L1 outlet conversion
            else:
                T_all += r.T_C[1:].tolist()
                # Subsequent layers: Transform X to cumulative with previous layer
                # Formula: X_cumulative_prev + (1 - X_cumulative_prev) * X_layer
                X_layer_transformed = [X_cumulative + (1.0 - X_cumulative) * float(x) for x in r.X[1:]]
                X_bed += X_layer_transformed
                P_all += r.P_psia[1:].tolist()
                Xeq_all += r.Xeq[1:].tolist()
                # Update cumulative for any subsequent layers
                X_cumulative = X_cumulative + (1.0 - X_cumulative) * float(r.X[-1])

        T_all = np.array(T_all)
        X_bed = np.array(X_bed)
        P_all = np.array(P_all)
        Xeq_all = np.array(Xeq_all)

        L_total_ft = sum(bed_depth_ft_from_liters(
            next(s for (s, _) in seg_results_123 if s.name == nm).liters, D_ft
        ) for nm in names)

        pts: List[PassPoint] = []
        for frac, idx in zip([0, 25, 50, 75, 100], sample_idxs(len(T_all))):
            bedX = float(X_bed[idx])
            overallX = overall_in + (1.0 - overall_in) * bedX
            y_rep = y_at_conversion(y_basis, overallX)

            Ppsia = float(P_all[idx])
            acfm = acfm_from_FT_TP_psia(FT_basis, float(T_all[idx]), Ppsia)
            vfts = velocity_ft_s(acfm, D_ft)

            mu = mu_wilke_pa_s(y_rep, float(T_all[idx]))
            rho = rho_ideal_kg_m3(y_rep, float(T_all[idx]), Ppsia)

            # Calculate per-pass bed conversion: fraction of SO2 entering THIS pass that gets converted
            # Formula: (overallX - overall_in) / (1 - overall_in)
            # This gives the conversion relative to the pass inlet, not the original inlet
            per_pass_X = (overallX - overall_in) / (1.0 - overall_in) if (1.0 - overall_in) > 1e-9 else overallX
            
            pts.append(PassPoint(
                bed_depth_pct=float(frac),
                bed_depth_ft=float(L_total_ft * frac/100.0),
                temp_c=float(T_all[idx]),

                bed_conv_pct=100.0 * per_pass_X,
                overall_conv_pct=100.0 * overallX,
                eq_conv_pct=100.0 * float(Xeq_all[idx]),

                p_abs_psia=Ppsia,
                p_gauge_inwc=psia_to_inwc_gauge(Ppsia, inputs.p_barr),

                so2_pct=100.0 * y_rep["SO2"],
                o2_pct=100.0 * y_rep["O2"],
                so3_pct=100.0 * y_rep["SO3"],
                n2_pct=100.0 * y_rep["N2"],

                acfm=acfm,
                v_ft_s=vfts,

                mu_pa_s=mu,
                rho_kg_m3=rho,
            ))

        overall_out = overall_in + (1.0 - overall_in) * float(X_bed[-1])
        return pts, overall_out

    overall_in = 0.0

    # Pass 1 (two layers)
    pts1, overall_in = make_pass_points_from_concat(1, ["Pass1-L1", "Pass1-L2"], y0, FT0, overall_in)
    pass_summaries.append(PassSummary(1, pts1, outlet={
        "outlet_temp_c": pts1[-1].temp_c,
        "outlet_p_abs_psia": pts1[-1].p_abs_psia,
        "outlet_p_gauge_inwc": pts1[-1].p_gauge_inwc,
        "outlet_overall_conv_pct": pts1[-1].overall_conv_pct,
    }))

    # Pass 2
    pts2, overall_in = make_pass_points_from_concat(2, ["Pass2"], y0, FT0, overall_in)
    pass_summaries.append(PassSummary(2, pts2, outlet={
        "outlet_temp_c": pts2[-1].temp_c,
        "outlet_p_abs_psia": pts2[-1].p_abs_psia,
        "outlet_p_gauge_inwc": pts2[-1].p_gauge_inwc,
        "outlet_overall_conv_pct": pts2[-1].overall_conv_pct,
    }))

    # Pass 3
    pts3, overall_in = make_pass_points_from_concat(3, ["Pass3"], y0, FT0, overall_in)
    pass_summaries.append(PassSummary(3, pts3, outlet={
        "outlet_temp_c": pts3[-1].temp_c,
        "outlet_p_abs_psia": pts3[-1].p_abs_psia,
        "outlet_p_gauge_inwc": pts3[-1].p_gauge_inwc,
        "outlet_overall_conv_pct": pts3[-1].overall_conv_pct,
        "ipat_so3_removal_pct": float(inputs.ipat_so3_removal),
        "y_after_pass3": y3_out,
        "y_after_ipat": y4_in,
        "FT_after_ipat_lbmol_hr": FT4,
    }))

    # Pass 4 points: use RK data on basis y4_in but map to overall basis via:
    # overallX = overall_X3 + (1-overall_X3)*X4_local
    def make_pass4_points() -> List[PassPoint]:
        # concat pass4 arrays with proper cumulative conversion for multi-layer
        T_all, X_bed, P_all, Xeq_all = [], [], [], []
        X_cumulative = 0.0  # Track cumulative conversion across layers
        
        for k, (seg, r) in enumerate(seg_results_4):
            if k == 0:
                T_all += r.T_C.tolist()
                # Layer 1: X values are already correct (starting from 0)
                X_bed += r.X.tolist()
                P_all += r.P_psia.tolist()
                Xeq_all += r.Xeq.tolist()
                X_cumulative = float(r.X[-1])  # L1 outlet conversion
            else:
                T_all += r.T_C[1:].tolist()
                # Layer 2: Transform X to cumulative with L1
                # Formula: X_cumulative_L1 + (1 - X_cumulative_L1) * X_L2
                X_L2_transformed = [X_cumulative + (1.0 - X_cumulative) * float(x) for x in r.X[1:]]
                X_bed += X_L2_transformed
                P_all += r.P_psia[1:].tolist()
                Xeq_all += r.Xeq[1:].tolist()

        T_all = np.array(T_all)
        X_bed = np.array(X_bed)
        P_all = np.array(P_all)
        Xeq_all = np.array(Xeq_all)

        L_total_ft = sum(bed_depth_ft_from_liters(seg.liters, D_ft) for seg, _ in seg_results_4)

        pts: List[PassPoint] = []
        for frac, idx in zip([0, 25, 50, 75, 100], sample_idxs(len(T_all))):
            X4_local = float(X_bed[idx])
            overallX = overall_X3 + (1.0 - overall_X3) * X4_local

            # For display composition, we can show gas composition on the ORIGINAL basis
            # (after total conversion). This uses y0 and overallX:
            y_rep = y_at_conversion(y0, overallX)

            Ppsia = float(P_all[idx])
            acfm = acfm_from_FT_TP_psia(FT4, float(T_all[idx]), Ppsia)
            vfts = velocity_ft_s(acfm, D_ft)

            mu = mu_wilke_pa_s(y_rep, float(T_all[idx]))
            rho = rho_ideal_kg_m3(y_rep, float(T_all[idx]), Ppsia)

            pts.append(PassPoint(
                bed_depth_pct=float(frac),
                bed_depth_ft=float(L_total_ft * frac/100.0),
                temp_c=float(T_all[idx]),

                bed_conv_pct=100.0 * X4_local,
                overall_conv_pct=100.0 * overallX,
                eq_conv_pct=100.0 * float(Xeq_all[idx]),

                p_abs_psia=Ppsia,
                p_gauge_inwc=psia_to_inwc_gauge(Ppsia, inputs.p_barr),

                so2_pct=100.0 * y_rep["SO2"],
                o2_pct=100.0 * y_rep["O2"],
                so3_pct=100.0 * y_rep["SO3"],
                n2_pct=100.0 * y_rep["N2"],

                acfm=acfm,
                v_ft_s=vfts,

                mu_pa_s=mu,
                rho_kg_m3=rho,
            ))
        return pts

    pts4 = make_pass4_points()
    pass_summaries.append(PassSummary(4, pts4, outlet={
        "outlet_temp_c": pts4[-1].temp_c,
        "outlet_p_abs_psia": pts4[-1].p_abs_psia,
        "outlet_p_gauge_inwc": pts4[-1].p_gauge_inwc,
        "outlet_overall_conv_pct": pts4[-1].overall_conv_pct,
    }))

    # -----------------------------
    # Operating line (2 points per pass + horizontal intercooling)
    # -----------------------------
    op_T: List[float] = []
    op_X: List[float] = []

    pass_inlet_T = [
        inputs.pass1_inlet_temp,
        inputs.pass2_inlet_temp,
        inputs.pass3_inlet_temp,
        inputs.pass4_inlet_temp,
    ]

    prev_out_X_pct = 0.0
    for i, ps in enumerate(pass_summaries):
        Tin = float(pass_inlet_T[i])
        Xin = float(prev_out_X_pct)

        Tout = float(ps.points[-1].temp_c)
        Xout = float(ps.points[-1].overall_conv_pct)

        op_T.extend([Tin, Tout])
        op_X.extend([Xin, Xout])

        if i < len(pass_summaries) - 1:
            Tnext = float(pass_inlet_T[i + 1])
            op_T.append(Tnext)
            op_X.append(Xout)

        prev_out_X_pct = Xout

    # -----------------------------
    # X-T curves for plotting (Celsius)
    # Use y0 as the "reference" for equilibrium curve; Pass 4 behavior is shown by operating line.
    # -----------------------------
    Tgrid = np.linspace(300.0, 650.0, 200)
    Pplot_atm = psia_to_atm(P1)

    Xeq_pct = [100.0 * Xeq_at_T(float(TC), Pplot_atm, y0) for TC in Tgrid]
    Xmr_pct = [100.0 * max_rate_conversion_at_T(float(TC), Pplot_atm, y0, a_eff=1.0) for TC in Tgrid]

    xt_plot = XTPlotData(
        T_C=Tgrid.tolist(),
        Xeq_pct=Xeq_pct,
        Xmr_pct=Xmr_pct,
        operating_T_C=op_T,
        operating_X_pct=op_X,
    )

    last_pt = pass_summaries[-1].points[-1]
    converter_summary = ConverterSummary(
        converter_diameter_ft=float(D_ft),
        total_molar_flow_lbmol_hr=float(FT0),
        overall_conv_pct=float(last_pt.overall_conv_pct),
        outlet_temp_c=float(last_pt.temp_c),
        outlet_p_abs_psia=float(last_pt.p_abs_psia),
        outlet_p_gauge_inwc=float(last_pt.p_gauge_inwc),
    )

    return ConverterUIOutput(
        converter=converter_summary,
        passes=pass_summaries,
        xt_plot=xt_plot,
        debug={
            "P1_psia": P1, "P2_psia": P2, "P3_psia": P3, "P4_psia": P4,
            "y0": y0,
            "y_after_pass3": y3_out,
            "y_after_ipat": y4_in,
            "FT0_lbmol_hr": FT0,
            "FT4_after_ipat_lbmol_hr": FT4,
            "note": "FT0 is still a placeholder mapping from plant_rate; replace with real flow basis later.",
        }
    )

if __name__ == "__main__":
    out = run_converter(DEFAULT_INPUTS)

    print("\\n=== Converter Summary ===")
    print(out.converter)

    # Optional: quick plot to verify
    plt.figure(figsize=(9, 4.8))
    plt.plot(out.xt_plot.T_C, out.xt_plot.Xeq_pct, linestyle="--", label="Equilibrium Line")
    plt.plot(out.xt_plot.T_C, out.xt_plot.Xmr_pct, label="Maximum Rate Curve")
    plt.plot(out.xt_plot.operating_T_C, out.xt_plot.operating_X_pct, marker="o", label="Adiabatic Operating Line")
    plt.xlabel("Temperature (°C)")
    plt.ylabel("Conversion (%)")
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.show()
`;

const rkSolverPyCode = `# rk_solver.py
# RK4 solver for plug-flow SO2->SO3 adiabatic bed with pressure drop (Ergun equation)

from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, Tuple, Callable
import math
import numpy as np

ATM_TO_PSIA = 14.696
INWC_PER_PSI = 27.68
FT3_PER_LITER = 0.0353146667
R_GAS_FT3_PSIA_PER_LBMOL_R = 10.7316

# Stoich: SO2 + 0.5 O2 -> SO3  => delta = -0.5 (total moles drop)
DELTA = -0.5


def psia_to_atm(psia: float) -> float:
    return psia / ATM_TO_PSIA


def bed_depth_ft_from_liters(liters: float, diameter_ft: float) -> float:
    V_ft3 = liters * FT3_PER_LITER
    A_ft2 = math.pi * (diameter_ft ** 2) / 4.0
    return V_ft3 / max(A_ft2, 1e-12)


def acfm_from_FT_TP_psia(FT_lbmol_hr: float, T_C: float, P_abs_psia: float) -> float:
    n_lbmol_min = FT_lbmol_hr / 60.0
    T_R = (T_C + 273.15) * 9.0 / 5.0
    return n_lbmol_min * R_GAS_FT3_PSIA_PER_LBMOL_R * T_R / max(P_abs_psia, 1e-12)


def velocity_ft_s(acfm: float, diameter_ft: float) -> float:
    A_ft2 = math.pi * (diameter_ft ** 2) / 4.0
    v_ft_min = acfm / max(A_ft2, 1e-12)
    return v_ft_min / 60.0


def y_at_conversion(y0: Dict[str, float], X: float) -> Dict[str, float]:
    ySO2_0 = y0["SO2"]
    yO2_0  = y0["O2"]
    ySO3_0 = y0["SO3"]
    yN2_0  = y0["N2"]

    eps = DELTA * ySO2_0
    denom = 1.0 + eps * X

    ySO2 = ySO2_0 * (1 - X) / denom
    yO2  = (yO2_0 - 0.5 * ySO2_0 * X) / denom
    ySO3 = (ySO3_0 + ySO2_0 * X) / denom
    yN2  = yN2_0 / denom

    yO2 = max(yO2, 0.0)
    ySO2 = max(ySO2, 1e-30)
    ySO3 = max(ySO3, 1e-30)

    s = ySO2 + yO2 + ySO3 + yN2
    return {"SO2": ySO2/s, "O2": yO2/s, "SO3": ySO3/s, "N2": yN2/s}


def C_to_R(TC: float) -> float:
    return (TC + 273.15) * 9.0 / 5.0


def Kp_eklund(TC: float) -> float:
    TR = C_to_R(TC)
    return math.exp(42311.0 / (1.98 * TR) - 11.24)


def k_eff_eklund(TR: float) -> float:
    return math.exp(912.8 - 110.1 * math.log(TR) - 176008.0 / TR)


def eklund_rate(TC: float, X: float, P_atm: float, y0: Dict[str, float], a_eff: float) -> float:
    y = y_at_conversion(y0, X)
    pSO2 = max(y["SO2"] * P_atm, 1e-30)
    pSO3 = max(y["SO3"] * P_atm, 1e-30)
    pO2  = max(y["O2"]  * P_atm, 0.0)

    TR = C_to_R(TC)
    k = k_eff_eklund(TR)
    Kp = max(Kp_eklund(TC), 1e-30)

    driving = pO2 - (pSO3 / (pSO2 * Kp))**2
    if driving <= 0.0:
        return 0.0

    return a_eff * k * math.sqrt(pSO2 / pSO3) * driving


def Xeq_at_T(TC: float, P_atm: float, y0: Dict[str, float]) -> float:
    Kp = max(Kp_eklund(TC), 1e-30)

    def Qp(X: float) -> float:
        y = y_at_conversion(y0, X)
        pSO3 = y["SO3"] * P_atm
        pSO2 = max(y["SO2"] * P_atm, 1e-30)
        pO2  = y["O2"] * P_atm
        if pO2 <= 1e-30:
            return 1e300
        return pSO3 / (pSO2 * math.sqrt(pO2))

    XL, XR = 0.0, 0.999
    fL = Qp(XL) - Kp
    fR = Qp(XR) - Kp
    if fL >= 0:
        return 0.0
    if fR <= 0:
        return XR

    for _ in range(80):
        XM = 0.5*(XL+XR)
        fM = Qp(XM) - Kp
        if abs(fM) < 1e-10:
            return XM
        if fM < 0:
            XL = XM
        else:
            XR = XM
    return 0.5*(XL+XR)


def catalyst_weight_lb(liters: float, bulk_density_kg_m3: float) -> float:
    kg = liters * 1e-3 * bulk_density_kg_m3
    return kg * 2.20462


def ergun_dP_dL_psi_per_ft(epsilon: float, phi: float, dp_m: float,
                          mu_pa_s: float, rho_kg_m3: float, u_ft_s: float) -> float:
    """SI Ergun internally -> psi/ft out."""
    u_m_s = u_ft_s * 0.3048
    term1 = 150.0 * mu_pa_s * u_m_s * (1 - epsilon)**2 / (phi**2 * dp_m**2 * epsilon**3)
    term2 = 1.75  * rho_kg_m3 * u_m_s**2 * (1 - epsilon)     / (phi    * dp_m    * epsilon**3)
    dP_dL_Pa_per_m = term1 + term2

    PA_PER_PSI = 6894.757
    M_PER_FT = 0.3048
    return (dP_dL_Pa_per_m / PA_PER_PSI) * M_PER_FT


@dataclass
class CatalystProps:
    name: str
    void_fraction: float
    sphericity: float
    diameter_mm: float
    bulk_density_kg_m3: float
    activity_fresh: float


@dataclass
class BedSegment:
    name: str
    catalyst: CatalystProps
    liters: float
    activity_percent: float
    Tin_C: float
    Pin_abs_psia: float
    FT0_lbmol_hr: float
    y0: Dict[str, float]
    diameter_ft: float
    n_steps: int = 100


@dataclass
class SegmentResult:
    T_C: np.ndarray
    X: np.ndarray
    P_psia: np.ndarray
    Xeq: np.ndarray


def rk4_segment(
    seg: BedSegment,
    mu_func: Callable[[Dict[str, float], float], float],
    rho_func: Callable[[Dict[str, float], float, float], float],
) -> SegmentResult:
    n = seg.n_steps
    W_total = catalyst_weight_lb(seg.liters, seg.catalyst.bulk_density_kg_m3)
    dW = W_total / max(n, 1)

    T = np.zeros(n+1)
    X = np.zeros(n+1)
    P = np.zeros(n+1)
    Xeq = np.zeros(n+1)

    T[0] = seg.Tin_C
    X[0] = 0.0
    P[0] = seg.Pin_abs_psia
    Xeq[0] = Xeq_at_T(T[0], psia_to_atm(P[0]), seg.y0)

    a_eff = seg.catalyst.activity_fresh * (max(seg.activity_percent, 0.0) / 100.0)

    ySO2_0 = max(seg.y0["SO2"], 1e-12)
    F_T0 = max(seg.FT0_lbmol_hr, 1e-12)
    F_SO2_0 = max(F_T0 * ySO2_0, 1e-12)

    # energy (still adiabatic)
    dHrxn_J_per_molSO2 = -99000.0

    def cp_mix_J_molK(_TK: float) -> float:
        # placeholder Cp mix, swap later
        Cp = {"SO2":45.0, "SO3":60.0, "O2":36.0, "N2":35.0}
        return sum(seg.y0[k] * Cp[k] for k in Cp)

    def deriv(TC: float, Xc: float, Ppsia: float) -> Tuple[float, float, float]:
        P_atm = psia_to_atm(Ppsia)

        Xeq_local = Xeq_at_T(TC, P_atm, seg.y0)
        r = 0.0 if Xc >= Xeq_local else eklund_rate(TC, Xc, P_atm, seg.y0, a_eff)
        dX_dW = r / F_SO2_0

        TK = TC + 273.15
        Cp = max(cp_mix_J_molK(TK), 1e-9)
        FT_mol_s = F_T0 * 453.59237 / 3600.0  # lbmol/hr -> mol/s
        dT_dW = (-(dHrxn_J_per_molSO2) * r) / max(FT_mol_s * Cp, 1e-12)

        y_local = y_at_conversion(seg.y0, Xc)
        mu = mu_func(y_local, TC)
        rho = rho_func(y_local, TC, Ppsia)

        acfm = acfm_from_FT_TP_psia(seg.FT0_lbmol_hr, TC, Ppsia)
        ufts = velocity_ft_s(acfm, seg.diameter_ft)

        eps = seg.catalyst.void_fraction
        phi = seg.catalyst.sphericity
        dp_m = seg.catalyst.diameter_mm / 1000.0
        dP_dL = ergun_dP_dL_psi_per_ft(eps, phi, dp_m, mu, rho, ufts)

        L_ft = bed_depth_ft_from_liters(seg.liters, seg.diameter_ft)
        dL_dW = L_ft / max(W_total, 1e-12)
        dP_dW = -dP_dL * dL_dW

        return dT_dW, dX_dW, dP_dW

    for i in range(n):
        T0, X0, P0 = T[i], X[i], P[i]

        k1T, k1X, k1P = deriv(T0, X0, P0)
        k2T, k2X, k2P = deriv(T0 + 0.5*dW*k1T, X0 + 0.5*dW*k1X, P0 + 0.5*dW*k1P)
        k3T, k3X, k3P = deriv(T0 + 0.5*dW*k2T, X0 + 0.5*dW*k2X, P0 + 0.5*dW*k2P)
        k4T, k4X, k4P = deriv(T0 + dW*k3T, X0 + dW*k3X, P0 + dW*k3P)

        T[i+1] = T0 + (dW/6.0)*(k1T + 2*k2T + 2*k3T + k4T)
        X[i+1] = max(0.0, min(0.999, X0 + (dW/6.0)*(k1X + 2*k2X + 2*k3X + k4X)))
        P[i+1] = max(0.01, P0 + (dW/6.0)*(k1P + 2*k2P + 2*k3P + k4P))

        Xeq[i+1] = Xeq_at_T(T[i+1], psia_to_atm(P[i+1]), seg.y0)

    return SegmentResult(T_C=T, X=X, P_psia=P, Xeq=Xeq)
`;

const catalyticReactorSimulationCode = `# Catalytic Reactor Stand-Alone Simulation
# Backend Python-equivalent code for SO2 → SO3 conversion calculations
# This simulation uses first-principles kinetics and thermodynamics

import numpy as np

# ============================================================================
# CATALYST BULK DENSITY DATABASE (Kg/m³)
# ============================================================================
CATALYST_BULK_DENSITIES = {
    "Topsoe VK69": 800,
    "MECS Super Gear XLP-310": 815,
    "MECS GR330": 865,
    "MECS GR330C": 865,
}

# Unit conversion constants
KG_TO_LBS = 2.20462
INCHES_WC_TO_PSI = 1 / 27.68  # 1 psi = 27.68 inches water column
ATM_TO_PSIA = 14.696          # 1 atm = 14.696 psia
NM3H_TO_SCFM = 35.315 / 60    # Nm³/h to scfm (at 0°C, 1 atm)
T_STD_RANKINE = 459.67        # 0°C in Rankine


# ============================================================================
# CATALYST WEIGHT CALCULATION
# ============================================================================
def calculate_catalyst_weight(catalyst_loadings: list, catalyst_types: list) -> dict:
    """
    Calculate the weight of catalyst in each pass.
    
    Formula: Catalyst Mass (Kg) = Catalyst Load (Liters) × Bulk Density (Kg/m³) / 1000
    Note: Division by 1000 converts liters to m³ (1 m³ = 1000 liters)
    
    Parameters:
        catalyst_loadings: Array of 8 values [P1A, P1B, P2A, P2B, P3A, P3B, P4A, P4B]
        catalyst_types: Array of 8 catalyst type names
    
    Returns:
        Dictionary with weights in Kg and lbs for each pass and totals
    """
    passes = []
    total_kg = 0
    total_lbs = 0
    
    for i in range(4):
        idx_a = i * 2
        idx_b = i * 2 + 1
        
        # Type A catalyst
        bulk_density_a = CATALYST_BULK_DENSITIES.get(catalyst_types[idx_a], 0)
        mass_kg_a = catalyst_loadings[idx_a] * bulk_density_a / 1000
        mass_lbs_a = mass_kg_a * KG_TO_LBS
        
        # Type B catalyst
        bulk_density_b = CATALYST_BULK_DENSITIES.get(catalyst_types[idx_b], 0)
        mass_kg_b = catalyst_loadings[idx_b] * bulk_density_b / 1000
        mass_lbs_b = mass_kg_b * KG_TO_LBS
        
        pass_total_kg = mass_kg_a + mass_kg_b
        pass_total_lbs = mass_lbs_a + mass_lbs_b
        
        passes.append({
            "typeA": {"massKg": mass_kg_a, "massLbs": mass_lbs_a},
            "typeB": {"massKg": mass_kg_b, "massLbs": mass_lbs_b},
            "total": {"massKg": pass_total_kg, "massLbs": pass_total_lbs}
        })
        
        total_kg += pass_total_kg
        total_lbs += pass_total_lbs
    
    return {
        "passes": passes,
        "totals": {"massKg": total_kg, "massLbs": total_lbs}
    }


# ============================================================================
# REACTOR FLOW CALCULATIONS
# ============================================================================
def calculate_reactor_flow(
    gas_flow_nm3h: float,
    temperature_c: float,
    pressure_in_wc: float,
    p_barometric_atm: float,
    target_velocity_fpm: float = None
) -> dict:
    """
    Calculate reactor volumetric flow rate and optionally reactor diameter.
    
    Converts gas flow from standard conditions (Nm³/h at 0°C, 1 atm) to
    actual volumetric flow (acfm) at process temperature and pressure.
    """
    # Step 1: Convert pressure to consistent units
    pressure_psig = pressure_in_wc * INCHES_WC_TO_PSI
    pressure_psia = p_barometric_atm * ATM_TO_PSIA + pressure_psig
    pressure_atm = pressure_psia / ATM_TO_PSIA
    
    # Step 2: Convert temperature to Kelvin and Rankine
    temperature_k = temperature_c + 273.15
    temperature_r = temperature_k * 9/5
    
    # Step 3: Convert standard flow to scfm
    scfm_dry = gas_flow_nm3h * NM3H_TO_SCFM
    
    # Step 4: Apply ideal gas law correction for actual conditions
    # ACFM = SCFM × (T_actual / T_std) × (P_std / P_actual)
    volumetric_flow_acfm = scfm_dry * (temperature_r / T_STD_RANKINE) * (1.0 / pressure_atm)
    
    result = {
        "pressurePsig": pressure_psig,
        "pressurePsia": pressure_psia,
        "pressureAtm": pressure_atm,
        "temperatureK": temperature_k,
        "temperatureR": temperature_r,
        "scfmDry": scfm_dry,
        "volumetricFlowACFM": volumetric_flow_acfm
    }
    
    # Step 5: Calculate reactor diameter if velocity is specified
    if target_velocity_fpm:
        reactor_area_ft2 = volumetric_flow_acfm / target_velocity_fpm
        reactor_diameter_ft = np.sqrt(4 * reactor_area_ft2 / np.pi)
        
        result.update({
            "reactorAreaFt2": reactor_area_ft2,
            "reactorDiameterFt": reactor_diameter_ft,
            "reactorDiameterIn": reactor_diameter_ft * 12,
            "reactorDiameterM": reactor_diameter_ft * 0.3048,
            "actualVelocityFPM": volumetric_flow_acfm / reactor_area_ft2
        })
    
    return result


# ============================================================================
# SO2 CONVERSION EQUILIBRIUM CALCULATION
# ============================================================================
def calculate_equilibrium_conversion(temperature_c: float, so2_inlet: float, o2_inlet: float) -> float:
    """
    Calculate equilibrium conversion for SO2 + 0.5 O2 → SO3 reaction.
    
    Uses the van't Hoff equation and equilibrium constant correlation
    for the sulfur dioxide oxidation reaction.
    
    Parameters:
        temperature_c: Catalyst bed temperature in °C
        so2_inlet: Inlet SO2 concentration (mole fraction)
        o2_inlet: Inlet O2 concentration (mole fraction)
    
    Returns:
        Equilibrium conversion as percentage
    """
    T = temperature_c + 273.15  # Convert to Kelvin
    
    # Equilibrium constant correlation (empirical)
    # ln(Kp) = A/T + B*ln(T) + C*T + D
    A = 11168.0
    B = -1.268
    C = -0.00121
    D = -10.68
    
    ln_Kp = A/T + B*np.log(T) + C*T + D
    Kp = np.exp(ln_Kp)
    
    # Solve equilibrium using stoichiometry
    # At equilibrium: Kp = (pSO3) / (pSO2 * pO2^0.5)
    # Iterative solution for conversion
    conversion = 0.95  # Initial guess
    
    for _ in range(50):
        so2_eq = so2_inlet * (1 - conversion)
        so3_eq = so2_inlet * conversion
        o2_eq = o2_inlet - 0.5 * so2_inlet * conversion
        
        if o2_eq <= 0:
            break
            
        Kp_calc = so3_eq / (so2_eq * np.sqrt(o2_eq))
        
        if Kp_calc < Kp:
            conversion += 0.001
        else:
            conversion -= 0.0001
    
    return min(conversion * 100, 99.99)


# ============================================================================
# PRESSURE DROP CALCULATION (Ergun Equation)
# ============================================================================
def calculate_pressure_drop(
    gas_velocity_fpm: float,
    bed_depth_m: float,
    catalyst_diameter_m: float = 0.012,
    bed_voidage: float = 0.45,
    gas_viscosity: float = 3.5e-5,
    gas_density: float = 0.8
) -> float:
    """
    Calculate pressure drop through catalyst bed using Ergun equation.
    
    ΔP/L = 150 * μ * (1-ε)² / (dp² * ε³) * U + 1.75 * ρ * (1-ε) / (dp * ε³) * U²
    
    Returns:
        Pressure drop in inches of water column
    """
    U = gas_velocity_fpm * 0.00508  # Convert fpm to m/s
    dp = catalyst_diameter_m
    epsilon = bed_voidage
    mu = gas_viscosity
    rho = gas_density
    L = bed_depth_m
    
    # Ergun equation terms
    term1 = 150 * mu * (1 - epsilon)**2 / (dp**2 * epsilon**3) * U
    term2 = 1.75 * rho * (1 - epsilon) / (dp * epsilon**3) * U**2
    
    delta_p_pa = (term1 + term2) * L
    delta_p_in_wc = delta_p_pa / 249.089  # Convert Pa to inches WC
    
    return delta_p_in_wc


# ============================================================================
# EMISSIONS CALCULATION
# ============================================================================
def calculate_emissions(
    overall_conversion: float,
    so2_inlet_percent: float,
    plant_rate_stpd: float
) -> dict:
    """
    Calculate stack emissions in various units.
    
    Parameters:
        overall_conversion: Overall SO2 conversion (0-1)
        so2_inlet_percent: Inlet SO2 concentration (%)
        plant_rate_stpd: Acid production rate (short tons per day)
    
    Returns:
        Dictionary with emissions in lbSO2/ST, KgSO2/MT, and ppmv
    """
    unconverted_fraction = 1 - overall_conversion
    
    # Emission factor calculation
    # Based on stoichiometry: 1 ton H2SO4 requires ~0.65 tons SO2
    so2_factor = 0.653
    
    lb_so2_st = unconverted_fraction * so2_factor * 2000 / plant_rate_stpd
    kg_so2_mt = lb_so2_st * 0.453592 / 0.907185
    
    # ppmv calculation from outlet concentration
    so2_outlet_percent = so2_inlet_percent * unconverted_fraction
    ppmv = so2_outlet_percent * 10000  # Convert % to ppmv
    
    return {
        "lbSO2ST": round(lb_so2_st, 2),
        "kgSO2MT": round(kg_so2_mt, 2),
        "ppmv": round(ppmv, 0)
    }


# ============================================================================
# MAIN SIMULATION FUNCTION
# ============================================================================
def run_catalytic_reactor_simulation(
    gas_composition: dict,
    process_inputs: dict,
    catalyst_config: dict
) -> dict:
    """
    Run the complete catalytic reactor simulation.
    
    This function orchestrates all sub-calculations to produce
    comprehensive simulation results including:
    - Pass-by-pass conversions
    - Pressure drops
    - Emissions
    - Reactor sizing
    - Catalyst loading matrix
    """
    # Extract inputs
    so2_pct = gas_composition["so2Percent"]
    o2_pct = gas_composition["o2Percent"]
    plant_rate = process_inputs["plantRate"]
    inlet_velocity = process_inputs["pass1InletVelocity"]
    
    # Calculate reactor flow and sizing
    flow_results = calculate_reactor_flow(
        gas_flow_nm3h=plant_rate * 1000,  # Approximate
        temperature_c=process_inputs["pass1InletTemp"],
        pressure_in_wc=process_inputs["pass1InletPres"],
        p_barometric_atm=gas_composition["pBarr"],
        target_velocity_fpm=inlet_velocity
    )
    
    # Calculate pass conversions
    pass_conversions = {}
    cumulative_conversion = 0
    temps = [
        process_inputs["pass1InletTemp"],
        process_inputs["pass2InletTemp"],
        process_inputs["pass3InletTemp"],
        process_inputs["pass4InletTemp"]
    ]
    
    for i, temp in enumerate(temps, 1):
        eq_conv = calculate_equilibrium_conversion(temp, so2_pct/100, o2_pct/100)
        pass_conv = eq_conv * 0.85  # Approach to equilibrium factor
        cumulative_conversion += pass_conv * (1 - cumulative_conversion/100)
        
        pass_conversions[f"pass{i}"] = {
            "conversion": round(pass_conv, 2),
            "overall": round(cumulative_conversion, 2),
            "equilibrium": round(eq_conv, 2)
        }
    
    # Calculate emissions
    emissions = calculate_emissions(
        cumulative_conversion / 100,
        so2_pct,
        plant_rate
    )
    
    return {
        "passConversions": pass_conversions,
        "emissions": emissions,
        "converterDiameter": {
            "ft": round(flow_results.get("reactorDiameterFt", 0), 2),
            "m": round(flow_results.get("reactorDiameterM", 0), 2)
        },
        "flowCalculations": flow_results
    }


if __name__ == "__main__":
    # Example usage
    result = run_catalytic_reactor_simulation(
        gas_composition={
            "so2Percent": 11.3,
            "so3Percent": 0.2,
            "o2Percent": 9.5,
            "co2Percent": 0,
            "n2Percent": 79,
            "pBarr": 0.85,
            "ipatSo3Removal": 100
        },
        process_inputs={
            "plantRate": 2480,
            "pass1InletVelocity": 145,
            "pass1InletTemp": 390,
            "pass2InletTemp": 420,
            "pass3InletTemp": 440,
            "pass4InletTemp": 390,
            "pass1InletPres": 150,
            "pass2InletPres": 135,
            "pass3InletPres": 100,
            "pass4InletPres": 60
        },
        catalyst_config={}
    )
    print(result)
`;

const pythonCodeFiles = [
  {
    id: "main-py",
    title: "main.py",
    description: "Converter simulation with full pass datasets, RK4 integration, Wilke viscosity mixing, ideal gas density, and X-T diagram output. Includes inline UI Output dataclasses (PassPoint, PassSummary, ConverterSummary, XTPlotData, ConverterUIOutput).",
    code: mainPyCode,
  },
  {
    id: "rk-solver-py",
    title: "rk_solver.py",
    description: "RK4 numerical solver for plug-flow SO2→SO3 adiabatic bed with Ergun pressure drop. Includes Eklund kinetics, equilibrium conversion, and catalyst weight calculations.",
    code: rkSolverPyCode,
  },
  {
    id: "ui-input-storage",
    title: "UI Input Storage",
    description: "Python data structures for all UI input fields including catalyst configuration, gas composition, and process parameters.",
    code: uiInputStoragePythonCode,
  },
  {
    id: "catalytic-reactor-simulation",
    title: "Catalytic Reactor Simulation",
    description: "First-principles Python code for SO2 to SO3 conversion calculations, including equilibrium, pressure drop, Ergun equation, and emissions calculations.",
    code: catalyticReactorSimulationCode,
  },
];

// Helper function to format numbers with commas
const formatNumber = (value: number | string): string => {
  if (value === "--" || value === null || value === undefined) return "--";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "--";
  return num.toLocaleString();
};

export default function CatalyticReactor() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { state: sessionState, updateMultipleStates, getStateValue, isInitialized, sessionId } = useSession();
  const { isConnected: wsConnected, subscribe } = useSessionWebSocket();
  
  // Simulation mode state
  type SimulationMode = "design" | "static" | "dynamic";
  const [simulationMode, setSimulationMode] = useState<SimulationMode>("design");

  // Catalyst configuration state (existing)
  const [pass1Type1, setPass1Type1] = useState("MECS GR330");
  const [pass1Liters1, setPass1Liters1] = useState("12.0");
  const [pass1Activity1, setPass1Activity1] = useState("100.00");
  const [pass1Type2, setPass1Type2] = useState("MECS GR330");
  const [pass1Liters2, setPass1Liters2] = useState("24");
  const [pass1Activity2, setPass1Activity2] = useState("100.0");
  
  const [pass2Type1, setPass2Type1] = useState("MECS Super Gear XLP-310");
  const [pass2Liters1, setPass2Liters1] = useState("40.0");
  const [pass2Activity1, setPass2Activity1] = useState("100.00");
  
  const [pass3Type1, setPass3Type1] = useState("MECS Super Gear XLP-310");
  const [pass3Liters1, setPass3Liters1] = useState("45.0");
  const [pass3Activity1, setPass3Activity1] = useState("100.00");
  
  const [pass4Type1, setPass4Type1] = useState("MECS Super Gear XLP-310");
  const [pass4Liters1, setPass4Liters1] = useState("25.0");
  const [pass4Activity1, setPass4Activity1] = useState("100.00");
  const [pass4Type2, setPass4Type2] = useState("MECS GR330");
  const [pass4Liters2, setPass4Liters2] = useState("25.0");
  const [pass4Activity2, setPass4Activity2] = useState("100.00");

  // Simulation Input State - Pass 1 Inlet Gas Composition
  const [so2Percent, setSo2Percent] = useState("11.3");
  const [so3Percent, setSo3Percent] = useState("0.2");
  const [o2Percent, setO2Percent] = useState("9.5");
  const [co2Percent, setCo2Percent] = useState("0");
  const [n2Percent, setN2Percent] = useState("79");
  const [totalPercent, setTotalPercent] = useState("");
  const [pBarr, setPBarr] = useState("0.85");
  const [ipatSo3Removal, setIpatSo3Removal] = useState("100");

  // Simulation Input State - Process Inputs
  const [sizingMode, setSizingMode] = useState<"velocity" | "fixed">("velocity");
  const [plantRate, setPlantRate] = useState("2,480");
  const [pass1InletVelocity, setPass1InletVelocity] = useState("145");
  const [converterDiameter, setConverterDiameter] = useState("42.0");
  const [pass1InletTemp, setPass1InletTemp] = useState("390");
  const [pass2InletTemp, setPass2InletTemp] = useState("420");
  const [pass3InletTemp, setPass3InletTemp] = useState("440");
  const [pass4InletTemp, setPass4InletTemp] = useState("390");
  const [pass1InletPres, setPass1InletPres] = useState("150");
  const [pass2InletPres, setPass2InletPres] = useState("135");
  const [pass3InletPres, setPass3InletPres] = useState("100");
  const [pass4InletPres, setPass4InletPres] = useState("60");

  // Area filter for Input Variables section
  type AreaFilter = "all" | "gasComposition" | "processInputs" | "catalystPass1" | "catalystPass2" | "catalystPass3" | "catalystPass4";
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("all");

  // Simulation Output State
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [xtDiagramData, setXtDiagramData] = useState<any>(null);

  // Get stable reference to reactor state
  const reactorStateStr = useMemo(() => {
    const rs = sessionState['catalytic-reactor'];
    return rs ? JSON.stringify(rs) : '';
  }, [sessionState]);

  // Load state from session on mount and when session state changes
  useEffect(() => {
    if (!isInitialized || !reactorStateStr) return;
    
    try {
      const state = JSON.parse(reactorStateStr) as Record<string, string>;
      if (state.so2Percent !== undefined) setSo2Percent(state.so2Percent);
      if (state.so3Percent !== undefined) setSo3Percent(state.so3Percent);
      if (state.o2Percent !== undefined) setO2Percent(state.o2Percent);
      if (state.co2Percent !== undefined) setCo2Percent(state.co2Percent);
      if (state.n2Percent !== undefined) setN2Percent(state.n2Percent);
      if (state.pBarr !== undefined) setPBarr(state.pBarr);
      if (state.ipatSo3Removal !== undefined) setIpatSo3Removal(state.ipatSo3Removal);
      if (state.plantRate !== undefined) setPlantRate(state.plantRate);
      if (state.pass1InletVelocity !== undefined) setPass1InletVelocity(state.pass1InletVelocity);
      if (state.pass1InletTemp !== undefined) setPass1InletTemp(state.pass1InletTemp);
      if (state.pass2InletTemp !== undefined) setPass2InletTemp(state.pass2InletTemp);
      if (state.pass3InletTemp !== undefined) setPass3InletTemp(state.pass3InletTemp);
      if (state.pass4InletTemp !== undefined) setPass4InletTemp(state.pass4InletTemp);
      if (state.pass1InletPres !== undefined) setPass1InletPres(state.pass1InletPres);
      if (state.pass2InletPres !== undefined) setPass2InletPres(state.pass2InletPres);
      if (state.pass3InletPres !== undefined) setPass3InletPres(state.pass3InletPres);
      if (state.pass4InletPres !== undefined) setPass4InletPres(state.pass4InletPres);
      if (state.pass1Type1 !== undefined) setPass1Type1(state.pass1Type1);
      if (state.pass1Liters1 !== undefined) setPass1Liters1(state.pass1Liters1);
      if (state.pass1Activity1 !== undefined) setPass1Activity1(state.pass1Activity1);
      if (state.pass2Type1 !== undefined) setPass2Type1(state.pass2Type1);
      if (state.pass2Liters1 !== undefined) setPass2Liters1(state.pass2Liters1);
      if (state.pass2Activity1 !== undefined) setPass2Activity1(state.pass2Activity1);
      if (state.pass3Type1 !== undefined) setPass3Type1(state.pass3Type1);
      if (state.pass3Liters1 !== undefined) setPass3Liters1(state.pass3Liters1);
      if (state.pass3Activity1 !== undefined) setPass3Activity1(state.pass3Activity1);
      if (state.pass4Type1 !== undefined) setPass4Type1(state.pass4Type1);
      if (state.pass4Liters1 !== undefined) setPass4Liters1(state.pass4Liters1);
      if (state.pass4Activity1 !== undefined) setPass4Activity1(state.pass4Activity1);
      if (state.pass1Type2 !== undefined) setPass1Type2(state.pass1Type2);
      if (state.pass1Liters2 !== undefined) setPass1Liters2(state.pass1Liters2);
      if (state.pass4Type2 !== undefined) setPass4Type2(state.pass4Type2);
      if (state.pass4Liters2 !== undefined) setPass4Liters2(state.pass4Liters2);
      if (state.pass1Activity2 !== undefined) setPass1Activity2(state.pass1Activity2);
      if (state.pass4Activity2 !== undefined) setPass4Activity2(state.pass4Activity2);
    } catch (e) {
      console.warn('Failed to parse reactor state:', e);
    }
  }, [isInitialized, reactorStateStr]);

  // Sync state to session when inputs change
  useEffect(() => {
    if (!isInitialized) return;
    
    const timer = setTimeout(() => {
      updateMultipleStates({
        'catalytic-reactor': {
          so2Percent, so3Percent, o2Percent, co2Percent, n2Percent, pBarr, ipatSo3Removal,
          plantRate, pass1InletVelocity, pass1InletTemp, pass2InletTemp, pass3InletTemp, pass4InletTemp,
          pass1InletPres, pass2InletPres, pass3InletPres, pass4InletPres,
          pass1Type1, pass1Liters1, pass1Activity1, pass2Type1, pass2Liters1, pass2Activity1,
          pass3Type1, pass3Liters1, pass3Activity1, pass4Type1, pass4Liters1, pass4Activity1,
          pass1Type2, pass1Liters2, pass1Activity2, pass4Type2, pass4Liters2, pass4Activity2,
        }
      });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [
    isInitialized, so2Percent, so3Percent, o2Percent, co2Percent, n2Percent, pBarr, ipatSo3Removal,
    plantRate, pass1InletVelocity, pass1InletTemp, pass2InletTemp, pass3InletTemp, pass4InletTemp,
    pass1InletPres, pass2InletPres, pass3InletPres, pass4InletPres,
    pass1Type1, pass1Liters1, pass1Activity1, pass2Type1, pass2Liters1, pass2Activity1,
    pass3Type1, pass3Liters1, pass3Activity1, pass4Type1, pass4Liters1, pass4Activity1,
    pass1Type2, pass1Liters2, pass1Activity2, pass4Type2, pass4Liters2, pass4Activity2,
  ]);

  // Subscribe to WebSocket simulation results from other tabs
  useEffect(() => {
    if (!wsConnected) return;

    const unsubscribe = subscribe('SIMULATION_RESULTS', (message) => {
      if (message.data?.simulationType === 'catalytic-reactor' && message.data?.results) {
        setSimulationResults(message.data.results);
        
        // Also sync inputs from other tabs if provided
        if (message.data?.inputs) {
          const { gasComposition, processInputs, catalystConfig } = message.data.inputs;
          
          if (gasComposition) {
            if (gasComposition.so2Percent !== undefined) setSo2Percent(String(gasComposition.so2Percent));
            if (gasComposition.so3Percent !== undefined) setSo3Percent(String(gasComposition.so3Percent));
            if (gasComposition.o2Percent !== undefined) setO2Percent(String(gasComposition.o2Percent));
            if (gasComposition.co2Percent !== undefined) setCo2Percent(String(gasComposition.co2Percent));
            if (gasComposition.n2Percent !== undefined) setN2Percent(String(gasComposition.n2Percent));
            if (gasComposition.pBarr !== undefined) setPBarr(String(gasComposition.pBarr));
            if (gasComposition.ipatSo3Removal !== undefined) setIpatSo3Removal(String(gasComposition.ipatSo3Removal));
          }
          
          if (processInputs) {
            if (processInputs.plantRate !== undefined) setPlantRate(String(processInputs.plantRate).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
            if (processInputs.pass1InletVelocity !== undefined) setPass1InletVelocity(String(processInputs.pass1InletVelocity));
            if (processInputs.pass1InletTemp !== undefined) setPass1InletTemp(String(processInputs.pass1InletTemp));
            if (processInputs.pass2InletTemp !== undefined) setPass2InletTemp(String(processInputs.pass2InletTemp));
            if (processInputs.pass3InletTemp !== undefined) setPass3InletTemp(String(processInputs.pass3InletTemp));
            if (processInputs.pass4InletTemp !== undefined) setPass4InletTemp(String(processInputs.pass4InletTemp));
            if (processInputs.pass1InletPres !== undefined) setPass1InletPres(String(processInputs.pass1InletPres));
            if (processInputs.pass2InletPres !== undefined) setPass2InletPres(String(processInputs.pass2InletPres));
            if (processInputs.pass3InletPres !== undefined) setPass3InletPres(String(processInputs.pass3InletPres));
            if (processInputs.pass4InletPres !== undefined) setPass4InletPres(String(processInputs.pass4InletPres));
          }
        }
        
        toast({
          title: "Simulation Synced",
          description: "Simulation results received from another tab.",
        });
      }
    });

    return () => unsubscribe();
  }, [wsConnected, subscribe]);

  const catalystTypes = [
    " ",
    "Topsoe VK69",
    "MECS Super Gear XLP-310",
    "MECS GR330",
  ];

  // Calculate catalyst weights from loadings and types using bulk densities
  const catalystWeights = useMemo(() => {
    // Collect all loadings (liters) - handle simulation results matrix
    const matrix = simulationResults?.catalystLoadings?.matrix;
    if (!matrix) return null;
    
    // Get loadings from the matrix (4 passes, 2 types each)
    const catalystLoadings = [
      matrix[0]?.[0] || 0,  // Pass 1 Type A
      matrix[0]?.[1] || 0,  // Pass 1 Type B
      matrix[1]?.[0] || 0,  // Pass 2 Type A
      matrix[1]?.[1] || 0,  // Pass 2 Type B
      matrix[2]?.[0] || 0,  // Pass 3 Type A
      matrix[2]?.[1] || 0,  // Pass 3 Type B
      matrix[3]?.[0] || 0,  // Pass 4 Type A
      matrix[3]?.[1] || 0,  // Pass 4 Type B
    ];
    
    // Collect catalyst types for each position
    const catalystTypeList = [
      pass1Type1, pass1Type2,
      pass2Type1, pass2Type1,  // Pass 2 only has one type dropdown, use same for both
      pass3Type1, pass3Type1,  // Pass 3 only has one type dropdown
      pass4Type1, pass4Type2,
    ];
    
    return calculateCatalystWeight(catalystLoadings, catalystTypeList);
  }, [simulationResults, pass1Type1, pass1Type2, pass2Type1, pass3Type1, pass4Type1, pass4Type2]);

  // Mutation for running simulation
  const runSimulationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/catalytic-reactor-simulation", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setSimulationResults(data);
      toast({
        title: "Simulation Complete",
        description: "Reactor simulation completed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Simulation Error",
        description: error.message || "Failed to run simulation.",
        variant: "destructive",
      });
    },
  });

  // State for save case dialog
  const [showSaveCaseDialog, setShowSaveCaseDialog] = useState(false);
  const [caseName, setCaseName] = useState("");
  const [caseDescription, setCaseDescription] = useState("");

  // Mutation for saving as converter case
  const saveCaseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/converter-cases", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/converter-cases"] });
      toast({
        title: "Case Saved",
        description: "Current simulation parameters saved as a converter case.",
      });
      setShowSaveCaseDialog(false);
      setCaseName("");
      setCaseDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Save Error",
        description: error.message || "Failed to save case.",
        variant: "destructive",
      });
    },
  });

  const handleSaveCase = () => {
    if (!caseName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a case name.",
        variant: "destructive",
      });
      return;
    }

    // Structure matches the JSONB schema with nested parameters object
    const caseData = {
      name: caseName.trim(),
      description: caseDescription.trim() || null,
      parameters: {
        so2Percent,
        so3Percent,
        o2Percent,
        co2Percent,
        n2Percent,
        pBarr,
        ipatSo3Removal,
        plantRate: plantRate.replace(/,/g, ''),
        pass1InletVelocity,
        converterDiameter,
        pass1InletTemp,
        pass2InletTemp,
        pass3InletTemp,
        pass4InletTemp,
        pass1InletPres,
        pass2InletPres,
        pass3InletPres,
        pass4InletPres,
        pass1Type1,
        pass1Liters1,
        pass1Activity1,
        pass1Type2,
        pass1Liters2,
        pass1Activity2,
        pass2Type1,
        pass2Liters1,
        pass2Activity1,
        pass3Type1,
        pass3Liters1,
        pass3Activity1,
        pass4Type1,
        pass4Liters1,
        pass4Activity1,
        pass4Type2,
        pass4Liters2,
        pass4Activity2,
      },
    };

    saveCaseMutation.mutate(caseData);
  };

  // Mutation for X-T diagram generation
  const xtDiagramMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/catalytic-reactor-xt-diagram", data);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.xtDiagram) {
        setXtDiagramData(data.xtDiagram);
      } else if (data.error) {
        console.error("X-T Diagram computation error:", data.error);
        toast({
          title: "X-T Diagram Error",
          description: data.error || "Failed to generate X-T diagram.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("X-T Diagram Error:", error.message);
      toast({
        title: "X-T Diagram Error",
        description: error.message || "Failed to generate X-T diagram.",
        variant: "destructive",
      });
    },
  });

  const validateNumericInput = (value: string, fieldName: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast({
        title: "Validation Error",
        description: `${fieldName} cannot be empty.`,
        variant: "destructive",
      });
      return null;
    }
    const parsed = parseFloat(trimmed.replace(/,/g, ''));
    if (isNaN(parsed)) {
      toast({
        title: "Validation Error",
        description: `${fieldName} must be a valid number.`,
        variant: "destructive",
      });
      return null;
    }
    return parsed;
  };

  const handleRunSimulation = () => {
    // Validate all gas composition inputs
    const validatedSO2 = validateNumericInput(so2Percent, "SO2 %");
    if (validatedSO2 === null) return;
    
    const validatedSO3 = validateNumericInput(so3Percent, "SO3 %");
    if (validatedSO3 === null) return;
    
    const validatedO2 = validateNumericInput(o2Percent, "O2 %");
    if (validatedO2 === null) return;
    
    const validatedCO2 = validateNumericInput(co2Percent, "CO2 %");
    if (validatedCO2 === null) return;
    
    const validatedPBarr = validateNumericInput(pBarr, "P_Barr");
    if (validatedPBarr === null) return;
    
    const validatedIpatSo3 = validateNumericInput(ipatSo3Removal, "IPAT SO3 Removal");
    if (validatedIpatSo3 === null) return;

    // Validate N2% and Total% (optional fields that can be empty)
    let validatedN2 = 0;
    if (n2Percent.trim()) {
      const parsed = validateNumericInput(n2Percent, "N2 %");
      if (parsed === null) return;
      validatedN2 = parsed;
    }

    let validatedTotal = 0;
    if (totalPercent.trim()) {
      const parsed = validateNumericInput(totalPercent, "Total %");
      if (parsed === null) return;
      validatedTotal = parsed;
    }

    // Validate all process inputs
    const validatedPlantRate = validateNumericInput(plantRate, "Plant Rate");
    if (validatedPlantRate === null) return;
    
    const validatedPass1Velocity = validateNumericInput(pass1InletVelocity, "Pass 1 Inlet Velocity");
    if (validatedPass1Velocity === null) return;
    
    const validatedPass1Temp = validateNumericInput(pass1InletTemp, "Pass 1 Inlet Temp");
    if (validatedPass1Temp === null) return;
    
    const validatedPass2Temp = validateNumericInput(pass2InletTemp, "Pass 2 Inlet Temp");
    if (validatedPass2Temp === null) return;
    
    const validatedPass3Temp = validateNumericInput(pass3InletTemp, "Pass 3 Inlet Temp");
    if (validatedPass3Temp === null) return;
    
    const validatedPass4Temp = validateNumericInput(pass4InletTemp, "Pass 4 Inlet Temp");
    if (validatedPass4Temp === null) return;
    
    const validatedPass1Pres = validateNumericInput(pass1InletPres, "Pass 1 Inlet Pres");
    if (validatedPass1Pres === null) return;
    
    const validatedPass2Pres = validateNumericInput(pass2InletPres, "Pass 2 Inlet Pres");
    if (validatedPass2Pres === null) return;
    
    const validatedPass3Pres = validateNumericInput(pass3InletPres, "Pass 3 Inlet Pres");
    if (validatedPass3Pres === null) return;
    
    const validatedPass4Pres = validateNumericInput(pass4InletPres, "Pass 4 Inlet Pres");
    if (validatedPass4Pres === null) return;

    // Validate catalyst parameters
    const validatedPass1Liters1 = validateNumericInput(pass1Liters1, "Pass 1 Catalyst Loading");
    if (validatedPass1Liters1 === null) return;
    
    const validatedPass1Activity1 = validateNumericInput(pass1Activity1, "Pass 1 Activity");
    if (validatedPass1Activity1 === null) return;
    
    const validatedPass2Liters1 = validateNumericInput(pass2Liters1, "Pass 2 Catalyst Loading");
    if (validatedPass2Liters1 === null) return;
    
    const validatedPass2Activity1 = validateNumericInput(pass2Activity1, "Pass 2 Activity");
    if (validatedPass2Activity1 === null) return;
    
    const validatedPass3Liters1 = validateNumericInput(pass3Liters1, "Pass 3 Catalyst Loading");
    if (validatedPass3Liters1 === null) return;
    
    const validatedPass3Activity1 = validateNumericInput(pass3Activity1, "Pass 3 Activity");
    if (validatedPass3Activity1 === null) return;
    
    const validatedPass4Liters1 = validateNumericInput(pass4Liters1, "Pass 4 Catalyst Loading");
    if (validatedPass4Liters1 === null) return;
    
    const validatedPass4Activity1 = validateNumericInput(pass4Activity1, "Pass 4 Activity");
    if (validatedPass4Activity1 === null) return;

    const inputData = {
      gasComposition: {
        so2Percent: validatedSO2,
        so3Percent: validatedSO3,
        o2Percent: validatedO2,
        co2Percent: validatedCO2,
        n2Percent: validatedN2,
        totalPercent: validatedTotal,
        pBarr: validatedPBarr,
        ipatSo3Removal: validatedIpatSo3,
      },
      processInputs: {
        plantRate: validatedPlantRate,
        pass1InletVelocity: validatedPass1Velocity,
        pass1InletTemp: validatedPass1Temp,
        pass2InletTemp: validatedPass2Temp,
        pass3InletTemp: validatedPass3Temp,
        pass4InletTemp: validatedPass4Temp,
        pass1InletPres: validatedPass1Pres,
        pass2InletPres: validatedPass2Pres,
        pass3InletPres: validatedPass3Pres,
        pass4InletPres: validatedPass4Pres,
        converterDiameter: parseFloat(converterDiameter) || 42.0,
      },
      catalystConfig: {
        pass1Type1,
        pass1Liters1: validatedPass1Liters1,
        pass1Activity1: validatedPass1Activity1,
        pass1Type2,
        pass1Liters2: parseFloat(pass1Liters2) || 0,
        pass1Activity2: parseFloat(pass1Activity2) || 100,
        pass2Type1,
        pass2Liters1: validatedPass2Liters1,
        pass2Activity1: validatedPass2Activity1,
        pass3Type1,
        pass3Liters1: validatedPass3Liters1,
        pass3Activity1: validatedPass3Activity1,
        pass4Type1,
        pass4Liters1: validatedPass4Liters1,
        pass4Activity1: validatedPass4Activity1,
        pass4Type2,
        pass4Liters2: parseFloat(pass4Liters2) || 40,
        pass4Activity2: parseFloat(pass4Activity2) || 100,
      },
      sessionId,
    };
    runSimulationMutation.mutate(inputData);
    
    // Also run X-T diagram generation with flat data format
    const xtInputData = {
      pass1Type1,
      pass1Liters1: validatedPass1Liters1,
      pass1Activity1: validatedPass1Activity1,
      pass1Type2,
      pass1Liters2: parseFloat(pass1Liters2) || 0,
      pass1Activity2: parseFloat(pass1Activity2) || 100,
      pass2Type1,
      pass2Liters1: validatedPass2Liters1,
      pass2Activity1: validatedPass2Activity1,
      pass3Type1,
      pass3Liters1: validatedPass3Liters1,
      pass3Activity1: validatedPass3Activity1,
      pass4Type1,
      pass4Liters1: validatedPass4Liters1,
      pass4Activity1: validatedPass4Activity1,
      pass4Type2,
      pass4Liters2: parseFloat(pass4Liters2) || 0,
      pass4Activity2: parseFloat(pass4Activity2) || 100,
      so2Percent: validatedSO2,
      so3Percent: validatedSO3,
      o2Percent: validatedO2,
      co2Percent: validatedCO2,
      n2Percent: validatedN2,
      pBarr: validatedPBarr,
      ipatSo3Removal: validatedIpatSo3,
      plantRate: validatedPlantRate,
      pass1InletVelocity: validatedPass1Velocity,
      converterDiameter: parseFloat(converterDiameter) || 42,
      pass1InletTemp: validatedPass1Temp,
      pass2InletTemp: validatedPass2Temp,
      pass3InletTemp: validatedPass3Temp,
      pass4InletTemp: validatedPass4Temp,
      pass1InletPres: validatedPass1Pres,
      pass2InletPres: validatedPass2Pres,
      pass3InletPres: validatedPass3Pres,
      pass4InletPres: validatedPass4Pres,
    };
    xtDiagramMutation.mutate(xtInputData);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/unit-operation-simulator")}
              data-testid="button-back-unit-ops"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
          <SessionHeader />
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-semibold text-foreground">Converter Simulator</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" className="ml-4" data-testid="dropdown-simulation-mode">
                    {simulationMode === "design" ? "Converter Design Mode" : simulationMode === "static" ? "Static Simulation Mode" : "Dynamic Simulation Mode"}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem 
                    onClick={() => setSimulationMode("design")}
                    data-testid="menu-item-design"
                  >
                    Converter Design Mode
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSimulationMode("static")}
                    data-testid="menu-item-static"
                  >
                    Static Simulation Mode
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSimulationMode("dynamic")}
                    data-testid="menu-item-dynamic"
                  >
                    Dynamic Simulation Mode
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed max-w-5xl">
              Configure the catalytic reactor and catalyst (vanadium pentoxide on diatoms) parameters, including number of catalyst beds, 
              catalyst activities (catalyst can deactivate over time), catalyst loading & types, pressure drop parameters, 
              etc. These settings directly affect SO₂ → SO₃ conversion efficiency, pressure drop, and acid plant production.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <Button 
                  variant="default"
                  onClick={() => setLocation("/catalyst-parameter-database")}
                  data-testid="button-catalyst-parameter-database"
                >
                  Catalyst Parameter Database
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/converter-cases")}
                  data-testid="button-converter-cases"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Converter Cases
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowSaveCaseDialog(true)}
                  data-testid="button-save-case"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Case
                </Button>
                <PythonCodeDropdown files={pythonCodeFiles} />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button 
                  variant="default"
                  onClick={() => setLocation("/simulation-operating-instructions")}
                  data-testid="button-simulation-instructions"
                >
                  Simulation Operating Instructions
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" data-testid="button-technical-papers">
                      Technical Papers & Reference Documentation
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[400px]">
                    <DropdownMenuItem 
                      onClick={() => window.open("/attached_assets/cep_so2_oxidation_1950_1768945307183.pdf", "_blank")}
                      className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <ExternalLink className="w-4 h-4" />
                        <span>SO2 Oxidation in Commercial Converters (1950)</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-6">Chemical Engineering Progress - Olson, Schuler & Smith</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => window.open("/attached_assets/sulfuricacid_fogler2_1768945307183.pdf", "_blank")}
                      className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <ExternalLink className="w-4 h-4" />
                        <span>Nonadiabatic Reactor Operation: SO2 Oxidation</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-6">Industrial Example - Fogler 2nd Edition</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={() => window.open("/attached_assets/Topsoe_Paper_1768945307184.pdf", "_blank")}
                      className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <ExternalLink className="w-4 h-4" />
                        <span>Design of Industrial Catalysts (Haldor Topsøe)</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-6">Kurt A. Christensen - Haldor Topsøe A/S</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={() => window.open("/attached_assets/_Dynamic_Converter_Modeling_R0.2_1768945307182.pdf", "_blank")}
                      className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <ExternalLink className="w-4 h-4" />
                        <span>Dynamic Converter Modeling (R0.2)</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-6">Internal Technical Documentation</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* CONVERTER OUTPUTS - Displayed at the top */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Converter Outputs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-6">
                <Label className="text-sm font-medium">Emissions:</Label>
                <span className="text-sm text-muted-foreground" data-testid="output-emissions-lbso2">
                  {simulationResults?.emissions?.lbSO2ST || "--"} lbSO2/ST
                </span>
                <span className="text-sm text-muted-foreground" data-testid="output-emissions-kgso2">
                  {simulationResults?.emissions?.kgSO2MT || "--"} KgSO2/MT
                </span>
                <span className="text-sm text-muted-foreground" data-testid="output-emissions-ppmv">
                  {simulationResults?.emissions?.ppmv || "--"} ppmv
                </span>
              </div>
            </CardContent>
          </Card>

          {/* PASS PROFILE TABLES - 2x2 Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {[1, 2, 3, 4].map((passNum) => {
              const passData = simulationResults?.passProfiles?.[`pass${passNum}`] || [];
              return (
                <Card key={passNum} className="overflow-hidden">
                  <CardHeader className="py-2 px-4 bg-muted/30">
                    <CardTitle className="text-base font-medium text-foreground">Pass {passNum}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs" data-testid={`table-pass${passNum}-profile`}>
                        <thead>
                          <tr className="border-b bg-muted/20">
                            <th className="px-2 py-1.5 text-left font-medium">Bed<br/>Depth</th>
                            <th className="px-2 py-1.5 text-left font-medium">Temp:</th>
                            <th className="px-2 py-1.5 text-left font-medium">Overall<br/>Conv.</th>
                            <th className="px-2 py-1.5 text-left font-medium">Bed<br/>Conv.</th>
                            <th className="px-2 py-1.5 text-left font-medium">Pressure</th>
                            <th className="px-2 py-1.5 text-left font-medium">Bed<br/>Depth L</th>
                            <th className="px-2 py-1.5 text-left font-medium">SO2</th>
                            <th className="px-2 py-1.5 text-left font-medium">O2</th>
                            <th className="px-2 py-1.5 text-left font-medium">Velocity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {passData.length > 0 ? passData.map((row: any, idx: number) => (
                            <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/10">
                              <td className="px-2 py-1.5 text-muted-foreground">{row.depthPercent}%</td>
                              <td className="px-2 py-1.5 text-muted-foreground">{row.temperature} C</td>
                              <td className="px-2 py-1.5 text-muted-foreground">{row.overallConversion}%</td>
                              <td className="px-2 py-1.5 text-muted-foreground">{row.bedConversion}%</td>
                              <td className="px-2 py-1.5 text-muted-foreground">{row.pressure} IN</td>
                              <td className="px-2 py-1.5 text-muted-foreground">{row.bedDepthFt} ft</td>
                              <td className="px-2 py-1.5 text-muted-foreground">{row.so2Percent}%</td>
                              <td className="px-2 py-1.5 text-muted-foreground">{row.o2Percent}%</td>
                              <td className="px-2 py-1.5 text-muted-foreground">{row.velocity} ft/s</td>
                            </tr>
                          )) : (
                            [0, 25, 50, 75, 100].map((depth, idx) => (
                              <tr key={idx} className="border-b last:border-b-0">
                                <td className="px-2 py-1.5 text-muted-foreground">{depth}%</td>
                                <td className="px-2 py-1.5 text-muted-foreground">--</td>
                                <td className="px-2 py-1.5 text-muted-foreground">--</td>
                                <td className="px-2 py-1.5 text-muted-foreground">--</td>
                                <td className="px-2 py-1.5 text-muted-foreground">--</td>
                                <td className="px-2 py-1.5 text-muted-foreground">--</td>
                                <td className="px-2 py-1.5 text-muted-foreground">--</td>
                                <td className="px-2 py-1.5 text-muted-foreground">--</td>
                                <td className="px-2 py-1.5 text-muted-foreground">--</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CATALYST LOADINGS & WEIGHTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Catalyst Loadings Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Catalyst Loadings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-[60px_100px_100px_100px] items-center gap-2 text-sm font-semibold border-b pb-2">
                    <span></span>
                    <span>Catalyst #1</span>
                    <span>Catalyst #2</span>
                    <span>Total</span>
                  </div>
                  {[0, 1, 2, 3].map((passIdx) => {
                    const pass = passIdx + 1;
                    const matrix = simulationResults?.catalystLoadings?.matrix;
                    const typeA = matrix?.[passIdx]?.[0];
                    const typeB = matrix?.[passIdx]?.[1];
                    const total = matrix?.[passIdx]?.[2];
                    return (
                      <div key={pass} className="grid grid-cols-[60px_100px_100px_100px] items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Pass {pass}:</span>
                        <span className="text-muted-foreground" data-testid={`output-pass${pass}-loading-1`}>
                          {typeA !== undefined ? `${formatNumber(typeA)} L` : "--"}
                        </span>
                        <span className="text-muted-foreground" data-testid={`output-pass${pass}-loading-2`}>
                          {typeB !== undefined ? `${formatNumber(typeB)} L` : "--"}
                        </span>
                        <span className="text-muted-foreground" data-testid={`output-pass${pass}-loading-total`}>
                          {total !== undefined ? `${formatNumber(total)} L` : "--"}
                        </span>
                      </div>
                    );
                  })}
                  <div className="grid grid-cols-[60px_100px_100px_100px] items-center gap-2 text-sm pt-2 border-t font-semibold">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="text-muted-foreground" data-testid="output-total-loading-1">
                      {simulationResults?.catalystLoadings?.matrix?.[4]?.[0] !== undefined ? `${formatNumber(simulationResults.catalystLoadings.matrix[4][0])} L` : "--"}
                    </span>
                    <span className="text-muted-foreground" data-testid="output-total-loading-2">
                      {simulationResults?.catalystLoadings?.matrix?.[4]?.[1] !== undefined ? `${formatNumber(simulationResults.catalystLoadings.matrix[4][1])} L` : "--"}
                    </span>
                    <span className="text-muted-foreground" data-testid="output-total-loading-total">
                      {simulationResults?.catalystLoadings?.matrix?.[4]?.[2] !== undefined ? `${formatNumber(simulationResults.catalystLoadings.matrix[4][2])} L` : "--"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Catalyst Weight Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Catalyst Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-[60px_100px_100px_100px] items-center gap-2 text-sm font-semibold border-b pb-2">
                    <span></span>
                    <span>Catalyst #1</span>
                    <span>Catalyst #2</span>
                    <span>Total</span>
                  </div>
                  {[0, 1, 2, 3].map((passIdx) => {
                    const pass = passIdx + 1;
                    const passWeight = catalystWeights?.passes?.[passIdx];
                    return (
                      <div key={pass} className="grid grid-cols-[60px_100px_100px_100px] items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Pass {pass}:</span>
                        <span className="text-muted-foreground" data-testid={`output-pass${pass}-weight-1`}>
                          {passWeight?.typeA?.massLbs !== undefined ? `${Math.round(passWeight.typeA.massLbs).toLocaleString()} LBS` : "--"}
                        </span>
                        <span className="text-muted-foreground" data-testid={`output-pass${pass}-weight-2`}>
                          {passWeight?.typeB?.massLbs !== undefined ? `${Math.round(passWeight.typeB.massLbs).toLocaleString()} LBS` : "--"}
                        </span>
                        <span className="text-muted-foreground" data-testid={`output-pass${pass}-weight-total`}>
                          {passWeight?.total?.massLbs !== undefined ? `${Math.round(passWeight.total.massLbs).toLocaleString()} LBS` : "--"}
                        </span>
                      </div>
                    );
                  })}
                  <div className="grid grid-cols-[60px_100px_100px_100px] items-center gap-2 text-sm pt-2 border-t font-semibold">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="text-muted-foreground" data-testid="output-total-weight-1">
                      {Math.round(catalystWeights?.passes?.reduce((sum, p) => sum + (p.typeA?.massLbs || 0), 0) || 0).toLocaleString()} LBS
                    </span>
                    <span className="text-muted-foreground" data-testid="output-total-weight-2">
                      {Math.round(catalystWeights?.passes?.reduce((sum, p) => sum + (p.typeB?.massLbs || 0), 0) || 0).toLocaleString()} LBS
                    </span>
                    <span className="text-muted-foreground" data-testid="output-total-weight-total">
                      {catalystWeights?.totals?.massLbs !== undefined ? `${Math.round(catalystWeights.totals.massLbs).toLocaleString()} LBS` : "--"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* X-T DIAGRAM */}
          <Card className="mb-8" data-testid="card-xt-diagram">
            <CardHeader>
              <CardTitle>X-T Diagram (Conversion vs Temperature)</CardTitle>
            </CardHeader>
            <CardContent>
              {xtDiagramData ? (
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart margin={{ top: 40, right: 30, left: 20, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    {/* Vertical measurement reference lines at key temperatures */}
                    <ReferenceLine x={375} stroke="#6b7280" strokeDasharray="4 4" strokeOpacity={0.6} />
                    <ReferenceLine x={425} stroke="#6b7280" strokeDasharray="4 4" strokeOpacity={0.6} />
                    <ReferenceLine x={475} stroke="#6b7280" strokeDasharray="4 4" strokeOpacity={0.6} />
                    <ReferenceLine x={525} stroke="#6b7280" strokeDasharray="4 4" strokeOpacity={0.6} />
                    <ReferenceLine x={575} stroke="#6b7280" strokeDasharray="4 4" strokeOpacity={0.6} />
                    <ReferenceLine x={625} stroke="#6b7280" strokeDasharray="4 4" strokeOpacity={0.6} />
                    <XAxis
                      dataKey="temperature"
                      type="number"
                      domain={[350, 650]}
                      ticks={[350, 400, 450, 500, 550, 600, 650]}
                      label={{ value: "Temperature (C)", position: "insideBottom", offset: -10 }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <YAxis
                      dataKey="conversion"
                      type="number"
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      label={{ value: "Conversion (%)", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        const formatted = typeof value === 'number' ? `${value.toFixed(2)}%` : value;
                        return [formatted, name];
                      }}
                      labelFormatter={(label) => `Temperature: ${label}C`}
                    />
                    <Legend verticalAlign="top" height={36} />
                    {/* Equilibrium Line - green dashed */}
                    <Line
                      data={xtDiagramData.equilibriumLine}
                      dataKey="conversion"
                      name="Equilibrium Line"
                      stroke="#22c55e"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    {/* Maximum Rate Curve - red solid */}
                    <Line
                      data={xtDiagramData.maxRateCurve}
                      dataKey="conversion"
                      name="Maximum Rate Curve"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                    {/* Adiabatic Operating Line - blue with arrows/markers at pass points */}
                    <Line
                      data={xtDiagramData.operatingLine}
                      dataKey="conversion"
                      name="Adiabatic Operating Line"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={(props: any) => {
                        const { cx, cy, payload, index } = props;
                        if (!payload) return <g key={`dot-empty-${index}`} />;
                        
                        // Show conversion % label for all points except cooling segments (type !== 'pass_inlet')
                        const isPassInlet = payload?.type === 'pass_inlet';
                        const isConversionPoint = payload?.type === 'conversion' || (!payload?.type && index % 2 === 1);
                        
                        // Show conversion % for key points (inlet of pass 1, outlet of each pass)
                        if (payload?.conversion !== undefined && payload?.conversion !== null) {
                          const conversionPct = typeof payload.conversion === 'number' 
                            ? payload.conversion.toFixed(2) 
                            : parseFloat(payload.conversion).toFixed(2);
                          
                          return (
                            <g key={`dot-${index}`}>
                              <circle cx={cx} cy={cy} r={3} fill="#3b82f6" />
                              <text 
                                x={cx} 
                                y={cy - 12} 
                                fill="#3b82f6" 
                                fontSize={11} 
                                fontWeight="bold"
                                textAnchor="middle"
                              >
                                {conversionPct}%
                              </text>
                              {isPassInlet && payload?.passNumber > 1 && (
                                <>
                                  <text 
                                    x={cx} 
                                    y={cy + 16} 
                                    fill="#3b82f6" 
                                    fontSize={9} 
                                    textAnchor="middle"
                                  >
                                    Pass {payload.passNumber}
                                  </text>
                                  <text 
                                    x={cx} 
                                    y={cy + 27} 
                                    fill="#3b82f6" 
                                    fontSize={8} 
                                    textAnchor="middle"
                                  >
                                    Inlet Temp
                                  </text>
                                </>
                              )}
                            </g>
                          );
                        }
                        return <g key={`dot-empty-${index}`} />;
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-24 flex items-center justify-center">
                  <p className="text-lg text-muted-foreground">
                    {xtDiagramMutation.isPending ? "Loading X-T diagram..." : "Run simulation to generate X-T diagram"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* INPUT VARIABLES SECTION WITH AREA FILTER AND RUN BUTTON */}
          <div className="mb-6">
            <div className="flex flex-row items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-semibold text-foreground">Input Variables</h2>
                <Button 
                  size="lg"
                  onClick={handleRunSimulation}
                  disabled={runSimulationMutation.isPending || xtDiagramMutation.isPending}
                  data-testid="button-run-simulation"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {runSimulationMutation.isPending ? "Running..." : "Run Simulation"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Filter by Area:</Label>
                <Select value={areaFilter} onValueChange={(value: AreaFilter) => setAreaFilter(value)}>
                  <SelectTrigger className="w-[200px]" data-testid="select-area-filter">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    <SelectItem value="gasComposition">Gas Composition</SelectItem>
                    <SelectItem value="processInputs">Process Inputs</SelectItem>
                    <SelectItem value="catalystPass1">Catalyst Pass 1</SelectItem>
                    <SelectItem value="catalystPass2">Catalyst Pass 2</SelectItem>
                    <SelectItem value="catalystPass3">Catalyst Pass 3</SelectItem>
                    <SelectItem value="catalystPass4">Catalyst Pass 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* SIMULATION INPUTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pass 1 Inlet Gas Composition */}
            {(areaFilter === "all" || areaFilter === "gasComposition") && (
            <Card>
              <CardHeader>
                <CardTitle>Pass 1 Inlet Gas Composition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">SO2 %:</Label>
                  <Input
                    value={so2Percent}
                    onChange={(e) => setSo2Percent(e.target.value)}
                    className="text-blue-500 font-semibold"
                    data-testid="input-so2-percent"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">SO3 %:</Label>
                  <Input
                    value={so3Percent}
                    onChange={(e) => setSo3Percent(e.target.value)}
                    className="text-blue-500 font-semibold"
                    data-testid="input-so3-percent"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">O2 %:</Label>
                  <Input
                    value={o2Percent}
                    onChange={(e) => setO2Percent(e.target.value)}
                    className="text-blue-500 font-semibold"
                    data-testid="input-o2-percent"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">CO2 %:</Label>
                  <Input
                    value={co2Percent}
                    onChange={(e) => setCo2Percent(e.target.value)}
                    className="text-blue-500 font-semibold"
                    data-testid="input-co2-percent"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">N2 %:</Label>
                  <Input
                    value={n2Percent}
                    onChange={(e) => setN2Percent(e.target.value)}
                    placeholder="--"
                    className="text-blue-500 font-semibold"
                    data-testid="input-n2-percent"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">Total %:</Label>
                  <span className="text-sm text-muted-foreground" data-testid="output-total-percent">
                    {(parseFloat(so2Percent) || 0) + (parseFloat(so3Percent) || 0) + (parseFloat(o2Percent) || 0) + (parseFloat(co2Percent) || 0) + (parseFloat(n2Percent) || 0)}%
                  </span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">P_Barr:</Label>
                  <Input
                    value={pBarr}
                    onChange={(e) => setPBarr(e.target.value)}
                    className="text-blue-500 font-semibold"
                    data-testid="input-p-barr"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">IPAT SO3 Removal:</Label>
                  <Input
                    value={ipatSo3Removal}
                    onChange={(e) => setIpatSo3Removal(e.target.value)}
                    className="text-blue-500 font-semibold"
                    data-testid="input-ipat-so3-removal"
                  />
                </div>
              </CardContent>
            </Card>
            )}

            {/* Process Inputs */}
            {(areaFilter === "all" || areaFilter === "processInputs") && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Process Inputs</CardTitle>
                <Select value={sizingMode} onValueChange={(value: "velocity" | "fixed") => setSizingMode(value)}>
                  <SelectTrigger className="w-[180px]" data-testid="select-sizing-mode">
                    <SelectValue placeholder="Select sizing mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="velocity">Pass 1 Inlet Velocity</SelectItem>
                    <SelectItem value="fixed">Fixed Diameter</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Plant Rate:</Label>
                  <Input
                    value={plantRate}
                    onChange={(e) => setPlantRate(e.target.value)}
                    className="text-blue-500 font-semibold"
                    data-testid="input-plant-rate"
                  />
                  <span className="text-sm text-muted-foreground">STPD</span>
                </div>
                {sizingMode === "velocity" ? (
                  <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                    <Label className="text-sm">Pass 1 Inlet Velocity:</Label>
                    <Input
                      value={pass1InletVelocity}
                      onChange={(e) => setPass1InletVelocity(e.target.value)}
                      className="text-blue-500 font-semibold"
                      data-testid="input-pass1-inlet-velocity"
                    />
                    <span className="text-sm text-muted-foreground">acfm</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                    <Label className="text-sm">Converter Diameter:</Label>
                    <Input
                      value={converterDiameter}
                      onChange={(e) => setConverterDiameter(e.target.value)}
                      className="text-blue-500 font-semibold"
                      data-testid="input-converter-diameter"
                    />
                    <span className="text-sm text-muted-foreground">ft</span>
                  </div>
                )}
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 1 Inlet Temp:</Label>
                  <Input
                    value={pass1InletTemp}
                    onChange={(e) => setPass1InletTemp(e.target.value)}
                    className="text-blue-500 font-semibold"
                    data-testid="input-pass1-inlet-temp"
                  />
                  <span className="text-sm text-muted-foreground">C</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 2 Inlet Temp:</Label>
                  <Input
                    value={pass2InletTemp}
                    onChange={(e) => setPass2InletTemp(e.target.value)}
                    className="text-blue-500 font-semibold"
                    data-testid="input-pass2-inlet-temp"
                  />
                  <span className="text-sm text-muted-foreground">C</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 3 Inlet Temp:</Label>
                  <Input
                    value={pass3InletTemp}
                    onChange={(e) => setPass3InletTemp(e.target.value)}
                    className="text-blue-500 font-semibold"
                    data-testid="input-pass3-inlet-temp"
                  />
                  <span className="text-sm text-muted-foreground">C</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 4 Inlet Temp:</Label>
                  <Input
                    value={pass4InletTemp}
                    onChange={(e) => setPass4InletTemp(e.target.value)}
                    className="text-blue-500 font-semibold"
                    data-testid="input-pass4-inlet-temp"
                  />
                  <span className="text-sm text-muted-foreground">C</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 1 Inlet Pres:</Label>
                  <Input
                    value={pass1InletPres}
                    onChange={(e) => setPass1InletPres(e.target.value)}
                    className="text-blue-500 font-semibold"
                    data-testid="input-pass1-inlet-pres"
                  />
                  <span className="text-sm text-muted-foreground">in. wc</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 2 Inlet Pres:</Label>
                  <Input
                    value={pass2InletPres}
                    onChange={(e) => setPass2InletPres(e.target.value)}
                    className="text-blue-500 font-semibold"
                    data-testid="input-pass2-inlet-pres"
                  />
                  <span className="text-sm text-muted-foreground">in. wc</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 3 Inlet Pres:</Label>
                  <Input
                    value={pass3InletPres}
                    onChange={(e) => setPass3InletPres(e.target.value)}
                    className="text-blue-500 font-semibold"
                    data-testid="input-pass3-inlet-pres"
                  />
                  <span className="text-sm text-muted-foreground">in. wc</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 4 Inlet Pres:</Label>
                  <Input
                    value={pass4InletPres}
                    onChange={(e) => setPass4InletPres(e.target.value)}
                    className="text-blue-500 font-semibold"
                    data-testid="input-pass4-inlet-pres"
                  />
                  <span className="text-sm text-muted-foreground">in. wc</span>
                </div>
              </CardContent>
            </Card>
            )}
          </div>

          {/* CATALYST PARAMETERS SECTION */}
          {(areaFilter === "all" || areaFilter === "catalystPass1" || areaFilter === "catalystPass2" || areaFilter === "catalystPass3" || areaFilter === "catalystPass4") && (
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Catalyst Parameters</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(areaFilter === "all" || areaFilter === "catalystPass1") && (
              <Card>
                <CardHeader>
                  <CardTitle data-testid="title-pass-1">Catalyst Parameters: Pass 1</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #1:</Label>
                      <Select value={pass1Type1} onValueChange={setPass1Type1}>
                        <SelectTrigger data-testid="select-pass1-type1">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Loading (L/ST):</Label>
                      <Input
                        value={pass1Liters1}
                        onChange={(e) => setPass1Liters1(e.target.value)}
                        placeholder="XXXX"
                        className="text-blue-500 font-semibold"
                        data-testid="input-pass1-liters1"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass1Activity1}
                        onChange={(e) => setPass1Activity1(e.target.value)}
                        placeholder="XX.X"
                        className="text-blue-500 font-semibold"
                        data-testid="input-pass1-activity1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #2:</Label>
                      <Select value={pass1Type2} onValueChange={setPass1Type2}>
                        <SelectTrigger data-testid="select-pass1-type2">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Loading (L/ST):</Label>
                      <Input
                        value={pass1Liters2}
                        onChange={(e) => setPass1Liters2(e.target.value)}
                        placeholder="XXXX"
                        className="text-blue-500 font-semibold"
                        data-testid="input-pass1-liters2"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass1Activity2}
                        onChange={(e) => setPass1Activity2(e.target.value)}
                        placeholder="XX.X"
                        className="text-blue-500 font-semibold"
                        data-testid="input-pass1-activity2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {(areaFilter === "all" || areaFilter === "catalystPass2") && (
              <Card>
                <CardHeader>
                  <CardTitle data-testid="title-pass-2">Catalyst Parameters: Pass 2</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #1:</Label>
                      <Select value={pass2Type1} onValueChange={setPass2Type1}>
                        <SelectTrigger data-testid="select-pass2-type1">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Loading (L/ST):</Label>
                      <Input
                        value={pass2Liters1}
                        onChange={(e) => setPass2Liters1(e.target.value)}
                        placeholder="XXXX"
                        className="text-blue-500 font-semibold"
                        data-testid="input-pass2-liters1"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass2Activity1}
                        onChange={(e) => setPass2Activity1(e.target.value)}
                        placeholder="XX.X"
                        className="text-blue-500 font-semibold"
                        data-testid="input-pass2-activity1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {(areaFilter === "all" || areaFilter === "catalystPass3") && (
              <Card>
                <CardHeader>
                  <CardTitle data-testid="title-pass-3">Catalyst Parameters: Pass 3</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #1:</Label>
                      <Select value={pass3Type1} onValueChange={setPass3Type1}>
                        <SelectTrigger data-testid="select-pass3-type1">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Loading (L/ST):</Label>
                      <Input
                        value={pass3Liters1}
                        onChange={(e) => setPass3Liters1(e.target.value)}
                        placeholder="XXXX"
                        className="text-blue-500 font-semibold"
                        data-testid="input-pass3-liters1"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass3Activity1}
                        onChange={(e) => setPass3Activity1(e.target.value)}
                        placeholder="XX.X"
                        className="text-blue-500 font-semibold"
                        data-testid="input-pass3-activity1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {(areaFilter === "all" || areaFilter === "catalystPass4") && (
              <Card>
                <CardHeader>
                  <CardTitle data-testid="title-pass-4">Catalyst Parameters: Pass 4</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #1:</Label>
                      <Select value={pass4Type1} onValueChange={setPass4Type1}>
                        <SelectTrigger data-testid="select-pass4-type1">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Loading (L/ST):</Label>
                      <Input
                        value={pass4Liters1}
                        onChange={(e) => setPass4Liters1(e.target.value)}
                        placeholder="XXXX"
                        className="text-blue-500 font-semibold"
                        data-testid="input-pass4-liters1"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass4Activity1}
                        onChange={(e) => setPass4Activity1(e.target.value)}
                        placeholder="XX.X"
                        className="text-blue-500 font-semibold"
                        data-testid="input-pass4-activity1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #2:</Label>
                      <Select value={pass4Type2} onValueChange={setPass4Type2}>
                        <SelectTrigger data-testid="select-pass4-type2">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Loading (L/ST):</Label>
                      <Input
                        value={pass4Liters2}
                        onChange={(e) => setPass4Liters2(e.target.value)}
                        placeholder="XXXX"
                        data-testid="input-pass4-liters2"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass4Activity2}
                        onChange={(e) => setPass4Activity2(e.target.value)}
                        placeholder="XX.X"
                        data-testid="input-pass4-activity2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}
            </div>
          </div>
          )}

        </div>
      </main>

      {/* Save Case Dialog */}
      <Dialog open={showSaveCaseDialog} onOpenChange={setShowSaveCaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Parameters as Case</DialogTitle>
            <DialogDescription>
              Save the current simulation parameters as a named case for future reference.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="case-name">Case Name</Label>
              <Input
                id="case-name"
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
                placeholder="Enter case name..."
                data-testid="input-case-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="case-description">Description (optional)</Label>
              <Input
                id="case-description"
                value={caseDescription}
                onChange={(e) => setCaseDescription(e.target.value)}
                placeholder="Enter description..."
                data-testid="input-case-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveCaseDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCase} 
              disabled={saveCaseMutation.isPending}
              data-testid="button-confirm-save-case"
            >
              {saveCaseMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Case
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
