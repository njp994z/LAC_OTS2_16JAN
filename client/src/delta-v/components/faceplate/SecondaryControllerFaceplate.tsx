import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { SecondaryControllerData, SecondaryControllerConfig } from '@/delta-v/types/secondaryController';
import { X, History, Settings, Activity, Link2, Sliders, Bell, ChevronUp, ChevronDown, Lock, Unlock } from 'lucide-react';
import { Link } from 'wouter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Helper function to route to independent pages for specific controllers
const getRouteForController = (basePath: string, controllerId?: string, fromSource?: string): string => {
  const deltaVPrefix = '/settings/controller-outputs/faceplates';
  const fromParam = fromSource ? `?from=${fromSource}` : '';
  
  if (controllerId === '1530-F-2602') {
    const routeMap: Record<string, string> = {
      'faceplate-3a': `${deltaVPrefix}/sulfur-flow-controller-faceplate-3a`,
      'faceplate-3b': `${deltaVPrefix}/sulfur-flow-controller-faceplate-3b`,
      'faceplate-3c': `${deltaVPrefix}/sulfur-flow-controller-faceplate-3c`,
      'faceplate-3d': `${deltaVPrefix}/sulfur-flow-controller-faceplate-3d`,
      'faceplate-3e': `${deltaVPrefix}/sulfur-flow-controller-faceplate-3e${fromParam}`,
      'faceplate-3f': `${deltaVPrefix}/sulfur-flow-controller-faceplate-3f`,
    };
    return routeMap[basePath] || `${deltaVPrefix}/${basePath}/${controllerId}`;
  }
  if (controllerId === '1540-H-4030') {
    const routeMap: Record<string, string> = {
      'faceplate-3a': `${deltaVPrefix}/hand-controller-4030-faceplate-3a`,
      'faceplate-3b': `${deltaVPrefix}/hand-controller-4030-faceplate-3b`,
      'faceplate-3c': `${deltaVPrefix}/hand-controller-4030-faceplate-3c`,
      'faceplate-3d': `${deltaVPrefix}/hand-controller-4030-faceplate-3d`,
      'faceplate-3e': `${deltaVPrefix}/hand-controller-4030-faceplate-3e${fromParam}`,
      'faceplate-3f': `${deltaVPrefix}/hand-controller-4030-faceplate-3f`,
    };
    return routeMap[basePath] || `${deltaVPrefix}/${basePath}/${controllerId}`;
  }
  if (controllerId === '1540-H-4282') {
    const routeMap: Record<string, string> = {
      'faceplate-3a': `${deltaVPrefix}/hand-controller-4282-faceplate-3a`,
      'faceplate-3b': `${deltaVPrefix}/hand-controller-4282-faceplate-3b`,
      'faceplate-3c': `${deltaVPrefix}/hand-controller-4282-faceplate-3c`,
      'faceplate-3d': `${deltaVPrefix}/hand-controller-4282-faceplate-3d`,
      'faceplate-3e': `${deltaVPrefix}/hand-controller-4282-faceplate-3e${fromParam}`,
      'faceplate-3f': `${deltaVPrefix}/hand-controller-4282-faceplate-3f`,
    };
    return routeMap[basePath] || `${deltaVPrefix}/${basePath}/${controllerId}`;
  }
  if (controllerId === '1540-H-4283') {
    const routeMap: Record<string, string> = {
      'faceplate-3a': `${deltaVPrefix}/hand-controller-4283-faceplate-3a`,
      'faceplate-3b': `${deltaVPrefix}/hand-controller-4283-faceplate-3b`,
      'faceplate-3c': `${deltaVPrefix}/hand-controller-4283-faceplate-3c`,
      'faceplate-3d': `${deltaVPrefix}/hand-controller-4283-faceplate-3d`,
      'faceplate-3e': `${deltaVPrefix}/hand-controller-4283-faceplate-3e${fromParam}`,
      'faceplate-3f': `${deltaVPrefix}/hand-controller-4283-faceplate-3f`,
    };
    return routeMap[basePath] || `${deltaVPrefix}/${basePath}/${controllerId}`;
  }
  return `${deltaVPrefix}/${basePath}${controllerId ? `/${controllerId}` : ''}`;
};

