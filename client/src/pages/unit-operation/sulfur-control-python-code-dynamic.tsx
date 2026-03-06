import { Link, useParams } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, Gauge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const DYNAMIC_CODE = `import math
import time
import random
import json
import sys
from dataclasses import dataclass

# Shared config
CONFIG = {
    "pipe_dia_in": 4.0,
    "line_length_ft": 80.0,
    "deltaP_nozzle_psi": 150.0,
    "furnace_static_psi": 7.0,
    "friction_factor": 0.018,
    "K_minor_losses": 7.5,
    "SG": 1.79,
    "Cv_max": 548.0,
    "barometric_psia": 14.7,
    "temperature_f": 275.0,
    "discharge_line_loss_psi": 2.0,
    "Cv_orifice": 18.3158,
}

@dataclass
class DynamicState:
    time_s: float = 0.0
    pid_mA_in: float = 4.0
    valve_pos_pct: float = 0.0
    flow_gpm: float = 0.0


class DynamicSulfurSprayHydraulics:
    """
    Dynamic model consistent with UPDATED STATIC (DP-orifice + fixed downstream boundary).

    Fixed downstream:
      P2 = furnace_static_psi + deltaP_nozzle_psi

    DP-orifice (Cv_orifice from static auto-sizing):
      dP_orifice = SG*(Q/Cv_orifice)^2

    Valve (equal-%):
      Cv_valve(pos) = (Cv_max/R) * R^(pos/100)

    Steady-state flow solve:
      Q = Cv_valve * sqrt(dP_valve/SG)
      dP_valve = P1 - P2
      P1 = pump_discharge - discharge_line_loss - dP_orifice(Q)

    Dynamics:
      - random PID mA input each step (mean chosen to target mean_flow_gpm)
      - first-order lag on positioner and flow
    """

    def __init__(
        self,
        dt: float = 0.5,
        positioner_tau_s: float = 6.0,
        flow_tau_s: float = 4.0,
        pit_level_ft: float | None = None,
        mean_flow_gpm: float = 87.0,
        mA_noise_sigma: float = 0.8,
        rng_seed: int | None = 1234,
        flow_solve_max_iter: int = 80,
        flow_solve_tol_gpm: float = 0.05,
    ):
        self.dt = float(dt)
        self.tau_pos = float(positioner_tau_s)
        self.tau_flow = float(flow_tau_s)

        self.pit_level_ft = float(pit_level_ft if pit_level_ft is not None else 7.0)

        # constants
        self.g = 32.174
        self.SG = float(CONFIG["SG"])
        self.psi_per_ft = self.SG * 0.433
        self.p_atm = float(CONFIG.get("barometric_psia", 14.7))

        # geometry
        self.pipe_dia_ft = float(CONFIG["pipe_dia_in"]) / 12.0
        self.pipe_area_ft2 = math.pi * (self.pipe_dia_ft / 2.0) ** 2

        # pump curve
        self.pump_coeffs = [1.4933e-05, -0.010308, -0.103376, 407.28]

        # line losses
        self.f = float(CONFIG["friction_factor"])
        self.L = float(CONFIG["line_length_ft"])
        self.K = float(CONFIG["K_minor_losses"])
        self.discharge_line_loss_psi = float(CONFIG.get("discharge_line_loss_psi", 2.0))

        # downstream (fixed)
        self.furnace_static_psig = float(CONFIG["furnace_static_psi"])
        self.nozzle_dp_psi_fixed = float(CONFIG["deltaP_nozzle_psi"])
        self.P2_psig = self.furnace_static_psig + self.nozzle_dp_psi_fixed

        # valve equal-%
        self.Cv_max = float(CONFIG["Cv_max"])
        self.R = max(float(CONFIG.get("R_equal_percent", 85.0)), 1.000001)

        # DP-orifice
        self.Cv_orifice = float(CONFIG.get("Cv_orifice", 18.3158))

        # flow solver controls
        self.flow_solve_max_iter = int(flow_solve_max_iter)
        self.flow_solve_tol = float(flow_solve_tol_gpm)

        # random PID signal controls
        self.mean_flow_gpm = float(mean_flow_gpm)
        self.mA_noise_sigma = float(mA_noise_sigma)
        self.rng = random.Random(rng_seed)

        # pick mean mA that yields ~mean_flow_gpm at steady-state
        self.mean_mA = self._steady_state_mA_for_flow(self.mean_flow_gpm)

        # state/time
        self.state = DynamicState()
        self.start_time = time.time()

        # initialize to mean
        self.state.pid_mA_in = self.mean_mA
        self.state.valve_pos_pct = self.mA_to_position(self.mean_mA)

    @staticmethod
    def _clamp(x: float, lo: float, hi: float) -> float:
        return max(lo, min(hi, x))

    def mA_to_position(self, mA: float) -> float:
        return self._clamp((float(mA) - 4.0) * 6.25, 0.0, 100.0)

    def position_to_mA(self, pos_pct: float) -> float:
        p = self._clamp(float(pos_pct), 0.0, 100.0)
        return 4.0 + 16.0 * (p / 100.0)

    def Cv_from_position(self, pos_pct: float) -> float:
        p = self._clamp(float(pos_pct), 0.0, 100.0)
        return (self.Cv_max / self.R) * (self.R ** (p / 100.0))

    def position_from_Cv(self, Cv: float) -> float:
        Cv = max(float(Cv), 0.0)
        Cv_min = self.Cv_max / self.R
        if Cv <= Cv_min:
            return 0.0
        if Cv >= self.Cv_max:
            return 100.0
        return 100.0 * (math.log(Cv * self.R / self.Cv_max) / math.log(self.R))

    def dp_orifice_psi(self, Q_gpm: float) -> float:
        Q = max(0.0, float(Q_gpm))
        if Q <= 0.0:
            return 0.0
        return self.SG * (Q / max(self.Cv_orifice, 1e-12)) ** 2

    def pump_head_ft(self, Q_gpm: float) -> float:
        a, b, c, d = self.pump_coeffs
        head = a * Q_gpm**3 + b * Q_gpm**2 + c * Q_gpm + d
        return max(0.0, head)

    def friction_head_ft(self, Q_gpm: float) -> tuple[float, float]:
        Q = max(0.0, float(Q_gpm))
        if Q <= 0.0:
            return 0.0, 0.0
        Q_cfs = Q / 448.831
        v = Q_cfs / self.pipe_area_ft2
        h_f = (self.f * self.L / self.pipe_dia_ft + self.K) * (v**2) / (2.0 * self.g)
        return h_f, v

    def pump_discharge_psig(self, Q_gpm: float) -> dict:
        h_f_ft, v = self.friction_head_ft(Q_gpm)
        head_ft = self.pump_head_ft(Q_gpm)
        suction_psig = self.pit_level_ft * self.psi_per_ft
        pump_out_psig = suction_psig + (head_ft - h_f_ft) * self.psi_per_ft
        return {
            "suction_psig": suction_psig,
            "pump_discharge_psig": pump_out_psig,
            "pump_head_ft": head_ft,
            "friction_head_ft": h_f_ft,
            "velocity_fps": v,
        }

    def pressure_survey(self, Q_gpm: float, Cv_valve: float) -> dict:
        Q = max(0.0, float(Q_gpm))
        up = self.pump_discharge_psig(Q)

        dp_orf = self.dp_orifice_psi(Q)
        P1_psig = up["pump_discharge_psig"] - self.discharge_line_loss_psi - dp_orf
        dp_valve = max(P1_psig - self.P2_psig, 0.0)

        to_psia = lambda psig: psig + self.p_atm

        return {
            "Flow_gpm": Q,
            "Cv_valve": Cv_valve,
            "Suction_psig": up["suction_psig"],
            "Pump_Discharge_psig": up["pump_discharge_psig"],
            "Valve_Inlet_psig": P1_psig,
            "Valve_Outlet_psig": self.P2_psig,
            "Suction_psia": to_psia(up["suction_psig"]),
            "Pump_Discharge_psia": to_psia(up["pump_discharge_psig"]),
            "Valve_Inlet_psia": to_psia(P1_psig),
            "Valve_Outlet_psia": to_psia(self.P2_psig),
            "dP_orifice_psi": dp_orf,
            "dP_valve_psi": dp_valve,
            "dP_nozzle_psi": self.nozzle_dp_psi_fixed,
            "discharge_line_loss_psi": self.discharge_line_loss_psi,
            "pump_head_ft": up["pump_head_ft"],
            "friction_head_ft": up["friction_head_ft"],
            "velocity_fps": up["velocity_fps"],
            "Cv_orifice": self.Cv_orifice,
            "R_equal_percent": self.R,
        }

    def solve_flow_from_Cv(self, Cv_valve: float) -> tuple[float, dict]:
        Cv_valve = max(float(Cv_valve), 0.0)
        if Cv_valve <= 0.0:
            return 0.0, self.pressure_survey(0.0, Cv_valve)
        Q = self.state.flow_gpm if self.state.flow_gpm > 0 else self.mean_flow_gpm
        for _ in range(self.flow_solve_max_iter):
            survey = self.pressure_survey(Q, Cv_valve)
            dp_valve = max(survey["dP_valve_psi"], 1e-9)
            Q_new = Cv_valve * math.sqrt(dp_valve / self.SG)
            if abs(Q_new - Q) < self.flow_solve_tol:
                return max(0.0, Q_new), self.pressure_survey(Q_new, Cv_valve)
            Q = 0.65 * Q + 0.35 * Q_new
        return max(0.0, Q), self.pressure_survey(Q, Cv_valve)

    def _steady_state_mA_for_flow(self, Q_target_gpm: float) -> float:
        Q = max(0.0, float(Q_target_gpm))
        survey = self.pressure_survey(Q, Cv_valve=1.0)
        dp_valve = max(survey["dP_valve_psi"], 1e-9)
        Cv_req = Q * math.sqrt(self.SG / dp_valve)
        pos = self._clamp(self.position_from_Cv(Cv_req), 0.0, 100.0)
        return self._clamp(self.position_to_mA(pos), 4.0, 20.0)

    def random_pid_mA(self) -> float:
        return self._clamp(self.rng.gauss(self.mean_mA, self.mA_noise_sigma), 4.0, 20.0)

    def step(self, external_mA: float | None = None) -> dict:
        self.state.time_s = time.time() - self.start_time
        self.state.pid_mA_in = float(external_mA) if external_mA is not None else self.random_pid_mA()
        target_pos = self.mA_to_position(self.state.pid_mA_in)
        alpha_pos = 1.0 - math.exp(-self.dt / max(self.tau_pos, 1e-9))
        self.state.valve_pos_pct += (target_pos - self.state.valve_pos_pct) * alpha_pos
        self.state.valve_pos_pct = self._clamp(self.state.valve_pos_pct, 0.0, 100.0)
        Cv_valve = self.Cv_from_position(self.state.valve_pos_pct)
        target_flow, _ = self.solve_flow_from_Cv(Cv_valve)
        alpha_flow = 1.0 - math.exp(-self.dt / max(self.tau_flow, 1e-9))
        self.state.flow_gpm += (target_flow - self.state.flow_gpm) * alpha_flow
        self.state.flow_gpm = max(0.0, self.state.flow_gpm)
        survey = self.pressure_survey(self.state.flow_gpm, Cv_valve)
        mA_now = round(self.state.pid_mA_in, 4)
        pos_now = round(self.state.valve_pos_pct, 4)
        return {
            "time_s": round(self.state.time_s, 2),
            "pid_mA_in": mA_now,
            "received_mA": mA_now,
            "pid_output_mA": mA_now,
            "valve_position_pct": pos_now,
            "controller_output_pct": pos_now,
            "Cv_valve": round(Cv_valve, 4),
            "flow_gpm": round(self.state.flow_gpm, 4),
            "Valve_Inlet_psig": round(survey["Valve_Inlet_psig"], 2),
            "Downstream_psig": round(survey["Valve_Outlet_psig"], 2),
            "dP_orifice_psi": round(survey["dP_orifice_psi"], 3),
            "dP_valve_psi": round(survey["dP_valve_psi"], 3),
            "dP_nozzle_psi": round(survey["dP_nozzle_psi"], 3),
            "pump_discharge_psia": round(survey["Pump_Discharge_psia"], 2),
            "valve_inlet_psia": round(survey["Valve_Inlet_psia"], 2),
            "nozzle_inlet_psia": round(survey["Valve_Outlet_psia"], 2),
            "pump_head_ft": round(survey["pump_head_ft"], 2),
            "friction_head_ft": round(survey["friction_head_ft"], 3),
            "velocity_fps": round(survey["velocity_fps"], 2),
            "Cv_orifice": round(survey["Cv_orifice"], 4),
            "R_equal_percent": round(survey["R_equal_percent"], 3),
        }
`;

export default function SulfurControlPythonCodeDynamic() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { id } = useParams();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DYNAMIC_CODE);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "The dynamic solver code has been copied to your clipboard."
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
                  <h1 className="text-xl font-bold">Sulfur Control - Dynamic Solver</h1>
                  <p className="text-xs text-muted-foreground">
                    Dynamic Simulation with Equal-Percentage Valve &amp; Positioner Lag
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
              {DYNAMIC_CODE}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </div>
  );
}
