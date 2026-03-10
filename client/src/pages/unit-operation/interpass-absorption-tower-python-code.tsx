import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import expLogo from "@/assets/exp-logo.png";

const pythonCode = `# ipat_calc.py
# Interpass Absorption Tower (IPAT)
# 100% SO3 absorption
# 32°F standard gas basis
# Full material and energy balance

import json
import sys

# ───────────────────────────────────────────────────────────────
# Constants
# ───────────────────────────────────────────────────────────────

SG_ACID = 1.84

MW_SO3   = 80.06
MW_H2SO4 = 98.08
MW_H2O   = 18.02

# Standard cubic feet per lbmol at 32°F
SCF_PER_LBMOLE = 359.05

CP_ACID_BTU_LB_F = 0.33

CP_GAS_BTU_LBMOL_F = {
    "SO2": 10.5,
    "SO3": 12.0,
    "O2":  7.3,
    "N2":  7.0,
    "H2O": 8.0,
}

# Reaction enthalpy SO3 + H2O → H2SO4
# Default: −132 kJ/mol
KJ_PER_MOL_TO_BTU_PER_LBMOL = 430.21
DH_RXN_KJ_PER_MOL_DEFAULT = -132.0
DH_RXN_BTU_PER_LBMOL_DEFAULT = DH_RXN_KJ_PER_MOL_DEFAULT * KJ_PER_MOL_TO_BTU_PER_LBMOL


# ───────────────────────────────────────────────────────────────
# Calculation
# ───────────────────────────────────────────────────────────────

def calculate_tower(inputs):

    results = {}

    try:

        # ==========================================================
        # Inlet Acid — AI0
        # ==========================================================
        x_h2so4_ai0 = float(inputs.get("x_H2SO4_AI0", 0.985))
        x_h2o_ai0   = float(inputs.get("x_H2O_AI0",   0.015))
        m_total_ai0 = float(inputs.get("m_Total_AI0", 0.0)) * 1000
        temp_ai0    = float(inputs.get("Temp_AI0", 180.0))
        flow_ai0    = float(inputs.get("Flow_AI0", 0.0))
        pressure_ai0 = float(inputs.get("Pressure_AI0", 0.0))

        # System parameters
        tower_diameter_ft = float(inputs.get("Tower_Diameter_ft", 28.0))
        packing_depth_ft  = float(inputs.get("Packing_Depth_ft", 12.0))
        dp_design_inwc    = float(inputs.get("dP_BME_inWC", 6.0))
        barometric_psia   = float(inputs.get("Barometric_P_psia", 14.3))

        if flow_ai0 > 0:
            mass_ai0_lbhr = flow_ai0 * 60 * 8.337 * SG_ACID
        else:
            mass_ai0_lbhr = m_total_ai0

        h2so4_ai0_lbhr = mass_ai0_lbhr * x_h2so4_ai0
        h2o_ai0_lbhr   = mass_ai0_lbhr * x_h2o_ai0

        # ==========================================================
        # Inlet Gas — GI0
        # ==========================================================
        so2_gi0 = float(inputs.get("SO2_GI0", 0.0))
        so3_gi0 = float(inputs.get("SO3_GI0", 0.0))
        o2_gi0  = float(inputs.get("O2_GI0",  0.0))
        n2_gi0  = float(inputs.get("N2_GI0",  0.0))
        h2o_gi0 = float(inputs.get("H2O_GI0", 0.0))
        h2so4_gi0 = float(inputs.get("H2SO4_GI0", 0.0))

        temp_gi0 = float(inputs.get("TEMPERATURE_GI0", 400.0))
        pressure_gi0 = float(inputs.get("PRESSURE_GI0", 0.0))
        temp_gi1_target = float(inputs.get("Temp_GI1", 180.0))

        total_gi0 = float(inputs.get("TOTAL_GI0", 0.0))
        if total_gi0 <= 0:
            total_gi0 = so2_gi0 + so3_gi0 + o2_gi0 + n2_gi0 + h2o_gi0 + h2so4_gi0

        def scfm_to_lbmol_hr(scfm):
            return (scfm / SCF_PER_LBMOLE) * 60.0

        # ==========================================================
        # 100% SO3 Absorption
        # ==========================================================
        n_so3_in = scfm_to_lbmol_hr(so3_gi0)
        n_so3_abs = n_so3_in   # 100% absorption

        mass_so3_abs_lbhr = n_so3_abs * MW_SO3
        mass_h2o_used_lbhr = n_so3_abs * MW_H2O
        mass_h2so4_formed_lbhr = n_so3_abs * MW_H2SO4

        # ==========================================================
        # Outlet Acid — AI1 (Material Balance)
        # ==========================================================
        mass_ai1_lbhr  = mass_ai0_lbhr + mass_so3_abs_lbhr
        h2so4_ai1_lbhr = h2so4_ai0_lbhr + mass_h2so4_formed_lbhr
        h2o_ai1_lbhr   = max(0, h2o_ai0_lbhr - mass_h2o_used_lbhr)

        x_h2so4_ai1 = h2so4_ai1_lbhr / mass_ai1_lbhr if mass_ai1_lbhr > 0 else 0.0
        x_h2o_ai1   = h2o_ai1_lbhr   / mass_ai1_lbhr if mass_ai1_lbhr > 0 else 0.0

        m_total_ai1_klbhr = mass_ai1_lbhr / 1000
        m_total_ai0_klbhr = mass_ai0_lbhr / 1000

        flow_ai1_gpm = flow_ai0 * (mass_ai1_lbhr / mass_ai0_lbhr) \\
            if flow_ai0 > 0 and mass_ai0_lbhr > 0 else 0.0

        # ==========================================================
        # ENERGY BALANCE
        # ==========================================================
        dh_rxn = float(inputs.get("dH_rxn_BTU_per_lbmol", DH_RXN_BTU_PER_LBMOL_DEFAULT))

        # Reaction heat (positive to acid)
        q_rxn = n_so3_abs * (-dh_rxn)

        # Gas sensible heat
        n_so2 = scfm_to_lbmol_hr(so2_gi0)
        n_o2  = scfm_to_lbmol_hr(o2_gi0)
        n_n2  = scfm_to_lbmol_hr(n2_gi0)
        n_h2o = scfm_to_lbmol_hr(h2o_gi0)

        dt_gas = temp_gi0 - temp_gi1_target

        q_sensible = dt_gas * (
            n_so2 * CP_GAS_BTU_LBMOL_F["SO2"] +
            n_so3_in * CP_GAS_BTU_LBMOL_F["SO3"] +
            n_o2  * CP_GAS_BTU_LBMOL_F["O2"] +
            n_n2  * CP_GAS_BTU_LBMOL_F["N2"] +
            n_h2o * CP_GAS_BTU_LBMOL_F["H2O"]
        )

        q_total = q_rxn + q_sensible

        dT_acid = q_total / (mass_ai1_lbhr * CP_ACID_BTU_LB_F) if mass_ai1_lbhr > 0 else 0
        temp_ai1 = temp_ai0 + dT_acid

        # Pressure drop across tower
        pressure_drop_psi = dp_design_inwc / 27.68
        pressure_mid_inwc = -dp_design_inwc / 2.0
        pressure_out_inwc = -dp_design_inwc

        # ==========================================================
        # Outlet Gas — GI1 (100% SO3 removed)
        # ==========================================================
        so3_gi1 = 0.0
        total_gi1 = total_gi0 - so3_gi0

        # Gas temperature at packing outlet (midpoint)
        temp_gas_mid = temp_gi0 - (temp_gi0 - temp_gi1_target) * 0.5

        # ==========================================================
        # Results — all keys expected by frontend
        # ==========================================================
        results.update({

            # Acid AIX0 (packing outlet) — same as AI1 for 100% absorption
            "x_H2SO4_AIX0": round(x_h2so4_ai1, 4),
            "x_H2O_AIX0":   round(x_h2o_ai1,   4),
            "m_Total_AIX0":  round(m_total_ai1_klbhr, 2),
            "Pressure_AIX0": round(pressure_ai0 - pressure_drop_psi, 1),
            "Temp_AIX0":     round(temp_ai1, 1),
            "Flow_AIX0":     round(flow_ai1_gpm, 1),

            # Acid AI1 (tower outlet)
            "x_H2SO4_AI1":  round(x_h2so4_ai1, 4),
            "x_H2O_AI1":    round(x_h2o_ai1,   4),
            "m_Total_AI0":   round(m_total_ai0_klbhr, 2),
            "m_Total_AI1":   round(m_total_ai1_klbhr, 2),
            "Pressure_AI1":  round(pressure_ai0 - pressure_drop_psi, 1),
            "Temp_AI1":      round(temp_ai1, 1),
            "Flow_AI1":      round(flow_ai1_gpm, 1),

            # Gas GIX0 (packing outlet)
            "SO2_GIX0":          round(so2_gi0, 0),
            "SO3_GIX0":          0.0,
            "O2_GIX0":           round(o2_gi0, 0),
            "N2_GIX0":           round(n2_gi0, 0),
            "H2O_GIX0":          round(h2o_gi0, 0),
            "H2SO4_GIX0":        round(h2so4_gi0, 0),
            "TOTAL_GIX0":        round(total_gi1, 0),
            "PRESSURE_GIX0":     round(pressure_mid_inwc, 1),
            "TEMPERATURE_GIX0":  round(temp_gas_mid, 0),

            # Gas GI1 (tower outlet)
            "SO2_GI1":          round(so2_gi0, 0),
            "SO3_GI1":          0.0,
            "O2_GI1":           round(o2_gi0, 0),
            "N2_GI1":           round(n2_gi0, 0),
            "H2O_GI1":          round(h2o_gi0, 0),
            "H2SO4_GI1":        round(h2so4_gi0, 0),
            "TOTAL_GI1":        round(total_gi1, 0),
            "PRESSURE_GI1":     round(pressure_out_inwc, 1),
            "TEMPERATURE_GI1":  round(temp_gi1_target, 0),

            # Diagnostics
            "efficiency": 1.0,
            "mass_so3_absorbed_lbhr": round(mass_so3_abs_lbhr, 2),
            "mass_h2so4_formed_lbhr": round(mass_h2so4_formed_lbhr, 2),
            "Q_rxn_Btu_hr":     round(q_rxn, 0),
            "Q_sensible_Btu_hr": round(q_sensible, 0),
            "dT_acid_F":        round(dT_acid, 2),
            "tower_diameter_ft": tower_diameter_ft,
        })

    except Exception as e:
        results["error"] = str(e)

    return results


# ───────────────────────────────────────────────────────────────
# Main
# ───────────────────────────────────────────────────────────────

def main():
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
