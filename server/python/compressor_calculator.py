"""
Main Compressor Performance Calculator
======================================
Calculates compressor outlet conditions and performance metrics
using least-squares curve fitting from Howden SF 14.0 calibration data.

Reference: Howden SF 14.0 Compressor for Thacker Pass Project
Equipment Tag: 1540-GB-001
"""

import math
import json
import sys
import numpy as np
from dataclasses import dataclass, asdict
from typing import Tuple

# Constants
R_AIR = 53.35   # ft·lbf/(lbm·°R)
GAMMA = 1.4
MW_AIR = 28.97

# Unit conversion
INWC_TO_PSI = 0.03613
PSI_PER_ATM = 14.696


@dataclass
class CompressorInput:
    """Input parameters for compressor calculation - matches GUI variables"""
    rpms: float           # Compressor speed, 1/min
    inlet_temp_F: float   # Inlet temperature, °F (GUI: temp)
    inlet_pressure_inwc: float  # Inlet pressure, IN WC gauge (GUI: pressure)
    barometric_atm: float # Barometric pressure, ATM (GUI: barometricPressure)


@dataclass
class CompressorOutput:
    """Output parameters from compressor calculation - matches GUI variables"""
    inlet_flow_acfm: float      # inletFlowAcfm
    inlet_flow_am3hr: float     # inletFlowAm3hr
    outlet_temp_F: float        # outletTempF
    outlet_temp_C: float        # outletTempC
    outlet_pressure_inwc: float # outletPressureInwc
    outlet_pressure_mmwg: float # outletPressureMmwg
    temp_rise_F: float          # tempRiseF
    temp_rise_C: float          # tempRiseC
    pressure_rise_inwc: float   # pressureRiseInwc
    pressure_rise_mmwg: float   # pressureRiseMmwg
    standard_flow_scfm: float   # standardFlowScfm
    standard_flow_nm3hr: float  # standardFlowNm3hr
    outlet_flow_acfm: float     # outletFlowAcfm
    outlet_flow_am3hr: float    # outletFlowAm3hr
    mass_flow_klbhr: float      # massFlowKlbhr
    mass_flow_MThr: float       # massFlowMThr
    isentropic_head_ftlblb: float  # isentropicHeadFtlblb
    isentropic_head_kJkg: float    # isentropicHeadKJkg
    brake_power_hp: float       # brakePowerHp
    brake_power_MW: float       # brakePowerMW
    motor_power_hp: float       # motorPowerHp
    motor_power_MW: float       # motorPowerMW
    driver_speed: float         # driverSpeed


def inwc_to_psia(inwc: float, barometric_atm: float) -> float:
    """Convert inches water column (gauge) to psia"""
    barometric_psia = barometric_atm * PSI_PER_ATM
    return barometric_psia + inwc * INWC_TO_PSI


def psia_to_inwc(psia: float, barometric_atm: float) -> float:
    """Convert psia to inches water column (gauge)"""
    barometric_psia = barometric_atm * PSI_PER_ATM
    gauge_psi = psia - barometric_psia
    return gauge_psi / INWC_TO_PSI


def fahrenheit_to_celsius(temp_F: float) -> float:
    """Convert Fahrenheit to Celsius"""
    return (temp_F - 32) * 5 / 9


def inwc_to_mmwg(inwc: float) -> float:
    """Convert inches water column to mm water gauge"""
    return inwc * 25.4


def acfm_to_am3hr(acfm: float) -> float:
    """Convert actual cubic feet per minute to actual cubic meters per hour"""
    return acfm * 0.0283168 * 60


def scfm_to_nm3hr(scfm: float) -> float:
    """Convert standard cubic feet per minute to normal cubic meters per hour"""
    return scfm * 0.0283168 * 60 * (273.15 / 288.71)


def calculate_isentropic_head(inlet_temp_R: float, pressure_ratio: float, gamma: float = GAMMA) -> float:
    """Calculate isentropic head in ft·lbf/lbm"""
    exponent = (gamma - 1) / gamma
    return (gamma / (gamma - 1)) * R_AIR * inlet_temp_R * (pressure_ratio ** exponent - 1)


# -------------------------
# Curve-fit calibration data (dry air) from Howden sheet
# -------------------------
# name, Q_acfm, Pin_abs_inwc, Pout_abs_inwc, Tin_F, Tout_F
_CAL_POINTS = [
    ("pt2",  65455.2,      338.4862, 394.4862, 150.0, 182.8),
    ("pt3", 177051.326,    328.4862, 527.4862, 150.0, 253.8),
    ("pt4", 168621.114,    328.4862, 546.4862, 150.0, 259.8),
    ("pt6", 185802.468,    328.4862, 575.4862, 150.0, 273.0),
]

