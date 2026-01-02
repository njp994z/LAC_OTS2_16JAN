import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Factory, Columns3, Fan, Thermometer, Gauge, Cloud, Flame, Wrench, ClipboardList } from "lucide-react";

export default function EquipmentSizes() {
  const [, setLocation] = useLocation();
  
  const equipmentSections = [
    {
      id: "equipment-list",
      title: "Equipment List",
      description: "Complete inventory of all major equipment in the acid plant including tag numbers, manufacturers, design specifications, materials of construction, and equipment datasheets for reference during simulation configuration.",
      icon: ClipboardList,
      path: "/settings/equipment-sizes/equipment-list",
      testId: "button-equipment-list"
    },
    {
      id: "converter",
      title: "Converter Settings",
      description: "Configure the catalytic converter and catalyst parameters, including number of catalyst beds, catalyst activities, volumes & types, converter diameter, and pressure drop parameters affecting SO₂ → SO₃ conversion efficiency.",
      icon: Columns3,
      path: "/converter-settings",
      testId: "button-converter-settings"
    },
    {
      id: "acid-tower",
      title: "Acid Tower Settings",
      description: "Adjust parameters for the drying tower, intermediate absorption tower (IPAT), and final absorption tower (FAT): packing type, heights, tower diameters, mist eliminators, and acid hold-up settings.",
      icon: Factory,
      path: "/settings/equipment-sizes/acid-tower",
      testId: "button-acid-tower-settings"
    },
    {
      id: "compressor",
      title: "Compressor Settings",
      description: "Configure parameters from the Main Compressor Vendor such as the compressor curve and polytropic efficiencies for this plant's specific compressor design.",
      icon: Fan,
      path: "/settings/equipment-sizes/compressor",
      testId: "button-compressor-settings"
    },
    {
      id: "heat-exchanger",
      title: "Heat Exchanger Settings",
      description: "Configure all major heat exchangers including acid coolers, gas-gas HIP and CIP, boiler feedwater pre-heater, superheater, economizers, and waste heat boiler (WHB) with heat transfer areas and configurations.",
      icon: Thermometer,
      path: "/settings/equipment-sizes/heat-exchanger",
      testId: "button-heat-exchanger-settings"
    },
    {
      id: "pressure-drop",
      title: "Pressure Drop Parameters",
      description: "Configure rigorous pressure drop calculations to accurately predict the gas-phase pressure drops for each unit operation throughout the plant.",
      icon: Gauge,
      path: "/settings/equipment-sizes/pressure-drop",
      testId: "button-pressure-drop-settings"
    },
    {
      id: "steam-system",
      title: "Steam System Settings",
      description: "Configure the steam generation and distribution system: waste heat boiler parameters, steam drum level control, blowdown rate, deaerator settings, and steam export/import balance.",
      icon: Cloud,
      path: "/settings/equipment-sizes/steam-system",
      testId: "button-steam-system-settings"
    },
    {
      id: "sulfur-burner",
      title: "Sulfur Burner Settings",
      description: "Specify the core parameters for the sulfur burner vessel: diameter, length, number of baffles, thermal heating properties, sulfur spray nozzles, and nozzle pressure drop.",
      icon: Flame,
      path: "/settings/equipment-sizes/sulfur-burner",
      testId: "button-sulfur-burner-settings"
    },
    {
      id: "utility-system",
      title: "Utility System Settings",
      description: "Set consumption and supply parameters for plant utilities: cooling water, instrument air pressure, electric power demand, demister water, sealing water for pumps, and makeup water quality.",
      icon: Wrench,
      path: "/settings/equipment-sizes/utility-system",
      testId: "button-utility-system-settings"
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
              <h1 className="font-semibold text-foreground">Acid Plant Equipment Sizes</h1>
              <p className="text-xs text-muted-foreground">Configure physical parameters for major equipment</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Configuration Categories</CardTitle>
              <CardDescription>
                Customize dimensions, capacities, and operating parameters for converters, heat exchangers, towers, and other process units
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {equipmentSections.map((section) => {
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
          <span>Equipment Sizes | Configuration Panel</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
