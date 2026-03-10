"""
sh4a_ec4c_ec4a_calculator.py
════════════════════════════════════════════════════════════════════════════════
HP Superheater 4A / Economizer 4C / Economizer 4A
Equipment: 1540-HX-004 / 006 / 007

PROCESS FLOW (counter-current gas → steam):
  Process Gas (hot side) →  SH4A  →  EC4C  →  EC4A  → Gas Outlet

STEAM CIRCUITS (each independent; counter-current to gas):
  SH4A  : Steam enters from bottom, exits to Turbo-Generator
           Control Valve (CV-803) on steam inlet – manipulated to hold
           SH4A steam OUTLET temperature (proxy for TG inlet temperature).
  EC4C  : No control valve – fixed steam flow / temperature.
  EC4A  : Steam enters from bottom
           Control Valve (CV-805) on steam inlet – manipulated to hold
           Process Gas OUTLET temperature (exit of EC4A).

RATING CORRELATIONS
  • Heat-transfer coefficient U is rated as a function of process-gas mass flow:
        U_rated = U₀ × (F_gas / F_gas_design)^0.6
  • All pressure drops are rated as:
        dP_rated = dP₀ × (F / F_design)²  × rating_factor

VALVE MODEL (equal-percentage or linear)
  • Equal-percentage:  Cv(x) = Cv_max / R^(1-x)     x ∈ [0,1]
  • Linear:            Cv(x) = Cv_max × x
  Valve position is solved iteratively to satisfy the downstream control target.
  PID output mapped: 4 mA @ 0 % open → 20 mA @ 100 % open.

HEAT EXCHANGER MODEL
  Counter-current LMTD with standard Q = U·A·LMTD energy balance.
  Energy balance closed with Cp for gas and steam side.

Units
  Flow    : lb/hr
  Temperature : °F
  Pressure    : PSIG (steam), in WC (process gas)
  Heat area   : ft²
  Duty        : MMBTU/hr
════════════════════════════════════════════════════════════════════════════════
"""

import math

# ═════════════════════════════════════════════════════════════════════════════
# Physical / process constants (design-basis defaults)
# ═════════════════════════════════════════════════════════════════════════════
# Design process-gas total flow [scfm] used as reference for rating
GAS_DESIGN_FLOW_SCFM = 90_896.0    # from screen
GAS_MOL_WT           = 29.2        # approximate, lb/lbmol  (mostly N2/O2)
GAS_CP               = 0.245       # BTU / lb·°F  (hot flue-type gas, ~800°F)
GAS_DENSITY_STD      = 0.0765      # lb/scf  (approximate for lean SO2 gas)
STEAM_CP_SUPERHEAT   = 0.55        # BTU / lb·°F  (superheated steam average)
STEAM_CP_SUBCOOL     = 1.10        # BTU / lb·°F  (liquid water / economizer)
WATER_LATENT         = 970.0       # BTU/lb  (approximate at ~900 PSIG)

# Design steam flows [lb/hr] – used as reference for steam-side dP rating
SH_STEAM_DESIGN    = 269_418.0
EC4C_STEAM_DESIGN  = 264_418.0
EC4A_STEAM_DESIGN  = 264_418.0

# Hydraulics
SPECIFIC_GRAVITY_WATER = 1.0
FT_PER_PSI             = 2.3097    # ft of water per psi
PUMP_HEAD_FRICTION_FT  = 0.906     # friction loss reference (from screen)
VALVE_INLET_P_PSIG     = 178.55    # reference valve upstream pressure

# ═════════════════════════════════════════════════════════════════════════════
# Utility functions
# ═════════════════════════════════════════════════════════════════════════════

def scfm_to_lbhr(scfm: float, mol_wt: float = GAS_MOL_WT) -> float:
    """Convert scfm to lb/hr using standard air density ratio."""
    lb_per_scf = mol_wt / 379.0  # 379 scf/lbmol at std conditions
    return scfm * lb_per_scf * 60.0


