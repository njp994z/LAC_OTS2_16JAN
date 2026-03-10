"""
ec3b_calc.py
════════════════════════════════════════════════════════════════════════════════
Economizer 3B
Equipment: 1540-HX-002

PROCESS FLOW (counter-current):
  Hot Gas (from CIP)  →  [EC3B]  →  Process Gas IPAT Inlet  (Stream 16 / GEB1)
  Stream 15 (GEB0)  ──────────────────────────────────────────────────>

WATER / BFW CIRCUIT:
  Stream 803A (WEC0)  — BFW inlet (from Econ 4A)
  Stream 804B         — EC3B BFW actual flow inlet (CV-controlled)
  Stream 804C         — EC3B BFW outlet (heated water out → BFW to Econ 4C)
  Stream 804D         — EC3B bypass flow (bypasses EC3B, joins outlet)
  Stream 804E         — EC3B bypass valve outlet (mixed)
  Stream 805          — Final mixed BFW outlet → to Econ 4C

CONTROL LOGIC — TCV-7224
  Setpoint  : IPAT Inlet Temperature = Process Gas OUTLET from EC3B (Stream 16)
  Mechanism : Water flow through EC3B is varied by TCV-7224 until
              gas outlet temperature = IPAT T_in setpoint.
  Feedback  : FE/FIT-7224 measures water flow at EC3B inlet.
  Dead-time and low-pass filter modelled in dynamic mode.

BYPASS VALVE:
  Excess BFW (803A flow minus CV-controlled flow) bypasses the heat exchanger.
  Streams 804D & 804E represent this bypass path.
  The mixed outlet (Stream 805) = heated EC3B water + bypass cold BFW.

RATING CORRELATIONS
  U_rated = U₀ × (F_gas / F_gas_design)^0.6
  dP_rated = dP₀ × factor × (F / F_design)²

VALVE MODEL  (TCV-7224)
  Equal-percentage: Cv(x) = Cv_max / R^(1-x)
  Linear:           Cv(x) = Cv_max × x
  PID output: 4 mA (fully closed) → 20 mA (fully open)

Units: lb/hr, °F, PSIG/inWC, ft², MMBTU/hr
════════════════════════════════════════════════════════════════════════════════
"""

import math
import json
import sys

GAS_DESIGN_FLOW_SCFM = 103_736.0
GAS_MOL_WT           = 29.4
GAS_CP               = 0.245
WATER_CP             = 1.00

WATER_DESIGN_FLOW    = 269_418.0

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


def hx_solve(U, A, Fg, cpg, Tg_in, Fw, cpw, Tw_in):
    if Fg <= 0 or Fw <= 0:
        raise ValueError("hx_solve: all flows must be > 0")
    Cg  = Fg * cpg
    Cw  = Fw * cpw
    UA  = U * A
    Cmin = min(Cg, Cw)
    Cmax = max(Cg, Cw)
    R    = Cmin / Cmax
    NTU  = UA / Cmin
    if abs(R - 1) < 1e-9:
        eff = NTU / (1 + NTU)
    else:
        ex  = math.exp(-NTU * (1 - R))
        eff = (1 - ex) / (1 - R * ex)
    Q      = eff * Cmin * abs(Tg_in - Tw_in)
    Tg_out = Tg_in - Q / Cg
    Tw_out = Tw_in + Q / Cw
    lmtd   = lmtd_cc(Tg_in, Tg_out, Tw_in, Tw_out)
    return dict(
        duty         = Q / 1e6,
        Q_btu        = Q,
        gas_out_temp = Tg_out,
        water_out_temp = Tw_out,
        lmtd         = lmtd,
        UA           = UA,
    )


def cv_bisect(setpt, U, A, Fg, cpg, Tg_in, Tw_in, cpw,
              Fw_nom, cv_max, cv_R, cv_char, cv_dp, sg,
              niter=300, tol=0.10):
    def gas_out(Fw):
        r = hx_solve(U, A, Fg, cpg, Tg_in, Fw, cpw, Tw_in)
        return r["gas_out_temp"]

    max_F = flow_thru_valve(cv_max, cv_dp, sg)
    fl    = max(Fw_nom * 0.01, 1.0)
    fh    = min(Fw_nom * 4.0, max(max_F, Fw_nom * 2.0))
    Tl    = gas_out(fl)
    Th    = gas_out(fh)
    ok    = False
    fsol  = Fw_nom

    if (Tl - setpt) * (Th - setpt) < 0:
        for _ in range(niter):
            fm = (fl + fh) / 2.0
            Tm = gas_out(fm)
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
    return dict(
        label=label, tag=tag, kind="gas",
        SO2=comps.get("SO2", 0), SO3=comps.get("SO3", 0),
        O2=comps.get("O2",  0),  N2=comps.get("N2",  0),
        H2O=comps.get("H2O", 0), H2SO4=comps.get("H2SO4", 0),
        TOTAL=sum(comps.values()), PRESSURE=P_inwc, TEMPERATURE=T_f,
    )


