#!/usr/bin/env python3
# main.py
# Builds pass datasets from UI variables, derives absolute pressures,
# runs segment RK4 (100 steps), and returns X–T diagram data as JSON.

from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List, Any, Optional
import json
import sys
import numpy as np

from rk_solver import (
    ATM_TO_PSIA, INWC_PER_PSI, psia_to_atm,
    get_catalyst, BedSegment, rk4_solve_segment, xt_diagram_data
)

# =============================================================================
# UI inputs (your provided dataclass, trimmed to what's needed here)
# =============================================================================

@dataclass
class CatalyticReactorInputs:
    # catalyst config
    pass1_type1: str
    pass1_liters1: float
    pass1_activity1: float
    pass1_type2: str
    pass1_liters2: float
    pass1_activity2: float

    pass2_type1: str
    pass2_liters1: float
    pass2_activity1: float

    pass3_type1: str
    pass3_liters1: float
    pass3_activity1: float

    pass4_type1: str
    pass4_liters1: float
    pass4_activity1: float
    pass4_type2: str
    pass4_liters2: float
    pass4_activity2: float

    # inlet gas composition (mol%)
    so2_percent: float
    so3_percent: float
    o2_percent: float
    co2_percent: float
    n2_percent: float
    p_barr: float  # atm
    ipat_so3_removal: float

    # process inputs
    plant_rate: float
    pass1_inlet_velocity: float  # ft/min (not used in this minimal RK demo)
    converter_diameter: float     # ft (not used in this minimal RK demo)

    # pass inlet temps (C)
    pass1_inlet_temp: float
    pass2_inlet_temp: float
    pass3_inlet_temp: float
    pass4_inlet_temp: float

    # pass inlet pressures (in. w.c gauge)
    pass1_inlet_pres: float
    pass2_inlet_pres: float
    pass3_inlet_pres: float
    pass4_inlet_pres: float


DEFAULT_INPUTS = CatalyticReactorInputs(
    pass1_type1="MECS GR330",
    pass1_liters1=12.0,
    pass1_activity1=100.0,
    pass1_type2="MECS GR330",
    pass1_liters2=24.0,
    pass1_activity2=100.0,

    pass2_type1="MECS Super Gear XLP-310",
    pass2_liters1=40.0,
    pass2_activity1=100.0,

    pass3_type1="MECS Super Gear XLP-310",
    pass3_liters1=45.0,
    pass3_activity1=100.0,

    pass4_type1="MECS Super Gear XLP-310",
    pass4_liters1=25.0,
    pass4_activity1=100.0,
    pass4_type2="MECS GR330",
    pass4_liters2=25.0,
    pass4_activity2=100.0,

    so2_percent=11.3,
    so3_percent=0.2,
    o2_percent=9.5,
    co2_percent=0.0,
    n2_percent=79.0,
    p_barr=0.85,
    ipat_so3_removal=100.0,

    plant_rate=2480.0,
    pass1_inlet_velocity=145.0,
    converter_diameter=42.0,

    pass1_inlet_temp=390.0,
    pass2_inlet_temp=420.0,
    pass3_inlet_temp=440.0,
    pass4_inlet_temp=390.0,

    pass1_inlet_pres=150.0,
    pass2_inlet_pres=135.0,
    pass3_inlet_pres=100.0,
    pass4_inlet_pres=60.0,
)


# =============================================================================
# Pressure derivation: P_abs from P_barr (atm) + gauge (in.w.c)
# =============================================================================

def inlet_abs_pressure_atm(p_barr_atm: float, p_gauge_inwc: float) -> float:
    p_barr_psia = p_barr_atm * ATM_TO_PSIA
    p_gauge_psi = p_gauge_inwc / INWC_PER_PSI
    p_abs_psia = p_barr_psia + p_gauge_psi
    return psia_to_atm(p_abs_psia)


# =============================================================================
# Build inlet gas mole fractions from UI mol%
# =============================================================================

def inlet_mole_fractions(inputs: CatalyticReactorInputs) -> Dict[str, float]:
    y = {
        "SO2": inputs.so2_percent / 100.0,
        "SO3": inputs.so3_percent / 100.0,
        "O2":  inputs.o2_percent  / 100.0,
        "CO2": inputs.co2_percent / 100.0,
        "N2":  inputs.n2_percent  / 100.0,
    }
    s = sum(y.values())
    return {k: v/s for k, v in y.items()}


