import { cn } from "@/lib/utils";
import { X, Settings, Bell, HelpCircle, Check, History, TrendingUp, Link2, ArrowLeftRight } from "lucide-react";
import type { CompressorData, CompressorMode } from "@/delta-v/types/compressor";
import { Link } from "wouter";

interface VFDFaceplateProps {
  data: CompressorData;
  onStart: () => void;
  onStop: () => void;
  onModeChange: (mode: CompressorMode) => void;
  onSpeedSPChange: (value: number) => void;
  onClearAlarm: () => void;
  onClose?: () => void;
  configTagName?: string;
  configDescription?: string;
  configUnit?: string;
}

// Horizontal Bar Graph component
const HorizontalBarGraph = ({ 
  label, 
  value, 
  unit, 
  maxValue,
  color = 'cyan'
}: { 
  label: string; 
  value: number; 
  unit: string; 
  maxValue: number;
  color?: 'cyan' | 'amber' | 'green' | 'blue' | 'white';
}) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  
  const colorClasses = {
    cyan: 'bg-cyan-400 shadow-cyan-400/30',
    amber: 'bg-amber-400 shadow-amber-400/30',
    green: 'bg-emerald-400 shadow-emerald-400/30',
    blue: 'bg-blue-400 shadow-blue-400/30',
    white: 'bg-white shadow-white/30',
  };

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <span className="text-xs text-slate-300 font-mono">{value.toFixed(1)} {unit}</span>
      </div>
      <div className="h-4 bg-slate-700 rounded overflow-hidden border border-slate-600">
        <div 
          className={cn("h-full transition-all duration-300 shadow-lg", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Status dot component matching Secondary Controller
const StatusDot = ({ 
  label, 
  active, 
  color 
}: { 
  label: string; 
  active: boolean; 
  color: 'green' | 'red' | 'amber' | 'cyan' 
}) => {
  const colorClasses = {
    green: active ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-600',
    red: active ? 'bg-red-500 shadow-red-500/50 animate-pulse' : 'bg-slate-600',
    amber: active ? 'bg-amber-500 shadow-amber-500/50' : 'bg-slate-600',
    cyan: active ? 'bg-cyan-500 shadow-cyan-500/50' : 'bg-slate-600',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "w-3 h-3 rounded-full transition-all",
          colorClasses[color],
          active && "shadow-lg"
        )}
      />
      <span className="text-[9px] text-muted-foreground uppercase">{label}</span>
    </div>
  );
};

// Toolbar button matching Secondary Controller style
const ToolbarButton = ({ 
  icon: Icon, 
  to 
}: { 
  icon: React.ElementType; 
  to?: string 
}) => {
  const buttonClass = cn(
    "w-8 h-8 flex items-center justify-center",
    "bg-card hover:bg-muted border border-border/50 rounded",
    "transition-colors text-muted-foreground hover:text-foreground"
  );

  if (to) {
    return (
      <Link href={to} className={buttonClass}>
        <Icon size={14} />
      </Link>
    );
  }

  return (
    <button className={buttonClass}>
      <Icon size={14} />
    </button>
  );
};

// Alarm table row type
interface AlarmEntry {
  id: string;
  param: string;
  acknowledged: boolean;
}

