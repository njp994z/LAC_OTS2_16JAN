import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

const sensorCategories = [
  { name: 'Temperature Sensors', path: '/settings/controller-outputs/faceplates/temperature-sensors' },
  { name: 'Pressure Sensors', path: '/settings/controller-outputs/faceplates/pressure-sensors' },
  { name: 'Level Sensors', path: '/settings/controller-outputs/faceplates/level-sensors' },
  { name: 'Position Sensors', path: '/settings/controller-outputs/faceplates/position-sensors' },
];

const SensorFaceplatePage = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/settings/controller-outputs/faceplates"
          className={cn(
            "inline-flex items-center gap-2 mb-6 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-card/50 active:scale-95"
          )}
        >
          <ArrowLeft size={18} />
          Back to Faceplates
        </Link>

        <header className="mb-10 text-center">
          <h1 className={cn(
            "text-3xl font-bold mb-3 tracking-tight",
            "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent"
          )}>
            Delta V Sensor Faceplates
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            Sensor HMI Interface Components
          </p>
        </header>

        <div className="flex flex-col items-center gap-4 py-8">
          {sensorCategories.map((category) => (
            <Link
              key={category.path}
              href={category.path}
              className={cn(
                "w-64 py-3 px-6 text-center font-medium rounded-lg transition-all duration-200",
                "bg-cyan-400 text-white border-2 border-cyan-500",
                "hover:bg-cyan-500 hover:scale-105 active:scale-95",
                "shadow-md hover:shadow-lg"
              )}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SensorFaceplatePage;
