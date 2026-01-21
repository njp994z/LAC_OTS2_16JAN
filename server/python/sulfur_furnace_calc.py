#!/usr/bin/env python3
"""
Sulfur Furnace Simulator - Backend Calculations
Combusts molten sulfur with dry air to produce SO2-rich process gas at high temperature.
"""

import json
import sys
import math
from dataclasses import dataclass, asdict

# Physical & engineering constants
MOL_S = 32.06               # lb/lb-mol sulfur
SCF_PER_LBMOL = 379.0       # standard cubic feet per lb-mol @ 60°F, 1 atm
O2_FRAC = 0.21              # Oxygen fraction in dry air
N2_FRAC = 0.79              # Nitrogen fraction in dry air
HEAT_COMBUSTION = 4200.0    # BTU/lb S (approximate net heating value)
CP_GAS_AVG = 0.27           # BTU/lb·°F (approximate for SO2 + air mixture)
T_AIR_INLET = 93.0          # °F (typical inlet air temperature)

# Dynamic simulation parameters
TAU_THERMAL = 600.0         # thermal time constant (seconds) for dynamic mode
T_INITIAL = 2000.0          # initial furnace outlet temperature guess (°F)

@dataclass
class FurnaceInput:
    air_scfm: float
    sulfur_klb_hr: float
    mode: str = "static"
    time_step_seconds: float = 60.0
    previous_temp: float = T_INITIAL

@dataclass
class FurnaceOutput:
    success: bool
    mode: str
    air_scfm: float
    sulfur_klb_hr: float
    scfm_so2: float
    scfm_o2_out: float
    scfm_n2: float
    scfm_dry_total: float
    pct_so2: float
    pct_o2: float
    pct_n2: float
    T_out_f: float
    T_out_c: float
    P_out_inwc: float
    heat_release_btu_hr: float
    mass_flow_lb_hr: float
    error: str = ""

def calculate_static(air_scfm: float, sulfur_klb_hr: float) -> dict:
    """Perform static (steady-state) material & heat balance."""
    
    # Convert sulfur flow to molar basis
    m_sulfur_lbh = sulfur_klb_hr * 1000.0
    lb_mol_s_hr = m_sulfur_lbh / MOL_S
    
    # Volume flows (scfm) assuming complete conversion: S + O2 -> SO2
    scfm_so2 = lb_mol_s_hr * SCF_PER_LBMOL / 60.0  # Convert to per minute
    scfm_o2_consumed = scfm_so2  # Stoichiometric: 1 mol O2 per mol S
    scfm_o2_in = O2_FRAC * air_scfm
    scfm_o2_out = max(scfm_o2_in - scfm_o2_consumed, 0.0)
    scfm_n2 = N2_FRAC * air_scfm
    
    scfm_dry_total = scfm_so2 + scfm_o2_out + scfm_n2
    
    # Dry mole fractions (vol%)
    if scfm_dry_total > 0:
        pct_so2 = 100.0 * scfm_so2 / scfm_dry_total
        pct_o2 = 100.0 * scfm_o2_out / scfm_dry_total
        pct_n2 = 100.0 - pct_so2 - pct_o2
    else:
        pct_so2 = pct_o2 = pct_n2 = 0.0
    
    # Heat balance - adiabatic furnace outlet temperature
    heat_release_btu_hr = m_sulfur_lbh * HEAT_COMBUSTION
    
    # Mass flow calculations
    mol_wt_air = 28.96  # lb/lb-mol
    mol_wt_so2 = 64.06  # lb/lb-mol
    mass_air_hr = (air_scfm * 60.0 * mol_wt_air) / SCF_PER_LBMOL
    mass_so2_hr = (scfm_so2 * 60.0 * mol_wt_so2) / SCF_PER_LBMOL
    mass_gas_hr = mass_air_hr + mass_so2_hr
    
    # Temperature rise
    if mass_gas_hr > 0:
        delta_T = heat_release_btu_hr / (mass_gas_hr * CP_GAS_AVG)
    else:
        delta_T = 0.0
    
    T_out_f = T_AIR_INLET + delta_T
    T_out_c = (T_out_f - 32.0) * 5.0 / 9.0
    
    # Pressure estimate (linear scaling around typical operating point)
    P_out_inwc = 180.0 + (scfm_dry_total - 115000.0) / 1000.0 * 10.0
    P_out_inwc = max(P_out_inwc, 0.0)
    
    return {
        "mode": "Static",
        "air_scfm": air_scfm,
        "sulfur_klb_hr": sulfur_klb_hr,
        "scfm_so2": scfm_so2,
        "scfm_o2_out": scfm_o2_out,
        "scfm_n2": scfm_n2,
        "scfm_dry_total": scfm_dry_total,
        "pct_so2": pct_so2,
        "pct_o2": pct_o2,
        "pct_n2": pct_n2,
        "T_out_f": T_out_f,
        "T_out_c": T_out_c,
        "P_out_inwc": P_out_inwc,
        "heat_release_btu_hr": heat_release_btu_hr,
        "mass_flow_lb_hr": mass_gas_hr
    }

def calculate_dynamic(air_scfm: float, sulfur_klb_hr: float, 
                      time_step_seconds: float, previous_temp: float) -> dict:
    """Perform one dynamic time step with first-order temperature lag."""
    
    # Get steady-state values first
    result = calculate_static(air_scfm, sulfur_klb_hr)
    T_adiabatic = result["T_out_f"]
    
    # First-order lag: T(t) = T_prev + (T_ad - T_prev) * (1 - exp(-dt/tau))
    exp_term = 1.0 - math.exp(-time_step_seconds / TAU_THERMAL)
    T_new = previous_temp + (T_adiabatic - previous_temp) * exp_term
    
    result["mode"] = "Dynamic"
    result["T_out_f"] = T_new
    result["T_out_c"] = (T_new - 32.0) * 5.0 / 9.0
    result["T_adiabatic_f"] = T_adiabatic
    result["previous_temp"] = previous_temp
    result["new_temp"] = T_new
    
    return result

def main():
    try:
        input_data = json.load(sys.stdin)
        
        air_scfm = float(input_data.get("air_scfm", 115301))
        sulfur_klb_hr = float(input_data.get("sulfur_klb_hr", 67.68))
        mode = input_data.get("mode", "static").lower()
        time_step = float(input_data.get("time_step_seconds", 60.0))
        previous_temp = float(input_data.get("previous_temp", T_INITIAL))
        
        # Validate inputs
        if air_scfm <= 0:
            raise ValueError("Air flow must be positive")
        if sulfur_klb_hr < 0:
            raise ValueError("Sulfur flow cannot be negative")
        if math.isnan(air_scfm) or math.isnan(sulfur_klb_hr):
            raise ValueError("Invalid numeric inputs")
        
        if mode == "dynamic":
            if time_step <= 0:
                raise ValueError("Time step must be positive")
            result = calculate_dynamic(air_scfm, sulfur_klb_hr, time_step, previous_temp)
        else:
            result = calculate_static(air_scfm, sulfur_klb_hr)
        
        output = {
            "success": True,
            "results": result
        }
        
    except Exception as e:
        output = {
            "success": False,
            "error": str(e)
        }
    
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
