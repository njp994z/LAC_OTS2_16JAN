import { cn } from "@/lib/utils";
import type { CompressorData } from "@/delta-v/types/compressor";
import turboGeneratorEquipment from "@assets/TG_Icon1_1768332816403.png";

interface PrimaryTurboGeneratorFaceplateProps {
  data: CompressorData;
  transparentBackground?: boolean;
}

export const PrimaryTurboGeneratorFaceplate = ({ data, transparentBackground = false }: PrimaryTurboGeneratorFaceplateProps) => {
  const isRunning = data.state === "RUNNING" || data.state === "STARTING";
  const isStopped = data.state === "STOPPED" || data.state === "STOPPING";

  return (
    <div
      className={cn(
        "relative rounded border p-1.5 transition-all duration-300 w-fit",
        isRunning && "border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]",
        isStopped && "border-slate-500 shadow-[0_0_6px_rgba(100,116,139,0.3)]",
        data.failAlarm && "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
      )}
      style={{
        background: transparentBackground 
          ? "#FFFFFF" 
          : "linear-gradient(135deg, hsl(220 15% 18%) 0%, hsl(220 15% 12%) 100%)",
      }}
    >
      {/* Equipment Graphic */}
      <img 
        src={turboGeneratorEquipment} 
        alt="Turbo Generator Equipment" 
        className="w-full h-auto max-w-[200px] mx-auto"
      />

      {/* Two Blue Range Bars - Positioned under turbine and generator */}
      <div className="flex justify-end gap-6 mt-1 pr-2">
        {/* Turbine Speed Bar */}
        <div className="w-16">
          <p className={cn("text-[6px] font-mono mb-0.5", transparentBackground ? "text-cyan-600" : "text-cyan-400")}>Turbine Speed</p>
          <div className={cn("h-3 rounded border relative overflow-hidden", transparentBackground ? "bg-slate-200 border-slate-300" : "bg-slate-900 border-slate-700")}>
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
              style={{ width: `${data.speedPV}%` }}
            />
            <span className={cn("absolute inset-0 flex items-center justify-center text-[7px] font-mono z-10 font-bold", transparentBackground ? "text-slate-800" : "text-white")}>
              {data.speedPV.toFixed(0)}%
            </span>
          </div>
        </div>
        
        {/* Generator Output Bar */}
        <div className="w-16">
          <p className={cn("text-[6px] font-mono mb-0.5", transparentBackground ? "text-cyan-600" : "text-cyan-400")}>Gen Output</p>
          <div className={cn("h-3 rounded border relative overflow-hidden", transparentBackground ? "bg-slate-200 border-slate-300" : "bg-slate-900 border-slate-700")}>
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
              style={{ width: `${Math.min((data.currentPV / 50) * 100, 100)}%` }}
            />
            <span className={cn("absolute inset-0 flex items-center justify-center text-[7px] font-mono z-10 font-bold", transparentBackground ? "text-slate-800" : "text-white")}>
              {data.currentPV.toFixed(1)}MW
            </span>
          </div>
        </div>
      </div>

      {/* Tag and Status */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <div>
          <p className={cn("font-mono text-xs font-bold", transparentBackground ? "text-cyan-600" : "text-cyan-400")}>{data.tag}</p>
          <p className={cn("text-[9px]", transparentBackground ? "text-slate-600" : "text-muted-foreground")}>{data.description}</p>
        </div>
        <div
          className={cn(
            "px-1.5 py-0.5 rounded font-mono text-[9px] font-bold",
            isRunning && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50",
            isStopped && "bg-slate-500/20 text-slate-400 border border-slate-500/50",
            data.failAlarm && "bg-red-500/20 text-red-400 border border-red-500/50"
          )}
        >
          {data.state}
        </div>
      </div>
    </div>
  );
};
