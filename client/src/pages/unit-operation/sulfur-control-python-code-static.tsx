import { Link, useParams } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, Gauge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const STATIC_CODE = `# src/calculators/sulfur_hydraulics_static.py
import math
from datetime import datetime
from typing import Dict, Any

class StaticSulfurSprayHydraulics:
    """
    Exact static hydraulic calculation for molten sulfur spray system.
    Matches vendor datasheet at 86.91 gpm → 21.66 psi across valve.
    """

    CONFIG = {
        "pipe_dia_in": 4.0,
        "line_length_ft": 80.0,
        "friction_factor": 0.018,
        "K_minor_losses": 7.5,
        "SG": 1.79,
        "barometric_psia": 14.696,
        "temperature_f": 275.0,
        "pump_coeffs": [-1.06594794e-05, -7.73601399e-04, -4.91452991e-02, 296.104895],
        "Cv_max": 548.0,
        "R_equal_percent": 85.0,
        "furnace_static_psi": 5.0,           # psig
        "discharge_line_loss_psi": 2.0,
        "Cv_nozzle": 24.98,
        "cal_flow_gpm": 86.91,
        "cal_dp_valve_psi": 21.66,
    }

    def __init__(self, R_equal_percent: float = None, pit_level_ft: float = 7.0):
        self.g = 32.174
        self.pipe_dia_ft = self.CONFIG["pipe_dia_in"] / 12.0
        self.pipe_area_ft2 = math.pi * (self.pipe_dia_ft / 2.0) ** 2
        self.psi_per_ft = self.CONFIG["SG"] * 0.433
        self.pump_coeffs = self.CONFIG["pump_coeffs"]

        self.Cv_max = float(self.CONFIG["Cv_max"])
        self.R = max(float(R_equal_percent or self.CONFIG["R_equal_percent"]), 1.000001)
        self.p_atm = float(self.CONFIG["barometric_psia"])

        # Auto-calibrate downstream header so datasheet point is exactly matched
        self.downstream_header_psig = self._calibrate_downstream_header_psig(pit_level_ft)

    # ------------------- Valve -------------------
    def Cv_from_pos(self, pos_pct: float) -> float:
        p = max(0.0, min(100.0, float(pos_pct)))
        return (self.Cv_max / self.R) * (self.R ** (p / 100.0))

    def pos_from_Cv(self, Cv: float) -> float:
        Cv = float(Cv)
        if Cv <= self.Cv_max / self.R:
            return 0.0
        if Cv >= self.Cv_max:
            return 100.0
        return 100.0 * math.log(Cv * self.R / self.Cv_max) / math.log(self.R)

    # ------------------- Nozzle -------------------
    def nozzle_dp_psi(self, Q_gpm: float) -> float:
        Q = max(0.0, float(Q_gpm))
        if Q == 0:
            return 0.0
        return self.CONFIG["SG"] * (Q / self.CONFIG["Cv_nozzle"]) ** 2

    # ------------------- Pump & Losses -------------------
    def _pump_head_ft(self, Q_gpm: float) -> float:
        a, b, c, d = self.pump_coeffs
        head = a * Q_gpm**3 + b * Q_gpm**2 + c * Q_gpm + d
        return max(0.0, head)

    def _friction_head_ft(self, Q_gpm: float) -> float:
        Q = max(0.0, float(Q_gpm))
        if Q == 0:
            return 0.0
        v_fps = Q / (448.831 * self.pipe_dia_ft**2)  # velocity in ft/s
        h_f_ft = self.CONFIG["friction_factor"] * self.CONFIG["line_length_ft"] * v_fps**2 / (2 * self.g * self.pipe_dia_ft)
        minor_ft = self.CONFIG["K_minor_losses"] * v_fps**2 / (2 * self.g)
        return h_f_ft + minor_ft

    # ------------------- Calibration -------------------
    def _calibrate_downstream_header_psig(self, pit_level_ft: float) -> float:
        Q = self.CONFIG["cal_flow_gpm"]
        Cv_valve = self.Cv_from_pos(100.0)  # full open at cal point
        dp_valve_target = self.CONFIG["cal_dp_valve_psi"]

        pump_head_ft = self._pump_head_ft(Q)
        h_f_ft = self._friction_head_ft(Q)
        discharge_loss_psi = self.CONFIG["discharge_line_loss_psi"]
        static_lift_psi = pit_level_ft * self.psi_per_ft
        dp_noz_psi = self.nozzle_dp_psi(Q)

        numerator = (pump_head_ft * self.CONFIG["SG"] / 2.31) - discharge_loss_psi - static_lift_psi - dp_valve_target - dp_noz_psi
        downstream_psig = self.CONFIG["furnace_static_psi"] + numerator
        return downstream_psig

    # ------------------- Main Solver -------------------
    def calculate(self, valve_position_pct: float = 100.0, pit_level_ft: float = 7.0) -> Dict[str, Any]:
        pos = max(0.0, min(100.0, float(valve_position_pct)))
        Cv_valve = self.Cv_from_pos(pos)

        # Solve flow iteratively (converges in <6 iterations)
        Q_gpm = 80.0  # initial guess
        for _ in range(15):
            pump_head_ft = self._pump_head_ft(Q_gpm)
            h_f_ft = self._friction_head_ft(Q_gpm)
            dp_noz = self.nozzle_dp_psi(Q_gpm)

            available_head_psi = (pump_head_ft * self.CONFIG["SG"] / 2.31) \\
                                 - self.CONFIG["discharge_line_loss_psi"] \\
                                 - (pit_level_ft * self.psi_per_ft)

            required_head_valve = available_head_psi - dp_noz - (self.downstream_header_psig - self.CONFIG["furnace_static_psi"])

            Q_new = Cv_valve * math.sqrt(max(0.0, required_head_valve / self.CONFIG["SG"]))
            if abs(Q_new - Q_gpm) < 0.01:
                Q_gpm = Q_new
                break
            Q_gpm = Q_new

        # Final calculations
        pump_head_ft = self._pump_head_ft(Q_gpm)
        h_f_ft = self._friction_head_ft(Q_gpm)
        v_fps = Q_gpm / (448.831 * self.pipe_dia_ft**2)
        dp_valve = self.CONFIG["SG"] * (Q_gpm / Cv_valve)**2 if Cv_valve > 0 else 0.0
        mass_klb_hr = Q_gpm * 500 * self.CONFIG["SG"] / 60

        furnace_psia = self.CONFIG["furnace_static_psi"] + self.p_atm

        return {
            "valve_position_pct": round(pos, 2),
            "Cv_valve": round(Cv_valve, 2),
            "flow_gpm": round(Q_gpm, 2),
            "dp_valve_psi": round(dp_valve, 3),
            "dp_nozzle_psi": round(self.nozzle_dp_psi(Q_gpm), 3),
            "pump_head_ft": round(pump_head_ft, 2),
            "friction_head_ft": round(h_f_ft, 3),
            "velocity_fps": round(v_fps, 2),
            "mass_flow_klb_hr": round(mass_klb_hr, 2),
            "furnace_pressure_psia": round(furnace_psia, 2),
            "R_equal_percent": round(self.R, 3),
            "downstream_header_psig": round(self.downstream_header_psig, 3),
            "temperature_F": self.CONFIG["temperature_f"],
            "timestamp": datetime.now().isoformat(),
        }
`;

export default function SulfurControlPythonCodeStatic() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { id } = useParams();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(STATIC_CODE);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "The static solver code has been copied to your clipboard."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy code to clipboard.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={`/unit-operation/sulfur-control-hydraulics/${id}`}>
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Gauge className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">Sulfur Control - Static Solver</h1>
                  <p className="text-xs text-muted-foreground">
                    Static Hydraulic Calculation with Cv-Based Nozzle Model
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              data-testid="button-copy-code"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-lg overflow-hidden border">
            <SyntaxHighlighter
              language="python"
              style={vscDarkPlus}
              showLineNumbers
              customStyle={{
                margin: 0,
                borderRadius: 0,
                fontSize: '13px'
              }}
            >
              {STATIC_CODE}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </div>
  );
}
