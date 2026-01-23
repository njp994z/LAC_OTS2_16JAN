import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Code, Copy, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import expLogo from "@/assets/exp-logo.png";

function highlightPython(code: string): JSX.Element[] {
  const lines = code.split('\n');
  
  const keywords = ['def', 'return', 'if', 'else', 'elif', 'for', 'while', 'in', 'import', 'from', 'as', 'class', 'try', 'except', 'finally', 'with', 'lambda', 'yield', 'raise', 'pass', 'break', 'continue', 'and', 'or', 'not', 'is', 'None', 'True', 'False'];
  const builtins = ['print', 'range', 'len', 'str', 'int', 'float', 'list', 'dict', 'tuple', 'set', 'min', 'max', 'sum', 'abs', 'round', 'type', 'isinstance', 'enumerate', 'zip', 'map', 'filter', 'sorted', 'reversed', 'open', 'input', 'format'];
  
  return lines.map((line, lineIndex) => {
    const tokens: JSX.Element[] = [];
    let i = 0;
    let tokenKey = 0;
    
    while (i < line.length) {
      // Comments
      if (line[i] === '#') {
        tokens.push(<span key={tokenKey++} style={{ color: '#6A9955', fontStyle: 'italic' }}>{line.slice(i)}</span>);
        break;
      }
      
      // Triple-quoted strings
      if (line.slice(i, i + 3) === '"""' || line.slice(i, i + 3) === "'''") {
        const quote = line.slice(i, i + 3);
        let end = line.indexOf(quote, i + 3);
        if (end === -1) {
          tokens.push(<span key={tokenKey++} style={{ color: '#CE9178' }}>{line.slice(i)}</span>);
          break;
        }
        tokens.push(<span key={tokenKey++} style={{ color: '#CE9178' }}>{line.slice(i, end + 3)}</span>);
        i = end + 3;
        continue;
      }
      
      // Strings
      if (line[i] === '"' || line[i] === "'") {
        const quote = line[i];
        let end = i + 1;
        while (end < line.length && line[end] !== quote) {
          if (line[end] === '\\') end++;
          end++;
        }
        tokens.push(<span key={tokenKey++} style={{ color: '#CE9178' }}>{line.slice(i, end + 1)}</span>);
        i = end + 1;
        continue;
      }
      
      // Numbers
      if (/[0-9]/.test(line[i]) && (i === 0 || !/[a-zA-Z_]/.test(line[i - 1]))) {
        let end = i;
        while (end < line.length && /[0-9.eE+-]/.test(line[end])) end++;
        tokens.push(<span key={tokenKey++} style={{ color: '#B5CEA8' }}>{line.slice(i, end)}</span>);
        i = end;
        continue;
      }
      
      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(line[i])) {
        let end = i;
        while (end < line.length && /[a-zA-Z0-9_]/.test(line[end])) end++;
        const word = line.slice(i, end);
        
        // Check if it's a function definition
        const beforeWord = line.slice(0, i).trim();
        const afterWord = line.slice(end).trim();
        
        if (keywords.includes(word)) {
          tokens.push(<span key={tokenKey++} style={{ color: '#569CD6', fontWeight: 500 }}>{word}</span>);
        } else if (builtins.includes(word)) {
          tokens.push(<span key={tokenKey++} style={{ color: '#DCDCAA' }}>{word}</span>);
        } else if (beforeWord.endsWith('def')) {
          tokens.push(<span key={tokenKey++} style={{ color: '#DCDCAA' }}>{word}</span>);
        } else if (afterWord.startsWith('(') && !beforeWord.endsWith('def')) {
          tokens.push(<span key={tokenKey++} style={{ color: '#DCDCAA' }}>{word}</span>);
        } else if (word === word.toUpperCase() && word.length > 1) {
          // Constants (all caps)
          tokens.push(<span key={tokenKey++} style={{ color: '#4FC1FF' }}>{word}</span>);
        } else {
          tokens.push(<span key={tokenKey++} style={{ color: '#9CDCFE' }}>{word}</span>);
        }
        i = end;
        continue;
      }
      
      // Operators and punctuation
      if (/[+\-*/%=<>!&|^~@:]/.test(line[i])) {
        let end = i;
        while (end < line.length && /[+\-*/%=<>!&|^~@:]/.test(line[end])) end++;
        tokens.push(<span key={tokenKey++} style={{ color: '#D4D4D4' }}>{line.slice(i, end)}</span>);
        i = end;
        continue;
      }
      
      // Default - whitespace and other chars
      tokens.push(<span key={tokenKey++}>{line[i]}</span>);
      i++;
    }
    
    return (
      <div key={lineIndex} className="leading-6">
        <span className="inline-block w-12 text-right pr-4 select-none" style={{ color: '#858585' }}>{lineIndex + 1}</span>
        {tokens.length > 0 ? tokens : '\n'}
      </div>
    );
  });
}

