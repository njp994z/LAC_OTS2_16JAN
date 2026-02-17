"""
Sulfur Interpass HX Valve & Stream Simulator
============================================
Static and Dynamic calculation modes for the interpass heat exchangers.
Ported from StaticInterpassHX and DynamicInterpassHX Python classes.
"""

import json
import sys
import math

CONFIG = {
    'power_h_hot': 0.6,
    'power_h_cold': 0.8,
    'power_dP': 1.5,
    'barometric_P_psia': 14.696,
    'k_304_SS': 8.7,
    'CIP_Cv_max_36': 100000,
    'CIP_Cv_max_78': 700000,
    'HIP_Cv_max_48': 200000,
    'dP_design_psi': 0.36,
    'Q_design_CIP': 103736,
    'Q_design_HIP': 104164,
}

PERCENT_OPEN = [0, 22, 33, 44, 56, 67, 78, 89, 100]
REL_CV = [0.0, 0.085, 0.155, 0.26, 0.40, 0.575, 0.775, 0.935, 1.0]

INLET_STREAMS_DEFAULT = {
    "stream12": {
        "SO2": 1335, "SO3": 11293, "O2": 4728, "N2": 86808,
        "H2O": 0, "H2SO4": 0, "TOTAL": 104164,
        "PRESSURE": 119, "TEMPERATURE": 965
    },
    "stream14": {
        "SO2": 480, "SO3": 12148, "O2": 4300, "N2": 86808,
        "H2O": 0, "H2SO4": 0, "TOTAL": 103736,
        "PRESSURE": 113, "TEMPERATURE": 847
    },
    "stream17A": {
        "SO2": 480, "SO3": 0, "O2": 4300, "N2": 86808,
        "H2O": 0, "H2SO4": 0, "TOTAL": 91588,
        "PRESSURE": 113, "TEMPERATURE": 180
    }
}


def interp_linear(x, xp, fp):
    if x <= xp[0]:
        return fp[0]
    if x >= xp[-1]:
        return fp[-1]
    for i in range(len(xp) - 1):
        if xp[i] <= x <= xp[i + 1]:
            t = (x - xp[i]) / (xp[i + 1] - xp[i])
            return fp[i] + t * (fp[i + 1] - fp[i])
    return fp[-1]


def cv_fraction(pct):
    return interp_linear(pct, PERCENT_OPEN, REL_CV)


def get_Cv(position_pct, cv_small, cv_large=None):
    if cv_large is None:
        return cv_small * cv_fraction(position_pct)
    else:
        if position_pct <= 50:
            return cv_small * cv_fraction(position_pct * 2)
        else:
            return (cv_small * cv_fraction(100) +
                    cv_large * cv_fraction((position_pct - 50) * 2))


def solve_flow_hx_for_target(Q_total, target_t_out, T_hot, T_cold, Q_design, dP_design):
    flow_hx = Q_total * 0.6
    for _ in range(200):
        flow_byp = Q_total - flow_hx
        t_mixed = (flow_hx * (T_hot - 80) + flow_byp * T_hot) / Q_total
        error = t_mixed - target_t_out
        if abs(error) < 0.01:
            break
        flow_hx += error * Q_total * 0.001
        flow_hx = max(0, min(Q_total, flow_hx))
    return flow_hx


def cv_from_flow(flow_hx, Q_total, Q_design, dP_design, P1, T_rankine, G=1.2):
    flow_byp = Q_total - flow_hx
    if flow_byp <= 0:
        return 0
    dP_hx = dP_design * (flow_hx / Q_design) ** CONFIG['power_dP']
    if dP_hx <= 0 or P1 <= 0 or T_rankine <= 0:
        return 0
    Q_scfh = flow_byp * 60
    denom = 1360 * math.sqrt(abs(dP_hx * P1 / (G * T_rankine)))
    if denom == 0:
        return 0
    return Q_scfh / denom


