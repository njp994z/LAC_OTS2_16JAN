#!/usr/bin/env python3
"""
Streams 1-4 Material Balance Calculator for Sulfuric Acid Plant

This script calculates the gas composition and flow rates for streams 1-4:
- Stream 1: Ambient air inlet (before filter)
- Stream 2: Filtered air (after filter, before compressor inlet)
- Stream 3: Compressor bypass (for surge control)
- Stream 4: Compressor discharge (after compression)

Inputs (JSON from command line):
- ambient_pressure_atm: Atmospheric pressure in atm
- ambient_temperature_F: Ambient temperature in F
- ambient_moisture_gr_lb: Moisture content in grains/lb dry air
- main_comp_rpm_pct: Main compressor speed as % of max (4505 RPM)
- filter_dp_inwc: Filter pressure drop in inches water column
- plant_condition: 'clean' or 'dirty'
"""

import json
import sys
import math


def calculate_streams(inputs: dict) -> dict:
    """Calculate streams 1-4 based on input conditions."""
    
    ambient_pressure_atm = inputs.get('ambient_pressure_atm', 0.85)
    ambient_temperature_F = inputs.get('ambient_temperature_F', 60)
    ambient_moisture_gr_lb = inputs.get('ambient_moisture_gr_lb', 30)
    main_comp_rpm_pct = inputs.get('main_comp_rpm_pct', 87)
    filter_dp_inwc = inputs.get('filter_dp_inwc', 3.0)
    plant_condition = inputs.get('plant_condition', 'clean')
    
    P_atm = ambient_pressure_atm
    T_F = ambient_temperature_F
    T_R = T_F + 459.67
    
    humidity_ratio = ambient_moisture_gr_lb / 7000.0
    
    base_flow_scfm = 115000
    rpm_factor = main_comp_rpm_pct / 100.0
    total_air_scfm = base_flow_scfm * rpm_factor * (P_atm / 0.85)
    
    dp_factor = 1.0 - (filter_dp_inwc / 100.0)
    if plant_condition == 'dirty':
        dp_factor *= 0.97
    
    O2_fraction = 0.2095
    N2_fraction = 0.7808
    Ar_fraction = 0.0093
    CO2_fraction = 0.0004
    
    dry_air_scfm = total_air_scfm * dp_factor
    O2_scfm = dry_air_scfm * O2_fraction
    N2_scfm = dry_air_scfm * N2_fraction
    H2O_scfm = dry_air_scfm * humidity_ratio * 1.6
    total_scfm = dry_air_scfm + H2O_scfm
    
    inlet_pressure_inwc = -filter_dp_inwc
    
    pressure_ratio = 1.5 + (rpm_factor - 0.5) * 0.8
    discharge_pressure_inwc = P_atm * 407.2 * (pressure_ratio - 1)
    
    gamma = 1.4
    T_discharge_R = T_R * (pressure_ratio ** ((gamma - 1) / gamma))
    T_discharge_F = T_discharge_R - 459.67
    
    bypass_fraction = 0.05 if plant_condition == 'clean' else 0.08
    
    stream1 = {
        'SO2': 0,
        'SO3': 0,
        'O2': round(O2_scfm, 1),
        'N2': round(N2_scfm, 1),
        'H2O': round(H2O_scfm, 1),
        'total': round(total_scfm, 1),
        'pressure': round(P_atm * 407.2, 1),
        'temperature': round(T_F, 1),
    }
    
    stream2 = {
        'SO2': 0,
        'SO3': 0,
        'O2': round(O2_scfm * dp_factor, 1),
        'N2': round(N2_scfm * dp_factor, 1),
        'H2O': round(H2O_scfm * dp_factor, 1),
        'total': round(total_scfm * dp_factor, 1),
        'pressure': round(P_atm * 407.2 + inlet_pressure_inwc, 1),
        'temperature': round(T_F, 1),
    }
    
    bypass_flow = total_scfm * dp_factor * bypass_fraction
    stream3 = {
        'SO2': 0,
        'SO3': 0,
        'O2': round(O2_scfm * dp_factor * bypass_fraction, 1),
        'N2': round(N2_scfm * dp_factor * bypass_fraction, 1),
        'H2O': round(H2O_scfm * dp_factor * bypass_fraction, 1),
        'total': round(bypass_flow, 1),
        'pressure': round(discharge_pressure_inwc, 1),
        'temperature': round(T_discharge_F, 1),
    }
    
    main_flow = total_scfm * dp_factor * (1 - bypass_fraction)
    stream4 = {
        'SO2': 0,
        'SO3': 0,
        'O2': round(O2_scfm * dp_factor * (1 - bypass_fraction), 1),
        'N2': round(N2_scfm * dp_factor * (1 - bypass_fraction), 1),
        'H2O': round(H2O_scfm * dp_factor * (1 - bypass_fraction), 1),
        'total': round(main_flow, 1),
        'pressure': round(discharge_pressure_inwc, 1),
        'temperature': round(T_discharge_F, 1),
    }
    
    return {
        'stream1': stream1,
        'stream2': stream2,
        'stream3': stream3,
        'stream4': stream4,
        'inputs_used': {
            'ambient_pressure_atm': P_atm,
            'ambient_temperature_F': T_F,
            'main_comp_rpm_pct': main_comp_rpm_pct,
            'filter_dp_inwc': filter_dp_inwc,
            'plant_condition': plant_condition,
            'pressure_ratio': round(pressure_ratio, 3),
        }
    }


def main():
    if len(sys.argv) < 2:
        inputs = {}
    else:
        try:
            inputs = json.loads(sys.argv[1])
        except json.JSONDecodeError:
            print(json.dumps({'error': 'Invalid JSON input'}))
            sys.exit(1)
    
    try:
        result = calculate_streams(inputs)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)


if __name__ == '__main__':
    main()
