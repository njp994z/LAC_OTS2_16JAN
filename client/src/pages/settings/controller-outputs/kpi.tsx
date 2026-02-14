import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, BarChart3, Clock } from 'lucide-react';

export default function KPIPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="page-kpi">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/settings/controller-outputs/faceplates')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground" data-testid="text-page-title">Key Performance Indicators</h1>
                <p className="text-xs text-muted-foreground" data-testid="text-page-subtitle">Plant performance metrics</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 px-16">
              <Clock className="w-12 h-12 text-muted-foreground" data-testid="icon-coming-soon" />
              <h2 className="text-xl font-semibold text-foreground" data-testid="text-coming-soon-title">Coming Soon</h2>
              <p className="text-sm text-muted-foreground text-center max-w-md" data-testid="text-coming-soon-description">
                Key Performance Indicators dashboard is under development. This screen will provide real-time tracking of conversion efficiency, production rates, energy consumption, and environmental compliance metrics.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span data-testid="text-footer-left">Key Performance Indicators | Coming Soon</span>
          <span data-testid="text-footer-right">Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
