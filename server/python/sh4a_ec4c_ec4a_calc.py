"""
sh4a_ec4c_ec4a_calculator.py
HP Superheater 4A / Economizer 4C / Economizer 4A
Equipment: 1540-HX-004 / 006 / 007

CONTROL LOGIC
  SH4A Control Valve (TCV-7221):
    Target = SH1B Steam Outlet Temperature (user setpoint)
    Mechanism: Total superheat = SH4A duty + SH1B duty
               SH1B duty is a user input (MMBTU/hr).
               SH4A must deliver the remaining duty so that:
                 T_sh1b_out = T_sh4a_steam_in + (Q_sh4a + Q_sh1b) / (Fs * Cp_sh)
               The CV modulates SH4A steam flow until SH1B outlet temp = setpoint.

  EC4A Control Valve (TCV-7221 / FIT-7221):
    Target = Process Gas Outlet Temperature from EC4A (FAT Inlet / Stream 23)
    Mechanism: Steam flow through EC4A is varied until gas outlet = setpoint.

STATIC MODE:  Steady-state solution (bisection solver, tolerances ~0.1 F).
DYNAMIC MODE: Adds first-order lag on valve position and dead-time on PV.
              Returns time-domain arrays in results["dynamic"].

RATING CORRELATIONS
  U_rated = U0 * (F_gas / F_gas_design)^0.6
  dP_rated = dP0 * factor * (F / F_design)^2

VALVE: Equal-pct Cv(x)=Cv_max/R^(1-x); PID: 4-20 mA
Units: lb/hr, F, PSIG/inWC, ft2, MMBTU/hr
"""

import math
import json
import sys

GAS_DESIGN_FLOW_SCFM = 90_896.0
GAS_MOL_WT           = 29.2
GAS_CP               = 0.245
STEAM_CP_SH          = 0.55
STEAM_CP_BFW         = 1.10

SH_DESIGN_FLOW   = 269_418.0
EC4C_DESIGN_FLOW = 264_418.0
EC4A_DESIGN_FLOW = 264_418.0

SG_WATER = 1.0


def scfm_to_lbhr(scfm, mw=GAS_MOL_WT):
    return scfm * (mw / 379.0) * 60.0


def lmtd_cc(Th_in, Th_out, Tc_in, Tc_out):
    dT1 = max(Th_in  - Tc_out, 0.01)
    dT2 = max(Th_out - Tc_in,  0.01)
    return dT1 if abs(dT1 - dT2) < 1e-9 else (dT1 - dT2) / math.log(dT1 / dT2)


def rate_U(U0, F, Fd, exp=0.6):
    return U0 if Fd <= 0 else U0 * (F / Fd) ** exp


def rate_dP(dp0, F, Fd, fac=1.0):
    return dp0 if Fd <= 0 else dp0 * fac * (F / Fd) ** 2


def cv_from_pos(pos, cv_max, R, char):
    x = max(0.0, min(1.0, pos))
    if char.strip().lower().startswith("equal"):
        return cv_max / (max(R, 2.0) ** (1.0 - x))
    return cv_max * x


def flow_thru_valve(cv, dp, sg=SG_WATER):
    return cv * math.sqrt(dp / sg) * 500.0 if dp > 0 and cv > 0 else 0.0


def invert_cv(flow, dp, cv_max, R, char, sg=SG_WATER):
    if dp <= 0 or cv_max <= 0:
        return 0.5, 0.0
    cv_r = min(flow / (500.0 * math.sqrt(max(dp, 0.001) / sg)), cv_max)
    if char.strip().lower().startswith("equal"):
        R_ = max(R, 2.0)
        pos = 1.0 + math.log(max(cv_r / cv_max, 1.0 / R_)) / math.log(R_)
    else:
        pos = cv_r / cv_max
    return max(0.0, min(1.0, pos)), cv_r


def pid_ma(pos):
    return 4.0 + pos * 16.0


