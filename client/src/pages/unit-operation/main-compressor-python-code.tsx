import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import expLogo from "@/assets/exp-logo.png";

const pythonCode = `"""
Main Compressor Performance Calculator
=====================================
Calculates compressor outlet conditions and performance metrics
based on inlet parameters and machine characteristics.

Reference: Howden SF 14.0 Compressor for Thacker Pass Project
Equipment Tag: 1540-GB-001
"""

import math
from dataclasses import dataclass
from typing import Tuple

# Constants
R_AIR = 53.35  # Gas constant for air, ft·lbf/(lbm·°R)
GAMMA = 1.4    # Specific heat ratio for air (Cp/Cv)
MW_AIR = 28.97 # Molecular weight of air, lb/lbmol

@dataclass
class CompressorInput:
    """Input parameters for compressor calculation"""
    rpms: float           # Compressor speed, 1/min
    inlet_temp_F: float   # Inlet temperature, °F
    inlet_pressure_inwc: float  # Inlet pressure, IN WC (gauge)
    barometric_atm: float # Barometric pressure, ATM

@dataclass  
class CompressorOutput:
    """Output parameters from compressor calculation"""
    inlet_flow_acfm: float      # Actual inlet flow, acfm
    inlet_flow_am3hr: float     # Actual inlet flow, Am³/hr
    outlet_temp_F: float        # Outlet temperature, °F
    outlet_temp_C: float        # Outlet temperature, °C
    outlet_pressure_inwc: float # Outlet pressure, IN WC
    outlet_pressure_mmwg: float # Outlet pressure, mm WG
    temp_rise_F: float          # Temperature rise, °F
    temp_rise_C: float          # Temperature rise, °C
    pressure_rise_inwc: float   # Pressure rise, IN WC
    pressure_rise_mmwg: float   # Pressure rise, mm WG
    standard_flow_scfm: float   # Standard flow, scfm
    standard_flow_nm3hr: float  # Standard flow, Nm³/hr
    outlet_flow_acfm: float     # Outlet flow, acfm
    outlet_flow_am3hr: float    # Outlet flow, Am³/hr
    mass_flow_klbhr: float      # Mass flow, klb/hr
    mass_flow_MThr: float       # Mass flow, MT/hr
    isentropic_head_ftlblb: float  # Isentropic head, ft·lb/lb
    isentropic_head_kJkg: float    # Isentropic head, kJ/kg
    brake_power_hp: float       # Brake power, hp
    brake_power_MW: float       # Brake power, MW
    motor_power_hp: float       # Motor power, hp
    motor_power_MW: float       # Motor power, MW
    driver_speed: float         # Driver speed, 1/min


def inwc_to_psia(inwc: float, barometric_atm: float) -> float:
    """Convert inches water column (gauge) to psia"""
    barometric_psia = barometric_atm * 14.696
    inwc_to_psi = inwc * 0.03613  # 1 inWC = 0.03613 psi
    return barometric_psia + inwc_to_psi


def psia_to_inwc(psia: float, barometric_atm: float) -> float:
    """Convert psia to inches water column (gauge)"""
    barometric_psia = barometric_atm * 14.696
    gauge_psi = psia - barometric_psia
    return gauge_psi / 0.03613


def fahrenheit_to_celsius(temp_F: float) -> float:
    """Convert Fahrenheit to Celsius"""
    return (temp_F - 32) * 5 / 9


def inwc_to_mmwg(inwc: float) -> float:
    """Convert inches water column to mm water gauge"""
    return inwc * 25.4


def acfm_to_am3hr(acfm: float) -> float:
    """Convert actual cubic feet per minute to actual cubic meters per hour"""
    return acfm * 0.0283168 * 60


def scfm_to_nm3hr(scfm: float) -> float:
    """Convert standard cubic feet per minute to normal cubic meters per hour"""
    # Standard conditions: 14.7 psia, 60°F (US) vs Normal: 1 atm, 0°C (metric)
    # Conversion factor accounts for temperature difference
    return scfm * 0.0283168 * 60 * (273.15 / 288.71)


def calculate_isentropic_head(
    inlet_temp_R: float,
    pressure_ratio: float,
    gamma: float = GAMMA
) -> float:
    """
    Calculate isentropic head using polytropic relations.
    
    H_is = (gamma / (gamma-1)) * R * T1 * [(P2/P1)^((gamma-1)/gamma) - 1]
    
    Returns head in ft·lbf/lbm
    """
    exponent = (gamma - 1) / gamma
    head = (gamma / (gamma - 1)) * R_AIR * inlet_temp_R * (
        pressure_ratio ** exponent - 1
    )
    return head


def calculate_outlet_temp(
    inlet_temp_R: float,
    pressure_ratio: float,
    efficiency: float = 0.78,
    gamma: float = GAMMA
) -> float:
    """
    Calculate outlet temperature accounting for polytropic efficiency.
    
    T2 = T1 * [1 + (1/eta) * ((P2/P1)^((gamma-1)/gamma) - 1)]
    
    Returns temperature in °R
    """
    exponent = (gamma - 1) / gamma
    temp_ratio = pressure_ratio ** exponent
    outlet_temp_R = inlet_temp_R * (1 + (1 / efficiency) * (temp_ratio - 1))
    return outlet_temp_R


def calculate_compressor_performance(inp: CompressorInput) -> CompressorOutput:
    """
    Main calculation function for compressor performance.
    
    Uses Howden SF 14.0 characteristic curves as reference.
    """
    # Convert temperatures to absolute (Rankine)
    inlet_temp_R = inp.inlet_temp_F + 459.67
    
    # Convert pressures to psia
    inlet_psia = inwc_to_psia(inp.inlet_pressure_inwc, inp.barometric_atm)
    
    # Calculate pressure rise based on speed (approximate from curves)
    # Reference: At 4174 rpm, pressure rise = 199 inWC
    #            At 2400 rpm, pressure rise = 56 inWC
    reference_speed = 4174.0  # 1/min
    reference_dp = 199.0      # inWC
    
    # Pressure rise scales approximately with speed squared
    speed_ratio = inp.rpms / reference_speed
    pressure_rise_inwc = reference_dp * speed_ratio ** 2
    
    # Calculate outlet pressure
    outlet_psia = inwc_to_psia(inp.inlet_pressure_inwc + pressure_rise_inwc, inp.barometric_atm)
    pressure_ratio = outlet_psia / inlet_psia
    
    # Calculate isentropic head
    isentropic_head = calculate_isentropic_head(inlet_temp_R, pressure_ratio)
    
    # Calculate outlet temperature (assume 78% polytropic efficiency)
    outlet_temp_R = calculate_outlet_temp(inlet_temp_R, pressure_ratio, 0.78)
    outlet_temp_F = outlet_temp_R - 459.67
    
    # Calculate flows (approximate from reference data)
    # At 4174 rpm: 177051 acfm, 556274 lb/hr
    ref_flow_acfm = 177051.0
    flow_ratio = speed_ratio  # Flow proportional to speed
    inlet_flow_acfm = ref_flow_acfm * flow_ratio
    
    # Mass flow from ideal gas law
    inlet_density = (inlet_psia * 144) / (R_AIR * inlet_temp_R)  # lbm/ft³
    mass_flow_lbhr = inlet_flow_acfm * inlet_density * 60  # lb/hr
    
    # Standard flow (at 14.7 psia, 60°F)
    std_temp_R = 60 + 459.67
    std_pressure = 14.7  # psia
    std_density = (std_pressure * 144) / (R_AIR * std_temp_R)
    standard_flow_scfm = mass_flow_lbhr / (std_density * 60)
    
    # Outlet flow (at outlet conditions)
    outlet_density = (outlet_psia * 144) / (R_AIR * outlet_temp_R)
    outlet_flow_acfm = mass_flow_lbhr / (outlet_density * 60)
    
    # Power calculation
    # P = m_dot * H_is / (efficiency * 33000)
    # where 33000 converts ft·lbf/min to hp
    efficiency = 0.78
    brake_power_hp = (mass_flow_lbhr / 60) * isentropic_head / (efficiency * 33000)
    motor_power_hp = brake_power_hp / 0.96  # Motor efficiency ~96%
    
    # Driver speed (gearbox ratio from reference data)
    # At 4174 rpm compressor, driver is 1654 rpm
    gearbox_ratio = 4174.0 / 1654.0  # ≈ 2.524
    driver_speed = inp.rpms / gearbox_ratio
    
    # Build output
    return CompressorOutput(
        inlet_flow_acfm=inlet_flow_acfm,
        inlet_flow_am3hr=acfm_to_am3hr(inlet_flow_acfm),
        outlet_temp_F=outlet_temp_F,
        outlet_temp_C=fahrenheit_to_celsius(outlet_temp_F),
        outlet_pressure_inwc=inp.inlet_pressure_inwc + pressure_rise_inwc,
        outlet_pressure_mmwg=inwc_to_mmwg(inp.inlet_pressure_inwc + pressure_rise_inwc),
        temp_rise_F=outlet_temp_F - inp.inlet_temp_F,
        temp_rise_C=fahrenheit_to_celsius(outlet_temp_F) - fahrenheit_to_celsius(inp.inlet_temp_F),
        pressure_rise_inwc=pressure_rise_inwc,
        pressure_rise_mmwg=inwc_to_mmwg(pressure_rise_inwc),
        standard_flow_scfm=standard_flow_scfm,
        standard_flow_nm3hr=scfm_to_nm3hr(standard_flow_scfm),
        outlet_flow_acfm=outlet_flow_acfm,
        outlet_flow_am3hr=acfm_to_am3hr(outlet_flow_acfm),
        mass_flow_klbhr=mass_flow_lbhr / 1000,
        mass_flow_MThr=mass_flow_lbhr / 2204.62,
        isentropic_head_ftlblb=isentropic_head,
        isentropic_head_kJkg=isentropic_head * 0.001356,  # ft·lb/lb to kJ/kg
        brake_power_hp=brake_power_hp,
        brake_power_MW=brake_power_hp * 0.0007457,
        motor_power_hp=motor_power_hp,
        motor_power_MW=motor_power_hp * 0.0007457,
        driver_speed=driver_speed
    )


if __name__ == "__main__":
    # Test with reference operating point (Case 3)
    test_input = CompressorInput(
        rpms=4174,
        inlet_temp_F=150,
        inlet_pressure_inwc=-13,  # Slight vacuum at inlet
        barometric_atm=0.842  # 4760 ft elevation
    )
    
    result = calculate_compressor_performance(test_input)
    
    print("Main Compressor Performance Results")
    print("=" * 40)
    print(f"Inlet Flow:      {result.inlet_flow_acfm:,.0f} acfm / {result.inlet_flow_am3hr:,.0f} Am³/hr")
    print(f"Outlet Temp:     {result.outlet_temp_F:.1f} °F / {result.outlet_temp_C:.1f} °C")
    print(f"Outlet Pressure: {result.outlet_pressure_inwc:.1f} inWC / {result.outlet_pressure_mmwg:.0f} mm WG")
    print(f"Temp Rise:       {result.temp_rise_F:.1f} °F / {result.temp_rise_C:.1f} °C")
    print(f"Pressure Rise:   {result.pressure_rise_inwc:.1f} inWC / {result.pressure_rise_mmwg:.0f} mm WG")
    print(f"Standard Flow:   {result.standard_flow_scfm:,.0f} scfm / {result.standard_flow_nm3hr:,.0f} Nm³/hr")
    print(f"Outlet Flow:     {result.outlet_flow_acfm:,.0f} acfm / {result.outlet_flow_am3hr:,.0f} Am³/hr")
    print(f"Mass Flow:       {result.mass_flow_klbhr:.1f} klb/hr / {result.mass_flow_MThr:.1f} MT/hr")
    print(f"Isentropic Head: {result.isentropic_head_ftlblb:,.0f} ft·lb/lb / {result.isentropic_head_kJkg:.1f} kJ/kg")
    print(f"Brake Power:     {result.brake_power_hp:,.0f} hp / {result.brake_power_MW:.2f} MW")
    print(f"Motor Power:     {result.motor_power_hp:,.0f} hp / {result.motor_power_MW:.2f} MW")
    print(f"Driver Speed:    {result.driver_speed:.0f} 1/min")
`;

export default function MainCompressorPythonCode() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/unit-operation/main-compressor" data-testid="link-back">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <span className="font-semibold text-lg text-foreground">Lithium Americas</span>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Main Compressor Python Code</CardTitle>
            </CardHeader>
            <CardContent>
              <SyntaxHighlighter 
                language="python" 
                style={vscDarkPlus}
                customStyle={{
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                }}
                showLineNumbers
              >
                {pythonCode}
              </SyntaxHighlighter>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
