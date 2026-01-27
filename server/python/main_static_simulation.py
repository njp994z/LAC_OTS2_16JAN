"""
Main Static Simulation Orchestrator
====================================
Combines compressor performance and sulfur spray hydraulics calculations
for complete static simulation of sulfuric acid plant operations.

This orchestrator:
1. Calculates compressor performance based on RPM %
2. Inverse-solves for valve position to achieve target sulfur flow
3. Returns combined results for the full static case
"""

import json
import sys
from dataclasses import asdict
from typing import Dict, Any

from compressor_calculator import calculate_compressor_performance, CompressorInput, MAX_RPM
from sulfur_static_solver import StaticSulfurSprayHydraulics, CONFIG as SULFUR_CONFIG

# Case 1 values from PV/SP tables (2480 STPD Clean)
CASE_1 = {
    "case_name": "Case 1 - 2480 STPD Clean",
    "compressor_rpm_percent": 87.0,      # 1540-H-4030 or 1540-SIC-4030
    "sulfur_flow_sp_gpm": 79.0,          # 1530-FIC-2602 SP
    "inlet_temp_F": 150.0,
    "inlet_pressure_inwc": -3.0,
    "barometric_atm": 0.85,
    "plant_condition": "clean",
    "sulfur_valve_R": 85.0,              # equal-% characteristic
    "pit_level_ft": 7.0
}

# Case 2 values (example for dirty conditions)
CASE_2 = {
    "case_name": "Case 2 - Dirty",
    "compressor_rpm_percent": 92.0,
    "sulfur_flow_sp_gpm": 82.0,
    "inlet_temp_F": 150.0,
    "inlet_pressure_inwc": -4.5,
    "barometric_atm": 0.85,
    "plant_condition": "dirty",
    "sulfur_valve_R": 85.0,
    "pit_level_ft": 7.0
}


def run_compressor_calculation(case: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run compressor performance calculation for a given case.
    
    Args:
        case: Dictionary with case parameters including compressor_rpm_percent
        
    Returns:
        Dictionary with compressor results
    """
    rpms = case["compressor_rpm_percent"] / 100.0 * MAX_RPM
    
    comp_input = CompressorInput(
        rpms=rpms,
        inlet_temp_F=case["inlet_temp_F"],
        inlet_pressure_inwc=case["inlet_pressure_inwc"],
        barometric_atm=case["barometric_atm"],
        plant_condition=case["plant_condition"]
    )
    
    result = calculate_compressor_performance(comp_input)
    return asdict(result)


def run_sulfur_calculation(case: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run sulfur spray hydraulics calculation for a given case.
    The sulfur solver calculates the valve position required for a given flow.
    
    Args:
        case: Dictionary with case parameters including sulfur_flow_sp_gpm
        
    Returns:
        Dictionary with sulfur system results including achieved valve position
    """
    # Update sulfur config with case-specific R value
    SULFUR_CONFIG['R_equal_percent'] = case.get("sulfur_valve_R", 85.0)
    
    # Create solver instance
    sulfur = StaticSulfurSprayHydraulics()
    
    # Target flow from case
    target_gpm = case["sulfur_flow_sp_gpm"]
    pit_level = case.get("pit_level_ft", 7.0)
    
    # The sulfur solver calculates valve position for a given target flow
    result = sulfur.calculate(flow_gpm=target_gpm, pit_level_ft=pit_level)
    
    return result


def run_full_static_case(case: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run complete static simulation combining compressor and sulfur systems.
    
    Args:
        case: Dictionary with all case parameters
        
    Returns:
        Combined results dictionary with compressor, sulfur, and summary sections
    """
    # 1. Compressor calculation
    compressor_result = run_compressor_calculation(case)
    
    # 2. Sulfur system calculation (includes valve position solve)
    sulfur_result = run_sulfur_calculation(case)
    
    # 3. Build combined result
    return {
        "case_name": case.get("case_name", "Static Simulation"),
        "inputs": {
            "compressor_rpm_percent": case["compressor_rpm_percent"],
            "sulfur_flow_sp_gpm": case["sulfur_flow_sp_gpm"],
            "inlet_temp_F": case["inlet_temp_F"],
            "inlet_pressure_inwc": case["inlet_pressure_inwc"],
            "barometric_atm": case["barometric_atm"],
            "plant_condition": case["plant_condition"],
            "sulfur_valve_R": case.get("sulfur_valve_R", 85.0),
            "pit_level_ft": case.get("pit_level_ft", 7.0),
        },
        "compressor": compressor_result,
        "sulfur_system": sulfur_result,
        "summary": {
            "compressor_speed_pct": case["compressor_rpm_percent"],
            "compressor_speed_rpm": case["compressor_rpm_percent"] / 100.0 * MAX_RPM,
            "sulfur_flow_sp_gpm": case["sulfur_flow_sp_gpm"],
            "sulfur_flow_achieved_gpm": sulfur_result.get("flow_gpm", sulfur_result.get("Flow_gpm", 0)),
            "sulfur_valve_position_pct": sulfur_result.get("valve_position_pct", sulfur_result.get("valve_position_percent", 0)),
            "mass_sulfur_klb_hr": sulfur_result.get("m_Total_klb_hr", 0),
            "main_air_flow_klb_hr": compressor_result.get("mass_flow_klbhr", 0),
            "compressor_outlet_temp_F": compressor_result.get("outlet_temp_F", 0),
            "compressor_pressure_rise_inwc": compressor_result.get("pressure_rise_inwc", 0),
        }
    }


def main():
    """
    Main entry point for static simulation.
    Accepts JSON input from stdin or runs with default Case 1.
    """
    try:
        # Check for stdin input
        if not sys.stdin.isatty():
            input_data = json.loads(sys.stdin.read())
            
            # Build case from input or use defaults
            case = {
                "case_name": input_data.get("case_name", "Custom Case"),
                "compressor_rpm_percent": float(input_data.get("compressor_rpm_percent", CASE_1["compressor_rpm_percent"])),
                "sulfur_flow_sp_gpm": float(input_data.get("sulfur_flow_sp_gpm", CASE_1["sulfur_flow_sp_gpm"])),
                "inlet_temp_F": float(input_data.get("inlet_temp_F", CASE_1["inlet_temp_F"])),
                "inlet_pressure_inwc": float(input_data.get("inlet_pressure_inwc", CASE_1["inlet_pressure_inwc"])),
                "barometric_atm": float(input_data.get("barometric_atm", CASE_1["barometric_atm"])),
                "plant_condition": input_data.get("plant_condition", CASE_1["plant_condition"]),
                "sulfur_valve_R": float(input_data.get("sulfur_valve_R", CASE_1["sulfur_valve_R"])),
                "pit_level_ft": float(input_data.get("pit_level_ft", CASE_1["pit_level_ft"])),
            }
        else:
            # Default to Case 1
            case = CASE_1
        
        # Run simulation
        result = run_full_static_case(case)
        
        # Output JSON result
        print(json.dumps(result, indent=2, default=str))
        
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
