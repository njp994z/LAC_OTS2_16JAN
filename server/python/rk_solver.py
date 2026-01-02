# rk_solver.py
# Plug-flow SO2->SO3 adiabatic bed + X–T diagram (equilibrium, operating line, max-rate curve)

from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List, Tuple
import math
import numpy as np


# =============================================================================
# Catalyst database (from your provided code)
# =============================================================================

@dataclass
class CatalystProperties:
    name: str
    cesium_promoted: bool
    shape: str
    void_fraction: float
    activity_fresh: float
    ignition_temp_c: float
    operating_temp_c: float
    diameter_mm: float
    sphericity: float
    bulk_density_kg_m3: float


CATALYST_DATABASE: Dict[str, CatalystProperties] = {
    "Topsoe VK69": CatalystProperties(
        name="Topsoe VK69",
        cesium_promoted=True,
        shape="Daisy",
        void_fraction=0.60,
        activity_fresh=3.51,
        ignition_temp_c=350.0,
        operating_temp_c=400.0,
        diameter_mm=9.0,
        sphericity=0.75,
        bulk_density_kg_m3=800.0
    ),
    "MECS Super Gear XLP-310": CatalystProperties(
        name="MECS Super Gear XLP-310",
        cesium_promoted=True,
        shape="Ribbed Ring",
        void_fraction=0.50,
        activity_fresh=3.35,
        ignition_temp_c=390.0,
        operating_temp_c=400.0,
        diameter_mm=12.5,
        sphericity=0.65,
        bulk_density_kg_m3=815.0
    ),
    "MECS GR-330": CatalystProperties(
        name="MECS GR-330",
        cesium_promoted=False,
        shape="Hexalobe",
        void_fraction=0.55,
        activity_fresh=1.4,
        ignition_temp_c=360.0,
        operating_temp_c=370.0,
        diameter_mm=11.0,
        sphericity=0.70,
        bulk_density_kg_m3=865.0
    ),
}


def get_catalyst(name: str) -> CatalystProperties:
    """Get catalyst by name. Handles common naming variations."""
    # Normalize common variations
    normalized = name.strip()
    if normalized in CATALYST_DATABASE:
        return CATALYST_DATABASE[normalized]
    
    # Try without hyphens
    no_hyphen = normalized.replace("-", "")
    for db_name in CATALYST_DATABASE:
        if db_name.replace("-", "") == no_hyphen:
            return CATALYST_DATABASE[db_name]
    
    raise ValueError(f"Unknown catalyst: {name}")


# =============================================================================
# Units + helpers
# =============================================================================

ATM_TO_PSIA = 14.696
INWC_PER_PSI = 27.68

KG_TO_LB = 2.20462
L_TO_M3 = 1.0e-3

def C_to_K(TC: float) -> float:
    return TC + 273.15

def K_to_C(TK: float) -> float:
    return TK - 273.15

def C_to_R(TC: float) -> float:
    # Rankine = (C+273.15)*9/5
    return (TC + 273.15) * 9.0 / 5.0

def psia_to_atm(psia: float) -> float:
    return psia / ATM_TO_PSIA

def atm_to_psia(atm: float) -> float:
    return atm * ATM_TO_PSIA


# =============================================================================
# Stoichiometry bookkeeping (Fogler-style epsilon)
# Reaction: SO2 + 0.5 O2 -> SO3
# delta = -0.5
# epsilon = delta * y_SO2,0
# =============================================================================

DELTA = -0.5

def epsilon_from_yso2(y_so2_0: float) -> float:
    return DELTA * y_so2_0

def y_at_conversion(y0: Dict[str, float], X: float) -> Dict[str, float]:
    """
    Return mole fractions at conversion X using epsilon correction.
    Assumes y0 contains at least SO2, O2, SO3, N2 (CO2 optional handled as inert if present).
    """
    ySO2_0 = y0.get("SO2", 0.0)
    yO2_0  = y0.get("O2", 0.0)
    ySO3_0 = y0.get("SO3", 0.0)
    yN2_0  = y0.get("N2", 0.0)
    yCO2_0 = y0.get("CO2", 0.0)

    e = epsilon_from_yso2(ySO2_0)
    denom = 1.0 + e * X

    # component mole fractions on inlet-total basis, then normalize
    ySO2 = ySO2_0 * (1.0 - X) / denom
    yO2  = (yO2_0 - 0.5 * ySO2_0 * X) / denom
    ySO3 = (ySO3_0 + ySO2_0 * X) / denom
    yN2  = yN2_0 / denom
    yCO2 = yCO2_0 / denom

    yO2 = max(yO2, 0.0)
    ySO2 = max(ySO2, 1e-30)
    ySO3 = max(ySO3, 1e-30)

    s = ySO2 + yO2 + ySO3 + yN2 + yCO2
    return {"SO2": ySO2/s, "O2": yO2/s, "SO3": ySO3/s, "N2": yN2/s, "CO2": yCO2/s}


