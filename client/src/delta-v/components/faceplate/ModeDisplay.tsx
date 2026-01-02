import { cn } from '@/lib/utils';
import type { ControllerMode } from '@/delta-v/types/controller';

interface ModeDisplayProps {
  mode: ControllerMode;
}

const modeConfig: Record<ControllerMode, { gradient: string; shadow: string }> = {
  AUTO: { 
    gradient: 'from-emerald-400 to-emerald-600', 
    shadow: 'shadow-emerald-500/40' 
  },
  MAN: { 
    gradient: 'from-cyan-400 to-cyan-600', 
    shadow: 'shadow-cyan-500/40' 
  },
  CAS: { 
    gradient: 'from-blue-400 to-blue-600', 
    shadow: 'shadow-blue-500/40' 
  },
  LO: { 
    gradient: 'from-red-400 to-red-600', 
    shadow: 'shadow-red-500/40' 
  },
  RCAS: { 
    gradient: 'from-violet-400 to-violet-600', 
    shadow: 'shadow-violet-500/40' 
  },
  ROUT: { 
    gradient: 'from-cyan-400 to-cyan-600', 
    shadow: 'shadow-cyan-500/40' 
  },
  BYPASS: { 
    gradient: 'from-purple-500 to-purple-700', 
    shadow: 'shadow-purple-500/40' 
  },
};

export const ModeDisplay = ({ mode }: ModeDisplayProps) => {
  const config = modeConfig[mode];
  
  return (
    <div 
      className={cn(
        "mode-badge bg-gradient-to-br text-white shadow-lg",
        config.gradient,
        config.shadow
      )}
      title={`Mode: ${mode}`}
    >
      {mode}
    </div>
  );
};
