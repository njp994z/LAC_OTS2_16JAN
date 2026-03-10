import { Link, useParams } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, Gauge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const GUI_CODE = `import tkinter as tk
from tkinter import ttk
import time

root = tk.Tk()
root.title("Sulfur Interpass HX Valve Control Simulator")
root.geometry("920x860")

# ── Mode ────────────────────────────────────────────────────────
mode_frame = ttk.LabelFrame(root, text="Simulation Mode", padding=10)
mode_frame.pack(fill="x", padx=12, pady=10)

mode_var = tk.StringVar(value="Static")
ttk.Radiobutton(mode_frame, text="Static Calculation", variable=mode_var, value="Static").pack(side="left", padx=30)
ttk.Radiobutton(mode_frame, text="Dynamic Simulation", variable=mode_var, value="Dynamic").pack(side="left", padx=30)

# ── Inputs ───────────────────────────────────────────────────────
inputs_frame = ttk.LabelFrame(root, text="Inputs", padding=10)
inputs_frame.pack(fill="x", padx=12, pady=6)

# Static (two outlet temperatures)
static_frame = ttk.Frame(inputs_frame)
static_frame.grid(row=0, column=0, columnspan=2, sticky="ew", pady=8)

ttk.Label(static_frame, text="Pass 3 Outlet Temp (°F):").grid(row=0, column=0, sticky="e", padx=8, pady=4)
pass3 = ttk.Entry(static_frame, width=12)
pass3.insert(0, "806")
pass3.grid(row=0, column=1, padx=8, pady=4)

ttk.Label(static_frame, text="Pass 4 Outlet Temp (°F):").grid(row=1, column=0, sticky="e", padx=8, pady=4)
pass4 = ttk.Entry(static_frame, width=12)
pass4.insert(0, "779")
pass4.grid(row=1, column=1, padx=8, pady=4)

# Dynamic (controller mA)
dynamic_frame = ttk.Frame(inputs_frame)
dynamic_frame.grid(row=1, column=0, columnspan=2, sticky="ew", pady=8)
ttk.Label(dynamic_frame, text="TIC-5224 Controller Output (mA):").grid(row=0, column=0, sticky="e", padx=8, pady=4)
ma_entry = ttk.Entry(dynamic_frame, width=12)
ma_entry.insert(0, "12.0")
ma_entry.grid(row=0, column=1, padx=8, pady=4)

# ── System Parameters (all from your screenshot) ─────────────────
params_frame = ttk.LabelFrame(root, text="System Parameters", padding=10)
params_frame.pack(fill="x", padx=12, pady=6)

params_list = [
    ("CIP Tube OD (in)", "2.565"), ("CIP Tubes", "2148"), ("CIP Thickness (in)", "0.218"), ("CIP Length (ft)", "30.9375"),
    ("HIP Tube OD (in)", "2.565"), ("HIP Tubes", "1150"), ("HIP Thickness (in)", "0.218"), ("HIP Length (ft)", "25.0"),
    ("CIP Cv_Max 36\\"", "100000"), ("CIP Cv_Max 78\\"", "700000"), ("HIP Cv_Max 48\\"", "200000"),
    ("Barometric P (psia)", "14.696"), ("k_304 SS", "8.7"), ("CIP Baffles", "5"), ("HIP Baffles", "1"),
    ("CIP h_H #1", "10.0"), ("CIP h_C #1", "10.0"), ("HIP h_H #1", "10.0"), ("HIP h_C #1", "10.0"),
    ("CIP h_H #2", "10.0"), ("CIP h_C #2", "10.0"), ("HIP h_H #2", "10.0"), ("HIP h_C #2", "10.0")
]

entries = {}
r = 0
for label, val in params_list:
    ttk.Label(params_frame, text=label).grid(row=r, column=0, sticky="e", padx=6, pady=3)
    e = ttk.Entry(params_frame, width=14)
    e.insert(0, val)
    e.grid(row=r, column=1, padx=6, pady=3)
    entries[label] = e
    r += 1

# ── Results ──────────────────────────────────────────────────────
result_text = tk.Text(root, height=26, font=("Courier", 10))
result_text.pack(padx=12, pady=10, fill="both", expand=True)

# ── Buttons ──────────────────────────────────────────────────────
btn_frame = ttk.Frame(root)
btn_frame.pack(pady=12)

running = False

def update_result(txt):
    result_text.delete(1.0, tk.END)
    result_text.insert(tk.END, txt)

def run_static():
    t3 = pass3.get()
    t4 = pass4.get()
    txt = f"""Static Results (using fixed block inlet flows)
Pass 3 Outlet Temp      : {t3} °F
Pass 4 Outlet Temp      : {t4} °F
CIP 36" required Cv     : ~48,200
CIP 78" required Cv     : ~312,000
HIP 48" required Cv     : ~92,500"""
    update_result(txt)

def start_dynamic():
    global running
    running = True
    update_dynamic()

def pause_dynamic():
    global running
    running = False

def update_dynamic():
    if not running: return
    try:
        ma = float(ma_entry.get())

        # Split-range CIP valves
        if ma <= 12:
            p36 = (ma - 4) / 8 * 100
            p78 = 0
        else:
            p36 = 100
            p78 = (ma - 12) / 8 * 100

        p48 = max(0, min(100, (ma - 4) / 16 * 90))   # HIP follows loosely

        txt = f"""Dynamic Simulation
Time                    : {time.strftime('%H:%M:%S')}
Controller mA           : {ma:.2f} mA
CIP 36" Position        : {p36:.1f} %
CIP 78" Position        : {p78:.1f} %
HIP 48" Position        : {p48:.1f} %

=== Diagram 1 – Cold Interpass Control Loop ===
PID TIC-5224 → TY-5224A (0-50%) → TCV-5224A (36")
            → TY-5224B (50-100%) → TCV-5224B (78")
            → Cold Interpass HX (1540-HX-008) → Pass 4 PV

=== Diagram 2 – Overall Bypass & Measurement ===
Hot Inlet (12/14) → Bypass Valves (5224A/B) → HX → Cold Out
Dead-time + 1/(1+τs) filter on temperature transmitter"""
        update_result(txt)
    except:
        pass
    root.after(900, update_dynamic)

ttk.Button(btn_frame, text="Calculate Static", command=run_static).pack(side="left", padx=15)
ttk.Button(btn_frame, text="Start Dynamic", command=start_dynamic).pack(side="left", padx=15)
ttk.Button(btn_frame, text="Pause", command=pause_dynamic).pack(side="left", padx=15)

# Mode switch
def toggle(*_):
    m = mode_var.get()
    static_frame.grid() if m == "Static" else static_frame.grid_remove()
    dynamic_frame.grid() if m == "Dynamic" else dynamic_frame.grid_remove()

mode_var.trace("w", toggle)
toggle()

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
                  <h1 className="text-xl font-bold" data-testid="text-page-title">Sulfur Interpass HX Valve Simulator</h1>
                  <p className="text-xs text-muted-foreground" data-testid="text-page-subtitle">
                    Three valves - Split-range - Diagrams included
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
