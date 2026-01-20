import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Layers } from "lucide-react";

export default function ConverterSimulations() {
  const [, setLocation] = useLocation();

  const passes = [
    { id: 1, title: "Converter Pass 1", path: "/unit-operation/converter-pass-1" },
    { id: 2, title: "Converter Pass 2", path: "/unit-operation/converter-pass-2" },
    { id: 3, title: "Converter Pass 3", path: "/unit-operation/converter-pass-3" },
    { id: 4, title: "Converter Pass 4", path: "/unit-operation/converter-pass-4" },
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
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Converter Simulation Pass Selection</CardTitle>
              <CardDescription>
                Select a converter pass to launch the interactive training simulator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-8 pb-10">
              <div className="flex flex-col gap-4">
                {passes.map((pass) => (
                  <Button
                    key={pass.id}
                    variant="default"
                    className="h-20 bg-[#1a5f7a] hover:bg-[#154d63] text-white rounded-xl text-xl font-medium flex flex-col items-center justify-center transition-all shadow-md active-elevate-2"
                    onClick={() => setLocation(pass.path)}
                    data-testid={`button-pass-${pass.id}`}
                  >
                    <div className="text-center leading-tight">
                      <div>Converter</div>
                      <div>Pass {pass.id}</div>
                    </div>
                  </Button>
                ))}
              </div>

              <div className="flex justify-center pt-6">
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
