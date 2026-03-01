import { Link, useParams } from 'wouter';
import { ArrowLeft, Settings2 } from 'lucide-react';
import { FaceplateDownloadButtons } from '@/delta-v/components/PythonDownloadButton';
import { useState, useEffect } from 'react';
import { PIDHxBypassConfig, defaultPIDHxBypassConfig, PID_HX_BYPASS_STORAGE_KEY } from '@/delta-v/types/pidHxBypassConfig';
import { getControllerMetadata } from '@/delta-v/lib/controllerMetadata';

const Faceplate3D = () => {
  const { controllerId } = useParams<{ controllerId?: string }>();
  const activeControllerId = controllerId || 'default';
  const metadata = getControllerMetadata(activeControllerId);
  const getBackRoute = (): string => {
    const br = metadata.backRoute;
    return br.startsWith('/settings/controller-outputs/faceplates') ? br : `/settings/controller-outputs/faceplates${br}`;
  };
  
  const [config, setConfig] = useState<PIDHxBypassConfig>(defaultPIDHxBypassConfig);

  useEffect(() => {
    const stored = localStorage.getItem(PID_HX_BYPASS_STORAGE_KEY);
    if (stored) {
      try {
        setConfig({ ...defaultPIDHxBypassConfig, ...JSON.parse(stored) });
      } catch {
        setConfig(defaultPIDHxBypassConfig);
      }
    }
  }, []);

  const formatBool = (val: boolean) => val ? 'Yes' : 'No';

  const ParamRow = ({ label, value, unit = '' }: { label: string; value: string | number; unit?: string }) => (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}{unit && <span className="text-muted-foreground ml-1">{unit}</span>}</span>
    </div>
  );

  const Section = ({ title, color, children }: { title: string; color: string; children: React.ReactNode }) => (
    <div className={`bg-slate-800/30 rounded-lg border ${color} overflow-hidden`}>
      <div className={`px-3 py-1.5 border-b ${color} bg-slate-900/40`}>
        <h3 className="text-xs font-semibold text-slate-300">{title}</h3>
      </div>
      <div className="p-3 space-y-1">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 deltav-grid-pattern">
      <div className="container mx-auto py-8 px-4">
        <Link
          to={getBackRoute()}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span>Back to {metadata.label}</span>
        </Link>

        <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-6 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-faceplate-border glow-text mb-2 flex items-center gap-3">
            <Settings2 className="text-cyan-400" />
            Control Studio – Engineering Function
          </h1>
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">Faceplate 3D - Complete configuration overview from Faceplate 3A</p>
            <FaceplateDownloadButtons faceplateId="3D" />
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Loop Information */}
            <Section title="Loop Information" color="border-cyan-500/30">
              <ParamRow label="Loop Tag" value={config.loop_tag} />
              <ParamRow label="Service" value={config.service_desc} />
              <ParamRow label="Eng Units" value={config.eng_units} />
              <ParamRow label="Output Units" value={config.controller_output_units} />
              <ParamRow label="Sample Time" value={config.sample_time_dt_s} unit="s" />
            </Section>

            {/* Operating Point */}
            <Section title="Operating Point" color="border-amber-500/30">
              <ParamRow label="T_in0 (Inlet)" value={config.Tin0} unit="°C" />
              <ParamRow label="T_hx0 (HX Outlet)" value={config.Thx0} unit="°C" />
              <ParamRow label="T_out0 (Mixed)" value={config.Tout0} unit="°C" />
              <ParamRow label="x̄ (Bypass Frac)" value={config.xbar} />
              <ParamRow label="u₀ (Output)" value={config.u0} unit="%" />
            </Section>

            {/* PID Controller */}
            <Section title="PID Controller" color="border-cyan-500/30">
              <ParamRow label="Mode" value={config.mode} />
              <ParamRow label="Acting Direction" value={config.acting} />
              <ParamRow label="Kc (Gain)" value={config.Kc} />
              <ParamRow label="τI (Integral)" value={config.tauI_s} unit="s" />
              <ParamRow label="τD (Derivative)" value={config.tauD_s} unit="s" />
              <ParamRow label="Derivative Filter" value={config.deriv_filter_type} />
              <ParamRow label="N" value={config.deriv_N} />
              <ParamRow label="τf (Filter)" value={config.deriv_tau_f_s} unit="s" />
            </Section>

            {/* Output Handling */}
            <Section title="Output Handling" color="border-cyan-500/30">
              <ParamRow label="Bias" value={config.u_bias} unit="%" />
              <ParamRow label="Output Min" value={config.u_min} unit="%" />
              <ParamRow label="Output Max" value={config.u_max} unit="%" />
              <ParamRow label="Rate Limit" value={config.rate_limit_pct_per_s} unit="%/s" />
              <ParamRow label="Anti-windup" value={config.anti_windup} />
              <ParamRow label="Tracking" value={formatBool(config.tracking)} />
            </Section>

            {/* Final Element */}
            <Section title="Final Element" color="border-green-500/30">
              <ParamRow label="Kpos (Positioner)" value={config.Kpos} />
              <ParamRow label="τ_pos (Positioner)" value={config.tau_pos_s} unit="s" />
              <ParamRow label="Kv (Valve)" value={config.Kv} />
              <ParamRow label="τ_v (Valve)" value={config.tau_v_s} unit="s" />
              <ParamRow label="Characteristic" value={config.valve_characteristic} />
              <ParamRow label="dx/du" value={config.installed_slope_dx_du} />
              <ParamRow label="Deadband" value={config.deadband_pct} unit="%" />
              <ParamRow label="Stiction" value={config.stiction_pct} unit="%" />
              <ParamRow label="Fail Position" value={config.fail_position} />
              <ParamRow label="x_min" value={config.x_min} />
              <ParamRow label="x_max" value={config.x_max} />
            </Section>

            {/* HX Model */}
            <Section title="HX Model (FOPDT)" color="border-orange-500/30">
              <ParamRow label="Khx (Gain)" value={config.Khx_degC_per_x} unit="°C/x" />
              <ParamRow label="τ_hx (Time Const)" value={config.tau_hx_s} unit="s" />
              <ParamRow label="θ (Dead Time)" value={config.dead_time_theta_s} unit="s" />
            </Section>

            {/* Mixer */}
            <Section title="Mixer" color="border-yellow-500/30">
              <ParamRow label="Exact Mixing" value={formatBool(config.use_exact_mixing)} />
              <ParamRow label="Kmix (Gain)" value={config.Kmix_degC_per_x} unit="°C/x" />
              <ParamRow label="Tin Disturbance" value={formatBool(config.enable_Tin_disturb)} />
              <ParamRow label="τ_in (Inlet Lag)" value={config.tau_in_s} unit="s" />
              <ParamRow label="Utility Disturb" value={formatBool(config.enable_utility_disturb)} />
              <ParamRow label="Utility Gain" value={config.utility_gain_factor} />
            </Section>

            {/* Sensor */}
            <Section title="Sensor" color="border-blue-500/30">
              <ParamRow label="Ksens (Gain)" value={config.Ksens} />
              <ParamRow label="τ_sens (Time Const)" value={config.tau_sens_s} unit="s" />
              <ParamRow label="Noise σ" value={config.noise_sigma_degC} unit="°C" />
              <ParamRow label="PV Filter τ" value={config.pv_filter_tau_s} unit="s" />
            </Section>

            {/* Pipe Dynamics */}
            <Section title="Pipe Dynamics" color="border-violet-500/30">
              <ParamRow label="Enabled" value={formatBool(config.enable_pipe_dynamics)} />
              <ParamRow label="θ_pipe (Transport)" value={config.theta_pipe_s} unit="s" />
              <ParamRow label="τ_pipe (Thermal Lag)" value={config.tau_pipe_s} unit="s" />
            </Section>

            {/* Simulation */}
            <Section title="Simulation" color="border-red-500/30">
              <ParamRow label="Step ΔTsp" value={config.step_dTsp} unit="°C" />
              <ParamRow label="Step ΔTin" value={config.step_dTin} unit="°C" />
              <ParamRow label="Step ΔUtility" value={config.step_dUtility} />
              <ParamRow label="Run Time" value={config.run_time_s} unit="s" />
              <ParamRow label="IC Mode" value={config.ic_mode} />
            </Section>

          </div>

          {/* Block Diagram Summary */}
          <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Control Loop Structure</h3>
            <div className="font-mono text-xs text-cyan-400 overflow-x-auto">
              {config.enable_pipe_dynamics
                ? 'u → [Gpos][Gv] → x → (Mixer + HX(FOPDT, θ)) → Tout → [Pipe: θ_pipe + τ_pipe] → (Sensor) → Tmeas → feedback'
                : 'u → [Gpos][Gv] → x → (Mixer + HX(FOPDT, θ)) → Tout → (Sensor) → Tmeas → feedback'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Faceplate3D;
