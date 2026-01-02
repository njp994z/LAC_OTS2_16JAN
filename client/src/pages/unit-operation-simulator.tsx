import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, FlaskConical, ArrowLeftRight, Droplets, Flame, Thermometer, Wind, Gauge, Waves, Zap, Fan, Snowflake, Fuel, Settings2, PipetteIcon, Layers } from "lucide-react";

const unitOperations = [
  {
    id: "converter-simulations",
    title: "Converter Simulations: Stand Alone, Static, and Dynamic",
    description: "Access three converter simulation modes: isolated stand-alone analysis, steady-state plant balance, and real-time dynamic control training.",
    path: "/unit-operation/converter-simulations",
    icon: Layers
  },
  {
    id: "catalytic-reactor",
    title: "Stand Alone Converter",
    description: "Utilize coupled differential equations to solve for conversion, temperature, and pressure across multiple converter passes.",
    path: "/unit-operation/catalytic-reactor",
    icon: FlaskConical
  },
  {
    id: "main-compressor",
    title: "Main Compressor",
    description: "Calculate compressor performance including isentropic head, brake power, and outlet conditions from inlet parameters.",
    path: "/unit-operation/main-compressor",
    icon: Settings2
  },
  {
    id: "sulfur-control-hydraulics",
    title: "Sulfur Control Hydraulics",
    description: "Model sulfur flow control systems including valve sizing, pressure regulation, and flow distribution for molten sulfur handling.",
    path: "/unit-operation/sulfur-control-hydraulics",
    icon: Gauge
  },
  {
    id: "sulfur-furnace",
    title: "Sulfur Furnace",
    description: "Combust molten sulfur with dry air to produce SO₂-rich process gas at high temperature.",
    path: "/unit-operation/sulfur-furnace",
    icon: Flame
  },
  {
    id: "sulfuric-acid-tower",
    title: "Sulfuric Acid Tower",
    description: "Master SO₃ absorption in sulfuric acid and product concentration control.",
    path: "/unit-operation/sulfuric-acid-tower",
    icon: Droplets
  },
  {
    id: "acid-hydraulics",
    title: "Acid Hydraulics",
    description: "Model acid circulation system hydraulics including pump curves, pressure drops, and flow distribution across towers.",
    path: "/unit-operation/acid-hydraulics",
    icon: PipetteIcon
  },
  {
    id: "gas-gas-heat-exchanger",
    title: "Gas-Gas Heat Exchanger",
    description: "Optimize heat recovery between hot and cold process gas streams.",
    path: "/unit-operation/gas-gas-heat-exchanger",
    icon: ArrowLeftRight
  },
  {
    id: "waste-heat-boiler",
    title: "Waste Heat Boiler (WHB)",
    description: "Recover thermal energy from hot process gases to generate high-pressure steam.",
    path: "/unit-operation/waste-heat-boiler",
    icon: Flame
  },
  {
    id: "superheater",
    title: "Superheater",
    description: "Control steam temperature and quality for optimal turbine performance.",
    path: "/unit-operation/superheater",
    icon: Thermometer
  },
  {
    id: "acid-cooler",
    title: "Acid Cooler",
    description: "Manage product acid temperature for safe storage and handling.",
    path: "/unit-operation/acid-cooler",
    icon: Wind
  },
  {
    id: "economizer",
    title: "Economizer",
    description: "Preheat boiler feedwater using waste heat to improve overall efficiency.",
    path: "/unit-operation/economizer",
    icon: Gauge
  },
  {
    id: "tail-gas-scrubber",
    title: "Tail Gas Scrubber",
    description: "Remove residual SO₂ from exhaust gases to meet environmental emission standards.",
    path: "/unit-operation/tail-gas-scrubber",
    icon: Waves
  },
  {
    id: "deaerator",
    title: "Deaerator",
    description: "Remove dissolved oxygen and gases from boiler feedwater to prevent corrosion.",
    path: "/unit-operation/deaerator",
    icon: Droplets
  },
  {
    id: "turbo-generator",
    title: "Turbo-Generator",
    description: "Convert high-pressure steam energy into electrical power for plant operations.",
    path: "/unit-operation/turbo-generator",
    icon: Zap
  },
  {
    id: "start-up-burner",
    title: "Start-Up Burner",
    description: "Provide auxiliary heat during plant startup to bring catalyst beds to operating temperature.",
    path: "/unit-operation/start-up-burner",
    icon: Fuel
  },
  {
    id: "fin-fan-cooler",
    title: "Fin-Fan Cooler",
    description: "Air-cooled heat exchanger using finned tubes and fans for process cooling.",
    path: "/unit-operation/fin-fan-cooler",
    icon: Fan
  },
  {
    id: "air-cooled-condenser",
    title: "Air-Cooled Condenser",
    description: "Condense steam to water using ambient air cooling for water conservation.",
    path: "/unit-operation/air-cooled-condenser",
    icon: Snowflake
  }
];

export default function UnitOperationSimulator() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/demo")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Unit Operation Simulator</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Dive deep into individual unit operations with focused simulations
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Unit Operations</CardTitle>
              <CardDescription>
                Select a unit operation below to explore detailed simulations and understand specific equipment behavior at the component level.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {unitOperations.map((operation) => (
                  <Button
                    key={operation.id}
                    variant="default"
                    className="h-auto py-4 px-5 justify-start text-left"
                    onClick={() => setLocation(operation.path)}
                    data-testid={`button-${operation.id}`}
                  >
                    <operation.icon className="w-6 h-6 mr-4 flex-shrink-0" />
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{operation.title}</span>
                      <span className="text-xs opacity-80 font-normal whitespace-normal">
                        {operation.description}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
