"""
SH4A / EC4C / EC4A Unit Operation GUI
HP Superheater 4A / Economizer 4C / Economizer 4A
Equipment Tag: 1540-HX-004 / 006 / 007

Process Gas flows across:
  1. HP Superheater 4A  (steam side has control valve → controls TG outlet temp)
  2. Economizer 4C      (series with EC4A)
  3. Economizer 4A      (steam side has control valve → controls process gas outlet temp)
"""

import tkinter as tk
from tkinter import ttk, messagebox
import json
import importlib.util, sys, os

# ── Try to import the calculator module from same directory ──────────────────
_CALC_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "sh4a_ec4c_ec4a_calculator.py")
_calc = None
if os.path.exists(_CALC_PATH):
    spec = importlib.util.spec_from_file_location("sh4a_calc", _CALC_PATH)
    _calc = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(_calc)

# ── Color palette ─────────────────────────────────────────────────────────────
BG        = "#1e2430"
PANEL     = "#252d3d"
ACCENT    = "#3a7bd5"
ACCENT2   = "#e8a838"
TEXT      = "#dce3f0"
LABEL     = "#8a9bbf"
ENTRY_BG  = "#1a2235"
ENTRY_FG  = "#dce3f0"
HIGHLIGHT = "#ff6b6b"
GREEN     = "#4caf7d"
BORDER    = "#3a4560"

FONT_TITLE  = ("Segoe UI", 12, "bold")
FONT_HEADER = ("Segoe UI", 10, "bold")
FONT_LABEL  = ("Segoe UI", 9)
FONT_ENTRY  = ("Consolas", 9)
FONT_OUT    = ("Consolas", 9, "bold")

# ═════════════════════════════════════════════════════════════════════════════
# Helper widgets
# ═════════════════════════════════════════════════════════════════════════════

def labeled_entry(parent, label, default, row, col=0, unit="", width=12,
                  colspan=1, fg=ENTRY_FG):
    tk.Label(parent, text=label, bg=PANEL, fg=LABEL, font=FONT_LABEL,
             anchor="w").grid(row=row, column=col, sticky="w", padx=(8,2), pady=2)
    var = tk.StringVar(value=str(default))
    e = tk.Entry(parent, textvariable=var, bg=ENTRY_BG, fg=fg,
                 font=FONT_ENTRY, width=width,
                 insertbackground=TEXT, relief="flat",
                 highlightbackground=BORDER, highlightcolor=ACCENT,
                 highlightthickness=1)
    e.grid(row=row, column=col+1, sticky="w", padx=2, pady=2,
           columnspan=colspan)
    if unit:
        tk.Label(parent, text=unit, bg=PANEL, fg=LABEL,
                 font=FONT_LABEL).grid(row=row, column=col+2, sticky="w",
                                       padx=(0,8))
    return var

def output_label(parent, label, row, col=0, unit=""):
    tk.Label(parent, text=label, bg=PANEL, fg=LABEL, font=FONT_LABEL,
             anchor="w").grid(row=row, column=col, sticky="w", padx=(8,2), pady=2)
    var = tk.StringVar(value="---")
    lbl = tk.Label(parent, textvariable=var, bg=PANEL, fg=GREEN,
                   font=FONT_OUT, width=14, anchor="w")
    lbl.grid(row=row, column=col+1, sticky="w", padx=2, pady=2)
    if unit:
        tk.Label(parent, text=unit, bg=PANEL, fg=LABEL,
                 font=FONT_LABEL).grid(row=row, column=col+2, sticky="w",
                                       padx=(0,8))
    return var

def section_header(parent, text, row, cols=6):
    frm = tk.Frame(parent, bg=ACCENT, height=2)
    frm.grid(row=row, column=0, columnspan=cols, sticky="ew",
             padx=8, pady=(10,2))
    tk.Label(parent, text=text, bg=PANEL, fg=ACCENT, font=FONT_HEADER,
             anchor="w").grid(row=row+1, column=0, columnspan=cols,
                              sticky="w", padx=8, pady=(0,4))

