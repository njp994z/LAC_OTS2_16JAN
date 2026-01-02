import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Atom, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PythonCodeViewer } from '@/components/PythonCodeViewer';
import { 
  defaultChemicalProperties, 
  componentKeys,
  type ChemicalPropertyRow,
  type ComponentKey 
} from '@/types/chemical-properties';

const pythonCode = `# Pure Component Chemical Physical Properties
# Variable names and data structure for programming reference

# Component species list
components = ['SO2', 'SO3', 'O2', 'N2', 'CO2', 'H2O', 'H2SO4', 'S', 'H2S', 'H2', 'H3O', 'HSO4', 'SO4']

# Property parameters with units
properties = {
    'API': {'units': '', 'description': 'API gravity'},
    'CHARGE': {'units': '', 'description': 'Ionic charge'},
    'DCPLS': {'units': 'Btu/lbmol', 'description': 'Heat capacity difference'},
    'DGAQFM': {'units': 'Btu/lbmol', 'description': 'Aqueous Gibbs free energy of formation'},
    'DGAQHG': {'units': 'Btu/lbmol', 'description': 'Aqueous Gibbs Henry constant'},
    'DGFORM': {'units': 'Btu/lbmol', 'description': 'Gibbs free energy of formation'},
    'DGSFRM': {'units': 'Btu/lbmol', 'description': 'Solid Gibbs free energy of formation'},
    'DHAQFM': {'units': 'Btu/lbmol', 'description': 'Aqueous enthalpy of formation'},
    'DHAQHG': {'units': 'Btu/lbmol', 'description': 'Aqueous enthalpy Henry constant'},
    'DHFORM': {'units': 'Btu/lbmol', 'description': 'Enthalpy of formation'},
    'DHSFRM': {'units': 'Btu/lbmol', 'description': 'Solid enthalpy of formation'},
    'DHVLB': {'units': 'Btu/lbmol', 'description': 'Heat of vaporization at normal boiling point'},
    'FREEZEPT': {'units': 'F', 'description': 'Freezing point'},
    'HCOM': {'units': 'Btu/lbmol', 'description': 'Heat of combustion'},
    'HFUS': {'units': 'Btu/lbmol', 'description': 'Heat of fusion'},
    'MW': {'units': '', 'description': 'Molecular weight'},
    'OMEGA': {'units': '', 'description': 'Acentric factor'},
    'PC': {'units': 'psig', 'description': 'Critical pressure'},
    'TB': {'units': 'F', 'description': 'Normal boiling point'},
    'TC': {'units': 'F', 'description': 'Critical temperature'},
    'VC': {'units': 'cuft/lbmol', 'description': 'Critical volume'},
    'ZC': {'units': '', 'description': 'Critical compressibility factor'},
}

# Example data structure for a single component
SO2_properties = {
    'MW': 64.0648,           # Molecular weight
    'TC': 315.68,            # Critical temperature (F)
    'PC': 1128.988,          # Critical pressure (psig)
    'VC': 1.954253,          # Critical volume (cuft/lbmol)
    'ZC': 0.269,             # Critical compressibility
    'OMEGA': 0.245381,       # Acentric factor
    'TB': 13.964,            # Normal boiling point (F)
    'FREEZEPT': -99.67,      # Freezing point (F)
    'DHFORM': -127777,       # Enthalpy of formation (Btu/lbmol)
    'DGFORM': -129028,       # Gibbs free energy of formation (Btu/lbmol)
    'DHVLB': 10894.2,        # Heat of vaporization (Btu/lbmol)
}

# Access property value
def get_property(component: str, prop: str) -> float:
    """Get a thermodynamic property value for a component."""
    # properties_data[prop][component] returns the value
    pass

# Calculate ideal gas heat capacity
def ideal_gas_cp(T: float, alpha: float, beta: float, gamma: float, delta: float) -> float:
    """
    Calculate ideal gas heat capacity using polynomial correlation.
    Cp = alpha + beta*T + gamma*T^2 + delta*T^3
    
    Args:
        T: Temperature in Kelvin
        alpha, beta, gamma, delta: Polynomial coefficients
    Returns:
        Cp in cal/mol-K
    """
    return alpha + beta*T + gamma*T**2 + delta*T**3
`;

export default function PureComponent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [properties, setProperties] = useState<ChemicalPropertyRow[]>(defaultChemicalProperties);

  const handleValueChange = (rowIndex: number, component: ComponentKey, value: string) => {
    setProperties(prev => {
      const updated = [...prev];
      const numValue = value === '' ? null : parseFloat(value);
      updated[rowIndex] = {
        ...updated[rowIndex],
        [component]: isNaN(numValue as number) ? null : numValue
      };
      return updated;
    });
  };

  const handleSave = () => {
    toast({
      title: "Properties Saved",
      description: "Chemical physical property values have been updated successfully.",
    });
  };

  const formatValue = (value: number | null): string => {
    if (value === null) return '';
    if (Math.abs(value) < 0.0001 && value !== 0) {
      return value.toExponential(2);
    }
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
              <Atom className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Pure Component Properties</h1>
                <p className="text-xs text-muted-foreground">Individual species thermodynamic data</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PythonCodeViewer
              title="Pure Component Properties - Python Variables"
              description="Variable names and data structures for pure component thermodynamic properties"
              code={pythonCode}
            />
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
              <CardTitle>Pure Component Chemical Physical Properties</CardTitle>
              <CardDescription>
                Edit thermodynamic properties for individual chemical species. Scroll horizontally to view all components.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm" data-testid="table-properties">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="sticky left-0 bg-muted/50 px-3 py-2 text-left font-semibold text-foreground min-w-[120px] z-10">
                        Parameter
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-foreground min-w-[100px]">
                        Units
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-foreground min-w-[60px]">
                        Data Set
                      </th>
                      {componentKeys.map(component => (
                        <th key={component} className="px-3 py-2 text-center font-semibold text-foreground min-w-[100px]">
                          {component}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((row, rowIndex) => (
                      <tr 
                        key={row.parameter} 
                        className="border-b border-border hover:bg-muted/30"
                        data-testid={`row-${row.parameter}`}
                      >
                        <td className="sticky left-0 bg-background px-3 py-1 font-medium text-foreground z-10 border-r border-border">
                          {row.parameter}
                        </td>
                        <td className="px-3 py-1 text-muted-foreground">
                          {row.units}
                        </td>
                        <td className="px-3 py-1 text-center text-muted-foreground">
                          {row.dataSet}
                        </td>
                        {componentKeys.map(component => (
                          <td key={component} className="px-1 py-1">
                            <Input
                              type="text"
                              value={formatValue(row[component])}
                              onChange={(e) => handleValueChange(rowIndex, component, e.target.value)}
                              className="text-xs text-center w-[90px] font-mono"
                              data-testid={`input-${row.parameter}-${component}`}
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
          <span>Pure Component Properties | {properties.length} Parameters x {componentKeys.length} Components</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
