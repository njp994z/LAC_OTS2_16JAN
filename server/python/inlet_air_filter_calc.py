"""
Inlet Air Filter Calculation Module
====================================
Performs mass & volumetric balance for inlet air filter in sulfuric acid plant context.
Assumes essentially clean ambient air with only humidity as non-negligible component.
Filter removes dust/particles but does not change gas composition significantly.

Equipment Tag: 1540-FL-001
Location: Thacker Pass Sulfuric Acid Plant
"""

from dataclasses import dataclass
import math
from typing import Tuple
import json
import sys


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


def calculate_inlet_air_filter(
    cond: OperatingConditions
) -> Tuple[StreamData, StreamData]:
    """
    Calculate inlet and outlet stream compositions and conditions for the inlet air filter.
    
    Assumptions:
    •   Inlet air is clean ambient air (SO₂, SO₃, H₂SO₄ ≈ 0)
    •   Filter removes particulate matter but does not chemically react with or adsorb gases
    •   Pressure drop is applied across the filter
    •   Temperature remains essentially constant (adiabatic filter, no heat exchange)
    •   Humidity is given in grains per lb of dry air
    
    Returns:
        Tuple[StreamData, StreamData]: (inlet_stream, outlet_stream)
    """
    inlet = StreamData()
    outlet = StreamData()

    # ───────────────────────────────────────────────
    # 1. Input validation & basic derived quantities
    # ───────────────────────────────────────────────
    if cond.dry_air_flow_scfm <= 0:
        raise ValueError("Dry air flow must be positive")

    Q_dry_scfm = cond.dry_air_flow_scfm                # dry air @ standard conditions
    humidity_gr_lb = cond.humidity_gr_lb               # grains H₂O / lb dry air

    # Convert humidity to lb H₂O / lb dry air
    lb_H2O_per_lb_dry = humidity_gr_lb / 7000.0        # 7000 gr = 1 lb

    # Molar masses
    MW_DRY_AIR = 28.96      # lb/mol (standard dry air)
    MW_H2O     = 18.015     # lb/mol

    # Moles H₂O per mole dry air
    mol_H2O_per_mol_dry = lb_H2O_per_lb_dry * (MW_DRY_AIR / MW_H2O)

    # Total moles per mole of dry air
    total_mol_per_mol_dry = 1.0 + mol_H2O_per_mol_dry

    # Mole fraction water vapor
    y_H2O = mol_H2O_per_mol_dry / total_mol_per_mol_dry

    # Dry air volumetric flow → total (wet) volumetric flow @ SC
    Q_total_scfm = Q_dry_scfm * total_mol_per_mol_dry

    # ───────────────────────────────────────────────
    # 2. Inlet stream (before filter)
    # ───────────────────────────────────────────────
    inlet.SO2_scfm    = 0.0
    inlet.SO3_scfm    = 0.0
    inlet.H2SO4_scfm  = 0.0

    inlet.O2_scfm     = Q_dry_scfm * 0.2095           # ≈21% vol O₂ (dry basis)
    inlet.N2_scfm     = Q_dry_scfm * 0.7808           # ≈78% vol N₂ + Ar (dry basis)
    inlet.H2O_scfm    = Q_total_scfm * y_H2O

    inlet.total_scfm  = Q_total_scfm

    # Pressure — inlet is atmospheric (gauge pressure = 0)
    inlet.pressure_inwc = 0.0   # Gauge pressure reference point

    inlet.temperature_F = cond.inlet_temp_F

    # ───────────────────────────────────────────────
    # 3. Outlet stream (after filter)
    # ───────────────────────────────────────────────
    # Composition remains virtually identical (clean filter, no reaction)
    outlet.SO2_scfm   = inlet.SO2_scfm
    outlet.SO3_scfm   = inlet.SO3_scfm
    outlet.O2_scfm    = inlet.O2_scfm
    outlet.N2_scfm    = inlet.N2_scfm
    outlet.H2O_scfm   = inlet.H2O_scfm
    outlet.H2SO4_scfm = inlet.H2SO4_scfm

    outlet.total_scfm = inlet.total_scfm

    # Pressure — outlet shows gauge pressure (negative dP from filter)
    outlet.pressure_inwc = -cond.filter_dp_inwc  # Filter dP as negative gauge pressure

    # Temperature — assume no significant change across filter
    outlet.temperature_F = inlet.temperature_F

    return inlet, outlet


def stream_to_dict(stream: StreamData) -> dict:
    """Convert StreamData to dictionary for JSON serialization"""
    return {
        "SO2": round(stream.SO2_scfm, 2),
        "SO3": round(stream.SO3_scfm, 2),
        "O2": round(stream.O2_scfm, 2),
        "N2": round(stream.N2_scfm, 2),
        "H2O": round(stream.H2O_scfm, 2),
        "H2SO4": round(stream.H2SO4_scfm, 2),
        "total": round(stream.total_scfm, 2),
        "pressure": round(stream.pressure_inwc, 2),
        "temperature": round(stream.temperature_F, 1)
    }


def main():
    """Main entry point for command-line execution"""
    if len(sys.argv) < 2:
        # Example usage with default values
        conditions = OperatingConditions(
            dry_air_flow_scfm=87000,
            humidity_gr_lb=11.1,
            inlet_temp_F=38,
            filter_dp_inwc=3,
            barometric_atm=1.0010
        )
    else:
        # Parse JSON input from command line
        input_data = json.loads(sys.argv[1])
        conditions = OperatingConditions(
            dry_air_flow_scfm=float(input_data.get("dryAirFlow", 87000)),
            humidity_gr_lb=float(input_data.get("humidity", 11.1)),
            inlet_temp_F=float(input_data.get("inletTemp", 38)),
            filter_dp_inwc=float(input_data.get("filterDp", 3)),
            barometric_atm=float(input_data.get("barometric", 1.0010))
        )
    
    # Calculate streams
    inlet, outlet = calculate_inlet_air_filter(conditions)
    
    # Output JSON result
    result = {
        "inlet": stream_to_dict(inlet),
        "outlet": stream_to_dict(outlet)
    }
    
    print(json.dumps(result))


if __name__ == "__main__":
    main()
