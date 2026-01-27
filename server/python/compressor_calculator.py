"""
Main Compressor Performance Calculator
=====================================
Calculates compressor outlet conditions and performance metrics
based on inlet parameters and machine characteristics.

Reference: Howden SF 14.0 Compressor for Thacker Pass Project
Equipment Tag: 1540-GB-001
Updated to use standard conditions at 32°F and 29.92 inHg (as per datasheet Note 4),
adjusted reference pressure rise, and efficiency to better match datasheet values.
"""

import math
import json
import sys
from dataclasses import dataclass, asdict, field
from typing import Tuple, Dict

# Constants
R_AIR = 53.35  # Gas constant for air, ft·lbf/(lbm·°R)
GAMMA = 1.4    # Specific heat ratio for air (Cp/Cv)
MW_AIR = 28.97 # Molecular weight of air, lb/lbmol
EFFICIENCY = 0.9  # Adjusted isentropic efficiency to match datasheet outlet temps

# Reference conditions
MAX_RPM = 4505.0  # Max speed from datasheet

# Inlet gas composition (mole %)
INLET_GAS_COMPOSITION = {
    "SO2": 0.0,
    "SO3": 0.0,
    "O2": 21.0,
    "N2": 79.0,
    "H2O": 0.0,
    "H2SO4": 0.0
}

@dataclass
class StreamComposition:
    SO2: float = 0.0
    SO3: float = 0.0
    O2: float = 0.0
    N2: float = 0.0
    H2O: float = 0.0
    H2SO4: float = 0.0
    total: float = 0.0
    pressure: float = 0.0
    temperature: float = 0.0

# Dirty plant condition multiplier for pressure rise
DIRTY_MULTIPLIER = {"clean": 1.00, "dirty": 1.45}

@dataclass
class CompressorInput:
    """Input parameters for compressor calculation"""
    rpms: float           # Compressor speed, 1/min
    inlet_temp_F: float   # Inlet temperature, °F
    inlet_pressure_inwc: float  # Inlet pressure, IN WC (gauge)
    barometric_atm: float # Barometric pressure, ATM
    plant_condition: str = "clean"  # "clean" or "dirty"

@dataclass  
class CompressorOutput:
    """Output parameters from compressor calculation"""
    inlet_flow_acfm: float      # Actual inlet flow, acfm
    inlet_flow_am3hr: float     # Actual inlet flow, Am³/hr
    outlet_temp_F: float        # Outlet temperature, °F
    outlet_temp_C: float        # Outlet temperature, °C
    outlet_pressure_inwc: float # Outlet pressure, IN WC
    outlet_pressure_mmwg: float # Outlet pressure, mm WG
    temp_rise_F: float          # Temperature rise, °F
    temp_rise_C: float          # Temperature rise, °C
    pressure_rise_inwc: float   # Pressure rise, IN WC
    pressure_rise_mmwg: float   # Pressure rise, mm WG
    standard_flow_scfm: float   # Standard flow, scfm
    standard_flow_nm3hr: float  # Standard flow, Nm³/hr
    outlet_flow_acfm: float     # Outlet flow, acfm
    outlet_flow_am3hr: float    # Outlet flow, Am³/hr
    mass_flow_klbhr: float      # Mass flow, klb/hr
    mass_flow_MThr: float       # Mass flow, MT/hr
    isentropic_head_ftlblb: float  # Isentropic head, ft·lb/lb
    isentropic_head_kJkg: float    # Isentropic head, kJ/kg
    brake_power_hp: float       # Brake power, hp
    brake_power_MW: float       # Brake power, MW
    motor_power_hp: float       # Motor power, hp
    motor_power_MW: float       # Motor power, MW
    driver_speed: float         # Driver speed (motor speed), 1/min
    driver_speed_rpm: float     # Driver speed (motor speed), 1/min (alias for compatibility)
    vfd_current: float          # VFD current, Amps
    compressor_speed: float     # Compressor speed, RPM
    inlet_pressure_inwc: float  # Inlet pressure, IN WC
    inlet_stream: Dict = field(default_factory=dict)   # Inlet stream composition
    outlet_stream: Dict = field(default_factory=dict)  # Outlet stream composition

def inwc_to_psia(inwc: float, barometric_atm: float) -> float:
    """Convert inches water column (gauge) to psia"""
    barometric_psia = barometric_atm * 14.696
    inwc_to_psi = inwc * 0.03613  # 1 inWC = 0.03613 psi
    return barometric_psia + inwc_to_psi

