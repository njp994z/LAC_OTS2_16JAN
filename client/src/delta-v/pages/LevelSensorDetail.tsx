import { Link, useParams } from 'wouter';
import { cn } from '@/lib/utils';
import { ArrowLeft, Waves } from 'lucide-react';

const levelSensors: Record<string, string> = {
  '1520-LI-6652': 'FAT Level Indicator',
  '1520-LI-8461': 'IPAT Level Indicator',
  '1520-LI-5871': 'DT Acid Level Indicator',
};

const LevelSensorDetail = () => {
  const { sensorId } = useParams<{ sensorId: string }>();
  const description = sensorId ? levelSensors[sensorId] : 'Unknown Sensor';

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-4xl mx-auto">
        <Link
          to="/settings/controller-outputs/faceplates/level-sensors"
          className={cn(
            "inline-flex items-center gap-2 mb-6 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-card/50 active:scale-95"
          )}
        >
          <ArrowLeft size={18} />
          Back to Level Sensors
        </Link>

        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Waves className="text-primary" size={32} />
            <h1 className={cn(
              "text-3xl font-bold tracking-tight",
              "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent"
            )}>
              {sensorId}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">
            {description}
          </p>
        </header>

        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className={cn(
            "px-8 py-4 rounded-xl",
            "bg-card/50 border border-border/50",
            "backdrop-blur-sm"
          )}>
            <p className="text-muted-foreground text-lg">
              Level sensor faceplate coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelSensorDetail;