def solve_position(cv_req, cv_small, cv_large=None):
    if cv_req <= 0:
        return 0
    if cv_large is None:
        frac = cv_req / cv_small if cv_small > 0 else 0
        return interp_linear(frac, REL_CV, PERCENT_OPEN)
    else:
        cv_small_full = cv_small * 1.0
        if cv_req <= cv_small_full:
            frac = cv_req / cv_small if cv_small > 0 else 0
            return interp_linear(frac, REL_CV, PERCENT_OPEN) / 2
        else:
            frac = (cv_req - cv_small_full) / cv_large if cv_large > 0 else 0
            return 50 + interp_linear(frac, REL_CV, PERCENT_OPEN) / 2


def safe_float(val, fallback):
    try:
        v = float(val)
        if v != v:  # NaN check
            return fallback
        return v
    except (TypeError, ValueError):
        return fallback


def parse_inlet_streams(params):
    inlets = params.get('inlet_streams')
    if inlets:
        s12 = {}
        s14 = {}
        s17a = {}
        for row in inlets:
            p = row.get('parameter', '')
            s12[p] = safe_float(str(row.get('stream12', '0')).replace(',', ''), 0)
            s14[p] = safe_float(str(row.get('stream14', '0')).replace(',', ''), 0)
            s17a[p] = safe_float(str(row.get('stream17A', '0')).replace(',', ''), 0)
        return s12, s14, s17a
    return None, None, None


COMPONENTS = ["SO2", "SO3", "O2", "N2", "H2O", "H2SO4"]


def fmt(v):
    return f"{round(v):,}"


def calc_lmtd(T_hot_in, T_hot_out, T_cold_out, T_cold_in):
    dT1 = T_hot_in - T_cold_out
    dT2 = T_hot_out - T_cold_in
    if dT1 <= 0 or dT2 <= 0:
        return 0.0
    if abs(dT1 - dT2) < 0.01:
        return dT1
    import math
    return (dT1 - dT2) / math.log(dT1 / dT2)


def build_hip_table(s12, s17a, Q_total_hip, flow_hx_hip, hip_bypass_flow,
                    hip_hot_inlet, stream13_temp, cip_cold_feed,
                    stream18B_temp, stream18D_temp, stream18E_temp, stream19_temp):
    Q_total_cold = s17a.get('TOTAL', 91588)
    cold_hx_frac = flow_hx_hip / Q_total_hip if Q_total_hip > 0 else 1
    cold_byp_frac = 1 - cold_hx_frac
    rows = []
    for comp in COMPONENTS:
        c12 = s12.get(comp, 0)
        c17a = s17a.get(comp, 0)
        c_cold_hx = round(c17a * cold_hx_frac)
        c_cold_byp = round(c17a * cold_byp_frac)
        rows.append({
            "parameter": comp, "units": "scfm",
            "s12": fmt(c12), "s13": fmt(c12),
            "s18A": fmt(c17a), "s18B": fmt(c_cold_hx),
            "s18C": fmt(c_cold_byp), "s18D": fmt(c17a),
            "s18E": fmt(c_cold_hx), "s19": fmt(c12),
        })
    rows.append({
        "parameter": "TOTAL", "units": "scfm",
        "s12": f"{Q_total_hip:,.0f}", "s13": f"{Q_total_hip:,.0f}",
        "s18A": f"{Q_total_cold:,.0f}", "s18B": f"{flow_hx_hip:,.0f}",
        "s18C": f"{round(hip_bypass_flow):,}", "s18D": f"{Q_total_cold:,.0f}",
        "s18E": f"{flow_hx_hip:,.0f}", "s19": f"{Q_total_hip:,.0f}",
    })
    rows.append({
        "parameter": "PRESSURE", "units": "in. wc.",
        "s12": fmt(s12.get('PRESSURE', 119)), "s13": "115",
        "s18A": fmt(s17a.get('PRESSURE', 113)), "s18B": "113",
        "s18C": "113", "s18D": "113", "s18E": "115", "s19": "113",
    })
    rows.append({
        "parameter": "TEMPERATURE", "units": "\u00b0F",
        "s12": f"{hip_hot_inlet:.1f}", "s13": f"{stream13_temp:.1f}",
        "s18A": f"{cip_cold_feed:.1f}", "s18B": f"{stream18B_temp:.1f}",
        "s18C": f"{cip_cold_feed:.1f}", "s18D": f"{stream18D_temp:.1f}",
        "s18E": f"{stream18E_temp:.1f}", "s19": f"{stream19_temp:.1f}",
    })
    return rows


