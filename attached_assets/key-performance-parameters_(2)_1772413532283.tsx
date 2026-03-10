import { Link } from "wouter";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, BarChart3, Calculator, RotateCcw } from "lucide-react";
import expLogo from "@/assets/exp-logo.png";

interface Inputs {
  sulfurFlow: string;
  scfmSO2TailHr: string;
  scfmSO3TailHr: string;
  scfmO2TailHr: string;
  scfmN2TailHr: string;
}

interface Results {
  plantRate: number;
  compPass1: number;
  conversion: number;
  emissions: number;
  steamGen: number;
  grossPowerMW: number;
  powerFactor: number;
  o2TailPct: number;
}

// Conversion factor: 1 lb-mol/hr = 5.984 scfm (at 1 ATM, 32°F)
const SCFM_PER_LBMOLHR = 5.984;

const defaultInputs: Inputs = {
  sulfurFlow: "1128",
  scfmSO2TailHr: "18.01",   // 3.01 lbmol/hr × 5.984
  scfmSO3TailHr: "0",
  scfmO2TailHr: "4069",     // from stream table
  scfmN2TailHr: "86815.97", // 14506.68 lbmol/hr × 5.984
};

const MW_S = 32.065;
const MW_SO2 = 64.064;
const MW_H2SO4 = 98.079;
const HR_PER_DAY = 24;
const MIN_PER_HR = 60;
const LB_PER_ST = 2000;
const STEAM_T_ST = 1.3;
const KW_PER_STPH = 243.0;

function calculateParameters(
  sulfurLbPerMin: number,
  scfmSO2: number,
  scfmSO3: number,
  scfmO2: number,
  scfmN2: number
): Results {
  // Convert scfm to lb-mol/hr
  const molSO2TailHr = scfmSO2 / SCFM_PER_LBMOLHR;
  const molSO3TailHr = scfmSO3 / SCFM_PER_LBMOLHR;
  const molN2TailHr  = scfmN2  / SCFM_PER_LBMOLHR;

  const molSMin = sulfurLbPerMin / MW_S;
  const molSHr = molSMin * MIN_PER_HR;

  const molAcidHr = molSHr - molSO2TailHr - molSO3TailHr;
  const lbAcidDay = molAcidHr * MW_H2SO4 * HR_PER_DAY;
  const plantRate = lbAcidDay / LB_PER_ST;

  const conversion = molSHr > 0 ? (molAcidHr / molSHr) * 100 : 0;

  const dryAirMolHr = molN2TailHr / 0.7905;
  const compPass1 = dryAirMolHr > 0 ? (molSHr / dryAirMolHr) * 100 : 0;

  const lbSO2Day = molSO2TailHr * MW_SO2 * HR_PER_DAY;
  const emissions = plantRate > 0 ? lbSO2Day / plantRate : 0;

  const steamGen = STEAM_T_ST * plantRate;

  const acidStph = plantRate / 24.0;
  const steamStph = STEAM_T_ST * acidStph;
  const powerKW = KW_PER_STPH * steamStph;
  const powerMW = powerKW / 1000.0;

  // O2 tail gas % of dry total (SO2 + SO3 + O2 + N2)
  const dryTotalScfm = scfmSO2 + scfmSO3 + scfmO2 + scfmN2;
  const o2TailPct = dryTotalScfm > 0 ? (scfmO2 / dryTotalScfm) * 100 : 0;

  return {
    plantRate: Math.round(plantRate),
    compPass1: Math.round(compPass1 * 100) / 100,
    conversion: Math.round(conversion * 10000) / 10000,
    emissions: Math.round(emissions * 10) / 10,
    steamGen: Math.round(steamGen),
    grossPowerMW: Math.round(powerMW * 100) / 100,
    powerFactor: KW_PER_STPH,
    o2TailPct: Math.round(o2TailPct * 100) / 100,
  };
}

function InputField({ label, value, onChange, unit, testId }: {
  label: string; value: string; onChange: (v: string) => void; unit: string; testId: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="text-sm text-muted-foreground whitespace-nowrap min-w-[220px] text-right">{label}</Label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm font-mono w-28"
        data-testid={testId}
      />
      <span className="text-xs text-muted-foreground whitespace-nowrap">{unit}</span>
    </div>
  );
}

