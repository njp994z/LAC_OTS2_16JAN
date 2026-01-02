import { cn } from '@/lib/utils';

interface OutBarDisplayProps {
  label?: string;
  value: number;
  units?: string;
  precision?: number;
  labelColor?: string;
}

export const OutBarDisplay = ({ 
  label = "OUT", 
  value, 
  units = '%', 
  precision = 1,
  labelColor = 'text-cyan-400'
}: OutBarDisplayProps) => {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value));
  
  return (
    <div className="flex items-center gap-1">
      {/* Label */}
      <span className={cn(
        "font-mono text-xs font-semibold w-6",
        labelColor
      )}>
        {label}
      </span>
      
      {/* Bar container */}
      <div className="relative flex-1 h-4 min-w-[50px] bg-black/60 rounded border border-faceplate-border/30 overflow-hidden">
        {/* Bar fill */}
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300 ease-out"
          style={{ width: `${clampedValue}%` }}
        />
        
        {/* Tick marks at 25%, 50%, 75% */}
        <div className="absolute top-0 bottom-0 left-[25%] w-px bg-white/40" />
        <div className="absolute top-0 bottom-0 left-[50%] w-px bg-white/40" />
        <div className="absolute top-0 bottom-0 left-[75%] w-px bg-white/40" />
      </div>
    </div>
  );
};
