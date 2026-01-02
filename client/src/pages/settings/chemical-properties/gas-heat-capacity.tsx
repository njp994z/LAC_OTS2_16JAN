import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Thermometer, Info, Code, Copy, Check } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useToast } from '@/hooks/use-toast';

interface GasParameter {
  species: string;
  tempRange: string;
  alpha: string;
  beta: string;
  gamma: string;
  delta: string;
  source: string;
}

const gasPhaseParameters: GasParameter[] = [
  {
    species: "O₂",
    tempRange: "200–1000",
    alpha: "3.78245636",
    beta: "-2.99673416",
    gamma: "9.84730201",
    delta: "-9.68129509",
    source: "NASA/Goos-Burcat"
  },
  {
    species: "N₂",
    tempRange: "200–1000",
    alpha: "3.53100528",
    beta: "-1.23660987",
    gamma: "5.02999433",
    delta: "-2.43530612",
    source: "NASA/Goos-Burcat"
  },
  {
    species: "SO₂",
    tempRange: "200–1000",
    alpha: "3.38215966",
    beta: "10.1057729",
    gamma: "-8.97630813",
    delta: "3.49969871",
    source: "Burcat 2023"
  },
  {
    species: "SO₃",
    tempRange: "200–1000",
    alpha: "4.10181690",
    beta: "15.4492450",
    gamma: "-15.3652810",
    delta: "6.91144550",
    source: "Burcat/Goos 2023"
  },
  {
    species: "H₂SO₄(g)",
    tempRange: "300–1000",
    alpha: "7.964557",
    beta: "33.8309",
    gamma: "-26.3809",
    delta: "9.53904",
    source: "NASA/JANAF & Gurvich/BI"
  }
];

