import { Link, useParams } from 'wouter';
import { cn } from '@/lib/utils';
import { ArrowLeft, Gauge } from 'lucide-react';

const pressureSensors: Record<string, string> = {
  '1540-PI-2600': 'Sulfur Pump Discharge',
  '1540-PI-2604': 'Sulfur Nozzle Inlet',
  '1520-PI-5801': 'Air Filter Out',
  '1520-PI-5804': 'DT Gas Pres. Out',
  '1540-PI-4850': 'Pass 1 Inlet Duct',
  '1540-DPI-4200': 'Sulfur Furnace dP',
  '1520-DPI-5800B': 'Inlet Filter dP Sensor',
  '1520-DPI-4851': 'Pass 1; dP Sensor',
};

const PressureSensorDetail = () => {
  const { sensorId } = useParams<{ sensorId: string }>();
  const description = sensorId ? pressureSensors[sensorId] : 'Unknown Sensor';

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
          to="/settings/controller-outputs/faceplates/pressure-sensors"
          className={cn(
            "inline-flex items-center gap-2 mb-6 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-card/50 active:scale-95"
          )}
        >
          <ArrowLeft size={18} />
          Back to Pressure Sensors
        </Link>

        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Gauge className="text-primary" size={32} />
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
              Pressure sensor faceplate coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PressureSensorDetail;
