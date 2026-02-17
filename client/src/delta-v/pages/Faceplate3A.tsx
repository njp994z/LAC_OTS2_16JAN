import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Download, Upload, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { FaceplateDownloadButtons } from '@/delta-v/components/PythonDownloadButton';
import { getControllerMetadata } from '@/delta-v/lib/controllerMetadata';
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
  PIDHxBypassConfig,
  defaultPIDHxBypassConfig,
  PID_HX_BYPASS_STORAGE_KEY,
} from '@/delta-v/types/pidHxBypassConfig';

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

const Faceplate3A = () => {
  const { controllerId } = useParams<{ controllerId?: string }>();
  const activeControllerId = controllerId || 'default';
  const metadata = getControllerMetadata(activeControllerId);
  const getBackRoute = (): string => {
    const br = metadata.backRoute;
    return br.startsWith('/settings/controller-outputs/faceplates') ? br : `/settings/controller-outputs/faceplates${br}`;
  };
  
  const { toast } = useToast();
  const { state } = useControllerSync(activeControllerId);
  const [config, setConfig] = useState<PIDHxBypassConfig>(defaultPIDHxBypassConfig);
  const [summary, setSummary] = useState<string>('');
  const [diagramOpen, setDiagramOpen] = useState(true);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Load config from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(PID_HX_BYPASS_STORAGE_KEY);
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
    localStorage.setItem(PID_HX_BYPASS_STORAGE_KEY, JSON.stringify(config));
    toast({ title: 'Configuration Saved', description: 'Settings saved to local storage.' });
  }, [config, toast]);

  const resetToDefaults = useCallback(() => {
    setConfig(defaultPIDHxBypassConfig);
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
      const timeKeys: (keyof PIDHxBypassConfig)[] = [
        'tauI_s', 'tauD_s', 'tau_pos_s', 'tau_v_s', 'tau_hx_s',
        'dead_time_theta_s', 'tau_sens_s', 'sample_time_dt_s',
        'theta_pipe_s', 'tau_pipe_s',
      ];
      for (const key of timeKeys) {
        if ((config[key] as number) < 0) {
          throw new Error(`${key} must be non-negative.`);
        }
      }
      if (config.sample_time_dt_s <= 0) {
        throw new Error('Sample time Δt must be > 0.');
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
    const acting_hint = dTout_dx_mix < 0
      ? 'Reverse Acting is usually correct here.'
      : 'Direct Acting may be correct here.';

    const Kfe = config.Kpos * config.Kv;

    const lines = [
      `Loop: ${config.loop_tag}  |  ${config.service_desc}`,
      '',
      'Core equations:',
      '  PID (ISA/parallel): u = u_bias + Kc [ e + (1/τI)∫e dt + τD de/dt ]',
      '  Positioner:          Gpos(s) = Kpos / (τpos s + 1)',
      '  Valve/Actuator:      Gv(s)   = Kv   / (τv   s + 1)',
      '  HX (FOPDT):          Thx(s)/w(s) = Khx * e^{-θs} / (τhx s + 1)',
      config.use_exact_mixing
        ? '  Mixer (exact):       Tout = x*Tin + (1-x)*Thx'
        : '  Mixer (linearized):  ΔTout ≈ -Kmix Δx + (1-x̄)ΔThx',
      '',
      'Sign + acting hints:',
      `  At nominal: Tin0=${config.Tin0.toFixed(2)}, Thx0=${config.Thx0.toFixed(2)}  =>  dTout/dx ≈ Tin-Thx = ${dTout_dx_mix.toFixed(2)} (${sign_hint})`,
      `  Acting hint: ${acting_hint}`,
      '',
      'Key parameters (current inputs):',
      `  Sample time Δt: ${config.sample_time_dt_s} s`,
      `  PID: Kc=${config.Kc}, τI=${config.tauI_s} s, τD=${config.tauD_s} s, bias=${config.u_bias}`,
      `  Final element gain Kfe=Kpos*Kv=${Kfe} with τpos=${config.tau_pos_s} s, τv=${config.tau_v_s} s`,
      `  HX: Khx=${config.Khx_degC_per_x} deg/x, τhx=${config.tau_hx_s} s, dead time θ=${config.dead_time_theta_s} s`,
      `  Mixer: x̄=${config.xbar}, Kmix=${config.Kmix_degC_per_x} deg/x, exact_mixing=${config.use_exact_mixing}`,
      `  Sensor: Ksense=${config.Ksens}, τsens=${config.tau_sens_s} s, PV filter τpv=${config.pv_filter_tau_s} s`,
      config.enable_pipe_dynamics
        ? `  Pipe dynamics: θ_pipe=${config.theta_pipe_s} s, τ_pipe=${config.tau_pipe_s} s`
        : '  Pipe dynamics: disabled',
      '',
      'One-liner block structure:',
      config.enable_pipe_dynamics
        ? '  u -> [Gpos][Gv] -> x -> (Mixer + HX(FOPDT, θ)) -> Tout -> [Pipe delay θ_pipe + lag τ_pipe] -> (Sensor) -> Tmeas -> feedback'
        : '  u -> [Gpos][Gv] -> x -> (Mixer + HX(FOPDT, θ)) -> Tout -> (Sensor) -> Tmeas -> feedback',
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
              to={getBackRoute()}
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to {metadata.label}</span>
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
            <FaceplateDownloadButtons faceplateId="3A" />
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
              <TabsTrigger value="operating-point" className="text-xs">Operating Point</TabsTrigger>
              <TabsTrigger value="pid" className="text-xs">PID</TabsTrigger>
              <TabsTrigger value="final-element" className="text-xs">Final Element</TabsTrigger>
              <TabsTrigger value="hx-model" className="text-xs">HX Model</TabsTrigger>
              <TabsTrigger value="mixer" className="text-xs">Mixer</TabsTrigger>
              <TabsTrigger value="sensor" className="text-xs">Sensor</TabsTrigger>
              <TabsTrigger value="pipe-lag" className="text-xs">Pipe Lag</TabsTrigger>
              <TabsTrigger value="simulation" className="text-xs">Simulation</TabsTrigger>
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
                    {renderSelectRow('Engineering Units', 'eng_units', ['°C', '°F', 'K'])}
                    {renderNumberRow('Sample Time Δt', 'sample_time_dt_s', 's')}
                    {renderSelectRow('Controller Output Units', 'controller_output_units', ['%', 'mA', '0–1'])}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Operating Point Tab */}
            <TabsContent value="operating-point">
              <div className="bg-slate-800/30 rounded-lg border border-amber-500/30">
                <div className="bg-amber-900/30 px-3 py-2 border-b border-amber-500/30">
                  <h3 className="text-sm font-semibold text-amber-400">Nominal Operating Point (for linearization)</h3>
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
              <div className="space-y-4">
                <div className="bg-slate-800/30 rounded-lg border border-cyan-500/30">
                  <div className="bg-cyan-900/30 px-3 py-2 border-b border-cyan-500/30">
                    <h3 className="text-sm font-semibold text-cyan-400">PID Controller (ISA/Parallel)</h3>
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
                            <span className="text-xs text-slate-500">(Synced from Secondary Controller: {state.syncedMode})</span>
                          </div>
                        </td>
                        <td className="py-2 px-3"></td>
                        <td className="py-2 px-3"></td>
                      </tr>
                      {renderSelectRow('Direct/Reverse Acting', 'acting', ['Direct Acting', 'Reverse Acting'], 'Depends on sign of u→Tout')}
                      {renderNumberRow('Controller Gain Kc', 'Kc')}
                      {renderNumberRow('Integral Time τI', 'tauI_s', 's')}
                      {renderNumberRow('Derivative Time τD', 'tauD_s', 's')}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-800/30 rounded-lg border border-slate-600/30">
                  <div className="bg-slate-700/30 px-3 py-2 border-b border-slate-600/30">
                    <h3 className="text-sm font-semibold text-slate-300">Derivative Filter + Output Handling</h3>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {renderSelectRow('Derivative Filter Type', 'deriv_filter_type', ['N', 'τf'], 'Use N (common) or explicit τf')}
                      {renderNumberRow('Derivative Filter N', 'deriv_N')}
                      {renderNumberRow('Derivative Filter τf', 'deriv_tau_f_s', 's')}
                      {renderNumberRow('Output Bias u_bias', 'u_bias')}
                      {renderNumberRow('Output Min u_min', 'u_min')}
                      {renderNumberRow('Output Max u_max', 'u_max')}
                      {renderNumberRow('Rate Limit |du/dt|', 'rate_limit_pct_per_s', '%/s')}
                      {renderSelectRow('Anti-windup', 'anti_windup', ['None', 'Clamp', 'Back-calc'])}
                      {renderBoolRow('Enable Tracking / Bumpless Transfer', 'tracking')}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Final Element Tab */}
            <TabsContent value="final-element">
              <div className="space-y-4">
                <div className="bg-slate-800/30 rounded-lg border border-purple-500/30">
                  <div className="bg-purple-900/30 px-3 py-2 border-b border-purple-500/30">
                    <h3 className="text-sm font-semibold text-purple-400">Positioner + Valve (Final Element)</h3>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {renderNumberRow('Positioner Gain Kpos', 'Kpos')}
                      {renderNumberRow('Positioner Time Constant τpos', 'tau_pos_s', 's')}
                      {renderNumberRow('Valve Gain Kv', 'Kv')}
                      {renderNumberRow('Valve Time Constant τv', 'tau_v_s', 's')}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-800/30 rounded-lg border border-slate-600/30">
                  <div className="bg-slate-700/30 px-3 py-2 border-b border-slate-600/30">
                    <h3 className="text-sm font-semibold text-slate-300">Valve Characterization / Non-idealities</h3>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {renderSelectRow('Characteristic', 'valve_characteristic', ['Linear', 'Equal %', 'Quick Opening'])}
                      {renderNumberRow('Installed Slope dx/du', 'installed_slope_dx_du', '', 'x per % (typical ~0.01)')}
                      {renderNumberRow('Deadband', 'deadband_pct', '%')}
                      {renderNumberRow('Stiction', 'stiction_pct', '%')}
                      {renderSelectRow('Fail Position', 'fail_position', ['Fail Open', 'Fail Closed', 'Fail Last'])}
                      {renderNumberRow('Bypass Fraction Min', 'x_min')}
                      {renderNumberRow('Bypass Fraction Max', 'x_max')}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* HX Model Tab */}
            <TabsContent value="hx-model">
              <div className="bg-slate-800/30 rounded-lg border border-orange-500/30">
                <div className="bg-orange-900/30 px-3 py-2 border-b border-orange-500/30">
                  <h3 className="text-sm font-semibold text-orange-400">Heat Exchanger Process Model (FOPDT)</h3>
                </div>
                <table className="w-full">
                  <tbody>
                    {renderNumberRow('HX Gain Khx (magnitude)', 'Khx_degC_per_x', `${config.eng_units}/x`, 'Magnitude; sign handled in summary')}
                    {renderNumberRow('HX Time Constant τhx', 'tau_hx_s', 's')}
                    {renderNumberRow('Dead Time θ (dead lag)', 'dead_time_theta_s', 's')}
                  </tbody>
                </table>
                <div className="px-3 py-2 text-xs text-slate-500 border-t border-slate-700/50">
                  Note: Bypass opening usually reduces Tout. Summary will compute a sign hint for acting direction.
                </div>
              </div>
            </TabsContent>

            {/* Mixer Tab */}
            <TabsContent value="mixer">
              <div className="space-y-4">
                <div className="bg-slate-800/30 rounded-lg border border-green-500/30">
                  <div className="bg-green-900/30 px-3 py-2 border-b border-green-500/30">
                    <h3 className="text-sm font-semibold text-green-400">Bypass Mixer Model</h3>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {renderBoolRow('Use exact mixing: Tout = x*Tin + (1-x)*Thx', 'use_exact_mixing')}
                      {renderNumberRow('Immediate Mixing Gain Kmix (magnitude)', 'Kmix_degC_per_x', `${config.eng_units}/x`)}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-800/30 rounded-lg border border-slate-600/30">
                  <div className="bg-slate-700/30 px-3 py-2 border-b border-slate-600/30">
                    <h3 className="text-sm font-semibold text-slate-300">Disturbances (Optional)</h3>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {renderBoolRow('Enable Tin disturbance', 'enable_Tin_disturb')}
                      {renderNumberRow('Tin disturbance filter τin', 'tau_in_s', 's')}
                      {renderBoolRow('Enable utility disturbance', 'enable_utility_disturb')}
                      {renderNumberRow('Utility gain factor', 'utility_gain_factor')}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Sensor Tab */}
            <TabsContent value="sensor">
              <div className="bg-slate-800/30 rounded-lg border border-blue-500/30">
                <div className="bg-blue-900/30 px-3 py-2 border-b border-blue-500/30">
                  <h3 className="text-sm font-semibold text-blue-400">Sensor / Transmitter Dynamics</h3>
                </div>
                <table className="w-full">
                  <tbody>
                    {renderNumberRow('Sensor Gain Ksense', 'Ksens')}
                    {renderNumberRow('Sensor Time Constant τsens', 'tau_sens_s', 's')}
                    {renderNumberRow('Noise σ', 'noise_sigma_degC', config.eng_units)}
                    {renderNumberRow('PV Filter τpv', 'pv_filter_tau_s', 's')}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Pipe Lag Tab */}
            <TabsContent value="pipe-lag">
              <div className="bg-slate-800/30 rounded-lg border border-violet-500/30">
                <div className="bg-violet-900/30 px-3 py-2 border-b border-violet-500/30">
                  <h3 className="text-sm font-semibold text-violet-400">Downstream Pipe / Transport Dynamics</h3>
                </div>
                <table className="w-full">
                  <tbody>
                    {renderBoolRow('Enable Pipe Dynamics', 'enable_pipe_dynamics', 'Include transport delay + thermal lag')}
                    {renderNumberRow('Transport Delay θ_pipe', 'theta_pipe_s', 's', 'Dead time in downstream piping')}
                    {renderNumberRow('Pipe Thermal Lag τ_pipe', 'tau_pipe_s', 's', 'First-order lag (pipe + sensor thermal mass)')}
                  </tbody>
                </table>
                <div className="px-3 py-3 text-xs text-slate-400 border-t border-slate-700/50 bg-slate-900/30">
                  <div className="font-mono mb-2">
                    T<sub>meas</sub>(s) = T<sub>out</sub>(s) × e<sup>−θ<sub>pipe</sub>·s</sup> × 1/(τ<sub>pipe</sub>·s + 1)
                  </div>
                  <p className="text-slate-500">
                    Models downstream measurement point: transport delay (pure time shift) followed by first-order thermal lag.
                    Use when TIC is mounted far from mixer outlet.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Simulation Tab */}
            <TabsContent value="simulation">
              <div className="bg-slate-800/30 rounded-lg border border-red-500/30">
                <div className="bg-red-900/30 px-3 py-2 border-b border-red-500/30">
                  <h3 className="text-sm font-semibold text-red-400">Simulation / Step Tests</h3>
                </div>
                <table className="w-full">
                  <tbody>
                    {renderNumberRow('Step: ΔTsp', 'step_dTsp', config.eng_units)}
                    {renderNumberRow('Step: ΔTin', 'step_dTin', config.eng_units)}
                    {renderNumberRow('Step: ΔUtility', 'step_dUtility', config.eng_units)}
                    {renderNumberRow('Run Time', 'run_time_s', 's')}
                    {renderSelectRow('Initial Conditions', 'ic_mode', ['Nominal', 'Custom'])}
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
                    {summary || "Click 'Compute Summary' to generate a model summary and sign hints."}
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
            <p className="text-sm font-mono text-foreground">PID Temperature</p>
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

export default Faceplate3A;
