import { Link, useLocation } from "wouter";
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
import expLogo from "@/assets/exp-logo.png";

interface InputParams {
  dryAirFlow: string;
  humidity: string;
  inletTemp: string;
  filterDp: string;
  barometric: string;
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

export default function InletAirFilter() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [realtimeBaro, setRealtimeBaro] = useState<string>("yes");
  const [realtimeTemp, setRealtimeTemp] = useState<string>("yes");
  const [realtimeHumidity, setRealtimeHumidity] = useState<string>("yes");
  const [isLoadingBaro, setIsLoadingBaro] = useState(false);
  const [isLoadingTemp, setIsLoadingTemp] = useState(false);
  const [isLoadingHumidity, setIsLoadingHumidity] = useState(false);

  const [inputParams, setInputParams] = useState<InputParams>({
    dryAirFlow: "87000",
    humidity: "11.1",
    inletTemp: "38",
    filterDp: "3",
    barometric: "1.0010"
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

  const fetchRealtimeData = async () => {
    try {
      const response = await fetch('/api/psychrometrics/current?zipCode=89414&countryCode=US');
      if (!response.ok) throw new Error('Failed to fetch weather data');
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  };

  const fetchRealtimeBarometric = async () => {
    setIsLoadingBaro(true);
    try {
      const data = await fetchRealtimeData();
      const pressureHpa = data.conditions?.pressure;
      if (pressureHpa !== undefined && pressureHpa !== null) {
        const pressureInHg = pressureHpa * 0.02953;
        const pressureAtm = pressureInHg / 29.9213;
        setInputParams(prev => ({
          ...prev,
          barometric: pressureAtm.toFixed(4)
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
      setRealtimeBaro("no");
    } finally {
      setIsLoadingBaro(false);
    }
  };

  const fetchRealtimeTemperature = async () => {
    setIsLoadingTemp(true);
    try {
      const data = await fetchRealtimeData();
      const temperatureC = data.conditions?.temperature;
      if (temperatureC !== undefined && temperatureC !== null) {
        const temperatureF = (temperatureC * 9 / 5) + 32;
        setInputParams(prev => ({
          ...prev,
          inletTemp: temperatureF.toFixed(1)
        }));
        toast({
          title: "Temperature Updated",
          description: `Live value: ${temperatureF.toFixed(1)} °F`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch live temperature.",
        variant: "destructive",
      });
      setRealtimeTemp("no");
    } finally {
      setIsLoadingTemp(false);
    }
  };

  const fetchRealtimeHumidityData = async () => {
    setIsLoadingHumidity(true);
    try {
      const data = await fetchRealtimeData();
      const humidityRatio = data.psychrometrics?.humidityRatio;
      if (humidityRatio !== undefined && humidityRatio !== null) {
        const humidityGrLb = humidityRatio * 7000;
        setInputParams(prev => ({
          ...prev,
          humidity: humidityGrLb.toFixed(2)
        }));
        toast({
          title: "Humidity Updated",
          description: `Live value: ${humidityGrLb.toFixed(2)} gr/lb dry air`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch live humidity.",
        variant: "destructive",
      });
      setRealtimeHumidity("no");
    } finally {
      setIsLoadingHumidity(false);
    }
  };

  useEffect(() => {
    if (realtimeBaro === "yes") {
      fetchRealtimeBarometric();
    }
  }, [realtimeBaro]);

  useEffect(() => {
    if (realtimeTemp === "yes") {
      fetchRealtimeTemperature();
    }
  }, [realtimeTemp]);

  useEffect(() => {
    if (realtimeHumidity === "yes") {
      fetchRealtimeHumidityData();
    }
  }, [realtimeHumidity]);

  const runSimulation = async () => {
    setIsRunningSimulation(true);
    try {
      const response = await fetch('/api/inlet-air-filter-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryAirFlow: inputParams.dryAirFlow,
          humidity: inputParams.humidity,
          inletTemp: inputParams.inletTemp,
          filterDp: inputParams.filterDp,
          barometric: inputParams.barometric,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Simulation failed');
      }
      
      const results = await response.json();
      
      // Update inlet stream
      setInletStream({
        SO2: results.inlet.SO2.toFixed(2),
        SO3: results.inlet.SO3.toFixed(2),
        O2: results.inlet.O2.toFixed(2),
        N2: results.inlet.N2.toFixed(2),
        H2O: results.inlet.H2O.toFixed(2),
        H2SO4: results.inlet.H2SO4.toFixed(2),
        total: results.inlet.total.toFixed(2),
        pressure: results.inlet.pressure.toFixed(2),
        temperature: results.inlet.temperature.toFixed(1),
      });
      
      // Update outlet stream
      setOutletStream({
        SO2: results.outlet.SO2.toFixed(2),
        SO3: results.outlet.SO3.toFixed(2),
        O2: results.outlet.O2.toFixed(2),
        N2: results.outlet.N2.toFixed(2),
        H2O: results.outlet.H2O.toFixed(2),
        H2SO4: results.outlet.H2SO4.toFixed(2),
        total: results.outlet.total.toFixed(2),
        pressure: results.outlet.pressure.toFixed(2),
        temperature: results.outlet.temperature.toFixed(1),
      });
      
      toast({
        title: "Simulation Complete",
        description: "Inlet Air Filter simulation results calculated successfully.",
      });
    } catch (error) {
      toast({
        title: "Simulation Error",
        description: error instanceof Error ? error.message : "An error occurred during simulation.",
        variant: "destructive"
      });
    } finally {
      setIsRunningSimulation(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/unit-operation-simulator")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2" data-testid="text-page-title">
              <span className="text-blue-400">Inlet Air Filter</span>
              <span className="ml-4">Block</span>
            </h1>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <Button
              variant="outline"
              className="gap-2"
              data-testid="button-data-sheet"
            >
              <FileText className="w-4 h-4" />
              Inlet Air Filter Data Sheet
            </Button>
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
                  <Link href="/unit-operation/inlet-air-filter/gui-code" data-testid="link-inlet-air-filter-gui-view">
                    <Eye className="h-4 w-4 mr-2" />
                    View Code
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/api/download-python/inlet_air_filter_gui.py" download data-testid="link-download-inlet-air-filter-gui">
                    <Download className="h-4 w-4 mr-2" />
                    Download inlet_air_filter_gui.py
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Simulation Code</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/unit-operation/inlet-air-filter/simulation-code" data-testid="link-inlet-air-filter-sim-view">
                    <Eye className="h-4 w-4 mr-2" />
                    View Code
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/api/download-python/inlet_air_filter_calc.py" download data-testid="link-download-inlet-air-filter-sim">
                    <Download className="h-4 w-4 mr-2" />
                    Download inlet_air_filter_calc.py
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Card className="max-w-4xl mx-auto" data-testid="card-operating-conditions">
            <CardHeader>
              <CardTitle data-testid="title-operating-conditions">Operating Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-28" data-testid="label-dry-air-flow">Dry Air Flow</label>
                    <Input
                      type="text"
                      value={inputParams.dryAirFlow}
                      onChange={(e) => handleInputChange("dryAirFlow", e.target.value)}
                      className="w-28 text-center font-mono"
                      data-testid="input-dry-air-flow"
                    />
                    <span className="text-sm text-muted-foreground">SCFM</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-28" data-testid="label-humidity">Humidity</label>
                    <Input
                      type="text"
                      value={inputParams.humidity}
                      onChange={(e) => handleInputChange("humidity", e.target.value)}
                      className="w-28 text-center font-mono"
                      disabled={realtimeHumidity === "yes"}
                      data-testid="input-humidity"
                    />
                    <span className="text-sm text-muted-foreground">gr / lb dry air</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-24" data-testid="label-inlet-temp">Inlet Temp</label>
                    <Input
                      type="text"
                      value={inputParams.inletTemp}
                      onChange={(e) => handleInputChange("inletTemp", e.target.value)}
                      className="w-20 text-center font-mono"
                      disabled={realtimeTemp === "yes"}
                      data-testid="input-inlet-temp"
                    />
                    <span className="text-sm text-muted-foreground">°F</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-24" data-testid="label-filter-dp">Filter dP</label>
                    <Input
                      type="text"
                      value={inputParams.filterDp}
                      onChange={(e) => handleInputChange("filterDp", e.target.value)}
                      className="w-20 text-center font-mono"
                      data-testid="input-filter-dp"
                    />
                    <span className="text-sm text-muted-foreground">in wc</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-24" data-testid="label-barometric">Barometric</label>
                    <Input
                      type="text"
                      value={inputParams.barometric}
                      onChange={(e) => handleInputChange("barometric", e.target.value)}
                      className="w-20 text-center font-mono"
                      disabled={realtimeBaro === "yes"}
                      data-testid="input-barometric"
                    />
                    <span className="text-sm text-muted-foreground">atm</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-28" data-testid="label-realtime-baro">Realtime Baro:</label>
                    <Select value={realtimeBaro} onValueChange={setRealtimeBaro} disabled={isLoadingBaro}>
                      <SelectTrigger className="w-24" data-testid="select-realtime-baro">
                        <div className="flex items-center gap-2">
                          {isLoadingBaro && <Loader2 className="w-3 h-3 animate-spin" />}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-28" data-testid="label-realtime-temp">Realtime Temp:</label>
                    <Select value={realtimeTemp} onValueChange={setRealtimeTemp} disabled={isLoadingTemp}>
                      <SelectTrigger className="w-24" data-testid="select-realtime-temp">
                        <div className="flex items-center gap-2">
                          {isLoadingTemp && <Loader2 className="w-3 h-3 animate-spin" />}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-28" data-testid="label-realtime-humidity">Realtime Humidity:</label>
                    <Select value={realtimeHumidity} onValueChange={setRealtimeHumidity} disabled={isLoadingHumidity}>
                      <SelectTrigger className="w-24" data-testid="select-realtime-humidity">
                        <div className="flex items-center gap-2">
                          {isLoadingHumidity && <Loader2 className="w-3 h-3 animate-spin" />}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={runSimulation}
                    disabled={isRunningSimulation}
                    className="gap-2"
                    data-testid="button-run-simulation"
                  >
                    {isRunningSimulation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Run Simulation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="max-w-5xl mx-auto mt-8" data-testid="card-simulation-outputs">
            <CardHeader>
              <CardTitle data-testid="title-simulation-outputs">Simulation Outputs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-simulation-outputs">
                  <thead>
                    <tr className="border-b" data-testid="row-header">
                      <th className="text-left py-3 px-4 w-28" data-testid="header-blank"></th>
                      <th className="text-left py-3 px-4 w-20" data-testid="header-units">Units</th>
                      <th className="text-center py-3 px-4" data-testid="header-inlet-stream">
                        <div className="text-blue-400" data-testid="text-inlet-title">Inlet Air Filter In</div>
                        <div className="inline-block bg-muted px-3 py-1 rounded text-sm font-medium my-1" data-testid="text-inlet-stream">Stream # 1</div>
                        <div className="text-xs text-muted-foreground" data-testid="text-inlet-tag">ATM Cond.</div>
                        <div className="text-xs text-muted-foreground" data-testid="text-inlet-gc">GAF0</div>
                      </th>
                      <th className="text-center py-3 px-4" data-testid="header-outlet-stream">
                        <div className="text-blue-400" data-testid="text-outlet-title">Inlet Air Filter Out</div>
                        <div className="inline-block bg-muted px-3 py-1 rounded text-sm font-medium my-1" data-testid="text-outlet-stream">Stream # 2</div>
                        <div className="text-xs text-muted-foreground" data-testid="text-outlet-tag">1540-PI-5801</div>
                        <div className="text-xs text-muted-foreground" data-testid="text-outlet-gc">GAF1</div>
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
                    <tr className="border-b" data-testid="row-pressure">
                      <td className="py-3 px-4 font-bold" data-testid="label-pressure">PRESSURE</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-pressure">in. wc.</td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-inlet-pressure">
                        <span className="bg-muted px-3 py-1 rounded">{inletStream.pressure}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono" data-testid="value-outlet-pressure">
                        <span className="bg-muted px-3 py-1 rounded">{outletStream.pressure}</span>
                      </td>
                    </tr>
                    <tr data-testid="row-temperature">
                      <td className="py-3 px-4 font-bold" data-testid="label-temperature">TEMPERATURE</td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid="unit-temperature">F</td>
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
