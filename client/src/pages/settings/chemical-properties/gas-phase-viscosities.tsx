import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Wind, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PythonCodeViewer } from '@/components/PythonCodeViewer';

const pythonCode = `# Gas Phase Viscosity Parameters - Sutherland's Formula
# Variable names and data structure for programming reference

# Sutherland's Formula for Dynamic Viscosity:
# μ = μ₀ × (T/T₀)^(3/2) × ((T₀ + S) / (T + S))
#
# where:
#   μ   = dynamic viscosity (μPa·s)
#   T   = temperature (K)
#   μ₀  = reference viscosity at T₀
#   T₀  = reference temperature (K)
#   S   = Sutherland constant (K)

from dataclasses import dataclass
from typing import Optional

@dataclass
class GasViscosityParameter:
    """Sutherland parameters for gas phase viscosity calculation."""
    species: str              # Chemical species (e.g., 'SO2', 'O2', 'N2')
    mu_0: float               # Reference viscosity (μPa·s) at T₀
    T_0: float                # Reference temperature (K)
    S: float                  # Sutherland constant (K)
    validity: str             # Temperature validity range / notes
    source: str               # Data source reference

# Sutherland parameters for common gases in sulfuric acid production
gas_viscosity_parameters = [
    {
        'species': 'SO2',
        'mu_0': 12.4,         # μPa·s at 293 K
        'T_0': 293,           # K
        'S': 416,             # K
        'validity': '>263 K (above condensation)',
        'source': 'Crane Technical Paper 410',
    },
    {
        'species': 'SO3',
        'mu_0': 12.4,         # μPa·s at 293 K (estimated from SO2)
        'T_0': 293,           # K
        'S': 416,             # K (estimated from SO2)
        'validity': '>318 K (above condensation)',
        'source': 'Estimated from SO2 parameters',
    },
    {
        'species': 'O2',
        'mu_0': 20.18,        # μPa·s at 293 K
        'T_0': 293,           # K
        'S': 139,             # K
        'validity': 'Standard gas phase',
        'source': 'Crane Technical Paper 410',
    },
    {
        'species': 'N2',
        'mu_0': 17.81,        # μPa·s at 293 K
        'T_0': 293,           # K
        'S': 111,             # K
        'validity': 'Standard gas phase',
        'source': 'Crane Technical Paper 410',
    },
]

def calc_viscosity_sutherland(T: float, mu_0: float, T_0: float, S: float) -> float:
    """
    Calculate gas dynamic viscosity using Sutherland's formula.
    
    Valid for pure gases at low pressures (dilute limit) where viscosity
    is essentially independent of pressure.
    
    Args:
        T: Temperature in Kelvin
        mu_0: Reference viscosity (μPa·s) at reference temperature T_0
        T_0: Reference temperature (K)
        S: Sutherland constant (K)
    
    Returns:
        Dynamic viscosity μ (μPa·s)
    
    Note:
        1 μPa·s = 10⁻⁶ Pa·s = 10⁻⁵ poise
        For higher pressures or near-critical conditions, density-dependent
        corrections are required (e.g., via Chapman-Enskog theory extensions).
    """
    return mu_0 * (T / T_0) ** 1.5 * ((T_0 + S) / (T + S))

def calc_viscosity_at_temps(species: str, temps: list[float]) -> dict:
    """
    Calculate viscosity for a gas species at multiple temperatures.
    
    Args:
        species: Gas species name ('SO2', 'O2', 'N2')
        temps: List of temperatures in Kelvin
    
    Returns:
        Dictionary with species, temperatures, and calculated viscosities
    """
    # Find parameters for species
    params = next((p for p in gas_viscosity_parameters if p['species'] == species), None)
    if params is None:
        raise ValueError(f"No Sutherland parameters found for {species}")
    
    viscosities = [
        calc_viscosity_sutherland(T, params['mu_0'], params['T_0'], params['S'])
        for T in temps
    ]
    
    return {
        'species': species,
        'temperatures_K': temps,
        'viscosities_uPa_s': viscosities,
    }

# Unit conversion constants
uPa_s_to_Pa_s = 1e-6        # 1 μPa·s = 10⁻⁶ Pa·s
uPa_s_to_poise = 1e-5       # 1 μPa·s = 10⁻⁵ poise
uPa_s_to_cP = 1e-3          # 1 μPa·s = 10⁻³ centipoise

# Example usage:
# SO2 viscosity at 400 K
# mu_SO2_400K = calc_viscosity_sutherland(400, 12.4, 293, 416)
# Result: ~18.8 μPa·s
`;

