import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { TempSensorPrimaryFaceplate } from '@/delta-v/components/faceplate/TempSensorPrimaryFaceplate';
import { TempSensorSecondaryFaceplate } from '@/delta-v/components/faceplate/TempSensorSecondaryFaceplate';
import { defaultControllerData, type ControllerData } from '@/delta-v/types/controller';
import { 
  defaultSecondaryConfig, 
  defaultSecondaryData, 
  type SecondaryControllerData,
  type SecondaryControllerConfig 
} from '@/delta-v/types/secondaryController';
import { cn } from '@/lib/utils';
import { ArrowLeft, Code, FileCode, Copy, Check, ChevronDown } from 'lucide-react';
import { useControllerSync } from '@/delta-v/contexts/ControllerSyncContext';
import { useControllerConfig } from '@/delta-v/contexts/ControllerConfigContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Python code templates - dynamic function that injects configuration values
const getPythonCodeTemplates = (config: SecondaryControllerConfig): Record<string, { description: string; code: string }> => ({
  'pid_controller.py': {
    description: 'Main PID control algorithm with gain, reset, and rate parameters',
    code: `"""
PID Controller - Main Control Algorithm
Implements a standard PID controller with anti-windup
Controller: ${config.TAGNAME}
"""

class PIDController:
    def __init__(self, kp=1.0, ki=0.1, kd=0.05, output_limits=(${config.OUT_LIM_LO}, ${config.OUT_LIM_HI})):
        self.kp = kp  # Proportional gain
        self.ki = ki  # Integral gain (1/reset time)
        self.kd = kd  # Derivative gain (rate time)
        self.output_limits = output_limits
        
        self._integral = 0.0
        self._last_error = 0.0
        self._last_pv = None
        
    def compute(self, setpoint: float, process_value: float, dt: float) -> float:
        """
        Compute PID output.
        
        Args:
            setpoint: Target value (SP)
            process_value: Current measured value (PV)
            dt: Time step in seconds
            
        Returns:
            Output percentage (${config.OUT_LIM_LO}-${config.OUT_LIM_HI}%)
        """
        error = setpoint - process_value
        
        # Proportional term
        p_term = self.kp * error
        
        # Integral term with anti-windup
        self._integral += error * dt
        i_term = self.ki * self._integral
        
        # Derivative term (on PV to avoid derivative kick)
        if self._last_pv is not None:
            d_term = -self.kd * (process_value - self._last_pv) / dt
        else:
            d_term = 0.0
        self._last_pv = process_value
        
        # Calculate output
        output = p_term + i_term + d_term
        
        # Clamp output and apply anti-windup
        output = max(self.output_limits[0], min(self.output_limits[1], output))
        
        return output
    
    def reset(self):
        """Reset controller state."""
        self._integral = 0.0
        self._last_error = 0.0
        self._last_pv = None


# Example usage for ${config.TAGNAME}
if __name__ == "__main__":
    pid = PIDController(kp=2.0, ki=0.5, kd=0.1, output_limits=(${config.OUT_LIM_LO}, ${config.OUT_LIM_HI}))
    
    # Simulation loop
    sp = ${config.SP_LIM_HI}  # Setpoint (${config.EU})
    pv = ${config.PV_INIT_VAL}  # Initial process value (${config.EU})
    dt = 0.1   # 100ms time step
    
    for _ in range(100):
        output = pid.compute(sp, pv, dt)
        print(f"SP={sp:.1f}, PV={pv:.1f}, OUT={output:.1f}%")
        
        # Simulate process response (simplified)
        pv += (output - 50) * 0.05
`
  },
  'alarm_handler.py': {
    description: 'Alarm detection, priority handling, and state management',
    code: `"""
Alarm Handler - Manages alarm states and priorities
Supports 6-tier alarm system (LL, L, DL, DH, H, HH)
Controller: ${config.TAGNAME} - ${config.DESC}
"""

from dataclasses import dataclass
from enum import Enum
from typing import Callable, Optional
import time

class AlarmPriority(Enum):
    CRITICAL = 1  # HH, LL
    HIGH = 2      # H, L
    MEDIUM = 3    # DH, DL
    LOW = 4       # Informational

@dataclass
class AlarmLimit:
    name: str
    limit: float
    priority: AlarmPriority
    is_high: bool  # True for high alarms, False for low alarms
    is_deviation: bool = False  # True for deviation alarms (DL, DH)

class AlarmHandler:
    def __init__(self, limits: dict):
        """
        Initialize alarm handler.
        
        Args:
            limits: Dict with alarm limits {LL, L, DL, DH, H, HH}
        """
        self.limits = {
            'LL': AlarmLimit('LL', limits.get('LL', ${config.ALM_LL_LIM}), AlarmPriority.CRITICAL, False),
            'L': AlarmLimit('L', limits.get('L', ${config.ALM_L_LIM}), AlarmPriority.HIGH, False),
            'DL': AlarmLimit('DL', limits.get('DL', ${config.ALM_DL_LIM}), AlarmPriority.MEDIUM, False, True),
            'DH': AlarmLimit('DH', limits.get('DH', ${config.ALM_DH_LIM}), AlarmPriority.MEDIUM, True, True),
            'H': AlarmLimit('H', limits.get('H', ${config.ALM_H_LIM}), AlarmPriority.HIGH, True),
            'HH': AlarmLimit('HH', limits.get('HH', ${config.ALM_HH_LIM}), AlarmPriority.CRITICAL, True),
        }
        
        self._active_alarms: dict[str, float] = {}  # alarm_name -> activation_time
        self._acknowledged: set[str] = set()
        self._callbacks: list[Callable] = []
        
    def check_alarms(self, pv: float, sp: float) -> dict[str, bool]:
        """
        Check all alarm conditions.
        
        Args:
            pv: Process value (${config.EU})
            sp: Setpoint (for deviation alarms)
            
        Returns:
            Dict of alarm states {alarm_name: is_active}
        """
        deviation = pv - sp
        results = {}
        
        for name, limit in self.limits.items():
            if limit.is_deviation:
                # Deviation alarm
                if limit.is_high:
                    active = deviation >= limit.limit
                else:
                    active = deviation <= limit.limit
            else:
                # Absolute alarm
                if limit.is_high:
                    active = pv >= limit.limit
                else:
                    active = pv <= limit.limit
                    
            results[f'ALM_{name}_ACT'] = active
            
            # Track activation time
            if active and name not in self._active_alarms:
                self._active_alarms[name] = time.time()
            elif not active and name in self._active_alarms:
                del self._active_alarms[name]
                self._acknowledged.discard(name)
                
        return results
    
    def acknowledge(self, alarm_name: str):
        """Acknowledge an active alarm."""
        if alarm_name in self._active_alarms:
            self._acknowledged.add(alarm_name)
            
    def acknowledge_all(self):
        """Acknowledge all active alarms."""
        self._acknowledged.update(self._active_alarms.keys())


# Example usage for ${config.TAGNAME}
if __name__ == "__main__":
    handler = AlarmHandler({
        'LL': ${config.ALM_LL_LIM}, 'L': ${config.ALM_L_LIM}, 'DL': ${config.ALM_DL_LIM}, 
        'DH': ${config.ALM_DH_LIM}, 'H': ${config.ALM_H_LIM}, 'HH': ${config.ALM_HH_LIM}
    })
    
    # Simulate PV changes for ${config.TAGNAME}
    for pv in [${config.PV_INIT_VAL}, ${config.ALM_H_LIM}, ${config.ALM_HH_LIM}, ${config.PV_INIT_VAL}]:
        states = handler.check_alarms(pv, sp=${config.SP_LIM_HI})
        print(f"PV={pv} ${config.EU}, States={states}")
`
  },
});

