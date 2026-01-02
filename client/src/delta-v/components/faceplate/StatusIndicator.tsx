import { cn } from '@/lib/utils';
import type { PVStatus, OutputStatus } from '@/delta-v/types/controller';
import { CheckCircle2, AlertCircle, XCircle, HelpCircle } from 'lucide-react';

interface StatusIndicatorProps {
  status: PVStatus | OutputStatus;
  label: string;
  lightBackground?: boolean;
}

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  OK: { color: 'text-status-ok', icon: CheckCircle2 },
  BAD: { color: 'text-status-alarm', icon: XCircle },
  UNC: { color: 'text-status-warning', icon: AlertCircle },
  NAN: { color: 'text-status-alarm', icon: XCircle },
  LIMITED: { color: 'text-status-warning', icon: AlertCircle },
  TRACKING: { color: 'text-status-info', icon: HelpCircle },
};

export const StatusIndicator = ({ status, label, lightBackground = false }: StatusIndicatorProps) => {
  const config = statusConfig[status] || statusConfig.OK;
  const Icon = config.icon;
  
  return (
    <div className={cn(
      "flex items-center gap-1 px-1.5 py-0.5 rounded-md",
      lightBackground 
        ? "bg-white border border-slate-300" 
        : "bg-faceplate-shadow/30 border border-border/20"
    )}>
      <Icon size={10} className={cn(config.color, "drop-shadow-sm")} />
      <span className={cn(
        "text-[9px] font-medium tracking-wide",
        config.color
      )}>
        {label} {status}
      </span>
    </div>
  );
};
