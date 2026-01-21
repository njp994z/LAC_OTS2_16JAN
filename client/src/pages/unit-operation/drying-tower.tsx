import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Droplets, Play, Pause, RotateCcw, Loader2, Code, Calculator, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AcidInputs {
  x_H2SO4_AD0: string;
  x_H2O_AD0: string;
  m_Total_AD0: string;
  Pressure_AD0: string;
  Temp_AD0: string;
  Flow_AD0: string;
}

interface AcidOutputs {
  x_H2SO4_ADX1: string;
  x_H2SO4_AD1: string;
  x_H2O_ADX1: string;
  x_H2O_AD1: string;
  m_Total_ADX1: string;
  m_Total_AD1: string;
  Pressure_ADX1: string;
  Pressure_AD1: string;
  Temp_ADX1: string;
  Temp_AD1: string;
  Flow_ADX1: string;
  Flow_AD1: string;
}

interface GasInputs {
  SO2_GD0: string;
  SO3_GD0: string;
  O2_GD0: string;
  N2_GD0: string;
  H2O_GD0: string;
  H2SO4_GD0: string;
  TOTAL_GD0: string;
  PRESSURE_GD0: string;
  TEMPERATURE_GD0: string;
}

interface GasOutputs {
  SO2_Packing: string;
  SO2_GD1: string;
  SO3_Packing: string;
  SO3_GD1: string;
  O2_Packing: string;
  O2_GD1: string;
  N2_Packing: string;
  N2_GD1: string;
  H2O_Packing: string;
  H2O_GD1: string;
  H2SO4_Packing: string;
  H2SO4_GD1: string;
  TOTAL_Packing: string;
  TOTAL_GD1: string;
  PRESSURE_Packing: string;
  PRESSURE_GD1: string;
  TEMPERATURE_Packing: string;
  TEMPERATURE_GD1: string;
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

export default function DryingTower() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"Static" | "Dynamic">("Static");
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [isRunningDynamic, setIsRunningDynamic] = useState(false);
  const dynamicIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentFlowRef = useRef<number>(0);

  const [acidInputs, setAcidInputs] = useState<AcidInputs>({
    x_H2SO4_AD0: "0.985",
    x_H2O_AD0: "0.015",
    m_Total_AD0: "0",
    Pressure_AD0: "10",
    Temp_AD0: "150",
    Flow_AD0: "3500",
  });

  const [acidOutputs, setAcidOutputs] = useState<AcidOutputs>({
    x_H2SO4_ADX1: "---",
    x_H2SO4_AD1: "---",
    x_H2O_ADX1: "---",
    x_H2O_AD1: "---",
    m_Total_ADX1: "---",
    m_Total_AD1: "---",
    Pressure_ADX1: "---",
    Pressure_AD1: "---",
    Temp_ADX1: "275",
    Temp_AD1: "275",
    Flow_ADX1: "---",
    Flow_AD1: "---",
  });

  const [gasInputs, setGasInputs] = useState<GasInputs>({
    SO2_GD0: "0",
    SO3_GD0: "0",
    O2_GD0: "23003",
    N2_GD0: "868080",
    H2O_GD0: "1999",
    H2SO4_GD0: "0",
    TOTAL_GD0: "111809",
    PRESSURE_GD0: "-3",
    TEMPERATURE_GD0: "93",
  });

  const [gasOutputs, setGasOutputs] = useState<GasOutputs>({
    SO2_Packing: "---",
    SO2_GD1: "---",
    SO3_Packing: "---",
    SO3_GD1: "---",
    O2_Packing: "---",
    O2_GD1: "---",
    N2_Packing: "---",
    N2_GD1: "---",
    H2O_Packing: "---",
    H2O_GD1: "---",
    H2SO4_Packing: "---",
    H2SO4_GD1: "---",
    TOTAL_Packing: "---",
    TOTAL_GD1: "---",
    PRESSURE_Packing: "---",
    PRESSURE_GD1: "---",
    TEMPERATURE_Packing: "---",
    TEMPERATURE_GD1: "---",
  });

