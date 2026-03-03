import { Link, useLocation, useSearch } from "wouter";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Code, Play, Pause, RotateCcw, Loader2, Gauge, Calculator, Activity, Settings, Cloud, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ValveFaceplate } from "@/delta-v/components/faceplate/ValveFaceplate";
import { defaultControllerData, type ControllerData } from "@/delta-v/types/controller";
import { useControllerConfig } from "@/delta-v/contexts/ControllerConfigContext";

interface ProcessNode {
  tagId: string;
  description: string;
  pressurePsia: string;
  tempF: string;
  flowGpm: string;
  mTotalKlbHr: string;
  xSulfur: string;
  xH2o: string;
  xH2so4: string;
}

const DEFAULT_PROCESS_NODES: ProcessNode[] = [
  { tagId: "1540-PI-2600", description: "Sulfur Pump Outlet", pressurePsia: "0", tempF: "275", flowGpm: "0", mTotalKlbHr: "0", xSulfur: "1.0", xH2o: "0.00", xH2so4: "0.00" },
  { tagId: "1540-FIC-2602", description: "Control Valve Inlet", pressurePsia: "0", tempF: "275", flowGpm: "0", mTotalKlbHr: "0", xSulfur: "1.0", xH2o: "0.00", xH2so4: "0.00" },
  { tagId: "1540-PI-2604", description: "Sulfur Spray Nozzle Inlet", pressurePsia: "0", tempF: "275", flowGpm: "0", mTotalKlbHr: "0", xSulfur: "1.0", xH2o: "0.00", xH2so4: "0.00" },
];

const DEFAULT_SYSTEM_PARAMS = {
  pipe_dia_in: 4.0,
  line_length_ft: 80.0,
  deltaP_nozzle_psi: 150.0,
  furnace_static_psi: 7.0,
  friction_factor: 0.018,
  K_minor_losses: 7.5,
  SG: 1.79,
  Cv_max: 548.0,
  barometric_psia: 14.696
};

type SimulationMode = "static" | "dynamic";

interface StaticInputs {
  flow_gpm: string;
}

interface DynamicInputs {
  tau_valve: string;
  tau_flow: string;
  dt: string;
}

interface SystemParams {
  pipe_dia_in: string;
  line_length_ft: string;
  deltaP_nozzle_psi: string;
  furnace_static_psi: string;
  friction_factor: string;
  K_minor_losses: string;
  SG: string;
  Cv_max: string;
  barometric_psia: string;
  pit_level_ft: string;
}

interface StaticResults {
  status: string;
  flow_gpm: number;
  pump_head_ft: number;
  velocity_fps: number;
  friction_loss_ft: number;
  valve_inlet_psig: number;
  downstream_psig: number;
  dP_valve_psi: number;
  dP_orifice_psi: number;
  valve_position_percent: number;
  Cv_required: number;
  Cv_max: number;
  pit_level_ft: number;
  pid_output_mA: number;
}

interface DynamicState {
  time_s: number;
  setpoint_gpm: number;
  flow_gpm: number;
  valve_pos_pct: number;
  controller_output_pct: number;
  controller_output_mA: number;
  integral_error: number;
  error: number;
  pit_level_ft: number;
  Cv_current: number;
  // Hydraulic results (shared with static)
  pump_head_ft?: number;
  velocity_fps?: number;
  friction_head_ft?: number;
  valve_inlet_psia?: number;
  nozzle_inlet_psia?: number;
  dP_valve_psi?: number;
  pid_output_mA?: number;
}

