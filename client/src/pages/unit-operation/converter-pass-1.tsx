import { Link, useLocation } from "wouter";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FlaskConical, Play, Pause, RotateCcw, Loader2, Code, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SystemParams {
  diameter_ft: string;
  catalyst_volume_liters: string;
  catalyst_name: string;
  barometric_psia: string;
}

interface InletGasInputs {
  inlet_T_C: string;
  inlet_P_inwc: string;
  inlet_total_scfm: string;
  inlet_so2_pct: string;
  inlet_o2_pct: string;
  inlet_so3_pct: string;
}

interface BedProfileRow {
  bed_depth_ft: string;
  temp_C: string;
  temp_F: string;
  overall_conv_pct: string;
  bed_conv_pct: string;
  pressure_inwc: string;
  so2_pct: string;
  o2_pct: string;
  velocity_fts: string;
}

interface GasFlow {
  SO2: string;
  SO3: string;
  O2: string;
  N2: string;
  H2O: string;
  H2SO4: string;
  TOTAL: string;
  PRESSURE: string;
  TEMPERATURE_F: string;
}

const CATALYST_OPTIONS = [
  "MECS CS120",
  "MECS GR330",
  "MECS LP120",
  "Topsoe VK38",
  "Topsoe VK59",
  "Topsoe VK69",
  "BASF O4-115",
  "BASF O4-116",
];

const BED_PERCENTAGES = ["0%", "25%", "50%", "75%", "100%"];