const pythonCode = `"""
Gas Phase Heat Capacity Calculator
==================================
Dimensionless Cp/R polynomial coefficients for sulfuric acid plant gases.

Formula: Cp(T)/R = alpha + beta*T + gamma*T^2 + delta*T^3

Units:
  - T: Temperature in Kelvin
  - R: 8.314462618 J/(mol·K) or 1.9858775 BTU/(lbmol·R)
  - Cp: Heat capacity in J/(mol·K) when multiplied by R
"""

# ==============================================================================
# CONSTANTS
# ==============================================================================
R_SI = 8.314462618       # Universal gas constant [J/(mol·K)]
R_BTU = 1.9858775        # Universal gas constant [BTU/(lbmol·R)]

# ==============================================================================
# GAS PHASE HEAT CAPACITY COEFFICIENTS
# ==============================================================================
# Each species has polynomial coefficients: alpha, beta, gamma, delta
# Note: beta, gamma, delta are scaled by 1e-3, 1e-6, 1e-9 respectively
#
# Dictionary structure:
#   key: species name (string)
#   value: dict with keys 'alpha', 'beta', 'gamma', 'delta', 'T_min', 'T_max'

GAS_CP_COEFFICIENTS = {
    # Oxygen (O2)
    # Source: NASA/Goos-Burcat thermodynamic database
    'O2': {
        'alpha': 3.78245636,        # Dimensionless coefficient a0
        'beta': -2.99673416e-3,     # Coefficient a1 [1/K]
        'gamma': 9.84730201e-6,     # Coefficient a2 [1/K^2]
        'delta': -9.68129509e-9,    # Coefficient a3 [1/K^3]
        'T_min': 200,               # Minimum valid temperature [K]
        'T_max': 1000,              # Maximum valid temperature [K]
    },
    
    # Nitrogen (N2)
    # Source: NASA/Goos-Burcat thermodynamic database
    'N2': {
        'alpha': 3.53100528,
        'beta': -1.23660987e-3,
        'gamma': 5.02999433e-6,
        'delta': -2.43530612e-9,
        'T_min': 200,
        'T_max': 1000,
    },
    
    # Sulfur Dioxide (SO2)
    # Source: Burcat 2023
    'SO2': {
        'alpha': 3.38215966,
        'beta': 10.1057729e-3,
        'gamma': -8.97630813e-6,
        'delta': 3.49969871e-9,
        'T_min': 200,
        'T_max': 1000,
    },
    
    # Sulfur Trioxide (SO3)
    # Source: Burcat/Goos 2023
    'SO3': {
        'alpha': 4.10181690,
        'beta': 15.4492450e-3,
        'gamma': -15.3652810e-6,
        'delta': 6.91144550e-9,
        'T_min': 200,
        'T_max': 1000,
    },
    
    # Sulfuric Acid Vapor (H2SO4)
    # Source: NASA/JANAF & Gurvich/BI
    'H2SO4': {
        'alpha': 7.964557,
        'beta': 33.8309e-3,
        'gamma': -26.3809e-6,
        'delta': 9.53904e-9,
        'T_min': 300,
        'T_max': 1000,
    },
}


# ==============================================================================
# FUNCTIONS
# ==============================================================================

def calc_Cp_over_R(species: str, T_kelvin: float) -> float:
    """
    Calculate dimensionless heat capacity Cp/R at temperature T.
    
    Args:
        species: Gas species name ('O2', 'N2', 'SO2', 'SO3', 'H2SO4')
        T_kelvin: Temperature in Kelvin
        
    Returns:
        Cp/R: Dimensionless heat capacity ratio
        
    Raises:
        KeyError: If species not found in database
        ValueError: If temperature outside valid range
    """
    if species not in GAS_CP_COEFFICIENTS:
        raise KeyError(f"Unknown species: {species}. Available: {list(GAS_CP_COEFFICIENTS.keys())}")
    
    coeff = GAS_CP_COEFFICIENTS[species]
    T_min = coeff['T_min']
    T_max = coeff['T_max']
    
    if T_kelvin < T_min or T_kelvin > T_max:
        raise ValueError(f"Temperature {T_kelvin}K outside valid range [{T_min}, {T_max}]K for {species}")
    
    # Extract coefficients
    alpha = coeff['alpha']  # a0
    beta = coeff['beta']    # a1
    gamma = coeff['gamma']  # a2
    delta = coeff['delta']  # a3
    
    # Calculate Cp/R using polynomial
    Cp_over_R = alpha + beta * T_kelvin + gamma * T_kelvin**2 + delta * T_kelvin**3
    
    return Cp_over_R


def calc_Cp_SI(species: str, T_kelvin: float) -> float:
    """
    Calculate molar heat capacity in SI units [J/(mol·K)].
    
    Args:
        species: Gas species name
        T_kelvin: Temperature in Kelvin
        
    Returns:
        Cp in J/(mol·K)
    """
    Cp_over_R = calc_Cp_over_R(species, T_kelvin)
    Cp_SI = Cp_over_R * R_SI
    return Cp_SI


def calc_Cp_BTU(species: str, T_kelvin: float) -> float:
    """
    Calculate molar heat capacity in BTU units [BTU/(lbmol·R)].
    
    Args:
        species: Gas species name
        T_kelvin: Temperature in Kelvin
        
    Returns:
        Cp in BTU/(lbmol·R)
    """
    Cp_over_R = calc_Cp_over_R(species, T_kelvin)
    Cp_BTU = Cp_over_R * R_BTU
    return Cp_BTU


# ==============================================================================
# EXAMPLE USAGE
# ==============================================================================

if __name__ == "__main__":
    # Example: Calculate Cp for all species at 500 K
    T = 500  # Temperature [K]
    
    print(f"Heat Capacities at T = {T} K")
    print("=" * 50)
    print(f"{'Species':<10} {'Cp/R':>10} {'Cp [J/mol·K]':>15} {'Cp [BTU/lbmol·R]':>18}")
    print("-" * 50)
    
    for species in GAS_CP_COEFFICIENTS:
        Cp_over_R = calc_Cp_over_R(species, T)
        Cp_SI = calc_Cp_SI(species, T)
        Cp_BTU = calc_Cp_BTU(species, T)
        print(f"{species:<10} {Cp_over_R:>10.4f} {Cp_SI:>15.4f} {Cp_BTU:>18.4f}")
`;