def build_cip_table(s14, s17a, Q_total_cip, flow_hx_cip, cip_bypass_flow,
                    cip_hot_inlet, stream15_temp, cip_cold_feed,
                    stream17B_temp, stream17E_temp, stream18_temp):
    Q_total_cold = s17a.get('TOTAL', 91588)
    cold_hx_frac = flow_hx_cip / Q_total_cip if Q_total_cip > 0 else 1
    cold_byp_frac = 1 - cold_hx_frac
    byp_36_frac = 0.4
    byp_78_frac = 0.6
    rows = []
    for comp in COMPONENTS:
        c14 = s14.get(comp, 0)
        c17a = s17a.get(comp, 0)
        c_cold_hx = round(c17a * cold_hx_frac)
        c_cold_byp_36 = round(c17a * cold_byp_frac * byp_36_frac)
        c_cold_byp_78 = round(c17a * cold_byp_frac * byp_78_frac)
        rows.append({
            "parameter": comp, "units": "scfm",
            "s14": fmt(c14), "s15": fmt(c14),
            "s17A": fmt(c17a), "s17B": fmt(c_cold_hx),
            "s17C": fmt(c_cold_byp_36), "s17D": fmt(c_cold_byp_78),
            "s17E": fmt(c_cold_hx), "s18": fmt(c14),
        })
    rows.append({
        "parameter": "TOTAL", "units": "scfm",
        "s14": f"{Q_total_cip:,.0f}", "s15": f"{Q_total_cip:,.0f}",
        "s17A": f"{Q_total_cold:,.0f}", "s17B": f"{flow_hx_cip:,.0f}",
        "s17C": f"{round(cip_bypass_flow * byp_36_frac):,}",
        "s17D": f"{round(cip_bypass_flow * byp_78_frac):,}",
        "s17E": f"{flow_hx_cip:,.0f}", "s18": f"{Q_total_cip:,.0f}",
    })
    rows.append({
        "parameter": "PRESSURE", "units": "in. wc.",
        "s14": fmt(s14.get('PRESSURE', 113)), "s15": "109",
        "s17A": fmt(s17a.get('PRESSURE', 113)), "s17B": "113",
        "s17C": "113", "s17D": "113", "s17E": "111", "s18": "109",
    })
    rows.append({
        "parameter": "TEMPERATURE", "units": "\u00b0F",
        "s14": f"{cip_hot_inlet:.1f}", "s15": f"{stream15_temp:.1f}",
        "s17A": f"{cip_cold_feed:.1f}", "s17B": f"{stream17B_temp:.1f}",
        "s17C": f"{cip_cold_feed:.1f}", "s17D": f"{cip_cold_feed:.1f}",
        "s17E": f"{stream17E_temp:.1f}", "s18": f"{stream18_temp:.1f}",
    })
    return rows


