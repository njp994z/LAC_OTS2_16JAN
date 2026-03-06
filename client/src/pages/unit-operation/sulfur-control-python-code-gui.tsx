import { Link, useParams } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, Gauge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const GUI_CODE = `import tkinter as tk
from tkinter import ttk, messagebox
from static_backend import StaticSulfurSprayHydraulics, CONFIG
from dynamic_backend import DynamicSulfurSprayHydraulics

root = tk.Tk()
root.title("Molten Sulfur Flow Control Simulator")
root.geometry("720x780")

# Shared config update function
def update_config(key, value):
    try:
        CONFIG[key] = float(value)
    except ValueError:
        pass

# ── Mode Selection ───────────────────────────────────────────────
mode_frame = ttk.LabelFrame(root, text="Simulation Mode", padding=10)
mode_frame.pack(fill="x", padx=10, pady=10)

mode_var = tk.StringVar(value="Static")
ttk.Radiobutton(mode_frame, text="Static Calculation", variable=mode_var,
                value="Static").pack(side="left", padx=20)
ttk.Radiobutton(mode_frame, text="Dynamic Simulation", variable=mode_var,
                value="Dynamic").pack(side="left", padx=20)

# ── Inputs Frame ─────────────────────────────────────────────────
inputs_frame = ttk.LabelFrame(root, text="Inputs", padding=10)
inputs_frame.pack(fill="x", padx=10, pady=5)

# Common inputs
ttk.Label(inputs_frame, text="Pit Level (ft):").grid(row=0, column=0, padx=5, pady=5, sticky="e")
pit_entry = ttk.Entry(inputs_frame)
pit_entry.insert(0, "7.0")
pit_entry.grid(row=0, column=1, padx=5, pady=5)

# Static-specific
static_frame = ttk.Frame(inputs_frame)
static_frame.grid(row=1, column=0, columnspan=2, sticky="ew", pady=5)
ttk.Label(static_frame, text="Flow (GPM):").grid(row=0, column=0, padx=5, pady=5, sticky="e")
flow_entry = ttk.Entry(static_frame)
flow_entry.insert(0, "39.9")  # rated point from datasheet
flow_entry.grid(row=0, column=1, padx=5, pady=5)

# Dynamic-specific
dynamic_frame = ttk.Frame(inputs_frame)
dynamic_frame.grid(row=2, column=0, columnspan=2, sticky="ew", pady=5)
ttk.Label(dynamic_frame, text="Received PID Output (mA):").grid(row=0, column=0, padx=5, pady=5, sticky="e")
ma_entry = ttk.Entry(dynamic_frame)
ma_entry.insert(0, "12.0")
ma_entry.grid(row=0, column=1, padx=5, pady=5)

# ── System Parameters ────────────────────────────────────────────
params_frame = ttk.LabelFrame(root, text="System Parameters", padding=10)
params_frame.pack(fill="x", padx=10, pady=5)

params = [
    ("Pipe Diameter (in)", 'pipe_dia_in', "4.0"),
    ("Line Length (ft)", 'line_length_ft', "80.0"),
    ("Nozzle ΔP (psi)", 'deltaP_nozzle_psi', "150.0"),
    ("Furnace Pressure (psig)", 'furnace_static_psi', "7.0"),
    ("Sulfur SG", 'SG', "1.79"),
    ("Cv Max", 'Cv_max', "548.0"),
    ("Friction Factor", 'friction_factor', "0.018"),
    ("K Minor Losses", 'K_minor_losses', "7.5"),
    ("Barometric P (psig)", 'barometric_psig', "0.0"),
    ("Equal % R", 'R_equal_percent', "85.0")
]

entries = {}
row = 0
for label_text, key, default in params:
    ttk.Label(params_frame, text=label_text).grid(row=row, column=0, padx=5, pady=3, sticky="e")
    e = ttk.Entry(params_frame)
    e.insert(0, default)
    e.grid(row=row, column=1, padx=5, pady=3)
    e.bind("<KeyRelease>", lambda e, k=key: update_config(k, e.widget.get()))
    entries[key] = e
    row += 1

# ── Results Area ─────────────────────────────────────────────────
result_text = tk.Text(root, height=18, width=80, font=("Courier", 10))
result_text.pack(padx=10, pady=10, fill="both")

# ── Control Buttons ──────────────────────────────────────────────
btn_frame = ttk.Frame(root)
btn_frame.pack(pady=10)

model_static = None
model_dynamic = None
running = False
ramp_value = 4.0
ramp_step = 0.4

def update_result(text):
    result_text.delete(1.0, tk.END)
    result_text.insert(tk.END, text)

def run_static():
    try:
        flow = float(flow_entry.get())
        pit = float(pit_entry.get())
        model = StaticSulfurSprayHydraulics()
        res = model.calculate(flow, pit)
        lines = [f"{k:22}: {v}" for k, v in res.items()]
        update_result("\\n".join(lines))
    except Exception as e:
        update_result(f"Error: {str(e)}")

def start_dynamic():
    global model_dynamic, running, ramp_value, ramp_step
    try:
        pit = float(pit_entry.get())
        model_dynamic = DynamicSulfurSprayHydraulics(positioner_tau_s=6.0, flow_tau_s=4.0)
        running = True
        ramp_value = 4.0
        ramp_step = 0.4
        update_dynamic(pit)
    except Exception as e:
        update_result(f"Error: {str(e)}")

def pause_dynamic():
    global running
    running = False

def reset_dynamic():
    global running
    running = False
    if model_dynamic:
        model_dynamic.reset()
    update_result("Dynamic simulation reset.")

def update_dynamic(pit_level):
    if not running:
        return

    global ramp_value, ramp_step
    # Simple test ramp: 4 → 20 → 4 mA
    ramp_value += ramp_step
    if ramp_value >= 20.0 or ramp_value <= 4.0:
        ramp_step = -ramp_step
    mA = max(4.0, min(20.0, ramp_value))

    res = model_dynamic.step(mA, pit_level)
    lines = [
        f"Time (s)              : {res['time_s']}",
        f"Received mA           : {res['received_mA']}",
        f"Valve Position (%)    : {res['valve_pos_pct']}",
        f"Flow (GPM)            : {res['flow_gpm']}",
        f"Pit Level (ft)        : {res['pit_level_ft']}"
    ]
    update_result("\\n".join(lines))

    root.after(500, lambda: update_dynamic(pit_level))

# Buttons
ttk.Button(btn_frame, text="Calculate (Static)", command=run_static).pack(side="left", padx=10)
ttk.Button(btn_frame, text="Start Dynamic", command=start_dynamic).pack(side="left", padx=10)
ttk.Button(btn_frame, text="Pause", command=pause_dynamic).pack(side="left", padx=10)
ttk.Button(btn_frame, text="Reset Dynamic", command=reset_dynamic).pack(side="left", padx=10)

# Initial mode hide/show
def toggle_mode(*args):
    mode = mode_var.get()
    static_frame.grid_remove() if mode == "Dynamic" else static_frame.grid()
    dynamic_frame.grid_remove() if mode == "Static" else dynamic_frame.grid()

mode_var.trace("w", toggle_mode)
toggle_mode()

if __name__ == "__main__":
    root.mainloop()
`;

export default function SulfurControlPythonCodeGui() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { id } = useParams();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(GUI_CODE);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "The GUI code has been copied to your clipboard."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy code to clipboard.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={`/unit-operation/sulfur-control-hydraulics/${id}`}>
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Gauge className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">Sulfur Control - GUI Code</h1>
                  <p className="text-xs text-muted-foreground">
                    Tkinter GUI Reference Implementation
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              data-testid="button-copy-code"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-lg overflow-hidden border">
            <SyntaxHighlighter
              language="python"
              style={vscDarkPlus}
              showLineNumbers
              customStyle={{
                margin: 0,
                borderRadius: 0,
                fontSize: '13px'
              }}
            >
              {GUI_CODE}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </div>
  );
}
