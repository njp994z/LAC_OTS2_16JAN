# rk_solver.py
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
