import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, RotateCcw, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import expLogo from "@/assets/exp-logo.png";

interface ParamConfig {
  label: string;
  defaultValue: string;
  unit?: string;
}

const CIP_TUBE_PARAMS: ParamConfig[] = [
  { label: "CIP Tube OD", defaultValue: "2.565", unit: "in" },
  { label: "CIP Tube Number", defaultValue: "2,148" },
  { label: "CIP Tube Thickness", defaultValue: "0.218", unit: "in" },
  { label: "CIP Tube Length", defaultValue: "30.9375", unit: "ft" },
];

const HIP_TUBE_PARAMS: ParamConfig[] = [
  { label: "HIP Tube OD", defaultValue: "2.565" },
  { label: "HIP Tube Number", defaultValue: "1,150" },
  { label: "HIP Tube Thickness", defaultValue: "0.218" },
  { label: "HIP Tube Length", defaultValue: "25.0", unit: "ft" },
];

const VALVE_AND_GENERAL_PARAMS: ParamConfig[] = [
  { label: 'CIP Cv_Max; 36"', defaultValue: "100,000.0" },
  { label: "Barometric P (psia)", defaultValue: "12.5" },
  { label: "Weather ZIP Code", defaultValue: "89801" },
  { label: 'HIP Cv_Max; 48"', defaultValue: "200,000.0" },
  { label: 'CIP Cv_Max; 78"', defaultValue: "700,000.0" },
  { label: "k_304 SS (BTU/hr*ft*F)", defaultValue: "8.7" },
  { label: "HIP; Number of Baffles; Disc & Donut", defaultValue: "1" },
  { label: "CIP; Number of Baffles; Disc & Donut", defaultValue: "2" },
];

const FOULING_FACTOR_PARAMS: ParamConfig[] = [
  { label: "CIP Fouling Factor, Hot", defaultValue: "0.001", unit: "(hr*ft2*F/BTU)" },
  { label: "CIP Fouling Factor, Cold", defaultValue: "0.001", unit: "(hr*ft2*F/BTU)" },
  { label: "HIP Fouling Factor, Hot", defaultValue: "0.001", unit: "(hr*ft2*F/BTU)" },
  { label: "HIP Fouling Factor, Cold", defaultValue: "0.001", unit: "(hr*ft2*F/BTU)" },
];

const SHELL_NOZZLE_PARAMS: ParamConfig[] = [
  { label: "CIP Shell Diameter", defaultValue: "15.0", unit: "ft" },
  { label: "CIP Internal Nozzle", defaultValue: "6.5", unit: "ft" },
  { label: "HIP Shell Diameter", defaultValue: "10.0", unit: "ft" },
  { label: "HIP Internal Nozzle", defaultValue: "10.0", unit: "ft" },
];

const BAFFLE_PARAMS: ParamConfig[] = [
  { label: "CIP Disc Baffle Diameter", defaultValue: "8.333", unit: "ft" },
  { label: "CIP Donut Baffle OD", defaultValue: "7.167", unit: "ft" },
  { label: "CIP Donut Baffle ID", defaultValue: "3.333", unit: "ft" },
  { label: "HIP Disc Baffle Diameter", defaultValue: "8.333", unit: "ft" },
];

const CIP_BUSTLE_PARAMS: ParamConfig[] = [
  { label: "CIP Cold Upper Bustle ID", defaultValue: "17.083", unit: "ft" },
  { label: "CIP Cold Lower Bustle ID", defaultValue: "15", unit: "ft" },
  { label: "CIP Hot Upper Bustle ID", defaultValue: "15.0", unit: "ft" },
  { label: "CIP Hot Lower Bustle ID", defaultValue: "15.0", unit: "ft" },
];

const CIP_DUCT_PARAMS: ParamConfig[] = [
  { label: "CIP Cold In Duct Diameter", defaultValue: "6.0", unit: "ft" },
  { label: "CIP Cold Out Duct Diameter", defaultValue: "6.0", unit: "ft" },
  { label: "CIP Hot In Duct Diameter", defaultValue: "6.5", unit: "ft" },
  { label: "CIP Hot Out Diameter", defaultValue: "6.5", unit: "ft" },
];

const HIP_BUSTLE_PARAMS: ParamConfig[] = [
  { label: "HIP Cold Upper Bustle ID", defaultValue: "N/A", unit: "ft" },
  { label: "HIP Cold Lower Bustle ID", defaultValue: "N/A", unit: "ft" },
  { label: "HIP Hot Upper Bustle ID", defaultValue: "15.0", unit: "ft" },
  { label: "HIP Hot Lower Bustle ID", defaultValue: "15.5", unit: "ft" },
];

const HIP_DUCT_PARAMS: ParamConfig[] = [
  { label: "HIP Cold In Duct Diameter", defaultValue: "6.0", unit: "ft" },
  { label: "HIP Cold Out Duct Diameter", defaultValue: "6.5", unit: "ft" },
  { label: "HIP Hot In Duct Diameter", defaultValue: "7.0", unit: "ft" },
  { label: "HIP Hot Out Diameter", defaultValue: "6.5", unit: "ft" },
];

