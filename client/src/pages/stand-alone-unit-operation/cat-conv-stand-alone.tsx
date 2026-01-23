import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Settings, Play } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import expLogo from "@/assets/exp-logo.png";

export default function CatalyticReactor() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Catalyst configuration state (existing)
  const [pass1Type1, setPass1Type1] = useState("MECS GR330");
  const [pass1Liters1, setPass1Liters1] = useState("12.0");
  const [pass1Activity1, setPass1Activity1] = useState("100.00");
  const [pass1Type2, setPass1Type2] = useState("MECS Super Gear XLP-310");
  const [pass1Liters2, setPass1Liters2] = useState("24");
  const [pass1Activity2, setPass1Activity2] = useState("100.00");
  
  const [pass2Type1, setPass2Type1] = useState("MECS Super Gear XLP-310");
  const [pass2Liters1, setPass2Liters1] = useState("40.0");
  const [pass2Activity1, setPass2Activity1] = useState("100.00");
  
  const [pass3Type1, setPass3Type1] = useState("MECS Super Gear XLP-310");
  const [pass3Liters1, setPass3Liters1] = useState("45.0");
  const [pass3Activity1, setPass3Activity1] = useState("100.00");
  
  const [pass4Type1, setPass4Type1] = useState("MECS Super Gear XLP-310");
  const [pass4Liters1, setPass4Liters1] = useState("25.0");
  const [pass4Activity1, setPass4Activity1] = useState("100.00");
  const [pass4Type2, setPass4Type2] = useState("Topsoe VK69");
  const [pass4Liters2, setPass4Liters2] = useState("25.0");
  const [pass4Activity2, setPass4Activity2] = useState("100.00");

  // Simulation Input State - Pass 1 Inlet Gas Composition
  const [so2Percent, setSo2Percent] = useState("11.3");
  const [so3Percent, setSo3Percent] = useState("0.2");
  const [o2Percent, setO2Percent] = useState("9.5");
  const [co2Percent, setCo2Percent] = useState("0");
  const [n2Percent, setN2Percent] = useState("");
  const [totalPercent, setTotalPercent] = useState("");
  const [pBarr, setPBarr] = useState("0.85");
  const [ipatSo3Removal, setIpatSo3Removal] = useState("100");

  // Simulation Input State - Process Inputs
  const [plantRate, setPlantRate] = useState("2,480");
  const [pass1InletVelocity, setPass1InletVelocity] = useState("145");
  const [pass1InletTemp, setPass1InletTemp] = useState("390");
  const [pass2InletTemp, setPass2InletTemp] = useState("420");
  const [pass3InletTemp, setPass3InletTemp] = useState("440");
  const [pass4InletTemp, setPass4InletTemp] = useState("390");
  const [pass1InletPres, setPass1InletPres] = useState("150");
  const [pass2InletPres, setPass2InletPres] = useState("135");
  const [pass3InletPres, setPass3InletPres] = useState("100");
  const [pass4InletPres, setPass4InletPres] = useState("60");

  // Simulation Output State
  const [simulationResults, setSimulationResults] = useState<any>(null);

  const catalystTypes = [
    " ",
    "Topsoe VK69",
    "MECS Super Gear XLP-310",
    "MECS GR330",
  ];

  // Mutation for running simulation
  const runSimulationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/catalytic-reactor-simulation", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setSimulationResults(data);
      toast({
        title: "Simulation Complete",
        description: "Reactor simulation completed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Simulation Error",
        description: error.message || "Failed to run simulation.",
        variant: "destructive",
      });
    },
  });

  const validateNumericInput = (value: string, fieldName: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast({
        title: "Validation Error",
        description: `${fieldName} cannot be empty.`,
        variant: "destructive",
      });
      return null;
    }
    const parsed = parseFloat(trimmed.replace(/,/g, ''));
    if (isNaN(parsed)) {
      toast({
        title: "Validation Error",
        description: `${fieldName} must be a valid number.`,
        variant: "destructive",
      });
      return null;
    }
    return parsed;
  };

  const handleRunSimulation = () => {
    // Validate all gas composition inputs
    const validatedSO2 = validateNumericInput(so2Percent, "SO2%");
    if (validatedSO2 === null) return;
    
    const validatedSO3 = validateNumericInput(so3Percent, "SO3%");
    if (validatedSO3 === null) return;
    
    const validatedO2 = validateNumericInput(o2Percent, "O2%");
    if (validatedO2 === null) return;
    
    const validatedCO2 = validateNumericInput(co2Percent, "CO2%");
    if (validatedCO2 === null) return;
    
    const validatedPBarr = validateNumericInput(pBarr, "P_Barr");
    if (validatedPBarr === null) return;
    
    const validatedIpatSo3 = validateNumericInput(ipatSo3Removal, "IPAT SO3 Removal%");
    if (validatedIpatSo3 === null) return;

    // Validate N2% and Total% (optional fields that can be empty)
    let validatedN2 = 0;
    if (n2Percent.trim()) {
      const parsed = validateNumericInput(n2Percent, "N2%");
      if (parsed === null) return;
      validatedN2 = parsed;
    }

    let validatedTotal = 0;
    if (totalPercent.trim()) {
      const parsed = validateNumericInput(totalPercent, "Total%");
      if (parsed === null) return;
      validatedTotal = parsed;
    }

    // Validate all process inputs
    const validatedPlantRate = validateNumericInput(plantRate, "Plant Rate");
    if (validatedPlantRate === null) return;
    
    const validatedPass1Velocity = validateNumericInput(pass1InletVelocity, "Pass 1 Inlet Velocity");
    if (validatedPass1Velocity === null) return;
    
    const validatedPass1Temp = validateNumericInput(pass1InletTemp, "Pass 1 Inlet Temp");
    if (validatedPass1Temp === null) return;
    
    const validatedPass2Temp = validateNumericInput(pass2InletTemp, "Pass 2 Inlet Temp");
    if (validatedPass2Temp === null) return;
    
    const validatedPass3Temp = validateNumericInput(pass3InletTemp, "Pass 3 Inlet Temp");
    if (validatedPass3Temp === null) return;
    
    const validatedPass4Temp = validateNumericInput(pass4InletTemp, "Pass 4 Inlet Temp");
    if (validatedPass4Temp === null) return;
    
    const validatedPass1Pres = validateNumericInput(pass1InletPres, "Pass 1 Inlet Pres");
    if (validatedPass1Pres === null) return;
    
    const validatedPass2Pres = validateNumericInput(pass2InletPres, "Pass 2 Inlet Pres");
    if (validatedPass2Pres === null) return;
    
    const validatedPass3Pres = validateNumericInput(pass3InletPres, "Pass 3 Inlet Pres");
    if (validatedPass3Pres === null) return;
    
    const validatedPass4Pres = validateNumericInput(pass4InletPres, "Pass 4 Inlet Pres");
    if (validatedPass4Pres === null) return;

    // Validate catalyst parameters
    const validatedPass1Liters1 = validateNumericInput(pass1Liters1, "Pass 1 Catalyst Loading");
    if (validatedPass1Liters1 === null) return;
    
    const validatedPass1Activity1 = validateNumericInput(pass1Activity1, "Pass 1 Activity");
    if (validatedPass1Activity1 === null) return;
    
    const validatedPass2Liters1 = validateNumericInput(pass2Liters1, "Pass 2 Catalyst Loading");
    if (validatedPass2Liters1 === null) return;
    
    const validatedPass2Activity1 = validateNumericInput(pass2Activity1, "Pass 2 Activity");
    if (validatedPass2Activity1 === null) return;
    
    const validatedPass3Liters1 = validateNumericInput(pass3Liters1, "Pass 3 Catalyst Loading");
    if (validatedPass3Liters1 === null) return;
    
    const validatedPass3Activity1 = validateNumericInput(pass3Activity1, "Pass 3 Activity");
    if (validatedPass3Activity1 === null) return;
    
    const validatedPass4Liters1 = validateNumericInput(pass4Liters1, "Pass 4 Catalyst Loading");
    if (validatedPass4Liters1 === null) return;
    
    const validatedPass4Activity1 = validateNumericInput(pass4Activity1, "Pass 4 Activity");
    if (validatedPass4Activity1 === null) return;

    const inputData = {
      gasComposition: {
        so2Percent: validatedSO2,
        so3Percent: validatedSO3,
        o2Percent: validatedO2,
        co2Percent: validatedCO2,
        n2Percent: validatedN2,
        totalPercent: validatedTotal,
        pBarr: validatedPBarr,
        ipatSo3Removal: validatedIpatSo3,
      },
      processInputs: {
        plantRate: validatedPlantRate,
        pass1InletVelocity: validatedPass1Velocity,
        pass1InletTemp: validatedPass1Temp,
        pass2InletTemp: validatedPass2Temp,
        pass3InletTemp: validatedPass3Temp,
        pass4InletTemp: validatedPass4Temp,
        pass1InletPres: validatedPass1Pres,
        pass2InletPres: validatedPass2Pres,
        pass3InletPres: validatedPass3Pres,
        pass4InletPres: validatedPass4Pres,
      },
      catalystConfig: {
        pass1Type1,
        pass1Liters1: validatedPass1Liters1,
        pass1Activity1: validatedPass1Activity1,
        pass2Type1,
        pass2Liters1: validatedPass2Liters1,
        pass2Activity1: validatedPass2Activity1,
        pass3Type1,
        pass3Liters1: validatedPass3Liters1,
        pass3Activity1: validatedPass3Activity1,
        pass4Type1,
        pass4Liters1: validatedPass4Liters1,
        pass4Activity1: validatedPass4Activity1,
      },
    };
    runSimulationMutation.mutate(inputData);
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
              data-testid="button-back-unit-ops"
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-semibold text-foreground">Catalytic Reactor Stand-Alone Simulation</h1>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed max-w-5xl">
              Configure the catalytic reactor and catalyst (vanadium pentoxide on diatoms) parameters, including number of catalyst beds, 
              catalyst activities (catalyst can deactivate over time), catalyst loading & types, pressure drop parameters, 
              etc. These settings directly affect SO₂ → SO₃ conversion efficiency, pressure drop, and acid plant production.
            </p>
            <div className="mt-6">
              <Button 
                variant="default"
                onClick={() => setLocation("/catalyst-parameter-database")}
                data-testid="button-catalyst-parameter-database"
              >
                Catalyst Parameter Database
              </Button>
            </div>
          </div>

          {/* CONVERTER OUTPUTS - Displayed at the top */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Converter Outputs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Emissions Column */}
                <div className="space-y-3">
                  <div className="grid grid-cols-[180px_1fr_1fr] items-center gap-2">
                    <Label className="text-sm">Emissions:</Label>
                    <span className="text-sm text-muted-foreground" data-testid="output-emissions-lbso2">
                      {simulationResults?.emissions?.lbSO2ST || "--"} lbSO2/ST
                    </span>
                    <span className="text-sm text-muted-foreground" data-testid="output-emissions-kgso2">
                      {simulationResults?.emissions?.kgSO2MT || "--"} KgSO2/MT
                    </span>
                  </div>
                  <div className="grid grid-cols-[180px_1fr] items-center gap-2">
                    <Label className="text-sm">Emissions:</Label>
                    <span className="text-sm text-muted-foreground" data-testid="output-emissions-ppmv">
                      {simulationResults?.emissions?.ppmv || "--"} ppmv
                    </span>
                  </div>
                  <div className="grid grid-cols-[180px_1fr_1fr] items-center gap-2">
                    <Label className="text-sm">Converter Diameter:</Label>
                    <span className="text-sm text-muted-foreground" data-testid="output-converter-diameter-ft">
                      {simulationResults?.converterDiameter?.ft || "--"} ft
                    </span>
                    <span className="text-sm text-muted-foreground" data-testid="output-converter-diameter-m">
                      {simulationResults?.converterDiameter?.m || "--"} m
                    </span>
                  </div>
                </div>

                {/* Pass Conversions Column */}
                <div className="space-y-3">
                  <div className="grid grid-cols-[120px_80px_80px_80px] items-center gap-2">
                    <Label className="text-sm">Pass</Label>
                    <Label className="text-sm">Conversion</Label>
                    <Label className="text-sm">Overall Conversion</Label>
                    <Label className="text-sm">Equilibrium</Label>
                  </div>
                  {[1, 2, 3, 4].map((pass) => (
                    <div key={pass} className="grid grid-cols-[120px_80px_80px_80px] items-center gap-2">
                      <Label className="text-sm">Pass {pass}:</Label>
                      <span className="text-sm text-muted-foreground" data-testid={`output-pass${pass}-conversion`}>
                        {simulationResults?.passConversions?.[`pass${pass}`]?.conversion || "--"} %
                      </span>
                      <span className="text-sm text-muted-foreground" data-testid={`output-pass${pass}-overall`}>
                        {simulationResults?.passConversions?.[`pass${pass}`]?.overall || "--"} %
                      </span>
                      <span className="text-sm text-muted-foreground" data-testid={`output-pass${pass}-equilibrium`}>
                        {simulationResults?.passConversions?.[`pass${pass}`]?.equilibrium || "--"} %
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pressure Drops & Volumes Column */}
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((pass) => (
                    <div key={pass} className="grid grid-cols-[100px_1fr_1fr] items-center gap-2">
                      <Label className="text-sm">Pass {pass} dP:</Label>
                      <span className="text-sm text-muted-foreground" data-testid={`output-pass${pass}-dp-inwc`}>
                        {simulationResults?.pressureDrops?.[`pass${pass}`]?.inWC || "--"} in. wc
                      </span>
                      <span className="text-sm text-muted-foreground" data-testid={`output-pass${pass}-dp-mmwc`}>
                        {simulationResults?.pressureDrops?.[`pass${pass}`]?.mmWC || "--"} mm wc
                      </span>
                    </div>
                  ))}
                  {[1, 2, 3, 4].map((pass) => (
                    <div key={pass} className="grid grid-cols-[100px_1fr] items-center gap-2 mt-3">
                      <Label className="text-sm">Pass {pass}:</Label>
                      <span className="text-sm text-muted-foreground" data-testid={`output-pass${pass}-volume`}>
                        {simulationResults?.volumes?.[`pass${pass}`] || "--"} L
                      </span>
                    </div>
                  ))}
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2 mt-3 pt-3 border-t">
                    <Label className="text-sm font-semibold">Total:</Label>
                    <span className="text-sm text-muted-foreground font-semibold" data-testid="output-total-volume">
                      {simulationResults?.volumes?.total || "--"} L
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SIMULATION INPUTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pass 1 Inlet Gas Composition */}
            <Card>
              <CardHeader>
                <CardTitle>Pass 1 Inlet Gas Composition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">SO2 %:</Label>
                  <Input
                    value={so2Percent}
                    onChange={(e) => setSo2Percent(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-so2-percent"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">SO3 %:</Label>
                  <Input
                    value={so3Percent}
                    onChange={(e) => setSo3Percent(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-so3-percent"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">O2 %:</Label>
                  <Input
                    value={o2Percent}
                    onChange={(e) => setO2Percent(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-o2-percent"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">CO2 %:</Label>
                  <Input
                    value={co2Percent}
                    onChange={(e) => setCo2Percent(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-co2-percent"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">N2 %:</Label>
                  <Input
                    value={n2Percent}
                    onChange={(e) => setN2Percent(e.target.value)}
                    placeholder="--"
                    className="text-primary font-semibold"
                    data-testid="input-n2-percent"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">Total %:</Label>
                  <Input
                    value={totalPercent}
                    onChange={(e) => setTotalPercent(e.target.value)}
                    placeholder="--"
                    className="text-primary font-semibold"
                    data-testid="input-total-percent"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">P_Barr:</Label>
                  <Input
                    value={pBarr}
                    onChange={(e) => setPBarr(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-p-barr"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-sm">IPAT SO3 Removal:</Label>
                  <Input
                    value={ipatSo3Removal}
                    onChange={(e) => setIpatSo3Removal(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-ipat-so3-removal"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Process Inputs */}
            <Card>
              <CardHeader>
                <CardTitle>Process Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Plant Rate:</Label>
                  <Input
                    value={plantRate}
                    onChange={(e) => setPlantRate(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-plant-rate"
                  />
                  <span className="text-sm text-muted-foreground">STPD</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 1 Inlet Velocity:</Label>
                  <Input
                    value={pass1InletVelocity}
                    onChange={(e) => setPass1InletVelocity(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-pass1-inlet-velocity"
                  />
                  <span className="text-sm text-muted-foreground">alfm</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 1 Inlet Temp:</Label>
                  <Input
                    value={pass1InletTemp}
                    onChange={(e) => setPass1InletTemp(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-pass1-inlet-temp"
                  />
                  <span className="text-sm text-muted-foreground">C</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 2 Inlet Temp:</Label>
                  <Input
                    value={pass2InletTemp}
                    onChange={(e) => setPass2InletTemp(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-pass2-inlet-temp"
                  />
                  <span className="text-sm text-muted-foreground">C</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 3 Inlet Temp:</Label>
                  <Input
                    value={pass3InletTemp}
                    onChange={(e) => setPass3InletTemp(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-pass3-inlet-temp"
                  />
                  <span className="text-sm text-muted-foreground">C</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 4 Inlet Temp:</Label>
                  <Input
                    value={pass4InletTemp}
                    onChange={(e) => setPass4InletTemp(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-pass4-inlet-temp"
                  />
                  <span className="text-sm text-muted-foreground">C</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 1 Inlet Pres:</Label>
                  <Input
                    value={pass1InletPres}
                    onChange={(e) => setPass1InletPres(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-pass1-inlet-pres"
                  />
                  <span className="text-sm text-muted-foreground">in. wc</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 2 Inlet Pres:</Label>
                  <Input
                    value={pass2InletPres}
                    onChange={(e) => setPass2InletPres(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-pass2-inlet-pres"
                  />
                  <span className="text-sm text-muted-foreground">in. wc</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 3 Inlet Pres:</Label>
                  <Input
                    value={pass3InletPres}
                    onChange={(e) => setPass3InletPres(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-pass3-inlet-pres"
                  />
                  <span className="text-sm text-muted-foreground">in. wc</span>
                </div>
                <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-3">
                  <Label className="text-sm">Pass 4 Inlet Pres:</Label>
                  <Input
                    value={pass4InletPres}
                    onChange={(e) => setPass4InletPres(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-pass4-inlet-pres"
                  />
                  <span className="text-sm text-muted-foreground">in. wc</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RUN SIMULATION BUTTON */}
          <div className="mb-8 flex justify-center">
            <Button 
              size="lg"
              onClick={handleRunSimulation}
              disabled={runSimulationMutation.isPending}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-run-simulation"
            >
              <Play className="w-5 h-5 mr-2" />
              {runSimulationMutation.isPending ? "Running Simulation..." : "Run Simulation"}
            </Button>
          </div>

          {/* GRAPH PLACEHOLDER */}
          <Card className="mb-8">
            <CardContent className="py-24 flex items-center justify-center">
              <p className="text-lg text-muted-foreground">Graph to be provided later</p>
            </CardContent>
          </Card>

          {/* CATALYST PARAMETERS SECTION */}
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Catalyst Parameters</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="title-pass-1">Catalyst Parameters: Pass 1</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #1:</Label>
                      <Select value={pass1Type1} onValueChange={setPass1Type1}>
                        <SelectTrigger data-testid="select-pass1-type1">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Loading (L/ST):</Label>
                      <Input
                        value={pass1Liters1}
                        onChange={(e) => setPass1Liters1(e.target.value)}
                        placeholder="XXXX"
                        data-testid="input-pass1-liters1"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass1Activity1}
                        onChange={(e) => setPass1Activity1(e.target.value)}
                        placeholder="XX.X"
                        data-testid="input-pass1-activity1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #2:</Label>
                      <Select value={pass1Type2} onValueChange={setPass1Type2}>
                        <SelectTrigger data-testid="select-pass1-type2">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Loading (L/ST):</Label>
                      <Input
                        value={pass1Liters2}
                        onChange={(e) => setPass1Liters2(e.target.value)}
                        placeholder="XXXX"
                        data-testid="input-pass1-liters2"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass1Activity2}
                        onChange={(e) => setPass1Activity2(e.target.value)}
                        placeholder="XX.X"
                        data-testid="input-pass1-activity2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle data-testid="title-pass-2">Catalyst Parameters: Pass 2</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #1:</Label>
                      <Select value={pass2Type1} onValueChange={setPass2Type1}>
                        <SelectTrigger data-testid="select-pass2-type1">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Loading (L/ST):</Label>
                      <Input
                        value={pass2Liters1}
                        onChange={(e) => setPass2Liters1(e.target.value)}
                        placeholder="XXXX"
                        data-testid="input-pass2-liters1"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass2Activity1}
                        onChange={(e) => setPass2Activity1(e.target.value)}
                        placeholder="XX.X"
                        data-testid="input-pass2-activity1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle data-testid="title-pass-3">Catalyst Parameters: Pass 3</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #1:</Label>
                      <Select value={pass3Type1} onValueChange={setPass3Type1}>
                        <SelectTrigger data-testid="select-pass3-type1">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Loading (L/ST):</Label>
                      <Input
                        value={pass3Liters1}
                        onChange={(e) => setPass3Liters1(e.target.value)}
                        placeholder="XXXX"
                        data-testid="input-pass3-liters1"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass3Activity1}
                        onChange={(e) => setPass3Activity1(e.target.value)}
                        placeholder="XX.X"
                        data-testid="input-pass3-activity1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle data-testid="title-pass-4">Catalyst Parameters: Pass 4</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #1:</Label>
                      <Select value={pass4Type1} onValueChange={setPass4Type1}>
                        <SelectTrigger data-testid="select-pass4-type1">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Loading (L/ST):</Label>
                      <Input
                        value={pass4Liters1}
                        onChange={(e) => setPass4Liters1(e.target.value)}
                        placeholder="XXXX"
                        data-testid="input-pass4-liters1"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass4Activity1}
                        onChange={(e) => setPass4Activity1(e.target.value)}
                        placeholder="XX.X"
                        data-testid="input-pass4-activity1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #2:</Label>
                      <Select value={pass4Type2} onValueChange={setPass4Type2}>
                        <SelectTrigger data-testid="select-pass4-type2">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Loading (L/ST):</Label>
                      <Input
                        value={pass4Liters2}
                        onChange={(e) => setPass4Liters2(e.target.value)}
                        placeholder="XXXX"
                        data-testid="input-pass4-liters2"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass4Activity2}
                        onChange={(e) => setPass4Activity2(e.target.value)}
                        placeholder="XX.X"
                        data-testid="input-pass4-activity2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* BACKEND PYTHON SCRIPT */}
          <div className="mt-12 mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Backend Python Script Reference</h2>
            <Card>
              <CardHeader>
                <CardTitle>Reactor Simulation Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md overflow-x-auto">
                  <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words">
{`import numpy as np
import matplotlib.pyplot as plt
import pandas as pd

# Gas composition
y_so2 = 0.095
y_o2 = 0.11
y_so3 = 0.003
y_H2O = 0.00
y_CO2 = 0.0
y_I = 1 - y_so2 - y_o2 - y_so3 - y_H2O - y_CO2

# Flow and process conditions
FT0_tot = 267.698
P0 = 1.05
T0 = 370 * (9/5) + 491.67
T_1_0 = 390 * (9/5) + 491.67

# Catalyst
D_p = 0.1842 / 12
phi1 = 0.55
rho_c = (1 - phi1) * 93.6
act = 5`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
