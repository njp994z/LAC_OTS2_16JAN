import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, LogIn, Play, Pause, RotateCcw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  createInitialState,
  stepPID,
  PIDParameters,
  PIDState,
} from "@/lib/pidController";
import { calculateGlobalOutputs } from "@/lib/globalOutputs";

interface ControllerParams {
  setpoint: number;
  kp: number;
  ki: number;
  kd: number;
  tau: number;
  kProcess?: number; // Process gain (output units per mA)
}

interface DualDataPoint {
  time: number;
  sulfurPV: number;
  sulfurSP: number;
  compressorPV: number;
  compressorSP: number;
}

export default function DynamicSimulation() {
  const [, setLocation] = useLocation();

  // Shared global controls
  const [running, setRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1.0);
  const [dt, setDt] = useState(0.1);

  // Simulation mode controls
  const [simulationMode, setSimulationMode] = useState<"Manual" | "Automatic">("Manual");
  const [so2Setpoint, setSo2Setpoint] = useState(10.5); // % SO2
  const [plantRate, setPlantRate] = useState(2000); // MTPD (metric tons per day)

  // Sulfur Flow Controller
  const [sulfurParams, setSulfurParams] = useState<ControllerParams>({
    setpoint: 75.0,
    kp: 0.12,
    ki: 0.08,
    kd: 0.0,
    tau: 2.0,
  });
  const [sulfurState, setSulfurState] = useState<PIDState>(createInitialState());

  // Compressor RPMs Controller
  const [compressorParams, setCompressorParams] = useState<ControllerParams>({
    setpoint: 4500.0,
    kp: 0.15,
    ki: 0.10,
    kd: 0.0,
    tau: 3.0,
    kProcess: 375.0, // 375 RPM per mA
  });
  const [compressorState, setCompressorState] = useState<PIDState>(createInitialState());

  const [data, setData] = useState<DualDataPoint[]>([
    { time: 0, sulfurPV: 0, sulfurSP: 75, compressorPV: 0, compressorSP: 4500 },
  ]);

  // Controller visibility toggles
  const [sulfurFlowVisible, setSulfurFlowVisible] = useState(true);
  const [compressorRPMVisible, setCompressorRPMVisible] = useState(true);

  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const simulatedTimeAccumulator = useRef<number>(0);
  const sulfurStateRef = useRef<PIDState>(sulfurState);
  const compressorStateRef = useRef<PIDState>(compressorState);

  // Keep stateRefs in sync
  useEffect(() => {
    sulfurStateRef.current = sulfurState;
  }, [sulfurState]);

  useEffect(() => {
    compressorStateRef.current = compressorState;
  }, [compressorState]);

  useEffect(() => {
    if (running) {
      // Reset time reference when starting to prevent time jump
      lastUpdateRef.current = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const realElapsed = (now - lastUpdateRef.current) / 1000;
        lastUpdateRef.current = now;
        
        // Accumulate simulated time
        simulatedTimeAccumulator.current += realElapsed * simulationSpeed;

        // Run multiple simulation steps if needed
        let currentSulfurState = sulfurStateRef.current;
        let currentCompressorState = compressorStateRef.current;
        const newDataPoints: DualDataPoint[] = [];
        
        while (simulatedTimeAccumulator.current >= dt) {
          // Step both controllers
          const sulfurResult = stepPID(currentSulfurState, { ...sulfurParams, dt });
          const compressorResult = stepPID(currentCompressorState, { ...compressorParams, dt });
          
          currentSulfurState = sulfurResult.newState;
          currentCompressorState = compressorResult.newState;
          
          newDataPoints.push({
            time: sulfurResult.newState.time,
            sulfurPV: sulfurResult.dataPoint.pv,
            sulfurSP: sulfurResult.dataPoint.sp,
            compressorPV: compressorResult.dataPoint.pv,
            compressorSP: compressorResult.dataPoint.sp,
          });
          
          simulatedTimeAccumulator.current -= dt;
        }

        if (newDataPoints.length > 0) {
          setSulfurState(currentSulfurState);
          sulfurStateRef.current = currentSulfurState;
          setCompressorState(currentCompressorState);
          compressorStateRef.current = currentCompressorState;
          setData((prev) => {
            const newData = [...prev, ...newDataPoints];
            // Keep only last 600 points
            return newData.slice(-600);
          });
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [running, sulfurParams, compressorParams, dt, simulationSpeed]);

  const handleReset = () => {
    setRunning(false);
    
    // Reset to initial parameter values
    const initialSulfurParams: ControllerParams = {
      setpoint: 75.0,
      kp: 0.12,
      ki: 0.08,
      kd: 0.0,
      tau: 2.0,
    };
    const initialCompressorParams: ControllerParams = {
      setpoint: 4500.0,
      kp: 0.15,
      ki: 0.10,
      kd: 0.0,
      tau: 3.0,
      kProcess: 375.0, // 375 RPM per mA
    };
    
    setSulfurParams(initialSulfurParams);
    setCompressorParams(initialCompressorParams);
    
    const initialStateSulfur = createInitialState();
    const initialStateCompressor = createInitialState();
    setSulfurState(initialStateSulfur);
    sulfurStateRef.current = initialStateSulfur;
    setCompressorState(initialStateCompressor);
    compressorStateRef.current = initialStateCompressor;
    setData([{ 
      time: 0, 
      sulfurPV: 0, 
      sulfurSP: 75.0, 
      compressorPV: 0, 
      compressorSP: 4500.0 
    }]);
    lastUpdateRef.current = Date.now();
    simulatedTimeAccumulator.current = 0;
  };

  const formatNumber = (value: number, decimals: number = 2): string => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Calculate global outputs based on current process values
  const globalOutputs = useMemo(() => {
    return calculateGlobalOutputs(sulfurState.processValue, compressorState.processValue);
  }, [sulfurState.processValue, compressorState.processValue]);

  // Alarm logic
  const highTempAlarm = globalOutputs.furnaceOutletTemp > 2150;
  const highHighTempAlarm = globalOutputs.furnaceOutletTemp > 2195;
  const alarmActive = highTempAlarm || highHighTempAlarm;
  
  // Generate alarm messages
  const alarmMessages: string[] = [];
  if (highHighTempAlarm) {
    alarmMessages.push("High-High Sulfur Burner Temperature");
  }
  if (highTempAlarm && !highHighTempAlarm) {
    alarmMessages.push("High-Temperature Sulfur Furnace");
  }
  const alarmMessage = alarmMessages.length > 0 ? alarmMessages.join(", ") : "Normal";

  // Automatically set sulfur flow to 0 when High-High alarm is active
  useEffect(() => {
    if (highHighTempAlarm && sulfurParams.setpoint !== 0) {
      setSulfurParams((prev) => ({ ...prev, setpoint: 0 }));
    }
  }, [highHighTempAlarm, sulfurParams.setpoint]);

  // Automatic mode control logic
  useEffect(() => {
    if (simulationMode === "Automatic") {
      // Calculate Sulfur Flow based on Plant Rate
      // Assuming: 2000 MTPD requires ~75 gpm sulfur flow (baseline)
      // Linear relationship: Sulfur Flow (gpm) = Plant Rate (MTPD) * 0.0375
      const calculatedSulfurFlow = plantRate * 0.0375;
      
      // Calculate Compressor RPM based on SO2 Setpoint
      // Assuming: 10.5% SO2 requires 4500 RPM (baseline)
      // Inverse relationship: Lower SO2% needs more air (higher RPM)
      // Formula: RPM = 4500 * (10.5 / SO2%)
      const calculatedCompressorRPM = 4500 * (10.5 / so2Setpoint);
      
      // Update setpoints if in automatic mode
      setSulfurParams((prev) => ({ ...prev, setpoint: calculatedSulfurFlow }));
      setCompressorParams((prev) => ({ ...prev, setpoint: calculatedCompressorRPM }));
    }
  }, [simulationMode, so2Setpoint, plantRate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/demo")}
              data-testid="button-back-to-demo"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">
                Lithium Americas
              </span>
            </Link>
          </div>
          <Button
            onClick={() => setLocation("/login")}
            data-testid="button-login-header"
            className="gap-2"
          >
            <LogIn className="w-4 h-4" />
            Login
          </Button>
        </div>
      </header>

      <main className="pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1
              className="text-3xl font-semibold text-foreground mb-2"
              data-testid="text-page-title"
            >
              Dynamic Simulation Sulfur Furnace Demo
            </h1>
            <p
              className="text-lg text-muted-foreground"
              data-testid="text-page-subtitle"
            >
              Dual PID Controllers - Real-Time Control
            </p>
          </div>

          {/* Global Controls */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Global Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setRunning(!running)}
                      data-testid="button-toggle-simulation"
                      className="flex-1 gap-2"
                      variant={running ? "destructive" : "default"}
                    >
                      {running ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleReset}
                      data-testid="button-reset"
                      variant="outline"
                      className="gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="simulation-mode">Simulation Mode</Label>
                  <Select
                    value={simulationMode}
                    onValueChange={(value) => setSimulationMode(value as "Manual" | "Automatic")}
                  >
                    <SelectTrigger id="simulation-mode" data-testid="select-simulation-mode">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="Automatic">Automatic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {simulationMode === "Automatic" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="so2-setpoint">
                        SO₂ Concentration Setpoint: {formatNumber(so2Setpoint, 2)}%
                      </Label>
                      <Slider
                        id="so2-setpoint"
                        data-testid="slider-so2-setpoint"
                        min={8}
                        max={12}
                        step={0.1}
                        value={[so2Setpoint]}
                        onValueChange={([value]) => setSo2Setpoint(value)}
                      />
                      <Input
                        type="number"
                        data-testid="input-so2-setpoint"
                        value={so2Setpoint}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value)) {
                            setSo2Setpoint(Math.max(8, Math.min(12, value)));
                          }
                        }}
                        step={0.1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plant-rate">
                        Plant Rate: {formatNumber(plantRate, 0)} MTPD
                      </Label>
                      <Slider
                        id="plant-rate"
                        data-testid="slider-plant-rate"
                        min={1000}
                        max={3000}
                        step={50}
                        value={[plantRate]}
                        onValueChange={([value]) => setPlantRate(value)}
                      />
                      <Input
                        type="number"
                        data-testid="input-plant-rate"
                        value={plantRate}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value)) {
                            setPlantRate(Math.max(1000, Math.min(3000, value)));
                          }
                        }}
                        step={50}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="dt">
                    Update Interval: {formatNumber(dt, 2)} s
                  </Label>
                  <Slider
                    id="dt"
                    data-testid="slider-dt"
                    min={0.01}
                    max={0.5}
                    step={0.01}
                    value={[dt]}
                    onValueChange={([value]) => setDt(value)}
                  />
                  <Input
                    type="number"
                    data-testid="input-dt"
                    value={dt}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setDt(Math.max(0.01, Math.min(0.5, value)));
                      }
                    }}
                    step={0.01}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="speed">
                    Simulation Speed: {formatNumber(simulationSpeed, 1)}x
                  </Label>
                  <Slider
                    id="speed"
                    data-testid="slider-speed"
                    min={0.1}
                    max={20}
                    step={0.1}
                    value={[simulationSpeed]}
                    onValueChange={([value]) => setSimulationSpeed(value)}
                  />
                  <Input
                    type="number"
                    data-testid="input-speed"
                    value={simulationSpeed}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setSimulationSpeed(Math.max(0.1, Math.min(20, value)));
                      }
                    }}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <p className="text-2xl font-semibold" data-testid="text-status-value">
                    {running ? "Running" : "Stopped"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Elapsed: {formatNumber(sulfurState.time / 60, 3)} min
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Alarm Status</Label>
                  <p 
                    className={`text-2xl font-semibold ${alarmActive ? 'text-destructive' : 'text-foreground'}`}
                    data-testid="text-alarm-status"
                  >
                    {alarmActive ? "ALARM" : "Normal"}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-alarm-message">
                    {alarmMessage}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Combined Chart with Controller Visibility Controls */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Dual Controller Response</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      label={{ value: "Time (min)", position: "insideBottom", offset: -5 }}
                      domain={["dataMin", "dataMax"]}
                      tickFormatter={(value) => (value / 60).toFixed(1)}
                    />
                    <YAxis
                      yAxisId="left"
                      label={{ value: "Sulfur Flow (gpm)", angle: -90, position: "insideLeft" }}
                      domain={[0, 150]}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{ value: "Compressor RPMs", angle: 90, position: "insideRight" }}
                      domain={[0, 6000]}
                    />
                    <Tooltip />
                    <Legend />
                    {sulfurFlowVisible && (
                      <>
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="sulfurSP"
                          stroke="#ef4444"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Sulfur SP (gpm)"
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="sulfurPV"
                          stroke="#06b6d4"
                          strokeWidth={3}
                          name="Sulfur PV (gpm)"
                          dot={false}
                          isAnimationActive={false}
                        />
                      </>
                    )}
                    {compressorRPMVisible && (
                      <>
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="compressorSP"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Compressor SP (RPM)"
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="compressorPV"
                          stroke="#10b981"
                          strokeWidth={3}
                          name="Compressor PV (RPM)"
                          dot={false}
                          isAnimationActive={false}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Controller Visibility Panel */}
            <Card className="w-56">
              <CardHeader>
                <CardTitle className="text-base">Show Controllers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sulfur-flow-visible"
                    checked={sulfurFlowVisible}
                    onCheckedChange={(checked) => setSulfurFlowVisible(checked === true)}
                    data-testid="checkbox-sulfur-flow"
                  />
                  <label
                    htmlFor="sulfur-flow-visible"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Sulfur Flow
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="compressor-rpm-visible"
                    checked={compressorRPMVisible}
                    onCheckedChange={(checked) => setCompressorRPMVisible(checked === true)}
                    data-testid="checkbox-compressor-rpm"
                  />
                  <label
                    htmlFor="compressor-rpm-visible"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Compressor RPMs
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Global Outputs Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Global Outputs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Furnace Outlet Temperature</p>
                  <p
                    className="text-3xl font-semibold text-primary"
                    data-testid="text-furnace-temp"
                  >
                    {formatNumber(globalOutputs.furnaceOutletTemp, 1)} °F
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Heat balance calculation based on combustion and process conditions
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">% SO₂</p>
                  <p
                    className="text-3xl font-semibold text-primary"
                    data-testid="text-so2-percent"
                  >
                    {formatNumber(globalOutputs.so2Percent, 2)} %
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sulfur dioxide concentration in process gas
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Acid Production</p>
                  <p
                    className="text-3xl font-semibold text-primary"
                    data-testid="text-acid-production"
                  >
                    {formatNumber(globalOutputs.acidProduction, 2)} MT/day
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Metric tons of H₂SO₄ per day (MTPD)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sulfur Flow Controller */}
            <Card>
              <CardHeader>
                <CardTitle>Sulfur Flow Controller</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sulfur-setpoint">
                    Setpoint: {formatNumber(sulfurParams.setpoint, 1)} gpm
                    {simulationMode === "Automatic" && (
                      <span className="ml-2 text-xs text-muted-foreground">(Controlled by Automatic Mode)</span>
                    )}
                  </Label>
                  <Slider
                    id="sulfur-setpoint"
                    data-testid="slider-sulfur-setpoint"
                    min={0}
                    max={150}
                    step={1}
                    value={[sulfurParams.setpoint]}
                    onValueChange={([value]) =>
                      setSulfurParams({ ...sulfurParams, setpoint: value })
                    }
                    disabled={simulationMode === "Automatic"}
                  />
                  <Input
                    type="number"
                    data-testid="input-sulfur-setpoint"
                    value={sulfurParams.setpoint}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setSulfurParams({
                          ...sulfurParams,
                          setpoint: Math.max(0, Math.min(150, value)),
                        });
                      }
                    }}
                    step={0.1}
                    disabled={simulationMode === "Automatic"}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="sulfur-kp">Kp: {formatNumber(sulfurParams.kp, 3)}</Label>
                    <Input
                      type="number"
                      id="sulfur-kp"
                      data-testid="input-sulfur-kp"
                      value={sulfurParams.kp}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setSulfurParams({ 
                            ...sulfurParams, 
                            kp: Math.max(0.001, Math.min(2.0, value))
                          });
                        }
                      }}
                      step={0.001}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sulfur-ki">Ki: {formatNumber(sulfurParams.ki, 3)}</Label>
                    <Input
                      type="number"
                      id="sulfur-ki"
                      data-testid="input-sulfur-ki"
                      value={sulfurParams.ki}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setSulfurParams({ 
                            ...sulfurParams, 
                            ki: Math.max(0, Math.min(1.0, value))
                          });
                        }
                      }}
                      step={0.001}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sulfur-kd">Kd: {formatNumber(sulfurParams.kd, 3)}</Label>
                    <Input
                      type="number"
                      id="sulfur-kd"
                      data-testid="input-sulfur-kd"
                      value={sulfurParams.kd}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setSulfurParams({ 
                            ...sulfurParams, 
                            kd: Math.max(0, Math.min(2.0, value))
                          });
                        }
                      }}
                      step={0.001}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sulfur-tau">
                    Process Tau: {formatNumber(sulfurParams.tau, 2)} s
                  </Label>
                  <Input
                    type="number"
                    id="sulfur-tau"
                    data-testid="input-sulfur-tau"
                    value={sulfurParams.tau}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setSulfurParams({ 
                          ...sulfurParams, 
                          tau: Math.max(0.5, Math.min(10.0, value))
                        });
                      }
                    }}
                    step={0.1}
                  />
                </div>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm font-medium">Current Values</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Process Value</p>
                      <p className="font-semibold" data-testid="text-sulfur-pv">
                        {formatNumber(sulfurState.processValue, 2)} gpm
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Error</p>
                      <p className="font-semibold">
                        {formatNumber(sulfurParams.setpoint - sulfurState.processValue, 2)} gpm
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Manipulated Value</p>
                      <p className="font-semibold">
                        {formatNumber(sulfurState.manipulatedVariable, 2)} mA
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compressor RPMs Controller */}
            <Card>
              <CardHeader>
                <CardTitle>Compressor RPMs Controller</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="compressor-setpoint">
                    Setpoint: {formatNumber(compressorParams.setpoint, 0)} RPM
                    {simulationMode === "Automatic" && (
                      <span className="ml-2 text-xs text-muted-foreground">(Controlled by Automatic Mode)</span>
                    )}
                  </Label>
                  <Slider
                    id="compressor-setpoint"
                    data-testid="slider-compressor-setpoint"
                    min={0}
                    max={6000}
                    step={10}
                    value={[compressorParams.setpoint]}
                    onValueChange={([value]) =>
                      setCompressorParams({ ...compressorParams, setpoint: value })
                    }
                    disabled={simulationMode === "Automatic"}
                  />
                  <Input
                    type="number"
                    data-testid="input-compressor-setpoint"
                    value={compressorParams.setpoint}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setCompressorParams({
                          ...compressorParams,
                          setpoint: Math.max(0, Math.min(6000, value)),
                        });
                      }
                    }}
                    step={10}
                    disabled={simulationMode === "Automatic"}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="compressor-kp">Kp: {formatNumber(compressorParams.kp, 3)}</Label>
                    <Input
                      type="number"
                      id="compressor-kp"
                      data-testid="input-compressor-kp"
                      value={compressorParams.kp}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setCompressorParams({ 
                            ...compressorParams, 
                            kp: Math.max(0.001, Math.min(2.0, value))
                          });
                        }
                      }}
                      step={0.001}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="compressor-ki">Ki: {formatNumber(compressorParams.ki, 3)}</Label>
                    <Input
                      type="number"
                      id="compressor-ki"
                      data-testid="input-compressor-ki"
                      value={compressorParams.ki}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setCompressorParams({ 
                            ...compressorParams, 
                            ki: Math.max(0, Math.min(1.0, value))
                          });
                        }
                      }}
                      step={0.001}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="compressor-kd">Kd: {formatNumber(compressorParams.kd, 3)}</Label>
                    <Input
                      type="number"
                      id="compressor-kd"
                      data-testid="input-compressor-kd"
                      value={compressorParams.kd}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setCompressorParams({ 
                            ...compressorParams, 
                            kd: Math.max(0, Math.min(2.0, value))
                          });
                        }
                      }}
                      step={0.001}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compressor-tau">
                    Process Tau: {formatNumber(compressorParams.tau, 2)} s
                  </Label>
                  <Input
                    type="number"
                    id="compressor-tau"
                    data-testid="input-compressor-tau"
                    value={compressorParams.tau}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setCompressorParams({ 
                          ...compressorParams, 
                          tau: Math.max(0.5, Math.min(10.0, value))
                        });
                      }
                    }}
                    step={0.1}
                  />
                </div>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm font-medium">Current Values</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Process Value</p>
                      <p className="font-semibold" data-testid="text-compressor-pv">
                        {formatNumber(compressorState.processValue, 0)} RPM
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Error</p>
                      <p className="font-semibold">
                        {formatNumber(compressorParams.setpoint - compressorState.processValue, 0)} RPM
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Manipulated Value</p>
                      <p className="font-semibold">
                        {formatNumber(compressorState.manipulatedVariable, 2)} mA
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              This dual-loop dynamic simulation models two independent PID control loops running simultaneously. 
              Each controller has its own tuning parameters (Kp, Ki, Kd, Tau), while sharing common simulation settings 
              (Update Interval and Simulation Speed). Global outputs are calculated in real-time based on thermodynamic 
              heat and material balance.
            </p>
            <Button
              onClick={() => setLocation("/login")}
              data-testid="button-login-to-interact"
              className="gap-2"
            >
              <LogIn className="w-4 h-4" />
              Login to Access Full Training Simulator
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
