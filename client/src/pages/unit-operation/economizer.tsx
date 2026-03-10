import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Thermometer, Play, RotateCcw } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from "recharts";
import expLogo from "@/assets/exp-logo.png";
import controlLoopDiagram from "@assets/image_1772333942214.png";

interface Ec3bResult {
  duty: number;
  gas_out_temp: number;
  water_out_temp: number;
  lmtd: number;
  UA: number;
  uo_rated: number;
  gas_dp: number;
  water_dp: number;
  valve_pos: number;
  pid_output: number;
  cv_required: number;
  valve_dp: number;
  controller_out: number;
  velocity: number;
  friction_loss: number;
  valve_inlet_p: number;
  downstream_p: number;
  dp_orifice: number;
  water_flow_cv: number;
  water_flow_bypass: number;
}

interface StreamData {
  label: string;
  tag: string;
  kind: "gas" | "water";
  SO2?: number; SO3?: number; O2?: number; N2?: number; H2O?: number; H2SO4?: number;
  TOTAL?: number; PRESSURE?: number; TEMPERATURE?: number;
  FLOW?: number;
}

interface SummaryData {
  duty: number;
  gas_T_in: number;
  gas_T_out: number;
  ipat_setpt: number;
  gas_flow: number;
  water_flow_in: number;
  water_flow_cv: number;
  water_flow_mix: number;
  water_T_out: number;
  mixed_T_out: number;
  valve_pos: number;
  pid_output: number;
}

interface DynamicData {
  t: number[];
  gas_out: number[];
  cv_pos: number[];
  pid_output: number[];
  lpf_temp: number[];
  setpt: number[];
}

interface CalcResults {
  ec3b: Ec3bResult;
  streams: Record<string, StreamData>;
  summary: SummaryData;
  dynamic?: DynamicData;
}

const DEFAULTS: Record<string, string | number> = {
  ec3b_ht_area: 18000, ec3b_gas_in_duct: 6.5, ec3b_gas_out_duct: 6.5,
  ec3b_water_dp0: 15.0, ec3b_water_dpf: 1.7,
  ec3b_gas_dp0: 9.0, ec3b_gas_dpf: 1.7, ec3b_pipe_dia: 8.0,
  ec3b_uo: 20.0,
  ec3b_cv_type: "Equal Percentage", ec3b_cv_max: 548.0, ec3b_cv_range: 85,
  valve_upstream_p: 178.55, downstream_p: 157.0,
  friction_loss_ft: 0.906, velocity_fps: 2.22, dp_orifice_psi: 40.387,
  ipat_setpt: 330,
  gas_SO2: 480, gas_SO3: 12148, gas_O2: 4300, gas_N2: 86808, gas_H2O: 0, gas_H2SO4: 0,
  gas_pressure: 101, gas_temp: 548,
  water_flow: 269418, water_press: 969, water_temp: 295,
  sim_mode: "static",
  dyn_tau_valve: 30, dyn_tau_proc: 120, dyn_dead_time: 30,
  dyn_tau_lpf: 15, dyn_dt: 5, dyn_t_end: 600,
};

function InputRow({ label, value, onChange, unit, testId }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string; testId: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground w-48 shrink-0">{label}</span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-sm w-28"
        data-testid={testId}
      />
      {unit && <span className="text-xs text-muted-foreground shrink-0">{unit}</span>}
    </div>
  );
}

function OutputRow({ label, value, unit, testId, color }: {
  label: string; value: string; unit?: string; testId: string; color?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground w-48 shrink-0">{label}</span>
      <span className={`font-mono text-sm w-28 shrink-0 ${color || "text-emerald-400"}`} data-testid={testId}>{value}</span>
      {unit && <span className="text-xs text-muted-foreground shrink-0">{unit}</span>}
    </div>
  );
}

function SectionLabel({ text, color }: { text: string; color?: string }) {
  return (
    <div className="pt-2 pb-1 border-t border-border mt-2">
      <span className={`text-sm font-semibold ${color || "text-amber-400"}`}>{text}</span>
    </div>
  );
}

function fmt(v: number | undefined | null, decimals = 2): string {
  if (v === undefined || v === null) return "---";
  return v.toFixed(decimals);
}

function fmtInt(v: number | undefined | null): string {
  if (v === undefined || v === null) return "---";
  return Math.round(v).toLocaleString();
}

