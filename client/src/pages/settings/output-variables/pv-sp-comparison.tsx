import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, GitCompare } from "lucide-react";

export default function PVSPComparison() {
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
              <GitCompare className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-semibold text-foreground">PV vs. SP Comparison with Error Values</h1>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed max-w-5xl">
              Compare process variables against their setpoints with calculated error values.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>PV vs. SP Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <GitCompare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  This section will compare process variables against their setpoints, showing error values, 
                  deviation trends, and controller performance metrics for optimization.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
