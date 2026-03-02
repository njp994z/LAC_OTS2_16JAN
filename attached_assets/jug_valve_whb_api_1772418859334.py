"""
jug_valve_whb_api.py
====================
Flask REST API — Jug Valve / WHB Hot-side / Positioner Simulation

Endpoint
--------
POST /api/jug-valve-simulation
    Request  (JSON): JugValveSimulationRequest
    Response (JSON): JugValveSimulationResponse

Process Topology
----------------

  Stream 5 (Furnace Outlet)   ← caller-supplied input
      │
      ├─[Jug Valve bypass %]──► Stream 7  (GJV0, hot bypass) ────────────────┐
      │                                                                         │
      └─[WHB path %]──────────► Stream 6  (GB0)                               │
                                    │                                           │
                                  [WHB — NTU/effectiveness heat exchange]      │
                                    │                                           │
                                Stream 8A (GB1, cooled)                        │
                                    │                                           │
                              [Damper / Positioner]                            │
                              (start-up valve only;                            │
                               100% open → 8B = 8A)                           │
                                    │                                           │
                                Stream 8B (GPV1) ──────────────────────────────┤
                                                                                ▼
                                                                    Stream 9  (GP10)
                                                                    = 8B + 7  (mixed)

Jug Valve logic
---------------
  jugBypassFrac = jug_open_pct / 100
  0 %  → all flow through WHB (S7 = 0,  S6 = S5)
  100% → all flow bypasses WHB (S6 = 0, S7 = S5)

Damper / Positioner logic
-------------------------
  100% open → Stream 8B identical to Stream 8A  (startup mode, no restriction)
  Partial   → quadratic pressure drop only; composition & temp unchanged.
              ΔP_damper = ΔP_max_damper × (1 − open_frac)²
"""

from __future__ import annotations

import math
from dataclasses import dataclass, asdict

from flask import Flask, request, jsonify, Response
from flask_cors import CORS  # pip install flask-cors

# ─────────────────────────────────────────────────────────────────────────────
# Flask app
# ─────────────────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)  # allow cross-origin requests from the React front-end

# ─────────────────────────────────────────────────────────────────────────────
# Physical / equipment constants
# ─────────────────────────────────────────────────────────────────────────────
WHB_AREA: float       = 9_800.0   # ft²  — heat-transfer area
WHB_UO: float         = 16.0      # BTU / (ft²·°F·hr)  — overall HTC
STEAM_TEMP_F: float   = 540.7     # °F   — saturation temp @ 915 psig
CP_GAS: float         = 0.26      # BTU / (scf·°F)  — process-gas heat capacity
WHB_PRESS_DROP: float = 16.0      # in. wc  — fixed WHB-side pressure drop (H&MB: 196→180)
DAMPER_DP_MAX: float  = 5.0       # in. wc  — max additional ΔP when damper fully closed


# ─────────────────────────────────────────────────────────────────────────────
# Data structures
# ─────────────────────────────────────────────────────────────────────────────
@dataclass
class StreamValues:
    so2:         float
    so3:         float
    o2:          float
    n2:          float
    h2o:         float
    h2so4:       float
    total:       float
    pressure:    float
    temperature: float


@dataclass
class JugValveSimulationRequest:
    # Stream 5 — Furnace Outlet (input)
    s5_so2:         float
    s5_so3:         float
    s5_o2:          float
    s5_n2:          float
    s5_h2o:         float
    s5_h2so4:       float
    s5_total:       float
    s5_pressure:    float
    s5_temperature: float

    # Valve positions
    jug_open_pct:     float   # 0–100 %  (0 = all through WHB, 100 = full bypass)
    damper_open_pct:  float   # 0–100 %  (100 = 8B identical to 8A, start-up mode)


@dataclass
class JugValveSimulationResponse:
    # Each stream is a flat dict of {param: value}
    GF1:  dict   # Stream 5  — Furnace Outlet   (echoed input)
    GB0:  dict   # Stream 6  — WHB Inlet
    GJV0: dict   # Stream 7  — Jug Valve Bypass Inlet
    GB1:  dict   # Stream 8A — WHB Outlet
    GPV1: dict   # Stream 8B — Positioner/Damper Outlet
    GP10: dict   # Stream 9  — Gas Pass 1 Inlet


