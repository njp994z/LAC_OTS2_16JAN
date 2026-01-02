import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface AlarmIndicatorProps {
  active: boolean;
  type?: 'HI' | 'HIHI' | 'LO' | 'LOLO' | 'DEV';
  color?: 'red' | 'yellow';
}

export const AlarmIndicator = ({ active, type, color = 'red' }: AlarmIndicatorProps) => {
  if (!active) {
    return (
      <div className="w-6 h-6 rounded-full bg-secondary/50 flex items-center justify-center opacity-30">
        <X size={12} className="text-muted-foreground" />
      </div>
    );
  }
  
  const isYellow = color === 'yellow';
  
  return (
    <div 
      className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center shadow-lg",
        isYellow 
          ? "bg-gradient-to-br from-status-warning to-amber-600 animate-glow-pulse-yellow"
          : "bg-gradient-to-br from-status-alarm to-red-700 animate-glow-pulse"
      )}
      title={`Alarm: ${type || 'Active'}`}
    >
      <X size={14} className="text-white drop-shadow-md" strokeWidth={3} />
    </div>
  );
};
