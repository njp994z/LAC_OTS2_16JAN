import { Link } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Code, Play, Loader2, PipetteIcon, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

// Valve profile options
type ValveProfile = "quick_opening" | "linear" | "equal_percentage";

const valveProfileOptions: { value: ValveProfile; label: string }[] = [
  { value: "quick_opening", label: "Quick Opening" },
  { value: "linear", label: "Linear" },
  { value: "equal_percentage", label: "Equal Percentage" }
];

// Equation parameters for each profile type
interface ProfileParams {
  quick_opening: { a: number; b: number };
  linear: { m: number; b: number };
  equal_percentage: { R: number };
}

const defaultProfileParams: ProfileParams = {
  quick_opening: { a: 100, b: 0.5 },
  linear: { m: 100, b: 0 },
  equal_percentage: { R: 50 }
};

// Generate curve data for valve profile chart
function generateCurveData(profile: ValveProfile, params: ProfileParams): { x: number; y: number }[] {
  const data: { x: number; y: number }[] = [];
  for (let i = 0; i <= 100; i += 2) {
    const x = i / 100; // Position 0-1
    let y = 0;
    
    switch (profile) {
      case "quick_opening":
        // y = a * x^b
        y = params.quick_opening.a * Math.pow(x, params.quick_opening.b);
        break;
      case "linear":
        // y = m*x + b
        y = params.linear.m * x + params.linear.b;
        break;
      case "equal_percentage":
        // y = (100/R) * R^(x/100) where x is 0-100%
        const R = params.equal_percentage.R;
        const xPercent = i; // i is already 0-100
        y = (100 / R) * Math.pow(R, xPercent / 100);
        break;
    }
    
    data.push({ x: i, y: Math.max(0, Math.min(100, y)) });
  }
  return data;
}

// Get equation display string for profile
function getEquationString(profile: ValveProfile): string {
  switch (profile) {
    case "quick_opening":
      return "y = a * x^b";
    case "linear":
      return "y = m * x + b";
    case "equal_percentage":
      return "y = (100/R) * R^(x/100)";
  }
}

// Valve Profile Card component with graph and parameter inputs
interface ValveProfileCardProps {
  title: string;
  profile: ValveProfile;
  onProfileChange: (profile: ValveProfile) => void;
  params: ProfileParams;
  onParamsChange: (params: ProfileParams) => void;
  testIdPrefix: string;
}

