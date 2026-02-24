import { Link } from "wouter";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowLeftRight, Calculator, RotateCcw } from "lucide-react";
import expLogo from "@/assets/exp-logo.png";

interface HotSideInputs {
  inletTemp: string;
  outletTemp: string;
  flowRate: string;
  pressure: string;
}

interface ColdSideInputs {
  inletTemp: string;
  outletTemp: string;
  flowRate: string;
  pressure: string;
}

interface GeometryInputs {
  tubeOD: string;
  tubeThickness: string;
  numberOfTubes: string;
  tubeLength: string;
  shellID: string;
  tubePitch: string;
  numberOfBaffles: string;
  baffleCut: string;
  tubePassCount: string;
  foulingTube: string;
  foulingShell: string;
  kMetal: string;
}

interface Results {
  qHot: number;
  qCold: number;
  qAvg: number;
  heatBalanceError: number;
  lmtd: number;
  uClean: number;
  uDirty: number;
  aOutside: number;
  aInside: number;
  aRequired: number;
  excessArea: number;
  effectiveness: number;
  ntu: number;
  nTubes: number;
  tubeOD: number;
  tubeLength: number;
  nBaffles: number;
  kMetal: number;
}

const defaultHotSide: HotSideInputs = {
  inletTemp: "806",
  outletTemp: "420",
  flowRate: "285000",
  pressure: "14.2",
};

const defaultColdSide: ColdSideInputs = {
  inletTemp: "90",
  outletTemp: "580",
  flowRate: "260000",
  pressure: "14.5",
};

const defaultGeometry: GeometryInputs = {
  tubeOD: "2.0",
  tubeThickness: "0.109",
  numberOfTubes: "1800",
  tubeLength: "24.0",
  shellID: "60.0",
  tubePitch: "2.5",
  numberOfBaffles: "8",
  baffleCut: "25",
  tubePassCount: "2",
  foulingTube: "0.001",
  foulingShell: "0.002",
  kMetal: "26.0",
};