def hx_solve(U, A, Fg, cpg, Tg_in, Fs, cps, Ts_in):
    if Fg <= 0 or Fs <= 0:
        raise ValueError("hx_solve: all flows must be > 0")
    Cg = Fg * cpg
    Cs = Fs * cps
    UA = U * A
    Cmin = min(Cg, Cs)
    Cmax = max(Cg, Cs)
    R   = Cmin / Cmax
    NTU = UA / Cmin
    if abs(R - 1) < 1e-9:
        eff = NTU / (1 + NTU)
    else:
        ex  = math.exp(-NTU * (1 - R))
        eff = (1 - ex) / (1 - R * ex)
    Q      = eff * Cmin * abs(Tg_in - Ts_in)
    Tg_out = Tg_in - Q / Cg
    Ts_out = Ts_in + Q / Cs
    lmtd   = lmtd_cc(Tg_in, Tg_out, Ts_in, Ts_out)
    return dict(duty=Q / 1e6, Q_btu=Q, gas_out_temp=Tg_out,
                steam_out_temp=Ts_out, lmtd=lmtd, UA=UA)


def cv_bisect(setpt, eval_fn,
              Fnom, cv_max, cv_R, cv_char, cv_dp, sg,
              niter=300, tol=0.10):
    max_F = flow_thru_valve(cv_max, cv_dp, sg)
    fl = max(Fnom * 0.01, 1.0)
    fh = min(Fnom * 4.0, max(max_F, Fnom * 2.0))
    Tl = eval_fn(fl)
    Th = eval_fn(fh)
    ok   = False
    fsol = Fnom

    if (Tl - setpt) * (Th - setpt) < 0:
        for _ in range(niter):
            fm = (fl + fh) / 2.0
            Tm = eval_fn(fm)
            if abs(Tm - setpt) <= tol:
                fsol = fm
                ok   = True
                break
            if (Tl - setpt) * (Tm - setpt) < 0:
                fh, Th = fm, Tm
            else:
                fl, Tl = fm, Tm
        if not ok:
            fsol = (fl + fh) / 2.0
    else:
        fsol = fl if abs(Tl - setpt) < abs(Th - setpt) else fh

    pos, cv_r = invert_cv(fsol, cv_dp, cv_max, cv_R, cv_char, sg)
    cv_a  = cv_from_pos(pos, cv_max, cv_R, cv_char)
    dp_a  = ((fsol / (500.0 * cv_a)) ** 2) * sg if cv_a > 0 and fsol > 0 else cv_dp
    return dict(pos=pos, cv_req=cv_r, dp_actual=dp_a, flow=fsol, ok=ok)


def gas_stream(label, tag, comps, P_inwc, T_f):
    return dict(label=label, tag=tag, kind="gas",
                SO2=comps.get("SO2", 0), SO3=comps.get("SO3", 0),
                O2=comps.get("O2", 0),   N2=comps.get("N2", 0),
                H2O=comps.get("H2O", 0), H2SO4=comps.get("H2SO4", 0),
                TOTAL=sum(comps.values()), PRESSURE=P_inwc, TEMPERATURE=T_f)


def stm_stream(label, tag, flow, P_psig, T_f):
    return dict(label=label, tag=tag, kind="steam",
                FLOW=flow, PRESSURE=P_psig, TEMPERATURE=T_f)


