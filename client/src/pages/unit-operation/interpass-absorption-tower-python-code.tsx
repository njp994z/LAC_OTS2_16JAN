import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import expLogo from "@/assets/exp-logo.png";

const pythonCode = `# ipat_calc.py
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
        # ── Acid Inlet (AD0) ─────────────────────────────────────────────────
        x_h2so4_ad0 = float(inputs.get("x_H2SO4_AD0", 0.985))
        x_h2o_ad0   = float(inputs.get("x_H2O_AD0",   0.015))
        m_total_ad0 = float(inputs.get("m_Total_AD0", 0.0)) * 1000  # Klb/hr → lb/hr
        pressure_ad0 = float(inputs.get("Pressure_AD0", 0.0))      # psig
        temp_ad0     = float(inputs.get("Temp_AD0", 180.0))        # °F
        flow_ad0     = float(inputs.get("Flow_AD0", 0.0))          # gpm

        # System parameters
        tower_diameter_ft = float(inputs.get("Tower_Diameter_ft", 28.0))
        packing_depth_ft = float(inputs.get("Packing_Depth_ft", 12.0))
        dp_design_inwc   = float(inputs.get("dP_BME_inWC", 6.0))
        barometric_psia  = float(inputs.get("Barometric_P_psia", 14.3))

        # Adjust efficiency slightly with packing depth (IPAT has higher base efficiency)
        efficiency = min(0.997 + 0.0002 * packing_depth_ft, EFFICIENCY_BASE)

        # Acid mass flow rate (lb/hr)
        if flow_ad0 > 0:
            mass_in_lbhr = flow_ad0 * 60 * 8.337 * SG_ACID  # lb/gal × min/hr × gal/min
        else:
            mass_in_lbhr = m_total_ad0

        h2so4_in_lbhr = mass_in_lbhr * x_h2so4_ad0
        h2o_in_lbhr   = mass_in_lbhr * x_h2o_ad0

        # ── Gas Inlet (GD0) - From Converter ────────────────────────────────
        so2_gd0   = float(inputs.get("SO2_GD0",   0.0))    # Residual SO2
        so3_gd0   = float(inputs.get("SO3_GD0",   0.0))    # SO3 to be absorbed
        o2_gd0    = float(inputs.get("O2_GD0",    0.0))
        n2_gd0    = float(inputs.get("N2_GD0",    0.0))
        h2o_gd0   = float(inputs.get("H2O_GD0",   0.0))
        h2so4_gd0 = float(inputs.get("H2SO4_GD0", 0.0))
        total_gd0 = float(inputs.get("TOTAL_GD0", 0.0))
        pressure_gd0 = float(inputs.get("PRESSURE_GD0", 0.0))
        temp_gd0 = float(inputs.get("TEMPERATURE_GD0", 0.0))

        # Use input total if provided, otherwise sum components
        total_scfm_in = total_gd0 if total_gd0 > 0 else (
            so2_gd0 + so3_gd0 + o2_gd0 + n2_gd0 + h2o_gd0 + h2so4_gd0
        )

        # ── SO3 Absorption calculation ──────────────────────────────────────
        # IPAT absorbs nearly all SO3 to shift equilibrium
        moles_so3_in_per_hr = (so3_gd0 / SCF_PER_LBMOLE) * 60
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
        flow_out_gpm = flow_ad0 * (mass_out_lbhr / mass_in_lbhr) \\
            if flow_ad0 > 0 and mass_in_lbhr > 0 else 0.0

        # Pressure drop across tower
        pressure_out_inwc = -dp_design_inwc
        pressure_mid_inwc = -dp_design_inwc / 2.0

        # Temperature rise from heat of absorption
        # ΔHrxn for SO3 + H2O → H2SO4 is ~132 kJ/mol exothermic
        temp_rise = mass_so3_absorbed_lbhr * 0.02 if mass_in_lbhr > 0 else 0
        temp_out = temp_ad0 + temp_rise

        # ── Gas outlet (SO3 removed) ────────────────────────────────────────
        so3_out = so3_gd0 * (1 - efficiency)  # Nearly zero after IPAT
        total_out = total_scfm_in - (so3_gd0 - so3_out)

        # Gas cooling through tower (typical 165°F inlet → 75°F outlet)
        temp_gas_mid = temp_gd0 - (temp_gd0 - 75) * 0.5
        temp_gas_out = 75  # Gas exits cool for return to converter

        # ── Results for GUI ──────────────────────────────────────────────────
        results.update({
            # Acid ADX1 & AD1 (packing outlet and tower outlet)
            "x_H2SO4_ADX1": round(x_h2so4_out, 4),
            "x_H2SO4_AD1":  round(x_h2so4_out, 4),
            "x_H2O_ADX1":   round(x_h2o_out,   4),
            "x_H2O_AD1":    round(x_h2o_out,   4),
            "m_Total_AD0":  round(m_total_in_klbhr, 1),
            "m_Total_ADX1": round(m_total_out_klbhr, 1),
            "m_Total_AD1":  round(m_total_out_klbhr, 1),
            "Pressure_ADX1": round(pressure_ad0 - (dp_design_inwc / 27.68), 1),
            "Pressure_AD1":  round(pressure_ad0 - (dp_design_inwc / 27.68), 1),
            "Temp_ADX1":     round(temp_out, 0),
            "Temp_AD1":      round(temp_out, 0),
            "Flow_ADX1":     round(flow_out_gpm, 1),
            "Flow_AD1":      round(flow_out_gpm, 1),

            # Gas Packing Outlet & GD1
            "SO2_Packing":    round(so2_gd0, 0),       # SO2 passes through
            "SO2_GD1":        round(so2_gd0, 0),
            "SO3_Packing":    round(so3_out * 0.5, 0), # Partial removal at packing
            "SO3_GD1":        round(so3_out, 0),       # Nearly zero after IPAT
            "O2_Packing":     round(o2_gd0, 0),
            "O2_GD1":         round(o2_gd0, 0),
            "N2_Packing":     round(n2_gd0, 0),
            "N2_GD1":         round(n2_gd0, 0),
            "H2O_Packing":    round(h2o_gd0, 0),
            "H2O_GD1":        round(h2o_gd0, 0),
            "H2SO4_Packing":  round(h2so4_gd0, 0),
            "H2SO4_GD1":      round(h2so4_gd0, 0),
            "TOTAL_Packing":  round((total_scfm_in + total_out) / 2, 0),
            "TOTAL_GD1":      round(total_out, 0),
            "PRESSURE_Packing": round(pressure_mid_inwc, 1),
            "PRESSURE_GD1":   round(pressure_out_inwc, 1),
            "TEMPERATURE_Packing": round(temp_gas_mid, 0),
            "TEMPERATURE_GD1":     round(temp_gas_out, 0),

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
`;

export default function InterpassAbsorptionTowerPythonCode() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-[9999] border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/unit-operation/interpass-absorption-tower")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Interpass Absorption Tower (IPAT) Python Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden">
                <SyntaxHighlighter
                  language="python"
                  style={vscDarkPlus}
                  showLineNumbers
                  customStyle={{
                    margin: 0,
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  {pythonCode}
                </SyntaxHighlighter>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