const STREAM_GROUPS = [
  {
    title: "Process Gas Streams",
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    streams: [
      { key: "s15", title: "Stream #15 — EC3B Gas Inlet (CIP)", tag: "GEB0" },
      { key: "s16", title: "Stream #16 — EC3B Gas Outlet (IPAT)", tag: "GEB1" },
    ],
  },
  {
    title: "BFW / Water Streams",
    color: "text-sky-400",
    borderColor: "border-sky-500/30",
    streams: [
      { key: "s803A", title: "Stream #803A — BFW Inlet (from Econ 4A)", tag: "WEC0" },
      { key: "s804B", title: "Stream #804B — BFW After TCV-7224 (actual)", tag: "WEC_CV" },
      { key: "s804C", title: "Stream #804C — EC3B BFW Outlet (heated)", tag: "WEC_OUT" },
      { key: "s804D", title: "Stream #804D — EC3B Bypass Flow", tag: "WEC_BYP" },
      { key: "s804E", title: "Stream #804E — Bypass Valve Outlet", tag: "WEC_BYPO" },
      { key: "s805", title: "Stream #805 — Mixed BFW to Econ 4C", tag: "WEC_MIX" },
    ],
  },
];

function StreamCard({ stream, title, tag }: { stream?: StreamData; title: string; tag: string }) {
  const isGas = stream?.kind === "gas";
  return (
    <Card className="overflow-visible">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-xs font-semibold leading-tight">{title}</CardTitle>
          <span className="text-[10px] text-muted-foreground font-mono">{tag}</span>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-1">
        {isGas ? (
          <>
            {(["SO2","SO3","O2","N2","H2O","H2SO4","TOTAL"] as const).map(f => (
              <div key={f} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{f}</span>
                <span className="font-mono text-sky-400">{stream ? fmtInt((stream as Record<string, number>)[f]) : "---"} <span className="text-muted-foreground">scfm</span></span>
              </div>
            ))}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">PRESSURE</span>
              <span className="font-mono text-amber-400">{stream ? fmt(stream.PRESSURE) : "---"} <span className="text-muted-foreground">in WC</span></span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">TEMPERATURE</span>
              <span className="font-mono text-emerald-400">{stream ? fmt(stream.TEMPERATURE, 1) : "---"} <span className="text-muted-foreground">{"°F"}</span></span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">FLOW</span>
              <span className="font-mono text-sky-400">{stream ? fmtInt(stream.FLOW) : "---"} <span className="text-muted-foreground">LB/HR</span></span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">PRESSURE</span>
              <span className="font-mono text-amber-400">{stream ? fmt(stream.PRESSURE, 1) : "---"} <span className="text-muted-foreground">PSIG</span></span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">TEMPERATURE</span>
              <span className="font-mono text-emerald-400">{stream ? fmt(stream.TEMPERATURE, 1) : "---"} <span className="text-muted-foreground">{"°F"}</span></span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Economizer() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [inputs, setInputs] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, String(v)]))
  );
  const [results, setResults] = useState<CalcResults | null>(null);
  const [activeTab, setActiveTab] = useState("params");

  const set = (key: string) => (val: string) => {
    setInputs(prev => ({ ...prev, [key]: val }));
  };

  const getNumInputs = () => {
    const out: Record<string, number | string> = {};
    for (const [k, v] of Object.entries(inputs)) {
      if (k === "ec3b_cv_type" || k === "sim_mode") {
        out[k] = v;
      } else {
        out[k] = parseFloat(v) || 0;
      }
    }
    return out;
  };

  const calcMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ec3b-calc", getNumInputs());
      return res.json() as Promise<CalcResults>;
    },
    onSuccess: (data) => {
      setResults(data);
      if (data.dynamic) {
        setActiveTab("dynamic");
      } else {
        setActiveTab("results");
      }
      toast({ title: "Calculation Complete", description: "EC3B results updated successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Calculation Error", description: err.message, variant: "destructive" });
    },
  });

  const resetDefaults = () => {
    setInputs(Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, String(v)])));
    setResults(null);
  };

  const gasTotal = ["gas_SO2", "gas_SO3", "gas_O2", "gas_N2", "gas_H2O", "gas_H2SO4"]
    .reduce((sum, k) => sum + (parseFloat(inputs[k]) || 0), 0);

  const simMode = inputs.sim_mode || "static";

  const dynChartData = useMemo(() => {
    if (!results?.dynamic) return [];
    const d = results.dynamic;
    return d.t.map((t, i) => ({
      t,
      gas_out: d.gas_out[i],
      lpf_temp: d.lpf_temp[i],
      cv_pos: d.cv_pos[i],
      pid_output: d.pid_output[i],
      setpt: d.setpt[i],
    }));
  }, [results?.dynamic]);

  const ec3b = results?.ec3b;
  const summary = results?.summary;

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/unit-operations")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground">Lithium Americas</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => calcMutation.mutate()}
              disabled={calcMutation.isPending}
              data-testid="button-run-calc"
            >
              <Play className="w-4 h-4 mr-1" />
              {calcMutation.isPending ? "Calculating..." : "Run Calculation"}
            </Button>
            <Button variant="outline" onClick={resetDefaults} data-testid="button-reset">
              <RotateCcw className="w-4 h-4 mr-1" /> Reset
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Thermometer className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">
              EC3B — Economizer 3B — 1540-HX-002
            </h1>
            <span className="text-sm text-muted-foreground">Control Loop TIC/TCV-7224</span>
          </div>

          <Card className="overflow-visible">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">Simulation Mode:</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant={simMode === "static" ? "default" : "outline"}
                      size="sm"
                      onClick={() => set("sim_mode")("static")}
                      data-testid="button-mode-static"
                    >
                      Static Calculation
                    </Button>
                    <Button
                      variant={simMode === "dynamic" ? "default" : "outline"}
                      size="sm"
                      onClick={() => set("sim_mode")("dynamic")}
                      data-testid="button-mode-dynamic"
                    >
                      Dynamic Simulation
                    </Button>
                  </div>
                </div>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-cyan-400 font-medium">Target Temperatures:</span>
                  <span className="text-sm text-muted-foreground">Target Pass 3 Outlet Temp</span>
                  <Input
                    value={inputs.ipat_setpt}
                    onChange={(e) => set("ipat_setpt")(e.target.value)}
                    className="font-mono text-sm w-20 text-cyan-400"
                    data-testid="input-ipat-setpt"
                  />
                  <span className="text-xs text-muted-foreground">{"°F"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList data-testid="tabs-list">
              <TabsTrigger value="params" data-testid="tab-params">Equipment Parameters</TabsTrigger>
              <TabsTrigger value="inputs" data-testid="tab-inputs">Stream Inputs</TabsTrigger>
              <TabsTrigger value="results" data-testid="tab-results">HX Results</TabsTrigger>
              <TabsTrigger value="streams" data-testid="tab-streams">Stream Outputs</TabsTrigger>
              <TabsTrigger value="dynamic" data-testid="tab-dynamic">Dynamic Response</TabsTrigger>
            </TabsList>

            <TabsContent value="params" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="overflow-visible">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-400">EC3B — Economizer 3B (1540-HX-002)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <InputRow label="Econ 3B HT Area" value={inputs.ec3b_ht_area} onChange={set("ec3b_ht_area")} unit="ft²" testId="input-ec3b-ht-area" />
                    <InputRow label="Gas Inlet Duct Dia" value={inputs.ec3b_gas_in_duct} onChange={set("ec3b_gas_in_duct")} unit="ft" testId="input-ec3b-gas-in-duct" />
                    <InputRow label="Gas Outlet Duct Dia" value={inputs.ec3b_gas_out_duct} onChange={set("ec3b_gas_out_duct")} unit="ft" testId="input-ec3b-gas-out-duct" />
                    <InputRow label="Econ 3B Water dP₀" value={inputs.ec3b_water_dp0} onChange={set("ec3b_water_dp0")} unit="psi" testId="input-ec3b-water-dp0" />
                    <InputRow label="Water dP Rating Factor" value={inputs.ec3b_water_dpf} onChange={set("ec3b_water_dpf")} testId="input-ec3b-water-dpf" />
                    <InputRow label="Process Gas dP₀" value={inputs.ec3b_gas_dp0} onChange={set("ec3b_gas_dp0")} unit="in WC" testId="input-ec3b-gas-dp0" />
                    <InputRow label="Gas dP Rating Factor" value={inputs.ec3b_gas_dpf} onChange={set("ec3b_gas_dpf")} testId="input-ec3b-gas-dpf" />
                    <InputRow label="Econ 3B Pipe Diameter" value={inputs.ec3b_pipe_dia} onChange={set("ec3b_pipe_dia")} unit="in" testId="input-ec3b-pipe-dia" />
                  </CardContent>
                </Card>

                <Card className="overflow-visible">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-amber-400">Heat Transfer & Control Valve</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <InputRow label="Econ 3B Uo" value={inputs.ec3b_uo} onChange={set("ec3b_uo")} unit="BTU/ft²·°F·hr" testId="input-ec3b-uo" />
                    <SectionLabel text="TCV-7224" color="text-amber-400" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-48 shrink-0">Control Valve Char.</span>
                      <Select value={inputs.ec3b_cv_type} onValueChange={set("ec3b_cv_type")}>
                        <SelectTrigger className="w-44 font-mono text-sm" data-testid="select-ec3b-cv-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Equal Percentage">Equal Percentage</SelectItem>
                          <SelectItem value="Linear">Linear</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <InputRow label="Cv Max" value={inputs.ec3b_cv_max} onChange={set("ec3b_cv_max")} testId="input-ec3b-cv-max" />
                    <InputRow label="Rangeability (R)" value={inputs.ec3b_cv_range} onChange={set("ec3b_cv_range")} testId="input-ec3b-cv-range" />
                    <SectionLabel text="Hydraulics" color="text-amber-400" />
                    <InputRow label="Valve Upstream P" value={inputs.valve_upstream_p} onChange={set("valve_upstream_p")} unit="PSIG" testId="input-valve-upstream-p" />
                    <InputRow label="Downstream P" value={inputs.downstream_p} onChange={set("downstream_p")} unit="PSIG" testId="input-downstream-p" />
                    <InputRow label="Friction Loss" value={inputs.friction_loss_ft} onChange={set("friction_loss_ft")} unit="ft" testId="input-friction-loss" />
                    <InputRow label="Velocity" value={inputs.velocity_fps} onChange={set("velocity_fps")} unit="ft/s" testId="input-velocity" />
                    <InputRow label="dP Orifice" value={inputs.dp_orifice_psi} onChange={set("dp_orifice_psi")} unit="psi" testId="input-dp-orifice" />
                  </CardContent>
                </Card>
              </div>

              <Card className="overflow-visible">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-purple-400">Dynamic Simulation Parameters (TIC-7224 Loop)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <InputRow label="Valve Actuator τ" value={inputs.dyn_tau_valve} onChange={set("dyn_tau_valve")} unit="s" testId="input-dyn-tau-valve" />
                    <InputRow label="Process τ" value={inputs.dyn_tau_proc} onChange={set("dyn_tau_proc")} unit="s" testId="input-dyn-tau-proc" />
                    <InputRow label="Dead Time" value={inputs.dyn_dead_time} onChange={set("dyn_dead_time")} unit="s" testId="input-dyn-dead-time" />
                    <InputRow label="LPF τ" value={inputs.dyn_tau_lpf} onChange={set("dyn_tau_lpf")} unit="s" testId="input-dyn-tau-lpf" />
                    <InputRow label="Time Step dt" value={inputs.dyn_dt} onChange={set("dyn_dt")} unit="s" testId="input-dyn-dt" />
                    <InputRow label="Sim Duration" value={inputs.dyn_t_end} onChange={set("dyn_t_end")} unit="s" testId="input-dyn-t-end" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inputs" className="space-y-4">
              <Card className="overflow-visible">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-400">Stream #15 — EC3B Gas Inlet (Hot Gas from CIP) [GEB0]</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <InputRow label="SO2" value={inputs.gas_SO2} onChange={set("gas_SO2")} unit="scfm" testId="input-gas-so2" />
                    <InputRow label="SO3" value={inputs.gas_SO3} onChange={set("gas_SO3")} unit="scfm" testId="input-gas-so3" />
                    <InputRow label="O2" value={inputs.gas_O2} onChange={set("gas_O2")} unit="scfm" testId="input-gas-o2" />
                    <InputRow label="N2" value={inputs.gas_N2} onChange={set("gas_N2")} unit="scfm" testId="input-gas-n2" />
                    <InputRow label="H2O" value={inputs.gas_H2O} onChange={set("gas_H2O")} unit="scfm" testId="input-gas-h2o" />
                    <InputRow label="H2SO4" value={inputs.gas_H2SO4} onChange={set("gas_H2SO4")} unit="scfm" testId="input-gas-h2so4" />
                    <InputRow label="PRESSURE" value={inputs.gas_pressure} onChange={set("gas_pressure")} unit="in WC" testId="input-gas-pressure" />
                    <InputRow label="TEMPERATURE" value={inputs.gas_temp} onChange={set("gas_temp")} unit={"°F"} testId="input-gas-temp" />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Total Gas Flow: <span className="font-mono text-sky-400">{gasTotal.toLocaleString()}</span> scfm
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-visible">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-sky-400">Stream #803A — EC3B BFW Inlet (from Econ 4A) [WEC0]</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <InputRow label="FLOW" value={inputs.water_flow} onChange={set("water_flow")} unit="LB/HR" testId="input-water-flow" />
                  <InputRow label="PRESSURE" value={inputs.water_press} onChange={set("water_press")} unit="PSIG" testId="input-water-press" />
                  <InputRow label="TEMPERATURE" value={inputs.water_temp} onChange={set("water_temp")} unit={"°F"} testId="input-water-temp" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="overflow-visible">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-400">EC3B Heat Transfer Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <OutputRow label="Duty" value={fmt(ec3b?.duty, 3)} unit="MMBTU/hr" testId="out-duty" />
                    <OutputRow label="Gas Inlet Temp" value={fmt(parseFloat(inputs.gas_temp), 1)} unit={"°F"} testId="out-gas-in-temp" color="text-amber-400" />
                    <OutputRow label="Gas Outlet Temp" value={fmt(ec3b?.gas_out_temp)} unit={"°F"} testId="out-gas-out-temp" color="text-amber-400" />
                    <OutputRow label="Water Inlet Temp" value={fmt(parseFloat(inputs.water_temp), 1)} unit={"°F"} testId="out-water-in-temp" color="text-sky-400" />
                    <OutputRow label="Water Outlet Temp" value={fmt(ec3b?.water_out_temp, 1)} unit={"°F"} testId="out-water-out-temp" color="text-sky-400" />
                    <OutputRow label="Mixed BFW Out Temp" value={fmt(summary?.mixed_T_out, 1)} unit={"°F"} testId="out-mixed-t-out" color="text-cyan-400" />
                    <OutputRow label="LMTD" value={fmt(ec3b?.lmtd, 1)} unit={"°F"} testId="out-lmtd" />
                    <OutputRow label="UA" value={ec3b ? fmtInt(ec3b.UA) : "---"} unit="BTU/hr·°F" testId="out-ua" />
                    <OutputRow label="U₀ (rated)" value={fmt(ec3b?.uo_rated, 3)} unit="BTU/ft²·°F·hr" testId="out-uo-rated" />
                    <OutputRow label="Gas Side dP" value={fmt(ec3b?.gas_dp)} unit="in WC" testId="out-gas-dp" color="text-amber-400" />
                    <OutputRow label="Water Side dP" value={fmt(ec3b?.water_dp, 3)} unit="psi" testId="out-water-dp" color="text-sky-400" />
                  </CardContent>
                </Card>

                <Card className="overflow-visible">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-amber-400">Econ 3B Valve Hydraulic Results (TCV-7224)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <OutputRow label="Velocity" value={fmt(ec3b?.velocity)} unit="ft/s" testId="out-velocity" color="text-sky-400" />
                    <OutputRow label="Friction Loss" value={fmt(ec3b?.friction_loss, 3)} unit="ft" testId="out-friction-loss" color="text-sky-400" />
                    <OutputRow label="Valve Inlet P" value={fmt(ec3b?.valve_inlet_p)} unit="PSIG" testId="out-valve-inlet-p" color="text-amber-400" />
                    <OutputRow label="Downstream P" value={fmt(ec3b?.downstream_p, 0)} unit="PSIG" testId="out-downstream-p" color="text-amber-400" />
                    <OutputRow label="Valve ΔP" value={fmt(ec3b?.valve_dp, 3)} unit="psi" testId="out-valve-dp" color="text-red-400" />
                    <OutputRow label="dP Orifice" value={fmt(ec3b?.dp_orifice, 3)} unit="psi" testId="out-dp-orifice" color="text-amber-400" />
                    <OutputRow label="Cv Required" value={fmt(ec3b?.cv_required, 4)} testId="out-cv-required" color="text-sky-400" />
                    <OutputRow label="Controller Output" value={fmt(ec3b?.controller_out)} unit="%" testId="out-controller-out" />
                    <SectionLabel text="PID / CV" color="text-amber-400" />
                    <OutputRow label="Valve Position" value={fmt(ec3b?.valve_pos, 4)} unit="%" testId="out-valve-pos" />
                    <OutputRow label="PID Output" value={fmt(ec3b?.pid_output, 4)} unit="mA" testId="out-pid-output" />
                  </CardContent>
                </Card>
              </div>

              <Card className="overflow-visible">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-emerald-400">Overall Heat & Material Balance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <OutputRow label="Total Duty" value={fmt(summary?.duty, 3)} unit="MMBTU/hr" testId="out-sum-duty" />
                    <OutputRow label="Gas Inlet Temp" value={fmt(summary?.gas_T_in, 1)} unit={"°F"} testId="out-sum-gas-t-in" color="text-amber-400" />
                    <OutputRow label="Gas Outlet Temp" value={fmt(summary?.gas_T_out, 1)} unit={"°F"} testId="out-sum-gas-t-out" color="text-amber-400" />
                    <OutputRow label="IPAT Setpoint" value={fmt(summary?.ipat_setpt, 1)} unit={"°F"} testId="out-sum-ipat-setpt" color="text-cyan-400" />
                    <OutputRow label="Gas Flow" value={summary ? fmtInt(summary.gas_flow) : "---"} unit="LB/HR" testId="out-sum-gas-flow" color="text-sky-400" />
                    <OutputRow label="BFW Total Flow In" value={summary ? fmtInt(summary.water_flow_in) : "---"} unit="LB/HR" testId="out-sum-water-flow-in" color="text-sky-400" />
                    <OutputRow label="BFW Through CV" value={summary ? fmtInt(summary.water_flow_cv) : "---"} unit="LB/HR" testId="out-sum-water-flow-cv" color="text-sky-400" />
                    <OutputRow label="BFW Mixed Out" value={summary ? fmtInt(summary.water_flow_mix) : "---"} unit="LB/HR" testId="out-sum-water-flow-mix" color="text-sky-400" />
                    <OutputRow label="Mixed BFW Temp" value={fmt(summary?.mixed_T_out, 1)} unit={"°F"} testId="out-sum-mixed-t-out" color="text-cyan-400" />
                    <OutputRow label="Valve Position" value={fmt(summary?.valve_pos)} unit="%" testId="out-sum-valve-pos" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="streams" className="space-y-6">
              {STREAM_GROUPS.map(group => (
                <div key={group.title}>
                  <div className={`flex items-center gap-2 mb-3 border-b pb-2 ${group.borderColor}`}>
                    <span className={`text-sm font-semibold ${group.color}`}>{group.title}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {group.streams.map(s => (
                      <StreamCard
                        key={s.key}
                        stream={results?.streams?.[s.key]}
                        title={s.title}
                        tag={s.tag}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="dynamic" className="space-y-4">
              <Card className="overflow-visible">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-cyan-400">
                    TIC-7224 Dynamic Response — First-Order + Dead-Time + LPF
                  </CardTitle>
                  {!results?.dynamic && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Run calculation in Dynamic mode to populate
                    </p>
                  )}
                </CardHeader>
              </Card>

              {dynChartData.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="overflow-visible">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-xs text-blue-400">EC3B Gas Outlet Temperature (IPAT Response)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={dynChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="t" tick={{ fontSize: 10 }} label={{ value: "Time (s)", position: "insideBottom", offset: -2, fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line type="monotone" dataKey="gas_out" stroke="#3a7bd5" name="Gas Outlet T" dot={false} strokeWidth={2} />
                            <Line type="monotone" dataKey="lpf_temp" stroke="#3ecfcf" name="LPF Meas." dot={false} strokeWidth={1.5} />
                            <Line type="monotone" dataKey="setpt" stroke="#e8a838" name={`SP=${inputs.ipat_setpt}°F`} dot={false} strokeWidth={1} strokeDasharray="6 3" />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="overflow-visible">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-xs text-amber-400">TCV-7224 Valve Position & PID Output</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={dynChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="t" tick={{ fontSize: 10 }} label={{ value: "Time (s)", position: "insideBottom", offset: -2, fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line type="monotone" dataKey="cv_pos" stroke="#4caf7d" name="Valve Pos %" dot={false} strokeWidth={2} />
                            <Line type="monotone" dataKey="pid_output" stroke="#e8a838" name="PID mA" dot={false} strokeWidth={1.5} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <Card>
            <CardContent className="p-4">
              <img
                src={controlLoopDiagram}
                alt="Control Loop - Economizer 3B IPAT Inlet Temperature"
                className="w-full rounded"
                data-testid="img-control-loop-diagram"
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