# Affinity reference (from sheet high-speed point)
_Q_REF_ACFM = 185802.468
_N_REF_RPM = 4505.0

# Standard density reference (from sheet; dry air)
_RHO_STD_LBFT3 = 0.08041  # at 14.7 psia, 32°F, dry


def _fit_pressure_power_law(points=_CAL_POINTS, Q0_acfm=_Q_REF_ACFM) -> Tuple[float, float, float]:
    """
    Fit: Pout_abs_inwc = P0_abs_inwc * (Q/Q0)^exp
    Returns (P0_abs_inwc, Q0_acfm, exp)
    """
    Q = np.array([p[1] for p in points], dtype=float)
    Pout = np.array([p[3] for p in points], dtype=float)

    x = np.log(Q / Q0_acfm)
    y = np.log(Pout)

    A = np.column_stack([np.ones_like(x), x])
    (lnP0, exp), *_ = np.linalg.lstsq(A, y, rcond=None)
    return float(np.exp(lnP0)), float(Q0_acfm), float(exp)


def _fit_temp_rise_power_law(points=_CAL_POINTS, Q0_acfm=_Q_REF_ACFM) -> Tuple[float, float, float, float]:
    """
    Fit: dT = A*(Q/Q0)^m*(dP/dP0)^n
    Returns (A, m, n, dP0_inwc)
    """
    Q = np.array([p[1] for p in points], dtype=float)
    Pin = np.array([p[2] for p in points], dtype=float)
    Pout = np.array([p[3] for p in points], dtype=float)
    Tin = np.array([p[4] for p in points], dtype=float)
    Tout = np.array([p[5] for p in points], dtype=float)

    dP = Pout - Pin
    dT = Tout - Tin

    if np.any(dP <= 0) or np.any(dT <= 0):
        raise ValueError("Calibration points must have dP>0 and dT>0 for log-space power-law fit.")

    dP0 = float(np.median(dP))

    x1 = np.log(Q / Q0_acfm)
    x2 = np.log(dP / dP0)
    y = np.log(dT)

    M = np.column_stack([np.ones_like(y), x1, x2])
    (lnA, m, n), *_ = np.linalg.lstsq(M, y, rcond=None)
    return float(np.exp(lnA)), float(m), float(n), float(dP0)


# Fit once at import time
_P0_ABS_INWC, _Q0_ACFM, _P_EXP = _fit_pressure_power_law()
_DT_A, _DT_M, _DT_N, _DP0_INWC = _fit_temp_rise_power_law()


