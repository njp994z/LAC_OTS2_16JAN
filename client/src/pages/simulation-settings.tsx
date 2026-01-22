import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Blocks, Activity, Database, Table2 } from "lucide-react";
import { EngineIcon } from "@/components/icons/EngineIcon";

interface SettingCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const settingCategories: SettingCategory[] = [
  {
    id: "simulation-algorithms",
    title: "Simulation Algorithms and Python Code",
    description: "Visualize this program's simulation algorithms, access the python code, and \"lift-up the hood\" of the simulation.",
    icon: EngineIcon,
    path: "/settings/simulation-algorithms"
  },
  {
    id: "unit-operations",
    title: "Unit Operation Blocks & Subroutines",
    description: "Manage modular calculation blocks for individual unit operations including sulfur burning, catalytic conversion, heat recovery, and acid absorption processes.",
    icon: Blocks,
    path: "/unit-operation-simulator"
  },
  {
    id: "controller-outputs",
    title: "UI Screens, Instrument Blocks, and PID Controllers",
    description: "Reference guide for DeltaV controller status messages, PV conditions, output states, interlock indicators, and mode displays used throughout the simulation faceplates.",
    icon: Activity,
    path: "/settings/controller-outputs"
  },
  {
    id: "databases",
    title: "Databases",
    description: "Access technical reference databases including catalyst parameters, thermodynamic properties, equipment specifications, and material data used throughout the simulation calculations.",
    icon: Database,
    path: "/settings/databases"
  },
  {
    id: "material-balances",
    title: "Material Balances",
    description: "View and customize the display of calculated process outputs including conversion rates, heat duties, mass balances, and equipment performance metrics.",
    icon: Table2,
    path: "/settings/output-variables"
  }
];

export default function SimulationSettings() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/simulator")}
              data-testid="button-back-simulator"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">Simulation Settings</h1>
              <p className="text-xs text-muted-foreground">Configure simulation parameters and system options</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Categories</CardTitle>
              <CardDescription>
                Select a category to view and modify simulation settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {settingCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant="default"
                    className="h-auto py-4 px-5 justify-start text-left"
                    onClick={() => setLocation(category.path)}
                    data-testid={`button-setting-${category.id}`}
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
          <span>Simulation Settings | Configuration Panel</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
