"""
Streams 1-4 Material Balance Calculator
=======================================
Chains Inlet Air Filter and Main Compressor calculations to compute
streams 1-4 for the Process Gas PFD.

Stream 1: Ambient air inlet to filter
Stream 2: Filter outlet (= compressor inlet)
Stream 3: Compressor inlet (same as stream 2)
Stream 4: Compressor outlet
"""

import json
import sys
from dataclasses import dataclass, asdict
from typing import Dict, Any

R_AIR = 53.35
GAMMA = 1.4
INWC_TO_PSI = 0.03613
PSI_PER_ATM = 14.696

Q_REF_ACFM = 185802.0
N_REF_RPM = 4505.0
DP_REF_INWC = 247.0

Q_SYSTEM_REF = 115301.0
DP_SYSTEM_REF_CLEAN = 199.0
SYSTEM_EXPONENT = 1.70
BLOWER_DP_COEFF = 0.85

DIRTY_MULTIPLIER = {"clean": 1.00, "dirty": 1.45}


@dataclass
class StreamData:
    SO2: float = 0.0
    SO3: float = 0.0
    O2: float = 0.0
    N2: float = 0.0
    H2O: float = 0.0
    H2SO4: float = 0.0
    total: float = 0.0
    pressure: float = 0.0
    temperature: float = 0.0


@dataclass
class Streams1to4Result:
    stream1: StreamData
    stream2: StreamData
    stream3: StreamData
    stream4: StreamData


def calculate_inlet_air_filter(
    dry_air_flow_scfm: float,
    humidity_gr_lb: float,
    inlet_temp_F: float,
    filter_dp_inwc: float,
    barometric_atm: float
) -> tuple[StreamData, StreamData]:
    """Calculate streams 1 (inlet) and 2 (outlet) for the inlet air filter."""
    
    O2_fraction = 0.2095
    N2_fraction = 0.7809
    
    O2_scfm = dry_air_flow_scfm * O2_fraction
    N2_scfm = dry_air_flow_scfm * N2_fraction
    
    lb_water_per_lb_dry = humidity_gr_lb / 7000.0
    MW_air = 28.97
    MW_water = 18.015
    mole_ratio = lb_water_per_lb_dry * (MW_air / MW_water)
    H2O_scfm = dry_air_flow_scfm * mole_ratio
    
    total_scfm = O2_scfm + N2_scfm + H2O_scfm
    
    stream1 = StreamData(
        SO2=0.0,
        SO3=0.0,
        O2=round(O2_scfm, 0),
        N2=round(N2_scfm, 0),
        H2O=round(H2O_scfm, 0),
        H2SO4=0.0,
        total=round(total_scfm, 0),
        pressure=0.0,
        temperature=round(inlet_temp_F, 0)
    )
    
    stream2 = StreamData(
        SO2=0.0,
        SO3=0.0,
        O2=round(O2_scfm, 0),
        N2=round(N2_scfm, 0),
        H2O=round(H2O_scfm, 0),
        H2SO4=0.0,
        total=round(total_scfm, 0),
        pressure=round(-filter_dp_inwc, 1),
        temperature=round(inlet_temp_F, 0)
    )
    
    return stream1, stream2


