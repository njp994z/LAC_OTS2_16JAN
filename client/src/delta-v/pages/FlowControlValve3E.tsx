import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'wouter';
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
  InterlockAction,
  ValveTypeAction,
} from '@/delta-v/types/secondaryController';
import { toast } from 'sonner';

// Flow control valve data
const flowControlValves: Record<string, { name: string; description: string }> = {
  '1540-fcv-2602': { name: '1540-FCV-2602', description: 'Sulfur Feed Valve' },
  '1520-fcv-5870': { name: '1520-FCV-5870', description: 'Acid Gas Feed Valve' },
  '1520-fcv-6770': { name: '1520-FCV-6770', description: 'Combustion Air Valve' },
  '1520-fcv-6670': { name: '1520-FCV-6670', description: 'Steam Injection Valve' },
};

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

const FlowControlValve3E = () => {
  const { valveId } = useParams<{ valveId: string }>();
  const valve = valveId ? flowControlValves[valveId.toLowerCase()] : null;
  
  // Use valve ID as controller ID (uppercase version)
  const activeControllerId = valve?.name || valveId?.toUpperCase() || 'default';
  
  const { updateSyncedPV, updateSyncedSP, updateSyncedOUT, updateSyncedMode } = useControllerSync(activeControllerId);
  const { getControllerConfig, updateControllerConfig, getControllerData, updateControllerData, saveController } = useControllerConfig();
  
  // Separate state for string fields (stable, no sync)
  const [stringFields, setStringFields] = useState({
    TAGNAME: '',
    DESC: ''
  });
  
  // Config state (without string fields that are managed separately)
  const [config, setConfig] = useState<SecondaryControllerConfig>(defaultSecondaryConfig);
  
  // Data state (live values)
  const [data, setData] = useState<SecondaryControllerData>(defaultSecondaryData);
  
  // Track if initial load is complete
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved config and data ONCE on mount or when valveId changes
  useEffect(() => {
    const savedConfig = getControllerConfig(activeControllerId);
    const savedData = getControllerData(activeControllerId);
    
    // Use valve data as defaults if config is empty
    const defaultTagName = savedConfig.TAGNAME || valve?.name || activeControllerId;
    const defaultDesc = savedConfig.DESC || valve?.description || 'Flow Control Valve';
    
    setConfig(savedConfig);
    setStringFields({
      TAGNAME: defaultTagName,
      DESC: defaultDesc
    });
    setData(savedData);
    setIsLoaded(true);
    
    console.log(`Loaded config for valve: ${activeControllerId}`, savedConfig);
  }, [activeControllerId, getControllerConfig, getControllerData, valve]);

  // Update config field (non-string fields only)
  const updateConfigField = useCallback(<K extends keyof SecondaryControllerConfig>(
    key: K, 
    value: SecondaryControllerConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update string field
  const updateStringField = useCallback((key: 'TAGNAME' | 'DESC', value: string) => {
    setStringFields(prev => ({ ...prev, [key]: value }));
  }, []);

  // Apply all changes and sync to context
  const handleApply = useCallback(() => {
    // Merge string fields back into config
    const finalConfig: SecondaryControllerConfig = {
      ...config,
      TAGNAME: stringFields.TAGNAME,
      DESC: stringFields.DESC
    };
    
    // Save to context and localStorage
    updateControllerConfig(activeControllerId, finalConfig);
    updateControllerData(activeControllerId, data);
    saveController(activeControllerId);
    
    // Sync live values to sync context
    updateSyncedPV(data.PV);
    updateSyncedSP(data.SP);
    updateSyncedOUT(data.OUT_PCT);
    updateSyncedMode(data.MODE_AUTOMAN);
    
    toast.success(`Configuration saved for ${stringFields.TAGNAME || activeControllerId}`);
  }, [
    config, stringFields, data, activeControllerId,
    updateControllerConfig, updateControllerData, saveController,
    updateSyncedPV, updateSyncedSP, updateSyncedOUT, updateSyncedMode
  ]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!valve) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Valve Not Found</h1>
          <Link href="/settings/controller-outputs/faceplates/valve/flow-control" className="text-cyan-400 hover:underline">
            Back to Flow Control Valves
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 deltav-grid-pattern">
      <div className="container mx-auto py-8 px-4">
        <Link
          to={`/settings/controller-outputs/faceplates/valve-blocks/flow-control/${valveId}`}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span>Back to {valve.name}</span>
        </Link>

        <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-faceplate-border glow-text flex items-center gap-3">
                <Sliders className="text-cyan-400" />
                Control Valve Input Configuration
              </h1>
              <p className="text-muted-foreground">Faceplate 3E - {valve.name} {valve.description}</p>
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

                {/* Section 2: Valve Type / Action */}
                <div className="bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50">
                        <TableHead className="text-emerald-400 font-bold" colSpan={2}>
                          VALVE TYPE / ACTION
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Valve Type / Action</TableCell>
                        <TableCell>
                          <Select 
                            value={config.VALVE_TYPE_ACTION} 
                            onValueChange={(v) => updateConfigField('VALVE_TYPE_ACTION', v as ValveTypeAction)}
                          >
                            <SelectTrigger className="w-48 bg-background/50 border-border/50 h-8 font-mono">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-border z-50">
                              <SelectItem value="DA">DA – Direct Acting</SelectItem>
                              <SelectItem value="RA">RA – Reverse Acting</SelectItem>
                              <SelectItem value="FO">FO – Fail Open</SelectItem>
                              <SelectItem value="FC">FC – Fail Close</SelectItem>
                              <SelectItem value="FL">FL – Fail Locked</SelectItem>
                              <SelectItem value="NO">NO – Normally Open</SelectItem>
                              <SelectItem value="NC">NC – Normally Closed</SelectItem>
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
                {/* Section 2: Interlock Configuration */}
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

                {/* Section 3: Indicator Visibility */}
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
                        <TableCell className="text-muted-foreground font-medium">Show Alarm Circle (✓/✗)</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.SHOW_ALARM_CIRCLE} 
                            onCheckedChange={(v) => updateConfigField('SHOW_ALARM_CIRCLE', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Show No Symbol (⊘)</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.SHOW_NO_SYMBOL} 
                            onCheckedChange={(v) => updateConfigField('SHOW_NO_SYMBOL', v)} 
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
                        <TableCell className="text-muted-foreground font-medium">Show Blue Alarm (!!)</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.SHOW_BLUE_ALARM_INDICATOR} 
                            onCheckedChange={(v) => updateConfigField('SHOW_BLUE_ALARM_INDICATOR', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Show Bad IO Indicator (Purple X)</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.SHOW_BAD_IO_INDICATOR} 
                            onCheckedChange={(v) => updateConfigField('SHOW_BAD_IO_INDICATOR', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Show Module Not Running (Orange bars)</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.SHOW_MODULE_NOT_RUNNING} 
                            onCheckedChange={(v) => updateConfigField('SHOW_MODULE_NOT_RUNNING', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Show Valve Type Label (DA)</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.SHOW_VALVE_TYPE_LABEL} 
                            onCheckedChange={(v) => updateConfigField('SHOW_VALVE_TYPE_LABEL', v)} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Show Lock Icon (🔓)</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.SHOW_LOCK_INDICATOR} 
                            onCheckedChange={(v) => updateConfigField('SHOW_LOCK_INDICATOR', v)} 
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
                        <TableCell className="text-muted-foreground font-medium">Show Interlock Indicator (!)</TableCell>
                        <TableCell>
                          <Switch 
                            checked={config.SHOW_INTERLOCK_INDICATOR} 
                            onCheckedChange={(v) => updateConfigField('SHOW_INTERLOCK_INDICATOR', v)} 
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

export default FlowControlValve3E;
