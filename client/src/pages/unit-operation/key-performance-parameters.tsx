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
  molSO2: string;
  molSO3: string;
  molO2: string;
  molN2: string;
}

interface Results {
  plantRate: number;
  compPass1: number;
  conversion: number;
  emissions: number;
  scrubberEmissionsPpmv: number;
  steamGen: number;
  grossPowerMW: number;
  powerFactor: number;
}

const defaultInputs: Inputs = {
  sulfurFlow: "1128",
  molSO2: "0.28",
  molSO3: "0",
  molO2: "127.15",
  molN2: "3100.28",
};

const MW_S = 32.065;
const MW_SO2 = 64.064;
const MW_H2SO4 = 98.079;
const MINUTES_PER_DAY = 1440;
const LB_PER_SHORT_TON = 2000;
const STEAM_PER_ACID = 1.3;
const POWER_KW_PER_STPH = 243.0;

function calculateParameters(
  sulfurFlowLbMin: number,
  molSO2ToScrub: number,
  molSO3ToScrub: number,
  molO2ToScrub: number,
  molN2ToScrub: number
): Results {
  const molSulfurMin = sulfurFlowLbMin / MW_S;

  const molAcidMin = molSulfurMin - molSO2ToScrub - molSO3ToScrub;
  const lbAcidDay = molAcidMin * MW_H2SO4 * MINUTES_PER_DAY;
  const plantRate = lbAcidDay / LB_PER_SHORT_TON;

  const conversion = molSulfurMin > 0 ? (molAcidMin / molSulfurMin) * 100 : 0;

  const molSO2Absorbed = molSulfurMin - molSO2ToScrub;
  const o2Consumed = 0.5 * molSO2Absorbed + 1.0 * molSO3ToScrub;
  const molO2Inlet = molO2ToScrub + o2Consumed;
  const molAirInlet = molO2Inlet / 0.21;
  const compPass1 = molAirInlet > 0 ? (molSulfurMin / molAirInlet) * 100 : 0;

  const totalMolTail = molSO2ToScrub + molSO3ToScrub + molO2ToScrub + molN2ToScrub;
  const lbSO2Day = molSO2ToScrub * MW_SO2 * MINUTES_PER_DAY;
  const emissions = plantRate > 0 ? lbSO2Day / plantRate : 0;
  const scrubberEmissionsPpmv = totalMolTail > 0 ? (molSO2ToScrub / totalMolTail) * 1e6 : 0;

  const steamGen = STEAM_PER_ACID * plantRate;

  const acidStPerHour = plantRate / 24.0;
  const steamStPerHour = STEAM_PER_ACID * acidStPerHour;
  const grossPowerKW = POWER_KW_PER_STPH * steamStPerHour;
  const grossPowerMW = grossPowerKW / 1000.0;

  return {
    plantRate: Math.round(plantRate),
    compPass1: Math.round(compPass1 * 100) / 100,
    conversion: Math.round(conversion * 10000) / 10000,
    emissions: Math.round(emissions * 10) / 10,
    scrubberEmissionsPpmv: Math.round(scrubberEmissionsPpmv * 10) / 10,
    steamGen: Math.round(steamGen),
    grossPowerMW: Math.round(grossPowerMW * 100) / 100,
    powerFactor: POWER_KW_PER_STPH,
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
      const molSO2 = parseFloat(inputs.molSO2);
      const molSO3 = parseFloat(inputs.molSO3);
      const molO2 = parseFloat(inputs.molO2);
      const molN2 = parseFloat(inputs.molN2);

      if ([sulfurFlow, molSO2, molSO3, molO2, molN2].some(isNaN)) {
        setError("Please enter valid numerical values for all fields.");
        return;
      }
      if (sulfurFlow <= 0) {
        setError("Sulfur flow must be greater than zero.");
        return;
      }

      setResults(calculateParameters(sulfurFlow, molSO2, molSO3, molO2, molN2));
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
              <InputField label="Mol SO₂ to Scrubber" value={inputs.molSO2} onChange={(v) => update("molSO2", v)} unit="lb-mol/min" testId="input-mol-so2" />
              <InputField label="Mol SO₃ to Scrubber" value={inputs.molSO3} onChange={(v) => update("molSO3", v)} unit="lb-mol/min" testId="input-mol-so3" />
              <InputField label="Mol O₂ to Scrubber" value={inputs.molO2} onChange={(v) => update("molO2", v)} unit="lb-mol/min" testId="input-mol-o2" />
              <InputField label="Mol N₂ to Scrubber" value={inputs.molN2} onChange={(v) => update("molN2", v)} unit="lb-mol/min" testId="input-mol-n2" />
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
                <ResultRow label="Emissions" value={results.emissions.toFixed(1)} unit="lb/ST acid" testId="result-emissions" />
                <ResultRow label="Scrubber Emissions" value={results.scrubberEmissionsPpmv.toFixed(1)} unit="ppmv" testId="result-scrubber-emissions" />
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
