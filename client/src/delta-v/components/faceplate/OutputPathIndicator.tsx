import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface OutputPathIndicatorProps {
  active: boolean;
}

export const OutputPathIndicator = ({ active }: OutputPathIndicatorProps) => {
  return (
    <div 
      className={cn(
        "w-5 h-5 flex items-center justify-center transition-all duration-300"
      )}
      title={active ? "Output Path Active" : "Output Path Inactive"}
    >
      <div 
        className={cn(
          "w-4 h-4 rotate-45 flex items-center justify-center transition-colors duration-300 border",
          active 
            ? "bg-status-info/20 border-status-info" 
            : "bg-secondary/30 border-border/30 opacity-40"
        )}
      >
        <ArrowRight 
          size={10} 
          className={cn(
            "-rotate-45 transition-colors duration-300",
            active ? "text-status-info drop-shadow-sm" : "text-muted-foreground"
          )}
        />
      </div>
    </div>
  );
};
