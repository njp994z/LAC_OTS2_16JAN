import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { pfdConfigs } from "@/delta-v/config/pfdConfig";

export default function StaticHeatMaterialBalances() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings/output-variables")}
              data-testid="button-back-output-variables"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">Static Heat & Material Balances</h1>
              <p className="text-xs text-muted-foreground">Select a process flow diagram to view heat and material balance data</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Process Flow Diagrams</CardTitle>
              <CardDescription>
                Select a PFD to view steady-state heat and material balance calculations for that process area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {pfdConfigs.map((pfd) => (
                  <Button
                    key={pfd.id}
                    variant="default"
                    size="lg"
                    className="justify-start text-left"
                    onClick={() => setLocation(pfd.route)}
                    data-testid={`button-pfd-${pfd.id}`}
                  >
                    <FileText className="w-5 h-5 mr-4 flex-shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] opacity-70 font-mono">{pfd.documentNumber}</span>
                      <span className="font-semibold text-sm">{pfd.title}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Static Heat & Material Balances | Process Flow Diagrams</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
