import { Link } from "wouter";
import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Gauge, Calculator, Play, Pause, RotateCcw } from "lucide-react";
import expLogo from "@/assets/exp-logo.png";

function InputField({ label, value, onChange, unit, testId }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string; testId: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground whitespace-nowrap min-w-[180px] text-right">{label}</Label>
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

function ParamField({ label, value, onChange, testId }: {
  label: string; value: string; onChange: (v: string) => void; testId: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground whitespace-nowrap min-w-[140px] text-right">{label}</Label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm font-mono w-20"
        data-testid={testId}
      />
    </div>
  );
}

function ResultRow({ label, value, unit, testId }: { label: string; value: string; unit?: string; testId?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0" data-testid={testId}>
      <span className="text-xs text-muted-foreground font-mono">{label}</span>
      <span className="text-sm font-mono font-semibold">
        {value}{unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
      </span>
    </div>
  );
}

interface SystemParams {
  cipTubeOD: string;
  cipTubes: string;
  cipThickness: string;
  cipLength: string;
  hipTubeOD: string;
  hipTubes: string;
  hipThickness: string;
  hipLength: string;
  cipCvMax36: string;
  cipCvMax78: string;
  hipCvMax48: string;
  barometricP: string;
  k304SS: string;
  cipBaffles: string;
  hipBaffles: string;
  cipHH1: string;
  cipHC1: string;
  hipHH1: string;
  hipHC1: string;
  cipHH2: string;
  cipHC2: string;
  hipHH2: string;
  hipHC2: string;
}

const defaultParams: SystemParams = {
  cipTubeOD: "2.565",
  cipTubes: "2148",
  cipThickness: "0.218",
  cipLength: "30.9375",
  hipTubeOD: "2.565",
  hipTubes: "1150",
  hipThickness: "0.218",
  hipLength: "25.0",
  cipCvMax36: "100000",
  cipCvMax78: "700000",
  hipCvMax48: "200000",
  barometricP: "14.696",
  k304SS: "8.7",
  cipBaffles: "5",
  hipBaffles: "1",
  cipHH1: "10.0",
  cipHC1: "10.0",
  hipHH1: "10.0",
  hipHC1: "10.0",
  cipHH2: "10.0",
  cipHC2: "10.0",
  hipHH2: "10.0",
  hipHC2: "10.0",
};

export default function GasGasHeatExchanger() {
  const [mode, setMode] = useState<"Static" | "Dynamic">("Static");
  const [pass3Temp, setPass3Temp] = useState("806");
  const [pass4Temp, setPass4Temp] = useState("779");
  const [controllerMA, setControllerMA] = useState("12.0");
  const [params, setParams] = useState<SystemParams>(defaultParams);
  const [resultText, setResultText] = useState<string>("");
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateParam = useCallback((field: keyof SystemParams, value: string) => {
    setParams(prev => ({ ...prev, [field]: value }));
  }, []);

  const runStatic = useCallback(() => {
    const t3 = parseFloat(pass3Temp);
    const t4 = parseFloat(pass4Temp);
    const cipCv36 = parseFloat(params.cipCvMax36);
    const cipCv78 = parseFloat(params.cipCvMax78);
    const hipCv48 = parseFloat(params.hipCvMax48);

    if ([t3, t4, cipCv36, cipCv78, hipCv48].some(isNaN)) {
      setResultText("Error: Please enter valid numeric values.");
      return;
    }

    const tempRatio = Math.abs(t3 - t4) / Math.max(t3, t4);
    const cipReq36 = Math.round(cipCv36 * (0.45 + tempRatio * 0.1));
    const cipReq78 = Math.round(cipCv78 * (0.40 + tempRatio * 0.08));
    const hipReq48 = Math.round(hipCv48 * (0.42 + tempRatio * 0.12));

    const cipTubeID = parseFloat(params.cipTubeOD) - 2 * parseFloat(params.cipThickness);
    const hipTubeID = parseFloat(params.hipTubeOD) - 2 * parseFloat(params.hipThickness);
    const cipArea = parseInt(params.cipTubes) * Math.PI * (parseFloat(params.cipTubeOD) / 12) * parseFloat(params.cipLength);
    const hipArea = parseInt(params.hipTubes) * Math.PI * (parseFloat(params.hipTubeOD) / 12) * parseFloat(params.hipLength);

    setResultText(
`Static Results (using fixed block inlet flows)
${"=".repeat(52)}

Pass 3 Outlet Temp      : ${t3.toFixed(1)} \u00b0F
Pass 4 Outlet Temp      : ${t4.toFixed(1)} \u00b0F
Temperature Delta       : ${Math.abs(t3 - t4).toFixed(1)} \u00b0F

Valve Sizing
${"─".repeat(52)}
CIP 36" required Cv     : ~${cipReq36.toLocaleString()}
CIP 78" required Cv     : ~${cipReq78.toLocaleString()}
HIP 48" required Cv     : ~${hipReq48.toLocaleString()}

Exchanger Geometry
${"─".repeat(52)}
CIP Tube ID             : ${cipTubeID.toFixed(3)} in
CIP Outside Area        : ${cipArea.toFixed(0)} ft\u00b2
HIP Tube ID             : ${hipTubeID.toFixed(3)} in
HIP Outside Area        : ${hipArea.toFixed(0)} ft\u00b2
Wall Conductivity (k)   : ${params.k304SS} BTU/hr-ft-\u00b0F`
    );
  }, [pass3Temp, pass4Temp, params]);

  const updateDynamic = useCallback(() => {
    const ma = parseFloat(controllerMA);
    if (isNaN(ma)) return;

    let p36: number, p78: number;
    if (ma <= 12) {
      p36 = Math.max(0, Math.min(100, ((ma - 4) / 8) * 100));
      p78 = 0;
    } else {
      p36 = 100;
      p78 = Math.max(0, Math.min(100, ((ma - 12) / 8) * 100));
    }
    const p48 = Math.max(0, Math.min(100, ((ma - 4) / 16) * 90));

    const cipCv36 = parseFloat(params.cipCvMax36);
    const cipCv78 = parseFloat(params.cipCvMax78);
    const hipCv48 = parseFloat(params.hipCvMax48);

    const cv36Act = (p36 / 100) * cipCv36;
    const cv78Act = (p78 / 100) * cipCv78;
    const cv48Act = (p48 / 100) * hipCv48;

    const now = new Date();
    const timeStr = now.toLocaleTimeString();

    setResultText(
`Dynamic Simulation
${"=".repeat(52)}
Time                    : ${timeStr}
Controller mA           : ${ma.toFixed(2)} mA

Split-Range Valve Positions
${"─".repeat(52)}
CIP 36" Position        : ${p36.toFixed(1)} %    (Cv = ${cv36Act.toLocaleString(undefined, {maximumFractionDigits: 0})})
CIP 78" Position        : ${p78.toFixed(1)} %    (Cv = ${cv78Act.toLocaleString(undefined, {maximumFractionDigits: 0})})
HIP 48" Position        : ${p48.toFixed(1)} %    (Cv = ${cv48Act.toLocaleString(undefined, {maximumFractionDigits: 0})})

=== Diagram 1 \u2013 Cold Interpass Control Loop ===
${"─".repeat(52)}
PID TIC-5224 \u2192 TY-5224A (0-50%)  \u2192 TCV-5224A (36")
             \u2192 TY-5224B (50-100%) \u2192 TCV-5224B (78")
             \u2192 Cold Interpass HX (1540-HX-008) \u2192 Pass 4 PV

=== Diagram 2 \u2013 Overall Bypass & Measurement ===
${"─".repeat(52)}
Hot Inlet (12/14) \u2192 Bypass Valves (5224A/B) \u2192 HX \u2192 Cold Out
Dead-time + 1/(1+\u03C4s) filter on temperature transmitter`
    );
  }, [controllerMA, params]);

  const startDynamic = useCallback(() => {
    setRunning(true);
  }, []);

  const pauseDynamic = useCallback(() => {
    setRunning(false);
  }, []);

  useEffect(() => {
    if (running) {
      updateDynamic();
      intervalRef.current = setInterval(updateDynamic, 900);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, updateDynamic]);

  const handleReset = useCallback(() => {
    setPass3Temp("806");
    setPass4Temp("779");
    setControllerMA("12.0");
    setParams(defaultParams);
    setResultText("");
    setRunning(false);
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
                <h1 className="text-lg font-bold leading-tight" data-testid="text-page-title">Sulfur Interpass HX Valve Simulator</h1>
                <p className="text-xs text-muted-foreground">Three valves - Split-range - Diagrams included</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} data-testid="button-reset">
              <RotateCcw className="mr-2 h-4 w-4" />Reset
            </Button>
            {mode === "Static" ? (
              <Button onClick={runStatic} data-testid="button-calculate">
                <Calculator className="mr-2 h-4 w-4" />Calculate Static
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
                  setResultText("");
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
              <CardTitle className="text-sm">Inputs</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {mode === "Static" ? (
                <>
                  <InputField
                    label="Pass 3 Outlet Temp"
                    value={pass3Temp}
                    onChange={setPass3Temp}
                    unit={"\u00b0F"}
                    testId="input-pass3-temp"
                  />
                  <InputField
                    label="Pass 4 Outlet Temp"
                    value={pass4Temp}
                    onChange={setPass4Temp}
                    unit={"\u00b0F"}
                    testId="input-pass4-temp"
                  />
                </>
              ) : (
                <InputField
                  label="TIC-5224 Controller Output"
                  value={controllerMA}
                  onChange={(v) => {
                    setControllerMA(v);
                  }}
                  unit="mA"
                  testId="input-controller-ma"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">System Parameters</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                <ParamField label='CIP Tube OD (in)' value={params.cipTubeOD} onChange={(v) => updateParam("cipTubeOD", v)} testId="input-cip-tube-od" />
                <ParamField label='CIP Tubes' value={params.cipTubes} onChange={(v) => updateParam("cipTubes", v)} testId="input-cip-tubes" />
                <ParamField label='CIP Thickness (in)' value={params.cipThickness} onChange={(v) => updateParam("cipThickness", v)} testId="input-cip-thickness" />
                <ParamField label='CIP Length (ft)' value={params.cipLength} onChange={(v) => updateParam("cipLength", v)} testId="input-cip-length" />
                <ParamField label='HIP Tube OD (in)' value={params.hipTubeOD} onChange={(v) => updateParam("hipTubeOD", v)} testId="input-hip-tube-od" />
                <ParamField label='HIP Tubes' value={params.hipTubes} onChange={(v) => updateParam("hipTubes", v)} testId="input-hip-tubes" />
                <ParamField label='HIP Thickness (in)' value={params.hipThickness} onChange={(v) => updateParam("hipThickness", v)} testId="input-hip-thickness" />
                <ParamField label='HIP Length (ft)' value={params.hipLength} onChange={(v) => updateParam("hipLength", v)} testId="input-hip-length" />
                <ParamField label='CIP Cv_Max 36"' value={params.cipCvMax36} onChange={(v) => updateParam("cipCvMax36", v)} testId="input-cip-cv-36" />
                <ParamField label='CIP Cv_Max 78"' value={params.cipCvMax78} onChange={(v) => updateParam("cipCvMax78", v)} testId="input-cip-cv-78" />
                <ParamField label='HIP Cv_Max 48"' value={params.hipCvMax48} onChange={(v) => updateParam("hipCvMax48", v)} testId="input-hip-cv-48" />
                <ParamField label='Barometric P (psia)' value={params.barometricP} onChange={(v) => updateParam("barometricP", v)} testId="input-barometric-p" />
                <ParamField label='k_304 SS' value={params.k304SS} onChange={(v) => updateParam("k304SS", v)} testId="input-k-304-ss" />
                <ParamField label='CIP Baffles' value={params.cipBaffles} onChange={(v) => updateParam("cipBaffles", v)} testId="input-cip-baffles" />
                <ParamField label='HIP Baffles' value={params.hipBaffles} onChange={(v) => updateParam("hipBaffles", v)} testId="input-hip-baffles" />
                <ParamField label='CIP h_H #1' value={params.cipHH1} onChange={(v) => updateParam("cipHH1", v)} testId="input-cip-hh1" />
                <ParamField label='CIP h_C #1' value={params.cipHC1} onChange={(v) => updateParam("cipHC1", v)} testId="input-cip-hc1" />
                <ParamField label='HIP h_H #1' value={params.hipHH1} onChange={(v) => updateParam("hipHH1", v)} testId="input-hip-hh1" />
                <ParamField label='HIP h_C #1' value={params.hipHC1} onChange={(v) => updateParam("hipHC1", v)} testId="input-hip-hc1" />
                <ParamField label='CIP h_H #2' value={params.cipHH2} onChange={(v) => updateParam("cipHH2", v)} testId="input-cip-hh2" />
                <ParamField label='CIP h_C #2' value={params.cipHC2} onChange={(v) => updateParam("cipHC2", v)} testId="input-cip-hc2" />
                <ParamField label='HIP h_H #2' value={params.hipHH2} onChange={(v) => updateParam("hipHH2", v)} testId="input-hip-hh2" />
                <ParamField label='HIP h_C #2' value={params.hipHC2} onChange={(v) => updateParam("hipHC2", v)} testId="input-hip-hc2" />
              </div>
            </CardContent>
          </Card>

          {resultText && (
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">
                  {mode === "Static" ? "Static Results" : "Dynamic Simulation Output"}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <pre
                  className="text-sm font-mono whitespace-pre-wrap bg-muted/50 rounded-md p-4 overflow-x-auto"
                  data-testid="text-results"
                >
                  {resultText}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
