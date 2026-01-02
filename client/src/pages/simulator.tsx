import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import KPIMetrics from "@/components/KPIMetrics";
import ScenarioSelector from "@/components/ScenarioSelector";
import { Activity, Video, LogOut, Users, Settings } from "lucide-react";

export default function Simulator() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  
  // Check for scenario query parameter on page load
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const scenarioParam = params.get("scenario");
    if (scenarioParam) {
      const scenarioId = parseInt(scenarioParam, 10);
      if (!isNaN(scenarioId) && scenarioId >= 1 && scenarioId <= 4) {
        setSelectedScenario(scenarioId);
      }
    }
  }, [searchString]);
  
  const handleSelectScenario = (id: number) => {
    setSelectedScenario(id);
    if (id === 1) {
      setLocation("/static-simulation");
    }
  };
  
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Activity className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-semibold text-foreground">Operator Training Simulator</h1>
              <p className="text-xs text-muted-foreground">Interactive Demo Environment</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setLocation("/simulation-settings")}
              data-testid="button-simulation-settings"
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Simulation Settings
            </Button>
            
            <Button 
              onClick={() => setLocation("/ots-instructions-videos")}
              data-testid="button-ots-instructions-videos"
              className="gap-2"
            >
              <Video className="w-4 h-4" />
              OTS Instructions & Videos
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation("/admin/users")}
              data-testid="button-admin-users"
              title="User Management"
            >
              <Users className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Training Scenarios</CardTitle>
              <CardDescription>
                Select a scenario to practice operator responses to various plant conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScenarioSelector onSelectScenario={handleSelectScenario} selectedScenario={selectedScenario} />
            </CardContent>
          </Card>
          
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Training Run History
            </h2>
            <KPIMetrics />
          </div>
          
          {selectedScenario && (
            <div className="p-4 bg-muted/50 border border-border rounded-md">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Active Scenario:</span> Scenario {selectedScenario} loaded
              </p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Process Simulator | Demo Mode</span>
          <span>Engineer: N. Porter | {new Date().toLocaleDateString()}</span>
        </div>
      </footer>
    </div>
  );
}
