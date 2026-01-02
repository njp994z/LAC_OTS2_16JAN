import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calculator } from 'lucide-react';
import staticSimulationDiagram from '@assets/WhatsApp_Image_2025-12-09_at_12.02.23_b385fe22_1765303398586.jpg';

export default function StaticSimulation() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/settings/simulation-algorithms')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Calculator className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Static Simulation Algorithm</h1>
                <p className="text-xs text-muted-foreground">Steady-state calculations and Python code</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Static Simulation Algorithm and Python Code</CardTitle>
              <CardDescription>
                Steady-state heat and material balance calculations for process design and optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <img 
                  src={staticSimulationDiagram} 
                  alt="OTS Controller Computation Algorithm - Static Simulation flowchart showing user input steps, databases, Python scripts, and display outputs"
                  className="w-full max-w-5xl rounded-lg border border-border"
                  data-testid="img-static-simulation-diagram"
                />
                <p className="text-sm text-muted-foreground mt-4 text-center max-w-3xl">
                  Static simulation algorithm flowchart showing the computation flow from user setpoint changes 
                  through validation, process calculations, and output displays. For steady-state simulation, 
                  SP = PV always with output range matching setpoint values.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Static Simulation | Steady-State Calculations</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