export const VFDFaceplate = ({
  data,
  onStart,
  onStop,
  onModeChange,
  onClearAlarm,
  onClose,
  configTagName,
  configDescription,
  configUnit,
}: VFDFaceplateProps) => {
  const isRunning = data.state === "RUNNING" || data.state === "STARTING";
  const isStopped = data.state === "STOPPED";
  const isStopping = data.state === "STOPPING";
  
  // Use config values if provided, otherwise fall back to data values
  const displayTag = configTagName || data.tag;
  const displayDescription = configDescription || data.description;
  const displayUnit = configUnit || "U-505";

  // Mock alarm entries for demonstration
  const alarmEntries: AlarmEntry[] = data.failAlarm 
    ? [{ id: '1', param: 'FAIL_ALARM', acknowledged: false }]
    : [];

  return (
    <div className="faceplate-container w-[320px] select-none p-1.5">
      {/* Title Bar - Dark theme matching Secondary Controller */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <span className="text-sm font-semibold text-faceplate-border">VFD Faceplate</span>
        <button 
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center bg-card hover:bg-muted rounded-sm transition-colors"
        >
          <X size={12} className="text-muted-foreground" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="faceplate-inner p-4 space-y-3">
        {/* Controller Tag & Description */}
        <div className="text-center border-b border-border/30 pb-2">
          <h2 className={cn("font-mono font-bold text-base tracking-widest", "text-faceplate-border glow-text")}>
            {displayTag}
          </h2>
          <p className="text-xs text-muted-foreground">{displayDescription}</p>
        </div>


        {/* Main Control Section - Two Horizontal Rows */}
        <div className="flex flex-col gap-2">
          {/* Top Row: START / STOP Buttons */}
          <div className="flex flex-row gap-2 justify-center">
            <button
              onClick={onStart}
              disabled={!data.permitActive}
              className={cn(
                "deltav-mode-btn-dark text-xs px-4 py-1.5 flex-1",
                isRunning && "active-green",
                !data.permitActive && "opacity-50 cursor-not-allowed"
              )}
            >
              START
            </button>
            <button
              onClick={onStop}
              className={cn(
                "deltav-mode-btn-dark text-xs px-4 py-1.5 flex-1",
                (isStopped || isStopping) && "active-red"
              )}
            >
              {isStopping ? "STOPPING" : isStopped ? "STOPPED" : "STOP"}
            </button>
          </div>

          {/* Bottom Row: Mode Buttons */}
          <div className="flex flex-row gap-2 justify-center">
            <button
              onClick={() => onModeChange("CAS")}
              className={cn(
                "deltav-mode-btn-dark text-xs px-4 py-1.5 flex-1",
                data.mode === "CAS" && "active"
              )}
            >
              CAS
            </button>
            <button
              onClick={() => onModeChange("AUTO")}
              className={cn(
                "deltav-mode-btn-dark text-xs px-4 py-1.5 flex-1",
                data.mode === "AUTO" && "active-green"
              )}
            >
              AUTO
            </button>
            <button
              onClick={() => onModeChange("MAN")}
              className={cn(
                "deltav-mode-btn-dark text-xs px-4 py-1.5 flex-1",
                data.mode === "MAN" && "active-orange"
              )}
            >
              MAN
            </button>
          </div>
        </div>

        {/* Device State & Fail Alarm Fields */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400 font-medium">Device state</span>
            <div className={cn(
              "bg-slate-500 border border-slate-400 rounded px-2 py-1 text-sm",
              data.state === "RUNNING" ? "text-cyan-400 font-semibold" : "text-black"
            )}>
              {data.state}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400 font-medium">Fail alarm</span>
            <div className="bg-slate-500 border border-slate-400 rounded px-2 py-1 text-sm text-black">
              {data.failAlarm ? "Active" : "Clear"}
            </div>
          </div>
        </div>

        {/* Horizontal Bar Graphs */}
        <div className="space-y-2">
          <HorizontalBarGraph 
            label="Speed SP" 
            value={data.speedSP ?? 0} 
            unit="%" 
            maxValue={100} 
            color="white" 
          />
          <HorizontalBarGraph 
            label="Speed PV" 
            value={data.speedPV ?? 0} 
            unit="%" 
            maxValue={100} 
            color="amber" 
          />
          <HorizontalBarGraph 
            label="Motor Power" 
            value={data.motorPowerHP ?? 0} 
            unit="hp" 
            maxValue={150} 
            color="cyan" 
          />
          <HorizontalBarGraph 
            label="VFD Current" 
            value={data.vfdCurrentAmps ?? 0} 
            unit="Amps" 
            maxValue={100} 
            color="green" 
          />
          <HorizontalBarGraph 
            label="Motor Speed" 
            value={data.motorSpeedRPM ?? 0} 
            unit="RPM" 
            maxValue={1800} 
            color="blue" 
          />
          <HorizontalBarGraph 
            label="Compressor Speed" 
            value={data.compressorSpeedRPM ?? 0} 
            unit="RPM" 
            maxValue={10000} 
            color="cyan" 
          />
        </div>

        {/* Unit Field */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Unit:</span>
          <input 
            type="text" 
            value={displayUnit}
            readOnly
            className="flex-1 bg-slate-500 border border-slate-400 rounded px-2 py-1 text-xs text-black text-center"
          />
        </div>

        {/* Alarm Table */}
        <div className="border border-slate-400 rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-500">
                <th className="border-r border-slate-400 px-2 py-1 text-left font-medium text-black w-12">Ack</th>
                <th className="border-r border-slate-400 px-2 py-1 text-left font-medium text-black">Param</th>
                <th className="px-2 py-1 text-left font-medium text-black w-12">Help</th>
              </tr>
            </thead>
            <tbody>
              {alarmEntries.length > 0 ? (
                alarmEntries.map((alarm) => (
                  <tr key={alarm.id} className="border-t border-slate-400 bg-slate-500">
                    <td className="border-r border-slate-400 px-2 py-1 text-center">
                      <button 
                        onClick={onClearAlarm}
                        className="w-5 h-5 bg-slate-400 hover:bg-slate-300 rounded flex items-center justify-center mx-auto"
                      >
                        <Check size={12} className="text-black" />
                      </button>
                    </td>
                    <td className="border-r border-slate-400 px-2 py-1 text-black">{alarm.param}</td>
                    <td className="px-2 py-1 text-center">
                      <button className="w-5 h-5 bg-slate-400 hover:bg-slate-300 rounded flex items-center justify-center mx-auto">
                        <HelpCircle size={12} className="text-black" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-slate-400 bg-slate-500">
                  <td className="border-r border-slate-400 px-2 py-1">&nbsp;</td>
                  <td className="border-r border-slate-400 px-2 py-1">&nbsp;</td>
                  <td className="px-2 py-1">&nbsp;</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Status Indicator Dots */}
        <div className="flex items-center justify-center gap-4 py-2 border-t border-b border-border/30">
          <StatusDot label="RUN" active={isRunning} color="green" />
          <StatusDot label="STOP" active={isStopped} color="amber" />
          <StatusDot label="FAIL" active={data.failAlarm} color="red" />
          <StatusDot label="PERMIT" active={data.permitActive} color="cyan" />
        </div>

        {/* Bottom Toolbar - 6 Icons matching reference */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/50 bg-slate-800 rounded-b px-2 pb-2">
          <ToolbarButton icon={Settings} to="/settings/controller-outputs/faceplates/vfd-settings" />
          <ToolbarButton icon={History} to="/settings/controller-outputs/faceplates/vfd-history" />
          <ToolbarButton icon={TrendingUp} to="/settings/controller-outputs/faceplates/vfd-trends" />
          <ToolbarButton icon={Link2} to="/settings/controller-outputs/faceplates/vfd-links" />
          <ToolbarButton icon={ArrowLeftRight} to="/settings/controller-outputs/faceplates/vfd-compare" />
          <ToolbarButton icon={Bell} to="/settings/controller-outputs/faceplates/vfd-alarms" />
        </div>
      </div>
    </div>
  );
};
