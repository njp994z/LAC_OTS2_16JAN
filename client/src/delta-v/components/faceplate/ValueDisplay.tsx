import { cn } from '@/lib/utils';

interface ValueDisplayProps {
  label: string;
  value: number;
  units?: string;
  precision?: number;
  labelColor?: string;
  variant?: 'default' | 'pv' | 'sp' | 'out';
}

export const ValueDisplay = ({ 
  label, 
  value, 
  units = '', 
  precision = 1,
  labelColor = 'text-status-ok',
  variant = 'default'
}: ValueDisplayProps) => {
  const displayValue = isNaN(value) ? '####' : value.toFixed(precision);
  
  const variantStyles = {
    default: "bg-faceplate-shadow/50 border border-border/30 text-foreground",
    pv: "bg-amber-400 border border-amber-500 text-black",
    sp: "bg-white border border-gray-300 text-black",
    out: "bg-cyan-400 border border-cyan-500 text-black"
  };
  
  return (
    <div className="flex items-center gap-1 group">
      {label && (
        <span className={cn(
          "font-semibold text-xs w-6 tracking-wide",
          labelColor
        )}>
          {label}:
        </span>
      )}
      <div className={cn(
        "value-display min-w-[50px] text-right px-1.5 py-0 rounded font-mono font-bold text-sm",
        variantStyles[variant],
        isNaN(value) && "text-status-alarm animate-pulse"
      )}>
        {displayValue}
        {units && (
          <span className="text-[10px] ml-0.5">{units}</span>
        )}
      </div>
    </div>
  );
};
