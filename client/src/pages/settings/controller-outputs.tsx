import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Activity, MessageSquare, GitBranch, Shapes, LayoutGrid, Radio } from "lucide-react";

interface ControllerSubpage {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const subpages: ControllerSubpage[] = [
  {
    id: "deltav-faceplates",
    title: "Delta V Faceplates",
    description: "Interactive operator interface panels for real-time process control. Includes PID controller faceplates, valve control interfaces, and alarm management displays with DeltaV-style graphics.",
    path: "/settings/controller-outputs/faceplates",
    icon: LayoutGrid
  },
  {
    id: "pv-output-messages",
    title: "Controller Process Value (PV) & Output Status Messages",
    description: "Comprehensive reference for 40+ DeltaV controller status messages including PV status codes, output status indicators, and diagnostic messages for troubleshooting control loops.",
    path: "/settings/controller-outputs/pv-output-messages",
    icon: MessageSquare
  },
  {
    id: "valve-status",
    title: "Valve Output Status Messages",
    description: "Complete guide to valve position feedback, actuator status codes, and output signal diagnostics organized by category for quick reference during operations.",
    path: "/settings/controller-outputs/valve-status",
    icon: GitBranch
  },
  {
    id: "symbols",
    title: "Instrument Block Symbols & Descriptions",
    description: "Visual reference guide for DeltaV instrument block symbols including controllers, indicators, transmitters, and function blocks with standard ISA naming conventions.",
    path: "/settings/controller-outputs/symbols",
    icon: Shapes
  },
  {
    id: "sensor-outputs",
    title: "Delta V Sensor Outputs",
    description: "DeltaV instrument block sensor outputs including Analog Input (AI) blocks, STATUS parameter quality indicators (Good/Uncertain/Bad), limit states, and sub-status codes for process sensors.",
    path: "/settings/controller-outputs/sensor-outputs",
    icon: Radio
  }
];

export default function ControllerOutputs() {
  const [, setLocation] = useLocation();

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
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Delta V: Controller Outputs</h1>
                <p className="text-xs text-muted-foreground">Reference guide for controller status messages and indicators</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Controller Output Reference</CardTitle>
              <CardDescription>
                Select a category to view detailed status messages and symbol definitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {subpages.map((page) => (
                  <Button
                    key={page.id}
                    variant="default"
                    className="h-auto py-4 px-5 justify-start text-left"
                    onClick={() => setLocation(page.path)}
                    data-testid={`button-${page.id}`}
                  >
                    <page.icon className="w-5 h-5 mr-4 flex-shrink-0" />
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{page.title}</span>
                      <span className="text-xs opacity-80 font-normal whitespace-normal">
                        {page.description}
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
          <span>Delta V: Controller Outputs | Reference Guide</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