interface SecondaryControllerFaceplateProps {
  data: SecondaryControllerData;
  config: SecondaryControllerConfig;
  className?: string;
  controllerId?: string;
  onClose?: () => void;
  onModeChange?: (mode: 'AUTO' | 'MAN') => void;
  onRoutRcasChange?: (mode: 'DA' | 'ROUT' | 'RCAS') => void;
  onSpChange?: (value: number) => void;
  onOutChange?: (value: number) => void;
  onModelockOverrideChange?: (active: boolean) => void;
  onBypassChange?: (active: boolean) => void;
  isTransparent?: boolean;
  fromSource?: string; // Source page for back navigation (e.g., 'home-screen')
  selectedMode?: string; // "Static" | "Dynamic" - simulation mode
  loadedCaseValue?: number | null; // Static value from loaded case
}

// Mode button styling config
const modeButtonConfig = {
  ROUT: { label: 'ROUT', activeColor: 'bg-amber-500 text-white', inactiveColor: 'bg-muted text-muted-foreground' },
  RCAS: { label: 'RCAS', activeColor: 'bg-cyan-400 text-white', inactiveColor: 'bg-muted text-muted-foreground' },
  AUTO: { label: 'AUTO', activeColor: 'bg-green-500 text-white', inactiveColor: 'bg-muted text-muted-foreground' },
  MAN: { label: 'MAN', activeColor: 'bg-orange-500 text-white', inactiveColor: 'bg-muted text-muted-foreground' },
  BYPASS: { label: 'BYPASS', activeColor: 'bg-purple-500 text-white', inactiveColor: 'bg-muted text-muted-foreground' },
};

