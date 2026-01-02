import { Link, useParams } from 'wouter';
import { cn } from '@/lib/utils';
import { ArrowLeft, Construction, ChevronRight } from 'lucide-react';

const valveTypes: Record<string, { name: string; description: string }> = {
  'flow-control': {
    name: 'Flow Control Valves',
    description: 'Flow control valve faceplate components'
  },
  'temperature-control': {
    name: 'Temperature Control Valves',
    description: 'Temperature control valve faceplate components'
  },
  'hand-control': {
    name: 'Hand Control Valves',
    description: 'Hand control valve faceplate components'
  }
};

const flowControlValves = [
  { id: '1540-fcv-2602', name: '1540-FCV-2602 - Sulfur Feed Valve' },
  { id: '1520-fcv-5870', name: '1520-FCV-5870 - DT FCV' },
  { id: '1520-fcv-6770', name: '1520-FCV-6770 - IPAT FCV' },
  { id: '1520-fcv-6670', name: '1520-FCV-6670 - FAT FCV' }
];

const tempControlValves = [
  { id: '1520-tcv-5823', name: '1520-TCV-5823 - DT SA Inlet Temperature Control Valve' },
  { id: '1520-tcv-6722', name: '1520-TCV-6722 - IPAT SA Inlet Temperature Control Valve' },
  { id: '1520-tcv-6622', name: '1520-TCV-6622 - FAT SA Inlet Temperature Control Valve' },
  { id: '1540-tcv-4828', name: '1540-TCV-4828 - Pass 2 Inlet Temperature Control Valve' },
  { id: '1540-tcv-5220', name: '1540-TCV-5220 - Pass 3 Inlet Temperature Control Valve' },
  { id: '1540-tcv-5224', name: '1540-TCV-5224 - Pass 4 Inlet Temperature Control Valve' },
  { id: '1540-tcv-7221', name: '1540-TCV-7221 - Econ 4A Outlet Temperature Control Valve' },
  { id: '1540-tcv-7224', name: '1540-TCV-7224 - Econ 3B Outlet Temperature Control Valve' }
];

const handControlValves = [
  { id: '1540-hcv-4282', name: '1540-HCV-4282 - Jug Valve' },
  { id: '1540-hcv-4281', name: '1540-HCV-4281 - Jug Valve Positioner' }
];

const ValveTypeDetail = () => {
  const { valveType } = useParams<{ valveType: string }>();
  const valve = valveTypes[valveType || ''] || { name: 'Unknown Valve Type', description: 'Valve type not found' };

  const isFlowControl = valveType === 'flow-control';
  const isTempControl = valveType === 'temperature-control';
  const isHandControl = valveType === 'hand-control';

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
          to="/settings/controller-outputs/faceplates/valve-blocks"
          className={cn(
            "inline-flex items-center gap-2 mb-6 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-card/50 active:scale-95"
          )}
        >
          <ArrowLeft size={18} />
          Back to Valve Faceplates
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

        {isFlowControl ? (
          <div className="grid gap-4">
            {flowControlValves.map((fcv) => (
              <Link
                key={fcv.id}
                to={`/valve/flow-control/${fcv.id}`}
                className={cn(
                  "group flex items-center justify-between p-4 rounded-lg transition-all duration-200",
                  "bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40",
                  "active:scale-[0.99]"
                )}
              >
                <span className="text-primary font-medium">{fcv.name}</span>
                <ChevronRight size={20} className="text-primary/60 group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        ) : isTempControl ? (
          <div className="grid gap-4">
            {tempControlValves.map((tcv) => (
              <Link
                key={tcv.id}
                to={`/valve/temperature-control/${tcv.id}`}
                className={cn(
                  "group flex items-center justify-between p-4 rounded-lg transition-all duration-200",
                  "bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40",
                  "active:scale-[0.99]"
                )}
              >
                <span className="text-primary font-medium">{tcv.name}</span>
                <ChevronRight size={20} className="text-primary/60 group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        ) : isHandControl ? (
          <div className="grid gap-4">
            {handControlValves.map((hcv) => (
              <Link
                key={hcv.id}
                to={hcv.id === '1540-hcv-4282' ? '/jug-valve' : hcv.id === '1540-hcv-4281' ? '/jug-valve-positioner' : `/valve/hand-control/${hcv.id}`}
                className={cn(
                  "group flex items-center justify-between p-4 rounded-lg transition-all duration-200",
                  "bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40",
                  "active:scale-[0.99]"
                )}
              >
                <span className="text-primary font-medium">{hcv.name}</span>
                <ChevronRight size={20} className="text-primary/60 group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Construction size={48} className="text-primary" />
            </div>
            <p className="text-muted-foreground text-lg">Coming Soon...</p>
            <p className="text-muted-foreground/70 text-sm text-center max-w-md">
              This valve type faceplate is currently under development.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValveTypeDetail;
