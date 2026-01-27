import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Download, Upload, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { FaceplateDownloadButtons } from '@/delta-v/components/PythonDownloadButton';
import { getControllerMetadata } from '@/delta-v/lib/controllerMetadata';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useControllerSync } from '@/delta-v/contexts/ControllerSyncContext';
import PIDControlLoopDiagram from '@/delta-v/components/faceplate/PIDControlLoopDiagram';
import {
  SulfurFlowConfig,
  defaultSulfurFlowConfig,
  SULFUR_FLOW_STORAGE_KEY,
} from '@/delta-v/types/sulfurFlowConfig';

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
  
  const { toast } = useToast();
  const { state } = useControllerSync(activeControllerId);
  const [config, setConfig] = useState<SulfurFlowConfig>(defaultSulfurFlowConfig);
  const [summary, setSummary] = useState<string>('');
  const [diagramOpen, setDiagramOpen] = useState(true);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  useEffect(() => {
    const saved = localStorage.getItem(SULFUR_FLOW_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SulfurFlowConfig;
        setConfig(parsed);
      } catch (e) {
        console.error('Failed to load Sulfur Flow config:', e);
      }
    }
  }, []);

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

  const updateConfig = useCallback(<K extends keyof SulfurFlowConfig>(key: K, value: SulfurFlowConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveConfig = useCallback(() => {
    localStorage.setItem(SULFUR_FLOW_STORAGE_KEY, JSON.stringify(config));
    toast({ title: 'Configuration Saved', description: 'Settings saved to local storage.' });
  }, [config, toast]);

  const resetToDefaults = useCallback(() => {
    setConfig(defaultSulfurFlowConfig);
    toast({ title: 'Reset Complete', description: 'Configuration reset to defaults.' });
  }, [toast]);

  const validateInputs = useCallback(() => {
    try {
      if (config.u_min >= config.u_max) {
        throw new Error('u_min must be < u_max.');
      }
      if (config.sample_time_dt_s <= 0) {
        throw new Error('Sample time Δt must be > 0.');
      }
      if (config.Cv_max <= 0) {
        throw new Error('Cv_max must be > 0.');
      }
      if (config.design_flow_gpm <= 0) {
        throw new Error('Design flow must be > 0.');
      }
      if (config.pipe_dia_in <= 0) {
        throw new Error('Pipe diameter must be > 0.');
      }
      if (config.SG <= 0) {
        throw new Error('Specific gravity must be > 0.');
      }
      const timeKeys: (keyof SulfurFlowConfig)[] = [
        'tau_valve_s', 'tau_flow_s', 'tau_sensor_s', 'sample_time_dt_s', 'pv_filter_tau_s',
      ];
      for (const key of timeKeys) {
        if ((config[key] as number) < 0) {
          throw new Error(`${key} must be non-negative.`);
        }
      }
      setValidationStatus('valid');
      toast({ title: 'Validation OK', description: 'All inputs are valid' });
    } catch (e) {
      setValidationStatus('invalid');
      toast({ title: 'Validation Failed', description: (e as Error).message, variant: 'destructive' });
    }
  }, [config, toast]);

  const computeSummary = useCallback(() => {
    const dia_ft = config.pipe_dia_in / 12.0;
    const A_ft2 = Math.PI * Math.pow(dia_ft / 2.0, 2);
    const Q_cfs = config.design_flow_gpm / 448.8;
    const V_fps = Q_cfs / A_ft2;
    const g = 32.2;
    const head_friction_ft = config.friction_factor * config.line_length_ft / dia_ft * Math.pow(V_fps, 2) / (2 * g);
    const head_minor_ft = config.K_minor_losses * Math.pow(V_fps, 2) / (2 * g);
    const head_line_ft = head_friction_ft + head_minor_ft;
    const dP_line_psi = head_line_ft * 0.433 * config.SG;
    
    const calculateCv = (Q: number, dP: number, SG: number) => Q / Math.sqrt(dP / SG);
    const Cv_line = calculateCv(config.design_flow_gpm, dP_line_psi, config.SG);
    const Cv_nozzle = calculateCv(config.design_flow_gpm, config.deltaP_nozzle_psi, config.SG);
    const Cv_orifice = calculateCv(config.design_flow_gpm, config.design_dP_orifice_psi, config.SG);
    
    const static_head_psi = config.pit_level_ft * 0.433 * config.SG;
    const dP_total_design = dP_line_psi + config.design_dP_orifice_psi + config.design_dP_valve_psi + config.deltaP_nozzle_psi;
    const pump_dP_required = dP_total_design + config.furnace_static_psi - static_head_psi;

    const lines = [
      `Loop: ${config.loop_tag}  |  ${config.service_desc}`,
      '',
      'HYDRAULIC SUMMARY:',
      `  Design Flow: ${config.design_flow_gpm.toFixed(1)} gpm`,
      `  Pipe Velocity: ${V_fps.toFixed(2)} ft/s`,
      `  Line Losses: ${dP_line_psi.toFixed(2)} psi (friction + minor)`,
      '',
      'EQUIVALENT Cv VALUES AT DESIGN:',
      `  Cv_line: ${Cv_line.toFixed(1)}`,
      `  Cv_orifice: ${Cv_orifice.toFixed(1)}`,
      `  Cv_nozzle: ${Cv_nozzle.toFixed(1)}`,
      `  Cv_valve (max): ${config.Cv_max.toFixed(1)}`,
      '',
      'PRESSURE BALANCE:',
      `  Static Head (pit): ${static_head_psi.toFixed(2)} psi`,
      `  Furnace Static: ${config.furnace_static_psi.toFixed(1)} psi`,
      `  Total Design dP: ${dP_total_design.toFixed(1)} psi`,
      `  Required Pump dP: ${pump_dP_required.toFixed(1)} psi`,
      '',
      'CONTROLLER PARAMETERS:',
      `  Mode: ${config.mode}`,
      `  Kp: ${config.Kp} (% output per gpm error)`,
      `  Ki: ${config.Ki} (% output per gpm per second)`,
      `  Output Limits: ${config.u_min}% to ${config.u_max}%`,
      '',
      'VALVE CHARACTERISTICS:',
      `  Type: ${config.valve_profile_type}`,
      `  Rangeability R: ${config.R_value}`,
      `  Time Constant: ${config.tau_valve_s} s`,
      '',
      'PROCESS DYNAMICS:',
      `  Flow Time Constant: ${config.tau_flow_s} s`,
      `  Sensor Time Constant: ${config.tau_sensor_s} s`,
      `  Sample Time Δt: ${config.sample_time_dt_s} s`,
      '',
      'BLOCK STRUCTURE:',
      '  SP -> [PI Controller] -> u(%) -> [4-20mA] -> [Positioner τ_valve] -> valve_pos',
      '  -> [Valve Cv(x)] -> [Hydraulic Balance] -> Q_target -> [Flow Lag τ_flow] -> PV(gpm)',
    ];
    setSummary(lines.join('\n'));
    toast({ title: 'Summary Computed', description: 'Hydraulic summary generated.' });
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
            const parsed = JSON.parse(ev.target?.result as string) as SulfurFlowConfig;
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

  const renderNumberRow = (label: string, key: keyof SulfurFlowConfig, unit?: string, help?: string) => (
    <tr className="border-b border-slate-700/50">
      <td className="py-2 px-3 text-sm text-muted-foreground">{label}</td>
      <td className="py-2 px-3">
        <StableNumberInput
          value={config[key] as number}
          onChange={(val) => updateConfig(key, val as SulfurFlowConfig[typeof key])}
          className="w-32"
        />
      </td>
      <td className="py-2 px-3 text-sm text-muted-foreground">{unit || ''}</td>
      <td className="py-2 px-3 text-xs text-slate-500">{help || ''}</td>
    </tr>
  );

  const renderStringRow = (label: string, key: keyof SulfurFlowConfig, width = 'w-48') => (
    <tr className="border-b border-slate-700/50">
      <td className="py-2 px-3 text-sm text-muted-foreground">{label}</td>
      <td className="py-2 px-3" colSpan={3}>
        <StableStringInput
          value={config[key] as string}
          onChange={(val) => updateConfig(key, val as SulfurFlowConfig[typeof key])}
          className={width}
        />
      </td>
    </tr>
  );

  const renderSelectRow = (
    label: string,
    key: keyof SulfurFlowConfig,
    options: string[],
    help?: string
  ) => (
    <tr className="border-b border-slate-700/50">
      <td className="py-2 px-3 text-sm text-muted-foreground">{label}</td>
      <td className="py-2 px-3">
        <Select
          value={config[key] as string}
          onValueChange={(val) => updateConfig(key, val as SulfurFlowConfig[typeof key])}
        >
          <SelectTrigger className="w-48 h-8 bg-slate-800 border-slate-600">
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              to={metadata.backRoute}
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to {metadata.label}</span>
            </Link>
            <h1 className="text-xl font-bold text-faceplate-border glow-text">
              Sulfur Flow Control Loop Configuration
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={computeSummary} className="gap-2" data-testid="button-compute-summary">
              <CheckCircle size={16} />
              Compute Summary
            </Button>
            <Button variant="outline" size="sm" onClick={exportJSON} className="gap-2" data-testid="button-export-json">
              <Download size={16} />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={importJSON} className="gap-2" data-testid="button-import-json">
              <Upload size={16} />
              Load JSON
            </Button>
            <FaceplateDownloadButtons faceplateId="3A" />
          </div>
        </div>

        <Collapsible open={diagramOpen} onOpenChange={setDiagramOpen} className="mb-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between mb-2" data-testid="button-toggle-diagram">
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

        <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-4">
          <Tabs defaultValue="loop-info" className="w-full">
            <TabsList className="flex flex-wrap gap-1 h-auto bg-slate-800/50 p-1 mb-4">
              <TabsTrigger value="loop-info" className="text-xs">Loop Info</TabsTrigger>
              <TabsTrigger value="design" className="text-xs">Design Conditions</TabsTrigger>
              <TabsTrigger value="pid" className="text-xs">PID Controller</TabsTrigger>
              <TabsTrigger value="valve" className="text-xs">Valve</TabsTrigger>
              <TabsTrigger value="piping" className="text-xs">Piping & Hydraulics</TabsTrigger>
              <TabsTrigger value="dynamics" className="text-xs">Process Dynamics</TabsTrigger>
              <TabsTrigger value="simulation" className="text-xs">Simulation</TabsTrigger>
              <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="loop-info">
              <div className="bg-slate-800/30 rounded-lg border border-cyan-500/30">
                <div className="bg-cyan-900/30 px-3 py-2 border-b border-cyan-500/30">
                  <h3 className="text-sm font-semibold text-cyan-400">Tagging & Units</h3>
                </div>
                <table className="w-full">
                  <tbody>
                    {renderStringRow('Loop Tag', 'loop_tag', 'w-32')}
                    {renderStringRow('Service Description', 'service_desc', 'w-96')}
                    {renderSelectRow('Engineering Units', 'eng_units', ['gpm', 'klb/hr'])}
                    {renderNumberRow('Sample Time Δt', 'sample_time_dt_s', 's', 'Simulation time step')}
                    {renderSelectRow('Controller Output Units', 'controller_output_units', ['%', 'mA'])}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="design">
              <div className="bg-slate-800/30 rounded-lg border border-amber-500/30">
                <div className="bg-amber-900/30 px-3 py-2 border-b border-amber-500/30">
                  <h3 className="text-sm font-semibold text-amber-400">Design Operating Point</h3>
                </div>
                <table className="w-full">
                  <tbody>
                    {renderNumberRow('Design Flow Rate', 'design_flow_gpm', 'gpm', 'Nominal sulfur flow to furnace')}
                    {renderNumberRow('Design Orifice ΔP', 'design_dP_orifice_psi', 'psi', 'Pressure drop across orifice at design')}
                    {renderNumberRow('Design Valve ΔP', 'design_dP_valve_psi', 'psi', 'Pressure drop across valve at design')}
                  </tbody>
                </table>
                <div className="px-3 py-2 text-xs text-slate-500 border-t border-slate-700/50">
                  Note: These values are used to compute equivalent Cv for fixed components (orifice, line, nozzle).
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pid">
              <div className="space-y-4">
                <div className="bg-slate-800/30 rounded-lg border border-cyan-500/30">
                  <div className="bg-cyan-900/30 px-3 py-2 border-b border-cyan-500/30">
                    <h3 className="text-sm font-semibold text-cyan-400">PI Controller (FIC-2602)</h3>
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
                      {renderSelectRow('Direct/Reverse Acting', 'acting', ['Direct Acting', 'Reverse Acting'], 'Reverse = increase output to decrease PV')}
                      {renderNumberRow('Proportional Gain Kp', 'Kp', '% / gpm', '% output per gpm error')}
                      {renderNumberRow('Integral Gain Ki', 'Ki', '% / gpm / s', '% output per gpm per second')}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-800/30 rounded-lg border border-slate-600/30">
                  <div className="bg-slate-700/30 px-3 py-2 border-b border-slate-600/30">
                    <h3 className="text-sm font-semibold text-slate-300">Output Limits & Anti-windup</h3>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {renderNumberRow('Output Bias u_bias', 'u_bias', '%', 'Steady-state output at zero error')}
                      {renderNumberRow('Output Min u_min', 'u_min', '%')}
                      {renderNumberRow('Output Max u_max', 'u_max', '%')}
                      {renderNumberRow('Rate Limit |du/dt|', 'rate_limit_pct_per_s', '%/s')}
                      {renderSelectRow('Anti-windup', 'anti_windup', ['None', 'Clamp', 'Back-calc'])}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="valve">
              <div className="space-y-4">
                <div className="bg-slate-800/30 rounded-lg border border-purple-500/30">
                  <div className="bg-purple-900/30 px-3 py-2 border-b border-purple-500/30">
                    <h3 className="text-sm font-semibold text-purple-400">Control Valve (Final Element)</h3>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {renderNumberRow('Maximum Cv', 'Cv_max', '', 'Full-open flow coefficient')}
                      {renderSelectRow('Valve Characteristic', 'valve_profile_type', ['linear', 'equal_percentage', 'quick_opening'])}
                      {renderNumberRow('Rangeability R', 'R_value', '', 'Equal % valve rangeability (typical 50-100)')}
                      {renderNumberRow('Valve Time Constant τ_valve', 'tau_valve_s', 's', 'Positioner + actuator dynamics')}
                      {renderSelectRow('Fail Position', 'fail_position', ['Fail Open', 'Fail Closed', 'Fail Last'])}
                    </tbody>
                  </table>
                  <div className="px-3 py-2 text-xs text-slate-500 border-t border-slate-700/50">
                    Equal %: Cv = (Cv_max / R) × R^(position)  |  Linear: Cv = Cv_max × position
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="piping">
              <div className="space-y-4">
                <div className="bg-slate-800/30 rounded-lg border border-green-500/30">
                  <div className="bg-green-900/30 px-3 py-2 border-b border-green-500/30">
                    <h3 className="text-sm font-semibold text-green-400">Piping Parameters</h3>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {renderNumberRow('Pipe Diameter', 'pipe_dia_in', 'in', 'Internal diameter')}
                      {renderNumberRow('Line Length', 'line_length_ft', 'ft', 'Total equivalent length')}
                      {renderNumberRow('Darcy Friction Factor', 'friction_factor', '', 'Typical 0.015-0.025')}
                      {renderNumberRow('Minor Losses K', 'K_minor_losses', '', 'Sum of fitting K values')}
                      {renderNumberRow('Specific Gravity', 'SG', '', 'Molten sulfur ~1.79')}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-800/30 rounded-lg border border-orange-500/30">
                  <div className="bg-orange-900/30 px-3 py-2 border-b border-orange-500/30">
                    <h3 className="text-sm font-semibold text-orange-400">Pressure Drops</h3>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {renderNumberRow('Nozzle ΔP', 'deltaP_nozzle_psi', 'psi', 'Spray nozzle pressure drop at design')}
                      {renderNumberRow('Furnace Static Pressure', 'furnace_static_psi', 'psig', 'Backpressure in furnace')}
                      {renderNumberRow('Barometric Pressure', 'barometric_psia', 'psia', 'Atmospheric reference')}
                      {renderNumberRow('Sulfur Pit Level', 'pit_level_ft', 'ft', 'Liquid level providing static head')}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dynamics">
              <div className="bg-slate-800/30 rounded-lg border border-blue-500/30">
                <div className="bg-blue-900/30 px-3 py-2 border-b border-blue-500/30">
                  <h3 className="text-sm font-semibold text-blue-400">Process & Sensor Dynamics</h3>
                </div>
                <table className="w-full">
                  <tbody>
                    {renderNumberRow('Flow Time Constant τ_flow', 'tau_flow_s', 's', 'Lag from valve to measured flow')}
                    {renderNumberRow('Sensor Time Constant τ_sensor', 'tau_sensor_s', 's', 'Flow transmitter response')}
                    {renderNumberRow('Measurement Noise σ', 'noise_sigma_gpm', 'gpm', 'Standard deviation of noise')}
                    {renderNumberRow('PV Filter τ_pv', 'pv_filter_tau_s', 's', 'Low-pass filter on PV')}
                  </tbody>
                </table>
                <div className="px-3 py-3 text-xs text-slate-400 border-t border-slate-700/50 bg-slate-900/30">
                  <div className="font-mono mb-2">
                    PV<sub>meas</sub>(s) = Q<sub>target</sub>(s) × 1/(τ<sub>flow</sub>·s + 1) × 1/(τ<sub>sensor</sub>·s + 1)
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="simulation">
              <div className="bg-slate-800/30 rounded-lg border border-red-500/30">
                <div className="bg-red-900/30 px-3 py-2 border-b border-red-500/30">
                  <h3 className="text-sm font-semibold text-red-400">Simulation Settings</h3>
                </div>
                <table className="w-full">
                  <tbody>
                    {renderNumberRow('Setpoint', 'setpoint_gpm', 'gpm', 'Target sulfur flow rate')}
                    {renderNumberRow('Run Time', 'run_time_s', 's', 'Simulation duration')}
                    {renderSelectRow('Initial Conditions', 'ic_mode', ['Nominal', 'Custom'])}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="summary">
              <div className="bg-slate-800/30 rounded-lg border border-slate-600/30">
                <div className="bg-slate-700/30 px-3 py-2 border-b border-slate-600/30 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-300">Hydraulic & Control Summary</h3>
                  <Button variant="ghost" size="sm" onClick={computeSummary} data-testid="button-refresh-summary">
                    Refresh Summary
                  </Button>
                </div>
                <div className="p-4">
                  <pre className="font-mono text-xs text-green-400 bg-slate-900 rounded p-4 overflow-auto max-h-96 whitespace-pre-wrap">
                    {summary || "Click 'Compute Summary' to generate a hydraulic and control summary."}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>

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
              <Button variant="outline" size="sm" onClick={resetToDefaults} className="gap-2" data-testid="button-reset-defaults">
                <RotateCcw size={16} />
                Reset Defaults
              </Button>
              <Button variant="outline" size="sm" onClick={validateInputs} data-testid="button-validate">
                Validate
              </Button>
              <Button onClick={saveConfig} data-testid="button-save-config">
                Save Configuration
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <h3 className="text-xs font-medium text-muted-foreground mb-1">Controller Tag</h3>
            <p className="text-sm font-mono text-foreground">{config.loop_tag}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <h3 className="text-xs font-medium text-muted-foreground mb-1">Controller Type</h3>
            <p className="text-sm font-mono text-foreground">PI Flow</p>
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
