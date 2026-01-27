"""
Main Compressor GUI Module
============================
GUI interface for the Main Compressor simulation.
Provides input fields for operating conditions and displays
simulation outputs in a performance table matching the desired structure.

Equipment Tag: 1540-KC-001
Compressor Model: Howden SF14
Location: Thacker Pass Sulfuric Acid Plant
Updated to display performance metrics as per the simulation results picture.
"""

import tkinter as tk
from tkinter import ttk, messagebox
from dataclasses import dataclass
from typing import Optional

# Import the calculator module
from compressor_calculator import CompressorInput, CompressorOutput, calculate_compressor_performance


@dataclass
class OperatingConditions:
    """Input parameters for main compressor simulation"""
    rpm_percent: float            # Speed as % of max RPM
    inlet_temp_F: float          # Inlet temperature, °F
    inlet_pressure_inwc: float   # Inlet pressure, in wc
    barometric_atm: float        # Barometric pressure, ATM
    plant_condition: str         # "clean" or "dirty"
    realtime_baro: bool = True   # Use realtime barometric data (placeholder)


class MainCompressorGUI:
    """Main GUI class for Main Compressor simulation"""
    
    MAX_RPM = 4505.0  # Max speed from datasheet
    
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Main Compressor - Block Simulation")
        self.root.geometry("1200x800")
        
        # Initialize data
        self.operating_conditions: Optional[OperatingConditions] = None
        self.result: Optional[CompressorOutput] = None
        
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
        """Create simulation outputs display frame matching the picture"""
        frame = ttk.LabelFrame(parent, text="Simulation Results", padding="10")
        frame.grid(row=2, column=0, columnspan=2, sticky="ew", pady=10)
        
        # Headers
        headers = ["Parameter", "Units", "Value"]
        for col, header in enumerate(headers):
            ttk.Label(frame, text=header, font=("Helvetica", 10, "bold")).grid(row=0, column=col, sticky="w", padx=5)
        
        # Data rows
        self.output_vars = {}
        rows = [
            ("Inlet Flow", "acfm"),
            ("Inlet Pressure (calculated)", "in wc"),
            ("Outlet Temperature", "°F"),
            ("Outlet Pressure", "in wc"),
            ("Pressure Rise", "in wc"),
            ("Standard Flow", "scfm"),
            ("Mass Flow", "klb/hr"),
            ("Motor Brakehorse Power", "hp"),
            ("VFD Current", "Amps"),
            ("Motor Speed", "RPM"),
            ("Compressor Speed", "RPM")
        ]
        
        for row_idx, (name, unit) in enumerate(rows, start=1):
            ttk.Label(frame, text=name).grid(row=row_idx, column=0, sticky="w", padx=5)
            ttk.Label(frame, text=unit).grid(row=row_idx, column=1, sticky="w", padx=5)
            
            value_var = tk.StringVar(value="---")
            ttk.Label(frame, textvariable=value_var).grid(row=row_idx, column=2, sticky="w", padx=5)
            
            self.output_vars[name.lower().replace(" ", "_").replace("(", "").replace(")", "")] = value_var
    
    def _run_simulation(self):
        """Execute main compressor simulation"""
        try:
            # Collect inputs
            rpm_percent = float(self.rpm_percent_var.get())
            rpms = rpm_percent / 100 * self.MAX_RPM
            
            self.operating_conditions = OperatingConditions(
                rpm_percent=rpm_percent,
                inlet_temp_F=float(self.inlet_temp_var.get()),
                inlet_pressure_inwc=float(self.inlet_pressure_var.get()),
                barometric_atm=float(self.barometric_var.get()),
                plant_condition=self.plant_condition_var.get(),
                realtime_baro=self.realtime_baro_var.get()
            )
            
            # Create compressor input
            compressor_input = CompressorInput(
                rpms=rpms,
                inlet_temp_F=self.operating_conditions.inlet_temp_F,
                inlet_pressure_inwc=self.operating_conditions.inlet_pressure_inwc,
                barometric_atm=self.operating_conditions.barometric_atm
            )
            
            # Call simulation calculation
            self.result = calculate_compressor_performance(compressor_input)
            
            # Update display
            self._update_outputs()
            
            messagebox.showinfo("Success", "Simulation completed successfully!")
            
        except ValueError as e:
            messagebox.showerror("Input Error", f"Invalid input: {e}")
        except Exception as e:
            messagebox.showerror("Error", f"Simulation failed: {e}")
    
    def _update_outputs(self):
        """Update output display with simulation results"""
        if self.result is None:
            return
        
        self.output_vars["inlet_flow"].set(f"{self.result.inlet_flow_acfm:,.0f}")
        self.output_vars["inlet_pressure_calculated"].set(f"{self.result.inlet_pressure_inwc:.1f}")
        self.output_vars["outlet_temperature"].set(f"{self.result.outlet_temp_F:.1f}")
        self.output_vars["outlet_pressure"].set(f"{self.result.outlet_pressure_inwc:.1f}")
        self.output_vars["pressure_rise"].set(f"{self.result.pressure_rise_inwc:.1f}")
        self.output_vars["standard_flow"].set(f"{self.result.standard_flow_scfm:,.0f}")
        self.output_vars["mass_flow"].set(f"{self.result.mass_flow_klbhr:.1f}")
        self.output_vars["motor_brakehorse_power"].set(f"{self.result.motor_power_hp:,.0f}")
        self.output_vars["vfd_current"].set(f"{self.result.vfd_current:,.0f}")
        self.output_vars["motor_speed"].set(f"{self.result.driver_speed:,.0f}")
        self.output_vars["compressor_speed"].set(f"{self.result.compressor_speed:,.0f}")


def main():
    """Main entry point"""
    root = tk.Tk()
    app = MainCompressorGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
