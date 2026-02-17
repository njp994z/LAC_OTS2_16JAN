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
import cipControlLoop from "@assets/image_1771290235296.png";
import hipControlLoop from "@assets/image_1771290254647.png";

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

interface InletRow {
  parameter: string;
  units: string;
  stream12: string;
  stream14: string;
  stream17A: string;
}

interface HipRow {
  parameter: string;
  units: string;
  s12: string;
  s13: string;
  s18A: string;
  s18B: string;
  s18C: string;
  s18D: string;
  s18E: string;
  s19: string;
}

interface CipRow {
  parameter: string;
  units: string;
  s14: string;
  s15: string;
  s17A: string;
  s17B: string;
  s17C: string;
  s17D: string;
  s17E: string;
  s18: string;
}

interface ExtraRow {
  label: string;
  units: string;
  value: string;
}

interface StaticResult {
  success: boolean;
  hip_table: HipRow[];
  cip_table: CipRow[];
  extras: ExtraRow[];
}

interface DynamicResult {
  success: boolean;
  time_s: number;
  mA: number;
  T_out_cip: number;
  T_out_hip: number;
  hip_table: HipRow[];
  cip_table: CipRow[];
  extras: ExtraRow[];
}

const DEFAULT_INLET_DATA: InletRow[] = [
  { parameter: "SO2", units: "scfm", stream12: "1,335", stream14: "480", stream17A: "480" },
  { parameter: "SO3", units: "scfm", stream12: "11,293", stream14: "12,148", stream17A: "0" },
  { parameter: "O2", units: "scfm", stream12: "4,728", stream14: "4,300", stream17A: "4,300" },
  { parameter: "N2", units: "scfm", stream12: "86,808", stream14: "86,808", stream17A: "86,808" },
  { parameter: "H2O", units: "scfm", stream12: "0", stream14: "0", stream17A: "0" },
  { parameter: "H2SO4", units: "scfm", stream12: "0", stream14: "0", stream17A: "0" },
  { parameter: "TOTAL", units: "scfm", stream12: "104,164", stream14: "103,736", stream17A: "91,588" },
  { parameter: "PRESSURE", units: "in. wc.", stream12: "119", stream14: "113", stream17A: "113" },
  { parameter: "TEMPERATURE", units: "\u00b0F", stream12: "965", stream14: "847", stream17A: "180" },
];

const DEFAULT_EXTRAS: ExtraRow[] = [
  { label: 'HIP 48" Valve Position', units: "% open", value: "---" },
  { label: 'CIP 36" Valve Position', units: "% open", value: "---" },
  { label: 'CIP 78" Valve Position', units: "% open", value: "---" },
  { label: "HIP HX / Bypass ratio", units: "fraction", value: "---" },
  { label: "CIP HX / Bypass ratio", units: "fraction", value: "---" },
  { label: "HIP HX Duty", units: "MMBTU/hr", value: "---" },
  { label: "CIP HX Duty", units: "MMBTU/hr", value: "---" },
];

const HIP_COLS = ["#12", "#13", "#18A", "#18B", "#18C", "#18D", "#18E", "#19"] as const;
const HIP_KEYS: (keyof HipRow)[] = ["s12", "s13", "s18A", "s18B", "s18C", "s18D", "s18E", "s19"];

const CIP_COLS = ["#14", "#15", "#17A", "#17B", "#17C", "#17D", "#17E", "#18"] as const;
const CIP_KEYS: (keyof CipRow)[] = ["s14", "s15", "s17A", "s17B", "s17C", "s17D", "s17E", "s18"];

function EditableCell({ value, onChange, testId }: {
  value: string; onChange: (v: string) => void; testId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => { onChange(editValue); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") { onChange(editValue); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
        className="text-xs font-mono w-20 text-right"
        data-testid={testId}
      />
    );
  }

  return (
    <span
      className="cursor-pointer hover:text-primary transition-colors"
      onDoubleClick={() => { setEditValue(value); setEditing(true); }}
      data-testid={testId}
    >
      {value}
    </span>
  );
}

