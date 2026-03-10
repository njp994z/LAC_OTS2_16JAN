"""
sh4a_ec4c_ec4a_gui.py
HP Superheater 4A / Economizer 4C / Economizer 4A
1540-HX-004 / 006 / 007

Requires sh4a_ec4c_ec4a_calculator.py in the same folder.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import json, os, importlib.util, threading

# ── Load calculator ───────────────────────────────────────────────────────────
_CALC_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "sh4a_ec4c_ec4a_calculator.py")
_calc = None
if os.path.exists(_CALC_PATH):
    spec = importlib.util.spec_from_file_location("calc", _CALC_PATH)
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

def mk_entry(parent, label, default, row, col=0, unit="", w=11, color=EFG, colspan=1):
    tk.Label(parent, text=label, bg=PANEL, fg=LABEL, font=FL,
             anchor="w").grid(row=row, column=col, sticky="w", padx=(8,2), pady=2)
    var = tk.StringVar(value=str(default))
    e = tk.Entry(parent, textvariable=var, bg=EBKG, fg=color, font=FE, width=w,
                 insertbackground=TEXT, relief="flat",
                 highlightbackground=BORDER, highlightcolor=ACCENT,
                 highlightthickness=1)
    e.grid(row=row, column=col+1, sticky="w", padx=2, pady=2, columnspan=colspan)
    if unit:
        tk.Label(parent, text=unit, bg=PANEL, fg=LABEL,
                 font=FS).grid(row=row, column=col+2, sticky="w", padx=(0,6))
    return var


def mk_out(parent, label, row, col=0, unit="", color=GREEN, w=13):
    tk.Label(parent, text=label, bg=PANEL, fg=LABEL, font=FL,
             anchor="w").grid(row=row, column=col, sticky="w", padx=(8,2), pady=2)
    var = tk.StringVar(value="---")
    tk.Label(parent, textvariable=var, bg=PANEL, fg=color, font=FO,
             width=w, anchor="w").grid(row=row, column=col+1, sticky="w", padx=2)
    if unit:
        tk.Label(parent, text=unit, bg=PANEL, fg=LABEL,
                 font=FS).grid(row=row, column=col+2, sticky="w", padx=(0,6))
    return var


def mk_sep(parent, text, row, cols=6, color=ACCENT):
    tk.Frame(parent, bg=color, height=1).grid(
        row=row, column=0, columnspan=cols, sticky="ew", padx=8, pady=(10,0))
    tk.Label(parent, text=text, bg=PANEL, fg=color, font=FSB,
             anchor="w").grid(row=row+1, column=0, columnspan=cols,
                              sticky="w", padx=8, pady=(0,3))


def card_grid(parent, title, color=ACCENT, row=0, col=0, padx=6, pady=6):
    outer = tk.Frame(parent, bg=color)
    inner = tk.Frame(outer, bg=PANEL)
    inner.pack(fill="both", expand=True, padx=1, pady=1)
    hdr = tk.Frame(inner, bg=color); hdr.pack(fill="x")
    tk.Label(hdr, text=title, bg=color, fg="white", font=FH,
             anchor="w", padx=8, pady=4).pack(side="left")
    outer.grid(row=row, column=col, sticky="nsew", padx=padx, pady=pady)
    return outer, inner


def scrolled(parent):
    c = tk.Canvas(parent, bg=BG, highlightthickness=0)
    sb = tk.Scrollbar(parent, orient="vertical", command=c.yview)
    c.configure(yscrollcommand=sb.set)
    sb.pack(side="right", fill="y")
    c.pack(fill="both", expand=True)
    frm = tk.Frame(c, bg=BG)
    win = c.create_window((0,0), window=frm, anchor="nw")
    frm.bind("<Configure>", lambda e: c.configure(scrollregion=c.bbox("all")))
    c.bind("<Configure>", lambda e: c.itemconfig(win, width=e.width))
    def _mw(e): c.yview_scroll(int(-1*(e.delta/120)), "units")
    c.bind_all("<MouseWheel>", _mw)
    return frm


# ── Compact stream display card ───────────────────────────────────────────────
class StreamCard:
    def __init__(self, grid_parent, key, title, tag, kind, color, row, col):
        outer = tk.Frame(grid_parent, bg=color)
        inner = tk.Frame(outer, bg=PANEL2)
        inner.pack(fill="both", expand=True, padx=1, pady=1)
        hdr = tk.Frame(inner, bg=color); hdr.pack(fill="x")
        tk.Label(hdr, text=title, bg=color, fg="white",
                 font=("Segoe UI",8,"bold"), anchor="w",
                 padx=5, pady=3).pack(side="left")
        tk.Label(hdr, text=tag, bg=color, fg="#ffffffbb",
                 font=("Segoe UI",8), padx=5).pack(side="right")
        outer.grid(row=row, column=col, sticky="nsew", padx=3, pady=3)

        fields = (
            [("SO2","scfm"),("SO3","scfm"),("O2","scfm"),("N2","scfm"),
             ("H2O","scfm"),("H2SO4","scfm"),("TOTAL","scfm"),
             ("PRESSURE","in WC"),("TEMPERATURE","°F")]
            if kind == "gas" else
            [("FLOW","LB/HR"),("PRESSURE","PSIG"),("TEMPERATURE","°F")]
        )
        self._kind = kind
        self._vars = {}
        for ri,(name,unit) in enumerate(fields):
            tk.Label(inner, text=name, bg=PANEL2, fg=LABEL, font=FS,
                     width=12, anchor="w").grid(row=ri, column=0, padx=(5,2),
                                                pady=1, sticky="w")
            v = tk.StringVar(value="---")
            self._vars[name] = v
            c_ = GREEN if name=="TEMPERATURE" else (ORANGE if name=="PRESSURE" else BLUE)
            tk.Label(inner, textvariable=v, bg=PANEL2, fg=c_,
                     font=FO, width=11, anchor="e").grid(row=ri, column=1,
                                                          padx=2, pady=1, sticky="e")
            tk.Label(inner, text=unit, bg=PANEL2, fg=LABEL,
                     font=FS).grid(row=ri, column=2, padx=(0,5), pady=1, sticky="w")

    def update(self, s):
        if self._kind == "gas":
            for k in ("SO2","SO3","O2","N2","H2O","H2SO4","TOTAL"):
                self._vars[k].set(f"{s.get(k,0):,.0f}")
            self._vars["PRESSURE"].set(f"{s.get('PRESSURE',0):.2f}")
            self._vars["TEMPERATURE"].set(f"{s.get('TEMPERATURE',0):.1f}")
        else:
            self._vars["FLOW"].set(f"{s.get('FLOW',0):,.0f}")
            self._vars["PRESSURE"].set(f"{s.get('PRESSURE',0):.1f}")
            self._vars["TEMPERATURE"].set(f"{s.get('TEMPERATURE',0):.1f}")


# ═════════════════════════════════════════════════════════════════════════════
# Main Application
# ═════════════════════════════════════════════════════════════════════════════

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("SH4A / EC4C / EC4A  ─  1540-HX-004 / 006 / 007")
        self.configure(bg=BG)
        self.geometry("1480x900")
        self._stream_cards = {}
        self._dyn_canvas   = None
        self._build()

    # ─────────────────────────────────────────────────────────────────────────
    def _build(self):
        # Title bar
        tbar = tk.Frame(self, bg=ACCENT)
        tbar.pack(fill="x")
        tk.Label(tbar, text="  HP SUPERHEATER 4A  /  ECONOMIZER 4C  /  ECONOMIZER 4A",
                 bg=ACCENT, fg="white", font=FT, pady=6).pack(side="left")
        tk.Label(tbar, text="1540-HX-004 / 006 / 007  ",
                 bg=ACCENT, fg="#c8deff", font=FL).pack(side="right")

        # ── Simulation mode bar ───────────────────────────────────────────────
        mbar = tk.Frame(self, bg=PANEL2, pady=6)
        mbar.pack(fill="x", padx=0)
        tk.Label(mbar, text="  Simulation Mode:", bg=PANEL2, fg=LABEL,
                 font=FH).pack(side="left", padx=(12,6))

        self._sim_mode = tk.StringVar(value="static")
        rb_style = dict(bg=PANEL2, fg=TEXT, font=FL,
                        selectcolor=PANEL2, activebackground=PANEL2,
                        activeforeground=TEXT, relief="flat")
        tk.Radiobutton(mbar, text="Static Calculation", variable=self._sim_mode,
                       value="static", command=self._mode_change,
                       **rb_style).pack(side="left", padx=4)
        tk.Radiobutton(mbar, text="Dynamic Simulation", variable=self._sim_mode,
                       value="dynamic", command=self._mode_change,
                       **rb_style).pack(side="left", padx=4)

        # Target temperatures (always visible — both modes use them)
        tk.Frame(mbar, bg=BORDER, width=2).pack(side="left", fill="y",
                                                padx=12, pady=4)
        tk.Label(mbar, text="Target Temperatures:", bg=PANEL2,
                 fg=TEAL, font=FSB).pack(side="left", padx=(4,8))

        tk.Label(mbar, text="SH 1B Outlet Temp", bg=PANEL2,
                 fg=LABEL, font=FL).pack(side="left", padx=(0,4))
        self.t_sh1b_sp = tk.StringVar(value="900")
        tk.Entry(mbar, textvariable=self.t_sh1b_sp, bg=EBKG, fg=TEAL,
                 font=FE, width=7, insertbackground=TEXT, relief="flat",
                 highlightbackground=BORDER, highlightcolor=TEAL,
                 highlightthickness=1).pack(side="left")
        tk.Label(mbar, text="°F", bg=PANEL2, fg=LABEL,
                 font=FS).pack(side="left", padx=(2,14))

        tk.Label(mbar, text="Process Gas Outlet Temp", bg=PANEL2,
                 fg=LABEL, font=FL).pack(side="left", padx=(0,4))
        self.t_ec4a_sp = tk.StringVar(value="275")
        tk.Entry(mbar, textvariable=self.t_ec4a_sp, bg=EBKG, fg=TEAL,
                 font=FE, width=7, insertbackground=TEXT, relief="flat",
                 highlightbackground=BORDER, highlightcolor=TEAL,
                 highlightthickness=1).pack(side="left")
        tk.Label(mbar, text="°F", bg=PANEL2, fg=LABEL,
                 font=FS).pack(side="left", padx=(2,4))

        # Notebook
        style = ttk.Style(); style.theme_use("clam")
        style.configure("TNotebook", background=BG, borderwidth=0)
        style.configure("TNotebook.Tab", background=PANEL, foreground=TEXT,
                        padding=[12,5], font=FL)
        style.map("TNotebook.Tab",
                  background=[("selected", ACCENT)],
                  foreground=[("selected","white")])

        self._nb = ttk.Notebook(self)
        self._nb.pack(fill="both", expand=True, padx=4, pady=2)

        self._tabs = {}
        for key, label in [("params","  Equipment Parameters  "),
                            ("inputs","  Stream Inputs  "),
                            ("results","  HX Results  "),
                            ("steam","  Steam Outputs  "),
                            ("dynamic","  Dynamic Response  ")]:
            frm = tk.Frame(self._nb, bg=BG)
            self._nb.add(frm, text=label)
            self._tabs[key] = frm

        self._params_tab(self._tabs["params"])
        self._inputs_tab(self._tabs["inputs"])
        self._results_tab(self._tabs["results"])
        self._steam_tab(self._tabs["steam"])
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

    def _mode_change(self):
        mode = self._sim_mode.get()
        # highlight dynamic tab when active
        for i,k in enumerate(["params","inputs","results","steam","dynamic"]):
            pass  # tab highlighting handled by ttk selection

    # ── Equipment Parameters ─────────────────────────────────────────────────
    def _params_tab(self, parent):
        frm = scrolled(parent)
        cols = tk.Frame(frm, bg=BG)
        cols.pack(fill="both", expand=True, padx=4, pady=4)

        col_defs = [
            ("  SH 4A  —  HP Superheater", ACCENT, [
                ("HT Area",           "sh_ht_area",     18000, "ft²"),
                ("Overall U₀",        "sh_uo",          15.0,  "BTU/ft²·°F·hr"),
                ("Pipe Diameter",     "sh_pipe_dia",    12.0,  "in"),
                ("Gas Inlet Duct Dia","sh_gas_in_duct", 6.5,   "ft"),
                ("Steam dP₀",         "sh_steam_dp0",   15.0,  "psi"),
                ("Steam dP Factor",   "sh_dp_factor",   1.7,   ""),
                ("──── Control Valve ────","","",""),
                ("Characteristic",    "sh_cv_type", "Equal Percentage",""),
                ("Cv Max",            "sh_cv_max",      1000.0,""),
                ("Rangeability (R)",  "sh_cv_range",    85,    ""),
                ("──── SH 1B Input ────","","",""),
                ("SH 1B Duty",        "sh1b_duty",      38.6,  "MMBTU/hr"),
            ]),
            ("  EC 4C  —  Economizer 4C", ACCENT2, [
                ("HT Area",           "ec4c_ht_area",   13000, "ft²"),
                ("Overall U₀",        "ec4c_uo",        15.0,  "BTU/ft²·°F·hr"),
                ("Gas Out Duct Dia",  "ec4c_gas_out_duct",6.0, "ft"),
                ("Steam dP₀",         "ec4c_steam_dp0", 15.0,  "psi"),
                ("Steam dP Factor",   "ec4c_dp_factor", 1.7,   ""),
                ("Gas dP₀",           "ec4c_proc_dp0",  11.0,  "in WC"),
                ("Gas dP Factor",     "ec4c_proc_dpf",  1.7,   ""),
            ]),
            ("  EC 4A  —  Economizer 4A", ACCENT3, [
                ("HT Area",           "ec4a_ht_area",   15000, "ft²"),
                ("Overall U₀",        "ec4a_uo",        15.0,  "BTU/ft²·°F·hr"),
                ("Pipe Diameter",     "ec4a_pipe_dia",  8.0,   "in"),
                ("Steam dP₀",         "ec4a_steam_dp0", 15.0,  "psi"),
                ("Steam dP Factor",   "ec4a_dp_factor", 1.7,   ""),
                ("Econ 4C Steam dP₀", "ec4c_steam_dp0_b",15.0,"psi"),
                ("Econ 4C dP Factor", "ec4c_dp_factor_b",1.7, ""),
                ("──── Control Valve ────","","",""),
                ("Characteristic",    "ec4a_cv_type","Equal Percentage",""),
                ("Cv Max",            "ec4a_cv_max",    548.0, ""),
                ("Rangeability (R)",  "ec4a_cv_range",  85,    ""),
            ]),
        ]

        for ci, (title, color, fields) in enumerate(col_defs):
            outer = tk.Frame(cols, bg=color)
            inner = tk.Frame(outer, bg=PANEL)
            inner.pack(fill="both", expand=True, padx=1, pady=1)
            hdr = tk.Frame(inner, bg=color); hdr.pack(fill="x")
            tk.Label(hdr, text=title, bg=color, fg="white", font=FH,
                     anchor="w", padx=8, pady=4).pack(side="left")
            outer.grid(row=0, column=ci, sticky="nsew", padx=6, pady=6)
            r = 0
            for label, key, default, unit in fields:
                if label.startswith("────"):
                    tk.Label(inner, text=label, bg=PANEL, fg=color,
                             font=("Segoe UI",8,"bold")).grid(
                             row=r, column=0, columnspan=3, sticky="w",
                             padx=8, pady=(8,2)); r+=1
                    continue
                v = mk_entry(inner, label, default, r, unit=unit,
                             w=18 if isinstance(default,str) else 10)
                setattr(self, f"p_{key}", v); r+=1

        for i in range(3): cols.columnconfigure(i, weight=1)

        # Dynamic parameters section
        dyn_outer = tk.Frame(frm, bg=ACCENT4)
        dyn_inner = tk.Frame(dyn_outer, bg=PANEL)
        dyn_inner.pack(fill="both", expand=True, padx=1, pady=1)
        hdr = tk.Frame(dyn_inner, bg=ACCENT4); hdr.pack(fill="x")
        tk.Label(hdr, text="  Dynamic Simulation Parameters", bg=ACCENT4,
                 fg="white", font=FH, anchor="w", padx=8, pady=4).pack(side="left")
        dyn_outer.pack(fill="x", padx=10, pady=6)

        r = 0
        self.dyn_vars = {}
        for label, key, val, unit in [
            ("Valve Tau",     "dyn_tau_valve", 30.0,  "s"),
            ("Process Tau",   "dyn_tau_proc",  120.0, "s"),
            ("Dead Time",     "dyn_dead_time", 30.0,  "s"),
            ("Time Step dt",  "dyn_dt",        5.0,   "s"),
            ("Sim Duration",  "dyn_t_end",     600.0, "s"),
        ]:
            self.dyn_vars[key] = mk_entry(dyn_inner, label, val, r//2,
                                           col=(r%2)*3, unit=unit, w=8)
            r += 1

    # ── Stream Inputs ─────────────────────────────────────────────────────────
    def _inputs_tab(self, parent):
        frm = scrolled(parent)
        self.i_vars = {}

        # Process gas
        pg_outer = tk.Frame(frm, bg=ACCENT)
        pg_inner = tk.Frame(pg_outer, bg=PANEL)
        pg_inner.pack(fill="both", expand=True, padx=1, pady=1)
        hdr = tk.Frame(pg_inner, bg=ACCENT); hdr.pack(fill="x")
        tk.Label(hdr, text="  Stream #20 — Process Gas SH4A Inlet (GSA0)",
                 bg=ACCENT, fg="white", font=FH, anchor="w",
                 padx=8, pady=4).pack(side="left")
        pg_outer.pack(fill="x", padx=8, pady=6)
        r = 0
        for comp, val in [("SO2",18),("SO3",462),("O2",4069),
                          ("N2",86808),("H2O",0),("H2SO4",0)]:
            self.i_vars[f"gas_{comp}"] = mk_entry(pg_inner, comp, val, r//2,
                                                   col=(r%2)*3, unit="scfm"); r+=1
        self.i_vars["gas_pressure"]    = mk_entry(pg_inner,"PRESSURE",   47,  r//2,col=(r%2)*3,unit="in WC"); r+=1
        self.i_vars["gas_temp"]        = mk_entry(pg_inner,"TEMPERATURE",808, r//2,col=(r%2)*3,unit="°F");    r+=1

        # Steam inlets
        st_outer = tk.Frame(frm, bg=ACCENT4)
        st_inner = tk.Frame(st_outer, bg=PANEL)
        st_inner.pack(fill="both", expand=True, padx=1, pady=1)
        hdr2 = tk.Frame(st_inner, bg=ACCENT4); hdr2.pack(fill="x")
        tk.Label(hdr2, text="  Steam / BFW Inlet Streams",
                 bg=ACCENT4, fg="white", font=FH, anchor="w",
                 padx=8, pady=4).pack(side="left")
        st_outer.pack(fill="x", padx=8, pady=6)
        r = 0
        for grp_label, keys in [
            ("Stream #806 — SH4A Steam Inlet (SSA0)",
             [("sh_steam_flow",269418,"LB/HR"),("sh_steam_press",915,"PSIG"),
              ("sh_steam_temp",536,"°F")]),
            ("Stream #805 — EC4C BFW Inlet (SEC0)",
             [("ec4c_steam_flow",264418,"LB/HR"),("ec4c_steam_press",951,"PSIG"),
              ("ec4c_steam_temp",401,"°F")]),
            ("Stream #803A — EC4A BFW Inlet (SEA0)",
             [("ec4a_steam_flow",264418,"LB/HR"),("ec4a_steam_press",978,"PSIG"),
              ("ec4a_steam_temp",223,"°F")]),
        ]:
            tk.Label(st_inner, text=grp_label, bg=PANEL, fg=ACCENT2,
                     font=FSB).grid(row=r, column=0, columnspan=9,
                                    sticky="w", padx=8, pady=(8,2)); r+=1
            c = 0
            for key, val, unit in keys:
                self.i_vars[key] = mk_entry(st_inner,
                    key.split("_",1)[1].replace("_"," ").upper(),
                    val, r, col=c, unit=unit, w=10); c+=3
            r += 1

    # ── HX Results ───────────────────────────────────────────────────────────
    def _results_tab(self, parent):
        frm = scrolled(parent)
        cols = tk.Frame(frm, bg=BG)
        cols.pack(fill="both", expand=True, padx=4, pady=4)
        self.o = {}

        for ci,(key,title,color) in enumerate([
            ("sh",   "  SH 4A Results",  ACCENT),
            ("ec4c", "  EC 4C Results",  ACCENT2),
            ("ec4a", "  EC 4A Results",  ACCENT3),
        ]):
            outer = tk.Frame(cols, bg=color)
            inner = tk.Frame(outer, bg=PANEL)
            inner.pack(fill="both", expand=True, padx=1, pady=1)
            hdr = tk.Frame(inner, bg=color); hdr.pack(fill="x")
            tk.Label(hdr, text=title, bg=color, fg="white", font=FH,
                     anchor="w", padx=8, pady=4).pack(side="left")
            outer.grid(row=0, column=ci, sticky="nsew", padx=6, pady=6)
            self.o[key] = {}
            r = 0

            base_fields = [
                ("Duty",             "duty",          "MMBTU/hr", GREEN),
                ("Gas Outlet Temp",  "gas_out_temp",  "°F",       ORANGE),
                ("Steam Outlet Temp","steam_out_temp","°F",       ACCENT4),
                ("Steam Flow",       "steam_flow",    "LB/HR",    BLUE),
                ("LMTD",             "lmtd",          "°F",       GREEN),
                ("UA",               "UA",            "BTU/hr·°F",GREEN),
                ("U₀ (rated)",       "uo_rated",      "BTU/ft²·°F·hr",GREEN),
                ("Gas Side dP",      "gas_dp",        "in WC",    ORANGE),
                ("Steam Side dP",    "steam_dp",      "psi",      ORANGE),
            ]
            if key == "sh":
                base_fields += [
                    ("──── SH 1B ────", None, "", TEAL),
                    ("SH 1B Duty",      "sh1b_duty",     "MMBTU/hr", TEAL),
                    ("Total SH Duty",   "total_sh_duty", "MMBTU/hr", TEAL),
                    ("SH 1B Outlet Temp","sh1b_out_temp","°F",       TEAL),
                ]

            for row_def in base_fields:
                lbl, fld, unit, c = row_def
                if fld is None:
                    mk_sep(inner, lbl, r, span=3, color=c); r+=2; continue
                self.o[key][fld] = mk_out(inner, lbl, r, unit=unit, color=c); r+=1

            if key in ("sh","ec4a"):
                mk_sep(inner, "Control Valve", r, span=3, color=color); r+=2
                cv_fields = [
                    ("Valve Position", "valve_pos",   "%",   GREEN),
                    ("PID Output",     "pid_output",  "mA",  GREEN),
                    ("Cv Required",    "cv_required", "",    BLUE),
                    ("Valve ΔP",       "valve_dp",    "psi", ORANGE),
                ]
                for lbl,fld,unit,c in cv_fields:
                    self.o[key][fld] = mk_out(inner, lbl, r, unit=unit, color=c); r+=1

        cols.columnconfigure(0, weight=1)
        cols.columnconfigure(1, weight=1)
        cols.columnconfigure(2, weight=1)

        # Summary bar
        sum_outer = tk.Frame(frm, bg=ACCENT)
        sum_inner = tk.Frame(sum_outer, bg=PANEL)
        sum_inner.pack(fill="both", expand=True, padx=1, pady=1)
        hdr = tk.Frame(sum_inner, bg=ACCENT); hdr.pack(fill="x")
        tk.Label(hdr, text="  Overall Heat & Material Balance",
                 bg=ACCENT, fg="white", font=FH, anchor="w",
                 padx=8, pady=4).pack(side="left")
        sum_outer.pack(fill="x", padx=8, pady=6)
        self.o_sum = {}
        r = 0
        for lbl,fld,unit,c in [
            ("Grand Total Duty",  "total_duty",    "MMBTU/hr", GREEN),
            ("Total SH Duty",     "total_sh_duty", "MMBTU/hr", TEAL),
            ("Gas Inlet Temp",    "gas_T_in",      "°F",       ORANGE),
            ("Gas Outlet Temp",   "gas_T_out",     "°F",       ORANGE),
            ("SH1B Outlet Temp",  "sh1b_out_temp", "°F",       TEAL),
            ("Gas Flow",          "gas_flow",      "LB/HR",    BLUE),
            ("SH4A Steam Flow",   "sh_stm_flow",   "LB/HR",    ACCENT4),
            ("EC4C Steam Flow",   "ec4c_stm_flow", "LB/HR",    ACCENT4),
            ("EC4A Steam Flow",   "ec4a_stm_flow", "LB/HR",    ACCENT4),
        ]:
            self.o_sum[fld] = mk_out(sum_inner, lbl, r//3, col=(r%3)*3,
                                     unit=unit, color=c, w=12)
            r+=1

    # ── Steam Outputs tab ─────────────────────────────────────────────────────
    def _steam_tab(self, parent):
        frm = scrolled(parent)
        STREAM_MAP = [
            # (group_title, group_color, [(key,title,tag,kind), ...])
            ("PROCESS GAS STREAMS  (hot side)", ACCENT, [
                ("s20",  "Stream #20 — SH4A Inlet",    "GSA0",    "gas"),
                ("s21",  "Stream #21 — Econ 4C Inlet", "GEC0",    "gas"),
                ("s22",  "Stream #22 — Econ 4A Inlet", "GEA0",    "gas"),
                ("s23",  "Stream #23 — FAT Inlet",     "GF0",     "gas"),
            ]),
            ("SH4A STEAM CIRCUIT", ACCENT4, [
                ("s806",  "Stream #806 — SH4A Steam In (CV)",    "SSA0",    "steam"),
                ("s807",  "Stream #807 — SH4A Steam Out → SH1B","SSA_OUT", "steam"),
                ("s807b", "Stream #807B — SH1B Steam Out (→ TG)","SH1B_OUT","steam"),
            ]),
            ("EC4C BFW / STEAM CIRCUIT", ACCENT2, [
                ("s805",    "Stream #805 — EC4C BFW Inlet",   "SEC0",    "steam"),
                ("s805out", "Stream #805 OUT — EC4C Steam Out","SEC_OUT", "steam"),
            ]),
            ("EC4A BFW / STEAM CIRCUIT  (Streams 803A–808)", ACCENT3, [
                ("s803A","Stream #803A — EC4A BFW Inlet",           "SEA0",    "steam"),
                ("s803B","Stream #803B — After FE/FIT-7221",        "SEA0",    "steam"),
                ("s803C","Stream #803C — After TCV / Boiler Mixer", "GB0",     "steam"),
                ("s803D","Stream #803D — Split to Boiler (SEB0)",   "SEB0",    "steam"),
                ("s803E","Stream #803E — EC4A Steam Outlet (GF1)",  "GF1",     "steam"),
                ("s804", "Stream #804 — Furnace Outlet (GF1)",      "GF1",     "steam"),
                ("s806w","Stream #806 — WHB In Header Ref.",        "GB0",     "steam"),
                ("s808", "Stream #808 — Jug Valve Inlet (GJV0)",    "GJV0",    "steam"),
            ]),
        ]
        for grp_title, grp_color, streams in STREAM_MAP:
            ghdr = tk.Frame(frm, bg=BG)
            ghdr.pack(fill="x", padx=8, pady=(10,2))
            tk.Frame(ghdr, bg=grp_color, height=2).pack(fill="x")
            tk.Label(ghdr, text=f"  {grp_title}",
                     bg=BG, fg=grp_color, font=FH, anchor="w").pack(anchor="w", pady=2)

            grid_f = tk.Frame(frm, bg=BG)
            grid_f.pack(fill="x", padx=4, pady=2)
            n = len(streams)
            ncols = min(n, 4)
            for i, (key, title, tag, kind) in enumerate(streams):
                c_ = grp_color
                sc = StreamCard(grid_f, key, title, tag, kind, c_,
                                row=i//ncols, col=i%ncols)
                self._stream_cards[key] = sc
            for c in range(ncols): grid_f.columnconfigure(c, weight=1)

    # ── Dynamic Response tab ──────────────────────────────────────────────────
    def _dynamic_tab(self, parent):
        frm = tk.Frame(parent, bg=BG)
        frm.pack(fill="both", expand=True)

        # Info label
        info = tk.Frame(frm, bg=PANEL2)
        info.pack(fill="x", padx=8, pady=8)
        tk.Label(info, text="  Dynamic Response — First-Order + Dead-Time Model",
                 bg=PANEL2, fg=TEAL, font=FH, anchor="w",
                 padx=8, pady=6).pack(side="left")
        tk.Label(info, text="Run calculation in Dynamic mode to populate charts",
                 bg=PANEL2, fg=LABEL, font=FL, padx=8).pack(side="right")

        # Two side-by-side plot areas (canvas-based)
        plot_row = tk.Frame(frm, bg=BG)
        plot_row.pack(fill="both", expand=True, padx=8, pady=4)
        plot_row.columnconfigure(0, weight=1)
        plot_row.columnconfigure(1, weight=1)
        plot_row.rowconfigure(0, weight=1)

        # SH1B response
        sh_f = tk.Frame(plot_row, bg=PANEL)
        sh_f.grid(row=0, column=0, sticky="nsew", padx=4, pady=4)
        tk.Label(sh_f, text="  SH1B Outlet Temperature Response",
                 bg=PANEL, fg=ACCENT, font=FH, anchor="w",
                 padx=8, pady=4).pack(fill="x")
        self._sh_canvas = tk.Canvas(sh_f, bg="#0d1117", highlightthickness=0)
        self._sh_canvas.pack(fill="both", expand=True, padx=4, pady=4)

        # EC4A response
        ec_f = tk.Frame(plot_row, bg=PANEL)
        ec_f.grid(row=0, column=1, sticky="nsew", padx=4, pady=4)
        tk.Label(ec_f, text="  EC4A Process Gas Outlet Temperature Response",
                 bg=PANEL, fg=ACCENT3, font=FH, anchor="w",
                 padx=8, pady=4).pack(fill="x")
        self._ec_canvas = tk.Canvas(ec_f, bg="#0d1117", highlightthickness=0)
        self._ec_canvas.pack(fill="both", expand=True, padx=4, pady=4)

        # Valve positions
        vpos_f = tk.Frame(frm, bg=PANEL)
        vpos_f.pack(fill="x", padx=12, pady=4)
        tk.Label(vpos_f, text="  Valve Position Response",
                 bg=PANEL, fg=ACCENT2, font=FH, anchor="w",
                 padx=8, pady=4).pack(fill="x")
        self._vpos_canvas = tk.Canvas(vpos_f, bg="#0d1117", height=150,
                                      highlightthickness=0)
        self._vpos_canvas.pack(fill="x", padx=4, pady=4)

    def _draw_response(self, canvas, t, y, sp, color, ylabel, title):
        """Simple canvas-based line chart."""
        canvas.update_idletasks()
        W = canvas.winfo_width()  or 600
        H = canvas.winfo_height() or 300
        canvas.delete("all")
        if not t or len(t) < 2:
            canvas.create_text(W//2, H//2, text="No data", fill=LABEL, font=FL)
            return

        PAD = 50
        cw, ch = W - PAD*2, H - PAD*2

        # axes
        canvas.create_line(PAD, PAD, PAD, H-PAD, fill=BORDER, width=1)
        canvas.create_line(PAD, H-PAD, W-PAD, H-PAD, fill=BORDER, width=1)

        y_all = y + [sp[0]]
        y_min = min(y_all) - 5
        y_max = max(y_all) + 5
        t_max = max(t)

        def tx(t_): return PAD + (t_ / t_max) * cw if t_max > 0 else PAD
        def ty(y_): return H - PAD - ((y_ - y_min) / (y_max - y_min)) * ch if (y_max > y_min) else H//2

        # Grid
        for i in range(5):
            yv = y_min + i*(y_max-y_min)/4
            yp = ty(yv)
            canvas.create_line(PAD, yp, W-PAD, yp, fill=BORDER, dash=(2,4), width=1)
            canvas.create_text(PAD-4, yp, text=f"{yv:.0f}", fill=LABEL,
                               font=("Consolas",7), anchor="e")
        for i in range(6):
            tv = t_max * i / 5
            xp = tx(tv)
            canvas.create_line(xp, PAD, xp, H-PAD, fill=BORDER, dash=(2,4), width=1)
            canvas.create_text(xp, H-PAD+10, text=f"{tv:.0f}s", fill=LABEL,
                               font=("Consolas",7))

        # Setpoint line
        sp_y = ty(sp[0])
        canvas.create_line(PAD, sp_y, W-PAD, sp_y,
                           fill=ORANGE, dash=(4,4), width=1)
        canvas.create_text(W-PAD+2, sp_y, text=f"SP={sp[0]:.0f}°F",
                           fill=ORANGE, font=("Consolas",7), anchor="w")

        # Response curve
        pts = [(tx(t[i]), ty(y[i])) for i in range(len(t))]
        for i in range(len(pts)-1):
            canvas.create_line(pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1],
                               fill=color, width=2)

        # Labels
        canvas.create_text(PAD+5, PAD-10, text=title, fill=color,
                           font=("Segoe UI",8,"bold"), anchor="w")
        canvas.create_text(10, H//2, text=ylabel, fill=LABEL,
                           font=("Segoe UI",7), angle=90, anchor="center")

    def _draw_valve_response(self, canvas, t, sh_cv, ec4a_cv):
        canvas.update_idletasks()
        W = canvas.winfo_width() or 600
        H = canvas.winfo_height() or 150
        canvas.delete("all")
        if not t: return
        PAD = 40
        cw = W - PAD*2
        ch = H - PAD*2
        t_max = max(t)
        def tx(t_): return PAD + (t_/t_max)*cw if t_max > 0 else PAD
        def ty(y_): return H - PAD - (y_/100.0)*ch

        canvas.create_line(PAD,PAD,PAD,H-PAD, fill=BORDER,width=1)
        canvas.create_line(PAD,H-PAD,W-PAD,H-PAD, fill=BORDER,width=1)
        for i in [0,25,50,75,100]:
            yp = ty(i)
            canvas.create_line(PAD,yp,W-PAD,yp, fill=BORDER,dash=(2,4))
            canvas.create_text(PAD-4,yp,text=f"{i}%",fill=LABEL,
                               font=("Consolas",7),anchor="e")

        for series, color, label in [
            (sh_cv,  ACCENT,  "SH4A CV"),
            (ec4a_cv,ACCENT3, "EC4A CV"),
        ]:
            pts = [(tx(t[i]),ty(series[i])) for i in range(len(t))]
            for i in range(len(pts)-1):
                canvas.create_line(pts[i][0],pts[i][1],
                                   pts[i+1][0],pts[i+1][1],fill=color,width=2)
            if pts:
                canvas.create_text(pts[-1][0]+4,pts[-1][1],text=label,
                                   fill=color,font=("Consolas",7),anchor="w")

    # ── Collect inputs ────────────────────────────────────────────────────────
    def _get_inp(self):
        d = {}
        # params (p_ prefix)
        for attr in vars(self):
            if attr.startswith("p_"):
                key = attr[2:]
                v = getattr(self, attr)
                try:    d[key] = float(v.get())
                except: d[key] = v.get()
        # stream inputs
        for k, v in self.i_vars.items():
            try:    d[k] = float(v.get())
            except: d[k] = v.get()
        # dynamic params
        for k, v in self.dyn_vars.items():
            try:    d[k] = float(v.get())
            except: d[k] = v.get()
        # setpoints from mode bar
        try: d["sh1b_out_setpt"] = float(self.t_sh1b_sp.get())
        except: d["sh1b_out_setpt"] = 900.0
        try: d["ec4a_cv_setpt"] = float(self.t_ec4a_sp.get())
        except: d["ec4a_cv_setpt"] = 275.0
        # sim mode
        d["sim_mode"] = self._sim_mode.get()
        return d

    # ── Run calculation ───────────────────────────────────────────────────────
    def _run(self):
        if _calc is None:
            messagebox.showwarning("Missing",
                "sh4a_ec4c_ec4a_calculator.py not found in same folder.")
            return
        try:
            self._status.set("⏳  Calculating...")
            self.update_idletasks()
            inp = self._get_inp()
            res = _calc.run(inp)
            self._populate(res)
            mode = inp.get("sim_mode","static")
            self._status.set(
                f"✓  {'Static' if mode=='static' else 'Dynamic'} calculation complete — "
                f"SH1B Outlet: {res['summary']['sh1b_out_temp']:.1f}°F  |  "
                f"Gas Outlet: {res['ec4a']['gas_out_temp']:.1f}°F")
        except Exception as ex:
            self._status.set(f"✗  Error: {ex}")
            messagebox.showerror("Calculation Error", str(ex))

    def _populate(self, res):
        def sv(v, val, fmt=".2f"):
            try:    v.set(format(val, fmt))
            except: v.set(str(val))

        # HX Results
        for key in ("sh","ec4c","ec4a"):
            r = res[key]
            for fld,fmt in [("duty",".3f"),("gas_out_temp",".1f"),
                             ("steam_out_temp",".1f"),("steam_flow",",.0f"),
                             ("lmtd",".1f"),("UA",",.0f"),("uo_rated",".3f"),
                             ("gas_dp",".2f"),("steam_dp",".2f")]:
                if fld in self.o.get(key,{}): sv(self.o[key][fld], r.get(fld,0), fmt)
            # CV fields (no pump head)
            for fld,fmt in [("valve_pos",".2f"),("pid_output",".4f"),
                             ("cv_required",".2f"),("valve_dp",".3f")]:
                if fld in self.o.get(key,{}): sv(self.o[key][fld], r.get(fld,0), fmt)
            # SH1B extras
            for fld,fmt in [("sh1b_duty",".3f"),("total_sh_duty",".3f"),
                             ("sh1b_out_temp",".1f")]:
                if fld in self.o.get(key,{}): sv(self.o[key][fld], r.get(fld,0), fmt)

        # Summary
        sm = res["summary"]
        for fld,fmt in [("total_duty",".3f"),("total_sh_duty",".3f"),
                         ("gas_T_in",".1f"),("gas_T_out",".1f"),
                         ("sh1b_out_temp",".1f"),("gas_flow",",.0f"),
                         ("sh_stm_flow",",.0f"),("ec4c_stm_flow",",.0f"),
                         ("ec4a_stm_flow",",.0f")]:
            if fld in self.o_sum: sv(self.o_sum[fld], sm.get(fld,0), fmt)

        # Stream cards
        for key, sc in self._stream_cards.items():
            if key in res["streams"]:
                sc.update(res["streams"][key])

        # Dynamic plots
        if "dynamic" in res:
            dyn = res["dynamic"]
            self.after(100, lambda: self._draw_response(
                self._sh_canvas, dyn["t"], dyn["sh1b_out_temp"],
                dyn["sh_setpt"], ACCENT, "Temp (°F)", "SH1B Outlet Temperature"))
            self.after(100, lambda: self._draw_response(
                self._ec_canvas, dyn["t"], dyn["ec4a_gas_out"],
                dyn["ec4a_setpt"], ACCENT3, "Temp (°F)", "EC4A Gas Outlet Temperature"))
            self.after(100, lambda: self._draw_valve_response(
                self._vpos_canvas, dyn["t"],
                dyn["sh_valve_pos"], dyn["ec4a_valve_pos"]))
            # switch to dynamic tab
            self._nb.select(4)

    def _reset(self):
        self.destroy()
        App().mainloop()

    def _export(self):
        import tkinter.filedialog as fd
        path = fd.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON","*.json"),("All","*.*")],
            title="Export Inputs as JSON")
        if path:
            with open(path,"w") as f:
                json.dump(self._get_inp(), f, indent=2)
            messagebox.showinfo("Exported", f"Saved:\n{path}")


if __name__ == "__main__":
    App().mainloop()
