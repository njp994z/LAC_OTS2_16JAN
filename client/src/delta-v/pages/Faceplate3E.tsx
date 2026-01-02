import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Sliders, Save } from 'lucide-react';
import { getControllerMetadata } from '@/delta-v/lib/controllerMetadata';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useControllerSync } from '@/delta-v/contexts/ControllerSyncContext';
import { useControllerConfig } from '@/delta-v/contexts/ControllerConfigContext';
import {
  defaultSecondaryConfig,
  defaultSecondaryData,
  SecondaryControllerConfig,
  SecondaryControllerData,
  AutoManMode,
  RoutRcasMode,
  InterlockAction,
} from '@/delta-v/types/secondaryController';
import { toast } from 'sonner';

// Stable string input component that manages its own local state
const StableStringInput = ({ 
  value, 
  onCommit,
  className = ""
}: { 
  value: string; 
  onCommit: (val: string) => void;
  className?: string;
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  // Only sync from parent when value actually changes externally
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleBlur = useCallback(() => {
    if (localValue !== value) {
      onCommit(localValue);
    }
  }, [localValue, value, onCommit]);

  return (
    <Input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      className={`font-mono bg-background/50 border-border/50 h-8 w-48 ${className}`}
    />
  );
};

// Stable number input component
const StableNumberInput = ({ 
  value, 
  onCommit,
  unit,
  className = ""
}: { 
  value: number; 
  onCommit: (val: number) => void;
  unit?: string;
  className?: string;
}) => {
  const [localValue, setLocalValue] = useState(String(value));
  
  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);
  
  const handleBlur = useCallback(() => {
    const numVal = parseFloat(localValue);
    if (!isNaN(numVal) && numVal !== value) {
      onCommit(numVal);
    } else if (isNaN(numVal)) {
      setLocalValue(String(value)); // Reset to valid value
    }
  }, [localValue, value, onCommit]);

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className={`font-mono bg-background/50 border-border/50 h-8 w-32 ${className}`}
      />
      {unit && <span className="text-muted-foreground text-sm">{unit}</span>}
    </div>
  );
};

