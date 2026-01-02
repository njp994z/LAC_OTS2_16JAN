import math
import time
import random
import json
import sys
from dataclasses import dataclass

# Default CONFIG - will be overridden by incoming data
CONFIG = {
    "pipe_dia_in": 4.0,
    "line_length_ft": 80.0,
    "deltaP_nozzle_psi": 150.0,
    "furnace_static_psi": 7.0,
    "friction_factor": 0.018,
    "K_minor_losses": 7.5,
    "SG": 1.79,
    "Cv_max": 548.0,
    "barometric_psia": 14.696,
    "temperature_f": 275.0,
    "discharge_line_loss_psi": 2.0,
    "Cv_orifice": 18.3158,
    "R_equal_percent": 85.0,
    "default_pit_level_ft": 7.0,
    "pump_coeffs": [-1.06594794e-05, -7.73601399e-04, -4.91452991e-02, 296.104895],
}

@dataclass
class DynamicState:
    time_s: float = 0.0
    received_mA: float = 4.0
    valve_position_pct: float = 0.0
    flow_gpm: float = 0.0


class DynamicSulfurSprayHydraulics:
    """
    Dynamic model consistent with UPDATED STATIC code:
      - Fixed-speed pump curve
      - Discharge line friction + minor losses
      - DP-orifice upstream of valve: dP_orifice = SG*(Q/Cv_orifice)^2
      - Fixed downstream boundary: P2 = furnace_static_psi + deltaP_nozzle_psi
      - Equal-% valve: Cv(p) = (Cv_max/R) * R^(p/100)
      - Solve coupled hydraulics with Newton-Raphson in Q each step.

    Input:
      - Random PID output (mA) each step (mean selected to target mean_flow_gpm)

    Dynamics:
      - Positioner: first-order lag
      - Flow: first-order lag toward hydraulically solved steady-state Q
    """

    def __init__(
        self,
        dt: float = 0.5,
        positioner_tau_s: float = 8.0,
        flow_tau_s: float = 4.0,
        pit_level_ft: float | None = None,
        mean_flow_gpm: float = 74.98,
        mA_noise_sigma: float = 0.6,
        rng_seed: int | None = None,
        newton_max_iter: int = 30,
        newton_tol_gpm: float = 1e-3,
        newton_eps_gpm: float = 1e-2,
    ):
        # timing/dynamics
        self.dt = float(dt)
        self.tau_pos = float(positioner_tau_s)
        self.tau_flow = float(flow_tau_s)

        self.state = DynamicState()
        self.start_time = time.time()

        # random signal
        self.mean_flow_gpm = float(mean_flow_gpm)
        self.mA_noise_sigma = float(mA_noise_sigma)
        self.rng = random.Random(rng_seed)

        # constants
        self.g = 32.174
        self.SG = float(CONFIG["SG"])
        self.psi_per_ft = self.SG * 0.433
        self.p_atm = float(CONFIG.get("barometric_psia", 14.696))

        # geometry
        self.pipe_dia_ft = float(CONFIG["pipe_dia_in"]) / 12.0
        self.pipe_area_ft2 = math.pi * (self.pipe_dia_ft / 2.0) ** 2

        # line loss inputs
        self.f = float(CONFIG["friction_factor"])
        self.L = float(CONFIG["line_length_ft"])
        self.K = float(CONFIG["K_minor_losses"])
        self.discharge_line_loss_psi = float(CONFIG.get("discharge_line_loss_psi", 2.0))

        # pump curve
        self.pump_coeffs = CONFIG.get(
            "pump_coeffs",
            [-1.06594794e-05, -7.73601399e-04, -4.91452991e-02, 296.104895],
        )

        # valve equal-%
        self.Cv_max = float(CONFIG["Cv_max"])
        self.R = max(float(CONFIG["R_equal_percent"]), 1.000001)

        # downstream fixed
        self.furnace_static_psig = float(CONFIG["furnace_static_psi"])
        self.nozzle_dp_psi_fixed = float(CONFIG["deltaP_nozzle_psi"])
        self.P2_psig = self.furnace_static_psig + self.nozzle_dp_psi_fixed

        # DP-orifice
        self.Cv_orifice = float(CONFIG.get("Cv_orifice", 18.3158))

        # suction level
        self.pit_level_ft = float(pit_level_ft if pit_level_ft is not None else CONFIG.get("default_pit_level_ft", 7.0))

        # Newton settings
        self.newton_max_iter = int(newton_max_iter)
        self.newton_tol = float(newton_tol_gpm)
        self.newton_eps = float(newton_eps_gpm)

        # choose mean mA so steady-state average flow ~ mean_flow_gpm
        self.mean_mA = self._mean_mA_for_mean_flow(self.mean_flow_gpm)

        # initialize state at mean
        self.state.received_mA = self.mean_mA
        self.state.valve_position_pct = self.mA_to_position(self.mean_mA)
        self.state.flow_gpm = self.mean_flow_gpm

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
        if Q <= 0:
            return 0.0
        return self.SG * (Q / max(self.Cv_orifice, 1e-12)) ** 2

    def pump_head_ft(self, Q_gpm: float) -> float:
        a, b, c, d = self.pump_coeffs
        head = a * Q_gpm**3 + b * Q_gpm**2 + c * Q_gpm + d
        return max(0.0, head)

    def friction_head_ft(self, Q_gpm: float) -> tuple[float, float]:
        Q = max(0.0, float(Q_gpm))
        if Q <= 0:
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

    def pressure_survey(self, Q_gpm: float) -> dict:
        Q = max(0.0, float(Q_gpm))
        up = self.pump_discharge_psig(Q)

        dp_orf = self.dp_orifice_psi(Q)
        P1_psig = up["pump_discharge_psig"] - self.discharge_line_loss_psi - dp_orf
        dp_valve = max(P1_psig - self.P2_psig, 0.0)

        return {
            "Suction_psig": up["suction_psig"],
            "Pump_Discharge_psig": up["pump_discharge_psig"],
            "Valve_Inlet_psig": P1_psig,
            "Valve_Outlet_psig": self.P2_psig,
            "dP_orifice_psi": dp_orf,
            "dP_valve_psi": dp_valve,
            "dP_nozzle_psi": self.nozzle_dp_psi_fixed,
            "pump_head_ft": up["pump_head_ft"],
            "friction_head_ft": up["friction_head_ft"],
            "velocity_fps": up["velocity_fps"],
        }

    def _f_Q(self, Q: float, Cv_valve: float) -> float:
        """f(Q) = Q - Cv*sqrt(dp_valve(Q)/SG) = 0"""
        survey = self.pressure_survey(Q)
        dp = max(survey["dP_valve_psi"], 0.0)
        Q_from_valve = Cv_valve * math.sqrt(dp / self.SG) if dp > 0 else 0.0
        return Q - Q_from_valve

    def solve_Q_newton(self, Cv_valve: float, Q_init: float) -> tuple[float, dict]:
        Cv_valve = max(float(Cv_valve), 0.0)
        if Cv_valve <= 0.0:
            s = self.pressure_survey(0.0)
            return 0.0, s

        Q = max(0.0, float(Q_init))

        for _ in range(self.newton_max_iter):
            f0 = self._f_Q(Q, Cv_valve)

            if abs(f0) < self.newton_tol:
                s = self.pressure_survey(Q)
                return Q, s

            eps = max(self.newton_eps, 0.05 * max(Q, 1.0))
            f_plus = self._f_Q(Q + eps, Cv_valve)
            f_minus = self._f_Q(max(Q - eps, 0.0), Cv_valve)

            df_dQ = (f_plus - f_minus) / ((Q + eps) - max(Q - eps, 0.0))
            if abs(df_dQ) < 1e-9:
                df_dQ = 1.0

            step = f0 / df_dQ
            Q_new = Q - step

            if Q_new < 0.0:
                Q_new = 0.0
            Q = 0.5 * Q + 0.5 * Q_new

        s = self.pressure_survey(Q)
        return Q, s

    def _mean_mA_for_mean_flow(self, Q_target: float) -> float:
        """Compute a mean mA that (approximately) yields Q_target at steady-state."""
        Q = max(0.0, float(Q_target))
        s = self.pressure_survey(Q)
        dp = max(s["dP_valve_psi"], 1e-9)
        Cv_req = Q * math.sqrt(self.SG / dp)
        pos = self._clamp(self.position_from_Cv(Cv_req), 0.0, 100.0)
        return self._clamp(self.position_to_mA(pos), 4.0, 20.0)

    def random_received_mA(self) -> float:
        mA = self.rng.gauss(self.mean_mA, self.mA_noise_sigma)
        return self._clamp(mA, 4.0, 20.0)

    def step(self) -> dict:
        self.state.time_s = time.time() - self.start_time

        # 1) random PID received
        self.state.received_mA = self.random_received_mA()

        # 2) positioner lag
        target_pos = self.mA_to_position(self.state.received_mA)
        alpha_pos = 1.0 - math.exp(-self.dt / max(self.tau_pos, 1e-9))
        self.state.valve_position_pct += (target_pos - self.state.valve_position_pct) * alpha_pos
        self.state.valve_position_pct = self._clamp(self.state.valve_position_pct, 0.0, 100.0)

        # 3) valve Cv from lagged position
        Cv_valve = self.Cv_from_position(self.state.valve_position_pct)

        # 4) solve steady-state Q for that Cv via Newton-Raphson
        Q_ss, survey_ss = self.solve_Q_newton(Cv_valve, Q_init=self.state.flow_gpm)

        # 5) flow lag
        alpha_flow = 1.0 - math.exp(-self.dt / max(self.tau_flow, 1e-9))
        self.state.flow_gpm += (Q_ss - self.state.flow_gpm) * alpha_flow
        self.state.flow_gpm = max(0.0, self.state.flow_gpm)

        # 6) pressure survey at lagged flow
        survey = self.pressure_survey(self.state.flow_gpm)

        # 7) Cv_required at lagged conditions
        dp_valve = max(survey["dP_valve_psi"], 1e-9)
        Cv_req = self.state.flow_gpm * math.sqrt(self.SG / dp_valve) if self.state.flow_gpm > 0 else 0.0

        mA_now = round(self.state.received_mA, 4)

        return {
            "time_s": round(self.state.time_s, 2),
            "received_mA": mA_now,
            "pid_output_mA": mA_now,
            "pid_mA_in": mA_now,
            "controller_output_mA": mA_now,
            "valve_position_pct": round(self.state.valve_position_pct, 4),
            "valve_pos_pct": round(self.state.valve_position_pct, 4),
            "positioner_pct": round(self.state.valve_position_pct, 4),
            "controller_output_pct": round(self.state.valve_position_pct, 4),
            "x": round(self.state.valve_position_pct / 100.0, 6),
            "Cv_valve": round(Cv_valve, 4),
            "current_Cv": round(Cv_valve, 4),
            "Cv_required": round(Cv_req, 6),
            "flow_gpm": round(self.state.flow_gpm, 4),
            "flow_ss_gpm": round(Q_ss, 4),
            "Valve_Inlet_psig": round(survey["Valve_Inlet_psig"], 2),
            "Downstream_psig": round(survey["Valve_Outlet_psig"], 2),
            "dP_orifice_psi": round(survey["dP_orifice_psi"], 3),
            "dP_valve_psi": round(survey["dP_valve_psi"], 3),
            "dP_valve_psid": round(survey["dP_valve_psi"], 3),
            "dP_nozzle_psi": round(survey["dP_nozzle_psi"], 3),
            "pump_head_ft": round(survey["pump_head_ft"], 2),
            "friction_head_ft": round(survey["friction_head_ft"], 3),
            "velocity_fps": round(survey["velocity_fps"], 2),
            "mean_mA_used": round(self.mean_mA, 4),
            "mA_noise_sigma": self.mA_noise_sigma,
            "Cv_orifice": round(self.Cv_orifice, 4),
            "R_equal_percent": round(self.R, 3),
            "P2_fixed_psig": round(self.P2_psig, 2),
        }

    def reset(self):
        self.state = DynamicState()
        self.start_time = time.time()
        self.state.received_mA = self.mean_mA
        self.state.valve_position_pct = self.mA_to_position(self.mean_mA)
        self.state.flow_gpm = self.mean_flow_gpm

    def restore_state(self, time_s: float, received_mA: float, valve_position_pct: float, flow_gpm: float):
        """Restore state from previous step for continuity."""
        self.state.time_s = float(time_s)
        self.state.received_mA = float(received_mA)
        self.state.valve_position_pct = float(valve_position_pct)
        self.state.flow_gpm = float(flow_gpm)
        # Adjust start_time so time_s continues correctly
        self.start_time = time.time() - self.state.time_s