function ResultRow({ label, value, unit, testId }: { label: string; value: string; unit?: string; testId: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0" data-testid={testId}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-base font-mono font-semibold">
        {value}{unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
      </span>
    </div>
  );
}

export default function KeyPerformanceParameters() {
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback((field: keyof Inputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCalculate = useCallback(() => {
    try {
      setError(null);
      const sulfurFlow = parseFloat(inputs.sulfurFlow);
      const scfmSO2 = parseFloat(inputs.scfmSO2TailHr);
      const scfmSO3 = parseFloat(inputs.scfmSO3TailHr);
      const scfmO2  = parseFloat(inputs.scfmO2TailHr);
      const scfmN2  = parseFloat(inputs.scfmN2TailHr);

      if ([sulfurFlow, scfmSO2, scfmSO3, scfmO2, scfmN2].some(isNaN)) {
        setError("Please enter valid numerical values for all fields.");
        return;
      }
      if (sulfurFlow <= 0) {
        setError("Sulfur flow must be greater than zero.");
        return;
      }

      setResults(calculateParameters(sulfurFlow, scfmSO2, scfmSO3, scfmO2, scfmN2));
    } catch (ex: any) {
      setError(ex.message || "Calculation error");
    }
  }, [inputs]);

  const handleReset = useCallback(() => {
    setInputs(defaultInputs);
    setResults(null);
    setError(null);
  }, []);

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
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-lg font-bold leading-tight" data-testid="text-page-title">Key Performance Parameters</h1>
                <p className="text-xs text-muted-foreground">Sulfuric acid plant performance calculator</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} data-testid="button-reset">
              <RotateCcw className="mr-2 h-4 w-4" />Reset
            </Button>
            <Button onClick={handleCalculate} data-testid="button-calculate">
              <Calculator className="mr-2 h-4 w-4" />Calculate
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-3xl mx-auto space-y-4">

          <Card>
            <CardHeader className="py-3 px-5">
              <CardTitle className="text-sm">Process Inputs</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              <InputField label="Sulfur Flow" value={inputs.sulfurFlow} onChange={(v) => update("sulfurFlow", v)} unit="lb/min" testId="input-sulfur-flow" />
              <InputField label="SO₂ Tail Gas" value={inputs.scfmSO2TailHr} onChange={(v) => update("scfmSO2TailHr", v)} unit="scfm" testId="input-scfm-so2-tail" />
              <InputField label="SO₃ Tail Gas" value={inputs.scfmSO3TailHr} onChange={(v) => update("scfmSO3TailHr", v)} unit="scfm" testId="input-scfm-so3-tail" />
              <InputField label="O₂ Tail Gas" value={inputs.scfmO2TailHr} onChange={(v) => update("scfmO2TailHr", v)} unit="scfm" testId="input-scfm-o2-tail" />
              <InputField label="N₂ Tail Gas" value={inputs.scfmN2TailHr} onChange={(v) => update("scfmN2TailHr", v)} unit="scfm" testId="input-scfm-n2-tail" />
            </CardContent>
          </Card>

          {error && (
            <Card className="border-destructive">
              <CardContent className="py-3 px-5">
                <p className="text-sm text-destructive" data-testid="text-error">{error}</p>
              </CardContent>
            </Card>
          )}

          {results && (
            <Card>
              <CardHeader className="py-3 px-5">
                <CardTitle className="text-sm">Calculated Performance Parameters</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <ResultRow label="Plant Rate (STPD)" value={results.plantRate.toLocaleString()} unit="ST/day" testId="result-plant-rate" />
                <ResultRow label="Comp Pass 1" value={results.compPass1.toFixed(2)} unit="% SO₂" testId="result-comp-pass1" />
                <ResultRow label="Conversion" value={results.conversion.toFixed(4)} unit="%" testId="result-conversion" />
                <ResultRow label="O₂ Tail Gas" value={results.o2TailPct.toFixed(2)} unit="% (dry)" testId="result-o2-tail-pct" />
                <ResultRow label="Emissions" value={results.emissions.toFixed(1)} unit="lb/ST acid" testId="result-emissions" />
                <ResultRow label="Steam Gen." value={results.steamGen.toLocaleString()} unit="ST/day" testId="result-steam-gen" />
                <ResultRow label="Gross Power Gen." value={results.grossPowerMW.toFixed(2)} unit="MW" testId="result-gross-power" />
                <ResultRow label="Power Factor" value={results.powerFactor.toFixed(1)} unit="kW/STPH" testId="result-power-factor" />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
