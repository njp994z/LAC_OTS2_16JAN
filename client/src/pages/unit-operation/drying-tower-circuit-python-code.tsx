import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, PipetteIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const SOLVER_CODE = `"""
Drying Tower Circuit - Hydraulic Solver
=========================================
Backend calculation script for acid cooler loop hydraulics.
Uses scipy.optimize.fsolve for solving the nonlinear system.
"""

import json
import sys
import numpy as np
from scipy.optimize import fsolve


def solve_system(fcv_pos, tcv_pos, acid_flow_final, cooler_k, pump_a, pump_b, pump_c,
                 elevation_diff, pipe_dp, cv_fcv_max, cv_tcv_max, fluid_sg):
    """
    Solve the hydraulic system based on assumptions:
    - Valves are equal-percentage for Cv vs. position.
    - Flow in m³/h, pressure in bar.
    - Cooler ΔP = cooler_k * flow_cooler**2
    - Pump discharge P = pump_a - pump_b * total_flow - pump_c * total_flow**2
    - dP_FCV calculated from Cv and flow.
    - Elevation converted to pressure: ΔP_elev = elevation_diff * fluid_sg * 0.0981 (bar/m)
    - Assumes P_final (outlet) is 0 or atmospheric for simplicity.
    """
    if not (0 <= fcv_pos <= 1 and 0 <= tcv_pos <= 1):
        raise ValueError("Valve positions must be between 0 and 1.")

    # Convert elevation to pressure (bar, assuming g=9.81, rho=sg*1000 kg/m³)
    dp_elev = elevation_diff * fluid_sg * 0.0981  # Approximate bar per meter

    # Assume linear Cv vs. position for simplicity
    # For equal-percentage valves: Cv = Cv_max * rangeability^(pos-1), rangeability=50
    cv_fcv = cv_fcv_max * fcv_pos
    cv_tcv = cv_tcv_max * tcv_pos

    # Prevent division by zero
    if cv_fcv <= 0:
        raise ValueError("FCV Cv must be positive (FCV position > 0)")
    if cv_tcv <= 0:
        raise ValueError("TCV Cv must be positive (TCV position > 0)")

    def equations(vars):
        total_flow, dp_common = vars

        if dp_common < 0:
            return [1e6, 1e6]

        # Flow bypass = cv_tcv * sqrt(dp_common / sg)
        flow_bypass = cv_tcv * np.sqrt(dp_common / fluid_sg)

        # Flow cooler = total_flow - flow_bypass
        flow_cooler = total_flow - flow_bypass

        if flow_cooler < 0:
            return [1e6, 1e6]

        # dp_cooler = cooler_k * flow_cooler**2
        dp_cooler = cooler_k * flow_cooler**2

        eq1 = dp_cooler - dp_common  # Must equal

        # dp_fcv = total_flow**2 / cv_fcv**2 * fluid_sg (standard liquid valve eq)
        dp_fcv = (total_flow / cv_fcv)**2 * fluid_sg

        # Total system dp = dp_common + dp_pipe + dp_elev + dp_fcv
        total_dp = dp_common + pipe_dp + dp_elev + dp_fcv

        eq2 = (pump_a - pump_b * total_flow - pump_c * total_flow**2) - total_dp

        return [eq1, eq2]

    # Initial guess
    guess = [acid_flow_final, 1.0]

    solution = fsolve(equations, guess, full_output=True)
    sol = solution[0]

    total_flow, dp_common = sol

    # Ensure positive values
    if total_flow < 0 or dp_common < 0:
        raise ValueError("Solution resulted in negative flow or pressure")

    flow_bypass = cv_tcv * np.sqrt(dp_common / fluid_sg)
    flow_cooler = total_flow - flow_bypass

    dp_fcv = (total_flow / cv_fcv)**2 * fluid_sg

    pump_discharge_press = pump_a - pump_b * total_flow - pump_c * total_flow**2

    # Inlet pressure to bypass & cooler: after pump, before parallel split
    p_inlet_byp_cooler = pump_discharge_press

    # Outlet pressure bypass & cooler: p_out = p_inlet - dp_common
    p_out_byp_cooler = p_inlet_byp_cooler - dp_common

    results = {
        'pump_discharge_press': float(pump_discharge_press),
        'dp_bypass': float(dp_common),
        'dp_fcv': float(dp_fcv),
        'p_inlet_byp_cooler': float(p_inlet_byp_cooler),
        'p_out_byp_cooler': float(p_out_byp_cooler),
        'flow_bypass': float(flow_bypass),
        'flow_cooler': float(flow_cooler),
        'total_flow': float(total_flow)
    }

    return results


# ============================================================================
# EXAMPLE USAGE
# ============================================================================
if __name__ == "__main__":
    # Example with typical values for sulfuric acid drying tower
    results = solve_system(
        fcv_pos=0.75,          # FCV valve position (0-1)
        tcv_pos=0.50,          # TCV valve position (0-1)
        acid_flow_final=100,   # Initial guess for total flow (m³/h)
        cooler_k=0.001,        # Cooler pressure drop coefficient
        pump_a=10,             # Pump curve constant term (bar)
        pump_b=0.02,           # Pump curve linear coefficient
        pump_c=0.0001,         # Pump curve quadratic coefficient
        elevation_diff=5,      # Elevation difference (m)
        pipe_dp=0.5,           # Fixed pipe pressure drop (bar)
        cv_fcv_max=150,        # Max Cv for FCV
        cv_tcv_max=100,        # Max Cv for TCV (bypass)
        fluid_sg=1.84          # Sulfuric acid specific gravity
    )

    print("Pump Discharge Pressure:", results['pump_discharge_press'], "bar")
    print("dP Bypass (= dP Cooler):", results['dp_bypass'], "bar")
    print("dP FCV:", results['dp_fcv'], "bar")
    print("Flow Bypass:", results['flow_bypass'], "m³/h")
    print("Flow Cooler:", results['flow_cooler'], "m³/h")
    print("Total Flow:", results['total_flow'], "m³/h")
`;

export default function DryingTowerCircuitPythonCode() {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(SOLVER_CODE);
    setHasCopied(true);
    toast({
      title: "Copied!",
      description: "Python code copied to clipboard.",
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/unit-operation/acid-hydraulics/drying-tower-circuit">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <PipetteIcon className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">Drying Tower Circuit - Python Code</h1>
                  <p className="text-xs text-muted-foreground">
                    Hydraulic solver using scipy.optimize.fsolve
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              data-testid="button-copy-code"
            >
              {hasCopied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {hasCopied ? "Copied!" : "Copy Code"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="rounded-lg overflow-hidden border">
          <SyntaxHighlighter
            language="python"
            style={vscDarkPlus}
            showLineNumbers
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.875rem',
              lineHeight: '1.5',
            }}
          >
            {SOLVER_CODE}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
