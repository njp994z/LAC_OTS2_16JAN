"""
Main Compressor Performance Calculator - System + Blower Curve Intersection
Thacker Pass Project - Howden SF14 Compressor
"""

import math
import json
import sys
from dataclasses import dataclass, asdict

R_AIR         = 53.35
GAMMA         = 1.4
INWC_TO_PSI   = 0.03613
PSI_PER_ATM   = 14.696

Q_REF_ACFM    = 185802.0
N_REF_RPM     = 4505.0
DP_REF_INWC   = 247.0

Q_SYSTEM_REF  = 115301.0
DP_SYSTEM_REF_CLEAN = 199.0

SYSTEM_EXPONENT    = 1.70
BLOWER_DP_EXPONENT = -1.68

DIRTY_MULTIPLIER = {"clean": 1.00, "dirty": 1.45}

@dataclass
class CompressorInput:
    rpm_percent: float
    inlet_temp_F: float
    inlet_pressure_inwc: float
    barometric_atm: float
    plant_condition: str = "clean"

@dataclass
class CompressorOutput:
    inlet_flow_acfm: float
    inlet_flow_am3hr: float
    outlet_temp_F: float
    outlet_temp_C: float
    outlet_pressure_inwc: float
    outlet_pressure_mmwg: float
    temp_rise_F: float
    temp_rise_C: float
    pressure_rise_inwc: float
    pressure_rise_mmwg: float
    standard_flow_scfm: float
    standard_flow_nm3hr: float
    outlet_flow_acfm: float
    outlet_flow_am3hr: float
    mass_flow_klbhr: float
    mass_flow_MThr: float
    isentropic_head_ftlblb: float
    isentropic_head_kJkg: float
    brake_power_hp: float
    brake_power_MW: float
    motor_power_hp: float
    motor_power_MW: float
    driver_speed_rpm: float

def inwc_to_psia(inwc_gauge: float, baro_atm: float) -> float:
    return baro_atm * PSI_PER_ATM + inwc_gauge * INWC_TO_PSI

def psia_to_inwc(psia: float, baro_atm: float) -> float:
    baro_psia = baro_atm * PSI_PER_ATM
    return (psia - baro_psia) / INWC_TO_PSI

def f_to_c(f: float) -> float:
    return (f - 32) * 5 / 9

def acfm_to_am3hr(acfm: float) -> float:
    return acfm * 0.0283168 * 60

def scfm_to_nm3hr(scfm: float) -> float:
    return scfm * 0.0283168 * 60 * (273.15 / 288.71)

def inwc_to_mmwg(inwc: float) -> float:
    return inwc * 25.4

def find_operating_point(rpm_percent: float, plant_condition: str) -> tuple:
    """Find Q where blower curve intersects system curve"""
    n_ratio = rpm_percent / 100.0
    q_guess = Q_REF_ACFM * n_ratio

    dirty_mult = DIRTY_MULTIPLIER.get(plant_condition.lower(), 1.0)

    def blower_dp(q: float) -> float:
        return DP_REF_INWC * (n_ratio ** 2) * (q / Q_REF_ACFM) ** BLOWER_DP_EXPONENT

    def system_dp(q: float) -> float:
        return DP_SYSTEM_REF_CLEAN * dirty_mult * (q / Q_SYSTEM_REF) ** SYSTEM_EXPONENT

    q = q_guess
    for _ in range(50):
        dp_blower = blower_dp(q)
        dp_system = system_dp(q)
        if dp_system <= 0:
            break
        ratio = dp_blower / dp_system
        q_new = q * ratio ** (1 / (2 + BLOWER_DP_EXPONENT - SYSTEM_EXPONENT))
        if abs(q_new - q) < 1.0:
            break
        q = 0.6 * q + 0.4 * q_new
    else:
        print("Warning: solver did not fully converge", file=sys.stderr)

    dp_operating_inwc = system_dp(q)
    return q, dp_operating_inwc

