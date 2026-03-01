import { useState } from "react";
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
  valve_pos?: number;
  pid_output?: number;
  cv_required?: number;
  valve_dp?: number;
  pump_head?: number;
}

interface CalcResults {
  sh: HxResult;
  ec4c: HxResult;
  ec4a: HxResult;
}

const DEFAULTS = {
  sh_ht_area: 18000, sh_uo: 15.0, sh_pipe_dia: 12.0, sh_gas_in_duct: 6.5,
  sh_steam_dp0: 15.0, sh_dp_factor: 1.7, sh_cv_type: "Equal Percentage",
  sh_cv_max: 1000.0, sh_cv_range: 85, sh_cv_setpt: 750,
  ec4c_ht_area: 13000, ec4c_uo: 15.0, ec4c_gas_out_duct: 6.0,
  ec4c_steam_dp0: 15.0, ec4c_dp_factor: 1.7, ec4c_proc_dp0: 11.0, ec4c_proc_dpf: 1.7,
  ec4a_ht_area: 15000, ec4a_uo: 15.0, ec4a_pipe_dia: 8.0,
  ec4a_steam_dp0: 15.0, ec4a_dp_factor: 1.7, ec4a_cv_type: "Equal Percentage",
  ec4a_cv_max: 548.0, ec4a_cv_range: 85, ec4a_cv_setpt: 401,
  gas_SO2: 18, gas_SO3: 462, gas_O2: 4069, gas_N2: 86808, gas_H2O: 0, gas_H2SO4: 0,
  gas_pressure: 47, gas_temp: 808,
  sh_steam_flow: 269418, sh_steam_press: 915, sh_steam_temp: 536,
  ec4c_steam_flow: 264418, ec4c_steam_press: 951, ec4c_steam_temp: 401,
  ec4a_steam_flow: 264418, ec4a_steam_press: 978, ec4a_steam_temp: 223,
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

function OutputRow({ label, value, unit, testId }: {
  label: string; value: string; unit?: string; testId: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground w-48 shrink-0">{label}</span>
      <span className="font-mono text-sm text-emerald-400 w-28 shrink-0" data-testid={testId}>{value}</span>
      {unit && <span className="text-xs text-muted-foreground shrink-0">{unit}</span>}
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="pt-2 pb-1">
      <span className="text-sm font-semibold text-amber-400">{text}</span>
    </div>
  );
}

function fmt(v: number | undefined, decimals = 2): string {
  if (v === undefined || v === null) return "---";
  return v.toFixed(decimals);
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
      if (k === "sh_cv_type" || k === "ec4a_cv_type") {
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
      setActiveTab("outputs");
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

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList data-testid="tabs-main">
              <TabsTrigger value="params" data-testid="tab-params">Equipment Parameters</TabsTrigger>
              <TabsTrigger value="inputs" data-testid="tab-inputs">Stream Inputs</TabsTrigger>
              <TabsTrigger value="outputs" data-testid="tab-outputs">Results / Outputs</TabsTrigger>
            </TabsList>

            <TabsContent value="params" className="mt-4">
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
                    <InputRow label="TG Outlet Temp Setpoint" value={inputs.sh_cv_setpt} onChange={set("sh_cv_setpt")} unit="°F" testId="input-sh-cv-setpt" />
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
                    <InputRow label="Gas Outlet Temp Setpoint" value={inputs.ec4a_cv_setpt} onChange={set("ec4a_cv_setpt")} unit="°F" testId="input-ec4a-cv-setpt" />
                  </CardContent>
                </Card>
              </div>
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

            <TabsContent value="outputs" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">SH 4A Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <OutputRow label="Duty" value={fmt(results?.sh?.duty)} unit="MMBTU/hr" testId="output-sh-duty" />
                    <OutputRow label="Gas Outlet Temp" value={fmt(results?.sh?.gas_out_temp)} unit="°F" testId="output-sh-gas-out" />
                    <OutputRow label="Steam Outlet Temp" value={fmt(results?.sh?.steam_out_temp)} unit="°F" testId="output-sh-steam-out" />
                    <OutputRow label="LMTD" value={fmt(results?.sh?.lmtd)} unit="°F" testId="output-sh-lmtd" />
                    <OutputRow label="UA" value={fmt(results?.sh?.UA, 0)} unit="BTU/hr·°F" testId="output-sh-ua" />
                    <OutputRow label="U₀ (rated)" value={fmt(results?.sh?.uo_rated)} unit="BTU/ft²·°F·hr" testId="output-sh-uo-rated" />
                    <OutputRow label="Gas Side dP" value={fmt(results?.sh?.gas_dp)} unit="in WC" testId="output-sh-gas-dp" />
                    <OutputRow label="Steam Side dP" value={fmt(results?.sh?.steam_dp)} unit="psi" testId="output-sh-steam-dp" />
                    <OutputRow label="Valve Position" value={fmt(results?.sh?.valve_pos)} unit="%" testId="output-sh-valve-pos" />
                    <OutputRow label="PID Output" value={fmt(results?.sh?.pid_output, 4)} unit="mA" testId="output-sh-pid-out" />
                    <OutputRow label="Cv Required" value={fmt(results?.sh?.cv_required)} testId="output-sh-cv-req" />
                    <OutputRow label="Valve dP" value={fmt(results?.sh?.valve_dp)} unit="psi" testId="output-sh-valve-dp" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">EC 4C Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <OutputRow label="Duty" value={fmt(results?.ec4c?.duty)} unit="MMBTU/hr" testId="output-ec4c-duty" />
                    <OutputRow label="Gas Outlet Temp" value={fmt(results?.ec4c?.gas_out_temp)} unit="°F" testId="output-ec4c-gas-out" />
                    <OutputRow label="Steam Outlet Temp" value={fmt(results?.ec4c?.steam_out_temp)} unit="°F" testId="output-ec4c-steam-out" />
                    <OutputRow label="LMTD" value={fmt(results?.ec4c?.lmtd)} unit="°F" testId="output-ec4c-lmtd" />
                    <OutputRow label="UA" value={fmt(results?.ec4c?.UA, 0)} unit="BTU/hr·°F" testId="output-ec4c-ua" />
                    <OutputRow label="U₀ (rated)" value={fmt(results?.ec4c?.uo_rated)} unit="BTU/ft²·°F·hr" testId="output-ec4c-uo-rated" />
                    <OutputRow label="Gas Side dP" value={fmt(results?.ec4c?.gas_dp)} unit="in WC" testId="output-ec4c-gas-dp" />
                    <OutputRow label="Steam Side dP" value={fmt(results?.ec4c?.steam_dp)} unit="psi" testId="output-ec4c-steam-dp" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">EC 4A Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <OutputRow label="Duty" value={fmt(results?.ec4a?.duty)} unit="MMBTU/hr" testId="output-ec4a-duty" />
                    <OutputRow label="Gas Outlet Temp" value={fmt(results?.ec4a?.gas_out_temp)} unit="°F" testId="output-ec4a-gas-out" />
                    <OutputRow label="Steam Outlet Temp" value={fmt(results?.ec4a?.steam_out_temp)} unit="°F" testId="output-ec4a-steam-out" />
                    <OutputRow label="LMTD" value={fmt(results?.ec4a?.lmtd)} unit="°F" testId="output-ec4a-lmtd" />
                    <OutputRow label="UA" value={fmt(results?.ec4a?.UA, 0)} unit="BTU/hr·°F" testId="output-ec4a-ua" />
                    <OutputRow label="U₀ (rated)" value={fmt(results?.ec4a?.uo_rated)} unit="BTU/ft²·°F·hr" testId="output-ec4a-uo-rated" />
                    <OutputRow label="Gas Side dP" value={fmt(results?.ec4a?.gas_dp)} unit="in WC" testId="output-ec4a-gas-dp" />
                    <OutputRow label="Steam Side dP" value={fmt(results?.ec4a?.steam_dp)} unit="psi" testId="output-ec4a-steam-dp" />
                    <OutputRow label="Valve Position" value={fmt(results?.ec4a?.valve_pos)} unit="%" testId="output-ec4a-valve-pos" />
                    <OutputRow label="PID Output" value={fmt(results?.ec4a?.pid_output, 4)} unit="mA" testId="output-ec4a-pid-out" />
                    <OutputRow label="Cv Required" value={fmt(results?.ec4a?.cv_required)} testId="output-ec4a-cv-req" />
                    <OutputRow label="Valve dP" value={fmt(results?.ec4a?.valve_dp)} unit="psi" testId="output-ec4a-valve-dp" />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Hydraulic Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <OutputRow label="SH4A Pump Head" value={fmt(results?.sh?.pump_head)} unit="ft" testId="output-sh-pump-head" />
                  <OutputRow label="EC4A Pump Head" value={fmt(results?.ec4a?.pump_head)} unit="ft" testId="output-ec4a-pump-head" />
                </CardContent>
              </Card>
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
