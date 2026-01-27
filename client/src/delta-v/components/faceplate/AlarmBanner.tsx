import { useState } from "react";
import { Info, Check, Settings, Gauge, HelpCircle, AlertTriangle, XCircle, Shield } from "lucide-react";
import { useLocation } from "wouter";

interface Alarm {
  id: string;
  module: string;
  description: string;
  parameter: string;
  alarmWord: string;
  priority: "CRITICAL" | "WARNING" | "ADVISORY";
  timestamp: string;
  acknowledged: boolean;
}

interface AlarmBannerProps {
  alarms?: Alarm[];
  nodeName?: string;
  nodeStatus?: "online" | "offline" | "warning";
}

const defaultAlarms: Alarm[] = [
  {
    id: "1",
    module: "CAS5",
    description: "Master PID Control Loop",
    parameter: "CAS5/PVBAD_ALM",
    alarmWord: "HighHigh",
    priority: "CRITICAL",
    timestamp: "Mon 12:22:23",
    acknowledged: false,
  },
  {
    id: "2",
    module: "FV-101",
    description: "Flow Valve Control",
    parameter: "FV-101/POS_ALM",
    alarmWord: "High",
    priority: "WARNING",
    timestamp: "Mon 12:20:45",
    acknowledged: false,
  },
  {
    id: "3",
    module: "FIC-101",
    description: "Flow Indicator Controller",
    parameter: "FIC-101/PVBAD_ALM",
    alarmWord: "DevHigh",
    priority: "WARNING",
    timestamp: "Mon 12:18:12",
    acknowledged: true,
  },
];

const AlarmIcon = ({ priority }: { priority: Alarm["priority"] }) => {
  if (priority === "CRITICAL") {
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

const ModuleBox = ({ name, priority }: { name: string; priority: Alarm["priority"] }) => {
  const bgClass = priority === "CRITICAL" 
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
    <button className="w-6 h-6 rounded flex items-center justify-center bg-secondary/50 border border-border/30 opacity-50">
      <Info className="w-3.5 h-3.5 text-muted-foreground/50" />
    </button>
  </div>
);

const ControlButton = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <button
    className={`h-7 px-2 flex items-center justify-center bg-secondary hover:bg-muted rounded border border-border/50 transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 ${className}`}
  >
    {children}
  </button>
);

const AlarmBanner = ({
  alarms = defaultAlarms,
  nodeName = "CTLR1",
  nodeStatus = "online",
}: AlarmBannerProps) => {
  const [selectedAlarmId, setSelectedAlarmId] = useState<string | null>(alarms[0]?.id || null);
  const [, setLocation] = useLocation();
  
  const selectedAlarm = alarms.find(a => a.id === selectedAlarmId) || alarms[0];

  return (
    <div className="bg-gradient-to-b from-secondary to-background border-t border-border/50 select-none shadow-lg"
         style={{ boxShadow: '0 -4px 20px hsl(var(--primary) / 0.1)' }}>
      {/* Top Row - Alarm Modules and Controls */}
      <div className="flex items-center h-10 px-2 gap-1.5">
        {/* Alarm module boxes */}
        {alarms.map((alarm) => (
          <div key={alarm.id} className="flex items-center gap-0.5">
            <AlarmIcon priority={alarm.priority} />
            <ModuleBox name={alarm.module} priority={alarm.priority} />
            <InfoButton 
              onClick={() => setSelectedAlarmId(alarm.id)} 
              active={selectedAlarmId === alarm.id}
            />
          </div>
        ))}
        
        {/* Empty placeholder slots */}
        <EmptySlot />
        <EmptySlot />
        <EmptySlot />
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Right side controls */}
        <div className="flex items-center gap-1">
          {/* Acknowledge button */}
          <ControlButton>
            <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-red-700 rounded flex items-center justify-center shadow-md shadow-red-500/30">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
          </ControlButton>
          
          {/* Faceplate button */}
          <ControlButton>
            <Settings className="w-4 h-4 text-muted-foreground" />
          </ControlButton>
          
          {/* Primary Control button */}
          <ControlButton>
            <Gauge className="w-4 h-4 text-muted-foreground" />
          </ControlButton>
          
          {/* Node Name box */}
          <div className="h-7 px-3 flex items-center justify-center bg-gradient-to-r from-cyan-500 to-cyan-600 rounded font-mono font-bold text-xs text-white shadow-lg shadow-cyan-500/30">
            {nodeName}
          </div>
          
          {/* Status indicators */}
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
          
          {/* Diagnostics button */}
          <ControlButton>
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </ControlButton>
          
          {/* Interlock Logic button */}
          <button
            onClick={() => {
              console.log("Shield button clicked - navigating to /settings/interlock-logic");
              setLocation("/settings/interlock-logic");
            }}
            className="h-7 px-2 flex items-center justify-center bg-secondary hover:bg-muted rounded border border-border/50 transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
            data-testid="button-interlock-logic"
          >
            <Shield className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      
      {/* Bottom Row - Selected Alarm Details */}
      <div className="flex items-center h-7 px-3 bg-background/80 border-t border-border/30 text-xs text-foreground gap-6">
        {selectedAlarm ? (
          <>
            <span className="font-mono text-muted-foreground">{selectedAlarm.timestamp}</span>
            <span className="truncate max-w-48 text-foreground">{selectedAlarm.description}</span>
            <span className="font-mono text-muted-foreground">{selectedAlarm.parameter}</span>
            <span className="font-semibold text-foreground">{selectedAlarm.alarmWord}</span>
            <span 
              className={`font-bold uppercase ${
                selectedAlarm.priority === "CRITICAL" 
                  ? "text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]" 
                  : selectedAlarm.priority === "WARNING" 
                  ? "text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]" 
                  : "text-blue-500 drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]"
              }`}
            >
              {selectedAlarm.priority}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">No alarms</span>
        )}
      </div>
    </div>
  );
};

export default AlarmBanner;
