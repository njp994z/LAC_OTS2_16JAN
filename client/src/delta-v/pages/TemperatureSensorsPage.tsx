import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

const temperatureSensors = [
  { tag: '1540-TI-4200A', description: 'Furnace Temp Out A' },
  { tag: '1540-TI-4200B', description: 'Furnace Temp Out B' },
  { tag: '1540-TI-4200C', description: 'Furnace Temp Out C' },
  { tag: '1520-TI-6623', description: 'FAT Acid Temp Indicator' },
  { tag: '1520-TI-8464', description: 'IPAT Acid Temp Indicator' },
  { tag: '1520-TI-8421', description: 'IPAT Gas Temp Indicator' },
  { tag: '1520-TI-6624', description: 'FAT Gas Temp Indicator' },
  { tag: '1520-TI-5821', description: 'DT Gas Out' },
  { tag: '1520-TI-5820', description: 'DT Acid Temp Out' },
  { tag: '1540-TI-4820', description: 'Pass 1 Inlet Duct' },
  { tag: '1540-TI-4825', description: 'Pass 1 Catalyst In' },
  { tag: '1540-TI-4827', description: 'Pass 1 Catalyst Out' },
  { tag: '1540-TI-4840', description: 'Pass 2 Catalyst In' },
  { tag: '1540-TI-4841', description: 'Pass 2 Catalyst Out' },
  { tag: '1540-TI-4842', description: 'Pass 3 Catalyst In' },
  { tag: '1540-TI-4843', description: 'Pass 3 Catalyst Out' },
  { tag: '1540-TI-4844', description: 'Pass 4 Catalyst In' },
  { tag: '1540-TI-4845', description: 'Pass 4 Catalyst Out' },
];

const TemperatureSensorsPage = () => {
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
          href="/settings/controller-outputs/faceplates/sensor-blocks"
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
            Temperature Sensors
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            Temperature Sensor HMI Components
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {temperatureSensors.map((sensor) => (
            <Link
              key={sensor.tag}
              href={
                sensor.tag === '1520-TI-5821' 
                  ? '/settings/controller-outputs/faceplates/temp-sensor/1520-TI-5821'
                  : sensor.tag === '1540-TI-4200A'
                  ? '/settings/controller-outputs/faceplates/temp-sensor/1540-TI-4200A'
                  : `/settings/controller-outputs/faceplates/temp-sensor/${sensor.tag}`
              }
              className={cn(
                "group relative flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-300",
                "bg-card/30 backdrop-blur-sm border border-border/50",
                sensor.tag === '1520-TI-5821' || sensor.tag === '1540-TI-4200A'
                  ? "hover:bg-blue-700/20 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-700/20"
                  : "hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10",
                "active:scale-95"
              )}
            >
              <span className={cn(
                "text-lg font-semibold transition-colors",
                sensor.tag === '1520-TI-5821' || sensor.tag === '1540-TI-4200A'
                  ? "text-blue-600 group-hover:text-blue-500"
                  : "text-foreground group-hover:text-cyan-400"
              )}>
                {sensor.tag}
              </span>
              <span className="text-sm text-muted-foreground mt-1 text-center">
                {sensor.description}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemperatureSensorsPage;