export const SecondaryControllerFaceplate = ({
  data,
  config,
  className,
  controllerId,
  onClose,
  onModeChange,
  onRoutRcasChange,
  onSpChange,
  onOutChange,
  onModelockOverrideChange,
  onBypassChange,
  isTransparent = false,
  fromSource,
  selectedMode,
  loadedCaseValue
}: SecondaryControllerFaceplateProps) => {
  const [showModelockConfirm, setShowModelockConfirm] = useState(false);
  
  // Editable SP/OUT value state
  const [isEditingSpOut, setIsEditingSpOut] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingSpOut && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingSpOut]);
  
  // In Static mode, PV = SP = OUT = loadedCaseValue
  const isStaticMode = selectedMode === 'Static';
  const staticValue = loadedCaseValue ?? data.PV;

  // Calculate percentage for bar display using PV_SCALE_LO/HI as the range (matches the scale shown)
  // Guard against NaN by ensuring valid range and using fallbacks
  const rangeMin = Number.isFinite(config.PV_SCALE_LO) ? config.PV_SCALE_LO : 0;
  const rangeMax = Number.isFinite(config.PV_SCALE_HI) ? config.PV_SCALE_HI : 100;
  const rangeDenom = rangeMax - rangeMin;
  const safeRangeDenom = rangeDenom !== 0 && Number.isFinite(rangeDenom) ? rangeDenom : 100;
  
  // Use static value for PV, SP, and OUT when in Static mode
  const safePV = isStaticMode && loadedCaseValue !== null 
    ? staticValue 
    : (Number.isFinite(data.PV) ? data.PV : rangeMin);
  const safeSP = isStaticMode && loadedCaseValue !== null 
    ? staticValue 
    : (Number.isFinite(data.SP) ? data.SP : rangeMin);
  const safeOUT = isStaticMode && loadedCaseValue !== null 
    ? staticValue 
    : (Number.isFinite(data.OUT_PCT) ? data.OUT_PCT : 0);
  
  const pvPercent = ((safePV - rangeMin) / safeRangeDenom) * 100;
  const outPercent = safeOUT;
  const spPercent = ((safeSP - rangeMin) / safeRangeDenom) * 100;
  
  // Calculate alarm limit percentages for arrows (with NaN protection)
  const alarmLPercent = Number.isFinite(config.ALM_L_LIM) ? ((config.ALM_L_LIM - rangeMin) / safeRangeDenom) * 100 : 0;
  const alarmHPercent = Number.isFinite(config.ALM_H_LIM) ? ((config.ALM_H_LIM - rangeMin) / safeRangeDenom) * 100 : 0;
  const alarmLLPercent = Number.isFinite(config.ALM_LL_LIM) ? ((config.ALM_LL_LIM - rangeMin) / safeRangeDenom) * 100 : 0;
  const alarmHHPercent = Number.isFinite(config.ALM_HH_LIM) ? ((config.ALM_HH_LIM - rangeMin) / safeRangeDenom) * 100 : 0;

  // Determine active mode
  const isAutoMode = data.MODE_AUTOMAN === 'AUTO';
  const isManMode = data.MODE_AUTOMAN === 'MAN';
  const isRoutMode = data.MODE_ROUTRCAS === 'ROUT';
  const isRcasMode = data.MODE_ROUTRCAS === 'RCAS';
  const isBypassMode = data.BYPASS_ACTIVE;
  
  // PV status
  const pvOk = data.PV_OK !== false;

  // SP adjustment handlers
  const handleSpIncrement = () => {
    if (onSpChange) {
      const newValue = Math.min(data.SP + 1, config.SP_LIM_HI);
      onSpChange(newValue);
    }
  };

  const handleSpDecrement = () => {
    if (onSpChange) {
      const newValue = Math.max(data.SP - 1, config.SP_LIM_LO);
      onSpChange(newValue);
    }
  };

  const handleOutIncrement = () => {
    if (onOutChange) {
      const newValue = Math.min(data.OUT_PCT + 1, 100);
      onOutChange(newValue);
    }
  };

  const handleOutDecrement = () => {
    if (onOutChange) {
      const newValue = Math.max(data.OUT_PCT - 1, 0);
      onOutChange(newValue);
    }
  };

  // Handle starting edit mode for SP/OUT value
  const handleStartEdit = () => {
    const currentValue = isManMode ? safeOUT : safeSP;
    setEditValue(currentValue.toFixed(1));
    setIsEditingSpOut(true);
  };

  // Handle submitting the edited value
  const handleSubmitEdit = () => {
    const parsedValue = parseFloat(editValue);
    if (!isNaN(parsedValue)) {
      if (isManMode) {
        // OUT% is bounded 0-100
        const clampedValue = Math.max(0, Math.min(100, parsedValue));
        if (onOutChange) {
          onOutChange(clampedValue);
        }
      } else {
        // SP is bounded by config limits
        const clampedValue = Math.max(config.SP_LIM_LO, Math.min(config.SP_LIM_HI, parsedValue));
        if (onSpChange) {
          onSpChange(clampedValue);
        }
      }
    }
    setIsEditingSpOut(false);
  };

  // Handle keyboard events in edit mode
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmitEdit();
    } else if (e.key === 'Escape') {
      setIsEditingSpOut(false);
    }
  };

  return (
    <div className={cn(
      isTransparent ? "faceplate-container-transparent" : "faceplate-container",
      "w-[240px] select-none p-1.5",
      className
    )}>
      {/* Title Bar */}
      <div className={cn(
        "flex items-center justify-between px-3 py-2 border-b",
        isTransparent ? "border-slate-400" : "border-border/50"
      )}>
        <span className={cn(
          "text-sm font-semibold",
          isTransparent ? "text-slate-800" : "text-faceplate-border"
        )}>Secondary Controller Faceplate</span>
        <button 
          onClick={onClose} 
          className="w-5 h-5 flex items-center justify-center bg-card hover:bg-muted rounded-sm transition-colors"
        >
          <X size={12} className="text-muted-foreground" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className={cn(
        "p-2 space-y-2",
        isTransparent ? "faceplate-inner-light" : "faceplate-inner"
      )}>
        {/* Controller Tag & Description */}
        <div className={cn(
          "text-center border-b pb-1.5",
          isTransparent ? "border-slate-400" : "border-border/30"
        )}>
          <h2 className={cn(
            "font-mono font-bold text-sm tracking-widest",
            isTransparent ? "text-slate-800" : "text-faceplate-border glow-text"
          )}>
            {config.TAGNAME}
          </h2>
          <p className={cn(
            "text-[10px]",
            isTransparent ? "text-slate-600" : "text-muted-foreground"
          )}>{config.DESC}</p>
        </div>

        {/* Value Boxes Row - OUT% and PV side by side at top */}
        <div className="flex justify-center gap-2">
          {/* OUT% Box */}
          <div className={cn(
            "px-2 py-1 rounded text-center min-w-[55px]",
            "bg-cyan-400 text-black font-mono font-bold text-xs",
            "shadow-lg shadow-cyan-400/30"
          )}>
            {safeOUT.toFixed(1)}%
          </div>
          {/* PV Box */}
          <div className={cn(
            "px-2 py-1 rounded text-center min-w-[65px]",
            "bg-amber-400 text-black font-mono font-bold text-xs",
            "shadow-lg shadow-amber-400/30"
          )}>
            {safePV.toFixed(1)} {config.EU}
          </div>
        </div>

        {/* Main Layout: Mode Buttons | Dual Bars | Alarm Arrows | SP Controls */}
        <div className="flex items-stretch gap-1">
          {/* Left Column: Mode Buttons */}
          <div className="flex flex-col gap-0.5">
            <ModeButton 
              label="ROUT" 
              active={isRoutMode}
              onClick={() => {
                if (!data.MODELOCK_OVERRIDE) return;
                onRoutRcasChange?.(isRoutMode ? 'DA' : 'ROUT');
              }}
              config={modeButtonConfig.ROUT}
              disabled={!data.MODELOCK_OVERRIDE}
            />
            <ModeButton 
              label="RCAS" 
              active={isRcasMode}
              onClick={() => {
                if (!data.MODELOCK_OVERRIDE) return;
                onRoutRcasChange?.(isRcasMode ? 'DA' : 'RCAS');
              }}
              config={modeButtonConfig.RCAS}
              disabled={!data.MODELOCK_OVERRIDE}
            />
            <ModeButton 
              label="AUTO" 
              active={isAutoMode}
              onClick={() => {
                if (!data.MODELOCK_OVERRIDE) return;
                onModeChange?.('AUTO');
              }}
              config={modeButtonConfig.AUTO}
              disabled={!data.MODELOCK_OVERRIDE}
            />
            <ModeButton 
              label="MAN" 
              active={isManMode}
              onClick={() => {
                if (!data.MODELOCK_OVERRIDE) return;
                onModeChange?.('MAN');
              }}
              config={modeButtonConfig.MAN}
              disabled={!data.MODELOCK_OVERRIDE}
            />
            <ModeButton 
              label="BYPASS" 
              active={isBypassMode}
              onClick={() => {
                if (!data.MODELOCK_OVERRIDE) return;
                onBypassChange?.(!isBypassMode);
              }}
              config={modeButtonConfig.BYPASS}
              disabled={!data.MODELOCK_OVERRIDE}
            />
            
            {/* Mode Indicator - Obround below mode buttons */}
            <div className={cn(
              "px-3 py-0.5 rounded-full text-[10px] font-bold mt-1 text-center",
              isAutoMode && !isBypassMode && "bg-green-500 text-white",
              isManMode && !isBypassMode && "bg-orange-500 text-white",
              isBypassMode && "bg-purple-500 text-white",
              isRcasMode && !isBypassMode && "bg-cyan-400 text-white",
              isRoutMode && !isBypassMode && "bg-amber-500 text-white"
            )}>
              {isBypassMode ? 'BYPASS' : isRcasMode ? 'RCAS' : isRoutMode ? 'ROUT' : data.MODE_AUTOMAN}
            </div>
            
            {/* Modelock Override - Shows lock when locked, unlock when override is active */}
            <button 
              onClick={() => {
                if (data.MODELOCK_OVERRIDE) {
                  onModelockOverrideChange?.(false);
                } else {
                  setShowModelockConfirm(true);
                }
              }}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded text-[9px] transition-colors mt-1 border",
                data.MODELOCK_OVERRIDE 
                  ? "bg-cyan-600/80 text-white border-cyan-500/50"
                  : "bg-slate-600/80 text-slate-300 border-slate-500/50"
              )}
            >
              {data.MODELOCK_OVERRIDE ? <Unlock size={9} /> : <Lock size={9} />}
              <span>Modelock</span>
            </button>

            {/* Modelock Confirmation Dialog */}
            <AlertDialog open={showModelockConfirm} onOpenChange={setShowModelockConfirm}>
              <AlertDialogContent className="bg-slate-800 border-slate-600">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Remove Modelock?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-300">
                    Are you sure that you want to remove the Modelock?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-600 text-white hover:bg-slate-500">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-cyan-500 text-white hover:bg-cyan-400"
                    onClick={() => {
                      onModelockOverrideChange?.(true);
                      setShowModelockConfirm(false);
                    }}
                  >
                    Yes, Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Dual Bar Graph Section - Moved to the right */}
          <div className="flex items-stretch gap-0 flex-1 justify-end">
            {/* OUT% Bar (Cyan) */}
            <div className="flex flex-col items-center">
              <span className={cn(
                "text-[7px] mb-0.5",
                isTransparent ? "text-slate-700" : "text-muted-foreground"
              )}>100%</span>
              <div className="relative w-6 h-[100px] bg-bar-track rounded border border-border/50 overflow-hidden">
                {/* Grid lines */}
                {Array.from({ length: 11 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-full border-t border-muted/30" 
                    style={{ bottom: `${i * 10}%` }} 
                  />
                ))}
                {/* OUT Fill */}
                <div 
                  className="absolute bottom-0 left-0 w-full transition-all duration-300" 
                  style={{
                    height: `${Math.max(0, Math.min(100, outPercent))}%`,
                    background: 'linear-gradient(180deg, hsl(187 100% 60%) 0%, hsl(187 100% 50%) 50%, hsl(187 90% 40%) 100%)',
                    boxShadow: '0 0 8px hsla(187, 100%, 55%, 0.4)'
                  }} 
                />
                {/* OUT Arrow Indicator */}
                <div 
                  className="absolute z-10" 
                  style={{ 
                    bottom: `${Math.max(0, Math.min(100, outPercent))}%`,
                    left: '-6px',
                    transform: 'translateY(50%)'
                  }}
                >
                  <div className="w-0 h-0 border-y-[3px] border-y-transparent border-r-[5px] border-r-blue-400" />
                </div>
              </div>
              <span className={cn(
                "text-[7px] mt-0.5",
                isTransparent ? "text-slate-700" : "text-muted-foreground"
              )}>0</span>
            </div>

            {/* Tick Lines Between Bars */}
            <div className="flex flex-col justify-between h-[100px] mt-3 mx-0.5">
              {Array.from({ length: 11 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 h-px bg-muted-foreground/40"
                />
              ))}
            </div>

            {/* PV Bar (Yellow) with SP Marker */}
            <div className="flex flex-col items-center">
              <span className={cn(
                "text-[7px] mb-0.5",
                isTransparent ? "text-slate-700" : "text-muted-foreground"
              )}>{config.PV_SCALE_HI} {config.EU}</span>
              <div className="relative w-6 h-[100px] bg-bar-track rounded border border-border/50 overflow-hidden">
                {/* Grid lines */}
                {Array.from({ length: 11 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-full border-t border-muted/30" 
                    style={{ bottom: `${i * 10}%` }} 
                  />
                ))}
                {/* PV Fill */}
                <div 
                  className="absolute bottom-0 left-0 w-full transition-all duration-300" 
                  style={{
                    height: `${Math.max(0, Math.min(100, pvPercent))}%`,
                    background: 'linear-gradient(180deg, hsl(45 100% 60%) 0%, hsl(45 100% 50%) 50%, hsl(45 90% 40%) 100%)',
                    boxShadow: '0 0 8px hsla(45, 100%, 55%, 0.4)'
                  }} 
                />
                {/* SP Triangle Marker (white) */}
                <div 
                  className="absolute -right-2 z-10" 
                  style={{ 
                    bottom: `${Math.max(0, Math.min(100, spPercent))}%`,
                    transform: 'translateY(50%)'
                  }}
                >
                  <div className="w-0 h-0 border-y-[3px] border-y-transparent border-l-[5px] border-l-white" />
                </div>
              </div>
              <span className={cn(
                "text-[7px] mt-0.5",
                isTransparent ? "text-slate-700" : "text-muted-foreground"
              )}>{config.PV_SCALE_LO}</span>
            </div>

            {/* Alarm Arrows Column */}
            <div className="relative h-[100px] w-3 mt-3 ml-0">
              {/* HH Arrow (red) */}
              {config.ALM_HH_LIM !== 0 && (
                <div 
                  className="absolute left-0 z-10" 
                  style={{
                    bottom: `${Math.max(0, Math.min(100, alarmHHPercent))}%`,
                    transform: 'translateY(50%)'
                  }}
                >
                  <div className="w-0 h-0 border-y-[2px] border-y-transparent border-r-[4px] border-r-red-500" />
                </div>
              )}
              {/* H Arrow (yellow) */}
              {config.ALM_H_LIM !== 0 && (
                <div 
                  className="absolute left-0 z-10" 
                  style={{
                    bottom: `${Math.max(0, Math.min(100, alarmHPercent))}%`,
                    transform: 'translateY(50%)'
                  }}
                >
                  <div className="w-0 h-0 border-y-[2px] border-y-transparent border-r-[4px] border-r-yellow-400" />
                </div>
              )}
              {/* L Arrow (yellow) */}
              {config.ALM_L_LIM !== 0 && (
                <div 
                  className="absolute left-0 z-10" 
                  style={{
                    bottom: `${Math.max(0, Math.min(100, alarmLPercent))}%`,
                    transform: 'translateY(50%)'
                  }}
                >
                  <div className="w-0 h-0 border-y-[2px] border-y-transparent border-r-[4px] border-r-yellow-400" />
                </div>
              )}
              {/* LL Arrow (red) */}
              {config.ALM_LL_LIM !== 0 && (
                <div 
                  className="absolute left-0 z-10" 
                  style={{
                    bottom: `${Math.max(0, Math.min(100, alarmLLPercent))}%`,
                    transform: 'translateY(50%)'
                  }}
                >
                  <div className="w-0 h-0 border-y-[2px] border-y-transparent border-r-[4px] border-r-red-500" />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: SP/OUT Display with Up/Down Arrows */}
          <div className="flex flex-col items-center justify-center gap-0.5 ml-0.5">
            {/* SP/OUT Value Box - Shows SP in Auto, OUT in Manual - Clickable to edit */}
            {isEditingSpOut ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSubmitEdit}
                onKeyDown={handleEditKeyDown}
                className={cn(
                  "px-1 py-0.5 rounded text-center w-[50px]",
                  "font-mono font-bold text-[10px]",
                  "shadow-lg border-2 border-blue-500 outline-none",
                  isManMode
                    ? "bg-cyan-400 text-black"
                    : "bg-white text-black"
                )}
                data-testid="input-spout-edit"
              />
            ) : (
              <div 
                onClick={handleStartEdit}
                className={cn(
                  "px-1.5 py-1 rounded text-center min-w-[50px] cursor-pointer",
                  "font-mono font-bold text-[10px]",
                  "shadow-lg border border-gray-300 hover:border-blue-400 transition-colors",
                  isManMode
                    ? "bg-cyan-400 text-black"
                    : "bg-white text-black"
                )}
                title="Click to edit"
                data-testid="button-spout-value"
              >
                {isManMode ? `${safeOUT.toFixed(1)}%` : safeSP.toFixed(1)}
              </div>
            )}
            
            {/* Up/Down Buttons - Orange in Manual mode */}
            <div className="flex flex-col gap-0.5">
              <button 
                onClick={isManMode ? handleOutIncrement : handleSpIncrement}
                className={cn(
                  "w-8 h-6 flex items-center justify-center rounded transition-colors",
                  isManMode 
                    ? "bg-orange-500 hover:bg-orange-600 text-white" 
                    : "bg-muted hover:bg-card text-foreground"
                )}
              >
                <ChevronUp size={14} />
              </button>
              <button 
                onClick={isManMode ? handleOutDecrement : handleSpDecrement}
                className={cn(
                  "w-8 h-6 flex items-center justify-center rounded transition-colors",
                  isManMode 
                    ? "bg-orange-500 hover:bg-orange-600 text-white" 
                    : "bg-muted hover:bg-card text-foreground"
                )}
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Alarm Indicators Row with PV dot */}
        <div className={cn(
          "flex items-center justify-center gap-1.5 pt-1.5 border-t",
          isTransparent ? "border-slate-400" : "border-border/30"
        )}>
          
          {config.ALM_LL_LIM !== 0 && <AlarmDot label="LL" active={data.ALM_LL_ACT} color="red" />}
          {config.ALM_L_LIM !== 0 && <AlarmDot label="L" active={data.ALM_L_ACT} color="yellow" />}
          {config.ALM_DL_LIM !== 0 && <AlarmDot label="DL" active={data.ALM_DL_ACT} color="yellow" />}
          {config.ALM_DH_LIM !== 0 && <AlarmDot label="DH" active={data.ALM_DH_ACT} color="yellow" />}
          {config.ALM_H_LIM !== 0 && <AlarmDot label="H" active={data.ALM_H_ACT} color="yellow" />}
          {config.ALM_HH_LIM !== 0 && <AlarmDot label="HH" active={data.ALM_HH_ACT} color="red" />}
        </div>

        {/* Unit Display - Two-Part Bar */}
        <div className="flex items-center justify-center">
          <div className="flex w-full rounded overflow-hidden border border-border/50">
            {/* Left side - "Area" label with dark background */}
            <div className={cn(
              "px-3 py-1 text-[10px] font-medium",
              isTransparent 
                ? "bg-[#6b6b5c] text-white" 
                : "bg-[#6b6b5c] text-white"
            )}>
              Area
            </div>
            {/* Right side - Value with light background */}
            <div className={cn(
              "flex-1 px-4 py-1 text-[10px] font-mono text-center",
              isTransparent 
                ? "bg-gray-300 text-slate-800" 
                : "bg-gray-400 text-slate-800"
            )}>
              {config.UNIT || 'Acid'}
            </div>
          </div>
        </div>

        {/* Bottom Toolbar */}
        <div className={cn(
          "flex items-center justify-center gap-1 pt-1.5 border-t",
          isTransparent ? "border-slate-400" : "border-border/30"
        )}>
          <ToolbarButton icon={<Settings size={12} />} title="Controller Details" to={getRouteForController('faceplate-3a', controllerId)} />
          <ToolbarButton icon={<History size={12} />} title="Primary Control" to={getRouteForController('faceplate-3b', controllerId)} />
          <ToolbarButton icon={<Activity size={12} />} title="Trend" to={getRouteForController('faceplate-3c', controllerId)} />
          <ToolbarButton icon={<Link2 size={12} />} title="Control Studio" to={getRouteForController('faceplate-3d', controllerId)} />
          <ToolbarButton icon={<Sliders size={12} />} title="Controller Input" to={getRouteForController('faceplate-3e', controllerId, fromSource)} />
          <ToolbarButton icon={<Bell size={12} />} title="Acknowledge Alarm" to={getRouteForController('faceplate-3f', controllerId)} />
        </div>
      </div>
    </div>
  );
};

// Mode Button Component
const ModeButton = ({
  label,
  active,
  onClick,
  config,
  disabled
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  config: { activeColor: string; inactiveColor: string };
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "px-3 py-1 rounded text-[10px] font-bold transition-all duration-200 min-w-[55px]",
      active ? config.activeColor : config.inactiveColor,
      disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
    )}
  >
    {label}
  </button>
);

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
      "w-3 h-3 rounded-full border-2 transition-all duration-200",
      active 
        ? color === 'red' 
          ? "bg-red-500 border-red-400 shadow-lg shadow-red-500/50"
          : "bg-yellow-400 border-yellow-300 shadow-lg shadow-yellow-400/50"
        : "bg-muted border-border"
    )} />
    <span className="text-[7px] text-muted-foreground mt-0.5">{label}</span>
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
      "w-7 h-7 flex items-center justify-center rounded",
      "bg-muted hover:bg-card transition-colors",
      "text-muted-foreground hover:text-foreground"
    )}
  >
    {icon}
  </Link>
);