const Faceplate3E = () => {
  const { controllerId } = useParams<{ controllerId?: string }>();
  const activeControllerId = controllerId || 'default';
  
  const { updateSyncedPV, updateSyncedSP, updateSyncedOUT, updateSyncedMode, updateAlarmLimits } = useControllerSync(activeControllerId);
  const { getControllerConfig, updateControllerConfig, getControllerData, updateControllerData, saveController } = useControllerConfig();
  
  // Separate state for string fields (stable, no sync)
  const [stringFields, setStringFields] = useState({
    TAGNAME: '',
    DESC: '',
    UNIT: ''
  });
  
  // Config state (without string fields that are managed separately)
  const [config, setConfig] = useState<SecondaryControllerConfig>(defaultSecondaryConfig);
  
  // Data state (live values)
  const [data, setData] = useState<SecondaryControllerData>(defaultSecondaryData);
  
  // Track if initial load is complete
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved config and data ONCE on mount or when controllerId changes
  useEffect(() => {
    const savedConfig = getControllerConfig(activeControllerId);
    const savedData = getControllerData(activeControllerId);
    
    setConfig(savedConfig);
    setStringFields({
      TAGNAME: savedConfig.TAGNAME || '',
      DESC: savedConfig.DESC || '',
      UNIT: savedConfig.UNIT || ''
    });
    setData(savedData);
    setIsLoaded(true);
    
    console.log(`Loaded config for controller: ${activeControllerId}`, savedConfig);
  }, [activeControllerId, getControllerConfig, getControllerData]);

  // Update config field (non-string fields only)
  const updateConfigField = useCallback(<K extends keyof SecondaryControllerConfig>(
    key: K, 
    value: SecondaryControllerConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update string field
  const updateStringField = useCallback((key: 'TAGNAME' | 'DESC' | 'UNIT', value: string) => {
    setStringFields(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update data field (no auto-sync to context)
  const updateDataField = useCallback(<K extends keyof SecondaryControllerData>(
    key: K, 
    value: SecondaryControllerData[K]
  ) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Apply all changes and sync to context
  const handleApply = useCallback(() => {
    // Merge string fields back into config
    const finalConfig: SecondaryControllerConfig = {
      ...config,
      TAGNAME: stringFields.TAGNAME,
      DESC: stringFields.DESC,
      UNIT: stringFields.UNIT
    };
    
    // Save to context and localStorage
    updateControllerConfig(activeControllerId, finalConfig);
    updateControllerData(activeControllerId, data);
    saveController(activeControllerId);
    
    // Use TYPICAL_PV if set, otherwise use current PV for syncing
    const typicalPV = finalConfig.TYPICAL_PV ?? data.PV;
    
    // Sync live values to sync context - set both PV and SP to TYPICAL_PV to prevent drift
    updateSyncedPV(typicalPV);
    updateSyncedSP(typicalPV);  // Critical: SP must match PV to prevent simulation drift
    updateSyncedOUT(data.OUT_PCT);
    updateSyncedMode(data.MODE_AUTOMAN);
    
    // Sync alarm limits to simulation engine
    updateAlarmLimits({
      LL: finalConfig.ALM_LL_LIM ?? 0,
      L: finalConfig.ALM_L_LIM ?? 0,
      H: finalConfig.ALM_H_LIM ?? 0,
      HH: finalConfig.ALM_HH_LIM ?? 0,
    });
    
    toast.success(`Configuration saved for ${stringFields.TAGNAME || activeControllerId}`);
    console.log(`[Faceplate3E] Applied config for ${activeControllerId}, TYPICAL_PV=${typicalPV}`);
  }, [
    config, stringFields, data, activeControllerId,
    updateControllerConfig, updateControllerData, saveController,
    updateSyncedPV, updateSyncedSP, updateSyncedOUT, updateSyncedMode, updateAlarmLimits
  ]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 deltav-grid-pattern">
      <div className="container mx-auto py-8 px-4">
        <Link
          to={getControllerMetadata(activeControllerId).backRoute}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span>Back to {getControllerMetadata(activeControllerId).label}</span>
        </Link>

        <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-6 max-w-5xl mx-auto">
          {/* Controller ID Header */}
          <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <p className="text-cyan-400 font-mono text-lg">
              Editing: <span className="text-white font-bold">{activeControllerId}</span>
            </p>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-faceplate-border glow-text flex items-center gap-3">
                <Sliders className="text-cyan-400" />
                Controller Input Configuration
              </h1>
              <p className="text-muted-foreground">Faceplate 3E - All inputs for Primary & Secondary Controllers</p>
            </div>
            <Button onClick={handleApply} className="bg-cyan-600 hover:bg-cyan-500">
              <Save className="mr-2 h-4 w-4" />
              Apply Changes
            </Button>
          </div>

          <div className="space-y-6">
            {/* Two-column layout for tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column */}
              <div className="space-y-6">
                {/* Section 1: Identification & Configuration */}
                <div className="bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50">
                        <TableHead className="text-cyan-400 font-bold" colSpan={2}>
                          IDENTIFICATION & CONFIGURATION
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Tag Name</TableCell>
                        <TableCell>
                          <StableStringInput
                            value={stringFields.TAGNAME}
                            onCommit={(v) => updateStringField('TAGNAME', v)}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Description</TableCell>
                        <TableCell>
                          <StableStringInput
                            value={stringFields.DESC}
                            onCommit={(v) => updateStringField('DESC', v)}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Unit</TableCell>
                        <TableCell>
                          <StableStringInput
                            value={stringFields.UNIT}
                            onCommit={(v) => updateStringField('UNIT', v)}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Engineering Units</TableCell>
                        <TableCell>
                          <Select 
                            value={config.EU} 
                            onValueChange={(v) => updateConfigField('EU', v)}
                          >
                            <SelectTrigger className="w-32 font-mono bg-background/50 border-border/50 h-8">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-border z-50">
                              <SelectItem value="C">°C (Celsius)</SelectItem>
                              <SelectItem value="F">°F (Fahrenheit)</SelectItem>
                              <SelectItem value="gpm">gpm (Gallons/min)</SelectItem>
                              <SelectItem value="m3/hr">m³/hr (Cubic m/hr)</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Transparent Background</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.TRANSPARENT_BG} 
                            onCheckedChange={(v) => updateConfigField('TRANSPARENT_BG', v)} 
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Section 2: PV Initial Settings */}
                <div className="bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50">
                        <TableHead className="text-amber-400 font-bold" colSpan={2}>
                          PV INITIAL SETTINGS
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-amber-500/10">
                        <TableCell className="text-amber-400 font-medium">Typical PV</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.TYPICAL_PV ?? 0}
                            onCommit={(v) => updateConfigField('TYPICAL_PV', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">PV Initial Value</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.PV_INIT_VAL}
                            onCommit={(v) => updateConfigField('PV_INIT_VAL', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">PV Filter Time</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.PV_FILTER_TIME}
                            onCommit={(v) => updateConfigField('PV_FILTER_TIME', v)}
                            unit="sec"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">PV Square Root Enabled</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.PV_SQROOT_EN} 
                            onCheckedChange={(v) => updateConfigField('PV_SQROOT_EN', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">PV Bad Value Substitute</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.PV_BAD_LIMIT}
                            onCommit={(v) => updateConfigField('PV_BAD_LIMIT', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">PV Scale Low</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.PV_SCALE_LO}
                            onCommit={(v) => updateConfigField('PV_SCALE_LO', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">PV Scale High</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.PV_SCALE_HI}
                            onCommit={(v) => updateConfigField('PV_SCALE_HI', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Section 3: Process Values (Live) */}
                <div className="bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50">
                        <TableHead className="text-emerald-400 font-bold" colSpan={2}>
                          PROCESS VALUES (LIVE)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">PV (Process Variable)</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={data.PV}
                            onCommit={(v) => updateDataField('PV', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">SP (Setpoint)</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={data.SP}
                            onCommit={(v) => updateDataField('SP', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">TSP (Target Setpoint)</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={data.TSP}
                            onCommit={(v) => updateDataField('TSP', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">OUT (Output %)</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={data.OUT_PCT}
                            onCommit={(v) => updateDataField('OUT_PCT', v)}
                            unit="%"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Mode (AUTO/MAN)</TableCell>
                        <TableCell>
                          <Select 
                            value={data.MODE_AUTOMAN} 
                            onValueChange={(v) => updateDataField('MODE_AUTOMAN', v as AutoManMode)}
                          >
                            <SelectTrigger className="w-32 bg-background/50 border-border/50 h-8 font-mono">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-border">
                              <SelectItem value="AUTO">AUTO</SelectItem>
                              <SelectItem value="MAN">MAN</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Routing Mode</TableCell>
                        <TableCell>
                          <Select 
                            value={data.MODE_ROUTRCAS} 
                            onValueChange={(v) => updateDataField('MODE_ROUTRCAS', v as RoutRcasMode)}
                          >
                            <SelectTrigger className="w-32 bg-background/50 border-border/50 h-8 font-mono">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-border">
                              <SelectItem value="DA">DA</SelectItem>
                              <SelectItem value="ROUT">ROUT</SelectItem>
                              <SelectItem value="RCAS">RCAS</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Section 4: Setpoint & Output Limits */}
                <div className="bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50">
                        <TableHead className="text-white font-bold" colSpan={2}>
                          SETPOINT & OUTPUT LIMITS
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">SP Limit Low</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.SP_LIM_LO}
                            onCommit={(v) => updateConfigField('SP_LIM_LO', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">SP Limit High</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.SP_LIM_HI}
                            onCommit={(v) => updateConfigField('SP_LIM_HI', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">SP Ramp Enabled</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.SP_RAMP_EN} 
                            onCheckedChange={(v) => updateConfigField('SP_RAMP_EN', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">SP Ramp Rate</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.SP_RAMP_RATE}
                            onCommit={(v) => updateConfigField('SP_RAMP_RATE', v)}
                            unit={`${config.EU}/min`}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">OUT Limit Low</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.OUT_LIM_LO}
                            onCommit={(v) => updateConfigField('OUT_LIM_LO', v)}
                            unit="%"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">OUT Limit High</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.OUT_LIM_HI}
                            onCommit={(v) => updateConfigField('OUT_LIM_HI', v)}
                            unit="%"
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Section 5: Alarm Limits */}
                <div className="bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50">
                        <TableHead className="text-red-400 font-bold" colSpan={2}>
                          ALARM LIMITS
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Alarm LL (Low-Low)</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.ALM_LL_LIM}
                            onCommit={(v) => updateConfigField('ALM_LL_LIM', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Alarm L (Low)</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.ALM_L_LIM}
                            onCommit={(v) => updateConfigField('ALM_L_LIM', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Alarm DL (Dev Low)</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.ALM_DL_LIM}
                            onCommit={(v) => updateConfigField('ALM_DL_LIM', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Alarm DH (Dev High)</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.ALM_DH_LIM}
                            onCommit={(v) => updateConfigField('ALM_DH_LIM', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Alarm H (High)</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.ALM_H_LIM}
                            onCommit={(v) => updateConfigField('ALM_H_LIM', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Alarm HH (High-High)</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.ALM_HH_LIM}
                            onCommit={(v) => updateConfigField('ALM_HH_LIM', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Section 6: Interlock Configuration */}
                <div className="bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50">
                        <TableHead className="text-orange-400 font-bold" colSpan={2}>
                          INTERLOCK CONFIGURATION
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Enable Interlock on HH Alarm</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.INTLK_HH_EN} 
                            onCheckedChange={(v) => updateConfigField('INTLK_HH_EN', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Enable Interlock on LL Alarm</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.INTLK_LL_EN} 
                            onCheckedChange={(v) => updateConfigField('INTLK_LL_EN', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Interlock Action</TableCell>
                        <TableCell>
                          <Select 
                            value={config.INTLK_ACTION} 
                            onValueChange={(v) => updateConfigField('INTLK_ACTION', v as InterlockAction)}
                          >
                            <SelectTrigger className="w-32 bg-background/50 border-border/50 h-8 font-mono">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-border">
                              <SelectItem value="CLOSE">CLOSE</SelectItem>
                              <SelectItem value="OPEN">OPEN</SelectItem>
                              <SelectItem value="HOLD">HOLD</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Interlock State</TableCell>
                        <TableCell>
                          <span className={`font-mono px-2 py-1 rounded text-sm ${
                            data.INTLK_STATE 
                              ? 'bg-red-500/20 text-red-400' 
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {data.INTLK_STATE ? 'ACTIVE' : 'NORMAL'}
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Section 7: Status Indicators */}
                <div className="bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50">
                        <TableHead className="text-blue-400 font-bold" colSpan={2}>
                          STATUS INDICATORS
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">PV OK</TableCell>
                        <TableCell>
                          <Switch 
                            checked={data.PV_OK} 
                            onCheckedChange={(v) => updateDataField('PV_OK', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">OUT OK</TableCell>
                        <TableCell>
                          <Switch 
                            checked={data.OUT_OK} 
                            onCheckedChange={(v) => updateDataField('OUT_OK', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Track State</TableCell>
                        <TableCell>
                          <Switch 
                            checked={data.TRK_STATE} 
                            onCheckedChange={(v) => updateDataField('TRK_STATE', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Hold Active (H)</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.HOLD_ACTIVE ?? false} 
                            onCheckedChange={(v) => updateConfigField('HOLD_ACTIVE', v)} 
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Section 8: Indicator Visibility */}
                <div className="bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50">
                        <TableHead className="text-violet-400 font-bold" colSpan={2}>
                          INDICATOR VISIBILITY
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Show Hold Indicator (H)</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.SHOW_HOLD_INDICATOR} 
                            onCheckedChange={(v) => updateConfigField('SHOW_HOLD_INDICATOR', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Show Output Path (◇→)</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.SHOW_OUTPUT_PATH_INDICATOR} 
                            onCheckedChange={(v) => updateConfigField('SHOW_OUTPUT_PATH_INDICATOR', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Show Interlock (!)</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.SHOW_INTERLOCK_INDICATOR} 
                            onCheckedChange={(v) => updateConfigField('SHOW_INTERLOCK_INDICATOR', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Show Interlock Diamond (◇I)</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.SHOW_INTERLOCK_DIAMOND_INDICATOR} 
                            onCheckedChange={(v) => updateConfigField('SHOW_INTERLOCK_DIAMOND_INDICATOR', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Show Lock Indicator</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.SHOW_LOCK_INDICATOR} 
                            onCheckedChange={(v) => updateConfigField('SHOW_LOCK_INDICATOR', v)} 
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Faceplate3E;
