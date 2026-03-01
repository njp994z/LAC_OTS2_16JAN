"""
sh4a_ec4c_ec4a_calc.py
HP Superheater 4A / Economizer 4C / Economizer 4A
Equipment: 1540-HX-004 / 006 / 007

PROCESS FLOW (counter-current gas -> steam):
  Process Gas (hot side) ->  SH4A  ->  EC4C  ->  EC4A  -> Gas Outlet

STEAM CIRCUITS (each independent; counter-current to gas):
  SH4A  : Steam enters from bottom, exits to Turbo-Generator
           Control Valve (CV-803) on steam inlet - manipulated to hold
           SH4A steam OUTLET temperature (proxy for TG inlet temperature).
  EC4C  : No control valve - fixed steam flow / temperature.
  EC4A  : Steam enters from bottom
           Control Valve (CV-805) on steam inlet - manipulated to hold
           Process Gas OUTLET temperature (exit of EC4A).

RATING CORRELATIONS
  U_rated = U0 x (F_gas / F_gas_design)^0.6
  dP_rated = dP0 x (F / F_design)^2 x rating_factor

VALVE MODEL (equal-percentage or linear)
  Equal-percentage:  Cv(x) = Cv_max / R^(1-x)     x in [0,1]
  Linear:            Cv(x) = Cv_max x x

HEAT EXCHANGER MODEL
  Counter-current LMTD with standard Q = U*A*LMTD energy balance.
  NTU-effectiveness method for solution.

Units
  Flow    : lb/hr
  Temperature : F
  Pressure    : PSIG (steam), in WC (process gas)
  Heat area   : ft2
  Duty        : MMBTU/hr
"""

import math
import json
import sys

GAS_DESIGN_FLOW_SCFM = 90_896.0
GAS_MOL_WT           = 29.2
GAS_CP               = 0.245
GAS_DENSITY_STD      = 0.0765
STEAM_CP_SUPERHEAT   = 0.55
STEAM_CP_SUBCOOL     = 1.10
WATER_LATENT         = 970.0

SH_STEAM_DESIGN    = 269_418.0
EC4C_STEAM_DESIGN  = 264_418.0
EC4A_STEAM_DESIGN  = 264_418.0

SPECIFIC_GRAVITY_WATER = 1.0
FT_PER_PSI             = 2.3097
PUMP_HEAD_FRICTION_FT  = 0.906
VALVE_INLET_P_PSIG     = 178.55


def scfm_to_lbhr(scfm, mol_wt=GAS_MOL_WT):
    lb_per_scf = mol_wt / 379.0
    return scfm * lb_per_scf * 60.0


def lmtd_counter(T_hot_in, T_hot_out, T_cold_in, T_cold_out):
    dT1 = T_hot_in  - T_cold_out
    dT2 = T_hot_out - T_cold_in
    if dT1 <= 0 or dT2 <= 0:
        raise ValueError(
            f"Non-positive dT in LMTD calc: dT1={dT1:.1f}, dT2={dT2:.1f}. "
            "Check temperatures - hot side must be above cold side at each end.")
    if abs(dT1 - dT2) < 1e-6:
        return dT1
    return (dT1 - dT2) / math.log(dT1 / dT2)


def rate_uo(uo0, flow, design_flow, exponent=0.6):
    if design_flow <= 0:
        return uo0
    return uo0 * (flow / design_flow) ** exponent


def rate_dp(dp0, flow, design_flow, factor=1.0):
    if design_flow <= 0:
        return dp0
    return dp0 * factor * (flow / design_flow) ** 2


def valve_cv(position, cv_max, rangeability, characteristic="Equal Percentage"):
    x = max(0.0, min(1.0, position))
    if characteristic.strip().lower().startswith("equal"):
        if rangeability <= 1:
            rangeability = 50.0
        return cv_max / (rangeability ** (1.0 - x))
    else:
        return cv_max * x


def valve_flow_lbhr(cv, delta_p_psi, sg=SPECIFIC_GRAVITY_WATER):
    if delta_p_psi <= 0:
        return 0.0
    gpm = cv * math.sqrt(delta_p_psi / sg)
    return gpm * 500.0


