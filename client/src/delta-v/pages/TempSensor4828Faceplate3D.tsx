import { Link } from 'wouter';
import { ArrowLeft, Settings2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PIDHxBypassConfig, defaultPIDHxBypassConfig } from '@/delta-v/types/pidHxBypassConfig';

const TEMP_SENSOR_4828_PID_CONFIG_KEY = 'temp_sensor_4828_pid_config';

const TempSensor4828Faceplate3D = () => {
  const [config, setConfig] = useState<PIDHxBypassConfig>({
    ...defaultPIDHxBypassConfig,
    loop_tag: '1540-TI-4828',
    service_desc: 'Pass 1 Catalyst Temp. Bottom B',
    eng_units: 'F',
  });

  useEffect(() => {
    const stored = localStorage.getItem(TEMP_SENSOR_4828_PID_CONFIG_KEY);
    if (stored) {
      try {
        setConfig({ ...defaultPIDHxBypassConfig, ...JSON.parse(stored) });
      } catch {
        setConfig({
          ...defaultPIDHxBypassConfig,
          loop_tag: '1540-TI-4828',
          service_desc: 'Pass 1 Catalyst Temp. Bottom B',
          eng_units: 'F',
        });
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
          to="/settings/controller-outputs/faceplates/temp-sensor/1540-TI-4828"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span>Back to 1540-TI-4828 Temperature Sensor</span>
        </Link>

        <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-6 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-faceplate-border glow-text mb-2 flex items-center gap-3">
            <Settings2 className="text-cyan-400" />
            Control Studio – Engineering Function
          </h1>
          <p className="text-muted-foreground mb-6">Faceplate 3D - Complete configuration overview from Faceplate 3A</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <Section title="Loop Information" color="border-cyan-500/30">
              <ParamRow label="Loop Tag" value={config.loop_tag} />
              <ParamRow label="Service" value={config.service_desc} />
              <ParamRow label="Eng Units" value={config.eng_units} />
              <ParamRow label="Output Units" value={config.controller_output_units} />
              <ParamRow label="Sample Time" value={config.sample_time_dt_s} unit="s" />
            </Section>

            <Section title="Operating Point" color="border-amber-500/30">
              <ParamRow label="T_in0 (Inlet)" value={config.Tin0} unit="°F" />
              <ParamRow label="T_hx0 (HX Outlet)" value={config.Thx0} unit="°F" />
              <ParamRow label="T_out0 (Mixed)" value={config.Tout0} unit="°F" />
              <ParamRow label="x̄ (Bypass Frac)" value={config.xbar} />
              <ParamRow label="u₀ (Output)" value={config.u0} unit="%" />
            </Section>

            <Section title="PID Controller" color="border-cyan-500/30">
              <ParamRow label="Mode" value={config.mode} />
              <ParamRow label="Acting Direction" value={config.acting} />
              <ParamRow label="Kc (Gain)" value={config.Kc} />
              <ParamRow label="τI (Integral)" value={config.tauI_s} unit="s" />
              <ParamRow label="τD (Derivative)" value={config.tauD_s} unit="s" />
            </Section>

            <Section title="Output Handling" color="border-cyan-500/30">
              <ParamRow label="Bias" value={config.u_bias} unit="%" />
              <ParamRow label="Output Min" value={config.u_min} unit="%" />
              <ParamRow label="Output Max" value={config.u_max} unit="%" />
              <ParamRow label="Rate Limit" value={config.rate_limit_pct_per_s} unit="%/s" />
              <ParamRow label="Anti-windup" value={config.anti_windup} />
              <ParamRow label="Tracking" value={formatBool(config.tracking)} />
            </Section>

            <Section title="Final Element" color="border-green-500/30">
              <ParamRow label="Kpos (Positioner)" value={config.Kpos} />
              <ParamRow label="τ_pos (Positioner)" value={config.tau_pos_s} unit="s" />
              <ParamRow label="Kv (Valve)" value={config.Kv} />
              <ParamRow label="τ_v (Valve)" value={config.tau_v_s} unit="s" />
              <ParamRow label="Characteristic" value={config.valve_characteristic} />
            </Section>

            <Section title="Sensor" color="border-blue-500/30">
              <ParamRow label="Ksens (Gain)" value={config.Ksens} />
              <ParamRow label="τ_sens (Time Const)" value={config.tau_sens_s} unit="s" />
              <ParamRow label="Noise σ" value={config.noise_sigma_degC} unit="°F" />
              <ParamRow label="PV Filter τ" value={config.pv_filter_tau_s} unit="s" />
            </Section>

          </div>

          <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Control Loop Structure</h3>
            <div className="font-mono text-xs text-cyan-400 overflow-x-auto">
              u → [Gpos][Gv] → x → (Process) → (Sensor) → Tmeas → feedback
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TempSensor4828Faceplate3D;