# =============================================================================
# Thermodynamics + kinetics for V2O5-catalyzed SO2 oxidation
# 
# Equilibrium constant Kp from thermodynamics (in atm^-0.5):
#   Kp = exp(dG/RT) with dG from standard reaction thermodynamics
#   Using: Kp = exp(42311/(1.98*T_R) - 11.24) where T_R is Rankine
#
# Rate constant k_eff uses industrial Arrhenius kinetics:
#   - Activation energy Ea ~ 88,000 J/mol (literature: 40-100 kJ/mol for V2O5)
#   - Pre-exponential calibrated for industrial rates in lbmol/(lb-cat·hr)
#   - Includes effectiveness factor for pore diffusion
# =============================================================================

def Kp_eklund(TC: float) -> float:
    """
    Equilibrium constant Kp (atm^-0.5) from Eklund thermodynamics.
    Kp = exp(42311/(1.98*T_R) - 11.24) where T_R is in Rankine.
    
    This is consistent with: SO2 + 0.5*O2 <=> SO3
    and Kp = pSO3 / (pSO2 * sqrt(pO2))
    """
    TR = C_to_R(TC)
    return math.exp(42311.0 / (1.98 * TR) - 11.24)


def k_eff_arrhenius(TC: float) -> float:
    """
    Industrial V2O5 catalyst rate constant (lbmol SO2 / lb-cat / hr / atm^1.5).
    
    Uses Arrhenius form: k = A * exp(-Ea / R / T)
    where:
      - Ea = 88,000 J/mol (typical for V2O5 with pore diffusion effects)
      - A = 2.5e6 (pre-exponential, calibrated for industrial rates)
      - R = 8.314 J/(mol·K)
      - T in Kelvin
    
    At 390°C (663 K): k ~ 0.7 - suitable for industrial conversion rates
    At 420°C (693 K): k ~ 1.8 - peak rate temperature range  
    At 450°C (723 K): k ~ 4.0 - approaches equilibrium limitation
    """
    TK = C_to_K(TC)
    Ea = 88000.0  # J/mol - activation energy
    A = 2.5e6    # pre-exponential factor (calibrated)
    R = 8.314    # J/(mol·K)
    return A * math.exp(-Ea / (R * TK))


def eklund_rate(
    TC: float,
    X: float,
    P_atm: float,
    y0: Dict[str, float],
    a_eff: float
) -> float:
    """
    SO2 oxidation rate using modified Eklund kinetics:
    
    r = a_eff * k(T) * sqrt(P_SO2/P_SO3) * [ P_O2 - (P_SO3/(P_SO2*Kp))^2 ]
    
    where:
      - a_eff = catalyst activity factor (fresh activity × % activity)
      - k(T) = Arrhenius rate constant (lbmol/lb-cat/hr/atm^1.5)
      - Kp(T) = equilibrium constant (atm^-0.5)
      - Partial pressures in atm
    
    The bracket term [ P_O2 - (P_SO3/(P_SO2*Kp))^2 ] represents the 
    driving force: positive when reaction can proceed forward.
    
    For numerical stability when SO3 is very low (e.g., after IPAT SO3 removal),
    we use a minimum SO3 partial pressure of 0.001 atm (~0.1% at 1 atm total).
    This prevents sqrt(pSO2/pSO3) from exploding and represents the trace SO3
    that quickly forms in the first catalyst layer.
    
    Returns rate in lbmol SO2 reacted / lb-catalyst / hr
    """
    y = y_at_conversion(y0, X)
    pSO2 = max(y["SO2"] * P_atm, 1e-6)
    # Use realistic minimum pSO3 to prevent numerical explosion when SO3 is nearly 0
    # At 1 atm, this corresponds to ~0.1% SO3, which quickly forms in the first mm of catalyst
    pSO3_min = 0.001 * P_atm  # 0.1% minimum at operating pressure
    pSO3 = max(y["SO3"] * P_atm, pSO3_min)
    pO2  = max(y["O2"]  * P_atm, 1e-6)

    # Use new Arrhenius rate constant (takes TC, not TR)
    k = k_eff_arrhenius(TC)
    Kp = max(Kp_eklund(TC), 1e-30)

    bracket = pO2 - (pSO3 / (pSO2 * Kp))**2
    # If bracket < 0 you're beyond equilibrium, net forward rate is zero
    if bracket <= 0.0:
        return 0.0

    return a_eff * k * math.sqrt(pSO2 / pSO3) * bracket