# =============================================================================
# Build bed segments (Pass 1: 2 layers, Pass 2: 1, Pass 3: 1, Pass 4: 2)
# This returns a flat list of segments, each run sequentially.
# =============================================================================

def build_segments(inputs: CatalyticReactorInputs) -> List[BedSegment]:
    y0 = inlet_mole_fractions(inputs)

    P1_atm = inlet_abs_pressure_atm(inputs.p_barr, inputs.pass1_inlet_pres)
    P2_atm = inlet_abs_pressure_atm(inputs.p_barr, inputs.pass2_inlet_pres)
    P3_atm = inlet_abs_pressure_atm(inputs.p_barr, inputs.pass3_inlet_pres)
    P4_atm = inlet_abs_pressure_atm(inputs.p_barr, inputs.pass4_inlet_pres)

    # Placeholder total molar flow basis for RK scaling:
    # you can replace with real FT0 derived from plant rate & composition
    FT0_lbmol_hr = 250.0

    segs: List[BedSegment] = []

    # Pass 1, layer 1
    segs.append(BedSegment(
        name="Pass1-L1",
        catalyst=get_catalyst(inputs.pass1_type1),
        liters=inputs.pass1_liters1,
        activity_percent=inputs.pass1_activity1,
        Tin_C=inputs.pass1_inlet_temp,
        Pin_abs_atm=P1_atm,
        FT0_lbmol_hr=FT0_lbmol_hr,
        y0=y0,
        n_steps=100
    ))
    # Pass 1, layer 2
    segs.append(BedSegment(
        name="Pass1-L2",
        catalyst=get_catalyst(inputs.pass1_type2),
        liters=inputs.pass1_liters2,
        activity_percent=inputs.pass1_activity2,
        Tin_C=inputs.pass1_inlet_temp,   # will be overwritten with outlet of L1 when run
        Pin_abs_atm=P1_atm,
        FT0_lbmol_hr=FT0_lbmol_hr,
        y0=y0,
        n_steps=100
    ))

    # Pass 2
    segs.append(BedSegment(
        name="Pass2",
        catalyst=get_catalyst(inputs.pass2_type1),
        liters=inputs.pass2_liters1,
        activity_percent=inputs.pass2_activity1,
        Tin_C=inputs.pass2_inlet_temp,
        Pin_abs_atm=P2_atm,
        FT0_lbmol_hr=FT0_lbmol_hr,
        y0=y0,
        n_steps=100
    ))

    # Pass 3
    segs.append(BedSegment(
        name="Pass3",
        catalyst=get_catalyst(inputs.pass3_type1),
        liters=inputs.pass3_liters1,
        activity_percent=inputs.pass3_activity1,
        Tin_C=inputs.pass3_inlet_temp,
        Pin_abs_atm=P3_atm,
        FT0_lbmol_hr=FT0_lbmol_hr,
        y0=y0,
        n_steps=100
    ))

    # Pass 4, layer 1
    segs.append(BedSegment(
        name="Pass4-L1",
        catalyst=get_catalyst(inputs.pass4_type1),
        liters=inputs.pass4_liters1,
        activity_percent=inputs.pass4_activity1,
        Tin_C=inputs.pass4_inlet_temp,
        Pin_abs_atm=P4_atm,
        FT0_lbmol_hr=FT0_lbmol_hr,
        y0=y0,
        n_steps=100
    ))
    # Pass 4, layer 2
    segs.append(BedSegment(
        name="Pass4-L2",
        catalyst=get_catalyst(inputs.pass4_type2),
        liters=inputs.pass4_liters2,
        activity_percent=inputs.pass4_activity2,
        Tin_C=inputs.pass4_inlet_temp,   # overwritten from L1 outlet
        Pin_abs_atm=P4_atm,
        FT0_lbmol_hr=FT0_lbmol_hr,
        y0=y0,
        n_steps=100
    ))

    return segs


# =============================================================================
# IPAT SO3 Removal: Calculate post-absorption gas composition
# =============================================================================

