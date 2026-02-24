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
        deviation = pv - sp
        results = {}
        
        for name, limit in self.limits.items():
            if limit.is_deviation:
                if limit.is_high:
                    active = deviation >= limit.limit
                else:
                    active = deviation <= limit.limit
            else:
                if limit.is_high:
                    active = pv >= limit.limit
                else:
                    active = pv <= limit.limit
                    
            results[f'ALM_{name}_ACT'] = active
            
            if active and name not in self._active_alarms:
                self._active_alarms[name] = time.time()
            elif not active and name in self._active_alarms:
                del self._active_alarms[name]
                self._acknowledged.discard(name)
                
        return results
    
    def acknowledge(self, alarm_name: str):
        if alarm_name in self._active_alarms:
            self._acknowledged.add(alarm_name)
            
    def acknowledge_all(self):
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

const TempSensor4827Main = () => {
  const activeControllerId = '1540-TI-4827';
  const { state: syncState, updateSyncedPV, updateSyncedSP, updateSyncedOUT, updateSyncedMode } = useControllerSync(activeControllerId);
  const { getControllerConfig, getControllerData } = useControllerConfig();
  const { toast } = useToast();
  
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const savedConfig = getControllerConfig(activeControllerId);
  
  const [controllerData, setControllerData] = useState<ControllerData>({
    ...defaultControllerData,
    instrumentTag: savedConfig.TAGNAME || '1540-TI-4827',
    description: savedConfig.DESC || 'Pass 1 Catalyst Out A',
    pvUnits: savedConfig.EU || 'F',
    pvRangeMin: savedConfig.SP_LIM_LO ?? 0,
    pvRangeMax: savedConfig.SP_LIM_HI ?? 2000,
    pv: syncState.syncedPV,
    sp: syncState.syncedSP,
    out: syncState.syncedOUT,
  });
  
  const [config, setConfig] = useState<SecondaryControllerConfig>(savedConfig);
  const [secondaryData, setSecondaryData] = useState<SecondaryControllerData>({
    ...defaultSecondaryData,
    PV: syncState.syncedPV,
    SP: syncState.syncedSP,
    OUT_PCT: syncState.syncedOUT,
  });
  
  useEffect(() => {
    const syncConfigFromContext = () => {
      const latestConfig = getControllerConfig(activeControllerId);
      const sanitizedEU = latestConfig.EU ? latestConfig.EU.replace(/°/g, '') : 'F';
      
      setConfig({ ...latestConfig, EU: sanitizedEU });
      setControllerData(prev => ({
        ...prev,
        instrumentTag: latestConfig.TAGNAME || '1540-TI-4827',
        description: latestConfig.DESC || 'Pass 1 Catalyst Out A',
        pvUnits: sanitizedEU,
        pvRangeMin: latestConfig.SP_LIM_LO ?? 0,
        pvRangeMax: latestConfig.SP_LIM_HI ?? 2000,
      }));
    };
    
    syncConfigFromContext();
    
    window.addEventListener('focus', syncConfigFromContext);
    return () => window.removeEventListener('focus', syncConfigFromContext);
  }, [getControllerConfig, activeControllerId]);
  
  useEffect(() => {
    if (savedConfig.TYPICAL_PV !== undefined && savedConfig.TYPICAL_PV > 0) {
      updateSyncedPV(savedConfig.TYPICAL_PV);
      updateSyncedSP(savedConfig.TYPICAL_PV);
    }
  }, [savedConfig.TYPICAL_PV, updateSyncedPV, updateSyncedSP]);
  
  const hasRedAlarm = !secondaryData.PV_OK || secondaryData.ALM_LL_ACT || secondaryData.ALM_HH_ACT;
  const hasYellowAlarm = secondaryData.ALM_L_ACT || secondaryData.ALM_DL_ACT || 
                          secondaryData.ALM_DH_ACT || secondaryData.ALM_H_ACT;
  const primaryAlarmActive = hasRedAlarm || hasYellowAlarm;
  const primaryAlarmColor: 'red' | 'yellow' = hasRedAlarm ? 'red' : 'yellow';

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

  useEffect(() => {
    (window as any).updateTempSensor4827ControllerData = (newData: Partial<ControllerData>) => {
      setControllerData(prev => ({ ...prev, ...newData }));
    };
    (window as any).updateTempSensor4827SecondaryData = (newData: Partial<SecondaryControllerData>) => {
      setSecondaryData(prev => ({ ...prev, ...newData }));
    };
    
    return () => {
      delete (window as any).updateTempSensor4827ControllerData;
      delete (window as any).updateTempSensor4827SecondaryData;
    };
  }, []);

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

  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    setDialogOpen(true);
    setCopied(false);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/settings/controller-outputs/faceplates/temp-sensor/1540-TI-4827"
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-card/50 active:scale-95"
            )}
          >
            <ArrowLeft size={18} />
            Back
          </Link>

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
                  className="flex items-start gap-3 p-3 cursor-pointer focus:bg-muted"
                  onClick={() => handleFileSelect(fileName)}
                >
                  <FileCode size={18} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-mono text-sm text-foreground">{fileName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <header className="mb-8 text-center">
          <h1 className={cn(
            "text-3xl font-bold mb-3 tracking-tight",
            "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent"
          )}>
            1540-TI-4827 Pass 1 Catalyst Out A
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            Temperature Sensor Faceplate (Primary & Secondary)
          </p>
        </header>

        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Primary Faceplate</span>
            <TempSensorPrimaryFaceplate 
              data={controllerData}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Secondary Faceplate</span>
            <TempSensorSecondaryFaceplate
              data={secondaryData}
              config={config}
              sensorId="1540-TI-4827"
            />
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-lg">
              <FileCode className="text-primary" />
              {selectedFile}
            </DialogTitle>
            <DialogDescription>
              {selectedFile && getPythonCodeTemplates(savedConfig)[selectedFile]?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative mt-4">
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 z-10 gap-2"
              onClick={handleCopyCode}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            
            <div className="max-h-[50vh] overflow-auto rounded-lg border border-border">
              {selectedFile && (
                <SyntaxHighlighter
                  language="python"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                  }}
                  showLineNumbers
                >
                  {getPythonCodeTemplates(savedConfig)[selectedFile].code}
                </SyntaxHighlighter>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TempSensor4827Main;
