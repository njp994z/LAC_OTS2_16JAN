import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LockIndicatorProps {
  locked: boolean;
}

export const LockIndicator = ({ locked }: LockIndicatorProps) => {
  return (
    <div 
      className={cn(
        "w-5 h-5 rounded flex items-center justify-center transition-all duration-300",
        locked 
          ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/30" 
          : "bg-secondary/50 opacity-40"
      )}
      title={locked ? "Device Locked" : "Device Unlocked"}
    >
      {locked ? (
        <Lock size={11} className="text-amber-950 drop-shadow-sm" />
      ) : (
        <Unlock size={11} className="text-muted-foreground" />
      )}
    </div>
  );
};
