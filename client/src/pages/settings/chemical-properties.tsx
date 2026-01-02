import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FlaskConical, Atom, GitMerge, Waves, Thermometer, Droplets, Wind } from 'lucide-react';

interface PropertyCategory {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const propertyCategories: PropertyCategory[] = [
  {
    id: 'pure-component',
    title: 'Pure Component Chemical Physical Properties',
    description: 'Thermodynamic properties for individual chemical species including heat capacities, vapor pressures, densities, viscosities, and thermal conductivities across temperature ranges.',
    path: '/settings/chemical-properties/pure-component',
    icon: Atom,
  },
  {
    id: 'binary-interaction',
    title: 'Binary Interaction Physical Properties',
    description: 'Interaction parameters for multi-component mixtures including activity coefficients, excess properties, and mixing rules for accurate phase equilibrium calculations.',
    path: '/settings/chemical-properties/binary-interaction',
    icon: GitMerge,
  },
  {
    id: 'henrys-law',
    title: "Henry's Law Parameters",
    description: 'Gas solubility constants and temperature-dependent parameters for dissolved gases in liquid phases, essential for absorption tower and gas-liquid equilibrium modeling.',
    path: '/settings/chemical-properties/henrys-law',
    icon: Waves,
  },
  {
    id: 'gas-heat-capacity',
    title: 'Gas Phase Heat Capacity Parameters',
    description: 'Temperature-dependent heat capacity coefficients for gas phase species using polynomial correlations (Cp = A + BT + CT² + DT³) for accurate enthalpy and energy balance calculations.',
    path: '/settings/chemical-properties/gas-heat-capacity',
    icon: Thermometer,
  },
  {
    id: 'psychrometric-data',
    title: 'Psychrometric Data',
    description: 'Air-water vapor properties including humidity ratios, wet bulb temperatures, dew points, and enthalpy values for HVAC, drying, and cooling tower calculations.',
    path: '/settings/chemical-properties/psychrometric-data',
    icon: Droplets,
  },
  {
    id: 'gas-phase-viscosities',
    title: 'Gas Phase Viscosities',
    description: "Sutherland's formula parameters for calculating dynamic viscosity of pure gases (SO₂, O₂, N₂) at low pressures in the dilute gas regime.",
    path: '/settings/chemical-properties/gas-phase-viscosities',
    icon: Wind,
  },
];

export default function ChemicalProperties() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/simulation-settings')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <FlaskConical className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Chemical Physical Properties</h1>
                <p className="text-xs text-muted-foreground">Thermodynamic data and material properties</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Property Categories</CardTitle>
              <CardDescription>
                Select a category to view and configure chemical physical property data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {propertyCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant="default"
                    className="h-auto py-4 px-5 justify-start text-left"
                    onClick={() => setLocation(category.path)}
                    data-testid={`button-${category.id}`}
                  >
                    <category.icon className="w-5 h-5 mr-4 flex-shrink-0" />
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{category.title}</span>
                      <span className="text-xs opacity-80 font-normal whitespace-normal">
                        {category.description}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Chemical Physical Properties | Thermodynamic Data</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
