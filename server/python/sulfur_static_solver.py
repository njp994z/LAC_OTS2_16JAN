import math
import json
import sys
from datetime import datetime

# ----------------------------
# Configuration
# ----------------------------
CONFIG = {
    # Line / fluid
    "pipe_dia_in": 4.0,
    "line_length_ft": 80.0,
    "friction_factor": 0.018,
    "K_minor_losses": 7.5,
    "SG": 1.79,
    "temperature_f": 275.0,

    # Atmosphere for psia display
    "barometric_psia": 14.696,

    # Pump curve (fixed-speed) head(ft) = a Q^3 + b Q^2 + c Q + d
    "pump_coeffs": [-1.06594794e-05, -7.73601399e-04, -4.91452991e-02, 296.104895],

    # Valve equal-% characteristic
    "Cv_max": 548.0,
    "R_equal_percent": 85.0,

    # Downstream boundary (fixed)
    "furnace_static_psi": 7.0,
    "deltaP_nozzle_psi": 150.0,

    # Fixed losses between pump outlet and valve inlet (not including orifice)
    "discharge_line_loss_psi": 2.0,

    # DP-orifice (new element)
    # Leave as None to auto-size at the calibration point below
    "Cv_orifice": None,

    # Calibration target: enforce datasheet valve ΔP at a chosen flow
    "cal_flow_gpm": 86.91,
    "cal_dp_valve_psi": 21.66,

    # Suction level (used unless passed into calculate)
    "default_pit_level_ft": 7.0,
}