def run(inp):
    comps    = {k: float(inp[f"gas_{k}"]) for k in ("SO2","SO3","O2","N2","H2O","H2SO4")}
    Fg_scfm  = sum(comps.values())
    Fg       = scfm_to_lbhr(Fg_scfm)
    Tg0      = float(inp["gas_temp"])
    Pg0      = float(inp["gas_pressure"])
    Fd       = scfm_to_lbhr(GAS_DESIGN_FLOW_SCFM)

    Fs_sh_nom  = float(inp["sh_steam_flow"])
    Ts_sh      = float(inp["sh_steam_temp"])
    Ps_sh      = float(inp["sh_steam_press"])

    Fs_ec4c    = float(inp["ec4c_steam_flow"])
    Ts_ec4c    = float(inp["ec4c_steam_temp"])
    Ps_ec4c    = float(inp["ec4c_steam_press"])

    Fs_ec4a_nom = float(inp["ec4a_steam_flow"])
    Ts_ec4a     = float(inp["ec4a_steam_temp"])
    Ps_ec4a     = float(inp["ec4a_steam_press"])

    Q_sh1b_mmbtu = float(inp.get("sh1b_duty", 38.6))
    Q_sh1b_btu   = Q_sh1b_mmbtu * 1e6
    sh1b_out_sp  = float(inp.get("sh1b_out_setpt", 900))

    ec4a_gas_sp = float(inp.get("ec4a_cv_setpt", 275))

    sh_U0    = float(inp["sh_uo"])
    sh_A     = float(inp["sh_ht_area"])
    sh_dp0   = float(inp["sh_steam_dp0"])
    sh_dpf   = float(inp["sh_dp_factor"])
    sh_cvmax = float(inp["sh_cv_max"])
    sh_cvR   = float(inp["sh_cv_range"])
    sh_cvch  = str(inp.get("sh_cv_type", "Equal Percentage"))

    ec4c_U0   = float(inp["ec4c_uo"])
    ec4c_A    = float(inp["ec4c_ht_area"])
    ec4c_dp0  = float(inp["ec4c_steam_dp0"])
    ec4c_dpf  = float(inp["ec4c_dp_factor"])
    ec4c_gdp0 = float(inp["ec4c_proc_dp0"])
    ec4c_gdpf = float(inp["ec4c_proc_dpf"])

    ec4a_U0   = float(inp["ec4a_uo"])
    ec4a_A    = float(inp["ec4a_ht_area"])
    ec4a_dp0  = float(inp["ec4a_steam_dp0"])
    ec4a_dpf  = float(inp["ec4a_dp_factor"])
    ec4a_cvmax= float(inp["ec4a_cv_max"])
    ec4a_cvR  = float(inp["ec4a_cv_range"])
    ec4a_cvch = str(inp.get("ec4a_cv_type", "Equal Percentage"))

    sim_mode = str(inp.get("sim_mode", "static")).lower()

    U_sh   = rate_U(sh_U0,   Fg, Fd)
    U_ec4c = rate_U(ec4c_U0, Fg, Fd)
    U_ec4a = rate_U(ec4a_U0, Fg, Fd)

    dP_sh_stm   = rate_dP(sh_dp0,   Fs_sh_nom,  SH_DESIGN_FLOW,   sh_dpf)
    dP_ec4c_stm = rate_dP(ec4c_dp0, Fs_ec4c,    EC4C_DESIGN_FLOW, ec4c_dpf)
    dP_ec4a_stm = rate_dP(ec4a_dp0, Fs_ec4a_nom,EC4A_DESIGN_FLOW, ec4a_dpf)

    dP_sh_gas   = rate_dP(11.0,       Fg, Fd, sh_dpf)
    dP_ec4c_gas = rate_dP(ec4c_gdp0,  Fg, Fd, ec4c_gdpf)
    dP_ec4a_gas = rate_dP(11.0,       Fg, Fd, ec4a_dpf)

    def sh4a_eval(Fs):
        r = hx_solve(U_sh, sh_A, Fg, GAS_CP, Tg0, Fs, STEAM_CP_SH, Ts_sh)
        Ts_sh4a_out = r["steam_out_temp"]
        Ts_sh1b_out = Ts_sh4a_out + Q_sh1b_btu / (Fs * STEAM_CP_SH)
        return Ts_sh1b_out

    sh_cv = cv_bisect(sh1b_out_sp, sh4a_eval,
                      Fs_sh_nom, sh_cvmax, sh_cvR, sh_cvch, dP_sh_stm, SG_WATER)

    Fs_sh_act = sh_cv["flow"]
    sh_hx     = hx_solve(U_sh, sh_A, Fg, GAS_CP, Tg0, Fs_sh_act, STEAM_CP_SH, Ts_sh)

    Ts_sh4a_out = sh_hx["steam_out_temp"]
    Ts_sh1b_out = Ts_sh4a_out + Q_sh1b_btu / (Fs_sh_act * STEAM_CP_SH)

    Tg1         = sh_hx["gas_out_temp"]
    Pg1         = Pg0 - dP_sh_gas
    Ps_sh_out   = Ps_sh - dP_sh_stm
    dP_sh_cv    = sh_cv["dp_actual"]

    sh_res = dict(
        duty            = sh_hx["duty"],
        gas_out_temp    = Tg1,
        steam_out_temp  = Ts_sh4a_out,
        sh1b_out_temp   = Ts_sh1b_out,
        sh1b_duty       = Q_sh1b_mmbtu,
        total_sh_duty   = sh_hx["duty"] + Q_sh1b_mmbtu,
        lmtd            = sh_hx["lmtd"],
        UA              = sh_hx["UA"],
        uo_rated        = U_sh,
        gas_dp          = dP_sh_gas,
        steam_dp        = dP_sh_stm,
        valve_pos       = sh_cv["pos"]  * 100.0,
        pid_output      = pid_ma(sh_cv["pos"]),
        cv_required     = sh_cv["cv_req"],
        valve_dp        = dP_sh_cv,
        steam_flow      = Fs_sh_act,
    )

    ec4c_hx = hx_solve(U_ec4c, ec4c_A, Fg, GAS_CP, Tg1,
                       Fs_ec4c, STEAM_CP_BFW, Ts_ec4c)
    Tg2         = ec4c_hx["gas_out_temp"]
    Pg2         = Pg1 - dP_ec4c_gas
    Ps_ec4c_out = Ps_ec4c - dP_ec4c_stm
    Ts_ec4c_out = ec4c_hx["steam_out_temp"]

    ec4c_res = dict(
        duty            = ec4c_hx["duty"],
        gas_out_temp    = Tg2,
        steam_out_temp  = Ts_ec4c_out,
        lmtd            = ec4c_hx["lmtd"],
        UA              = ec4c_hx["UA"],
        uo_rated        = U_ec4c,
        gas_dp          = dP_ec4c_gas,
        steam_dp        = dP_ec4c_stm,
        steam_flow      = Fs_ec4c,
    )

    def ec4a_eval(Fs):
        r = hx_solve(U_ec4a, ec4a_A, Fg, GAS_CP, Tg2, Fs, STEAM_CP_BFW, Ts_ec4a)
        return r["gas_out_temp"]

    ec4a_cv = cv_bisect(ec4a_gas_sp, ec4a_eval,
                        Fs_ec4a_nom, ec4a_cvmax, ec4a_cvR, ec4a_cvch,
                        dP_ec4a_stm, SG_WATER)

    Fs_ec4a_act  = ec4a_cv["flow"]
    ec4a_hx      = hx_solve(U_ec4a, ec4a_A, Fg, GAS_CP, Tg2,
                             Fs_ec4a_act, STEAM_CP_BFW, Ts_ec4a)

    Tg3          = ec4a_hx["gas_out_temp"]
    Pg3          = Pg2 - dP_ec4a_gas
    dP_ec4a_cv   = ec4a_cv["dp_actual"]
    Ps_ec4a_cv   = Ps_ec4a - dP_ec4a_cv
    Ps_ec4a_out  = Ps_ec4a_cv - dP_ec4a_stm
    Ts_ec4a_out  = ec4a_hx["steam_out_temp"]

    Fs_803d = max(0.0, Fs_ec4a_nom - Fs_ec4a_act)
    Fs_808  = Fs_803d

    ec4a_res = dict(
        duty            = ec4a_hx["duty"],
        gas_out_temp    = Tg3,
        steam_out_temp  = Ts_ec4a_out,
        lmtd            = ec4a_hx["lmtd"],
        UA              = ec4a_hx["UA"],
        uo_rated        = U_ec4a,
        gas_dp          = dP_ec4a_gas,
        steam_dp        = dP_ec4a_stm,
        valve_pos       = ec4a_cv["pos"]  * 100.0,
        pid_output      = pid_ma(ec4a_cv["pos"]),
        cv_required     = ec4a_cv["cv_req"],
        valve_dp        = dP_ec4a_cv,
        steam_flow      = Fs_ec4a_act,
    )

    s20    = gas_stream("Stream #20 - SH4A Inlet",    "GSA0", comps, Pg0, Tg0)
    s21    = gas_stream("Stream #21 - Econ 4C Inlet", "GEC0", comps, Pg1, Tg1)
    s22    = gas_stream("Stream #22 - Econ 4A Inlet", "GEA0", comps, Pg2, Tg2)
    s23    = gas_stream("Stream #23 - FAT Inlet",     "GF0",  comps, Pg3, Tg3)

    s806   = stm_stream("Stream #806 - SH4A Steam Inlet (SSA0, CV)",
                        "SSA0", Fs_sh_act, Ps_sh, Ts_sh)
    s807   = stm_stream("Stream #807 - SH4A Steam Out -> SH1B",
                        "SSA_OUT", Fs_sh_act, Ps_sh_out, Ts_sh4a_out)
    s807b  = stm_stream("Stream #807B - SH1B Steam Outlet (-> TG)",
                        "SH1B_OUT", Fs_sh_act, Ps_sh_out, Ts_sh1b_out)

    s805   = stm_stream("Stream #805 - Econ 4C BFW Inlet (SEC0)",
                        "SEC0", Fs_ec4c, Ps_ec4c, Ts_ec4c)
    s805out= stm_stream("Stream #805 OUT - Econ 4C Steam Outlet",
                        "SEC_OUT", Fs_ec4c, Ps_ec4c_out, Ts_ec4c_out)

    s803A  = stm_stream("Stream #803A - EC4A BFW Inlet (SEA0)",
                        "SEA0", Fs_ec4a_nom, Ps_ec4a, Ts_ec4a)
    s803B  = stm_stream("Stream #803B - After FE/FIT-7221",
                        "SEA0", Fs_ec4a_nom, Ps_ec4a, Ts_ec4a)
    s803C  = stm_stream("Stream #803C - After TCV-7221 / Boiler Mixer (GB0)",
                        "GB0", Fs_ec4a_act, Ps_ec4a_cv, Ts_ec4a)
    s803D  = stm_stream("Stream #803D - Split to Boiler (SEB0)",
                        "SEB0", Fs_803d, Ps_ec4a, Ts_ec4a)
    s803E  = stm_stream("Stream #803E - EC4A Steam Outlet / TI-42220ABC (GF1)",
                        "GF1", Fs_ec4a_act, Ps_ec4a_out, Ts_ec4a_out)
    s804   = stm_stream("Stream #804 - Furnace Outlet / TI-42220ABC (GF1)",
                        "GF1", Fs_ec4a_act, Ps_ec4a_out, Ts_ec4a_out)
    s806w  = stm_stream("Stream #806 - WHB In (GB0, header ref.)",
                        "GB0", Fs_ec4a_nom, Ps_ec4a, Ts_ec4a)
    s808   = stm_stream("Stream #808 - Jug Valve Inlet (GJV0)",
                        "GJV0", Fs_808, Ps_ec4a - dP_ec4a_cv, Ts_ec4a)

    streams = dict(
        s20=s20, s21=s21, s22=s22, s23=s23,
        s803A=s803A, s803B=s803B, s803C=s803C, s803D=s803D,
        s803E=s803E, s804=s804,
        s805=s805, s805out=s805out,
        s806=s806, s806w=s806w,
        s807=s807, s807b=s807b,
        s808=s808,
    )

    summary = dict(
        total_duty      = sh_res["duty"] + Q_sh1b_mmbtu + ec4c_res["duty"] + ec4a_res["duty"],
        total_sh_duty   = sh_res["duty"] + Q_sh1b_mmbtu,
        gas_flow        = Fg,
        gas_T_in        = Tg0,
        gas_T_out       = Tg3,
        sh_stm_flow     = Fs_sh_act,
        sh1b_out_temp   = Ts_sh1b_out,
        sh1b_duty       = Q_sh1b_mmbtu,
        ec4c_stm_flow   = Fs_ec4c,
        ec4a_stm_flow   = Fs_ec4a_act,
    )

    result = dict(sh=sh_res, ec4c=ec4c_res, ec4a=ec4a_res,
                  streams=streams, summary=summary)

    if sim_mode == "dynamic":
        result["dynamic"] = _dynamic_sim(sh_res, ec4c_res, ec4a_res, inp)

    return result


