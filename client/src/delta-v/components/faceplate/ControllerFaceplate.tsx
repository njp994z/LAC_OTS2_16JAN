import { cn } from '@/lib/utils';
import type { ControllerData, ControllerMode } from '@/delta-v/types/controller';
import { Check, X, Lock, Unlock } from 'lucide-react';
import { RangeBar } from './RangeBar';
import { OutBarDisplay } from './OutBarDisplay';
import { useControllerConfig } from '@/delta-v/contexts/ControllerConfigContext';

// Map mode to two-letter DeltaV abbreviation
const modeAbbreviation: Record<ControllerMode, string> = {
  MAN: 'MA',
  AUTO: 'AU',
  CAS: 'CA',
  RCAS: 'RC',
  ROUT: 'RO',
  LO: 'LO',
  BYPASS: 'BY',
};

// Mode display config for badge styling
const modeConfig: Record<ControllerMode, { bg: string; text: string }> = {
  AUTO: { bg: 'bg-green-500', text: 'text-white' },
  MAN: { bg: 'bg-orange-500', text: 'text-white' },
  CAS: { bg: 'bg-blue-500', text: 'text-white' },
  RCAS: { bg: 'bg-cyan-400', text: 'text-white' },
  ROUT: { bg: 'bg-amber-500', text: 'text-white' },
  LO: { bg: 'bg-gray-500', text: 'text-white' },
  BYPASS: { bg: 'bg-purple-500', text: 'text-white' },
};

interface ControllerFaceplateProps {
  data: ControllerData;
  className?: string;
  onSelect?: () => void;
  isTransparent?: boolean;
  showAlarmLimits?: boolean;
  controllerId?: string;
}

