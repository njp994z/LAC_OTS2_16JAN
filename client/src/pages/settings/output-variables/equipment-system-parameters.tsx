import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings2 } from "lucide-react";
import expLogo from "@/assets/exp-logo.png";

export default function EquipmentSystemParameters() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings/output-variables")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
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
              <Settings2 className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-semibold text-foreground">Equipment System Parameters</h1>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed max-w-5xl">
              Configure equipment-specific parameters including design specifications, operating limits, performance curves, and physical dimensions for all major process equipment.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Equipment Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  This section will display equipment-specific parameters including design specifications, 
                  operating limits, performance curves, and physical dimensions for compressors, heat exchangers, 
                  reactors, towers, and other major process equipment in the sulfuric acid plant.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
