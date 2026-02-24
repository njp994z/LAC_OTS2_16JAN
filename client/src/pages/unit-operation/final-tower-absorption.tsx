import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Factory, Play, Pause, RotateCcw, Loader2, Code, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import expLogo from "@/assets/exp-logo.png";

interface AcidInputs {
  x_H2SO4_AF0: string;
  x_H2O_AF0: string;
  m_Total_AF0: string;
  Pressure_AF0: string;
  Temp_AF0: string;
  Flow_AF0: string;
}

interface AcidOutputs {
  x_H2SO4_AFX1: string;
  x_H2SO4_AF1: string;
  x_H2O_AFX1: string;
  x_H2O_AF1: string;
  m_Total_AFX1: string;
  m_Total_AF1: string;
  Pressure_AFX1: string;
  Pressure_AF1: string;
  Temp_AFX1: string;
  Temp_AF1: string;
  Flow_AFX1: string;
  Flow_AF1: string;
}

interface GasInputs {
  SO2_GF0: string;
  SO3_GF0: string;
  O2_GF0: string;
  N2_GF0: string;
  H2O_GF0: string;
  H2SO4_GF0: string;
  TOTAL_GF0: string;
  PRESSURE_GF0: string;
  TEMPERATURE_GF0: string;
}

interface GasOutputs {
  SO2_GFX1: string;
  SO2_GF1: string;
  SO3_GFX1: string;
  SO3_GF1: string;
  O2_GFX1: string;
  O2_GF1: string;
  N2_GFX1: string;
  N2_GF1: string;
  H2O_GFX1: string;
  H2O_GF1: string;
  H2SO4_GFX1: string;
  H2SO4_GF1: string;
  TOTAL_GFX1: string;
  TOTAL_GF1: string;
  PRESSURE_GFX1: string;
  PRESSURE_GF1: string;
  TEMPERATURE_GFX1: string;
  TEMPERATURE_GF1: string;
}

interface SystemParams {
  Tower_Diameter_ft: string;
  Packing_Depth_ft: string;
  dP_BME_inWC: string;
  Barometric_P_psia: string;
  Weather_ZIP_Code: string;
}

interface DynamicParams {
  tau: string;
  dt: string;
}

