import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { ArrowLeft, ChevronRight } from 'lucide-react';

const valveTypes = [
  { id: 'flow-control', name: 'Flow Control Valves' },
  { id: 'temperature-control', name: 'Temperature Control Valves' },
  { id: 'hand-control', name: 'Hand Control Valves' }
];

const ValveFaceplatePage = () => {
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
          href="/settings/controller-outputs/faceplates/home-screen"
          className={cn(
            "inline-flex items-center gap-2 mb-6 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-card/50 active:scale-95"
          )}
        >
          <ArrowLeft size={18} />
          Back
        </Link>

        <header className="mb-10 text-center">
          <h1 className={cn(
            "text-3xl font-bold mb-3 tracking-tight",
            "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent"
          )}>
            Delta V Valve Faceplates
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            Valve HMI Interface Components
          </p>
        </header>

        <div className="flex flex-col items-center gap-4">
          {valveTypes.map((valve) => (
            <Link
              key={valve.id}
              href={`/settings/controller-outputs/faceplates/valve-blocks/${valve.id}`}
              className={cn(
                "w-full max-w-md px-6 py-4 rounded-xl font-semibold text-center transition-all duration-200",
                "bg-[#1e40af] hover:bg-[#1d4ed8] text-white",
                "border-2 border-[#3b82f6]",
                "shadow-lg hover:shadow-xl hover:scale-[1.02]",
                "flex items-center justify-center gap-2"
              )}
            >
              {valve.name}
              <ChevronRight size={20} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ValveFaceplatePage;
