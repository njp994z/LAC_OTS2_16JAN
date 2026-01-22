import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Target, Sliders, Activity, GitCompare } from "lucide-react";

export default function OutputVariables() {
  const [, setLocation] = useLocation();

  const outputSections = [
    {
      id: "set-point-variables",
      title: "Set Point Variables (SP)",
      description: "View and configure all controller setpoint variables used in the simulation. Setpoints define the target values that controllers aim to achieve, including temperatures, pressures, flows, and levels throughout the acid plant process.",
      icon: Target,
      path: "/settings/output-variables/set-point-variables",
      testId: "button-set-point-variables"
    },
    {
      id: "manipulated-variables",
      title: "Dynamically Manipulated Input Variables",
      description: "Monitor variables that are dynamically adjusted by controllers during simulation. These include valve positions, pump speeds, and other actuator outputs that respond to process changes to maintain setpoints.",
      icon: Sliders,
      path: "/settings/output-variables/manipulated-variables",
      testId: "button-manipulated-variables"
    },
    {
      id: "process-variables",
      title: "Initial Process Variables (PV)",
      description: "Set points for initial process variables throughout the plant. Process variables represent the actual measured values including temperatures, pressures, flows, compositions, and levels.",
      icon: Activity,
      path: "/settings/output-variables/process-variables",
      testId: "button-process-variables"
    },
    {
      id: "static-heat-material-balances",
      title: "Static Heat & Material Balances",
      description: "Calculate and view steady-state heat and material balance results across the plant. This analysis provides mass flow rates, energy transfers, and thermodynamic properties at each process unit for design verification and optimization.",
      icon: GitCompare,
      path: "/settings/static-heat-material-balances",
      testId: "button-static-heat-material-balances"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/simulation-settings")}
              data-testid="button-back-settings"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">Simulation Output Variable Table</h1>
              <p className="text-xs text-muted-foreground">View and customize calculated process outputs</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Output Variable Categories</CardTitle>
              <CardDescription>
                Select a category to view setpoints, manipulated variables, process measurements, and controller performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {outputSections.map((section) => {
                  const IconComponent = section.icon;
                  return (
                    <Button
                      key={section.id}
                      variant="default"
                      className="h-auto py-4 px-5 justify-start text-left"
                      onClick={() => setLocation(section.path)}
                      data-testid={section.testId}
                    >
                      <IconComponent className="w-5 h-5 mr-4 flex-shrink-0" />
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">{section.title}</span>
                        <span className="text-xs opacity-80 font-normal whitespace-normal">
                          {section.description}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Output Variables | Configuration Panel</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
