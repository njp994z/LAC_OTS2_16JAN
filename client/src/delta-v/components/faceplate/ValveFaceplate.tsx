import { cn } from '@/lib/utils';
import type { ControllerData } from '@/delta-v/types/controller';
import { Check, X } from 'lucide-react';
import valveImage from '@assets/delta-v/icons/open-valve-dark.png';
import alarmIndicatorBlue from '@assets/delta-v/icons/alarm-indicator-blue.png';
import outputPathArrow from '@assets/delta-v/icons/output-path-arrow.png';
import deviceAlarmPurple from '@assets/delta-v/icons/device-alarm-purple.png';
import lockOpenCyan from '@assets/delta-v/icons/lock-open-cyan.png';
import moduleNotRunning from '@assets/delta-v/icons/module-not-running.png';
import noSymbol from '@assets/delta-v/icons/no-symbol.png';

interface ValveFaceplateProps {
  data: ControllerData;
  className?: string;
  onSelect?: () => void;
  isTransparent?: boolean;
  deviceAlarmActive?: boolean;
  valveImageSrc?: string;
}

export const ValveFaceplate = ({ 
  data, 
  className, 
  onSelect, 
  isTransparent = false,
  deviceAlarmActive = false,
  valveImageSrc
}: ValveFaceplateProps) => {
  const isCriticalAlarm = data.alarmColor === 'red' && data.alarmActive;
  const isWarningAlarm = data.alarmColor === 'yellow' && data.alarmActive;
  const isNormalState = !isCriticalAlarm && !isWarningAlarm;

  // Determine alarm circle style
  const getAlarmCircleStyle = () => {
    if (isCriticalAlarm) {
      return { bg: 'bg-red-500', icon: <X className="w-3 h-3 text-white" /> };
    }
    if (isWarningAlarm) {
      return { bg: 'bg-yellow-500', icon: <X className="w-3 h-3 text-black" /> };
    }
    return { bg: 'bg-green-600', icon: <Check className="w-3 h-3 text-white" /> };
  };

  const alarmCircle = getAlarmCircleStyle();

  return (
    <div 
      className={cn(
        isTransparent ? "faceplate-container-transparent" : "faceplate-container",
        "p-0.5 cursor-pointer select-none",
        "transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-2xl hover:shadow-faceplate-border/20",
        "w-[100px]",
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
      <div className="text-center py-0 px-0.5">
        <span className={cn(
          "font-mono font-bold text-xs tracking-wide",
          isTransparent ? "text-black" : "text-faceplate-border glow-text"
        )}>
          {data.instrumentTag}
        </span>
        <p className={cn("text-[9px]", isTransparent ? "text-black font-semibold" : "text-muted-foreground")}>
          {data.description}
        </p>
      </div>

      {/* Main Faceplate Inner Area */}
      <div className={cn(
        isTransparent ? "faceplate-inner-light" : "faceplate-inner",
        "p-0 space-y-0"
      )}>
        {/* Row 1: Alarm Circle + No Symbol + Interlock Diamond */}
        <div className="flex items-center justify-between pl-0 pr-2 relative z-20 translate-y-3">
          <div className="flex items-center gap-1">
            {/* Alarm Circle */}
            {(data.showAlarmCircle !== false) && (
              <div className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 shadow-md',
                alarmCircle.bg
              )}>
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            )}

            {/* No Symbol */}
            {(data.showNoSymbol !== false) && (
              <img 
                src={noSymbol} 
                alt="No Symbol" 
                className="w-4 h-4 object-contain flex-shrink-0"
              />
            )}
          </div>

          {/* Interlock Diamond - Right side */}
          {(data.showInterlockDiamond !== false) && (
            <div className={cn(
              'w-4 h-4 rotate-45 flex items-center justify-center flex-shrink-0',
              data.interlockActive ? 'bg-red-600' : 'bg-slate-600'
            )}>
              <span className={cn(
                '-rotate-45 text-[8px] font-bold',
                data.interlockActive ? 'text-white' : 'text-slate-400'
              )}>
                I
              </span>
            </div>
          )}
        </div>

        {/* Row 2: Valve Image (centered, large) */}
        <div className="flex justify-center relative z-10 -translate-y-2">
          <div className="w-16 h-14 overflow-hidden flex items-center justify-center">
            <img 
              src={valveImageSrc || valveImage} 
              alt="Valve" 
              className="w-16 h-16 object-cover object-center"
            />
          </div>
        </div>

        {/* Row 3: Blue Alarm + Hold/Device Alarm + DA + Lock + Output Path */}
        <div className="flex items-center justify-center gap-0 relative z-20 -translate-y-4">
          {/* Blue "!!" Alarm Indicator */}
          {(data.showBlueAlarmIndicator !== false) && (
            <img 
              src={alarmIndicatorBlue} 
              alt="Alarm Indicator" 
              className="w-4 h-4 object-contain"
            />
          )}

          {/* Bad IO / Module Status Indicator Stack */}
          <div className="relative w-4 h-4 flex-shrink-0">
            {/* Bad IO Indications - Purple X (base layer) */}
            {(data.showBadIOIndicator !== false) && (
              <img 
                src={deviceAlarmPurple} 
                alt="Bad IO Indications" 
                className="w-4 h-4 object-contain"
              />
            )}
            {/* Module Not Running - Orange bars (overlay) */}
            {(data.showModuleNotRunning !== false) && (
              <img 
                src={moduleNotRunning} 
                alt="Module Not Running" 
                className="absolute inset-0 w-4 h-4 object-contain"
              />
            )}
          </div>

          {/* Valve Type Label */}
          {(data.showValveTypeLabel !== false) && (
            <span className={cn(
              "text-[9px] font-bold leading-none",
              isTransparent ? "text-slate-600" : "text-slate-400"
            )}>
              {data.valveTypeAction || 'DA'}
            </span>
          )}

          {/* Lock Icon */}
          {(data.showLockIndicator !== false) && (
            <img 
              src={lockOpenCyan} 
              alt={data.deviceLocked ? "Locked" : "Unlocked"} 
              className="w-4 h-4 object-contain"
            />
          )}

          {/* Output Path Arrow */}
          {(data.showOutputPathIndicator !== false) && (
            <img 
              src={outputPathArrow} 
              alt="Output Path" 
              className="w-4 h-4 object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
};