export default function ConverterPass1() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"Static" | "Dynamic">("Static");
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [isRunningDynamic, setIsRunningDynamic] = useState(false);
  const dynamicIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [systemParams, setSystemParams] = useState<SystemParams>({
    diameter_ft: "42.0",
    catalyst_volume_liters: "89200",
    catalyst_name: "MECS GR330",
    barometric_psia: "14.3",
  });

  const [inletGas, setInletGas] = useState<InletGasInputs>({
    inlet_T_C: "390",
    inlet_P_inwc: "150",
    inlet_total_scfm: "150000",
    inlet_so2_pct: "11.3",
    inlet_o2_pct: "9.5",
    inlet_so3_pct: "0.0",
  });

  const [bedProfile, setBedProfile] = useState<BedProfileRow[]>(
    BED_PERCENTAGES.map(() => ({
      bed_depth_ft: "---",
      temp_C: "---",
      temp_F: "---",
      overall_conv_pct: "---",
      bed_conv_pct: "---",
      pressure_inwc: "---",
      so2_pct: "---",
      o2_pct: "---",
      velocity_fts: "---",
    }))
  );

  const [inletFlow, setInletFlow] = useState<GasFlow>({
    SO2: "---",
    SO3: "---",
    O2: "---",
    N2: "---",
    H2O: "---",
    H2SO4: "---",
    TOTAL: "---",
    PRESSURE: "---",
    TEMPERATURE_F: "---",
  });

  const [outletFlow, setOutletFlow] = useState<GasFlow>({
    SO2: "---",
    SO3: "---",
    O2: "---",
    N2: "---",
    H2O: "---",
    H2SO4: "---",
    TOTAL: "---",
    PRESSURE: "---",
    TEMPERATURE_F: "---",
  });

  const [catalystInfo, setCatalystInfo] = useState<{
    name: string;
    manufacturer: string;
    activity: number;
    bulk_density_kg_m3: number;
  } | null>(null);

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
      const response = await apiRequest('POST', '/api/converter-pass-simulation', {
        inlet_T_C: parseFloat(inletGas.inlet_T_C) || 390,
        inlet_P_inwc: parseFloat(inletGas.inlet_P_inwc) || 150,
        inlet_so2_pct: parseFloat(inletGas.inlet_so2_pct) || 11.3,
        inlet_o2_pct: parseFloat(inletGas.inlet_o2_pct) || 9.5,
        inlet_so3_pct: parseFloat(inletGas.inlet_so3_pct) || 0.0,
        inlet_total_scfm: parseFloat(inletGas.inlet_total_scfm) || 150000,
        diameter_ft: parseFloat(systemParams.diameter_ft) || 42.0,
        catalyst_volume_liters: parseFloat(systemParams.catalyst_volume_liters) || 89200,
        catalyst_name: systemParams.catalyst_name || "MECS GR330",
        barometric_psia: parseFloat(systemParams.barometric_psia) || 14.3,
      });
      
      const data = await response.json();
      
      if (!data.success) {
        toast({
          title: "Calculation Error",
          description: data.message || data.error || "Simulation failed",
          variant: "destructive"
        });
        return;
      }

      const results = data.results;

      // Update bed profile
      const newBedProfile: BedProfileRow[] = BED_PERCENTAGES.map((_, i) => ({
        bed_depth_ft: formatValue(results.bed_depths_ft[i], 2),
        temp_C: formatValue(results.temps_C[i], 1),
        temp_F: formatValue(results.temps_F[i], 1),
        overall_conv_pct: formatValue(results.overall_conv_pct[i], 2),
        bed_conv_pct: formatValue(results.bed_conv_pct[i], 2),
        pressure_inwc: formatValue(results.pressures_inwc[i], 2),
        so2_pct: formatValue(results.so2_pct[i], 3),
        o2_pct: formatValue(results.o2_pct[i], 3),
        velocity_fts: formatValue(results.velocities_fts[i], 2),
      }));
      setBedProfile(newBedProfile);

      // Update inlet flows
      setInletFlow({
        SO2: formatValue(results.inlet.SO2, 0),
        SO3: formatValue(results.inlet.SO3, 0),
        O2: formatValue(results.inlet.O2, 0),
        N2: formatValue(results.inlet.N2, 0),
        H2O: formatValue(results.inlet.H2O, 0),
        H2SO4: formatValue(results.inlet.H2SO4, 0),
        TOTAL: formatValue(results.inlet.TOTAL, 0),
        PRESSURE: formatValue(results.inlet.PRESSURE, 1),
        TEMPERATURE_F: formatValue(results.inlet.TEMPERATURE_F, 0),
      });

      // Update outlet flows
      setOutletFlow({
        SO2: formatValue(results.outlet.SO2, 0),
        SO3: formatValue(results.outlet.SO3, 0),
        O2: formatValue(results.outlet.O2, 0),
        N2: formatValue(results.outlet.N2, 0),
        H2O: formatValue(results.outlet.H2O, 0),
        H2SO4: formatValue(results.outlet.H2SO4, 0),
        TOTAL: formatValue(results.outlet.TOTAL, 0),
        PRESSURE: formatValue(results.outlet.PRESSURE, 1),
        TEMPERATURE_F: formatValue(results.outlet.TEMPERATURE_F, 0),
      });

      // Update catalyst info
      if (results.catalyst_info) {
        setCatalystInfo(results.catalyst_info);
      }

      toast({
        title: "Calculation Complete",
        description: `Pass 1 outlet conversion: ${formatValue(results.overall_conv_pct[4], 2)}%`,
      });

    } catch (error) {
      console.error("Simulation error:", error);
      toast({
        title: "Simulation Error",
        description: error instanceof Error ? error.message : "Failed to run simulation",
        variant: "destructive"
      });
    } finally {
      setIsRunningSimulation(false);
    }
  }, [inletGas, systemParams, toast]);

  const handleSystemChange = (field: keyof SystemParams, value: string) => {
    setSystemParams(prev => ({ ...prev, [field]: value }));
  };

  const handleInletChange = (field: keyof InletGasInputs, value: string) => {
    setInletGas(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/unit-operation/converter-simulations")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <FlaskConical className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold" data-testid="text-page-title">Converter Pass 1 Simulator</h1>
            <p className="text-sm text-muted-foreground" data-testid="text-page-subtitle">
              SO2 oxidation kinetics for first catalyst bed
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Mode Selection */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Simulation Mode</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as "Static" | "Dynamic")}
              className="flex gap-6"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* System Parameters */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">System Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Converter Diameter (ft)</Label>
                  <Input
                    value={systemParams.diameter_ft}
                    onChange={(e) => handleSystemChange("diameter_ft", e.target.value)}
                    className="h-8"
                    data-testid="input-diameter"
                  />
                </div>
                <div>
                  <Label className="text-xs">Catalyst Volume (L)</Label>
                  <Input
                    value={systemParams.catalyst_volume_liters}
                    onChange={(e) => handleSystemChange("catalyst_volume_liters", e.target.value)}
                    className="h-8"
                    data-testid="input-catalyst-volume"
                  />
                </div>
                <div>
                  <Label className="text-xs">Catalyst Type</Label>
                  <Select
                    value={systemParams.catalyst_name}
                    onValueChange={(v) => handleSystemChange("catalyst_name", v)}
                  >
                    <SelectTrigger className="h-8" data-testid="select-catalyst-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATALYST_OPTIONS.map((cat) => (
                        <SelectItem key={cat} value={cat} data-testid={`select-item-${cat.replace(/\s+/g, '-').toLowerCase()}`}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Barometric P (psia)</Label>
                  <Input
                    value={systemParams.barometric_psia}
                    onChange={(e) => handleSystemChange("barometric_psia", e.target.value)}
                    className="h-8"
                    data-testid="input-barometric"
                  />
                </div>
              </div>
              {catalystInfo && (
                <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                  <span data-testid="text-catalyst-info">
                    {catalystInfo.name} ({catalystInfo.manufacturer}) - Activity: {catalystInfo.activity.toFixed(2)}, 
                    Bulk Density: {catalystInfo.bulk_density_kg_m3} kg/m³
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inlet Gas Conditions */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Inlet Gas Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Inlet Temperature (°C)</Label>
                  <Input
                    value={inletGas.inlet_T_C}
                    onChange={(e) => handleInletChange("inlet_T_C", e.target.value)}
                    className="h-8"
                    data-testid="input-inlet-temp"
                  />
                </div>
                <div>
                  <Label className="text-xs">Inlet Pressure (in. wc)</Label>
                  <Input
                    value={inletGas.inlet_P_inwc}
                    onChange={(e) => handleInletChange("inlet_P_inwc", e.target.value)}
                    className="h-8"
                    data-testid="input-inlet-pressure"
                  />
                </div>
                <div>
                  <Label className="text-xs">Inlet Total Flow (scfm)</Label>
                  <Input
                    value={inletGas.inlet_total_scfm}
                    onChange={(e) => handleInletChange("inlet_total_scfm", e.target.value)}
                    className="h-8"
                    data-testid="input-inlet-flow"
                  />
                </div>
                <div>
                  <Label className="text-xs">Inlet SO2 (%)</Label>
                  <Input
                    value={inletGas.inlet_so2_pct}
                    onChange={(e) => handleInletChange("inlet_so2_pct", e.target.value)}
                    className="h-8"
                    data-testid="input-inlet-so2"
                  />
                </div>
                <div>
                  <Label className="text-xs">Inlet O2 (%)</Label>
                  <Input
                    value={inletGas.inlet_o2_pct}
                    onChange={(e) => handleInletChange("inlet_o2_pct", e.target.value)}
                    className="h-8"
                    data-testid="input-inlet-o2"
                  />
                </div>
                <div>
                  <Label className="text-xs">Inlet SO3 (%)</Label>
                  <Input
                    value={inletGas.inlet_so3_pct}
                    onChange={(e) => handleInletChange("inlet_so3_pct", e.target.value)}
                    className="h-8"
                    data-testid="input-inlet-so3"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bed Profile Table */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Pass 1 Bed Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Bed Depth</th>
                    <th className="text-center p-2 font-medium">Temp (°C)</th>
                    <th className="text-center p-2 font-medium">Temp (°F)</th>
                    <th className="text-center p-2 font-medium">Overall Conv (%)</th>
                    <th className="text-center p-2 font-medium">Bed Conv (%)</th>
                    <th className="text-center p-2 font-medium">Pressure (in.wc)</th>
                    <th className="text-center p-2 font-medium">SO2 (%)</th>
                    <th className="text-center p-2 font-medium">O2 (%)</th>
                    <th className="text-center p-2 font-medium">Velocity (ft/s)</th>
                  </tr>
                </thead>
                <tbody>
                  {BED_PERCENTAGES.map((pct, i) => (
                    <tr key={pct} className="border-b">
                      <td className="p-2 font-medium" data-testid={`text-bed-pct-${i}`}>{pct}</td>
                      <td className="text-center p-2" data-testid={`text-bed-temp-c-${i}`}>{bedProfile[i].temp_C}</td>
                      <td className="text-center p-2" data-testid={`text-bed-temp-f-${i}`}>{bedProfile[i].temp_F}</td>
                      <td className="text-center p-2" data-testid={`text-bed-overall-conv-${i}`}>{bedProfile[i].overall_conv_pct}</td>
                      <td className="text-center p-2" data-testid={`text-bed-conv-${i}`}>{bedProfile[i].bed_conv_pct}</td>
                      <td className="text-center p-2" data-testid={`text-bed-pressure-${i}`}>{bedProfile[i].pressure_inwc}</td>
                      <td className="text-center p-2" data-testid={`text-bed-so2-${i}`}>{bedProfile[i].so2_pct}</td>
                      <td className="text-center p-2" data-testid={`text-bed-o2-${i}`}>{bedProfile[i].o2_pct}</td>
                      <td className="text-center p-2" data-testid={`text-bed-velocity-${i}`}>{bedProfile[i].velocity_fts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Gas Outputs Table */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Simulation Outputs - {mode} Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Component</th>
                    <th className="text-center p-2 font-medium">Units</th>
                    <th className="text-center p-2 font-medium">Converter Inlet<br/>G10</th>
                    <th className="text-center p-2 font-medium">Converter Outlet<br/>G11</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">SO2</td>
                    <td className="text-center p-2">scfm</td>
                    <td className="text-center p-2" data-testid="text-so2-inlet">{inletFlow.SO2}</td>
                    <td className="text-center p-2" data-testid="text-so2-outlet">{outletFlow.SO2}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">SO3</td>
                    <td className="text-center p-2">scfm</td>
                    <td className="text-center p-2" data-testid="text-so3-inlet">{inletFlow.SO3}</td>
                    <td className="text-center p-2" data-testid="text-so3-outlet">{outletFlow.SO3}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">O2</td>
                    <td className="text-center p-2">scfm</td>
                    <td className="text-center p-2" data-testid="text-o2-inlet">{inletFlow.O2}</td>
                    <td className="text-center p-2" data-testid="text-o2-outlet">{outletFlow.O2}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">N2</td>
                    <td className="text-center p-2">scfm</td>
                    <td className="text-center p-2" data-testid="text-n2-inlet">{inletFlow.N2}</td>
                    <td className="text-center p-2" data-testid="text-n2-outlet">{outletFlow.N2}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">H2O</td>
                    <td className="text-center p-2">scfm</td>
                    <td className="text-center p-2" data-testid="text-h2o-inlet">{inletFlow.H2O}</td>
                    <td className="text-center p-2" data-testid="text-h2o-outlet">{outletFlow.H2O}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">H2SO4</td>
                    <td className="text-center p-2">scfm</td>
                    <td className="text-center p-2" data-testid="text-h2so4-inlet">{inletFlow.H2SO4}</td>
                    <td className="text-center p-2" data-testid="text-h2so4-outlet">{outletFlow.H2SO4}</td>
                  </tr>
                  <tr className="border-b bg-muted/50">
                    <td className="p-2 font-medium">TOTAL</td>
                    <td className="text-center p-2">scfm</td>
                    <td className="text-center p-2 font-medium" data-testid="text-total-inlet">{inletFlow.TOTAL}</td>
                    <td className="text-center p-2 font-medium" data-testid="text-total-outlet">{outletFlow.TOTAL}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">PRESSURE</td>
                    <td className="text-center p-2">in. wc</td>
                    <td className="text-center p-2" data-testid="text-pressure-inlet">{inletFlow.PRESSURE}</td>
                    <td className="text-center p-2" data-testid="text-pressure-outlet">{outletFlow.PRESSURE}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">TEMPERATURE</td>
                    <td className="text-center p-2">°F</td>
                    <td className="text-center p-2" data-testid="text-temp-inlet">{inletFlow.TEMPERATURE_F}</td>
                    <td className="text-center p-2" data-testid="text-temp-outlet">{outletFlow.TEMPERATURE_F}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            onClick={runCalculation}
            disabled={isRunningSimulation}
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
                variant="outline"
                disabled={true}
                data-testid="button-start-dynamic"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Dynamic
              </Button>
              <Button
                variant="outline"
                disabled={true}
                data-testid="button-pause"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button
                variant="outline"
                disabled={true}
                data-testid="button-reset"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </>
          )}

          <Button
            variant="outline"
            onClick={() => setLocation("/unit-operation/converter-simulations")}
            data-testid="button-back-to-list"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Converter Simulations
          </Button>
        </div>
      </div>
    </div>
  );
}