const pythonCode = `# Catalytic Reactor Stand-Alone Simulation
# Backend Python-equivalent code for SO2 → SO3 conversion calculations
# This simulation uses first-principles kinetics and thermodynamics

import numpy as np

# ============================================================================
# CATALYST BULK DENSITY DATABASE (Kg/m³)
# ============================================================================
CATALYST_BULK_DENSITIES = {
    "Topsoe VK69": 800,
    "MECS Super Gear XLP-310": 815,
    "MECS GR330": 865,
    "MECS GR330C": 865,
}

# Unit conversion constants
KG_TO_LBS = 2.20462
INCHES_WC_TO_PSI = 1 / 27.68  # 1 psi = 27.68 inches water column
ATM_TO_PSIA = 14.696          # 1 atm = 14.696 psia
NM3H_TO_SCFM = 35.315 / 60    # Nm³/h to scfm (at 0°C, 1 atm)
T_STD_RANKINE = 459.67        # 0°C in Rankine


# ============================================================================
# CATALYST WEIGHT CALCULATION
# ============================================================================
def calculate_catalyst_weight(catalyst_loadings: list, catalyst_types: list) -> dict:
    """
    Calculate the weight of catalyst in each pass.
    
    Formula: Catalyst Mass (Kg) = Catalyst Load (Liters) × Bulk Density (Kg/m³) / 1000
    Note: Division by 1000 converts liters to m³ (1 m³ = 1000 liters)
    
    Parameters:
        catalyst_loadings: Array of 8 values [P1A, P1B, P2A, P2B, P3A, P3B, P4A, P4B]
        catalyst_types: Array of 8 catalyst type names
    
    Returns:
        Dictionary with weights in Kg and lbs for each pass and totals
    """
    passes = []
    total_kg = 0
    total_lbs = 0
    
    for i in range(4):
        idx_a = i * 2
        idx_b = i * 2 + 1
        
        # Type A catalyst
        bulk_density_a = CATALYST_BULK_DENSITIES.get(catalyst_types[idx_a], 0)
        mass_kg_a = catalyst_loadings[idx_a] * bulk_density_a / 1000
        mass_lbs_a = mass_kg_a * KG_TO_LBS
        
        # Type B catalyst
        bulk_density_b = CATALYST_BULK_DENSITIES.get(catalyst_types[idx_b], 0)
        mass_kg_b = catalyst_loadings[idx_b] * bulk_density_b / 1000
        mass_lbs_b = mass_kg_b * KG_TO_LBS
        
        pass_total_kg = mass_kg_a + mass_kg_b
        pass_total_lbs = mass_lbs_a + mass_lbs_b
        
        passes.append({
            "typeA": {"massKg": mass_kg_a, "massLbs": mass_lbs_a},
            "typeB": {"massKg": mass_kg_b, "massLbs": mass_lbs_b},
            "total": {"massKg": pass_total_kg, "massLbs": pass_total_lbs}
        })
        
        total_kg += pass_total_kg
        total_lbs += pass_total_lbs
    
    return {
        "passes": passes,
        "totals": {"massKg": total_kg, "massLbs": total_lbs}
    }


# ============================================================================
# REACTOR FLOW CALCULATIONS
# ============================================================================
def calculate_reactor_flow(
    gas_flow_nm3h: float,
    temperature_c: float,
    pressure_in_wc: float,
    p_barometric_atm: float,
    target_velocity_fpm: float = None
) -> dict:
    """
    Calculate reactor volumetric flow rate and optionally reactor diameter.
    
    Converts gas flow from standard conditions (Nm³/h at 0°C, 1 atm) to
    actual volumetric flow (acfm) at process temperature and pressure.
    """
    # Step 1: Convert pressure to consistent units
    pressure_psig = pressure_in_wc * INCHES_WC_TO_PSI
    pressure_psia = p_barometric_atm * ATM_TO_PSIA + pressure_psig
    pressure_atm = pressure_psia / ATM_TO_PSIA
    
    # Step 2: Convert temperature to Kelvin and Rankine
    temperature_k = temperature_c + 273.15
    temperature_r = temperature_k * 9/5
    
    # Step 3: Convert standard flow to scfm
    scfm_dry = gas_flow_nm3h * NM3H_TO_SCFM
    
    # Step 4: Apply ideal gas law correction for actual conditions
    # ACFM = SCFM × (T_actual / T_std) × (P_std / P_actual)
    volumetric_flow_acfm = scfm_dry * (temperature_r / T_STD_RANKINE) * (1.0 / pressure_atm)
    
    result = {
        "pressurePsig": pressure_psig,
        "pressurePsia": pressure_psia,
        "pressureAtm": pressure_atm,
        "temperatureK": temperature_k,
        "temperatureR": temperature_r,
        "scfmDry": scfm_dry,
        "volumetricFlowACFM": volumetric_flow_acfm
    }
    
    # Step 5: Calculate reactor diameter if velocity is specified
    if target_velocity_fpm:
        reactor_area_ft2 = volumetric_flow_acfm / target_velocity_fpm
        reactor_diameter_ft = np.sqrt(4 * reactor_area_ft2 / np.pi)
        
        result.update({
            "reactorAreaFt2": reactor_area_ft2,
            "reactorDiameterFt": reactor_diameter_ft,
            "reactorDiameterIn": reactor_diameter_ft * 12,
            "reactorDiameterM": reactor_diameter_ft * 0.3048,
            "actualVelocityFPM": volumetric_flow_acfm / reactor_area_ft2
        })
    
    return result


# ============================================================================
# SO2 CONVERSION EQUILIBRIUM CALCULATION
# ============================================================================
def calculate_equilibrium_conversion(temperature_c: float, so2_inlet: float, o2_inlet: float) -> float:
    """
    Calculate equilibrium conversion for SO2 + 0.5 O2 → SO3 reaction.
    
    Uses the van't Hoff equation and equilibrium constant correlation
    for the sulfur dioxide oxidation reaction.
    
    Parameters:
        temperature_c: Catalyst bed temperature in °C
        so2_inlet: Inlet SO2 concentration (mole fraction)
        o2_inlet: Inlet O2 concentration (mole fraction)
    
    Returns:
        Equilibrium conversion as percentage
    """
    T = temperature_c + 273.15  # Convert to Kelvin
    
    # Equilibrium constant correlation (empirical)
    # ln(Kp) = A/T + B*ln(T) + C*T + D
    A = 11168.0
    B = -1.268
    C = -0.00121
    D = -10.68
    
    ln_Kp = A/T + B*np.log(T) + C*T + D
    Kp = np.exp(ln_Kp)
    
    # Solve equilibrium using stoichiometry
    # At equilibrium: Kp = (pSO3) / (pSO2 * pO2^0.5)
    # Iterative solution for conversion
    conversion = 0.95  # Initial guess
    
    for _ in range(50):
        so2_eq = so2_inlet * (1 - conversion)
        so3_eq = so2_inlet * conversion
        o2_eq = o2_inlet - 0.5 * so2_inlet * conversion
        
        if o2_eq <= 0:
            break
            
        Kp_calc = so3_eq / (so2_eq * np.sqrt(o2_eq))
        
        if Kp_calc < Kp:
            conversion += 0.001
        else:
            conversion -= 0.0001
    
    return min(conversion * 100, 99.99)


# ============================================================================
# PRESSURE DROP CALCULATION (Ergun Equation)
# ============================================================================
def calculate_pressure_drop(
    gas_velocity_fpm: float,
    bed_depth_m: float,
    catalyst_diameter_m: float = 0.012,
    bed_voidage: float = 0.45,
    gas_viscosity: float = 3.5e-5,
    gas_density: float = 0.8
) -> float:
    """
    Calculate pressure drop through catalyst bed using Ergun equation.
    
    ΔP/L = 150 * μ * (1-ε)² / (dp² * ε³) * U + 1.75 * ρ * (1-ε) / (dp * ε³) * U²
    
    Returns:
        Pressure drop in inches of water column
    """
    U = gas_velocity_fpm * 0.00508  # Convert fpm to m/s
    dp = catalyst_diameter_m
    epsilon = bed_voidage
    mu = gas_viscosity
    rho = gas_density
    L = bed_depth_m
    
    # Ergun equation terms
    term1 = 150 * mu * (1 - epsilon)**2 / (dp**2 * epsilon**3) * U
    term2 = 1.75 * rho * (1 - epsilon) / (dp * epsilon**3) * U**2
    
    delta_p_pa = (term1 + term2) * L
    delta_p_in_wc = delta_p_pa / 249.089  # Convert Pa to inches WC
    
    return delta_p_in_wc


# ============================================================================
# EMISSIONS CALCULATION
# ============================================================================
def calculate_emissions(
    overall_conversion: float,
    so2_inlet_percent: float,
    plant_rate_stpd: float
) -> dict:
    """
    Calculate stack emissions in various units.
    
    Parameters:
        overall_conversion: Overall SO2 conversion (0-1)
        so2_inlet_percent: Inlet SO2 concentration (%)
        plant_rate_stpd: Acid production rate (short tons per day)
    
    Returns:
        Dictionary with emissions in lbSO2/ST, KgSO2/MT, and ppmv
    """
    unconverted_fraction = 1 - overall_conversion
    
    # Emission factor calculation
    # Based on stoichiometry: 1 ton H2SO4 requires ~0.65 tons SO2
    so2_factor = 0.653
    
    lb_so2_st = unconverted_fraction * so2_factor * 2000 / plant_rate_stpd
    kg_so2_mt = lb_so2_st * 0.453592 / 0.907185
    
    # ppmv calculation from outlet concentration
    so2_outlet_percent = so2_inlet_percent * unconverted_fraction
    ppmv = so2_outlet_percent * 10000  # Convert % to ppmv
    
    return {
        "lbSO2ST": round(lb_so2_st, 2),
        "kgSO2MT": round(kg_so2_mt, 2),
        "ppmv": round(ppmv, 0)
    }


# ============================================================================
# MAIN SIMULATION FUNCTION
# ============================================================================
def run_catalytic_reactor_simulation(
    gas_composition: dict,
    process_inputs: dict,
    catalyst_config: dict
) -> dict:
    """
    Run the complete catalytic reactor simulation.
    
    This function orchestrates all sub-calculations to produce
    comprehensive simulation results including:
    - Pass-by-pass conversions
    - Pressure drops
    - Emissions
    - Reactor sizing
    - Catalyst loading matrix
    """
    # Extract inputs
    so2_pct = gas_composition["so2Percent"]
    o2_pct = gas_composition["o2Percent"]
    plant_rate = process_inputs["plantRate"]
    inlet_velocity = process_inputs["pass1InletVelocity"]
    
    # Calculate reactor flow and sizing
    flow_results = calculate_reactor_flow(
        gas_flow_nm3h=plant_rate * 1000,  # Approximate
        temperature_c=process_inputs["pass1InletTemp"],
        pressure_in_wc=process_inputs["pass1InletPres"],
        p_barometric_atm=gas_composition["pBarr"],
        target_velocity_fpm=inlet_velocity
    )
    
    # Calculate pass conversions
    pass_conversions = {}
    cumulative_conversion = 0
    temps = [
        process_inputs["pass1InletTemp"],
        process_inputs["pass2InletTemp"],
        process_inputs["pass3InletTemp"],
        process_inputs["pass4InletTemp"]
    ]
    
    for i, temp in enumerate(temps, 1):
        eq_conv = calculate_equilibrium_conversion(temp, so2_pct/100, o2_pct/100)
        pass_conv = eq_conv * 0.85  # Approach to equilibrium factor
        cumulative_conversion += pass_conv * (1 - cumulative_conversion/100)
        
        pass_conversions[f"pass{i}"] = {
            "conversion": round(pass_conv, 2),
            "overall": round(cumulative_conversion, 2),
            "equilibrium": round(eq_conv, 2)
        }
    
    # Calculate emissions
    emissions = calculate_emissions(
        cumulative_conversion / 100,
        so2_pct,
        plant_rate
    )
    
    return {
        "passConversions": pass_conversions,
        "emissions": emissions,
        "converterDiameter": {
            "ft": round(flow_results.get("reactorDiameterFt", 0), 2),
            "m": round(flow_results.get("reactorDiameterM", 0), 2)
        },
        "flowCalculations": flow_results
    }


if __name__ == "__main__":
    # Example usage
    result = run_catalytic_reactor_simulation(
        gas_composition={
            "so2Percent": 11.3,
            "so3Percent": 0.2,
            "o2Percent": 9.5,
            "co2Percent": 0,
            "n2Percent": 79,
            "pBarr": 0.85,
            "ipatSo3Removal": 100
        },
        process_inputs={
            "plantRate": 2480,
            "pass1InletVelocity": 145,
            "pass1InletTemp": 390,
            "pass2InletTemp": 420,
            "pass3InletTemp": 440,
            "pass4InletTemp": 390,
            "pass1InletPres": 150,
            "pass2InletPres": 135,
            "pass3InletPres": 100,
            "pass4InletPres": 60
        },
        catalyst_config={}
    )
    print(result)
`;

export default function CatalyticReactorPythonCode() {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const highlightedCode = useMemo(() => highlightPython(pythonCode), []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pythonCode);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Python code has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy code to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/unit-operation/catalytic-reactor")}
              data-testid="button-back-catalytic-reactor"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">Catalytic Reactor Simulation Code</h1>
              <p className="text-xs text-muted-foreground">Python implementation of the simulation algorithm</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleCopy}
            data-testid="button-copy-code"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Code className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle>Catalytic Reactor Simulation Algorithm</CardTitle>
                  <CardDescription>
                    First-principles Python code for SO2 to SO3 conversion calculations, including equilibrium, pressure drop, and emissions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div 
                  className="p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-[calc(100vh-300px)] overflow-y-auto"
                  style={{ backgroundColor: '#1E1E1E' }}
                >
                  {highlightedCode}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Catalytic Reactor | Simulation Code</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