export default function GasHeatCapacity() {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pythonCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Python code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/settings/chemical-properties')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Thermometer className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Gas Phase Physical Property Parameters</h1>
                <p className="text-xs text-muted-foreground">Dimensionless Cp/R polynomial coefficients</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <Tabs defaultValue="parameters" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="parameters" data-testid="tab-parameters">
                <Thermometer className="w-4 h-4 mr-2" />
                Parameters
              </TabsTrigger>
              <TabsTrigger value="python" data-testid="tab-python">
                <Code className="w-4 h-4 mr-2" />
                Python Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="parameters" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dimensionless Heat Capacity Coefficients</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3 text-sm text-foreground">
                    <p>
                      These are the <span className="font-semibold">original dimensionless coefficients</span> for the temperature-dependent molar heat capacity:
                    </p>
                    <div className="bg-muted/50 border border-border rounded-lg p-4 font-mono text-center">
                      <span className="text-base">Cp(T)/R = α + β T + γ T² + δ T³</span>
                    </div>
                    <p>
                      where <span className="font-semibold">R</span> = 8.314462618 J/mol·K, <span className="font-semibold">T</span> is in <span className="font-semibold">Kelvin</span>, and Cp is in J/mol·K when multiplied by R.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Species</TableHead>
                          <TableHead className="font-semibold">Temp. range (K)</TableHead>
                          <TableHead className="font-semibold text-right">α</TableHead>
                          <TableHead className="font-semibold text-right">β × 10³</TableHead>
                          <TableHead className="font-semibold text-right">γ × 10⁶</TableHead>
                          <TableHead className="font-semibold text-right">δ × 10⁹</TableHead>
                          <TableHead className="font-semibold">Source/notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gasPhaseParameters.map((param, index) => (
                          <TableRow key={index} data-testid={`row-gas-param-${index}`}>
                            <TableCell className="font-medium" data-testid={`text-species-${index}`}>
                              {param.species}
                            </TableCell>
                            <TableCell data-testid={`text-temp-range-${index}`}>
                              {param.tempRange}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-right" data-testid={`text-alpha-${index}`}>
                              {param.alpha}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-right" data-testid={`text-beta-${index}`}>
                              {param.beta}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-right" data-testid={`text-gamma-${index}`}>
                              {param.gamma}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-right" data-testid={`text-delta-${index}`}>
                              {param.delta}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground" data-testid={`text-source-${index}`}>
                              {param.source}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Info className="w-4 h-4" />
                    Usage Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    <li>
                      These are the exact original values from the thermodynamic databases (minor rounding differences for H₂SO₄(g) due to displayed precision).
                    </li>
                    <li>
                      Temperature <span className="font-semibold text-foreground">must</span> be in Kelvin when evaluating the polynomial.
                    </li>
                    <li>
                      To obtain Cp in <span className="font-semibold text-foreground">J/mol·K</span>: Cp = R × (α + β T + γ T² + δ T³)
                    </li>
                    <li>
                      To obtain Cp in <span className="font-semibold text-foreground">BTU/lbmol·R</span>: multiply the entire expression by 1.9858775 (the value of R in those units).
                    </li>
                    <li>
                      This is the canonical form from the thermodynamic databases—keep the temperature in K to avoid any distortion.
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="python" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Python Heat Capacity Calculator
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-2"
                    data-testid="button-copy-python"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4 space-y-2">
                    <p><strong>Key Variables:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><code className="bg-muted px-1 rounded">R_SI</code> — Gas constant in J/(mol·K)</li>
                      <li><code className="bg-muted px-1 rounded">R_BTU</code> — Gas constant in BTU/(lbmol·R)</li>
                      <li><code className="bg-muted px-1 rounded">GAS_CP_COEFFICIENTS</code> — Dictionary of all species coefficients</li>
                      <li><code className="bg-muted px-1 rounded">alpha, beta, gamma, delta</code> — Polynomial coefficients for Cp/R</li>
                      <li><code className="bg-muted px-1 rounded">T_min, T_max</code> — Valid temperature range per species</li>
                    </ul>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-border">
                    <SyntaxHighlighter
                      language="python"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '0.8125rem',
                        lineHeight: '1.5',
                        maxHeight: '600px',
                      }}
                      showLineNumbers
                      data-testid="code-python"
                    >
                      {pythonCode}
                    </SyntaxHighlighter>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Gas Phase Physical Property Parameters | Chemical Properties</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
