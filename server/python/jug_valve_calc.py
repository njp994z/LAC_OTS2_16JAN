import sys
import json
import math
from dataclasses import dataclass, asdict

WHB_AREA: float       = 9_800.0
WHB_UO: float         = 16.0
STEAM_TEMP_F: float   = 540.7
CP_GAS: float         = 0.26
WHB_PRESS_DROP: float = 16.0
DAMPER_DP_MAX: float  = 5.0


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


def _stream_to_dict(s: StreamValues) -> dict:
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


def compute_all_streams(s5, jug_open_pct, damper_open_pct):
    jug_bypass_frac = min(1.0, max(0.0, jug_open_pct / 100.0))
    whb_frac        = 1.0 - jug_bypass_frac

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

    s7 = StreamValues(
        so2         = s5.so2   * jug_bypass_frac,
        so3         = s5.so3   * jug_bypass_frac,
        o2          = s5.o2    * jug_bypass_frac,
        n2          = s5.n2    * jug_bypass_frac,
        h2o         = s5.h2o   * jug_bypass_frac,
        h2so4       = s5.h2so4 * jug_bypass_frac,
        total       = s5.total * jug_bypass_frac,
        pressure    = s5.pressure,
        temperature = s5.temperature,
    )

    whb_outlet_temp = s5.temperature
    if s6.total > 0:
        m_cp          = s6.total * 60.0 * CP_GAS
        ntu           = (WHB_UO * WHB_AREA) / m_cp
        effectiveness = 1.0 - math.exp(-ntu)
        whb_outlet_temp = s5.temperature - effectiveness * (s5.temperature - STEAM_TEMP_F)
        whb_outlet_temp = max(STEAM_TEMP_F + 10.0, whb_outlet_temp)

    s8a_press = s5.pressure - WHB_PRESS_DROP

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
        temperature = s8a.temperature,
    )

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

    return {
        "GF1":  _stream_to_dict(s5),
        "GB0":  _stream_to_dict(s6),
        "GJV0": _stream_to_dict(s7),
        "GB1":  _stream_to_dict(s8a),
        "GPV1": _stream_to_dict(s8b),
        "GP10": _stream_to_dict(s9),
    }


if __name__ == "__main__":
    input_data = json.loads(sys.stdin.read())

    s5 = StreamValues(
        so2         = float(input_data.get("s5_so2", 12401)),
        so3         = float(input_data.get("s5_so3", 227)),
        o2          = float(input_data.get("s5_o2", 10261)),
        n2          = float(input_data.get("s5_n2", 86808)),
        h2o         = float(input_data.get("s5_h2o", 0)),
        h2so4       = float(input_data.get("s5_h2so4", 0)),
        total       = float(input_data.get("s5_total", 109697)),
        pressure    = float(input_data.get("s5_pressure", 196)),
        temperature = float(input_data.get("s5_temperature", 2080)),
    )

    jug_open    = float(input_data.get("jug_open_pct", 10))
    damper_open = float(input_data.get("damper_open_pct", 100))

    result = compute_all_streams(s5, jug_open, damper_open)
    print(json.dumps(result))
