import { cn } from '@/lib/utils';

interface InterlockIndicatorProps {
  active: boolean;
}

export const InterlockIndicator = ({ active }: InterlockIndicatorProps) => {
  return (
    <div 
      className={cn(
        "indicator-badge w-5 h-5 transition-all duration-300",
        active 
          ? "bg-status-alarm/30 border-status-alarm text-status-alarm animate-pulse" 
          : "bg-status-info/20 border-status-info/40 text-status-info"
      )}
      title={active ? "Interlock Active" : "No Interlock"}
    >
      <span className="text-[8px] font-bold text-white">!</span>
    </div>
  );
};