function InputField({ label, value, onChange, unit, testId }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string; testId: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground whitespace-nowrap min-w-[130px] text-right">{label}</Label>
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

function GeomField({ label, value, onChange, testId }: {
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
    <div className="flex items-center justify-between py-1 border-b border-border/50 last:border-0" data-testid={testId}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-mono font-semibold">
        {value}{unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
      </span>
    </div>
  );
}

export default function GasGasHeatExchanger() {
  const [mode, setMode] = useState<"Static" | "Rating">("Static");
  const [hotSide, setHotSide] = useState<HotSideInputs>(defaultHotSide);
  const [coldSide, setColdSide] = useState<ColdSideInputs>(defaultColdSide);
  const [geometry, setGeometry] = useState<GeometryInputs>(defaultGeometry);
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateHot = useCallback((field: keyof HotSideInputs, value: string) => {
    setHotSide(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateCold = useCallback((field: keyof ColdSideInputs, value: string) => {
    setColdSide(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateGeom = useCallback((field: keyof GeometryInputs, value: string) => {
    setGeometry(prev => ({ ...prev, [field]: value }));
  }, []);

  const calculate = useCallback(() => {
    try {
      setError(null);
      const T_h_in = parseFloat(hotSide.inletTemp);
      const T_h_out = parseFloat(hotSide.outletTemp);
      const m_h = parseFloat(hotSide.flowRate);
      const T_c_in = parseFloat(coldSide.inletTemp);
      const T_c_out = parseFloat(coldSide.outletTemp);
      const m_c = parseFloat(coldSide.flowRate);

      const nTubes = parseInt(geometry.numberOfTubes);
      const tubeOD = parseFloat(geometry.tubeOD);
      const tubeThk = parseFloat(geometry.tubeThickness);
      const tubeLen = parseFloat(geometry.tubeLength);
      const nBaffles = parseInt(geometry.numberOfBaffles);
      const kMetal = parseFloat(geometry.kMetal);
      const RfTube = parseFloat(geometry.foulingTube);
      const RfShell = parseFloat(geometry.foulingShell);

      if ([T_h_in, T_h_out, m_h, T_c_in, T_c_out, m_c, nTubes, tubeOD, tubeThk, tubeLen, nBaffles, kMetal, RfTube, RfShell].some(isNaN)) {
        setError("Please enter valid numeric values for all fields.");
        return;
      }

      const tubeID = tubeOD - 2 * tubeThk;
      const Cp_h = 0.25;
      const Cp_c = 0.24;

      const qHot = m_h * Cp_h * (T_h_in - T_h_out);
      const qCold = m_c * Cp_c * (T_c_out - T_c_in);

      const dT1 = T_h_in - T_c_out;
      const dT2 = T_h_out - T_c_in;
      let lmtd: number;
      if (Math.abs(dT1 - dT2) < 0.01) {
        lmtd = dT1;
      } else {
        lmtd = (dT1 - dT2) / Math.log(dT1 / dT2);
      }

      const aOutside = nTubes * Math.PI * (tubeOD / 12) * tubeLen;
      const aInside = nTubes * Math.PI * (tubeID / 12) * tubeLen;

      const h_i = 12.0;
      const h_o = 10.0;

      const R_wall = (tubeOD - tubeID) / (2 * 12) / kMetal;
      const uClean = 1.0 / (1 / h_o + R_wall + (tubeOD / tubeID) / h_i);
      const uDirty = 1.0 / (1 / h_o + RfShell + R_wall + RfTube * (tubeOD / tubeID) + (tubeOD / tubeID) / h_i);

      const qAvg = (qHot + qCold) / 2;
      const aRequired = qAvg / (uDirty * lmtd);
      const excessArea = ((aOutside - aRequired) / aRequired) * 100;

      const C_min = Math.min(m_h * Cp_h, m_c * Cp_c);
      const effectiveness = qAvg / (C_min * (T_h_in - T_c_in));
      const ntu = (uDirty * aOutside) / C_min;

      const heatBalanceError = Math.abs(qHot - qCold) / qAvg * 100;

      setResults({
        qHot, qCold, qAvg, heatBalanceError,
        lmtd, uClean, uDirty,
        aOutside, aInside, aRequired, excessArea,
        effectiveness, ntu,
        nTubes: nTubes, tubeOD, tubeLength: tubeLen, nBaffles, kMetal,
      });
    } catch (ex: any) {
      setError(ex.message || "Calculation error");
    }
  }, [hotSide, coldSide, geometry]);

  const handleReset = useCallback(() => {
    setHotSide(defaultHotSide);
    setColdSide(defaultColdSide);
    setGeometry(defaultGeometry);
    setResults(null);
    setError(null);
  }, []);

  const fmt = (n: number, decimals = 0) => n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/unit-operation-simulator">
              <Button variant="ghost" size="icon" data-testid="button-back"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-lg font-bold leading-tight" data-testid="text-page-title">Gas-Gas Heat Exchanger</h1>
                <p className="text-xs text-muted-foreground">Shell & Tube HX Rating - LMTD Method</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} data-testid="button-reset">
              <RotateCcw className="mr-2 h-4 w-4" />Reset
            </Button>
            <Button onClick={calculate} data-testid="button-calculate">
              <Calculator className="mr-2 h-4 w-4" />Calculate
            </Button>
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
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as "Static" | "Rating")} className="flex gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="Static" id="mode-static" data-testid="radio-mode-static" />
                  <Label htmlFor="mode-static" className="text-sm">Static Calculation</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="Rating" id="mode-rating" data-testid="radio-mode-rating" />
                  <Label htmlFor="mode-rating" className="text-sm">Rating Mode</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  Hot Side (Process Gas)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <InputField label="Inlet Temp" value={hotSide.inletTemp} onChange={(v) => updateHot("inletTemp", v)} unit="°F" testId="input-hot-inlet-temp" />
                <InputField label="Outlet Temp" value={hotSide.outletTemp} onChange={(v) => updateHot("outletTemp", v)} unit="°F" testId="input-hot-outlet-temp" />
                <InputField label="Flow Rate" value={hotSide.flowRate} onChange={(v) => updateHot("flowRate", v)} unit="lb/hr" testId="input-hot-flow-rate" />
                <InputField label="Pressure" value={hotSide.pressure} onChange={(v) => updateHot("pressure", v)} unit="psia" testId="input-hot-pressure" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  Cold Side (Ambient Air)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <InputField label="Inlet Temp" value={coldSide.inletTemp} onChange={(v) => updateCold("inletTemp", v)} unit="°F" testId="input-cold-inlet-temp" />
                <InputField label="Outlet Temp" value={coldSide.outletTemp} onChange={(v) => updateCold("outletTemp", v)} unit="°F" testId="input-cold-outlet-temp" />
                <InputField label="Flow Rate" value={coldSide.flowRate} onChange={(v) => updateCold("flowRate", v)} unit="lb/hr" testId="input-cold-flow-rate" />
                <InputField label="Pressure" value={coldSide.pressure} onChange={(v) => updateCold("pressure", v)} unit="psia" testId="input-cold-pressure" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Exchanger Geometry</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                <GeomField label="Tube OD (in)" value={geometry.tubeOD} onChange={(v) => updateGeom("tubeOD", v)} testId="input-tube-od" />
                <GeomField label="Tube Thickness (in)" value={geometry.tubeThickness} onChange={(v) => updateGeom("tubeThickness", v)} testId="input-tube-thickness" />
                <GeomField label="Number of Tubes" value={geometry.numberOfTubes} onChange={(v) => updateGeom("numberOfTubes", v)} testId="input-num-tubes" />
                <GeomField label="Tube Length (ft)" value={geometry.tubeLength} onChange={(v) => updateGeom("tubeLength", v)} testId="input-tube-length" />
                <GeomField label="Shell ID (in)" value={geometry.shellID} onChange={(v) => updateGeom("shellID", v)} testId="input-shell-id" />
                <GeomField label="Tube Pitch (in)" value={geometry.tubePitch} onChange={(v) => updateGeom("tubePitch", v)} testId="input-tube-pitch" />
                <GeomField label="Number of Baffles" value={geometry.numberOfBaffles} onChange={(v) => updateGeom("numberOfBaffles", v)} testId="input-num-baffles" />
                <GeomField label="Baffle Cut (%)" value={geometry.baffleCut} onChange={(v) => updateGeom("baffleCut", v)} testId="input-baffle-cut" />
                <GeomField label="Passes (Tube Side)" value={geometry.tubePassCount} onChange={(v) => updateGeom("tubePassCount", v)} testId="input-tube-passes" />
                <GeomField label="Fouling Factor (tube)" value={geometry.foulingTube} onChange={(v) => updateGeom("foulingTube", v)} testId="input-fouling-tube" />
                <GeomField label="Fouling Factor (shell)" value={geometry.foulingShell} onChange={(v) => updateGeom("foulingShell", v)} testId="input-fouling-shell" />
                <GeomField label="k_metal (BTU/hr-ft-°F)" value={geometry.kMetal} onChange={(v) => updateGeom("kMetal", v)} testId="input-k-metal" />
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-destructive">
              <CardContent className="py-3 px-4">
                <p className="text-sm text-destructive" data-testid="text-error">{error}</p>
              </CardContent>
            </Card>
          )}

          {results && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Heat Duty</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1">
                  <ResultRow label="Hot Side Duty" value={fmt(results.qHot)} unit="BTU/hr" testId="result-q-hot" />
                  <ResultRow label="Cold Side Duty" value={fmt(results.qCold)} unit="BTU/hr" testId="result-q-cold" />
                  <ResultRow label="Average Duty" value={fmt(results.qAvg)} unit="BTU/hr" testId="result-q-avg" />
                  <ResultRow label="Heat Balance Error" value={fmt(results.heatBalanceError, 2)} unit="%" testId="result-heat-balance-error" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Heat Transfer</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1">
                  <ResultRow label="LMTD" value={fmt(results.lmtd, 1)} unit="°F" testId="result-lmtd" />
                  <ResultRow label="U_clean" value={fmt(results.uClean, 3)} unit="BTU/hr-ft²-°F" testId="result-u-clean" />
                  <ResultRow label="U_dirty" value={fmt(results.uDirty, 3)} unit="BTU/hr-ft²-°F" testId="result-u-dirty" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Surface Area</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1">
                  <ResultRow label="Outside Area" value={fmt(results.aOutside)} unit="ft²" testId="result-a-outside" />
                  <ResultRow label="Inside Area" value={fmt(results.aInside)} unit="ft²" testId="result-a-inside" />
                  <ResultRow label="Required Area" value={fmt(results.aRequired)} unit="ft²" testId="result-a-required" />
                  <ResultRow label="Excess Area" value={fmt(results.excessArea, 1)} unit="%" testId="result-excess-area" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Performance</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1">
                  <ResultRow label="Effectiveness (ε)" value={fmt(results.effectiveness, 3)} testId="result-effectiveness" />
                  <ResultRow label="NTU" value={fmt(results.ntu, 3)} testId="result-ntu" />
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Geometry Summary</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1">
                  <ResultRow label="Tubes" value={`${results.nTubes} x OD ${results.tubeOD}" x ${results.tubeLength} ft`} testId="result-tubes" />
                  <ResultRow label="Baffles" value={`${results.nBaffles}`} testId="result-baffles" />
                  <ResultRow label="Wall Conductivity" value={`${results.kMetal}`} unit="BTU/hr-ft-°F" testId="result-k-metal" />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
