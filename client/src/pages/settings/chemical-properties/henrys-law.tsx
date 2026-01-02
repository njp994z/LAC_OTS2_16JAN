import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Droplets, Save, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PythonCodeViewer } from '@/components/PythonCodeViewer';
import { 
  defaultHenrysLawData, 
  henrysLawParameterKeys,
  type HenrysLawRow,
  type HenrysLawParameterKey 
} from '@/types/henrys-law';

const pythonCode = `# Henry's Law Parameters
# Variable names and data structure for programming reference

# Parameter keys for Henry's Law correlation
parameter_keys = ['AIJ', 'BIJ', 'CIJ', 'DIJ', 'TLOWER', 'TUPPER', 'EIJ']

# Data structure for Henry's Law parameters
class HenrysLawRow:
    id: int                  # Unique identifier
    component1: str          # Solute gas (e.g., 'SO2', 'N2', 'O2', 'CO2')
    component2: str          # Solvent (e.g., 'H2O', 'SO3')
    source: str              # Data source (e.g., 'APV140 EN', 'USER')
    temp_unit: str           # Temperature unit ('F' for Fahrenheit)
    prop_units: str          # Property units ('psi' for pressure)
    AIJ: float               # Coefficient A
    BIJ: float               # Coefficient B
    CIJ: float               # Coefficient C
    DIJ: float               # Coefficient D
    EIJ: float               # Coefficient E
    TLOWER: float            # Lower temperature limit
    TUPPER: float            # Upper temperature limit

# Example Henry's Law data
henrys_law_data = [
    {
        'id': 1,
        'component1': 'SO2',
        'component2': 'H2O',
        'source': 'APV140 EN',
        'temp_unit': 'F',
        'prop_units': 'psi',
        'AIJ': 80.27199,
        'BIJ': -10041.8,
        'CIJ': -8.76152,
        'DIJ': 0,
        'EIJ': 0,
        'TLOWER': 31.73,
        'TUPPER': 211.73,
    },
    {
        'id': 2,
        'component1': 'N2',
        'component2': 'H2O',
        'source': 'APV140 BI',
        'temp_unit': 'F',
        'prop_units': 'psi',
        'AIJ': 180.34,
        'BIJ': -15179,
        'CIJ': -21.558,
        'DIJ': -0.00469,
        'EIJ': 0,
        'TLOWER': 31.73,
        'TUPPER': 163.13,
    },
]

def calc_henrys_constant(T: float, AIJ: float, BIJ: float, CIJ: float, DIJ: float, EIJ: float = 0) -> float:
    """
    Calculate Henry's Law constant using temperature-dependent correlation.
    ln(H) = AIJ + BIJ/T + CIJ*ln(T) + DIJ*T + EIJ*T^2
    
    Args:
        T: Temperature (in units specified by temp_unit)
        AIJ, BIJ, CIJ, DIJ, EIJ: Correlation coefficients
    Returns:
        Henry's constant H (in units specified by prop_units, typically psi)
    """
    import math
    ln_H = AIJ + BIJ/T + CIJ*math.log(T) + DIJ*T + EIJ*T**2
    return math.exp(ln_H)

def calc_gas_solubility(P_partial: float, H: float) -> float:
    """
    Calculate dissolved gas concentration using Henry's Law.
    x = P_partial / H
    
    Args:
        P_partial: Partial pressure of gas (psi)
        H: Henry's constant (psi)
    Returns:
        x: Mole fraction of dissolved gas in liquid
    """
    return P_partial / H

# Unit conversions
def fahrenheit_to_rankine(T_F: float) -> float:
    """Convert Fahrenheit to Rankine."""
    return T_F + 459.67

def psi_to_atm(P_psi: float) -> float:
    """Convert psi to atmospheres."""
    return P_psi / 14.696
`;