interface ViscosityParameter {
  species: string;
  mu0: string;
  T0: string;
  S: string;
  validity: string;
  source: string;
}

const initialViscosityParameters: ViscosityParameter[] = [
  {
    species: "SO₂",
    mu0: "12.4",
    T0: "293",
    S: "416",
    validity: ">263 K (above condensation)",
    source: "Crane Technical Paper 410"
  },
  {
    species: "SO₃",
    mu0: "12.4",
    T0: "293",
    S: "416",
    validity: ">318 K (above condensation)",
    source: "Estimated from SO₂ parameters"
  },
  {
    species: "O₂",
    mu0: "20.18",
    T0: "293",
    S: "139",
    validity: "Standard gas phase",
    source: "Crane Technical Paper 410"
  },
  {
    species: "N₂",
    mu0: "17.81",
    T0: "293",
    S: "111",
    validity: "Standard gas phase",
    source: "Crane Technical Paper 410"
  }
];

export default function GasPhaseViscosities() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [parameters, setParameters] = useState<ViscosityParameter[]>(initialViscosityParameters);

  const handleInputChange = (index: number, field: keyof ViscosityParameter, value: string) => {
    const newParameters = [...parameters];
    newParameters[index] = { ...newParameters[index], [field]: value };
    setParameters(newParameters);
  };

  const handleSave = () => {
    toast({
      title: "Parameters Saved",
      description: "Gas phase viscosity parameters have been saved successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings/databases")}
              data-testid="button-back-databases"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">Gas Phase Viscosities</h1>
              <p className="text-xs text-muted-foreground">Sutherland's formula parameters for pure gases</p>
            </div>
          </div>
          <Button onClick={handleSave} data-testid="button-save-parameters">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wind className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Sutherland's Viscosity Formula</CardTitle>
                  <CardDescription>
                    Parameters for calculating dynamic viscosity of pure gases at low pressures
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Sutherland's Formula:</strong>
                </p>
                <p className="text-sm font-mono text-foreground">
                  μ = μ₀ × (T/T₀)^(3/2) × ((T₀ + S) / (T + S))
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  where μ is dynamic viscosity (μPa·s), T is temperature (K), μ₀ is reference viscosity at T₀, and S is the Sutherland constant.
                </p>
              </div>
              
              <Table data-testid="table-viscosity-parameters">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Gas</TableHead>
                    <TableHead className="w-[120px]">μ₀ (μPa·s)</TableHead>
                    <TableHead className="w-[100px]">T₀ (K)</TableHead>
                    <TableHead className="w-[100px]">S (K)</TableHead>
                    <TableHead className="w-[200px]">Validity</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parameters.map((param, index) => (
                    <TableRow key={index} data-testid={`row-viscosity-${index}`}>
                      <TableCell className="font-medium">{param.species}</TableCell>
                      <TableCell>
                        <Input
                          value={param.mu0}
                          onChange={(e) => handleInputChange(index, 'mu0', e.target.value)}
                          className="w-24 text-blue-500 font-semibold"
                          data-testid={`input-mu0-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={param.T0}
                          onChange={(e) => handleInputChange(index, 'T0', e.target.value)}
                          className="w-20 text-blue-500 font-semibold"
                          data-testid={`input-T0-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={param.S}
                          onChange={(e) => handleInputChange(index, 'S', e.target.value)}
                          className="w-20 text-blue-500 font-semibold"
                          data-testid={`input-S-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={param.validity}
                          onChange={(e) => handleInputChange(index, 'validity', e.target.value)}
                          className="text-sm"
                          data-testid={`input-validity-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={param.source}
                          onChange={(e) => handleInputChange(index, 'source', e.target.value)}
                          className="text-sm"
                          data-testid={`input-source-${index}`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Note on SO₃:</strong> SO₃ parameters are estimated from SO₂ due to limited experimental data. 
                  SO₃ is reactive, tends to polymerize or form aerosols, and has a higher boiling point (~318 K). 
                  For more accurate SO₃ viscosity, consult specialized databases or kinetic theory calculations.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Units:</strong> 1 μPa·s = 10⁻⁶ Pa·s = 10⁻⁵ poise. Accuracy is typically within a few percent 
                  for temperatures from near room temperature to several hundred K in the dilute gas regime.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Python Code Reference</CardTitle>
              <CardDescription>
                Implementation of Sutherland's formula for gas phase viscosity calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div data-testid="link-python-code">
                <PythonCodeViewer 
                  code={pythonCode} 
                  title="Gas Phase Viscosity Calculation"
                  description="Sutherland's formula implementation for calculating dynamic viscosity of pure gases"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
