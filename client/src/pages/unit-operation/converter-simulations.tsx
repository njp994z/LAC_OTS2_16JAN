import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Layers, FlaskConical, Beaker, TestTube, Atom, Code, ChevronDown, ExternalLink, Database } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ConverterSimulations() {
  const [, setLocation] = useLocation();

  const passes = [
    { 
      id: 1, 
      title: "Converter Pass 1", 
      icon: FlaskConical,
      description: "First catalyst bed simulation. Model SO2 oxidation kinetics, temperature rise, and conversion for the initial high-temperature reaction stage.",
      path: "/unit-operation/converter-pass-1" 
    },
    { 
      id: 2, 
      title: "Converter Pass 2", 
      icon: Beaker,
      description: "Second catalyst bed after interstage cooling. Simulate continued SO2 conversion with optimized inlet temperature for improved equilibrium.",
      path: "/unit-operation/converter-pass-2" 
    },
    { 
      id: 3, 
      title: "Converter Pass 3", 
      icon: TestTube,
      description: "Third catalyst bed simulation. Model the approach to high overall conversion before intermediate absorption in double-contact processes.",
      path: "/unit-operation/converter-pass-3" 
    },
    { 
      id: 4, 
      title: "Converter Pass 4", 
      icon: Atom,
      description: "Final polishing catalyst bed. Simulate the last conversion stage to achieve low-emission performance and meet environmental regulations.",
      path: "/unit-operation/converter-pass-4" 
    },
  ];

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
                  Stand Alone interactive simulation for each converter pass
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
              <CardTitle>Converter Pass Selection</CardTitle>
              <CardDescription>
                Select a converter pass to launch the interactive training simulator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {passes.map((pass) => (
                  <Button
                    key={pass.id}
                    variant="default"
                    className="h-auto py-4 px-5 justify-start text-left"
                    onClick={() => setLocation(pass.path)}
                    data-testid={`button-pass-${pass.id}`}
                  >
                    <pass.icon className="w-6 h-6 mr-4 flex-shrink-0" />
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{pass.title}</span>
                      <span className="text-xs opacity-80 font-normal whitespace-normal">
                        {pass.description}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/unit-operation-simulator")}
                  data-testid="button-return-to-list"
                >
                  Return to Unit Operations
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" data-testid="button-python-code-resources">
                      <Code className="w-4 h-4 mr-2" />
                      Python Code Resources
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-[380px]">
                    <DropdownMenuItem 
                      onClick={() => window.open("/attached_assets/pass_solver.py", "_blank")}
                      className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                      data-testid="menu-item-pass-solver"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <Code className="w-4 h-4" />
                        <span data-testid="text-pass-solver-title">pass_solver.py</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-6" data-testid="text-pass-solver-desc">Core solver for single catalytic pass (SO2 → SO3 oxidation)</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => window.open("/attached_assets/converter_pass_gui.py", "_blank")}
                      className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                      data-testid="menu-item-converter-pass-gui"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <Code className="w-4 h-4" />
                        <span data-testid="text-converter-pass-gui-title">converter_pass_gui.py</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-6" data-testid="text-converter-pass-gui-desc">GUI for single catalytic converter pass simulation (Tkinter)</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={() => window.open("/attached_assets/rk-solver-py_1768945806708.py", "_blank")}
                      className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                      data-testid="menu-item-rk-solver"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <Code className="w-4 h-4" />
                        <span data-testid="text-rk-solver-title">rk_solver.py</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-6" data-testid="text-rk-solver-desc">RK4 solver for plug-flow SO2→SO3 adiabatic bed with Ergun pressure drop</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={() => setLocation("/catalyst-parameter-database")}
                      className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                      data-testid="menu-item-catalyst-database"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <Database className="w-4 h-4" />
                        <span data-testid="text-catalyst-database-title">Catalyst Parameter Database</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-6" data-testid="text-catalyst-database-desc">View and configure catalyst properties (MECS, Topsøe, etc.)</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