const TempSensor5821Main = () => {
  const activeControllerId = '1520-TI-5821';
  const { state: syncState, updateSyncedSP, updateSyncedOUT, updateSyncedMode } = useControllerSync(activeControllerId);
  const { getControllerConfig, getControllerData } = useControllerConfig();
  const { toast } = useToast();
  
  // Python code dialog state
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Load saved configuration from context
  const savedConfig = getControllerConfig(activeControllerId);
  
  // Primary Controller state
  const [controllerData, setControllerData] = useState<ControllerData>({
    ...defaultControllerData,
    instrumentTag: savedConfig.TAGNAME || '1520-TI-5821',
    description: savedConfig.DESC || 'DT Gas Out Temperature',
    pvUnits: savedConfig.EU || 'C',
    pvRangeMin: savedConfig.SP_LIM_LO ?? 0,
    pvRangeMax: savedConfig.SP_LIM_HI ?? 500,
    pv: syncState.syncedPV,
    sp: syncState.syncedSP,
    out: syncState.syncedOUT,
  });
  
  // Secondary Controller state
  const [config, setConfig] = useState<SecondaryControllerConfig>(savedConfig);
  const [secondaryData, setSecondaryData] = useState<SecondaryControllerData>({
    ...defaultSecondaryData,
    PV: syncState.syncedPV,
    SP: syncState.syncedSP,
    OUT_PCT: syncState.syncedOUT,
  });
  
  // Sync config changes from Faceplate3E (re-read on every render to catch navigation back)
  useEffect(() => {
    const syncConfigFromContext = () => {
      const latestConfig = getControllerConfig(activeControllerId);
      
      // Sanitize EU field - remove degree symbols from cached values
      const sanitizedEU = latestConfig.EU ? latestConfig.EU.replace(/°/g, '') : 'C';
      
      setConfig({ ...latestConfig, EU: sanitizedEU });
      setControllerData(prev => ({
        ...prev,
        instrumentTag: latestConfig.TAGNAME || '1520-TI-5821',
        description: latestConfig.DESC || 'DT Gas Out Temperature',
        pvUnits: sanitizedEU,
        pvRangeMin: latestConfig.SP_LIM_LO ?? 0,
        pvRangeMax: latestConfig.SP_LIM_HI ?? 500,
      }));
    };
    
    // Sync immediately on mount/navigation
    syncConfigFromContext();
    
    // Also sync when window regains focus (user returns from 3E page)
    window.addEventListener('focus', syncConfigFromContext);
    return () => window.removeEventListener('focus', syncConfigFromContext);
  }, [getControllerConfig, activeControllerId]);
  
  // Derive alarm state from secondary controller alarms
  const hasRedAlarm = !secondaryData.PV_OK || secondaryData.ALM_LL_ACT || secondaryData.ALM_HH_ACT;
  const hasYellowAlarm = secondaryData.ALM_L_ACT || secondaryData.ALM_DL_ACT || 
                          secondaryData.ALM_DH_ACT || secondaryData.ALM_H_ACT;
  const primaryAlarmActive = hasRedAlarm || hasYellowAlarm;
  const primaryAlarmColor: 'red' | 'yellow' = hasRedAlarm ? 'red' : 'yellow';

  // Sync Primary Controller values from context and alarm state
  useEffect(() => {
    const interlockIsActive = 
      (config.ALM_HH_LIM !== 0 && secondaryData.ALM_HH_ACT) || 
      (config.ALM_LL_LIM !== 0 && secondaryData.ALM_LL_ACT);
    
    setControllerData(prev => ({
      ...prev,
      pv: syncState.syncedPV,
      sp: syncState.syncedSP,
      out: syncState.syncedOUT,
      alarmActive: primaryAlarmActive,
      alarmColor: primaryAlarmColor,
      alarmType: hasRedAlarm ? 'HIHI' : (hasYellowAlarm ? 'HI' : undefined),
      mode: syncState.syncedMode,
      interlockActive: interlockIsActive,
      deviceLocked: interlockIsActive,
      holdActive: config.HOLD_ACTIVE ?? false,
      alarmLL: config.ALM_LL_LIM,
      alarmL: config.ALM_L_LIM,
      alarmH: config.ALM_H_LIM,
      alarmHH: config.ALM_HH_LIM,
      showHoldIndicator: config.SHOW_HOLD_INDICATOR,
      showOutputPathIndicator: config.SHOW_OUTPUT_PATH_INDICATOR,
      showInterlockIndicator: config.SHOW_INTERLOCK_INDICATOR,
        showInterlockDiamond: config.SHOW_INTERLOCK_DIAMOND_INDICATOR,
        showLockIndicator: config.SHOW_LOCK_INDICATOR,
        
      }));
    }, [syncState.syncedPV, syncState.syncedSP, syncState.syncedOUT, syncState.syncedMode, primaryAlarmActive, primaryAlarmColor, hasRedAlarm, hasYellowAlarm, config, secondaryData.ALM_HH_ACT, secondaryData.ALM_LL_ACT]);
  
  // Sync Secondary Controller values from context
  useEffect(() => {
    setSecondaryData(prev => {
      const newPV = syncState.syncedPV;
      const dev = newPV - syncState.syncedSP;
      
      return {
        ...prev,
        PV: newPV,
        SP: syncState.syncedSP,
        OUT_PCT: syncState.syncedOUT,
        ALM_LL_ACT: config.ALM_LL_LIM !== 0 && newPV <= config.ALM_LL_LIM,
        ALM_L_ACT: config.ALM_L_LIM !== 0 && newPV <= config.ALM_L_LIM,
        ALM_DL_ACT: config.ALM_DL_LIM !== 0 && dev <= config.ALM_DL_LIM,
        ALM_DH_ACT: config.ALM_DH_LIM !== 0 && dev >= config.ALM_DH_LIM,
        ALM_H_ACT: config.ALM_H_LIM !== 0 && newPV >= config.ALM_H_LIM,
        ALM_HH_ACT: config.ALM_HH_LIM !== 0 && newPV >= config.ALM_HH_LIM,
        PV_OK: !(
          (config.ALM_LL_LIM !== 0 && newPV <= config.ALM_LL_LIM) || 
          (config.ALM_HH_LIM !== 0 && newPV >= config.ALM_HH_LIM)
        ),
      };
    });
  }, [syncState.syncedPV, syncState.syncedSP, syncState.syncedOUT, config]);

  // Expose update functions for Python integration
  useEffect(() => {
    (window as any).updateTempSensor5821ControllerData = (newData: Partial<ControllerData>) => {
      setControllerData(prev => ({ ...prev, ...newData }));
    };
    (window as any).updateTempSensor5821SecondaryData = (newData: Partial<SecondaryControllerData>) => {
      setSecondaryData(prev => ({ ...prev, ...newData }));
    };
    
    return () => {
      delete (window as any).updateTempSensor5821ControllerData;
      delete (window as any).updateTempSensor5821SecondaryData;
    };
  }, []);

  // Secondary Controller handlers
  const handleModeChange = (mode: 'AUTO' | 'MAN') => {
    setSecondaryData(prev => ({ ...prev, MODE_AUTOMAN: mode }));
    updateSyncedMode(mode);
  };

  const handleRoutRcasChange = (mode: 'DA' | 'ROUT' | 'RCAS') => {
    setSecondaryData(prev => ({ ...prev, MODE_ROUTRCAS: mode }));
    if (mode === 'RCAS') {
      updateSyncedMode('RCAS');
    } else if (mode === 'ROUT') {
      updateSyncedMode('ROUT');
    }
  };

  const handleSpChange = (value: number) => {
    setSecondaryData(prev => ({ ...prev, TSP: value, SP: value }));
    updateSyncedSP(value);
  };

  const handleOutChange = (value: number) => {
    setSecondaryData(prev => ({ ...prev, OUT_PCT: value }));
    updateSyncedOUT(value);
  };

  const handleModelockOverrideChange = (active: boolean) => {
    setSecondaryData(prev => ({ ...prev, MODELOCK_OVERRIDE: active }));
  };

  const handleBypassChange = (active: boolean) => {
    setSecondaryData(prev => {
      const isManMode = prev.MODE_AUTOMAN === 'MAN';
      
      if (active && isManMode) {
        updateSyncedMode('BYPASS');
      } else if (!active && isManMode) {
        updateSyncedMode('MAN');
      }
      
      return { ...prev, BYPASS_ACTIVE: active };
    });
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    if (!selectedFile) return;
    
    try {
      await navigator.clipboard.writeText(getPythonCodeTemplates(savedConfig)[selectedFile].code);
      setCopied(true);
      toast({
        title: "Copied!",
        description: `${selectedFile} copied to clipboard`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Open file in dialog
  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    setDialogOpen(true);
    setCopied(false);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header with Back Button and Python Code Dropdown */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/settings/controller-outputs/faceplates/temp-sensor/1520-TI-5821"
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-card/50 active:scale-95"
            )}
          >
            <ArrowLeft size={18} />
            Back
          </Link>

          {/* Python Code Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "gap-2 border-primary/30 hover:border-primary",
                  "bg-card/50 hover:bg-card"
                )}
              >
                <Code size={18} />
                Edit Python Code
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-card border-border">
              {Object.entries(getPythonCodeTemplates(savedConfig)).map(([fileName, { description }]) => (
                <DropdownMenuItem
                  key={fileName}
                  onClick={() => handleFileSelect(fileName)}
                  className="flex items-start gap-2 py-2 cursor-pointer"
                >
                  <FileCode size={16} className="mt-0.5 text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-mono text-sm">{fileName}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{description}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <header className="mb-10 text-center">
          <h1 className={cn(
            "text-3xl font-bold mb-2 tracking-tight",
            "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent"
          )}>
            1520-TI-5821 DT Gas Out Temperature Sensor Faceplate
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            Industrial HMI Interface • Python Backend Ready
          </p>
        </header>

        <main className="flex flex-col items-center gap-10">
          {/* Primary Sensor Section */}
          <section className="flex flex-col items-center">
            <p className="text-primary font-semibold text-lg mb-4">
              Primary Sensor Faceplate
            </p>
            <TempSensorPrimaryFaceplate 
              data={controllerData}
              onSelect={() => console.log('Faceplate selected:', controllerData.instrumentTag)}
              isTransparent={config.TRANSPARENT_BG}
            />
          </section>

          {/* Secondary Sensor Section */}
          <section className="flex flex-col items-center">
            <p className="text-primary font-semibold text-lg mb-4">
              Secondary Sensor Faceplate
            </p>
            <TempSensorSecondaryFaceplate 
              data={secondaryData}
              config={config}
              sensorId="1520-TI-5821"
              isTransparent={config.TRANSPARENT_BG}
            />
          </section>
        </main>
      </div>

      {/* Python Code Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-primary">
              <FileCode size={20} />
              {selectedFile}
            </DialogTitle>
            <DialogDescription>
              {selectedFile && getPythonCodeTemplates(savedConfig)[selectedFile]?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 gap-1.5 z-10"
              onClick={handleCopyCode}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            
            <div className="rounded-lg overflow-auto max-h-[60vh] border border-slate-700">
              <SyntaxHighlighter
                language="python"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.5rem',
                }}
                showLineNumbers
              >
                {selectedFile ? getPythonCodeTemplates(savedConfig)[selectedFile]?.code : ''}
              </SyntaxHighlighter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TempSensor5821Main;