def calculate_static(params):
    hip_hot_inlet = safe_float(params.get('hip_hot_inlet'), 965)
    cip_hot_inlet = safe_float(params.get('cip_hot_inlet'), 847)
    cip_cold_feed = safe_float(params.get('cip_cold_feed'), 180)
    target_pass3 = safe_float(params.get('target_pass3'), 806)
    target_pass4 = safe_float(params.get('target_pass4'), 779)

    s12_in, s14_in, s17a_in = parse_inlet_streams(params)
    s12 = s12_in if s12_in else INLET_STREAMS_DEFAULT['stream12']
    s14 = s14_in if s14_in else INLET_STREAMS_DEFAULT['stream14']
    s17a = s17a_in if s17a_in else INLET_STREAMS_DEFAULT['stream17A']

    cfg = dict(CONFIG)
    if 'config' in params:
        for k, v in params['config'].items():
            if k in cfg:
                cfg[k] = float(v)

    P_gauge_psig = 113 / 27.7
    P1_psia = cfg['barometric_P_psia'] + P_gauge_psig

    Q_total_hip = s12.get('TOTAL', cfg['Q_design_HIP'])
    flow_hx_hip = solve_flow_hx_for_target(
        Q_total_hip, target_pass3, hip_hot_inlet, cip_cold_feed,
        cfg['Q_design_HIP'], cfg['dP_design_psi']
    )
    cv_req_hip = cv_from_flow(
        flow_hx_hip, Q_total_hip, cfg['Q_design_HIP'],
        cfg['dP_design_psi'], P1_psia, hip_hot_inlet + 460
    )
    pos_hip = solve_position(cv_req_hip, cfg['HIP_Cv_max_48'])
    hip_bypass_flow = Q_total_hip - flow_hx_hip

    stream13_temp = hip_hot_inlet - 50
    stream18B_temp = cip_cold_feed + 20
    stream18D_temp = round((hip_bypass_flow * cip_cold_feed + flow_hx_hip * (cip_cold_feed + 120)) / Q_total_hip, 1) if Q_total_hip > 0 else cip_cold_feed
    stream18E_temp = cip_cold_feed + 120
    stream19_temp = target_pass3

    Q_total_cip = s14.get('TOTAL', cfg['Q_design_CIP'])
    flow_hx_cip = solve_flow_hx_for_target(
        Q_total_cip, target_pass4, cip_hot_inlet, cip_cold_feed,
        cfg['Q_design_CIP'], cfg['dP_design_psi']
    )
    cv_req_cip = cv_from_flow(
        flow_hx_cip, Q_total_cip, cfg['Q_design_CIP'],
        cfg['dP_design_psi'], P1_psia, cip_hot_inlet + 460
    )
    pos_cip = solve_position(cv_req_cip, cfg['CIP_Cv_max_36'], cfg['CIP_Cv_max_78'])
    cip_bypass_flow = Q_total_cip - flow_hx_cip

    stream15_temp = cip_hot_inlet - 68
    stream17B_temp = cip_cold_feed + 10
    stream17E_temp = cip_cold_feed + 140
    stream18_temp = target_pass4

    cip_36_pos = round(min(pos_cip, 50) * 2, 1)
    cip_78_pos = round(max(0, pos_cip - 50) * 2, 1)
    hip_48_pos = round(pos_hip, 1)
    hip_hx_ratio = round(flow_hx_hip / Q_total_hip, 3) if Q_total_hip > 0 else 0
    cip_hx_ratio = round(flow_hx_cip / Q_total_cip, 3) if Q_total_cip > 0 else 0

    duty_hip = round((flow_hx_hip * 60 * 34 / 379 * 0.25 * (hip_hot_inlet - stream13_temp)) / 1_000_000, 2)
    duty_cip = round((flow_hx_cip * 60 * 34 / 379 * 0.25 * (cip_hot_inlet - stream15_temp)) / 1_000_000, 2)

    lmtd_hip = calc_lmtd(hip_hot_inlet, stream13_temp, stream18E_temp, cip_cold_feed)
    lmtd_cip = calc_lmtd(cip_hot_inlet, stream15_temp, stream17E_temp, cip_cold_feed)

    hip_table = build_hip_table(s12, s17a, Q_total_hip, flow_hx_hip, hip_bypass_flow,
                                hip_hot_inlet, stream13_temp, cip_cold_feed,
                                stream18B_temp, stream18D_temp, stream18E_temp, stream19_temp)

    cip_table = build_cip_table(s14, s17a, Q_total_cip, flow_hx_cip, cip_bypass_flow,
                                cip_hot_inlet, stream15_temp, cip_cold_feed,
                                stream17B_temp, stream17E_temp, stream18_temp)

    extras = [
        {"label": "HIP 48\" Valve Position", "units": "% open", "value": f"{hip_48_pos:.1f}"},
        {"label": "CIP 36\" Valve Position", "units": "% open", "value": f"{cip_36_pos:.1f}"},
        {"label": "CIP 78\" Valve Position", "units": "% open", "value": f"{cip_78_pos:.1f}"},
        {"label": "HIP HX / Bypass ratio", "units": "fraction", "value": f"{hip_hx_ratio:.3f}"},
        {"label": "CIP HX / Bypass ratio", "units": "fraction", "value": f"{cip_hx_ratio:.3f}"},
        {"label": "HIP HX Duty", "units": "MMBTU/hr", "value": f"{duty_hip:.2f}"},
        {"label": "CIP HX Duty", "units": "MMBTU/hr", "value": f"{duty_cip:.2f}"},
        {"label": "HIP LMTD", "units": "\u00b0F", "value": f"{lmtd_hip:.1f}"},
        {"label": "CIP LMTD", "units": "\u00b0F", "value": f"{lmtd_cip:.1f}"},
    ]

    return {
        "success": True,
        "hip_table": hip_table,
        "cip_table": cip_table,
        "extras": extras,
    }