# =============================================================================
# Equilibrium conversion Xeq(T): solve Q(X,T) = Kp(T)
# Using: Kp = pSO3 / (pSO2 * pO2^0.5)  (consistent with Kp atm^(-1/2))
# =============================================================================

def Xeq_at_T(TC: float, P_atm: float, y0: Dict[str, float]) -> float:
    Kp = max(Kp_eklund(TC), 1e-30)

    def Qp(X: float) -> float:
        y = y_at_conversion(y0, X)
        pSO3 = y["SO3"] * P_atm
        pSO2 = max(y["SO2"] * P_atm, 1e-30)
        pO2  = y["O2"]  * P_atm
        if pO2 <= 1e-30:
            return 1e300
        return pSO3 / (pSO2 * math.sqrt(pO2))

    # Bisection on [0, 0.999]
    XL, XR = 0.0, 0.999
    fL = Qp(XL) - Kp
    fR = Qp(XR) - Kp

    # If already at/over equilibrium at X=0 due to inlet SO3, return ~0
    if fL >= 0:
        return 0.0

    # If even at X near 1 still below, cap
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


# =============================================================================
# Adiabatic operating line: T(X)
# We solve Cp_mix(T)*(T - Tin) = (-ΔHrxn)*ySO2_0*X
# Keep everything user-facing in °C.
#
# NOTE: To keep this self-contained, Cp is approximated. If you later plug in a
# property package, just replace cp_mix_J_molK().
# =============================================================================

def cp_species_BTU_lbmolR(species: str, TK: float) -> float:
    """
    Temperature-dependent molar heat capacity in BTU/lbmol·R.
    
    Uses NASA 7-coefficient polynomial form: Cp/R = a1 + a2*T + a3*T² + a4*T³ + a5*T⁴
    where T is in Kelvin and Cp/R is dimensionless.
    
    Reference values at typical converter temperatures (800-900 K):
    - N2:  Cp ≈ 30-31 J/mol-K ≈ 7.2-7.4 BTU/lbmol·R
    - O2:  Cp ≈ 33-34 J/mol-K ≈ 7.9-8.1 BTU/lbmol·R
    - SO2: Cp ≈ 52-55 J/mol-K ≈ 12.4-13.1 BTU/lbmol·R
    - SO3: Cp ≈ 75-80 J/mol-K ≈ 17.9-19.1 BTU/lbmol·R
    
    Typical mixture Cp for converter gas: ~10-12 BTU/lbmol·R
    """
    # NASA 7-coefficient polynomial coefficients (high-temp range 1000-6000K works at 800-900K)
    # Cp/R = a1 + a2*T + a3*T² + a4*T³ + a5*T⁴
    # a5 is negligible for our range, included for completeness
    NASA_COEFFS = {
        # Species: (a1, a2, a3, a4, a5)
        "O2":    (3.66096065, 6.56365811e-4, -1.41149627e-7, 2.05797935e-11, -1.29913436e-15),
        "N2":    (2.95257637, 1.39690040e-3, -4.92631603e-7, 7.86010195e-11, -4.60755204e-15),
        "SO2":   (5.25449370, 1.97825490e-3, -5.31672630e-7, 5.93886740e-11, -2.37466450e-15),
        "SO3":   (7.07573800, 3.17944400e-3, -1.00630500e-6, 1.41851800e-10, -7.31948300e-15),
        "H2SO4": (10.8642300, 4.67185200e-3, -1.41825300e-6, 1.91612400e-10, -9.63498200e-15),
        "CO2":   (4.63659490, 2.74131990e-3, -9.95828530e-7, 1.60373011e-10, -9.16103680e-15),
    }
    
    # R constant: 1.9858775 BTU/lbmol·R = 8.314 J/mol-K
    R_BTU = 1.9858775
    
    if species not in NASA_COEFFS:
        return 8.0  # Default value in BTU/lbmol·R
    
    a1, a2, a3, a4, a5 = NASA_COEFFS[species]
    
    # Cp/R = a1 + a2*T + a3*T² + a4*T³ + a5*T⁴
    Cp_over_R = a1 + a2*TK + a3*TK**2 + a4*TK**3 + a5*TK**4
    
    # Cp = (Cp/R) * R in BTU/lbmol·R
    return Cp_over_R * R_BTU


