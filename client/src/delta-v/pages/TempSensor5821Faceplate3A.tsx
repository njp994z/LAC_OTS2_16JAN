import { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Download, Upload, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useControllerSync } from '@/delta-v/contexts/ControllerSyncContext';
import {
  PIDHxBypassConfig,
  defaultPIDHxBypassConfig,
} from '@/delta-v/types/pidHxBypassConfig';

// Independent localStorage key for this controller
const TEMP_SENSOR_5821_PID_CONFIG_KEY = 'temp_sensor_5821_pid_config';

// Stable input components to prevent re-render issues
const StableNumberInput = ({
  value,
  onChange,
  className = '',
}: {
  value: number;
  onChange: (val: number) => void;
  className?: string;
}) => {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleBlur = () => {
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else {
      setLocalValue(String(value));
    }
  };

  return (
    <Input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      className={`h-8 bg-slate-800 border-slate-600 text-foreground font-mono text-sm ${className}`}
    />
  );
};

const StableStringInput = ({
  value,
  onChange,
  className = '',
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <Input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => onChange(localValue)}
      className={`h-8 bg-slate-800 border-slate-600 text-foreground font-mono text-sm ${className}`}
    />
  );
};

const TempSensor5821Faceplate3A = () => {
  const activeControllerId = '1520-TI-5821';
  
  const { toast } = useToast();
  const { state } = useControllerSync(activeControllerId);
  const [config, setConfig] = useState<PIDHxBypassConfig>({
    ...defaultPIDHxBypassConfig,
    loop_tag: '1520-TI-5821',
    service_desc: 'DT Gas Out Temperature',
    eng_units: 'C',
  });
  const [summary, setSummary] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Load config from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(TEMP_SENSOR_5821_PID_CONFIG_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PIDHxBypassConfig;
        setConfig(parsed);
      } catch (e) {
        console.error('Failed to load PID HX Bypass config:', e);
      }
    }
  }, []);

  // Sync mode from Secondary Controller
  useEffect(() => {
    if (state.syncedMode) {
      const modeMap: Record<string, 'MAN' | 'AUTO' | 'CAS'> = {
        MAN: 'MAN',
        AUTO: 'AUTO',
        CAS: 'CAS',
        RCAS: 'CAS',
        ROUT: 'AUTO',
        LO: 'MAN',
        BYPASS: 'MAN',
      };
      const mappedMode = modeMap[state.syncedMode] || 'AUTO';
      if (config.mode !== mappedMode) {
        setConfig((prev) => ({ ...prev, mode: mappedMode }));
      }
    }
  }, [state.syncedMode]);

  const updateConfig = useCallback(<K extends keyof PIDHxBypassConfig>(key: K, value: PIDHxBypassConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveConfig = useCallback(() => {
    localStorage.setItem(TEMP_SENSOR_5821_PID_CONFIG_KEY, JSON.stringify(config));
    toast({ title: 'Configuration Saved', description: 'Settings saved to local storage.' });
  }, [config, toast]);

  const resetToDefaults = useCallback(() => {
    setConfig({
      ...defaultPIDHxBypassConfig,
      loop_tag: '1520-TI-5821',
      service_desc: 'DT Gas Out Temperature',
      eng_units: 'C',
    });
    toast({ title: 'Reset Complete', description: 'Configuration reset to defaults.' });
  }, [toast]);

  const validateInputs = useCallback(() => {
    try {
      if (config.xbar < 0 || config.xbar > 1) {
        throw new Error('Nominal bypass fraction x̄ must be between 0 and 1.');
      }
      if (config.u_min >= config.u_max) {
        throw new Error('u_min must be < u_max.');
      }
      setValidationStatus('valid');
      toast({ title: 'Validation OK', description: 'All inputs are valid ✓' });
    } catch (e) {
      setValidationStatus('invalid');
      toast({ title: 'Validation Failed', description: (e as Error).message, variant: 'destructive' });
    }
  }, [config, toast]);

  const computeSummary = useCallback(() => {
    const dTout_dx_mix = config.Tin0 - config.Thx0;
    const sign_hint = dTout_dx_mix < 0
      ? 'Negative (bypass-open tends to reduce Tout)'
      : 'Positive';

    const lines = [
      `Loop: ${config.loop_tag}  |  ${config.service_desc}`,
      '',
      'Core equations:',
      '  PID (ISA/parallel): u = u_bias + Kc [ e + (1/τI)∫e dt + τD de/dt ]',
      '',
      `Key parameters: Kc=${config.Kc}, τI=${config.tauI_s} s, τD=${config.tauD_s} s`,
    ];
    setSummary(lines.join('\n'));
    toast({ title: 'Summary Computed', description: 'Model summary generated.' });
  }, [config, toast]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.loop_tag}_config.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Configuration exported as JSON.' });
  }, [config, toast]);

  const importJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const parsed = JSON.parse(ev.target?.result as string) as PIDHxBypassConfig;
            setConfig(parsed);
            toast({ title: 'Imported', description: 'Configuration loaded from JSON.' });
          } catch {
            toast({ title: 'Import Failed', description: 'Invalid JSON file.', variant: 'destructive' });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [toast]);

  // Row renderer helpers
  const renderNumberRow = (label: string, key: keyof PIDHxBypassConfig, unit?: string, help?: string) => (
    <tr className="border-b border-slate-700/50">
      <td className="py-2 px-3 text-sm text-muted-foreground">{label}</td>
      <td className="py-2 px-3">
        <StableNumberInput
          value={config[key] as number}
          onChange={(val) => updateConfig(key, val as PIDHxBypassConfig[typeof key])}
          className="w-32"
        />
      </td>
      <td className="py-2 px-3 text-sm text-muted-foreground">{unit || ''}</td>
      <td className="py-2 px-3 text-xs text-slate-500">{help || ''}</td>
    </tr>
  );

  const renderStringRow = (label: string, key: keyof PIDHxBypassConfig, width = 'w-48') => (
    <tr className="border-b border-slate-700/50">
      <td className="py-2 px-3 text-sm text-muted-foreground">{label}</td>
      <td className="py-2 px-3" colSpan={3}>
        <StableStringInput
          value={config[key] as string}
          onChange={(val) => updateConfig(key, val as PIDHxBypassConfig[typeof key])}
          className={width}
        />
      </td>
    </tr>
  );

  const renderSelectRow = (
    label: string,
    key: keyof PIDHxBypassConfig,
    options: string[],
    help?: string
  ) => (
    <tr className="border-b border-slate-700/50">
      <td className="py-2 px-3 text-sm text-muted-foreground">{label}</td>
      <td className="py-2 px-3">
        <Select
          value={config[key] as string}
          onValueChange={(val) => updateConfig(key, val as PIDHxBypassConfig[typeof key])}
        >
          <SelectTrigger className="w-40 h-8 bg-slate-800 border-slate-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="py-2 px-3"></td>
      <td className="py-2 px-3 text-xs text-slate-500">{help || ''}</td>
    </tr>
  );

  const renderBoolRow = (label: string, key: keyof PIDHxBypassConfig, help?: string) => (
    <tr className="border-b border-slate-700/50">
      <td className="py-2 px-3 text-sm text-muted-foreground">{label}</td>
      <td className="py-2 px-3">
        <Switch
          checked={config[key] as boolean}
          onCheckedChange={(val) => updateConfig(key, val as PIDHxBypassConfig[typeof key])}
        />
      </td>
      <td className="py-2 px-3"></td>
      <td className="py-2 px-3 text-xs text-slate-500">{help || ''}</td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 deltav-grid-pattern">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              to="/settings/controller-outputs/faceplates/temp-sensor/1520-TI-5821"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to 1520-TI-5821 Temperature Sensor</span>
            </Link>
            <h1 className="text-xl font-bold text-faceplate-border glow-text">
              PID Control Loop Configuration
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={computeSummary} className="gap-2">
              <CheckCircle size={16} />
              Compute Summary
            </Button>
            <Button variant="outline" size="sm" onClick={exportJSON} className="gap-2">
              <Download size={16} />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={importJSON} className="gap-2">
              <Upload size={16} />
              Load JSON
            </Button>
          </div>
        </div>

        {/* Main Card with Tabs */}
        <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-4">
          <Tabs defaultValue="loop-info" className="w-full">
            <TabsList className="flex flex-wrap gap-1 h-auto bg-slate-800/50 p-1 mb-4">
              <TabsTrigger value="loop-info" className="text-xs">Loop Info</TabsTrigger>
              <TabsTrigger value="operating-point" className="text-xs">Operating Point</TabsTrigger>
              <TabsTrigger value="pid" className="text-xs">PID</TabsTrigger>
              <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
            </TabsList>

            {/* Loop Info Tab */}
            <TabsContent value="loop-info">
              <div className="bg-slate-800/30 rounded-lg border border-cyan-500/30">
                <div className="bg-cyan-900/30 px-3 py-2 border-b border-cyan-500/30">
                  <h3 className="text-sm font-semibold text-cyan-400">Tagging & Units</h3>
                </div>
                <table className="w-full">
                  <tbody>
                    {renderStringRow('Loop Tag', 'loop_tag', 'w-32')}
                    {renderStringRow('Service Description', 'service_desc', 'w-96')}
                    {renderSelectRow('Engineering Units', 'eng_units', ['C', 'F', 'K'])}
                    {renderNumberRow('Sample Time Δt', 'sample_time_dt_s', 's')}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Operating Point Tab */}
            <TabsContent value="operating-point">
              <div className="bg-slate-800/30 rounded-lg border border-amber-500/30">
                <div className="bg-amber-900/30 px-3 py-2 border-b border-amber-500/30">
                  <h3 className="text-sm font-semibold text-amber-400">Nominal Operating Point</h3>
                </div>
                <table className="w-full">
                  <tbody>
                    {renderNumberRow('Nominal Inlet Temp Tin0', 'Tin0', config.eng_units)}
                    {renderNumberRow('Nominal HX Outlet Temp Thx0', 'Thx0', config.eng_units)}
                    {renderNumberRow('Nominal Outlet Temp Tout0', 'Tout0', config.eng_units)}
                    {renderNumberRow('Nominal Bypass Fraction x̄', 'xbar', '', '0..1')}
                    {renderNumberRow('Nominal Controller Output u0', 'u0', '%')}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* PID Tab */}
            <TabsContent value="pid">
              <div className="bg-slate-800/30 rounded-lg border border-cyan-500/30">
                <div className="bg-cyan-900/30 px-3 py-2 border-b border-cyan-500/30">
                  <h3 className="text-sm font-semibold text-cyan-400">PID Controller</h3>
                </div>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-2 px-3 text-sm text-muted-foreground">Mode</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-mono ${
                            config.mode === 'AUTO' ? 'bg-green-600 text-white' :
                            config.mode === 'MAN' ? 'bg-orange-500 text-white' :
                            'bg-cyan-600 text-white'
                          }`}>
                            {config.mode}
                          </span>
                          <span className="text-xs text-slate-500">(Synced: {state.syncedMode})</span>
                        </div>
                      </td>
                      <td className="py-2 px-3"></td>
                      <td className="py-2 px-3"></td>
                    </tr>
                    {renderSelectRow('Direct/Reverse Acting', 'acting', ['Direct Acting', 'Reverse Acting'])}
                    {renderNumberRow('Controller Gain Kc', 'Kc')}
                    {renderNumberRow('Integral Time τI', 'tauI_s', 's')}
                    {renderNumberRow('Derivative Time τD', 'tauD_s', 's')}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary">
              <div className="bg-slate-800/30 rounded-lg border border-slate-600/30">
                <div className="bg-slate-700/30 px-3 py-2 border-b border-slate-600/30 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-300">Model Summary</h3>
                  <Button variant="ghost" size="sm" onClick={computeSummary}>
                    Refresh Summary
                  </Button>
                </div>
                <div className="p-4">
                  <pre className="font-mono text-xs text-green-400 bg-slate-900 rounded p-4 overflow-auto max-h-96 whitespace-pre-wrap">
                    {summary || "Click 'Compute Summary' to generate a model summary."}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-sm">
              {validationStatus === 'valid' && (
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircle size={16} />
                  Valid
                </span>
              )}
              {validationStatus === 'invalid' && (
                <span className="flex items-center gap-1 text-red-400">
                  <AlertCircle size={16} />
                  Invalid
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetToDefaults} className="gap-2">
                <RotateCcw size={16} />
                Reset Defaults
              </Button>
              <Button variant="outline" size="sm" onClick={validateInputs}>
                Validate
              </Button>
              <Button onClick={saveConfig} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                Save Configuration
              </Button>
            </div>
          </div>
        </div>

        {/* Controller Info Grid */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <h3 className="text-xs font-medium text-muted-foreground mb-1">Controller Tag</h3>
            <p className="text-sm font-mono text-foreground">{config.loop_tag}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <h3 className="text-xs font-medium text-muted-foreground mb-1">Controller Type</h3>
            <p className="text-sm font-mono text-foreground">Temperature Sensor</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <h3 className="text-xs font-medium text-muted-foreground mb-1">Description</h3>
            <p className="text-sm font-mono text-foreground">{config.service_desc}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <h3 className="text-xs font-medium text-muted-foreground mb-1">Engineering Unit</h3>
            <p className="text-sm font-mono text-foreground">{config.eng_units}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TempSensor5821Faceplate3A;