def apply_ipat_so3_removal(y_in: Dict[str, float], removal_fraction: float) -> Dict[str, float]:
    """
    Apply Interpass Absorption Tower (IPAT) SO3 removal to gas composition.
    
    In a 3-1 double absorption plant, after Pass 3:
    1. Gas goes to IPAT where SO3 is absorbed into H2SO4
    2. The SO3 is removed from the gas stream (reduction in total moles)
    3. Remaining components (SO2, O2, N2, CO2) have higher mole fractions
       because the total moles decreased
    
    Args:
        y_in: Inlet mole fractions before IPAT (after Pass 3)
        removal_fraction: Fraction of SO3 to remove (0-1, typically ~1.0 for 100%)
    
    Returns:
        Post-IPAT mole fractions (normalized to 1.0)
    """
    ySO2 = y_in.get("SO2", 0.0)
    ySO3 = y_in.get("SO3", 0.0)
    yO2 = y_in.get("O2", 0.0)
    yN2 = y_in.get("N2", 0.0)
    yCO2 = y_in.get("CO2", 0.0)
    
    # Calculate SO3 removed (moles per mole of inlet gas)
    so3_removed = ySO3 * removal_fraction
    ySO3_new = ySO3 - so3_removed
    
    # Total moles after SO3 removal (per mole of inlet gas before IPAT)
    total_moles_after = ySO2 + ySO3_new + yO2 + yN2 + yCO2
    
    if total_moles_after <= 0:
        return y_in  # Fallback if something goes wrong
    
    # Renormalize to get new mole fractions
    # SO2, O2, N2, CO2 mole fractions INCREASE because denominator is smaller
    y_out = {
        "SO2": ySO2 / total_moles_after,
        "SO3": ySO3_new / total_moles_after,
        "O2": yO2 / total_moles_after,
        "N2": yN2 / total_moles_after,
        "CO2": yCO2 / total_moles_after,
    }
    
    return y_out


# =============================================================================
# Run sequentially: chain passes by updating gas composition between passes.
# Within a pass (L1 -> L2), composition updates continuously.
# Between passes (after intercooling), gas composition reflects cumulative conversion.
# =============================================================================

from rk_solver import y_at_conversion

