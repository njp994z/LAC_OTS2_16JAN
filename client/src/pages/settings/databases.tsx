import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Database, FlaskConical, Atom, Factory, Sliders, ClipboardList, Table2, Shield, Gauge, DollarSign } from "lucide-react";

interface DatabaseCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const databaseCategories: DatabaseCategory[] = [
  {
    id: "catalyst-database",
    title: "Catalyst Parameter Database",
    description: "Reference data for catalyst types including activity factors, pressure drop coefficients, void fractions, and performance characteristics for SO₂ to SO₃ conversion.",
    icon: Atom,
    path: "/catalyst-parameter-database"
  },
  {
    id: "input-variables",
    title: "Control Loops",
    description: "Configure process variable operating ranges, high/low alarm limits, and safety interlocks for critical parameters like temperatures, pressures, and flow rates.",
    icon: Sliders,
    path: "/settings/input-variables"
  },
  {
    id: "instrument-index",
    title: "Instrument Index",
    description: "Complete listing of all field instruments, transmitters, control valves, and measurement devices with tag numbers, ranges, calibration data, and P&ID references.",
    icon: ClipboardList,
    path: "/settings/instrument-index"
  },
  {
    id: "chemical-properties",
    title: "Chemical Physical Properties",
    description: "Access thermodynamic data, reaction kinetics, and material properties including heat capacities, densities, and equilibrium constants for sulfuric acid production.",
    icon: FlaskConical,
    path: "/settings/chemical-properties"
  },
  {
    id: "output-variables",
    title: "Simulation Variables",
    description: "View and customize the display of calculated process outputs including conversion rates, heat duties, mass balances, and equipment performance metrics.",
    icon: Table2,
    path: "/settings/output-variables"
  },
  {
    id: "equipment-sizes",
    title: "Acid Plant Equipment Sizes",
    description: "Define equipment dimensions and capacities for converters, heat exchangers, absorption towers, pumps, and other major process units in the simulation.",
    icon: Factory,
    path: "/settings/equipment-sizes"
  },
  {
    id: "interlock-logic",
    title: "Interlock Logic",
    description: "Configure safety interlock sequences, emergency shutdown triggers, and permissive conditions that protect equipment and personnel during abnormal operations.",
    icon: Shield,
    path: "/settings/interlock-logic"
  },
  {
    id: "controller-tuning",
    title: "Controller Tuning Parameters",
    description: "Adjust PID controller gains, setpoints, output limits, and control modes for regulatory loops managing temperature, pressure, flow, and level control.",
    icon: Gauge,
    path: "/settings/controller-tuning"
  },
  {
    id: "run-historian",
    title: "Run Historian & Database",
    description: "Access historical simulation data, training session records, and performance trends for analysis, reporting, and operator competency tracking.",
    icon: Database,
    path: "/settings/run-historian"
  },
  {
    id: "economics-costs",
    title: "Acid Plant Economics & Costs",
    description: "Configure commodity pricing, utility costs, production targets, and profitability metrics for economic analysis including sulfuric acid, steam, power, and raw material valuations.",
    icon: DollarSign,
    path: "/settings/economics-costs"
  }
];

export default function Databases() {
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
            <div>
              <h1 className="font-semibold text-foreground">Databases</h1>
              <p className="text-xs text-muted-foreground">Technical reference databases for simulation calculations</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Reference Databases</CardTitle>
                  <CardDescription>
                    Access technical data used in simulation calculations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {databaseCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant="default"
                    className="h-auto py-4 px-5 justify-start text-left"
                    onClick={() => setLocation(category.path)}
                    data-testid={`button-database-${category.id}`}
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
          <span>Databases | Technical Reference Data</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
