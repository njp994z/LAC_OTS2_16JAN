"""
Main Compressor Performance Calculator - System + Blower Curve Intersection
Thacker Pass Project - Howden SF14 Compressor
Modified to calculate inlet pressure from system curve
"""

import math
import json
import sys
from dataclasses import dataclass, asdict, field
from typing import Dict

R_AIR         = 53.35
GAMMA         = 1.4
INWC_TO_PSI   = 0.03613
PSI_PER_ATM   = 14.696

Q_REF_ACFM    = 185802.0
N_REF_RPM     = 4505.0
DP_REF_INWC   = 247.0

Q_O_REF       = 115301.0  # Reference standard flow, scfm
DP_O_REF      = 199.0     # Reference pressure drop, in wc
P_O_REF       = -13.0     # Reference inlet pressure, in wc

SYSTEM_EXPONENT    = 1.70
BLOWER_DP_COEFF    = 0.85

DIRTY_MULTIPLIER = {"clean": 1.00, "dirty": 1.45}

INLET_GAS_COMPOSITION = {
    "SO2": 0.0,
    "SO3": 0.0,
    "O2": 21.0,
    "N2": 79.0,
    "H2SO4": 0.0
}

@dataclass
class StreamComposition:
    SO2: float = 0.0
    SO3: float = 0.0
    O2: float = 0.0
    N2: float = 0.0
    H2SO4: float = 0.0
    total: float = 0.0
    pressure: float = 0.0
    temperature: float = 0.0

@dataclass
class CompressorInput:
    rpm_percent: float
    inlet_temp_F: float
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
    inlet_pressure_inwc: float  # Now calculated from system curve
    inlet_stream: Dict = field(default_factory=dict)
    outlet_stream: Dict = field(default_factory=dict)

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

def calculate_system_curve_values(standard_flow_scfm: float, plant_condition: str) -> tuple:
    """
    Calculate inlet pressure and pressure drop from system curve
    P_in = P_o * (Q_i / Q_o)^1.7
    dP = dP_o * (Q_i / Q_o)^1.7
    """
    dirty_mult = DIRTY_MULTIPLIER.get(plant_condition.lower(), 1.0)
    
    if standard_flow_scfm <= 0:
        return P_O_REF, DP_O_REF * dirty_mult
    
    flow_ratio = standard_flow_scfm / Q_O_REF
    
    # Calculate inlet pressure from system curve
    inlet_pressure_inwc = P_O_REF * (flow_ratio ** SYSTEM_EXPONENT)
    
    # Calculate pressure drop from system curve
    pressure_rise_inwc = DP_O_REF * dirty_mult * (flow_ratio ** SYSTEM_EXPONENT)
    
    return inlet_pressure_inwc, pressure_rise_inwc

def find_operating_point(rpm_percent: float, plant_condition: str) -> tuple:
    """Find Q where blower curve intersects system curve using iterative method"""
    n_ratio = max(rpm_percent / 100.0, 0.1)
    dirty_mult = DIRTY_MULTIPLIER.get(plant_condition.lower(), 1.0)
    
    def blower_dp(q_acfm: float, standard_flow_scfm: float) -> float:
        """Blower curve: dP vs actual flow"""
        if q_acfm <= 0:
            return DP_REF_INWC * (n_ratio ** 2) * 2.0
        q_ratio = q_acfm / (Q_REF_ACFM * n_ratio)
        dp = DP_REF_INWC * (n_ratio ** 2) * (1.0 - BLOWER_DP_COEFF * (q_ratio - 1.0) ** 2)
        return max(dp, 0.0)
    
    def system_dp(standard_flow_scfm: float) -> float:
        """System curve: dP vs standard flow"""
        if standard_flow_scfm <= 0:
            return 0.0
        flow_ratio = standard_flow_scfm / Q_O_REF
        return DP_O_REF * dirty_mult * (flow_ratio ** SYSTEM_EXPONENT)
    
    # Initial guess based on speed ratio
    q_acfm_guess = Q_REF_ACFM * n_ratio * 0.95
    
    # Iterative solution
    for iteration in range(50):
        # Assume standard conditions to estimate standard flow from actual flow
        # This is approximate - will be refined in main calculation
        std_flow_guess = q_acfm_guess * 0.62  # Rough conversion factor
        
        dp_blower = blower_dp(q_acfm_guess, std_flow_guess)
        dp_system = system_dp(std_flow_guess)
        
        error = dp_blower - dp_system
        
        if abs(error) < 1.0:  # Converged within 1 in wc
            break
        
        # Adjust flow based on error
        if error > 0:  # Blower can provide more - increase flow
            q_acfm_guess *= 1.02
        else:  # System requires more - decrease flow
            q_acfm_guess *= 0.98
    
    # Return operating point
    std_flow_final = q_acfm_guess * 0.62
    dp_final = system_dp(std_flow_final)
    
    return q_acfm_guess, dp_final, std_flow_final

