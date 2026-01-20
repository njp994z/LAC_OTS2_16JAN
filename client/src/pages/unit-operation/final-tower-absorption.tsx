import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Factory, BookOpen, Settings } from "lucide-react";

export default function FinalTowerAbsorption() {
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
              <Factory className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground" data-testid="text-page-title">Final Tower Absorption (FAT)</h1>
              <p className="text-muted-foreground mt-1" data-testid="text-page-description">
                Capture remaining SO₃ to achieve final product specifications and emission limits
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
                  The Final Tower Absorption (FAT) is the last absorption step in the sulfuric acid process. 
                  It captures the remaining SO₃ from the gas stream after the final converter pass, 
                  ensuring product acid meets specifications and stack emissions comply with environmental 
                  regulations.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Key Functions</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Final SO₃ absorption to minimize emissions</li>
                      <li>Produce specification-grade product acid</li>
                      <li>Maintain stack SO₂ below permit limits</li>
                      <li>Control acid mist formation</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Operating Parameters</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Inlet gas temperature: 160-180°C</li>
                      <li>Stack SO₂: {"<"} 250 ppmv</li>
                      <li>Product acid: 98.0-98.5% H₂SO₄</li>
                      <li>Overall plant conversion: {">"}99.7%</li>
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
                  Configure FAT parameters and run simulations
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
