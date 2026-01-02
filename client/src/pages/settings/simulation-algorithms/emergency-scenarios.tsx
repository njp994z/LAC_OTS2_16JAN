import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function EmergencyScenarios() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/settings/simulation-algorithms')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Emergency Scenarios Algorithm</h1>
                <p className="text-xs text-muted-foreground">ESD logic and Python code</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Scenarios Algorithm and Python Code</CardTitle>
              <CardDescription>
                Emergency shutdown logic, safety interlock cascades, and abnormal condition handling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  This section will contain the emergency shutdown algorithms, safety interlock 
                  logic, and Python source code for abnormal condition handling including 
                  trip sequences, protective actions, and alarm response procedures.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Emergency Scenarios | ESD Logic</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