def solve_valve_position(target_flow_lbhr, valve_dp_psi, cv_max, rangeability,
                         characteristic, sg=SPECIFIC_GRAVITY_WATER):
    if valve_dp_psi <= 0 or cv_max <= 0:
        return (0.5, 0.0, 0.0)

    cv_req = target_flow_lbhr / (500.0 * math.sqrt(max(valve_dp_psi, 0.01) / sg))
    cv_req = min(cv_req, cv_max)

    if characteristic.strip().lower().startswith("equal"):
        R = max(rangeability, 2.0)
        if cv_req <= 0:
            pos = 0.0
        else:
            ratio = cv_req / cv_max
            ratio = max(ratio, 1.0 / R)
            pos = 1.0 + math.log(ratio) / math.log(R)
    else:
        pos = cv_req / cv_max

    pos = max(0.0, min(1.0, pos))
    return (pos, cv_req, target_flow_lbhr)


def pos_to_ma(position):
    return 4.0 + position * 16.0


def solve_hx(uo, area, gas_flow_lbhr, gas_cp, gas_T_in,
             steam_flow_lbhr, steam_cp, steam_T_in):
    if gas_flow_lbhr <= 0 or steam_flow_lbhr <= 0:
        raise ValueError("Flow rates must be positive.")

    C_gas   = gas_flow_lbhr   * gas_cp
    C_steam = steam_flow_lbhr * steam_cp

    UA = uo * area

    C_min = min(C_gas, C_steam)
    C_max = max(C_gas, C_steam)
    R = C_min / C_max
    NTU = UA / C_min

    if abs(R - 1.0) < 1e-6:
        eff = NTU / (1.0 + NTU)
    else:
        exp_term = math.exp(-NTU * (1.0 - R))
        eff = (1.0 - exp_term) / (1.0 - R * exp_term)

    Q_max = C_min * abs(gas_T_in - steam_T_in)
    Q     = eff * Q_max

    gas_T_out   = gas_T_in   - Q / C_gas
    steam_T_out = steam_T_in + Q / C_steam

    lmtd = lmtd_counter(gas_T_in, gas_T_out, steam_T_in, steam_T_out)

    return {
        "duty":          Q / 1e6,
        "gas_out_temp":  gas_T_out,
        "steam_out_temp":steam_T_out,
        "lmtd":          lmtd,
        "UA":            UA,
    }


def _solve_cv_for_temp_target(
        target_temp, side,
        uo, area,
        gas_flow_lbhr, gas_cp, gas_T_in,
        steam_T_in, steam_cp,
        nominal_flow,
        cv_max, cv_range, cv_char,
        valve_dp_psi, upstream_p_psig, sg,
        max_iter=120, tol=0.5):

    def hx_temp(flow):
        res = solve_hx(uo, area,
                       gas_flow_lbhr, gas_cp, gas_T_in,
                       flow, steam_cp, steam_T_in)
        return res["steam_out_temp"] if side == "steam_out" else res["gas_out_temp"]

    max_cv_flow = valve_flow_lbhr(cv_max, valve_dp_psi, sg)

    f_lo = max(nominal_flow * 0.05, 1.0)
    f_hi = min(nominal_flow * 2.0, max_cv_flow if max_cv_flow > 0 else nominal_flow * 2.0)

    T_lo = hx_temp(f_lo)
    T_hi = hx_temp(f_hi)

    converged = False
    f_solution = nominal_flow

    if (T_lo - target_temp) * (T_hi - target_temp) < 0:
        for _ in range(max_iter):
            f_mid = (f_lo + f_hi) / 2.0
            T_mid = hx_temp(f_mid)
            if abs(T_mid - target_temp) < tol:
                f_solution = f_mid
                converged = True
                break
            if (T_lo - target_temp) * (T_mid - target_temp) < 0:
                f_hi = f_mid
                T_hi = T_mid
            else:
                f_lo = f_mid
                T_lo = T_mid
        if not converged:
            f_solution = (f_lo + f_hi) / 2.0
    else:
        if abs(T_lo - target_temp) < abs(T_hi - target_temp):
            f_solution = f_lo
        else:
            f_solution = f_hi

    pos, cv_req, _ = solve_valve_position(
        f_solution, valve_dp_psi, cv_max, cv_range, cv_char, sg)

    cv_actual = valve_cv(pos, cv_max, cv_range, cv_char)
    if cv_actual > 0 and f_solution > 0:
        valve_dp_actual = ((f_solution / (500.0 * cv_actual)) ** 2) * sg
    else:
        valve_dp_actual = valve_dp_psi

    return {
        "valve_pos":      pos,
        "cv_req":         cv_req,
        "valve_dp":       valve_dp_actual,
        "controlled_flow":f_solution,
        "converged":      converged,
    }


