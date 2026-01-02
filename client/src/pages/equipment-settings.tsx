import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";

export default function EquipmentSettings() {
  const [, setLocation] = useLocation();
  const equipmentSections = [
    {
      id: "converter",
      title: "Converter Settings",
      description: "Configure the catalytic converter and catalyst (vanadium pentoxide on diatoms) parameters, including number of catalyst beds, catalyst activities (catalyst can deactivate over time), catalyst volumes & types, converter diameter, pressure drop parameters, etc. These settings directly affect SO₂ → SO₃ conversion efficiency, pressure drop, and acid plant production.",
      testId: "button-converter-settings"
    },
    {
      id: "acid-tower",
      title: "Acid Tower Settings",
      description: "Adjust parameters for the drying tower, intermediate absorption tower (IPAT), and final absorption tower (FAT): packing type (e.g.: saddles / structured packing), packing heights, tower diameters, mist eliminators, acid hold-up, and other settings. Critical for controlling acid strength, mist formation, and SO₃ absorption efficiency.",
      testId: "button-acid-tower-settings"
    },
    {
      id: "compressor",
      title: "Compressor Settings",
      description: "This simulation utilizes parameters received from the Main Compressor Vendor such as the compressor curve and polytropic efficiencies. This tab allows for settings related to this plant's specific compressor design.",
      testId: "button-compressor-settings"
    },
    {
      id: "heat-exchanger",
      title: "Heat Exchanger Settings",
      description: "Configure all major heat exchangers in the system per the exact design. These inputs include the actual heat transfer area, tube/shell vs. plate & frame configurations, adiabatic heat-losses, double-segmental vs. radial arrangements, etc. This simulation simultaneously solves a system of Ordinary Differential Equations (ODEs) to obtain concurrent heat transfer, flow, and the system's 10+ plant's heat exchangers include: acid coolers, the gas-gas Hot-Interpass (HIP) and Cold-Interpass (CIP), boiler feedwater pre-heater, superheater, economizers, and waste heat boiler (WHB). These unit operations directly impacts energy efficiency and steam export.",
      testId: "button-heat-exchanger-settings"
    },
    {
      id: "pressure-drop",
      title: "Pressure Drop Parameters",
      description: "This simulation utilizes rigorous pressure drop calculations to accurately predict the gas-phase pressure drops for each unit operation.",
      testId: "button-pressure-drop-settings"
    },
    {
      id: "steam-system",
      title: "Steam System Settings",
      description: "Configure the steam generation and distribution system: waste heat boiler parameters (steam pressure, superheat temperature), steam drum level control, blowdown rate, deaerator settings, and steam export/import balance. Determines how much high-pressure or medium-pressure steam the plant can generate or requires from external sources.",
      testId: "button-steam-system-settings"
    },
    {
      id: "sulfur-burner",
      title: "Sulfur Burner Settings",
      description: "Specify the core parameters for the sulfur burner vessel such as the vessel's diameter, length, number of baffles, thermal heating properties, number for sulfur spray nozzles, sulfur nozzle pressure drop, etc.",
      testId: "button-sulfur-burner-settings"
    },
    {
      id: "utility-system",
      title: "Utility System Settings",
      description: "Set consumption and supply parameters for plant utilities: cooling water inlet temperature and flow, instrument air pressure, electric power demand (pumps, blowers, instrumentation), demister water, sealing water for pumps, and any makeup water quality. Allows realistic calculation of operating costs and utility balances.",
      testId: "button-utility-system-settings"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/demo")}
              data-testid="button-back-demo"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-semibold text-foreground">Plant Equipment Sizes</h1>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed max-w-5xl">
              This section lets you customize the physical parameters of every major piece of equipment in the sulfuric acid plant simulator. 
              Adjust real-world design and operating values such as dimensions, flow rates, temperatures, catalyst volumes, packing heights, 
              pressures, heat transfer areas, and materials. The simulator uses these inputs with first-principles models (mass & energy 
              balances, reaction kinetics, pressure drop correlations, heat transfer, etc.) to accurately predict plant capacity, conversion 
              efficiency, acid strength, energy recovery, utility consumption, and emissions in real time.
            </p>
          </div>

          <div className="space-y-6">
            {equipmentSections.map((section) => (
              <div
                key={section.id}
                className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6"
                data-testid={`section-${section.id}`}
              >
                <Button
                  variant={section.id === "converter" ? "default" : "outline"}
                  size="lg"
                  data-testid={section.testId}
                  onClick={() => section.id === "converter" && setLocation("/converter-settings")}
                  className="w-full sm:max-w-[200px] sm:w-[200px] h-auto min-h-[60px] text-base whitespace-normal leading-snug sm:flex-shrink-0 py-3"
                >
                  {section.title}
                </Button>
                
                <div className="flex-1">
                  <p className="text-sm leading-relaxed text-foreground">
                    {section.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