def calculate_dynamic(params):
    mA = safe_float(params.get('mA'), 12.0)
    hip_hot_inlet = safe_float(params.get('hip_hot_inlet'), 965)
    cip_hot_inlet = safe_float(params.get('cip_hot_inlet'), 847)
    cip_cold_feed = safe_float(params.get('cip_cold_feed'), 180)
    time_s = safe_float(params.get('time_s'), 0)
    T_out_hip = safe_float(params.get('T_out_hip'), 806.0)
    T_out_cip = safe_float(params.get('T_out_cip'), 779.0)

    s12_in, s14_in, s17a_in = parse_inlet_streams(params)
    s12 = s12_in if s12_in else INLET_STREAMS_DEFAULT['stream12']
    s14 = s14_in if s14_in else INLET_STREAMS_DEFAULT['stream14']
    s17a = s17a_in if s17a_in else INLET_STREAMS_DEFAULT['stream17A']

    dt = 0.5
    tau = 45.0

    pos_cip = max(0, min(100, (mA - 4) / 16 * 100))
    cv_cip = get_Cv(pos_cip, CONFIG['CIP_Cv_max_36'], CONFIG['CIP_Cv_max_78'])
    cv_hip = get_Cv(pos_cip, CONFIG['HIP_Cv_max_48'])

    Q_total_cip = s14.get('TOTAL', CONFIG['Q_design_CIP'])
    Q_total_hip = s12.get('TOTAL', CONFIG['Q_design_HIP'])

    flow_hx_cip = solve_flow_from_cv(cv_cip, Q_total_cip, CONFIG['dP_design_psi'], Q_total_cip)
    flow_hx_hip = solve_flow_from_cv(cv_hip, Q_total_hip, CONFIG['dP_design_psi'], Q_total_hip)

    new_time = time_s + dt
    new_T_out_cip = T_out_cip + (cip_hot_inlet - 68 - T_out_cip) * dt / tau
    new_T_out_hip = T_out_hip + (hip_hot_inlet - 50 - T_out_hip) * dt / tau

    cip_36_pos = min(pos_cip, 50) * 2
    cip_78_pos = max(0, pos_cip - 50) * 2

    hip_48_pos = round(pos_cip, 1)
    hip_bypass = round(Q_total_hip - flow_hx_hip)
    cip_bypass = round(Q_total_cip - flow_hx_cip)
    hip_hx_ratio = round(flow_hx_hip / Q_total_hip, 3) if Q_total_hip > 0 else 0
    cip_hx_ratio = round(flow_hx_cip / Q_total_cip, 3) if Q_total_cip > 0 else 0

    stream13_temp = hip_hot_inlet - 50
    stream15_temp_dyn = new_T_out_cip
    duty_hip = round((flow_hx_hip * 60 * 34 / 379 * 0.25 * (hip_hot_inlet - stream13_temp)) / 1_000_000, 2)
    duty_cip = round((flow_hx_cip * 60 * 34 / 379 * 0.25 * (cip_hot_inlet - stream15_temp_dyn)) / 1_000_000, 2)

    stream18B_temp = cip_cold_feed + 20
    stream18D_temp = round((hip_bypass * cip_cold_feed + flow_hx_hip * (cip_cold_feed + 120)) / Q_total_hip, 1) if Q_total_hip > 0 else cip_cold_feed
    stream18E_temp = cip_cold_feed + 120

    hip_table = build_hip_table(s12, s17a, Q_total_hip, flow_hx_hip, hip_bypass,
                                hip_hot_inlet, stream13_temp, cip_cold_feed,
                                stream18B_temp, stream18D_temp, stream18E_temp, new_T_out_hip)

    stream17B_temp = cip_cold_feed + 10
    stream17E_temp = cip_cold_feed + 140

    cip_table = build_cip_table(s14, s17a, Q_total_cip, flow_hx_cip, cip_bypass,
                                cip_hot_inlet, new_T_out_cip, cip_cold_feed,
                                stream17B_temp, stream17E_temp, new_T_out_cip)

    lmtd_hip = calc_lmtd(hip_hot_inlet, stream13_temp, stream18E_temp, cip_cold_feed)
    lmtd_cip = calc_lmtd(cip_hot_inlet, new_T_out_cip, stream17E_temp, cip_cold_feed)

    extras = [
        {"label": "HIP 48\" Valve Position", "units": "% open", "value": f"{hip_48_pos:.1f}"},
        {"label": "CIP 36\" Valve Position", "units": "% open", "value": f"{round(cip_36_pos, 1):.1f}"},
        {"label": "CIP 78\" Valve Position", "units": "% open", "value": f"{round(cip_78_pos, 1):.1f}"},
        {"label": "HIP HX / Bypass ratio", "units": "fraction", "value": f"{hip_hx_ratio:.3f}"},
        {"label": "CIP HX / Bypass ratio", "units": "fraction", "value": f"{cip_hx_ratio:.3f}"},
        {"label": "HIP HX Duty", "units": "MMBTU/hr", "value": f"{duty_hip:.2f}"},
        {"label": "CIP HX Duty", "units": "MMBTU/hr", "value": f"{duty_cip:.2f}"},
        {"label": "HIP LMTD", "units": "\u00b0F", "value": f"{lmtd_hip:.1f}"},
        {"label": "CIP LMTD", "units": "\u00b0F", "value": f"{lmtd_cip:.1f}"},
    ]

    return {
        "success": True,
        "time_s": round(new_time, 1),
        "mA": round(mA, 2),
        "T_out_cip": round(new_T_out_cip, 1),
        "T_out_hip": round(new_T_out_hip, 1),
        "hip_table": hip_table,
        "cip_table": cip_table,
        "extras": extras,
    }


def solve_flow_from_cv(cv, Q_total, dP_design, Q_design):
    if cv <= 0:
        return 0
    flow_hx = Q_total * 0.6
    for _ in range(200):
        flow_byp = Q_total - flow_hx
        if flow_byp <= 0:
            flow_hx = Q_total * 0.99
            continue
        dP_hx = dP_design * (flow_hx / Q_design) ** CONFIG['power_dP']
        dP_valve = (flow_byp * 60 / (1360 * max(cv, 1))) ** 2 * (1.2 * 760 / 14.7)
        error = dP_hx - dP_valve
        if abs(error) < 0.001:
            break
        flow_hx -= error * Q_total * 0.001
        flow_hx = max(0, min(Q_total, flow_hx))
    return flow_hx


if __name__ == '__main__':
    try:
        input_data = json.loads(sys.stdin.read())
        mode = input_data.get('mode', 'static')

        if mode == 'static':
            result = calculate_static(input_data)
        elif mode == 'dynamic':
            result = calculate_dynamic(input_data)
        else:
            result = {"success": False, "error": f"Unknown mode: {mode}"}

        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
