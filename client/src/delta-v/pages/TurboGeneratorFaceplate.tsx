import { useState } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { PrimaryTurboGeneratorFaceplate } from "@/delta-v/components/faceplate/PrimaryTurboGeneratorFaceplate";
import { TurboGeneratorVFDFaceplate } from "@/delta-v/components/faceplate/TurboGeneratorVFDFaceplate";
import { useCompressor } from "@/delta-v/contexts/CompressorContext";
import { TurboGeneratorProvider, useTurboGenerator } from "@/delta-v/contexts/TurboGeneratorContext";

const TurboGeneratorContent = () => {
  const { config } = useTurboGenerator();
  
  // Use shared compressor context (reusing for turbo generator)
  const {
    compressorData,
    handleStart,
    handleStop,
    handleModeChange,
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
            {config.tagName} {config.description}
          </h1>
          <p className="text-muted-foreground mt-2">
            Turbo Generator Control Interface
          </p>
        </div>

        {/* Faceplates Container */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Primary Turbo Generator Faceplate - Equipment Graphic */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Equipment Overview
            </h2>
            <PrimaryTurboGeneratorFaceplate data={compressorData} />
          </div>

          {/* Secondary Turbo Generator Faceplate - Control Interface */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Generator Control Panel
            </h2>
            <TurboGeneratorVFDFaceplate
              data={compressorData}
              onStart={handleStart}
              onStop={handleStop}
              onModeChange={handleModeChange}
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

const TurboGeneratorFaceplate = () => {
  return (
    <TurboGeneratorProvider>
      <TurboGeneratorContent />
    </TurboGeneratorProvider>
  );
};

export default TurboGeneratorFaceplate;