export default function SulfurControlHydraulics() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const fromHomeScreen = searchParams.get('from') === 'home-screen' || searchParams.get('from') === 'l2-furnace';
  const { toast } = useToast();

  // Valve faceplate configuration (NOT using sync context for static mode)
  const VALVE_CONTROLLER_ID = '1540-FCV-2602';
  const { getControllerConfig } = useControllerConfig();
  const valveConfig = getControllerConfig(VALVE_CONTROLLER_ID);

  // Static valve position state - this is the master value for static mode (PV = SP = OUT)
  const [staticValvePosition, setStaticValvePosition] = useState<number>(50);

  const [valveFaceplateData, setValveFaceplateData] = useState<ControllerData>({
    ...defaultControllerData,
    instrumentTag: valveConfig.TAGNAME || VALVE_CONTROLLER_ID,
    description: valveConfig.DESC || 'Sulfur Feed Control Valve',
    pvUnits: valveConfig.EU || '%',
    pvRangeMin: valveConfig.PV_SCALE_LO ?? 0,
    pvRangeMax: valveConfig.PV_SCALE_HI ?? 100,
    pv: 50,  // Default static value
    sp: 50,  // PV = SP in static mode
    out: 50, // OUT = PV = SP in static mode
    mode: 'AUTO',
    valveTypeAction: valveConfig.VALVE_TYPE_ACTION || 'DA',
  });

  const [mode, setMode] = useState<SimulationMode>("static");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const [staticInputs, setStaticInputs] = useState<StaticInputs>({
    flow_gpm: "87"
  });

  const [dynamicInputs, setDynamicInputs] = useState<DynamicInputs>({
    tau_valve: "8.0",
    tau_flow: "4.0",
    dt: "0.5"
  });

  const [systemParams, setSystemParams] = useState<SystemParams>({
    pipe_dia_in: "4.0",
    line_length_ft: "80.0",
    deltaP_nozzle_psi: "150.0",
    furnace_static_psi: "7.0",
    friction_factor: "0.018",
    K_minor_losses: "7.5",
    SG: "1.79",
    Cv_max: "548.0",
    barometric_psia: "14.696",
    pit_level_ft: "7.0"
  });

  const [zipCode, setZipCode] = useState("89801");
  const [fetchingBarometric, setFetchingBarometric] = useState(false);

  const [staticResults, setStaticResults] = useState<StaticResults | null>(null);
  const [dynamicState, setDynamicState] = useState<DynamicState | null>(null);

  const [valveProfileType, setValveProfileType] = useState<string>("equal_percentage");
  const [valveLinearM, setValveLinearM] = useState<string>("1");
  const [valveLinearB, setValveLinearB] = useState<string>("0");
  const [valveRValue, setValveRValue] = useState<string>("85");

  const [staticProcessNodes, setStaticProcessNodes] = useState<ProcessNode[]>(DEFAULT_PROCESS_NODES);
  const [dynamicProcessNodes, setDynamicProcessNodes] = useState<ProcessNode[]>(DEFAULT_PROCESS_NODES);

  // Fetch saved process nodes (read-only)
  const { data: savedStaticNodes } = useQuery<{ nodes: ProcessNode[] }>({
    queryKey: ['/api/sulfur-process-nodes', 'static'],
  });

  const { data: savedDynamicNodes } = useQuery<{ nodes: ProcessNode[] }>({
    queryKey: ['/api/sulfur-process-nodes', 'dynamic'],
  });

  // Load saved data when fetched
  useEffect(() => {
    if (savedStaticNodes?.nodes?.length) {
      setStaticProcessNodes(savedStaticNodes.nodes.map(n => ({
        tagId: n.tagId,
        description: n.description,
        pressurePsia: n.pressurePsia,
        tempF: n.tempF,
        flowGpm: n.flowGpm,
        mTotalKlbHr: n.mTotalKlbHr,
        xSulfur: n.xSulfur,
        xH2o: n.xH2o,
        xH2so4: n.xH2so4,
      })));
    }
  }, [savedStaticNodes]);

  useEffect(() => {
    if (savedDynamicNodes?.nodes?.length) {
      setDynamicProcessNodes(savedDynamicNodes.nodes.map(n => ({
        tagId: n.tagId,
        description: n.description,
        pressurePsia: n.pressurePsia,
        tempF: n.tempF,
        flowGpm: n.flowGpm,
        mTotalKlbHr: n.mTotalKlbHr,
        xSulfur: n.xSulfur,
        xH2o: n.xH2o,
        xH2so4: n.xH2so4,
      })));
    }
  }, [savedDynamicNodes]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef<DynamicState | null>(null);
  const isRunningRef = useRef<boolean>(isRunning);
  const dynamicInputsRef = useRef<DynamicInputs>(dynamicInputs);
  const systemParamsRef = useRef<SystemParams>(systemParams);

  useEffect(() => {
    stateRef.current = dynamicState;
  }, [dynamicState]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    dynamicInputsRef.current = dynamicInputs;
  }, [dynamicInputs]);

  useEffect(() => {
    systemParamsRef.current = systemParams;
  }, [systemParams]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Update valve faceplate data when static valve position changes
  // Static mode: PV = SP = OUT (all equal to valve position %)
  useEffect(() => {
    setValveFaceplateData(prev => ({
      ...prev,
      pv: staticValvePosition,
      sp: staticValvePosition,  // PV = SP in static mode
      out: staticValvePosition, // OUT = valve position in static mode
      mode: 'AUTO',
      instrumentTag: valveConfig.TAGNAME || VALVE_CONTROLLER_ID,
      description: valveConfig.DESC || 'Sulfur Feed Control Valve',
      pvUnits: valveConfig.EU || '%',
      pvRangeMin: valveConfig.PV_SCALE_LO ?? 0,
      pvRangeMax: valveConfig.PV_SCALE_HI ?? 100,
      valveTypeAction: valveConfig.VALVE_TYPE_ACTION || 'DA',
      showOutputPathIndicator: valveConfig.SHOW_OUTPUT_PATH_INDICATOR,
      showInterlockIndicator: valveConfig.SHOW_INTERLOCK_INDICATOR,
      showInterlockDiamond: valveConfig.SHOW_INTERLOCK_DIAMOND_INDICATOR,
      showLockIndicator: valveConfig.SHOW_LOCK_INDICATOR,
      showAlarmCircle: valveConfig.SHOW_ALARM_CIRCLE,
      showNoSymbol: valveConfig.SHOW_NO_SYMBOL,
      showBlueAlarmIndicator: valveConfig.SHOW_BLUE_ALARM_INDICATOR,
      showBadIOIndicator: valveConfig.SHOW_BAD_IO_INDICATOR,
      showModuleNotRunning: valveConfig.SHOW_MODULE_NOT_RUNNING,
      showValveTypeLabel: valveConfig.SHOW_VALVE_TYPE_LABEL,
      holdActive: valveConfig.HOLD_ACTIVE ?? false,
    }));
  }, [staticValvePosition, JSON.stringify(valveConfig)]); // Stabilize dependency by stringifying the config object

  const runStaticCalculation = async () => {
    setIsCalculating(true);
    try {
      const response = await apiRequest("POST", "/api/sulfur-control/static", {
        flow_gpm: parseFloat(staticInputs.flow_gpm),
        pit_level_ft: parseFloat(systemParams.pit_level_ft),
        pipe_dia_in: parseFloat(systemParams.pipe_dia_in),
        line_length_ft: parseFloat(systemParams.line_length_ft),
        deltaP_nozzle_psi: parseFloat(systemParams.deltaP_nozzle_psi),
        furnace_static_psi: parseFloat(systemParams.furnace_static_psi),
        friction_factor: parseFloat(systemParams.friction_factor),
        K_minor_losses: parseFloat(systemParams.K_minor_losses),
        SG: parseFloat(systemParams.SG),
        Cv_max: parseFloat(systemParams.Cv_max),
        barometric_psia: parseFloat(systemParams.barometric_psia),
        valve_profile_type: valveProfileType,
        R_value: parseFloat(valveRValue)
      });

      const data = await response.json();
      setStaticResults(data);

      // Update valve faceplate with calculated valve position (PV = SP = OUT)
      if (data.valve_position_percent !== undefined) {
        setStaticValvePosition(data.valve_position_percent);
      }

      // Update process nodes table with calculation results
      const flowGpm = data.flow_gpm?.toString() || "0";
      const massKlbHr = data.m_Total_klb_hr?.toString() || "0";
      const tempF = data.temperature_f?.toString() || "275";
      const pumpPsia = data.pressure_psia_pump?.toString() || "0";
      const valvePsia = data.pressure_psia_valve?.toString() || "0";
      const nozzlePsia = data.pressure_psia_nozzle?.toString() || "0";

      const newProcessNodes: ProcessNode[] = [
        {
          tagId: "1540-PI-2600",
          description: "Sulfur Pump Outlet",
          pressurePsia: pumpPsia,
          tempF: tempF,
          flowGpm: flowGpm,
          mTotalKlbHr: massKlbHr,
          xSulfur: "1.0",
          xH2o: "0.00",
          xH2so4: "0.00"
        },
        {
          tagId: "1540-FIC-2602",
          description: "Control Valve Inlet",
          pressurePsia: valvePsia,
          tempF: tempF,
          flowGpm: flowGpm,
          mTotalKlbHr: massKlbHr,
          xSulfur: "1.0",
          xH2o: "0.00",
          xH2so4: "0.00"
        },
        {
          tagId: "1540-PI-2604",
          description: "Sulfur Spray Nozzle Inlet",
          pressurePsia: nozzlePsia,
          tempF: tempF,
          flowGpm: flowGpm,
          mTotalKlbHr: massKlbHr,
          xSulfur: "1.0",
          xH2o: "0.00",
          xH2so4: "0.00"
        },
      ];

      // Update local state
      setStaticProcessNodes(newProcessNodes);

      // Save to database and invalidate cache to prevent stale data overwriting
      try {
        await apiRequest("POST", "/api/sulfur-process-nodes/static", { nodes: newProcessNodes });
        queryClient.invalidateQueries({ queryKey: ['/api/sulfur-process-nodes', 'static'] });
      } catch (saveError) {
        console.error("Failed to save process nodes:", saveError);
      }

      toast({
        title: "Calculation Complete",
        description: `Valve position: ${data.valve_position_percent}%`
      });
    } catch (error) {
      toast({
        title: "Calculation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const stepDynamic = useCallback(async () => {
    if (!isRunningRef.current) return;

    try {
      const currentState = stateRef.current;
      const inputs = dynamicInputsRef.current;
      const sysParams = systemParamsRef.current;
      const response = await apiRequest("POST", "/api/sulfur-control/dynamic", {
        action: "step",
        state: currentState ? {
          time_s: currentState.time_s,
          flow_gpm: currentState.flow_gpm,
          valve_pos_pct: currentState.valve_pos_pct,
          integral_error: currentState.integral_error,
          controller_output_mA: currentState.controller_output_mA
        } : {},
        pit_level_ft: parseFloat(sysParams.pit_level_ft),
        pipe_dia_in: parseFloat(sysParams.pipe_dia_in),
        line_length_ft: parseFloat(sysParams.line_length_ft),
        deltaP_nozzle_psi: parseFloat(sysParams.deltaP_nozzle_psi),
        furnace_static_psi: parseFloat(sysParams.furnace_static_psi),
        friction_factor: parseFloat(sysParams.friction_factor),
        K_minor_losses: parseFloat(sysParams.K_minor_losses),
        SG: parseFloat(sysParams.SG),
        Cv_max: parseFloat(sysParams.Cv_max),
        barometric_psia: parseFloat(sysParams.barometric_psia),
        tau_valve: parseFloat(inputs.tau_valve),
        tau_flow: parseFloat(inputs.tau_flow),
        dt: parseFloat(inputs.dt)
      });

      const data = await response.json();
      setDynamicState(data);

      // Update dynamic process nodes table with calculation results
      const flowGpm = data.flow_gpm?.toString() || "0";
      const massKlbHr = data.m_Total_klb_hr?.toString() || "0";
      const tempF = data.temperature_f?.toString() || "275";
      const pumpPsia = data.pressure_psia_pump?.toString() || "0";
      const valvePsia = data.pressure_psia_valve?.toString() || "0";
      const nozzlePsia = data.pressure_psia_nozzle?.toString() || "0";

      setDynamicProcessNodes([
        {
          tagId: "1540-PI-2600",
          description: "Sulfur Pump Outlet",
          pressurePsia: pumpPsia,
          tempF: tempF,
          flowGpm: flowGpm,
          mTotalKlbHr: massKlbHr,
          xSulfur: "1.0",
          xH2o: "0.00",
          xH2so4: "0.00"
        },
        {
          tagId: "1540-FIC-2602",
          description: "Control Valve Inlet",
          pressurePsia: valvePsia,
          tempF: tempF,
          flowGpm: flowGpm,
          mTotalKlbHr: massKlbHr,
          xSulfur: "1.0",
          xH2o: "0.00",
          xH2so4: "0.00"
        },
        {
          tagId: "1540-PI-2604",
          description: "Sulfur Spray Nozzle Inlet",
          pressurePsia: nozzlePsia,
          tempF: tempF,
          flowGpm: flowGpm,
          mTotalKlbHr: massKlbHr,
          xSulfur: "1.0",
          xH2o: "0.00",
          xH2so4: "0.00"
        },
      ]);

      // Schedule next step only after this one finishes
      // Always wait at least 500ms after each response before sending the next request
      if (isRunningRef.current) {
        const dtMs = parseFloat(inputs.dt) * 1000;
        const delay = Math.max(dtMs, 3000);
        timerRef.current = setTimeout(stepDynamic, delay);
      }
    } catch (error) {
      console.error("Dynamic step error:", error);
      setIsRunning(false);
      isRunningRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Special handling for rate limiting
      const isRateLimit = error instanceof Error && error.message.includes("429");

      toast({
        title: isRateLimit ? "Rate Limit Exceeded" : "Simulation Error",
        description: isRateLimit
          ? "The server is receiving too many requests. The simulation has been paused. Please wait a moment before restarting."
          : (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive"
      });
    }
  }, [toast]);

  const startDynamic = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(true);
    isRunningRef.current = true;
    // Kick off the first step
    stepDynamic();
  };

  const pauseDynamic = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetDynamic = async () => {
    pauseDynamic();
    stateRef.current = null;
    try {
      const response = await apiRequest("POST", "/api/sulfur-control/dynamic", {
        action: "reset"
      });
      const data = await response.json();
      setDynamicState(data);
    } catch (error) {
      setDynamicState(null);
    }
  };

  const fetchBarometricPressure = async () => {
    if (!zipCode.trim()) {
      toast({
        title: "ZIP Code Required",
        description: "Please enter a ZIP code to fetch weather data",
        variant: "destructive"
      });
      return;
    }

    setFetchingBarometric(true);
    try {
      const response = await fetch(`/api/psychrometrics/current?zipCode=${zipCode}&countryCode=US`);
      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }
      const data = await response.json();
      // Convert hPa to psia (absolute pressure)
      // 1 atm = 1013.25 hPa = 14.696 psia
      const pressureHpa = data.conditions?.pressure || 1013.25;
      const psia = pressureHpa * 14.696 / 1013.25;
      setSystemParams(s => ({ ...s, barometric_psia: psia.toFixed(3) }));
      toast({
        title: "Pressure Updated",
        description: `Barometric: ${pressureHpa.toFixed(1)} hPa (${psia.toFixed(3)} psia)`
      });
    } catch (error) {
      toast({
        title: "Fetch Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setFetchingBarometric(false);
    }
  };

  const valveProfileData = useMemo(() => {
    const m = parseFloat(valveLinearM) || 0;
    const b = parseFloat(valveLinearB) || 0;
    const R = parseFloat(valveRValue) || 85;
    const Cv_max = parseFloat(systemParams.Cv_max) || 548;
    const data = [];
    for (let x = 0; x <= 100; x += 2) {
      let y = 0;
      if (valveProfileType === "linear") {
        // Linear: Cv/Cv_max = position/100
        y = m * x + b;
      } else if (valveProfileType === "equal_percentage") {
        // Equal percentage: Cv(p) = (Cv_max / R) * R^(p/100)
        // Normalized to percentage: y = 100 * Cv(p) / Cv_max = (100 / R) * R^(p/100)
        const pos_frac = x / 100;
        const Cv_at_pos = (Cv_max / R) * Math.pow(R, pos_frac);
        y = 100 * (Cv_at_pos / Cv_max);
      }
      y = Math.max(0, Math.min(100, y));
      data.push({ positioner: x, cv: y });
    }
    return data;
  }, [valveProfileType, valveLinearM, valveLinearB, valveRValue, systemParams.Cv_max]);

  const isStaticMode = mode === "static";
  const isDynamicMode = mode === "dynamic";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation(fromHomeScreen ? "/settings/controller-outputs/faceplates/home-screen" : "/unit-operation-simulator")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Gauge className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">Sulfur Control Hydraulics</h1>
                  <p className="text-xs text-muted-foreground">
                    Molten Sulfur Flow Control System Simulator
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("/attached_assets/Sulfur_Feed_Pump_1766607751245.pdf", "_blank")}
                data-testid="button-sulfur-pump-datasheet"
              >
                Sulfur Pump
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("/attached_assets/1540-FCV-2602_Sulfur_Feed_Control_Valve_1766607872776.pdf", "_blank")}
                data-testid="button-sulfur-valve-datasheet"
              >
                Sulfur Control Valve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("/attached_assets/Motor_Data_Sheet_Sulfur_Feed_Pump_1766607940359.pdf", "_blank")}
                data-testid="button-sulfur-motor-datasheet"
              >
                Sulfur Pump Motor
              </Button>
              <Link href="/unit-operation/sulfur-control-hydraulics/python-code/gui">
                <Button variant="outline" size="sm" data-testid="button-view-gui-code">
                  <Code className="h-4 w-4 mr-2" />
                  GUI Code
                </Button>
              </Link>
              <Link href="/unit-operation/sulfur-control-hydraulics/python-code/static">
                <Button variant="outline" size="sm" data-testid="button-view-static-code">
                  <Code className="h-4 w-4 mr-2" />
                  Static Code
                </Button>
              </Link>
              <Link href="/unit-operation/sulfur-control-hydraulics/python-code/dynamic">
                <Button variant="outline" size="sm" data-testid="button-view-dynamic-code">
                  <Code className="h-4 w-4 mr-2" />
                  Dynamic Code
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Mode Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                Simulation Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={mode} onValueChange={(v: SimulationMode) => setMode(v)}>
                <SelectTrigger className="w-64" data-testid="select-mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Static Calculation
                    </div>
                  </SelectItem>
                  <SelectItem value="dynamic">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Dynamic Simulation
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Valve Faceplate Display */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                1540-FCV-2602 - Sulfur Feed Control Valve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <ValveFaceplate
                  data={valveFaceplateData}
                  onSelect={() => console.log('Valve faceplate selected:', VALVE_CONTROLLER_ID)}
                  isTransparent={valveConfig.TRANSPARENT_BG}
                />
                <Link href="/settings/controller-outputs/faceplates/valve-blocks/flow-control/1540-fcv-2602">
                  <Button variant="outline" size="sm" data-testid="button-configure-valve">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Valve (3E)
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* System Parameters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Pit Level (ft)</label>
                  <Input
                    type="number"
                    step="any"
                    value={systemParams.pit_level_ft}
                    onChange={(e) => setSystemParams(s => ({ ...s, pit_level_ft: e.target.value }))}
                    data-testid="input-sys-pit-level"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Pipe Diameter (in)</label>
                  <Input
                    type="number"
                    step="any"
                    value={systemParams.pipe_dia_in}
                    onChange={(e) => setSystemParams(s => ({ ...s, pipe_dia_in: e.target.value }))}
                    data-testid="input-sys-pipe-dia"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Line Length (ft)</label>
                  <Input
                    type="number"
                    step="any"
                    value={systemParams.line_length_ft}
                    onChange={(e) => setSystemParams(s => ({ ...s, line_length_ft: e.target.value }))}
                    data-testid="input-sys-line-length"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Nozzle ΔP (psi)</label>
                  <Input
                    type="number"
                    step="any"
                    value={systemParams.deltaP_nozzle_psi}
                    onChange={(e) => setSystemParams(s => ({ ...s, deltaP_nozzle_psi: e.target.value }))}
                    data-testid="input-sys-nozzle-dp"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Furnace Pressure (psig)</label>
                  <Input
                    type="number"
                    step="any"
                    value={systemParams.furnace_static_psi}
                    onChange={(e) => setSystemParams(s => ({ ...s, furnace_static_psi: e.target.value }))}
                    data-testid="input-sys-furnace-p"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Friction Factor</label>
                  <Input
                    type="number"
                    step="any"
                    value={systemParams.friction_factor}
                    onChange={(e) => setSystemParams(s => ({ ...s, friction_factor: e.target.value }))}
                    data-testid="input-sys-friction"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">K Minor Losses</label>
                  <Input
                    type="number"
                    step="any"
                    value={systemParams.K_minor_losses}
                    onChange={(e) => setSystemParams(s => ({ ...s, K_minor_losses: e.target.value }))}
                    data-testid="input-sys-k-minor"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Sulfur SG</label>
                  <Input
                    type="number"
                    step="any"
                    value={systemParams.SG}
                    onChange={(e) => setSystemParams(s => ({ ...s, SG: e.target.value }))}
                    data-testid="input-sys-sg"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Cv Max</label>
                  <Input
                    type="number"
                    step="any"
                    value={systemParams.Cv_max}
                    onChange={(e) => setSystemParams(s => ({ ...s, Cv_max: e.target.value }))}
                    data-testid="input-sys-cv-max"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Barometric P (psia)</label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      step="any"
                      value={systemParams.barometric_psia}
                      onChange={(e) => setSystemParams(s => ({ ...s, barometric_psia: e.target.value }))}
                      data-testid="input-sys-barometric"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={fetchBarometricPressure}
                      disabled={fetchingBarometric}
                      title="Fetch from weather data"
                      data-testid="button-fetch-barometric"
                    >
                      {fetchingBarometric ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Weather ZIP Code</label>
                  <Input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="89801"
                    data-testid="input-sys-zipcode"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sulfur Control Valve Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Sulfur Control Valve Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart */}
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={valveProfileData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                      <XAxis
                        dataKey="positioner"
                        label={{ value: "Positioner", position: "bottom", offset: 10 }}
                        domain={[0, 100]}
                        ticks={[0, 8, 18, 28, 38, 48, 58, 68, 78, 88, 100]}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        label={{ value: "Cv %", angle: -90, position: "insideLeft", offset: 10 }}
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px"
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, "Cv"]}
                        labelFormatter={(label) => `Positioner: ${label}%`}
                      />
                      <Line
                        type="linear"
                        dataKey="cv"
                        stroke="hsl(217, 91%, 60%)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    <span className="font-semibold">
                      {valveProfileType === "linear" ? "Linear" : "Equal Percentage"}
                    </span>
                    <div className="font-mono text-xs mt-1">
                      {valveProfileType === "linear" ? "y = m * x + b" : "Cv(p) = (Cv_max / R) * R^(p/100)"}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Sulfur Control Valve Profile</label>
                    <Select value={valveProfileType} onValueChange={setValveProfileType}>
                      <SelectTrigger data-testid="select-valve-profile">
                        <SelectValue placeholder="Select profile" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="equal_percentage">Equal Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {valveProfileType === "equal_percentage" && (
                    <div>
                      <label className="text-sm text-muted-foreground">Rangeability (R)</label>
                      <Input
                        type="number"
                        step="any"
                        value={valveRValue}
                        onChange={(e) => setValveRValue(e.target.value)}
                        data-testid="input-valve-r-value"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Typical: 50-200 (default 124 based on Cv₁=25.039 at p₁=30.6%)
                      </p>
                    </div>
                  )}

                  {valveProfileType === "linear" && (
                    <div>
                      <label className="text-sm text-muted-foreground">Linear (m)</label>
                      <Input
                        type="number"
                        step="any"
                        value={valveLinearM}
                        onChange={(e) => setValveLinearM(e.target.value)}
                        data-testid="input-valve-linear-m"
                      />
                    </div>
                  )}

                  {valveProfileType === "linear" && (
                    <div>
                      <label className="text-sm text-muted-foreground">Linear (b)</label>
                      <Input
                        type="number"
                        step="any"
                        value={valveLinearB}
                        onChange={(e) => setValveLinearB(e.target.value)}
                        data-testid="input-valve-linear-b"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Static Mode Panel */}
            <Card className={!isStaticMode ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Static Calculation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Flow (GPM)</label>
                  <Input
                    type="number"
                    step="any"
                    value={staticInputs.flow_gpm}
                    onChange={(e) => setStaticInputs(s => ({ ...s, flow_gpm: e.target.value }))}
                    disabled={!isStaticMode}
                    className="max-w-xs"
                    data-testid="input-static-flow"
                  />
                </div>

                <Button
                  onClick={runStaticCalculation}
                  disabled={!isStaticMode || isCalculating}
                  className="w-full"
                  data-testid="button-calculate-static"
                >
                  {isCalculating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Calculate
                    </>
                  )}
                </Button>

              </CardContent>
            </Card>

            {/* Dynamic Mode Panel */}
            <Card className={!isDynamicMode ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Dynamic Simulation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-3 bg-blue-500/10 border-blue-500/30">
                  <label className="text-sm text-muted-foreground">PID Controller Output (mA) - Received</label>
                  <div
                    className="text-2xl font-mono font-bold text-blue-500"
                    data-testid="display-controller-output-mA"
                  >
                    {dynamicState?.controller_output_mA?.toFixed(2) ?? "4.00"} mA
                  </div>
                </div>

                <div className="border rounded-lg p-3 bg-muted/30">
                  <h4 className="text-sm font-semibold mb-2">Simulation Parameters</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">τ Valve (s)</label>
                      <Input
                        type="number"
                        step="any"
                        value={dynamicInputs.tau_valve}
                        onChange={(e) => setDynamicInputs(s => ({ ...s, tau_valve: e.target.value }))}
                        disabled={!isDynamicMode}
                        className="h-8 text-sm"
                        data-testid="input-tau-valve"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">τ Flow (s)</label>
                      <Input
                        type="number"
                        step="any"
                        value={dynamicInputs.tau_flow}
                        onChange={(e) => setDynamicInputs(s => ({ ...s, tau_flow: e.target.value }))}
                        disabled={!isDynamicMode}
                        className="h-8 text-sm"
                        data-testid="input-tau-flow"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Timestep dt (s)</label>
                      <Input
                        type="number"
                        step="any"
                        value={dynamicInputs.dt}
                        onChange={(e) => setDynamicInputs(s => ({ ...s, dt: e.target.value }))}
                        disabled={!isDynamicMode || isRunning}
                        className="h-8 text-sm"
                        data-testid="input-dt"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={startDynamic}
                    disabled={!isDynamicMode || isRunning}
                    className="flex-1"
                    data-testid="button-start-dynamic"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                  <Button
                    onClick={pauseDynamic}
                    disabled={!isDynamicMode || !isRunning}
                    variant="secondary"
                    className="flex-1"
                    data-testid="button-pause-dynamic"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button
                    onClick={resetDynamic}
                    disabled={!isDynamicMode}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-reset-dynamic"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>

                <Button
                  variant="default"
                  className="w-full"
                  disabled={!isDynamicMode}
                  onClick={() => {
                    if (isDynamicMode) {
                      setLocation("/home-screen");
                    }
                  }}
                  data-testid="button-start-scenario"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Start Scenario
                </Button>

                {isDynamicMode && (
                  <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      Live Status
                      {isRunning && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-mono" data-testid="output-time">{dynamicState?.time_s ?? 0} s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Error:</span>
                        <span className="font-mono" data-testid="output-error">{dynamicState?.error?.toFixed(2) ?? 0} GPM</span>
                      </div>
                      <div className="flex justify-between col-span-2 pt-2 border-t">
                        <span className="font-semibold">Flow:</span>
                        <span className="font-mono font-bold text-primary" data-testid="output-flow">{dynamicState?.flow_gpm?.toFixed(2) ?? 0} GPM</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Process Nodes Output Table */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Simulation Outputs - {mode === 'static' ? 'Static' : 'Dynamic'} Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hydraulic Results Section */}
              {((staticResults && isStaticMode) || (dynamicState && isDynamicMode)) && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-semibold text-sm mb-4">Hydraulic Results</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pump Head:</span>
                      <span className="font-mono" data-testid="output-pump-head">
                        {isStaticMode
                          ? staticResults?.pump_head_ft
                          : dynamicState?.pump_head_ft?.toFixed(2)} ft
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Velocity:</span>
                      <span className="font-mono" data-testid="output-velocity">
                        {isStaticMode
                          ? staticResults?.velocity_fps
                          : dynamicState?.velocity_fps?.toFixed(2)} ft/s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Friction Loss:</span>
                      <span className="font-mono" data-testid="output-friction-loss">
                        {isStaticMode
                          ? staticResults?.friction_loss_ft
                          : dynamicState?.friction_head_ft?.toFixed(2)} ft
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valve Inlet P:</span>
                      <span className="font-mono" data-testid="output-valve-inlet">
                        {isStaticMode
                          ? `${staticResults?.valve_inlet_psig} psig`
                          : `${((dynamicState?.valve_inlet_psia ?? 0) - parseFloat(systemParams.barometric_psia)).toFixed(1)} psig`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Downstream P:</span>
                      <span className="font-mono" data-testid="output-downstream">
                        {isStaticMode
                          ? `${staticResults?.downstream_psig} psig`
                          : `${((dynamicState?.nozzle_inlet_psia ?? 0) - parseFloat(systemParams.barometric_psia)).toFixed(1)} psig`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valve ΔP:</span>
                      <span className="font-mono" data-testid="output-valve-dp">
                        {isStaticMode
                          ? staticResults?.dP_valve_psi
                          : dynamicState?.dP_valve_psi?.toFixed(1)} psi
                      </span>
                    </div>
                    {isStaticMode && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">dP Orifice:</span>
                        <span className="font-mono" data-testid="output-dp-orifice">
                          {staticResults?.dP_orifice_psi} psi
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-semibold">Valve Position:</span>
                      <span className="font-mono font-bold text-primary" data-testid="output-valve-position">
                        {isStaticMode
                          ? `${staticResults?.valve_position_percent}%`
                          : `${dynamicState?.valve_pos_pct?.toFixed(4)}%`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-orange-600 dark:text-orange-400">PID Output:</span>
                      <span className="font-mono font-bold text-orange-600 dark:text-orange-400" data-testid="output-pid-ma">
                        {isStaticMode
                          ? `${staticResults?.pid_output_mA} mA`
                          : `${dynamicState?.pid_output_mA?.toFixed(4)} mA`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Cv Required:</span>
                      <span className="font-mono font-bold" data-testid="output-cv-required">
                        {isStaticMode
                          ? staticResults?.Cv_required
                          : dynamicState?.Cv_current?.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Controller Output:</span>
                      <span className="font-mono" data-testid="output-controller-pct">
                        {isStaticMode
                          ? `${((staticResults?.valve_position_percent ?? 0)).toFixed(2)}%`
                          : `${dynamicState?.controller_output_pct?.toFixed(2)}%`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Process Nodes Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-process-nodes">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium"></th>
                      <th className="text-left p-2 font-medium">Units</th>
                      <th className="text-center p-2 font-medium">
                        <div>Sulfur Pump</div>
                        <div className="text-xs text-muted-foreground">Outlet</div>
                      </th>
                      <th className="text-center p-2 font-medium">
                        <div>Control Valve</div>
                        <div className="text-xs text-muted-foreground">Inlet</div>
                      </th>
                      <th className="text-center p-2 font-medium">
                        <div>Sulfur Spray Nozzle</div>
                        <div className="text-xs text-muted-foreground">Inlet</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Sensor</td>
                      <td className="p-2 text-muted-foreground"></td>
                      {(mode === 'static' ? staticProcessNodes : dynamicProcessNodes).map((node, idx) => (
                        <td key={idx} className="p-2 text-center font-mono text-sm" data-testid={`cell-sensor-${idx}`}>
                          {node.tagId}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">x_H2SO4</td>
                      <td className="p-2 text-muted-foreground"></td>
                      {(mode === 'static' ? staticProcessNodes : dynamicProcessNodes).map((node, idx) => (
                        <td key={idx} className="p-2 text-center">
                          <div className="h-8 flex items-center justify-center font-mono text-sm bg-muted/50 rounded border border-border max-w-[80px] mx-auto" data-testid={`output-xh2so4-${idx}`}>
                            {node.xH2so4}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">x_H2O</td>
                      <td className="p-2 text-muted-foreground"></td>
                      {(mode === 'static' ? staticProcessNodes : dynamicProcessNodes).map((node, idx) => (
                        <td key={idx} className="p-2 text-center">
                          <div className="h-8 flex items-center justify-center font-mono text-sm bg-muted/50 rounded border border-border max-w-[80px] mx-auto" data-testid={`output-xh2o-${idx}`}>
                            {node.xH2o}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">x_Sulfur</td>
                      <td className="p-2 text-muted-foreground"></td>
                      {(mode === 'static' ? staticProcessNodes : dynamicProcessNodes).map((node, idx) => (
                        <td key={idx} className="p-2 text-center">
                          <div className="h-8 flex items-center justify-center font-mono text-sm bg-muted/50 rounded border border-border max-w-[80px] mx-auto" data-testid={`output-xsulfur-${idx}`}>
                            {node.xSulfur}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">m_Total</td>
                      <td className="p-2 text-muted-foreground">Klb/hr</td>
                      {(mode === 'static' ? staticProcessNodes : dynamicProcessNodes).map((node, idx) => (
                        <td key={idx} className="p-2 text-center">
                          <div className="h-8 flex items-center justify-center font-mono text-sm bg-muted/50 rounded border border-border max-w-[80px] mx-auto" data-testid={`output-mtotal-${idx}`}>
                            {node.mTotalKlbHr}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Pressure</td>
                      <td className="p-2 text-muted-foreground">psig</td>
                      {(mode === 'static' ? staticProcessNodes : dynamicProcessNodes).map((node, idx) => (
                        <td key={idx} className="p-2 text-center">
                          <div className="h-8 flex items-center justify-center font-mono text-sm bg-muted/50 rounded border border-border max-w-[80px] mx-auto" data-testid={`output-pressure-${idx}`}>
                            {mode === 'static' ? (parseFloat(node.pressurePsia) - 14.696).toFixed(3) : node.pressurePsia}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Temp.</td>
                      <td className="p-2 text-muted-foreground">F</td>
                      {(mode === 'static' ? staticProcessNodes : dynamicProcessNodes).map((node, idx) => (
                        <td key={idx} className="p-2 text-center">
                          <div className="h-8 flex items-center justify-center font-mono text-sm bg-muted/50 rounded border border-border max-w-[80px] mx-auto" data-testid={`output-temp-${idx}`}>
                            {node.tempF}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Flow</td>
                      <td className="p-2 text-muted-foreground">gpm</td>
                      {(mode === 'static' ? staticProcessNodes : dynamicProcessNodes).map((node, idx) => (
                        <td key={idx} className="p-2 text-center">
                          <div className="h-8 flex items-center justify-center font-mono text-sm bg-muted/50 rounded border border-border max-w-[80px] mx-auto" data-testid={`output-flow-${idx}`}>
                            {node.flowGpm}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
