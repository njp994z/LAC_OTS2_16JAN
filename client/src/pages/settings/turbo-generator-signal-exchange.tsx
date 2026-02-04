import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap, Activity, Signal, AlertTriangle } from "lucide-react";

export default function TurboGeneratorSignalExchange() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/simulation-settings")}
              data-testid="button-back-settings"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">Turbo-Generator Signal Exchange</h1>
              <p className="text-xs text-muted-foreground">Simulation Settings</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto flex items-center justify-center">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Zap className="w-10 h-10 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl">Coming Soon</CardTitle>
            <CardDescription className="text-base mt-2">
              Turbo-Generator Signal Exchange Interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground text-center">
              This feature will provide a comprehensive interface for configuring and monitoring the signal exchange between the acid plant control system and the turbo-generator power recovery unit.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-4 text-center">
                  <Signal className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium text-sm">Digital I/O Signals</h3>
                  <p className="text-xs text-muted-foreground mt-1">Trip, Start, Stop, and Status signals</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="pt-4 text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium text-sm">Analog Signals</h3>
                  <p className="text-xs text-muted-foreground mt-1">Load setpoint, speed, and power output</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="pt-4 text-center">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium text-sm">Interlock Logic</h3>
                  <p className="text-xs text-muted-foreground mt-1">Safety interlocks and trip conditions</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center pt-4">
              <Button
                onClick={() => setLocation("/simulation-settings")}
                data-testid="button-return-settings"
              >
                Return to Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Turbo-Generator Signal Exchange | Coming Soon</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
