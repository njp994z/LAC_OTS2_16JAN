import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const pythonCode = `"""
Inlet Air Filter Simulation Calculator
======================================
Calculates stream compositions and conditions for the inlet air filter
based on operating conditions and atmospheric parameters.

Equipment Tag: 1540-FL-001
Location: Thacker Pass Sulfuric Acid Plant

Stream Definitions:
  - Stream #1 (GAF0): Inlet Air Filter In - Atmospheric conditions
  - Stream #2 (GAF1): Inlet Air Filter Out - After filter (1540-PI-5801)
"""

import math
from dataclasses import dataclass
from typing import Tuple

# Constants
R_UNIVERSAL = 10.7316  # ft³·psia/(lbmol·°R)
MW_AIR = 28.97         # Molecular weight of air, lb/lbmol
MW_H2O = 18.015        # Molecular weight of water, lb/lbmol
O2_FRACTION = 0.2095   # O2 mole fraction in dry air
N2_FRACTION = 0.7808   # N2 mole fraction in dry air
AR_FRACTION = 0.0093   # Ar mole fraction in dry air (treated as N2)
CO2_FRACTION = 0.0004  # CO2 mole fraction in dry air (treated as N2)


@dataclass
class OperatingConditions:
    """Input parameters for inlet air filter simulation"""
    dry_air_flow_scfm: float      # Dry air flow rate, SCFM
    humidity_gr_lb: float          # Humidity, grains per lb dry air
    inlet_temp_F: float           # Inlet temperature, °F
    filter_dp_inwc: float         # Filter pressure drop, in wc
    barometric_atm: float         # Barometric pressure, ATM


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
    pressure_inwc: float = 0.0    # Pressure, in wc (gauge)
    temperature_F: float = 0.0    # Temperature, °F


def grains_to_lb_water_per_lb_dry_air(grains_per_lb: float) -> float:
    """
    Convert humidity from grains per lb dry air to lb water per lb dry air.
    1 lb = 7000 grains
    """
    return grains_per_lb / 7000.0


def calculate_water_mole_fraction(humidity_gr_lb: float) -> float:
    """
    Calculate water vapor mole fraction from humidity.
    
    Args:
        humidity_gr_lb: Humidity in grains per lb dry air
        
    Returns:
        Mole fraction of water vapor in moist air
    """
    # Convert grains to lb water per lb dry air
    lb_water_per_lb_dry = grains_to_lb_water_per_lb_dry_air(humidity_gr_lb)
    
    # Convert to molar basis
    # n_water / n_dry_air = (lb_water / MW_H2O) / (lb_dry_air / MW_AIR)
    mol_ratio = (lb_water_per_lb_dry / MW_H2O) * MW_AIR
    
    # Mole fraction of water = mol_ratio / (1 + mol_ratio)
    y_h2o = mol_ratio / (1 + mol_ratio)
    
    return y_h2o


def calculate_component_flows(
    dry_air_flow_scfm: float,
    humidity_gr_lb: float
) -> Tuple[float, float, float]:
    """
    Calculate O2, N2, and H2O flows from dry air flow and humidity.
    
    Args:
        dry_air_flow_scfm: Dry air flow rate, SCFM
        humidity_gr_lb: Humidity in grains per lb dry air
        
    Returns:
        Tuple of (O2_scfm, N2_scfm, H2O_scfm)
    """
    # O2 and N2 flows from dry air
    O2_scfm = dry_air_flow_scfm * O2_FRACTION
    N2_scfm = dry_air_flow_scfm * (N2_FRACTION + AR_FRACTION + CO2_FRACTION)
    
    # Water vapor flow
    y_h2o = calculate_water_mole_fraction(humidity_gr_lb)
    
    # Total moist air flow = dry air flow / (1 - y_h2o)
    total_moist_air_scfm = dry_air_flow_scfm / (1 - y_h2o)
    
    # H2O flow = total flow * y_h2o
    H2O_scfm = total_moist_air_scfm * y_h2o
    
    return O2_scfm, N2_scfm, H2O_scfm


def atm_to_inwc_gauge(atm: float) -> float:
    """
    Convert atmospheric pressure to inches water column (gauge).
    At atmospheric conditions, gauge pressure is 0.
    
    Args:
        atm: Barometric pressure in atmospheres
        
    Returns:
        Pressure in inches water column (gauge) - always 0 at atmospheric
    """
    return 0.0


def calculate_inlet_air_filter(
    conditions: OperatingConditions
) -> Tuple[StreamData, StreamData]:
    """
    Calculate inlet and outlet stream conditions for the air filter.
    
    The inlet air filter introduces a pressure drop but does not change
    the composition or temperature of the air stream.
    
    Args:
        conditions: Operating conditions for the filter
        
    Returns:
        Tuple of (inlet_stream, outlet_stream)
    """
    # Calculate component flows
    O2_scfm, N2_scfm, H2O_scfm = calculate_component_flows(
        conditions.dry_air_flow_scfm,
        conditions.humidity_gr_lb
    )
    
    # Total flow
    total_scfm = conditions.dry_air_flow_scfm + H2O_scfm
    
    # Inlet stream (Stream #1) - Atmospheric conditions
    inlet_stream = StreamData(
        SO2_scfm=0.0,            # No SO2 in atmospheric air
        SO3_scfm=0.0,            # No SO3 in atmospheric air
        O2_scfm=O2_scfm,
        N2_scfm=N2_scfm,
        H2O_scfm=H2O_scfm,
        H2SO4_scfm=0.0,          # No H2SO4 in atmospheric air
        total_scfm=total_scfm,
        pressure_inwc=0.0,       # Atmospheric = 0 gauge
        temperature_F=conditions.inlet_temp_F
    )
    
    # Outlet stream (Stream #2) - After filter
    # Composition unchanged, pressure drops by filter dP
    outlet_stream = StreamData(
        SO2_scfm=0.0,
        SO3_scfm=0.0,
        O2_scfm=O2_scfm,
        N2_scfm=N2_scfm,
        H2O_scfm=H2O_scfm,
        H2SO4_scfm=0.0,
        total_scfm=total_scfm,
        pressure_inwc=-conditions.filter_dp_inwc,  # Negative gauge (suction)
        temperature_F=conditions.inlet_temp_F      # No temperature change
    )
    
    return inlet_stream, outlet_stream


def main():
    """Example usage of the inlet air filter calculator"""
    # Define operating conditions
    conditions = OperatingConditions(
        dry_air_flow_scfm=87000,
        humidity_gr_lb=11.1,
        inlet_temp_F=38,
        filter_dp_inwc=3,
        barometric_atm=1.0010
    )
    
    # Calculate streams
    inlet, outlet = calculate_inlet_air_filter(conditions)
    
    # Print results
    print("=" * 60)
    print("INLET AIR FILTER SIMULATION RESULTS")
    print("=" * 60)
    print(f"\\n{'Component':<12} {'Units':<10} {'Stream #1':<15} {'Stream #2':<15}")
    print("-" * 52)
    print(f"{'SO2':<12} {'scfm':<10} {inlet.SO2_scfm:<15.2f} {outlet.SO2_scfm:<15.2f}")
    print(f"{'SO3':<12} {'scfm':<10} {inlet.SO3_scfm:<15.2f} {outlet.SO3_scfm:<15.2f}")
    print(f"{'O2':<12} {'scfm':<10} {inlet.O2_scfm:<15.2f} {outlet.O2_scfm:<15.2f}")
    print(f"{'N2':<12} {'scfm':<10} {inlet.N2_scfm:<15.2f} {outlet.N2_scfm:<15.2f}")
    print(f"{'H2O':<12} {'scfm':<10} {inlet.H2O_scfm:<15.2f} {outlet.H2O_scfm:<15.2f}")
    print(f"{'H2SO4':<12} {'scfm':<10} {inlet.H2SO4_scfm:<15.2f} {outlet.H2SO4_scfm:<15.2f}")
    print(f"{'TOTAL':<12} {'scfm':<10} {inlet.total_scfm:<15.2f} {outlet.total_scfm:<15.2f}")
    print(f"{'PRESSURE':<12} {'in wc':<10} {inlet.pressure_inwc:<15.2f} {outlet.pressure_inwc:<15.2f}")
    print(f"{'TEMPERATURE':<12} {'°F':<10} {inlet.temperature_F:<15.1f} {outlet.temperature_F:<15.1f}")


if __name__ == "__main__":
    main()
`;

export default function InletAirFilterSimCode() {
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
            data-testid="button-download-sim-code"
          >
            <a href="/api/download-python/inlet_air_filter_calc.py" download>
              <Download className="w-4 h-4" />
              Download inlet_air_filter_calc.py
            </a>
          </Button>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Card data-testid="card-python-code">
            <CardHeader>
              <CardTitle data-testid="title-python-code">Inlet Air Filter Simulation Code</CardTitle>
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