def panel(parent, title, **kwargs):
    outer = tk.Frame(parent, bg=BORDER, bd=0)
    inner = tk.Frame(outer, bg=PANEL, bd=0)
    inner.pack(fill="both", expand=True, padx=1, pady=1)
    tk.Label(inner, text=title, bg=ACCENT, fg="white",
             font=FONT_HEADER, anchor="w",
             padx=8, pady=4).pack(fill="x")
    return outer, inner

# ═════════════════════════════════════════════════════════════════════════════
# Main Application
# ═════════════════════════════════════════════════════════════════════════════

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("SH4A / EC4C / EC4A  —  1540-HX-004 / 006 / 007")
        self.configure(bg=BG)
        self.resizable(True, True)
        self._build_ui()

    # ── Build UI ──────────────────────────────────────────────────────────────
    def _build_ui(self):
        # ---- Top title bar ---------------------------------------------------
        title_bar = tk.Frame(self, bg=ACCENT)
        title_bar.pack(fill="x")
        tk.Label(title_bar,
                 text="HP SUPERHEATER 4A  /  ECONOMIZER 4C  /  ECONOMIZER 4A",
                 bg=ACCENT, fg="white", font=FONT_TITLE,
                 padx=12, pady=6).pack(side="left")
        tk.Label(title_bar, text="1540-HX-004 / 006 / 007",
                 bg=ACCENT, fg="#c8deff", font=FONT_LABEL,
                 padx=12).pack(side="right")

        # ---- Notebook tabs ---------------------------------------------------
        nb = ttk.Notebook(self)
        nb.pack(fill="both", expand=True, padx=4, pady=4)

        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TNotebook", background=BG, borderwidth=0)
        style.configure("TNotebook.Tab", background=PANEL, foreground=TEXT,
                        padding=[10,4], font=FONT_LABEL)
        style.map("TNotebook.Tab",
                  background=[("selected", ACCENT)],
                  foreground=[("selected","white")])

        tab_params  = tk.Frame(nb, bg=BG)
        tab_inputs  = tk.Frame(nb, bg=BG)
        tab_outputs = tk.Frame(nb, bg=BG)

        nb.add(tab_params,  text="  Equipment Parameters  ")
        nb.add(tab_inputs,  text="  Stream Inputs  ")
        nb.add(tab_outputs, text="  Results / Outputs  ")

        self._build_params(tab_params)
        self._build_inputs(tab_inputs)
        self._build_outputs(tab_outputs)

        # ---- Bottom action bar -----------------------------------------------
        bar = tk.Frame(self, bg=BG, pady=6)
        bar.pack(fill="x")
        tk.Button(bar, text="▶  RUN CALCULATION",
                  command=self._run,
                  bg=ACCENT, fg="white", font=FONT_HEADER,
                  relief="flat", padx=20, pady=6,
                  activebackground="#2d66c4",
                  cursor="hand2").pack(side="left", padx=12)
        tk.Button(bar, text="Reset to Defaults",
                  command=self._reset,
                  bg=PANEL, fg=LABEL, font=FONT_LABEL,
                  relief="flat", padx=12, pady=6,
                  cursor="hand2").pack(side="left", padx=4)
        tk.Button(bar, text="Export JSON",
                  command=self._export_json,
                  bg=PANEL, fg=LABEL, font=FONT_LABEL,
                  relief="flat", padx=12, pady=6,
                  cursor="hand2").pack(side="right", padx=12)

    # ── Equipment Parameters Tab ──────────────────────────────────────────────
    def _build_params(self, parent):
        canvas = tk.Canvas(parent, bg=BG, highlightthickness=0)
        vsb = tk.Scrollbar(parent, orient="vertical", command=canvas.yview)
        canvas.configure(yscrollcommand=vsb.set)
        vsb.pack(side="right", fill="y")
        canvas.pack(fill="both", expand=True)

        frm = tk.Frame(canvas, bg=BG)
        canvas.create_window((0,0), window=frm, anchor="nw")
        frm.bind("<Configure>",
                 lambda e: canvas.configure(
                     scrollregion=canvas.bbox("all")))

        cols = tk.Frame(frm, bg=BG)
        cols.pack(fill="both", expand=True, padx=6, pady=6)

        # ── SH4A column ────────────────────────────────────────────────────────
        sh_outer, sh = panel(cols, "  SH 4A  —  HP Superheater")
        sh_outer.grid(row=0, column=0, sticky="nsew", padx=6, pady=6)

        r = 0
        self.sh_ht_area    = labeled_entry(sh, "HT Area",    18000, r, unit="ft²"); r+=1
        self.sh_uo         = labeled_entry(sh, "Overall U₀", 15.0,  r, unit="BTU/ft²·°F·hr"); r+=1
        self.sh_pipe_dia   = labeled_entry(sh, "Pipe Diameter", 12.0, r, unit="in"); r+=1
        self.sh_gas_in_duct= labeled_entry(sh, "Gas Inlet Duct Dia", 6.5, r, unit="ft"); r+=1
        self.sh_steam_dp0  = labeled_entry(sh, "Steam dP₀",  15.0,  r, unit="psi"); r+=1
        self.sh_dp_factor  = labeled_entry(sh, "Steam dP Rating Factor", 1.7, r); r+=1
        r+=1
        tk.Label(sh, text="Control Valve (→ TG Temp)", bg=PANEL, fg=ACCENT2,
                 font=("Segoe UI",9,"bold")).grid(row=r, column=0,
                 columnspan=3, sticky="w", padx=8, pady=(4,2)); r+=1
        self.sh_cv_type    = labeled_entry(sh, "Valve Characteristic", "Equal Percentage", r, width=18); r+=1
        self.sh_cv_max     = labeled_entry(sh, "Cv Max",    1000.0, r); r+=1
        self.sh_cv_range   = labeled_entry(sh, "Rangeability (R)", 85, r); r+=1
        self.sh_cv_setpt   = labeled_entry(sh, "TG Outlet Temp Setpoint", 750, r, unit="°F"); r+=1

        # ── EC4C column ────────────────────────────────────────────────────────
        ec4c_outer, ec4c = panel(cols, "  EC 4C  —  Economizer 4C")
        ec4c_outer.grid(row=0, column=1, sticky="nsew", padx=6, pady=6)

        r = 0
        self.ec4c_ht_area   = labeled_entry(ec4c, "HT Area",    13000, r, unit="ft²"); r+=1
        self.ec4c_uo        = labeled_entry(ec4c, "Overall U₀", 15.0,  r, unit="BTU/ft²·°F·hr"); r+=1
        self.ec4c_gas_out_duct=labeled_entry(ec4c,"Gas Outlet Duct Dia",6.0, r, unit="ft"); r+=1
        self.ec4c_steam_dp0 = labeled_entry(ec4c, "Steam dP₀",  15.0,  r, unit="psi"); r+=1
        self.ec4c_dp_factor = labeled_entry(ec4c, "Steam dP Rating Factor", 1.7, r); r+=1
        self.ec4c_proc_dp0  = labeled_entry(ec4c, "Process Gas dP₀", 11.0, r, unit="in WC"); r+=1
        self.ec4c_proc_dpf  = labeled_entry(ec4c, "Process Gas dP Factor", 1.7, r); r+=1

        # ── EC4A column ────────────────────────────────────────────────────────
        ec4a_outer, ec4a = panel(cols, "  EC 4A  —  Economizer 4A")
        ec4a_outer.grid(row=0, column=2, sticky="nsew", padx=6, pady=6)

        r = 0
        self.ec4a_ht_area   = labeled_entry(ec4a, "HT Area",    15000, r, unit="ft²"); r+=1
        self.ec4a_uo        = labeled_entry(ec4a, "Overall U₀", 15.0,  r, unit="BTU/ft²·°F·hr"); r+=1
        self.ec4a_pipe_dia  = labeled_entry(ec4a, "Pipe Diameter", 8.0, r, unit="in"); r+=1
        self.ec4a_steam_dp0 = labeled_entry(ec4a, "Steam dP₀",  15.0,  r, unit="psi"); r+=1
        self.ec4a_dp_factor = labeled_entry(ec4a, "Steam dP Rating Factor", 1.7, r); r+=1
        r+=1
        tk.Label(ec4a, text="Control Valve (→ Gas Outlet Temp)", bg=PANEL,
                 fg=ACCENT2, font=("Segoe UI",9,"bold")).grid(row=r, column=0,
                 columnspan=3, sticky="w", padx=8, pady=(4,2)); r+=1
        self.ec4a_cv_type   = labeled_entry(ec4a, "Valve Characteristic", "Equal Percentage", r, width=18); r+=1
        self.ec4a_cv_max    = labeled_entry(ec4a, "Cv Max",    548.0, r); r+=1
        self.ec4a_cv_range  = labeled_entry(ec4a, "Rangeability (R)", 85, r); r+=1
        self.ec4a_cv_setpt  = labeled_entry(ec4a, "Gas Outlet Temp Setpoint", 401, r, unit="°F"); r+=1

        cols.columnconfigure(0, weight=1)
        cols.columnconfigure(1, weight=1)
        cols.columnconfigure(2, weight=1)

    # ── Stream Inputs Tab ─────────────────────────────────────────────────────
    def _build_inputs(self, parent):
        canvas = tk.Canvas(parent, bg=BG, highlightthickness=0)
        vsb = tk.Scrollbar(parent, orient="vertical", command=canvas.yview)
        canvas.configure(yscrollcommand=vsb.set)
        vsb.pack(side="right", fill="y")
        canvas.pack(fill="both", expand=True)

        frm = tk.Frame(canvas, bg=BG)
        canvas.create_window((0,0), window=frm, anchor="nw")
        frm.bind("<Configure>",
                 lambda e: canvas.configure(scrollregion=canvas.bbox("all")))

        rows_frame = tk.Frame(frm, bg=BG)
        rows_frame.pack(fill="both", expand=True, padx=6, pady=6)

        # ── Process Gas (Stream 20 — SH4A Inlet) ──────────────────────────────
        pg_outer, pg = panel(rows_frame, "  Stream #20 — Process Gas  SH4A Inlet  (GSA0)")
        pg_outer.grid(row=0, column=0, columnspan=2, sticky="ew", padx=6, pady=6)

        gas_comps = [("SO2", 18), ("SO3", 462), ("O2", 4069),
                     ("N2", 86808), ("H2O", 0), ("H2SO4", 0)]
        r = 0
        self.gas_comps = {}
        for name, val in gas_comps:
            self.gas_comps[name] = labeled_entry(pg, name, val, r, unit="scfm", col=0); r+=1
        self.gas_total    = labeled_entry(pg, "TOTAL",    90896, r, unit="scfm"); r+=1
        self.gas_pressure = labeled_entry(pg, "PRESSURE", 47,    r, unit="in WC"); r+=1
        self.gas_temp     = labeled_entry(pg, "TEMPERATURE", 808, r, unit="°F"); r+=1

        # ── Steam Inlet streams ────────────────────────────────────────────────
        st_outer, st = panel(rows_frame, "  Steam Inlet Streams")
        st_outer.grid(row=1, column=0, columnspan=2, sticky="ew", padx=6, pady=6)

        r = 0
        # Stream 806 — SH4A Steam Inlet (SSA0)
        tk.Label(st, text="Stream #806 — SH4A Steam Inlet (SSA0)",
                 bg=PANEL, fg=ACCENT2, font=("Segoe UI",9,"bold")).grid(
                 row=r, column=0, columnspan=6, sticky="w", padx=8, pady=(6,2)); r+=1
        self.sh_steam_flow    = labeled_entry(st, "FLOW",        269418, r, unit="LB/HR", col=0); r+=1
        self.sh_steam_press   = labeled_entry(st, "PRESSURE",    915,    r, unit="PSIG",  col=0); r+=1
        self.sh_steam_temp    = labeled_entry(st, "TEMPERATURE", 536,    r, unit="°F",    col=0); r+=1

        r+=1
        tk.Label(st, text="Stream #805 — EC4C Steam Inlet (SEC0)",
                 bg=PANEL, fg=ACCENT2, font=("Segoe UI",9,"bold")).grid(
                 row=r, column=0, columnspan=6, sticky="w", padx=8, pady=(6,2)); r+=1
        self.ec4c_steam_flow  = labeled_entry(st, "FLOW",        264418, r, unit="LB/HR", col=0); r+=1
        self.ec4c_steam_press = labeled_entry(st, "PRESSURE",    951,    r, unit="PSIG",  col=0); r+=1
        self.ec4c_steam_temp  = labeled_entry(st, "TEMPERATURE", 401,    r, unit="°F",    col=0); r+=1

        r+=1
        tk.Label(st, text="Stream #803A — EC4A Steam Inlet (SEA0)",
                 bg=PANEL, fg=ACCENT2, font=("Segoe UI",9,"bold")).grid(
                 row=r, column=0, columnspan=6, sticky="w", padx=8, pady=(6,2)); r+=1
        self.ec4a_steam_flow  = labeled_entry(st, "FLOW",        264418, r, unit="LB/HR", col=0); r+=1
        self.ec4a_steam_press = labeled_entry(st, "PRESSURE",    978,    r, unit="PSIG",  col=0); r+=1
        self.ec4a_steam_temp  = labeled_entry(st, "TEMPERATURE", 223,    r, unit="°F",    col=0); r+=1

        rows_frame.columnconfigure(0, weight=1)
        rows_frame.columnconfigure(1, weight=1)

    # ── Outputs Tab ───────────────────────────────────────────────────────────
    def _build_outputs(self, parent):
        canvas = tk.Canvas(parent, bg=BG, highlightthickness=0)
        vsb = tk.Scrollbar(parent, orient="vertical", command=canvas.yview)
        canvas.configure(yscrollcommand=vsb.set)
        vsb.pack(side="right", fill="y")
        canvas.pack(fill="both", expand=True)

        frm = tk.Frame(canvas, bg=BG)
        canvas.create_window((0,0), window=frm, anchor="nw")
        frm.bind("<Configure>",
                 lambda e: canvas.configure(scrollregion=canvas.bbox("all")))

        cols = tk.Frame(frm, bg=BG)
        cols.pack(fill="both", expand=True, padx=6, pady=6)

        # ── SH4A Results ───────────────────────────────────────────────────────
        sh_outer, sh = panel(cols, "  SH 4A Results")
        sh_outer.grid(row=0, column=0, sticky="nsew", padx=6, pady=6)
        r = 0
        self.o_sh_duty        = output_label(sh, "Duty",           r, unit="MMBTU/hr"); r+=1
        self.o_sh_gas_out_t   = output_label(sh, "Gas Outlet Temp",r, unit="°F"); r+=1
        self.o_sh_steam_out_t = output_label(sh, "Steam Outlet Temp",r, unit="°F"); r+=1
        self.o_sh_lmtd        = output_label(sh, "LMTD",           r, unit="°F"); r+=1
        self.o_sh_ua          = output_label(sh, "UA",             r, unit="BTU/hr·°F"); r+=1
        self.o_sh_uo_rated    = output_label(sh, "U₀ (rated)",     r, unit="BTU/ft²·°F·hr"); r+=1
        self.o_sh_gas_dp      = output_label(sh, "Gas Side dP",    r, unit="in WC"); r+=1
        self.o_sh_steam_dp    = output_label(sh, "Steam Side dP",  r, unit="psi"); r+=1
        self.o_sh_valve_pos   = output_label(sh, "Valve Position", r, unit="%"); r+=1
        self.o_sh_pid_out     = output_label(sh, "PID Output",     r, unit="mA"); r+=1
        self.o_sh_cv_req      = output_label(sh, "Cv Required",    r); r+=1
        self.o_sh_valve_dp    = output_label(sh, "Valve ΔP",       r, unit="psi"); r+=1

        # ── EC4C Results ───────────────────────────────────────────────────────
        ec4c_outer, ec4c = panel(cols, "  EC 4C Results")
        ec4c_outer.grid(row=0, column=1, sticky="nsew", padx=6, pady=6)
        r = 0
        self.o_ec4c_duty       = output_label(ec4c, "Duty",             r, unit="MMBTU/hr"); r+=1
        self.o_ec4c_gas_out_t  = output_label(ec4c, "Gas Outlet Temp",  r, unit="°F"); r+=1
        self.o_ec4c_stm_out_t  = output_label(ec4c, "Steam Outlet Temp",r, unit="°F"); r+=1
        self.o_ec4c_lmtd       = output_label(ec4c, "LMTD",             r, unit="°F"); r+=1
        self.o_ec4c_ua         = output_label(ec4c, "UA",               r, unit="BTU/hr·°F"); r+=1
        self.o_ec4c_uo_rated   = output_label(ec4c, "U₀ (rated)",       r, unit="BTU/ft²·°F·hr"); r+=1
        self.o_ec4c_gas_dp     = output_label(ec4c, "Gas Side dP",      r, unit="in WC"); r+=1
        self.o_ec4c_steam_dp   = output_label(ec4c, "Steam Side dP",    r, unit="psi"); r+=1

        # ── EC4A Results ───────────────────────────────────────────────────────
        ec4a_outer, ec4a = panel(cols, "  EC 4A Results")
        ec4a_outer.grid(row=0, column=2, sticky="nsew", padx=6, pady=6)
        r = 0
        self.o_ec4a_duty       = output_label(ec4a, "Duty",             r, unit="MMBTU/hr"); r+=1
        self.o_ec4a_gas_out_t  = output_label(ec4a, "Gas Outlet Temp",  r, unit="°F"); r+=1
        self.o_ec4a_stm_out_t  = output_label(ec4a, "Steam Outlet Temp",r, unit="°F"); r+=1
        self.o_ec4a_lmtd       = output_label(ec4a, "LMTD",             r, unit="°F"); r+=1
        self.o_ec4a_ua         = output_label(ec4a, "UA",               r, unit="BTU/hr·°F"); r+=1
        self.o_ec4a_uo_rated   = output_label(ec4a, "U₀ (rated)",       r, unit="BTU/ft²·°F·hr"); r+=1
        self.o_ec4a_gas_dp     = output_label(ec4a, "Gas Side dP",      r, unit="in WC"); r+=1
        self.o_ec4a_steam_dp   = output_label(ec4a, "Steam Side dP",    r, unit="psi"); r+=1
        self.o_ec4a_valve_pos  = output_label(ec4a, "Valve Position",   r, unit="%"); r+=1
        self.o_ec4a_pid_out    = output_label(ec4a, "PID Output",       r, unit="mA"); r+=1
        self.o_ec4a_cv_req     = output_label(ec4a, "Cv Required",      r); r+=1
        self.o_ec4a_valve_dp   = output_label(ec4a, "Valve ΔP",         r, unit="psi"); r+=1

        # ── Hydraulics Summary ─────────────────────────────────────────────────
        hyd_outer, hyd = panel(frm, "  Hydraulic Summary")
        hyd_outer.pack(fill="x", padx=12, pady=6)
        r = 0
        self.o_pump_head_sh    = output_label(hyd, "SH4A Pump Head",  r, unit="ft", col=0); r+=1
        self.o_pump_head_ec4a  = output_label(hyd, "EC4A Pump Head",  r, unit="ft", col=0); r+=1

        cols.columnconfigure(0, weight=1)
        cols.columnconfigure(1, weight=1)
        cols.columnconfigure(2, weight=1)

    # ── Read inputs dict ──────────────────────────────────────────────────────
    def _get_inputs(self):
        def f(v):
            try:   return float(v.get())
            except: return v.get()

        return {
            # SH4A params
            "sh_ht_area":    f(self.sh_ht_area),
            "sh_uo":         f(self.sh_uo),
            "sh_pipe_dia":   f(self.sh_pipe_dia),
            "sh_gas_in_duct":f(self.sh_gas_in_duct),
            "sh_steam_dp0":  f(self.sh_steam_dp0),
            "sh_dp_factor":  f(self.sh_dp_factor),
            "sh_cv_max":     f(self.sh_cv_max),
            "sh_cv_range":   f(self.sh_cv_range),
            "sh_cv_setpt":   f(self.sh_cv_setpt),
            # EC4C params
            "ec4c_ht_area":  f(self.ec4c_ht_area),
            "ec4c_uo":       f(self.ec4c_uo),
            "ec4c_steam_dp0":f(self.ec4c_steam_dp0),
            "ec4c_dp_factor":f(self.ec4c_dp_factor),
            "ec4c_proc_dp0": f(self.ec4c_proc_dp0),
            "ec4c_proc_dpf": f(self.ec4c_proc_dpf),
            # EC4A params
            "ec4a_ht_area":  f(self.ec4a_ht_area),
            "ec4a_uo":       f(self.ec4a_uo),
            "ec4a_pipe_dia": f(self.ec4a_pipe_dia),
            "ec4a_steam_dp0":f(self.ec4a_steam_dp0),
            "ec4a_dp_factor":f(self.ec4a_dp_factor),
            "ec4a_cv_max":   f(self.ec4a_cv_max),
            "ec4a_cv_range": f(self.ec4a_cv_range),
            "ec4a_cv_setpt": f(self.ec4a_cv_setpt),
            # Process gas inlet
            "gas_SO2":   f(self.gas_comps["SO2"]),
            "gas_SO3":   f(self.gas_comps["SO3"]),
            "gas_O2":    f(self.gas_comps["O2"]),
            "gas_N2":    f(self.gas_comps["N2"]),
            "gas_H2O":   f(self.gas_comps["H2O"]),
            "gas_H2SO4": f(self.gas_comps["H2SO4"]),
            "gas_pressure":    f(self.gas_pressure),
            "gas_temp":        f(self.gas_temp),
            # SH4A steam
            "sh_steam_flow":   f(self.sh_steam_flow),
            "sh_steam_press":  f(self.sh_steam_press),
            "sh_steam_temp":   f(self.sh_steam_temp),
            # EC4C steam
            "ec4c_steam_flow": f(self.ec4c_steam_flow),
            "ec4c_steam_press":f(self.ec4c_steam_press),
            "ec4c_steam_temp": f(self.ec4c_steam_temp),
            # EC4A steam
            "ec4a_steam_flow": f(self.ec4a_steam_flow),
            "ec4a_steam_press":f(self.ec4a_steam_press),
            "ec4a_steam_temp": f(self.ec4a_steam_temp),
        }

    # ── Run calculation ───────────────────────────────────────────────────────
    def _run(self):
        if _calc is None:
            messagebox.showwarning("Calculator Missing",
                "sh4a_ec4c_ec4a_calculator.py not found in same directory.\n"
                "Place both files in the same folder and re-run.")
            return
        try:
            inp = self._get_inputs()
            res = _calc.run(inp)
            self._populate_outputs(res)
        except Exception as ex:
            messagebox.showerror("Calculation Error", str(ex))

    def _populate_outputs(self, r):
        def s(var, val, fmt=".2f"):
            try:    var.set(format(val, fmt))
            except: var.set(str(val))

        # SH4A
        s(self.o_sh_duty,        r["sh"]["duty"])
        s(self.o_sh_gas_out_t,   r["sh"]["gas_out_temp"])
        s(self.o_sh_steam_out_t, r["sh"]["steam_out_temp"])
        s(self.o_sh_lmtd,        r["sh"]["lmtd"])
        s(self.o_sh_ua,          r["sh"]["UA"],        ".0f")
        s(self.o_sh_uo_rated,    r["sh"]["uo_rated"])
        s(self.o_sh_gas_dp,      r["sh"]["gas_dp"])
        s(self.o_sh_steam_dp,    r["sh"]["steam_dp"])
        s(self.o_sh_valve_pos,   r["sh"]["valve_pos"])
        s(self.o_sh_pid_out,     r["sh"]["pid_output"])
        s(self.o_sh_cv_req,      r["sh"]["cv_required"])
        s(self.o_sh_valve_dp,    r["sh"]["valve_dp"])
        # EC4C
        s(self.o_ec4c_duty,      r["ec4c"]["duty"])
        s(self.o_ec4c_gas_out_t, r["ec4c"]["gas_out_temp"])
        s(self.o_ec4c_stm_out_t, r["ec4c"]["steam_out_temp"])
        s(self.o_ec4c_lmtd,      r["ec4c"]["lmtd"])
        s(self.o_ec4c_ua,        r["ec4c"]["UA"],      ".0f")
        s(self.o_ec4c_uo_rated,  r["ec4c"]["uo_rated"])
        s(self.o_ec4c_gas_dp,    r["ec4c"]["gas_dp"])
        s(self.o_ec4c_steam_dp,  r["ec4c"]["steam_dp"])
        # EC4A
        s(self.o_ec4a_duty,      r["ec4a"]["duty"])
        s(self.o_ec4a_gas_out_t, r["ec4a"]["gas_out_temp"])
        s(self.o_ec4a_stm_out_t, r["ec4a"]["steam_out_temp"])
        s(self.o_ec4a_lmtd,      r["ec4a"]["lmtd"])
        s(self.o_ec4a_ua,        r["ec4a"]["UA"],      ".0f")
        s(self.o_ec4a_uo_rated,  r["ec4a"]["uo_rated"])
        s(self.o_ec4a_gas_dp,    r["ec4a"]["gas_dp"])
        s(self.o_ec4a_steam_dp,  r["ec4a"]["steam_dp"])
        s(self.o_ec4a_valve_pos, r["ec4a"]["valve_pos"])
        s(self.o_ec4a_pid_out,   r["ec4a"]["pid_output"])
        s(self.o_ec4a_cv_req,    r["ec4a"]["cv_required"])
        s(self.o_ec4a_valve_dp,  r["ec4a"]["valve_dp"])
        # Hydraulics
        s(self.o_pump_head_sh,   r["sh"].get("pump_head", 0))
        s(self.o_pump_head_ec4a, r["ec4a"].get("pump_head", 0))

    # ── Reset ─────────────────────────────────────────────────────────────────
    def _reset(self):
        self.destroy()
        App().mainloop()

    # ── Export JSON ───────────────────────────────────────────────────────────
    def _export_json(self):
        import tkinter.filedialog as fd
        path = fd.asksaveasfilename(defaultextension=".json",
                                    filetypes=[("JSON","*.json"),("All","*.*")],
                                    title="Export Inputs as JSON")
        if path:
            with open(path, "w") as f:
                json.dump(self._get_inputs(), f, indent=2)
            messagebox.showinfo("Exported", f"Inputs saved to:\n{path}")


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    App().mainloop()