def psia_to_inwc(psia: float, barometric_atm: float) -> float:
    """Convert psia to inches water column (gauge)"""
    barometric_psia = barometric_atm * 14.696
    gauge_psi = psia - barometric_psia
    return gauge_psi / 0.03613

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
    # Standard conditions: 29.92 inHg, 32°F (as per datasheet Note 4) vs Normal: 1 atm, 0°C
    # Conversion factor accounts for minor differences
    return scfm * 0.0283168 * 60 * (273.15 / 273.15)  # Equivalent at 0°C

def calculate_isentropic_head(
    inlet_temp_R: float,
    pressure_ratio: float,
    gamma: float = GAMMA
) -> float:
    """
    Calculate isentropic head using polytropic relations.
    
    H_is = (gamma / (gamma-1)) * R * T1 * [(P2/P1)^((gamma-1)/gamma) - 1]
    
    Returns head in ft·lbf/lbm
    """
    exponent = (gamma - 1) / gamma
    head = (gamma / (gamma - 1)) * R_AIR * inlet_temp_R * (
        pressure_ratio ** exponent - 1
    )
    return head

def calculate_outlet_temp(
    inlet_temp_R: float,
    pressure_ratio: float,
    efficiency: float = EFFICIENCY,
    gamma: float = GAMMA
) -> float:
    """
    Calculate outlet temperature accounting for isentropic efficiency.
    
    T2 = T1 * [1 + (1/eta) * ((P2/P1)^((gamma-1)/gamma) - 1)]
    
    Returns temperature in °R
    """
    exponent = (gamma - 1) / gamma
    temp_ratio = pressure_ratio ** exponent
    outlet_temp_R = inlet_temp_R * (1 + (1 / efficiency) * (temp_ratio - 1))
    return outlet_temp_R

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
    inlet_stream.H2O = total_scfm * INLET_GAS_COMPOSITION["H2O"] / 100.0
    inlet_stream.H2SO4 = total_scfm * INLET_GAS_COMPOSITION["H2SO4"] / 100.0
    inlet_stream.total = total_scfm
    inlet_stream.pressure = inlet_pressure
    inlet_stream.temperature = inlet_temp
    
    # Outlet has same composition (no reaction in compressor)
    outlet_stream.SO2 = inlet_stream.SO2
    outlet_stream.SO3 = inlet_stream.SO3
    outlet_stream.O2 = inlet_stream.O2
    outlet_stream.N2 = inlet_stream.N2
    outlet_stream.H2O = inlet_stream.H2O
    outlet_stream.H2SO4 = inlet_stream.H2SO4
    outlet_stream.total = total_scfm
    outlet_stream.pressure = outlet_pressure
    outlet_stream.temperature = outlet_temp
    
    return inlet_stream, outlet_stream

