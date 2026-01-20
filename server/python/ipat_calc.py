# ipat_calc.py
# Core calculation logic for Interpass Absorption Tower (IPAT) simulation

import json
import sys

# Constants
SG_ACID = 1.84                  # Specific gravity ~98% H2SO4
EFFICIENCY_BASE = 0.999         # Very high efficiency for IPAT (>99.9% SO3 removal)
MW_SO3   = 80.06
MW_H2SO4 = 98.08
MW_H2O   = 18.02
SCF_PER_LBMOLE = 379.48         # at 60°F, 14.696 psia


def calculate_tower(inputs):
    """
    Calculate IPAT performance based on inlet acid and gas conditions.
    The IPAT is positioned between converter passes to remove SO3,
    shifting equilibrium to favor additional SO2 conversion.
    Returns dictionary with results to populate output fields.
    """
    results = {}

    try:
        # ── Acid Inlet (AI0) ─────────────────────────────────────────────────
        x_h2so4_ai0 = float(inputs.get("x_H2SO4_AI0", 0.985))
        x_h2o_ai0   = float(inputs.get("x_H2O_AI0",   0.015))
        m_total_ai0 = float(inputs.get("m_Total_AI0", 0.0)) * 1000  # Klb/hr → lb/hr
        pressure_ai0 = float(inputs.get("Pressure_AI0", 0.0))      # psig
        temp_ai0     = float(inputs.get("Temp_AI0", 180.0))        # °F
        flow_ai0     = float(inputs.get("Flow_AI0", 0.0))          # gpm

        # System parameters
        tower_diameter_ft = float(inputs.get("Tower_Diameter_ft", 28.0))
        packing_depth_ft = float(inputs.get("Packing_Depth_ft", 12.0))
        dp_design_inwc   = float(inputs.get("dP_BME_inWC", 6.0))
        barometric_psia  = float(inputs.get("Barometric_P_psia", 14.3))

        # Adjust efficiency slightly with packing depth (IPAT has higher base efficiency)
        efficiency = min(0.997 + 0.0002 * packing_depth_ft, EFFICIENCY_BASE)

        # Acid mass flow rate (lb/hr)
        if flow_ai0 > 0:
            mass_in_lbhr = flow_ai0 * 60 * 8.337 * SG_ACID  # lb/gal × min/hr × gal/min
        else:
            mass_in_lbhr = m_total_ai0

        h2so4_in_lbhr = mass_in_lbhr * x_h2so4_ai0
        h2o_in_lbhr   = mass_in_lbhr * x_h2o_ai0

        # ── Gas Inlet (GI0) - From Converter ────────────────────────────────
        so2_gi0   = float(inputs.get("SO2_GI0",   0.0))    # Residual SO2
        so3_gi0   = float(inputs.get("SO3_GI0",   0.0))    # SO3 to be absorbed
        o2_gi0    = float(inputs.get("O2_GI0",    0.0))
        n2_gi0    = float(inputs.get("N2_GI0",    0.0))
        h2o_gi0   = float(inputs.get("H2O_GI0",   0.0))
        h2so4_gi0 = float(inputs.get("H2SO4_GI0", 0.0))
        total_gi0 = float(inputs.get("TOTAL_GI0", 0.0))
        pressure_gi0 = float(inputs.get("PRESSURE_GI0", 0.0))
        temp_gi0 = float(inputs.get("TEMPERATURE_GI0", 0.0))

        # Use input total if provided, otherwise sum components
        total_scfm_in = total_gi0 if total_gi0 > 0 else (
            so2_gi0 + so3_gi0 + o2_gi0 + n2_gi0 + h2o_gi0 + h2so4_gi0
        )

        # ── SO3 Absorption calculation ──────────────────────────────────────
        # IPAT absorbs nearly all SO3 to shift equilibrium
        moles_so3_in_per_hr = (so3_gi0 / SCF_PER_LBMOLE) * 60
        mass_so3_absorbed_lbhr = moles_so3_in_per_hr * MW_SO3 * efficiency

        # Water consumed and acid formed: SO3 + H2O → H2SO4
        mass_h2o_consumed_lbhr = mass_so3_absorbed_lbhr * (MW_H2O / MW_SO3)
        mass_h2so4_formed_lbhr = mass_so3_absorbed_lbhr * (MW_H2SO4 / MW_SO3)

        # Outlet acid composition
        mass_out_lbhr  = mass_in_lbhr + mass_so3_absorbed_lbhr
        h2so4_out_lbhr = h2so4_in_lbhr + mass_h2so4_formed_lbhr
        h2o_out_lbhr   = max(0, h2o_in_lbhr - mass_h2o_consumed_lbhr)

        x_h2so4_out = h2so4_out_lbhr / mass_out_lbhr if mass_out_lbhr > 0 else 0.0
        x_h2o_out   = h2o_out_lbhr   / mass_out_lbhr if mass_out_lbhr > 0 else 0.0

        m_total_out_klbhr = mass_out_lbhr / 1000
        m_total_in_klbhr = mass_in_lbhr / 1000

        # Approximate outlet flow (assuming constant density)
        flow_out_gpm = flow_ai0 * (mass_out_lbhr / mass_in_lbhr) \
            if flow_ai0 > 0 and mass_in_lbhr > 0 else 0.0

        # Pressure drop across tower
        pressure_out_inwc = -dp_design_inwc
        pressure_mid_inwc = -dp_design_inwc / 2.0

        # Temperature rise from heat of absorption
        # ΔHrxn for SO3 + H2O → H2SO4 is ~132 kJ/mol exothermic
        temp_rise = mass_so3_absorbed_lbhr * 0.02 if mass_in_lbhr > 0 else 0
        temp_out = temp_ai0 + temp_rise

        # ── Gas outlet (SO3 removed) ────────────────────────────────────────
        so3_out = so3_gi0 * (1 - efficiency)  # Nearly zero after IPAT
        total_out = total_scfm_in - (so3_gi0 - so3_out)

        # Gas cooling through tower (typical 165°F inlet → 75°F outlet)
        temp_gas_mid = temp_gi0 - (temp_gi0 - 75) * 0.5
        temp_gas_out = 75  # Gas exits cool for return to converter

        # ── Results for GUI ──────────────────────────────────────────────────
        results.update({
            # Acid AIX0 & AI1 (packing outlet and tower outlet)
            "x_H2SO4_AIX0": round(x_h2so4_out, 4),
            "x_H2SO4_AI1":  round(x_h2so4_out, 4),
            "x_H2O_AIX0":   round(x_h2o_out,   4),
            "x_H2O_AI1":    round(x_h2o_out,   4),
            "m_Total_AI0":  round(m_total_in_klbhr, 1),
            "m_Total_AIX0": round(m_total_out_klbhr, 1),
            "m_Total_AI1":  round(m_total_out_klbhr, 1),
            "Pressure_AIX0": round(pressure_ai0 - (dp_design_inwc / 27.68), 1),
            "Pressure_AI1":  round(pressure_ai0 - (dp_design_inwc / 27.68), 1),
            "Temp_AIX0":     round(temp_out, 0),
            "Temp_AI1":      round(temp_out, 0),
            "Flow_AIX0":     round(flow_out_gpm, 1),
            "Flow_AI1":      round(flow_out_gpm, 1),

            # Gas GIX0 (Packing Outlet) & GI1 (Tower Outlet)
            "SO2_GIX0":    round(so2_gi0, 0),       # SO2 passes through
            "SO2_GI1":        round(so2_gi0, 0),
            "SO3_GIX0":    round(so3_out * 0.5, 0), # Partial removal at packing
            "SO3_GI1":        round(so3_out, 0),       # Nearly zero after IPAT
            "O2_GIX0":     round(o2_gi0, 0),
            "O2_GI1":         round(o2_gi0, 0),
            "N2_GIX0":     round(n2_gi0, 0),
            "N2_GI1":         round(n2_gi0, 0),
            "H2O_GIX0":    round(h2o_gi0, 0),
            "H2O_GI1":        round(h2o_gi0, 0),
            "H2SO4_GIX0":  round(h2so4_gi0, 0),
            "H2SO4_GI1":      round(h2so4_gi0, 0),
            "TOTAL_GIX0":  round((total_scfm_in + total_out) / 2, 0),
            "TOTAL_GI1":      round(total_out, 0),
            "PRESSURE_GIX0": round(pressure_mid_inwc, 1),
            "PRESSURE_GI1":   round(pressure_out_inwc, 1),
            "TEMPERATURE_GIX0": round(temp_gas_mid, 0),
            "TEMPERATURE_GI1":     round(temp_gas_out, 0),

            # Additional calculated values
            "efficiency": round(efficiency, 4),
            "mass_so3_absorbed_lbhr": round(mass_so3_absorbed_lbhr, 2),
            "mass_h2so4_formed_lbhr": round(mass_h2so4_formed_lbhr, 2),
            "tower_diameter_ft": tower_diameter_ft,
        })

    except (ValueError, ZeroDivisionError, TypeError) as e:
        results["error"] = f"Input error: {str(e)}"

    return results


def main():
    """Main entry point for command-line execution."""
    try:
        input_data = json.load(sys.stdin)
        result = calculate_tower(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