export const ControllerFaceplate = ({ data, className, onSelect, isTransparent = false, showAlarmLimits = true, controllerId }: ControllerFaceplateProps) => {
  const { getControllerConfig } = useControllerConfig();
  
  // Get config from context if controllerId is provided, for dynamic TAGNAME/DESC
  const config = controllerId ? getControllerConfig(controllerId) : null;
  
  // Use config values if available, otherwise fall back to data props
  const displayTag = config?.TAGNAME || data.instrumentTag;
  const displayDesc = config?.DESC || data.description;
  
  const isCriticalAlarm = data.alarmColor === 'red' && data.alarmActive;
  const isWarningAlarm = data.alarmColor === 'yellow' && data.alarmActive;
  const isNormalState = !isCriticalAlarm && !isWarningAlarm;
  
  const currentModeConfig = modeConfig[data.mode] || modeConfig.AUTO;

  // Determine alarm circle style
  const getAlarmCircleStyle = () => {
    if (isCriticalAlarm) {
      return { bg: 'bg-red-500', icon: <X className="w-5 h-5 text-white" /> };
    }
    if (isWarningAlarm) {
      return { bg: 'bg-yellow-500', icon: <X className="w-5 h-5 text-black" /> };
    }
    return { bg: 'bg-green-600', icon: <Check className="w-5 h-5 text-white" /> };
  };

  const alarmCircle = getAlarmCircleStyle();
  const pvOk = data.pvStatus === 'OK' || !data.alarmActive;
  const outOk = !data.alarmActive;

  return (
    <div 
      className={cn(
        isTransparent ? "faceplate-container-transparent" : "faceplate-container",
        "p-1.5 cursor-pointer select-none",
        "transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-2xl hover:shadow-faceplate-border/20",
        "w-[210px]",
        isCriticalAlarm && [
          "ring-4 ring-red-500",
          "shadow-[0_0_20px_rgba(239,68,68,0.6),0_0_40px_rgba(239,68,68,0.3)]",
          "border-red-500"
        ],
        isWarningAlarm && [
          "ring-4 ring-yellow-400",
          "shadow-[0_0_20px_rgba(250,204,21,0.6),0_0_40px_rgba(250,204,21,0.3)]",
          "border-yellow-400"
        ],
        isNormalState && [
          "ring-4 ring-green-500",
          "shadow-[0_0_20px_rgba(34,197,94,0.6),0_0_40px_rgba(34,197,94,0.3)]",
          "border-green-500"
        ],
        className
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="text-center py-0.5 px-1.5">
        <span className={cn(
          "font-mono font-bold text-xs tracking-wide",
          isTransparent ? "text-black" : "text-faceplate-border glow-text"
        )}>
          {displayTag}
        </span>
        <p className={cn("text-[9px]", isTransparent ? "text-black font-semibold" : "text-muted-foreground")}>
          {displayDesc}
        </p>
      </div>

      {/* Main Faceplate Inner Area */}
      <div className={cn(
        isTransparent ? "faceplate-inner-light" : "faceplate-inner",
        "p-1.5 space-y-1.5"
      )}>
        {/* Alarm Circle + Range Bar Row */}
        <div className="flex items-center gap-2">
          {/* Large Alarm Circle */}
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg',
            alarmCircle.bg
          )}>
            {alarmCircle.icon}
          </div>

          {/* Range Bar */}
          <div className="flex-1 max-w-[125px]">
            <RangeBar 
              pvValue={data.pv}
              outValue={data.out}
              setpoint={data.sp}
              min={data.pvRangeMin}
              max={data.pvRangeMax}
              showSetpointMarker={true}
              staticOutBar={false}
              alarmLL={data.alarmLL}
              alarmL={data.alarmL}
              alarmH={data.alarmH}
              alarmHH={data.alarmHH}
              isTransparent={isTransparent}
              alarmActive={data.alarmActive}
              alarmColor={data.alarmColor}
              units={data.pvUnits}
              showAlarmLimits={showAlarmLimits}
            />
          </div>
        </div>

        {/* Mode + Lock + PV Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Fixed-width indicator column */}
            <div className="flex items-center gap-1 w-[42px] flex-shrink-0">
              {/* Mode Badge */}
              <div className={cn(
                'px-1.5 py-0.5 rounded text-[9px] font-bold shadow-md',
                currentModeConfig.bg,
                currentModeConfig.text
              )}>
                {modeAbbreviation[data.mode] || data.mode}
              </div>
              
              {/* Lock Icon - conditionally rendered */}
              {(data.showLockIndicator !== false) && (
                <div className={isTransparent ? "text-slate-600" : "text-slate-400"}>
                  {data.deviceLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Unlock className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
              )}
            </div>

            {/* PV Label + Value */}
            <span className={cn("inline-block text-[9px] w-[28px] text-right", isTransparent ? "text-slate-700" : "text-slate-400")}>PV:</span>
            <div className="bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[9px] font-mono font-bold min-w-[50px] text-center shadow-md">
              {data.pv.toFixed(1)}{data.pvUnits}
            </div>
          </div>

          {/* PV Status - right side of row */}
          <div className="flex items-center gap-0.5 ml-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              pvOk ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span className={cn(
              'text-[9px]',
              pvOk ? 'text-green-400' : 'text-red-400'
            )}>
              PV {pvOk ? 'OK' : 'BAD'}
            </span>
          </div>
        </div>

        {/* Indicators + SP Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Fixed-width indicator column */}
            <div className="flex items-center gap-1 w-[42px] flex-shrink-0">
              {/* Interlock Indicator - conditionally rendered */}
              {(data.showInterlockIndicator !== false) && (
                <div className={cn(
                  'w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-bold',
                  data.interlockActive ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-500'
                )}>
                  I
                </div>
              )}
              
              {/* Hold Indicator - conditionally rendered */}
              {(data.showHoldIndicator !== false) && (
                <div className={cn(
                  'w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-bold',
                  data.holdActive ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-500'
                )}>
                  H
                </div>
              )}
            </div>

            {/* SP Label + Value */}
            <span className={cn("inline-block text-[9px] w-[28px] text-right", isTransparent ? "text-slate-700" : "text-slate-400")}>SP:</span>
            <div className="bg-white text-black px-1.5 py-0.5 rounded text-[9px] font-mono font-bold min-w-[50px] text-center shadow-md border border-gray-300">
              {data.sp.toFixed(1)}{data.pvUnits}
            </div>
          </div>

          {/* Interlock Diamond - conditionally rendered */}
          {(data.showInterlockDiamond !== false) && (
            <div className="flex justify-end ml-auto">
              <div className={cn(
                'w-4 h-4 rotate-45 flex items-center justify-center',
                data.interlockActive ? 'bg-red-600' : 'bg-slate-600'
              )}>
                <span className={cn(
                  '-rotate-45 text-[8px] font-bold',
                  data.interlockActive ? 'text-white' : 'text-slate-400'
                )}>
                  I
                </span>
              </div>
            </div>
          )}
        </div>

        {/* OUT Bar Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Fixed-width spacer to match indicator columns */}
            <div className="w-[42px] flex-shrink-0" />
            <span className={cn("inline-block text-[9px] w-[28px] text-right", isTransparent ? "text-slate-700" : "text-slate-400")}>OUT:</span>
            <div className="bg-cyan-500 text-black px-1.5 py-0.5 rounded text-[9px] font-mono font-bold min-w-[50px] text-center shadow-md">
              {data.out.toFixed(1)}%
            </div>
          </div>

          {/* OUT Status - right side of row */}
          <div className="flex items-center gap-0.5 ml-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              outOk ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span className={cn(
              'text-[9px]',
              outOk ? 'text-green-400' : 'text-red-400'
            )}>
              Out {outOk ? 'OK' : 'BAD'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
