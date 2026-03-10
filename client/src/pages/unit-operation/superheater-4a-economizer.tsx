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
import controlLoopDiagram from "@assets/image_1772155398688.png";

interface HxResult {
  duty: number;
  gas_out_temp: number;
  steam_out_temp: number;
  lmtd: number;
  UA: number;
  uo_rated: number;
  gas_dp: number;
  steam_dp: number;
  steam_flow: number;
  valve_pos?: number;
  pid_output?: number;
  cv_required?: number;
  valve_dp?: number;
  sh1b_out_temp?: number;
  sh1b_duty?: number;
  total_sh_duty?: number;
}

interface StreamData {
  label: string;
  tag: string;
  kind: "gas" | "steam";
  SO2?: number; SO3?: number; O2?: number; N2?: number; H2O?: number; H2SO4?: number;
  TOTAL?: number; PRESSURE?: number; TEMPERATURE?: number;
  FLOW?: number;
}

interface SummaryData {
  total_duty: number;
  total_sh_duty: number;
  gas_flow: number;
  gas_T_in: number;
  gas_T_out: number;
  sh_stm_flow: number;
  sh1b_out_temp: number;
  sh1b_duty: number;
  ec4c_stm_flow: number;
  ec4a_stm_flow: number;
}

interface DynamicData {
  t: number[];
  sh1b_out_temp: number[];
  ec4a_gas_out: number[];
  sh_valve_pos: number[];
  ec4a_valve_pos: number[];
  sh_setpt: number[];
  ec4a_setpt: number[];
}

interface CalcResults {
  sh: HxResult;
  ec4c: HxResult;
  ec4a: HxResult;
  streams: Record<string, StreamData>;
  summary: SummaryData;
  dynamic?: DynamicData;
}

