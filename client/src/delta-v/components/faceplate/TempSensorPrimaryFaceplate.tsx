import { cn } from '@/lib/utils';
import type { ControllerData } from '@/delta-v/types/controller';
import { AlarmIndicator } from './AlarmIndicator';
import { RangeBar } from './RangeBar';
import { ValueDisplay } from './ValueDisplay';
import { StatusIndicator } from './StatusIndicator';

interface TempSensorPrimaryFaceplateProps {
  data: ControllerData;
  className?: string;
  onSelect?: () => void;
  isTransparent?: boolean;
}

/**
 * Simplified Primary Faceplate for Temperature Sensors
 * Contains: Tag, description, alarm indicator, PV range bar, PV value, PV status
 * Does NOT include: Lock, Hold, Interlock, Output path indicators, SP display
 */
export const TempSensorPrimaryFaceplate = ({ 
  data, 
  className, 
  onSelect, 
  isTransparent = false 
}: TempSensorPrimaryFaceplateProps) => {
  // Check for critical alarm (HH or LL)
  const isCriticalAlarm = data.alarmColor === 'red' && data.alarmActive;
  // Check for warning alarm (H or L)
  const isWarningAlarm = data.alarmColor === 'yellow' && data.alarmActive;
  // Check for normal state (no alarms)
  const isNormalState = !isCriticalAlarm && !isWarningAlarm;

  return (
    <div 
      className="faceplate-container p-1 cursor-pointer select-none transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-faceplate-border/20 w-full h-full min-w-[160px] min-h-[120px] ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6),0_0_40px_rgba(250,204,21,0.3)] border-yellow-400 pl-[0px] pr-[0px] pt-[0px] pb-[0px]"
      onClick={onSelect}
    >
      {/* Instrument Tag Header */}
      <div className="text-center py-0.5 px-1">
        <div className="flex items-center justify-center gap-1">
          <span className={cn(
            "font-mono font-bold text-xs tracking-wide",
            isTransparent ? "text-black" : "text-faceplate-border glow-text"
          )}>
            {data.instrumentTag}
          </span>
        </div>
        <p className={cn("text-[9px]", isTransparent ? "text-black font-bold" : "text-muted-foreground")}>
          {data.description}
        </p>
      </div>
      {/* Main Faceplate Inner Area */}
      <div className={cn(
        isTransparent ? "faceplate-inner-light" : "faceplate-inner",
        "p-1.5 space-y-1"
      )}>
        {/* Alarm Indicator + Range Bar - side by side */}
        <div className="flex items-center gap-1">
          <AlarmIndicator active={data.alarmActive} type={data.alarmType} color={data.alarmColor} />
          <div className="flex-1">
            <RangeBar 
              pvValue={data.pv}
              outValue={data.out}
              setpoint={data.sp}
              min={data.pvRangeMin}
              max={data.pvRangeMax}
              showSetpointMarker={false}
              staticOutBar={true}
              alarmLL={data.alarmLL}
              alarmL={data.alarmL}
              alarmH={data.alarmH}
              alarmHH={data.alarmHH}
              isTransparent={isTransparent}
            />
          </div>
        </div>

        {/* Main content row: PV value centered with status on right */}
        <div className="flex items-center justify-between gap-1">
          {/* Spacer for alignment */}
          <div className="w-8" />

          {/* Center: PV Value Only */}
          <ValueDisplay label="" value={data.pv} units={data.pvUnits} labelColor="text-amber-400" variant="pv" />

          {/* Right: Status indicator */}
          <StatusIndicator status={data.pvStatus} label="PV" lightBackground={isTransparent} />
        </div>
      </div>
    </div>
  );
};
