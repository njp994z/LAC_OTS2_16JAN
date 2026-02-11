import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const GUI_CODE = `import tkinter as tk
from tkinter import ttk
import math

root = tk.Tk()
root.title("Gas-Gas Heat Exchanger Simulator")
root.geometry("960x880")

# ── Mode ────────────────────────────────────────────────────────
mode_frame = ttk.LabelFrame(root, text="Simulation Mode", padding=10)
mode_frame.pack(fill="x", padx=12, pady=10)

mode_var = tk.StringVar(value="Static")
ttk.Radiobutton(mode_frame, text="Static Calculation", variable=mode_var, value="Static").pack(side="left", padx=30)
ttk.Radiobutton(mode_frame, text="Rating Mode", variable=mode_var, value="Rating").pack(side="left", padx=30)

# ── Process Inputs ───────────────────────────────────────────────
inputs_frame = ttk.LabelFrame(root, text="Process Inputs", padding=10)
inputs_frame.pack(fill="x", padx=12, pady=6)

hot_frame = ttk.LabelFrame(inputs_frame, text="Hot Side (Process Gas)", padding=8)
hot_frame.grid(row=0, column=0, padx=8, pady=4, sticky="nsew")

ttk.Label(hot_frame, text="Inlet Temp (°F):").grid(row=0, column=0, sticky="e", padx=6, pady=3)
hot_tin = ttk.Entry(hot_frame, width=12)
hot_tin.insert(0, "806")
hot_tin.grid(row=0, column=1, padx=6, pady=3)

ttk.Label(hot_frame, text="Outlet Temp (°F):").grid(row=1, column=0, sticky="e", padx=6, pady=3)
hot_tout = ttk.Entry(hot_frame, width=12)
hot_tout.insert(0, "420")
hot_tout.grid(row=1, column=1, padx=6, pady=3)

ttk.Label(hot_frame, text="Flow Rate (lb/hr):").grid(row=2, column=0, sticky="e", padx=6, pady=3)
hot_flow = ttk.Entry(hot_frame, width=12)
hot_flow.insert(0, "285000")
hot_flow.grid(row=2, column=1, padx=6, pady=3)

ttk.Label(hot_frame, text="Pressure (psia):").grid(row=3, column=0, sticky="e", padx=6, pady=3)
hot_press = ttk.Entry(hot_frame, width=12)
hot_press.insert(0, "14.2")
hot_press.grid(row=3, column=1, padx=6, pady=3)

cold_frame = ttk.LabelFrame(inputs_frame, text="Cold Side (Ambient Air)", padding=8)
cold_frame.grid(row=0, column=1, padx=8, pady=4, sticky="nsew")

ttk.Label(cold_frame, text="Inlet Temp (°F):").grid(row=0, column=0, sticky="e", padx=6, pady=3)
cold_tin = ttk.Entry(cold_frame, width=12)
cold_tin.insert(0, "90")
cold_tin.grid(row=0, column=1, padx=6, pady=3)

ttk.Label(cold_frame, text="Outlet Temp (°F):").grid(row=1, column=0, sticky="e", padx=6, pady=3)
cold_tout = ttk.Entry(cold_frame, width=12)
cold_tout.insert(0, "580")
cold_tout.grid(row=1, column=1, padx=6, pady=3)

ttk.Label(cold_frame, text="Flow Rate (lb/hr):").grid(row=2, column=0, sticky="e", padx=6, pady=3)
cold_flow = ttk.Entry(cold_frame, width=12)
cold_flow.insert(0, "260000")
cold_flow.grid(row=2, column=1, padx=6, pady=3)

ttk.Label(cold_frame, text="Pressure (psia):").grid(row=3, column=0, sticky="e", padx=6, pady=3)
cold_press = ttk.Entry(cold_frame, width=12)
cold_press.insert(0, "14.5")
cold_press.grid(row=3, column=1, padx=6, pady=3)

inputs_frame.columnconfigure(0, weight=1)
inputs_frame.columnconfigure(1, weight=1)

# ── Exchanger Geometry ───────────────────────────────────────────
geom_frame = ttk.LabelFrame(root, text="Exchanger Geometry", padding=10)
geom_frame.pack(fill="x", padx=12, pady=6)

geom_params = [
    ("Tube OD (in)", "2.0"),
    ("Tube Thickness (in)", "0.109"),
    ("Number of Tubes", "1800"),
    ("Tube Length (ft)", "24.0"),
    ("Shell ID (in)", "60.0"),
    ("Tube Pitch (in)", "2.5"),
    ("Number of Baffles", "8"),
    ("Baffle Cut (%)", "25"),
    ("Passes (Tube Side)", "2"),
    ("Fouling Factor (tube)", "0.001"),
    ("Fouling Factor (shell)", "0.002"),
    ("k_metal (BTU/hr-ft-°F)", "26.0"),
]

geom_entries = {}
for i, (label, val) in enumerate(geom_params):
    r, c = divmod(i, 3)
    ttk.Label(geom_frame, text=label).grid(row=r, column=c*2, sticky="e", padx=4, pady=3)
    e = ttk.Entry(geom_frame, width=10)
    e.insert(0, val)
    e.grid(row=r, column=c*2+1, padx=4, pady=3)
    geom_entries[label] = e

# ── Results ──────────────────────────────────────────────────────
result_text = tk.Text(root, height=22, font=("Courier", 10))
result_text.pack(padx=12, pady=10, fill="both", expand=True)

# ── Calculation ──────────────────────────────────────────────────
def calculate():
    try:
        T_h_in  = float(hot_tin.get())
        T_h_out = float(hot_tout.get())
        m_h     = float(hot_flow.get())
        T_c_in  = float(cold_tin.get())
        T_c_out = float(cold_tout.get())
        m_c     = float(cold_flow.get())

        n_tubes = int(geom_entries["Number of Tubes"].get())
        tube_od = float(geom_entries["Tube OD (in)"].get())
        tube_thk = float(geom_entries["Tube Thickness (in)"].get())
        tube_len = float(geom_entries["Tube Length (ft)"].get())
        n_baffles = int(geom_entries["Number of Baffles"].get())
        k_metal = float(geom_entries["k_metal (BTU/hr-ft-°F)"].get())
        Rf_tube = float(geom_entries["Fouling Factor (tube)"].get())
        Rf_shell = float(geom_entries["Fouling Factor (shell)"].get())

        tube_id = tube_od - 2 * tube_thk

        Cp_h = 0.25   # BTU/lb-°F  (SO2/N2/O2 mix)
        Cp_c = 0.24   # BTU/lb-°F  (air)

        Q_hot  = m_h * Cp_h * (T_h_in - T_h_out)
        Q_cold = m_c * Cp_c * (T_c_out - T_c_in)

        dT1 = T_h_in - T_c_out
        dT2 = T_h_out - T_c_in
        if abs(dT1 - dT2) < 0.01:
            LMTD = dT1
        else:
            LMTD = (dT1 - dT2) / math.log(dT1 / dT2)

        A_outside = n_tubes * math.pi * (tube_od / 12) * tube_len
        A_inside  = n_tubes * math.pi * (tube_id / 12) * tube_len

        h_i = 12.0   # BTU/hr-ft²-°F (gas inside tubes)
        h_o = 10.0   # BTU/hr-ft²-°F (gas outside tubes)

        R_wall = (tube_od - tube_id) / (2 * 12) / k_metal
        U_clean = 1.0 / (1/h_o + R_wall + (tube_od/tube_id)/h_i)
        U_dirty = 1.0 / (1/h_o + Rf_shell + R_wall + Rf_tube*(tube_od/tube_id) + (tube_od/tube_id)/h_i)

        Q_avg = (Q_hot + Q_cold) / 2
        A_required = Q_avg / (U_dirty * LMTD)
        excess = (A_outside - A_required) / A_required * 100

        effectiveness = Q_avg / (min(m_h*Cp_h, m_c*Cp_c) * (T_h_in - T_c_in))
        NTU = U_dirty * A_outside / min(m_h*Cp_h, m_c*Cp_c)

        result_text.delete(1.0, tk.END)
        result_text.insert(tk.END, f"""╔══════════════════════════════════════════════════════╗
║       GAS-GAS HEAT EXCHANGER RESULTS                ║
╠══════════════════════════════════════════════════════╣

  Heat Duty (Hot Side)    : {Q_hot:>12,.0f} BTU/hr
  Heat Duty (Cold Side)   : {Q_cold:>12,.0f} BTU/hr
  Average Duty            : {Q_avg:>12,.0f} BTU/hr
  Heat Balance Error      : {abs(Q_hot-Q_cold)/Q_avg*100:>10.2f} %

  LMTD                    : {LMTD:>10.1f} °F
  U_clean                 : {U_clean:>10.3f} BTU/hr-ft²-°F
  U_dirty                 : {U_dirty:>10.3f} BTU/hr-ft²-°F

  Surface Area (outside)  : {A_outside:>10.0f} ft²
  Surface Area (inside)   : {A_inside:>10.0f} ft²
  Required Area           : {A_required:>10.0f} ft²
  Excess Area             : {excess:>10.1f} %

  Effectiveness (ε)       : {effectiveness:>10.3f}
  NTU                     : {NTU:>10.3f}

╠══════════════════════════════════════════════════════╣
║  Geometry Summary                                    ║
╠══════════════════════════════════════════════════════╣
  Tubes   : {n_tubes}  x  OD {tube_od}" x {tube_len} ft
  Baffles : {n_baffles}
  Wall k  : {k_metal} BTU/hr-ft-°F
╚══════════════════════════════════════════════════════╝
""")
    except Exception as ex:
        result_text.delete(1.0, tk.END)
        result_text.insert(tk.END, f"Error: {ex}")

# ── Buttons ──────────────────────────────────────────────────────
btn_frame = ttk.Frame(root)
btn_frame.pack(pady=12)
ttk.Button(btn_frame, text="Calculate", command=calculate).pack(side="left", padx=15)
ttk.Button(btn_frame, text="Clear", command=lambda: result_text.delete(1.0, tk.END)).pack(side="left", padx=15)

root.mainloop()
`;

export default function GasGasHeatExchanger() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(GUI_CODE);
    setCopied(true);
    toast({ title: "Copied", description: "Full GUI code copied." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/unit-operation-simulator">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div className="flex items-center gap-3">
              <ArrowLeftRight className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Gas-Gas Heat Exchanger Simulator</h1>
                <p className="text-xs text-muted-foreground">Shell & tube HX rating with LMTD method</p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <><Check className="mr-2 h-4 w-4"/> Copied</> : <><Copy className="mr-2 h-4 w-4"/> Copy Code</>}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto border rounded-xl overflow-hidden">
          <SyntaxHighlighter language="python" style={vscDarkPlus} showLineNumbers customStyle={{ margin: 0, fontSize: "13.5px" }}>
            {GUI_CODE}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