def lmtd_counter(T_hot_in, T_hot_out, T_cold_in, T_cold_out) -> float:
    """Log-mean temperature difference for counter-current exchanger."""
    dT1 = T_hot_in  - T_cold_out   # hot inlet  ↔ cold outlet end
    dT2 = T_hot_out - T_cold_in    # hot outlet ↔ cold inlet  end
    if dT1 <= 0 or dT2 <= 0:
        raise ValueError(
            f"Non-positive ΔT in LMTD calc: dT1={dT1:.1f}, dT2={dT2:.1f}. "
            "Check temperatures – hot side must be above cold side at each end.")
    if abs(dT1 - dT2) < 1e-6:
        return dT1
    return (dT1 - dT2) / math.log(dT1 / dT2)


def rate_uo(uo0: float, flow: float, design_flow: float,
            exponent: float = 0.6) -> float:
    """Rate U₀ as a function of process-gas mass flow (Dittus-Boelter style)."""
    if design_flow <= 0:
        return uo0
    return uo0 * (flow / design_flow) ** exponent


def rate_dp(dp0: float, flow: float, design_flow: float,
            factor: float = 1.0) -> float:
    """Rate pressure drop squared-law with rating factor."""
    if design_flow <= 0:
        return dp0
    return dp0 * factor * (flow / design_flow) ** 2


def valve_cv(position: float, cv_max: float, rangeability: float,
             characteristic: str = "Equal Percentage") -> float:
    """
    Return Cv for a given valve position (0–1).
    characteristic: 'Equal Percentage' or 'Linear'
    """
    x = max(0.0, min(1.0, position))
    if characteristic.strip().lower().startswith("equal"):
        if rangeability <= 1:
            rangeability = 50.0
        return cv_max / (rangeability ** (1.0 - x))
    else:  # Linear
        return cv_max * x


def valve_flow_lbhr(cv: float, delta_p_psi: float,
                    sg: float = SPECIFIC_GRAVITY_WATER) -> float:
    """
    Liquid flow through valve:  W = Cv × sqrt(ΔP / SG)  [gpm]  → lb/hr
    Using simplified liquid model (steam service at high pressure approximated).
    """
    if delta_p_psi <= 0:
        return 0.0
    gpm = cv * math.sqrt(delta_p_psi / sg)
    return gpm * 500.0   # 1 gpm water ≈ 500 lb/hr


def solve_valve_position(target_flow_lbhr: float,
                         valve_dp_psi: float,
                         cv_max: float,
                         rangeability: float,
                         characteristic: str,
                         sg: float = SPECIFIC_GRAVITY_WATER) -> tuple:
    """
    Binary-search valve position so that valve_flow ≈ target_flow.
    Returns (position, cv_required, actual_flow).
    """
    if valve_dp_psi <= 0 or cv_max <= 0:
        return (0.5, 0.0, 0.0)

    # Cv required directly from flow equation
    cv_req = target_flow_lbhr / (500.0 * math.sqrt(max(valve_dp_psi, 0.01) / sg))
    cv_req = min(cv_req, cv_max)

    # Invert valve characteristic to get position
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


def pos_to_ma(position: float) -> float:
    """Map valve position 0–1 to 4–20 mA PID output signal."""
    return 4.0 + position * 16.0


# ═════════════════════════════════════════════════════════════════════════════
# Heat Exchanger Solver  (single unit, counter-current)
# ═════════════════════════════════════════════════════════════════════════════

