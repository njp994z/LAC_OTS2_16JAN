import { cn } from '@/lib/utils';
import type { SecondaryControllerData, SecondaryControllerConfig } from '@/delta-v/types/secondaryController';
import { X, History, Settings, Activity, Link2, Sliders, Bell } from 'lucide-react';
import { Link } from 'wouter';

// Base path for all faceplate routes
const FACEPLATE_BASE = '/settings/controller-outputs/faceplates';

// Helper function to route to independent pages for specific sensors
const getRouteForSensor = (basePath: string, sensorId?: string): string => {
  if (sensorId === '1520-TI-5821') {
    const routeMap: Record<string, string> = {
      'faceplate-3a': `${FACEPLATE_BASE}/temp-sensor-5821-faceplate-3a`,
      'faceplate-3b': `${FACEPLATE_BASE}/temp-sensor-5821-faceplate-3b`,
      'faceplate-3c': `${FACEPLATE_BASE}/temp-sensor-5821-faceplate-3c`,
      'faceplate-3d': `${FACEPLATE_BASE}/temp-sensor-5821-faceplate-3d`,
      'faceplate-3e': `${FACEPLATE_BASE}/temp-sensor-5821-faceplate-3e`,
      'faceplate-3f': `${FACEPLATE_BASE}/temp-sensor-5821-faceplate-3f`,
    };
    return routeMap[basePath] || `${FACEPLATE_BASE}/${basePath}/${sensorId}`;
  }
  if (sensorId === '1540-TI-4200A') {
    const routeMap: Record<string, string> = {
      'faceplate-3a': `${FACEPLATE_BASE}/temp-sensor-4200a-faceplate-3a`,
      'faceplate-3b': `${FACEPLATE_BASE}/temp-sensor-4200a-faceplate-3b`,
      'faceplate-3c': `${FACEPLATE_BASE}/temp-sensor-4200a-faceplate-3c`,
      'faceplate-3d': `${FACEPLATE_BASE}/temp-sensor-4200a-faceplate-3d`,
      'faceplate-3e': `${FACEPLATE_BASE}/temp-sensor-4200a-faceplate-3e`,
      'faceplate-3f': `${FACEPLATE_BASE}/temp-sensor-4200a-faceplate-3f`,
    };
    return routeMap[basePath] || `${FACEPLATE_BASE}/${basePath}/${sensorId}`;
  }
  if (sensorId === '1540-TI-4200B') {
    const routeMap: Record<string, string> = {
      'faceplate-3a': `${FACEPLATE_BASE}/temp-sensor-4200b-faceplate-3a`,
      'faceplate-3b': `${FACEPLATE_BASE}/temp-sensor-4200b-faceplate-3b`,
      'faceplate-3c': `${FACEPLATE_BASE}/temp-sensor-4200b-faceplate-3c`,
      'faceplate-3d': `${FACEPLATE_BASE}/temp-sensor-4200b-faceplate-3d`,
      'faceplate-3e': `${FACEPLATE_BASE}/temp-sensor-4200b-faceplate-3e`,
      'faceplate-3f': `${FACEPLATE_BASE}/temp-sensor-4200b-faceplate-3f`,
    };
    return routeMap[basePath] || `${FACEPLATE_BASE}/${basePath}/${sensorId}`;
  }
  if (sensorId === '1540-TI-4200C') {
    const routeMap: Record<string, string> = {
      'faceplate-3a': `${FACEPLATE_BASE}/temp-sensor-4200c-faceplate-3a`,
      'faceplate-3b': `${FACEPLATE_BASE}/temp-sensor-4200c-faceplate-3b`,
      'faceplate-3c': `${FACEPLATE_BASE}/temp-sensor-4200c-faceplate-3c`,
      'faceplate-3d': `${FACEPLATE_BASE}/temp-sensor-4200c-faceplate-3d`,
      'faceplate-3e': `${FACEPLATE_BASE}/temp-sensor-4200c-faceplate-3e`,
      'faceplate-3f': `${FACEPLATE_BASE}/temp-sensor-4200c-faceplate-3f`,
    };
    return routeMap[basePath] || `${FACEPLATE_BASE}/${basePath}/${sensorId}`;
  }
  if (sensorId === '1540-TI-4825') {
    const routeMap: Record<string, string> = {
      'faceplate-3a': `${FACEPLATE_BASE}/temp-sensor-4825-faceplate-3a`,
      'faceplate-3b': `${FACEPLATE_BASE}/temp-sensor-4825-faceplate-3b`,
      'faceplate-3c': `${FACEPLATE_BASE}/temp-sensor-4825-faceplate-3c`,
      'faceplate-3d': `${FACEPLATE_BASE}/temp-sensor-4825-faceplate-3d`,
      'faceplate-3e': `${FACEPLATE_BASE}/temp-sensor-4825-faceplate-3e`,
      'faceplate-3f': `${FACEPLATE_BASE}/temp-sensor-4825-faceplate-3f`,
    };
    return routeMap[basePath] || `${FACEPLATE_BASE}/${basePath}/${sensorId}`;
  }
  if (sensorId === '1540-TI-4820') {
    const routeMap: Record<string, string> = {
      'faceplate-3a': `${FACEPLATE_BASE}/temp-sensor-4820-faceplate-3a`,
      'faceplate-3b': `${FACEPLATE_BASE}/temp-sensor-4820-faceplate-3b`,
      'faceplate-3c': `${FACEPLATE_BASE}/temp-sensor-4820-faceplate-3c`,
      'faceplate-3d': `${FACEPLATE_BASE}/temp-sensor-4820-faceplate-3d`,
      'faceplate-3e': `${FACEPLATE_BASE}/temp-sensor-4820-faceplate-3e`,
      'faceplate-3f': `${FACEPLATE_BASE}/temp-sensor-4820-faceplate-3f`,
    };
    return routeMap[basePath] || `${FACEPLATE_BASE}/${basePath}/${sensorId}`;
  }
  return `/${basePath}${sensorId ? `/${sensorId}` : ''}`;
};