class StaticSulfurSprayHydraulics:
    """
    Static model with:
      - Fixed-speed pump curve
      - Optional DP-orifice upstream of control valve to absorb excess pump head
      - Fixed downstream pressure = furnace + nozzle ΔP
      - Equal-% valve mapping for Cv/position/PID
    """

    def __init__(self):
        self.g = 32.174
        self.SG = float(CONFIG["SG"])
        self.psi_per_ft = self.SG * 0.433

        self.pipe_dia_ft = float(CONFIG["pipe_dia_in"]) / 12.0
        self.pipe_area_ft2 = math.pi * (self.pipe_dia_ft / 2.0) ** 2

        self.p_atm = float(CONFIG["barometric_psia"])
        self.pump_coeffs = CONFIG["pump_coeffs"]

        # Valve
        self.Cv_max = float(CONFIG["Cv_max"])
        self.R = max(float(CONFIG["R_equal_percent"]), 1.000001)

        # If Cv_orifice not provided, auto-size it from calibration point
        if CONFIG.get("Cv_orifice") is None:
            CONFIG["Cv_orifice"] = self._size_orifice_Cv(
                Q_gpm=float(CONFIG["cal_flow_gpm"]),
                pit_level_ft=float(CONFIG["default_pit_level_ft"]),
                dp_valve_target_psi=float(CONFIG["cal_dp_valve_psi"]),
            )

    # ----------------------------
    # Utility
    # ----------------------------
    @staticmethod
    def _clamp(x: float, lo: float, hi: float) -> float:
        return max(lo, min(hi, x))

    # ----------------------------
    # Valve equal-% equations
    # ----------------------------
    def pos_from_Cv(self, Cv: float) -> float:
        """
        Inverse equal-%:
          Cv(p) = (Cv_max/R) * R^(p/100)
          => p = 100 * ln(Cv*R/Cv_max) / ln(R)
        """
        Cv = max(float(Cv), 0.0)
        Cv_min = self.Cv_max / self.R
        if Cv <= Cv_min:
            return 0.0
        if Cv >= self.Cv_max:
            return 100.0
        return 100.0 * (math.log(Cv * self.R / self.Cv_max) / math.log(self.R))

    # ----------------------------
    # Orifice model (new element)
    # ----------------------------
    def dp_orifice_psi(self, Q_gpm: float) -> float:
        """
        DP-orifice modeled as a Cv element:
          ΔP = SG*(Q/Cv_orifice)^2
        """
        Q = max(0.0, float(Q_gpm))
        if Q <= 0.0:
            return 0.0
        Cv_o = max(float(CONFIG["Cv_orifice"]), 1e-12)
        return self.SG * (Q / Cv_o) ** 2

    def _size_orifice_Cv(self, Q_gpm: float, pit_level_ft: float, dp_valve_target_psi: float) -> float:
        """
        Auto-size Cv_orifice so that at (Q_gpm):
          dp_valve = dp_valve_target_psi
        while downstream pressure is fixed at:
          P2 = furnace + nozzle ΔP
        """
        Q = max(0.0, float(Q_gpm))

        # downstream fixed
        P2 = float(CONFIG["furnace_static_psi"]) + float(CONFIG["deltaP_nozzle_psi"])
        P1_req = P2 + float(dp_valve_target_psi)

        # pump discharge from curve
        pump_discharge_psig, _ = self._pump_discharge_psig(Q, pit_level_ft)

        dp_line = float(CONFIG["discharge_line_loss_psi"])
        dp_orifice_req = pump_discharge_psig - dp_line - P1_req

        # If pump can't even make the required pressure, do not "invent" an orifice
        if dp_orifice_req <= 0.0:
            return 1e9  # effectively no orifice

        Cv_o = Q * math.sqrt(self.SG / dp_orifice_req)
        return float(Cv_o)

    # ----------------------------
    # Pump / friction
    # ----------------------------
    def _pump_head_ft(self, Q_gpm: float) -> float:
        a, b, c, d = self.pump_coeffs
        head = a * Q_gpm**3 + b * Q_gpm**2 + c * Q_gpm + d
        return max(0.0, head)

    def _friction_head_ft(self, Q_gpm: float) -> tuple[float, float]:
        """
        Return (h_f_ft, velocity_fps) for the discharge line.
        """
        Q = max(0.0, float(Q_gpm))
        if Q <= 0.0:
            return 0.0, 0.0

        Q_cfs = Q / 448.831
        v = Q_cfs / self.pipe_area_ft2

        f = float(CONFIG["friction_factor"])
        L = float(CONFIG["line_length_ft"])
        D = self.pipe_dia_ft
        K = float(CONFIG["K_minor_losses"])

        h_f = (f * L / D + K) * (v**2) / (2.0 * self.g)
        return h_f, v

    def _pump_discharge_psig(self, Q_gpm: float, pit_level_ft: float) -> tuple[float, dict]:
        """
        Returns (pump_discharge_psig, diag_dict)
        """
        Q = max(0.0, float(Q_gpm))

        head_ft = self._pump_head_ft(Q)
        h_f_ft, v = self._friction_head_ft(Q)

        suction_psig = float(pit_level_ft) * self.psi_per_ft
        pump_discharge_psig = suction_psig + (head_ft - h_f_ft) * self.psi_per_ft

        diag = {
            "pump_head_ft": head_ft,
            "friction_head_ft": h_f_ft,
            "velocity_fps": v,
            "suction_psig": suction_psig,
        }
        return pump_discharge_psig, diag

    # ----------------------------
    # Main calculation
    # ----------------------------
    def calculate(self, flow_gpm: float, pit_level_ft: float | None = None) -> dict:
        Q = max(0.0, float(flow_gpm))
        if pit_level_ft is None:
            pit_level_ft = float(CONFIG["default_pit_level_ft"])

        # Downstream fixed by furnace + nozzle ΔP
        P2_psig = float(CONFIG["furnace_static_psi"]) + float(CONFIG["deltaP_nozzle_psi"])

        # Pump discharge from curve
        pump_discharge_psig, diag = self._pump_discharge_psig(Q, pit_level_ft)

        # Orifice pressure drop
        dp_orifice = self.dp_orifice_psi(Q)

        # Valve inlet
        dp_line = float(CONFIG["discharge_line_loss_psi"])
        P1_psig = pump_discharge_psig - dp_line - dp_orifice

        # Valve ΔP
        dp_valve = max(P1_psig - P2_psig, 0.0)

        # Required valve Cv for that Q and dp_valve
        Cv_req = Q * math.sqrt(self.SG / max(dp_valve, 1e-12)) if Q > 0 else 0.0

        # Convert Cv -> position -> mA
        pos_pct = self._clamp(self.pos_from_Cv(Cv_req), 0.0, 100.0)
        x = pos_pct / 100.0
        pid_mA = 4.0 + 16.0 * x

        # Convert to psia
        P1_psia = P1_psig + self.p_atm
        P2_psia = P2_psig + self.p_atm
        pump_discharge_psia = pump_discharge_psig + self.p_atm
        suction_psia = diag["suction_psig"] + self.p_atm

        # Mass flow
        mass_klb_hr = (Q * self.SG * 500.3) / 1000.0

        return {
            # Key outputs
            "Flow_gpm": round(Q, 2),
            "flow_gpm": round(Q, 2),
            "Cv_required": round(Cv_req, 6),
            "valve_position_pct": round(pos_pct, 4),
            "valve_position_percent": round(pos_pct, 4),
            "x": round(x, 6),
            "pid_output_mA": round(pid_mA, 4),

            # Pressure survey (psig)
            "Suction_psig": round(diag["suction_psig"], 2),
            "Pump_Discharge_psig": round(pump_discharge_psig, 2),
            "Valve_Inlet_psig": round(P1_psig, 2),
            "valve_inlet_psig": round(P1_psig, 2),
            "Valve_Outlet_psig": round(P2_psig, 2),
            "Nozzle_Inlet_psig": round(P2_psig, 2),
            "Furnace_psig": round(float(CONFIG["furnace_static_psi"]), 2),

            # Pressure survey (psia)
            "Suction_psia": round(suction_psia, 2),
            "Pump_Discharge_psia": round(pump_discharge_psia, 2),
            "Valve_Inlet_psia": round(P1_psia, 2),
            "Valve_Outlet_psia": round(P2_psia, 2),

            # Pressure psia aliases for UI
            "pressure_psia_pump": round(pump_discharge_psia, 2),
            "pressure_psia_valve": round(P1_psia, 2),
            "pressure_psia_nozzle": round(P2_psia, 2),

            # ΔP breakdown
            "dP_valve_psi": round(dp_valve, 3),
            "dP_nozzle_psi": round(float(CONFIG["deltaP_nozzle_psi"]), 3),
            "discharge_line_loss_psi": round(dp_line, 3),
            "dP_orifice_psi": round(dp_orifice, 3),

            # Hydraulics
            "pump_head_ft": round(diag["pump_head_ft"], 2),
            "friction_head_ft": round(diag["friction_head_ft"], 3),
            "friction_loss_ft": round(diag["friction_head_ft"], 3),
            "velocity_fps": round(diag["velocity_fps"], 2),

            # Downstream pressure aliases for GUI
            "downstream_psig": round(P2_psig, 2),
            "downstream_header_psig": round(P2_psig - float(CONFIG["furnace_static_psi"]) - float(CONFIG["deltaP_nozzle_psi"]), 3),

            # Orifice sizing info
            "Cv_orifice": round(float(CONFIG["Cv_orifice"]), 4),

            # Misc
            "m_Total_klb_hr": round(mass_klb_hr, 2),
            "Temp_F": float(CONFIG["temperature_f"]),
            "temperature_f": float(CONFIG["temperature_f"]),
            "R_equal_percent": round(self.R, 3),
            "Cv_max": float(self.Cv_max),
            "timestamp": datetime.now().isoformat(),
        }


