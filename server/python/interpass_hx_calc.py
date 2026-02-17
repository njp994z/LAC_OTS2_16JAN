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


def calculate_static(params):
    hip_hot_inlet = safe_float(params.get('hip_hot_inlet'), 965)
    cip_hot_inlet = safe_float(params.get('cip_hot_inlet'), 847)
    cip_cold_feed = safe_float(params.get('cip_cold_feed'), 180)
    target_pass3 = safe_float(params.get('target_pass3'), 806)
    target_pass4 = safe_float(params.get('target_pass4'), 779)

    cfg = dict(CONFIG)
    if 'config' in params:
        for k, v in params['config'].items():
            if k in cfg:
                cfg[k] = float(v)

    P_gauge_psig = 113 / 27.7
    P1_psia = cfg['barometric_P_psia'] + P_gauge_psig

    Q_total_hip = cfg['Q_design_HIP']
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
    stream18A_temp = cip_cold_feed
    stream18B_temp = cip_cold_feed + 20
    stream18C_flow = round(hip_bypass_flow)
    stream18D_temp = round((hip_bypass_flow * cip_cold_feed + flow_hx_hip * (cip_cold_feed + 120)) / Q_total_hip, 1)
    stream18E_temp = cip_cold_feed + 120
    stream19_temp = target_pass3

    Q_total_cip = cfg['Q_design_CIP']
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
    stream17C_flow = round(cip_bypass_flow * 0.4)
    stream17D_flow = round(cip_bypass_flow * 0.6)
    stream17E_temp = cip_cold_feed + 140
    stream18_temp = target_pass4

    inlet_table = [
        {"parameter": "SO2", "units": "scfm", "stream12": "1,335", "stream14": "480", "stream17A": "480"},
        {"parameter": "SO3", "units": "scfm", "stream12": "11,293", "stream14": "12,148", "stream17A": "0"},
        {"parameter": "O2", "units": "scfm", "stream12": "4,728", "stream14": "4,300", "stream17A": "4,300"},
        {"parameter": "N2", "units": "scfm", "stream12": "86,808", "stream14": "86,808", "stream17A": "86,808"},
        {"parameter": "H2O", "units": "scfm", "stream12": "0", "stream14": "0", "stream17A": "0"},
        {"parameter": "H2SO4", "units": "scfm", "stream12": "0", "stream14": "0", "stream17A": "0"},
        {"parameter": "TOTAL", "units": "scfm", "stream12": "104,164", "stream14": "103,736", "stream17A": "91,588"},
        {"parameter": "PRESSURE", "units": "in. wc.", "stream12": "119", "stream14": "113", "stream17A": "113"},
        {"parameter": "TEMPERATURE", "units": "\u00b0F", "stream12": str(round(hip_hot_inlet)), "stream14": str(round(cip_hot_inlet)), "stream17A": str(round(cip_cold_feed))},
    ]

    cip_36_pos = round(min(pos_cip, 50) * 2, 1)
    cip_78_pos = round(max(0, pos_cip - 50) * 2, 1)
    hip_48_pos = round(pos_hip, 1)
    hip_hx_ratio = round(flow_hx_hip / Q_total_hip, 3) if Q_total_hip > 0 else 0
    cip_hx_ratio = round(flow_hx_cip / Q_total_cip, 3) if Q_total_cip > 0 else 0

    duty_hip = round((flow_hx_hip * 60 * 34 / 379 * 0.25 * (hip_hot_inlet - stream13_temp)) / 1_000_000, 2)
    duty_cip = round((flow_hx_cip * 60 * 34 / 379 * 0.25 * (cip_hot_inlet - stream15_temp)) / 1_000_000, 2)

    hip_table = [
        {"parameter": "TEMPERATURE", "units": "\u00b0F", "s12": f"{hip_hot_inlet:.1f}", "s13": f"{stream13_temp:.1f}", "s18A": f"{stream18A_temp:.1f}", "s18B": f"{stream18B_temp:.1f}", "s18C": f"{cip_cold_feed:.1f}", "s18D": f"{stream18D_temp:.1f}", "s18E": f"{stream18E_temp:.1f}", "s19": f"{stream19_temp:.1f}"},
        {"parameter": "TOTAL FLOW", "units": "scfm", "s12": f"{Q_total_hip:,.0f}", "s13": f"{Q_total_hip:,.0f}", "s18A": f"{Q_total_hip:,.0f}", "s18B": f"{flow_hx_hip:,.0f}", "s18C": f"{stream18C_flow:,}", "s18D": f"{Q_total_hip:,.0f}", "s18E": f"{flow_hx_hip:,.0f}", "s19": f"{Q_total_hip:,.0f}"},
        {"parameter": "PRESSURE", "units": "in. wc.", "s12": "119", "s13": "115", "s18A": "113", "s18B": "113", "s18C": "113", "s18D": "113", "s18E": "115", "s19": "113"},
    ]

    cip_table = [
        {"parameter": "TEMPERATURE", "units": "\u00b0F", "s14": f"{cip_hot_inlet:.1f}", "s15": f"{stream15_temp:.1f}", "s17A": f"{cip_cold_feed:.1f}", "s17B": f"{stream17B_temp:.1f}", "s17C": f"{cip_cold_feed:.1f}", "s17D": f"{cip_cold_feed:.1f}", "s17E": f"{stream17E_temp:.1f}", "s18": f"{stream18_temp:.1f}"},
        {"parameter": "TOTAL FLOW", "units": "scfm", "s14": f"{Q_total_cip:,.0f}", "s15": f"{Q_total_cip:,.0f}", "s17A": f"{Q_total_cip:,.0f}", "s17B": f"{flow_hx_cip:,.0f}", "s17C": f"{round(cip_bypass_flow * 0.4):,}", "s17D": f"{round(cip_bypass_flow * 0.6):,}", "s17E": f"{flow_hx_cip:,.0f}", "s18": f"{Q_total_cip:,.0f}"},
        {"parameter": "PRESSURE", "units": "in. wc.", "s14": "113", "s15": "109", "s17A": "113", "s17B": "113", "s17C": "113", "s17D": "113", "s17E": "111", "s18": "109"},
    ]

    extras = [
        {"label": "HIP 48\" Valve Position", "units": "% open", "value": f"{hip_48_pos:.1f}"},
        {"label": "CIP 36\" Valve Position", "units": "% open", "value": f"{cip_36_pos:.1f}"},
        {"label": "CIP 78\" Valve Position", "units": "% open", "value": f"{cip_78_pos:.1f}"},
        {"label": "HIP HX / Bypass ratio", "units": "fraction", "value": f"{hip_hx_ratio:.3f}"},
        {"label": "CIP HX / Bypass ratio", "units": "fraction", "value": f"{cip_hx_ratio:.3f}"},
        {"label": "HIP HX Duty", "units": "MMBTU/hr", "value": f"{duty_hip:.2f}"},
        {"label": "CIP HX Duty", "units": "MMBTU/hr", "value": f"{duty_cip:.2f}"},
    ]

    return {
        "success": True,
        "inlet_table": inlet_table,
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

    dt = 0.5
    tau = 45.0

    pos_cip = max(0, min(100, (mA - 4) / 16 * 100))
    cv_cip = get_Cv(pos_cip, CONFIG['CIP_Cv_max_36'], CONFIG['CIP_Cv_max_78'])
    cv_hip = get_Cv(pos_cip, CONFIG['HIP_Cv_max_48'])

    Q_total_cip = CONFIG['Q_design_CIP']
    Q_total_hip = CONFIG['Q_design_HIP']

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

    hip_table = [
        {"parameter": "TEMPERATURE", "units": "\u00b0F", "s12": f"{hip_hot_inlet:.1f}", "s13": f"{stream13_temp:.1f}", "s18A": f"{cip_cold_feed:.1f}", "s18B": f"{cip_cold_feed + 20:.1f}", "s18C": f"{cip_cold_feed:.1f}", "s18D": f"{new_T_out_hip:.1f}", "s18E": f"{cip_cold_feed + 120:.1f}", "s19": f"{new_T_out_hip:.1f}"},
        {"parameter": "TOTAL FLOW", "units": "scfm", "s12": f"{Q_total_hip:,.0f}", "s13": f"{Q_total_hip:,.0f}", "s18A": f"{Q_total_hip:,.0f}", "s18B": f"{flow_hx_hip:,.0f}", "s18C": f"{hip_bypass:,}", "s18D": f"{Q_total_hip:,.0f}", "s18E": f"{flow_hx_hip:,.0f}", "s19": f"{Q_total_hip:,.0f}"},
        {"parameter": "PRESSURE", "units": "in. wc.", "s12": "119", "s13": "115", "s18A": "113", "s18B": "113", "s18C": "113", "s18D": "113", "s18E": "115", "s19": "113"},
    ]

    cip_table = [
        {"parameter": "TEMPERATURE", "units": "\u00b0F", "s14": f"{cip_hot_inlet:.1f}", "s15": f"{new_T_out_cip:.1f}", "s17A": f"{cip_cold_feed:.1f}", "s17B": f"{cip_cold_feed + 10:.1f}", "s17C": f"{cip_cold_feed:.1f}", "s17D": f"{cip_cold_feed:.1f}", "s17E": f"{cip_cold_feed + 140:.1f}", "s18": f"{new_T_out_cip:.1f}"},
        {"parameter": "TOTAL FLOW", "units": "scfm", "s14": f"{Q_total_cip:,.0f}", "s15": f"{Q_total_cip:,.0f}", "s17A": f"{Q_total_cip:,.0f}", "s17B": f"{flow_hx_cip:,.0f}", "s17C": f"{round(cip_bypass * 0.4):,}", "s17D": f"{round(cip_bypass * 0.6):,}", "s17E": f"{flow_hx_cip:,.0f}", "s18": f"{Q_total_cip:,.0f}"},
        {"parameter": "PRESSURE", "units": "in. wc.", "s14": "113", "s15": "109", "s17A": "113", "s17B": "113", "s17C": "113", "s17D": "113", "s17E": "111", "s18": "109"},
    ]

    extras = [
        {"label": "HIP 48\" Valve Position", "units": "% open", "value": f"{hip_48_pos:.1f}"},
        {"label": "CIP 36\" Valve Position", "units": "% open", "value": f"{round(cip_36_pos, 1):.1f}"},
        {"label": "CIP 78\" Valve Position", "units": "% open", "value": f"{round(cip_78_pos, 1):.1f}"},
        {"label": "HIP HX / Bypass ratio", "units": "fraction", "value": f"{hip_hx_ratio:.3f}"},
        {"label": "CIP HX / Bypass ratio", "units": "fraction", "value": f"{cip_hx_ratio:.3f}"},
        {"label": "HIP HX Duty", "units": "MMBTU/hr", "value": f"{duty_hip:.2f}"},
        {"label": "CIP HX Duty", "units": "MMBTU/hr", "value": f"{duty_cip:.2f}"},
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
