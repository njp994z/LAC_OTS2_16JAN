import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, Gauge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const STATIC_CODE = `import math
from datetime import datetime

CONFIG = {
    "pipe_dia_in": 4.0,
    "line_length_ft": 80.0,
    "friction_factor": 0.018,
    "K_minor_losses": 7.5,
    "SG": 1.79,

    "barometric_psia": 14.696,
    "temperature_f": 275.0,

    # Pump curve (static)
    "pump_coeffs": [-1.06594794e-05, -7.73601399e-04, -4.91452991e-02, 296.104895],

    # Valve equal-% (R should come from UI; set default here)
    "Cv_max": 548.0,
    "R_equal_percent": 85.0,

    # Plant / boundary
    "furnace_static_psi": 5.0,          # furnace pressure (psig)
    "discharge_line_loss_psi": 2.0,     # pump outlet -> valve inlet

    # Nozzle modeled as Cv element
    "Cv_nozzle": 24.98,                # tune if needed

    # Cal point for downstream header calibration (datasheet max)
    "cal_flow_gpm": 86.91,
    "cal_dp_valve_psi": 21.66,
    # NOTE: pit level is passed in at runtime; default 7 ft
}

class StaticSulfurSprayHydraulics:
    """Static calculation with equal-% valve + full pressure survey outputs."""

    def __init__(self):
        self.g = 32.174
        self.pipe_dia_ft = CONFIG["pipe_dia_in"] / 12.0
        self.pipe_area_ft2 = math.pi * (self.pipe_dia_ft / 2.0) ** 2
        self.psi_per_ft = CONFIG["SG"] * 0.433
        self.pump_coeffs = CONFIG["pump_coeffs"]

        self.Cv_max = float(CONFIG["Cv_max"])
        self.R = max(float(CONFIG.get("R_equal_percent", 85.0)), 1.000001)

        self.p_atm = float(CONFIG["barometric_psia"])

        # Calibrate missing downstream header term so the valve ΔP matches datasheet at cal point
        self.downstream_header_psig = self._calibrate_downstream_header_psig(pit_level_ft=7.0)

    @staticmethod
    def _clamp(x: float, lo: float, hi: float) -> float:
        return max(lo, min(hi, x))

    # ---------- valve equations ----------
    def Cv_from_pos(self, pos_pct: float) -> float:
        """Equal-%: Cv(p) = (Cv_max/R) * R^(p/100)."""
        p = self._clamp(float(pos_pct), 0.0, 100.0)
        return (self.Cv_max / self.R) * (self.R ** (p / 100.0))

    def pos_from_Cv(self, Cv: float) -> float:
        """Inverse equal-%: p = 100 * ln(Cv*R/Cv_max)/ln(R)."""
        Cv = max(float(Cv), 0.0)
        Cv_min = self.Cv_max / self.R
        if Cv <= Cv_min:
            return 0.0
        if Cv >= self.Cv_max:
            return 100.0
        return 100.0 * (math.log(Cv * self.R / self.Cv_max) / math.log(self.R))

    # ---------- nozzle model ----------
    def nozzle_dp_psi(self, Q_gpm: float) -> float:
        """Nozzle as Cv element: ΔP = SG*(Q/Cv)^2"""
        Q = max(0.0, float(Q_gpm))
        if Q <= 0.0:
            return 0.0
        Cv_n = max(float(CONFIG["Cv_nozzle"]), 1e-12)
        SG = float(CONFIG["SG"])
        return SG * (Q / Cv_n) ** 2

    # ---------- hydraulics pieces ----------
    def _pump_head_ft(self, Q_gpm: float) -> float:
        a, b, c, d = self.pump_coeffs
        head = a * Q_gpm**3 + b * Q_gpm**2 + c * Q_gpm + d
        return max(0.0, head)

    def _friction_head_ft(self, Q_gpm: float) -> float:
        Q = max(0.0, float(Q_gpm))
        if Q <= 0.0:
            return 0.0
        Q_cfs = Q / 448.831
        v_fps = Q_cfs / self.pipe_area_ft2
        f = float(CONFIG["friction_factor"])
        L = float(CONFIG["line_length_ft"])
        D = self.pipe_dia_ft
        K = float(CONFIG["K_minor_losses"])
        return (f * L / D + K) * (v_fps**2) / (2.0 * self.g)

    def _valve_inlet_psig(self, Q_gpm: float, pit_level_ft: float) -> tuple[float, float, float]:
        """Return (valve_inlet_psig, pump_head_ft, friction_head_ft)."""
        pump_head_ft = self._pump_head_ft(Q_gpm)
        h_f_ft = self._friction_head_ft(Q_gpm)

        suction_psig = float(pit_level_ft) * self.psi_per_ft
        pump_discharge_psig = suction_psig + (pump_head_ft - h_f_ft) * self.psi_per_ft

        valve_inlet_psig = pump_discharge_psig - float(CONFIG["discharge_line_loss_psi"])
        return valve_inlet_psig, pump_head_ft, h_f_ft

    def _calibrate_downstream_header_psig(self, pit_level_ft: float = 7.0) -> float:
        """
        Choose downstream_header_psig so that at cal_flow_gpm:
            ΔP_valve = cal_dp_valve_psi
        with:
            P2 = header + furnace + ΔP_nozzle(Q)
        """
        Qc = float(CONFIG["cal_flow_gpm"])
        dp_target = float(CONFIG["cal_dp_valve_psi"])

        P1, _, _ = self._valve_inlet_psig(Qc, pit_level_ft)
        dp_noz = self.nozzle_dp_psi(Qc)
        P_furn = float(CONFIG["furnace_static_psi"])

        return P1 - (P_furn + dp_noz + dp_target)

    # ---------- main solve ----------
    def calculate(self, flow_gpm: float, pit_level_ft: float = 7.0) -> dict:
        Q = max(0.0, float(flow_gpm))

        # Upstream pressure at valve inlet
        P1_psig, pump_head_ft, h_f_ft = self._valve_inlet_psig(Q, pit_level_ft)

        # Downstream boundary at valve outlet
        dp_noz = self.nozzle_dp_psi(Q)
        P_furn_psig = float(CONFIG["furnace_static_psi"])
        P2_psig = self.downstream_header_psig + P_furn_psig + dp_noz

        # Valve ΔP
        dp_valve = max(P1_psig - P2_psig, 0.0)

        # Required Cv
        if Q <= 0.0 or dp_valve <= 0.0:
            Cv_req = 0.0
        else:
            Cv_req = Q * math.sqrt(float(CONFIG["SG"]) / dp_valve)

        # Convert to position and mA
        pos_pct = self._clamp(self.pos_from_Cv(Cv_req), 0.0, 100.0)
        x = pos_pct / 100.0
        pid_mA = 4.0 + 16.0 * x

        # Pressures for survey (psig)
        suction_psig = float(pit_level_ft) * self.psi_per_ft
        pump_discharge_psig = P1_psig + float(CONFIG["discharge_line_loss_psi"])  # undo line loss
        nozzle_inlet_psig = P2_psig  # valve outlet equals nozzle inlet upstream boundary in this model

        # Convert to psia
        suction_psia = suction_psig + self.p_atm
        pump_discharge_psia = pump_discharge_psig + self.p_atm
        valve_inlet_psia = P1_psig + self.p_atm
        valve_outlet_psia = P2_psig + self.p_atm
        nozzle_inlet_psia = nozzle_inlet_psig + self.p_atm
        furnace_psia = P_furn_psig + self.p_atm

        # Velocity
        if Q > 0:
            Q_cfs = Q / 448.831
            v_fps = Q_cfs / self.pipe_area_ft2
        else:
            v_fps = 0.0

        # Mass flow
        mass_klb_hr = (Q * float(CONFIG["SG"]) * 500.3) / 1000.0

        return {
            # Key outputs you care about
            "Flow_gpm": round(Q, 2),
            "Cv_required": round(Cv_req, 6),
            "valve_position_pct": round(pos_pct, 4),
            "x": round(x, 6),
            "pid_output_mA": round(pid_mA, 4),

            # Pressure survey (psig)
            "Suction_psig": round(suction_psig, 2),
            "Pump_Discharge_psig": round(pump_discharge_psig, 2),
            "Valve_Inlet_psig": round(P1_psig, 2),
            "Valve_Outlet_psig": round(P2_psig, 2),
            "Nozzle_Inlet_psig": round(nozzle_inlet_psig, 2),
            "Furnace_psig": round(P_furn_psig, 2),

            # Pressure survey (psia)
            "Suction_psia": round(suction_psia, 2),
            "Pump_Discharge_psia": round(pump_discharge_psia, 2),
            "Valve_Inlet_psia": round(valve_inlet_psia, 2),
            "Valve_Outlet_psia": round(valve_outlet_psia, 2),
            "Nozzle_Inlet_psia": round(nozzle_inlet_psia, 2),
            "Furnace_psia": round(furnace_psia, 2),

            # ΔP breakdown
            "dP_valve_psi": round(dp_valve, 3),
            "dP_nozzle_psi": round(dp_noz, 3),
            "discharge_line_loss_psi": float(CONFIG["discharge_line_loss_psi"]),

            # Hydraulics
            "pump_head_ft": round(pump_head_ft, 2),
            "friction_head_ft": round(h_f_ft, 3),
            "velocity_fps": round(v_fps, 2),

            # Misc
            "m_Total_klb_hr": round(mass_klb_hr, 2),
            "Temp_F": float(CONFIG["temperature_f"]),
            "R_equal_percent": round(self.R, 3),
            "Cv_max": float(self.Cv_max),
            "Cv_nozzle": float(CONFIG["Cv_nozzle"]),
            "downstream_header_psig": round(self.downstream_header_psig, 3),
            "timestamp": datetime.now().isoformat(),
        }
`;

export default function SulfurControlPythonCodeStatic() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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
              <Link href="/unit-operation/sulfur-control-hydraulics">
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