def calculate_compressor_performance(inp: CompressorInput) -> CompressorOutput:
    inlet_temp_R = inp.inlet_temp_F + 459.67
    inlet_psia = inwc_to_psia(inp.inlet_pressure_inwc, inp.barometric_atm)
    baro_inwc_abs = inp.barometric_atm * PSI_PER_ATM / INWC_TO_PSI
    inlet_abs_inwc = inp.inlet_pressure_inwc + baro_inwc_abs

    q_acfm, pressure_rise_inwc = find_operating_point(inp.rpm_percent, inp.plant_condition)

    temp_rise_approx_f = 123.0 * (q_acfm / Q_REF_ACFM) ** 0.42
    outlet_temp_f = inp.inlet_temp_F + temp_rise_approx_f
    outlet_temp_r = outlet_temp_f + 459.67

    outlet_psia = inlet_psia + pressure_rise_inwc * INWC_TO_PSI
    outlet_abs_inwc = inlet_abs_inwc + pressure_rise_inwc

    inlet_density_lbft3 = (inlet_psia * 144) / (R_AIR * inlet_temp_R)
    outlet_density_lbft3 = (outlet_psia * 144) / (R_AIR * outlet_temp_r) if outlet_temp_r > 0 else 0.0

    mass_flow_lbhr = q_acfm * inlet_density_lbft3 * 60.0

    std_temp_r = 60 + 459.67
    std_density = (14.7 * 144) / (R_AIR * std_temp_r)
    standard_flow_scfm = mass_flow_lbhr / (std_density * 60.0)

    outlet_flow_acfm = mass_flow_lbhr / (outlet_density_lbft3 * 60.0) if outlet_density_lbft3 > 0 else float("nan")

    pr = outlet_psia / inlet_psia if inlet_psia > 0 else 1.0
    isentropic_head = (GAMMA / (GAMMA - 1)) * R_AIR * inlet_temp_R * (pr ** ((GAMMA - 1)/GAMMA) - 1)

    polytropic_eff = 0.78
    brake_hp = (mass_flow_lbhr / 60.0) * isentropic_head / (polytropic_eff * 33000.0)
    motor_hp = brake_hp / 0.96

    gearbox_ratio = 4174.0 / 1654.0
    driver_rpm = (inp.rpm_percent / 100.0 * N_REF_RPM) / gearbox_ratio

    return CompressorOutput(
        inlet_flow_acfm=q_acfm,
        inlet_flow_am3hr=acfm_to_am3hr(q_acfm),
        outlet_temp_F=outlet_temp_f,
        outlet_temp_C=f_to_c(outlet_temp_f),
        outlet_pressure_inwc=psia_to_inwc(outlet_psia, inp.barometric_atm),
        outlet_pressure_mmwg=inwc_to_mmwg(psia_to_inwc(outlet_psia, inp.barometric_atm)),
        temp_rise_F=temp_rise_approx_f,
        temp_rise_C=f_to_c(temp_rise_approx_f),
        pressure_rise_inwc=pressure_rise_inwc,
        pressure_rise_mmwg=inwc_to_mmwg(pressure_rise_inwc),
        standard_flow_scfm=standard_flow_scfm,
        standard_flow_nm3hr=scfm_to_nm3hr(standard_flow_scfm),
        outlet_flow_acfm=outlet_flow_acfm,
        outlet_flow_am3hr=acfm_to_am3hr(outlet_flow_acfm),
        mass_flow_klbhr=mass_flow_lbhr / 1000.0,
        mass_flow_MThr=mass_flow_lbhr / 2204.62,
        isentropic_head_ftlblb=isentropic_head,
        isentropic_head_kJkg=isentropic_head * 0.00135582,
        brake_power_hp=brake_hp,
        brake_power_MW=brake_hp * 0.0007457,
        motor_power_hp=motor_hp,
        motor_power_MW=motor_hp * 0.0007457,
        driver_speed_rpm=driver_rpm
    )

if __name__ == "__main__":
    try:
        input_data = json.load(sys.stdin)
        params = CompressorInput(
            rpm_percent=float(input_data.get("rpm_percent", 88.0)),
            inlet_temp_F=float(input_data.get("temp", 150.0)),
            inlet_pressure_inwc=float(input_data.get("pressure", -12.0)),
            barometric_atm=float(input_data.get("barometricPressure", 0.85)),
            plant_condition=input_data.get("plant_condition", "clean")
        )
        result = calculate_compressor_performance(params)
        out_dict = asdict(result)
        for k, v in out_dict.items():
            if isinstance(v, float) and not math.isfinite(v):
                out_dict[k] = None
        print(json.dumps({"success": True, "results": out_dict}, indent=2))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
