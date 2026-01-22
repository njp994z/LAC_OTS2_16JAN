import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const pythonCode = `"""
Inlet Air Filter GUI Module
============================
GUI interface for the Inlet Air Filter simulation.
Provides input fields for operating conditions and displays
simulation outputs for Stream #1 (Inlet) and Stream #2 (Outlet).

Equipment Tag: 1540-FL-001
Location: Thacker Pass Sulfuric Acid Plant
"""

import tkinter as tk
from tkinter import ttk, messagebox
from dataclasses import dataclass
from typing import Optional
import math

@dataclass
class OperatingConditions:
    """Input parameters for inlet air filter simulation"""
    dry_air_flow_scfm: float      # Dry air flow rate, SCFM
    humidity_gr_lb: float          # Humidity, grains per lb dry air
    inlet_temp_F: float           # Inlet temperature, °F
    filter_dp_inwc: float         # Filter pressure drop, in wc
    barometric_atm: float         # Barometric pressure, ATM
    realtime_baro: bool = True    # Use realtime barometric data
    realtime_temp: bool = True    # Use realtime temperature data
    realtime_humidity: bool = True # Use realtime humidity data


@dataclass
class StreamData:
    """Stream composition and conditions"""
    SO2_scfm: float = 0.0         # SO2 flow, scfm
    SO3_scfm: float = 0.0         # SO3 flow, scfm
    O2_scfm: float = 0.0          # O2 flow, scfm
    N2_scfm: float = 0.0          # N2 flow, scfm
    H2O_scfm: float = 0.0         # H2O flow, scfm
    H2SO4_scfm: float = 0.0       # H2SO4 flow, scfm
    total_scfm: float = 0.0       # Total flow, scfm
    pressure_inwc: float = 0.0    # Pressure, in wc
    temperature_F: float = 0.0    # Temperature, °F


class InletAirFilterGUI:
    """Main GUI class for Inlet Air Filter simulation"""
    
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Inlet Air Filter - Block Simulation")
        self.root.geometry("1200x800")
        
        # Initialize data
        self.operating_conditions: Optional[OperatingConditions] = None
        self.inlet_stream = StreamData()
        self.outlet_stream = StreamData()
        
        self._create_widgets()
    
    def _create_widgets(self):
        """Create all GUI widgets"""
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky="nsew")
        
        # Title
        title_label = ttk.Label(
            main_frame, 
            text="Inlet Air Filter Block",
            font=("Helvetica", 24, "bold")
        )
        title_label.grid(row=0, column=0, columnspan=2, pady=10)
        
        # Operating Conditions Frame
        self._create_operating_conditions_frame(main_frame)
        
        # Simulation Outputs Frame
        self._create_outputs_frame(main_frame)
        
        # Run Simulation Button
        run_btn = ttk.Button(
            main_frame,
            text="Run Simulation",
            command=self._run_simulation
        )
        run_btn.grid(row=3, column=0, columnspan=2, pady=20)
    
    def _create_operating_conditions_frame(self, parent):
        """Create operating conditions input frame"""
        frame = ttk.LabelFrame(parent, text="Operating Conditions", padding="10")
        frame.grid(row=1, column=0, columnspan=2, sticky="ew", pady=10)
        
        # Dry Air Flow
        ttk.Label(frame, text="Dry Air Flow:").grid(row=0, column=0, sticky="e")
        self.dry_air_flow_var = tk.StringVar(value="87000")
        ttk.Entry(frame, textvariable=self.dry_air_flow_var, width=15).grid(row=0, column=1)
        ttk.Label(frame, text="SCFM").grid(row=0, column=2, sticky="w")
        
        # Humidity
        ttk.Label(frame, text="Humidity:").grid(row=0, column=3, sticky="e", padx=(20, 0))
        self.humidity_var = tk.StringVar(value="11.1")
        ttk.Entry(frame, textvariable=self.humidity_var, width=15).grid(row=0, column=4)
        ttk.Label(frame, text="gr/lb dry air").grid(row=0, column=5, sticky="w")
        
        # Inlet Temp
        ttk.Label(frame, text="Inlet Temp:").grid(row=1, column=0, sticky="e")
        self.inlet_temp_var = tk.StringVar(value="38")
        ttk.Entry(frame, textvariable=self.inlet_temp_var, width=15).grid(row=1, column=1)
        ttk.Label(frame, text="°F").grid(row=1, column=2, sticky="w")
        
        # Filter dP
        ttk.Label(frame, text="Filter dP:").grid(row=1, column=3, sticky="e", padx=(20, 0))
        self.filter_dp_var = tk.StringVar(value="3")
        ttk.Entry(frame, textvariable=self.filter_dp_var, width=15).grid(row=1, column=4)
        ttk.Label(frame, text="in wc").grid(row=1, column=5, sticky="w")
        
        # Barometric
        ttk.Label(frame, text="Barometric:").grid(row=2, column=0, sticky="e")
        self.barometric_var = tk.StringVar(value="1.0010")
        ttk.Entry(frame, textvariable=self.barometric_var, width=15).grid(row=2, column=1)
        ttk.Label(frame, text="atm").grid(row=2, column=2, sticky="w")
        
        # Realtime options
        self.realtime_baro_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(frame, text="Realtime Baro", variable=self.realtime_baro_var).grid(row=3, column=0, columnspan=2)
        
        self.realtime_temp_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(frame, text="Realtime Temp", variable=self.realtime_temp_var).grid(row=3, column=2, columnspan=2)
        
        self.realtime_humidity_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(frame, text="Realtime Humidity", variable=self.realtime_humidity_var).grid(row=3, column=4, columnspan=2)
    
    def _create_outputs_frame(self, parent):
        """Create simulation outputs display frame"""
        frame = ttk.LabelFrame(parent, text="Simulation Outputs", padding="10")
        frame.grid(row=2, column=0, columnspan=2, sticky="ew", pady=10)
        
        # Headers
        headers = ["", "Units", "Stream #1\\nInlet Air Filter In\\nATM Cond.\\nGAF0", 
                   "Stream #2\\nInlet Air Filter Out\\n1540-PI-5801\\nGAF1"]
        for col, header in enumerate(headers):
            ttk.Label(frame, text=header, font=("Helvetica", 10, "bold")).grid(row=0, column=col)
        
        # Data rows
        self.output_vars = {}
        rows = [
            ("SO2", "scfm"),
            ("SO3", "scfm"),
            ("O2", "scfm"),
            ("N2", "scfm"),
            ("H2O", "scfm"),
            ("H2SO4", "scfm"),
            ("TOTAL", "scfm"),
            ("PRESSURE", "in. wc."),
            ("TEMPERATURE", "F")
        ]
        
        for row_idx, (name, unit) in enumerate(rows, start=1):
            ttk.Label(frame, text=name).grid(row=row_idx, column=0, sticky="w")
            ttk.Label(frame, text=unit).grid(row=row_idx, column=1)
            
            inlet_var = tk.StringVar(value="---")
            outlet_var = tk.StringVar(value="---")
            
            ttk.Label(frame, textvariable=inlet_var).grid(row=row_idx, column=2)
            ttk.Label(frame, textvariable=outlet_var).grid(row=row_idx, column=3)
            
            self.output_vars[f"inlet_{name.lower()}"] = inlet_var
            self.output_vars[f"outlet_{name.lower()}"] = outlet_var
    
    def _run_simulation(self):
        """Execute inlet air filter simulation"""
        try:
            # Collect inputs
            self.operating_conditions = OperatingConditions(
                dry_air_flow_scfm=float(self.dry_air_flow_var.get()),
                humidity_gr_lb=float(self.humidity_var.get()),
                inlet_temp_F=float(self.inlet_temp_var.get()),
                filter_dp_inwc=float(self.filter_dp_var.get()),
                barometric_atm=float(self.barometric_var.get()),
                realtime_baro=self.realtime_baro_var.get(),
                realtime_temp=self.realtime_temp_var.get(),
                realtime_humidity=self.realtime_humidity_var.get()
            )
            
            # Call simulation calculation
            from inlet_air_filter_calc import calculate_inlet_air_filter
            self.inlet_stream, self.outlet_stream = calculate_inlet_air_filter(
                self.operating_conditions
            )
            
            # Update display
            self._update_outputs()
            
            messagebox.showinfo("Success", "Simulation completed successfully!")
            
        except ValueError as e:
            messagebox.showerror("Input Error", f"Invalid input: {e}")
        except Exception as e:
            messagebox.showerror("Error", f"Simulation failed: {e}")
    
    def _update_outputs(self):
        """Update output display with simulation results"""
        # Update inlet stream values
        self.output_vars["inlet_so2"].set(f"{self.inlet_stream.SO2_scfm:.2f}")
        self.output_vars["inlet_so3"].set(f"{self.inlet_stream.SO3_scfm:.2f}")
        self.output_vars["inlet_o2"].set(f"{self.inlet_stream.O2_scfm:.2f}")
        self.output_vars["inlet_n2"].set(f"{self.inlet_stream.N2_scfm:.2f}")
        self.output_vars["inlet_h2o"].set(f"{self.inlet_stream.H2O_scfm:.2f}")
        self.output_vars["inlet_h2so4"].set(f"{self.inlet_stream.H2SO4_scfm:.2f}")
        self.output_vars["inlet_total"].set(f"{self.inlet_stream.total_scfm:.2f}")
        self.output_vars["inlet_pressure"].set(f"{self.inlet_stream.pressure_inwc:.2f}")
        self.output_vars["inlet_temperature"].set(f"{self.inlet_stream.temperature_F:.1f}")
        
        # Update outlet stream values
        self.output_vars["outlet_so2"].set(f"{self.outlet_stream.SO2_scfm:.2f}")
        self.output_vars["outlet_so3"].set(f"{self.outlet_stream.SO3_scfm:.2f}")
        self.output_vars["outlet_o2"].set(f"{self.outlet_stream.O2_scfm:.2f}")
        self.output_vars["outlet_n2"].set(f"{self.outlet_stream.N2_scfm:.2f}")
        self.output_vars["outlet_h2o"].set(f"{self.outlet_stream.H2O_scfm:.2f}")
        self.output_vars["outlet_h2so4"].set(f"{self.outlet_stream.H2SO4_scfm:.2f}")
        self.output_vars["outlet_total"].set(f"{self.outlet_stream.total_scfm:.2f}")
        self.output_vars["outlet_pressure"].set(f"{self.outlet_stream.pressure_inwc:.2f}")
        self.output_vars["outlet_temperature"].set(f"{self.outlet_stream.temperature_F:.1f}")


def main():
    """Main entry point"""
    root = tk.Tk()
    app = InletAirFilterGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
`;

export default function InletAirFilterGuiCode() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            asChild
            data-testid="button-download-gui-code"
          >
            <a href="/api/download-python/inlet_air_filter_gui.py" download>
              <Download className="w-4 h-4" />
              Download inlet_air_filter_gui.py
            </a>
          </Button>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Card data-testid="card-python-code">
            <CardHeader>
              <CardTitle data-testid="title-python-code">Inlet Air Filter GUI Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden" data-testid="code-display">
                <SyntaxHighlighter
                  language="python"
                  style={vscDarkPlus}
                  showLineNumbers
                  customStyle={{
                    margin: 0,
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  {pythonCode}
                </SyntaxHighlighter>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