def _dynamic_sim(sh_res, ec4c_res, ec4a_res, inp):
    tau_v  = float(inp.get("dyn_tau_valve",  30.0))
    tau_p  = float(inp.get("dyn_tau_proc",  120.0))
    dead   = float(inp.get("dyn_dead_time",  30.0))
    dt     = float(inp.get("dyn_dt",          5.0))
    t_end  = float(inp.get("dyn_t_end",     600.0))

    steps  = int(t_end / dt) + 1
    delay_steps = max(1, int(dead / dt))

    def first_order(y_prev, u, tau, dt_):
        return y_prev + (dt_ / tau) * (u - y_prev)

    sh_sp  = float(inp.get("sh1b_out_setpt", 900))
    sh_ic  = sh_res["sh1b_out_temp"]
    sh_cv_ic = sh_res["valve_pos"] / 100.0

    ec4a_sp = float(inp.get("ec4a_cv_setpt", 275))
    ec4a_ic = ec4a_res["gas_out_temp"]
    ec4a_cv_ic = ec4a_res["valve_pos"] / 100.0

    t_arr     = []
    sh_T_arr  = []
    ec4a_T_arr= []
    sh_cv_arr = []
    ec4a_cv_arr = []

    sh_valve  = sh_cv_ic
    ec4a_valve= ec4a_cv_ic
    sh_T      = sh_ic
    ec4a_T    = ec4a_ic
    sh_buf    = [sh_ic] * delay_steps
    ec4a_buf  = [ec4a_ic] * delay_steps

    for i in range(steps):
        t = i * dt
        sh_err   = (sh_sp   - sh_buf[-1])  / max(abs(sh_sp),   1)
        ec4a_err = (ec4a_sp - ec4a_buf[-1]) / max(abs(ec4a_sp), 1)
        sh_valve_sp   = max(0.0, min(1.0, sh_cv_ic   + sh_err))
        ec4a_valve_sp = max(0.0, min(1.0, ec4a_cv_ic + ec4a_err))

        sh_valve   = first_order(sh_valve,   sh_valve_sp,   tau_v, dt)
        ec4a_valve = first_order(ec4a_valve, ec4a_valve_sp, tau_v, dt)

        sh_T    = first_order(sh_T,   sh_sp,   tau_p, dt)
        ec4a_T  = first_order(ec4a_T, ec4a_sp, tau_p, dt)

        sh_buf.append(sh_T)
        ec4a_buf.append(ec4a_T)
        sh_buf   = sh_buf[-delay_steps:]
        ec4a_buf = ec4a_buf[-delay_steps:]

        t_arr.append(t)
        sh_T_arr.append(sh_T)
        ec4a_T_arr.append(ec4a_T)
        sh_cv_arr.append(sh_valve * 100.0)
        ec4a_cv_arr.append(ec4a_valve * 100.0)

    return dict(
        t=t_arr,
        sh1b_out_temp=sh_T_arr,
        ec4a_gas_out=ec4a_T_arr,
        sh_valve_pos=sh_cv_arr,
        ec4a_valve_pos=ec4a_cv_arr,
        sh_setpt=[sh_sp] * steps,
        ec4a_setpt=[ec4a_sp] * steps,
    )


if __name__ == "__main__":
    try:
        input_data = json.loads(sys.stdin.read() or "{}")
        result = run(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
