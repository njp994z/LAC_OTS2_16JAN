import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Layers, BookOpen, Settings } from "lucide-react";

export default function InterpassAbsorptionTower() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-[9999] border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/unit-operation-simulator")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground" data-testid="text-page-title">Interpass Absorption Tower (IPAT)</h1>
              <p className="text-muted-foreground mt-1" data-testid="text-page-description">
                Absorb SO₃ between converter passes to drive equilibrium conversion
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  The Interpass Absorption Tower (IPAT) is positioned between converter passes to remove 
                  SO₃ from the process gas stream. By removing SO₃, the equilibrium is shifted to favor 
                  additional SO₂ conversion in subsequent catalyst passes, enabling overall conversion 
                  rates above 99.7%.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Key Functions</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Absorb SO₃ in concentrated H₂SO₄</li>
                      <li>Shift equilibrium for higher conversion</li>
                      <li>Cool gas before final converter pass</li>
                      <li>Produce intermediate product acid</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Operating Parameters</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Inlet gas temperature: 160-180°C</li>
                      <li>Outlet gas temperature: 60-80°C</li>
                      <li>Acid strength: 98.5-99.0% H₂SO₄</li>
                      <li>SO₃ absorption efficiency: {">"}99.9%</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Simulation Controls
                </CardTitle>
                <CardDescription>
                  Configure IPAT parameters and run simulations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <p className="text-muted-foreground">Simulation interface coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