def cp_mix_BTU_lbmolR(TK: float, y: Dict[str, float]) -> float:
    """
    Mixture heat capacity (BTU/lbmol·R) using temperature-dependent polynomials.
    Returns Cp directly in BTU/lbmol·R for consistent unit basis in energy balance.
    """
    cp_mix = 0.0
    for species, mole_frac in y.items():
        if mole_frac > 0:
            cp_species = cp_species_BTU_lbmolR(species, TK)
            cp_mix += mole_frac * cp_species
    return cp_mix


def cp_mix_J_molK(TK: float, y: Dict[str, float]) -> float:
    """
    Mixture heat capacity (J/mol-K) using temperature-dependent polynomials.
    Converts from BTU/lbmol·R to J/mol-K using R = 1.9858775 BTU/lbmol·R = 8.314 J/mol-K
    Conversion factor: 1 BTU/lbmol·R = 4.184 J/mol-K
    """
    BTU_LBMOLR_TO_J_MOLK = 4.184
    return cp_mix_BTU_lbmolR(TK, y) * BTU_LBMOLR_TO_J_MOLK


def Tad_at_X(
    X: float,
    Tin_C: float,
    y0: Dict[str, float],
    dHrxn_J_per_molSO2: float = -99000.0
) -> float:
    """
    Adiabatic temperature (°C) at conversion X.
    dHrxn negative for exothermic; we use -dHrxn as heat release.
    """
    ySO2_0 = y0.get("SO2", 0.0)
    Tin_K = C_to_K(Tin_C)

    heat_release = (-dHrxn_J_per_molSO2) * ySO2_0 * X  # J per mol of inlet mixture
    # fixed point iteration
    T = Tin_K
    for _ in range(60):
        Cp = max(cp_mix_J_molK(T, y0), 1e-9)
        T_new = Tin_K + heat_release / Cp
        if abs(T_new - T) < 1e-8:
            break
        T = 0.7 * T + 0.3 * T_new

    return K_to_C(T)


# =============================================================================
# Maximum rate curve: for each X, find T that maximizes r(T,X),
# subject to X <= Xeq(T)
# =============================================================================

def Tmaxrate_for_X(
    X: float,
    T_range_C: Tuple[float, float],
    P_atm: float,
    y0: Dict[str, float],
    a_eff: float
) -> Tuple[float, float]:
    Tmin, Tmax = T_range_C
    Ts = np.linspace(Tmin, Tmax, 500)

    best_T = Tmin
    best_r = -1.0

    for TC in Ts:
        Xeq = Xeq_at_T(TC, P_atm, y0)
        if X > Xeq:
            r = 0.0
        else:
            r = eklund_rate(TC, X, P_atm, y0, a_eff)
        if r > best_r:
            best_r = r
            best_T = TC

    return best_T, best_r


# =============================================================================
# Bed/Pass data structures + RK4 solver (steps default = 100)
# =============================================================================

@dataclass
class BedSegment:
    """
    One catalytic bed segment (one catalyst layer).
    """
    name: str
    catalyst: CatalystProperties
    liters: float
    activity_percent: float   # UI derate percentage (0-100)

    Tin_C: float
    Pin_abs_atm: float
    FT0_lbmol_hr: float       # total inlet molar flow (basis) for scaling (optional)
    y0: Dict[str, float]      # inlet mole fractions for this segment

    n_steps: int = 100


@dataclass
class SegmentResult:
    z: np.ndarray
    T_C: np.ndarray
    X: np.ndarray
    Xeq: np.ndarray


def catalyst_weight_lb(liters: float, bulk_density_kg_m3: float) -> float:
    # mass_kg = liters * density / 1000 (liters->m3)
    mass_kg = liters * L_TO_M3 * bulk_density_kg_m3
    return mass_kg * KG_TO_LB


