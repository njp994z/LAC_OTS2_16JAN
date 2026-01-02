import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, PipetteIcon, Construction } from "lucide-react";

export default function AcidHydraulics() {
  const [, setLocation] = useLocation();

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
              <PipetteIcon className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Acid Hydraulics</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Acid circulation system hydraulics simulation
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
              <CardTitle className="flex items-center gap-2">
                <Construction className="h-5 w-5 text-yellow-500" />
                Coming Soon
              </CardTitle>
              <CardDescription>
                The Acid Hydraulics simulation module is under development
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 border border-dashed">
                <h3 className="font-semibold text-lg mb-4">Planned Features</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Pump performance curves with head-flow characteristics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Pipe friction and pressure drop calculations (Darcy-Weisbach)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Acid distributor flow distribution modeling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Tower circulation rate optimization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>NPSH calculations for pump cavitation prevention</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>System curve vs pump curve intersection analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Acid density and viscosity correlations for H₂SO₄ concentration</span>
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="default"
                  className="h-auto py-4 px-5 justify-start text-left"
                  onClick={() => setLocation("/unit-operation/acid-hydraulics/absorbing-tower-circuit")}
                  data-testid="button-absorbing-tower-circuit"
                >
                  <PipetteIcon className="w-6 h-6 mr-4 flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">Absorbing Tower Circuit</span>
                    <span className="text-xs opacity-80 font-normal whitespace-normal">
                      Model the intermediate absorbing tower (IAT) and final absorbing tower (FAT) 
                      acid circulation systems with concentration control.
                    </span>
                  </div>
                </Button>
                <Button
                  variant="default"
                  className="h-auto py-4 px-5 justify-start text-left"
                  onClick={() => setLocation("/unit-operation/acid-hydraulics/drying-tower-circuit")}
                  data-testid="button-drying-tower-circuit"
                >
                  <PipetteIcon className="w-6 h-6 mr-4 flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">Drying Tower Circuit</span>
                    <span className="text-xs opacity-80 font-normal whitespace-normal">
                      Simulate the drying tower acid loop with moisture removal efficiency 
                      and acid strength maintenance.
                    </span>
                  </div>
                </Button>
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
