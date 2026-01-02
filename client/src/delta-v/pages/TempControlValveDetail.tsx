import { Link, useParams } from 'wouter';
import { cn } from '@/lib/utils';
import { ArrowLeft, Construction } from 'lucide-react';

const tempControlValves: Record<string, string> = {
  '1520-tcv-5823': '1520-TCV-5823 - DT SA Inlet Temperature Control Valve',
  '1520-tcv-6722': '1520-TCV-6722 - IPAT SA Inlet Temperature Control Valve',
  '1520-tcv-6622': '1520-TCV-6622 - FAT SA Inlet Temperature Control Valve',
  '1540-tcv-4828': '1540-TCV-4828 - Pass 2 Inlet Temperature Control Valve',
  '1540-tcv-5220': '1540-TCV-5220 - Pass 3 Inlet Temperature Control Valve',
  '1540-tcv-5224': '1540-TCV-5224 - Pass 4 Inlet Temperature Control Valve',
  '1540-tcv-7221': '1540-TCV-7221 - Econ 4A Outlet Temperature Control Valve',
  '1540-tcv-7224': '1540-TCV-7224 - Econ 3B Outlet Temperature Control Valve'
};

const TempControlValveDetail = () => {
  const { valveId } = useParams<{ valveId: string }>();
  const valveName = tempControlValves[valveId || ''] || 'Unknown Valve';

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
          to="/settings/controller-outputs/faceplates/valve/temperature-control"
          className={cn(
            "inline-flex items-center gap-2 mb-6 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-card/50 active:scale-95"
          )}
        >
          <ArrowLeft size={18} />
          Back to Temperature Control Valves
        </Link>

        <header className="mb-10 text-center">
          <h1 className={cn(
            "text-3xl font-bold mb-3 tracking-tight",
            "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent"
          )}>
            {valveName}
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            Temperature Control Valve Faceplate
          </p>
        </header>

        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Construction size={48} className="text-primary" />
          </div>
          <p className="text-muted-foreground text-lg">Coming Soon...</p>
          <p className="text-muted-foreground/70 text-sm text-center max-w-md">
            This temperature control valve faceplate is currently under development.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TempControlValveDetail;
