# converter_pass_gui.py
# GUI for single catalytic converter pass simulation

import tkinter as tk
from tkinter import ttk, messagebox
from pass_solver import simulate_pass
from catalyst_database import CATALYST_DATABASE

root = tk.Tk()
root.title("Converter Pass 1 Simulator")
root.geometry("1050x780")

# ── Mode Selection ───────────────────────────────────────────────────────────
mode_frame = ttk.LabelFrame(root, text="Simulation Mode", padding=10)
mode_frame.pack(fill="x", padx=10, pady=10)

mode_var = tk.StringVar(value="Static")
ttk.Radiobutton(mode_frame, text="Static Calculation", variable=mode_var, value="Static").pack(side="left", padx=20)
ttk.Radiobutton(mode_frame, text="Dynamic Simulation", variable=mode_var, value="Dynamic").pack(side="left", padx=20)

# ── System Parameters ────────────────────────────────────────────────────────
sys_frame = ttk.LabelFrame(root, text="System Parameters", padding=10)
sys_frame.pack(fill="x", padx=10, pady=5)

sys_labels = ["Converter Diameter (ft)", "Catalyst Volume (L)", "Catalyst Type",
              "Barometric P (psia)", "Weather ZIP Code"]
sys_defaults = ["42.0", "89200", list(CATALYST_DATABASE.keys())[2], "14.3", "89801"]  # default GR330

sys_entries = {}
for i, (lbl, val) in enumerate(zip(sys_labels, sys_defaults)):
    ttk.Label(sys_frame, text=lbl).grid(row=i, column=0, padx=10, pady=5, sticky="e")
    if "Catalyst Type" in lbl:
        combo = ttk.Combobox(sys_frame, values=list(CATALYST_DATABASE.keys()), width=18)
        combo.set(val)
        combo.grid(row=i, column=1, padx=10, pady=5, sticky="w")
        sys_entries[lbl] = combo
    else:
        entry = ttk.Entry(sys_frame, width=20)
        entry.insert(0, val)
        entry.grid(row=i, column=1, padx=10, pady=5, sticky="w")
        sys_entries[lbl] = entry

# ── Inlet Gas Inputs (added for functionality) ───────────────────────────────
inlet_frame = ttk.LabelFrame(root, text="Inlet Gas Conditions", padding=10)
inlet_frame.pack(fill="x", padx=10, pady=5)

inlet_params = [
    ("Inlet Temperature (°C)", "390"),
    ("Inlet Pressure (in. wc)", "150"),
    ("Inlet Total Flow (scfm)", "150000"),
    ("Inlet SO2 (%)", "11.3"),
    ("Inlet O2 (%)", "9.5"),
    ("Inlet SO3 (%)", "0.0"),
]

inlet_entries = {}
for i, (lbl, val) in enumerate(inlet_params):
    ttk.Label(inlet_frame, text=lbl).grid(row=i, column=0, padx=10, pady=4, sticky="e")
    entry = ttk.Entry(inlet_frame, width=20)
    entry.insert(0, val)
    entry.grid(row=i, column=1, padx=10, pady=4, sticky="w")
    inlet_entries[lbl] = entry

# ── Bed Profile Table ────────────────────────────────────────────────────────
bed_frame = ttk.LabelFrame(root, text="Pass 1 Bed Profile", padding=10)
bed_frame.pack(fill="both", expand=False, padx=10, pady=5)

bed_headers = ["Bed Depth", "Temp (°C)", "Overall Conv. (%)", "Bed Conv. (%)",
               "Pressure (in. wc)", "Bed Depth L (ft)", "SO2 (%)", "O2 (%)", "Velocity (ft/s)"]

percentages = ["0%", "25%", "50%", "75%", "100%"]

bed_labels = {}
for c, hdr in enumerate(bed_headers):
    ttk.Label(bed_frame, text=hdr).grid(row=0, column=c, padx=6, pady=6, sticky="nsew")

for r, pct in enumerate(percentages, 1):
    ttk.Label(bed_frame, text=pct).grid(row=r, column=0, padx=6, pady=4, sticky="e")
    for c in range(1, 9):
        lbl = ttk.Label(bed_frame, text="---", width=12 if c>5 else 10)
        lbl.grid(row=r, column=c, padx=6, pady=4, sticky="nsew")
        key = f"row{r-1}_col{c}"
        bed_labels[key] = lbl

# ── Gas Outputs ──────────────────────────────────────────────────────────────
gas_frame = ttk.LabelFrame(root, text="Simulation Outputs - Static Mode", padding=10)
gas_frame.pack(fill="both", expand=True, padx=10, pady=5)

gas_headers = ["", "Units", "Converter Inlet\n1540-TI-4844\nG10", "Converter Outlet\n1540-TI-4845\nG11"]
for c, txt in enumerate(gas_headers):
    ttk.Label(gas_frame, text=txt).grid(row=0, column=c, padx=8, pady=5)