def main():
    try:
        raw = sys.stdin.read()
        if not raw:
            return
        data = json.loads(raw)
        
        # Override CONFIG with incoming parameters
        if 'SG' in data: CONFIG['SG'] = float(data['SG'])
        if 'Cv_max' in data: CONFIG['Cv_max'] = float(data['Cv_max'])
        if 'R_value' in data: CONFIG['R_equal_percent'] = float(data['R_value'])
        if 'R_equal_percent' in data: CONFIG['R_equal_percent'] = float(data['R_equal_percent'])
        if 'Cv_orifice' in data: CONFIG['Cv_orifice'] = float(data['Cv_orifice'])
        if 'furnace_static_psi' in data: CONFIG['furnace_static_psi'] = float(data['furnace_static_psi'])
        if 'deltaP_nozzle_psi' in data: CONFIG['deltaP_nozzle_psi'] = float(data['deltaP_nozzle_psi'])
        if 'pipe_dia_in' in data: CONFIG['pipe_dia_in'] = float(data['pipe_dia_in'])
        if 'line_length_ft' in data: CONFIG['line_length_ft'] = float(data['line_length_ft'])
        if 'friction_factor' in data: CONFIG['friction_factor'] = float(data['friction_factor'])
        if 'K_minor_losses' in data: CONFIG['K_minor_losses'] = float(data['K_minor_losses'])
        if 'barometric_psia' in data: CONFIG['barometric_psia'] = float(data['barometric_psia'])
        if 'discharge_line_loss_psi' in data: CONFIG['discharge_line_loss_psi'] = float(data['discharge_line_loss_psi'])
        if 'pump_coeffs' in data: CONFIG['pump_coeffs'] = data['pump_coeffs']
        
        action = data.get('action', 'step')
        pit_level_ft = float(data.get('pit_level_ft', 7.0))
        tau_valve = float(data.get('tau_valve', 8.0))
        tau_flow = float(data.get('tau_flow', 4.0))
        dt = float(data.get('dt', 0.5))
        mean_flow_gpm = float(data.get('mean_flow_gpm', 74.98))
        mA_noise_sigma = float(data.get('mA_noise_sigma', 0.6))
        
        # Create model instance
        model = DynamicSulfurSprayHydraulics(
            dt=dt,
            positioner_tau_s=tau_valve,
            flow_tau_s=tau_flow,
            pit_level_ft=pit_level_ft,
            mean_flow_gpm=mean_flow_gpm,
            mA_noise_sigma=mA_noise_sigma,
            rng_seed=None,  # Use random seed for true randomness
        )
        
        if action == 'reset':
            # Return initial state at mean values
            model.reset()
            result = model.step()
            result["status"] = "success"
            result["m_Total_klb_hr"] = round(result["flow_gpm"] * CONFIG["SG"] * 500.3 / 1000, 2)
            result["temperature_f"] = float(CONFIG.get("temperature_f", 275.0))
            result["pit_level_ft"] = pit_level_ft
        else:
            # Restore state from previous step if provided
            state = data.get('state', {})
            if state and state.get('time_s', 0) > 0:
                model.restore_state(
                    time_s=state.get('time_s', 0.0),
                    received_mA=state.get('received_mA', state.get('controller_output_mA', model.mean_mA)),
                    valve_position_pct=state.get('valve_position_pct', state.get('valve_pos_pct', state.get('positioner_pct', 0.0))),
                    flow_gpm=state.get('flow_gpm', model.mean_flow_gpm)
                )
            
            # Run simulation step
            result = model.step()
            result["status"] = "success"
            result["m_Total_klb_hr"] = round(result["flow_gpm"] * CONFIG["SG"] * 500.3 / 1000, 2)
            result["temperature_f"] = float(CONFIG.get("temperature_f", 275.0))
            result["pit_level_ft"] = pit_level_ft
        
        print(json.dumps(result))
        
    except Exception as e:
        import traceback
        print(json.dumps({"status": "error", "message": str(e), "traceback": traceback.format_exc()}))


if __name__ == "__main__":
    main()
