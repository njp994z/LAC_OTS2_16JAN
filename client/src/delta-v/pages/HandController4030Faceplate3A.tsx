import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Download, Upload, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useControllerSync } from '@/delta-v/contexts/ControllerSyncContext';
import PIDControlLoopDiagram from '@/delta-v/components/faceplate/PIDControlLoopDiagram';
import {
  MainCompressorConfig,
  defaultMainCompressorConfig,
  MAIN_COMPRESSOR_CONFIG_KEY,
} from '@/delta-v/types/mainCompressorConfig';

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

const HandController4030Faceplate3A = () => {
  const activeControllerId = '1540-H-4030';
  const [, setLocation] = useLocation();
  
  const { toast } = useToast();
  const { state } = useControllerSync(activeControllerId);
  
  const handleBackNavigation = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation('/delta-v');
    }
  }, [setLocation]);
  const [config, setConfig] = useState<MainCompressorConfig>(defaultMainCompressorConfig);
  const [summary, setSummary] = useState<string>('');
  const [diagramOpen, setDiagramOpen] = useState(true);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Load config from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(MAIN_COMPRESSOR_CONFIG_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as MainCompressorConfig;
        setConfig(parsed);
      } catch (e) {
        console.error('Failed to load Main Compressor config:', e);
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

  const updateConfig = useCallback(<K extends keyof MainCompressorConfig>(key: K, value: MainCompressorConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveConfig = useCallback(() => {
    localStorage.setItem(MAIN_COMPRESSOR_CONFIG_KEY, JSON.stringify(config));
    toast({ title: 'Configuration Saved', description: 'Settings saved to local storage.' });
  }, [config, toast]);

  const resetToDefaults = useCallback(() => {
    setConfig(defaultMainCompressorConfig);
    toast({ title: 'Reset Complete', description: 'Configuration reset to defaults.' });
  }, [toast]);

  const validateInputs = useCallback(() => {
    try {
      if (config.eta_VFD < 0 || config.eta_VFD > 1) {
        throw new Error('VFD efficiency (η_VFD) must be between 0 and 1.');
      }
      if (config.eta_MTR < 0 || config.eta_MTR > 1) {
        throw new Error('Motor efficiency (η_MTR) must be between 0 and 1.');
      }
      if (config.eta_CMP < 0 || config.eta_CMP > 1) {
        throw new Error('Compressor efficiency (η_CMP) must be between 0 and 1.');
      }
      if (config.zeta < 0 || config.zeta > 1) {
        throw new Error('Damping ratio (ζ) must be between 0 and 1.');
      }
      if (config.K_RPM_Max <= 0) {
        throw new Error('Maximum RPM must be > 0.');
      }
      setValidationStatus('valid');
      toast({ title: 'Validation OK', description: 'All inputs are valid ✓' });
    } catch (e) {
      setValidationStatus('invalid');
      toast({ title: 'Validation Failed', description: (e as Error).message, variant: 'destructive' });
    }
  }, [config, toast]);

  const computeSummary = useCallback(() => {
    const overallGain = config.eta_VFD * config.K_VFD * config.eta_MTR * config.K_MTR * config.eta_CMP * config.K_CMP;
    
    const lines = [
      `Loop: ${config.loop_tag}  |  ${config.service_desc}`,
      '',
      '=== PID Controller ===',
      `  Kp = ${config.Kp} (Proportional Gain)`,
      `  Ki = ${config.Ki} 1/s (Integral Gain)`,
      `  Kd = ${config.Kd} s (Derivative Gain)`,
      `  Mode: ${config.mode}  |  ${config.acting}`,
      '',
      '=== VFD Transfer Function ===',
      `  G_VFD(s) = (η_VFD × K_VFD) / (1 + τ_VFD × s)`,
      `  η_VFD = ${config.eta_VFD}  |  K_VFD = ${config.K_VFD} HP  |  τ_VFD = ${config.tau_VFD} s`,
      '',
      '=== Motor Transfer Function ===',
      `  G_MTR(s) = (η_MTR × K_MTR) / (1 + τ_MTR × s)`,
      `  η_MTR = ${config.eta_MTR}  |  K_MTR = ${config.K_MTR}  |  τ_MTR = ${config.tau_MTR} s`,
      '',
      '=== Compressor Transfer Function (2nd Order) ===',
      `  G_CMP(s) = (η_CMP × K_CMP × ω_n²) / (s² + 2ζω_n·s + ω_n²)`,
      `  η_CMP = ${config.eta_CMP}  |  K_CMP = ${config.K_CMP} RPM/HP`,
      `  ω_n = ${config.omega_n} rad/s  |  ζ = ${config.zeta}`,
      '',
      '=== System Parameters ===',
      `  K_RPM_Max = ${config.K_RPM_Max} RPM`,
      `  Dead Time θ = ${config.theta} s`,
      `  Low-Pass Filter τ_LPF = ${config.tau_LPF} s`,
      '',
      `=== Overall Steady-State Gain ===`,
      `  K_overall = η_VFD × K_VFD × η_MTR × K_MTR × η_CMP × K_CMP`,
      `           = ${overallGain.toFixed(2)} RPM per unit input`,
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
            const parsed = JSON.parse(ev.target?.result as string) as MainCompressorConfig;
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
  const renderNumberRow = (label: string, key: keyof MainCompressorConfig, unit?: string, help?: string) => (
    <tr className="border-b border-slate-700/50">
      <td className="py-2 px-3 text-sm text-muted-foreground">{label}</td>
      <td className="py-2 px-3">
        <StableNumberInput
          value={config[key] as number}
          onChange={(val) => updateConfig(key, val as MainCompressorConfig[typeof key])}
          className="w-32"
        />
      </td>
      <td className="py-2 px-3 text-sm text-muted-foreground">{unit || ''}</td>
      <td className="py-2 px-3 text-xs text-slate-500">{help || ''}</td>
    </tr>
  );

  const renderStringRow = (label: string, key: keyof MainCompressorConfig, width = 'w-48') => (
    <tr className="border-b border-slate-700/50">
      <td className="py-2 px-3 text-sm text-muted-foreground">{label}</td>
      <td className="py-2 px-3" colSpan={3}>
        <StableStringInput
          value={config[key] as string}
          onChange={(val) => updateConfig(key, val as MainCompressorConfig[typeof key])}
          className={width}
        />
      </td>
    </tr>
  );

  const renderSelectRow = (
    label: string,
    key: keyof MainCompressorConfig,
    options: string[],
    help?: string
  ) => (
    <tr className="border-b border-slate-700/50">
      <td className="py-2 px-3 text-sm text-muted-foreground">{label}</td>
      <td className="py-2 px-3">
        <Select
          value={config[key] as string}
          onValueChange={(val) => updateConfig(key, val as MainCompressorConfig[typeof key])}
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 deltav-grid-pattern">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackNavigation}
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              data-testid="button-back-to-last-screen"
            >
              <ArrowLeft size={18} />
              <span>Back to Last Screen</span>
            </button>
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

        {/* Collapsible Diagram */}
        <Collapsible open={diagramOpen} onOpenChange={setDiagramOpen} className="mb-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-cyan-400 hover:text-cyan-300 mb-2">
              <span>Control Loop Block Diagram</span>
              <span>{diagramOpen ? '▼' : '►'}</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-border/50">
              <PIDControlLoopDiagram />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Main Card with Tabs */}
        <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-4">
          <Tabs defaultValue="loop-info" className="w-full">
            <TabsList className="flex flex-wrap gap-1 h-auto bg-slate-800/50 p-1 mb-4">
              <TabsTrigger value="loop-info" className="text-xs">Loop Info</TabsTrigger>
              <TabsTrigger value="pid" className="text-xs">PID Controller</TabsTrigger>
              <TabsTrigger value="transfer" className="text-xs">Transfer Functions</TabsTrigger>
              <TabsTrigger value="system" className="text-xs">System Params</TabsTrigger>
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
                    {renderSelectRow('Engineering Units', 'eng_units', ['% HIC', 'RPM', 'HP'])}
                    {renderNumberRow('Sample Time Δt', 'sample_time_dt_s', 's')}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* PID Controller Tab */}
            <TabsContent value="pid">
              <div className="bg-slate-800/30 rounded-lg border border-green-500/30">
                <div className="bg-green-900/30 px-3 py-2 border-b border-green-500/30">
                  <h3 className="text-sm font-semibold text-green-400">PID Controller (H-4030)</h3>
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
                    {renderNumberRow('Proportional Gain Kp', 'Kp', '', 'Dimensionless')}
                    {renderNumberRow('Integral Gain Ki', 'Ki', '1/s', 'Integral action')}
                    {renderNumberRow('Derivative Gain Kd', 'Kd', 's', 'Derivative action')}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Transfer Functions Tab */}
            <TabsContent value="transfer">
              <div className="space-y-4">
                {/* VFD Transfer Function */}
                <div className="bg-slate-800/30 rounded-lg border border-amber-500/30">
                  <div className="bg-amber-900/30 px-3 py-2 border-b border-amber-500/30">
                    <h3 className="text-sm font-semibold text-amber-400">VFD Transfer Function</h3>
                    <p className="text-xs text-slate-400 mt-1">G_VFD(s) = (η_VFD × K_VFD) / (1 + τ_VFD × s)</p>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {renderNumberRow('VFD Efficiency η_VFD', 'eta_VFD', '', '0..1 (typical: 0.98)')}
                      {renderNumberRow('VFD Gain K_VFD', 'K_VFD', 'HP', 'Max electrical power output')}
                      {renderNumberRow('VFD Time Constant τ_VFD', 'tau_VFD', 's', 'Fast response (~0.05s)')}
                    </tbody>
                  </table>
                </div>

                {/* Motor Transfer Function */}
                <div className="bg-slate-800/30 rounded-lg border border-purple-500/30">
                  <div className="bg-purple-900/30 px-3 py-2 border-b border-purple-500/30">
                    <h3 className="text-sm font-semibold text-purple-400">Motor Transfer Function</h3>
                    <p className="text-xs text-slate-400 mt-1">G_MTR(s) = (η_MTR × K_MTR) / (1 + τ_MTR × s)</p>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {renderNumberRow('Motor Efficiency η_MTR', 'eta_MTR', '', '0..1 (typical: 0.96)')}
                      {renderNumberRow('Motor Gain K_MTR', 'K_MTR', '', 'Direct scaling')}
                      {renderNumberRow('Motor Time Constant τ_MTR', 'tau_MTR', 's', 'Mechanical inertia (~2s)')}
                    </tbody>
                  </table>
                </div>

                {/* Compressor Transfer Function (2nd Order) */}
                <div className="bg-slate-800/30 rounded-lg border border-cyan-500/30">
                  <div className="bg-cyan-900/30 px-3 py-2 border-b border-cyan-500/30">
                    <h3 className="text-sm font-semibold text-cyan-400">Compressor Transfer Function (2nd Order)</h3>
                    <p className="text-xs text-slate-400 mt-1">G_CMP(s) = (η_CMP × K_CMP × ω_n²) / (s² + 2ζω_n·s + ω_n²)</p>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {renderNumberRow('Compressor Efficiency η_CMP', 'eta_CMP', '', '0..1 (datasheet: 0.86)')}
                      {renderNumberRow('Compressor Gain K_CMP', 'K_CMP', 'RPM/HP', 'Speed per power')}
                      {renderNumberRow('Natural Frequency ω_n', 'omega_n', 'rad/s', 'From critical speed')}
                      {renderNumberRow('Damping Ratio ζ', 'zeta', '', '0..1 (typical: 0.15)')}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* System Parameters Tab */}
            <TabsContent value="system">
              <div className="bg-slate-800/30 rounded-lg border border-rose-500/30">
                <div className="bg-rose-900/30 px-3 py-2 border-b border-rose-500/30">
                  <h3 className="text-sm font-semibold text-rose-400">System Parameters</h3>
                </div>
                <table className="w-full">
                  <tbody>
                    {renderNumberRow('Maximum RPM K_RPM_Max', 'K_RPM_Max', 'RPM', 'Full-scale speed (~4595)')}
                    {renderNumberRow('Dead Time θ', 'theta', 's', 'Sensor/transport delay')}
                    {renderNumberRow('Low-Pass Filter τ_LPF', 'tau_LPF', 's', 'Derivative noise filter')}
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
            <p className="text-sm font-mono text-foreground">Hand Controller</p>
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

export default HandController4030Faceplate3A;
