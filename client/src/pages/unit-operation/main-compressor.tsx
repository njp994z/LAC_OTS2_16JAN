import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Code, Play, Loader2, Calculator, Activity, Pause, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type SimulationMode = "static" | "dynamic";

interface InputParams {
  rpms: string;
  temp: string;
  pressure: string;
  barometricPressure: string;
}

interface OutputParams {
  inletFlowAcfm: string;
  inletFlowAm3hr: string;
  outletTempF: string;
  outletTempC: string;
  outletPressureInwc: string;
  outletPressureMmwg: string;
  tempRiseF: string;
  tempRiseC: string;
  pressureRiseInwc: string;
  pressureRiseMmwg: string;
  standardFlowScfm: string;
  standardFlowNm3hr: string;
  outletFlowAcfm: string;
  outletFlowAm3hr: string;
  massFlowKlbhr: string;
  massFlowMThr: string;
  isentropicHeadFtlblb: string;
  isentropicHeadKJkg: string;
  brakePowerHp: string;
  brakePowerMW: string;
  motorPowerHp: string;
  motorPowerMW: string;
  driverSpeed: string;
}

export default function MainCompressor() {
  const { toast } = useToast();
  const [mode, setMode] = useState<SimulationMode>("static");
  const [realtimeBarometric, setRealtimeBarometric] = useState<string>("no");
  const [isLoadingBarometric, setIsLoadingBarometric] = useState(false);
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  
  // Mode-specific state
  const [hicPercent, setHicPercent] = useState<string>("50.0");
  const [controllerMa, setControllerMa] = useState<number>(12.0);
  const [tauVfd, setTauVfd] = useState<string>("8.0");
  const [tauMotor, setTauMotor] = useState<string>("4.0");
  const [tauCompressor, setTauCompressor] = useState<string>("2.0");
  const [timestepDt, setTimestepDt] = useState<string>("0.5");
  const [isDynamicRunning, setIsDynamicRunning] = useState(false);
  
  const [inputParams, setInputParams] = useState<InputParams>({
    rpms: "4000",
    temp: "150",
    pressure: "-12",
    barometricPressure: "0.85"
  });

  const [outputParams, setOutputParams] = useState<OutputParams>({
    inletFlowAcfm: "---",
    inletFlowAm3hr: "---",
    outletTempF: "---",
    outletTempC: "---",
    outletPressureInwc: "---",
    outletPressureMmwg: "---",
    tempRiseF: "---",
    tempRiseC: "---",
    pressureRiseInwc: "---",
    pressureRiseMmwg: "---",
    standardFlowScfm: "---",
    standardFlowNm3hr: "---",
    outletFlowAcfm: "---",
    outletFlowAm3hr: "---",
    massFlowKlbhr: "---",
    massFlowMThr: "---",
    isentropicHeadFtlblb: "---",
    isentropicHeadKJkg: "---",
    brakePowerHp: "---",
    brakePowerMW: "---",
    motorPowerHp: "---",
    motorPowerMW: "---",
    driverSpeed: "---"
  });

  const handleInputChange = (field: keyof InputParams, value: string) => {
    setInputParams(prev => ({ ...prev, [field]: value }));
  };

  const formatValue = (value: number | null | undefined, decimals: number = 1): string => {
    if (value === null || value === undefined || isNaN(value)) return "---";
    if (Math.abs(value) >= 10000) return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (Math.abs(value) >= 100) return value.toFixed(decimals);
    return value.toFixed(decimals + 1);
  };

  const runSimulation = async () => {
    setIsRunningSimulation(true);
    try {
      const response = await apiRequest('POST', '/api/compressor-simulation', {
        rpms: inputParams.rpms,
        temp: inputParams.temp,
        pressure: inputParams.pressure,
        barometricPressure: inputParams.barometricPressure
      });
      
      const data = await response.json();
      
      if (data.success && data.results) {
        const r = data.results;
        setOutputParams({
          inletFlowAcfm: formatValue(r.inlet_flow_acfm, 0),
          inletFlowAm3hr: formatValue(r.inlet_flow_am3hr, 0),
          outletTempF: formatValue(r.outlet_temp_F, 1),
          outletTempC: formatValue(r.outlet_temp_C, 1),
          outletPressureInwc: formatValue(r.outlet_pressure_inwc, 1),
          outletPressureMmwg: formatValue(r.outlet_pressure_mmwg, 0),
          tempRiseF: formatValue(r.temp_rise_F, 1),
          tempRiseC: formatValue(r.temp_rise_C, 1),
          pressureRiseInwc: formatValue(r.pressure_rise_inwc, 1),
          pressureRiseMmwg: formatValue(r.pressure_rise_mmwg, 0),
          standardFlowScfm: formatValue(r.standard_flow_scfm, 0),
          standardFlowNm3hr: formatValue(r.standard_flow_nm3hr, 0),
          outletFlowAcfm: formatValue(r.outlet_flow_acfm, 0),
          outletFlowAm3hr: formatValue(r.outlet_flow_am3hr, 0),
          massFlowKlbhr: formatValue(r.mass_flow_klbhr, 1),
          massFlowMThr: formatValue(r.mass_flow_MThr, 1),
          isentropicHeadFtlblb: formatValue(r.isentropic_head_ftlblb, 0),
          isentropicHeadKJkg: formatValue(r.isentropic_head_kJkg, 1),
          brakePowerHp: formatValue(r.brake_power_hp, 0),
          brakePowerMW: formatValue(r.brake_power_MW, 2),
          motorPowerHp: formatValue(r.motor_power_hp, 0),
          motorPowerMW: formatValue(r.motor_power_MW, 2),
          driverSpeed: formatValue(r.driver_speed, 0)
        });
        toast({
          title: "Simulation Complete",
          description: "Compressor performance calculated successfully.",
        });
      } else {
        throw new Error(data.message || "Simulation failed");
      }
    } catch (error) {
      console.error('Simulation error:', error);
      toast({
        title: "Simulation Error",
        description: error instanceof Error ? error.message : "Failed to run compressor simulation",
        variant: "destructive",
      });
    } finally {
      setIsRunningSimulation(false);
    }
  };

  const fetchRealtimeBarometric = async () => {
    setIsLoadingBarometric(true);
    try {
      const response = await fetch('/api/psychrometrics/current?zipCode=89414&countryCode=US');
      if (!response.ok) {
        throw new Error('Failed to fetch psychrometric data');
      }
      const data = await response.json();
      const pressureHpa = data.conditions?.pressure;
      if (pressureHpa) {
        const pressureInHg = pressureHpa * 0.02953;
        const pressureAtm = pressureInHg / 29.9213;
        setInputParams(prev => ({ 
          ...prev, 
          barometricPressure: pressureAtm.toFixed(4) 
        }));
        toast({
          title: "Barometric Pressure Updated",
          description: `Live value: ${pressureAtm.toFixed(4)} ATM (from ${pressureHpa.toFixed(1)} hPa)`,
        });
      }
    } catch (error) {
      console.error('Error fetching barometric pressure:', error);
      toast({
        title: "Error",
        description: "Failed to fetch live barometric pressure. Using manual value.",
        variant: "destructive",
      });
      setRealtimeBarometric("no");
    } finally {
      setIsLoadingBarometric(false);
    }
  };

  useEffect(() => {
    if (realtimeBarometric === "yes") {
      fetchRealtimeBarometric();
    }
  }, [realtimeBarometric]);

  const handleRealtimeChange = (value: string) => {
    setRealtimeBarometric(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/unit-operation-simulator" data-testid="link-back">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <span className="font-semibold text-lg text-foreground">Lithium Americas</span>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6 text-center" data-testid="text-page-title">Compressor Block</h1>
          
          <div className="flex justify-center gap-4 mb-10">
            <a 
              href="/assets/howden-compressor-curves.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              data-testid="link-compressor-datasheet"
            >
              <Button className="gap-2" data-testid="button-compressor-datasheet">
                <FileText className="h-4 w-4" />
                Compressor Data Sheet
              </Button>
            </a>
            <Link href="/unit-operation/main-compressor/python-code" data-testid="link-python-code">
              <Button variant="default" className="gap-2" data-testid="button-python-code">
                <Code className="h-4 w-4" />
                Python code link
              </Button>
            </Link>
          </div>

          {/* Simulation Mode Selection */}
          <Card className="max-w-sm mx-auto mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                Simulation Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={mode} onValueChange={(v: SimulationMode) => setMode(v)}>
                <SelectTrigger className="w-64" data-testid="select-simulation-mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static" data-testid="select-item-static">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Static Calculation
                    </div>
                  </SelectItem>
                  <SelectItem value="dynamic" data-testid="select-item-dynamic">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Dynamic Simulation
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Common Input Parameters */}
          <Card className="max-w-sm mx-auto mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Common Input Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-24 text-right text-foreground">Temp:</span>
                  <Input
                    type="number"
                    value={inputParams.temp}
                    onChange={(e) => handleInputChange("temp", e.target.value)}
                    className="w-24 text-primary font-medium text-center"
                    placeholder="150"
                    data-testid="input-temp"
                  />
                  <span className="text-foreground">F</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-24 text-right text-foreground">Pressure:</span>
                  <Input
                    type="number"
                    value={inputParams.pressure}
                    onChange={(e) => handleInputChange("pressure", e.target.value)}
                    className="w-24 text-primary font-medium text-center"
                    placeholder="-12"
                    data-testid="input-pressure"
                  />
                  <span className="text-foreground">IN WC</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-24 text-right text-foreground whitespace-nowrap">Barometric<br/>Pressure:</span>
                  <Input
                    type="number"
                    value={inputParams.barometricPressure}
                    onChange={(e) => handleInputChange("barometricPressure", e.target.value)}
                    className="w-24 text-primary font-medium text-center"
                    placeholder="0.85"
                    disabled={realtimeBarometric === "yes"}
                    data-testid="input-barometric-pressure"
                  />
                  <span className="text-foreground">ATM</span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <span className="w-24 text-right text-foreground text-sm">Realtime<br/>Barometric:</span>
                  <Select 
                    value={realtimeBarometric} 
                    onValueChange={handleRealtimeChange}
                    disabled={isLoadingBarometric}
                  >
                    <SelectTrigger 
                      className="w-24" 
                      data-testid="select-realtime-barometric"
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes" data-testid="select-item-yes">Yes</SelectItem>
                      <SelectItem value="no" data-testid="select-item-no">No</SelectItem>
                    </SelectContent>
                  </Select>
                  {isLoadingBarometric && (
                    <span className="text-muted-foreground text-sm">Loading...</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mode-specific panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
            {/* Static Calculation Panel */}
            <Card className={mode === "static" ? "ring-2 ring-primary" : "opacity-50"}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Static Calculation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">HIC (%)</label>
                    <Input
                      type="number"
                      value={hicPercent}
                      onChange={(e) => setHicPercent(e.target.value)}
                      className="text-primary font-medium"
                      placeholder="50.0"
                      disabled={mode !== "static"}
                      data-testid="input-hic-percent"
                    />
                  </div>
                  <Button 
                    className="w-full gap-2"
                    disabled={mode !== "static"}
                    onClick={() => {
                      toast({
                        title: "Static Calculation",
                        description: `Calculating for HIC = ${hicPercent}%`,
                      });
                    }}
                    data-testid="button-calculate-static"
                  >
                    <Play className="h-4 w-4" />
                    Calculate
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Simulation Panel */}
            <Card className={mode === "dynamic" ? "ring-2 ring-primary" : "opacity-50"}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Dynamic Simulation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* PID Controller mA Display */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <label className="text-sm text-muted-foreground block mb-1">
                      PID Controller Output (mA) - Received
                    </label>
                    <div className="text-2xl font-mono text-primary" data-testid="text-controller-ma">
                      {controllerMa.toFixed(2)} <span className="text-lg text-muted-foreground">mA</span>
                    </div>
                  </div>

                  {/* Simulation Parameters */}
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Simulation Parameters</label>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">τ VFD (s)</label>
                        <Input
                          type="number"
                          value={tauVfd}
                          onChange={(e) => setTauVfd(e.target.value)}
                          className="text-primary font-medium text-center"
                          disabled={mode !== "dynamic"}
                          data-testid="input-tau-vfd"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">τ Motor (s)</label>
                        <Input
                          type="number"
                          value={tauMotor}
                          onChange={(e) => setTauMotor(e.target.value)}
                          className="text-primary font-medium text-center"
                          disabled={mode !== "dynamic"}
                          data-testid="input-tau-motor"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">τ Compressor (s)</label>
                        <Input
                          type="number"
                          value={tauCompressor}
                          onChange={(e) => setTauCompressor(e.target.value)}
                          className="text-primary font-medium text-center"
                          disabled={mode !== "dynamic"}
                          data-testid="input-tau-compressor"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Timestep dt (s)</label>
                        <Input
                          type="number"
                          value={timestepDt}
                          onChange={(e) => setTimestepDt(e.target.value)}
                          className="text-primary font-medium text-center"
                          disabled={mode !== "dynamic"}
                          data-testid="input-timestep-dt"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      className="gap-1"
                      disabled={mode !== "dynamic" || isDynamicRunning}
                      onClick={() => setIsDynamicRunning(true)}
                      data-testid="button-start-dynamic"
                    >
                      <Play className="h-4 w-4" />
                      Start
                    </Button>
                    <Button 
                      variant="secondary"
                      className="gap-1"
                      disabled={mode !== "dynamic" || !isDynamicRunning}
                      onClick={() => setIsDynamicRunning(false)}
                      data-testid="button-pause-dynamic"
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                    <Button 
                      variant="outline"
                      className="gap-1"
                      disabled={mode !== "dynamic"}
                      onClick={() => {
                        setIsDynamicRunning(false);
                        setControllerMa(4.0);
                      }}
                      data-testid="button-reset-dynamic"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            {/* Simulation Outputs - Static Mode Table */}
            <Card className="bg-card border-border max-w-4xl mx-auto">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg" data-testid="text-simulation-outputs-title">
                  Simulation Outputs - Static Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium w-32"></th>
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium w-20">Units</th>
                        <th className="text-center py-3 px-2 w-40">
                          <div className="text-primary font-medium">Compressor Inlet</div>
                          <div className="text-xs text-muted-foreground">1540-FI-4070</div>
                          <div className="text-xs text-muted-foreground">GC0</div>
                        </th>
                        <th className="text-center py-3 px-2 w-40">
                          <div className="text-primary font-medium">Compressor Outlet</div>
                          <div className="text-xs text-muted-foreground">1540-PI-4002</div>
                          <div className="text-xs text-muted-foreground">GC1</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 text-foreground font-medium">SO2</td>
                        <td className="py-3 px-2 text-muted-foreground">scfm</td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-so2-inlet">---</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-so2-outlet">---</span>
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 text-foreground font-medium">SO3</td>
                        <td className="py-3 px-2 text-muted-foreground">scfm</td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-so3-inlet">---</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-so3-outlet">---</span>
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 text-foreground font-medium">O2</td>
                        <td className="py-3 px-2 text-muted-foreground">scfm</td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-o2-inlet">---</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-o2-outlet">---</span>
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 text-foreground font-medium">N2</td>
                        <td className="py-3 px-2 text-muted-foreground">scfm</td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-n2-inlet">---</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-n2-outlet">---</span>
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 text-foreground font-medium">H2O</td>
                        <td className="py-3 px-2 text-muted-foreground">scfm</td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-h2o-inlet">---</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-h2o-outlet">---</span>
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 text-foreground font-medium">H2SO4</td>
                        <td className="py-3 px-2 text-muted-foreground">scfm</td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-h2so4-inlet">---</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-h2so4-outlet">---</span>
                        </td>
                      </tr>
                      <tr className="border-b border-border/50 bg-muted/20">
                        <td className="py-3 px-2 text-foreground font-semibold">TOTAL</td>
                        <td className="py-3 px-2 text-muted-foreground">scfm</td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-total-inlet">---</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-total-outlet">---</span>
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 text-foreground font-medium">PRESSURE</td>
                        <td className="py-3 px-2 text-muted-foreground">in. wc.</td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-pressure-inlet">---</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-pressure-outlet">---</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 text-foreground font-medium">TEMPERATURE</td>
                        <td className="py-3 px-2 text-muted-foreground">F</td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-temperature-inlet">---</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block min-w-16 px-3 py-1.5 bg-muted/50 rounded text-primary font-mono" data-testid="text-temperature-outlet">---</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
