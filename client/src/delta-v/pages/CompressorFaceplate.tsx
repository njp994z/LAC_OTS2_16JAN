import { useState } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { PrimaryCompressorFaceplate } from "@/delta-v/components/faceplate/PrimaryCompressorFaceplate";
import { VFDFaceplate } from "@/delta-v/components/faceplate/VFDFaceplate";
import { useCompressor } from "@/delta-v/contexts/CompressorContext";

const CompressorFaceplate = () => {
  const [vfdConfig] = useState<{
    tagName: string;
    description: string;
    unit: string;
    transparentBackground: boolean;
  }>({
    tagName: "VFD-001",
    description: "Variable Frequency Drive",
    unit: "U-505",
    transparentBackground: false,
  });

  // Use shared compressor context
  const {
    compressorData,
    handleStart,
    handleStop,
    handleModeChange,
    handleSpeedSPChange,
    handleClearAlarm,
    setPermitActive,
    setFailAlarm,
  } = useCompressor();

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/settings/controller-outputs/faceplates/rotating-equipment"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Equipment Faceplates
          </Link>

          <h1
            className={cn(
              "text-3xl md:text-4xl font-bold tracking-tight",
              "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent"
            )}
          >
            Primary Compressor Faceplate
          </h1>
          <p className="text-muted-foreground mt-2">
            Industrial VFD Motor Control Interface
          </p>
        </div>

        {/* Faceplates Container */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Primary Compressor Faceplate - Equipment Graphic */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Equipment Overview
            </h2>
            <PrimaryCompressorFaceplate data={compressorData} transparentBackground={vfdConfig?.transparentBackground ?? false} />
          </div>

          {/* Secondary VFD Faceplate - Control Interface */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              VFD Control Panel
            </h2>
            <VFDFaceplate
              data={compressorData}
              onStart={handleStart}
              onStop={handleStop}
              onModeChange={handleModeChange}
              onSpeedSPChange={handleSpeedSPChange}
              onClearAlarm={handleClearAlarm}
            />
          </div>
        </div>

        {/* Demo Controls */}
        <div className="mt-8 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
            Demo Controls
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPermitActive(!compressorData.permitActive)}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-semibold transition-all",
                compressorData.permitActive
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-700 text-slate-400"
              )}
            >
              Permit: {compressorData.permitActive ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => setFailAlarm(!compressorData.failAlarm)}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-semibold transition-all",
                compressorData.failAlarm
                  ? "bg-red-600 text-white"
                  : "bg-slate-700 text-slate-400"
              )}
            >
              Fail Alarm: {compressorData.failAlarm ? "ACTIVE" : "OFF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompressorFaceplate;