export default function FinalTowerAbsorption() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"Static" | "Dynamic">("Static");
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [isRunningDynamic, setIsRunningDynamic] = useState(false);
  const isRunningDynamicRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentFlowRef = useRef<number>(0);

  const [acidInputs, setAcidInputs] = useState<AcidInputs>({
    x_H2SO4_AF0: "0.985",
    x_H2O_AF0: "0.015",
    m_Total_AF0: "44.583",
    Pressure_AF0: "2",
    Temp_AF0: "180",
    Flow_AF0: "3000",
  });

  const [acidOutputs, setAcidOutputs] = useState<AcidOutputs>({
    x_H2SO4_AFX1: "---",
    x_H2SO4_AF1: "---",
    x_H2O_AFX1: "---",
    x_H2O_AF1: "---",
    m_Total_AFX1: "---",
    m_Total_AF1: "---",
    Pressure_AFX1: "---",
    Pressure_AF1: "---",
    Temp_AFX1: "200",
    Temp_AF1: "200",
    Flow_AFX1: "---",
    Flow_AF1: "---",
  });

  const [gasInputs, setGasInputs] = useState<GasInputs>({
    SO2_GF0: "18",
    SO3_GF0: "462",
    O2_GF0: "4069",
    N2_GF0: "86808",
    H2O_GF0: "0",
    H2SO4_GF0: "0",
    TOTAL_GF0: "91357",
    PRESSURE_GF0: "32",
    TEMPERATURE_GF0: "275",
  });

  const [gasOutputs, setGasOutputs] = useState<GasOutputs>({
    SO2_GFX1: "---",
    SO2_GF1: "---",
    SO3_GFX1: "---",
    SO3_GF1: "---",
    O2_GFX1: "---",
    O2_GF1: "---",
    N2_GFX1: "---",
    N2_GF1: "---",
    H2O_GFX1: "---",
    H2O_GF1: "---",
    H2SO4_GFX1: "---",
    H2SO4_GF1: "---",
    TOTAL_GFX1: "---",
    TOTAL_GF1: "---",
    PRESSURE_GFX1: "---",
    PRESSURE_GF1: "---",
    TEMPERATURE_GFX1: "---",
    TEMPERATURE_GF1: "---",
  });

  const [systemParams, setSystemParams] = useState<SystemParams>({
    Tower_Diameter_ft: "21.0",
    Packing_Depth_ft: "8.0",
    dP_BME_inWC: "12.0",
    Barometric_P_psia: "14.3",
    Weather_ZIP_Code: "89801",
  });

  const [dynamicParams, setDynamicParams] = useState<DynamicParams>({
    tau: "6.0",
    dt: "0.5",
  });

  const formatValue = (value: number | string | null | undefined, decimals: number = 1): string => {
    if (value === null || value === undefined || value === "---") return "---";
    const numVal = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numVal)) return "---";
    if (Math.abs(numVal) >= 10000) return numVal.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return numVal.toFixed(decimals);
  };

  const runCalculation = useCallback(async () => {
    setIsRunningSimulation(true);
    try {
      const response = await apiRequest('POST', '/api/fat-calc', {
        x_H2SO4_AF0: parseFloat(acidInputs.x_H2SO4_AF0) || 0,
        x_H2O_AF0: parseFloat(acidInputs.x_H2O_AF0) || 0,
        m_Total_AF0: parseFloat(acidInputs.m_Total_AF0) || 0,
        Pressure_AF0: parseFloat(acidInputs.Pressure_AF0) || 0,
        Temp_AF0: parseFloat(acidInputs.Temp_AF0) || 180,
        Flow_AF0: parseFloat(acidInputs.Flow_AF0) || 0,
        Tower_Diameter_ft: parseFloat(systemParams.Tower_Diameter_ft) || 28.0,
        Packing_Depth_ft: parseFloat(systemParams.Packing_Depth_ft) || 12.0,
        dP_BME_inWC: parseFloat(systemParams.dP_BME_inWC) || 6.0,
        Barometric_P_psia: parseFloat(systemParams.Barometric_P_psia) || 14.3,
        SO2_GF0: parseFloat(gasInputs.SO2_GF0) || 0,
        SO3_GF0: parseFloat(gasInputs.SO3_GF0) || 0,
        O2_GF0: parseFloat(gasInputs.O2_GF0) || 0,
        N2_GF0: parseFloat(gasInputs.N2_GF0) || 0,
        H2O_GF0: parseFloat(gasInputs.H2O_GF0) || 0,
        H2SO4_GF0: parseFloat(gasInputs.H2SO4_GF0) || 0,
        TOTAL_GF0: parseFloat(gasInputs.TOTAL_GF0) || 0,
        PRESSURE_GF0: parseFloat(gasInputs.PRESSURE_GF0) || 0,
        TEMPERATURE_GF0: parseFloat(gasInputs.TEMPERATURE_GF0) || 0,
      });

      const data = await response.json();

      if (data.error) {
        toast({
          title: "Calculation Error",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      setAcidOutputs({
        x_H2SO4_AFX1: formatValue(data.x_H2SO4_AFX1, 4),
        x_H2SO4_AF1: formatValue(data.x_H2SO4_AF1, 4),
        x_H2O_AFX1: formatValue(data.x_H2O_AFX1, 4),
        x_H2O_AF1: formatValue(data.x_H2O_AF1, 4),
        m_Total_AFX1: formatValue(data.m_Total_AFX1, 1),
        m_Total_AF1: formatValue(data.m_Total_AF1, 1),
        Pressure_AFX1: formatValue(data.Pressure_AFX1, 1),
        Pressure_AF1: formatValue(data.Pressure_AF1, 1),
        Temp_AFX1: formatValue(data.Temp_AFX1, 0),
        Temp_AF1: formatValue(data.Temp_AF1, 0),
        Flow_AFX1: formatValue(data.Flow_AFX1, 1),
        Flow_AF1: formatValue(data.Flow_AF1, 1),
      });

      setGasOutputs({
        SO2_GFX1: formatValue(data.SO2_GFX1, 0),
        SO2_GF1: formatValue(data.SO2_GF1, 0),
        SO3_GFX1: formatValue(data.SO3_GFX1, 0),
        SO3_GF1: formatValue(data.SO3_GF1, 0),
        O2_GFX1: formatValue(data.O2_GFX1, 0),
        O2_GF1: formatValue(data.O2_GF1, 0),
        N2_GFX1: formatValue(data.N2_GFX1, 0),
        N2_GF1: formatValue(data.N2_GF1, 0),
        H2O_GFX1: formatValue(data.H2O_GFX1, 0),
        H2O_GF1: formatValue(data.H2O_GF1, 0),
        H2SO4_GFX1: formatValue(data.H2SO4_GFX1, 0),
        H2SO4_GF1: formatValue(data.H2SO4_GF1, 0),
        TOTAL_GFX1: formatValue(data.TOTAL_GFX1, 0),
        TOTAL_GF1: formatValue(data.TOTAL_GF1, 0),
        PRESSURE_GFX1: formatValue(data.PRESSURE_GFX1, 1),
        PRESSURE_GF1: formatValue(data.PRESSURE_GF1, 1),
        TEMPERATURE_GFX1: formatValue(data.TEMPERATURE_GFX1, 0),
        TEMPERATURE_GF1: formatValue(data.TEMPERATURE_GF1, 0),
      });

      if (!isRunningDynamic) {
        toast({
          title: "Calculation Complete",
          description: `SO₃ Absorption Efficiency: ${formatValue(data.efficiency * 100, 1)}%`
        });
      }
    } catch (error) {
      console.error('Calculation error:', error);
      toast({
        title: "Calculation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRunningSimulation(false);
    }
  }, [acidInputs, gasInputs, systemParams, toast, isRunningDynamic]);

  const startDynamic = () => {
    if (isRunningDynamicRef.current) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsRunningDynamic(true);
    isRunningDynamicRef.current = true;
    currentFlowRef.current = parseFloat(acidInputs.Flow_AF0) || 0;

    const updateDynamic = async () => {
      if (!isRunningDynamicRef.current) return;

      const target = 1500.0;
      const tau = parseFloat(dynamicParams.tau) || 6.0;
      const dt = parseFloat(dynamicParams.dt) || 0.5;

      currentFlowRef.current += (target - currentFlowRef.current) * (1 - Math.exp(-dt / tau));

      setAcidInputs(prev => ({
        ...prev,
        Flow_AF0: currentFlowRef.current.toFixed(1)
      }));

      await runCalculation();

      if (isRunningDynamicRef.current) {
        timerRef.current = setTimeout(updateDynamic, Math.max(dt * 1000, 100));
      }
    };

    updateDynamic();
  };

  const pauseDynamic = () => {
    setIsRunningDynamic(false);
    isRunningDynamicRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetDynamic = () => {
    pauseDynamic();
    currentFlowRef.current = 0;
    setAcidInputs(prev => ({ ...prev, Flow_AF0: "0" }));
    runCalculation();
  };

  // No longer needed: sequential update handled in startDynamic
  /*
  useEffect(() => {
    if (isRunningDynamic) {
      runCalculation();
    }
  }, [acidInputs.Flow_AF0, isRunningDynamic, runCalculation]);
  */

  useEffect(() => {
    if (mode === "Static" && isRunningDynamic) {
      pauseDynamic();
    }
  }, [mode]);

  // In Static mode, keep TEMPERATURE_GF0 in sync with acid inlet temperature (Temp_AF0)
  useEffect(() => {
    if (mode === "Static") {
      setGasInputs(prev => ({ ...prev, TEMPERATURE_GF0: acidInputs.Temp_AF0 }));
    }
  }, [acidInputs.Temp_AF0, mode]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const acidRows = [
    { param: "x_H2SO4", unit: "", inputKey: "x_H2SO4_AF0", outputKey1: "x_H2SO4_AFX1", outputKey2: "x_H2SO4_AF1" },
    { param: "x_H2O", unit: "", inputKey: "x_H2O_AF0", outputKey1: "x_H2O_AFX1", outputKey2: "x_H2O_AF1" },
    { param: "m_Total", unit: "Klb/hr", inputKey: "m_Total_AF0", outputKey1: "m_Total_AFX1", outputKey2: "m_Total_AF1" },
    { param: "Pressure", unit: "psig", inputKey: "Pressure_AF0", outputKey1: "Pressure_AFX1", outputKey2: "Pressure_AF1" },
    { param: "Temp.", unit: "F", inputKey: "Temp_AF0", outputKey1: "Temp_AFX1", outputKey2: "Temp_AF1" },
    { param: "Flow", unit: "gpm", inputKey: "Flow_AF0", outputKey1: "Flow_AFX1", outputKey2: "Flow_AF1" },
  ];

  const gasRows = [
    { param: "SO2", unit: "scfm", inputKey: "SO2_GF0", packingKey: "SO2_GFX1", outputKey: "SO2_GF1" },
    // { param: "SO3", unit: "scfm", inputKey: "SO3_GF0", packingKey: "SO3_GFX1", outputKey: "SO3_GF1" },
    { param: "O2", unit: "scfm", inputKey: "O2_GF0", packingKey: "O2_GFX1", outputKey: "O2_GF1" },
    { param: "N2", unit: "scfm", inputKey: "N2_GF0", packingKey: "N2_GFX1", outputKey: "N2_GF1" },
    { param: "H2O", unit: "scfm", inputKey: "H2O_GF0", packingKey: "H2O_GFX1", outputKey: "H2O_GF1" },
    { param: "H2SO4", unit: "scfm", inputKey: "H2SO4_GF0", packingKey: "H2SO4_GFX1", outputKey: "H2SO4_GF1" },
    { param: "TOTAL", unit: "scfm", inputKey: "TOTAL_GF0", packingKey: "TOTAL_GFX1", outputKey: "TOTAL_GF1" },
    { param: "PRESSURE", unit: "in. wc.", inputKey: "PRESSURE_GF0", packingKey: "PRESSURE_GFX1", outputKey: "PRESSURE_GF1" },
    { param: "TEMPERATURE", unit: "F", inputKey: "TEMPERATURE_GF0", packingKey: "TEMPERATURE_GFX1", outputKey: "TEMPERATURE_GF1" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-[9999] border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-2">
            <Link href="/unit-operation/final-tower-absorption/python-code" data-testid="link-python-code">
              <Button variant="outline" size="sm">
                <Code className="h-4 w-4 mr-2" />
                View Python Code
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Factory className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground" data-testid="text-page-title">Final Absorption Tower (FAT)</h1>
              <p className="text-muted-foreground mt-1" data-testid="text-page-description">
                Capture remaining SO₃ to achieve final product specifications and emission limits
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Simulation Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={mode}
                  onValueChange={(value) => setMode(value as "Static" | "Dynamic")}
                  className="flex gap-8"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Static" id="static" data-testid="radio-static" />
                    <Label htmlFor="static">Static Calculation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Dynamic" id="dynamic" data-testid="radio-dynamic" />
                    <Label htmlFor="dynamic">Dynamic Simulation</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Acid Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium"></th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Units</th>
                        <th className="text-center py-2 px-2 font-medium">
                          <div>Tower Acid Inlet</div>
                          <div className="text-xs text-muted-foreground font-normal">AF0</div>
                        </th>
                        <th className="text-center py-2 px-2 font-medium">
                          <div>Acid Packing Outlet</div>
                          <div className="text-xs text-muted-foreground font-normal">AFX1</div>
                        </th>
                        <th className="text-center py-2 px-2 font-medium">
                          <div>Tower Acid Outlet</div>
                          <div className="text-xs text-muted-foreground font-normal">AF1</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {acidRows.map((row) => (
                        <tr key={row.param} className="border-b border-border/50">
                          <td className="py-2 px-2 font-medium">{row.param}</td>
                          <td className="py-2 px-2 text-muted-foreground">{row.unit}</td>
                          <td className="py-2 px-2">
                            <Input
                              type="number"
                              step="any"
                              className="w-24 h-8 text-center mx-auto"
                              value={acidInputs[row.inputKey as keyof AcidInputs]}
                              onChange={(e) => setAcidInputs(prev => ({ ...prev, [row.inputKey]: e.target.value }))}
                              data-testid={`input-${row.inputKey}`}
                            />
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {acidOutputs[row.outputKey1 as keyof AcidOutputs]}
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {acidOutputs[row.outputKey2 as keyof AcidOutputs]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">System Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <Label className="text-xs">Tower Diameter (ft)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-8"
                      value={systemParams.Tower_Diameter_ft}
                      onChange={(e) => setSystemParams(prev => ({ ...prev, Tower_Diameter_ft: e.target.value }))}
                      data-testid="input-tower-diameter"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Packing Depth (ft)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-8"
                      value={systemParams.Packing_Depth_ft}
                      onChange={(e) => setSystemParams(prev => ({ ...prev, Packing_Depth_ft: e.target.value }))}
                      data-testid="input-packing-depth"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">dP BME at Design (IN WC)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-8"
                      value={systemParams.dP_BME_inWC}
                      onChange={(e) => setSystemParams(prev => ({ ...prev, dP_BME_inWC: e.target.value }))}
                      data-testid="input-dp-bme"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Barometric P (psia)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-8"
                      value={systemParams.Barometric_P_psia}
                      onChange={(e) => setSystemParams(prev => ({ ...prev, Barometric_P_psia: e.target.value }))}
                      data-testid="input-barometric"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Weather ZIP Code</Label>
                    <Input
                      type="text"
                      className="h-8"
                      value={systemParams.Weather_ZIP_Code}
                      onChange={(e) => setSystemParams(prev => ({ ...prev, Weather_ZIP_Code: e.target.value }))}
                      data-testid="input-zip-code"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Gas Parameters - {mode} Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium"></th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Units</th>
                        <th className="text-center py-2 px-2 font-medium">
                          <div>Tower Inlet</div>
                          <div className="text-xs text-muted-foreground font-normal">From Final Converter Pass</div>
                          <div className="text-xs text-muted-foreground font-normal">GF0</div>
                        </th>
                        <th className="text-center py-2 px-2 font-medium">
                          <div>Packing Outlet</div>
                          <div className="text-xs text-muted-foreground font-normal">GFX1</div>
                        </th>
                        <th className="text-center py-2 px-2 font-medium">
                          <div>Tower Outlet</div>
                          <div className="text-xs text-muted-foreground font-normal">To Stack</div>
                          <div className="text-xs text-muted-foreground font-normal">GF1</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {gasRows.map((row) => (
                        <tr key={row.param} className="border-b border-border/50">
                          <td className="py-2 px-2 font-medium">{row.param}</td>
                          <td className="py-2 px-2 text-muted-foreground">{row.unit}</td>
                          <td className="py-2 px-2">
                            <Input
                              type="number"
                              step="any"
                              className="w-24 h-8 text-center mx-auto"
                              value={gasInputs[row.inputKey as keyof GasInputs]}
                              onChange={(e) => setGasInputs(prev => ({ ...prev, [row.inputKey]: e.target.value }))}
                              data-testid={`input-${row.inputKey}`}
                            />
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {gasOutputs[row.packingKey as keyof GasOutputs]}
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {gasOutputs[row.outputKey as keyof GasOutputs]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {mode === "Dynamic" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Dynamic Parameters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs">Time Constant τ (sec)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        className="h-8"
                        value={dynamicParams.tau}
                        onChange={(e) => setDynamicParams(prev => ({ ...prev, tau: e.target.value }))}
                        data-testid="input-tau"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Time Step dt (sec)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        className="h-8"
                        value={dynamicParams.dt}
                        onChange={(e) => setDynamicParams(prev => ({ ...prev, dt: e.target.value }))}
                        data-testid="input-dt"
                      />
                    </div>
                    <div className="flex items-end gap-2 col-span-2">
                      <Button
                        onClick={startDynamic}
                        disabled={isRunningDynamic}
                        className="gap-2"
                        data-testid="button-start"
                      >
                        <Play className="h-4 w-4" />
                        Start
                      </Button>
                      <Button
                        onClick={pauseDynamic}
                        disabled={!isRunningDynamic}
                        variant="outline"
                        className="gap-2"
                        data-testid="button-pause"
                      >
                        <Pause className="h-4 w-4" />
                        Pause
                      </Button>
                      <Button
                        onClick={resetDynamic}
                        variant="outline"
                        className="gap-2"
                        data-testid="button-reset"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {mode === "Static" && (
              <div className="flex justify-center">
                <Button
                  onClick={runCalculation}
                  disabled={isRunningSimulation}
                  size="lg"
                  className="gap-2 min-w-[200px]"
                  data-testid="button-run-simulation"
                >
                  {isRunningSimulation ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5" />
                      Run Simulation
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
