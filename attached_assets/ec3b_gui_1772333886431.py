"""
ec3b_gui.py
Economizer 3B  —  1540-HX-002
Control Loop: TIC-7224 / TCV-7224  (IPAT Inlet Temperature)

Requires ec3b_calculator.py in the same folder.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import json, os, importlib.util

# ── Load calculator ───────────────────────────────────────────────────────────
_CALC_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "ec3b_calculator.py")
_calc = None
if os.path.exists(_CALC_PATH):
    spec = importlib.util.spec_from_file_location("ec3b_calc", _CALC_PATH)
    _calc = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(_calc)

# ── Palette ───────────────────────────────────────────────────────────────────
BG      = "#1a1f2e"
PANEL   = "#242b3d"
PANEL2  = "#1e2535"
ACCENT  = "#3a7bd5"
ACCENT2 = "#e8a838"
ACCENT3 = "#4caf7d"
ACCENT4 = "#c05bdb"
TEXT    = "#dce3f0"
LABEL   = "#8a9bbf"
EBKG    = "#151b29"
EFG     = "#dce3f0"
BORDER  = "#2e3a55"
GREEN   = "#4caf7d"
ORANGE  = "#e8a838"
BLUE    = "#5bb3e0"
RED     = "#e05c5c"
TEAL    = "#3ecfcf"
WATER   = "#29b6f6"   # water stream colour

FT  = ("Segoe UI", 12, "bold")
FH  = ("Segoe UI", 10, "bold")
FL  = ("Segoe UI",  9)
FE  = ("Consolas",  9)
FO  = ("Consolas",  9, "bold")
FS  = ("Segoe UI",  8)
FSB = ("Segoe UI",  8, "bold")


# ═════════════════════════════════════════════════════════════════════════════
# Widget helpers
# ═════════════════════════════════════════════════════════════════════════════

def mk_entry(parent, label, default, row, col=0, unit="", w=11,
             color=EFG, colspan=1):
    tk.Label(parent, text=label, bg=PANEL, fg=LABEL, font=FL,
             anchor="w").grid(row=row, column=col, sticky="w",
                              padx=(8, 2), pady=2)
    var = tk.StringVar(value=str(default))
    e = tk.Entry(parent, textvariable=var, bg=EBKG, fg=color, font=FE,
                 width=w, insertbackground=TEXT, relief="flat",
                 highlightbackground=BORDER, highlightcolor=ACCENT,
                 highlightthickness=1)
    e.grid(row=row, column=col + 1, sticky="w", padx=2, pady=2,
           columnspan=colspan)
    if unit:
        tk.Label(parent, text=unit, bg=PANEL, fg=LABEL,
                 font=FS).grid(row=row, column=col + 2, sticky="w",
                               padx=(0, 6))
    return var


def mk_out(parent, label, row, col=0, unit="", color=GREEN, w=13):
    tk.Label(parent, text=label, bg=PANEL, fg=LABEL, font=FL,
             anchor="w").grid(row=row, column=col, sticky="w",
                              padx=(8, 2), pady=2)
    var = tk.StringVar(value="---")
    tk.Label(parent, textvariable=var, bg=PANEL, fg=color, font=FO,
             width=w, anchor="w").grid(row=row, column=col + 1,
                                       sticky="w", padx=2)
    if unit:
        tk.Label(parent, text=unit, bg=PANEL, fg=LABEL,
                 font=FS).grid(row=row, column=col + 2, sticky="w",
                               padx=(0, 6))
    return var


def mk_sep(parent, text, row, cols=6, color=ACCENT):
    tk.Frame(parent, bg=color, height=1).grid(
        row=row, column=0, columnspan=cols, sticky="ew", padx=8, pady=(10, 0))
    tk.Label(parent, text=text, bg=PANEL, fg=color, font=FSB,
             anchor="w").grid(row=row + 1, column=0, columnspan=cols,
                              sticky="w", padx=8, pady=(0, 3))


def scrolled(parent):
    c = tk.Canvas(parent, bg=BG, highlightthickness=0)
    sb = tk.Scrollbar(parent, orient="vertical", command=c.yview)
    c.configure(yscrollcommand=sb.set)
    sb.pack(side="right", fill="y")
    c.pack(fill="both", expand=True)
    frm = tk.Frame(c, bg=BG)
    win = c.create_window((0, 0), window=frm, anchor="nw")
    frm.bind("<Configure>",
             lambda e: c.configure(scrollregion=c.bbox("all")))
    c.bind("<Configure>", lambda e: c.itemconfig(win, width=e.width))
    def _mw(ev): c.yview_scroll(int(-1 * (ev.delta / 120)), "units")
    c.bind_all("<MouseWheel>", _mw)
    return frm


# ── Compact stream display card ───────────────────────────────────────────────
class StreamCard:
    def __init__(self, grid_parent, title, tag, kind, color, gr, gc):
        outer = tk.Frame(grid_parent, bg=color)
        inner = tk.Frame(outer, bg=PANEL2)
        inner.pack(fill="both", expand=True, padx=1, pady=1)
        hdr = tk.Frame(inner, bg=color)
        hdr.pack(fill="x")
        tk.Label(hdr, text=title, bg=color, fg="white",
                 font=("Segoe UI", 8, "bold"),
                 anchor="w", padx=5, pady=3).pack(side="left")
        tk.Label(hdr, text=tag, bg=color, fg="#ffffffbb",
                 font=("Segoe UI", 8), padx=5).pack(side="right")
        outer.grid(row=gr, column=gc, sticky="nsew", padx=3, pady=3)

        if kind == "gas":
            fields = [("SO2","scfm"),("SO3","scfm"),("O2","scfm"),
                      ("N2","scfm"),("H2O","scfm"),("H2SO4","scfm"),
                      ("TOTAL","scfm"),("PRESSURE","in WC"),("TEMPERATURE","°F")]
        else:
            fields = [("FLOW","LB/HR"),("PRESSURE","PSIG"),("TEMPERATURE","°F")]

        self._kind = kind
        self._vars = {}
        for ri, (name, unit) in enumerate(fields):
            tk.Label(inner, text=name, bg=PANEL2, fg=LABEL, font=FS,
                     width=12, anchor="w").grid(row=ri, column=0,
                                                padx=(5, 2), pady=1,
                                                sticky="w")
            v = tk.StringVar(value="---")
            self._vars[name] = v
            fc = (GREEN if name == "TEMPERATURE"
                  else (ORANGE if name == "PRESSURE" else BLUE))
            tk.Label(inner, textvariable=v, bg=PANEL2, fg=fc,
                     font=FO, width=11, anchor="e").grid(
                         row=ri, column=1, padx=2, pady=1, sticky="e")
            tk.Label(inner, text=unit, bg=PANEL2, fg=LABEL,
                     font=FS).grid(row=ri, column=2, padx=(0, 5),
                                   pady=1, sticky="w")

    def update(self, s):
        if self._kind == "gas":
            for k in ("SO2","SO3","O2","N2","H2O","H2SO4","TOTAL"):
                self._vars[k].set(f"{s.get(k, 0):,.0f}")
            self._vars["PRESSURE"].set(f"{s.get('PRESSURE', 0):.2f}")
            self._vars["TEMPERATURE"].set(f"{s.get('TEMPERATURE', 0):.1f}")
        else:
            self._vars["FLOW"].set(f"{s.get('FLOW', 0):,.0f}")
            self._vars["PRESSURE"].set(f"{s.get('PRESSURE', 0):.1f}")
            self._vars["TEMPERATURE"].set(f"{s.get('TEMPERATURE', 0):.1f}")


# ═════════════════════════════════════════════════════════════════════════════
# Main Application
# ═════════════════════════════════════════════════════════════════════════════

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("EC3B  —  Economizer 3B  —  1540-HX-002")
        self.configure(bg=BG)
        self.geometry("1380x860")
        self._scards = {}
        self._build()

    # ─────────────────────────────────────────────────────────────────────────
    def _build(self):
        # Title bar
        tbar = tk.Frame(self, bg=ACCENT)
        tbar.pack(fill="x")
        tk.Label(tbar, text="  EC3B  —  ECONOMIZER 3B  —  Control Loop TIC/TCV-7224",
                 bg=ACCENT, fg="white", font=FT, pady=6).pack(side="left")
        tk.Label(tbar, text="1540-HX-002  ",
                 bg=ACCENT, fg="#c8deff", font=FL).pack(side="right")

        # ── Simulation mode + setpoint bar ───────────────────────────────────
        mbar = tk.Frame(self, bg=PANEL2, pady=5)
        mbar.pack(fill="x")
        tk.Label(mbar, text="  Simulation Mode:", bg=PANEL2, fg=LABEL,
                 font=FH).pack(side="left", padx=(12, 6))
        self._sim_mode = tk.StringVar(value="static")
        rb_kw = dict(bg=PANEL2, fg=TEXT, font=FL,
                     selectcolor=PANEL2, activebackground=PANEL2,
                     activeforeground=TEXT, relief="flat")
        tk.Radiobutton(mbar, text="Static Calculation",
                       variable=self._sim_mode, value="static",
                       **rb_kw).pack(side="left", padx=4)
        tk.Radiobutton(mbar, text="Dynamic Simulation",
                       variable=self._sim_mode, value="dynamic",
                       **rb_kw).pack(side="left", padx=4)

        tk.Frame(mbar, bg=BORDER, width=2).pack(side="left", fill="y",
                                                padx=12, pady=4)
        tk.Label(mbar, text="Target Temperatures:", bg=PANEL2,
                 fg=TEAL, font=FSB).pack(side="left", padx=(4, 8))
        tk.Label(mbar, text="Target Pass 3 Outlet Temp",
                 bg=PANEL2, fg=LABEL, font=FL).pack(side="left", padx=(0, 4))
        self.t_ipat_sp = tk.StringVar(value="330")
        tk.Entry(mbar, textvariable=self.t_ipat_sp, bg=EBKG, fg=TEAL,
                 font=FE, width=7, insertbackground=TEXT, relief="flat",
                 highlightbackground=BORDER, highlightcolor=TEAL,
                 highlightthickness=1).pack(side="left")
        tk.Label(mbar, text="°F", bg=PANEL2, fg=LABEL,
                 font=FS).pack(side="left", padx=(2, 4))

        # Notebook
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TNotebook", background=BG, borderwidth=0)
        style.configure("TNotebook.Tab", background=PANEL,
                        foreground=TEXT, padding=[12, 5], font=FL)
        style.map("TNotebook.Tab",
                  background=[("selected", ACCENT)],
                  foreground=[("selected", "white")])

        nb = ttk.Notebook(self)
        nb.pack(fill="both", expand=True, padx=4, pady=2)
        self._nb = nb

        self._tabs = {}
        for key, label in [("params",  "  Equipment Parameters  "),
                            ("inputs",  "  Stream Inputs  "),
                            ("results", "  HX Results  "),
                            ("streams", "  Stream Outputs  "),
                            ("dynamic", "  Dynamic Response  ")]:
            frm = tk.Frame(nb, bg=BG)
            nb.add(frm, text=label)
            self._tabs[key] = frm

        self._params_tab(self._tabs["params"])
        self._inputs_tab(self._tabs["inputs"])
        self._results_tab(self._tabs["results"])
        self._streams_tab(self._tabs["streams"])
        self._dynamic_tab(self._tabs["dynamic"])

        # Action bar
        ab = tk.Frame(self, bg=BG, pady=5)
        ab.pack(fill="x")
        tk.Button(ab, text="▶  RUN CALCULATION", command=self._run,
                  bg=ACCENT, fg="white", font=FH, relief="flat",
                  padx=20, pady=5, cursor="hand2",
                  activebackground="#2d66c4").pack(side="left", padx=12)
        tk.Button(ab, text="Reset", command=self._reset,
                  bg=PANEL, fg=LABEL, font=FL, relief="flat",
                  padx=10, pady=5, cursor="hand2").pack(side="left", padx=4)
        tk.Button(ab, text="Export JSON", command=self._export,
                  bg=PANEL, fg=LABEL, font=FL, relief="flat",
                  padx=10, pady=5, cursor="hand2").pack(side="right", padx=12)
        self._status = tk.StringVar(value="Ready — set inputs and press RUN")
        tk.Label(ab, textvariable=self._status, bg=BG, fg=LABEL,
                 font=FL).pack(side="right", padx=8)

    # ── Equipment Parameters ──────────────────────────────────────────────────
    def _params_tab(self, parent):
        frm = scrolled(parent)
        cols = tk.Frame(frm, bg=BG)
        cols.pack(fill="both", expand=True, padx=4, pady=4)

        # ── Left column — EC3B HX parameters ─────────────────────────────────
        lo = tk.Frame(cols, bg=ACCENT)
        li = tk.Frame(lo, bg=PANEL)
        li.pack(fill="both", expand=True, padx=1, pady=1)
        hdr = tk.Frame(li, bg=ACCENT); hdr.pack(fill="x")
        tk.Label(hdr, text="  EC3B  —  Economizer 3B  (1540-HX-002)",
                 bg=ACCENT, fg="white", font=FH, anchor="w",
                 padx=8, pady=4).pack(side="left")
        lo.grid(row=0, column=0, sticky="nsew", padx=6, pady=6)
        self.p = {}
        r = 0
        for label, key, default, unit in [
            ("Econ 3B HT Area",         "ec3b_ht_area",    18000, "ft²"),
            ("Gas Inlet Duct Dia",       "ec3b_gas_in_duct",  6.5, "ft"),
            ("Gas Outlet Duct Dia",      "ec3b_gas_out_duct", 6.5, "ft"),
            ("Econ 3B Water dP₀",        "ec3b_water_dp0",   15.0, "psi"),
            ("Water dP Rating Factor",   "ec3b_water_dpf",    1.7, ""),
            ("Process Gas dP₀",          "ec3b_gas_dp0",      9.0, "in WC"),
            ("Gas dP Rating Factor",     "ec3b_gas_dpf",      1.7, ""),
            ("Econ 3B Pipe Diameter",    "ec3b_pipe_dia",     8.0, "in"),
        ]:
            self.p[key] = mk_entry(li, label, default, r, unit=unit)
            r += 1

        # ── Right column — U and control valve ────────────────────────────────
        ro = tk.Frame(cols, bg=ACCENT2)
        ri = tk.Frame(ro, bg=PANEL)
        ri.pack(fill="both", expand=True, padx=1, pady=1)
        hdr2 = tk.Frame(ri, bg=ACCENT2); hdr2.pack(fill="x")
        tk.Label(hdr2, text="  Heat Transfer & Control Valve",
                 bg=ACCENT2, fg="white", font=FH, anchor="w",
                 padx=8, pady=4).pack(side="left")
        ro.grid(row=0, column=1, sticky="nsew", padx=6, pady=6)
        r = 0
        for label, key, default, unit in [
            ("Econ 3B Uo",            "ec3b_uo",       20.0, "BTU/ft²·°F·hr"),
            ("──── TCV-7224  ────",  "",               "",   ""),
            ("Control Valve Char.",   "ec3b_cv_type","Equal Percentage",""),
            ("Cv Max",                "ec3b_cv_max",  548.0, ""),
            ("Rangeability (R)",      "ec3b_cv_range",   85, ""),
            ("──── Hydraulics ────",  "",               "",   ""),
            ("Valve Upstream P",      "valve_upstream_p",178.55,"PSIG"),
            ("Downstream P",          "downstream_p",  157.0, "PSIG"),
            ("Friction Loss",         "friction_loss_ft",0.906,"ft"),
            ("Velocity",              "velocity_fps",   2.22, "ft/s"),
            ("dP Orifice",            "dp_orifice_psi",40.387,"psi"),
        ]:
            if label.startswith("────"):
                mk_sep(ri, label.strip("─ "), r, span=3, color=ACCENT2)
                r += 2
                continue
            self.p[key] = mk_entry(ri, label, default, r, unit=unit,
                                   w=18 if isinstance(default, str) else 10)
            r += 1

        cols.columnconfigure(0, weight=1)
        cols.columnconfigure(1, weight=1)

        # ── Dynamic parameters ────────────────────────────────────────────────
        do = tk.Frame(frm, bg=ACCENT4)
        di = tk.Frame(do, bg=PANEL)
        di.pack(fill="both", expand=True, padx=1, pady=1)
        hdr3 = tk.Frame(di, bg=ACCENT4); hdr3.pack(fill="x")
        tk.Label(hdr3, text="  Dynamic Simulation Parameters (TIC-7224 Loop)",
                 bg=ACCENT4, fg="white", font=FH, anchor="w",
                 padx=8, pady=4).pack(side="left")
        do.pack(fill="x", padx=10, pady=6)
        self.dyn_p = {}
        r = 0
        for label, key, val, unit in [
            ("Valve Actuator τ",    "dyn_tau_valve",  30.0, "s"),
            ("Process τ",           "dyn_tau_proc",  120.0, "s"),
            ("Dead Time",           "dyn_dead_time",  30.0, "s"),
            ("LPF τ",               "dyn_tau_lpf",    15.0, "s"),
            ("Time Step dt",        "dyn_dt",          5.0, "s"),
            ("Sim Duration",        "dyn_t_end",     600.0, "s"),
        ]:
            self.dyn_p[key] = mk_entry(di, label, val, r // 2,
                                       col=(r % 2) * 3, unit=unit, w=8)
            r += 1

    # ── Stream Inputs ─────────────────────────────────────────────────────────
    def _inputs_tab(self, parent):
        frm = scrolled(parent)
        self.i = {}

        # Gas inlet — Stream 15
        go = tk.Frame(frm, bg=ACCENT)
        gi = tk.Frame(go, bg=PANEL)
        gi.pack(fill="both", expand=True, padx=1, pady=1)
        hdr = tk.Frame(gi, bg=ACCENT); hdr.pack(fill="x")
        tk.Label(hdr, text="  Stream #15 — EC3B Gas Inlet  (Hot Gas from CIP)  [GEB0]",
                 bg=ACCENT, fg="white", font=FH, anchor="w",
                 padx=8, pady=4).pack(side="left")
        go.pack(fill="x", padx=8, pady=6)
        r = 0
        for comp, val in [("SO2", 480), ("SO3", 12148), ("O2", 4300),
                          ("N2", 86808), ("H2O", 0), ("H2SO4", 0)]:
            self.i[f"gas_{comp}"] = mk_entry(gi, comp, val, r // 2,
                                              col=(r % 2) * 3, unit="scfm")
            r += 1
        self.i["gas_pressure"] = mk_entry(gi, "PRESSURE", 101, r // 2,
                                           col=(r % 2) * 3, unit="in WC")
        r += 1
        self.i["gas_temp"] = mk_entry(gi, "TEMPERATURE", 548, r // 2,
                                       col=(r % 2) * 3, unit="°F")

        # BFW inlet — Stream 803A
        wo = tk.Frame(frm, bg=WATER)
        wi = tk.Frame(wo, bg=PANEL)
        wi.pack(fill="both", expand=True, padx=1, pady=1)
        hdr2 = tk.Frame(wi, bg=WATER); hdr2.pack(fill="x")
        tk.Label(hdr2,
                 text="  Stream #803A — EC3B BFW Inlet  (from Econ 4A)  [WEC0]",
                 bg=WATER, fg="white", font=FH, anchor="w",
                 padx=8, pady=4).pack(side="left")
        wo.pack(fill="x", padx=8, pady=6)
        r = 0
        for label, key, val, unit in [
            ("FLOW",        "water_flow",  269418, "LB/HR"),
            ("PRESSURE",    "water_press",    969,  "PSIG"),
            ("TEMPERATURE", "water_temp",     295,  "°F"),
        ]:
            self.i[key] = mk_entry(wi, label, val, r, unit=unit)
            r += 1

    # ── HX Results ───────────────────────────────────────────────────────────
    def _results_tab(self, parent):
        frm = scrolled(parent)
        cols = tk.Frame(frm, bg=BG)
        cols.pack(fill="both", expand=True, padx=4, pady=4)
        self.o = {}

        # ── Left: HX performance ──────────────────────────────────────────────
        lo = tk.Frame(cols, bg=ACCENT)
        li = tk.Frame(lo, bg=PANEL)
        li.pack(fill="both", expand=True, padx=1, pady=1)
        hdr = tk.Frame(li, bg=ACCENT); hdr.pack(fill="x")
        tk.Label(hdr, text="  EC3B Heat Transfer Results",
                 bg=ACCENT, fg="white", font=FH, anchor="w",
                 padx=8, pady=4).pack(side="left")
        lo.grid(row=0, column=0, sticky="nsew", padx=6, pady=6)
        r = 0
        for lbl, fld, unit, c in [
            ("Duty",              "duty",           "MMBTU/hr", GREEN),
            ("Gas Inlet Temp",    "gas_in_temp",    "°F",       ORANGE),
            ("Gas Outlet Temp",   "gas_out_temp",   "°F",       ORANGE),
            ("Water Inlet Temp",  "water_in_temp",  "°F",       WATER),
            ("Water Outlet Temp", "water_out_temp", "°F",       WATER),
            ("Mixed BFW Out Temp","mixed_T_out",    "°F",       TEAL),
            ("LMTD",              "lmtd",           "°F",       GREEN),
            ("UA",                "UA",             "BTU/hr·°F",GREEN),
            ("U₀ (rated)",        "uo_rated",       "BTU/ft²·°F·hr", GREEN),
            ("Gas Side dP",       "gas_dp",         "in WC",    ORANGE),
            ("Water Side dP",     "water_dp",       "psi",      WATER),
        ]:
            self.o[fld] = mk_out(li, lbl, r, unit=unit, color=c)
            r += 1

        # ── Right: Valve hydraulics ───────────────────────────────────────────
        ro = tk.Frame(cols, bg=ACCENT2)
        ri = tk.Frame(ro, bg=PANEL)
        ri.pack(fill="both", expand=True, padx=1, pady=1)
        hdr2 = tk.Frame(ri, bg=ACCENT2); hdr2.pack(fill="x")
        tk.Label(hdr2, text="  Econ 3B Valve Hydraulic Results  (TCV-7224)",
                 bg=ACCENT2, fg="white", font=FH, anchor="w",
                 padx=8, pady=4).pack(side="left")
        ro.grid(row=0, column=1, sticky="nsew", padx=6, pady=6)
        r = 0
        for lbl, fld, unit, c in [
            ("Velocity",         "velocity",       "ft/s",  BLUE),
            ("Friction Loss",    "friction_loss",  "ft",    BLUE),
            ("Valve Inlet P",    "valve_inlet_p",  "PSIG",  ORANGE),
            ("Downstream P",     "downstream_p",   "PSIG",  ORANGE),
            ("Valve ΔP",         "valve_dp",       "psi",   RED),
            ("dP Orifice",       "dp_orifice",     "psi",   ORANGE),
            ("Cv Required",      "cv_required",    "",      BLUE),
            ("Controller Output","controller_out", "%",     GREEN),
            ("──── PID / CV ────", None, "", ACCENT2),
            ("Valve Position",   "valve_pos",      "%",     GREEN),
            ("PID Output",       "pid_output",     "mA",    GREEN),
        ]:
            if fld is None:
                mk_sep(ri, lbl.strip("─ "), r, span=3, color=ACCENT2)
                r += 2
                continue
            self.o[fld] = mk_out(ri, lbl, r, unit=unit, color=c)
            r += 1

        cols.columnconfigure(0, weight=1)
        cols.columnconfigure(1, weight=1)

        # Summary bar
        so = tk.Frame(frm, bg=ACCENT3)
        si = tk.Frame(so, bg=PANEL)
        si.pack(fill="both", expand=True, padx=1, pady=1)
        hdr3 = tk.Frame(si, bg=ACCENT3); hdr3.pack(fill="x")
        tk.Label(hdr3, text="  Overall Heat & Material Balance Summary",
                 bg=ACCENT3, fg="white", font=FH, anchor="w",
                 padx=8, pady=4).pack(side="left")
        so.pack(fill="x", padx=8, pady=6)
        self.o_sum = {}
        r = 0
        for lbl, fld, unit, c in [
            ("Total Duty",        "duty",          "MMBTU/hr", GREEN),
            ("Gas Inlet Temp",    "gas_T_in",      "°F",       ORANGE),
            ("Gas Outlet Temp",   "gas_T_out",     "°F",       ORANGE),
            ("IPAT Setpoint",     "ipat_setpt",    "°F",       TEAL),
            ("Gas Flow",          "gas_flow",      "LB/HR",    BLUE),
            ("BFW Total Flow In", "water_flow_in", "LB/HR",    WATER),
            ("BFW Through CV",    "water_flow_cv", "LB/HR",    WATER),
            ("BFW Mixed Out",     "water_flow_mix","LB/HR",    WATER),
            ("Mixed BFW Temp",    "mixed_T_out",   "°F",       TEAL),
            ("Valve Position",    "valve_pos",     "%",        GREEN),
        ]:
            self.o_sum[fld] = mk_out(si, lbl, r // 2, col=(r % 2) * 3,
                                     unit=unit, color=c, w=12)
            r += 1

    # ── Stream Outputs tab ────────────────────────────────────────────────────
    def _streams_tab(self, parent):
        frm = scrolled(parent)

        GROUPS = [
            ("PROCESS GAS STREAMS", ACCENT, [
                ("s15", "Stream #15 — EC3B Gas Inlet (CIP)",   "GEB0",  "gas"),
                ("s16", "Stream #16 — EC3B Gas Outlet (IPAT)", "GEB1",  "gas"),
            ]),
            ("BFW / WATER STREAMS", WATER, [
                ("s803A", "Stream #803A — BFW Inlet (from Econ 4A)",    "WEC0",    "water"),
                ("s804B", "Stream #804B — BFW After TCV-7224 (actual)", "WEC_CV",  "water"),
                ("s804C", "Stream #804C — EC3B BFW Outlet (heated)",    "WEC_OUT", "water"),
                ("s804D", "Stream #804D — EC3B Bypass Flow",            "WEC_BYP", "water"),
                ("s804E", "Stream #804E — Bypass Valve Outlet",         "WEC_BYPO","water"),
                ("s805",  "Stream #805 — Mixed BFW → to Econ 4C",      "WEC_MIX", "water"),
            ]),
        ]

        for grp_title, grp_color, streams in GROUPS:
            ghdr = tk.Frame(frm, bg=BG)
            ghdr.pack(fill="x", padx=8, pady=(10, 2))
            tk.Frame(ghdr, bg=grp_color, height=2).pack(fill="x")
            tk.Label(ghdr, text=f"  {grp_title}",
                     bg=BG, fg=grp_color, font=FH, anchor="w").pack(
                         anchor="w", pady=2)

            grid_f = tk.Frame(frm, bg=BG)
            grid_f.pack(fill="x", padx=4, pady=2)
            ncols = min(len(streams), 4)
            for i, (key, title, tag, kind) in enumerate(streams):
                sc = StreamCard(grid_f, title, tag, kind, grp_color,
                                gr=i // ncols, gc=i % ncols)
                self._scards[key] = sc
            for c in range(ncols):
                grid_f.columnconfigure(c, weight=1)

    # ── Dynamic Response tab ──────────────────────────────────────────────────
    def _dynamic_tab(self, parent):
        frm = tk.Frame(parent, bg=BG)
        frm.pack(fill="both", expand=True)

        info = tk.Frame(frm, bg=PANEL2)
        info.pack(fill="x", padx=8, pady=8)
        tk.Label(info,
                 text="  TIC-7224 Dynamic Response — First-Order + Dead-Time + LPF",
                 bg=PANEL2, fg=TEAL, font=FH, anchor="w",
                 padx=8, pady=6).pack(side="left")
        tk.Label(info, text="Run calculation in Dynamic mode to populate",
                 bg=PANEL2, fg=LABEL, font=FL, padx=8).pack(side="right")

        plot_row = tk.Frame(frm, bg=BG)
        plot_row.pack(fill="both", expand=True, padx=8, pady=4)
        plot_row.columnconfigure(0, weight=1)
        plot_row.columnconfigure(1, weight=1)
        plot_row.rowconfigure(0, weight=1)

        # Gas outlet temperature response
        gf = tk.Frame(plot_row, bg=PANEL)
        gf.grid(row=0, column=0, sticky="nsew", padx=4, pady=4)
        tk.Label(gf, text="  EC3B Gas Outlet Temperature  (IPAT Response)",
                 bg=PANEL, fg=ACCENT, font=FH, anchor="w",
                 padx=8, pady=4).pack(fill="x")
        self._gas_canvas = tk.Canvas(gf, bg="#0d1117", highlightthickness=0)
        self._gas_canvas.pack(fill="both", expand=True, padx=4, pady=4)

        # Valve position
        vf = tk.Frame(plot_row, bg=PANEL)
        vf.grid(row=0, column=1, sticky="nsew", padx=4, pady=4)
        tk.Label(vf, text="  TCV-7224 Valve Position & PID Output",
                 bg=PANEL, fg=ACCENT2, font=FH, anchor="w",
                 padx=8, pady=4).pack(fill="x")
        self._val_canvas = tk.Canvas(vf, bg="#0d1117", highlightthickness=0)
        self._val_canvas.pack(fill="both", expand=True, padx=4, pady=4)

    def _draw_chart(self, canvas, t, series_list, title):
        """
        series_list = [(y_values, color, label), ...]
        """
        canvas.update_idletasks()
        W = canvas.winfo_width()  or 500
        H = canvas.winfo_height() or 280
        canvas.delete("all")
        if not t or len(t) < 2:
            canvas.create_text(W // 2, H // 2, text="No data",
                               fill=LABEL, font=FL)
            return
        PAD = 55
        cw = W - PAD * 2
        ch = H - PAD * 2
        t_max = max(t)
        all_y = [v for s, c, l in series_list for v in s]
        y_min = min(all_y) - abs(min(all_y)) * 0.05 - 2
        y_max = max(all_y) + abs(max(all_y)) * 0.05 + 2

        def tx(t_): return PAD + (t_ / t_max) * cw if t_max > 0 else PAD
        def ty(y_): return (H - PAD - ((y_ - y_min) / max(y_max - y_min, 1)) * ch)

        # Axes
        canvas.create_line(PAD, PAD, PAD, H - PAD, fill=BORDER, width=1)
        canvas.create_line(PAD, H - PAD, W - PAD, H - PAD, fill=BORDER, width=1)

        # Grid
        for i in range(5):
            yv = y_min + i * (y_max - y_min) / 4
            yp = ty(yv)
            canvas.create_line(PAD, yp, W - PAD, yp,
                               fill=BORDER, dash=(2, 4))
            canvas.create_text(PAD - 5, yp, text=f"{yv:.1f}",
                               fill=LABEL, font=("Consolas", 7), anchor="e")
        for i in range(6):
            tv = t_max * i / 5
            xp = tx(tv)
            canvas.create_line(xp, PAD, xp, H - PAD,
                               fill=BORDER, dash=(2, 4))
            canvas.create_text(xp, H - PAD + 10, text=f"{tv:.0f}s",
                               fill=LABEL, font=("Consolas", 7))

        # Series
        for y_vals, color, lbl in series_list:
            pts = [(tx(t[i]), ty(y_vals[i])) for i in range(len(t))]
            for i in range(len(pts) - 1):
                canvas.create_line(pts[i][0], pts[i][1],
                                   pts[i + 1][0], pts[i + 1][1],
                                   fill=color, width=2)
            if pts:
                canvas.create_text(pts[-1][0] + 4, pts[-1][1],
                                   text=lbl, fill=color,
                                   font=("Consolas", 7), anchor="w")

        canvas.create_text(PAD + 5, PAD - 10, text=title,
                           fill=TEXT, font=FSB, anchor="w")

    # ── Collect inputs ────────────────────────────────────────────────────────
    def _get_inp(self):
        d = {}
        for k, v in self.p.items():
            try:    d[k] = float(v.get())
            except: d[k] = v.get()
        for k, v in self.i.items():
            try:    d[k] = float(v.get())
            except: d[k] = v.get()
        for k, v in self.dyn_p.items():
            try:    d[k] = float(v.get())
            except: d[k] = v.get()
        try:    d["ipat_setpt"] = float(self.t_ipat_sp.get())
        except: d["ipat_setpt"] = 330.0
        d["sim_mode"] = self._sim_mode.get()
        return d

    # ── Run ───────────────────────────────────────────────────────────────────
    def _run(self):
        if _calc is None:
            messagebox.showwarning("Missing",
                "ec3b_calculator.py not found in same folder.")
            return
        try:
            self._status.set("⏳  Calculating...")
            self.update_idletasks()
            inp = self._get_inp()
            res = _calc.run(inp)
            self._populate(res, inp)
            mode = inp.get("sim_mode", "static")
            e = res["ec3b"]
            self._status.set(
                f"✓  {'Static' if mode=='static' else 'Dynamic'} complete — "
                f"Gas Outlet: {e['gas_out_temp']:.1f}°F  "
                f"(SP={inp['ipat_setpt']:.0f}°F)  |  "
                f"TCV-7224: {e['valve_pos']:.1f}%  "
                f"PID={e['pid_output']:.4f} mA")
        except Exception as ex:
            self._status.set(f"✗  Error: {ex}")
            messagebox.showerror("Calculation Error", str(ex))

    def _populate(self, res, inp):
        def sv(v, val, fmt=".2f"):
            try:    v.set(format(val, fmt))
            except: v.set(str(val))

        e  = res["ec3b"]
        sm = res["summary"]

        # HX result panel
        sv(self.o["duty"],          e["duty"],          ".3f")
        sv(self.o["gas_in_temp"],   inp["gas_temp"],     ".1f")
        sv(self.o["gas_out_temp"],  e["gas_out_temp"],   ".2f")
        sv(self.o["water_in_temp"], inp["water_temp"],   ".1f")
        sv(self.o["water_out_temp"],e["water_out_temp"], ".1f")
        sv(self.o["mixed_T_out"],   sm["mixed_T_out"],   ".1f")
        sv(self.o["lmtd"],          e["lmtd"],           ".1f")
        sv(self.o["UA"],            e["UA"],             ",.0f")
        sv(self.o["uo_rated"],      e["uo_rated"],       ".3f")
        sv(self.o["gas_dp"],        e["gas_dp"],         ".2f")
        sv(self.o["water_dp"],      e["water_dp"],       ".3f")

        # Hydraulics panel
        sv(self.o["velocity"],       e["velocity"],       ".2f")
        sv(self.o["friction_loss"],  e["friction_loss"],  ".3f")
        sv(self.o["valve_inlet_p"],  e["valve_inlet_p"],  ".2f")
        sv(self.o["downstream_p"],   e["downstream_p"],   ".0f")
        sv(self.o["valve_dp"],       e["valve_dp"],       ".3f")
        sv(self.o["dp_orifice"],     e["dp_orifice"],     ".3f")
        sv(self.o["cv_required"],    e["cv_required"],    ".4f")
        sv(self.o["controller_out"], e["controller_out"], ".2f")
        sv(self.o["valve_pos"],      e["valve_pos"],      ".4f")
        sv(self.o["pid_output"],     e["pid_output"],     ".4f")

        # Summary
        sv(self.o_sum["duty"],          e["duty"],             ".3f")
        sv(self.o_sum["gas_T_in"],      sm["gas_T_in"],        ".1f")
        sv(self.o_sum["gas_T_out"],     sm["gas_T_out"],       ".1f")
        sv(self.o_sum["ipat_setpt"],    sm["ipat_setpt"],      ".1f")
        sv(self.o_sum["gas_flow"],      sm["gas_flow"],        ",.0f")
        sv(self.o_sum["water_flow_in"], sm["water_flow_in"],   ",.0f")
        sv(self.o_sum["water_flow_cv"], sm["water_flow_cv"],   ",.0f")
        sv(self.o_sum["water_flow_mix"],sm["water_flow_mix"],  ",.0f")
        sv(self.o_sum["mixed_T_out"],   sm["mixed_T_out"],     ".1f")
        sv(self.o_sum["valve_pos"],     sm["valve_pos"],       ".2f")

        # Stream cards
        for key, sc in self._scards.items():
            if key in res["streams"]:
                sc.update(res["streams"][key])

        # Dynamic charts
        if "dynamic" in res:
            dyn = res["dynamic"]
            self.after(100, lambda: self._draw_chart(
                self._gas_canvas, dyn["t"],
                [(dyn["gas_out"],  ACCENT,  "Gas Outlet T"),
                 (dyn["lpf_temp"], TEAL,    "LPF Meas."),
                 (dyn["setpt"],    ORANGE,  f"SP={inp['ipat_setpt']:.0f}°F")],
                "IPAT Gas Outlet Temperature Response"))
            self.after(100, lambda: self._draw_chart(
                self._val_canvas, dyn["t"],
                [(dyn["cv_pos"],    ACCENT3, "Valve Pos %"),
                 (dyn["pid_output"],ACCENT2, "PID mA")],
                "TCV-7224 Valve Position & PID Output"))
            self._nb.select(4)

    def _reset(self):
        self.destroy()
        App().mainloop()

    def _export(self):
        import tkinter.filedialog as fd
        path = fd.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON", "*.json"), ("All", "*.*")],
            title="Export EC3B Inputs as JSON")
        if path:
            with open(path, "w") as f:
                json.dump(self._get_inp(), f, indent=2)
            messagebox.showinfo("Exported", f"Saved:\n{path}")


if __name__ == "__main__":
    App().mainloop()
