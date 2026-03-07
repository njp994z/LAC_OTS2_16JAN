import { useState } from "react";
import {
  Info,
  Check,
  Settings,
  Gauge,
  HelpCircle,
  AlertTriangle,
  XCircle,
  Shield,
} from "lucide-react";
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
  viewName?: string;
}

interface AlarmBannerProps {
  nodeName?: string;
  nodeStatus?: "online" | "offline" | "warning";
  onAlarmClick?: (screen: string, blockId: string) => void;
}

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

const ModuleBox = ({
  name,
  priority,
}: {
  name: string;
  priority: Alarm["priority"];
}) => {
  const bgClass =
    priority === "CRITICAL"
      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-red-500/20"
      : priority === "WARNING"
        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-amber-500/20"
        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/20";

  return (
    <div
      className={`px-3 py-1 font-mono font-bold text-xs rounded-r shadow-md ${bgClass}`}
    >
      {name}
    </div>
  );
};

const InfoButton = ({
  onClick,
  active,
}: {
  onClick: () => void;
  active?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-6 h-6 rounded flex items-center justify-center transition-all
      ${
        active
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

const ControlButton = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <button
    className={`h-7 px-2 flex items-center justify-center bg-secondary hover:bg-muted rounded border border-border/50 transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 ${className}`}
  >
    {children}
  </button>
);

import { L1SystemElements } from "@/delta-v/pages/Templates/L1-SystemOverview/L1.components.map";
import { L2AcidElements } from "@/delta-v/pages/Templates/L2-1520-Acid/L2_1520Acid.components.map";
import { L2ConverterElements } from "@/delta-v/pages/Templates/L2-Converter/L2Converter.components.map";

// Map controllers to their precise view names dynamically
const getDynamicViewMap = () => {
  const map: Record<string, string> = {};

  L1SystemElements.forEach((id) => {
    map[id] = "L1 – System Overview";
  });

  L2AcidElements.forEach((id) => {
    map[id] = "L2 1520 ACID";
  });

  L2ConverterElements.forEach((id) => {
    map[id] = "L2 – Converter";
  });

  // L2 Furnace Area is currently instantiated directly inside HomeScreen
  const L2FurnaceDefaults = [
    "1530-F-2602",
    "1540-FCV-2602",
    "1540-HCV-4282",
    "1540-H-4282",
    "1540-H-4030",
    "1540-H-4283",
    "1540-TI-4200A",
    "1540-TI-4200B",
    "1540-TI-4200C",
    "1520-TI-5821",
  ];
  L2FurnaceDefaults.forEach((id) => {
    map[id] = "L2 – Furnace Area";
  });

  // Preserve existing specific mappings
  map["1540-TI-4825"] = "6.1 L3_1540 Converter";

  return map;
};

const VIEW_MAP = getDynamicViewMap();

import { useControllerSyncContext } from "@/delta-v/contexts/ControllerSyncContext";
import { useControllerConfig } from "@/delta-v/contexts/ControllerConfigContext";

const AlarmBanner = ({
  nodeName = "CTLR1",
  nodeStatus = "online",
  onAlarmClick,
}: AlarmBannerProps) => {
  const { controllers } = useControllerSyncContext();
  const { getControllerConfig } = useControllerConfig();
  const [, setLocation] = useLocation();

  // Compute active alarms dynamically from all globally synced controllers
  const dynamicAlarms: Alarm[] = [];
  Object.entries(controllers).forEach(([controllerId, state]) => {
    const { alarmStates, alarmLog } = state;

    // Check if there are any active alarms
    const activeAlarms = [];
    if (alarmStates.HH)
      activeAlarms.push({ word: "HighHigh", priority: "CRITICAL" as const });
    else if (alarmStates.H)
      activeAlarms.push({ word: "High", priority: "WARNING" as const });

    if (alarmStates.LL)
      activeAlarms.push({ word: "LowLow", priority: "CRITICAL" as const });
    else if (alarmStates.L)
      activeAlarms.push({ word: "Low", priority: "WARNING" as const });

    if (alarmStates.DH)
      activeAlarms.push({ word: "DevHigh", priority: "WARNING" as const });
    if (alarmStates.DL)
      activeAlarms.push({ word: "DevLow", priority: "WARNING" as const });

    if (activeAlarms.length > 0) {
      // Find the most recent alarm log for description context if possible
      const recentLog = alarmLog.find((l) => !l.acknowledged);

      // We take the highest priority alarm for this controller to display in the banner summary
      const highestPriority = activeAlarms.some(
        (a) => a.priority === "CRITICAL",
      )
        ? "CRITICAL"
        : "WARNING";
      const highestWord =
        activeAlarms.find((a) => a.priority === highestPriority)?.word ||
        activeAlarms[0].word;

      let viewName = VIEW_MAP[controllerId];
      if (!viewName) {
        try {
          const config = getControllerConfig(controllerId);
          viewName = config?.UNIT || "Unknown View";
        } catch (e) {
          viewName = "Unknown View";
        }
      }

      dynamicAlarms.push({
        id: controllerId,
        module: controllerId,
        description: recentLog
          ? recentLog.alarmName
          : `${controllerId} Alarm Active`,
        parameter: `${controllerId}/PV`,
        alarmWord: highestWord,
        priority: highestPriority as any,
        timestamp: recentLog
          ? recentLog.timestamp.toLocaleTimeString()
          : new Date().toLocaleTimeString(),
        acknowledged: recentLog ? recentLog.acknowledged : false,
        viewName,
      });
    }
  });

  const activeAlarmsList = dynamicAlarms;
  const [selectedAlarmId, setSelectedAlarmId] = useState<string | null>(
    activeAlarmsList[0]?.id || null,
  );

  // If the selected alarm id is no longer in the list, default to the first one available
  const selectedAlarm =
    activeAlarmsList.find((a) => a.id === selectedAlarmId) ||
    activeAlarmsList[0];

  return (
    <div
      className="bg-gradient-to-b from-secondary to-background border-t border-border/50 select-none shadow-lg"
      style={{ boxShadow: "0 -4px 20px hsl(var(--primary) / 0.1)" }}
    >
      {/* Top Row - Alarm Modules and Controls */}
      <div className="flex items-center h-10 px-2 gap-1.5 overflow-x-auto no-scrollbar">
        {/* Alarm module boxes */}
        {activeAlarmsList.map((alarm) => (
          <div
            key={alarm.id}
            className="flex items-center gap-0.5 group relative cursor-pointer"
            title={`View: ${alarm.viewName}\nDescription: ${alarm.description}\nParameter: ${alarm.parameter}\nAlarm: ${alarm.alarmWord} - ${alarm.priority}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedAlarmId(alarm.id);
              if (onAlarmClick && alarm.viewName) {
                onAlarmClick(alarm.viewName, alarm.module);
              } else {
                // Fallback
                window.location.href = `/?screen=${encodeURIComponent(alarm.viewName || "")}&highlight=${encodeURIComponent(alarm.module)}`;
              }
            }}
          >
            <AlarmIcon priority={alarm.priority} />
            <ModuleBox name={alarm.module} priority={alarm.priority} />
            <InfoButton
              onClick={() => {}}
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
          <button
            onClick={() => console.log("Clicked: Acknowledge (red check)")}
            className="h-7 px-2 flex items-center justify-center bg-secondary hover:bg-muted rounded border border-border/50 transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
          >
            <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-red-700 rounded flex items-center justify-center shadow-md shadow-red-500/30">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
          </button>

          {/* Faceplate button */}
          <button
            onClick={() => console.log("Clicked: Faceplate (gear)")}
            className="h-7 px-2 flex items-center justify-center bg-secondary hover:bg-muted rounded border border-border/50 transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Primary Control button */}
          <button
            onClick={() => console.log("Clicked: Primary Control (gauge)")}
            className="h-7 px-2 flex items-center justify-center bg-secondary hover:bg-muted rounded border border-border/50 transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
          >
            <Gauge className="w-4 h-4 text-muted-foreground" />
          </button>

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
          <button
            onClick={() => console.log("Clicked: Diagnostics (question mark)")}
            className="h-7 px-2 flex items-center justify-center bg-secondary hover:bg-muted rounded border border-border/50 transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
          >
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Interlock Logic button - CYAN BORDER to make it distinct */}
          <button
            onClick={() => {
              console.log(
                "Shield button clicked - navigating to /settings/interlock-logic",
              );
              setLocation("/settings/interlock-logic");
            }}
            className="h-7 px-2 flex items-center justify-center bg-cyan-500/20 hover:bg-cyan-500/40 rounded border-2 border-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/30"
            data-testid="button-interlock-logic"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Bottom Row - Selected Alarm Details */}
      <div className="flex items-center h-7 px-3 bg-background/80 border-t border-border/30 text-xs text-foreground gap-6">
        {selectedAlarm ? (
          <>
            <span className="font-mono text-muted-foreground">
              {selectedAlarm.timestamp}
            </span>
            <span className="truncate max-w-48 text-foreground">
              {selectedAlarm.description}
            </span>
            <span className="font-mono text-muted-foreground">
              {selectedAlarm.parameter}
            </span>
            <span className="font-semibold text-foreground">
              {selectedAlarm.alarmWord}
            </span>
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
