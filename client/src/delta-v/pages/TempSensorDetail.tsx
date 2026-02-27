import { Link, useParams } from 'wouter';
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
  { tag: '1540-TI-4825', description: 'Pass 1 Catalyst In A' },
  { tag: '1540-TI-4827', description: 'Pass 1 Catalyst Out A' },
  { tag: '1540-TI-4826', description: 'Pass 1 Catalyst Temp. Top B' },
  { tag: '1540-TI-4828', description: 'Pass 1 Catalyst Temp. Bottom B' },
  { tag: '1540-TI-7821', description: 'SH 1B Inlet Temp' },
  { tag: '1540-TI-7823', description: 'SH 1B Outlet Temp.' },
  { tag: '1540-TI-4840', description: 'Pass 2 Catalyst In' },
  { tag: '1540-TI-4841', description: 'Pass 2 Catalyst Out' },
  { tag: '1540-TI-4842', description: 'Pass 3 Catalyst In' },
  { tag: '1540-TI-4843', description: 'Pass 3 Catalyst Out' },
  { tag: '1540-TI-5231', description: 'Pass 3 Duct Outlet Temp.' },
  { tag: '1540-TI-4844', description: 'Pass 4 Catalyst In' },
  { tag: '1540-TI-4845', description: 'Pass 4 Catalyst Out' },
  { tag: '1540-TI-7225', description: 'Pass 4 Outlet Temp.' },
];

const TempSensorDetail = () => {
  const { sensorId } = useParams<{ sensorId: string }>();
  
  const sensor = temperatureSensors.find(s => s.tag === sensorId);
  const displayTag = sensor?.tag || sensorId;
  const displayDescription = sensor?.description || 'Temperature Sensor';

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
          href="/settings/controller-outputs/faceplates/temperature-sensors"
          className={cn(
            "inline-flex items-center gap-2 mb-6 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-card/50 active:scale-95"
          )}
          data-testid="link-back-to-temp-sensors"
        >
          <ArrowLeft size={18} />
          Back to Temperature Sensors
        </Link>

        <header className="mb-10 text-center">
          <h1 className={cn(
            "text-3xl font-bold mb-3 tracking-tight",
            "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent"
          )}>
            {displayTag}
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            {displayDescription}
          </p>
        </header>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground text-lg mb-2">Coming Soon</p>
            <p className="text-muted-foreground/60 text-sm">
              Temperature sensor faceplate for {displayTag} is under development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TempSensorDetail;
