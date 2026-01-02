import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LayoutGrid, Gauge, Radio, GitBranch, Bell, Monitor, Fan } from 'lucide-react';

interface FaceplateCategory {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const faceplateCategories: FaceplateCategory[] = [
  {
    id: 'home-screen',
    title: 'Home Screen',
    description: 'Main operator interface overview displaying plant-wide status, key process variables, and navigation to all process areas. Provides at-a-glance monitoring of critical parameters.',
    path: '/settings/controller-outputs/faceplates/home-screen',
    icon: Monitor,
  },
  {
    id: 'rotating-equipment',
    title: 'Rotating Equipment',
    description: 'Faceplates for pumps, compressors, blowers, and motors. Monitor running status, speed, vibration, bearing temperatures, and control start/stop operations with interlock displays.',
    path: '/settings/controller-outputs/faceplates/rotating-equipment',
    icon: Fan,
  },
  {
    id: 'controller-blocks',
    title: 'Controller Instrument Blocks',
    description: 'PID controllers, ratio controllers, and cascade control faceplates for process regulation. Includes setpoint adjustment, mode selection, and output tuning interfaces.',
    path: '/settings/controller-outputs/faceplates/controller-blocks',
    icon: Gauge,
  },
  {
    id: 'sensor-blocks',
    title: 'Sensor Instrument Blocks',
    description: 'Temperature, pressure, flow, and level transmitter faceplates. View real-time measurements, signal quality, and diagnostic information for field instruments.',
    path: '/settings/controller-outputs/faceplates/sensor-blocks',
    icon: Radio,
  },
  {
    id: 'valve-blocks',
    title: 'Valve Instrument Blocks',
    description: 'Control valve and on/off valve faceplates with position feedback, actuator status, and manual override capabilities for final control elements.',
    path: '/settings/controller-outputs/faceplates/valve-blocks',
    icon: GitBranch,
  },
  {
    id: 'alarm-blocks',
    title: 'Alarm Instrument Blocks',
    description: 'Process alarm faceplates for high/low limits, deviation alarms, and rate-of-change alerts. Configure alarm priorities, deadbands, and acknowledgment settings.',
    path: '/settings/controller-outputs/faceplates/alarm-blocks',
    icon: Bell,
  },
];

export default function FaceplatesPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/settings/controller-outputs')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">UI and Instrument Faceplates</h1>
                <p className="text-xs text-muted-foreground">Instrument block categories</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Instrument Block Faceplates</CardTitle>
              <CardDescription>
                Select a category to view and interact with DeltaV instrument block faceplates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {faceplateCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant="default"
                    className="h-auto py-4 px-5 justify-start text-left"
                    onClick={() => setLocation(category.path)}
                    data-testid={`button-${category.id}`}
                  >
                    <category.icon className="w-5 h-5 mr-4 flex-shrink-0" />
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{category.title}</span>
                      <span className="text-xs opacity-80 font-normal whitespace-normal">
                        {category.description}
                      </span>
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
          <span>UI and Instrument Faceplates | Instrument Blocks</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