def solve_hx(uo: float, area: float,
             gas_flow_lbhr: float, gas_cp: float,
             gas_T_in: float,
             steam_flow_lbhr: float, steam_cp: float,
             steam_T_in: float,
             max_iter: int = 200, tol: float = 0.01) -> dict:
    """
    Solve a counter-current heat exchanger via NTU-Effectiveness or LMTD iteration.

    Uses LMTD iteration:
      Guess gas_T_out → compute steam_T_out from energy balance
      → compute LMTD → compute Q_UA = U·A·LMTD
      → compare with Q_gas → iterate.

    Returns dict with duty [MMBTU/hr], gas_out_temp, steam_out_temp, lmtd, UA.
    """
    if gas_flow_lbhr <= 0 or steam_flow_lbhr <= 0:
        raise ValueError("Flow rates must be positive.")

    C_gas   = gas_flow_lbhr   * gas_cp       # BTU/hr·°F
    C_steam = steam_flow_lbhr * steam_cp     # BTU/hr·°F

    UA = uo * area  # BTU/hr·°F

    # NTU-effectiveness (counter-current)
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
    Q     = eff * Q_max  # BTU/hr

    gas_T_out   = gas_T_in   - Q / C_gas
    steam_T_out = steam_T_in + Q / C_steam

    lmtd = lmtd_counter(gas_T_in, gas_T_out, steam_T_in, steam_T_out)

    return {
        "duty":          Q / 1e6,          # MMBTU/hr
        "gas_out_temp":  gas_T_out,
        "steam_out_temp":steam_T_out,
        "lmtd":          lmtd,
        "UA":            UA,
    }


# ═════════════════════════════════════════════════════════════════════════════
# Main run() function — called by the GUI
# ═════════════════════════════════════════════════════════════════════════════

def run(inp: dict) -> dict:
    """
    Execute the SH4A → EC4C → EC4A series calculation.

    Parameters
    ----------
    inp : dict
        All inputs as collected from the GUI (see gui script for keys).

    Returns
    -------
    dict with sub-dicts for "sh", "ec4c", "ec4a".
    """

    # ── 1. Unpack & convert inputs ────────────────────────────────────────────
    # Process gas
    gas_total_scfm = (inp["gas_SO2"] + inp["gas_SO3"] + inp["gas_O2"] +
                      inp["gas_N2"] + inp["gas_H2O"] + inp["gas_H2SO4"])
    gas_flow_lbhr  = scfm_to_lbhr(gas_total_scfm)
    gas_T_in       = float(inp["gas_temp"])           # °F entering SH4A

    # Design reference gas flow (lb/hr at design conditions)
    design_gas_lbhr = scfm_to_lbhr(GAS_DESIGN_FLOW_SCFM)

    # Steam flows
    sh_stm_flow   = float(inp["sh_steam_flow"])
    ec4c_stm_flow = float(inp["ec4c_steam_flow"])
    ec4a_stm_flow = float(inp["ec4a_steam_flow"])

    sh_stm_T_in   = float(inp["sh_steam_temp"])
    ec4c_stm_T_in = float(inp["ec4c_steam_temp"])
    ec4a_stm_T_in = float(inp["ec4a_steam_temp"])

    sh_stm_P      = float(inp["sh_steam_press"])    # PSIG
    ec4c_stm_P    = float(inp["ec4c_steam_press"])
    ec4a_stm_P    = float(inp["ec4a_steam_press"])

    # Equipment parameters
    sh_area      = float(inp["sh_ht_area"])
    sh_uo0       = float(inp["sh_uo"])
    sh_dp0       = float(inp["sh_steam_dp0"])
    sh_dpf       = float(inp["sh_dp_factor"])
    sh_cv_max    = float(inp["sh_cv_max"])
    sh_cv_range  = float(inp["sh_cv_range"])
    sh_cv_char   = str(inp.get("sh_cv_type", "Equal Percentage"))
    sh_cv_setpt  = float(inp["sh_cv_setpt"])   # SH steam outlet temp setpoint (TG inlet)

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
    ec4a_cv_setpt= float(inp["ec4a_cv_setpt"])  # Gas outlet temp setpoint

    # ── 2. Rate heat-transfer coefficients vs. gas flow ───────────────────────
    sh_uo_rated   = rate_uo(sh_uo0,   gas_flow_lbhr, design_gas_lbhr)
    ec4c_uo_rated = rate_uo(ec4c_uo0, gas_flow_lbhr, design_gas_lbhr)
    ec4a_uo_rated = rate_uo(ec4a_uo0, gas_flow_lbhr, design_gas_lbhr)

    # ── 3. Rate pressure drops ────────────────────────────────────────────────
    # Steam-side dP rated vs. steam flow
    sh_steam_dp   = rate_dp(sh_dp0,   sh_stm_flow,   SH_STEAM_DESIGN,   sh_dpf)
    ec4c_steam_dp = rate_dp(ec4c_stm_dp0, ec4c_stm_flow, EC4C_STEAM_DESIGN, ec4c_stm_dpf)
    ec4a_steam_dp = rate_dp(ec4a_stm_dp0, ec4a_stm_flow, EC4A_STEAM_DESIGN, ec4a_stm_dpf)

    # Process-gas dP rated vs. gas flow (in WC; ec4c has explicit gas dP, sh/ec4a proportional)
    sh_gas_dp   = rate_dp(11.0, gas_flow_lbhr, design_gas_lbhr, sh_dpf)     # estimate
    ec4c_gas_dp = rate_dp(ec4c_gas_dp0, gas_flow_lbhr, design_gas_lbhr, ec4c_gas_dpf)
    ec4a_gas_dp = rate_dp(11.0, gas_flow_lbhr, design_gas_lbhr, ec4a_stm_dpf)  # estimate

    # ── 4. Solve SH4A ─────────────────────────────────────────────────────────
    sh_result = solve_hx(
        uo          = sh_uo_rated,
        area        = sh_area,
        gas_flow_lbhr   = gas_flow_lbhr,
        gas_cp          = GAS_CP,
        gas_T_in        = gas_T_in,
        steam_flow_lbhr = sh_stm_flow,
        steam_cp        = STEAM_CP_SUPERHEAT,
        steam_T_in      = sh_stm_T_in,
    )

    # SH4A Control Valve: manipulate steam flow to hit sh_cv_setpt (steam outlet temp)
    # Strategy: iterate steam flow until steam_out_temp == setpoint
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
        valve_dp_psi     = sh_steam_dp,          # use rated dP as valve ΔP estimate
        upstream_p_psig  = sh_stm_P,
        sg               = SPECIFIC_GRAVITY_WATER,
    )

    # Update SH result with CV-modulated steam flow
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

    # Gas temperature leaving SH4A enters EC4C
    gas_T_after_sh = sh_result_cv["gas_out_temp"]

    # ── 5. Solve EC4C (no control valve — fixed steam flow) ───────────────────
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

    # ── 6. Solve EC4A with control valve (target: gas outlet temp) ────────────
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


