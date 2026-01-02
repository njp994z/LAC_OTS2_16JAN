import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { ArrowLeft, Waves } from 'lucide-react';

const levelSensors = [
  { tag: '1520-LI-6652', description: 'FAT Level Indicator' },
  { tag: '1520-LI-8461', description: 'IPAT Level Indicator' },
  { tag: '1520-LI-5871', description: 'DT Acid Level Indicator' },
];

const LevelSensorsPage = () => {
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
          to="/settings/controller-outputs/faceplates/sensor-blocks"
          className={cn(
            "inline-flex items-center gap-2 mb-6 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-card/50 active:scale-95"
          )}
        >
          <ArrowLeft size={18} />
          Back to Sensor Faceplates
        </Link>

        <header className="mb-10 text-center">
          <h1 className={cn(
            "text-3xl font-bold mb-3 tracking-tight",
            "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent"
          )}>
            Level Sensors
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            Level Sensor HMI Components
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {levelSensors.map((sensor) => (
            <Link
              key={sensor.tag}
              to={`/level-sensor/${sensor.tag}`}
              className={cn(
                "group relative p-4 rounded-xl transition-all duration-300",
                "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
                "border border-blue-500/30 hover:border-blue-400/50",
                "hover:shadow-lg hover:shadow-blue-500/20",
                "hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  "bg-blue-500/20 group-hover:bg-blue-500/30",
                  "transition-colors duration-300"
                )}>
                  <Waves className="text-blue-400" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-mono text-sm font-semibold text-blue-300 mb-1">
                    {sensor.tag}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {sensor.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LevelSensorsPage;