  const [systemParams, setSystemParams] = useState<SystemParams>({
    Tower_Diameter_ft: "23.5",
    Packing_Depth_ft: "8.0",
    dP_BME_inWC: "5.0",
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
      const response = await apiRequest('POST', '/api/drying-tower-calc', {
        x_H2SO4_AD0: parseFloat(acidInputs.x_H2SO4_AD0) || 0,
        x_H2O_AD0: parseFloat(acidInputs.x_H2O_AD0) || 0,
        m_Total_AD0: parseFloat(acidInputs.m_Total_AD0) || 0,
        Pressure_AD0: parseFloat(acidInputs.Pressure_AD0) || 0,
        Temp_AD0: parseFloat(acidInputs.Temp_AD0) || 275,
        Flow_AD0: parseFloat(acidInputs.Flow_AD0) || 0,
        Tower_Diameter_ft: parseFloat(systemParams.Tower_Diameter_ft) || 23.5,
        Packing_Depth_ft: parseFloat(systemParams.Packing_Depth_ft) || 8.0,
        dP_BME_inWC: parseFloat(systemParams.dP_BME_inWC) || 5.0,
        Barometric_P_psia: parseFloat(systemParams.Barometric_P_psia) || 14.3,
        SO2_GD0: parseFloat(gasInputs.SO2_GD0) || 0,
        SO3_GD0: parseFloat(gasInputs.SO3_GD0) || 0,
        O2_GD0: parseFloat(gasInputs.O2_GD0) || 0,
        N2_GD0: parseFloat(gasInputs.N2_GD0) || 0,
        H2O_GD0: parseFloat(gasInputs.H2O_GD0) || 0,
        H2SO4_GD0: parseFloat(gasInputs.H2SO4_GD0) || 0,
        TOTAL_GD0: parseFloat(gasInputs.TOTAL_GD0) || 0,
        PRESSURE_GD0: parseFloat(gasInputs.PRESSURE_GD0) || 0,
        TEMPERATURE_GD0: parseFloat(gasInputs.TEMPERATURE_GD0) || 0,
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
        x_H2SO4_ADX1: formatValue(data.x_H2SO4_ADX1, 4),
        x_H2SO4_AD1: formatValue(data.x_H2SO4_AD1, 4),
        x_H2O_ADX1: formatValue(data.x_H2O_ADX1, 4),
        x_H2O_AD1: formatValue(data.x_H2O_AD1, 4),
        m_Total_ADX1: formatValue(data.m_Total_ADX1, 1),
        m_Total_AD1: formatValue(data.m_Total_AD1, 1),
        Pressure_ADX1: formatValue(data.Pressure_ADX1, 1),
        Pressure_AD1: formatValue(data.Pressure_AD1, 1),
        Temp_ADX1: formatValue(data.Temp_ADX1, 0),
        Temp_AD1: formatValue(data.Temp_AD1, 0),
        Flow_ADX1: formatValue(data.Flow_ADX1, 1),
        Flow_AD1: formatValue(data.Flow_AD1, 1),
      });

      setGasOutputs({
        SO2_Packing: formatValue(data.SO2_Packing, 0),
        SO2_GD1: formatValue(data.SO2_GD1, 0),
        SO3_Packing: formatValue(data.SO3_Packing, 0),
        SO3_GD1: formatValue(data.SO3_GD1, 0),
        O2_Packing: formatValue(data.O2_Packing, 0),
        O2_GD1: formatValue(data.O2_GD1, 0),
        N2_Packing: formatValue(data.N2_Packing, 0),
        N2_GD1: formatValue(data.N2_GD1, 0),
        H2O_Packing: formatValue(data.H2O_Packing, 0),
        H2O_GD1: formatValue(data.H2O_GD1, 0),
        H2SO4_Packing: formatValue(data.H2SO4_Packing, 0),
        H2SO4_GD1: formatValue(data.H2SO4_GD1, 0),
        TOTAL_Packing: formatValue(data.TOTAL_Packing, 0),
        TOTAL_GD1: formatValue(data.TOTAL_GD1, 0),
        PRESSURE_Packing: formatValue(data.PRESSURE_Packing, 1),
        PRESSURE_GD1: formatValue(data.PRESSURE_GD1, 1),
        TEMPERATURE_Packing: formatValue(data.TEMPERATURE_Packing, 0),
        TEMPERATURE_GD1: formatValue(data.TEMPERATURE_GD1, 0),
      });

      if (!isRunningDynamic) {
        toast({
          title: "Calculation Complete",
          description: `Efficiency: ${formatValue(data.efficiency * 100, 1)}%`
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
    if (isRunningDynamic) return;
    
    if (dynamicIntervalRef.current) {
      clearInterval(dynamicIntervalRef.current);
      dynamicIntervalRef.current = null;
    }
    
    setIsRunningDynamic(true);
    currentFlowRef.current = parseFloat(acidInputs.Flow_AD0) || 0;
    
    const updateDynamic = () => {
      const target = 1200.0;
      const tau = parseFloat(dynamicParams.tau) || 6.0;
      const dt = parseFloat(dynamicParams.dt) || 0.5;
      
      currentFlowRef.current += (target - currentFlowRef.current) * (1 - Math.exp(-dt / tau));
      
      setAcidInputs(prev => ({
        ...prev,
        Flow_AD0: currentFlowRef.current.toFixed(1)
      }));
    };
    
    updateDynamic();
    dynamicIntervalRef.current = setInterval(updateDynamic, (parseFloat(dynamicParams.dt) || 0.5) * 1000);
  };

  const pauseDynamic = () => {
    setIsRunningDynamic(false);
    if (dynamicIntervalRef.current) {
      clearInterval(dynamicIntervalRef.current);
      dynamicIntervalRef.current = null;
    }
  };

  const resetDynamic = () => {
    pauseDynamic();
    currentFlowRef.current = 0;
    setAcidInputs(prev => ({ ...prev, Flow_AD0: "0" }));
    runCalculation();
  };

  useEffect(() => {
    if (isRunningDynamic) {
      runCalculation();
    }
  }, [acidInputs.Flow_AD0, isRunningDynamic, runCalculation]);

  useEffect(() => {
    if (mode === "Static" && isRunningDynamic) {
      pauseDynamic();
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      if (dynamicIntervalRef.current) {
        clearInterval(dynamicIntervalRef.current);
      }
    };
  }, []);

  const acidRows = [
    { param: "x_H2SO4", unit: "", inputKey: "x_H2SO4_AD0", outputKey1: "x_H2SO4_ADX1", outputKey2: "x_H2SO4_AD1" },
    { param: "x_H2O", unit: "", inputKey: "x_H2O_AD0", outputKey1: "x_H2O_ADX1", outputKey2: "x_H2O_AD1" },
    { param: "m_Total", unit: "Klb/hr", inputKey: "m_Total_AD0", outputKey1: "m_Total_ADX1", outputKey2: "m_Total_AD1" },
    { param: "Pressure", unit: "psig", inputKey: "Pressure_AD0", outputKey1: "Pressure_ADX1", outputKey2: "Pressure_AD1" },
    { param: "Temp.", unit: "F", inputKey: "Temp_AD0", outputKey1: "Temp_ADX1", outputKey2: "Temp_AD1" },
    { param: "Flow", unit: "gpm", inputKey: "Flow_AD0", outputKey1: "Flow_ADX1", outputKey2: "Flow_AD1" },
  ];

  const gasRows = [
    { param: "SO2", unit: "scfm", inputKey: "SO2_GD0", packingKey: "SO2_Packing", outputKey: "SO2_GD1" },
    { param: "SO3", unit: "scfm", inputKey: "SO3_GD0", packingKey: "SO3_Packing", outputKey: "SO3_GD1" },
    { param: "O2", unit: "scfm", inputKey: "O2_GD0", packingKey: "O2_Packing", outputKey: "O2_GD1" },
    { param: "N2", unit: "scfm", inputKey: "N2_GD0", packingKey: "N2_Packing", outputKey: "N2_GD1" },
    { param: "H2O", unit: "scfm", inputKey: "H2O_GD0", packingKey: "H2O_Packing", outputKey: "H2O_GD1" },
    { param: "H2SO4", unit: "scfm", inputKey: "H2SO4_GD0", packingKey: "H2SO4_Packing", outputKey: "H2SO4_GD1" },
    { param: "TOTAL", unit: "scfm", inputKey: "TOTAL_GD0", packingKey: "TOTAL_Packing", outputKey: "TOTAL_GD1" },
    { param: "PRESSURE", unit: "in. wc.", inputKey: "PRESSURE_GD0", packingKey: "PRESSURE_Packing", outputKey: "PRESSURE_GD1" },
    { param: "TEMPERATURE", unit: "F", inputKey: "TEMPERATURE_GD0", packingKey: "TEMPERATURE_Packing", outputKey: "TEMPERATURE_GD1" },
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
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-python-code-dropdown">
                  <Code className="h-4 w-4 mr-2" />
                  View Python Code
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/unit-operation/drying-tower/python-code" data-testid="link-drying-tower-python">
                    Drying Tower Python Code
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/unit-operation/main-compressor/python-code" data-testid="link-compressor-python">
                    Main Compressor Python Code
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Droplets className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground" data-testid="text-page-title">Drying Tower Simulator</h1>
              <p className="text-muted-foreground mt-1" data-testid="text-page-description">
                Sulfuric acid drying tower mass and energy balance simulation
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
                          <div className="text-xs text-muted-foreground font-normal">AD0</div>
                        </th>
                        <th className="text-center py-2 px-2 font-medium">
                          <div>Acid Packing Outlet</div>
                          <div className="text-xs text-muted-foreground font-normal">ADX1</div>
                        </th>
                        <th className="text-center py-2 px-2 font-medium">
                          <div>Tower Acid Outlet</div>
                          <div className="text-xs text-muted-foreground font-normal">AD1</div>
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
                <CardTitle className="text-lg">Simulation Outputs - {mode} Mode</CardTitle>
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
                          <div className="text-xs text-muted-foreground font-normal">1520-PI-5801</div>
                          <div className="text-xs text-muted-foreground font-normal">GD0</div>
                        </th>
                        <th className="text-center py-2 px-2 font-medium">
                          <div>Packing Outlet</div>
                        </th>
                        <th className="text-center py-2 px-2 font-medium">
                          <div>Tower Outlet</div>
                          <div className="text-xs text-muted-foreground font-normal">1520-PI-5804</div>
                          <div className="text-xs text-muted-foreground font-normal">GD1</div>
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
                      <Label className="text-xs">Time Constant (s)</Label>
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
                      <Label className="text-xs">Timestep dt (s)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        className="h-8"
                        value={dynamicParams.dt}
                        onChange={(e) => setDynamicParams(prev => ({ ...prev, dt: e.target.value }))}
                        data-testid="input-dt"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3 justify-center">
              <Button 
                onClick={runCalculation} 
                disabled={isRunningSimulation || isRunningDynamic}
                data-testid="button-calculate"
              >
                {isRunningSimulation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate
                  </>
                )}
              </Button>
              
              {mode === "Dynamic" && (
                <>
                  <Button 
                    onClick={startDynamic} 
                    disabled={isRunningDynamic}
                    variant="outline"
                    data-testid="button-start-dynamic"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Dynamic
                  </Button>
                  <Button 
                    onClick={pauseDynamic} 
                    disabled={!isRunningDynamic}
                    variant="outline"
                    data-testid="button-pause"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button 
                    onClick={resetDynamic}
                    variant="outline"
                    data-testid="button-reset"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