def water_stream(label, tag, flow, P_psig, T_f):
    return dict(label=label, tag=tag, kind="water",
                FLOW=flow, PRESSURE=P_psig, TEMPERATURE=T_f)


def mix_water(flow_a, T_a, flow_b, T_b, P):
    total = flow_a + flow_b
    if total <= 0:
        return 0.0, (T_a + T_b) / 2.0, P
    T_mix = (flow_a * T_a + flow_b * T_b) / total
    return total, T_mix, P


def run(inp):
    comps   = {k: float(inp[f"gas_{k}"]) for k in ("SO2","SO3","O2","N2","H2O","H2SO4")}
    Fg_scfm = sum(comps.values())
    Fg      = scfm_to_lbhr(Fg_scfm)
    Tg_in   = float(inp["gas_temp"])
    Pg_in   = float(inp["gas_pressure"])
    Fd      = scfm_to_lbhr(GAS_DESIGN_FLOW_SCFM)

    Fw_nom  = float(inp["water_flow"])
    Tw_in   = float(inp["water_temp"])
    Pw_in   = float(inp["water_press"])

    ec3b_U0    = float(inp["ec3b_uo"])
    ec3b_A     = float(inp["ec3b_ht_area"])
    ec3b_wdp0  = float(inp["ec3b_water_dp0"])
    ec3b_wdpf  = float(inp["ec3b_water_dpf"])
    ec3b_gdp0  = float(inp["ec3b_gas_dp0"])
    ec3b_gdpf  = float(inp["ec3b_gas_dpf"])
    ec3b_cvmax = float(inp["ec3b_cv_max"])
    ec3b_cvR   = float(inp["ec3b_cv_range"])
    ec3b_cvch  = str(inp.get("ec3b_cv_type", "Equal Percentage"))

    ipat_sp    = float(inp.get("ipat_setpt", 330))
    sim_mode   = str(inp.get("sim_mode", "static")).lower()

    valve_upstream_P  = float(inp.get("valve_upstream_p",  178.55))
    downstream_P      = float(inp.get("downstream_p",      157.0))
    friction_loss_ft  = float(inp.get("friction_loss_ft",  0.906))
    velocity_fps      = float(inp.get("velocity_fps",      2.22))
    dP_orifice        = float(inp.get("dp_orifice_psi",    40.387))

    U_rated = rate_U(ec3b_U0, Fg, Fd)

    dP_gas   = rate_dP(ec3b_gdp0, Fg,     Fd,     ec3b_gdpf)
    dP_water = rate_dP(ec3b_wdp0, Fw_nom, WATER_DESIGN_FLOW, ec3b_wdpf)

    cv_res = cv_bisect(
        setpt  = ipat_sp,
        U      = U_rated,
        A      = ec3b_A,
        Fg     = Fg,
        cpg    = GAS_CP,
        Tg_in  = Tg_in,
        Tw_in  = Tw_in,
        cpw    = WATER_CP,
        Fw_nom = Fw_nom,
        cv_max = ec3b_cvmax,
        cv_R   = ec3b_cvR,
        cv_char= ec3b_cvch,
        cv_dp  = dP_water,
        sg     = SG_WATER,
    )

    Fw_cv   = cv_res["flow"]
    dP_cv   = cv_res["dp_actual"]

    hx = hx_solve(U_rated, ec3b_A, Fg, GAS_CP, Tg_in, Fw_cv, WATER_CP, Tw_in)

    Tg_out   = hx["gas_out_temp"]
    Tw_out   = hx["water_out_temp"]
    Pg_out   = Pg_in  - dP_gas
    Pw_cv    = Pw_in  - dP_cv
    Pw_out   = Pw_cv  - dP_water

    Fw_bypass = max(0.0, Fw_nom - Fw_cv)
    Pw_bypass = Pw_in

    Fw_mix, Tw_mix, Pw_mix = mix_water(
        Fw_cv, Tw_out,
        Fw_bypass, Tw_in,
        Pw_out
    )

    cv_pos   = cv_res["pos"]
    cv_r     = cv_res["cv_req"]
    ctrl_out = cv_res["pos"] * 100.0

    ec3b_res = dict(
        duty           = hx["duty"],
        gas_out_temp   = Tg_out,
        water_out_temp = Tw_out,
        lmtd           = hx["lmtd"],
        UA             = hx["UA"],
        uo_rated       = U_rated,
        gas_dp         = dP_gas,
        water_dp       = dP_water,
        valve_pos      = cv_pos * 100.0,
        pid_output     = pid_ma(cv_pos),
        cv_required    = cv_r,
        valve_dp       = dP_cv,
        controller_out = ctrl_out,
        velocity       = velocity_fps,
        friction_loss  = friction_loss_ft,
        valve_inlet_p  = valve_upstream_P,
        downstream_p   = downstream_P,
        dp_orifice     = dP_orifice,
        water_flow_cv  = Fw_cv,
        water_flow_bypass = Fw_bypass,
    )

    s15 = gas_stream("Stream #15 — EC3B Gas Inlet (Hot Gas from CIP)",
                     "GEB0", comps, Pg_in, Tg_in)
    s16 = gas_stream("Stream #16 — EC3B Gas Outlet (IPAT Inlet / GEB1)",
                     "GEB1", comps, Pg_out, Tg_out)

    s803A = water_stream("Stream #803A — EC3B BFW Inlet (WEC0, from Econ 4A)",
                         "WEC0", Fw_nom, Pw_in, Tw_in)
    s804B = water_stream("Stream #804B — EC3B BFW Through-Valve Flow (actual)",
                         "WEC_CV", Fw_cv, Pw_cv, Tw_in)
    s804C = water_stream("Stream #804C — EC3B BFW Outlet (heated)",
                         "WEC_OUT", Fw_cv, Pw_out, Tw_out)
    s804D = water_stream("Stream #804D — EC3B Bypass Flow",
                         "WEC_BYP", Fw_bypass, Pw_bypass, Tw_in)
    s804E = water_stream("Stream #804E — EC3B Bypass Valve Outlet",
                         "WEC_BYPO", Fw_bypass, Pw_bypass, Tw_in)
    s805  = water_stream("Stream #805 — EC3B Mixed Outlet → BFW to Econ 4C",
                         "WEC_MIX", Fw_mix, Pw_mix, Tw_mix)

    streams = dict(
        s15=s15, s16=s16,
        s803A=s803A, s804B=s804B, s804C=s804C,
        s804D=s804D, s804E=s804E, s805=s805,
    )

    summary = dict(
        duty           = hx["duty"],
        gas_T_in       = Tg_in,
        gas_T_out      = Tg_out,
        ipat_setpt     = ipat_sp,
        gas_flow       = Fg,
        water_flow_in  = Fw_nom,
        water_flow_cv  = Fw_cv,
        water_flow_mix = Fw_mix,
        water_T_out    = Tw_out,
        mixed_T_out    = Tw_mix,
        valve_pos      = cv_pos * 100.0,
        pid_output     = pid_ma(cv_pos),
    )

    result = dict(ec3b=ec3b_res, streams=streams, summary=summary)

    if sim_mode == "dynamic":
        result["dynamic"] = _dynamic_sim(ec3b_res, inp, ipat_sp)

    return result