function ValveProfileCard({ title, profile, onProfileChange, params, onParamsChange, testIdPrefix }: ValveProfileCardProps) {
  const curveData = useMemo(() => generateCurveData(profile, params), [profile, params]);
  
  const handleParamChange = (profileType: ValveProfile, paramName: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    const newParams = { ...params };
    if (profileType === "quick_opening") {
      newParams.quick_opening = { ...newParams.quick_opening, [paramName]: numValue };
    } else if (profileType === "linear") {
      newParams.linear = { ...newParams.linear, [paramName]: numValue };
    } else if (profileType === "equal_percentage") {
      newParams.equal_percentage = { R: paramName === "R" ? numValue : newParams.equal_percentage.R };
    }
    onParamsChange(newParams);
  };
  
  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curveData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis 
                  dataKey="x" 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Positioner', position: 'insideBottom', offset: -5, fontSize: 10 }}
                />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  domain={[0, 100]}
                  label={{ value: 'Cv %', angle: -90, position: 'insideLeft', fontSize: 10, offset: 30 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    fontSize: 11 
                  }}
                  formatter={(value: number) => [value.toFixed(1) + '%', 'Cv']}
                  labelFormatter={(label) => `Position: ${label}%`}
                />
                <Line 
                  type="monotone" 
                  dataKey="y" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2} 
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-1">
            <span className="text-xs font-medium">{valveProfileOptions.find(o => o.value === profile)?.label}</span>
            <div className="text-xs text-muted-foreground font-mono">{getEquationString(profile)}</div>
          </div>
        </div>
        
        <div className="w-48 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">{title}</label>
            <Select value={profile} onValueChange={(value: ValveProfile) => onProfileChange(value)}>
              <SelectTrigger className="h-8 text-sm" data-testid={`${testIdPrefix}-profile`}>
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>
              <SelectContent>
                {valveProfileOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {profile === "quick_opening" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground">Quick Opening (a)</label>
                <Input
                  type="number"
                  step="any"
                  value={params.quick_opening.a}
                  onChange={(e) => handleParamChange("quick_opening", "a", e.target.value)}
                  className="h-8 text-sm"
                  data-testid={`${testIdPrefix}-qo-a`}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Quick Opening (b)</label>
                <Input
                  type="number"
                  step="any"
                  value={params.quick_opening.b}
                  onChange={(e) => handleParamChange("quick_opening", "b", e.target.value)}
                  className="h-8 text-sm"
                  data-testid={`${testIdPrefix}-qo-b`}
                />
              </div>
            </>
          )}
          
          {profile === "linear" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground">Linear (m)</label>
                <Input
                  type="number"
                  step="any"
                  value={params.linear.m}
                  onChange={(e) => handleParamChange("linear", "m", e.target.value)}
                  className="h-8 text-sm"
                  data-testid={`${testIdPrefix}-lin-m`}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Linear (b)</label>
                <Input
                  type="number"
                  step="any"
                  value={params.linear.b}
                  onChange={(e) => handleParamChange("linear", "b", e.target.value)}
                  className="h-8 text-sm"
                  data-testid={`${testIdPrefix}-lin-b`}
                />
              </div>
            </>
          )}
          
          {profile === "equal_percentage" && (
            <div>
              <label className="text-xs text-muted-foreground">Rangeability (R)</label>
              <Input
                type="number"
                step="any"
                value={params.equal_percentage.R}
                onChange={(e) => handleParamChange("equal_percentage", "R", e.target.value)}
                className="h-8 text-sm"
                data-testid={`${testIdPrefix}-ep-R`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Unit conversion constants
const BAR_TO_PSI = 14.5038;
const M3H_TO_GPM = 4.40287;
const M_TO_FT = 3.28084;

// Internal storage always in metric (bar, m³/h, m)
interface MetricInputParams {
  fcvPosition: number;
  tcvPosition: number;
  acidFlowFinal: number;
  coolerK: number;
  pumpA: number;
  pumpB: number;
  pumpC: number;
  elevationDiff: number;
  pipeDp: number;
  cvFcvMax: number;
  cvTcvMax: number;
  fluidSg: number;
  pumpInletHead: number;
}

interface OutputParams {
  pumpDischargePressure: number | null;
  dpBypass: number | null;
  dpFcv: number | null;
  pInletBypCooler: number | null;
  pOutBypCooler: number | null;
  flowBypass: number | null;
  flowCooler: number | null;
  totalFlow: number | null;
  cvBypass: number | null;
  cvFcv: number | null;
}

// Default values in metric units
const defaultMetricInputs: MetricInputParams = {
  fcvPosition: 0.75,
  tcvPosition: 0.50,
  acidFlowFinal: 100,
  coolerK: 0.001,
  pumpA: 10,
  pumpB: 0.02,
  pumpC: 0.0001,
  elevationDiff: 5,
  pipeDp: 0.5,
  cvFcvMax: 150,
  cvTcvMax: 100,
  fluidSg: 1.84,
  pumpInletHead: 2.0
};

export default function DryingTowerCircuit() {
  const { toast } = useToast();
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [useImperial, setUseImperial] = useState(false);

  // Valve profile selections
  const [fcvProfile, setFcvProfile] = useState<ValveProfile>("equal_percentage");
  const [bypassProfile, setBypassProfile] = useState<ValveProfile>("equal_percentage");
  
  // Valve profile equation parameters
  const [fcvProfileParams, setFcvProfileParams] = useState<ProfileParams>(defaultProfileParams);
  const [bypassProfileParams, setBypassProfileParams] = useState<ProfileParams>(defaultProfileParams);

  // Store values internally in metric
  const [metricInputs, setMetricInputs] = useState<MetricInputParams>(defaultMetricInputs);

  // Display strings for inputs (shown in current unit system)
  const [displayInputs, setDisplayInputs] = useState<Record<string, string>>({});

  const [outputParams, setOutputParams] = useState<OutputParams>({
    pumpDischargePressure: null,
    dpBypass: null,
    dpFcv: null,
    pInletBypCooler: null,
    pOutBypCooler: null,
    flowBypass: null,
    flowCooler: null,
    totalFlow: null,
    cvBypass: null,
    cvFcv: null
  });

  // Conversion functions
  const toDisplayPressure = (bar: number): number => useImperial ? bar * BAR_TO_PSI : bar;
  const toMetricPressure = (val: number): number => useImperial ? val / BAR_TO_PSI : val;
  const toDisplayFlow = (m3h: number): number => useImperial ? m3h * M3H_TO_GPM : m3h;
  const toMetricFlow = (val: number): number => useImperial ? val / M3H_TO_GPM : val;
  const toDisplayLength = (m: number): number => useImperial ? m * M_TO_FT : m;
  const toMetricLength = (val: number): number => useImperial ? val / M_TO_FT : val;

  const pressureUnit = useImperial ? "psi" : "bar";
  const flowUnit = useImperial ? "gpm" : "m³/h";
  const elevationUnit = useImperial ? "ft" : "m";

  // Update display values when unit system changes or metric values change
  useEffect(() => {
    setDisplayInputs({
      fcvPosition: metricInputs.fcvPosition.toString(),
      tcvPosition: metricInputs.tcvPosition.toString(),
      acidFlowFinal: toDisplayFlow(metricInputs.acidFlowFinal).toFixed(2),
      coolerK: metricInputs.coolerK.toString(),
      pumpA: toDisplayPressure(metricInputs.pumpA).toFixed(2),
      pumpB: metricInputs.pumpB.toString(),
      pumpC: metricInputs.pumpC.toString(),
      elevationDiff: toDisplayLength(metricInputs.elevationDiff).toFixed(2),
      pipeDp: toDisplayPressure(metricInputs.pipeDp).toFixed(2),
      cvFcvMax: metricInputs.cvFcvMax.toString(),
      cvTcvMax: metricInputs.cvTcvMax.toString(),
      fluidSg: metricInputs.fluidSg.toString(),
      pumpInletHead: toDisplayLength(metricInputs.pumpInletHead).toFixed(2)
    });
  }, [useImperial]);

  // Initialize display inputs on mount
  useEffect(() => {
    setDisplayInputs({
      fcvPosition: metricInputs.fcvPosition.toString(),
      tcvPosition: metricInputs.tcvPosition.toString(),
      acidFlowFinal: metricInputs.acidFlowFinal.toString(),
      coolerK: metricInputs.coolerK.toString(),
      pumpA: metricInputs.pumpA.toString(),
      pumpB: metricInputs.pumpB.toString(),
      pumpC: metricInputs.pumpC.toString(),
      elevationDiff: metricInputs.elevationDiff.toString(),
      pipeDp: metricInputs.pipeDp.toString(),
      cvFcvMax: metricInputs.cvFcvMax.toString(),
      cvTcvMax: metricInputs.cvTcvMax.toString(),
      fluidSg: metricInputs.fluidSg.toString(),
      pumpInletHead: metricInputs.pumpInletHead.toString()
    });
  }, []);

  const handleInputChange = (field: string, displayValue: string) => {
    setDisplayInputs(prev => ({ ...prev, [field]: displayValue }));
    
    const numValue = parseFloat(displayValue);
    if (isNaN(numValue)) return;

    // Convert to metric for internal storage
    let metricValue = numValue;
    if (field === 'acidFlowFinal') {
      metricValue = toMetricFlow(numValue);
    } else if (field === 'pumpA' || field === 'pipeDp') {
      metricValue = toMetricPressure(numValue);
    } else if (field === 'elevationDiff' || field === 'pumpInletHead') {
      metricValue = toMetricLength(numValue);
    }

    setMetricInputs(prev => ({ ...prev, [field]: metricValue }));
  };

  const formatValue = (value: number | null, decimals: number = 2): string => {
    if (value === null || isNaN(value)) return "---";
    return value.toFixed(decimals);
  };

  const convertOutputPressure = (barValue: number | null): number | null => {
    if (barValue === null) return null;
    return useImperial ? barValue * BAR_TO_PSI : barValue;
  };

  const convertOutputFlow = (m3hValue: number | null): number | null => {
    if (m3hValue === null) return null;
    return useImperial ? m3hValue * M3H_TO_GPM : m3hValue;
  };

  const runSimulation = async () => {
    setIsRunningSimulation(true);
    try {
      // Always send metric values to the backend
      const response = await apiRequest('POST', '/api/drying-tower-simulation', {
        fcv_pos: metricInputs.fcvPosition,
        tcv_pos: metricInputs.tcvPosition,
        acid_flow_final: metricInputs.acidFlowFinal,
        cooler_k: metricInputs.coolerK,
        pump_a: metricInputs.pumpA,
        pump_b: metricInputs.pumpB,
        pump_c: metricInputs.pumpC,
        elevation_diff: metricInputs.elevationDiff,
        pipe_dp: metricInputs.pipeDp,
        cv_fcv_max: metricInputs.cvFcvMax,
        cv_tcv_max: metricInputs.cvTcvMax,
        fluid_sg: metricInputs.fluidSg,
        pump_inlet_head: metricInputs.pumpInletHead,
        fcv_profile: fcvProfile,
        bypass_profile: bypassProfile,
        // Profile equation parameters
        fcv_params: fcvProfile === 'quick_opening' 
          ? { a: fcvProfileParams.quick_opening.a, b: fcvProfileParams.quick_opening.b }
          : fcvProfile === 'linear'
          ? { m: fcvProfileParams.linear.m, b: fcvProfileParams.linear.b }
          : { R: fcvProfileParams.equal_percentage.R },
        bypass_params: bypassProfile === 'quick_opening'
          ? { a: bypassProfileParams.quick_opening.a, b: bypassProfileParams.quick_opening.b }
          : bypassProfile === 'linear'
          ? { m: bypassProfileParams.linear.m, b: bypassProfileParams.linear.b }
          : { R: bypassProfileParams.equal_percentage.R }
      });

      const data = await response.json();

      if (data.success && data.results) {
        const r = data.results;
        setOutputParams({
          pumpDischargePressure: r.pump_discharge_press,
          dpBypass: r.dp_bypass,
          dpFcv: r.dp_fcv,
          pInletBypCooler: r.p_inlet_byp_cooler,
          pOutBypCooler: r.p_out_byp_cooler,
          flowBypass: r.flow_bypass,
          flowCooler: r.flow_cooler,
          totalFlow: r.total_flow,
          cvBypass: r.cv_bypass,
          cvFcv: r.cv_fcv
        });
        toast({
          title: "Simulation Complete",
          description: "Hydraulic calculations completed successfully."
        });
      } else {
        throw new Error(data.error || "Simulation failed");
      }
    } catch (error: any) {
      toast({
        title: "Calculation Error",
        description: error.message || "Failed to run simulation",
        variant: "destructive"
      });
    } finally {
      setIsRunningSimulation(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/unit-operation/acid-hydraulics">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <PipetteIcon className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">Drying Tower Circuit</h1>
                  <p className="text-xs text-muted-foreground">
                    Acid Cooler Loop Hydraulic Calculator
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={useImperial ? "default" : "outline"}
                size="sm"
                onClick={() => setUseImperial(!useImperial)}
                data-testid="button-unit-toggle"
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                {useImperial ? "Imperial" : "Metric"}
              </Button>
              <Link href="/unit-operation/acid-hydraulics/drying-tower-circuit/python-code">
                <Button variant="outline" size="sm" data-testid="button-python-code">
                  <Code className="h-4 w-4 mr-2" />
                  Python Code
                </Button>
              </Link>
              <Button
                variant="default"
                size="sm"
                onClick={runSimulation}
                disabled={isRunningSimulation}
                data-testid="button-run-simulation"
              >
                {isRunningSimulation ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Simulation
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Input Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground">FCV Position (0-1)</label>
                    <Input
                      value={displayInputs.fcvPosition || ""}
                      onChange={(e) => handleInputChange("fcvPosition", e.target.value)}
                      className="h-9 text-sm"
                      data-testid="input-fcv-position"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">TCV Position (0-1)</label>
                    <Input
                      value={displayInputs.tcvPosition || ""}
                      onChange={(e) => handleInputChange("tcvPosition", e.target.value)}
                      className="h-9 text-sm"
                      data-testid="input-tcv-position"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Acid Flow Final ({flowUnit})</label>
                    <Input
                      value={displayInputs.acidFlowFinal || ""}
                      onChange={(e) => handleInputChange("acidFlowFinal", e.target.value)}
                      className="h-9 text-sm"
                      data-testid="input-acid-flow-final"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Cooler K (ΔP = K × flow²)</label>
                    <Input
                      value={displayInputs.coolerK || ""}
                      onChange={(e) => handleInputChange("coolerK", e.target.value)}
                      className="h-9 text-sm"
                      data-testid="input-cooler-k"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Pump Curve A ({pressureUnit})</label>
                    <Input
                      value={displayInputs.pumpA || ""}
                      onChange={(e) => handleInputChange("pumpA", e.target.value)}
                      className="h-9 text-sm"
                      data-testid="input-pump-a"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Pump Curve B</label>
                    <Input
                      value={displayInputs.pumpB || ""}
                      onChange={(e) => handleInputChange("pumpB", e.target.value)}
                      className="h-9 text-sm"
                      data-testid="input-pump-b"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Pump Curve C</label>
                    <Input
                      value={displayInputs.pumpC || ""}
                      onChange={(e) => handleInputChange("pumpC", e.target.value)}
                      className="h-9 text-sm"
                      data-testid="input-pump-c"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Elevation Difference ({elevationUnit})</label>
                    <Input
                      value={displayInputs.elevationDiff || ""}
                      onChange={(e) => handleInputChange("elevationDiff", e.target.value)}
                      className="h-9 text-sm"
                      data-testid="input-elevation-diff"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Pipe dP ({pressureUnit})</label>
                    <Input
                      value={displayInputs.pipeDp || ""}
                      onChange={(e) => handleInputChange("pipeDp", e.target.value)}
                      className="h-9 text-sm"
                      data-testid="input-pipe-dp"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">CV Max FCV</label>
                    <Input
                      value={displayInputs.cvFcvMax || ""}
                      onChange={(e) => handleInputChange("cvFcvMax", e.target.value)}
                      className="h-9 text-sm"
                      data-testid="input-cv-fcv-max"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">CV Max TCV</label>
                    <Input
                      value={displayInputs.cvTcvMax || ""}
                      onChange={(e) => handleInputChange("cvTcvMax", e.target.value)}
                      className="h-9 text-sm"
                      data-testid="input-cv-tcv-max"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Fluid SG</label>
                    <Input
                      value={displayInputs.fluidSg || ""}
                      onChange={(e) => handleInputChange("fluidSg", e.target.value)}
                      className="h-9 text-sm"
                      data-testid="input-fluid-sg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Pump Inlet Head ({elevationUnit})</label>
                    <Input
                      value={displayInputs.pumpInletHead || ""}
                      onChange={(e) => handleInputChange("pumpInletHead", e.target.value)}
                      className="h-9 text-sm"
                      data-testid="input-pump-inlet-head"
                    />
                  </div>
                </div>
              </div>
              
            </CardContent>
          </Card>
          
          <Card className="mt-6 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Control Valve Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ValveProfileCard
                  title="FCV Control Valve Profile"
                  profile={fcvProfile}
                  onProfileChange={setFcvProfile}
                  params={fcvProfileParams}
                  onParamsChange={setFcvProfileParams}
                  testIdPrefix="fcv"
                />
                <ValveProfileCard
                  title="Bypass Control Valve Profile"
                  profile={bypassProfile}
                  onProfileChange={setBypassProfile}
                  params={bypassProfileParams}
                  onParamsChange={setBypassProfileParams}
                  testIdPrefix="bypass"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Output Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-muted/50 rounded-md p-3 border border-dashed">
                    <div className="text-xs text-muted-foreground mb-1">Pump Discharge Pressure</div>
                    <div className="text-lg font-mono font-semibold" data-testid="output-pump-discharge">
                      {formatValue(convertOutputPressure(outputParams.pumpDischargePressure), 2)} <span className="text-xs font-normal text-muted-foreground">{pressureUnit}</span>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 border border-dashed">
                    <div className="text-xs text-muted-foreground mb-1">dP Bypass (= dP Cooler)</div>
                    <div className="text-lg font-mono font-semibold" data-testid="output-dp-bypass">
                      {formatValue(convertOutputPressure(outputParams.dpBypass), 2)} <span className="text-xs font-normal text-muted-foreground">{pressureUnit}</span>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 border border-dashed">
                    <div className="text-xs text-muted-foreground mb-1">dP FCV</div>
                    <div className="text-lg font-mono font-semibold" data-testid="output-dp-fcv">
                      {formatValue(convertOutputPressure(outputParams.dpFcv), 2)} <span className="text-xs font-normal text-muted-foreground">{pressureUnit}</span>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 border border-dashed">
                    <div className="text-xs text-muted-foreground mb-1">Total Flow (calculated)</div>
                    <div className="text-lg font-mono font-semibold" data-testid="output-total-flow">
                      {formatValue(convertOutputFlow(outputParams.totalFlow), 2)} <span className="text-xs font-normal text-muted-foreground">{flowUnit}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-muted/50 rounded-md p-3 border border-dashed">
                    <div className="text-xs text-muted-foreground mb-1">Inlet Pressure Bypass & Cooler</div>
                    <div className="text-lg font-mono font-semibold" data-testid="output-p-inlet">
                      {formatValue(convertOutputPressure(outputParams.pInletBypCooler), 2)} <span className="text-xs font-normal text-muted-foreground">{pressureUnit}</span>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 border border-dashed">
                    <div className="text-xs text-muted-foreground mb-1">Outlet Pressure Bypass & Cooler</div>
                    <div className="text-lg font-mono font-semibold" data-testid="output-p-outlet">
                      {formatValue(convertOutputPressure(outputParams.pOutBypCooler), 2)} <span className="text-xs font-normal text-muted-foreground">{pressureUnit}</span>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 border border-dashed">
                    <div className="text-xs text-muted-foreground mb-1">Flow Bypass</div>
                    <div className="text-lg font-mono font-semibold" data-testid="output-flow-bypass">
                      {formatValue(convertOutputFlow(outputParams.flowBypass), 2)} <span className="text-xs font-normal text-muted-foreground">{flowUnit}</span>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 border border-dashed">
                    <div className="text-xs text-muted-foreground mb-1">Flow Cooler</div>
                    <div className="text-lg font-mono font-semibold" data-testid="output-flow-cooler">
                      {formatValue(convertOutputFlow(outputParams.flowCooler), 2)} <span className="text-xs font-normal text-muted-foreground">{flowUnit}</span>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 border border-dashed">
                    <div className="text-xs text-muted-foreground mb-1">Cv Bypass</div>
                    <div className="text-lg font-mono font-semibold" data-testid="output-cv-bypass">
                      {formatValue(outputParams.cvBypass, 2)}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 border border-dashed">
                    <div className="text-xs text-muted-foreground mb-1">Cv FCV</div>
                    <div className="text-lg font-mono font-semibold" data-testid="output-cv-fcv">
                      {formatValue(outputParams.cvFcv, 2)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Pump Curve</h4>
                <p>P = A - B×flow - C×flow²</p>
                <p className="mt-1">Discharge pressure decreases with flow following a quadratic characteristic curve.</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Parallel Flow Split</h4>
                <p>Total flow splits between bypass (via TCV) and cooler. Equal pressure drop across both paths.</p>
                <p className="mt-1">ΔP_cooler = K × flow_cooler²</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Valve Equations</h4>
                <p>Cv = Cv_max × position</p>
                <p className="mt-1">Flow = Cv × √(ΔP / SG)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Unit Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-semibold text-foreground">Pressure:</span> 1 bar = 14.5038 psi
              </div>
              <div>
                <span className="font-semibold text-foreground">Flow:</span> 1 m³/h = 4.40287 gpm
              </div>
              <div>
                <span className="font-semibold text-foreground">Elevation:</span> 1 m = 3.28084 ft
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
