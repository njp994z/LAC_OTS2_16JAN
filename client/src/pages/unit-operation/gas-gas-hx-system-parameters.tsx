import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  { label: "CIP Number of Baffles", defaultValue: "5" },
];

const HIP_TUBE_PARAMS: ParamConfig[] = [
  { label: "HIP Tube OD", defaultValue: "2.565", unit: "in" },
  { label: "HIP Tube Number", defaultValue: "1,150" },
  { label: "HIP Tube Thickness", defaultValue: "0.218", unit: "in" },
  { label: "HIP Tube Length", defaultValue: "25.0", unit: "ft" },
  { label: "HIP Number of Baffles", defaultValue: "1" },
];

const VALVE_CV_PARAMS: ParamConfig[] = [
  { label: 'CIP Cv_Max 36"', defaultValue: "100,000.0" },
  { label: 'HIP Cv_Max 48"', defaultValue: "200,000.0" },
  { label: 'CIP Cv_Max 78"', defaultValue: "700,000.0" },
];

const GENERAL_PARAMS: ParamConfig[] = [
  { label: "Barometric Pressure", defaultValue: "14.696", unit: "psia" },
  { label: "Weather ZIP Code", defaultValue: "89801" },
  { label: "k 304 SS Thermal Conductivity", defaultValue: "8.7", unit: "BTU/hr\u00b7ft\u00b7\u00b0F" },
];

const CIP_HT_COEFF_PARAMS: ParamConfig[] = [
  { label: "CIP h_H #1", defaultValue: "10.0", unit: "BTU/hr\u00b7ft\u00b2\u00b7\u00b0F" },
  { label: "CIP h_C #1", defaultValue: "10.0", unit: "BTU/hr\u00b7ft\u00b2\u00b7\u00b0F" },
  { label: "CIP h_H #2", defaultValue: "10.0", unit: "BTU/hr\u00b7ft\u00b2\u00b7\u00b0F" },
  { label: "CIP h_C #2", defaultValue: "10.0", unit: "BTU/hr\u00b7ft\u00b2\u00b7\u00b0F" },
];

const HIP_HT_COEFF_PARAMS: ParamConfig[] = [
  { label: "HIP h_H #1", defaultValue: "10.0", unit: "BTU/hr\u00b7ft\u00b2\u00b7\u00b0F" },
  { label: "HIP h_C #1", defaultValue: "10.0", unit: "BTU/hr\u00b7ft\u00b2\u00b7\u00b0F" },
  { label: "HIP h_H #2", defaultValue: "10.0", unit: "BTU/hr\u00b7ft\u00b2\u00b7\u00b0F" },
  { label: "HIP h_C #2", defaultValue: "10.0", unit: "BTU/hr\u00b7ft\u00b2\u00b7\u00b0F" },
];

const ALL_PARAMS = [
  ...CIP_TUBE_PARAMS,
  ...HIP_TUBE_PARAMS,
  ...VALVE_CV_PARAMS,
  ...GENERAL_PARAMS,
  ...CIP_HT_COEFF_PARAMS,
  ...HIP_HT_COEFF_PARAMS,
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

  const renderParamGrid = (params: ParamConfig[], prefix: string, cols: 2 | 3 = 3) => (
    <div className={`grid grid-cols-1 ${cols === 3 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"} gap-x-8 gap-y-3`}>
      {params.map((p, i) => (
        <div key={p.label} className="flex items-center gap-2" data-testid={`${prefix}-row-${i}`}>
          <Label className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 text-right" style={{ minWidth: '180px' }} data-testid={`${prefix}-label-${i}`}>
            {p.label}
          </Label>
          <Input
            type="text"
            value={values[p.label] || p.defaultValue}
            onChange={(e) => updateValue(p.label, e.target.value)}
            className="text-sm font-mono w-28"
            data-testid={`${prefix}-input-${i}`}
          />
          {p.unit && <span className="text-xs text-muted-foreground whitespace-nowrap">{p.unit}</span>}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-3 px-4 flex flex-row items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">CIP</Badge>
                <CardTitle className="text-sm" data-testid="text-cip-tubes-title">Cold Interpass Tube Geometry</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {renderParamGrid(CIP_TUBE_PARAMS, "cip-tube", 2)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4 flex flex-row items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">HIP</Badge>
                <CardTitle className="text-sm" data-testid="text-hip-tubes-title">Hot Interpass Tube Geometry</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {renderParamGrid(HIP_TUBE_PARAMS, "hip-tube", 2)}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm" data-testid="text-valve-cv-title">Valve Cv Maximums</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {renderParamGrid(VALVE_CV_PARAMS, "valve-cv")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm" data-testid="text-general-title">General Parameters</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {renderParamGrid(GENERAL_PARAMS, "general")}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-3 px-4 flex flex-row items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">CIP</Badge>
                <CardTitle className="text-sm" data-testid="text-cip-ht-title">CIP Heat Transfer Coefficients</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {renderParamGrid(CIP_HT_COEFF_PARAMS, "cip-ht", 2)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4 flex flex-row items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">HIP</Badge>
                <CardTitle className="text-sm" data-testid="text-hip-ht-title">HIP Heat Transfer Coefficients</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {renderParamGrid(HIP_HT_COEFF_PARAMS, "hip-ht", 2)}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
