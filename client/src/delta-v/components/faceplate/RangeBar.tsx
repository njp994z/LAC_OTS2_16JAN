import { cn } from '@/lib/utils';

interface RangeBarProps {
  pvValue: number;
  outValue: number;
  setpoint?: number;
  min: number;
  max: number;
  showSetpointMarker?: boolean;
  staticOutBar?: boolean;
  // Alarm limits for dynamic bar coloring
  alarmLL?: number;
  alarmL?: number;
  alarmH?: number;
  alarmHH?: number;
  isTransparent?: boolean;
  // Direct alarm state from parent (overrides limit-based calculation)
  alarmActive?: boolean;
  alarmColor?: 'red' | 'yellow';
  units?: string;
  // Whether to show alarm limit markers (LL, L, H, HH) - default true
  showAlarmLimits?: boolean;
  // Custom color for normal state (no alarms)
  normalBarColor?: string;
  // Controller tag name to apply specific styling
  controllerId?: string;
}

// Determine bar color based on alarm state from parent or PV value relative to alarm limits
// Colors match the faceplate silhouette: green (normal), yellow (warning), red (critical)
const getBarColor = (
  pv: number,
  limits: { ll?: number; l?: number; h?: number; hh?: number },
  alarmActive?: boolean,
  alarmColor?: 'red' | 'yellow',
  controllerId?: string
): string => {
  // If alarm state is passed from parent, use it directly (syncs with silhouette)
  if (alarmActive) {
    if (alarmColor === 'red') {
      return 'hsl(0, 84%, 60%)'; // red-500 - matches silhouette
    }
    if (alarmColor === 'yellow') {
      return 'hsl(48, 96%, 53%)'; // yellow-400 - matches silhouette
    }
  }

  const { ll, l, h, hh } = limits;

  // Critical Red - HH or LL alarm active
  if ((hh !== undefined && hh !== 0 && pv >= hh) ||
    (ll !== undefined && ll !== 0 && pv <= ll)) {
    return 'hsl(0, 84%, 60%)'; // red-500 - matches silhouette
  }

  // Warning Yellow - H or L alarm active
  if ((h !== undefined && h !== 0 && pv >= h) ||
    (l !== undefined && l !== 0 && pv <= l)) {
    return 'hsl(48, 96%, 53%)'; // yellow-400 - matches silhouette
  }

  // Normal Green - no alarms
  return 'hsl(142, 76%, 36%)'; // green-600 - matches silhouette
};

export const RangeBar = ({
  pvValue,
  outValue,
  setpoint,
  min,
  max,
  showSetpointMarker = true,
  staticOutBar = false,
  alarmLL,
  alarmL,
  alarmH,
  alarmHH,
  isTransparent = false,
  alarmActive,
  alarmColor,
  units,
  showAlarmLimits = true,
  normalBarColor,
  controllerId
}: RangeBarProps) => {
  const pvPercentage = Math.max(0, Math.min(100, ((pvValue - min) / (max - min)) * 100));
  const outPercentage = Math.max(0, Math.min(100, ((outValue - min) / (max - min)) * 100));
  const spPercentage = setpoint !== undefined
    ? Math.max(0, Math.min(100, ((setpoint - min) / (max - min)) * 100))
    : 0;

  // Calculate dynamic bar color - prioritize parent alarm state, fallback to limit calculation
  const barColor = getBarColor(pvValue, { ll: alarmLL, l: alarmL, h: alarmH, hh: alarmHH }, alarmActive, alarmColor, controllerId);

  return (
    <div className="relative overflow-visible pt-2">
      {/* Bar Track with tick marks */}
      <div className="relative overflow-visible">
        {/* Tick marks at alarm setpoint positions with labels - hide when limit = 0 or showAlarmLimits = false */}
        {showAlarmLimits && [
          { value: alarmLL, label: 'LL' },
          { value: alarmL, label: 'L' },
          { value: alarmH, label: 'H' },
          { value: alarmHH, label: 'HH' }
        ].filter(alarm => alarm.value !== undefined && alarm.value !== 0).map((alarm) => {
          const percentage = Math.max(0, Math.min(100, ((alarm.value! - min) / (max - min)) * 100));
          return (
            <div
              key={alarm.label}
              className="absolute flex flex-col items-center z-[25] pointer-events-none"
              style={{
                left: `${percentage}%`,
                top: '-12px',
                transform: 'translateX(-50%)'
              }}
            >
              <span className={cn(
                "text-[9px] font-mono font-bold mb-0.5",
                isTransparent ? "text-black" : "text-cyan-300"
              )}>{alarm.label}</span>
              <div
                className="w-[2px]"
                style={{
                  height: '24px',
                  backgroundImage: 'repeating-linear-gradient(to bottom, #334155 0px, #334155 3px, transparent 3px, transparent 6px)'
                }}
              />
            </div>
          );
        })}

        {/* Bar Track */}
        <div className="bar-track h-5">
          {/* OUT Fill - Full width bar colored by alarm state */}
          <div
            className="absolute inset-0 rounded transition-colors duration-300"
            style={{ backgroundColor: barColor }}
          />

          {/* PV Fill - Yellow bar on top (shows process variable) */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 left-0 h-2 rounded-sm",
              "transition-all duration-500 ease-out z-10"
            )}
            style={{
              width: `${pvPercentage}%`,
              background: 'linear-gradient(180deg, hsl(45, 100%, 60%) 0%, hsl(40, 100%, 45%) 100%)',
              boxShadow: '0 0 8px hsl(45 100% 55% / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.3)'
            }}
            title={`PV: ${pvValue}`}
          />

          {/* SP Marker - White with two triangles (shows setpoint) */}
          {showSetpointMarker && setpoint !== undefined && (
            <div
              className="absolute top-0 h-full flex flex-col items-center justify-center z-20"
              style={{ left: `${spPercentage}%`, transform: 'translateX(-50%)' }}
              title={`SP: ${setpoint}`}
            >
              <div className={cn(
                "w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px]",
                "border-l-transparent border-r-transparent border-t-white",
                "drop-shadow-md"
              )} />
              <div className="w-0.5 h-2 bg-white shadow-md" />
              <div className={cn(
                "w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px]",
                "border-l-transparent border-r-transparent border-b-white",
                "drop-shadow-md"
              )} />
            </div>
          )}
        </div>
      </div>

      {/* Scale markers at bottom */}
      <div className={cn(
        "flex justify-between text-[9px] font-mono mt-0.5 px-0.5",
        isTransparent ? "text-black font-bold" : "text-muted-foreground"
      )}>
        <span>{min}</span>
        <span>{max}{units ? ` ${units}` : ''}</span>
      </div>
    </div>
  );
};