def calculate_compressor_performance(inp: CompressorInput) -> CompressorOutput:
    """
    Main calculation function for compressor performance using:
      - Ideal-gas inlet density (dry air)
      - Affinity flow scaling Q ∝ RPM
      - Least-squares pressure power law: Pout_abs = P0*(Q/Q0)^exp
      - Least-squares temp-rise power law: dT = A*(Q/Q0)^m*(dP/dP0)^n
    """

    # Inlet absolute conditions
    inlet_temp_R = inp.inlet_temp_F + 459.67
    inlet_psia = inwc_to_psia(inp.inlet_pressure_inwc, inp.barometric_atm)

    # Inlet absolute inWC for internal use
    baro_inwc_abs = inp.barometric_atm * PSI_PER_ATM / INWC_TO_PSI
    inlet_abs_inwc = inp.inlet_pressure_inwc + baro_inwc_abs

    # Inlet flow from affinity (Q ∝ N)
    speed_ratio = inp.rpms / _N_REF_RPM
    inlet_flow_acfm = _Q_REF_ACFM * speed_ratio

    # Outlet pressure from least-squares power law (ABS inWC)
    outlet_abs_inwc = _P0_ABS_INWC * (inlet_flow_acfm / _Q0_ACFM) ** _P_EXP
    outlet_psia = inwc_to_psia(outlet_abs_inwc - baro_inwc_abs, inp.barometric_atm)
    outlet_pressure_inwc_g = outlet_abs_inwc - baro_inwc_abs

    pressure_rise_inwc = outlet_pressure_inwc_g - inp.inlet_pressure_inwc
    pressure_ratio = outlet_psia / inlet_psia

    # Temperature rise from power law
    dP_inwc = outlet_abs_inwc - inlet_abs_inwc
    if dP_inwc <= 0:
        outlet_temp_F = float("nan")
        temp_rise_F = float("nan")
    else:
        temp_rise_F = _DT_A * (inlet_flow_acfm / _Q0_ACFM) ** _DT_M * (dP_inwc / _DP0_INWC) ** _DT_N
        outlet_temp_F = inp.inlet_temp_F + temp_rise_F

    outlet_temp_R = outlet_temp_F + 459.67

    # Ideal-gas densities (dry air)
    inlet_density = (inlet_psia * 144.0) / (R_AIR * inlet_temp_R)
    outlet_density = (outlet_psia * 144.0) / (R_AIR * outlet_temp_R) if math.isfinite(outlet_temp_R) else float("nan")

    # Mass flow
    mass_flow_lbhr = inlet_flow_acfm * inlet_density * 60.0

    # Standard flow (at 14.7 psia, 60°F)
    std_temp_R = 60.0 + 459.67
    std_pressure = 14.7
    std_density = (std_pressure * 144.0) / (R_AIR * std_temp_R)
    standard_flow_scfm = mass_flow_lbhr / (std_density * 60.0)

    # Outlet flow from continuity
    outlet_flow_acfm = mass_flow_lbhr / (outlet_density * 60.0) if math.isfinite(outlet_density) else float("nan")

    # Head + power
    isentropic_head = calculate_isentropic_head(inlet_temp_R, pressure_ratio)

    efficiency = 0.78
    brake_power_hp = (mass_flow_lbhr / 60.0) * isentropic_head / (efficiency * 33000.0)
    motor_power_hp = brake_power_hp / 0.96

    # Driver speed (gearbox ratio)
    gearbox_ratio = 4174.0 / 1654.0
    driver_speed = inp.rpms / gearbox_ratio

    return CompressorOutput(
        inlet_flow_acfm=inlet_flow_acfm,
        inlet_flow_am3hr=acfm_to_am3hr(inlet_flow_acfm),
        outlet_temp_F=outlet_temp_F,
        outlet_temp_C=fahrenheit_to_celsius(outlet_temp_F),
        outlet_pressure_inwc=outlet_pressure_inwc_g,
        outlet_pressure_mmwg=inwc_to_mmwg(outlet_pressure_inwc_g),
        temp_rise_F=outlet_temp_F - inp.inlet_temp_F,
        temp_rise_C=fahrenheit_to_celsius(outlet_temp_F) - fahrenheit_to_celsius(inp.inlet_temp_F),
        pressure_rise_inwc=pressure_rise_inwc,
        pressure_rise_mmwg=inwc_to_mmwg(pressure_rise_inwc),
        standard_flow_scfm=standard_flow_scfm,
        standard_flow_nm3hr=scfm_to_nm3hr(standard_flow_scfm),
        outlet_flow_acfm=outlet_flow_acfm,
        outlet_flow_am3hr=acfm_to_am3hr(outlet_flow_acfm),
        mass_flow_klbhr=mass_flow_lbhr / 1000.0,
        mass_flow_MThr=mass_flow_lbhr / 2204.62,
        isentropic_head_ftlblb=isentropic_head,
        isentropic_head_kJkg=isentropic_head * 0.001356,
        brake_power_hp=brake_power_hp,
        brake_power_MW=brake_power_hp * 0.0007457,
        motor_power_hp=motor_power_hp,
        motor_power_MW=motor_power_hp * 0.0007457,
        driver_speed=driver_speed
    )


def format_output(output: CompressorOutput) -> dict:
    """Format output values for JSON response with proper rounding"""
    result = asdict(output)
    for key, value in result.items():
        if isinstance(value, float):
            if math.isnan(value) or math.isinf(value):
                result[key] = None
            elif abs(value) >= 1000:
                result[key] = round(value, 1)
            elif abs(value) >= 100:
                result[key] = round(value, 2)
            elif abs(value) >= 10:
                result[key] = round(value, 2)
            else:
                result[key] = round(value, 3)
    return result


if __name__ == "__main__":
    # Read input from stdin as JSON
    try:
        input_data = json.load(sys.stdin)
        
        inp = CompressorInput(
            rpms=float(input_data.get("rpms", 4000)),
            inlet_temp_F=float(input_data.get("temp", 150)),
            inlet_pressure_inwc=float(input_data.get("pressure", -12)),
            barometric_atm=float(input_data.get("barometricPressure", 0.85))
        )
        
        result = calculate_compressor_performance(inp)
        output = format_output(result)
        
        print(json.dumps({"success": True, "results": output}))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