def compute_local_composition(y0: Dict[str, float], X: float) -> Dict[str, float]:
    """
    Compute local mole fractions at conversion X.
    Reaction: SO₂ + ½O₂ → SO₃
    
    As conversion progresses:
    - SO₂ decreases: ySO2_local = ySO2_0 * (1 - X)
    - SO₃ increases: ySO3_local = ySO3_0 + ySO2_0 * X
    - O₂ decreases: yO2_local = yO2_0 - 0.5 * ySO2_0 * X
    - N₂, CO₂ remain constant in absolute terms but mole fractions change
    
    Total moles decrease by 0.5 * ySO2_0 * X per mole of inlet gas.
    """
    ySO2_0 = y0.get("SO2", 0.0)
    ySO3_0 = y0.get("SO3", 0.0)
    yO2_0 = y0.get("O2", 0.0)
    yN2_0 = y0.get("N2", 0.0)
    yCO2_0 = y0.get("CO2", 0.0)
    
    # Moles reacted (per mole of inlet)
    delta_SO2 = ySO2_0 * X
    
    # New absolute mole fractions (unnormalized)
    ySO2_new = ySO2_0 - delta_SO2
    ySO3_new = ySO3_0 + delta_SO2
    yO2_new = max(0.0, yO2_0 - 0.5 * delta_SO2)
    
    # Total moles (per mole inlet) - decreases due to reaction
    total_moles = 1.0 - 0.5 * delta_SO2
    
    # Normalize to get mole fractions
    if total_moles <= 0:
        return y0  # Fallback if something goes wrong
    
    y_local = {
        "SO2": ySO2_new / total_moles,
        "SO3": ySO3_new / total_moles,
        "O2": yO2_new / total_moles,
        "N2": yN2_0 / total_moles,
        "CO2": yCO2_0 / total_moles,
    }
    
    return y_local


