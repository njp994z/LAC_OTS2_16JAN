import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useParams, useSearch } from 'wouter';
import { ArrowLeft, Sliders, Save } from 'lucide-react';
import { FaceplateDownloadButtons } from '@/delta-v/components/PythonDownloadButton';
import { getControllerMetadata } from '@/delta-v/lib/controllerMetadata';
import { getDefaultSecondaryControllerConfig } from '@/delta-v/lib/controllerDefaults';
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
      className={`font-mono bg-background/50 border-border/50 w-48 ${className}`}
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
        className={`font-mono bg-background/50 border-border/50 w-32 ${className}`}
      />
      {unit && <span className="text-muted-foreground text-sm">{unit}</span>}
    </div>
  );
};

const Faceplate3E = () => {
  const { controllerId } = useParams<{ controllerId?: string }>();
  const searchString = useSearch();
  
  // Parse query params from search string
  const queryParams = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const fromSource = queryParams.get('from');
  
  // Detect controller ID from URL path if not passed as param
  const getControllerIdFromPath = (): string => {
    const path = window.location.pathname;
    if (path.includes('sulfur-flow-controller')) return '1530-F-2602';
    if (path.includes('hand-controller-4030')) return '1540-H-4030';
    if (path.includes('hand-controller-4282')) return '1540-H-4282';
    if (path.includes('hand-controller-4283')) return '1540-H-4283';
    return 'default';
  };
  
  const activeControllerId = controllerId || getControllerIdFromPath();
  
  // Determine back route based on source
  const getBackRoute = (): string => {
    if (fromSource === 'home-screen') {
      return '/settings/controller-outputs/faceplates/home-screen';
    }
    if (fromSource === 'faceplate') {
      // Return to the specific controller's faceplate page
      return getControllerMetadata(activeControllerId).backRoute;
    }
    // Default fallback to the controller's metadata backRoute
    return getControllerMetadata(activeControllerId).backRoute;
  };
  
  // Determine back label based on source
  const getBackLabel = (): string => {
    if (fromSource === 'home-screen') {
      return 'Home Screen';
    }
    if (fromSource === 'faceplate') {
      return `${getControllerMetadata(activeControllerId).label} Faceplate`;
    }
    return getControllerMetadata(activeControllerId).label;
  };
  
  const { state: syncState, updateSyncedPV, updateSyncedSP, updateSyncedOUT, updateSyncedMode, updateAlarmLimits, updatePvRange, initializeController } = useControllerSync(activeControllerId);
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

  const configRef = useRef(config);
  const stringFieldsRef = useRef(stringFields);
  const dataRef = useRef(data);

  // Load saved config and data ONCE on mount or when controllerId changes
  useEffect(() => {
    const savedConfig = getControllerConfig(activeControllerId);
    const savedData = getControllerData(activeControllerId);
    
    setConfig(savedConfig);
    configRef.current = savedConfig;
    const sf = {
      TAGNAME: savedConfig.TAGNAME || '',
      DESC: savedConfig.DESC || '',
      UNIT: savedConfig.UNIT || ''
    };
    setStringFields(sf);
    stringFieldsRef.current = sf;
    setData(savedData);
    dataRef.current = savedData;
    setIsLoaded(true);
    
    console.log(`Loaded config for controller: ${activeControllerId}`, savedConfig);
  }, [activeControllerId, getControllerConfig, getControllerData]);

  useEffect(() => {
    const defaults = getDefaultSecondaryControllerConfig(activeControllerId);
    const cfg = getControllerConfig(activeControllerId);
    const scaleLo = defaults.PV_SCALE_LO ?? cfg.PV_SCALE_LO;
    const scaleHi = defaults.PV_SCALE_HI ?? cfg.PV_SCALE_HI;
    const pvInitInRange = cfg.PV_INIT_VAL > 0 && scaleLo != null && scaleHi != null && cfg.PV_INIT_VAL >= scaleLo && cfg.PV_INIT_VAL <= scaleHi;
    const initPV = pvInitInRange ? cfg.PV_INIT_VAL : (defaults.TYPICAL_PV ?? cfg.TYPICAL_PV ?? 0);
    if (initPV > 0) {
      initializeController(initPV, initPV, scaleLo, scaleHi);
    }
    if (scaleLo != null && scaleHi != null) {
      updatePvRange(scaleLo, scaleHi);
      if (initPV > 0) {
        const currentSP = syncState.syncedSP;
        const currentPV = syncState.syncedPV;
        if (!Number.isFinite(currentSP) || currentSP < scaleLo || currentSP > scaleHi) {
          updateSyncedSP(initPV);
        }
        if (!Number.isFinite(currentPV) || currentPV < scaleLo || currentPV > scaleHi) {
          updateSyncedPV(initPV);
        }
      }
    }
    updateAlarmLimits({
      LL: defaults.ALM_LL_LIM ?? cfg.ALM_LL_LIM ?? 0,
      L: defaults.ALM_L_LIM ?? cfg.ALM_L_LIM ?? 0,
      H: defaults.ALM_H_LIM ?? cfg.ALM_H_LIM ?? 0,
      HH: defaults.ALM_HH_LIM ?? cfg.ALM_HH_LIM ?? 0,
    });
  }, [activeControllerId, getControllerConfig, initializeController, updatePvRange, updateAlarmLimits]);

  useEffect(() => {
    setData(prev => {
      const next = {
        ...prev,
        PV: syncState.syncedPV,
        SP: syncState.syncedSP,
        OUT_PCT: syncState.syncedOUT,
      };
      dataRef.current = next;
      return next;
    });
  }, [syncState.syncedPV, syncState.syncedSP, syncState.syncedOUT]);

  const updateConfigField = useCallback(<K extends keyof SecondaryControllerConfig>(
    key: K, 
    value: SecondaryControllerConfig[K]
  ) => {
    setConfig(prev => {
      const next = { ...prev, [key]: value };
      configRef.current = next;
      return next;
    });
  }, []);

  const updateStringField = useCallback((key: 'TAGNAME' | 'DESC' | 'UNIT', value: string) => {
    setStringFields(prev => {
      const next = { ...prev, [key]: value };
      stringFieldsRef.current = next;
      return next;
    });
  }, []);

  const updateDataField = useCallback(<K extends keyof SecondaryControllerData>(
    key: K, 
    value: SecondaryControllerData[K]
  ) => {
    setData(prev => {
      const next = { ...prev, [key]: value };
      dataRef.current = next;
      return next;
    });
  }, []);

  // Apply all changes and sync to context (reads from refs to avoid stale closure from onBlur race)
  const handleApply = useCallback(() => {
    const latestConfig = configRef.current;
    const latestStringFields = stringFieldsRef.current;
    const latestData = dataRef.current;

    const finalConfig: SecondaryControllerConfig = {
      ...latestConfig,
      TAGNAME: latestStringFields.TAGNAME,
      DESC: latestStringFields.DESC,
      UNIT: latestStringFields.UNIT
    };
    
    updateControllerConfig(activeControllerId, finalConfig);
    updateControllerData(activeControllerId, latestData);
    saveController(activeControllerId);
    
    const pvScaleLo = finalConfig.PV_SCALE_LO ?? 0;
    const pvScaleHi = finalConfig.PV_SCALE_HI ?? 100;
    const pvInitInRange = finalConfig.PV_INIT_VAL > 0 && finalConfig.PV_INIT_VAL >= pvScaleLo && finalConfig.PV_INIT_VAL <= pvScaleHi;
    const initPV = pvInitInRange ? finalConfig.PV_INIT_VAL : (finalConfig.TYPICAL_PV ?? latestData.PV);
    
    updatePvRange(finalConfig.PV_SCALE_LO ?? 0, finalConfig.PV_SCALE_HI ?? 100);
    updateSyncedPV(initPV);
    updateSyncedSP(initPV);
    updateSyncedOUT(latestData.OUT_PCT);
    updateSyncedMode(latestData.MODE_AUTOMAN);
    
    updateAlarmLimits({
      LL: finalConfig.ALM_LL_LIM ?? 0,
      L: finalConfig.ALM_L_LIM ?? 0,
      H: finalConfig.ALM_H_LIM ?? 0,
      HH: finalConfig.ALM_HH_LIM ?? 0,
    });
    
    toast.success(`Configuration saved for ${latestStringFields.TAGNAME || activeControllerId}`);
    console.log(`[Faceplate3E] Applied config for ${activeControllerId}, initPV=${initPV}`);
  }, [
    activeControllerId,
    updateControllerConfig, updateControllerData, saveController,
    updatePvRange, updateSyncedPV, updateSyncedSP, updateSyncedOUT, updateSyncedMode, updateAlarmLimits
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
          to={getBackRoute()}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span>Back to {getBackLabel()}</span>
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
            <div className="flex gap-2">
              <FaceplateDownloadButtons faceplateId="3E" />
              <Button onClick={handleApply} className="bg-cyan-600 hover:bg-cyan-500">
                <Save className="mr-2 h-4 w-4" />
                Apply Changes
              </Button>
            </div>
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
                            <SelectTrigger className="w-32 bg-background/50 border-border/50 font-mono">
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
                            <SelectTrigger className="w-32 bg-background/50 border-border/50 font-mono">
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
                            <SelectTrigger className="w-32 bg-background/50 border-border/50 font-mono">
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