export default function HenrysLaw() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [parameters, setParameters] = useState<HenrysLawRow[]>(defaultHenrysLawData);

  const handleValueChange = (rowIndex: number, field: string, value: string) => {
    setParameters(prev => {
      const updated = [...prev];
      if (field === 'component1' || field === 'component2' || field === 'source' || field === 'tempUnit' || field === 'propUnits') {
        updated[rowIndex] = { ...updated[rowIndex], [field]: value };
      } else {
        const numValue = value === '' ? null : parseFloat(value);
        updated[rowIndex] = { ...updated[rowIndex], [field]: isNaN(numValue as number) ? null : numValue };
      }
      return updated;
    });
  };

  const handleSave = () => {
    toast({
      title: "Parameters Saved",
      description: "Henry's Law parameters have been updated successfully.",
    });
  };

  const handleAddRow = () => {
    const newId = Math.max(...parameters.map(p => p.id)) + 1;
    setParameters(prev => [...prev, {
      id: newId,
      component1: '',
      component2: '',
      source: 'USER',
      tempUnit: 'F',
      propUnits: 'psi',
      AIJ: 11, BIJ: 0, CIJ: 0, DIJ: 0, TLOWER: -459.67, TUPPER: 3140.33, EIJ: 0
    }]);
  };

  const formatValue = (value: number | null): string => {
    if (value === null) return '';
    return value.toString();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
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
              <Droplets className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Henry's Law Parameters</h1>
                <p className="text-xs text-muted-foreground">Gas solubility coefficients</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PythonCodeViewer
              title="Henry's Law Parameters - Python Variables"
              description="Variable names and data structures for gas solubility calculations"
              code={pythonCode}
            />
            <Button variant="outline" onClick={handleAddRow} className="gap-2" data-testid="button-add-row">
              <Plus className="w-4 h-4" />
              Add Entry
            </Button>
            <Button onClick={handleSave} className="gap-2" data-testid="button-save">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-full mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Henry's Law Parameters</CardTitle>
              <CardDescription>
                Edit gas solubility parameters for component pairs. Scroll horizontally to view all parameters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm" data-testid="table-henrys-law">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="sticky left-0 bg-muted/50 px-3 py-2 text-left font-semibold text-foreground min-w-[80px] z-10">
                        Component
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-foreground min-w-[80px]">
                        Component
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-foreground min-w-[100px]">
                        Source
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-foreground min-w-[70px]">
                        Temp. Unit
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-foreground min-w-[80px]">
                        Prop. Units
                      </th>
                      {henrysLawParameterKeys.map(param => (
                        <th key={param} className="px-3 py-2 text-center font-semibold text-foreground min-w-[90px]">
                          {param}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parameters.map((row, rowIndex) => (
                      <tr 
                        key={row.id} 
                        className="border-b border-border hover:bg-muted/30"
                        data-testid={`row-${row.id}`}
                      >
                        <td className="sticky left-0 bg-background px-1 py-1 z-10 border-r border-border">
                          <Input
                            type="text"
                            value={row.component1}
                            onChange={(e) => handleValueChange(rowIndex, 'component1', e.target.value)}
                            className="text-xs text-center w-[70px] font-mono"
                            data-testid={`input-${row.id}-component1`}
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            type="text"
                            value={row.component2}
                            onChange={(e) => handleValueChange(rowIndex, 'component2', e.target.value)}
                            className="text-xs text-center w-[70px] font-mono"
                            data-testid={`input-${row.id}-component2`}
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            type="text"
                            value={row.source}
                            onChange={(e) => handleValueChange(rowIndex, 'source', e.target.value)}
                            className="text-xs text-center w-[90px] font-mono"
                            data-testid={`input-${row.id}-source`}
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            type="text"
                            value={row.tempUnit}
                            onChange={(e) => handleValueChange(rowIndex, 'tempUnit', e.target.value)}
                            className="text-xs text-center w-[50px] font-mono"
                            data-testid={`input-${row.id}-tempUnit`}
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            type="text"
                            value={row.propUnits}
                            onChange={(e) => handleValueChange(rowIndex, 'propUnits', e.target.value)}
                            className="text-xs text-center w-[50px] font-mono"
                            data-testid={`input-${row.id}-propUnits`}
                          />
                        </td>
                        {henrysLawParameterKeys.map(param => (
                          <td key={param} className="px-1 py-1">
                            <Input
                              type="text"
                              value={formatValue(row[param])}
                              onChange={(e) => handleValueChange(rowIndex, param, e.target.value)}
                              className="text-xs text-center w-[80px] font-mono"
                              data-testid={`input-${row.id}-${param}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Henry's Law Parameters | {parameters.length} Component Pairs</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