const NU_CALC_PARAMS: ParamConfig[] = [
  { label: "CIP Tube Nu Calc Method", defaultValue: "Gnielinski" },
  { label: "CIP Shell Nu Calc Method", defaultValue: "Zukauskas" },
  { label: "HIP Tube Nu Calc Method", defaultValue: "Gnielinski" },
  { label: "HIP Shell Nu Calc Method", defaultValue: "Zukauskas" },
];

const METHOD_PARAMS: ParamConfig[] = [
  { label: 'Friction Factor "f" Calc Method', defaultValue: "0.3164*Re^-0.25" },
  { label: "CIP Donut Baffle Weepage", defaultValue: "3%" },
  { label: "CIP Shell", defaultValue: "X" },
  { label: "HIP Shell Nu Calc Method 2", defaultValue: "X" },
];

const ALL_PARAMS = [
  ...CIP_TUBE_PARAMS,
  ...HIP_TUBE_PARAMS,
  ...VALVE_AND_GENERAL_PARAMS,
  ...FOULING_FACTOR_PARAMS,
  ...SHELL_NOZZLE_PARAMS,
  ...BAFFLE_PARAMS,
  ...CIP_BUSTLE_PARAMS,
  ...CIP_DUCT_PARAMS,
  ...HIP_BUSTLE_PARAMS,
  ...HIP_DUCT_PARAMS,
  ...NU_CALC_PARAMS,
  ...METHOD_PARAMS,
];

const STORAGE_KEY = "gas-gas-hx-system-params";

export default function GasGasHxSystemParameters() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(ALL_PARAMS.map(p => [p.label, p.defaultValue]))
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setValues(prev => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  const updateValue = (label: string, val: string) => {
    setValues(prev => ({ ...prev, [label]: val }));
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      toast({ title: "Parameters Saved", description: "System parameters have been saved successfully." });
    } catch {
      toast({ title: "Save Error", description: "Failed to save parameters.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaults = Object.fromEntries(ALL_PARAMS.map(p => [p.label, p.defaultValue]));
    setValues(defaults);
    localStorage.removeItem(STORAGE_KEY);
    toast({ title: "Parameters Reset", description: "All parameters restored to factory defaults." });
  };

  const renderRow = (params: ParamConfig[], prefix: string) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
      {params.map((p, i) => (
        <div key={p.label} data-testid={`${prefix}-row-${i}`}>
          <Label className="text-[11px] text-muted-foreground mb-1 block" data-testid={`${prefix}-label-${i}`}>
            {p.label}{p.unit ? `; ${p.unit}` : ""}
          </Label>
          <Input
            type="text"
            value={values[p.label] || p.defaultValue}
            onChange={(e) => updateValue(p.label, e.target.value)}
            className="text-sm font-mono"
            data-testid={`${prefix}-input-${i}`}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background" data-testid="page-gas-gas-hx-system-parameters">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/unit-operation/gas-gas-heat-exchanger">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-lg font-bold leading-tight" data-testid="text-page-title">System Parameters</h1>
                <p className="text-xs text-muted-foreground">CIP & HIP Heat Exchanger Configuration</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} data-testid="button-reset">
              <RotateCcw className="mr-2 h-4 w-4" />Reset Defaults
            </Button>
            <Button onClick={handleSave} disabled={isSaving} data-testid="button-save">
              <Save className="mr-2 h-4 w-4" />{isSaving ? "Saving..." : "Save Parameters"}
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-[1400px] mx-auto space-y-4">

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm" data-testid="text-tubes-title">Tube Geometry & General</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              {renderRow(CIP_TUBE_PARAMS, "cip-tube")}
              {renderRow(HIP_TUBE_PARAMS, "hip-tube")}
              {renderRow(VALVE_AND_GENERAL_PARAMS, "valve-general")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm" data-testid="text-fouling-title">Fouling Factors</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {renderRow(FOULING_FACTOR_PARAMS, "fouling")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm" data-testid="text-shell-title">Shell & Nozzle Geometry</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              {renderRow(SHELL_NOZZLE_PARAMS, "shell-nozzle")}
              {renderRow(BAFFLE_PARAMS, "baffle")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm" data-testid="text-bustle-duct-title">Bustle & Duct Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              {renderRow(CIP_BUSTLE_PARAMS, "cip-bustle")}
              {renderRow(CIP_DUCT_PARAMS, "cip-duct")}
              {renderRow(HIP_BUSTLE_PARAMS, "hip-bustle")}
              {renderRow(HIP_DUCT_PARAMS, "hip-duct")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm" data-testid="text-methods-title">Calculation Methods</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              {renderRow(NU_CALC_PARAMS, "nu-calc")}
              {renderRow(METHOD_PARAMS, "method")}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
