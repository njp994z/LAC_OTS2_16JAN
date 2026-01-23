import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, FileText, Play, Loader2, Download, ChevronDown, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import expLogo from "@/assets/exp-logo.png";

interface InputParams {
  rpmPercent: string;
  temp: string;
  pressure: string;
  barometricPressure: string;
}

interface OutputParams {
  inletFlowAcfm: string;
  outletTempF: string;
  outletPressureInwc: string;
  pressureRiseInwc: string;
  standardFlowScfm: string;
  massFlowKlbhr: string;
  brakePowerHp: string;
  driverSpeed: string;
}

interface StreamData {
  SO2: string;
  SO3: string;
  O2: string;
  N2: string;
  H2O: string;
  H2SO4: string;
  total: string;
  pressure: string;
  temperature: string;
}

export default function MainCompressor() {
  const { toast } = useToast();
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [plantCondition, setPlantCondition] = useState<"clean" | "dirty">("clean");
  const [realtimeBarometric, setRealtimeBarometric] = useState<string>("no");
  const [isLoadingBarometric, setIsLoadingBarometric] = useState(false);

  const [inputParams, setInputParams] = useState<InputParams>({
    rpmPercent: "88",
    temp: "150",
    pressure: "-12",
    barometricPressure: "0.85"
  });

  const [outputParams, setOutputParams] = useState<OutputParams>({
    inletFlowAcfm: "---",
    outletTempF: "---",
    outletPressureInwc: "---",
    pressureRiseInwc: "---",
    standardFlowScfm: "---",
    massFlowKlbhr: "---",
    brakePowerHp: "---",
    driverSpeed: "---"
  });

  const defaultStream: StreamData = {
    SO2: "---", SO3: "---", O2: "---", N2: "---",
    H2O: "---", H2SO4: "---", total: "---",
    pressure: "---", temperature: "---"
  };

  const [inletStream, setInletStream] = useState<StreamData>(defaultStream);
  const [outletStream, setOutletStream] = useState<StreamData>(defaultStream);

  const handleInputChange = (field: keyof InputParams, value: string) => {
    setInputParams(prev => ({ ...prev, [field]: value }));
  };

  const formatValue = (value: number | null | undefined, decimals: number = 1): string => {
    if (value === null || value === undefined || isNaN(value)) return "---";
    if (Math.abs(value) >= 10000) return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (Math.abs(value) >= 100) return value.toFixed(decimals);
    return value.toFixed(Math.max(decimals, 1));
  };

  const runSimulation = async () => {
    setIsRunningSimulation(true);
    try {
      const response = await apiRequest('POST', '/api/compressor-simulation', {
        rpm_percent: inputParams.rpmPercent,
        temp: inputParams.temp,
        pressure: inputParams.pressure,
        barometricPressure: inputParams.barometricPressure,
        plant_condition: plantCondition
      });

      const data = await response.json();

      if (data.success && data.results) {
        const r = data.results;
        setOutputParams({
          inletFlowAcfm: formatValue(r.inlet_flow_acfm, 0),
          outletTempF: formatValue(r.outlet_temp_F, 1),
          outletPressureInwc: formatValue(r.outlet_pressure_inwc, 1),
          pressureRiseInwc: formatValue(r.pressure_rise_inwc, 1),
          standardFlowScfm: formatValue(r.standard_flow_scfm, 0),
          massFlowKlbhr: formatValue(r.mass_flow_klbhr, 1),
          brakePowerHp: formatValue(r.brake_power_hp, 0),
          driverSpeed: formatValue(r.driver_speed_rpm, 0)
        });

        if (r.inlet_stream) {
          setInletStream({
            SO2: formatValue(r.inlet_stream.SO2, 0),
            SO3: formatValue(r.inlet_stream.SO3, 0),
            O2: formatValue(r.inlet_stream.O2, 0),
            N2: formatValue(r.inlet_stream.N2, 0),
            H2O: formatValue(r.inlet_stream.H2O, 0),
            H2SO4: formatValue(r.inlet_stream.H2SO4, 0),
            total: formatValue(r.inlet_stream.total, 0),
            pressure: formatValue(r.inlet_stream.pressure, 1),
            temperature: formatValue(r.inlet_stream.temperature, 1)
          });
        }

        if (r.outlet_stream) {
          setOutletStream({
            SO2: formatValue(r.outlet_stream.SO2, 0),
            SO3: formatValue(r.outlet_stream.SO3, 0),
            O2: formatValue(r.outlet_stream.O2, 0),
            N2: formatValue(r.outlet_stream.N2, 0),
            H2O: formatValue(r.outlet_stream.H2O, 0),
            H2SO4: formatValue(r.outlet_stream.H2SO4, 0),
            total: formatValue(r.outlet_stream.total, 0),
            pressure: formatValue(r.outlet_stream.pressure, 1),
            temperature: formatValue(r.outlet_stream.temperature, 1)
          });
        }

        toast({
          title: "Simulation Complete",
          description: `Results calculated for ${plantCondition} plant condition at ${inputParams.rpmPercent}% speed.`,
        });
      } else {
        throw new Error(data.error || data.message || "Simulation failed");
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
      if (!response.ok) throw new Error('Failed to fetch barometric data');
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
          description: `Live value: ${pressureAtm.toFixed(4)} ATM`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch live barometric pressure.",
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

  return (
    <div className="min-h-screen bg-background" data-testid="page-main-compressor">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/unit-operation-simulator" data-testid="link-back">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <span className="font-semibold text-lg" data-testid="text-brand">Lithium Americas</span>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 
            className="text-3xl font-bold text-center mb-6" 
            data-testid="text-page-title"
          >
            Compressor Block
          </h1>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <a 
              href="/assets/howden-compressor-curves.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              data-testid="link-datasheet"
            >
              <Button className="gap-2" data-testid="button-datasheet">
                <FileText className="h-4 w-4" />
                Compressor Data Sheet
              </Button>
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="button-download-codes">
                  <Download className="w-4 h-4" />
                  Download Codes
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>GUI</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/unit-operation/main-compressor/gui-code" data-testid="link-compressor-gui-view">
                    <Eye className="h-4 w-4 mr-2" />
                    View Code
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/api/download-python/compressor_gui.py" download data-testid="link-download-compressor-gui">
                    <Download className="h-4 w-4 mr-2" />
                    Download compressor_gui.py
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Simulation Code</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/unit-operation/main-compressor/python-code" data-testid="link-compressor-sim-view">
                    <Eye className="h-4 w-4 mr-2" />
                    View Code
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/api/download-python/compressor_calculator.py" download data-testid="link-download-compressor-sim">
                    <Download className="h-4 w-4 mr-2" />
                    Download compressor_calculator.py
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Card className="max-w-lg mx-auto mb-8" data-testid="card-operating-conditions">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg" data-testid="title-operating-conditions">
                Operating Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div data-testid="field-speed">
                  <label className="text-sm text-muted-foreground block mb-1" data-testid="label-speed">
                    Speed (% of max)
                  </label>
                  <Input
                    type="number"
                    value={inputParams.rpmPercent}
                    onChange={(e) => handleInputChange("rpmPercent", e.target.value)}
                    placeholder="88"
                    data-testid="input-rpm-percent"
                  />
                </div>

                <div data-testid="field-plant-condition">
                  <label className="text-sm text-muted-foreground block mb-1" data-testid="label-plant-condition">
                    Plant Condition
                  </label>
                  <Select 
                    value={plantCondition} 
                    onValueChange={(v) => setPlantCondition(v as "clean" | "dirty")}
                  >
                    <SelectTrigger data-testid="select-plant-condition">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clean" data-testid="option-clean">Clean</SelectItem>
                      <SelectItem value="dirty" data-testid="option-dirty">Dirty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div data-testid="field-inlet-temp">
                  <label className="text-sm text-muted-foreground block mb-1" data-testid="label-inlet-temp">
                    Inlet Temp
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={inputParams.temp}
                      onChange={(e) => handleInputChange("temp", e.target.value)}
                      className="w-20"
                      data-testid="input-temp"
                    />
                    <span className="text-sm" data-testid="unit-temp">°F</span>
                  </div>
                </div>

                <div data-testid="field-inlet-pressure">
                  <label className="text-sm text-muted-foreground block mb-1" data-testid="label-inlet-pressure">
                    Inlet Pressure
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={inputParams.pressure}
                      onChange={(e) => handleInputChange("pressure", e.target.value)}
                      className="w-20"
                      data-testid="input-pressure"
                    />
                    <span className="text-sm" data-testid="unit-pressure">in wc</span>
                  </div>
                </div>

                <div data-testid="field-barometric">
                  <label className="text-sm text-muted-foreground block mb-1" data-testid="label-barometric">
                    Barometric
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={inputParams.barometricPressure}
                      onChange={(e) => handleInputChange("barometricPressure", e.target.value)}
                      className="w-20"
                      disabled={realtimeBarometric === "yes"}
                      data-testid="input-barometric"
                    />
                    <span className="text-sm" data-testid="unit-barometric">atm</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3" data-testid="field-realtime-baro">
                <span className="text-sm text-muted-foreground w-32" data-testid="label-realtime-baro">
                  Realtime Baro:
                </span>
                <Select value={realtimeBarometric} onValueChange={setRealtimeBarometric}>
                  <SelectTrigger className="w-24" data-testid="select-realtime-baro">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes" data-testid="option-realtime-yes">Yes</SelectItem>
                    <SelectItem value="no" data-testid="option-realtime-no">No</SelectItem>
                  </SelectContent>
                </Select>
                {isLoadingBarometric && (
                  <span className="text-sm text-muted-foreground" data-testid="text-loading-baro">
                    Loading...
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center mb-10">
            <Button
              size="lg"
              onClick={runSimulation}
              disabled={isRunningSimulation}
              className="gap-2 px-10"
              data-testid="button-run-simulation"
            >
              {isRunningSimulation ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>

          <Card className="max-w-5xl mx-auto" data-testid="card-results">
            <CardHeader>
              <CardTitle data-testid="title-results">Simulation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-results">
                  <thead>
                    <tr className="border-b" data-testid="row-header">
                      <th className="text-left py-3 px-4" data-testid="header-parameter">Parameter</th>
                      <th className="text-left py-3 px-4" data-testid="header-units">Units</th>
                      <th className="text-center py-3 px-4" data-testid="header-value">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b" data-testid="row-inlet-flow">
                      <td className="py-3 px-4 font-medium" data-testid="label-inlet-flow">Inlet Flow</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-inlet-flow">acfm</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-inlet-flow">
                        {outputParams.inletFlowAcfm}
                      </td>
                    </tr>
                    <tr className="border-b" data-testid="row-outlet-temp">
                      <td className="py-3 px-4 font-medium" data-testid="label-outlet-temp">Outlet Temperature</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-outlet-temp">°F</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-outlet-temp">
                        {outputParams.outletTempF}
                      </td>
                    </tr>
                    <tr className="border-b" data-testid="row-outlet-pressure">
                      <td className="py-3 px-4 font-medium" data-testid="label-outlet-pressure">Outlet Pressure</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-outlet-pressure">in wc</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-outlet-pressure">
                        {outputParams.outletPressureInwc}
                      </td>
                    </tr>
                    <tr className="border-b" data-testid="row-pressure-rise">
                      <td className="py-3 px-4 font-medium" data-testid="label-pressure-rise">Pressure Rise</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-pressure-rise">in wc</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-pressure-rise">
                        {outputParams.pressureRiseInwc}
                      </td>
                    </tr>
                    <tr className="border-b" data-testid="row-standard-flow">
                      <td className="py-3 px-4 font-medium" data-testid="label-standard-flow">Standard Flow</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-standard-flow">scfm</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-standard-flow">
                        {outputParams.standardFlowScfm}
                      </td>
                    </tr>
                    <tr className="border-b" data-testid="row-mass-flow">
                      <td className="py-3 px-4 font-medium" data-testid="label-mass-flow">Mass Flow</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-mass-flow">klb/hr</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-mass-flow">
                        {outputParams.massFlowKlbhr}
                      </td>
                    </tr>
                    <tr className="border-b" data-testid="row-brake-power">
                      <td className="py-3 px-4 font-medium" data-testid="label-brake-power">Brake Power</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-brake-power">hp</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-brake-power">
                        {outputParams.brakePowerHp}
                      </td>
                    </tr>
                    <tr data-testid="row-driver-speed">
                      <td className="py-3 px-4 font-medium" data-testid="label-driver-speed">Driver Speed</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-driver-speed">rpm</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-driver-speed">
                        {outputParams.driverSpeed}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="max-w-5xl mx-auto mt-8" data-testid="card-static-outputs">
            <CardHeader>
              <CardTitle data-testid="title-static-outputs">Simulation Outputs - Static Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-static-outputs">
                  <thead>
                    <tr className="border-b" data-testid="row-static-header">
                      <th className="text-left py-3 px-4 w-28" data-testid="header-static-blank"></th>
                      <th className="text-left py-3 px-4 w-20" data-testid="header-static-units">Units</th>
                      <th className="text-center py-3 px-4" data-testid="header-inlet-stream">
                        <div className="text-blue-400" data-testid="text-inlet-title">Compressor Inlet</div>
                        <div className="inline-block bg-muted px-3 py-1 rounded text-sm font-medium my-1" data-testid="text-inlet-stream">Stream # 3</div>
                        <div className="text-xs text-muted-foreground" data-testid="text-inlet-tag">1540-FI-4070</div>
                        <div className="text-xs text-muted-foreground" data-testid="text-inlet-gc">GC0</div>
                      </th>
                      <th className="text-center py-3 px-4" data-testid="header-outlet-stream">
                        <div className="text-blue-400" data-testid="text-outlet-title">Compressor Outlet</div>
                        <div className="inline-block bg-muted px-3 py-1 rounded text-sm font-medium my-1" data-testid="text-outlet-stream">Stream # 4</div>
                        <div className="text-xs text-muted-foreground" data-testid="text-outlet-tag">1540-PI-4002</div>
                        <div className="text-xs text-muted-foreground" data-testid="text-outlet-gc">GC1</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b" data-testid="row-so2">
                      <td className="py-3 px-4 font-medium" data-testid="label-so2">SO2</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-so2">scfm</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-inlet-so2">
                        <span className="bg-muted px-3 py-1 rounded">{inletStream.SO2}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-outlet-so2">
                        <span className="bg-muted px-3 py-1 rounded">{outletStream.SO2}</span>
                      </td>
                    </tr>
                    <tr className="border-b" data-testid="row-so3">
                      <td className="py-3 px-4 font-medium" data-testid="label-so3">SO3</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-so3">scfm</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-inlet-so3">
                        <span className="bg-muted px-3 py-1 rounded">{inletStream.SO3}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-outlet-so3">
                        <span className="bg-muted px-3 py-1 rounded">{outletStream.SO3}</span>
                      </td>
                    </tr>
                    <tr className="border-b" data-testid="row-o2">
                      <td className="py-3 px-4 font-medium" data-testid="label-o2">O2</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-o2">scfm</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-inlet-o2">
                        <span className="bg-muted px-3 py-1 rounded">{inletStream.O2}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-outlet-o2">
                        <span className="bg-muted px-3 py-1 rounded">{outletStream.O2}</span>
                      </td>
                    </tr>
                    <tr className="border-b" data-testid="row-n2">
                      <td className="py-3 px-4 font-medium" data-testid="label-n2">N2</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-n2">scfm</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-inlet-n2">
                        <span className="bg-muted px-3 py-1 rounded">{inletStream.N2}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-outlet-n2">
                        <span className="bg-muted px-3 py-1 rounded">{outletStream.N2}</span>
                      </td>
                    </tr>
                    <tr className="border-b" data-testid="row-h2o">
                      <td className="py-3 px-4 font-medium" data-testid="label-h2o">H2O</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-h2o">scfm</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-inlet-h2o">
                        <span className="bg-muted px-3 py-1 rounded">{inletStream.H2O}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-outlet-h2o">
                        <span className="bg-muted px-3 py-1 rounded">{outletStream.H2O}</span>
                      </td>
                    </tr>
                    <tr className="border-b" data-testid="row-h2so4">
                      <td className="py-3 px-4 font-medium" data-testid="label-h2so4">H2SO4</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-h2so4">scfm</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-inlet-h2so4">
                        <span className="bg-muted px-3 py-1 rounded">{inletStream.H2SO4}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-outlet-h2so4">
                        <span className="bg-muted px-3 py-1 rounded">{outletStream.H2SO4}</span>
                      </td>
                    </tr>
                    <tr className="border-b" data-testid="row-total">
                      <td className="py-3 px-4 font-bold" data-testid="label-total">TOTAL</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-total">scfm</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-inlet-total">
                        <span className="bg-muted px-3 py-1 rounded">{inletStream.total}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-outlet-total">
                        <span className="bg-muted px-3 py-1 rounded">{outletStream.total}</span>
                      </td>
                    </tr>
                    <tr className="border-b" data-testid="row-stream-pressure">
                      <td className="py-3 px-4 font-bold" data-testid="label-stream-pressure">PRESSURE</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-stream-pressure">in. wc.</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-inlet-pressure">
                        <span className="bg-muted px-3 py-1 rounded">{inletStream.pressure}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-outlet-pressure-stream">
                        <span className="bg-muted px-3 py-1 rounded">{outletStream.pressure}</span>
                      </td>
                    </tr>
                    <tr data-testid="row-stream-temperature">
                      <td className="py-3 px-4 font-bold" data-testid="label-stream-temperature">TEMPERATURE</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-stream-temperature">F</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-inlet-temperature">
                        <span className="bg-muted px-3 py-1 rounded">{inletStream.temperature}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-outlet-temperature">
                        <span className="bg-muted px-3 py-1 rounded">{outletStream.temperature}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
