import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Construction } from "lucide-react";

export default function DifferentialEquationsEngineering() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/unit-operation/catalytic-reactor")}
              data-testid="button-back-catalytic-reactor"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">Differential Equations and Catalytic Reactor Engineering</h1>
              <p className="text-xs text-muted-foreground">Catalytic Reactor Simulation</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto flex items-center justify-center">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Construction className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Coming Soon</CardTitle>
            <CardDescription className="text-base mt-2">
              Mathematical foundations of catalytic reactor modeling, including the governing differential equations, reaction kinetics, and numerical solution methods (RK4 solver).
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              This feature is currently under development. Check back soon for updates.
            </p>
            <Button
              onClick={() => setLocation("/unit-operation/catalytic-reactor")}
              data-testid="button-return-catalytic-reactor"
            >
              Return to Catalytic Reactor
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Differential Equations and Catalytic Reactor Engineering | Coming Soon</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