def rk4_solve_segment(seg: BedSegment) -> SegmentResult:
    """
    RK4 integrate in catalyst weight W.
    State: [T(C), X]
    Pressure profile is not integrated here (you can add Ergun later).
    """
    n = seg.n_steps
    W_total = catalyst_weight_lb(seg.liters, seg.catalyst.bulk_density_kg_m3)
    dW = W_total / n if W_total > 0 else 1.0

    # activity
    a0 = seg.catalyst.activity_fresh
    ad = max(seg.activity_percent, 0.0) / 100.0
    a_eff = a0 * ad

    # allocate
    z = np.linspace(0.0, 1.0, n + 1)  # normalized axial coordinate for now
    T = np.zeros(n + 1)
    X = np.zeros(n + 1)
    Xeq = np.zeros(n + 1)

    T[0] = seg.Tin_C
    X[0] = 0.0
    Xeq[0] = Xeq_at_T(T[0], seg.Pin_abs_atm, seg.y0)

    # Energy balance - CONSISTENT UNIT BASIS (BTU/lbmol·R)
    # =========================================================
    # dT/dW = (-ΔH * r) / (F_T * Cp)
    # dX/dW = r / (F_SO2,0)
    #
    # All quantities in consistent units:
    # - ΔH in BTU/lbmol SO2
    # - r in lbmol/hr per lb-catalyst (from eklund_rate)
    # - F_T0 in lbmol/hr
    # - Cp in BTU/lbmol·R
    # - Result: dT/dW in °R per lb-catalyst, then convert to °C
    #
    ySO2_0 = seg.y0.get("SO2", 1e-9)
    F_T0 = max(seg.FT0_lbmol_hr, 1e-9)
    F_SO2_0 = max(F_T0 * ySO2_0, 1e-12)

    # ΔHrxn = -99000 J/mol = -42560 BTU/lbmol (exothermic)
    # Conversion: 1 J/mol = 0.4299 BTU/lbmol
    dHrxn_BTU_lbmol = -42560.0

    def deriv(TC: float, Xc: float) -> Tuple[float, float]:
        # Compute local composition at current conversion (for Cp only)
        # NOTE: eklund_rate and Xeq_at_T compute y_local internally via y_at_conversion,
        # so we pass seg.y0 to them to avoid double-conversion
        y_local = compute_local_composition(seg.y0, Xc)
        
        # equilibrium limiter: if beyond equilibrium, stop net forward progress
        # Xeq_at_T expects inlet composition (computes local internally)
        Xeq_local = Xeq_at_T(TC, seg.Pin_abs_atm, seg.y0)
        if Xc >= Xeq_local:
            r = 0.0
        else:
            # eklund_rate expects inlet composition (computes local internally)
            r = eklund_rate(TC, Xc, seg.Pin_abs_atm, seg.y0, a_eff)

        # conversion derivative: r in lbmol/hr per lb-cat, F_SO2_0 in lbmol/hr
        dX_dW = r / F_SO2_0

        # Adiabatic temperature derivative - consistent BTU/lbmol·R basis
        # Use local composition y_local for Cp calculation (NOT seg.y0)
        TK = C_to_K(TC)
        Cp_BTU = max(cp_mix_BTU_lbmolR(TK, y_local), 1e-9)  # BTU/lbmol·R
        
        # Energy balance: dT/dW = (-ΔH * r) / (F_T0 * Cp)
        # Units: (BTU/lbmol * lbmol/hr/lb-cat) / (lbmol/hr * BTU/lbmol·R) = °R/lb-cat
        dT_dW_R = (-(dHrxn_BTU_lbmol) * r) / max(F_T0 * Cp_BTU, 1e-12)
        
        # Convert temperature change from °R to °C: ΔT(°C) = ΔT(°R) * 5/9
        dT_dW = dT_dW_R * 5.0 / 9.0

        return dT_dW, dX_dW

    for i in range(n):
        T0, X0 = T[i], X[i]

        k1T, k1X = deriv(T0, X0)
        k2T, k2X = deriv(T0 + 0.5*dW*k1T, X0 + 0.5*dW*k1X)
        k3T, k3X = deriv(T0 + 0.5*dW*k2T, X0 + 0.5*dW*k2X)
        k4T, k4X = deriv(T0 + dW*k3T, X0 + dW*k3X)

        T[i+1] = T0 + (dW/6.0)*(k1T + 2*k2T + 2*k3T + k4T)
        X[i+1] = X0 + (dW/6.0)*(k1X + 2*k2X + 2*k3X + k4X)

        # clamp
        X[i+1] = max(0.0, min(X[i+1], 0.999))

        # Xeq_at_T expects inlet composition (computes local internally)
        Xeq[i+1] = Xeq_at_T(T[i+1], seg.Pin_abs_atm, seg.y0)

    return SegmentResult(z=z, T_C=T, X=X, Xeq=Xeq)


# =============================================================================
# X–T diagram plot data generator
# (Equilibrium line, Operating line, Maximum-rate curve)
# =============================================================================

def xt_diagram_data(
    y0: Dict[str, float],
    P_atm: float,
    Tin_C: float,
    T_range_C: Tuple[float, float],
    catalyst_name: str,
    activity_percent: float,
    nT: int = 120,
    nX: int = 120
) -> Dict[str, np.ndarray]:
    cat = get_catalyst(catalyst_name)
    a_eff = cat.activity_fresh * (max(activity_percent, 0.0) / 100.0)

    Tmin, Tmax = T_range_C

    # equilibrium line: Xeq(T)
    T_grid = np.linspace(Tmin, Tmax, nT)
    Xeq_grid = np.array([Xeq_at_T(TC, P_atm, y0) for TC in T_grid]) * 100.0  # %

    # choose X range up to max equilibrium in range
    X_max = min(0.999, float(np.max(Xeq_grid))/100.0)
    X_grid = np.linspace(0.0, X_max, nX)

    # operating line: T_ad(X)
    Tad = np.array([Tad_at_X(X, Tin_C, y0) for X in X_grid])

    # max-rate curve: T*(X)
    Tmax_rate = []
    rmax = []
    for X in X_grid:
        TC_star, r_star = Tmaxrate_for_X(X, (Tmin, Tmax), P_atm, y0, a_eff)
        Tmax_rate.append(TC_star)
        rmax.append(r_star)

    return {
        "T_eq_C": T_grid,
        "X_eq_pct": Xeq_grid,
        "T_op_C": Tad,
        "X_op_pct": X_grid * 100.0,
        "T_rmax_C": np.array(Tmax_rate),
        "X_rmax_pct": X_grid * 100.0,
        "rmax": np.array(rmax),
    }