def calculate_stream_compositions(standard_flow_scfm: float, inlet_pressure: float, 
                                   outlet_pressure: float, inlet_temp: float, outlet_temp: float) -> tuple:
    """Calculate inlet and outlet stream compositions"""
    inlet_stream = StreamComposition()
    outlet_stream = StreamComposition()
    
    total_scfm = standard_flow_scfm
    
    inlet_stream.SO2 = total_scfm * INLET_GAS_COMPOSITION["SO2"] / 100.0
    inlet_stream.SO3 = total_scfm * INLET_GAS_COMPOSITION["SO3"] / 100.0
    inlet_stream.O2 = total_scfm * INLET_GAS_COMPOSITION["O2"] / 100.0
    inlet_stream.N2 = total_scfm * INLET_GAS_COMPOSITION["N2"] / 100.0
    inlet_stream.H2SO4 = total_scfm * INLET_GAS_COMPOSITION["H2SO4"] / 100.0
    inlet_stream.total = total_scfm
    inlet_stream.pressure = inlet_pressure
    inlet_stream.temperature = inlet_temp
    
    outlet_stream.SO2 = inlet_stream.SO2
    outlet_stream.SO3 = inlet_stream.SO3
    outlet_stream.O2 = inlet_stream.O2
    outlet_stream.N2 = inlet_stream.N2
    outlet_stream.H2SO4 = inlet_stream.H2SO4
    outlet_stream.total = total_scfm
    outlet_stream.pressure = outlet_pressure
    outlet_stream.temperature = outlet_temp
    
    return inlet_stream, outlet_stream

def calculate_compressor_performance(inp: CompressorInput) -> CompressorOutput:
    # Initial operating point estimate
    q_acfm_initial, _, std_flow_initial = find_operating_point(inp.rpm_percent, inp.plant_condition)
    
    # Calculate inlet pressure and pressure rise from system curve
    inlet_pressure_inwc, pressure_rise_inwc = calculate_system_curve_values(
        std_flow_initial, inp.plant_condition
    )
    
    # Now refine calculation with actual inlet pressure
    inlet_temp_R = inp.inlet_temp_F + 459.67
    inlet_psia = inwc_to_psia(inlet_pressure_inwc, inp.barometric_atm)
    baro_inwc_abs = inp.barometric_atm * PSI_PER_ATM / INWC_TO_PSI
    inlet_abs_inwc = inlet_pressure_inwc + baro_inwc_abs

    # Calculate actual inlet density
    inlet_density_lbft3 = (inlet_psia * 144) / (R_AIR * inlet_temp_R)
    
    # Calculate standard flow from actual flow
    std_temp_r = 60 + 459.67
    std_density = (14.7 * 144) / (R_AIR * std_temp_r)
    
    # Refine actual flow based on inlet density
    mass_flow_lbhr_guess = q_acfm_initial * inlet_density_lbft3 * 60.0
    standard_flow_scfm = mass_flow_lbhr_guess / (std_density * 60.0)
    
    # Recalculate system curve values with refined standard flow
    inlet_pressure_inwc, pressure_rise_inwc = calculate_system_curve_values(
        standard_flow_scfm, inp.plant_condition
    )
    
    # Final inlet conditions
    inlet_psia = inwc_to_psia(inlet_pressure_inwc, inp.barometric_atm)
    inlet_density_lbft3 = (inlet_psia * 144) / (R_AIR * inlet_temp_R)
    
    # Calculate actual volume flow
    mass_flow_lbhr = standard_flow_scfm * std_density * 60.0
    q_acfm = mass_flow_lbhr / (inlet_density_lbft3 * 60.0)

    # Temperature rise
    q_ratio = q_acfm / Q_REF_ACFM
    temp_rise_approx_f = 95.0 + 28.0 * q_ratio
    outlet_temp_f = inp.inlet_temp_F + temp_rise_approx_f
    outlet_temp_r = outlet_temp_f + 459.67

    # Outlet conditions
    outlet_psia = inlet_psia + pressure_rise_inwc * INWC_TO_PSI
    outlet_abs_inwc = inlet_abs_inwc + pressure_rise_inwc
    outlet_density_lbft3 = (outlet_psia * 144) / (R_AIR * outlet_temp_r) if outlet_temp_r > 0 else 0.0
    outlet_flow_acfm = mass_flow_lbhr / (outlet_density_lbft3 * 60.0) if outlet_density_lbft3 > 0 else 0.0

    # Performance calculations
    pr = outlet_psia / inlet_psia if inlet_psia > 0 else 1.0
    isentropic_head = (GAMMA / (GAMMA - 1)) * R_AIR * inlet_temp_R * (pr ** ((GAMMA - 1)/GAMMA) - 1)

    polytropic_eff = 0.78
    brake_hp = (mass_flow_lbhr / 60.0) * isentropic_head / (polytropic_eff * 33000.0)
    motor_hp = brake_hp / 0.96

    gearbox_ratio = 4174.0 / 1654.0
    driver_rpm = (inp.rpm_percent / 100.0 * N_REF_RPM) / gearbox_ratio

    outlet_pressure_inwc = psia_to_inwc(outlet_psia, inp.barometric_atm)
    
    inlet_stream, outlet_stream = calculate_stream_compositions(
        standard_flow_scfm, 
        inlet_pressure_inwc, 
        outlet_pressure_inwc,
        inp.inlet_temp_F,
        outlet_temp_f
    )

    return CompressorOutput(
        inlet_flow_acfm=q_acfm,
        inlet_flow_am3hr=acfm_to_am3hr(q_acfm),
        outlet_temp_F=outlet_temp_f,
        outlet_temp_C=f_to_c(outlet_temp_f),
        outlet_pressure_inwc=outlet_pressure_inwc,
        outlet_pressure_mmwg=inwc_to_mmwg(outlet_pressure_inwc),
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
        driver_speed_rpm=driver_rpm,
        inlet_pressure_inwc=inlet_pressure_inwc,  # Now calculated
        inlet_stream=asdict(inlet_stream),
        outlet_stream=asdict(outlet_stream)
    )

if __name__ == "__main__":
    try:
        input_data = json.load(sys.stdin)
        params = CompressorInput(
            rpm_percent=float(input_data.get("rpm_percent", 88.0)),
            inlet_temp_F=float(input_data.get("temp", 150.0)),
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
