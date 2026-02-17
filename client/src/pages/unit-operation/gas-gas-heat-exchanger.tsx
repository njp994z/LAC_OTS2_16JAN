import { Link } from "wouter";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Gauge, Calculator, Play, Pause, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import expLogo from "@/assets/exp-logo.png";

function InputField({ label, value, onChange, unit, testId }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string; testId: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground whitespace-nowrap min-w-[220px] text-right">{label}</Label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm font-mono w-24"
        data-testid={testId}
      />
      {unit && <span className="text-xs text-muted-foreground whitespace-nowrap">{unit}</span>}
    </div>
  );
}

interface OutputTableRow {
  stream: string;
  parameter: string;
  units: string;
  value: string;
}

interface ValveResults {
  hip_48_position: number;
  hip_48_cv_req: number;
  cip_36_position: number;
  cip_78_position: number;
  cip_cv_req: number;
  hip_bypass_flow: number;
  cip_bypass_flow: number;
}

interface StaticResult {
  success: boolean;
  inlet_table: { parameter: string; units: string; stream12: string; stream14: string; stream17A: string }[];
  output_table: OutputTableRow[];
  valve_results: ValveResults;
}

interface DynamicResult {
  success: boolean;
  time_s: number;
  mA: number;
  CIP_36_position: number;
  CIP_78_position: number;
  HIP_48_position: number;
  CIP_bypass_flow: number;
  HIP_bypass_flow: number;
  T_out_cip: number;
  T_out_hip: number;
  output_table: OutputTableRow[];
}

const DEFAULT_INLET_TABLE = [
  { parameter: "SO2", units: "scfm", stream12: "1,335", stream14: "480", stream17A: "480" },
  { parameter: "SO3", units: "scfm", stream12: "11,293", stream14: "12,148", stream17A: "0" },
  { parameter: "O2", units: "scfm", stream12: "4,728", stream14: "4,300", stream17A: "4,300" },
  { parameter: "N2", units: "scfm", stream12: "86,808", stream14: "86,808", stream17A: "86,808" },
  { parameter: "H2O", units: "scfm", stream12: "0", stream14: "0", stream17A: "0" },
  { parameter: "H2SO4", units: "scfm", stream12: "0", stream14: "0", stream17A: "0" },
  { parameter: "TOTAL", units: "scfm", stream12: "104,164", stream14: "103,736", stream17A: "91,588" },
  { parameter: "PRESSURE", units: "in. wc.", stream12: "119", stream14: "113", stream17A: "113" },
];

const DEFAULT_OUTPUT_ROWS: OutputTableRow[] = [
  { stream: "#13 HIP Hot Outlet", parameter: "TEMPERATURE", units: "\u00b0F", value: "---" },
  { stream: "#18A HIP Cold Feed", parameter: "TEMPERATURE", units: "\u00b0F", value: "---" },
  { stream: "#18B HIP Cold Inlet", parameter: "TEMPERATURE", units: "\u00b0F", value: "---" },
  { stream: "#18C HIP BYP", parameter: "TOTAL FLOW", units: "scfm", value: "---" },
  { stream: "#18D HIP BYP Mix", parameter: "TEMPERATURE", units: "\u00b0F", value: "---" },
  { stream: "#18E HIP Cold Outlet", parameter: "TEMPERATURE", units: "\u00b0F", value: "---" },
  { stream: "#19 HIP Cold Mixed", parameter: "TEMPERATURE", units: "\u00b0F", value: "---" },
  { stream: "#15 CIP Hot Outlet", parameter: "TEMPERATURE", units: "\u00b0F", value: "---" },
  { stream: "#17B CIP Cold Inlet", parameter: "TEMPERATURE", units: "\u00b0F", value: "---" },
  { stream: "#17C CIP BYP V_in", parameter: "TOTAL FLOW", units: "scfm", value: "---" },
  { stream: "#17D CIP BYP V_out", parameter: "TOTAL FLOW", units: "scfm", value: "---" },
  { stream: "#17E CIP Cold Outlet", parameter: "TEMPERATURE", units: "\u00b0F", value: "---" },
  { stream: "#18 CIP Cold Out", parameter: "TEMPERATURE", units: "\u00b0F", value: "---" },
  { stream: 'HIP 48" Valve Position', parameter: "% open", units: "", value: "---" },
  { stream: 'CIP 36" Valve Position', parameter: "% open", units: "", value: "---" },
  { stream: 'CIP 78" Valve Position', parameter: "% open", units: "", value: "---" },
  { stream: "HIP HX / Bypass ratio", parameter: "fraction", units: "", value: "---" },
  { stream: "CIP HX / Bypass ratio", parameter: "fraction", units: "", value: "---" },
];