def run(inp):
    gas_total_scfm = (inp["gas_SO2"] + inp["gas_SO3"] + inp["gas_O2"] +
                      inp["gas_N2"] + inp["gas_H2O"] + inp["gas_H2SO4"])
    gas_flow_lbhr  = scfm_to_lbhr(gas_total_scfm)
    gas_T_in       = float(inp["gas_temp"])

    design_gas_lbhr = scfm_to_lbhr(GAS_DESIGN_FLOW_SCFM)

    sh_stm_flow   = float(inp["sh_steam_flow"])
    ec4c_stm_flow = float(inp["ec4c_steam_flow"])
    ec4a_stm_flow = float(inp["ec4a_steam_flow"])

    sh_stm_T_in   = float(inp["sh_steam_temp"])
    ec4c_stm_T_in = float(inp["ec4c_steam_temp"])
    ec4a_stm_T_in = float(inp["ec4a_steam_temp"])

    sh_stm_P      = float(inp["sh_steam_press"])
    ec4c_stm_P    = float(inp["ec4c_steam_press"])
    ec4a_stm_P    = float(inp["ec4a_steam_press"])

    sh_area      = float(inp["sh_ht_area"])
    sh_uo0       = float(inp["sh_uo"])
    sh_dp0       = float(inp["sh_steam_dp0"])
    sh_dpf       = float(inp["sh_dp_factor"])
    sh_cv_max    = float(inp["sh_cv_max"])
    sh_cv_range  = float(inp["sh_cv_range"])
    sh_cv_char   = str(inp.get("sh_cv_type", "Equal Percentage"))
    sh_cv_setpt  = float(inp["sh_cv_setpt"])

    ec4c_area    = float(inp["ec4c_ht_area"])
    ec4c_uo0     = float(inp["ec4c_uo"])
    ec4c_stm_dp0 = float(inp["ec4c_steam_dp0"])
    ec4c_stm_dpf = float(inp["ec4c_dp_factor"])
    ec4c_gas_dp0 = float(inp["ec4c_proc_dp0"])
    ec4c_gas_dpf = float(inp["ec4c_proc_dpf"])

    ec4a_area    = float(inp["ec4a_ht_area"])
    ec4a_uo0     = float(inp["ec4a_uo"])
    ec4a_stm_dp0 = float(inp["ec4a_steam_dp0"])
    ec4a_stm_dpf = float(inp["ec4a_dp_factor"])
    ec4a_cv_max  = float(inp["ec4a_cv_max"])
    ec4a_cv_range= float(inp["ec4a_cv_range"])
    ec4a_cv_char = str(inp.get("ec4a_cv_type", "Equal Percentage"))
    ec4a_cv_setpt= float(inp["ec4a_cv_setpt"])

    sh_uo_rated   = rate_uo(sh_uo0,   gas_flow_lbhr, design_gas_lbhr)
    ec4c_uo_rated = rate_uo(ec4c_uo0, gas_flow_lbhr, design_gas_lbhr)
    ec4a_uo_rated = rate_uo(ec4a_uo0, gas_flow_lbhr, design_gas_lbhr)

    sh_steam_dp   = rate_dp(sh_dp0,   sh_stm_flow,   SH_STEAM_DESIGN,   sh_dpf)
    ec4c_steam_dp = rate_dp(ec4c_stm_dp0, ec4c_stm_flow, EC4C_STEAM_DESIGN, ec4c_stm_dpf)
    ec4a_steam_dp = rate_dp(ec4a_stm_dp0, ec4a_stm_flow, EC4A_STEAM_DESIGN, ec4a_stm_dpf)

    sh_gas_dp   = rate_dp(11.0, gas_flow_lbhr, design_gas_lbhr, sh_dpf)
    ec4c_gas_dp = rate_dp(ec4c_gas_dp0, gas_flow_lbhr, design_gas_lbhr, ec4c_gas_dpf)
    ec4a_gas_dp = rate_dp(11.0, gas_flow_lbhr, design_gas_lbhr, ec4a_stm_dpf)

    sh_cv_result = _solve_cv_for_temp_target(
        target_temp      = sh_cv_setpt,
        side             = "steam_out",
        uo               = sh_uo_rated,
        area             = sh_area,
        gas_flow_lbhr    = gas_flow_lbhr,
        gas_cp           = GAS_CP,
        gas_T_in         = gas_T_in,
        steam_T_in       = sh_stm_T_in,
        steam_cp         = STEAM_CP_SUPERHEAT,
        nominal_flow     = sh_stm_flow,
        cv_max           = sh_cv_max,
        cv_range         = sh_cv_range,
        cv_char          = sh_cv_char,
        valve_dp_psi     = sh_steam_dp,
        upstream_p_psig  = sh_stm_P,
        sg               = SPECIFIC_GRAVITY_WATER,
    )

    sh_result_cv = solve_hx(
        uo          = sh_uo_rated,
        area        = sh_area,
        gas_flow_lbhr   = gas_flow_lbhr,
        gas_cp          = GAS_CP,
        gas_T_in        = gas_T_in,
        steam_flow_lbhr = sh_cv_result["controlled_flow"],
        steam_cp        = STEAM_CP_SUPERHEAT,
        steam_T_in      = sh_stm_T_in,
    )
    sh_result_cv.update({
        "uo_rated":    sh_uo_rated,
        "gas_dp":      sh_gas_dp,
        "steam_dp":    sh_steam_dp,
        "valve_pos":   sh_cv_result["valve_pos"] * 100.0,
        "pid_output":  pos_to_ma(sh_cv_result["valve_pos"]),
        "cv_required": sh_cv_result["cv_req"],
        "valve_dp":    sh_cv_result["valve_dp"],
        "pump_head":   sh_cv_result["valve_dp"] * FT_PER_PSI + PUMP_HEAD_FRICTION_FT,
    })

    gas_T_after_sh = sh_result_cv["gas_out_temp"]

    ec4c_result_raw = solve_hx(
        uo          = ec4c_uo_rated,
        area        = ec4c_area,
        gas_flow_lbhr   = gas_flow_lbhr,
        gas_cp          = GAS_CP,
        gas_T_in        = gas_T_after_sh,
        steam_flow_lbhr = ec4c_stm_flow,
        steam_cp        = STEAM_CP_SUBCOOL,
        steam_T_in      = ec4c_stm_T_in,
    )
    ec4c_result_raw.update({
        "uo_rated":  ec4c_uo_rated,
        "gas_dp":    ec4c_gas_dp,
        "steam_dp":  ec4c_steam_dp,
    })

    gas_T_after_ec4c = ec4c_result_raw["gas_out_temp"]

    ec4a_cv_result = _solve_cv_for_temp_target(
        target_temp      = ec4a_cv_setpt,
        side             = "gas_out",
        uo               = ec4a_uo_rated,
        area             = ec4a_area,
        gas_flow_lbhr    = gas_flow_lbhr,
        gas_cp           = GAS_CP,
        gas_T_in         = gas_T_after_ec4c,
        steam_T_in       = ec4a_stm_T_in,
        steam_cp         = STEAM_CP_SUBCOOL,
        nominal_flow     = ec4a_stm_flow,
        cv_max           = ec4a_cv_max,
        cv_range         = ec4a_cv_range,
        cv_char          = ec4a_cv_char,
        valve_dp_psi     = ec4a_steam_dp,
        upstream_p_psig  = ec4a_stm_P,
        sg               = SPECIFIC_GRAVITY_WATER,
    )

    ec4a_result_cv = solve_hx(
        uo          = ec4a_uo_rated,
        area        = ec4a_area,
        gas_flow_lbhr   = gas_flow_lbhr,
        gas_cp          = GAS_CP,
        gas_T_in        = gas_T_after_ec4c,
        steam_flow_lbhr = ec4a_cv_result["controlled_flow"],
        steam_cp        = STEAM_CP_SUBCOOL,
        steam_T_in      = ec4a_stm_T_in,
    )
    ec4a_result_cv.update({
        "uo_rated":   ec4a_uo_rated,
        "gas_dp":     ec4a_gas_dp,
        "steam_dp":   ec4a_steam_dp,
        "valve_pos":  ec4a_cv_result["valve_pos"] * 100.0,
        "pid_output": pos_to_ma(ec4a_cv_result["valve_pos"]),
        "cv_required":ec4a_cv_result["cv_req"],
        "valve_dp":   ec4a_cv_result["valve_dp"],
        "pump_head":  ec4a_cv_result["valve_dp"] * FT_PER_PSI + PUMP_HEAD_FRICTION_FT,
    })

    return {
        "sh":   sh_result_cv,
        "ec4c": ec4c_result_raw,
        "ec4a": ec4a_result_cv,
    }


if __name__ == "__main__":
    try:
        input_data = json.loads(sys.stdin.read() or "{}")
        result = run(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
