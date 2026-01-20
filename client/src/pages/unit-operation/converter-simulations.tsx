import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Layers, FlaskConical, Beaker, TestTube, Atom } from "lucide-react";

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