def run_all_segments(inputs: CatalyticReactorInputs) -> List[Dict[str, Any]]:
    """
    Run all segments sequentially, properly chaining:
    - Within-pass layers (L1 -> L2): Outlet T and composition feed next layer
    - Between passes: Use user-specified inlet T but updated composition
    - IPAT SO3 removal: After Pass 3, SO3 is absorbed, changing gas composition
    
    Returns list of segment results with proper overall conversion tracking.
    """
    segs = build_segments(inputs)
    y0_original = inlet_mole_fractions(inputs)  # Original inlet composition
    
    results = []
    overall_X_in = 0.0   # Overall conversion at segment inlet
    overall_X_out = 0.0  # Overall conversion at segment outlet
    last_Tout = None
    
    # Track IPAT application
    ipat_applied = False
    y_post_ipat = None  # Will hold composition after IPAT SO3 removal (new base)
    X_at_ipat = 0.0     # Overall conversion at the point IPAT was applied
    ipat_data = None    # Will store IPAT removal info
    
    for i, seg in enumerate(segs):
        seg_name = seg.name
        
        # Track inlet conversion (from previous segment outlet)
        overall_X_in = overall_X_out
        
        # Determine if this is a continuation layer within same pass
        is_continuation_layer = "-L2" in seg_name
        
        if is_continuation_layer and last_Tout is not None:
            # Within-pass layer: use previous layer's outlet temperature
            seg.Tin_C = float(last_Tout)
        
        # Check if we're entering Pass 4 and need to apply IPAT
        is_pass4_start = seg_name.startswith("Pass4") and not ipat_applied
        
        if is_pass4_start and inputs.ipat_so3_removal > 0:
            # Apply IPAT SO3 removal between Pass 3 and Pass 4
            # First, get the gas composition at the end of Pass 3
            y_before_ipat = y_at_conversion(y0_original, overall_X_in)
            
            # Apply SO3 removal (ipat_so3_removal is in %, convert to fraction)
            removal_fraction = min(inputs.ipat_so3_removal / 100.0, 1.0)
            y_post_ipat = apply_ipat_so3_removal(y_before_ipat, removal_fraction)
            
            # Store the conversion at IPAT point - this becomes the new "zero" for Pass 4
            X_at_ipat = overall_X_in
            
            # Store IPAT data for output
            ipat_data = {
                "applied_after_pass": 3,
                "so3_removal_pct": inputs.ipat_so3_removal,
                "y_before": y_before_ipat,
                "y_after": y_post_ipat,
            }
            ipat_applied = True
        
        # Update segment's inlet composition
        if ipat_applied and y_post_ipat is not None:
            # For Pass 4 onwards: y_post_ipat is the NEW BASE composition
            # For the first Pass 4 segment (L1), use post-IPAT composition directly (X_relative = 0)
            # For subsequent segments in Pass 4, calculate relative conversion
            if seg_name == "Pass4-L1":
                # First Pass 4 layer: use post-IPAT composition as-is (no conversion yet in Pass 4)
                # Ensure SO3 is explicitly set to 0 (IPAT removed it)
                seg.y0 = y_post_ipat.copy()
                seg.y0["SO3"] = 0.0
                # Renormalize to ensure mole fractions sum to 1.0
                total = sum(seg.y0.values())
                if total > 1e-9:
                    seg.y0 = {k: v/total for k, v in seg.y0.items()}
            else:
                # Subsequent Pass 4 layers: calculate relative conversion from IPAT baseline
                X_relative = (overall_X_in - X_at_ipat) / (1.0 - X_at_ipat) if (1.0 - X_at_ipat) > 1e-9 else 0.0
                X_relative = max(0.0, min(X_relative, 1.0))
                
                # Apply conversion-based composition update using post-IPAT as new base
                seg.y0 = y_at_conversion(y_post_ipat, X_relative)
        else:
            # Pre-IPAT: use conversion-based composition from original inlet
            seg.y0 = y_at_conversion(y0_original, overall_X_in)
        
        # Run RK4 for this segment
        res = rk4_solve_segment(seg)
        
        # Segment conversion (relative to segment inlet)
        segment_X_out = res.X[-1]
        
        # Calculate overall conversion at outlet:
        # overall_X_out = overall_X_in + (1 - overall_X_in) * segment_X_out
        overall_X_out = overall_X_in + (1.0 - overall_X_in) * segment_X_out
        
        # Build overall conversion profile for this segment
        # res.X is segment-relative (0 to segment_X_out), convert to overall in percent
        # Formula: overall = overall_X_in + (1 - overall_X_in) * segment_X
        # where segment_X is a fraction (res.X values), result in fraction, then * 100 for percent
        X_overall_pct = [(overall_X_in + (1.0 - overall_X_in) * x) * 100 for x in res.X]
        
        result_dict = {
            "name": seg_name,
            "Tin_C": float(seg.Tin_C),
            "Tout_C": float(res.T_C[-1]),
            "Xin_pct": float(overall_X_in * 100),
            "Xout_pct": float(overall_X_out * 100),
            "segment_X_pct": float(segment_X_out * 100),
            "z": res.z.tolist(),
            "T_C": res.T_C.tolist(),
            "X_pct": X_overall_pct,  # Overall conversion profile
            "X_segment_pct": (res.X * 100).tolist(),  # Segment-relative conversion
            "Xeq_pct": (res.Xeq * 100).tolist(),
            "y_inlet": seg.y0,  # Include inlet composition for debugging
        }
        
        # Add IPAT info to first Pass 4 segment
        if is_pass4_start and ipat_data is not None:
            result_dict["ipat_data"] = ipat_data
        
        results.append(result_dict)
        
        # Update for next segment
        last_Tout = res.T_C[-1]

    return results


# =============================================================================
# Calculate pass conversion using simplified heuristic model
# (Ported from TypeScript to match Pass Profile Table calculations)
# =============================================================================

