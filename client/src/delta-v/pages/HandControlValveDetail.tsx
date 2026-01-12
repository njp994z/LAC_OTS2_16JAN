import { Link, useParams } from 'wouter';
import { cn } from '@/lib/utils';
import { ArrowLeft, Construction } from 'lucide-react';

const handControlValves: Record<string, { name: string; description: string }> = {
  '1540-hcv-4282': {
    name: '1540-HCV-4282',
    description: 'Jug Valve'
  },
  '1540-hcv-4281': {
    name: '1540-HCV-4281',
    description: 'Jug Valve Positioner'
  }
};

const HandControlValveDetail = () => {
  const { valveId } = useParams<{ valveId: string }>();
  const valve = handControlValves[valveId || ''] || { name: 'Unknown Valve', description: 'Valve not found' };

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
          to="/settings/controller-outputs/faceplates/valve/hand-control"
          className={cn(
            "inline-flex items-center gap-2 mb-6 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-card/50 active:scale-95"
          )}
        >
          <ArrowLeft size={18} />
          Back to Hand Control Valves
        </Link>

        <header className="mb-10 text-center">
          <h1 className={cn(
            "text-3xl font-bold mb-3 tracking-tight",
            "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent"
          )}>
            {valve.name}
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            {valve.description}
          </p>
        </header>

        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Construction size={48} className="text-primary" />
          </div>
          <p className="text-muted-foreground text-lg">Coming Soon...</p>
          <p className="text-muted-foreground/70 text-sm text-center max-w-md">
            The faceplate for this hand control valve is currently under development.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HandControlValveDetail;