gas_rows = [
    ("SO2",   "scfm"),
    ("SO3",   "scfm"),
    ("O2",    "scfm"),
    ("N2",    "scfm"),
    ("H2O",   "scfm"),
    ("H2SO4", "scfm"),
    ("TOTAL", "scfm"),
    ("PRESSURE", "in. wc."),
    ("TEMPERATURE", "F"),
]

gas_out_labels = {}
for r, (param, unit) in enumerate(gas_rows, 1):
    ttk.Label(gas_frame, text=param).grid(row=r, column=1, sticky="e", padx=5)
    ttk.Label(gas_frame, text=unit).grid(row=r, column=2, sticky="w", padx=5)
    for c, suffix in zip([3,4], ["inlet", "outlet"]):
        lbl = ttk.Label(gas_frame, text="---", width=14)
        lbl.grid(row=r, column=c, padx=8, pady=3)
        gas_out_labels[f"{param}_{suffix}"] = lbl

# ── Calculation ──────────────────────────────────────────────────────────────
def run_calculation():
    try:
        dia_ft = float(sys_entries["Converter Diameter (ft)"].get())
        vol_L  = float(sys_entries["Catalyst Volume (L)"].get())
        cat_type = sys_entries["Catalyst Type"].get()
        inlet_T_C   = float(inlet_entries["Inlet Temperature (°C)"].get())
        inlet_P_inwc = float(inlet_entries["Inlet Pressure (in. wc)"].get())
        inlet_flow_scfm = float(inlet_entries["Inlet Total Flow (scfm)"].get())
        so2_pct = float(inlet_entries["Inlet SO2 (%)"].get())
        o2_pct  = float(inlet_entries["Inlet O2 (%)"].get())
        so3_pct = float(inlet_entries["Inlet SO3 (%)"].get())

        results = simulate_pass(
            inlet_T_C=inlet_T_C,
            inlet_P_inwc=inlet_P_inwc,
            inlet_so2_pct=so2_pct,
            inlet_o2_pct=o2_pct,
            inlet_so3_pct=so3_pct,
            inlet_total_scfm=inlet_flow_scfm,
            diameter_ft=dia_ft,
            catalyst_volume_liters=vol_L,
            catalyst_name=cat_type
        )

        # Fill bed profile
        for i in range(5):
            r = i + 1
            bed_labels[f"row{i}_col1"].config(text=f"{results['temps_C'][i]:.1f}")
            bed_labels[f"row{i}_col2"].config(text=f"{results['overall_conv_pct'][i]:.2f}")
            bed_labels[f"row{i}_col3"].config(text=f"{results['bed_conv_pct'][i]:.2f}")
            bed_labels[f"row{i}_col4"].config(text=f"{results['pressures_inwc'][i]:.2f}")
            bed_labels[f"row{i}_col5"].config(text=f"{results['bed_depths_ft'][i]:.1f}")
            bed_labels[f"row{i}_col6"].config(text=f"{results['so2_pct'][i]:.2f}")
            bed_labels[f"row{i}_col7"].config(text=f"{results['o2_pct'][i]:.2f}")
            bed_labels[f"row{i}_col8"].config(text=f"{results['velocities_fts'][i]:.1f}")

        # Fill gas table
        for side, key in [("inlet", "inlet"), ("outlet", "outlet")]:
            d = results[side]
            gas_out_labels[f"SO2_{key}"].config(text=f"{d['SO2']:.0f}")
            gas_out_labels[f"SO3_{key}"].config(text=f"{d['SO3']:.0f}")
            gas_out_labels[f"O2_{key}"].config(text=f"{d['O2']:.0f}")
            gas_out_labels[f"N2_{key}"].config(text=f"{d['N2']:.0f}")
            gas_out_labels[f"H2O_{key}"].config(text=f"{d['H2O']:.0f}")
            gas_out_labels[f"H2SO4_{key}"].config(text=f"{d['H2SO4']:.0f}")
            gas_out_labels[f"TOTAL_{key}"].config(text=f"{d['TOTAL']:.0f}")
            gas_out_labels[f"PRESSURE_{key}"].config(text=f"{d['PRESSURE']:.1f}")
            gas_out_labels[f"TEMPERATURE_{key}"].config(text=f"{d['TEMPERATURE']:.0f}")

    except Exception as e:
        messagebox.showerror("Error", str(e))

# ── Buttons ──────────────────────────────────────────────────────────────────
btn_frame = ttk.Frame(root)
btn_frame.pack(pady=12)

ttk.Button(btn_frame, text="Calculate", command=run_calculation).pack(side="left", padx=20)

# Dynamic mode placeholder (can be expanded later)
ttk.Button(btn_frame, text="Start Dynamic", state="disabled").pack(side="left", padx=20)
ttk.Button(btn_frame, text="Pause", state="disabled").pack(side="left", padx=20)
ttk.Button(btn_frame, text="Reset", state="disabled").pack(side="left", padx=20)

root.mainloop()