def calculate_compressor(
    inlet_flow_scfm: float,
    inlet_temp_F: float,
    inlet_pressure_inwc: float,
    barometric_atm: float,
    rpm_percent: float,
    plant_condition: str = "clean"
) -> tuple[StreamData, StreamData]:
    """Calculate streams 3 (inlet) and 4 (outlet) for the main compressor."""
    
    rpm = rpm_percent / 100.0 * N_REF_RPM
    
    flow_ratio = rpm / N_REF_RPM
    inlet_flow_acfm = Q_REF_ACFM * flow_ratio
    
    dirty_mult = DIRTY_MULTIPLIER.get(plant_condition, 1.0)
    dp_system = DP_SYSTEM_REF_CLEAN * dirty_mult * (inlet_flow_acfm / Q_SYSTEM_REF) ** SYSTEM_EXPONENT
    
    dp_blower = BLOWER_DP_COEFF * DP_REF_INWC * (flow_ratio ** 2)
    
    outlet_pressure_inwc = inlet_pressure_inwc + min(dp_blower, dp_system + 50)
    
    P_in_psia = barometric_atm * PSI_PER_ATM + inlet_pressure_inwc * INWC_TO_PSI
    P_out_psia = barometric_atm * PSI_PER_ATM + outlet_pressure_inwc * INWC_TO_PSI
    
    T_in_R = inlet_temp_F + 459.67
    pressure_ratio = P_out_psia / P_in_psia if P_in_psia > 0 else 1.0
    T_out_R = T_in_R * (pressure_ratio ** ((GAMMA - 1) / GAMMA))
    outlet_temp_F = T_out_R - 459.67
    
    stream3 = StreamData(
        SO2=0.0,
        SO3=0.0,
        O2=0.0,
        N2=0.0,
        H2O=0.0,
        H2SO4=0.0,
        total=round(inlet_flow_scfm, 0),
        pressure=round(inlet_pressure_inwc, 1),
        temperature=round(inlet_temp_F, 0)
    )
    
    stream4 = StreamData(
        SO2=0.0,
        SO3=0.0,
        O2=0.0,
        N2=0.0,
        H2O=0.0,
        H2SO4=0.0,
        total=round(inlet_flow_scfm, 0),
        pressure=round(outlet_pressure_inwc, 1),
        temperature=round(outlet_temp_F, 0)
    )
    
    return stream3, stream4


def calculate_streams_1_to_4(
    ambient_pressure_atm: float,
    ambient_temperature_F: float,
    ambient_moisture_gr_lb: float,
    main_comp_rpm_pct: float,
    filter_dp_inwc: float = 2.0,
    plant_condition: str = "clean"
) -> Streams1to4Result:
    """
    Calculate all 4 streams by chaining inlet air filter and compressor.
    """
    
    dry_air_flow_scfm = 115301.0
    
    stream1, stream2 = calculate_inlet_air_filter(
        dry_air_flow_scfm=dry_air_flow_scfm,
        humidity_gr_lb=ambient_moisture_gr_lb,
        inlet_temp_F=ambient_temperature_F,
        filter_dp_inwc=filter_dp_inwc,
        barometric_atm=ambient_pressure_atm
    )
    
    stream3, stream4 = calculate_compressor(
        inlet_flow_scfm=stream2.total,
        inlet_temp_F=stream2.temperature,
        inlet_pressure_inwc=stream2.pressure,
        barometric_atm=ambient_pressure_atm,
        rpm_percent=main_comp_rpm_pct,
        plant_condition=plant_condition
    )
    
    stream3.O2 = stream2.O2
    stream3.N2 = stream2.N2
    stream3.H2O = 0.0
    stream3.total = stream2.O2 + stream2.N2
    
    stream4.O2 = stream2.O2
    stream4.N2 = stream2.N2
    stream4.H2O = 0.0
    stream4.total = stream2.O2 + stream2.N2
    
    stream1.H2O = stream2.H2O
    stream1.total = stream2.total
    
    return Streams1to4Result(
        stream1=stream1,
        stream2=stream2,
        stream3=stream3,
        stream4=stream4
    )


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)
    
    try:
        input_data = json.loads(sys.argv[1])
        
        result = calculate_streams_1_to_4(
            ambient_pressure_atm=float(input_data.get("ambient_pressure_atm", 0.84)),
            ambient_temperature_F=float(input_data.get("ambient_temperature_F", 93)),
            ambient_moisture_gr_lb=float(input_data.get("ambient_moisture_gr_lb", 79)),
            main_comp_rpm_pct=float(input_data.get("main_comp_rpm_pct", 87)),
            filter_dp_inwc=float(input_data.get("filter_dp_inwc", 2.0)),
            plant_condition=input_data.get("plant_condition", "clean")
        )
        
        output = {
            "stream1": asdict(result.stream1),
            "stream2": asdict(result.stream2),
            "stream3": asdict(result.stream3),
            "stream4": asdict(result.stream4)
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