def main():
    try:
        input_data = json.loads(sys.stdin.read())
        flow_gpm = float(input_data.get('flow_gpm', 87.0))
        pit_level_ft = float(input_data.get('pit_level_ft', 7.0))
        
        # Override config with runtime parameters from API
        if 'R_value' in input_data:
            CONFIG['R_equal_percent'] = float(input_data['R_value'])
        if 'pipe_dia_in' in input_data:
            CONFIG['pipe_dia_in'] = float(input_data['pipe_dia_in'])
        if 'line_length_ft' in input_data:
            CONFIG['line_length_ft'] = float(input_data['line_length_ft'])
        if 'friction_factor' in input_data:
            CONFIG['friction_factor'] = float(input_data['friction_factor'])
        if 'K_minor_losses' in input_data:
            CONFIG['K_minor_losses'] = float(input_data['K_minor_losses'])
        if 'SG' in input_data:
            CONFIG['SG'] = float(input_data['SG'])
        if 'Cv_max' in input_data:
            CONFIG['Cv_max'] = float(input_data['Cv_max'])
        if 'barometric_psia' in input_data:
            CONFIG['barometric_psia'] = float(input_data['barometric_psia'])
        if 'deltaP_nozzle_psi' in input_data:
            CONFIG['deltaP_nozzle_psi'] = float(input_data['deltaP_nozzle_psi'])
        if 'furnace_static_psi' in input_data:
            CONFIG['furnace_static_psi'] = float(input_data['furnace_static_psi'])
        if 'discharge_line_loss_psi' in input_data:
            CONFIG['discharge_line_loss_psi'] = float(input_data['discharge_line_loss_psi'])
        if 'temperature_f' in input_data:
            CONFIG['temperature_f'] = float(input_data['temperature_f'])
            
        # Reset Cv_orifice to None so it gets auto-sized with new parameters
        CONFIG['Cv_orifice'] = None
            
        model = StaticSulfurSprayHydraulics()
        result = model.calculate(flow_gpm, pit_level_ft)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
