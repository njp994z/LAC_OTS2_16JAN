import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import expLogo from "@/assets/exp-logo.png";

const pythonCode = `"""
Main Compressor GUI Module
============================
GUI interface for the Main Compressor simulation.
Provides input fields for operating conditions and displays
simulation outputs for Stream #3 (Inlet) and Stream #4 (Outlet).

Equipment Tag: 1540-KC-001
Compressor Model: Howden SF14
Location: Thacker Pass Sulfuric Acid Plant
"""

import tkinter as tk
from tkinter import ttk, messagebox
from dataclasses import dataclass
from typing import Optional


@dataclass
class OperatingConditions:
    """Input parameters for main compressor simulation"""
    rpm_percent: float            # Speed as % of max RPM
    inlet_temp_F: float          # Inlet temperature, °F
    inlet_pressure_inwc: float   # Inlet pressure, in wc
    barometric_atm: float        # Barometric pressure, ATM
    plant_condition: str         # "clean" or "dirty"
    realtime_baro: bool = True   # Use realtime barometric data


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


class MainCompressorGUI:
    """Main GUI class for Main Compressor simulation"""
    
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Main Compressor - Block Simulation")
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
            text="Main Compressor Block",
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
        
        # Speed (% of max)
        ttk.Label(frame, text="Speed:").grid(row=0, column=0, sticky="e")
        self.rpm_percent_var = tk.StringVar(value="88")
        ttk.Entry(frame, textvariable=self.rpm_percent_var, width=15).grid(row=0, column=1)
        ttk.Label(frame, text="% of max").grid(row=0, column=2, sticky="w")
        
        # Plant Condition
        ttk.Label(frame, text="Plant Condition:").grid(row=0, column=3, sticky="e", padx=(20, 0))
        self.plant_condition_var = tk.StringVar(value="clean")
        condition_combo = ttk.Combobox(
            frame, 
            textvariable=self.plant_condition_var,
            values=["clean", "dirty"],
            width=12,
            state="readonly"
        )
        condition_combo.grid(row=0, column=4)
        
        # Inlet Temp
        ttk.Label(frame, text="Inlet Temp:").grid(row=1, column=0, sticky="e")
        self.inlet_temp_var = tk.StringVar(value="150")
        ttk.Entry(frame, textvariable=self.inlet_temp_var, width=15).grid(row=1, column=1)
        ttk.Label(frame, text="°F").grid(row=1, column=2, sticky="w")
        
        # Inlet Pressure
        ttk.Label(frame, text="Inlet Pressure:").grid(row=1, column=3, sticky="e", padx=(20, 0))
        self.inlet_pressure_var = tk.StringVar(value="-3")
        ttk.Entry(frame, textvariable=self.inlet_pressure_var, width=15).grid(row=1, column=4)
        ttk.Label(frame, text="in wc").grid(row=1, column=5, sticky="w")
        
        # Barometric
        ttk.Label(frame, text="Barometric:").grid(row=2, column=0, sticky="e")
        self.barometric_var = tk.StringVar(value="0.8491")
        ttk.Entry(frame, textvariable=self.barometric_var, width=15).grid(row=2, column=1)
        ttk.Label(frame, text="atm").grid(row=2, column=2, sticky="w")
        
        # Realtime options
        self.realtime_baro_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(frame, text="Realtime Baro", variable=self.realtime_baro_var).grid(row=3, column=0, columnspan=2)
    
    def _create_outputs_frame(self, parent):
        """Create simulation outputs display frame"""
        frame = ttk.LabelFrame(parent, text="Simulation Outputs - Static Mode", padding="10")
        frame.grid(row=2, column=0, columnspan=2, sticky="ew", pady=10)
        
        # Headers
        headers = ["", "Units", "Stream #3\\nCompressor Inlet\\n1540-FI-4070\\nGC0", 
                   "Stream #4\\nCompressor Outlet\\n1540-PI-4002\\nGC1"]
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
        """Execute main compressor simulation"""
        try:
            # Collect inputs
            self.operating_conditions = OperatingConditions(
                rpm_percent=float(self.rpm_percent_var.get()),
                inlet_temp_F=float(self.inlet_temp_var.get()),
                inlet_pressure_inwc=float(self.inlet_pressure_var.get()),
                barometric_atm=float(self.barometric_var.get()),
                plant_condition=self.plant_condition_var.get(),
                realtime_baro=self.realtime_baro_var.get()
            )
            
            # Call simulation calculation
            from compressor_calculator import calculate_compressor
            result = calculate_compressor(self.operating_conditions)
            
            # Update inlet/outlet streams from result
            self.inlet_stream = StreamData(
                SO2_scfm=result.inlet_stream.get("SO2", 0),
                SO3_scfm=result.inlet_stream.get("SO3", 0),
                O2_scfm=result.inlet_stream.get("O2", 0),
                N2_scfm=result.inlet_stream.get("N2", 0),
                H2O_scfm=result.inlet_stream.get("H2O", 0),
                H2SO4_scfm=result.inlet_stream.get("H2SO4", 0),
                total_scfm=result.inlet_stream.get("total", 0),
                pressure_inwc=result.inlet_stream.get("pressure", 0),
                temperature_F=result.inlet_stream.get("temperature", 0)
            )
            self.outlet_stream = StreamData(
                SO2_scfm=result.outlet_stream.get("SO2", 0),
                SO3_scfm=result.outlet_stream.get("SO3", 0),
                O2_scfm=result.outlet_stream.get("O2", 0),
                N2_scfm=result.outlet_stream.get("N2", 0),
                H2O_scfm=result.outlet_stream.get("H2O", 0),
                H2SO4_scfm=result.outlet_stream.get("H2SO4", 0),
                total_scfm=result.outlet_stream.get("total", 0),
                pressure_inwc=result.outlet_stream.get("pressure", 0),
                temperature_F=result.outlet_stream.get("temperature", 0)
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
    app = MainCompressorGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
`;

export default function MainCompressorGuiCode() {
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
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
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
            <a href="/api/download-python/compressor_gui.py" download>
              <Download className="w-4 h-4" />
              Download compressor_gui.py
            </a>
          </Button>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Card data-testid="card-python-code">
            <CardHeader>
              <CardTitle data-testid="title-python-code">Main Compressor GUI Code</CardTitle>
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