const DEFAULTS: Record<string, string | number> = {
  sh_ht_area: 18000, sh_uo: 15.0, sh_pipe_dia: 12.0, sh_gas_in_duct: 6.5,
  sh_steam_dp0: 15.0, sh_dp_factor: 1.7, sh_cv_type: "Equal Percentage",
  sh_cv_max: 1000.0, sh_cv_range: 85,
  sh1b_duty: 38.6, sh1b_out_setpt: 900,
  ec4c_ht_area: 13000, ec4c_uo: 15.0, ec4c_gas_out_duct: 6.0,
  ec4c_steam_dp0: 15.0, ec4c_dp_factor: 1.7, ec4c_proc_dp0: 11.0, ec4c_proc_dpf: 1.7,
  ec4a_ht_area: 15000, ec4a_uo: 15.0, ec4a_pipe_dia: 8.0,
  ec4a_steam_dp0: 15.0, ec4a_dp_factor: 1.7, ec4a_cv_type: "Equal Percentage",
  ec4a_cv_max: 548.0, ec4a_cv_range: 85, ec4a_cv_setpt: 275,
  gas_SO2: 18, gas_SO3: 462, gas_O2: 4069, gas_N2: 86808, gas_H2O: 0, gas_H2SO4: 0,
  gas_pressure: 47, gas_temp: 808,
  sh_steam_flow: 269418, sh_steam_press: 915, sh_steam_temp: 536,
  ec4c_steam_flow: 264418, ec4c_steam_press: 951, ec4c_steam_temp: 401,
  ec4a_steam_flow: 264418, ec4a_steam_press: 978, ec4a_steam_temp: 223,
  sim_mode: "static",
  dyn_tau_valve: 30, dyn_tau_proc: 120, dyn_dead_time: 30, dyn_dt: 5, dyn_t_end: 600,
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
    title: "Process Gas Streams (Hot Side)",
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    streams: [
      { key: "s20", title: "Stream #20 - SH4A Inlet", tag: "GSA0" },
      { key: "s21", title: "Stream #21 - Econ 4C Inlet", tag: "GEC0" },
      { key: "s22", title: "Stream #22 - Econ 4A Inlet", tag: "GEA0" },
      { key: "s23", title: "Stream #23 - FAT Inlet", tag: "GF0" },
    ],
  },
  {
    title: "SH4A Steam Circuit",
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    streams: [
      { key: "s806", title: "Stream #806 - SH4A Steam In (CV)", tag: "SSA0" },
      { key: "s807", title: "Stream #807 - SH4A Steam Out -> SH1B", tag: "SSA_OUT" },
      { key: "s807b", title: "Stream #807B - SH1B Steam Out (-> TG)", tag: "SH1B_OUT" },
    ],
  },
  {
    title: "EC4C BFW / Steam Circuit",
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    streams: [
      { key: "s805", title: "Stream #805 - EC4C BFW Inlet", tag: "SEC0" },
      { key: "s805out", title: "Stream #805 OUT - EC4C Steam Out", tag: "SEC_OUT" },
    ],
  },
  {
    title: "EC4A BFW / Steam Circuit (Streams 803A-808)",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    streams: [
      { key: "s803A", title: "Stream #803A - EC4A BFW Inlet", tag: "SEA0" },
      { key: "s803B", title: "Stream #803B - After FE/FIT-7221", tag: "SEA0" },
      { key: "s803C", title: "Stream #803C - After TCV / Boiler Mixer", tag: "GB0" },
      { key: "s803D", title: "Stream #803D - Split to Boiler (SEB0)", tag: "SEB0" },
      { key: "s803E", title: "Stream #803E - EC4A Steam Outlet (GF1)", tag: "GF1" },
      { key: "s804", title: "Stream #804 - Furnace Outlet (GF1)", tag: "GF1" },
      { key: "s806w", title: "Stream #806 - WHB In Header Ref.", tag: "GB0" },
      { key: "s808", title: "Stream #808 - Jug Valve Inlet (GJV0)", tag: "GJV0" },
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
              <span className="font-mono text-emerald-400">{stream ? fmt(stream.TEMPERATURE, 1) : "---"} <span className="text-muted-foreground">{"\u00B0F"}</span></span>
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
              <span className="font-mono text-emerald-400">{stream ? fmt(stream.TEMPERATURE, 1) : "---"} <span className="text-muted-foreground">{"\u00B0F"}</span></span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Superheater4AEconomizer() {
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
      if (k === "sh_cv_type" || k === "ec4a_cv_type" || k === "sim_mode") {
        out[k] = v;
      } else {
        out[k] = parseFloat(v) || 0;
      }
    }
    return out;
  };

  const calcMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sh4a-ec4c-ec4a-calc", getNumInputs());
      return res.json() as Promise<CalcResults>;
    },
    onSuccess: (data) => {
      setResults(data);
      if (data.dynamic) {
        setActiveTab("dynamic");
      } else {
        setActiveTab("results");
      }
      toast({ title: "Calculation Complete", description: "Results updated successfully." });
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
      sh1b_temp: d.sh1b_out_temp[i],
      ec4a_temp: d.ec4a_gas_out[i],
      sh_valve: d.sh_valve_pos[i],
      ec4a_valve: d.ec4a_valve_pos[i],
      sh_setpt: d.sh_setpt[i],
      ec4a_setpt: d.ec4a_setpt[i],
    }));
  }, [results?.dynamic]);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-[9999] border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/unit-operation-simulator")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => calcMutation.mutate()}
              disabled={calcMutation.isPending}
              data-testid="button-run-calc"
            >
              <Play className="h-4 w-4 mr-2" />
              {calcMutation.isPending ? "Calculating..." : "Run Calculation"}
            </Button>
            <Button variant="outline" onClick={resetDefaults} data-testid="button-reset">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-md bg-primary/10">
              <Thermometer className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">
                HP Superheater 4A / Economizer 4C / Economizer 4A
              </h1>
              <p className="text-muted-foreground text-sm" data-testid="text-page-subtitle">
                1540-HX-004 / 006 / 007
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-muted-foreground">Simulation Mode:</span>
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

                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-semibold text-cyan-400">Target Temperatures:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">SH 1B Outlet Temp</span>
                    <Input
                      value={inputs.sh1b_out_setpt}
                      onChange={(e) => set("sh1b_out_setpt")(e.target.value)}
                      className="font-mono text-sm w-20 text-cyan-400"
                      data-testid="input-sh1b-out-setpt"
                    />
                    <span className="text-xs text-muted-foreground">{"\u00B0F"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Process Gas Outlet Temp</span>
                    <Input
                      value={inputs.ec4a_cv_setpt}
                      onChange={(e) => set("ec4a_cv_setpt")(e.target.value)}
                      className="font-mono text-sm w-20 text-cyan-400"
                      data-testid="input-ec4a-cv-setpt"
                    />
                    <span className="text-xs text-muted-foreground">{"\u00B0F"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList data-testid="tabs-main">
              <TabsTrigger value="params" data-testid="tab-params">Equipment Parameters</TabsTrigger>
              <TabsTrigger value="inputs" data-testid="tab-inputs">Stream Inputs</TabsTrigger>
              <TabsTrigger value="results" data-testid="tab-results">HX Results</TabsTrigger>
              <TabsTrigger value="steam" data-testid="tab-steam">Steam Outputs</TabsTrigger>
              <TabsTrigger value="dynamic" data-testid="tab-dynamic">Dynamic Response</TabsTrigger>
            </TabsList>

            <TabsContent value="params" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">SH 4A — HP Superheater</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <InputRow label="HT Area" value={inputs.sh_ht_area} onChange={set("sh_ht_area")} unit="ft²" testId="input-sh-ht-area" />
                    <InputRow label="Overall U₀" value={inputs.sh_uo} onChange={set("sh_uo")} unit="BTU/ft²·°F·hr" testId="input-sh-uo" />
                    <InputRow label="Pipe Diameter" value={inputs.sh_pipe_dia} onChange={set("sh_pipe_dia")} unit="in" testId="input-sh-pipe-dia" />
                    <InputRow label="Gas Inlet Duct Dia" value={inputs.sh_gas_in_duct} onChange={set("sh_gas_in_duct")} unit="ft" testId="input-sh-gas-duct" />
                    <InputRow label="Steam dP₀" value={inputs.sh_steam_dp0} onChange={set("sh_steam_dp0")} unit="psi" testId="input-sh-steam-dp0" />
                    <InputRow label="Steam dP Rating Factor" value={inputs.sh_dp_factor} onChange={set("sh_dp_factor")} testId="input-sh-dp-factor" />
                    <SectionLabel text="Control Valve (→ TG Temp)" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-48 shrink-0">Valve Characteristic</span>
                      <Select value={inputs.sh_cv_type} onValueChange={set("sh_cv_type")}>
                        <SelectTrigger className="w-44" data-testid="input-sh-cv-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Equal Percentage">Equal Percentage</SelectItem>
                          <SelectItem value="Linear">Linear</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <InputRow label="Cv Max" value={inputs.sh_cv_max} onChange={set("sh_cv_max")} testId="input-sh-cv-max" />
                    <InputRow label="Rangeability (R)" value={inputs.sh_cv_range} onChange={set("sh_cv_range")} testId="input-sh-cv-range" />
                    <SectionLabel text="SH 1B Input" />
                    <InputRow label="SH 1B Duty" value={inputs.sh1b_duty} onChange={set("sh1b_duty")} unit="MMBTU/hr" testId="input-sh1b-duty" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">EC 4C — Economizer 4C</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <InputRow label="HT Area" value={inputs.ec4c_ht_area} onChange={set("ec4c_ht_area")} unit="ft²" testId="input-ec4c-ht-area" />
                    <InputRow label="Overall U₀" value={inputs.ec4c_uo} onChange={set("ec4c_uo")} unit="BTU/ft²·°F·hr" testId="input-ec4c-uo" />
                    <InputRow label="Gas Outlet Duct Dia" value={inputs.ec4c_gas_out_duct} onChange={set("ec4c_gas_out_duct")} unit="ft" testId="input-ec4c-gas-duct" />
                    <InputRow label="Steam dP₀" value={inputs.ec4c_steam_dp0} onChange={set("ec4c_steam_dp0")} unit="psi" testId="input-ec4c-steam-dp0" />
                    <InputRow label="Steam dP Rating Factor" value={inputs.ec4c_dp_factor} onChange={set("ec4c_dp_factor")} testId="input-ec4c-dp-factor" />
                    <InputRow label="Process Gas dP₀" value={inputs.ec4c_proc_dp0} onChange={set("ec4c_proc_dp0")} unit="in WC" testId="input-ec4c-proc-dp0" />
                    <InputRow label="Process Gas dP Factor" value={inputs.ec4c_proc_dpf} onChange={set("ec4c_proc_dpf")} testId="input-ec4c-proc-dpf" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">EC 4A — Economizer 4A</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <InputRow label="HT Area" value={inputs.ec4a_ht_area} onChange={set("ec4a_ht_area")} unit="ft²" testId="input-ec4a-ht-area" />
                    <InputRow label="Overall U₀" value={inputs.ec4a_uo} onChange={set("ec4a_uo")} unit="BTU/ft²·°F·hr" testId="input-ec4a-uo" />
                    <InputRow label="Pipe Diameter" value={inputs.ec4a_pipe_dia} onChange={set("ec4a_pipe_dia")} unit="in" testId="input-ec4a-pipe-dia" />
                    <InputRow label="Steam dP₀" value={inputs.ec4a_steam_dp0} onChange={set("ec4a_steam_dp0")} unit="psi" testId="input-ec4a-steam-dp0" />
                    <InputRow label="Steam dP Rating Factor" value={inputs.ec4a_dp_factor} onChange={set("ec4a_dp_factor")} testId="input-ec4a-dp-factor" />
                    <SectionLabel text="Control Valve (→ Gas Outlet Temp)" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-48 shrink-0">Valve Characteristic</span>
                      <Select value={inputs.ec4a_cv_type} onValueChange={set("ec4a_cv_type")}>
                        <SelectTrigger className="w-44" data-testid="input-ec4a-cv-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Equal Percentage">Equal Percentage</SelectItem>
                          <SelectItem value="Linear">Linear</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <InputRow label="Cv Max" value={inputs.ec4a_cv_max} onChange={set("ec4a_cv_max")} testId="input-ec4a-cv-max" />
                    <InputRow label="Rangeability (R)" value={inputs.ec4a_cv_range} onChange={set("ec4a_cv_range")} testId="input-ec4a-cv-range" />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-purple-400">Dynamic Simulation Parameters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <InputRow label="Valve Tau" value={inputs.dyn_tau_valve} onChange={set("dyn_tau_valve")} unit="s" testId="input-dyn-tau-valve" />
                    <InputRow label="Process Tau" value={inputs.dyn_tau_proc} onChange={set("dyn_tau_proc")} unit="s" testId="input-dyn-tau-proc" />
                    <InputRow label="Dead Time" value={inputs.dyn_dead_time} onChange={set("dyn_dead_time")} unit="s" testId="input-dyn-dead-time" />
                    <InputRow label="Time Step dt" value={inputs.dyn_dt} onChange={set("dyn_dt")} unit="s" testId="input-dyn-dt" />
                    <InputRow label="Sim Duration" value={inputs.dyn_t_end} onChange={set("dyn_t_end")} unit="s" testId="input-dyn-t-end" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inputs" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Stream #20 — Process Gas SH4A Inlet (GSA0)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <InputRow label="SO2" value={inputs.gas_SO2} onChange={set("gas_SO2")} unit="scfm" testId="input-gas-so2" />
                    <InputRow label="SO3" value={inputs.gas_SO3} onChange={set("gas_SO3")} unit="scfm" testId="input-gas-so3" />
                    <InputRow label="O2" value={inputs.gas_O2} onChange={set("gas_O2")} unit="scfm" testId="input-gas-o2" />
                    <InputRow label="N2" value={inputs.gas_N2} onChange={set("gas_N2")} unit="scfm" testId="input-gas-n2" />
                    <InputRow label="H2O" value={inputs.gas_H2O} onChange={set("gas_H2O")} unit="scfm" testId="input-gas-h2o" />
                    <InputRow label="H2SO4" value={inputs.gas_H2SO4} onChange={set("gas_H2SO4")} unit="scfm" testId="input-gas-h2so4" />
                  </div>
                  <div className="border-t border-border pt-2 mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-48 shrink-0">TOTAL</span>
                      <span className="font-mono text-sm w-28 text-foreground" data-testid="text-gas-total">{gasTotal.toFixed(0)}</span>
                      <span className="text-xs text-muted-foreground">scfm</span>
                    </div>
                    <InputRow label="PRESSURE" value={inputs.gas_pressure} onChange={set("gas_pressure")} unit="in WC" testId="input-gas-pressure" />
                    <InputRow label="TEMPERATURE" value={inputs.gas_temp} onChange={set("gas_temp")} unit="°F" testId="input-gas-temp" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Steam Inlet Streams</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <SectionLabel text="Stream #806 — SH4A Steam Inlet (SSA0)" />
                    <div className="space-y-2 pl-2">
                      <InputRow label="FLOW" value={inputs.sh_steam_flow} onChange={set("sh_steam_flow")} unit="LB/HR" testId="input-sh-steam-flow" />
                      <InputRow label="PRESSURE" value={inputs.sh_steam_press} onChange={set("sh_steam_press")} unit="PSIG" testId="input-sh-steam-press" />
                      <InputRow label="TEMPERATURE" value={inputs.sh_steam_temp} onChange={set("sh_steam_temp")} unit="°F" testId="input-sh-steam-temp" />
                    </div>
                  </div>
                  <div>
                    <SectionLabel text="Stream #805 — EC4C Steam Inlet (SEC0)" />
                    <div className="space-y-2 pl-2">
                      <InputRow label="FLOW" value={inputs.ec4c_steam_flow} onChange={set("ec4c_steam_flow")} unit="LB/HR" testId="input-ec4c-steam-flow" />
                      <InputRow label="PRESSURE" value={inputs.ec4c_steam_press} onChange={set("ec4c_steam_press")} unit="PSIG" testId="input-ec4c-steam-press" />
                      <InputRow label="TEMPERATURE" value={inputs.ec4c_steam_temp} onChange={set("ec4c_steam_temp")} unit="°F" testId="input-ec4c-steam-temp" />
                    </div>
                  </div>
                  <div>
                    <SectionLabel text="Stream #803A — EC4A Steam Inlet (SEA0)" />
                    <div className="space-y-2 pl-2">
                      <InputRow label="FLOW" value={inputs.ec4a_steam_flow} onChange={set("ec4a_steam_flow")} unit="LB/HR" testId="input-ec4a-steam-flow" />
                      <InputRow label="PRESSURE" value={inputs.ec4a_steam_press} onChange={set("ec4a_steam_press")} unit="PSIG" testId="input-ec4a-steam-press" />
                      <InputRow label="TEMPERATURE" value={inputs.ec4a_steam_temp} onChange={set("ec4a_steam_temp")} unit="°F" testId="input-ec4a-steam-temp" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">SH 4A Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <OutputRow label="Duty" value={fmt(results?.sh?.duty, 3)} unit="MMBTU/hr" testId="output-sh-duty" />
                    <OutputRow label="Gas Outlet Temp" value={fmt(results?.sh?.gas_out_temp, 1)} unit="°F" testId="output-sh-gas-out" color="text-amber-400" />
                    <OutputRow label="Steam Outlet Temp" value={fmt(results?.sh?.steam_out_temp, 1)} unit="°F" testId="output-sh-steam-out" color="text-purple-400" />
                    <OutputRow label="Steam Flow" value={fmtInt(results?.sh?.steam_flow)} unit="LB/HR" testId="output-sh-steam-flow" color="text-sky-400" />
                    <OutputRow label="LMTD" value={fmt(results?.sh?.lmtd, 1)} unit="°F" testId="output-sh-lmtd" />
                    <OutputRow label="UA" value={fmtInt(results?.sh?.UA)} unit="BTU/hr·°F" testId="output-sh-ua" />
                    <OutputRow label="U₀ (rated)" value={fmt(results?.sh?.uo_rated, 3)} unit="BTU/ft²·°F·hr" testId="output-sh-uo-rated" />
                    <OutputRow label="Gas Side dP" value={fmt(results?.sh?.gas_dp)} unit="in WC" testId="output-sh-gas-dp" color="text-amber-400" />
                    <OutputRow label="Steam Side dP" value={fmt(results?.sh?.steam_dp)} unit="psi" testId="output-sh-steam-dp" color="text-amber-400" />
                    <SectionLabel text="SH 1B" color="text-cyan-400" />
                    <OutputRow label="SH 1B Duty" value={fmt(results?.sh?.sh1b_duty, 3)} unit="MMBTU/hr" testId="output-sh1b-duty" color="text-cyan-400" />
                    <OutputRow label="Total SH Duty" value={fmt(results?.sh?.total_sh_duty, 3)} unit="MMBTU/hr" testId="output-total-sh-duty" color="text-cyan-400" />
                    <OutputRow label="SH 1B Outlet Temp" value={fmt(results?.sh?.sh1b_out_temp, 1)} unit="°F" testId="output-sh1b-out-temp" color="text-cyan-400" />
                    <SectionLabel text="Control Valve" />
                    <OutputRow label="Valve Position" value={fmt(results?.sh?.valve_pos)} unit="%" testId="output-sh-valve-pos" />
                    <OutputRow label="PID Output" value={fmt(results?.sh?.pid_output, 4)} unit="mA" testId="output-sh-pid-out" />
                    <OutputRow label="Cv Required" value={fmt(results?.sh?.cv_required)} testId="output-sh-cv-req" color="text-sky-400" />
                    <OutputRow label="Valve dP" value={fmt(results?.sh?.valve_dp, 3)} unit="psi" testId="output-sh-valve-dp" color="text-amber-400" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">EC 4C Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <OutputRow label="Duty" value={fmt(results?.ec4c?.duty, 3)} unit="MMBTU/hr" testId="output-ec4c-duty" />
                    <OutputRow label="Gas Outlet Temp" value={fmt(results?.ec4c?.gas_out_temp, 1)} unit="°F" testId="output-ec4c-gas-out" color="text-amber-400" />
                    <OutputRow label="Steam Outlet Temp" value={fmt(results?.ec4c?.steam_out_temp, 1)} unit="°F" testId="output-ec4c-steam-out" color="text-purple-400" />
                    <OutputRow label="Steam Flow" value={fmtInt(results?.ec4c?.steam_flow)} unit="LB/HR" testId="output-ec4c-steam-flow" color="text-sky-400" />
                    <OutputRow label="LMTD" value={fmt(results?.ec4c?.lmtd, 1)} unit="°F" testId="output-ec4c-lmtd" />
                    <OutputRow label="UA" value={fmtInt(results?.ec4c?.UA)} unit="BTU/hr·°F" testId="output-ec4c-ua" />
                    <OutputRow label="U₀ (rated)" value={fmt(results?.ec4c?.uo_rated, 3)} unit="BTU/ft²·°F·hr" testId="output-ec4c-uo-rated" />
                    <OutputRow label="Gas Side dP" value={fmt(results?.ec4c?.gas_dp)} unit="in WC" testId="output-ec4c-gas-dp" color="text-amber-400" />
                    <OutputRow label="Steam Side dP" value={fmt(results?.ec4c?.steam_dp)} unit="psi" testId="output-ec4c-steam-dp" color="text-amber-400" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">EC 4A Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <OutputRow label="Duty" value={fmt(results?.ec4a?.duty, 3)} unit="MMBTU/hr" testId="output-ec4a-duty" />
                    <OutputRow label="Gas Outlet Temp" value={fmt(results?.ec4a?.gas_out_temp, 1)} unit="°F" testId="output-ec4a-gas-out" color="text-amber-400" />
                    <OutputRow label="Steam Outlet Temp" value={fmt(results?.ec4a?.steam_out_temp, 1)} unit="°F" testId="output-ec4a-steam-out" color="text-purple-400" />
                    <OutputRow label="Steam Flow" value={fmtInt(results?.ec4a?.steam_flow)} unit="LB/HR" testId="output-ec4a-steam-flow" color="text-sky-400" />
                    <OutputRow label="LMTD" value={fmt(results?.ec4a?.lmtd, 1)} unit="°F" testId="output-ec4a-lmtd" />
                    <OutputRow label="UA" value={fmtInt(results?.ec4a?.UA)} unit="BTU/hr·°F" testId="output-ec4a-ua" />
                    <OutputRow label="U₀ (rated)" value={fmt(results?.ec4a?.uo_rated, 3)} unit="BTU/ft²·°F·hr" testId="output-ec4a-uo-rated" />
                    <OutputRow label="Gas Side dP" value={fmt(results?.ec4a?.gas_dp)} unit="in WC" testId="output-ec4a-gas-dp" color="text-amber-400" />
                    <OutputRow label="Steam Side dP" value={fmt(results?.ec4a?.steam_dp)} unit="psi" testId="output-ec4a-steam-dp" color="text-amber-400" />
                    <SectionLabel text="Control Valve" />
                    <OutputRow label="Valve Position" value={fmt(results?.ec4a?.valve_pos)} unit="%" testId="output-ec4a-valve-pos" />
                    <OutputRow label="PID Output" value={fmt(results?.ec4a?.pid_output, 4)} unit="mA" testId="output-ec4a-pid-out" />
                    <OutputRow label="Cv Required" value={fmt(results?.ec4a?.cv_required)} testId="output-ec4a-cv-req" color="text-sky-400" />
                    <OutputRow label="Valve dP" value={fmt(results?.ec4a?.valve_dp, 3)} unit="psi" testId="output-ec4a-valve-dp" color="text-amber-400" />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Overall Heat & Material Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2">
                    <OutputRow label="Grand Total Duty" value={fmt(results?.summary?.total_duty, 3)} unit="MMBTU/hr" testId="output-total-duty" />
                    <OutputRow label="Total SH Duty" value={fmt(results?.summary?.total_sh_duty, 3)} unit="MMBTU/hr" testId="output-summary-sh-duty" color="text-cyan-400" />
                    <OutputRow label="Gas Inlet Temp" value={fmt(results?.summary?.gas_T_in, 1)} unit="°F" testId="output-gas-t-in" color="text-amber-400" />
                    <OutputRow label="Gas Outlet Temp" value={fmt(results?.summary?.gas_T_out, 1)} unit="°F" testId="output-gas-t-out" color="text-amber-400" />
                    <OutputRow label="SH1B Outlet Temp" value={fmt(results?.summary?.sh1b_out_temp, 1)} unit="°F" testId="output-summary-sh1b-temp" color="text-cyan-400" />
                    <OutputRow label="Gas Flow" value={fmtInt(results?.summary?.gas_flow)} unit="LB/HR" testId="output-gas-flow" color="text-sky-400" />
                    <OutputRow label="SH4A Steam Flow" value={fmtInt(results?.summary?.sh_stm_flow)} unit="LB/HR" testId="output-summary-sh-stm" color="text-purple-400" />
                    <OutputRow label="EC4C Steam Flow" value={fmtInt(results?.summary?.ec4c_stm_flow)} unit="LB/HR" testId="output-summary-ec4c-stm" color="text-purple-400" />
                    <OutputRow label="EC4A Steam Flow" value={fmtInt(results?.summary?.ec4a_stm_flow)} unit="LB/HR" testId="output-summary-ec4a-stm" color="text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="steam" className="mt-4 space-y-6">
              {!results?.streams && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Run a calculation to populate stream outputs.
                  </CardContent>
                </Card>
              )}
              {results?.streams && STREAM_GROUPS.map((group) => (
                <div key={group.title}>
                  <div className={`border-b ${group.borderColor} pb-1 mb-3`}>
                    <span className={`text-sm font-semibold ${group.color}`}>{group.title}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {group.streams.map(({ key, title, tag }) => (
                      <StreamCard
                        key={key}
                        stream={results.streams[key]}
                        title={title}
                        tag={tag}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="dynamic" className="mt-4 space-y-4">
              {!results?.dynamic && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p className="text-lg font-semibold text-cyan-400 mb-2">Dynamic Response — First-Order + Dead-Time Model</p>
                    <p>Set simulation mode to "Dynamic" and run calculation to populate charts.</p>
                  </CardContent>
                </Card>
              )}
              {results?.dynamic && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">SH1B Outlet Temperature Response</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={dynChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="t" tick={{ fontSize: 11 }} label={{ value: "Time (s)", position: "insideBottomRight", offset: -5 }} />
                            <YAxis tick={{ fontSize: 11 }} domain={["dataMin - 5", "dataMax + 5"]} label={{ value: "Temp (°F)", angle: -90, position: "insideLeft" }} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                            <Legend />
                            <ReferenceLine y={results.dynamic.sh_setpt[0]} stroke="#e8a838" strokeDasharray="5 5" label={{ value: `SP=${results.dynamic.sh_setpt[0]}°F`, fill: "#e8a838", fontSize: 11 }} />
                            <Line type="monotone" dataKey="sh1b_temp" stroke="#3a7bd5" strokeWidth={2} dot={false} name="SH1B Outlet Temp" />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">EC4A Process Gas Outlet Temperature Response</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={dynChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="t" tick={{ fontSize: 11 }} label={{ value: "Time (s)", position: "insideBottomRight", offset: -5 }} />
                            <YAxis tick={{ fontSize: 11 }} domain={["dataMin - 5", "dataMax + 5"]} label={{ value: "Temp (°F)", angle: -90, position: "insideLeft" }} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                            <Legend />
                            <ReferenceLine y={results.dynamic.ec4a_setpt[0]} stroke="#e8a838" strokeDasharray="5 5" label={{ value: `SP=${results.dynamic.ec4a_setpt[0]}°F`, fill: "#e8a838", fontSize: 11 }} />
                            <Line type="monotone" dataKey="ec4a_temp" stroke="#4caf7d" strokeWidth={2} dot={false} name="EC4A Gas Outlet Temp" />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Valve Position Response</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={dynChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="t" tick={{ fontSize: 11 }} label={{ value: "Time (s)", position: "insideBottomRight", offset: -5 }} />
                          <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} label={{ value: "Position (%)", angle: -90, position: "insideLeft" }} />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                          <Legend />
                          <Line type="monotone" dataKey="sh_valve" stroke="#3a7bd5" strokeWidth={2} dot={false} name="SH4A CV" />
                          <Line type="monotone" dataKey="ec4a_valve" stroke="#4caf7d" strokeWidth={2} dot={false} name="EC4A CV" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>

          <Card>
            <CardContent className="p-4">
              <img
                src={controlLoopDiagram}
                alt="Control Loop - Economizer 4A FAT Inlet Temperature"
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