# ─────────────────────────────────────────────────────────────────────────────
# Simulation engine
# ─────────────────────────────────────────────────────────────────────────────
def _stream_to_dict(s: StreamValues) -> dict:
    """Round integers sensibly for JSON output."""
    return {
        "so2":         round(s.so2),
        "so3":         round(s.so3),
        "o2":          round(s.o2),
        "n2":          round(s.n2),
        "h2o":         round(s.h2o),
        "h2so4":       round(s.h2so4),
        "total":       round(s.total),
        "pressure":    round(s.pressure, 1),
        "temperature": round(s.temperature),
    }


def compute_all_streams(
    s5: StreamValues,
    jug_open_pct: float,
    damper_open_pct: float,
) -> JugValveSimulationResponse:
    """
    Core simulation.  All calculations are pure functions of the inputs.

    Parameters
    ----------
    s5             : Stream 5 — Furnace Outlet values (caller-supplied).
    jug_open_pct   : Jug valve opening, 0–100 %.
    damper_open_pct: Damper / positioner opening, 0–100 %.

    Returns
    -------
    JugValveSimulationResponse with all six stream dicts.
    """

    jug_bypass_frac = min(1.0, max(0.0, jug_open_pct  / 100.0))
    whb_frac        = 1.0 - jug_bypass_frac

    # ── Stream 6: WHB Inlet ──────────────────────────────────────────────────
    s6 = StreamValues(
        so2         = s5.so2   * whb_frac,
        so3         = s5.so3   * whb_frac,
        o2          = s5.o2    * whb_frac,
        n2          = s5.n2    * whb_frac,
        h2o         = s5.h2o   * whb_frac,
        h2so4       = s5.h2so4 * whb_frac,
        total       = s5.total * whb_frac,
        pressure    = s5.pressure,
        temperature = s5.temperature,
    )

    # ── Stream 7: Jug Valve Bypass (hot) ────────────────────────────────────
    s7 = StreamValues(
        so2         = s5.so2   * jug_bypass_frac,
        so3         = s5.so3   * jug_bypass_frac,
        o2          = s5.o2    * jug_bypass_frac,
        n2          = s5.n2    * jug_bypass_frac,
        h2o         = s5.h2o   * jug_bypass_frac,
        h2so4       = s5.h2so4 * jug_bypass_frac,
        total       = s5.total * jug_bypass_frac,
        pressure    = s5.pressure,
        temperature = s5.temperature,   # bypass stays at furnace outlet temp
    )

    # ── WHB outlet temperature — NTU-effectiveness model ─────────────────────
    #   For a condensing steam-side (Cmax → ∞):
    #     NTU = U·A / (m·Cp)
    #     ε   = 1 − exp(−NTU)
    #     T_out = T_in − ε · (T_in − T_steam)
    whb_outlet_temp = s5.temperature   # default if WHB has no flow
    if s6.total > 0:
        m_cp          = s6.total * 60.0 * CP_GAS          # BTU/(hr·°F)
        ntu           = (WHB_UO * WHB_AREA) / m_cp
        effectiveness = 1.0 - math.exp(-ntu)
        whb_outlet_temp = s5.temperature - effectiveness * (s5.temperature - STEAM_TEMP_F)
        whb_outlet_temp = max(STEAM_TEMP_F + 10.0, whb_outlet_temp)  # physical lower bound

    s8a_press = s5.pressure - WHB_PRESS_DROP

    # ── Stream 8A: WHB Outlet ────────────────────────────────────────────────
    s8a = StreamValues(
        so2         = s6.so2,
        so3         = s6.so3,
        o2          = s6.o2,
        n2          = s6.n2,
        h2o         = s6.h2o,
        h2so4       = s6.h2so4,
        total       = s6.total,
        pressure    = s8a_press,
        temperature = whb_outlet_temp,
    )

    # ── Stream 8B: Positioner / Damper Outlet ────────────────────────────────
    #   100% open (start-up) → 8B = 8A, ΔP_damper = 0
    #   Partial open         → quadratic throttle: ΔP = ΔP_max·(1 − frac)²
    damper_frac    = min(1.0, max(0.0, damper_open_pct / 100.0))
    damper_delta_p = DAMPER_DP_MAX * (1.0 - damper_frac) ** 2

    s8b = StreamValues(
        so2         = s8a.so2,
        so3         = s8a.so3,
        o2          = s8a.o2,
        n2          = s8a.n2,
        h2o         = s8a.h2o,
        h2so4       = s8a.h2so4,
        total       = s8a.total,
        pressure    = s8a_press - damper_delta_p,
        temperature = s8a.temperature,   # no heat loss across damper
    )

    # ── Stream 9: Gas Pass 1 Inlet = 8B + 7 (mixed) ─────────────────────────
    total_flow_9 = s8b.total + s7.total

    if total_flow_9 > 0:
        mixed_temp_9  = (
            s8b.temperature * s8b.total + s7.temperature * s7.total
        ) / total_flow_9
        mixed_press_9 = (
            s8b.pressure * s8b.total + s7.pressure * s7.total
        ) / total_flow_9
    else:
        mixed_temp_9  = s5.temperature
        mixed_press_9 = s8b.pressure

    s9 = StreamValues(
        so2         = s8b.so2   + s7.so2,
        so3         = s8b.so3   + s7.so3,
        o2          = s8b.o2    + s7.o2,
        n2          = s8b.n2    + s7.n2,
        h2o         = s8b.h2o   + s7.h2o,
        h2so4       = s8b.h2so4 + s7.h2so4,
        total       = total_flow_9,
        pressure    = mixed_press_9,
        temperature = mixed_temp_9,
    )

    return JugValveSimulationResponse(
        GF1  = _stream_to_dict(s5),
        GB0  = _stream_to_dict(s6),
        GJV0 = _stream_to_dict(s7),
        GB1  = _stream_to_dict(s8a),
        GPV1 = _stream_to_dict(s8b),
        GP10 = _stream_to_dict(s9),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Route
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/jug-valve-simulation", methods=["POST"])
def jug_valve_simulation() -> tuple[Response, int]:
    """
    POST /api/jug-valve-simulation

    Request body (JSON)
    -------------------
    {
        "s5_so2":          12401,
        "s5_so3":          227,
        "s5_o2":           10261,
        "s5_n2":           86808,
        "s5_h2o":          0,
        "s5_h2so4":        0,
        "s5_total":        109697,
        "s5_pressure":     196,
        "s5_temperature":  2080,
        "jug_open_pct":    10,
        "damper_open_pct": 100
    }

    Response body (JSON)
    --------------------
    {
        "GF1":  { "so2": …, "so3": …, "o2": …, "n2": …, "h2o": …,
                  "h2so4": …, "total": …, "pressure": …, "temperature": … },
        "GB0":  { … },
        "GJV0": { … },
        "GB1":  { … },
        "GPV1": { … },
        "GP10": { … }
    }
    """
    body = request.get_json(force=True, silent=True)
    if not body:
        return jsonify({"error": "Request body must be JSON."}), 400

    # ── Validate required fields ─────────────────────────────────────────────
    required = [
        "s5_so2", "s5_so3", "s5_o2", "s5_n2", "s5_h2o", "s5_h2so4",
        "s5_total", "s5_pressure", "s5_temperature",
        "jug_open_pct", "damper_open_pct",
    ]
    missing = [f for f in required if f not in body]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    try:
        jug_open    = float(body["jug_open_pct"])
        damper_open = float(body["damper_open_pct"])
    except (TypeError, ValueError):
        return jsonify({"error": "jug_open_pct and damper_open_pct must be numbers."}), 400

    if not (0 <= jug_open <= 100) or not (0 <= damper_open <= 100):
        return jsonify({"error": "Valve percentages must be between 0 and 100."}), 400

    try:
        s5 = StreamValues(
            so2         = float(body["s5_so2"]),
            so3         = float(body["s5_so3"]),
            o2          = float(body["s5_o2"]),
            n2          = float(body["s5_n2"]),
            h2o         = float(body["s5_h2o"]),
            h2so4       = float(body["s5_h2so4"]),
            total       = float(body["s5_total"]),
            pressure    = float(body["s5_pressure"]),
            temperature = float(body["s5_temperature"]),
        )
    except (TypeError, ValueError) as exc:
        return jsonify({"error": f"Invalid Stream 5 value: {exc}"}), 400

    # ── Run simulation ────────────────────────────────────────────────────────
    result = compute_all_streams(s5, jug_open, damper_open)
    return jsonify(asdict(result)), 200


# ─────────────────────────────────────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health() -> tuple[Response, int]:
    return jsonify({"status": "ok"}), 200


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Development server — replace with gunicorn/uWSGI in production
    app.run(host="0.0.0.0", port=5000, debug=True)
