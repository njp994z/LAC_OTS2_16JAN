import { useState } from "react";
import { Info, Check, Settings, Gauge, HelpCircle, AlertTriangle, XCircle, Shield } from "lucide-react";
import { useLocation } from "wouter";

export interface OrchestratorAlarm {
  tag: string;
  message: string;
  priority: "low" | "medium" | "high" | "critical";
  value: number;
  limit: number;
  unit: string;
  timestamp: number;
}

type DisplayPriority = "INTERLOCK" | "WARNING" | "ADVISORY";

function toDisplayPriority(p: OrchestratorAlarm["priority"]): DisplayPriority {
  if (p === "critical") return "INTERLOCK";
  if (p === "high") return "WARNING";
  return "ADVISORY";
}

function toAlarmWord(p: OrchestratorAlarm["priority"]): string {
  if (p === "critical") return "HiHi";
  if (p === "high") return "High";
  if (p === "medium") return "Low";
  return "Info";
}

function formatTimestamp(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = days[d.getDay()];
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${day} ${h}:${m}:${s}`;
}

interface AlarmBannerProps {
  alarms?: OrchestratorAlarm[];
  nodeName?: string;
  nodeStatus?: "online" | "offline" | "warning";
}

const AlarmIcon = ({ priority }: { priority: DisplayPriority }) => {
  if (priority === "INTERLOCK") {
    return (
      <div className="w-6 h-6 rounded flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/30 animate-pulse">
        <XCircle className="w-4 h-4 text-white drop-shadow-md" />
      </div>
    );
  }
  if (priority === "WARNING") {
    return (
      <div className="w-6 h-6 rounded flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
        <AlertTriangle className="w-4 h-4 text-black drop-shadow-md" />
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30">
      <Info className="w-4 h-4 text-white drop-shadow-md" />
    </div>
  );
};

const ModuleBox = ({ name, priority }: { name: string; priority: DisplayPriority }) => {
  const bgClass = priority === "INTERLOCK" 
    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-red-500/20" 
    : priority === "WARNING"
    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-amber-500/20"
    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/20";
  
  return (
    <div className={`px-3 py-1 font-mono font-bold text-xs rounded-r shadow-md ${bgClass}`}>
      {name}
    </div>
  );
};

const InfoButton = ({ onClick, active }: { onClick: () => void; active?: boolean }) => (
  <button
    onClick={onClick}
    data-testid="button-alarm-info"
    className={`w-6 h-6 rounded flex items-center justify-center transition-all
      ${active 
        ? "bg-primary/30 border border-primary/50 shadow-lg shadow-primary/20" 
        : "bg-secondary hover:bg-muted border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
      }`}
  >
    <Info className="w-3.5 h-3.5 text-muted-foreground" />
  </button>
);

const EmptySlot = () => (
  <div className="flex items-center gap-0.5">
    <div className="w-6 h-6 rounded bg-muted/50 border border-border/30" />
    <div className="w-12 h-6 rounded bg-muted/50 border border-border/30" />
    <button className="w-6 h-6 rounded flex items-center justify-center bg-secondary/50 border border-border/30 opacity-50" disabled data-testid="button-alarm-empty-slot">
      <Info className="w-3.5 h-3.5 text-muted-foreground/50" />
    </button>
  </div>
);

const MAX_SLOTS = 6;

const AlarmBanner = ({
  alarms = [],
  nodeName = "CTLR1",
  nodeStatus = "online",
}: AlarmBannerProps) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [, setLocation] = useLocation();
  
  const selected = alarms[selectedIdx] || alarms[0];
  const emptySlots = Math.max(0, MAX_SLOTS - alarms.length);

  return (
    <div className="bg-gradient-to-b from-secondary to-background border-t border-border/50 select-none shadow-lg"
         style={{ boxShadow: '0 -4px 20px hsl(var(--primary) / 0.1)' }}
         data-testid="alarm-banner">
      <div className="flex items-center h-10 px-2 gap-1.5">
        {alarms.map((alarm, idx) => {
          const dp = toDisplayPriority(alarm.priority);
          return (
            <div key={alarm.tag + idx} className="flex items-center gap-0.5" data-testid={`alarm-slot-${idx}`}>
              <AlarmIcon priority={dp} />
              <ModuleBox name={alarm.tag} priority={dp} />
              <InfoButton 
                onClick={() => setSelectedIdx(idx)} 
                active={selectedIdx === idx}
              />
            </div>
          );
        })}
        
        {Array.from({ length: emptySlots }).map((_, i) => (
          <EmptySlot key={`empty-${i}`} />
        ))}
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => console.log("Clicked: Acknowledge")}
            data-testid="button-alarm-ack"
            className="h-7 px-2 flex items-center justify-center bg-secondary hover:bg-muted rounded border border-border/50 transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
          >
            <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-red-700 rounded flex items-center justify-center shadow-md shadow-red-500/30">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
          </button>
          
          <button
            onClick={() => console.log("Clicked: Faceplate")}
            data-testid="button-alarm-faceplate"
            className="h-7 px-2 flex items-center justify-center bg-secondary hover:bg-muted rounded border border-border/50 transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <button
            onClick={() => console.log("Clicked: Primary Control")}
            data-testid="button-alarm-control"
            className="h-7 px-2 flex items-center justify-center bg-secondary hover:bg-muted rounded border border-border/50 transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
          >
            <Gauge className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <div className="h-7 px-3 flex items-center justify-center bg-gradient-to-r from-cyan-500 to-cyan-600 rounded font-mono font-bold text-xs text-white shadow-lg shadow-cyan-500/30" data-testid="text-node-name">
            {nodeName}
          </div>
          
          <div className="flex items-center gap-1 px-2">
            <div
              className={`w-3 h-3 rounded-full shadow-lg ${
                nodeStatus === "online"
                  ? "bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/50"
                  : nodeStatus === "warning"
                  ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/50"
                  : "bg-gradient-to-br from-red-400 to-red-600 shadow-red-500/50"
              }`}
            />
            <div
              className={`w-3 h-3 rounded-full shadow-lg ${
                nodeStatus === "online" 
                  ? "bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/50" 
                  : "bg-muted/50"
              }`}
            />
          </div>
          
          <button
            onClick={() => console.log("Clicked: Diagnostics")}
            data-testid="button-alarm-diagnostics"
            className="h-7 px-2 flex items-center justify-center bg-secondary hover:bg-muted rounded border border-border/50 transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
          >
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <button
            onClick={() => {
              setLocation("/settings/interlock-logic");
            }}
            className="h-7 px-2 flex items-center justify-center bg-cyan-500/20 hover:bg-cyan-500/40 rounded border-2 border-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/30"
            data-testid="button-interlock-logic"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center h-7 px-3 bg-background/80 border-t border-border/30 text-xs text-foreground gap-6" data-testid="alarm-detail-row">
        {selected ? (
          <>
            <span className="font-mono text-muted-foreground" data-testid="text-alarm-timestamp">{formatTimestamp(selected.timestamp)}</span>
            <span className="truncate max-w-48 text-foreground" data-testid="text-alarm-message">{selected.message}</span>
            <span className="font-mono text-muted-foreground" data-testid="text-alarm-parameter">{selected.value.toFixed(1)} / {selected.limit.toFixed(1)} {selected.unit}</span>
            <span className="font-semibold text-foreground" data-testid="text-alarm-word">{toAlarmWord(selected.priority)}</span>
            <span 
              data-testid="text-alarm-priority"
              className={`font-bold uppercase ${
                selected.priority === "critical" 
                  ? "text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]" 
                  : selected.priority === "high" 
                  ? "text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]" 
                  : "text-blue-500 drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]"
              }`}
            >
              {toDisplayPriority(selected.priority)}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground" data-testid="text-no-alarms">No Active Alarms</span>
        )}
      </div>
    </div>
  );
};

export default AlarmBanner;