export default function GasGasHeatExchanger() {
  const [mode, setMode] = useState<"Static" | "Dynamic">("Static");
  const { toast } = useToast();

  const [hipHotInlet, setHipHotInlet] = useState("965");
  const [cipHotInlet, setCipHotInlet] = useState("847");
  const [cipColdFeed, setCipColdFeed] = useState("180");

  const [pass3Target, setPass3Target] = useState("806");
  const [pass4Target, setPass4Target] = useState("779");
  const [controllerMA, setControllerMA] = useState("12.0");

  const [outputTable, setOutputTable] = useState<OutputTableRow[]>(DEFAULT_OUTPUT_ROWS);
  const [dynamicInfo, setDynamicInfo] = useState<{ time_s: number; mA: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dynamicStateRef = useRef({ time_s: 0, T_out_hip: 806.0, T_out_cip: 779.0 });

  const safeFloat = (val: string, fallback: number) => {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  const inletTableWithTemps = useMemo(() => {
    const tempRow = {
      parameter: "TEMPERATURE",
      units: "\u00b0F",
      stream12: hipHotInlet || "965",
      stream14: cipHotInlet || "847",
      stream17A: cipColdFeed || "180",
    };
    return [...DEFAULT_INLET_TABLE, tempRow];
  }, [hipHotInlet, cipHotInlet, cipColdFeed]);

  const validateInputs = useCallback((...values: string[]) => {
    for (const v of values) {
      if (v.trim() === '' || isNaN(parseFloat(v))) {
        toast({ title: "Invalid Input", description: "Please enter valid numeric values for all fields.", variant: "destructive" });
        return false;
      }
    }
    return true;
  }, [toast]);

  const runStatic = useCallback(async () => {
    if (!validateInputs(hipHotInlet, cipHotInlet, cipColdFeed, pass3Target, pass4Target)) return;
    setLoading(true);
    setDynamicInfo(null);
    try {
      const resp = await fetch('/api/interpass-hx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'static',
          hip_hot_inlet: safeFloat(hipHotInlet, 965),
          cip_hot_inlet: safeFloat(cipHotInlet, 847),
          cip_cold_feed: safeFloat(cipColdFeed, 180),
          target_pass3: safeFloat(pass3Target, 806),
          target_pass4: safeFloat(pass4Target, 779),
        }),
      });
      if (!resp.ok) {
        toast({ title: "Calculation Error", description: "Server error during static calculation.", variant: "destructive" });
        return;
      }
      const data: StaticResult = await resp.json();
      if (data.success) {
        setOutputTable(data.output_table);
      } else {
        toast({ title: "Calculation Error", description: "Static calculation failed.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to connect to backend.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [hipHotInlet, cipHotInlet, cipColdFeed, pass3Target, pass4Target, toast, validateInputs]);

  const runDynamicStep = useCallback(async () => {
    try {
      const state = dynamicStateRef.current;
      const resp = await fetch('/api/interpass-hx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'dynamic',
          mA: safeFloat(controllerMA, 12.0),
          hip_hot_inlet: safeFloat(hipHotInlet, 965),
          cip_hot_inlet: safeFloat(cipHotInlet, 847),
          cip_cold_feed: safeFloat(cipColdFeed, 180),
          time_s: state.time_s,
          T_out_hip: state.T_out_hip,
          T_out_cip: state.T_out_cip,
        }),
      });
      if (!resp.ok) {
        setRunning(false);
        toast({ title: "Dynamic Error", description: "Server error during dynamic step.", variant: "destructive" });
        return;
      }
      const data: DynamicResult = await resp.json();
      if (data.success) {
        dynamicStateRef.current = {
          time_s: data.time_s,
          T_out_hip: data.T_out_hip,
          T_out_cip: data.T_out_cip,
        };
        setOutputTable(data.output_table);
        setDynamicInfo({
          time_s: data.time_s,
          mA: data.mA,
        });
      }
    } catch (err) {
      setRunning(false);
      toast({ title: "Connection Error", description: "Lost connection to simulation backend.", variant: "destructive" });
    }
  }, [controllerMA, hipHotInlet, cipHotInlet, cipColdFeed, toast]);

  const startDynamic = useCallback(() => {
    setRunning(true);
    dynamicStateRef.current = { time_s: 0, T_out_hip: 806.0, T_out_cip: 779.0 };
  }, []);

  const pauseDynamic = useCallback(() => {
    setRunning(false);
  }, []);

  useEffect(() => {
    if (running) {
      runDynamicStep();
      intervalRef.current = setInterval(runDynamicStep, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, runDynamicStep]);

  const handleReset = useCallback(() => {
    setHipHotInlet("965");
    setCipHotInlet("847");
    setCipColdFeed("180");
    setPass3Target("806");
    setPass4Target("779");
    setControllerMA("12.0");
    setOutputTable(DEFAULT_OUTPUT_ROWS);
    setDynamicInfo(null);
    setRunning(false);
    dynamicStateRef.current = { time_s: 0, T_out_hip: 806.0, T_out_cip: 779.0 };
  }, []);

  return (
    <div className="min-h-screen bg-background" data-testid="page-gas-gas-heat-exchanger">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/unit-operation-simulator">
              <Button variant="ghost" size="icon" data-testid="button-back"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-lg font-bold leading-tight" data-testid="text-page-title">Sulfur Interpass HX Valve & Stream Simulator</h1>
                <p className="text-xs text-muted-foreground">Three valves - Split-range - Full stream tables</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} data-testid="button-reset">
              <RotateCcw className="mr-2 h-4 w-4" />Reset
            </Button>
            {mode === "Static" ? (
              <Button onClick={runStatic} disabled={loading} data-testid="button-calculate">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                Calculate Static
              </Button>
            ) : (
              running ? (
                <Button variant="destructive" onClick={pauseDynamic} data-testid="button-pause">
                  <Pause className="mr-2 h-4 w-4" />Pause
                </Button>
              ) : (
                <Button onClick={startDynamic} data-testid="button-start-dynamic">
                  <Play className="mr-2 h-4 w-4" />Start Dynamic
                </Button>
              )
            )}
          </div>
        </div>
      </header>

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto space-y-4">

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Simulation Mode</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <RadioGroup
                value={mode}
                onValueChange={(v) => {
                  setMode(v as "Static" | "Dynamic");
                  setRunning(false);
                  setOutputTable(DEFAULT_OUTPUT_ROWS);
                  setDynamicInfo(null);
                }}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="Static" id="mode-static" data-testid="radio-mode-static" />
                  <Label htmlFor="mode-static" className="text-sm">Static Calculation</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="Dynamic" id="mode-dynamic" data-testid="radio-mode-dynamic" />
                  <Label htmlFor="mode-dynamic" className="text-sm">Dynamic Simulation</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Editable Inlet Streams</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <InputField label="Stream #12 HIP Hot Inlet Temp" value={hipHotInlet} onChange={setHipHotInlet} unit={"\u00b0F"} testId="input-hip-hot-inlet" />
              <InputField label="Stream #14 CIP Hot Inlet Temp" value={cipHotInlet} onChange={setCipHotInlet} unit={"\u00b0F"} testId="input-cip-hot-inlet" />
              <InputField label="Stream #17A CIP Cold Feed Temp" value={cipColdFeed} onChange={setCipColdFeed} unit={"\u00b0F"} testId="input-cip-cold-feed" />
            </CardContent>
          </Card>

          {mode === "Static" && (
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Target Temperatures (Static Mode)</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <InputField label="Target Pass 3 Outlet Temp" value={pass3Target} onChange={setPass3Target} unit={"\u00b0F"} testId="input-pass3-target" />
                <InputField label="Target Pass 4 Outlet Temp" value={pass4Target} onChange={setPass4Target} unit={"\u00b0F"} testId="input-pass4-target" />
              </CardContent>
            </Card>
          )}

          {mode === "Dynamic" && (
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Dynamic Control (mA)</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <InputField label="TIC-5224 Controller Output (mA)" value={controllerMA} onChange={setControllerMA} unit="mA" testId="input-controller-ma" />
                {dynamicInfo && (
                  <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                    <span>Time: <span className="font-mono font-semibold text-foreground" data-testid="value-dyn-time">{dynamicInfo.time_s.toFixed(1)} s</span></span>
                    <span>Controller: <span className="font-mono font-semibold text-foreground" data-testid="value-dyn-ma">{dynamicInfo.mA.toFixed(2)} mA</span></span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Stream Summary - Inlet Streams</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-inlet-streams">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Parameter</th>
                      <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Units</th>
                      <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Stream #12<br/>HIP Hot Inlet</th>
                      <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Stream #14<br/>CIP Hot Inlet</th>
                      <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Stream #17A<br/>CIP Cold Feed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inletTableWithTemps.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0" data-testid={`row-inlet-${i}`}>
                        <td className="py-1.5 px-3 font-mono text-xs font-semibold">{row.parameter}</td>
                        <td className="py-1.5 px-3 text-xs text-muted-foreground">{row.units}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-xs">{row.stream12}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-xs">{row.stream14}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-xs">{row.stream17A}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Calculated Output Streams</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-output-streams">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Stream</th>
                      <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Parameter</th>
                      <th className="text-center py-2 px-3 text-xs text-muted-foreground font-medium">Units</th>
                      <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outputTable.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0" data-testid={`row-output-${i}`}>
                        <td className="py-1.5 px-3 font-mono text-xs font-semibold">{row.stream}</td>
                        <td className="py-1.5 px-3 text-xs text-muted-foreground">{row.parameter}</td>
                        <td className="py-1.5 px-3 text-center text-xs text-muted-foreground">{row.units}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-xs font-semibold">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
