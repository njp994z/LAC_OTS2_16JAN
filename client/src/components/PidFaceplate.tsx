import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PidFaceplateProps {
  title: string;
  tagName: string;
  subtitle?: string;
  processVariable: number;
  setpoint: number;
  output: number;
  pvUnit: string;
  pvMin: number;
  pvMax: number;
  outputMin?: number;
  outputMax?: number;
  mode: "AUTO" | "MAN";
  onSetpointChange: (value: number) => void;
  onModeChange?: (mode: "AUTO" | "MAN") => void;
  onOutputChange?: (value: number) => void;
  children: React.ReactNode;
}

export function PidFaceplate({
  title,
  tagName,
  subtitle = "Self-regulating process.",
  processVariable,
  setpoint,
  output,
  pvUnit,
  pvMin,
  pvMax,
  outputMin = 0,
  outputMax = 100,
  mode,
  onSetpointChange,
  onModeChange,
  onOutputChange,
  children,
}: PidFaceplateProps) {
  const [open, setOpen] = useState(false);
  const [localSetpoint, setLocalSetpoint] = useState(setpoint.toString());
  const [localOutput, setLocalOutput] = useState(output.toString());

  useEffect(() => {
    setLocalSetpoint(setpoint.toString());
  }, [setpoint]);

  useEffect(() => {
    setLocalOutput(output.toString());
  }, [output]);

  const handleSetpointSubmit = () => {
    const newValue = parseFloat(localSetpoint);
    if (!isNaN(newValue) && newValue >= pvMin && newValue <= pvMax) {
      onSetpointChange(newValue);
    }
  };

  const handleOutputSubmit = () => {
    if (mode === "MAN" && onOutputChange) {
      const newValue = parseFloat(localOutput);
      if (!isNaN(newValue) && newValue >= outputMin && newValue <= outputMax) {
        onOutputChange(newValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, submitFn: () => void) => {
    if (e.key === "Enter") {
      submitFn();
    }
  };

  const pvPercentage = Math.min(100, Math.max(0, ((processVariable - pvMin) / (pvMax - pvMin)) * 100));
  const outputPercentage = Math.min(100, Math.max(0, ((output - outputMin) / (outputMax - outputMin)) * 100));
  const spPercentage = Math.min(100, Math.max(0, ((setpoint - pvMin) / (pvMax - pvMin)) * 100));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[320px] bg-[#c0c0c0] border-2 border-[#808080] p-0 gap-0 shadow-xl"
        data-testid="dialog-pid-faceplate"
      >
        {/* Blue header */}
        <DialogHeader className="bg-[#000080] text-white px-3 py-1.5">
          <DialogTitle className="text-sm font-bold" data-testid="text-faceplate-title">
            Faceplate
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-3 space-y-2 bg-[#c0c0c0]">
          {/* Tag name and subtitle */}
          <div className="text-center border-b border-gray-400 pb-2">
            <h2 className="text-xl font-bold text-black font-mono tracking-wide" data-testid="text-faceplate-tagname">
              {tagName}
            </h2>
            <p className="text-xs text-gray-700 italic" data-testid="text-faceplate-subtitle">{subtitle}</p>
          </div>

          {/* Digital displays - OUTPUT and SP */}
          <div className="flex justify-center gap-3">
            <div 
              className="bg-[#001040] text-[#00ffff] font-mono text-lg font-bold text-center py-1 px-4 border border-gray-600 min-w-[80px]"
              data-testid="text-faceplate-output-display"
            >
              {output.toFixed(1)}
            </div>
            <div 
              className="bg-[#001040] text-[#00ffff] font-mono text-lg font-bold text-center py-1 px-4 border border-gray-600 min-w-[80px]"
              data-testid="text-faceplate-sp-display"
            >
              {setpoint.toFixed(1)}
            </div>
          </div>

          {/* Scale labels */}
          <div className="flex justify-center gap-3 text-[10px] text-gray-700">
            <div className="min-w-[80px] text-center">
              <span className="mr-1">%</span>
              <span>{outputMax.toFixed(1)}</span>
            </div>
            <div className="min-w-[80px] text-center">
              <span className="mr-1">{pvUnit}</span>
              <span>{pvMax.toFixed(1)}</span>
            </div>
          </div>

          {/* Main content: Mode buttons + Bar graphs */}
          <div className="flex gap-2">
            {/* Left side - Mode buttons */}
            <div className="flex flex-col gap-1 w-16">
              <Button
                onClick={() => onModeChange?.("AUTO")}
                variant="outline"
                size="sm"
                className={cn(
                  "h-6 text-[10px] font-bold border border-gray-600 rounded-none",
                  mode === "AUTO" 
                    ? "bg-black text-white" 
                    : "bg-[#c0c0c0] text-black"
                )}
                data-testid="button-faceplate-auto"
              >
                AUTO
              </Button>
              <Button
                onClick={() => onModeChange?.("MAN")}
                variant="outline"
                size="sm"
                className={cn(
                  "h-6 text-[10px] font-bold border border-gray-600 rounded-none",
                  mode === "MAN" 
                    ? "bg-black text-white" 
                    : "bg-[#c0c0c0] text-black"
                )}
                data-testid="button-faceplate-man"
              >
                MAN
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] font-bold border border-gray-600 rounded-none bg-[#c0c0c0] text-black"
                data-testid="button-faceplate-mode"
              >
                Mode...
              </Button>
              
              {/* RAISE/LOWER buttons - only active in MAN mode */}
              <div className="mt-2 space-y-1">
                <Button
                  onClick={() => {
                    if (mode === "MAN" && onOutputChange) {
                      const newOutput = Math.min(outputMax, output + 1);
                      onOutputChange(newOutput);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  disabled={mode !== "MAN"}
                  className={cn(
                    "h-6 text-[9px] font-bold border border-gray-600 rounded-none",
                    mode === "MAN"
                      ? "bg-[#e0e0e0] text-black hover:bg-[#d0d0d0]"
                      : "bg-[#a0a0a0] text-gray-500 cursor-not-allowed"
                  )}
                  data-testid="button-faceplate-raise"
                >
                  RAISE
                </Button>
                <Button
                  onClick={() => {
                    if (mode === "MAN" && onOutputChange) {
                      const newOutput = Math.max(outputMin, output - 1);
                      onOutputChange(newOutput);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  disabled={mode !== "MAN"}
                  className={cn(
                    "h-6 text-[9px] font-bold border border-gray-600 rounded-none",
                    mode === "MAN"
                      ? "bg-[#e0e0e0] text-black hover:bg-[#d0d0d0]"
                      : "bg-[#a0a0a0] text-gray-500 cursor-not-allowed"
                  )}
                  data-testid="button-faceplate-lower"
                >
                  LOWER
                </Button>
              </div>
              
              {/* Mode status displays */}
              <div className="mt-2 space-y-1">
                <div className="bg-black text-white text-[9px] font-bold text-center py-0.5 border border-gray-600">
                  {mode}
                </div>
                <div className="bg-white text-black text-[9px] font-bold text-center py-0.5 border border-gray-600">
                  {mode}
                </div>
              </div>
            </div>

            {/* Right side - Bar graphs */}
            <div className="flex-1 flex gap-2 justify-center">
              {/* OUTPUT bar */}
              <div className="flex flex-col items-center">
                <div className="relative w-10 h-44 bg-white border-2 border-black">
                  {/* Scale marks */}
                  <div className="absolute -left-1 top-0 w-1 h-px bg-black" />
                  <div className="absolute -left-1 top-1/4 w-1 h-px bg-black" />
                  <div className="absolute -left-1 top-1/2 w-1 h-px bg-black" />
                  <div className="absolute -left-1 top-3/4 w-1 h-px bg-black" />
                  <div className="absolute -left-1 bottom-0 w-1 h-px bg-black" />
                  
                  {/* Output bar fill - cyan */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-[#00bfbf] transition-all duration-300"
                    style={{ height: `${outputPercentage}%` }}
                    data-testid="bar-faceplate-output"
                  />
                  
                  {/* Triangular pointer on left side */}
                  <div 
                    className="absolute -left-3 w-0 h-0 transition-all duration-300"
                    style={{ 
                      bottom: `calc(${outputPercentage}% - 4px)`,
                      borderTop: '4px solid transparent',
                      borderBottom: '4px solid transparent',
                      borderLeft: '6px solid #006060'
                    }}
                  />
                </div>
                <div className="text-[9px] text-gray-700 mt-0.5">{outputMin.toFixed(1)}</div>
              </div>

              {/* PV bar */}
              <div className="flex flex-col items-center">
                <div className="relative w-10 h-44 bg-white border-2 border-black">
                  {/* Scale marks */}
                  <div className="absolute -right-1 top-0 w-1 h-px bg-black" />
                  <div className="absolute -right-1 top-1/4 w-1 h-px bg-black" />
                  <div className="absolute -right-1 top-1/2 w-1 h-px bg-black" />
                  <div className="absolute -right-1 top-3/4 w-1 h-px bg-black" />
                  <div className="absolute -right-1 bottom-0 w-1 h-px bg-black" />
                  
                  {/* PV bar fill - yellow */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-[#ffff00] transition-all duration-300"
                    style={{ height: `${pvPercentage}%` }}
                    data-testid="bar-faceplate-pv"
                  />
                  
                  {/* Setpoint indicator - triangle with value */}
                  <div 
                    className="absolute -right-16 flex items-center gap-0.5 transition-all duration-300"
                    style={{ bottom: `calc(${spPercentage}% - 8px)` }}
                  >
                    <div 
                      className="w-0 h-0"
                      style={{ 
                        borderTop: '6px solid transparent',
                        borderBottom: '6px solid transparent',
                        borderRight: '8px solid white'
                      }}
                    />
                    <div className="bg-black text-white text-[10px] font-mono px-1 py-0.5">
                      {setpoint.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="text-[9px] text-gray-700 mt-0.5">{pvMin.toFixed(1)}</div>
              </div>
            </div>
          </div>

          {/* Alarm indicators row */}
          <div className="flex justify-center gap-2 pt-2 border-t border-gray-400">
            {["LL", "L", "D↓", "O↓", "H", "HH"].map((label) => (
              <div key={label} className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full border-2 border-gray-500 bg-[#d0d0d0] shadow-inner" />
                <span className="text-[8px] text-gray-600 mt-0.5">{label}</span>
              </div>
            ))}
          </div>

          {/* Bottom toolbar */}
          <div className="flex justify-center gap-1 pt-2 border-t border-gray-400">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i} 
                className="w-7 h-7 bg-[#e0e0e0] border border-gray-500 flex items-center justify-center"
              >
                <div className="w-4 h-4 bg-gradient-to-br from-gray-300 to-gray-500 rounded-sm" />
              </div>
            ))}
          </div>

          {/* Title at bottom */}
          <div className="text-center pt-1">
            <p className="text-[9px] text-gray-600">{title}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface FaceplateButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tagName: string;
  value: number;
  unit?: string;
  testId?: string;
}

export const FaceplateButton = React.forwardRef<HTMLButtonElement, FaceplateButtonProps>(
  ({ tagName, value, unit, className, testId, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn(
          "h-auto py-0 px-[5px] bg-[#98999b] hover:bg-[#888990] text-[#07080a] border-4 border-[#1060aa] shadow-lg",
          "flex flex-col items-center gap-0.5 font-bold text-[12px]",
          className
        )}
        data-testid={testId}
        {...props}
      >
        <span className="text-[10px] font-semibold">{tagName}</span>
        <span className="font-mono text-[12px]">{value.toFixed(0)}{unit ? ` ${unit}` : ''}</span>
      </Button>
    );
  }
);
FaceplateButton.displayName = "FaceplateButton";
