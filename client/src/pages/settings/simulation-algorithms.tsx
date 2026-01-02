import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calculator, Activity, Rocket, AlertTriangle } from 'lucide-react';
import { EngineIcon } from '@/components/icons/EngineIcon';

interface AlgorithmCategory {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const algorithmCategories: AlgorithmCategory[] = [
  {
    id: 'static-simulation',
    title: 'Static Simulation Algorithm and Python Code',
    description: 'Steady-state heat and material balance calculations for process design and optimization. View the mathematical models and Python implementation.',
    path: '/settings/simulation-algorithms/static-simulation',
    icon: Calculator,
  },
  {
    id: 'dynamic-simulation',
    title: 'Dynamic Simulation Algorithm and Python Code',
    description: 'Time-dependent process dynamics including PID control loops, heat transfer transients, and reaction kinetics. Explore the differential equations and numerical methods.',
    path: '/settings/simulation-algorithms/dynamic-simulation',
    icon: Activity,
  },
  {
    id: 'plant-startup',
    title: 'Plant Start-Up Algorithm and Python Code',
    description: 'Sequential startup procedures, equipment warm-up protocols, and process initialization logic. Review the startup sequence algorithms and timing calculations.',
    path: '/settings/simulation-algorithms/plant-startup',
    icon: Rocket,
  },
  {
    id: 'emergency-scenarios',
    title: 'Emergency Scenarios Algorithm and Python Code',
    description: 'Emergency shutdown logic, safety interlock cascades, and abnormal condition handling. Examine the ESD algorithms and protective system responses.',
    path: '/settings/simulation-algorithms/emergency-scenarios',
    icon: AlertTriangle,
  },
];

export default function SimulationAlgorithms() {
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
              <EngineIcon className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Simulation Algorithms and Python Code</h1>
                <p className="text-xs text-muted-foreground">View algorithms, equations, and source code</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Algorithm Categories</CardTitle>
              <CardDescription>
                Select a category to explore the simulation algorithms and Python code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {algorithmCategories.map((category) => (
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
          <span>Simulation Algorithms | Python Code Repository</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
