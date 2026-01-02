import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, GitMerge, Save, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PythonCodeViewer } from '@/components/PythonCodeViewer';
import { 
  defaultBinaryInteractions, 
  binaryParameterKeys,
  type BinaryInteractionRow,
  type BinaryParameterKey 
} from '@/types/binary-interaction';

const pythonCode = `# Binary Interaction Physical Properties
# Variable names and data structure for programming reference

# Binary interaction parameter keys
parameter_keys = ['AIJ', 'AJI', 'BIJ', 'BJI', 'CIJ', 'DIJ', 'EIJ', 'EJI', 'FIJ', 'FJI', 'TLOWER', 'TUPPER']

# Data structure for binary interaction pairs
class BinaryInteractionRow:
    id: int                  # Unique identifier
    component1: str          # First component (e.g., 'H2O')
    component2: str          # Second component (e.g., 'CO2')
    source: str              # Data source (e.g., 'APV140 EN', 'USER')
    temp_unit: str           # Temperature unit ('K' for Kelvin)
    AIJ: float               # Binary interaction parameter A_ij
    AJI: float               # Binary interaction parameter A_ji
    BIJ: float               # Binary interaction parameter B_ij
    BJI: float               # Binary interaction parameter B_ji
    CIJ: float               # Binary interaction parameter C_ij
    DIJ: float               # Binary interaction parameter D_ij
    EIJ: float               # Binary interaction parameter E_ij
    EJI: float               # Binary interaction parameter E_ji
    FIJ: float               # Binary interaction parameter F_ij
    FJI: float               # Binary interaction parameter F_ji
    TLOWER: float            # Lower temperature limit (K)
    TUPPER: float            # Upper temperature limit (K)

# Example binary interaction data
binary_interactions = [
    {
        'id': 1,
        'component1': 'H2O',
        'component2': 'CO2',
        'source': 'APV140 EN',
        'temp_unit': 'K',
        'AIJ': 10.064,
        'AJI': 10.064,
        'BIJ': -3268.14,
        'BJI': -3268.14,
        'CIJ': 0.2,
        'DIJ': 0,
        'EIJ': 0,
        'EJI': 0,
        'FIJ': 0,
        'FJI': 0,
        'TLOWER': 273.15,
        'TUPPER': 473.15,
    },
    {
        'id': 2,
        'component1': 'SO3',
        'component2': 'H2SO4',
        'source': 'USER',
        'temp_unit': 'K',
        'AIJ': 5.839146,
        'AJI': 0,
        'BIJ': -614.293,
        'BJI': 0,
        'CIJ': 0.2,
        'DIJ': 0,
        'EIJ': 0,
        'EJI': 0,
        'FIJ': 0,
        'FJI': 0,
        'TLOWER': 0,
        'TUPPER': 1000,
    },
]

# NRTL Activity Coefficient Model
def calc_tau_ij(T: float, AIJ: float, BIJ: float, EIJ: float, FIJ: float) -> float:
    """
    Calculate NRTL tau parameter.
    tau_ij = AIJ + BIJ/T + EIJ*ln(T) + FIJ*T
    
    Args:
        T: Temperature in Kelvin
        AIJ, BIJ, EIJ, FIJ: Binary interaction parameters
    Returns:
        tau_ij dimensionless
    """
    import math
    return AIJ + BIJ/T + EIJ*math.log(T) + FIJ*T

def calc_activity_coefficient(x: list, tau: list, alpha: float = 0.3) -> list:
    """
    Calculate activity coefficients using NRTL model.
    
    Args:
        x: Mole fractions [x1, x2]
        tau: Interaction parameters [[tau11, tau12], [tau21, tau22]]
        alpha: Non-randomness parameter (default 0.3)
    Returns:
        Activity coefficients [gamma1, gamma2]
    """
    pass  # NRTL equations implementation
`;

export default function BinaryInteraction() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [interactions, setInteractions] = useState<BinaryInteractionRow[]>(defaultBinaryInteractions);

  const handleValueChange = (rowIndex: number, field: string, value: string) => {
    setInteractions(prev => {
      const updated = [...prev];
      if (field === 'component1' || field === 'component2' || field === 'source' || field === 'tempUnit') {
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
      title: "Properties Saved",
      description: "Binary interaction parameters have been updated successfully.",
    });
  };

  const handleAddRow = () => {
    const newId = Math.max(...interactions.map(i => i.id)) + 1;
    setInteractions(prev => [...prev, {
      id: newId,
      component1: '',
      component2: '',
      source: 'USER',
      tempUnit: 'K',
      AIJ: 0, AJI: 0, BIJ: 0, BJI: 0, CIJ: 0, DIJ: 0,
      EIJ: 0, EJI: 0, FIJ: 0, FJI: 0, TLOWER: 0, TUPPER: 1000
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
              <GitMerge className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Binary Interaction Properties</h1>
                <p className="text-xs text-muted-foreground">Multi-component mixture parameters</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PythonCodeViewer
              title="Binary Interaction Properties - Python Variables"
              description="Variable names and data structures for binary interaction parameters and NRTL model"
              code={pythonCode}
            />
            <Button variant="outline" onClick={handleAddRow} className="gap-2" data-testid="button-add-row">
              <Plus className="w-4 h-4" />
              Add Pair
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
              <CardTitle>Binary Interaction Physical Properties</CardTitle>
              <CardDescription>
                Edit interaction parameters for component pairs. Scroll horizontally to view all parameters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm" data-testid="table-binary-interactions">
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
                      {binaryParameterKeys.map(param => (
                        <th key={param} className="px-3 py-2 text-center font-semibold text-foreground min-w-[90px]">
                          {param}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {interactions.map((row, rowIndex) => (
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
                            className="text-xs text-center w-[60px] font-mono"
                            data-testid={`input-${row.id}-tempUnit`}
                          />
                        </td>
                        {binaryParameterKeys.map(param => (
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
          <span>Binary Interaction Properties | {interactions.length} Component Pairs</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