def calculate_compressor_performance(inp: CompressorInput) -> CompressorOutput:
    """
    Main calculation function for compressor performance.
    
    Uses Howden SF 14.0 characteristic curves as reference.
    """
    # Convert temperatures to absolute (Rankine)
    inlet_temp_R = inp.inlet_temp_F + 459.67
    
    # Convert pressures to psia
    inlet_psia = inwc_to_psia(inp.inlet_pressure_inwc, inp.barometric_atm)
    
    # Calculate pressure rise based on speed (approximate from curves)
    # Reference: At 4174 rpm, pressure rise = 212 inWC (adjusted to match datasheet)
    reference_speed = 4174.0  # 1/min
    reference_dp = 212.0      # inWC
    # Pressure rise scales approximately with speed squared
    speed_ratio = inp.rpms / reference_speed
    dirty_mult = DIRTY_MULTIPLIER.get(inp.plant_condition.lower(), 1.0)
    pressure_rise_inwc = reference_dp * speed_ratio ** 2 * dirty_mult
    
    # Calculate outlet pressure
    outlet_psia = inwc_to_psia(inp.inlet_pressure_inwc + pressure_rise_inwc, inp.barometric_atm)
    pressure_ratio = outlet_psia / inlet_psia
    
    # Calculate isentropic head
    isentropic_head = calculate_isentropic_head(inlet_temp_R, pressure_ratio)
    
    # Calculate outlet temperature (with adjusted efficiency)
    outlet_temp_R = calculate_outlet_temp(inlet_temp_R, pressure_ratio, EFFICIENCY)
    outlet_temp_F = outlet_temp_R - 459.67
    
    # Calculate flows (approximate from reference data)
    # At 4174 rpm: ~177051 acfm (adjusted to match datasheet SCFM when converted)
    ref_flow_acfm = 177051.0
    flow_ratio = speed_ratio  # Flow proportional to speed
    inlet_flow_acfm = ref_flow_acfm * flow_ratio
    
    # Mass flow from ideal gas law
    inlet_density = (inlet_psia * 144) / (R_AIR * inlet_temp_R)  # lbm/ft³
    mass_flow_lbhr = inlet_flow_acfm * inlet_density * 60  # lb/hr
    
    # Standard flow (at 29.92 inHg, 32°F per datasheet Note 4)
    std_temp_R = 32 + 459.67  # 32°F
    std_pressure = 14.696  # psia
    std_density = (std_pressure * 144) / (R_AIR * std_temp_R)
    standard_flow_scfm = mass_flow_lbhr / (std_density * 60)
    
    # Outlet flow (at outlet conditions)
    outlet_density = (outlet_psia * 144) / (R_AIR * outlet_temp_R)
    outlet_flow_acfm = mass_flow_lbhr / (outlet_density * 60)
    
    # Power calculation
    # P = m_dot * H_is / (efficiency * 33000)
    # where 33000 converts ft·lbf/min to hp
    brake_power_hp = (mass_flow_lbhr / 60) * isentropic_head / (EFFICIENCY * 33000)
    motor_power_hp = brake_power_hp / 0.96  # Motor efficiency ~96%
    
    # Driver speed (gearbox ratio from reference data)
    # At 4174 rpm compressor, driver is ~1654 rpm (ratio ~2.524)
    gearbox_ratio = 4174.0 / 1654.0  # ≈ 2.524
    driver_speed = inp.rpms / gearbox_ratio
    
    # VFD Current calculation (assuming 4160V, 3-phase, PF=0.85, VFD eta=0.97)
    voltage = 4160.0  # Volts
    power_factor = 0.85
    vfd_efficiency = 0.97
    electric_power_kw = motor_power_hp * 0.7457 / vfd_efficiency
    vfd_current = (electric_power_kw * 1000) / (voltage * math.sqrt(3) * power_factor)
    
    # Calculate outlet pressure in inwc
    outlet_pressure_inwc = inp.inlet_pressure_inwc + pressure_rise_inwc
    
    # Calculate stream compositions
    inlet_stream, outlet_stream = calculate_stream_compositions(
        standard_flow_scfm,
        inp.inlet_pressure_inwc,
        outlet_pressure_inwc,
        inp.inlet_temp_F,
        outlet_temp_F
    )
    
    # Build output
    return CompressorOutput(
        inlet_flow_acfm=inlet_flow_acfm,
        inlet_flow_am3hr=acfm_to_am3hr(inlet_flow_acfm),
        outlet_temp_F=outlet_temp_F,
        outlet_temp_C=fahrenheit_to_celsius(outlet_temp_F),
        outlet_pressure_inwc=inp.inlet_pressure_inwc + pressure_rise_inwc,
        outlet_pressure_mmwg=inwc_to_mmwg(inp.inlet_pressure_inwc + pressure_rise_inwc),
        temp_rise_F=outlet_temp_F - inp.inlet_temp_F,
        temp_rise_C=fahrenheit_to_celsius(outlet_temp_F) - fahrenheit_to_celsius(inp.inlet_temp_F),
        pressure_rise_inwc=pressure_rise_inwc,
        pressure_rise_mmwg=inwc_to_mmwg(pressure_rise_inwc),
        standard_flow_scfm=standard_flow_scfm,
        standard_flow_nm3hr=scfm_to_nm3hr(standard_flow_scfm),
        outlet_flow_acfm=outlet_flow_acfm,
        outlet_flow_am3hr=acfm_to_am3hr(outlet_flow_acfm),
        mass_flow_klbhr=mass_flow_lbhr / 1000,
        mass_flow_MThr=mass_flow_lbhr / 2204.62,
        isentropic_head_ftlblb=isentropic_head,
        isentropic_head_kJkg=isentropic_head * 0.001356,  # ft·lb/lb to kJ/kg
        brake_power_hp=brake_power_hp,
        brake_power_MW=brake_power_hp * 0.0007457,
        motor_power_hp=motor_power_hp,
        motor_power_MW=motor_power_hp * 0.0007457,
        driver_speed=driver_speed,
        driver_speed_rpm=driver_speed,  # Alias for backward compatibility
        vfd_current=vfd_current,
        compressor_speed=inp.rpms,
        inlet_pressure_inwc=inp.inlet_pressure_inwc,
        inlet_stream=asdict(inlet_stream),
        outlet_stream=asdict(outlet_stream)
    )

if __name__ == "__main__":
    try:
        input_data = json.load(sys.stdin)
        rpm_percent = float(input_data.get("rpm_percent", 88.0))
        rpms = rpm_percent / 100 * MAX_RPM
        
        params = CompressorInput(
            rpms=rpms,
            inlet_temp_F=float(input_data.get("temp", 150.0)),
            inlet_pressure_inwc=float(input_data.get("inlet_pressure_inwc", -3.0)),
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
