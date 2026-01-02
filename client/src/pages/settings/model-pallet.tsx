import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Palette, Plus } from 'lucide-react';

export default function ModelPallet() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/simulation-settings')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Palette className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Model Pallet</h1>
                <p className="text-xs text-muted-foreground">Build custom DCS GUI pages</p>
              </div>
            </div>
          </div>
          <Button
            variant="default"
            onClick={() => {}}
            data-testid="button-new-page"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Page
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>DCS GUI Page Builder</CardTitle>
              <CardDescription>
                Create and customize Distributed Control System GUI pages with pre-configured controls, faceplates, and display elements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Palette className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  The Model Pallet GUI builder will allow you to design custom DCS operator interface pages with drag-and-drop controls, 
                  process visualization elements, alarm displays, and real-time data trends.
                </p>
                <Button variant="outline" disabled>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Model Pallet | DCS GUI Builder</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
