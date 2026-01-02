import { cn } from '@/lib/utils';

interface ModeIndicatorProps {
  holdActive: boolean;
}

export const ModeIndicator = ({ holdActive }: ModeIndicatorProps) => {
  return (
    <div 
      className={cn(
        "indicator-badge w-5 h-5 text-[10px] transition-all duration-300",
        holdActive 
          ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-orange-500/40 shadow-md" 
          : "bg-secondary/50 text-muted-foreground/50"
      )}
      title={holdActive ? "Hold Active" : "Not Holding"}
    >
      H
    </div>
  );
};

interface InterlockDiamondIndicatorProps {
  active: boolean;
}

export const InterlockDiamondIndicator = ({ active }: InterlockDiamondIndicatorProps) => {
  return (
    <div 
      className={cn(
        "w-5 h-5 flex items-center justify-center transition-all duration-300",
        active && "animate-pulse"
      )}
      title={active ? "Interlock Active" : "No Interlock"}
    >
      <div 
        className={cn(
          "w-3.5 h-3.5 rotate-45 flex items-center justify-center transition-colors duration-300 border",
          active 
            ? "bg-status-alarm/30 border-status-alarm" 
            : "bg-secondary/30 border-border/50"
        )}
      >
        <span 
          className={cn(
            "-rotate-45 text-[8px] font-bold",
            active ? "text-status-alarm" : "text-muted-foreground/50"
          )}
        >
          I
        </span>
      </div>
    </div>
  );
};