export default function GasGasHeatExchanger() {
  const [mode, setMode] = useState<"Static" | "Dynamic">("Static");
  const { toast } = useToast();

  const [inletData, setInletData] = useState<InletRow[]>(DEFAULT_INLET_DATA);
  const [pass3Target, setPass3Target] = useState("806");
  const [pass4Target, setPass4Target] = useState("779");
  const [controllerMA, setControllerMA] = useState("12.0");

  const [hipTable, setHipTable] = useState<HipRow[]>([]);
  const [cipTable, setCipTable] = useState<CipRow[]>([]);
  const [extras, setExtras] = useState<ExtraRow[]>(DEFAULT_EXTRAS);
  const [dynamicInfo, setDynamicInfo] = useState<{ time_s: number; mA: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dynamicStateRef = useRef({ time_s: 0, T_out_hip: 806.0, T_out_cip: 779.0 });

  const safeFloat = (val: string, fallback: number) => {
    const n = parseFloat(val.replace(/,/g, ''));
    return isNaN(n) ? fallback : n;
  };

  const getInletValue = useCallback((param: string, col: 'stream12' | 'stream14' | 'stream17A') => {
    const row = inletData.find(r => r.parameter === param);
    return row ? row[col] : "";
  }, [inletData]);

  const updateInletCell = useCallback((rowIdx: number, col: 'stream12' | 'stream14' | 'stream17A', value: string) => {
    setInletData(prev => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], [col]: value };
      return next;
    });
  }, []);

  const hipHotInlet = useMemo(() => getInletValue("TEMPERATURE", "stream12"), [getInletValue]);
  const cipHotInlet = useMemo(() => getInletValue("TEMPERATURE", "stream14"), [getInletValue]);
  const cipColdFeed = useMemo(() => getInletValue("TEMPERATURE", "stream17A"), [getInletValue]);

  const validateInputs = useCallback((...values: string[]) => {
    for (const v of values) {
      if (v.trim() === '' || isNaN(parseFloat(v.replace(/,/g, '')))) {
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
          inlet_streams: inletData,
        }),
      });
      if (!resp.ok) {
        toast({ title: "Calculation Error", description: "Server error during static calculation.", variant: "destructive" });
        return;
      }
      const data: StaticResult = await resp.json();
      if (data.success) {
        setHipTable(data.hip_table);
        setCipTable(data.cip_table);
        setExtras(data.extras);
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
          inlet_streams: inletData,
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
        setHipTable(data.hip_table);
        setCipTable(data.cip_table);
        setExtras(data.extras);
        setDynamicInfo({ time_s: data.time_s, mA: data.mA });
      }
    } catch (err) {
      setRunning(false);
      toast({ title: "Connection Error", description: "Lost connection to simulation backend.", variant: "destructive" });
    }
  }, [controllerMA, hipHotInlet, cipHotInlet, cipColdFeed, inletData, toast]);

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
    setInletData(DEFAULT_INLET_DATA);
    setPass3Target("806");
    setPass4Target("779");
    setControllerMA("12.0");
    setHipTable([]);
    setCipTable([]);
    setExtras(DEFAULT_EXTRAS);
    setDynamicInfo(null);
    setRunning(false);
    dynamicStateRef.current = { time_s: 0, T_out_hip: 806.0, T_out_cip: 779.0 };
  }, []);

  return (
    <div className="min-h-screen bg-background" data-testid="page-gas-gas-heat-exchanger">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4 flex-wrap">
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
        <div className="max-w-[1400px] mx-auto space-y-4">

          <div className="flex gap-4 flex-wrap">
            <Card className="flex-1 min-w-[200px]">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Simulation Mode</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <RadioGroup
                  value={mode}
                  onValueChange={(v) => {
                    setMode(v as "Static" | "Dynamic");
                    setRunning(false);
                    setHipTable([]);
                    setCipTable([]);
                    setExtras(DEFAULT_EXTRAS);
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

            {mode === "Static" && (
              <Card className="flex-1 min-w-[300px]">
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
              <Card className="flex-1 min-w-[300px]">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Dynamic Control (mA)</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <InputField label="TIC-5224 Controller Output (mA)" value={controllerMA} onChange={setControllerMA} unit="mA" testId="input-controller-ma" />
                  {dynamicInfo && (
                    <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                      <span>Time: <span className="font-mono font-semibold text-foreground" data-testid="value-dyn-time">{dynamicInfo.time_s.toFixed(1)} s</span></span>
                      <span>Controller: <span className="font-mono font-semibold text-foreground" data-testid="value-dyn-ma">{dynamicInfo.mA.toFixed(2)} mA</span></span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Editable Inlet Streams <span className="text-xs text-muted-foreground font-normal ml-2">(double-click any cell to edit)</span></CardTitle>
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
                    {inletData.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0" data-testid={`row-inlet-${i}`}>
                        <td className="py-1.5 px-3 font-mono text-xs font-semibold">{row.parameter}</td>
                        <td className="py-1.5 px-3 text-xs text-muted-foreground">{row.units}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-xs">
                          <EditableCell value={row.stream12} onChange={(v) => updateInletCell(i, 'stream12', v)} testId={`cell-inlet-${i}-s12`} />
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-xs">
                          <EditableCell value={row.stream14} onChange={(v) => updateInletCell(i, 'stream14', v)} testId={`cell-inlet-${i}-s14`} />
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-xs">
                          <EditableCell value={row.stream17A} onChange={(v) => updateInletCell(i, 'stream17A', v)} testId={`cell-inlet-${i}-s17a`} />
                        </td>
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
            <CardContent className="px-4 pb-4 space-y-6">
              <div>
                <p className="text-xs font-semibold text-primary mb-2">HIP Streams</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-hip-streams">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Parameter</th>
                        <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Units</th>
                        {HIP_COLS.map(col => (
                          <th key={col} className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hipTable.length > 0 ? hipTable.map((row, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0" data-testid={`row-hip-${i}`}>
                          <td className="py-1.5 px-2 font-mono text-xs font-semibold">{row.parameter}</td>
                          <td className="py-1.5 px-2 text-xs text-muted-foreground">{row.units}</td>
                          {HIP_KEYS.map(k => (
                            <td key={k} className="py-1.5 px-2 text-right font-mono text-xs">{row[k]}</td>
                          ))}
                        </tr>
                      )) : (
                        <tr data-testid="row-hip-placeholder">
                          <td className="py-1.5 px-2 font-mono text-xs font-semibold">TEMPERATURE</td>
                          <td className="py-1.5 px-2 text-xs text-muted-foreground">{"\u00b0F"}</td>
                          {HIP_COLS.map(col => (
                            <td key={col} className="py-1.5 px-2 text-right font-mono text-xs text-muted-foreground">---</td>
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-primary mb-2">CIP Streams</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-cip-streams">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Parameter</th>
                        <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Units</th>
                        {CIP_COLS.map(col => (
                          <th key={col} className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cipTable.length > 0 ? cipTable.map((row, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0" data-testid={`row-cip-${i}`}>
                          <td className="py-1.5 px-2 font-mono text-xs font-semibold">{row.parameter}</td>
                          <td className="py-1.5 px-2 text-xs text-muted-foreground">{row.units}</td>
                          {CIP_KEYS.map(k => (
                            <td key={k} className="py-1.5 px-2 text-right font-mono text-xs">{row[k]}</td>
                          ))}
                        </tr>
                      )) : (
                        <tr data-testid="row-cip-placeholder">
                          <td className="py-1.5 px-2 font-mono text-xs font-semibold">TEMPERATURE</td>
                          <td className="py-1.5 px-2 text-xs text-muted-foreground">{"\u00b0F"}</td>
                          {CIP_COLS.map(col => (
                            <td key={col} className="py-1.5 px-2 text-right font-mono text-xs text-muted-foreground">---</td>
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <div className="space-y-1">
                  {extras.map((row, i) => (
                    <div key={i} className="flex items-center gap-4 py-1.5 border-b border-border/30 last:border-0" data-testid={`row-extra-${i}`}>
                      <span className="text-xs font-mono font-semibold min-w-[220px]">{row.label}</span>
                      <span className="text-xs text-muted-foreground min-w-[80px]">{row.units}</span>
                      <span className="text-sm font-mono font-semibold" data-testid={`value-extra-${i}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Control Loop — Hot Interpass HX</h3>
              <img
                src={hipControlLoop}
                alt="Control Loop Hot Interpass HX"
                className="w-full rounded-md"
                data-testid="img-hip-control-loop"
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Control Loop — Cold Interpass HX</h3>
              <img
                src={cipControlLoop}
                alt="Control Loop Cold Interpass HX"
                className="w-full rounded-md"
                data-testid="img-cip-control-loop"
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
