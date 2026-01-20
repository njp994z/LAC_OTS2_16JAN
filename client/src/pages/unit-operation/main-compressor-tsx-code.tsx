import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const tsxCode = `import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Code, Play, Loader2, Calculator, Activity, Pause, RotateCcw, Download } from "lucide-react";
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
          description: \`Live value: \${pressureAtm.toFixed(4)} ATM (from \${pressureHpa.toFixed(1)} hPa)\`,
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

  // ... Component JSX continues with rendering logic for:
  // - Header with back navigation
  // - Simulation mode selection (Static/Dynamic)
  // - Common input parameters (Temp, Pressure, Barometric Pressure)
  // - Mode-specific panels (Static Calculation, Dynamic Simulation)
  // - Simulation outputs table
}`;

export default function MainCompressorTsxCode() {
  const handleDownload = () => {
    const blob = new Blob([tsxCode], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'main-compressor.tsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/unit-operation/main-compressor" data-testid="link-back">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <span className="font-semibold text-lg text-foreground">Lithium Americas</span>
          </div>
          <Button onClick={handleDownload} className="gap-2" data-testid="button-download-tsx">
            <Download className="h-4 w-4" />
            Download .tsx
          </Button>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Main Compressor TypeScript/React Code</CardTitle>
            </CardHeader>
            <CardContent>
              <SyntaxHighlighter 
                language="typescript" 
                style={vscDarkPlus}
                customStyle={{
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                }}
                showLineNumbers
              >
                {tsxCode}
              </SyntaxHighlighter>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
