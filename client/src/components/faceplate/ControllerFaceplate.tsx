import { cn } from '@/lib/utils';
import type { ControllerData } from '@/types/controller';

interface ControllerFaceplateProps {
  data: ControllerData;
  onSelect?: () => void;
}

export function ControllerFaceplate({ data, onSelect }: ControllerFaceplateProps) {
  const pvPercentage = Math.min(100, Math.max(0, ((data.pv - data.pvMin) / (data.pvMax - data.pvMin)) * 100));
  const outPercentage = Math.min(100, Math.max(0, ((data.out - data.outMin) / (data.outMax - data.outMin)) * 100));
  const spPercentage = Math.min(100, Math.max(0, ((data.sp - data.pvMin) / (data.pvMax - data.pvMin)) * 100));

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'AUTO': return 'text-green-400';
      case 'MAN': return 'text-yellow-400';
      case 'CAS': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative w-72 bg-gradient-to-b from-[#1a1a2e] to-[#16162a] rounded-lg overflow-hidden",
        "border border-[#2a2a4a] shadow-2xl cursor-pointer",
        "transition-all duration-200 hover:border-primary/50 hover:shadow-primary/20",
        data.alarmActive && "border-red-500 animate-pulse"
      )}
      data-testid={`faceplate-${data.instrumentTag}`}
    >
      {/* Header */}
      <div className={cn(
        "px-4 py-2 border-b border-[#2a2a4a]",
        "bg-gradient-to-r from-[#1e1e3f] to-[#252550]"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-cyan-400 font-mono tracking-wider">
              {data.instrumentTag}
            </h3>
            <p className="text-xs text-gray-400 truncate max-w-[180px]">
              {data.description}
            </p>
          </div>
          <div className={cn(
            "px-2 py-1 rounded text-xs font-bold",
            "bg-black/40 border",
            data.mode === 'AUTO' && "border-green-500/50 text-green-400",
            data.mode === 'MAN' && "border-yellow-500/50 text-yellow-400",
            data.mode === 'CAS' && "border-cyan-500/50 text-cyan-400"
          )}>
            {data.mode}
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex justify-center gap-3 py-2 border-b border-[#2a2a4a] bg-black/20">
        <StatusIndicator 
          label="ALM" 
          active={data.alarmActive} 
          color="red" 
        />
        <StatusIndicator 
          label="ILK" 
          active={data.interlockActive} 
          color="amber" 
        />
        <StatusIndicator 
          label="MAN" 
          active={data.manualMode} 
          color="blue" 
        />
      </div>

      {/* Digital displays */}
      <div className="grid grid-cols-3 gap-2 p-3">
        <DigitalDisplay label="PV" value={data.pv} unit={data.pvUnit} />
        <DigitalDisplay label="SP" value={data.sp} unit={data.pvUnit} />
        <DigitalDisplay label="OUT" value={data.out} unit={data.outUnit} />
      </div>

      {/* Bar graphs */}
      <div className="px-4 pb-4">
        <div className="flex gap-4 justify-center">
          {/* PV Bar */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 mb-1">PV</span>
            <div className="relative w-8 h-32 bg-black/60 border border-[#3a3a5a] rounded overflow-hidden">
              <div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-yellow-500 to-yellow-400 transition-all duration-500"
                style={{ height: `${pvPercentage}%` }}
              />
              {/* SP indicator line */}
              <div 
                className="absolute left-0 right-0 h-0.5 bg-white shadow-lg transition-all duration-500"
                style={{ bottom: `${spPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500 mt-1">{data.pvUnit}</span>
          </div>

          {/* OUT Bar */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 mb-1">OUT</span>
            <div className="relative w-8 h-32 bg-black/60 border border-[#3a3a5a] rounded overflow-hidden">
              <div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500 to-cyan-400 transition-all duration-500"
                style={{ height: `${outPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500 mt-1">{data.outUnit}</span>
          </div>
        </div>

        {/* Scale labels */}
        <div className="flex justify-center gap-4 mt-2">
          <div className="text-[9px] text-gray-500 w-8 text-center">
            {data.pvMin}-{data.pvMax}
          </div>
          <div className="text-[9px] text-gray-500 w-8 text-center">
            {data.outMin}-{data.outMax}
          </div>
        </div>
      </div>

      {/* Footer with mode buttons */}
      <div className="flex border-t border-[#2a2a4a] bg-black/30">
        <ModeButton label="AUTO" active={data.mode === 'AUTO'} color="green" />
        <ModeButton label="MAN" active={data.mode === 'MAN'} color="yellow" />
        <ModeButton label="CAS" active={data.mode === 'CAS'} color="cyan" />
      </div>
    </div>
  );
}

function StatusIndicator({ label, active, color }: { label: string; active: boolean; color: string }) {
  const colorClasses = {
    red: active ? 'bg-red-500 shadow-red-500/50' : 'bg-red-900/30',
    amber: active ? 'bg-amber-500 shadow-amber-500/50' : 'bg-amber-900/30',
    blue: active ? 'bg-blue-500 shadow-blue-500/50' : 'bg-blue-900/30',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn(
        "w-3 h-3 rounded-full transition-all duration-300",
        colorClasses[color as keyof typeof colorClasses],
        active && "shadow-lg"
      )} />
      <span className="text-[9px] text-gray-500">{label}</span>
    </div>
  );
}

function DigitalDisplay({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] text-gray-400 mb-1">{label}</span>
      <div className="bg-black/60 border border-[#3a3a5a] rounded px-2 py-1 min-w-[60px] text-center">
        <span className="text-cyan-400 font-mono text-sm font-bold">
          {value.toFixed(1)}
        </span>
      </div>
      <span className="text-[9px] text-gray-500 mt-0.5">{unit}</span>
    </div>
  );
}

function ModeButton({ label, active, color }: { label: string; active: boolean; color: string }) {
  const colorClasses = {
    green: active ? 'bg-green-600/30 text-green-400 border-green-500/50' : 'text-gray-500 border-transparent',
    yellow: active ? 'bg-yellow-600/30 text-yellow-400 border-yellow-500/50' : 'text-gray-500 border-transparent',
    cyan: active ? 'bg-cyan-600/30 text-cyan-400 border-cyan-500/50' : 'text-gray-500 border-transparent',
  };

  return (
    <button className={cn(
      "flex-1 py-2 text-xs font-bold border-t-2 transition-all duration-200",
      "hover:bg-white/5",
      colorClasses[color as keyof typeof colorClasses]
    )}>
      {label}
    </button>
  );
}