def calculate_pass_conversion(inlet_so2: float, inlet_temp: float, catalyst_activity: float, pass_number: int) -> Dict[str, float]:
    """
    Simplified SO2 conversion model based on temperature and catalyst activity.
    Returns dict with 'conversion' (pass-level %) and 'equilibrium' (%).
    
    This matches the TypeScript calculatePassConversion function in routes.ts.
    """
    # Equilibrium conversion increases with temperature (simplified)
    equilibrium = min(99.8, 65 + (inlet_temp - 380) * 0.15)
    
    # Actual conversion depends on catalyst activity and SO2 concentration
    base_conversion = equilibrium * (catalyst_activity / 100) * 0.85
    
    # First pass typically has highest conversion
    pass_factors = [1.0, 0.92, 0.88, 0.75]
    conversion = min(equilibrium, base_conversion * pass_factors[pass_number - 1])
    
    return {"conversion": conversion, "equilibrium": equilibrium}


# =============================================================================
# Generate X–T diagram data as JSON-serializable dict
# =============================================================================

def generate_xt_diagram(inputs: CatalyticReactorInputs, segment_results: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Generate X-T diagram data. If segment_results is provided (from RK4 simulation),
    use actual simulation values. Otherwise fall back to heuristic model.
    """
    y0 = inlet_mole_fractions(inputs)
    P1_atm = inlet_abs_pressure_atm(inputs.p_barr, inputs.pass1_inlet_pres)

    # pick catalyst & activity for the "max rate curve" reference
    catalyst_name = inputs.pass1_type1
    activity_pct = inputs.pass1_activity1

    data = xt_diagram_data(
        y0=y0,
        P_atm=P1_atm,
        Tin_C=inputs.pass1_inlet_temp,
        T_range_C=(350.0, 650.0),
        catalyst_name=catalyst_name,
        activity_percent=activity_pct,
        nT=140,
        nX=140
    )

    # =========================================================================
    # Build staircase operating line using actual RK4 simulation results
    # =========================================================================
    
    if segment_results:
        # Use actual simulation results to build operating line
        # Combine multi-layer passes (Pass1-L1+L2, Pass4-L1+L2) into single pass data
        
        # Map segment names to pass numbers and aggregate
        pass_data = {}  # pass_num -> {inlet_temp, outlet_temp, inlet_conv, outlet_conv}
        
        for seg in segment_results:
            seg_name = seg["name"]
            
            # Determine pass number from segment name
            if seg_name.startswith("Pass1"):
                pass_num = 1
            elif seg_name.startswith("Pass2"):
                pass_num = 2
            elif seg_name.startswith("Pass3"):
                pass_num = 3
            elif seg_name.startswith("Pass4"):
                pass_num = 4
            else:
                continue
            
            # Check if this is L1 (first layer) or L2 (second layer)
            is_first_layer = "-L1" in seg_name or seg_name in ["Pass2", "Pass3"]
            is_last_layer = "-L2" in seg_name or seg_name in ["Pass2", "Pass3"]
            
            if pass_num not in pass_data:
                # Initialize pass data with first segment
                pass_data[pass_num] = {
                    "pass_num": pass_num,
                    "inlet_temp": seg["Tin_C"],
                    "outlet_temp": seg["Tout_C"],
                    "inlet_conv": seg["Xin_pct"],
                    "outlet_conv": seg["Xout_pct"]
                }
            else:
                # Update outlet values from subsequent layers (L2)
                pass_data[pass_num]["outlet_temp"] = seg["Tout_C"]
                pass_data[pass_num]["outlet_conv"] = seg["Xout_pct"]
        
        # Convert to sorted list
        pass_conversions = [pass_data[i] for i in sorted(pass_data.keys())]
    else:
        # Fallback to heuristic model
        passes = [
            {"temp": inputs.pass1_inlet_temp, "activity": inputs.pass1_activity1, "liters": inputs.pass1_liters1},
            {"temp": inputs.pass2_inlet_temp, "activity": inputs.pass2_activity1, "liters": inputs.pass2_liters1},
            {"temp": inputs.pass3_inlet_temp, "activity": inputs.pass3_activity1, "liters": inputs.pass3_liters1},
            {"temp": inputs.pass4_inlet_temp, "activity": inputs.pass4_activity1, "liters": inputs.pass4_liters1},
        ]
        
        current_so2 = inputs.so2_percent
        so2_original = inputs.so2_percent
        
        pass_conversions = []
        
        for idx, p in enumerate(passes):
            pass_num = idx + 1
            result = calculate_pass_conversion(current_so2, p["temp"], p["activity"], pass_num)
            pass_conversion = result["conversion"]
            so2_converted = current_so2 * (pass_conversion / 100)
            current_so2 -= so2_converted
            overall_conversion_at_outlet = ((so2_original - current_so2) / so2_original) * 100
            temp_rise = (pass_conversion / 100) * 100
            outlet_temp = p["temp"] + temp_rise
            
            pass_conversions.append({
                "pass_num": pass_num,
                "inlet_temp": p["temp"],
                "outlet_temp": outlet_temp,
                "inlet_conv": pass_conversions[-1]["outlet_conv"] if pass_conversions else 0.0,
                "outlet_conv": overall_conversion_at_outlet
            })
    
    # Build operating line points as staircase pattern
    operating_line_points = []
    pass_labels = []
    
    for pdata in pass_conversions:
        pass_num = pdata["pass_num"]
        inlet_temp = pdata["inlet_temp"]
        outlet_temp = pdata["outlet_temp"]
        inlet_conversion = pdata["inlet_conv"]
        outlet_conversion = pdata["outlet_conv"]
        
        # Add pass inlet label for passes 2-4 (marks horizontal cooling end)
        if pass_num > 1:
            pass_labels.append({
                "passNumber": pass_num,
                "temperature": float(inlet_temp),
                "conversion": float(inlet_conversion),
                "label": f"Pass {pass_num} Inlet Temp"
            })
        
        # Pass inlet point (start of diagonal - conversion begins)
        operating_line_points.append({
            "temperature": float(inlet_temp),
            "conversion": float(inlet_conversion),
            "type": "pass_inlet",
            "passNumber": pass_num
        })
        
        # Pass outlet point (end of diagonal - conversion ends)
        operating_line_points.append({
            "temperature": float(outlet_temp),
            "conversion": float(outlet_conversion),
            "type": "pass_outlet",
            "passNumber": pass_num
        })

    # Convert numpy arrays to lists for JSON serialization
    return {
        "equilibriumLine": [
            {"temperature": float(t), "conversion": float(x)} 
            for t, x in zip(data["T_eq_C"], data["X_eq_pct"])
        ],
        "operatingLine": operating_line_points,
        "maxRateCurve": [
            {"temperature": float(t), "conversion": float(x)} 
            for t, x in zip(data["T_rmax_C"], data["X_rmax_pct"])
        ],
        "passLabels": pass_labels,
        "metadata": {
            "Tin_C": inputs.pass1_inlet_temp,
            "P_atm": P1_atm,
            "catalyst": catalyst_name,
            "activity_pct": activity_pct,
            "so2_inlet_pct": inputs.so2_percent,
        }
    }


# =============================================================================
# Parse inputs from JSON
# =============================================================================

def parse_inputs_from_json(data: Dict[str, Any]) -> CatalyticReactorInputs:
    """Parse JSON input data into CatalyticReactorInputs dataclass."""
    return CatalyticReactorInputs(
        pass1_type1=data.get("pass1Type1", DEFAULT_INPUTS.pass1_type1),
        pass1_liters1=float(data.get("pass1Liters1", DEFAULT_INPUTS.pass1_liters1)),
        pass1_activity1=float(data.get("pass1Activity1", DEFAULT_INPUTS.pass1_activity1)),
        pass1_type2=data.get("pass1Type2", DEFAULT_INPUTS.pass1_type2),
        pass1_liters2=float(data.get("pass1Liters2", DEFAULT_INPUTS.pass1_liters2)),
        pass1_activity2=float(data.get("pass1Activity2", DEFAULT_INPUTS.pass1_activity2)),
        
        pass2_type1=data.get("pass2Type1", DEFAULT_INPUTS.pass2_type1),
        pass2_liters1=float(data.get("pass2Liters1", DEFAULT_INPUTS.pass2_liters1)),
        pass2_activity1=float(data.get("pass2Activity1", DEFAULT_INPUTS.pass2_activity1)),
        
        pass3_type1=data.get("pass3Type1", DEFAULT_INPUTS.pass3_type1),
        pass3_liters1=float(data.get("pass3Liters1", DEFAULT_INPUTS.pass3_liters1)),
        pass3_activity1=float(data.get("pass3Activity1", DEFAULT_INPUTS.pass3_activity1)),
        
        pass4_type1=data.get("pass4Type1", DEFAULT_INPUTS.pass4_type1),
        pass4_liters1=float(data.get("pass4Liters1", DEFAULT_INPUTS.pass4_liters1)),
        pass4_activity1=float(data.get("pass4Activity1", DEFAULT_INPUTS.pass4_activity1)),
        pass4_type2=data.get("pass4Type2", DEFAULT_INPUTS.pass4_type2),
        pass4_liters2=float(data.get("pass4Liters2", DEFAULT_INPUTS.pass4_liters2)),
        pass4_activity2=float(data.get("pass4Activity2", DEFAULT_INPUTS.pass4_activity2)),
        
        so2_percent=float(data.get("so2Percent", DEFAULT_INPUTS.so2_percent)),
        so3_percent=float(data.get("so3Percent", DEFAULT_INPUTS.so3_percent)),
        o2_percent=float(data.get("o2Percent", DEFAULT_INPUTS.o2_percent)),
        co2_percent=float(data.get("co2Percent", DEFAULT_INPUTS.co2_percent)),
        n2_percent=float(data.get("n2Percent", DEFAULT_INPUTS.n2_percent)),
        p_barr=float(data.get("pBarr", DEFAULT_INPUTS.p_barr)),
        ipat_so3_removal=float(data.get("ipatSo3Removal", DEFAULT_INPUTS.ipat_so3_removal)),
        
        plant_rate=float(str(data.get("plantRate", DEFAULT_INPUTS.plant_rate)).replace(",", "")),
        pass1_inlet_velocity=float(data.get("pass1InletVelocity", DEFAULT_INPUTS.pass1_inlet_velocity)),
        converter_diameter=float(data.get("converterDiameter", DEFAULT_INPUTS.converter_diameter)),
        
        pass1_inlet_temp=float(data.get("pass1InletTemp", DEFAULT_INPUTS.pass1_inlet_temp)),
        pass2_inlet_temp=float(data.get("pass2InletTemp", DEFAULT_INPUTS.pass2_inlet_temp)),
        pass3_inlet_temp=float(data.get("pass3InletTemp", DEFAULT_INPUTS.pass3_inlet_temp)),
        pass4_inlet_temp=float(data.get("pass4InletTemp", DEFAULT_INPUTS.pass4_inlet_temp)),
        
        pass1_inlet_pres=float(data.get("pass1InletPres", DEFAULT_INPUTS.pass1_inlet_pres)),
        pass2_inlet_pres=float(data.get("pass2InletPres", DEFAULT_INPUTS.pass2_inlet_pres)),
        pass3_inlet_pres=float(data.get("pass3InletPres", DEFAULT_INPUTS.pass3_inlet_pres)),
        pass4_inlet_pres=float(data.get("pass4InletPres", DEFAULT_INPUTS.pass4_inlet_pres)),
    )


# =============================================================================
# Main entry point for API calls
# =============================================================================

def main():
    """
    Entry point for API calls.
    Reads JSON from stdin, processes simulation, outputs JSON to stdout.
    """
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Parse inputs
        inputs = parse_inputs_from_json(input_data)
        
        # Run simulation and generate X-T diagram using actual simulation results
        segment_results = run_all_segments(inputs)
        xt_data = generate_xt_diagram(inputs, segment_results)
        
        # Combine results
        output = {
            "success": True,
            "xtDiagram": xt_data,
            "segmentResults": segment_results,
            "derivedPressures": {
                "pass1_atm": inlet_abs_pressure_atm(inputs.p_barr, inputs.pass1_inlet_pres),
                "pass2_atm": inlet_abs_pressure_atm(inputs.p_barr, inputs.pass2_inlet_pres),
                "pass3_atm": inlet_abs_pressure_atm(inputs.p_barr, inputs.pass3_inlet_pres),
                "pass4_atm": inlet_abs_pressure_atm(inputs.p_barr, inputs.pass4_inlet_pres),
            }
        }
        
        # Output JSON to stdout
        print(json.dumps(output))
        
    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e),
            "errorType": type(e).__name__
        }
        print(json.dumps(error_output))
        sys.exit(1)


if __name__ == "__main__":
    main()