interface TempSensorSecondaryFaceplateProps {
  data: SecondaryControllerData;
  config: SecondaryControllerConfig;
  className?: string;
  sensorId?: string;
  onClose?: () => void;
  isTransparent?: boolean;
}

/**
 * Simplified Secondary Faceplate for Temperature Sensors
 * Contains: Tag, description, PV display, single PV bar with alarm arrows, alarm dots, area display, toolbar
 * Does NOT include: OUT% box, mode buttons, SP controls, dual bars
 */
export const TempSensorSecondaryFaceplate = ({
  data,
  config,
  className,
  sensorId,
  onClose,
  isTransparent = false
}: TempSensorSecondaryFaceplateProps) => {
  // Calculate percentage for bar display using SP_LIM_LO/HI as the range
  const rangeMin = config.SP_LIM_LO ?? config.PV_SCALE_LO;
  const rangeMax = config.SP_LIM_HI ?? config.PV_SCALE_HI;
  const pvPercent = (data.PV - rangeMin) / (rangeMax - rangeMin) * 100;
  
  // Calculate alarm limit percentages for arrows
  const alarmLPercent = ((config.ALM_L_LIM - rangeMin) / (rangeMax - rangeMin)) * 100;
  const alarmHPercent = ((config.ALM_H_LIM - rangeMin) / (rangeMax - rangeMin)) * 100;
  const alarmLLPercent = ((config.ALM_LL_LIM - rangeMin) / (rangeMax - rangeMin)) * 100;
  const alarmHHPercent = ((config.ALM_HH_LIM - rangeMin) / (rangeMax - rangeMin)) * 100;

  return (
    <div className={cn(
      isTransparent ? "faceplate-container-transparent" : "faceplate-container",
      "w-[260px] select-none p-1.5",
      className
    )}>
      {/* Title Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <span className={cn(
          "text-sm font-semibold",
          isTransparent ? "text-black" : "text-faceplate-border"
        )}>Secondary Sensor Faceplate</span>
        <button 
          onClick={onClose} 
          className="w-5 h-5 flex items-center justify-center bg-card hover:bg-muted rounded-sm transition-colors"
        >
          <X size={12} className="text-muted-foreground" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className={cn(
        isTransparent ? "faceplate-inner-light" : "faceplate-inner",
        "p-4 space-y-3"
      )}>
        {/* Sensor Tag & Description */}
        <div className="text-center border-b border-border/30 pb-2">
          <h2 className={cn(
            "font-mono font-bold text-base tracking-widest",
            isTransparent ? "text-black" : "text-faceplate-border glow-text"
          )}>
            {config.TAGNAME}
          </h2>
          <p className={cn("text-xs", isTransparent ? "text-black/70" : "text-muted-foreground")}>{config.DESC}</p>
        </div>

        {/* PV Display Row */}
        <div className="flex items-center justify-center gap-3">
          <div className={cn(
            "px-4 py-1.5 rounded text-center min-w-[90px]",
            "bg-amber-400 text-black font-mono font-bold text-lg",
            "shadow-lg shadow-amber-400/30"
          )}>
            {data.PV.toFixed(1)} {config.EU}
          </div>
        </div>

        {/* Main Display Section - Bar with arrows and unit scale */}
        <div className="flex justify-center items-center">
          {/* PV Bar Graph with Arrows and Unit Scale */}
          <div className="flex flex-col items-center">
            <div className="flex items-end gap-1 h-[18px]">
              <span className="text-[9px] text-muted-foreground leading-none">{rangeMax.toFixed(1)}</span>
              <span className="text-[10px] text-muted-foreground leading-none">{config.EU}</span>
            </div>
            
            {/* Container for arrows, unit scale, and bar */}
            <div className="flex items-stretch gap-0.5">
              {/* Unit Scale Column */}
              <div className="relative h-[140px] w-7 flex flex-col justify-center items-end pr-0.5">
                <span className="text-[8px] text-muted-foreground">
                  {((rangeMax + rangeMin) / 2).toFixed(0)} {config.EU}
                </span>
              </div>

              {/* Tick Lines Column with Arrows overlaid */}
              <div className="relative h-[140px] w-4">
                {/* Tick marks */}
                {[0, 25, 50, 75, 100].map((percent) => (
                  <div 
                    key={percent} 
                    className="absolute w-full h-px bg-muted-foreground/60" 
                    style={{ bottom: `${percent}%` }}
                  />
                ))}
                
                {/* Red HH Alarm Arrow */}
                {config.ALM_HH_LIM !== 0 && (
                  <div 
                    className="absolute right-0 z-10" 
                    style={{
                      bottom: `${Math.max(0, Math.min(100, alarmHHPercent))}%`,
                      transform: 'translateY(50%)'
                    }}
                  >
                    <div className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-red-500" />
                  </div>
                )}
                
                {/* Yellow High Alarm Arrow */}
                {config.ALM_H_LIM !== 0 && (
                  <div 
                    className="absolute right-0 z-10" 
                    style={{
                      bottom: `${Math.max(0, Math.min(100, alarmHPercent))}%`,
                      transform: 'translateY(50%)'
                    }}
                  >
                    <div className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-yellow-400" />
                  </div>
                )}

                {/* Yellow Low Alarm Arrow */}
                {config.ALM_L_LIM !== 0 && (
                  <div 
                    className="absolute right-0 z-10" 
                    style={{
                      bottom: `${Math.max(0, Math.min(100, alarmLPercent))}%`,
                      transform: 'translateY(50%)'
                    }}
                  >
                    <div className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-yellow-400" />
                  </div>
                )}

                {/* Red LL Alarm Arrow */}
                {config.ALM_LL_LIM !== 0 && (
                  <div 
                    className="absolute right-0 z-10" 
                    style={{
                      bottom: `${Math.max(0, Math.min(100, alarmLLPercent))}%`,
                      transform: 'translateY(50%)'
                    }}
                  >
                    <div className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-red-500" />
                  </div>
                )}
              </div>

              {/* PV Bar */}
              <div className="relative w-8 h-[140px] bg-bar-track rounded border border-border/50 overflow-hidden">
                {/* Grid lines */}
                {Array.from({ length: 21 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-full border-t border-muted/30" 
                    style={{ bottom: `${i * 5}%` }} 
                  />
                ))}
                
                {/* PV Fill (yellow/amber) */}
                <div 
                  className="absolute bottom-0 left-0 w-full" 
                  style={{
                    height: `${Math.max(0, Math.min(100, pvPercent))}%`,
                    background: 'linear-gradient(180deg, hsl(45 100% 60%) 0%, hsl(45 100% 50%) 50%, hsl(45 90% 40%) 100%)',
                    boxShadow: '0 0 8px hsla(45, 100%, 55%, 0.4)'
                  }} 
                />
              </div>
            </div>
            
            <span className="text-[9px] text-muted-foreground mt-1">{rangeMin.toFixed(0)} {config.EU}</span>
          </div>
        </div>

        {/* Alarm Indicators Row */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {config.ALM_LL_LIM !== 0 && <AlarmDot label="LL" active={data.ALM_LL_ACT} color="red" />}
          {config.ALM_L_LIM !== 0 && <AlarmDot label="L" active={data.ALM_L_ACT} color="yellow" />}
          {config.ALM_H_LIM !== 0 && <AlarmDot label="H" active={data.ALM_H_ACT} color="yellow" />}
          {config.ALM_HH_LIM !== 0 && <AlarmDot label="HH" active={data.ALM_HH_ACT} color="red" />}
        </div>

        {/* Unit Input Row */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="text-xs font-medium text-muted-foreground">Area:</span>
          <input
            type="text"
            value={config.UNIT || "U-505"}
            readOnly
            className={cn(
              "px-2 py-1 rounded text-sm font-mono",
              "bg-gray-400 text-black border border-gray-500",
              "min-w-[120px] text-center cursor-default"
            )}
          />
        </div>

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-border/30">
          <ToolbarButton icon={<Settings size={14} />} title="Sensor Details" to={getRouteForSensor('faceplate-3a', sensorId)} />
          <ToolbarButton icon={<History size={14} />} title="Primary Control" to={getRouteForSensor('faceplate-3b', sensorId)} />
          <ToolbarButton icon={<Activity size={14} />} title="Trend" to={getRouteForSensor('faceplate-3c', sensorId)} />
          <ToolbarButton icon={<Link2 size={14} />} title="Control Studio" to={getRouteForSensor('faceplate-3d', sensorId)} />
          <ToolbarButton icon={<Sliders size={14} />} title="Sensor Input" to={getRouteForSensor('faceplate-3e', sensorId)} />
          <ToolbarButton icon={<Bell size={14} />} title="Acknowledge Alarm" to={getRouteForSensor('faceplate-3f', sensorId)} />
        </div>
      </div>
    </div>
  );
};

// Alarm Dot Component
const AlarmDot = ({
  label,
  active,
  color
}: {
  label: string;
  active: boolean;
  color: 'red' | 'yellow';
}) => (
  <div className="flex flex-col items-center">
    <div className={cn(
      "w-5 h-5 rounded-full border-2 transition-all duration-200",
      active 
        ? color === 'red' 
          ? "bg-red-500 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.6)]" 
          : "bg-yellow-400 border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)]"
        : "bg-muted border-border"
    )} />
    <span className="text-[9px] text-muted-foreground mt-0.5">{label}</span>
  </div>
);

// Toolbar Button Component
const ToolbarButton = ({
  icon,
  title,
  to
}: {
  icon: React.ReactNode;
  title: string;
  to: string;
}) => (
  <Link 
    href={to}
    title={title} 
    className={cn(
      "w-8 h-8 flex items-center justify-center rounded",
      "bg-card hover:bg-muted",
      "text-muted-foreground hover:text-foreground transition-colors",
      "border border-border/50"
    )}
  >
    {icon}
  </Link>
);
