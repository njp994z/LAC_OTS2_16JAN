import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Layers, FlaskConical, Gauge, Activity } from "lucide-react";

export default function ConverterSimulations() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/unit-operation-simulator")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Layers className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Converter Simulations</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Stand Alone, Static, and Dynamic converter simulation modes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Converter Simulation Modes</CardTitle>
              <CardDescription>
                Choose from three different converter simulation approaches based on your training objectives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <Button
                  variant="default"
                  className="h-auto py-4 px-5 justify-start text-left"
                  onClick={() => setLocation("/unit-operation/catalytic-reactor")}
                  data-testid="button-stand-alone"
                >
                  <FlaskConical className="w-6 h-6 mr-4 flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">Stand-Alone Converter</span>
                    <span className="text-xs opacity-80 font-normal whitespace-normal">
                      Isolated converter simulation using coupled differential equations to solve for 
                      conversion, temperature, and pressure across multiple catalyst passes.
                    </span>
                  </div>
                </Button>

                <Button
                  variant="default"
                  className="h-auto py-4 px-5 justify-start text-left"
                  onClick={() => setLocation("/static-simulation")}
                  data-testid="button-static"
                >
                  <Gauge className="w-6 h-6 mr-4 flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">Static Simulation</span>
                    <span className="text-xs opacity-80 font-normal whitespace-normal">
                      Steady-state heat and material balance calculations for the complete acid plant 
                      including sulfur burner, converter, and absorption systems.
                    </span>
                  </div>
                </Button>

                <Button
                  variant="default"
                  className="h-auto py-4 px-5 justify-start text-left"
                  onClick={() => setLocation("/dynamic-simulation")}
                  data-testid="button-dynamic"
                >
                  <Activity className="w-6 h-6 mr-4 flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">Dynamic Simulation</span>
                    <span className="text-xs opacity-80 font-normal whitespace-normal">
                      Real-time PID controller simulation with Manual and Automatic modes for 
                      process control training and operator response scenarios.
                    </span>
                  </div>
                </Button>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/unit-operation-simulator")}
                  data-testid="button-return-to-list"
                >
                  Return to Unit Operations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