def _dynamic_sim(ec3b_res, inp, setpt):
    tau_v   = float(inp.get("dyn_tau_valve",   30.0))
    tau_p   = float(inp.get("dyn_tau_proc",   120.0))
    dead    = float(inp.get("dyn_dead_time",   30.0))
    tau_lpf = float(inp.get("dyn_tau_lpf",     15.0))
    dt      = float(inp.get("dyn_dt",           5.0))
    t_end   = float(inp.get("dyn_t_end",      600.0))

    steps       = int(t_end / dt) + 1
    delay_steps = max(1, int(dead / dt))

    def fo(y, u, tau):
        return y + (dt / tau) * (u - y)

    ic_T      = ec3b_res["gas_out_temp"]
    ic_cv_pos = ec3b_res["valve_pos"] / 100.0

    t_arr    = []
    T_arr    = []
    cv_arr   = []
    pid_arr  = []
    lpf_arr  = []

    T_proc    = ic_T
    cv_pos    = ic_cv_pos
    T_meas    = ic_T
    T_lpf     = ic_T
    buf       = [ic_T] * delay_steps

    for i in range(steps):
        t = i * dt
        e = setpt - T_lpf
        cv_sp = max(0.0, min(1.0, ic_cv_pos - e / max(abs(setpt), 1.0)))
        cv_pos = fo(cv_pos, cv_sp, tau_v)
        cv_pos = max(0.0, min(1.0, cv_pos))
        T_proc = fo(T_proc, setpt, tau_p)
        buf.append(T_proc)
        buf = buf[-delay_steps:]
        T_meas = buf[0]
        T_lpf = fo(T_lpf, T_meas, tau_lpf)

        t_arr.append(t)
        T_arr.append(T_proc)
        cv_arr.append(cv_pos * 100.0)
        pid_arr.append(pid_ma(cv_pos))
        lpf_arr.append(T_lpf)

    return dict(
        t          = t_arr,
        gas_out    = T_arr,
        cv_pos     = cv_arr,
        pid_output = pid_arr,
        lpf_temp   = lpf_arr,
        setpt      = [setpt] * steps,
    )


if __name__ == "__main__":
    try:
        input_data = json.loads(sys.stdin.read() or "{}")
        result = run(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