# ═════════════════════════════════════════════════════════════════════════════
# Control-valve + HX co-solver
# ═════════════════════════════════════════════════════════════════════════════

def _solve_cv_for_temp_target(
        target_temp, side,
        uo, area,
        gas_flow_lbhr, gas_cp, gas_T_in,
        steam_T_in, steam_cp,
        nominal_flow,
        cv_max, cv_range, cv_char,
        valve_dp_psi, upstream_p_psig, sg,
        max_iter=120, tol=0.5) -> dict:
    """
    Iterate steam flow (via valve position) until HX output temperature
    matches `target_temp`.

    side = "steam_out" → control steam outlet temperature (SH4A → TG setpoint)
    side = "gas_out"   → control gas outlet temperature   (EC4A gas outlet)

    Returns dict with valve_pos, cv_req, valve_dp, controlled_flow.
    """

    def hx_temp(flow):
        res = solve_hx(uo, area,
                       gas_flow_lbhr, gas_cp, gas_T_in,
                       flow, steam_cp, steam_T_in)
        return res["steam_out_temp"] if side == "steam_out" else res["gas_out_temp"]

    # Max achievable flow through valve at rated ΔP
    max_cv_flow = valve_flow_lbhr(cv_max, valve_dp_psi, sg)

    # Bracket search: low flow → high temp (steam side heats up more with less flow)
    f_lo = max(nominal_flow * 0.05, 1.0)
    f_hi = min(nominal_flow * 2.0, max_cv_flow if max_cv_flow > 0 else nominal_flow * 2.0)

    T_lo = hx_temp(f_lo)
    T_hi = hx_temp(f_hi)

    # Determine which direction temperature moves with flow
    converged = False
    f_solution = nominal_flow

    # Try bisection
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
        # Target out of achievable range – clamp to closest bound
        if abs(T_lo - target_temp) < abs(T_hi - target_temp):
            f_solution = f_lo
        else:
            f_solution = f_hi

    # Solve valve position for required flow
    pos, cv_req, _ = solve_valve_position(
        f_solution, valve_dp_psi, cv_max, cv_range, cv_char, sg)

    # Recalculate actual valve ΔP based on upstream pressure & flow
    # Simplified: ΔP = (flow / (500 × Cv))² × SG
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


