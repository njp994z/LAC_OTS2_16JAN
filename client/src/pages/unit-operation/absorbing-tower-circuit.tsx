import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, PipetteIcon, Construction } from "lucide-react";

export default function AbsorbingTowerCircuit() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/unit-operation/acid-hydraulics")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <PipetteIcon className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Absorbing Tower Circuit</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  IAT and FAT acid circulation system simulation
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
                Model the intermediate absorbing tower (IAT) and final absorbing tower (FAT) 
                acid circulation systems with concentration control.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 border border-dashed">
                <h3 className="font-semibold text-lg mb-4">Planned Features</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>IAT pump performance curves and operating point analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>FAT circulation rate optimization for SO₃ absorption efficiency</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Acid concentration control (98.5% H₂SO₄ target)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Distributor flow uniformity modeling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Cross-flow between IAT and FAT circuits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Acid cooler integration and temperature control</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Product acid withdrawal and storage tank level management</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/unit-operation/acid-hydraulics")}
                  data-testid="button-return-to-acid-hydraulics"
                >
                  Return to Acid Hydraulics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
