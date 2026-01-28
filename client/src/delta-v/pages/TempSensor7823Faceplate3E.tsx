import { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Sliders, Save } from 'lucide-react';
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
} from '@/delta-v/types/secondaryController';
import { toast } from 'sonner';

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
      setLocalValue(String(value));
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

const TempSensor7823Faceplate3E = () => {
  const activeControllerId = '1540-TI-7823';
  
  const { updateSyncedPV, updateSyncedSP, updateSyncedOUT, updateSyncedMode, updateAlarmLimits } = useControllerSync(activeControllerId);
  const { getControllerConfig, updateControllerConfig, getControllerData, updateControllerData, saveController } = useControllerConfig();
  
  const [stringFields, setStringFields] = useState({
    TAGNAME: '1540-TI-7823',
    DESC: 'SH 1B Outlet Temp.',
    UNIT: ''
  });
  
  const [config, setConfig] = useState<SecondaryControllerConfig>({
    ...defaultSecondaryConfig,
    EU: 'F',
    PV_SCALE_LO: 0,
    PV_SCALE_HI: 2000,
    SP_LIM_LO: 0,
    SP_LIM_HI: 2000,
  });
  
  const [data, setData] = useState<SecondaryControllerData>(defaultSecondaryData);
  
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedConfig = getControllerConfig(activeControllerId);
    const savedData = getControllerData(activeControllerId);
    
    if (!savedConfig.TAGNAME || savedConfig.TAGNAME === defaultSecondaryConfig.TAGNAME) {
      setConfig({
        ...defaultSecondaryConfig,
        TAGNAME: '1540-TI-7823',
        DESC: 'SH 1B Outlet Temp.',
        EU: 'F',
        PV_SCALE_LO: 0,
        PV_SCALE_HI: 2000,
        SP_LIM_LO: 0,
        SP_LIM_HI: 2000,
      });
      setStringFields({
        TAGNAME: '1540-TI-7823',
        DESC: 'SH 1B Outlet Temp.',
        UNIT: ''
      });
    } else {
      setConfig(savedConfig);
      setStringFields({
        TAGNAME: savedConfig.TAGNAME || '1540-TI-7823',
        DESC: savedConfig.DESC || 'SH 1B Outlet Temp.',
        UNIT: savedConfig.UNIT || ''
      });
    }
    setData(savedData);
    setIsLoaded(true);
  }, [activeControllerId, getControllerConfig, getControllerData]);

  const updateConfigField = useCallback(<K extends keyof SecondaryControllerConfig>(
    key: K, 
    value: SecondaryControllerConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateStringField = useCallback((key: 'TAGNAME' | 'DESC' | 'UNIT', value: string) => {
    setStringFields(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateDataField = useCallback(<K extends keyof SecondaryControllerData>(
    key: K, 
    value: SecondaryControllerData[K]
  ) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleApply = useCallback(() => {
    const finalConfig: SecondaryControllerConfig = {
      ...config,
      TAGNAME: stringFields.TAGNAME,
      DESC: stringFields.DESC,
      UNIT: stringFields.UNIT
    };
    
    updateControllerConfig(activeControllerId, finalConfig);
    updateControllerData(activeControllerId, data);
    saveController(activeControllerId);
    
    const typicalPV = config.TYPICAL_PV ?? data.PV;
    updateSyncedPV(typicalPV);
    updateSyncedSP(typicalPV);
    updateSyncedOUT(data.OUT_PCT);
    updateSyncedMode(data.MODE_AUTOMAN);
    
    updateAlarmLimits({
      LL: config.ALM_LL_LIM ?? 0,
      L: config.ALM_L_LIM ?? 0,
      H: config.ALM_H_LIM ?? 0,
      HH: config.ALM_HH_LIM ?? 0,
    });
    
    toast.success(`Configuration saved for ${stringFields.TAGNAME || activeControllerId}`);
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
          to="/settings/controller-outputs/faceplates/temp-sensor/1540-TI-7823"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span>Back to 1540-TI-7823 Temperature Sensor</span>
        </Link>

        <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-faceplate-border glow-text flex items-center gap-3">
                <Sliders className="text-cyan-400" />
                Sensor Input Configuration
              </h1>
              <p className="text-muted-foreground">Faceplate 3E - All inputs for Primary & Secondary Sensors</p>
            </div>
            <Button onClick={handleApply} className="bg-cyan-600 hover:bg-cyan-500">
              <Save className="mr-2 h-4 w-4" />
              Apply Changes
            </Button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="space-y-6">
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
                              <SelectItem value="C">C (Celsius)</SelectItem>
                              <SelectItem value="F">F (Fahrenheit)</SelectItem>
                              <SelectItem value="K">K (Kelvin)</SelectItem>
                            </SelectContent>
                        </Select>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Area</TableCell>
                        <TableCell>
                          <StableStringInput
                            value={stringFields.UNIT}
                            onCommit={(v) => updateStringField('UNIT', v)}
                          />
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
              </div>

              <div className="space-y-6">
                <div className="bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50">
                        <TableHead className="text-white font-bold" colSpan={2}>
                          SENSOR RANGE
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Range Low</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.SP_LIM_LO}
                            onCommit={(v) => updateConfigField('SP_LIM_LO', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Range High</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.SP_LIM_HI}
                            onCommit={(v) => updateConfigField('SP_LIM_HI', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Typical PV</TableCell>
                        <TableCell>
                          <StableNumberInput
                            value={config.TYPICAL_PV ?? 0}
                            onCommit={(v) => updateConfigField('TYPICAL_PV', v)}
                            unit={config.EU}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>


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

export default TempSensor7823Faceplate3E;