# ═════════════════════════════════════════════════════════════════════════════
# Stand-alone test / demo
# ═════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    demo_inputs = {
        # SH4A params
        "sh_ht_area":    18000,
        "sh_uo":         15.0,
        "sh_pipe_dia":   12.0,
        "sh_gas_in_duct":6.5,
        "sh_steam_dp0":  15.0,
        "sh_dp_factor":  1.7,
        "sh_cv_type":    "Equal Percentage",
        "sh_cv_max":     1000.0,
        "sh_cv_range":   85,
        "sh_cv_setpt":   750,      # TG inlet steam temp setpoint [°F]
        # EC4C params
        "ec4c_ht_area":  13000,
        "ec4c_uo":       15.0,
        "ec4c_steam_dp0":15.0,
        "ec4c_dp_factor":1.7,
        "ec4c_proc_dp0": 11.0,
        "ec4c_proc_dpf": 1.7,
        # EC4A params
        "ec4a_ht_area":  15000,
        "ec4a_uo":       15.0,
        "ec4a_pipe_dia": 8.0,
        "ec4a_steam_dp0":15.0,
        "ec4a_dp_factor":1.7,
        "ec4a_cv_type":  "Equal Percentage",
        "ec4a_cv_max":   548.0,
        "ec4a_cv_range": 85,
        "ec4a_cv_setpt": 401,      # gas outlet temp setpoint [°F]
        # Process gas inlet (Stream 20)
        "gas_SO2":    18,
        "gas_SO3":    462,
        "gas_O2":     4069,
        "gas_N2":     86808,
        "gas_H2O":    0,
        "gas_H2SO4":  0,
        "gas_pressure":   47,
        "gas_temp":       808,
        # SH4A steam (Stream 806)
        "sh_steam_flow":  269418,
        "sh_steam_press": 915,
        "sh_steam_temp":  536,
        # EC4C steam (Stream 805)
        "ec4c_steam_flow": 264418,
        "ec4c_steam_press":951,
        "ec4c_steam_temp": 401,
        # EC4A steam (Stream 803A)
        "ec4a_steam_flow": 264418,
        "ec4a_steam_press":978,
        "ec4a_steam_temp": 223,
    }

    results = run(demo_inputs)

    print("\n" + "═"*65)
    print("  SH4A / EC4C / EC4A  —  Calculation Results")
    print("═"*65)
    for unit, label in [("sh","SH 4A"), ("ec4c","EC 4C"), ("ec4a","EC 4A")]:
        r = results[unit]
        print(f"\n  ── {label} ──")
        print(f"    Duty              : {r['duty']:>10.3f}  MMBTU/hr")
        print(f"    Gas Outlet Temp   : {r['gas_out_temp']:>10.1f}  °F")
        print(f"    Steam Outlet Temp : {r['steam_out_temp']:>10.1f}  °F")
        print(f"    LMTD              : {r['lmtd']:>10.1f}  °F")
        print(f"    UA                : {r['UA']:>10.0f}  BTU/hr·°F")
        print(f"    U₀ (rated)        : {r['uo_rated']:>10.3f}  BTU/ft²·°F·hr")
        print(f"    Gas Side dP       : {r['gas_dp']:>10.2f}  in WC")
        print(f"    Steam Side dP     : {r['steam_dp']:>10.2f}  psi")
        if "valve_pos" in r:
            print(f"    Valve Position    : {r['valve_pos']:>10.2f}  %")
            print(f"    PID Output        : {r['pid_output']:>10.4f}  mA")
            print(f"    Cv Required       : {r['cv_required']:>10.2f}")
            print(f"    Valve ΔP          : {r['valve_dp']:>10.3f}  psi")
    print("\n" + "═"*65)
