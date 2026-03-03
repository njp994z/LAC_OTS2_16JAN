// IMPORTANT: This file was recovered via checkpoint rollback on January 8, 2026
// Prefer local (HEAD) version over remote changes unless upstream contains critical fixes
// Reviewed and resolved manually - do not blindly overwrite in future merges


import { Link, useLocation } from "wouter";
import { useState, useEffect, useCallback, useRef } from "react";
import { Rnd } from "react-rnd";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AlarmBanner from "@/delta-v/components/faceplate/AlarmBanner";
import L1SystemOverview from "@/delta-v/pages/L1-SystemOverview";
import furnaceWhbImg from "@assets/delta-v/icons/furnace-whb.png";
import blueArrowImg from "@assets/delta-v/icons/blue-arrow.png";
import jugValveImage from "@assets/delta-v/icons/jug-valve.png";
import jugValvePositionerImage from "@assets/delta-v/icons/jug-valve-positioner.png";
import converter4Img from "@assets/delta-v/process-diagrams/converter4.png";
import dt2Img from "@assets/delta-v/process-diagrams/dt2.png";
import fat1Img from "@assets/delta-v/process-diagrams/final-absorbing-tower.png";
import ipat1Img from "@assets/delta-v/process-diagrams/ipat1.png";
import hip1Img from "@assets/delta-v/process-diagrams/hip1.png";
import cipImg from "@assets/delta-v/process-diagrams/cip.png";
import sh4aImg from "@assets/delta-v/process-diagrams/sh4a.png";
import ec3bImg from "@assets/delta-v/process-diagrams/ec3b.png";
import sh1bImg from "@assets/delta-v/process-diagrams/sh1b.png";
import industrialFilterImg from "@assets/delta-v/process-diagrams/industrial-filter.png";
import converter4L4Img from "@assets/image_1769565285813.png";
import converter4PassImg from "@assets/image_1769036205978.png";
import menuIconImg from "@assets/image_1767651932939.png";
import wasteHeatBoilerImg from "@assets/image_1769462283790.png";
import yellowHorizArrowImg from "@assets/image_1769462953963.png";
import cyanLongArrowImg from "@assets/image_1769463862442.png";
import cyanUpArrowImg from "@assets/image_1769463870663.png";
import cyanLeftArrowImg from "@assets/image_1769463876416.png";
import cyanLongLeftArrowImg from "@assets/image_1769463882873.png";
import cyanUpArrow2Img from "@assets/image_1769463889633.png";
import cyanUpArrow3Img from "@assets/image_1769466572930.png";
import cyanDownArrowImg from "@assets/image_1769469181228.png";
import metalTankImg from "@assets/image_1769466606997.png";
import grayYellowArrowImg from "@assets/image_1769466978719.png";
import cyanHorizArrow2Img from "@assets/image_1769466999516.png";
import grayArrowCyanLineImg from "@assets/image_1769467350102.png";
import cyanThinLine1Img from "@assets/image_1769467420791.png";
import cyanThinLine2Img from "@assets/image_1769467426528.png";
import cyanVertLine1Img from "@assets/image_1769467433951.png";
import cyanVertLine2Img from "@assets/image_1769467436693.png";
import blackVertLineImg from "@assets/image_1769482798195.png";
import acidBoilerImg from "@assets/image_1769495696418.png";
import acidTower1Img from "@assets/l2-1520-acid-tower-1.png";
import acidTower2Img from "@assets/l2-1520-acid-tower-2.png";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { PrimaryCompressorFaceplate } from "@/delta-v/components/faceplate/PrimaryCompressorFaceplate";
import { VFDFaceplate } from "@/delta-v/components/faceplate/VFDFaceplate";
import { ControllerFaceplate } from "@/delta-v/components/faceplate/ControllerFaceplate";
import { SecondaryControllerFaceplate } from "@/delta-v/components/faceplate/SecondaryControllerFaceplate";
import { ValveFaceplate } from "@/delta-v/components/faceplate/ValveFaceplate";
import { TempSensorPrimaryFaceplate } from "@/delta-v/components/faceplate/TempSensorPrimaryFaceplate";
import { KPPFaceplate } from "@/components/KPPFaceplate";
import { TempSensorSecondaryFaceplate } from "@/delta-v/components/faceplate/TempSensorSecondaryFaceplate";
import { PrimaryTurboGeneratorFaceplate } from "@/delta-v/components/faceplate/PrimaryTurboGeneratorFaceplate";
import { TurboGeneratorProvider } from "@/delta-v/contexts/TurboGeneratorContext";
import { useCompressor } from "@/delta-v/contexts/CompressorContext";
import { useControllerSync } from "@/delta-v/contexts/ControllerSyncContext";
import { useControllerConfig } from "@/delta-v/contexts/ControllerConfigContext";
import type { ControllerData } from "@/delta-v/types/controller";
import { defaultControllerData } from "@/delta-v/types/controller";
import type { SecondaryControllerData, SecondaryControllerConfig } from "@/delta-v/types/secondaryController";
import { defaultSecondaryData, defaultSecondaryConfig } from "@/delta-v/types/secondaryController";
import { useToast } from "@/hooks/use-toast";
import { VerticalArrow } from "@/delta-v/components/VerticalArrow";
import { pfdConfigs } from "@/delta-v/config/pfdConfig";
import { VerticalLine } from "@/delta-v/components/VerticalLine";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Search,
  Activity,
  Wrench,
  RefreshCw,
  Bell,
  BellOff,
  Filter,
  History,
  ClipboardList,
  LayoutGrid,
  Settings,
  Maximize2,
  Minimize2,
  X,
  Lock,
  LockOpen,
  ChevronDown,
  Save,
  RotateCw,
  ArrowUp,
  Shapes,
  Trash2,
  FileText,
  RotateCcw,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const toolbarItems = [
  { icon: Search, label: "Search" },
  { icon: Activity, label: "Errors" },
  { icon: Wrench, label: "Tools" },
  { icon: RefreshCw, label: "Refresh" },
  { icon: Bell, label: "Alarm List" },
  { icon: BellOff, label: "Suppressed Alarm List" },
  { icon: Filter, label: "Alarm Filter" },
  { icon: History, label: "Process History View" },
  { icon: ClipboardList, label: "Batch History View" },
  { icon: LayoutGrid, label: "Batch Operator Interface" },
];

const homescreenOptions = [
  { id: "L1", label: "L1 – System Overview" },
  { id: "L2", label: "L2 – Furnace Area", isReady: true },
  { id: "L3", label: "L3 – Compressor Area" },
  { id: "L4", label: "L4-Converter", isReady: true },
  // L2_1500 SULFUR UTILITY
  { id: "L2_1500_SULFUR_UTILITY", label: "L2_1500 SULFUR UTILITY" },
  { id: "2.1", label: "2.1 L3_1520 Fin Fan Coolers" },
  { id: "2.2", label: "2.2 L3_1520 Fin Fan Expansion Tank" },
  { id: "2.3", label: "2.3 L3_1550 AP Cooling Tower" },
  { id: "2.4", label: "2.4 L3_1560 Water Distribution" },
  { id: "2.5", label: "2.5 L3_1560 Water Treatment" },
  // L2_1500 SULFUR TREATMENT
  { id: "L2_1500_SULFUR_TREATMENT", label: "L2_1500 SULFUR TREATMENT" },
  { id: "3.1", label: "3.1 L3_1510 Sulfur Scrubber" },
  { id: "3.2", label: "3.2 L3_1520 Effluent Storage" },
  { id: "3.3", label: "3.3 L3_1530 Tail Gas Scrubber" },
  // L2_1520 ACID
  { id: "L2_1520_ACID", label: "L2_1520 ACID", isReady: true },
  { id: "4.1", label: "4.1 L3_1520 Combination Pump Tank" },
  { id: "4.2", label: "4.2 L3_1520 Final Absorbing Tower" },
  { id: "4.3", label: "4.3 L3_1520 Interpass Heat Exchanger" },
  { id: "4.4", label: "4.4 L3_1520 Interpass Tower" },
  // L2_1540 SULFUR BURNER
  { id: "L2_1540_SULFUR_BURNER", label: "L2_1540 SULFUR BURNER" },
  { id: "5.1", label: "5.1 L3_1510 Sulfur Storage" },
  { id: "5.2", label: "5.2 L3_1540 Compressor" },
  { id: "5.3", label: "5.3 L3_1540 Sulfur Furnace" },
  // L2_1500 GAS
  { id: "L2_1500_GAS", label: "L2_1500 GAS" },
  { id: "6.1", label: "6.1 L3_1540 Converter" },
  { id: "6.2", label: "6.2 L3_1540 Deaerator" },
  { id: "6.3", label: "6.3 L3_1540 Waste Heat Boiler" },
  // L2_1560 TURBO GENERATOR
  { id: "L2_1560_TURBO_GENERATOR", label: "L2_1560 TURBO GENERATOR" },
  { id: "7.1", label: "7.1 L3_1560 Air Cooled Condenser" },
  { id: "7.2", label: "7.2 L3_1560 Generator" },
  { id: "7.3", label: "7.3 L3_1560 IP Aux Boiler" },
  // L2_1500 PRODUCT ACID
  { id: "L2_1500_PRODUCT_ACID", label: "L2_1500 PRODUCT ACID" },
  { id: "8.1", label: "8.1 L3_1520 Dilution Pump Tank" },
  { id: "8.2", label: "8.2 L3_1570 Product Acid" },
  { id: "8.3", label: "8.3 L3_1570 Startup Acid" },
];

const resizeHandleStyle = {
  width: '10px',
  height: '10px',
  background: '#3b82f6',
  borderRadius: '2px',
  border: '1px solid #1d4ed8',
};

const resizeHandleStyles = {
  bottomRight: { ...resizeHandleStyle, right: '-5px', bottom: '-5px' },
  bottomLeft: { ...resizeHandleStyle, left: '-5px', bottom: '-5px' },
  topRight: { ...resizeHandleStyle, right: '-5px', top: '-5px' },
  topLeft: { ...resizeHandleStyle, left: '-5px', top: '-5px' },
};

const HomeScreen = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [furnacePosition, setFurnacePosition] = useState({ x: 100, y: 100 });
  const [furnaceSize, setFurnaceSize] = useState({ width: 400, height: 150 });
  const [compressorPosition, setCompressorPosition] = useState({ x: 520, y: 100 });
  const [compressorSize, setCompressorSize] = useState({ width: 200, height: 180 });
  // Array of arrows with position, size, and rotation
  const [arrows, setArrows] = useState([
    { id: 'arrow_1', x: 180, y: 280, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_2', x: 180, y: 360, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_3', x: 180, y: 440, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_4', x: 180, y: 520, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_5', x: 450, y: 280, width: 250, height: 60, rotation: 0, color: 'yellow' as const },
    { id: 'arrow_6', x: 450, y: 360, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_7', x: 450, y: 440, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_8', x: 450, y: 520, width: 250, height: 60, rotation: 0, color: 'purple' as const },
    { id: 'arrow_9', x: 720, y: 280, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_10', x: 720, y: 360, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_11', x: 720, y: 440, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_12', x: 720, y: 520, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_13', x: 990, y: 280, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_14', x: 990, y: 360, width: 250, height: 60, rotation: 0, color: 'purple' as const },
    { id: 'arrow_15', x: 1260, y: 280, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_16', x: 1260, y: 360, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_17', x: 1260, y: 440, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_18', x: 1260, y: 520, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_19', x: 1530, y: 280, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_20', x: 1530, y: 360, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_21', x: 1530, y: 440, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_22', x: 1530, y: 520, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_23', x: 1800, y: 280, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_24', x: 1800, y: 360, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_25', x: 1800, y: 440, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_26', x: 1800, y: 520, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_27', x: 2070, y: 280, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_28', x: 2070, y: 360, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_29', x: 2070, y: 440, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_30', x: 2070, y: 520, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_31', x: 2340, y: 280, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_32', x: 2340, y: 360, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_33', x: 2340, y: 440, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_34', x: 2340, y: 520, width: 250, height: 60, rotation: 0, color: 'blue' as const },
    { id: 'arrow_35', x: 2610, y: 280, width: 250, height: 60, rotation: 0, color: 'purple' as const },
  ]);
  
  // Vertical arrows - narrow width, variable height, positioned near edges
  // Each arrow has a 'screen' property to track which view it belongs to
  // Rotation is stored in degrees (0, 90, 180, 270)
  const [verticalArrows, setVerticalArrows] = useState<Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    screen: string;
    rotation: number;
  }>>([
    { id: 'v_arrow_1', x: 50, y: 200, width: 24, height: 150, screen: 'L1 – System Overview', rotation: 0 },
  ]);
  
  // Vertical lines (without arrowheads) - narrow width, variable height
  // Each line has a 'screen' property to track which view it belongs to
  const [verticalLines, setVerticalLines] = useState<Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    screen: string;
  }>>([]);
  
  const [isLocked, setIsLocked] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState(() => {
    const saved = localStorage.getItem('deltaV_selectedScreen');
    return saved || "L1 – System Overview";
  });
  const [selectedMode, setSelectedMode] = useState("Static");
  const [instrumentFilter, setInstrumentFilter] = useState<'all' | 'controllers' | 'sensors'>('all');
  const sensorVisible = instrumentFilter === 'all' || instrumentFilter === 'sensors';
  const controllerVisible = instrumentFilter === 'all' || instrumentFilter === 'controllers';
  
  // Save selected screen to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('deltaV_selectedScreen', selectedScreen);
  }, [selectedScreen]);
  const [location] = useLocation();
  
  // Dynamic simulation state
  const [dynamicRunning, setDynamicRunning] = useState(false);
  const [dynamicSpeed, setDynamicSpeed] = useState(1.0);
  const [dynamicDt, setDynamicDt] = useState(0.12);
  const [dynamicElapsed, setDynamicElapsed] = useState(0);
  
  // Dynamic simulation elapsed time tracker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (dynamicRunning) {
      interval = setInterval(() => {
        setDynamicElapsed(prev => prev + (dynamicDt * dynamicSpeed));
      }, dynamicDt * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dynamicRunning, dynamicDt, dynamicSpeed]);

  const dynamicOrchInFlightRef = useRef(false);
  const dynamicOrchInputsRef = useRef({
    compressor_rpm_pct: 0,
    sulfur_flow_sp_gpm: 0,
    jug_valve_pct: 0,
    damper_open_pct: 0,
  });

  // Auto-start simulation when entering Dynamic/Start-Up/Emergency modes
  useEffect(() => {
    const isDynamicMode = selectedMode === "Dynamic" || selectedMode === "Start-Up" || selectedMode === "Emergency Scenarios";
    if (isDynamicMode) {
      setDynamicRunning(true);
    } else {
      setDynamicRunning(false);
      setDynamicElapsed(0);
    }
  }, [selectedMode]);

  // Reset dynamic simulation — resets state then auto-restarts
  const handleDynamicReset = () => {
    setDynamicRunning(false);
    setDynamicElapsed(0);
    setDynamicSpeed(1.0);
    setDynamicDt(0.12);
    setTimeout(() => setDynamicRunning(true), 50);
  };
  
  // Static simulation state
  const [staticSimulationRunning, setStaticSimulationRunning] = useState(false);
  const [staticSimulationResults, setStaticSimulationResults] = useState<any>(null);
  const [orchestratorResult, setOrchestratorResult] = useState<any>(null);
  const pendingStaticRecalcRef = useRef(false);
  
  const runStaticSimulation = async () => {
    if (staticSimulationRunning) {
      pendingStaticRecalcRef.current = true;
      return;
    }
    
    setStaticSimulationRunning(true);
    try {
      const pvResponse = await fetch('/api/process-variables');
      const pvData = await pvResponse.json();
      
      const spResponse = await fetch('/api/setpoint-variables');
      const spData = await spResponse.json();
      
      let rpmPercent = 78.5;
      let inletTemp = 70;
      let barometricPressure = 0.850;
      let plantCondition = "clean";
      let sulfurFlowGpm = 72;
      let jugValvePct = 4.5;
      let damperOpenPct = 100;
      
      const extractCaseValue = (variables: any[], tagPatterns: string[], caseId: string): number | null => {
        if (!variables || !caseId) return null;
        for (const pattern of tagPatterns) {
          const lowerPattern = pattern.toLowerCase();
          const variable = variables.find((v: any) => 
            v.tag === pattern || 
            v.tagNumber === pattern || 
            v.tag?.toLowerCase().includes(lowerPattern) ||
            v.description?.toLowerCase().includes(lowerPattern)
          );
          if (variable?.cases?.[caseId]) {
            const val = parseFloat(String(variable.cases[caseId]).replace(/[^0-9.-]/g, ''));
            if (!isNaN(val)) return val;
          }
        }
        return null;
      };
      
      if (pvData?.variables && activePVCaseId) {
        const rpmVal = extractCaseValue(pvData.variables, ['1540-H-4030', 'main_comp', 'compressor'], activePVCaseId);
        if (rpmVal !== null) rpmPercent = rpmVal;
        
        const tempVal = extractCaseValue(pvData.variables, ['Ambient Temperature', 'dt_inlet_temp', 'TI-4', 'inlet temp'], activePVCaseId);
        if (tempVal !== null) inletTemp = tempVal;
        
        const baroVal = extractCaseValue(pvData.variables, ['Ambient Pressure', 'ambient_pressure', 'barometric'], activePVCaseId);
        if (baroVal !== null) barometricPressure = baroVal;
        
        const plantVar = pvData.variables.find((v: any) => 
          v.tag?.includes('plant_condition') || v.description?.toLowerCase().includes('plant condition')
        );
        if (plantVar?.cases?.[activePVCaseId]) {
          const val = String(plantVar.cases[activePVCaseId]).toLowerCase();
          if (val === 'dirty' || val === 'clean') plantCondition = val;
        }
        
        const sulfurVal = extractCaseValue(pvData.variables, ['1530-F-2602', 'sulfur_flow', 'sulfur flow'], activePVCaseId);
        if (sulfurVal !== null) sulfurFlowGpm = sulfurVal;
        
        const jugVal = extractCaseValue(pvData.variables, ['1540-H-4282', 'jug_valve', 'jug valve'], activePVCaseId);
        if (jugVal !== null) jugValvePct = jugVal;
        
        const damperVal = extractCaseValue(pvData.variables, ['1540-H-4283', 'damper', 'whb_dp'], activePVCaseId);
        if (damperVal !== null) damperOpenPct = damperVal;
      }
      
      if (spData?.variables && activePVCaseId) {
        const rpmSpVal = extractCaseValue(spData.variables, ['main_comp_speed_sp', '1540-H-4030'], activePVCaseId);
        if (rpmSpVal !== null && rpmPercent === 85.5) rpmPercent = rpmSpVal;
      }
      
      if (loadedCaseValue1540H4030 !== null) rpmPercent = loadedCaseValue1540H4030;
      if (loadedCaseValueSulfurFlow !== null) sulfurFlowGpm = loadedCaseValueSulfurFlow;
      if (loadedCaseValueJugValve !== null) jugValvePct = loadedCaseValueJugValve;
      if (loadedCaseValueWHBdP !== null) damperOpenPct = loadedCaseValueWHBdP;
      
      const orchInput = {
        compressor_rpm_pct: rpmPercent,
        barometric_atm: barometricPressure,
        plant_condition: plantCondition,
        sulfur_flow_sp_gpm: sulfurFlowGpm,
        jug_valve_pct: jugValvePct,
        damper_open_pct: damperOpenPct,
        dt_acid_inlet_temp_F: inletTemp,
        mode: "static",
      };
      
      console.log('Plant orchestrator inputs:', orchInput);
      
      const simResponse = await fetch('/api/plant-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orchInput)
      });
      
      if (!simResponse.ok) {
        throw new Error('Plant orchestrator failed');
      }
      
      const orchData = await simResponse.json();
      console.log('Plant orchestrator results:', orchData);
      
      setOrchestratorResult(orchData);
      setStaticSimulationResults(orchData);
      
      if (orchData.sensor_tags) {
        const tags = orchData.sensor_tags;
        if (tags["1540-SIC-4030"] !== undefined && tags["1540-SIC-4030"] !== loadedCaseValue1540H4030) {
          console.log('Setting static case value for 1540-H-4030:', tags["1540-SIC-4030"]);
          setLoadedCaseValue1540H4030(tags["1540-SIC-4030"]);
        }
        if (tags["1540-TI-4010"] !== undefined) {
          const furnaceTemp = tags["1540-TI-4010"];
          setFurnaceOutletTemp(furnaceTemp);
          updateTempSensor4200APV(furnaceTemp);
        }
        if (tags["1540-ZI-4020"] !== undefined) {
          setLoadedCaseValueJugValve(tags["1540-ZI-4020"]);
        }
        if (tags["1540-TI-4820"] !== undefined) {
          const raw4820 = tags["1540-TI-4820"];
          updateTempSensor4820PV(typeof raw4820 === 'object' && raw4820 !== null ? (raw4820 as any).value : raw4820);
        }
      }
      
    } catch (error) {
      console.error('Static simulation error:', error);
    } finally {
      setStaticSimulationRunning(false);
      if (pendingStaticRecalcRef.current) {
        pendingStaticRecalcRef.current = false;
        setTimeout(() => runStaticSimulation(), 100);
      }
    }
  };

  // Toggle fullscreen mode
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);
  
  // Sync fullscreen state with browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Mode options for the Mode dropdown
  const modeOptions = [
    { id: "static", label: "Static" },
    { id: "dynamic", label: "Dynamic" },
    { id: "startup", label: "Start-Up" },
    { id: "emergency", label: "Emergency Scenarios" },
  ];
  
  // Track current search params to detect changes
  const [currentSearch, setCurrentSearch] = useState(window.location.search);
  
  // Helper function to read mode from URL
  const readModeFromUrl = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const modeParam = searchParams.get('mode');
    if (modeParam) {
      const modeMatch = modeOptions.find(m => m.id.toLowerCase() === modeParam.toLowerCase());
      if (modeMatch) {
        setSelectedMode(modeMatch.label);
      }
    }
  }, []);
  
  // Read mode on mount and when location/search changes
  useEffect(() => {
    readModeFromUrl();
    
    // Listen for popstate events (browser back/forward)
    const handlePopState = () => {
      setCurrentSearch(window.location.search);
      readModeFromUrl();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [readModeFromUrl]);
  
  // Check for search param changes on every location change
  useEffect(() => {
    if (window.location.search !== currentSearch) {
      setCurrentSearch(window.location.search);
      readModeFromUrl();
    }
  }, [location, currentSearch, readModeFromUrl]);
  const [isVFDModalOpen, setIsVFDModalOpen] = useState(false);
  const [isSulfurFlowModalOpen, setIsSulfurFlowModalOpen] = useState(false);
  const [sulfurFlowModelockOverride, setSulfurFlowModelockOverride] = useState(false);
  const [sulfurFlowRoutRcas, setSulfurFlowRoutRcas] = useState<'DA' | 'ROUT' | 'RCAS'>('DA');
  const [sulfurFlowBypass, setSulfurFlowBypass] = useState(false);
  const [isTempSensorModalOpen, setIsTempSensorModalOpen] = useState(false);
const [isHandControllerModalOpen, setIsHandControllerModalOpen] = useState(false);
  const [isJugValveHandControllerModalOpen, setIsJugValveHandControllerModalOpen] = useState(false);
  const [isWhbHandControllerModalOpen, setIsWhbHandControllerModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Sulfur Flow Controller position/size
  const [sulfurFlowPosition, setSulfurFlowPosition] = useState({ x: 720, y: 100 });
  const [sulfurFlowSize, setSulfurFlowSize] = useState({ width: 220, height: 200 });
  
  // Sulfur Flow Control Valve position/size
  const [sulfurValvePosition, setSulfurValvePosition] = useState({ x: 950, y: 100 });
  const [sulfurValveSize, setSulfurValveSize] = useState({ width: 120, height: 160 });
  
  // Jug Valve position/size
  const [jugValvePosition, setJugValvePosition] = useState({ x: 1080, y: 100 });
  const [jugValveSize, setJugValveSize] = useState({ width: 120, height: 160 });
  
  // Jug Valve Positioner position/size
  const [jugValvePositionerPosition, setJugValvePositionerPosition] = useState({ x: 1210, y: 100 });
  const [jugValvePositionerSize, setJugValvePositionerSize] = useState({ width: 120, height: 160 });
  
  // Hand Controller 1540-H-4030 position/size
  const [handControllerPosition, setHandControllerPosition] = useState({ x: 1340, y: 100 });
  const [handControllerSize, setHandControllerSize] = useState({ width: 220, height: 200 });
  
  // WHB Outlet dP Hand Controller 1540-H-4283 position/size
  const [whbHandControllerPosition, setWhbHandControllerPosition] = useState({ x: 850, y: 400 });
  const [whbHandControllerSize, setWhbHandControllerSize] = useState({ width: 220, height: 200 });
  
  // Jug Valve Hand Controller 1540-H-4282 position/size
  const [jugValveHandControllerPosition, setJugValveHandControllerPosition] = useState({ x: 1100, y: 400 });
  const [jugValveHandControllerSize, setJugValveHandControllerSize] = useState({ width: 220, height: 200 });
  
  // Temperature Sensor 1520-TI-5821 position/size
  const [tempSensorPosition, setTempSensorPosition] = useState({ x: 50, y: 400 });
  const [tempSensorSize, setTempSensorSize] = useState({ width: 180, height: 120 });
  
  // Temperature Sensor 1540-TI-4200A position/size
  const [tempSensor4200APosition, setTempSensor4200APosition] = useState({ x: 250, y: 400 });
  const [tempSensor4200ASize, setTempSensor4200ASize] = useState({ width: 180, height: 120 });
  const [isTempSensor4200AModalOpen, setIsTempSensor4200AModalOpen] = useState(false);
  const [isTempSensor4820ModalOpen, setIsTempSensor4820ModalOpen] = useState(false);
  
  // Temperature Sensor 1540-TI-4200B position/size
  const [tempSensor4200BPosition, setTempSensor4200BPosition] = useState({ x: 450, y: 400 });
  const [tempSensor4200BSize, setTempSensor4200BSize] = useState({ width: 180, height: 120 });
  const [isTempSensor4200BModalOpen, setIsTempSensor4200BModalOpen] = useState(false);
  
  // Temperature Sensor 1540-TI-4200C position/size
  const [tempSensor4200CPosition, setTempSensor4200CPosition] = useState({ x: 650, y: 400 });
  const [tempSensor4200CSize, setTempSensor4200CSize] = useState({ width: 180, height: 120 });
  const [isTempSensor4200CModalOpen, setIsTempSensor4200CModalOpen] = useState(false);
  
  // Dashed Line 1 position/size
  const [dashedLine1Position, setDashedLine1Position] = useState({ x: 100, y: 300 });
  const [dashedLine1Size, setDashedLine1Size] = useState({ width: 200, height: 4 });
  
  // Dashed Line 2 position/size
  const [dashedLine2Position, setDashedLine2Position] = useState({ x: 100, y: 450 });
  const [dashedLine2Size, setDashedLine2Size] = useState({ width: 200, height: 4 });
  
  // Dashed Line 3 position/size
  const [dashedLine3Position, setDashedLine3Position] = useState({ x: 100, y: 600 });
  const [dashedLine3Size, setDashedLine3Size] = useState({ width: 200, height: 4 });
  
  // Dashed Line 4 position/size
  const [dashedLine4Position, setDashedLine4Position] = useState({ x: 100, y: 750 });
  const [dashedLine4Size, setDashedLine4Size] = useState({ width: 200, height: 4 });
  
  // Dashed Line Rotations
  const [dashedLine1Rotation, setDashedLine1Rotation] = useState(0);
  const [dashedLine2Rotation, setDashedLine2Rotation] = useState(0);
  const [dashedLine3Rotation, setDashedLine3Rotation] = useState(0);
  const [dashedLine4Rotation, setDashedLine4Rotation] = useState(0);
  
  // Converter 4 position/size
  const [converter4Position, setConverter4Position] = useState({ x: 1400, y: 300 });
  const [converter4Size, setConverter4Size] = useState({ width: 150, height: 400 });
  
  // DT2 (Drying Tower) position/size
  const [dt2Position, setDt2Position] = useState({ x: 1200, y: 300 });
  const [dt2Size, setDt2Size] = useState({ width: 100, height: 280 });
  
  // FAT1 (Final Absorbing Tower) position/size
  const [fat1Position, setFat1Position] = useState({ x: 1050, y: 300 });
  const [fat1Size, setFat1Size] = useState({ width: 100, height: 280 });
  
  // IPAT1 position/size
  const [ipat1Position, setIpat1Position] = useState({ x: 900, y: 300 });
  const [ipat1Size, setIpat1Size] = useState({ width: 100, height: 250 });
  
  // HIP1 (Hot Interpass Absorber) position/size
  const [hip1Position, setHip1Position] = useState({ x: 750, y: 300 });
  const [hip1Size, setHip1Size] = useState({ width: 80, height: 200 });

  // CIP (Cold Interpass Absorber) position/size
  const [cipPosition, setCipPosition] = useState({ x: 600, y: 300 });
  const [cipSize, setCipSize] = useState({ width: 80, height: 220 });
  
  // SH4A (Superheater 4A) position/size
  const [sh4aPosition, setSh4aPosition] = useState({ x: 450, y: 300 });
  const [sh4aSize, setSh4aSize] = useState({ width: 70, height: 180 });
  
  // EC3B (Economizer 3B) position/size
  const [ec3bPosition, setEc3bPosition] = useState({ x: 350, y: 300 });
  const [ec3bSize, setEc3bSize] = useState({ width: 60, height: 160 });
  
  // SH1B (Superheater 1B) position/size
  const [sh1bPosition, setSh1bPosition] = useState({ x: 250, y: 300 });
  const [sh1bSize, setSh1bSize] = useState({ width: 60, height: 160 });
  
  // Industrial Filter position/size
  const [filterPosition, setFilterPosition] = useState({ x: 1550, y: 300 });
  const [filterSize, setFilterSize] = useState({ width: 80, height: 120 });
  
  // Turbo Generator position/size
  const [turboGeneratorPosition, setTurboGeneratorPosition] = useState({ x: 1700, y: 100 });
  const [turboGeneratorSize, setTurboGeneratorSize] = useState({ width: 220, height: 180 });
  
  // L4-Converter: Converter 4 position/size
  const [converter4L4Position, setConverter4L4Position] = useState({ x: 200, y: 100 });
  const [converter4L4Size, setConverter4L4Size] = useState({ width: 300, height: 800 });
  // L4-Converter: 1540-TI-4825 Primary Faceplate position/size
  const [faceplate4825L4Position, setFaceplate4825L4Position] = useState({ x: 600, y: 150 });
  const [faceplate4825L4Size, setFaceplate4825L4Size] = useState({ width: 160, height: 240 });
  const [tempSensor4820L4Position, setTempSensor4820L4Position] = useState({ x: 2800, y: 500 });
  const [tempSensor4820L4Size, setTempSensor4820L4Size] = useState({ width: 180, height: 120 });
  const [isSavingL4, setIsSavingL4] = useState(false);
  const [isLockedL4, setIsLockedL4] = useState(true);
  const [isL4Dirty, setIsL4Dirty] = useState(false);
  
  // L2 Hand Controller 1540-H-4030 position and size
  const [handControllerL2Position, setHandControllerL2Position] = useState({ x: 800, y: 200 });
  const [handControllerL2Size, setHandControllerL2Size] = useState({ width: 220, height: 200 });
  // L2 VFD-001 (Variable Frequency Drive) position and size
  const [vfdL2Position, setVfdL2Position] = useState({ x: 50, y: 500 });
  const [vfdL2Size, setVfdL2Size] = useState({ width: 150, height: 160 });
  // L2 Sulfur Flow Controller 1530-F-2602 position and size
  const [sulfurFlowL2Position, setSulfurFlowL2Position] = useState({ x: 250, y: 500 });
  const [sulfurFlowL2Size, setSulfurFlowL2Size] = useState({ width: 180, height: 180 });
  // L2 Sulfur Flow Control Valve 1540-FCV-2602 position and size
  const [sulfurValveL2Position, setSulfurValveL2Position] = useState({ x: 450, y: 500 });
  const [sulfurValveL2Size, setSulfurValveL2Size] = useState({ width: 100, height: 140 });
  // L2 Jug Valve Hand Controller 1540-H-4282 position and size
  const [jugValveHandControllerL2Position, setJugValveHandControllerL2Position] = useState({ x: 600, y: 500 });
  const [jugValveHandControllerL2Size, setJugValveHandControllerL2Size] = useState({ width: 180, height: 180 });
  // L2 Jug Valve HCV 1540-HCV-4282 position and size
  const [jugValveHcvL2Position, setJugValveHcvL2Position] = useState({ x: 800, y: 500 });
  const [jugValveHcvL2Size, setJugValveHcvL2Size] = useState({ width: 100, height: 140 });
  // L2 Yellow Arrow position and size
  const [yellowArrowL2Position, setYellowArrowL2Position] = useState({ x: 400, y: 700 });
  const [yellowArrowL2Size, setYellowArrowL2Size] = useState({ width: 460, height: 60 });
  // L2 Cyan Arrow position and size
  const [cyanArrowL2Position, setCyanArrowL2Position] = useState({ x: 400, y: 800 });
  const [cyanArrowL2Size, setCyanArrowL2Size] = useState({ width: 540, height: 60 });
  // L2 Sulfur Furnace 1540-ZM-001 position and size
  const [sulfurFurnaceL2Position, setSulfurFurnaceL2Position] = useState({ x: 550, y: 600 });
  const [sulfurFurnaceL2Size, setSulfurFurnaceL2Size] = useState({ width: 300, height: 200 });
  // L2 Waste Heat Boiler 1540-HX-001 position and size
  const [wasteHeatBoilerL2Position, setWasteHeatBoilerL2Position] = useState({ x: 850, y: 600 });
  const [wasteHeatBoilerL2Size, setWasteHeatBoilerL2Size] = useState({ width: 350, height: 200 });
  // L2 Yellow Horizontal Arrow position and size
  const [yellowHorizArrowL2Position, setYellowHorizArrowL2Position] = useState({ x: 350, y: 950 });
  const [yellowHorizArrowL2Size, setYellowHorizArrowL2Size] = useState({ width: 200, height: 30 });
  // L2 Cyan Long Arrow position and size
  const [cyanLongArrowL2Position, setCyanLongArrowL2Position] = useState({ x: 500, y: 500 });
  const [cyanLongArrowL2Size, setCyanLongArrowL2Size] = useState({ width: 400, height: 40 });
  // L2 Cyan Up Arrow position and size
  const [cyanUpArrowL2Position, setCyanUpArrowL2Position] = useState({ x: 600, y: 600 });
  const [cyanUpArrowL2Size, setCyanUpArrowL2Size] = useState({ width: 40, height: 120 });
  // L2 Cyan Left Arrow position and size
  const [cyanLeftArrowL2Position, setCyanLeftArrowL2Position] = useState({ x: 700, y: 700 });
  const [cyanLeftArrowL2Size, setCyanLeftArrowL2Size] = useState({ width: 100, height: 40 });
  // L2 Cyan Long Left Arrow position and size
  const [cyanLongLeftArrowL2Position, setCyanLongLeftArrowL2Position] = useState({ x: 800, y: 800 });
  const [cyanLongLeftArrowL2Size, setCyanLongLeftArrowL2Size] = useState({ width: 400, height: 40 });
  // L2 Cyan Up Arrow 2 position and size
  const [cyanUpArrow2L2Position, setCyanUpArrow2L2Position] = useState({ x: 900, y: 900 });
  const [cyanUpArrow2L2Size, setCyanUpArrow2L2Size] = useState({ width: 40, height: 120 });
  // L2 Cyan Up Arrow 3 position and size
  const [cyanUpArrow3L2Position, setCyanUpArrow3L2Position] = useState({ x: 950, y: 900 });
  const [cyanUpArrow3L2Size, setCyanUpArrow3L2Size] = useState({ width: 40, height: 120 });
  // L2 Cyan Down Arrow position and size
  const [cyanDownArrowL2Position, setCyanDownArrowL2Position] = useState({ x: 1000, y: 900 });
  const [cyanDownArrowL2Size, setCyanDownArrowL2Size] = useState({ width: 40, height: 200 });
  // L2 Metal Tank position and size
  const [metalTankL2Position, setMetalTankL2Position] = useState({ x: 1050, y: 800 });
  const [metalTankL2Size, setMetalTankL2Size] = useState({ width: 300, height: 180 });
  // L2 Gray Yellow Arrow position and size
  const [grayYellowArrowL2Position, setGrayYellowArrowL2Position] = useState({ x: 1100, y: 700 });
  const [grayYellowArrowL2Size, setGrayYellowArrowL2Size] = useState({ width: 300, height: 50 });
  // L2 Cyan Horizontal Arrow 2 position and size
  const [cyanHorizArrow2L2Position, setCyanHorizArrow2L2Position] = useState({ x: 1150, y: 750 });
  const [cyanHorizArrow2L2Size, setCyanHorizArrow2L2Size] = useState({ width: 200, height: 30 });
  // L2 Gray Arrow with Cyan Line position and size
  const [grayArrowCyanLineL2Position, setGrayArrowCyanLineL2Position] = useState({ x: 1200, y: 600 });
  const [grayArrowCyanLineL2Size, setGrayArrowCyanLineL2Size] = useState({ width: 400, height: 50 });
  // L2 Cyan Thin Line 1 position and size
  const [cyanThinLine1L2Position, setCyanThinLine1L2Position] = useState({ x: 1250, y: 650 });
  const [cyanThinLine1L2Size, setCyanThinLine1L2Size] = useState({ width: 300, height: 10 });
  // L2 Cyan Thin Line 2 position and size
  const [cyanThinLine2L2Position, setCyanThinLine2L2Position] = useState({ x: 1300, y: 700 });
  const [cyanThinLine2L2Size, setCyanThinLine2L2Size] = useState({ width: 300, height: 10 });
  // L2 Cyan Vertical Line 1 position and size
  const [cyanVertLine1L2Position, setCyanVertLine1L2Position] = useState({ x: 1350, y: 500 });
  const [cyanVertLine1L2Size, setCyanVertLine1L2Size] = useState({ width: 10, height: 150 });
  // L2 Cyan Vertical Line 2 position and size
  const [cyanVertLine2L2Position, setCyanVertLine2L2Position] = useState({ x: 1400, y: 550 });
  const [cyanVertLine2L2Size, setCyanVertLine2L2Size] = useState({ width: 10, height: 150 });
  // L2 Black Vertical Line position and size
  const [blackVertLineL2Position, setBlackVertLineL2Position] = useState({ x: 500, y: 300 });
  const [blackVertLineL2Size, setBlackVertLineL2Size] = useState({ width: 10, height: 200 });
  // L2 Temperature Sensor 1540-TI-4200A position and size
  const [tempSensor4200AL2Position, setTempSensor4200AL2Position] = useState({ x: 1200, y: 400 });
  const [tempSensor4200AL2Size, setTempSensor4200AL2Size] = useState({ width: 180, height: 120 });
  // L2 Temperature Sensor 1540-TI-4820 (Pass 1 Inlet Duct) position and size
  const [tempSensor4820L2Position, setTempSensor4820L2Position] = useState({ x: 1400, y: 400 });
  const [tempSensor4820L2Size, setTempSensor4820L2Size] = useState({ width: 180, height: 120 });
  const [processDataPanelL2Position, setProcessDataPanelL2Position] = useState({ x: 1600, y: 20 });
  const [processDataPanelL2Size, setProcessDataPanelL2Size] = useState({ width: 340, height: 320 });
  const [kppFaceplateL2Position, setKppFaceplateL2Position] = useState({ x: 1600, y: 340 });
  const [kppFaceplateL2Size, setKppFaceplateL2Size] = useState({ width: 280, height: 300 });
  const [kppFaceplateL4Position, setKppFaceplateL4Position] = useState({ x: 2800, y: 100 });
  const [kppFaceplateL4Size, setKppFaceplateL4Size] = useState({ width: 280, height: 300 });
  const [isSavingL2, setIsSavingL2] = useState(false);
  const [isLockedL2, setIsLockedL2] = useState(true);
  const [isL2Dirty, setIsL2Dirty] = useState(false);

  // L2_1520 ACID: KPP Faceplate
  const [kppFaceplateL21520Position, setKppFaceplateL21520Position] = useState({ x: 2600, y: 100 });
  const [kppFaceplateL21520Size, setKppFaceplateL21520Size] = useState({ width: 280, height: 300 });
  // L2_1520 ACID: Acid Boiler position and size
  const [acidBoilerPosition, setAcidBoilerPosition] = useState({ x: 100, y: 100 });
  const [acidBoilerSize, setAcidBoilerSize] = useState({ width: 1024, height: 341 });
  // L2_1520 ACID: Acid Tower 1 position and size
  const [acidTower1Position, setAcidTower1Position] = useState({ x: 1200, y: 50 });
  const [acidTower1Size, setAcidTower1Size] = useState({ width: 800, height: 400 });
  // L2_1520 ACID: Acid Tower 2 position and size
  const [acidTower2Position, setAcidTower2Position] = useState({ x: 2100, y: 50 });
  const [acidTower2Size, setAcidTower2Size] = useState({ width: 800, height: 400 });
  const [isLockedL21520, setIsLockedL21520] = useState(true);

  // Open PV Case dialog state
  const [isOpenPVCaseDialogOpen, setIsOpenPVCaseDialogOpen] = useState(false);
  const [selectedPVCase, setSelectedPVCase] = useState<string | null>(null);
  // Loaded PV case value for 1540-H-4030 controller (used in Static mode)
  const [loadedCaseValue1540H4030, setLoadedCaseValue1540H4030] = useState<number | null>(null);
  // Loaded PV case value for 1530-F-2602 sulfur flow controller (used in Static mode)
  const [loadedCaseValueSulfurFlow, setLoadedCaseValueSulfurFlow] = useState<number | null>(null);
  // Loaded PV case value for 1540-H-4282 jug valve controller (used in Static mode)
  const [loadedCaseValueJugValve, setLoadedCaseValueJugValve] = useState<number | null>(null);
  // Loaded PV case value for 1540-H-4283 WHB dP controller (used in Static mode)
  const [loadedCaseValueWHBdP, setLoadedCaseValueWHBdP] = useState<number | null>(null);
  const [activePVCaseId, setActivePVCaseId] = useState<string | null>(null);
  
  // Furnace outlet temperature from sulfur furnace simulation (linked to 1540-TI-4200A)
  const [furnaceOutletTemp, setFurnaceOutletTemp] = useState<number | null>(null);
  // Track last calculated sulfur flow to prevent duplicate API calls
  const lastCalculatedSulfurFlowRef = useRef<number | null>(null);
  // Debounce timer for SP changes to prevent API spam during user edits
  const spDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pvSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const savePVCaseValue = useCallback((tag: string, value: number) => {
    const caseId = activePVCaseId || 'case1';
    if (pvSaveTimers.current[tag]) clearTimeout(pvSaveTimers.current[tag]);
    pvSaveTimers.current[tag] = setTimeout(() => {
      fetch(`/api/process-variables/${encodeURIComponent(tag)}/cases/${encodeURIComponent(caseId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: String(value) }),
      }).catch(err => console.error(`Failed to save PV case value for ${tag}:`, err));
    }, 500);
  }, [activePVCaseId]);

  // Auto-load static values when PV case is selected in Static mode
  useEffect(() => {
    // Default to case1 if no case is selected when entering Static mode
    if (selectedMode === "Static" && !activePVCaseId) {
      setActivePVCaseId('case1');
      return;
    }
    
    if (selectedMode === "Static" && activePVCaseId) {
      // Fetch PV data and set the static values for controllers
      fetch('/api/process-variables')
        .then(res => res.json())
        .then((pvData) => {
          if (pvData?.variables) {
            // Look for main compressor value in the selected case
            const compressorVar = pvData.variables.find(
              (v: any) => v.tag === '1540-H-4030' || v.tagNumber === '1540-H-4030' || 
                          v.description?.toLowerCase().includes('main_comp') ||
                          v.description?.toLowerCase().includes('compressor')
            );
            if (compressorVar?.cases?.[activePVCaseId]) {
              const val = parseFloat(String(compressorVar.cases[activePVCaseId]).replace(/[^0-9.-]/g, ''));
              if (!isNaN(val)) {
                console.log('Auto-loading static value for 1540-H-4030:', val);
                setLoadedCaseValue1540H4030(val);
              }
            } else {
              console.log('No case value found for 1540-H-4030, using default 85.5%');
              setLoadedCaseValue1540H4030(85.5);
            }
            
            // Look for sulfur flow value in the selected case
            const sulfurFlowVar = pvData.variables.find(
              (v: any) => v.tag === '1530-F-2602' || v.tagNumber === '1530-F-2602' || 
                          v.description?.toLowerCase().includes('sulfur_flow') ||
                          v.description?.toLowerCase().includes('sulfur flow')
            );
            if (sulfurFlowVar?.cases?.[activePVCaseId]) {
              const val = parseFloat(String(sulfurFlowVar.cases[activePVCaseId]).replace(/[^0-9.-]/g, ''));
              if (!isNaN(val)) {
                console.log('Auto-loading static value for 1530-F-2602:', val);
                setLoadedCaseValueSulfurFlow(val);
              }
            } else {
              console.log('No case value found for 1530-F-2602, using default 79 gpm');
              setLoadedCaseValueSulfurFlow(79);
            }
            
            // Look for jug valve value in the selected case
            const jugValveVar = pvData.variables.find(
              (v: any) => v.tag === '1540-H-4282' || v.tagNumber === '1540-H-4282' || 
                          v.description?.toLowerCase().includes('jug_valve') ||
                          v.description?.toLowerCase().includes('jug valve')
            );
            if (jugValveVar?.cases?.[activePVCaseId]) {
              const val = parseFloat(String(jugValveVar.cases[activePVCaseId]).replace(/[^0-9.-]/g, ''));
              if (!isNaN(val)) {
                console.log('Auto-loading static value for 1540-H-4282:', val);
                setLoadedCaseValueJugValve(val);
              }
            } else {
              console.log('No case value found for 1540-H-4282, using default 10%');
              setLoadedCaseValueJugValve(10);
            }
            
            // Look for WHB dP value in the selected case
            const whbVar = pvData.variables.find(
              (v: any) => v.tag === '1540-H-4283' || v.tagNumber === '1540-H-4283' || 
                          v.description?.toLowerCase().includes('whb') ||
                          v.description?.toLowerCase().includes('outlet dp')
            );
            if (whbVar?.cases?.[activePVCaseId]) {
              const val = parseFloat(String(whbVar.cases[activePVCaseId]).replace(/[^0-9.-]/g, ''));
              if (!isNaN(val)) {
                console.log('Auto-loading static value for 1540-H-4283:', val);
                setLoadedCaseValueWHBdP(val);
              }
            } else {
              // Default to 50% if no case value found
              console.log('No case value found for 1540-H-4283, using default 50%');
              setLoadedCaseValueWHBdP(50);
            }
          }
        })
        .catch(err => console.error('Error loading PV case data:', err));
    } else if (selectedMode !== "Static") {
      // Clear static values when not in Static mode
      setLoadedCaseValue1540H4030(null);
      setLoadedCaseValueSulfurFlow(null);
      setLoadedCaseValueJugValve(null);
      setLoadedCaseValueWHBdP(null);
    }
  }, [selectedMode, activePVCaseId]);

  const staticAutoCalcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selectedMode !== "Static") return;
    if (staticAutoCalcTimerRef.current) {
      clearTimeout(staticAutoCalcTimerRef.current);
    }
    staticAutoCalcTimerRef.current = setTimeout(() => {
      runStaticSimulation();
    }, 500);
    return () => {
      if (staticAutoCalcTimerRef.current) {
        clearTimeout(staticAutoCalcTimerRef.current);
      }
    };
  }, [selectedMode, activePVCaseId, loadedCaseValue1540H4030, loadedCaseValueSulfurFlow, loadedCaseValueJugValve, loadedCaseValueWHBdP]);
  
  // 6.1 L3_1540 Converter: Converter position/size
  const [converter61Position, setConverter61Position] = useState({ x: 400, y: 200 });
  const [converter61Size, setConverter61Size] = useState({ width: 400, height: 600 });
  const [isLocked61, setIsLocked61] = useState(true);
  // 6.1 L3_1540 Converter: 1540-TI-4825 Primary Faceplate position/size
  const [faceplate4825_61Position, setFaceplate4825_61Position] = useState({ x: 850, y: 200 });
  const [faceplate4825_61Size, setFaceplate4825_61Size] = useState({ width: 160, height: 240 });
  // 6.1 L3_1540 Converter: Secondary faceplate dialog visibility
  const [showSecondary4825_61, setShowSecondary4825_61] = useState(false);
  // L4 Converter 4: Secondary faceplate dialog visibility when clicking on converter image
  const [showSecondaryConverter4L4, setShowSecondaryConverter4L4] = useState(false);
  // L4-Converter: Jug Valve Hand Controller 1540-H-4282 position/size
  const [jugValveHandControllerL4Position, setJugValveHandControllerL4Position] = useState({ x: 1100, y: 400 });
  const [jugValveHandControllerL4Size, setJugValveHandControllerL4Size] = useState({ width: 220, height: 200 });

  // New states for dynamic sizing support
  const [faceplatePos4825, setFaceplatePos4825] = useState({ x: 850, y: 200 });
  const [faceplateSize4825, setFaceplateSize4825] = useState({ width: 160, height: 240 });
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);

  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { getControllerConfig } = useControllerConfig();

  // Get real-time synced state for Sulfur Flow Controller
  const { 
    state: sulfurSyncState, 
    updateSyncedSP: updateSulfurSP,
    updateSyncedOUT: updateSulfurOUT,
    updateSyncedMode: updateSulfurMode 
  } = useControllerSync('1530-F-2602');
  const sulfurFlowConfig = getControllerConfig('1530-F-2602');
  
  // Get real-time synced state for Sulfur Flow Control Valve
  const { state: valveSyncState } = useControllerSync('1540-FCV-2602');
  const valveConfig = getControllerConfig('1540-FCV-2602');
  
  // Get real-time synced state for Jug Valve
  const { state: jugValveSyncState } = useControllerSync('1540-HCV-4282');
  const jugValveConfig = getControllerConfig('1540-HCV-4282');
  
  // Get real-time synced state for Jug Valve Positioner
  const { state: jugValvePositionerSyncState } = useControllerSync('1540-HCV-4281');
  const jugValvePositionerConfig = getControllerConfig('1540-HCV-4281');
  
  // Get real-time synced state for Hand Controller 1540-H-4030
  const { 
    state: handControllerSyncState,
    updateSyncedSP: updateHandControllerSP,
    updateSyncedOUT: updateHandControllerOUT,
    updateSyncedMode: updateHandControllerMode 
  } = useControllerSync('1540-H-4030');
  const handControllerConfig = getControllerConfig('1540-H-4030');
  
  // Get real-time synced state for WHB Outlet dP Hand Controller 1540-H-4283
  const { 
    state: whbHandControllerSyncState,
    initializeController: initWhbHandController,
    updateAlarmLimits: updateWhbHandControllerAlarmLimits,
    updateSyncedSP: updateWhbHandControllerSP,
    updateSyncedOUT: updateWhbHandControllerOUT,
    updateSyncedMode: updateWhbHandControllerMode
  } = useControllerSync('1540-H-4283');
  const whbHandControllerConfig = getControllerConfig('1540-H-4283');
  
  // Get real-time synced state for Jug Valve Hand Controller 1540-H-4282
  const { 
    state: jugValveHandControllerSyncState,
    initializeController: initJugValveHandController,
    updateAlarmLimits: updateJugValveHandControllerAlarmLimits,
    updateSyncedSP: updateJugValveHandControllerSP,
    updateSyncedOUT: updateJugValveHandControllerOUT,
    updateSyncedMode: updateJugValveHandControllerMode
  } = useControllerSync('1540-H-4282');
  const jugValveHandControllerConfig = getControllerConfig('1540-H-4282');
  
  // Get real-time synced state for Temperature Sensor 1520-TI-5821
  const { state: tempSensorSyncState, initializeController: initTempSensor } = useControllerSync('1520-TI-5821');
  const tempSensorConfig = getControllerConfig('1520-TI-5821');
  
  // Get real-time synced state for Temperature Sensor 1540-TI-4200A
  const { state: tempSensor4200ASyncState, initializeController: initTempSensor4200A, updateAlarmLimits: updateTempSensor4200AAlarmLimits, updateSyncedPV: updateTempSensor4200APV } = useControllerSync('1540-TI-4200A');
  const tempSensor4200AConfig = getControllerConfig('1540-TI-4200A');
  
  // Get real-time synced state for Temperature Sensor 1540-TI-4200B
  const { state: tempSensor4200BSyncState, initializeController: initTempSensor4200B, updateAlarmLimits: updateTempSensor4200BAlarmLimits } = useControllerSync('1540-TI-4200B');
  const tempSensor4200BConfig = getControllerConfig('1540-TI-4200B');
  
  // Get real-time synced state for Temperature Sensor 1540-TI-4200C
  const { state: tempSensor4200CSyncState, initializeController: initTempSensor4200C, updateAlarmLimits: updateTempSensor4200CAlarmLimits } = useControllerSync('1540-TI-4200C');
  const tempSensor4200CConfig = getControllerConfig('1540-TI-4200C');
  
  // Get real-time synced state for Temperature Sensor 1540-TI-4820 (Pass 1 Inlet Duct)
  const { state: tempSensor4820SyncState, initializeController: initTempSensor4820, updateAlarmLimits: updateTempSensor4820AlarmLimits, updateSyncedPV: updateTempSensor4820PV } = useControllerSync('1540-TI-4820');
  const tempSensor4820Config = getControllerConfig('1540-TI-4820');

  useEffect(() => {
    dynamicOrchInputsRef.current = {
      compressor_rpm_pct: handControllerSyncState.syncedPV,
      sulfur_flow_sp_gpm: sulfurSyncState.syncedPV,
      jug_valve_pct: jugValveHandControllerSyncState.syncedSP,
      damper_open_pct: whbHandControllerSyncState.syncedSP,
    };
  }, [handControllerSyncState.syncedPV, sulfurSyncState.syncedPV,
      jugValveHandControllerSyncState.syncedSP, whbHandControllerSyncState.syncedSP]);

  useEffect(() => {
    if (!dynamicRunning) return;
    const intervalMs = dynamicDt * 1000 / dynamicSpeed;
    const tick = async () => {
      if (dynamicOrchInFlightRef.current) return;
      dynamicOrchInFlightRef.current = true;
      try {
        const inputs = dynamicOrchInputsRef.current;
        const res = await fetch('/api/plant-orchestrator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...inputs,
            barometric_atm: 1.0,
            plant_condition: "clean",
            dt_acid_inlet_temp_F: 70,
            mode: "dynamic",
          }),
        });
        if (res.ok) {
          const orchData = await res.json();
          setOrchestratorResult(orchData);
          if (orchData.sensor_tags) {
            const tags = orchData.sensor_tags;
            if (tags["1540-TI-4010"] !== undefined) {
              setFurnaceOutletTemp(tags["1540-TI-4010"]);
              updateTempSensor4200APV(tags["1540-TI-4010"]);
            }
            if (tags["1540-TI-4820"] !== undefined) {
              const raw4820 = tags["1540-TI-4820"];
              updateTempSensor4820PV(typeof raw4820 === 'object' && raw4820 !== null ? (raw4820 as any).value : raw4820);
            }
          }
        }
      } catch (e) {
        console.error('Dynamic orchestrator error:', e);
      } finally {
        dynamicOrchInFlightRef.current = false;
      }
    };
    tick();
    const id = setInterval(tick, Math.max(intervalMs, 1000));
    return () => clearInterval(id);
  }, [dynamicRunning, dynamicDt, dynamicSpeed]);

  // Get real-time synced state for Temperature Sensor 1540-TI-4825 (Pass 1 Catalyst In)
  const { state: tempSensor4825SyncState, initializeController: initTempSensor4825, updateAlarmLimits: updateTempSensor4825AlarmLimits } = useControllerSync('1540-TI-4825');
  const tempSensor4825Config = getControllerConfig('1540-TI-4825');
  
  // Initialize temperature sensor with configured Typical PV
  useEffect(() => {
    if (tempSensorConfig.TYPICAL_PV !== undefined) {
      initTempSensor(
        tempSensorConfig.TYPICAL_PV,
        tempSensorConfig.TYPICAL_PV,
        tempSensorConfig.SP_LIM_LO ?? 100,
        tempSensorConfig.SP_LIM_HI ?? 200
      );
    }
  }, [tempSensorConfig.TYPICAL_PV, tempSensorConfig.SP_LIM_LO, tempSensorConfig.SP_LIM_HI, initTempSensor]);
  
  // Initialize temperature sensor 1540-TI-4200A with configured Typical PV and alarm limits
  useEffect(() => {
    if (tempSensor4200AConfig.TYPICAL_PV !== undefined && tempSensor4200AConfig.TYPICAL_PV > 0) {
      initTempSensor4200A(
        tempSensor4200AConfig.TYPICAL_PV,
        tempSensor4200AConfig.TYPICAL_PV,
        tempSensor4200AConfig.SP_LIM_LO ?? 0,
        tempSensor4200AConfig.SP_LIM_HI ?? 2500
      );
      
      // Sync alarm limits for automatic alarm state updates
      updateTempSensor4200AAlarmLimits({
        LL: tempSensor4200AConfig.ALM_LL_LIM ?? 0,
        L: tempSensor4200AConfig.ALM_L_LIM ?? 0,
        H: tempSensor4200AConfig.ALM_H_LIM ?? 0,
        HH: tempSensor4200AConfig.ALM_HH_LIM ?? 0,
      });
    }
  }, [tempSensor4200AConfig.TYPICAL_PV, tempSensor4200AConfig.SP_LIM_LO, tempSensor4200AConfig.SP_LIM_HI, tempSensor4200AConfig.ALM_LL_LIM, tempSensor4200AConfig.ALM_L_LIM, tempSensor4200AConfig.ALM_H_LIM, tempSensor4200AConfig.ALM_HH_LIM, initTempSensor4200A, updateTempSensor4200AAlarmLimits]);
  
  // Initialize temperature sensor 1540-TI-4200B with configured Typical PV and alarm limits
  useEffect(() => {
    if (tempSensor4200BConfig.TYPICAL_PV !== undefined && tempSensor4200BConfig.TYPICAL_PV > 0) {
      initTempSensor4200B(
        tempSensor4200BConfig.TYPICAL_PV,
        tempSensor4200BConfig.TYPICAL_PV,
        tempSensor4200BConfig.SP_LIM_LO ?? 0,
        tempSensor4200BConfig.SP_LIM_HI ?? 2500
      );
      
      // Sync alarm limits for automatic alarm state updates
      updateTempSensor4200BAlarmLimits({
        LL: tempSensor4200BConfig.ALM_LL_LIM ?? 0,
        L: tempSensor4200BConfig.ALM_L_LIM ?? 0,
        H: tempSensor4200BConfig.ALM_H_LIM ?? 0,
        HH: tempSensor4200BConfig.ALM_HH_LIM ?? 0,
      });
    }
  }, [tempSensor4200BConfig.TYPICAL_PV, tempSensor4200BConfig.SP_LIM_LO, tempSensor4200BConfig.SP_LIM_HI, tempSensor4200BConfig.ALM_LL_LIM, tempSensor4200BConfig.ALM_L_LIM, tempSensor4200BConfig.ALM_H_LIM, tempSensor4200BConfig.ALM_HH_LIM, initTempSensor4200B, updateTempSensor4200BAlarmLimits]);
  
  
  // Initialize temperature sensor 1540-TI-4200C with proper furnace temperature range (1800-2300°F)
  useEffect(() => {
    // Force correct furnace temperature range - these sensors operate at 1800-2300°F
    const FURNACE_C_SCALE_LO = 1800;
    const FURNACE_C_SCALE_HI = 2300;
    const FURNACE_C_TYPICAL_PV = 2050;
    
    // Use config values if they're in the correct range, otherwise use furnace defaults
    const configPV = tempSensor4200CConfig.TYPICAL_PV;
    const typicalPV = (configPV && configPV >= FURNACE_C_SCALE_LO && configPV <= FURNACE_C_SCALE_HI) 
      ? configPV 
      : FURNACE_C_TYPICAL_PV;
    
    initTempSensor4200C(
      typicalPV,
      typicalPV,
      FURNACE_C_SCALE_LO,
      FURNACE_C_SCALE_HI
    );
    
    // Sync alarm limits for automatic alarm state updates
    updateTempSensor4200CAlarmLimits({
      LL: tempSensor4200CConfig.ALM_LL_LIM ?? 1850,
      L: tempSensor4200CConfig.ALM_L_LIM ?? 1900,
      H: tempSensor4200CConfig.ALM_H_LIM ?? 2200,
      HH: tempSensor4200CConfig.ALM_HH_LIM ?? 2250,
    });
  }, [tempSensor4200CConfig.TYPICAL_PV, tempSensor4200CConfig.ALM_LL_LIM, tempSensor4200CConfig.ALM_L_LIM, tempSensor4200CConfig.ALM_H_LIM, tempSensor4200CConfig.ALM_HH_LIM, initTempSensor4200C, updateTempSensor4200CAlarmLimits]);
  
  // Initialize temperature sensor 1540-TI-4820 (Pass 1 Inlet Duct) with configured Typical PV and alarm limits
  useEffect(() => {
    const configPV = tempSensor4820Config.TYPICAL_PV;
    const typicalPV = (configPV && configPV >= 0 && configPV <= 2000) 
      ? configPV 
      : 750;
    
    initTempSensor4820(
      typicalPV,
      typicalPV,
      tempSensor4820Config.SP_LIM_LO ?? 0,
      tempSensor4820Config.SP_LIM_HI ?? 2000
    );
    
    updateTempSensor4820AlarmLimits({
      LL: tempSensor4820Config.ALM_LL_LIM ?? 0,
      L: tempSensor4820Config.ALM_L_LIM ?? 0,
      H: tempSensor4820Config.ALM_H_LIM ?? 0,
      HH: tempSensor4820Config.ALM_HH_LIM ?? 0,
    });
  }, [tempSensor4820Config.TYPICAL_PV, tempSensor4820Config.ALM_LL_LIM, tempSensor4820Config.ALM_L_LIM, tempSensor4820Config.ALM_H_LIM, tempSensor4820Config.ALM_HH_LIM, initTempSensor4820, updateTempSensor4820AlarmLimits]);

  // Initialize temperature sensor 1540-TI-4825 (Pass 1 Catalyst In) with configured Typical PV and alarm limits
  useEffect(() => {
    // Use configured TYPICAL_PV if available and valid
    const configPV = tempSensor4825Config.TYPICAL_PV;
    const typicalPV = (configPV && configPV >= 0 && configPV <= 2000) 
      ? configPV 
      : 750; // Default typical value for Pass 1 Catalyst In
    
    initTempSensor4825(
      typicalPV,
      typicalPV,
      tempSensor4825Config.SP_LIM_LO ?? 0,
      tempSensor4825Config.SP_LIM_HI ?? 2000
    );
    
    // Sync alarm limits for automatic alarm state updates
    updateTempSensor4825AlarmLimits({
      LL: tempSensor4825Config.ALM_LL_LIM ?? 600,
      L: tempSensor4825Config.ALM_L_LIM ?? 700,
      H: tempSensor4825Config.ALM_H_LIM ?? 850,
      HH: tempSensor4825Config.ALM_HH_LIM ?? 900,
    });
  }, [tempSensor4825Config.TYPICAL_PV, tempSensor4825Config.ALM_LL_LIM, tempSensor4825Config.ALM_L_LIM, tempSensor4825Config.ALM_H_LIM, tempSensor4825Config.ALM_HH_LIM, initTempSensor4825, updateTempSensor4825AlarmLimits]);
  
  // Function to call sulfur furnace API and update furnace outlet temperature (4200A)
  const calculateFurnaceTemperature = useCallback(async (sulfurFlowGpm: number) => {
    if (!sulfurFlowGpm || sulfurFlowGpm <= 0) return;
    
    try {
      // Convert gpm to klb/hr: gpm * 1.8 sg * 60 min/hr * 8.33 lb/gal / 1000 = klb/hr
      const sulfurKlbHr = sulfurFlowGpm * 1.8 * 60 * 8.33 / 1000;
      // Calculate air flow based on sulfur flow: klb/hr * 1624 SCFM per klb/hr
      const airScfm = sulfurKlbHr * 1624;
      
      const response = await fetch('/api/sulfur-furnace-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          air_scfm: airScfm,
          sulfur_klb_hr: sulfurKlbHr,
          sulfur_temp_f: 300, // Default sulfur inlet temperature
          mode: 'static'
        }),
      });
      
      if (!response.ok) {
        console.error('Sulfur furnace API error:', response.statusText);
        return;
      }
      
      const result = await response.json();
      // The furnace outlet temperature is in stream5.temperature_f
      if (result.stream5?.temperature_f) {
        const furnaceTemp = result.stream5.temperature_f;
        setFurnaceOutletTemp(furnaceTemp);
        // Update the 1540-TI-4200A temperature sensor PV with the furnace outlet temperature
        updateTempSensor4200APV(furnaceTemp);
      }
    } catch (error) {
      console.error('Failed to calculate furnace temperature:', error);
    }
  }, [updateTempSensor4200APV]);
  
  // Sync loaded case value to sync context when case is loaded in Static mode
  // This ensures the synced SP reflects the loaded case value
  useEffect(() => {
    if (selectedMode === 'Static' && loadedCaseValueSulfurFlow !== null) {
      updateSulfurSP(loadedCaseValueSulfurFlow);
    }
  }, [selectedMode, loadedCaseValueSulfurFlow, updateSulfurSP]);
  
  // Auto-recalculate furnace temperature when sulfur flow SP changes
  // Uses the synced SP value which reflects both loaded case values and user edits
  // Single unified effect with debouncing to prevent API spam
  useEffect(() => {
    // Only recalculate when in Static mode
    if (selectedMode !== 'Static') {
      // Reset tracking when leaving Static mode
      lastCalculatedSulfurFlowRef.current = null;
      if (spDebounceTimerRef.current) {
        clearTimeout(spDebounceTimerRef.current);
        spDebounceTimerRef.current = null;
      }
      return;
    }
    
    // Use the synced SP value which reflects both case loads and user edits
    const currentFlow = sulfurSyncState.syncedSP;
    
    if (currentFlow === null || currentFlow === undefined || !Number.isFinite(currentFlow)) return;
    
    // Check if sulfur flow has changed significantly (more than 0.5 gpm difference)
    const lastFlow = lastCalculatedSulfurFlowRef.current;
    
    if (lastFlow !== null && Math.abs(currentFlow - lastFlow) < 0.5) {
      return; // Skip if change is too small
    }
    
    // Clear any existing debounce timer
    if (spDebounceTimerRef.current) {
      clearTimeout(spDebounceTimerRef.current);
    }
    
    // Debounce all SP changes by 300ms to prevent API spam while allowing responsive updates
    spDebounceTimerRef.current = setTimeout(() => {
      lastCalculatedSulfurFlowRef.current = currentFlow;
      calculateFurnaceTemperature(currentFlow);
    }, 300);
    
    return () => {
      if (spDebounceTimerRef.current) {
        clearTimeout(spDebounceTimerRef.current);
      }
    };
  }, [selectedMode, sulfurSyncState.syncedSP, calculateFurnaceTemperature]);
  
  // Initialize WHB Outlet dP Hand Controller 1540-H-4283 with configured values
  useEffect(() => {
    const typicalPV = whbHandControllerConfig.TYPICAL_PV ?? whbHandControllerConfig.PV_INIT_VAL ?? 50;
    if (typicalPV !== undefined && typicalPV > 0) {
      initWhbHandController(
        typicalPV,
        typicalPV,
        whbHandControllerConfig.SP_LIM_LO ?? 0,
        whbHandControllerConfig.SP_LIM_HI ?? 100
      );
      
      updateWhbHandControllerAlarmLimits({
        LL: whbHandControllerConfig.ALM_LL_LIM ?? 0,
        L: whbHandControllerConfig.ALM_L_LIM ?? 0,
        H: whbHandControllerConfig.ALM_H_LIM ?? 0,
        HH: whbHandControllerConfig.ALM_HH_LIM ?? 0,
      });
    }
  }, [whbHandControllerConfig, initWhbHandController, updateWhbHandControllerAlarmLimits]);
  
  // Initialize Jug Valve Hand Controller 1540-H-4282 with configured values
  useEffect(() => {
    const typicalPV = jugValveHandControllerConfig.TYPICAL_PV ?? jugValveHandControllerConfig.PV_INIT_VAL ?? 50;
    if (typicalPV !== undefined && typicalPV > 0) {
      initJugValveHandController(
        typicalPV,
        typicalPV,
        jugValveHandControllerConfig.SP_LIM_LO ?? 0,
        jugValveHandControllerConfig.SP_LIM_HI ?? 100
      );
      
      updateJugValveHandControllerAlarmLimits({
        LL: jugValveHandControllerConfig.ALM_LL_LIM ?? 0,
        L: jugValveHandControllerConfig.ALM_L_LIM ?? 0,
        H: jugValveHandControllerConfig.ALM_H_LIM ?? 0,
        HH: jugValveHandControllerConfig.ALM_HH_LIM ?? 0,
      });
    }
  }, [jugValveHandControllerConfig, initJugValveHandController, updateJugValveHandControllerAlarmLimits]);
  
  // Build controller data from synced state
  // In Static mode with a loaded case, use the static case value for PV, SP, and OUT
  const useStaticSulfurFlow = selectedMode === "Static" && loadedCaseValueSulfurFlow !== null;
  const sulfurFlowData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: sulfurFlowConfig.TAGNAME || '1530-F-2602',
    description: sulfurFlowConfig.DESC || 'Sulfur Flow Controller',
    pv: useStaticSulfurFlow ? loadedCaseValueSulfurFlow : sulfurSyncState.syncedPV,
    sp: useStaticSulfurFlow ? loadedCaseValueSulfurFlow : sulfurSyncState.syncedSP,
    out: useStaticSulfurFlow ? loadedCaseValueSulfurFlow : sulfurSyncState.syncedOUT,
    mode: sulfurSyncState.syncedMode,
    pvUnits: sulfurFlowConfig.EU || 'gpm',
    pvRangeMin: sulfurFlowConfig.PV_SCALE_LO ?? 0,
    pvRangeMax: sulfurFlowConfig.PV_SCALE_HI ?? 100,
    alarmActive: sulfurSyncState.alarmStates.HH || sulfurSyncState.alarmStates.H || 
                 sulfurSyncState.alarmStates.L || sulfurSyncState.alarmStates.LL,
    alarmColor: (sulfurSyncState.alarmStates.HH || sulfurSyncState.alarmStates.LL) ? 'red' : 
                (sulfurSyncState.alarmStates.H || sulfurSyncState.alarmStates.L) ? 'yellow' : undefined,
    alarmLL: sulfurFlowConfig.ALM_LL_LIM ?? 0,
    alarmL: sulfurFlowConfig.ALM_L_LIM ?? 0,
    alarmH: sulfurFlowConfig.ALM_H_LIM ?? 0,
    alarmHH: sulfurFlowConfig.ALM_HH_LIM ?? 0,
  };
  
  // Build valve faceplate data from synced state
  const sulfurValveData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: valveConfig.TAGNAME || '1540-FCV-2602',
    description: valveConfig.DESC || 'Sulfur Feed Valve',
    pv: valveSyncState.syncedPV,
    sp: valveSyncState.syncedSP,
    out: valveSyncState.syncedOUT,
    mode: valveSyncState.syncedMode,
    pvUnits: valveConfig.EU || '%',
    pvRangeMin: valveConfig.PV_SCALE_LO ?? 0,
    pvRangeMax: valveConfig.PV_SCALE_HI ?? 100,
    alarmActive: valveSyncState.alarmStates.HH || valveSyncState.alarmStates.H || 
                 valveSyncState.alarmStates.L || valveSyncState.alarmStates.LL,
    alarmColor: (valveSyncState.alarmStates.HH || valveSyncState.alarmStates.LL) ? 'red' : 
                (valveSyncState.alarmStates.H || valveSyncState.alarmStates.L) ? 'yellow' : undefined,
    valveTypeAction: valveConfig.VALVE_TYPE_ACTION || 'DA',
    showAlarmCircle: valveConfig.SHOW_ALARM_CIRCLE,
    showNoSymbol: valveConfig.SHOW_NO_SYMBOL,
    showInterlockDiamond: valveConfig.SHOW_INTERLOCK_DIAMOND_INDICATOR,
    showBlueAlarmIndicator: valveConfig.SHOW_BLUE_ALARM_INDICATOR,
    showBadIOIndicator: valveConfig.SHOW_BAD_IO_INDICATOR,
    showModuleNotRunning: valveConfig.SHOW_MODULE_NOT_RUNNING,
    showValveTypeLabel: valveConfig.SHOW_VALVE_TYPE_LABEL,
    showLockIndicator: valveConfig.SHOW_LOCK_INDICATOR,
    showOutputPathIndicator: valveConfig.SHOW_OUTPUT_PATH_INDICATOR,
  };
  
  // Build Jug Valve faceplate data from synced state
  const jugValveData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: jugValveConfig.TAGNAME || '1540-HCV-4282',
    description: jugValveConfig.DESC || 'Jug Valve',
    pv: jugValveSyncState.syncedPV,
    sp: jugValveSyncState.syncedSP,
    out: jugValveSyncState.syncedOUT,
    mode: jugValveSyncState.syncedMode,
    pvUnits: jugValveConfig.EU || '%',
    pvRangeMin: jugValveConfig.PV_SCALE_LO ?? 0,
    pvRangeMax: jugValveConfig.PV_SCALE_HI ?? 100,
    alarmActive: jugValveSyncState.alarmStates.HH || jugValveSyncState.alarmStates.H || 
                 jugValveSyncState.alarmStates.L || jugValveSyncState.alarmStates.LL,
    alarmColor: (jugValveSyncState.alarmStates.HH || jugValveSyncState.alarmStates.LL) ? 'red' : 
                (jugValveSyncState.alarmStates.H || jugValveSyncState.alarmStates.L) ? 'yellow' : undefined,
    valveTypeAction: jugValveConfig.VALVE_TYPE_ACTION || 'DA',
    showAlarmCircle: jugValveConfig.SHOW_ALARM_CIRCLE,
    showNoSymbol: jugValveConfig.SHOW_NO_SYMBOL,
    showInterlockDiamond: jugValveConfig.SHOW_INTERLOCK_DIAMOND_INDICATOR,
    showBlueAlarmIndicator: jugValveConfig.SHOW_BLUE_ALARM_INDICATOR,
    showBadIOIndicator: jugValveConfig.SHOW_BAD_IO_INDICATOR,
    showModuleNotRunning: jugValveConfig.SHOW_MODULE_NOT_RUNNING,
    showValveTypeLabel: jugValveConfig.SHOW_VALVE_TYPE_LABEL,
    showLockIndicator: jugValveConfig.SHOW_LOCK_INDICATOR,
    showOutputPathIndicator: jugValveConfig.SHOW_OUTPUT_PATH_INDICATOR,
  };
  
  // Build Jug Valve Positioner faceplate data from synced state
  const jugValvePositionerData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: jugValvePositionerConfig.TAGNAME || '1540-HCV-4281',
    description: jugValvePositionerConfig.DESC || 'Jug Valve Positioner',
    pv: jugValvePositionerSyncState.syncedPV,
    sp: jugValvePositionerSyncState.syncedSP,
    out: jugValvePositionerSyncState.syncedOUT,
    mode: jugValvePositionerSyncState.syncedMode,
    pvUnits: jugValvePositionerConfig.EU || '%',
    pvRangeMin: jugValvePositionerConfig.PV_SCALE_LO ?? 0,
    pvRangeMax: jugValvePositionerConfig.PV_SCALE_HI ?? 100,
    alarmActive: jugValvePositionerSyncState.alarmStates.HH || jugValvePositionerSyncState.alarmStates.H || 
                 jugValvePositionerSyncState.alarmStates.L || jugValvePositionerSyncState.alarmStates.LL,
    alarmColor: (jugValvePositionerSyncState.alarmStates.HH || jugValvePositionerSyncState.alarmStates.LL) ? 'red' : 
                (jugValvePositionerSyncState.alarmStates.H || jugValvePositionerSyncState.alarmStates.L) ? 'yellow' : undefined,
    valveTypeAction: jugValvePositionerConfig.VALVE_TYPE_ACTION || 'DA',
    showAlarmCircle: jugValvePositionerConfig.SHOW_ALARM_CIRCLE,
    showNoSymbol: jugValvePositionerConfig.SHOW_NO_SYMBOL,
    showInterlockDiamond: jugValvePositionerConfig.SHOW_INTERLOCK_DIAMOND_INDICATOR,
    showBlueAlarmIndicator: jugValvePositionerConfig.SHOW_BLUE_ALARM_INDICATOR,
    showBadIOIndicator: jugValvePositionerConfig.SHOW_BAD_IO_INDICATOR,
    showModuleNotRunning: jugValvePositionerConfig.SHOW_MODULE_NOT_RUNNING,
    showValveTypeLabel: jugValvePositionerConfig.SHOW_VALVE_TYPE_LABEL,
    showLockIndicator: jugValvePositionerConfig.SHOW_LOCK_INDICATOR,
    showOutputPathIndicator: jugValvePositionerConfig.SHOW_OUTPUT_PATH_INDICATOR,
  };

  // Build Hand Controller 1540-H-4030 data from synced state
  // In Static mode with a loaded case, use the static case value for PV, SP, and OUT
  const useStaticCaseValue = selectedMode === "Static" && loadedCaseValue1540H4030 !== null;
  const handControllerData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: handControllerConfig.TAGNAME || '1540-H-4030',
    description: handControllerConfig.DESC || 'Main Compressor Hand Controller',
    pv: useStaticCaseValue ? loadedCaseValue1540H4030 : handControllerSyncState.syncedPV,
    sp: useStaticCaseValue ? loadedCaseValue1540H4030 : handControllerSyncState.syncedSP,
    out: useStaticCaseValue ? loadedCaseValue1540H4030 : handControllerSyncState.syncedOUT,
    mode: handControllerSyncState.syncedMode,
    pvUnits: handControllerConfig.EU || '%',
    pvRangeMin: handControllerConfig.PV_SCALE_LO ?? 0,
    pvRangeMax: handControllerConfig.PV_SCALE_HI ?? 100,
    alarmActive: handControllerSyncState.alarmStates.HH || handControllerSyncState.alarmStates.H || 
                 handControllerSyncState.alarmStates.L || handControllerSyncState.alarmStates.LL,
    alarmColor: (handControllerSyncState.alarmStates.HH || handControllerSyncState.alarmStates.LL) ? 'red' : 
                (handControllerSyncState.alarmStates.H || handControllerSyncState.alarmStates.L) ? 'yellow' : undefined,
    alarmLL: handControllerConfig.ALM_LL_LIM ?? 0,
    alarmL: handControllerConfig.ALM_L_LIM ?? 0,
    alarmH: handControllerConfig.ALM_H_LIM ?? 0,
    alarmHH: handControllerConfig.ALM_HH_LIM ?? 0,
  };

  // Build WHB Outlet dP Hand Controller 1540-H-4283 data from synced state
  // In Static mode with a loaded case, use the static case value for PV, SP, and OUT
  const useStaticWHBdP = selectedMode === "Static" && loadedCaseValueWHBdP !== null;
  const whbHandControllerData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: whbHandControllerConfig.TAGNAME || '1540-H-4283',
    description: whbHandControllerConfig.DESC || 'WHB Outlet dP Hand Controller',
    pv: useStaticWHBdP ? loadedCaseValueWHBdP : whbHandControllerSyncState.syncedSP,
    sp: useStaticWHBdP ? loadedCaseValueWHBdP : whbHandControllerSyncState.syncedSP,
    out: useStaticWHBdP ? loadedCaseValueWHBdP : whbHandControllerSyncState.syncedSP,
    mode: whbHandControllerSyncState.syncedMode,
    pvUnits: whbHandControllerConfig.EU || '%',
    pvRangeMin: whbHandControllerConfig.PV_SCALE_LO ?? 0,
    pvRangeMax: whbHandControllerConfig.PV_SCALE_HI ?? 100,
    alarmActive: whbHandControllerSyncState.alarmStates.HH || whbHandControllerSyncState.alarmStates.H || 
                 whbHandControllerSyncState.alarmStates.L || whbHandControllerSyncState.alarmStates.LL,
    alarmColor: (whbHandControllerSyncState.alarmStates.HH || whbHandControllerSyncState.alarmStates.LL) ? 'red' : 
                (whbHandControllerSyncState.alarmStates.H || whbHandControllerSyncState.alarmStates.L) ? 'yellow' : undefined,
    alarmLL: whbHandControllerConfig.ALM_LL_LIM ?? 0,
    alarmL: whbHandControllerConfig.ALM_L_LIM ?? 0,
    alarmH: whbHandControllerConfig.ALM_H_LIM ?? 0,
    alarmHH: whbHandControllerConfig.ALM_HH_LIM ?? 0,
  };

  // Build Jug Valve Hand Controller 1540-H-4282 data from synced state
  // In Static mode with a loaded case, use the static case value for PV, SP, and OUT
  const useStaticJugValve = selectedMode === "Static" && loadedCaseValueJugValve !== null;
  // Use SP limits for range since this is a hand controller where SP defines the operating range
  const jugValveHandControllerData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: jugValveHandControllerConfig.TAGNAME || '1540-H-4282',
    description: jugValveHandControllerConfig.DESC || 'Jug Valve Hand Controller',
    pv: useStaticJugValve ? loadedCaseValueJugValve : jugValveHandControllerSyncState.syncedSP,
    sp: useStaticJugValve ? loadedCaseValueJugValve : jugValveHandControllerSyncState.syncedSP,
    out: useStaticJugValve ? loadedCaseValueJugValve : jugValveHandControllerSyncState.syncedSP,
    mode: jugValveHandControllerSyncState.syncedMode,
    pvUnits: jugValveHandControllerConfig.EU || '%',
    pvRangeMin: jugValveHandControllerConfig.SP_LIM_LO ?? 0,
    pvRangeMax: jugValveHandControllerConfig.SP_LIM_HI ?? 30,
    alarmActive: jugValveHandControllerSyncState.alarmStates.HH || jugValveHandControllerSyncState.alarmStates.H || 
                 jugValveHandControllerSyncState.alarmStates.L || jugValveHandControllerSyncState.alarmStates.LL,
    alarmColor: (jugValveHandControllerSyncState.alarmStates.HH || jugValveHandControllerSyncState.alarmStates.LL) ? 'red' : 
                (jugValveHandControllerSyncState.alarmStates.H || jugValveHandControllerSyncState.alarmStates.L) ? 'yellow' : undefined,
    alarmLL: jugValveHandControllerConfig.ALM_LL_LIM ?? 0,
    alarmL: jugValveHandControllerConfig.ALM_L_LIM ?? 0,
    alarmH: jugValveHandControllerConfig.ALM_H_LIM ?? 0,
    alarmHH: jugValveHandControllerConfig.ALM_HH_LIM ?? 0,
  };

  // Build Temperature Sensor 1520-TI-5821 data from synced state
  const tempSensorData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: tempSensorConfig.TAGNAME || '1520-TI-5821',
    description: tempSensorConfig.DESC || 'DT Gas Out Temperature',
    pv: tempSensorSyncState.syncedPV,
    sp: tempSensorSyncState.syncedSP,
    out: tempSensorSyncState.syncedOUT,
    mode: tempSensorSyncState.syncedMode,
    pvUnits: tempSensorConfig.EU || '°C',
    pvRangeMin: tempSensorConfig.SP_LIM_LO ?? 0,
    pvRangeMax: tempSensorConfig.SP_LIM_HI ?? 500,
    alarmActive: tempSensorSyncState.alarmStates.HH || tempSensorSyncState.alarmStates.H || 
                 tempSensorSyncState.alarmStates.L || tempSensorSyncState.alarmStates.LL,
    alarmColor: (tempSensorSyncState.alarmStates.HH || tempSensorSyncState.alarmStates.LL) ? 'red' : 
                (tempSensorSyncState.alarmStates.H || tempSensorSyncState.alarmStates.L) ? 'yellow' : undefined,
    alarmLL: tempSensorConfig.ALM_LL_LIM,
    alarmL: tempSensorConfig.ALM_L_LIM,
    alarmH: tempSensorConfig.ALM_H_LIM,
    alarmHH: tempSensorConfig.ALM_HH_LIM,
  };

  // Build Temperature Sensor 1540-TI-4200A data from synced state
  // In Static mode, use orchestrator furnace temp (1540-TI-4010) as source of truth
  const orchestratorFurnaceTemp = selectedMode === 'Static' && orchestratorResult?.sensor_tags?.["1540-TI-4010"] != null
    ? orchestratorResult.sensor_tags["1540-TI-4010"]
    : null;
  const tempSensor4200APV = orchestratorFurnaceTemp ?? furnaceOutletTemp ?? tempSensor4200ASyncState.syncedPV;

  // Compute alarm states directly from displayed PV (not sync context which has dynamic noise)
  const furnaceHHLimit = tempSensor4200AConfig.ALM_HH_LIM ?? 2195;
  const furnaceHLimit = tempSensor4200AConfig.ALM_H_LIM ?? 2155;
  const furnaceLLimit = tempSensor4200AConfig.ALM_L_LIM ?? 0;
  const furnaceLLLimit = tempSensor4200AConfig.ALM_LL_LIM ?? 0;
  const furnaceAlarmHH = furnaceHHLimit > 0 && tempSensor4200APV >= furnaceHHLimit;
  const furnaceAlarmH = furnaceHLimit > 0 && tempSensor4200APV >= furnaceHLimit;
  const furnaceAlarmL = furnaceLLimit > 0 && tempSensor4200APV <= furnaceLLimit;
  const furnaceAlarmLL = furnaceLLLimit > 0 && tempSensor4200APV <= furnaceLLLimit;
  const furnaceAlarmActive = furnaceAlarmHH || furnaceAlarmH || furnaceAlarmL || furnaceAlarmLL;
  const furnaceAlarmColor = (furnaceAlarmHH || furnaceAlarmLL) ? 'red' as const
    : (furnaceAlarmH || furnaceAlarmL) ? 'yellow' as const : undefined;

  const tempSensor4200AData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: tempSensor4200AConfig.TAGNAME || '1540-TI-4200A',
    description: tempSensor4200AConfig.DESC || 'Furnace Temp Out A',
    pv: tempSensor4200APV,
    sp: tempSensor4200ASyncState.syncedSP,
    out: tempSensor4200ASyncState.syncedOUT,
    mode: tempSensor4200ASyncState.syncedMode,
    pvUnits: tempSensor4200AConfig.EU || '°F',
    pvRangeMin: tempSensor4200AConfig.SP_LIM_LO ?? 0,
    pvRangeMax: tempSensor4200AConfig.SP_LIM_HI ?? 2500,
    alarmActive: furnaceAlarmActive,
    alarmColor: furnaceAlarmColor,
    alarmLL: furnaceLLLimit,
    alarmL: furnaceLLimit,
    alarmH: furnaceHLimit,
    alarmHH: furnaceHHLimit,
  };

  // Build Temperature Sensor 1540-TI-4820 (Pass 1 Inlet Duct) data from synced state
  const rawTag4820 = orchestratorResult?.sensor_tags?.["1540-TI-4820"];
  const orchestratorPass1InletTemp = selectedMode === 'Static' && rawTag4820 != null
    ? (typeof rawTag4820 === 'object' && rawTag4820 !== null ? (rawTag4820 as any).value : rawTag4820)
    : null;
  const tempSensor4820PV = orchestratorPass1InletTemp ?? tempSensor4820SyncState.syncedPV;
  const tempSensor4820Data: ControllerData = {
    ...defaultControllerData,
    instrumentTag: tempSensor4820Config.TAGNAME || '1540-TI-4820',
    description: tempSensor4820Config.DESC || 'Pass 1 Inlet Duct',
    pv: tempSensor4820PV,
    sp: tempSensor4820SyncState.syncedSP,
    out: tempSensor4820SyncState.syncedOUT,
    mode: tempSensor4820SyncState.syncedMode,
    pvUnits: tempSensor4820Config.EU || 'F',
    pvRangeMin: tempSensor4820Config.SP_LIM_LO ?? 0,
    pvRangeMax: tempSensor4820Config.SP_LIM_HI ?? 2000,
    alarmLL: tempSensor4820Config.ALM_LL_LIM ?? 0,
    alarmL: tempSensor4820Config.ALM_L_LIM ?? 0,
    alarmH: tempSensor4820Config.ALM_H_LIM ?? 0,
    alarmHH: tempSensor4820Config.ALM_HH_LIM ?? 0,
  };

  // Build Temperature Sensor 1540-TI-4200B data from synced state
  const tempSensor4200BPV = orchestratorFurnaceTemp ?? tempSensor4200BSyncState.syncedPV;
  const furnaceBHHLimit = tempSensor4200BConfig.ALM_HH_LIM ?? 2195;
  const furnaceBHLimit = tempSensor4200BConfig.ALM_H_LIM ?? 2155;
  const furnaceBLLimit = tempSensor4200BConfig.ALM_L_LIM ?? 0;
  const furnaceBLLLimit = tempSensor4200BConfig.ALM_LL_LIM ?? 0;
  const furnaceBAlarmHH = furnaceBHHLimit > 0 && tempSensor4200BPV >= furnaceBHHLimit;
  const furnaceBAlarmH = furnaceBHLimit > 0 && tempSensor4200BPV >= furnaceBHLimit;
  const furnaceBAlarmL = furnaceBLLimit > 0 && tempSensor4200BPV <= furnaceBLLimit;
  const furnaceBAlarmLL = furnaceBLLLimit > 0 && tempSensor4200BPV <= furnaceBLLLimit;
  const furnaceBAlarmActive = furnaceBAlarmHH || furnaceBAlarmH || furnaceBAlarmL || furnaceBAlarmLL;
  const furnaceBAlarmColor = (furnaceBAlarmHH || furnaceBAlarmLL) ? 'red' as const
    : (furnaceBAlarmH || furnaceBAlarmL) ? 'yellow' as const : undefined;

  const tempSensor4200BData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: tempSensor4200BConfig.TAGNAME || '1540-TI-4200B',
    description: tempSensor4200BConfig.DESC || 'Furnace Temp Out B',
    pv: tempSensor4200BPV,
    sp: tempSensor4200BSyncState.syncedSP,
    out: tempSensor4200BSyncState.syncedOUT,
    mode: tempSensor4200BSyncState.syncedMode,
    pvUnits: tempSensor4200BConfig.EU || '°F',
    pvRangeMin: tempSensor4200BConfig.SP_LIM_LO ?? 0,
    pvRangeMax: tempSensor4200BConfig.SP_LIM_HI ?? 2500,
    alarmActive: furnaceBAlarmActive,
    alarmColor: furnaceBAlarmColor,
    alarmLL: furnaceBLLLimit,
    alarmL: furnaceBLLimit,
    alarmH: furnaceBHLimit,
    alarmHH: furnaceBHHLimit,
  };

  // Build Temperature Sensor 1540-TI-4200C data from synced state (Furnace temp 1800-2300°F)
  const tempSensor4200CPV = orchestratorFurnaceTemp ?? tempSensor4200CSyncState.syncedPV;
  const furnaceCHHLimit = 2250;
  const furnaceCHLimit = 2200;
  const furnaceCLLimit = 1900;
  const furnaceCLLLimit = 1850;
  const furnaceCAlarmHH = furnaceCHHLimit > 0 && tempSensor4200CPV >= furnaceCHHLimit;
  const furnaceCAlarmH = furnaceCHLimit > 0 && tempSensor4200CPV >= furnaceCHLimit;
  const furnaceCAlarmL = furnaceCLLimit > 0 && tempSensor4200CPV <= furnaceCLLimit;
  const furnaceCAlarmLL = furnaceCLLLimit > 0 && tempSensor4200CPV <= furnaceCLLLimit;
  const furnaceCAlarmActive = furnaceCAlarmHH || furnaceCAlarmH || furnaceCAlarmL || furnaceCAlarmLL;
  const furnaceCAlarmColor = (furnaceCAlarmHH || furnaceCAlarmLL) ? 'red' as const
    : (furnaceCAlarmH || furnaceCAlarmL) ? 'yellow' as const : undefined;

  const tempSensor4200CData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: '1540-TI-4200C',
    description: 'Furnace C',
    pv: tempSensor4200CPV,
    sp: tempSensor4200CSyncState.syncedSP,
    out: tempSensor4200CSyncState.syncedOUT,
    mode: tempSensor4200CSyncState.syncedMode,
    pvUnits: '°F',
    pvRangeMin: 1800,
    pvRangeMax: 2300,
    alarmActive: furnaceCAlarmActive,
    alarmColor: furnaceCAlarmColor,
    alarmLL: furnaceCLLLimit,
    alarmL: furnaceCLLimit,
    alarmH: furnaceCHLimit,
    alarmHH: furnaceCHHLimit,
  };

  // Use shared compressor context
  const {
    compressorData,
    handleStart,
    handleStop,
    handleModeChange,
    handleSpeedSPChange,
    handleClearAlarm,
    setStaticValues,
    vfdConfig,
  } = useCompressor();

  useEffect(() => {
    const comp = orchestratorResult?.compressor;
    if (comp && comp.compressor_rpm) {
      const speedPercent = orchestratorResult?.sensor_tags?.["1540-SIC-4030"] ?? (comp.speed_ratio ?? 0) * 100;
      setStaticValues({
        speedSP: speedPercent,
        motorSpeedRPM: comp.driver_rpm ?? 0,
        compressorSpeedRPM: comp.compressor_rpm ?? 0,
        motorPowerHP: comp.motor_power_hp ?? 0,
        vfdCurrentAmps: comp.vfd_current_amps ?? 0,
        currentPV: comp.vfd_current_amps ?? 0,
        powerPV: comp.motor_power_hp ?? 0,
        state: "RUNNING",
        deviceState: selectedMode === "Static" ? "Static Mode" : "Dynamic Mode",
        ...(selectedMode === "Static" ? { speedPV: speedPercent } : {}),
      });
    } else if (selectedMode === "Static" && loadedCaseValue1540H4030 !== null) {
      const speedRPM = Math.round((loadedCaseValue1540H4030 / 100) * 4505);
      const estimatedCurrent = (loadedCaseValue1540H4030 / 100) * 50;
      setStaticValues({
        speedPV: loadedCaseValue1540H4030,
        speedSP: loadedCaseValue1540H4030,
        motorSpeedRPM: speedRPM,
        compressorSpeedRPM: speedRPM,
        motorPowerHP: 0,
        currentPV: estimatedCurrent,
        state: "RUNNING",
        deviceState: "Static Mode",
      });
    }
  }, [selectedMode, orchestratorResult, loadedCaseValue1540H4030, setStaticValues]);

  const handleCompressorClick = () => {
    if (isLocked) {
      setIsVFDModalOpen(true);
    }
  };

  const handleSulfurFlowClick = () => {
    if (isLocked) {
      setIsSulfurFlowModalOpen(true);
    }
  };

  const handleSulfurValveClick = () => {
    if (isLocked) {
      setLocation('/unit-operation/sulfur-control-hydraulics?from=home-screen');
    }
  };

  // L2 Sulfur Valve click handler - navigates to sulfur hydraulics page
  const handleSulfurValveL2Click = () => {
    if (isLockedL2) {
      setLocation('/unit-operation/sulfur-control-hydraulics?from=l2-furnace');
    }
  };

  const handleJugValveClick = () => {
    if (isLocked || isLockedL2) {
      setLocation('/unit-operation/jug-valve-whb');
    }
  };

  // Furnace click handler - navigates to sulfur furnace simulator with current values
  const handleFurnaceClick = () => {
    if (isLockedL2) {
      // Get the current sulfur flow value in gpm (use static value if available, otherwise synced value)
      const sulfurFlowGpm = useStaticSulfurFlow ? loadedCaseValueSulfurFlow : sulfurSyncState.syncedPV;
      // Navigate with sulfur flow as URL parameter (in gpm units) - air flow will be calculated from sulfur flow
      setLocation(`/unit-operation/sulfur-furnace?sulfurFlowGpm=${sulfurFlowGpm?.toFixed(2) || '79'}`);
    }
  };

  const handleJugValvePositionerClick = () => {
    if (isLocked) {
      setLocation('/jug-valve-positioner/3e');
    }
  };

  const handleHandControllerClick = () => {
    if (isLocked) {
      setIsHandControllerModalOpen(true);
    }
  };

  const handleWhbHandControllerClick = () => {
    if (isLocked) {
      setIsWhbHandControllerModalOpen(true);
    }
  };

  const handleJugValveHandControllerClick = () => {
    if (isLocked) {
      setIsJugValveHandControllerModalOpen(true);
    }
  };

  const handleTurboGeneratorClick = () => {
    if (isLocked) {
      setLocation('/settings/controller-outputs/faceplates/turbo-generator-faceplate');
    }
  };

  const handleTempSensorClick = () => {
    if (isLocked) {
      setIsTempSensorModalOpen(true);
    }
  };

  const handleTempSensor4200AClick = () => {
    if (isLocked) {
      setIsTempSensor4200AModalOpen(true);
    }
  };

  const handleTempSensor4820Click = () => {
    if (isLockedL2) {
      setIsTempSensor4820ModalOpen(true);
    }
  };

  const handleTempSensor4200BClick = () => {
    if (isLocked) {
      setIsTempSensor4200BModalOpen(true);
    }
  };

  const handleTempSensor4200CClick = () => {
    if (isLocked) {
      setIsTempSensor4200CModalOpen(true);
    }
  };

  // Build secondary faceplate data from synced state
  // In Static mode, use the loaded case value for PV, SP, and OUT to match the primary faceplate
  const staticSulfurValue = useStaticSulfurFlow && loadedCaseValueSulfurFlow !== null 
    ? loadedCaseValueSulfurFlow 
    : null;
  
  const sulfurFlowSecondaryData: SecondaryControllerData = {
    ...defaultSecondaryData,
    PV: staticSulfurValue ?? sulfurSyncState.syncedPV,
    SP: staticSulfurValue ?? sulfurSyncState.syncedSP,
    TSP: staticSulfurValue ?? sulfurSyncState.syncedSP,
    OUT_PCT: staticSulfurValue ?? sulfurSyncState.syncedOUT,
    MODE_AUTOMAN: sulfurSyncState.syncedMode === 'AUTO' || sulfurSyncState.syncedMode === 'MAN' 
      ? sulfurSyncState.syncedMode 
      : 'AUTO',
    MODE_ROUTRCAS: sulfurFlowRoutRcas,
    BYPASS_ACTIVE: sulfurFlowBypass,
    ALM_HH_ACT: sulfurSyncState.alarmStates.HH,
    ALM_H_ACT: sulfurSyncState.alarmStates.H,
    ALM_L_ACT: sulfurSyncState.alarmStates.L,
    ALM_LL_ACT: sulfurSyncState.alarmStates.LL,
    MODELOCK_OVERRIDE: sulfurFlowModelockOverride,
  };

  const sulfurFlowSecondaryConfig: SecondaryControllerConfig = {
    ...defaultSecondaryConfig,
    TAGNAME: '1530-F-2602',
    DESC: 'Sulfur Flow Controller',
    EU: 'GPM',
    PV_SCALE_LO: 0,
    PV_SCALE_HI: 100,
    SP_LIM_LO: 0,
    SP_LIM_HI: 100,
    // Disable alarm circles by setting limits to 0
    ALM_LL_LIM: 0,
    ALM_L_LIM: 0,
    ALM_DL_LIM: 0,
    ALM_DH_LIM: 0,
    ALM_H_LIM: 0,
    ALM_HH_LIM: 0,
  };

  // Build temperature sensor secondary faceplate data
  const tempSensorSecondaryData: SecondaryControllerData = {
    ...defaultSecondaryData,
    PV: tempSensorSyncState.syncedPV,
    SP: tempSensorSyncState.syncedSP,
    TSP: tempSensorSyncState.syncedSP,
    OUT_PCT: tempSensorSyncState.syncedOUT,
    MODE_AUTOMAN: tempSensorSyncState.syncedMode === 'AUTO' || tempSensorSyncState.syncedMode === 'MAN' 
      ? tempSensorSyncState.syncedMode 
      : 'AUTO',
    ALM_HH_ACT: tempSensorSyncState.alarmStates.HH,
    ALM_H_ACT: tempSensorSyncState.alarmStates.H,
    ALM_L_ACT: tempSensorSyncState.alarmStates.L,
    ALM_LL_ACT: tempSensorSyncState.alarmStates.LL,
  };

  const tempSensorSecondaryConfig: SecondaryControllerConfig = {
    ...defaultSecondaryConfig,
    TAGNAME: tempSensorConfig.TAGNAME || '1520-TI-5821',
    DESC: tempSensorConfig.DESC || 'DT Gas Out Temperature',
    EU: tempSensorConfig.EU || '°F',
    PV_SCALE_LO: tempSensorConfig.PV_SCALE_LO ?? 0,
    PV_SCALE_HI: tempSensorConfig.PV_SCALE_HI ?? 500,
    SP_LIM_LO: tempSensorConfig.SP_LIM_LO ?? 100,
    SP_LIM_HI: tempSensorConfig.SP_LIM_HI ?? 200,
    ALM_LL_LIM: tempSensorConfig.ALM_LL_LIM ?? 0,
    ALM_L_LIM: tempSensorConfig.ALM_L_LIM ?? 0,
    ALM_H_LIM: tempSensorConfig.ALM_H_LIM ?? 0,
    ALM_HH_LIM: tempSensorConfig.ALM_HH_LIM ?? 0,
    UNIT: tempSensorConfig.UNIT || 'U-505',
  };

  // Build temperature sensor 1540-TI-4200A secondary faceplate data
  const tempSensor4200ASecondaryData: SecondaryControllerData = {
    ...defaultSecondaryData,
    PV: tempSensor4200ASyncState.syncedPV,
    SP: tempSensor4200ASyncState.syncedSP,
    TSP: tempSensor4200ASyncState.syncedSP,
    OUT_PCT: tempSensor4200ASyncState.syncedOUT,
    MODE_AUTOMAN: tempSensor4200ASyncState.syncedMode === 'AUTO' || tempSensor4200ASyncState.syncedMode === 'MAN' 
      ? tempSensor4200ASyncState.syncedMode 
      : 'AUTO',
    ALM_HH_ACT: tempSensor4200ASyncState.alarmStates.HH,
    ALM_H_ACT: tempSensor4200ASyncState.alarmStates.H,
    ALM_L_ACT: tempSensor4200ASyncState.alarmStates.L,
    ALM_LL_ACT: tempSensor4200ASyncState.alarmStates.LL,
  };

  const tempSensor4200ASecondaryConfig: SecondaryControllerConfig = {
    ...defaultSecondaryConfig,
    TAGNAME: tempSensor4200AConfig.TAGNAME || '1540-TI-4200A',
    DESC: tempSensor4200AConfig.DESC || 'Furnace Temp Out A',
    EU: tempSensor4200AConfig.EU || '°F',
    PV_SCALE_LO: tempSensor4200AConfig.PV_SCALE_LO ?? 0,
    PV_SCALE_HI: tempSensor4200AConfig.PV_SCALE_HI ?? 2500,
    SP_LIM_LO: tempSensor4200AConfig.SP_LIM_LO ?? 0,
    SP_LIM_HI: tempSensor4200AConfig.SP_LIM_HI ?? 2500,
    ALM_LL_LIM: tempSensor4200AConfig.ALM_LL_LIM ?? 0,
    ALM_L_LIM: tempSensor4200AConfig.ALM_L_LIM ?? 0,
    ALM_H_LIM: tempSensor4200AConfig.ALM_H_LIM ?? 0,
    ALM_HH_LIM: tempSensor4200AConfig.ALM_HH_LIM ?? 0,
    UNIT: tempSensor4200AConfig.UNIT || 'U-505',
  };

  // Build temperature sensor 1540-TI-4820 (Pass 1 Inlet Duct) secondary faceplate data
  const tempSensor4820SecondaryData: SecondaryControllerData = {
    ...defaultSecondaryData,
    PV: tempSensor4820PV,
    SP: tempSensor4820SyncState.syncedSP,
    TSP: tempSensor4820SyncState.syncedSP,
    OUT_PCT: tempSensor4820SyncState.syncedOUT,
    MODE_AUTOMAN: tempSensor4820SyncState.syncedMode === 'AUTO' || tempSensor4820SyncState.syncedMode === 'MAN' 
      ? tempSensor4820SyncState.syncedMode 
      : 'AUTO',
    ALM_HH_ACT: tempSensor4820SyncState.alarmStates.HH,
    ALM_H_ACT: tempSensor4820SyncState.alarmStates.H,
    ALM_L_ACT: tempSensor4820SyncState.alarmStates.L,
    ALM_LL_ACT: tempSensor4820SyncState.alarmStates.LL,
  };

  const tempSensor4820SecondaryConfig: SecondaryControllerConfig = {
    ...defaultSecondaryConfig,
    TAGNAME: tempSensor4820Config.TAGNAME || '1540-TI-4820',
    DESC: tempSensor4820Config.DESC || 'Pass 1 Inlet Duct',
    EU: tempSensor4820Config.EU || 'F',
    PV_SCALE_LO: tempSensor4820Config.PV_SCALE_LO ?? 0,
    PV_SCALE_HI: tempSensor4820Config.PV_SCALE_HI ?? 2000,
    SP_LIM_LO: tempSensor4820Config.SP_LIM_LO ?? 0,
    SP_LIM_HI: tempSensor4820Config.SP_LIM_HI ?? 2000,
    ALM_LL_LIM: tempSensor4820Config.ALM_LL_LIM ?? 0,
    ALM_L_LIM: tempSensor4820Config.ALM_L_LIM ?? 0,
    ALM_H_LIM: tempSensor4820Config.ALM_H_LIM ?? 0,
    ALM_HH_LIM: tempSensor4820Config.ALM_HH_LIM ?? 0,
    UNIT: tempSensor4820Config.UNIT || 'Acid',
  };

  // Build temperature sensor 1540-TI-4200B secondary faceplate data
  const tempSensor4200BSecondaryData: SecondaryControllerData = {
    ...defaultSecondaryData,
    PV: tempSensor4200BSyncState.syncedPV,
    SP: tempSensor4200BSyncState.syncedSP,
    TSP: tempSensor4200BSyncState.syncedSP,
    OUT_PCT: tempSensor4200BSyncState.syncedOUT,
    MODE_AUTOMAN: tempSensor4200BSyncState.syncedMode === 'AUTO' || tempSensor4200BSyncState.syncedMode === 'MAN' 
      ? tempSensor4200BSyncState.syncedMode 
      : 'AUTO',
    ALM_HH_ACT: tempSensor4200BSyncState.alarmStates.HH,
    ALM_H_ACT: tempSensor4200BSyncState.alarmStates.H,
    ALM_L_ACT: tempSensor4200BSyncState.alarmStates.L,
    ALM_LL_ACT: tempSensor4200BSyncState.alarmStates.LL,
  };

  const tempSensor4200BSecondaryConfig: SecondaryControllerConfig = {
    ...defaultSecondaryConfig,
    TAGNAME: tempSensor4200BConfig.TAGNAME || '1540-TI-4200B',
    DESC: tempSensor4200BConfig.DESC || 'Furnace Temp Out B',
    EU: tempSensor4200BConfig.EU || '°F',
    PV_SCALE_LO: tempSensor4200BConfig.PV_SCALE_LO ?? 0,
    PV_SCALE_HI: tempSensor4200BConfig.PV_SCALE_HI ?? 2500,
    SP_LIM_LO: tempSensor4200BConfig.SP_LIM_LO ?? 0,
    SP_LIM_HI: tempSensor4200BConfig.SP_LIM_HI ?? 2500,
    ALM_LL_LIM: tempSensor4200BConfig.ALM_LL_LIM ?? 0,
    ALM_L_LIM: tempSensor4200BConfig.ALM_L_LIM ?? 0,
    ALM_H_LIM: tempSensor4200BConfig.ALM_H_LIM ?? 0,
    ALM_HH_LIM: tempSensor4200BConfig.ALM_HH_LIM ?? 0,
    UNIT: tempSensor4200BConfig.UNIT || 'U-505',
  };

  // Build temperature sensor 1540-TI-4200C secondary faceplate data
  const tempSensor4200CSecondaryData: SecondaryControllerData = {
    ...defaultSecondaryData,
    PV: tempSensor4200CSyncState.syncedPV,
    SP: tempSensor4200CSyncState.syncedSP,
    TSP: tempSensor4200CSyncState.syncedSP,
    OUT_PCT: tempSensor4200CSyncState.syncedOUT,
    MODE_AUTOMAN: tempSensor4200CSyncState.syncedMode === 'AUTO' || tempSensor4200CSyncState.syncedMode === 'MAN' 
      ? tempSensor4200CSyncState.syncedMode 
      : 'AUTO',
    ALM_HH_ACT: tempSensor4200CSyncState.alarmStates.HH,
    ALM_H_ACT: tempSensor4200CSyncState.alarmStates.H,
    ALM_L_ACT: tempSensor4200CSyncState.alarmStates.L,
    ALM_LL_ACT: tempSensor4200CSyncState.alarmStates.LL,
  };

  const tempSensor4200CSecondaryConfig: SecondaryControllerConfig = {
    ...defaultSecondaryConfig,
    TAGNAME: tempSensor4200CConfig.TAGNAME || '1540-TI-4200C',
    DESC: tempSensor4200CConfig.DESC || 'Furnace Temp Out C',
    EU: tempSensor4200CConfig.EU || '°F',
    PV_SCALE_LO: tempSensor4200CConfig.PV_SCALE_LO ?? 0,
    PV_SCALE_HI: tempSensor4200CConfig.PV_SCALE_HI ?? 2500,
    SP_LIM_LO: tempSensor4200CConfig.SP_LIM_LO ?? 0,
    SP_LIM_HI: tempSensor4200CConfig.SP_LIM_HI ?? 2500,
    ALM_LL_LIM: tempSensor4200CConfig.ALM_LL_LIM ?? 0,
    ALM_L_LIM: tempSensor4200CConfig.ALM_L_LIM ?? 0,
    ALM_H_LIM: tempSensor4200CConfig.ALM_H_LIM ?? 0,
    ALM_HH_LIM: tempSensor4200CConfig.ALM_HH_LIM ?? 0,
    UNIT: tempSensor4200CConfig.UNIT || 'U-505',
  };

  // Build temperature sensor 1540-TI-4825 secondary faceplate data
  const tempSensor4825SecondaryData: SecondaryControllerData = {
    ...defaultSecondaryData,
    PV: tempSensor4825SyncState.syncedPV,
    SP: tempSensor4825SyncState.syncedSP,
    TSP: tempSensor4825SyncState.syncedSP,
    OUT_PCT: tempSensor4825SyncState.syncedOUT,
    MODE_AUTOMAN: tempSensor4825SyncState.syncedMode === 'AUTO' || tempSensor4825SyncState.syncedMode === 'MAN' 
      ? tempSensor4825SyncState.syncedMode 
      : 'AUTO',
    ALM_HH_ACT: tempSensor4825SyncState.alarmStates.HH,
    ALM_H_ACT: tempSensor4825SyncState.alarmStates.H,
    ALM_L_ACT: tempSensor4825SyncState.alarmStates.L,
    ALM_LL_ACT: tempSensor4825SyncState.alarmStates.LL,
  };

  const tempSensor4825SecondaryConfig: SecondaryControllerConfig = {
    ...defaultSecondaryConfig,
    TAGNAME: tempSensor4825Config.TAGNAME || '1540-TI-4825',
    DESC: tempSensor4825Config.DESC || 'Pass 1 Catalyst In',
    EU: tempSensor4825Config.EU || '°F',
    PV_SCALE_LO: tempSensor4825Config.PV_SCALE_LO ?? 0,
    PV_SCALE_HI: tempSensor4825Config.PV_SCALE_HI ?? 2000,
    SP_LIM_LO: tempSensor4825Config.SP_LIM_LO ?? 0,
    SP_LIM_HI: tempSensor4825Config.SP_LIM_HI ?? 2000,
    ALM_LL_LIM: tempSensor4825Config.ALM_LL_LIM ?? 600,
    ALM_L_LIM: tempSensor4825Config.ALM_L_LIM ?? 700,
    ALM_H_LIM: tempSensor4825Config.ALM_H_LIM ?? 850,
    ALM_HH_LIM: tempSensor4825Config.ALM_HH_LIM ?? 900,
    UNIT: tempSensor4825Config.UNIT || 'U-505',
  };

  // Build Hand Controller 1540-H-4030 secondary faceplate data
  const handControllerSecondaryData: SecondaryControllerData = {
    ...defaultSecondaryData,
    PV: handControllerSyncState.syncedPV,
    SP: handControllerSyncState.syncedSP,
    TSP: handControllerSyncState.syncedSP,
    OUT_PCT: handControllerSyncState.syncedOUT,
    MODE_AUTOMAN: handControllerSyncState.syncedMode === 'AUTO' || handControllerSyncState.syncedMode === 'MAN' 
      ? handControllerSyncState.syncedMode 
      : 'AUTO',
    ALM_HH_ACT: handControllerSyncState.alarmStates.HH,
    ALM_H_ACT: handControllerSyncState.alarmStates.H,
    ALM_L_ACT: handControllerSyncState.alarmStates.L,
    ALM_LL_ACT: handControllerSyncState.alarmStates.LL,
  };

  const handControllerSecondaryConfig: SecondaryControllerConfig = {
    ...defaultSecondaryConfig,
    TAGNAME: handControllerConfig.TAGNAME || '1540-H-4030',
    DESC: handControllerConfig.DESC || 'Main Compressor Hand Controller',
    EU: handControllerConfig.EU || '%',
    PV_SCALE_LO: handControllerConfig.PV_SCALE_LO ?? 0,
    PV_SCALE_HI: handControllerConfig.PV_SCALE_HI ?? 100,
    SP_LIM_LO: handControllerConfig.SP_LIM_LO ?? 0,
    SP_LIM_HI: handControllerConfig.SP_LIM_HI ?? 100,
    ALM_LL_LIM: handControllerConfig.ALM_LL_LIM ?? 0,
    ALM_L_LIM: handControllerConfig.ALM_L_LIM ?? 0,
    ALM_H_LIM: handControllerConfig.ALM_H_LIM ?? 0,
    ALM_HH_LIM: handControllerConfig.ALM_HH_LIM ?? 0,
    UNIT: handControllerConfig.UNIT || 'U-505',
  };

  // Build Jug Valve Hand Controller 1540-H-4282 secondary faceplate data
  const jugValveHandControllerSecondaryData: SecondaryControllerData = {
    ...defaultSecondaryData,
    PV: jugValveHandControllerSyncState.syncedSP,
    SP: jugValveHandControllerSyncState.syncedSP,
    TSP: jugValveHandControllerSyncState.syncedSP,
    OUT_PCT: jugValveHandControllerSyncState.syncedSP,
    MODE_AUTOMAN: jugValveHandControllerSyncState.syncedMode === 'AUTO' || jugValveHandControllerSyncState.syncedMode === 'MAN' 
      ? jugValveHandControllerSyncState.syncedMode 
      : 'AUTO',
    ALM_HH_ACT: jugValveHandControllerSyncState.alarmStates.HH,
    ALM_H_ACT: jugValveHandControllerSyncState.alarmStates.H,
    ALM_L_ACT: jugValveHandControllerSyncState.alarmStates.L,
    ALM_LL_ACT: jugValveHandControllerSyncState.alarmStates.LL,
  };

  const jugValveHandControllerSecondaryConfig: SecondaryControllerConfig = {
    ...defaultSecondaryConfig,
    TAGNAME: jugValveHandControllerConfig.TAGNAME || '1540-H-4282',
    DESC: jugValveHandControllerConfig.DESC || 'Jug Valve Hand Controller',
    EU: jugValveHandControllerConfig.EU || '%',
    PV_SCALE_LO: jugValveHandControllerConfig.PV_SCALE_LO ?? 0,
    PV_SCALE_HI: jugValveHandControllerConfig.PV_SCALE_HI ?? 100,
    SP_LIM_LO: jugValveHandControllerConfig.SP_LIM_LO ?? 0,
    SP_LIM_HI: jugValveHandControllerConfig.SP_LIM_HI ?? 100,
    ALM_LL_LIM: jugValveHandControllerConfig.ALM_LL_LIM ?? 0,
    ALM_L_LIM: jugValveHandControllerConfig.ALM_L_LIM ?? 0,
    ALM_DL_LIM: 0,  // Explicitly set to 0 to hide DL indicator
    ALM_DH_LIM: 0,  // Explicitly set to 0 to hide DH indicator
    ALM_H_LIM: jugValveHandControllerConfig.ALM_H_LIM ?? 0,
    ALM_HH_LIM: jugValveHandControllerConfig.ALM_HH_LIM ?? 0,
    UNIT: jugValveHandControllerConfig.UNIT || 'U-505',
  };

  // Build WHB Hand Controller 1540-H-4283 secondary faceplate data
  const whbHandControllerSecondaryData: SecondaryControllerData = {
    ...defaultSecondaryData,
    PV: whbHandControllerSyncState.syncedSP,
    SP: whbHandControllerSyncState.syncedSP,
    TSP: whbHandControllerSyncState.syncedSP,
    OUT_PCT: whbHandControllerSyncState.syncedSP,
    MODE_AUTOMAN: whbHandControllerSyncState.syncedMode === 'AUTO' || whbHandControllerSyncState.syncedMode === 'MAN' 
      ? whbHandControllerSyncState.syncedMode 
      : 'AUTO',
    ALM_HH_ACT: whbHandControllerSyncState.alarmStates.HH,
    ALM_H_ACT: whbHandControllerSyncState.alarmStates.H,
    ALM_L_ACT: whbHandControllerSyncState.alarmStates.L,
    ALM_LL_ACT: whbHandControllerSyncState.alarmStates.LL,
  };

  const whbHandControllerSecondaryConfig: SecondaryControllerConfig = {
    ...defaultSecondaryConfig,
    TAGNAME: whbHandControllerConfig.TAGNAME || '1540-H-4283',
    DESC: whbHandControllerConfig.DESC || 'WHB Outlet dP Hand Controller',
    EU: whbHandControllerConfig.EU || '%',
    PV_SCALE_LO: whbHandControllerConfig.PV_SCALE_LO ?? 0,
    PV_SCALE_HI: whbHandControllerConfig.PV_SCALE_HI ?? 100,
    SP_LIM_LO: whbHandControllerConfig.SP_LIM_LO ?? 0,
    SP_LIM_HI: whbHandControllerConfig.SP_LIM_HI ?? 100,
    ALM_LL_LIM: whbHandControllerConfig.ALM_LL_LIM ?? 0,
    ALM_L_LIM: whbHandControllerConfig.ALM_L_LIM ?? 0,
    ALM_DL_LIM: 0,  // Explicitly set to 0 to hide DL indicator
    ALM_DH_LIM: 0,  // Explicitly set to 0 to hide DH indicator
    ALM_H_LIM: whbHandControllerConfig.ALM_H_LIM ?? 0,
    ALM_HH_LIM: whbHandControllerConfig.ALM_HH_LIM ?? 0,
    UNIT: whbHandControllerConfig.UNIT || 'U-505',
  };

  // Fetch saved layout positions from database
  const { data: layoutData, isLoading: isLoadingLayout } = useQuery<{ layouts: Array<{
    elementId: string;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    rotation: number;
  }> }>({
    queryKey: ['/api/homescreen-layout/L1'],
  });

  // Fetch saved L4 layout positions from database
  const { data: layoutDataL4 } = useQuery<{ layouts: Array<{
    elementId: string;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    rotation: number;
    viewScreen?: string;
  }> }>({
    queryKey: ['/api/homescreen-layout/L4'],
  });

  // Fetch PV case columns for the Open dialog
  const { data: pvCaseData } = useQuery<{ 
    variables: Array<any>; 
    cases: Array<{ id: string; name: string; description: string }> 
  }>({
    queryKey: ['/api/process-variables'],
  });

  // Apply loaded L4 positions to state when data arrives (only when not dirty)
  useEffect(() => {
    if (!layoutDataL4?.layouts || layoutDataL4.layouts.length === 0) return;
    // Only apply saved layout if user hasn't made local modifications
    if (isL4Dirty) return;
    
    const positionMap = new Map<string, { x: number; y: number; width: number; height: number; rotation: number; viewScreen?: string }>();
    layoutDataL4.layouts.forEach((item) => {
      positionMap.set(item.elementId, {
        x: item.positionX,
        y: item.positionY,
        width: item.width,
        height: item.height,
        rotation: item.rotation || 0,
        viewScreen: item.viewScreen,
      });
    });

    const converter4L4 = positionMap.get('converter4_l4');
    if (converter4L4) {
      setConverter4L4Position({ x: converter4L4.x, y: converter4L4.y });
      setConverter4L4Size({ width: converter4L4.width, height: converter4L4.height });
    }

    const faceplate4825L4 = positionMap.get('faceplate4825_l4');
    if (faceplate4825L4) {
      setFaceplate4825L4Position({ x: faceplate4825L4.x, y: faceplate4825L4.y });
      setFaceplate4825L4Size({ width: faceplate4825L4.width, height: faceplate4825L4.height });
    }

    const jugValveHcL4 = positionMap.get('jug_valve_hc_l4');
    if (jugValveHcL4) {
      setJugValveHandControllerL4Position({ x: jugValveHcL4.x, y: jugValveHcL4.y });
      setJugValveHandControllerL4Size({ width: jugValveHcL4.width, height: jugValveHcL4.height });
    }

    const kppL4 = positionMap.get('kpp_faceplate_l4');
    if (kppL4) {
      setKppFaceplateL4Position({ x: kppL4.x, y: kppL4.y });
      setKppFaceplateL4Size({ width: kppL4.width, height: kppL4.height });
    }

    const ts4820L4 = positionMap.get('temp_sensor_4820_l4');
    if (ts4820L4) {
      setTempSensor4820L4Position({ x: ts4820L4.x, y: ts4820L4.y });
      setTempSensor4820L4Size({ width: ts4820L4.width, height: ts4820L4.height });
    }

    // Restore vertical arrows for L4-Converter
    const l4Arrows: Array<{ id: string; x: number; y: number; width: number; height: number; screen: string; rotation: number }> = [];
    layoutDataL4.layouts.forEach((item) => {
      if (item.elementId.startsWith('v_arrow_') && item.viewScreen === 'L4-Converter') {
        l4Arrows.push({
          id: item.elementId,
          x: item.positionX,
          y: item.positionY,
          width: item.width,
          height: item.height,
          screen: item.viewScreen,
          rotation: item.rotation || 0,
        });
      }
    });
    if (l4Arrows.length > 0) {
      setVerticalArrows(prev => {
        // Remove existing L4 arrows and add loaded ones
        const nonL4Arrows = prev.filter(a => a.screen !== 'L4-Converter');
        return [...nonL4Arrows, ...l4Arrows];
      });
    }

    // Restore vertical lines for L4-Converter
    const l4Lines: Array<{ id: string; x: number; y: number; width: number; height: number; screen: string }> = [];
    layoutDataL4.layouts.forEach((item) => {
      if (item.elementId.startsWith('v_line_') && item.viewScreen === 'L4-Converter') {
        l4Lines.push({
          id: item.elementId,
          x: item.positionX,
          y: item.positionY,
          width: item.width,
          height: item.height,
          screen: item.viewScreen,
        });
      }
    });
    if (l4Lines.length > 0) {
      setVerticalLines(prev => {
        // Remove existing L4 lines and add loaded ones
        const nonL4Lines = prev.filter(l => l.screen !== 'L4-Converter');
        return [...nonL4Lines, ...l4Lines];
      });
    }
  }, [layoutDataL4, isL4Dirty]);

  // Query for L2-Furnace Area layout
  const { data: layoutDataL2 } = useQuery<{ layouts: Array<{
    elementId: string;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    rotation: number;
    viewScreen?: string;
  }> }>({
    queryKey: ['/api/homescreen-layout/L2'],
  });

  // Apply loaded L2 positions to state when data arrives (only when not dirty)
  useEffect(() => {
    if (!layoutDataL2?.layouts || layoutDataL2.layouts.length === 0) return;
    if (isL2Dirty) return;
    
    const positionMap = new Map<string, { x: number; y: number; width: number; height: number }>();
    layoutDataL2.layouts.forEach((item) => {
      positionMap.set(item.elementId, {
        x: item.positionX,
        y: item.positionY,
        width: item.width,
        height: item.height,
      });
    });

    const yellowArrow = positionMap.get('yellow_arrow_l2');
    if (yellowArrow) {
      setYellowArrowL2Position({ x: yellowArrow.x, y: yellowArrow.y });
      setYellowArrowL2Size({ width: yellowArrow.width, height: yellowArrow.height });
    }

    const cyanArrow = positionMap.get('cyan_arrow_l2');
    if (cyanArrow) {
      setCyanArrowL2Position({ x: cyanArrow.x, y: cyanArrow.y });
      setCyanArrowL2Size({ width: cyanArrow.width, height: cyanArrow.height });
    }

    const sulfurFurnace = positionMap.get('sulfur_furnace_l2');
    if (sulfurFurnace) {
      setSulfurFurnaceL2Position({ x: sulfurFurnace.x, y: sulfurFurnace.y });
      setSulfurFurnaceL2Size({ width: sulfurFurnace.width, height: sulfurFurnace.height });
    }

    const wasteHeatBoiler = positionMap.get('waste_heat_boiler_l2');
    if (wasteHeatBoiler) {
      setWasteHeatBoilerL2Position({ x: wasteHeatBoiler.x, y: wasteHeatBoiler.y });
      setWasteHeatBoilerL2Size({ width: wasteHeatBoiler.width, height: wasteHeatBoiler.height });
    }

    const yellowHorizArrow = positionMap.get('yellow_horiz_arrow_l2');
    if (yellowHorizArrow) {
      setYellowHorizArrowL2Position({ x: yellowHorizArrow.x, y: yellowHorizArrow.y });
      setYellowHorizArrowL2Size({ width: yellowHorizArrow.width, height: yellowHorizArrow.height });
    }

    const cyanLongArrow = positionMap.get('cyan_long_arrow_l2');
    if (cyanLongArrow) {
      setCyanLongArrowL2Position({ x: cyanLongArrow.x, y: cyanLongArrow.y });
      setCyanLongArrowL2Size({ width: cyanLongArrow.width, height: cyanLongArrow.height });
    }

    const cyanUpArrow = positionMap.get('cyan_up_arrow_l2');
    if (cyanUpArrow) {
      setCyanUpArrowL2Position({ x: cyanUpArrow.x, y: cyanUpArrow.y });
      setCyanUpArrowL2Size({ width: cyanUpArrow.width, height: cyanUpArrow.height });
    }

    const cyanLeftArrow = positionMap.get('cyan_left_arrow_l2');
    if (cyanLeftArrow) {
      setCyanLeftArrowL2Position({ x: cyanLeftArrow.x, y: cyanLeftArrow.y });
      setCyanLeftArrowL2Size({ width: cyanLeftArrow.width, height: cyanLeftArrow.height });
    }

    const cyanLongLeftArrow = positionMap.get('cyan_long_left_arrow_l2');
    if (cyanLongLeftArrow) {
      setCyanLongLeftArrowL2Position({ x: cyanLongLeftArrow.x, y: cyanLongLeftArrow.y });
      setCyanLongLeftArrowL2Size({ width: cyanLongLeftArrow.width, height: cyanLongLeftArrow.height });
    }

    const cyanUpArrow2 = positionMap.get('cyan_up_arrow_2_l2');
    if (cyanUpArrow2) {
      setCyanUpArrow2L2Position({ x: cyanUpArrow2.x, y: cyanUpArrow2.y });
      setCyanUpArrow2L2Size({ width: cyanUpArrow2.width, height: cyanUpArrow2.height });
    }

    const cyanUpArrow3 = positionMap.get('cyan_up_arrow_3_l2');
    if (cyanUpArrow3) {
      setCyanUpArrow3L2Position({ x: cyanUpArrow3.x, y: cyanUpArrow3.y });
      setCyanUpArrow3L2Size({ width: cyanUpArrow3.width, height: cyanUpArrow3.height });
    }

    const cyanDownArrow = positionMap.get('cyan_down_arrow_l2');
    if (cyanDownArrow) {
      setCyanDownArrowL2Position({ x: cyanDownArrow.x, y: cyanDownArrow.y });
      setCyanDownArrowL2Size({ width: cyanDownArrow.width, height: cyanDownArrow.height });
    }

    const metalTank = positionMap.get('metal_tank_l2');
    if (metalTank) {
      setMetalTankL2Position({ x: metalTank.x, y: metalTank.y });
      setMetalTankL2Size({ width: metalTank.width, height: metalTank.height });
    }

    const grayYellowArrow = positionMap.get('gray_yellow_arrow_l2');
    if (grayYellowArrow) {
      setGrayYellowArrowL2Position({ x: grayYellowArrow.x, y: grayYellowArrow.y });
      setGrayYellowArrowL2Size({ width: grayYellowArrow.width, height: grayYellowArrow.height });
    }

    const cyanHorizArrow2 = positionMap.get('cyan_horiz_arrow_2_l2');
    if (cyanHorizArrow2) {
      setCyanHorizArrow2L2Position({ x: cyanHorizArrow2.x, y: cyanHorizArrow2.y });
      setCyanHorizArrow2L2Size({ width: cyanHorizArrow2.width, height: cyanHorizArrow2.height });
    }

    const grayArrowCyanLine = positionMap.get('gray_arrow_cyan_line_l2');
    if (grayArrowCyanLine) {
      setGrayArrowCyanLineL2Position({ x: grayArrowCyanLine.x, y: grayArrowCyanLine.y });
      setGrayArrowCyanLineL2Size({ width: grayArrowCyanLine.width, height: grayArrowCyanLine.height });
    }

    const cyanThinLine1 = positionMap.get('cyan_thin_line_1_l2');
    if (cyanThinLine1) {
      setCyanThinLine1L2Position({ x: cyanThinLine1.x, y: cyanThinLine1.y });
      setCyanThinLine1L2Size({ width: cyanThinLine1.width, height: cyanThinLine1.height });
    }

    const cyanThinLine2 = positionMap.get('cyan_thin_line_2_l2');
    if (cyanThinLine2) {
      setCyanThinLine2L2Position({ x: cyanThinLine2.x, y: cyanThinLine2.y });
      setCyanThinLine2L2Size({ width: cyanThinLine2.width, height: cyanThinLine2.height });
    }

    const cyanVertLine1 = positionMap.get('cyan_vert_line_1_l2');
    if (cyanVertLine1) {
      setCyanVertLine1L2Position({ x: cyanVertLine1.x, y: cyanVertLine1.y });
      setCyanVertLine1L2Size({ width: cyanVertLine1.width, height: cyanVertLine1.height });
    }

    const cyanVertLine2 = positionMap.get('cyan_vert_line_2_l2');
    if (cyanVertLine2) {
      setCyanVertLine2L2Position({ x: cyanVertLine2.x, y: cyanVertLine2.y });
      setCyanVertLine2L2Size({ width: cyanVertLine2.width, height: cyanVertLine2.height });
    }

    const blackVertLine = positionMap.get('black_vert_line_l2');
    if (blackVertLine) {
      setBlackVertLineL2Position({ x: blackVertLine.x, y: blackVertLine.y });
      setBlackVertLineL2Size({ width: blackVertLine.width, height: blackVertLine.height });
    }

    const tempSensor4200AL2 = positionMap.get('temp_sensor_4200a_l2');
    if (tempSensor4200AL2) {
      setTempSensor4200AL2Position({ x: tempSensor4200AL2.x, y: tempSensor4200AL2.y });
      setTempSensor4200AL2Size({ width: tempSensor4200AL2.width, height: tempSensor4200AL2.height });
    }

    const tempSensor4820L2 = positionMap.get('temp_sensor_4820_l2');
    if (tempSensor4820L2) {
      setTempSensor4820L2Position({ x: tempSensor4820L2.x, y: tempSensor4820L2.y });
      setTempSensor4820L2Size({ width: tempSensor4820L2.width, height: tempSensor4820L2.height });
    }

    const processDataPanel = positionMap.get('process_data_panel_l2');
    if (processDataPanel) {
      setProcessDataPanelL2Position({ x: processDataPanel.x, y: processDataPanel.y });
      setProcessDataPanelL2Size({ width: processDataPanel.width, height: processDataPanel.height });
    }

    const kppFaceplate = positionMap.get('kpp_faceplate_l2');
    if (kppFaceplate) {
      setKppFaceplateL2Position({ x: kppFaceplate.x, y: kppFaceplate.y });
      setKppFaceplateL2Size({ width: kppFaceplate.width, height: kppFaceplate.height });
    }

    const handController = positionMap.get('hand_controller_l2');
    if (handController) {
      setHandControllerL2Position({ x: handController.x, y: handController.y });
      setHandControllerL2Size({ width: handController.width, height: handController.height });
    }

    const vfd = positionMap.get('vfd_l2');
    if (vfd) {
      setVfdL2Position({ x: vfd.x, y: vfd.y });
      setVfdL2Size({ width: vfd.width, height: vfd.height });
    }

    const sulfurFlow = positionMap.get('sulfur_flow_l2');
    if (sulfurFlow) {
      setSulfurFlowL2Position({ x: sulfurFlow.x, y: sulfurFlow.y });
      setSulfurFlowL2Size({ width: sulfurFlow.width, height: sulfurFlow.height });
    }

    const sulfurValve = positionMap.get('sulfur_valve_l2');
    if (sulfurValve) {
      setSulfurValveL2Position({ x: sulfurValve.x, y: sulfurValve.y });
      setSulfurValveL2Size({ width: sulfurValve.width, height: sulfurValve.height });
    }

    const jugValveHc = positionMap.get('jug_valve_hc_l2');
    if (jugValveHc) {
      setJugValveHandControllerL2Position({ x: jugValveHc.x, y: jugValveHc.y });
      setJugValveHandControllerL2Size({ width: jugValveHc.width, height: jugValveHc.height });
    }

    const jugValveHcv = positionMap.get('jug_valve_hcv_l2');
    if (jugValveHcv) {
      setJugValveHcvL2Position({ x: jugValveHcv.x, y: jugValveHcv.y });
      setJugValveHcvL2Size({ width: jugValveHcv.width, height: jugValveHcv.height });
    }
  }, [layoutDataL2, isL2Dirty]);

  // Apply loaded positions to state when data arrives
  useEffect(() => {
    if (!layoutData?.layouts || layoutData.layouts.length === 0) return;
    
    const positionMap = new Map<string, { x: number; y: number; width: number; height: number; rotation: number }>();
    layoutData.layouts.forEach((item) => {
      positionMap.set(item.elementId, {
        x: item.positionX,
        y: item.positionY,
        width: item.width,
        height: item.height,
        rotation: item.rotation || 0,
      });
    });

    // Apply positions to equipment
    const furnace = positionMap.get('furnace');
    if (furnace) {
      setFurnacePosition({ x: furnace.x, y: furnace.y });
      setFurnaceSize({ width: furnace.width, height: furnace.height });
    }
    
    const compressor = positionMap.get('compressor');
    if (compressor) {
      setCompressorPosition({ x: compressor.x, y: compressor.y });
      setCompressorSize({ width: compressor.width, height: compressor.height });
    }
    
    const turboGenerator = positionMap.get('turbo_generator');
    if (turboGenerator) {
      setTurboGeneratorPosition({ x: turboGenerator.x, y: turboGenerator.y });
      setTurboGeneratorSize({ width: turboGenerator.width, height: turboGenerator.height });
    }
    
    const sulfurFlow = positionMap.get('sulfur_flow');
    if (sulfurFlow) {
      setSulfurFlowPosition({ x: sulfurFlow.x, y: sulfurFlow.y });
      setSulfurFlowSize({ width: sulfurFlow.width, height: sulfurFlow.height });
    }
    
    const sulfurValve = positionMap.get('sulfur_valve');
    if (sulfurValve) {
      setSulfurValvePosition({ x: sulfurValve.x, y: sulfurValve.y });
      setSulfurValveSize({ width: sulfurValve.width, height: sulfurValve.height });
    }
    
    const jugValve = positionMap.get('jug_valve');
    if (jugValve) {
      setJugValvePosition({ x: jugValve.x, y: jugValve.y });
      setJugValveSize({ width: jugValve.width, height: jugValve.height });
    }
    
    const jugValvePositioner = positionMap.get('jug_valve_positioner');
    if (jugValvePositioner) {
      setJugValvePositionerPosition({ x: jugValvePositioner.x, y: jugValvePositioner.y });
      setJugValvePositionerSize({ width: jugValvePositioner.width, height: jugValvePositioner.height });
    }
    
    const handController = positionMap.get('hand_controller');
    if (handController) {
      setHandControllerPosition({ x: handController.x, y: handController.y });
      setHandControllerSize({ width: handController.width, height: handController.height });
    }
    
    const whbHandController = positionMap.get('whb_hand_controller');
    if (whbHandController) {
      setWhbHandControllerPosition({ x: whbHandController.x, y: whbHandController.y });
      setWhbHandControllerSize({ width: whbHandController.width, height: whbHandController.height });
    }
    
    const jugValveHandController = positionMap.get('jug_valve_hand_controller');
    if (jugValveHandController) {
      setJugValveHandControllerPosition({ x: jugValveHandController.x, y: jugValveHandController.y });
      setJugValveHandControllerSize({ width: jugValveHandController.width, height: jugValveHandController.height });
    }
    
    const tempSensor5821 = positionMap.get('temp_sensor_5821');
    if (tempSensor5821) {
      setTempSensorPosition({ x: tempSensor5821.x, y: tempSensor5821.y });
      setTempSensorSize({ width: tempSensor5821.width, height: tempSensor5821.height });
    }
    
    const tempSensor4200a = positionMap.get('temp_sensor_4200a');
    if (tempSensor4200a) {
      setTempSensor4200APosition({ x: tempSensor4200a.x, y: tempSensor4200a.y });
      setTempSensor4200ASize({ width: tempSensor4200a.width, height: tempSensor4200a.height });
    }
    
    const tempSensor4200b = positionMap.get('temp_sensor_4200b');
    if (tempSensor4200b) {
      setTempSensor4200BPosition({ x: tempSensor4200b.x, y: tempSensor4200b.y });
      setTempSensor4200BSize({ width: tempSensor4200b.width, height: tempSensor4200b.height });
    }
    
    const tempSensor4200c = positionMap.get('temp_sensor_4200c');
    if (tempSensor4200c) {
      setTempSensor4200CPosition({ x: tempSensor4200c.x, y: tempSensor4200c.y });
      setTempSensor4200CSize({ width: tempSensor4200c.width, height: tempSensor4200c.height });
    }
    
    // Converter and process equipment
    const converter4 = positionMap.get('converter4');
    if (converter4) {
      setConverter4Position({ x: converter4.x, y: converter4.y });
      setConverter4Size({ width: converter4.width, height: converter4.height });
    }
    
    const dt2 = positionMap.get('dt2');
    if (dt2) {
      setDt2Position({ x: dt2.x, y: dt2.y });
      setDt2Size({ width: dt2.width, height: dt2.height });
    }
    
    const fat1 = positionMap.get('fat1');
    if (fat1) {
      setFat1Position({ x: fat1.x, y: fat1.y });
      setFat1Size({ width: fat1.width, height: fat1.height });
    }
    
    const ipat1 = positionMap.get('ipat1');
    if (ipat1) {
      setIpat1Position({ x: ipat1.x, y: ipat1.y });
      setIpat1Size({ width: ipat1.width, height: ipat1.height });
    }
    
    const hip1 = positionMap.get('hip1');
    if (hip1) {
      setHip1Position({ x: hip1.x, y: hip1.y });
      setHip1Size({ width: hip1.width, height: hip1.height });
    }
    
    const cip = positionMap.get('cip');
    if (cip) {
      setCipPosition({ x: cip.x, y: cip.y });
      setCipSize({ width: cip.width, height: cip.height });
    }
    
    const sh4a = positionMap.get('sh4a');
    if (sh4a) {
      setSh4aPosition({ x: sh4a.x, y: sh4a.y });
      setSh4aSize({ width: sh4a.width, height: sh4a.height });
    }
    
    const ec3b = positionMap.get('ec3b');
    if (ec3b) {
      setEc3bPosition({ x: ec3b.x, y: ec3b.y });
      setEc3bSize({ width: ec3b.width, height: ec3b.height });
    }
    
    const sh1b = positionMap.get('sh1b');
    if (sh1b) {
      setSh1bPosition({ x: sh1b.x, y: sh1b.y });
      setSh1bSize({ width: sh1b.width, height: sh1b.height });
    }
    
    // Industrial Filter
    const industrialFilter = positionMap.get('industrial_filter');
    if (industrialFilter) {
      setFilterPosition({ x: industrialFilter.x, y: industrialFilter.y });
      setFilterSize({ width: industrialFilter.width, height: industrialFilter.height });
    }
    
    // Dashed lines
    const dashedLine1 = positionMap.get('dashed_line_1');
    if (dashedLine1) {
      setDashedLine1Position({ x: dashedLine1.x, y: dashedLine1.y });
      setDashedLine1Size({ width: dashedLine1.width, height: dashedLine1.height });
      setDashedLine1Rotation(dashedLine1.rotation || 0);
    }
    
    const dashedLine2 = positionMap.get('dashed_line_2');
    if (dashedLine2) {
      setDashedLine2Position({ x: dashedLine2.x, y: dashedLine2.y });
      setDashedLine2Size({ width: dashedLine2.width, height: dashedLine2.height });
      setDashedLine2Rotation(dashedLine2.rotation || 0);
    }
    
    const dashedLine3 = positionMap.get('dashed_line_3');
    if (dashedLine3) {
      setDashedLine3Position({ x: dashedLine3.x, y: dashedLine3.y });
      setDashedLine3Size({ width: dashedLine3.width, height: dashedLine3.height });
      setDashedLine3Rotation(dashedLine3.rotation || 0);
    }
    
    const dashedLine4 = positionMap.get('dashed_line_4');
    if (dashedLine4) {
      setDashedLine4Position({ x: dashedLine4.x, y: dashedLine4.y });
      setDashedLine4Size({ width: dashedLine4.width, height: dashedLine4.height });
      setDashedLine4Rotation(dashedLine4.rotation || 0);
    }
    
    // Arrows - update from database
    setArrows(prev => prev.map(arrow => {
      const saved = positionMap.get(arrow.id);
      if (saved) {
        return {
          ...arrow,
          x: saved.x,
          y: saved.y,
          width: saved.width,
          height: saved.height,
          rotation: saved.rotation || 0,
        };
      }
      return arrow;
    }));
    
    // Vertical arrows - load from database (dynamically created elements)
    // Read viewScreen from database, defaulting to 'L1 – System Overview' for backward compatibility
    const savedVerticalArrows: Array<{ id: string; x: number; y: number; width: number; height: number; screen: string; rotation: number }> = [];
    layoutData.layouts.forEach((layout: { elementId: string; positionX: number; positionY: number; width: number; height: number; rotation?: number; viewScreen?: string | null }) => {
      if (layout.elementId.startsWith('v_arrow_')) {
        savedVerticalArrows.push({
          id: layout.elementId,
          x: layout.positionX,
          y: layout.positionY,
          width: layout.width,
          height: layout.height,
          screen: layout.viewScreen || 'L1 – System Overview',
          rotation: layout.rotation || 0,
        });
      }
    });
    if (savedVerticalArrows.length > 0) {
      setVerticalArrows(savedVerticalArrows);
    }
    
    // Vertical lines - load from database (dynamically created elements)
    // Read viewScreen from database, defaulting to 'L1 – System Overview' for backward compatibility
    const savedVerticalLines: Array<{ id: string; x: number; y: number; width: number; height: number; screen: string }> = [];
    layoutData.layouts.forEach((layout: { elementId: string; positionX: number; positionY: number; width: number; height: number; viewScreen?: string | null }) => {
      if (layout.elementId.startsWith('v_line_')) {
        savedVerticalLines.push({
          id: layout.elementId,
          x: layout.positionX,
          y: layout.positionY,
          width: layout.width,
          height: layout.height,
          screen: layout.viewScreen || 'L1 – System Overview',
        });
      }
    });
    // Always set vertical lines from saved layout (including empty array to clear removed lines)
    setVerticalLines(savedVerticalLines);
    
  }, [layoutData]);

  const handleSaveLayout = async () => {
    setIsSaving(true);
    try {
      // Collect all current positions
      const layouts = [
        { elementId: 'furnace', positionX: Math.round(furnacePosition.x), positionY: Math.round(furnacePosition.y), width: furnaceSize.width, height: furnaceSize.height, rotation: 0 },
        { elementId: 'compressor', positionX: Math.round(compressorPosition.x), positionY: Math.round(compressorPosition.y), width: compressorSize.width, height: compressorSize.height, rotation: 0 },
        { elementId: 'sulfur_flow', positionX: Math.round(sulfurFlowPosition.x), positionY: Math.round(sulfurFlowPosition.y), width: sulfurFlowSize.width, height: sulfurFlowSize.height, rotation: 0 },
        { elementId: 'sulfur_valve', positionX: Math.round(sulfurValvePosition.x), positionY: Math.round(sulfurValvePosition.y), width: sulfurValveSize.width, height: sulfurValveSize.height, rotation: 0 },
        { elementId: 'jug_valve', positionX: Math.round(jugValvePosition.x), positionY: Math.round(jugValvePosition.y), width: jugValveSize.width, height: jugValveSize.height, rotation: 0 },
        { elementId: 'jug_valve_positioner', positionX: Math.round(jugValvePositionerPosition.x), positionY: Math.round(jugValvePositionerPosition.y), width: jugValvePositionerSize.width, height: jugValvePositionerSize.height, rotation: 0 },
        { elementId: 'hand_controller', positionX: Math.round(handControllerPosition.x), positionY: Math.round(handControllerPosition.y), width: handControllerSize.width, height: handControllerSize.height, rotation: 0 },
        { elementId: 'whb_hand_controller', positionX: Math.round(whbHandControllerPosition.x), positionY: Math.round(whbHandControllerPosition.y), width: whbHandControllerSize.width, height: whbHandControllerSize.height, rotation: 0 },
        { elementId: 'jug_valve_hand_controller', positionX: Math.round(jugValveHandControllerPosition.x), positionY: Math.round(jugValveHandControllerPosition.y), width: jugValveHandControllerSize.width, height: jugValveHandControllerSize.height, rotation: 0 },
        { elementId: 'temp_sensor_5821', positionX: Math.round(tempSensorPosition.x), positionY: Math.round(tempSensorPosition.y), width: tempSensorSize.width, height: tempSensorSize.height, rotation: 0 },
        { elementId: 'temp_sensor_4200a', positionX: Math.round(tempSensor4200APosition.x), positionY: Math.round(tempSensor4200APosition.y), width: tempSensor4200ASize.width, height: tempSensor4200ASize.height, rotation: 0 },
        { elementId: 'temp_sensor_4200b', positionX: Math.round(tempSensor4200BPosition.x), positionY: Math.round(tempSensor4200BPosition.y), width: tempSensor4200BSize.width, height: tempSensor4200BSize.height, rotation: 0 },
        { elementId: 'temp_sensor_4200c', positionX: Math.round(tempSensor4200CPosition.x), positionY: Math.round(tempSensor4200CPosition.y), width: tempSensor4200CSize.width, height: tempSensor4200CSize.height, rotation: 0 },
        { elementId: 'converter4', positionX: Math.round(converter4Position.x), positionY: Math.round(converter4Position.y), width: converter4Size.width, height: converter4Size.height, rotation: 0 },
        { elementId: 'dt2', positionX: Math.round(dt2Position.x), positionY: Math.round(dt2Position.y), width: dt2Size.width, height: dt2Size.height, rotation: 0 },
        { elementId: 'fat1', positionX: Math.round(fat1Position.x), positionY: Math.round(fat1Position.y), width: fat1Size.width, height: fat1Size.height, rotation: 0 },
        { elementId: 'ipat1', positionX: Math.round(ipat1Position.x), positionY: Math.round(ipat1Position.y), width: ipat1Size.width, height: ipat1Size.height, rotation: 0 },
        { elementId: 'hip1', positionX: Math.round(hip1Position.x), positionY: Math.round(hip1Position.y), width: hip1Size.width, height: hip1Size.height, rotation: 0 },
        { elementId: 'cip', positionX: Math.round(cipPosition.x), positionY: Math.round(cipPosition.y), width: cipSize.width, height: cipSize.height, rotation: 0 },
        { elementId: 'sh4a', positionX: Math.round(sh4aPosition.x), positionY: Math.round(sh4aPosition.y), width: sh4aSize.width, height: sh4aSize.height, rotation: 0 },
        { elementId: 'ec3b', positionX: Math.round(ec3bPosition.x), positionY: Math.round(ec3bPosition.y), width: ec3bSize.width, height: ec3bSize.height, rotation: 0 },
        { elementId: 'sh1b', positionX: Math.round(sh1bPosition.x), positionY: Math.round(sh1bPosition.y), width: sh1bSize.width, height: sh1bSize.height, rotation: 0 },
        { elementId: 'industrial_filter', positionX: Math.round(filterPosition.x), positionY: Math.round(filterPosition.y), width: filterSize.width, height: filterSize.height, rotation: 0 },
        { elementId: 'dashed_line_1', positionX: Math.round(dashedLine1Position.x), positionY: Math.round(dashedLine1Position.y), width: dashedLine1Size.width, height: dashedLine1Size.height, rotation: dashedLine1Rotation },
        { elementId: 'dashed_line_2', positionX: Math.round(dashedLine2Position.x), positionY: Math.round(dashedLine2Position.y), width: dashedLine2Size.width, height: dashedLine2Size.height, rotation: dashedLine2Rotation },
        { elementId: 'dashed_line_3', positionX: Math.round(dashedLine3Position.x), positionY: Math.round(dashedLine3Position.y), width: dashedLine3Size.width, height: dashedLine3Size.height, rotation: dashedLine3Rotation },
        { elementId: 'dashed_line_4', positionX: Math.round(dashedLine4Position.x), positionY: Math.round(dashedLine4Position.y), width: dashedLine4Size.width, height: dashedLine4Size.height, rotation: dashedLine4Rotation },
        { elementId: 'turbo_generator', positionX: Math.round(turboGeneratorPosition.x), positionY: Math.round(turboGeneratorPosition.y), width: turboGeneratorSize.width, height: turboGeneratorSize.height, rotation: 0 },
        // Add all arrows
        ...arrows.map(arrow => ({
          elementId: arrow.id,
          positionX: Math.round(arrow.x),
          positionY: Math.round(arrow.y),
          width: arrow.width,
          height: arrow.height,
          rotation: arrow.rotation,
        })),
        // Add all vertical arrows (include viewScreen and rotation for persistence)
        ...verticalArrows.map(va => ({
          elementId: va.id,
          positionX: Math.round(va.x),
          positionY: Math.round(va.y),
          width: va.width,
          height: va.height,
          rotation: va.rotation,
          viewScreen: va.screen,
        })),
        // Add all vertical lines (include viewScreen property for persistence)
        ...verticalLines.map(vl => ({
          elementId: vl.id,
          positionX: Math.round(vl.x),
          positionY: Math.round(vl.y),
          width: vl.width,
          height: vl.height,
          rotation: 0,
          viewScreen: vl.screen,
        })),
      ];

      await apiRequest('PUT', '/api/homescreen-layout/L1', { layouts });
      // Invalidate cache so fresh data loads on next page visit
      await queryClient.invalidateQueries({ queryKey: ['/api/homescreen-layout/L1'] });
      toast({ title: "Layout saved", description: "Icon positions saved to database." });
    } catch (error) {
      console.error('Failed to save layout:', error);
      toast({ title: "Error", description: "Failed to save layout positions.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Save L4-Converter layout to database
  const handleSaveL4Layout = async () => {
    setIsSavingL4(true);
    try {
      const layouts = [
        { elementId: 'converter4_l4', positionX: Math.round(converter4L4Position.x), positionY: Math.round(converter4L4Position.y), width: converter4L4Size.width, height: converter4L4Size.height, rotation: 0 },
        { elementId: 'faceplate4825_l4', positionX: Math.round(faceplate4825L4Position.x), positionY: Math.round(faceplate4825L4Position.y), width: faceplate4825L4Size.width, height: faceplate4825L4Size.height, rotation: 0 },
        { elementId: 'jug_valve_hc_l4', positionX: Math.round(jugValveHandControllerL4Position.x), positionY: Math.round(jugValveHandControllerL4Position.y), width: jugValveHandControllerL4Size.width, height: jugValveHandControllerL4Size.height, rotation: 0 },
        { elementId: 'kpp_faceplate_l4', positionX: Math.round(kppFaceplateL4Position.x), positionY: Math.round(kppFaceplateL4Position.y), width: kppFaceplateL4Size.width, height: kppFaceplateL4Size.height, rotation: 0 },
        { elementId: 'temp_sensor_4820_l4', positionX: Math.round(tempSensor4820L4Position.x), positionY: Math.round(tempSensor4820L4Position.y), width: tempSensor4820L4Size.width, height: tempSensor4820L4Size.height, rotation: 0 },
        // Add vertical arrows for L4-Converter screen
        ...verticalArrows.filter(va => va.screen === 'L4-Converter').map(va => ({
          elementId: va.id,
          positionX: Math.round(va.x),
          positionY: Math.round(va.y),
          width: va.width,
          height: va.height,
          rotation: va.rotation,
          viewScreen: va.screen,
        })),
        // Add vertical lines for L4-Converter screen
        ...verticalLines.filter(vl => vl.screen === 'L4-Converter').map(vl => ({
          elementId: vl.id,
          positionX: Math.round(vl.x),
          positionY: Math.round(vl.y),
          width: vl.width,
          height: vl.height,
          rotation: 0,
          viewScreen: vl.screen,
        })),
      ];

      await apiRequest('PUT', '/api/homescreen-layout/L4', { layouts });
      // Clear dirty flag so refetched data can be applied
      setIsL4Dirty(false);
      await queryClient.invalidateQueries({ queryKey: ['/api/homescreen-layout/L4'] });
      toast({ title: "Layout saved", description: "L4 Converter layout saved to database." });
    } catch (error) {
      console.error('Failed to save L4 layout:', error);
      toast({ title: "Error", description: "Failed to save L4 layout positions.", variant: "destructive" });
    } finally {
      setIsSavingL4(false);
    }
  };

  // Save L2-Furnace Area layout to database
  const handleSaveL2Layout = async () => {
    setIsSavingL2(true);
    try {
      const layouts = [
        { elementId: 'hand_controller_l2', positionX: Math.round(handControllerL2Position.x), positionY: Math.round(handControllerL2Position.y), width: handControllerL2Size.width, height: handControllerL2Size.height, rotation: 0 },
        { elementId: 'vfd_l2', positionX: Math.round(vfdL2Position.x), positionY: Math.round(vfdL2Position.y), width: vfdL2Size.width, height: vfdL2Size.height, rotation: 0 },
        { elementId: 'sulfur_flow_l2', positionX: Math.round(sulfurFlowL2Position.x), positionY: Math.round(sulfurFlowL2Position.y), width: sulfurFlowL2Size.width, height: sulfurFlowL2Size.height, rotation: 0 },
        { elementId: 'sulfur_valve_l2', positionX: Math.round(sulfurValveL2Position.x), positionY: Math.round(sulfurValveL2Position.y), width: sulfurValveL2Size.width, height: sulfurValveL2Size.height, rotation: 0 },
        { elementId: 'jug_valve_hc_l2', positionX: Math.round(jugValveHandControllerL2Position.x), positionY: Math.round(jugValveHandControllerL2Position.y), width: jugValveHandControllerL2Size.width, height: jugValveHandControllerL2Size.height, rotation: 0 },
        { elementId: 'jug_valve_hcv_l2', positionX: Math.round(jugValveHcvL2Position.x), positionY: Math.round(jugValveHcvL2Position.y), width: jugValveHcvL2Size.width, height: jugValveHcvL2Size.height, rotation: 0 },
        { elementId: 'yellow_arrow_l2', positionX: Math.round(yellowArrowL2Position.x), positionY: Math.round(yellowArrowL2Position.y), width: yellowArrowL2Size.width, height: yellowArrowL2Size.height, rotation: 0 },
        { elementId: 'cyan_arrow_l2', positionX: Math.round(cyanArrowL2Position.x), positionY: Math.round(cyanArrowL2Position.y), width: cyanArrowL2Size.width, height: cyanArrowL2Size.height, rotation: 0 },
        { elementId: 'sulfur_furnace_l2', positionX: Math.round(sulfurFurnaceL2Position.x), positionY: Math.round(sulfurFurnaceL2Position.y), width: sulfurFurnaceL2Size.width, height: sulfurFurnaceL2Size.height, rotation: 0 },
        { elementId: 'waste_heat_boiler_l2', positionX: Math.round(wasteHeatBoilerL2Position.x), positionY: Math.round(wasteHeatBoilerL2Position.y), width: wasteHeatBoilerL2Size.width, height: wasteHeatBoilerL2Size.height, rotation: 0 },
        { elementId: 'yellow_horiz_arrow_l2', positionX: Math.round(yellowHorizArrowL2Position.x), positionY: Math.round(yellowHorizArrowL2Position.y), width: yellowHorizArrowL2Size.width, height: yellowHorizArrowL2Size.height, rotation: 0 },
        { elementId: 'cyan_long_arrow_l2', positionX: Math.round(cyanLongArrowL2Position.x), positionY: Math.round(cyanLongArrowL2Position.y), width: cyanLongArrowL2Size.width, height: cyanLongArrowL2Size.height, rotation: 0 },
        { elementId: 'cyan_up_arrow_l2', positionX: Math.round(cyanUpArrowL2Position.x), positionY: Math.round(cyanUpArrowL2Position.y), width: cyanUpArrowL2Size.width, height: cyanUpArrowL2Size.height, rotation: 0 },
        { elementId: 'cyan_left_arrow_l2', positionX: Math.round(cyanLeftArrowL2Position.x), positionY: Math.round(cyanLeftArrowL2Position.y), width: cyanLeftArrowL2Size.width, height: cyanLeftArrowL2Size.height, rotation: 0 },
        { elementId: 'cyan_long_left_arrow_l2', positionX: Math.round(cyanLongLeftArrowL2Position.x), positionY: Math.round(cyanLongLeftArrowL2Position.y), width: cyanLongLeftArrowL2Size.width, height: cyanLongLeftArrowL2Size.height, rotation: 0 },
        { elementId: 'cyan_up_arrow_2_l2', positionX: Math.round(cyanUpArrow2L2Position.x), positionY: Math.round(cyanUpArrow2L2Position.y), width: cyanUpArrow2L2Size.width, height: cyanUpArrow2L2Size.height, rotation: 0 },
        { elementId: 'cyan_up_arrow_3_l2', positionX: Math.round(cyanUpArrow3L2Position.x), positionY: Math.round(cyanUpArrow3L2Position.y), width: cyanUpArrow3L2Size.width, height: cyanUpArrow3L2Size.height, rotation: 0 },
        { elementId: 'cyan_down_arrow_l2', positionX: Math.round(cyanDownArrowL2Position.x), positionY: Math.round(cyanDownArrowL2Position.y), width: cyanDownArrowL2Size.width, height: cyanDownArrowL2Size.height, rotation: 0 },
        { elementId: 'metal_tank_l2', positionX: Math.round(metalTankL2Position.x), positionY: Math.round(metalTankL2Position.y), width: metalTankL2Size.width, height: metalTankL2Size.height, rotation: 0 },
        { elementId: 'gray_yellow_arrow_l2', positionX: Math.round(grayYellowArrowL2Position.x), positionY: Math.round(grayYellowArrowL2Position.y), width: grayYellowArrowL2Size.width, height: grayYellowArrowL2Size.height, rotation: 0 },
        { elementId: 'cyan_horiz_arrow_2_l2', positionX: Math.round(cyanHorizArrow2L2Position.x), positionY: Math.round(cyanHorizArrow2L2Position.y), width: cyanHorizArrow2L2Size.width, height: cyanHorizArrow2L2Size.height, rotation: 0 },
        { elementId: 'gray_arrow_cyan_line_l2', positionX: Math.round(grayArrowCyanLineL2Position.x), positionY: Math.round(grayArrowCyanLineL2Position.y), width: grayArrowCyanLineL2Size.width, height: grayArrowCyanLineL2Size.height, rotation: 0 },
        { elementId: 'cyan_thin_line_1_l2', positionX: Math.round(cyanThinLine1L2Position.x), positionY: Math.round(cyanThinLine1L2Position.y), width: cyanThinLine1L2Size.width, height: cyanThinLine1L2Size.height, rotation: 0 },
        { elementId: 'cyan_thin_line_2_l2', positionX: Math.round(cyanThinLine2L2Position.x), positionY: Math.round(cyanThinLine2L2Position.y), width: cyanThinLine2L2Size.width, height: cyanThinLine2L2Size.height, rotation: 0 },
        { elementId: 'cyan_vert_line_1_l2', positionX: Math.round(cyanVertLine1L2Position.x), positionY: Math.round(cyanVertLine1L2Position.y), width: cyanVertLine1L2Size.width, height: cyanVertLine1L2Size.height, rotation: 0 },
        { elementId: 'cyan_vert_line_2_l2', positionX: Math.round(cyanVertLine2L2Position.x), positionY: Math.round(cyanVertLine2L2Position.y), width: cyanVertLine2L2Size.width, height: cyanVertLine2L2Size.height, rotation: 0 },
        { elementId: 'black_vert_line_l2', positionX: Math.round(blackVertLineL2Position.x), positionY: Math.round(blackVertLineL2Position.y), width: blackVertLineL2Size.width, height: blackVertLineL2Size.height, rotation: 0 },
        { elementId: 'temp_sensor_4200a_l2', positionX: Math.round(tempSensor4200AL2Position.x), positionY: Math.round(tempSensor4200AL2Position.y), width: tempSensor4200AL2Size.width, height: tempSensor4200AL2Size.height, rotation: 0 },
        { elementId: 'temp_sensor_4820_l2', positionX: Math.round(tempSensor4820L2Position.x), positionY: Math.round(tempSensor4820L2Position.y), width: tempSensor4820L2Size.width, height: tempSensor4820L2Size.height, rotation: 0 },
        { elementId: 'process_data_panel_l2', positionX: Math.round(processDataPanelL2Position.x), positionY: Math.round(processDataPanelL2Position.y), width: processDataPanelL2Size.width, height: processDataPanelL2Size.height, rotation: 0 },
        { elementId: 'kpp_faceplate_l2', positionX: Math.round(kppFaceplateL2Position.x), positionY: Math.round(kppFaceplateL2Position.y), width: kppFaceplateL2Size.width, height: kppFaceplateL2Size.height, rotation: 0 },
        // Add vertical arrows for L2-Furnace Area screen
        ...verticalArrows.filter(va => va.screen === 'L2 – Furnace Area').map(va => ({
          elementId: va.id,
          positionX: Math.round(va.x),
          positionY: Math.round(va.y),
          width: va.width,
          height: va.height,
          rotation: va.rotation,
          viewScreen: va.screen,
        })),
        // Add vertical lines for L2-Furnace Area screen
        ...verticalLines.filter(vl => vl.screen === 'L2 – Furnace Area').map(vl => ({
          elementId: vl.id,
          positionX: Math.round(vl.x),
          positionY: Math.round(vl.y),
          width: vl.width,
          height: vl.height,
          rotation: 0,
          viewScreen: vl.screen,
        })),
      ];

      await apiRequest('PUT', '/api/homescreen-layout/L2', { layouts });
      setIsL2Dirty(false);
      await queryClient.invalidateQueries({ queryKey: ['/api/homescreen-layout/L2'] });
      toast({ title: "Layout saved", description: "L2 Furnace Area layout saved to database." });
    } catch (error) {
      console.error('Failed to save L2 layout:', error);
      toast({ title: "Error", description: "Failed to save L2 layout positions.", variant: "destructive" });
    } finally {
      setIsSavingL2(false);
    }
  };


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  // Rotate arrow by 90 degrees clockwise
  const handleRotateArrow = (arrowId: string) => {
    if (isLocked) return;
    setArrows(prev => prev.map(arrow => 
      arrow.id === arrowId 
        ? { ...arrow, rotation: (arrow.rotation + 90) % 360 }
        : arrow
    ));
  };
  
  // Add a new vertical arrow to the current screen
  const handleAddVerticalArrow = () => {
    const newId = `v_arrow_${Date.now()}`;
    setVerticalArrows(prev => [...prev, {
      id: newId,
      x: 100,
      y: 100,
      width: 24,
      height: 150,
      screen: selectedScreen,
      rotation: 0,
    }]);
    toast({ title: "Vertical Arrow Added", description: `A new vertical arrow has been added to ${selectedScreen}.` });
  };

  // Rotate a vertical arrow by 90 degrees clockwise
  const handleRotateVerticalArrow = (arrowId: string) => {
    setVerticalArrows(prev => prev.map(va => 
      va.id === arrowId 
        ? { ...va, rotation: (va.rotation + 90) % 360 }
        : va
    ));
  };

  // Add a new vertical line (without arrowhead) to the current screen
  const handleAddVerticalLine = () => {
    const newId = `v_line_${Date.now()}`;
    setVerticalLines(prev => [...prev, {
      id: newId,
      x: 150,
      y: 100,
      width: 24,
      height: 150,
      screen: selectedScreen,
    }]);
    toast({ title: "Vertical Line Added", description: `A new vertical line has been added to ${selectedScreen}.` });
  };

  // Delete a specific vertical arrow by id
  const handleDeleteVerticalArrow = (arrowId: string) => {
    setVerticalArrows(prev => prev.filter(va => va.id !== arrowId));
    if (selectedScreen === 'L4-Converter') {
      setIsL4Dirty(true);
    }
    toast({ title: "Arrow Deleted", description: "The vertical arrow has been removed." });
  };

  // Delete a specific vertical line by id
  const handleDeleteVerticalLine = (lineId: string) => {
    setVerticalLines(prev => prev.filter(vl => vl.id !== lineId));
    if (selectedScreen === 'L4-Converter') {
      setIsL4Dirty(true);
    }
    toast({ title: "Line Deleted", description: "The vertical line has been removed." });
  };

  // Delete the last added vertical arrow on the current screen
  const handleDeleteLastArrow = () => {
    const screenArrows = verticalArrows.filter(va => va.screen === selectedScreen);
    if (screenArrows.length === 0) {
      toast({ title: "No Arrows", description: `No arrows to delete on ${selectedScreen}.`, variant: "destructive" });
      return;
    }
    const lastArrow = screenArrows[screenArrows.length - 1];
    handleDeleteVerticalArrow(lastArrow.id);
  };

  // Delete the last added vertical line on the current screen
  const handleDeleteLastLine = () => {
    const screenLines = verticalLines.filter(vl => vl.screen === selectedScreen);
    if (screenLines.length === 0) {
      toast({ title: "No Lines", description: `No lines to delete on ${selectedScreen}.`, variant: "destructive" });
      return;
    }
    const lastLine = screenLines[screenLines.length - 1];
    handleDeleteVerticalLine(lastLine.id);
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Traditional Menu Bar */}
      <div className="flex-shrink-0 bg-gray-200 border-b border-gray-300 px-1 py-0.5 flex items-center">
        <img src={menuIconImg} alt="Menu" className="w-5 h-5 mr-2" />
        <Menubar className="border-none bg-transparent h-6 p-0 space-x-0">
          <MenubarMenu>
            <MenubarTrigger className="text-xs px-2 py-0.5 h-5 font-normal text-gray-800 data-[state=open]:bg-blue-600 data-[state=open]:text-white hover:bg-blue-600 hover:text-white" data-testid="menu-file">
              File
            </MenubarTrigger>
            <MenubarContent className="bg-white text-gray-800">
              <MenubarItem className="text-gray-800" data-testid="menu-file-new">New</MenubarItem>
              <MenubarItem 
                className="text-gray-800" 
                data-testid="menu-file-open"
                onClick={() => setIsOpenPVCaseDialogOpen(true)}
              >Open</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-file-save">Save</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-file-save-as">Save As</MenubarItem>
              <MenubarSeparator />
              <MenubarItem className="text-gray-800" data-testid="menu-file-print">Print</MenubarItem>
              <MenubarSeparator />
              <MenubarItem className="text-gray-800" data-testid="menu-file-exit">Exit</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="text-xs px-2 py-0.5 h-5 font-normal text-gray-800 data-[state=open]:bg-blue-600 data-[state=open]:text-white hover:bg-blue-600 hover:text-white" data-testid="menu-edit">
              Edit
            </MenubarTrigger>
            <MenubarContent className="bg-white text-gray-800">
              <MenubarItem className="text-gray-800" data-testid="menu-edit-undo">Undo</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-edit-redo">Redo</MenubarItem>
              <MenubarSeparator />
              <MenubarItem className="text-gray-800" data-testid="menu-edit-cut">Cut</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-edit-copy">Copy</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-edit-paste">Paste</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="text-xs px-2 py-0.5 h-5 font-normal text-gray-800 data-[state=open]:bg-blue-600 data-[state=open]:text-white hover:bg-blue-600 hover:text-white" data-testid="menu-view">
              View
            </MenubarTrigger>
            <MenubarContent className="bg-white text-gray-800">
              <MenubarItem className="text-gray-800" data-testid="menu-view-zoom-in">Zoom In</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-view-zoom-out">Zoom Out</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-view-fit">Fit to Screen</MenubarItem>
              <MenubarSeparator />
              <MenubarItem className="text-gray-800" data-testid="menu-view-refresh">Refresh</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="text-xs px-2 py-0.5 h-5 font-normal text-gray-800 data-[state=open]:bg-blue-600 data-[state=open]:text-white hover:bg-blue-600 hover:text-white" data-testid="menu-chart">
              Chart
            </MenubarTrigger>
            <MenubarContent className="bg-white text-gray-800">
              <MenubarItem className="text-gray-800" data-testid="menu-chart-trend">Trend Chart</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-chart-bar">Bar Chart</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-chart-pie">Pie Chart</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="text-xs px-2 py-0.5 h-5 font-normal text-gray-800 data-[state=open]:bg-blue-600 data-[state=open]:text-white hover:bg-blue-600 hover:text-white" data-testid="menu-trend">
              Trend
            </MenubarTrigger>
            <MenubarContent className="bg-white text-gray-800">
              <MenubarItem className="text-gray-800" data-testid="menu-trend-new">New Trend</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-trend-historical">Historical</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-trend-realtime">Real-time</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="text-xs px-2 py-0.5 h-5 font-normal text-gray-800 data-[state=open]:bg-blue-600 data-[state=open]:text-white hover:bg-blue-600 hover:text-white" data-testid="menu-events">
              Events
            </MenubarTrigger>
            <MenubarContent className="bg-white text-gray-800">
              <MenubarItem className="text-gray-800" data-testid="menu-events-alarms">Alarms</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-events-journal">Event Journal</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-events-history">Event History</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="text-xs px-2 py-0.5 h-5 font-normal text-gray-800 data-[state=open]:bg-blue-600 data-[state=open]:text-white hover:bg-blue-600 hover:text-white" data-testid="menu-window">
              Window
            </MenubarTrigger>
            <MenubarContent className="bg-white text-gray-800">
              <MenubarItem className="text-gray-800" data-testid="menu-window-cascade">Cascade</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-window-tile">Tile</MenubarItem>
              <MenubarSeparator />
              <MenubarItem className="text-gray-800" data-testid="menu-window-close-all">Close All</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="text-xs px-2 py-0.5 h-5 font-normal text-gray-800 data-[state=open]:bg-blue-600 data-[state=open]:text-white hover:bg-blue-600 hover:text-white" data-testid="menu-help">
              Help
            </MenubarTrigger>
            <MenubarContent className="bg-white text-gray-800">
              <MenubarItem className="text-gray-800" data-testid="menu-help-contents">Help Contents</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-help-about">About DeltaV</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      {/* DeltaV Live Icon Toolbar */}
      <div className="flex-shrink-0 bg-gray-100 border-b border-gray-300 px-2 py-1 flex items-center justify-between">
        {/* Left side - Icon buttons */}
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={300}>
            {toolbarItems.map((item, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-200"
                  >
                    <item.icon className="h-5 w-5 text-blue-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-200"
                  asChild
                >
                  <Link href="/settings/controller-outputs/faceplates">
                    <Settings className="h-5 w-5 text-blue-600" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Back to Faceplates</p>
              </TooltipContent>
            </Tooltip>

            {/* Lock Button - screen-aware for L4, L2 vs other screens */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-200"
                  onClick={() => {
                    if (selectedScreen === "L4-Converter") {
                      setIsLockedL4(!isLockedL4);
                    } else if (selectedScreen === "L2 – Furnace Area") {
                      setIsLockedL2(!isLockedL2);
                    } else {
                      setIsLocked(!isLocked);
                    }
                  }}
                  data-testid="button-lock-toggle"
                >
                  {(selectedScreen === "L4-Converter" ? isLockedL4 : selectedScreen === "L2 – Furnace Area" ? isLockedL2 : isLocked) ? (
                    <Lock className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <LockOpen className="h-5 w-5 text-gray-500" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{(selectedScreen === "L4-Converter" ? isLockedL4 : selectedScreen === "L2 – Furnace Area" ? isLockedL2 : isLocked) ? "Unlock Icons" : "Lock Icons"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Save Button - screen-aware for L4 vs other screens */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-200"
                  onClick={() => {
                    if (selectedScreen === "L4-Converter") {
                      handleSaveL4Layout();
                    } else if (selectedScreen === "L2 – Furnace Area") {
                      handleSaveL2Layout();
                    } else {
                      handleSaveLayout();
                    }
                  }}
                  disabled={selectedScreen === "L4-Converter" ? isSavingL4 : selectedScreen === "L2 – Furnace Area" ? isSavingL2 : isSaving}
                  data-testid="button-save-layout"
                >
                  <Save className={`h-5 w-5 ${(selectedScreen === "L4-Converter" ? isSavingL4 : selectedScreen === "L2 – Furnace Area" ? isSavingL2 : isSaving) ? 'text-gray-400' : 'text-green-600'}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{(selectedScreen === "L4-Converter" ? isSavingL4 : selectedScreen === "L2 – Furnace Area" ? isSavingL2 : isSaving) ? "Saving..." : "Save Layout"}</p>
              </TooltipContent>
            </Tooltip>
            
          </TooltipProvider>
          
          {/* Add Shapes Dropdown - combines arrow and line tools */}
          <DropdownMenu>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-200"
                      disabled={selectedScreen === "L4-Converter" ? isLockedL4 : isLocked}
                      data-testid="dropdown-add-shapes"
                    >
                      <Shapes className="h-5 w-5 text-cyan-500" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Add Drawing Elements</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent className="bg-white z-50">
              <DropdownMenuItem 
                onClick={handleAddVerticalArrow}
                className="flex items-center gap-2 cursor-pointer"
                data-testid="dropdown-add-vertical-arrow"
              >
                <ArrowUp className="h-4 w-4 text-cyan-500" />
                <span>Add Vertical Arrow</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleAddVerticalLine}
                className="flex items-center gap-2 cursor-pointer"
                data-testid="dropdown-add-vertical-line"
              >
                <svg className="h-4 w-4 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
                <span>Add Vertical Line</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDeleteLastArrow}
                className="flex items-center gap-2 cursor-pointer text-red-600 hover:text-red-700"
                data-testid="dropdown-delete-last-arrow"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Last Arrow</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDeleteLastLine}
                className="flex items-center gap-2 cursor-pointer text-red-600 hover:text-red-700"
                data-testid="dropdown-delete-last-line"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Last Line</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="bg-gray-700 text-white hover:bg-gray-600 hover:text-white px-3 py-1 text-sm h-8"
                data-testid="dropdown-view"
              >
                View: {selectedScreen}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white z-50">
              {homescreenOptions.map((option) => (
                <DropdownMenuItem 
                  key={option.id}
                  onClick={() => setSelectedScreen(option.label)}
                  className={`${option.isReady ? "bg-teal-100 text-teal-800 border-l-2 border-teal-500" : "text-gray-800 bg-white"} ${selectedScreen === option.label ? "bg-gray-100" : ""}`}
                  data-testid={`dropdown-view-option-${option.id}`}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mode Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="bg-gray-700 text-white hover:bg-gray-600 hover:text-white px-3 py-1 text-sm h-8"
                data-testid="dropdown-mode"
              >
                Mode: {selectedMode}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white z-50">
              {modeOptions.map((option) => (
                <DropdownMenuItem 
                  key={option.id}
                  onClick={() => setSelectedMode(option.label)}
                  className={`text-gray-800 ${selectedMode === option.label ? "bg-gray-100" : ""}`}
                  data-testid={`dropdown-mode-option-${option.id}`}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* PFDs Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="bg-blue-600 border border-blue-600 text-white gap-2"
                data-testid="toolbar-pfd-dropdown"
              >
                <FileText className="h-4 w-4" />
                PFDs
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 max-h-[70vh] overflow-y-auto">
              <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
                PROCESS FLOW DIAGRAMS
              </div>
              <DropdownMenuSeparator />
              {pfdConfigs.map((pfd) => (
                <DropdownMenuItem key={pfd.id} asChild>
                  <Link
                    href={pfd.route}
                    data-testid={`toolbar-pfd-link-${pfd.id}`}
                  >
                    <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                    <div className="flex flex-col items-start min-w-0 gap-0">
                      <span className="text-[10px] text-muted-foreground font-mono truncate w-full leading-tight">
                        {pfd.documentNumber}
                      </span>
                      <span className="text-xs font-medium truncate w-full leading-tight">
                        {pfd.title}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="bg-blue-600 border border-blue-600 text-white gap-2"
                data-testid="toolbar-filter-view-dropdown"
              >
                <Filter className="h-4 w-4" />
                {instrumentFilter === 'all' ? 'All Inst. Blocks' : instrumentFilter === 'controllers' ? 'Controllers Only' : 'Sensors Only'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => setInstrumentFilter('all')}
                data-testid="filter-view-all"
              >
                All Inst. Blocks
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setInstrumentFilter('controllers')}
                data-testid="filter-view-controllers"
              >
                Controllers Only
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setInstrumentFilter('sensors')}
                data-testid="filter-view-sensors"
              >
                Sensors Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side - Date, Time, User, Window controls */}
        <div className="flex items-center gap-4">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm font-mono text-gray-700">
            <span>{formatDate(currentTime)}</span>
            <span>{formatTime(currentTime)}</span>
          </div>

          {/* User */}
          <div className="text-sm font-medium text-gray-700 bg-gray-200 px-2 py-1 rounded">
            LAC\OPERATOR
          </div>

          {/* Window controls */}
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-200"
                    onClick={handleToggleFullscreen}
                    data-testid="button-fullscreen-toggle"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-5 w-5 text-gray-600" />
                    ) : (
                      <Maximize2 className="h-5 w-5 text-gray-600" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-100"
                    asChild
                  >
                    <Link href="/">
                      <X className="h-5 w-5 text-red-600" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Exit to Landing</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Simulation Toolbar - visible in Dynamic, Start-Up, and Emergency modes */}
      {(selectedMode === "Dynamic" || selectedMode === "Start-Up" || selectedMode === "Emergency Scenarios") && (
        <div className="flex-shrink-0 bg-gray-800 border-b border-gray-600 px-3 py-2 flex flex-wrap items-center gap-6">
          {/* Reset Button */}
          <Button
            onClick={handleDynamicReset}
            variant="outline"
            size="sm"
            className="gap-2 border-gray-500 text-gray-200"
            data-testid="button-dynamic-reset"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>

          {/* Update Interval */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300 whitespace-nowrap">Update Interval:</span>
            <span className="text-xs text-white font-medium w-10">{dynamicDt.toFixed(2)} s</span>
            <Slider
              min={0.01}
              max={0.5}
              step={0.01}
              value={[dynamicDt]}
              onValueChange={([value]) => setDynamicDt(value)}
              className="w-24"
              data-testid="slider-dynamic-dt"
            />
          </div>

          {/* Simulation Speed */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300 whitespace-nowrap">Simulation Speed:</span>
            <span className="text-xs text-white font-medium w-10">{dynamicSpeed.toFixed(1)}x</span>
            <Slider
              min={0.1}
              max={20}
              step={0.1}
              value={[dynamicSpeed]}
              onValueChange={([value]) => setDynamicSpeed(value)}
              className="w-24"
              data-testid="slider-dynamic-speed"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300">Status</span>
            <span className={`text-sm font-semibold ${dynamicRunning ? 'text-green-400' : 'text-gray-400'}`} data-testid="text-dynamic-status">
              {dynamicRunning ? "Running" : "Stopped"}
            </span>
          </div>

          {/* Elapsed Time */}
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400">Elapsed:</span>
            <span className="text-xs text-white font-mono" data-testid="text-dynamic-elapsed">
              {(dynamicElapsed / 60).toFixed(3)} min
            </span>
          </div>
        </div>
      )}

      {/* Main content area - scrollable container */}
      <div className="flex-1 overflow-auto">
        {/* L4-Converter View - Canvas with Converter 4 */}
        {selectedScreen === "L4-Converter" && (
          <div className="relative bg-gray-50" style={{ width: '3680px', height: '2260px', minWidth: '3680px', minHeight: '2260px' }}>
            {/* Converter 4 Graphic */}
            <Rnd
              key="converter4-l4"
              position={converter4L4Position}
              size={converter4L4Size}
              onDragStop={(e, d) => {
                setConverter4L4Position({ x: d.x, y: d.y });
                setIsL4Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setConverter4L4Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setConverter4L4Position(position);
                setIsL4Dirty(true);
              }}
              minWidth={100}
              minHeight={200}
              bounds="parent"
              disableDragging={isLockedL4}
              enableResizing={!isLockedL4}
              className={isLockedL4 ? "cursor-pointer" : "cursor-move"}
              style={{ zIndex: 1 }}
            >
              <div 
                className={`w-full h-full ${isLockedL4 ? 'cursor-pointer' : ''}`}
                onClick={isLockedL4 ? () => setShowSecondaryConverter4L4(true) : undefined}
                data-testid="converter4-l4-clickable"
              >
                <img 
                  src={converter4L4Img} 
                  alt="Converter 4" 
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </div>
            </Rnd>

            {/* 1540-TI-4825 Primary Faceplate (Pass 1 Catalyst In) */}
            <Rnd
              key="faceplate4825-l4"
              position={faceplate4825L4Position}
              size={faceplate4825L4Size}
              onDragStop={(e, d) => {
                setFaceplate4825L4Position({ x: d.x, y: d.y });
                setIsL4Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setFaceplate4825L4Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setFaceplate4825L4Position(position);
                setIsL4Dirty(true);
              }}
              minWidth={120}
              minHeight={180}
              bounds="parent"
              disableDragging={isLockedL4}
              enableResizing={!isLockedL4}
              className={isLockedL4 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 20, visibility: sensorVisible ? 'visible' : 'hidden' }}
            >
              <div 
                className="flex flex-col items-center gap-1 w-full h-full cursor-pointer" 
                data-testid="faceplate-4825-l4-container"
                onClick={isLockedL4 ? () => setShowSecondaryConverter4L4(true) : undefined}
              >
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">1540-TI-4825</span>
                <TempSensorPrimaryFaceplate 
                  data={{
                    ...defaultControllerData,
                    instrumentTag: tempSensor4825Config.TAGNAME || '1540-TI-4825',
                    description: tempSensor4825Config.DESC || 'Pass 1 Catalyst In',
                    pvUnits: tempSensor4825Config.EU || 'F',
                    pvRangeMin: tempSensor4825Config.SP_LIM_LO ?? 0,
                    pvRangeMax: tempSensor4825Config.SP_LIM_HI ?? 2000,
                    pv: tempSensor4825SyncState.syncedPV,
                    sp: tempSensor4825SyncState.syncedSP,
                    out: tempSensor4825SyncState.syncedOUT,
                  }}
                  isTransparent={tempSensor4825Config.TRANSPARENT_BG ?? false}
                />
              </div>
            </Rnd>

            {/* Jug Valve Hand Controller 1540-H-4282 for L4-Converter */}
            <Rnd
              key="jug-valve-hc-l4"
              position={jugValveHandControllerL4Position}
              size={jugValveHandControllerL4Size}
              onDragStop={(e, d) => {
                setJugValveHandControllerL4Position({ x: d.x, y: d.y });
                setIsL4Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setJugValveHandControllerL4Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setJugValveHandControllerL4Position(position);
                setIsL4Dirty(true);
              }}
              minWidth={100}
              minHeight={90}
              bounds="parent"
              disableDragging={isLockedL4}
              enableResizing={!isLockedL4}
              className={isLockedL4 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 20, visibility: controllerVisible ? 'visible' : 'hidden' }}
              data-testid="jug-valve-hc-l4-rnd"
            >
              <div 
                className={`w-full h-full flex items-center justify-center overflow-hidden ${isLockedL4 ? 'cursor-pointer' : ''}`}
                onClick={handleJugValveHandControllerClick}
                style={{
                  transform: `scale(${Math.min(jugValveHandControllerL4Size.width / 220, jugValveHandControllerL4Size.height / 200)})`,
                  transformOrigin: 'center center'
                }}
              >
                <ControllerFaceplate 
                  data={jugValveHandControllerData}
                  isTransparent={true}
                  controllerId="1540-H-4282"
                />
              </div>
            </Rnd>

            {/* Render vertical arrows for L4-Converter */}
            {verticalArrows.filter(va => va.screen === 'L4-Converter').map((vArrow) => (
              <Rnd
                key={`${vArrow.id}-${vArrow.rotation}`}
                position={{ x: vArrow.x, y: vArrow.y }}
                size={{ width: vArrow.rotation % 180 === 0 ? vArrow.width : vArrow.height, height: vArrow.rotation % 180 === 0 ? vArrow.height : vArrow.width }}
                onDragStop={(e, d) => {
                  setVerticalArrows(prev => prev.map(va => 
                    va.id === vArrow.id ? { ...va, x: d.x, y: d.y } : va
                  ));
                }}
                onResizeStop={(e, dir, ref, delta, position) => {
                  const isHorizontal = vArrow.rotation % 180 !== 0;
                  setVerticalArrows(prev => prev.map(va => 
                    va.id === vArrow.id 
                      ? { 
                          ...va, 
                          height: isHorizontal ? parseInt(ref.style.width) : parseInt(ref.style.height), 
                          x: position.x, 
                          y: position.y 
                        }
                      : va
                  ));
                }}
                minWidth={vArrow.rotation % 180 === 0 ? 24 : 50}
                minHeight={vArrow.rotation % 180 === 0 ? 50 : 24}
                maxWidth={vArrow.rotation % 180 === 0 ? 24 : undefined}
                maxHeight={vArrow.rotation % 180 === 0 ? undefined : 24}
                bounds="parent"
                disableDragging={isLockedL4}
                enableResizing={!isLockedL4 ? { 
                  top: vArrow.rotation % 180 === 0, 
                  bottom: vArrow.rotation % 180 === 0, 
                  left: vArrow.rotation % 180 !== 0, 
                  right: vArrow.rotation % 180 !== 0,
                  topLeft: false, topRight: false, bottomLeft: false, bottomRight: false
                } : false}
                className={`${isLockedL4 ? "cursor-default" : "cursor-move"} group`}
                style={{ zIndex: 35 }}
              >
                <div className="relative w-full h-full">
                  <div 
                    style={{ 
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${vArrow.rotation}deg)`,
                      width: vArrow.rotation % 180 === 0 ? '100%' : vArrow.height,
                      height: vArrow.rotation % 180 === 0 ? '100%' : vArrow.width,
                    }}
                  >
                    <VerticalArrow width={vArrow.width} height={vArrow.height} color="#53B1D8" />
                  </div>
                  {!isLockedL4 && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                                    flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                      <button
                        className="w-6 h-6 rounded-full bg-blue-500/80 hover:bg-blue-600 
                                   flex items-center justify-center shadow-lg"
                        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleRotateVerticalArrow(vArrow.id); }}
                        title={`Rotate 90° (current: ${vArrow.rotation}°)`}
                      >
                        <RotateCw className="w-3 h-3 text-white" />
                      </button>
                      <button
                        className="w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-600 
                                   flex items-center justify-center shadow-lg"
                        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteVerticalArrow(vArrow.id); }}
                        title="Delete arrow"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </Rnd>
            ))}

            {/* Render vertical lines for L4-Converter */}
            {verticalLines.filter(vl => vl.screen === 'L4-Converter').map((vLine) => (
              <Rnd
                key={vLine.id}
                position={{ x: vLine.x, y: vLine.y }}
                size={{ width: vLine.width, height: vLine.height }}
                onDragStop={(e, d) => {
                  setVerticalLines(prev => prev.map(vl => 
                    vl.id === vLine.id ? { ...vl, x: d.x, y: d.y } : vl
                  ));
                }}
                onResizeStop={(e, dir, ref, delta, position) => {
                  setVerticalLines(prev => prev.map(vl => 
                    vl.id === vLine.id 
                      ? { ...vl, height: parseInt(ref.style.height), x: position.x, y: position.y }
                      : vl
                  ));
                }}
                minWidth={24}
                minHeight={50}
                maxWidth={24}
                bounds="parent"
                disableDragging={isLockedL4}
                enableResizing={!isLockedL4 ? { 
                  top: true, bottom: true, left: false, right: false,
                  topLeft: false, topRight: false, bottomLeft: false, bottomRight: false
                } : false}
                className={`${isLockedL4 ? "cursor-default" : "cursor-move"} group`}
                style={{ zIndex: 35 }}
              >
                <div className="relative w-full h-full">
                  <VerticalLine width={vLine.width} height={vLine.height} color="#53B1D8" />
                  {!isLockedL4 && (
                    <button
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                                 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-600 
                                 flex items-center justify-center shadow-lg 
                                 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                      onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteVerticalLine(vLine.id); }}
                      title="Delete line"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
              </Rnd>
            ))}

            {orchestratorResult?.kpp && (
              <Rnd
                key="kpp-faceplate-l4"
                data-testid="rnd-kpp-faceplate-l4"
                position={kppFaceplateL4Position}
                size={kppFaceplateL4Size}
                onDragStop={(e, d) => {
                  setKppFaceplateL4Position({ x: d.x, y: d.y });
                  setIsL4Dirty(true);
                }}
                onResizeStop={(e, dir, ref, delta, position) => {
                  setKppFaceplateL4Size({
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height)
                  });
                  setKppFaceplateL4Position(position);
                  setIsL4Dirty(true);
                }}
                minWidth={200}
                minHeight={200}
                bounds="parent"
                disableDragging={isLockedL4}
                enableResizing={!isLockedL4}
                resizeHandleStyles={!isLockedL4 ? resizeHandleStyles : undefined}
                className={isLockedL4 ? "cursor-default" : "cursor-move"}
                style={{ zIndex: 50 }}
              >
                <div className="w-full h-full" data-testid="l4-kpp-faceplate">
                <KPPFaceplate className="w-full h-full" data={(() => {
                  const kpp = orchestratorResult.kpp;
                  const s24 = orchestratorResult.streams?.["24"];
                  const stpd = kpp.H2SO4_production_STPD;
                  const so2TailScfm = s24?.SO2 ?? 0;
                  const so2LbDay = (so2TailScfm / 5.984) * 64.064 * 24;
                  const emissionsLbPerST = stpd > 0 ? so2LbDay / stpd : null;
                  const o2Pct = s24 ? (s24.O2 / Math.max(s24.TOTAL, 1e-9)) * 100 : null;
                  const steamSTPD = stpd != null ? stpd * 1.3 : null;
                  const grossMW = stpd != null ? (stpd / 24 * 1.3 * 243) / 1000 : null;
                  return {
                    plantRate: stpd,
                    conversion: kpp.overall_SO2_conversion_pct,
                    pass1Strength: orchestratorResult.sensor_tags?.["1540-AI-4825"] ?? (() => {
                      const s9 = orchestratorResult.streams?.["9"];
                      return s9 ? (s9.SO2 / Math.max(s9.TOTAL, 1e-9)) * 100 : null;
                    })(),
                    o2TailGas: o2Pct,
                    emissionsPpmv: kpp.SO2_ppm_stack ?? null,
                    emissions: emissionsLbPerST,
                    steamGen: steamSTPD != null ? Math.round(steamSTPD) : null,
                    grossPowerMW: grossMW,
                    powerRatio: 243,
                  };
                })()} />
                </div>
              </Rnd>
            )}

            {/* Temperature Sensor 1540-TI-4820 (Pass 1 Duct) for L4 */}
            <Rnd
              key="temp-sensor-4820-l4"
              position={tempSensor4820L4Position}
              size={tempSensor4820L4Size}
              onDragStop={(e, d) => {
                setTempSensor4820L4Position({ x: d.x, y: d.y });
                setIsL4Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setTempSensor4820L4Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setTempSensor4820L4Position(position);
                setIsL4Dirty(true);
              }}
              minWidth={120}
              minHeight={80}
              bounds="parent"
              disableDragging={isLockedL4}
              enableResizing={!isLockedL4}
              resizeHandleStyles={!isLockedL4 ? resizeHandleStyles : undefined}
              className={isLockedL4 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 40, visibility: sensorVisible ? 'visible' : 'hidden' }}
            >
              <div
                className={`w-full h-full flex items-center justify-center overflow-hidden ${isLockedL4 ? 'cursor-pointer' : ''}`}
                onClick={() => { if (isLockedL4) setIsTempSensor4820ModalOpen(true); }}
                data-testid="faceplate-4820-l4-container"
                style={{
                  transform: `scale(${Math.min(tempSensor4820L4Size.width / 180, tempSensor4820L4Size.height / 120)})`,
                  transformOrigin: 'center center'
                }}
              >
                <TempSensorPrimaryFaceplate
                  data={tempSensor4820Data}
                  isTransparent={true}
                />
              </div>
            </Rnd>

            {/* Secondary Faceplate Dialog for 1540-TI-4825 on L4-Converter */}
            <Dialog open={showSecondaryConverter4L4} onOpenChange={setShowSecondaryConverter4L4} modal={false}>
              <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
                <VisuallyHidden>
                  <DialogTitle>1540-TI-4825 Pass 1 Catalyst Temperature</DialogTitle>
                </VisuallyHidden>
                <TempSensorSecondaryFaceplate
                  data={tempSensor4825SecondaryData}
                  config={tempSensor4825SecondaryConfig}
                  sensorId="1540-TI-4825"
                  onClose={() => setShowSecondaryConverter4L4(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* L2 - Furnace Area View - Canvas with equipment */}
        {selectedScreen === "L2 – Furnace Area" && (
          <div className="relative bg-white" style={{ width: '3680px', height: '1130px', minWidth: '3680px', minHeight: '1130px' }}>

            {/* Render vertical arrows for L2-Furnace Area */}
            {verticalArrows.filter(va => va.screen === 'L2 – Furnace Area').map((vArrow) => (
              <Rnd
                key={`${vArrow.id}-${vArrow.rotation}`}
                position={{ x: vArrow.x, y: vArrow.y }}
                size={{ width: vArrow.rotation % 180 === 0 ? vArrow.width : vArrow.height, height: vArrow.rotation % 180 === 0 ? vArrow.height : vArrow.width }}
                onDragStop={(e, d) => {
                  setVerticalArrows(prev => prev.map(va => 
                    va.id === vArrow.id ? { ...va, x: d.x, y: d.y } : va
                  ));
                  setIsL2Dirty(true);
                }}
                onResizeStop={(e, dir, ref, delta, position) => {
                  const isHorizontal = vArrow.rotation % 180 !== 0;
                  setVerticalArrows(prev => prev.map(va => 
                    va.id === vArrow.id 
                      ? { 
                          ...va, 
                          height: isHorizontal ? parseInt(ref.style.width) : parseInt(ref.style.height), 
                          x: position.x, 
                          y: position.y 
                        }
                      : va
                  ));
                  setIsL2Dirty(true);
                }}
                minWidth={vArrow.rotation % 180 === 0 ? 24 : 50}
                minHeight={vArrow.rotation % 180 === 0 ? 50 : 24}
                maxWidth={vArrow.rotation % 180 === 0 ? 24 : undefined}
                maxHeight={vArrow.rotation % 180 === 0 ? undefined : 24}
                bounds="parent"
                disableDragging={isLockedL2}
                enableResizing={!isLockedL2 ? { 
                  top: vArrow.rotation % 180 === 0, 
                  bottom: vArrow.rotation % 180 === 0, 
                  left: vArrow.rotation % 180 !== 0, 
                  right: vArrow.rotation % 180 !== 0,
                  topLeft: false, topRight: false, bottomLeft: false, bottomRight: false
                } : false}
                className={`${isLockedL2 ? "cursor-default" : "cursor-move"} group`}
                style={{ zIndex: 35 }}
              >
                <div className="relative w-full h-full">
                  <div 
                    style={{ 
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${vArrow.rotation}deg)`,
                      width: vArrow.rotation % 180 === 0 ? '100%' : vArrow.height,
                      height: vArrow.rotation % 180 === 0 ? '100%' : vArrow.width,
                    }}
                  >
                    <VerticalArrow width={vArrow.width} height={vArrow.height} color="#53B1D8" />
                  </div>
                  {!isLockedL2 && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                                    flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                      <button
                        className="w-6 h-6 rounded-full bg-blue-500/80 hover:bg-blue-600 
                                   flex items-center justify-center shadow-lg"
                        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleRotateVerticalArrow(vArrow.id); }}
                        title={`Rotate 90° (current: ${vArrow.rotation}°)`}
                      >
                        <RotateCw className="w-3 h-3 text-white" />
                      </button>
                      <button
                        className="w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-600 
                                   flex items-center justify-center shadow-lg"
                        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteVerticalArrow(vArrow.id); }}
                        title="Delete arrow"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </Rnd>
            ))}

            {/* Render vertical lines for L2-Furnace Area */}
            {verticalLines.filter(vl => vl.screen === 'L2 – Furnace Area').map((vLine) => (
              <Rnd
                key={vLine.id}
                position={{ x: vLine.x, y: vLine.y }}
                size={{ width: vLine.width, height: vLine.height }}
                onDragStop={(e, d) => {
                  setVerticalLines(prev => prev.map(vl => 
                    vl.id === vLine.id ? { ...vl, x: d.x, y: d.y } : vl
                  ));
                  setIsL2Dirty(true);
                }}
                onResizeStop={(e, dir, ref, delta, position) => {
                  setVerticalLines(prev => prev.map(vl => 
                    vl.id === vLine.id 
                      ? { ...vl, height: parseInt(ref.style.height), x: position.x, y: position.y }
                      : vl
                  ));
                  setIsL2Dirty(true);
                }}
                minWidth={24}
                minHeight={50}
                maxWidth={24}
                bounds="parent"
                disableDragging={isLockedL2}
                enableResizing={!isLockedL2 ? { 
                  top: true, bottom: true, left: false, right: false,
                  topLeft: false, topRight: false, bottomLeft: false, bottomRight: false
                } : false}
                className={`${isLockedL2 ? "cursor-default" : "cursor-move"} group`}
                style={{ zIndex: 35 }}
              >
                <div className="relative w-full h-full">
                  <VerticalLine width={vLine.width} height={vLine.height} color="#53B1D8" />
                  {!isLockedL2 && (
                    <button
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                                 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-600 
                                 flex items-center justify-center shadow-lg 
                                 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                      onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteVerticalLine(vLine.id); }}
                      title="Delete line"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
              </Rnd>
            ))}

            {/* Hand Controller 1540-H-4030 Faceplate for L2 */}
            <Rnd
              key="hand-controller-l2"
              position={handControllerL2Position}
              size={handControllerL2Size}
              onDragStop={(e, d) => {
                setHandControllerL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setHandControllerL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setHandControllerL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={100}
              minHeight={90}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 20, visibility: controllerVisible ? 'visible' : 'hidden' }}
            >
              <div 
                className={`w-full h-full flex items-center justify-center overflow-hidden ${isLockedL2 ? 'cursor-pointer' : ''}`}
                onClick={handleHandControllerClick}
                style={{
                  transform: `scale(${Math.min(handControllerL2Size.width / 220, handControllerL2Size.height / 200)})`,
                  transformOrigin: 'center center'
                }}
              >
                <ControllerFaceplate 
                  data={handControllerData}
                  isTransparent={true}
                  controllerId="1540-H-4030"
                />
              </div>
            </Rnd>

            {/* VFD-001 Variable Frequency Drive for L2 */}
            <Rnd
              key="vfd-l2"
              position={vfdL2Position}
              size={vfdL2Size}
              onDragStop={(e, d) => {
                setVfdL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setVfdL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setVfdL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={120}
              minHeight={120}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 20, visibility: controllerVisible ? 'visible' : 'hidden' }}
            >
              <div 
                className={`w-full h-full flex items-center justify-center overflow-hidden ${isLockedL2 ? 'cursor-pointer' : ''}`}
                onClick={handleCompressorClick}
                style={{
                  transform: `scale(${Math.min(vfdL2Size.width / 100, vfdL2Size.height / 100)})`,
                  transformOrigin: 'center center'
                }}
              >
                <PrimaryCompressorFaceplate 
                  data={compressorData} 
                  transparentBackground={vfdConfig?.transparentBackground ?? true}
                  configTagName={vfdConfig?.tagName}
                  configDescription={vfdConfig?.description}
                  configUnit={vfdConfig?.unit}
                />
              </div>
            </Rnd>

            {/* Sulfur Flow Controller 1530-F-2602 for L2 */}
            <Rnd
              key="sulfur-flow-l2"
              position={sulfurFlowL2Position}
              size={sulfurFlowL2Size}
              onDragStop={(e, d) => {
                setSulfurFlowL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setSulfurFlowL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setSulfurFlowL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={100}
              minHeight={90}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 20, visibility: controllerVisible ? 'visible' : 'hidden' }}
            >
              <div 
                className={`w-full h-full flex items-center justify-center overflow-hidden ${isLockedL2 ? 'cursor-pointer' : ''}`}
                onClick={handleSulfurFlowClick}
                style={{
                  transform: `scale(${Math.min(sulfurFlowL2Size.width / 220, sulfurFlowL2Size.height / 200)})`,
                  transformOrigin: 'center center'
                }}
              >
                <ControllerFaceplate 
                  data={sulfurFlowData}
                  isTransparent={true}
                  controllerId="1530-F-2602"
                  showAlarmLimits={false}
                />
              </div>
            </Rnd>

            {/* Sulfur Flow Control Valve 1540-FCV-2602 for L2 */}
            <Rnd
              key="sulfur-valve-l2"
              position={sulfurValveL2Position}
              size={sulfurValveL2Size}
              onDragStop={(e, d) => {
                setSulfurValveL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setSulfurValveL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setSulfurValveL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={80}
              minHeight={100}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 20, visibility: controllerVisible ? 'visible' : 'hidden' }}
            >
              <div 
                className={`w-full h-full flex items-center justify-center overflow-hidden ${isLockedL2 ? 'cursor-pointer' : ''}`}
                onClick={isLockedL2 ? handleSulfurValveL2Click : undefined}
                style={{
                  transform: `scale(${Math.min(sulfurValveL2Size.width / 100, sulfurValveL2Size.height / 140)})`,
                  transformOrigin: 'center center'
                }}
              >
                <ValveFaceplate 
                  data={sulfurValveData}
                  isTransparent={true}
                />
              </div>
            </Rnd>

            {/* Jug Valve Hand Controller 1540-H-4282 for L2 */}
            <Rnd
              key="jug-valve-hc-l2"
              position={jugValveHandControllerL2Position}
              size={jugValveHandControllerL2Size}
              onDragStop={(e, d) => {
                setJugValveHandControllerL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setJugValveHandControllerL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setJugValveHandControllerL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={100}
              minHeight={90}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 20, visibility: controllerVisible ? 'visible' : 'hidden' }}
            >
              <div 
                className={`w-full h-full flex items-center justify-center overflow-hidden ${isLockedL2 ? 'cursor-pointer' : ''}`}
                onClick={handleJugValveHandControllerClick}
                style={{
                  transform: `scale(${Math.min(jugValveHandControllerL2Size.width / 220, jugValveHandControllerL2Size.height / 200)})`,
                  transformOrigin: 'center center'
                }}
              >
                <ControllerFaceplate 
                  data={jugValveHandControllerData}
                  isTransparent={true}
                  controllerId="1540-H-4282"
                />
              </div>
            </Rnd>

            {/* Jug Valve HCV 1540-HCV-4282 for L2 */}
            <Rnd
              key="jug-valve-hcv-l2"
              position={jugValveHcvL2Position}
              size={jugValveHcvL2Size}
              onDragStop={(e, d) => {
                setJugValveHcvL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setJugValveHcvL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setJugValveHcvL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={80}
              minHeight={100}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 20, visibility: controllerVisible ? 'visible' : 'hidden' }}
            >
              <div 
                className={`w-full h-full flex items-center justify-center overflow-hidden ${isLockedL2 ? 'cursor-pointer' : ''}`}
                onClick={isLockedL2 ? handleJugValveClick : undefined}
                style={{
                  transform: `scale(${Math.min(jugValveHcvL2Size.width / 100, jugValveHcvL2Size.height / 140)})`,
                  transformOrigin: 'center center'
                }}
              >
                <ValveFaceplate 
                  data={jugValveData}
                  isTransparent={true}
                  valveImageSrc={jugValveImage}
                />
              </div>
            </Rnd>

            {/* Waste Heat Boiler 1540-HX-001 Image for L2 */}
            <Rnd
              key="waste-heat-boiler-l2"
              data-testid="rnd-waste-heat-boiler-l2"
              position={wasteHeatBoilerL2Position}
              size={wasteHeatBoilerL2Size}
              onDragStop={(e, d) => {
                setWasteHeatBoilerL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setWasteHeatBoilerL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setWasteHeatBoilerL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={150}
              minHeight={100}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 30 }}
            >
              <img 
                src={wasteHeatBoilerImg} 
                alt="Waste Heat Boiler 1540-HX-001" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-waste-heat-boiler-l2"
              />
            </Rnd>

            {/* Yellow Horizontal Arrow Image for L2 */}
            <Rnd
              key="yellow-horiz-arrow-l2"
              data-testid="rnd-yellow-horiz-arrow-l2"
              position={yellowHorizArrowL2Position}
              size={yellowHorizArrowL2Size}
              onDragStop={(e, d) => {
                setYellowHorizArrowL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setYellowHorizArrowL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setYellowHorizArrowL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={100}
              minHeight={20}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={yellowHorizArrowImg} 
                alt="Yellow Horizontal Arrow" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-yellow-horiz-arrow-l2"
              />
            </Rnd>

            {/* Cyan Long Arrow Image for L2 */}
            <Rnd
              key="cyan-long-arrow-l2"
              data-testid="rnd-cyan-long-arrow-l2"
              position={cyanLongArrowL2Position}
              size={cyanLongArrowL2Size}
              onDragStop={(e, d) => {
                setCyanLongArrowL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setCyanLongArrowL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setCyanLongArrowL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={50}
              minHeight={10}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={cyanLongArrowImg} 
                alt="Cyan Long Arrow" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-cyan-long-arrow-l2"
              />
            </Rnd>

            {/* Cyan Up Arrow Image for L2 */}
            <Rnd
              key="cyan-up-arrow-l2"
              data-testid="rnd-cyan-up-arrow-l2"
              position={cyanUpArrowL2Position}
              size={cyanUpArrowL2Size}
              onDragStop={(e, d) => {
                setCyanUpArrowL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setCyanUpArrowL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setCyanUpArrowL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={10}
              minHeight={50}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={cyanUpArrowImg} 
                alt="Cyan Up Arrow" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-cyan-up-arrow-l2"
              />
            </Rnd>

            {/* Cyan Left Arrow Image for L2 */}
            <Rnd
              key="cyan-left-arrow-l2"
              data-testid="rnd-cyan-left-arrow-l2"
              position={cyanLeftArrowL2Position}
              size={cyanLeftArrowL2Size}
              onDragStop={(e, d) => {
                setCyanLeftArrowL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setCyanLeftArrowL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setCyanLeftArrowL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={20}
              minHeight={10}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={cyanLeftArrowImg} 
                alt="Cyan Left Arrow" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-cyan-left-arrow-l2"
              />
            </Rnd>

            {/* Cyan Long Left Arrow Image for L2 */}
            <Rnd
              key="cyan-long-left-arrow-l2"
              data-testid="rnd-cyan-long-left-arrow-l2"
              position={cyanLongLeftArrowL2Position}
              size={cyanLongLeftArrowL2Size}
              onDragStop={(e, d) => {
                setCyanLongLeftArrowL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setCyanLongLeftArrowL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setCyanLongLeftArrowL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={50}
              minHeight={10}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={cyanLongLeftArrowImg} 
                alt="Cyan Long Left Arrow" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-cyan-long-left-arrow-l2"
              />
            </Rnd>

            {/* Cyan Up Arrow 2 Image for L2 */}
            <Rnd
              key="cyan-up-arrow-2-l2"
              data-testid="rnd-cyan-up-arrow-2-l2"
              position={cyanUpArrow2L2Position}
              size={cyanUpArrow2L2Size}
              onDragStop={(e, d) => {
                setCyanUpArrow2L2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setCyanUpArrow2L2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setCyanUpArrow2L2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={10}
              minHeight={50}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={cyanUpArrow2Img} 
                alt="Cyan Up Arrow 2" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-cyan-up-arrow-2-l2"
              />
            </Rnd>

            {/* Cyan Up Arrow 3 Image for L2 */}
            <Rnd
              key="cyan-up-arrow-3-l2"
              data-testid="rnd-cyan-up-arrow-3-l2"
              position={cyanUpArrow3L2Position}
              size={cyanUpArrow3L2Size}
              onDragStop={(e, d) => {
                setCyanUpArrow3L2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setCyanUpArrow3L2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setCyanUpArrow3L2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={10}
              minHeight={50}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={cyanUpArrow3Img} 
                alt="Cyan Up Arrow 3" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-cyan-up-arrow-3-l2"
              />
            </Rnd>

            {/* Cyan Down Arrow Image for L2 */}
            <Rnd
              key="cyan-down-arrow-l2"
              data-testid="rnd-cyan-down-arrow-l2"
              position={cyanDownArrowL2Position}
              size={cyanDownArrowL2Size}
              onDragStop={(e, d) => {
                setCyanDownArrowL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setCyanDownArrowL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setCyanDownArrowL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={10}
              minHeight={50}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={cyanDownArrowImg} 
                alt="Cyan Down Arrow" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-cyan-down-arrow-l2"
              />
            </Rnd>

            {/* Metal Tank Image for L2 */}
            <Rnd
              key="metal-tank-l2"
              data-testid="rnd-metal-tank-l2"
              position={metalTankL2Position}
              size={metalTankL2Size}
              onDragStop={(e, d) => {
                setMetalTankL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setMetalTankL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setMetalTankL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={100}
              minHeight={60}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 30 }}
            >
              <div 
                className={`w-full h-full relative ${isLockedL2 ? 'cursor-pointer' : ''}`}
                onClick={handleFurnaceClick}
              >
                <img 
                  src={metalTankImg} 
                  alt="Metal Tank" 
                  className="w-full h-full object-contain"
                  draggable={false}
                  data-testid="img-metal-tank-l2"
                  style={furnaceAlarmHH ? { filter: 'brightness(0.5) sepia(1) saturate(10) hue-rotate(-10deg)' } : undefined}
                />
                {furnaceAlarmHH && (
                  <div
                    className="absolute inset-0 bg-red-600/30 animate-pulse pointer-events-none rounded"
                    data-testid="overlay-furnace-alarm"
                  />
                )}
              </div>
            </Rnd>

            {/* Gray Yellow Arrow Image for L2 */}
            <Rnd
              key="gray-yellow-arrow-l2"
              data-testid="rnd-gray-yellow-arrow-l2"
              position={grayYellowArrowL2Position}
              size={grayYellowArrowL2Size}
              onDragStop={(e, d) => {
                setGrayYellowArrowL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setGrayYellowArrowL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setGrayYellowArrowL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={100}
              minHeight={20}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={grayYellowArrowImg} 
                alt="Gray Yellow Arrow" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-gray-yellow-arrow-l2"
              />
            </Rnd>

            {/* Cyan Horizontal Arrow 2 Image for L2 */}
            <Rnd
              key="cyan-horiz-arrow-2-l2"
              data-testid="rnd-cyan-horiz-arrow-2-l2"
              position={cyanHorizArrow2L2Position}
              size={cyanHorizArrow2L2Size}
              onDragStop={(e, d) => {
                setCyanHorizArrow2L2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setCyanHorizArrow2L2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setCyanHorizArrow2L2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={50}
              minHeight={10}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={cyanHorizArrow2Img} 
                alt="Cyan Horizontal Arrow 2" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-cyan-horiz-arrow-2-l2"
              />
            </Rnd>

            {/* Gray Arrow with Cyan Line Image for L2 */}
            <Rnd
              key="gray-arrow-cyan-line-l2"
              data-testid="rnd-gray-arrow-cyan-line-l2"
              position={grayArrowCyanLineL2Position}
              size={grayArrowCyanLineL2Size}
              onDragStop={(e, d) => {
                setGrayArrowCyanLineL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setGrayArrowCyanLineL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setGrayArrowCyanLineL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={100}
              minHeight={20}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={grayArrowCyanLineImg} 
                alt="Gray Arrow with Cyan Line" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-gray-arrow-cyan-line-l2"
              />
            </Rnd>

            {/* Cyan Thin Line 1 Image for L2 */}
            <Rnd
              key="cyan-thin-line-1-l2"
              data-testid="rnd-cyan-thin-line-1-l2"
              position={cyanThinLine1L2Position}
              size={cyanThinLine1L2Size}
              onDragStop={(e, d) => {
                setCyanThinLine1L2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setCyanThinLine1L2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setCyanThinLine1L2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={50}
              minHeight={5}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={cyanThinLine1Img} 
                alt="Cyan Thin Line 1" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-cyan-thin-line-1-l2"
              />
            </Rnd>

            {/* Cyan Thin Line 2 Image for L2 */}
            <Rnd
              key="cyan-thin-line-2-l2"
              data-testid="rnd-cyan-thin-line-2-l2"
              position={cyanThinLine2L2Position}
              size={cyanThinLine2L2Size}
              onDragStop={(e, d) => {
                setCyanThinLine2L2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setCyanThinLine2L2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setCyanThinLine2L2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={50}
              minHeight={5}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={cyanThinLine2Img} 
                alt="Cyan Thin Line 2" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-cyan-thin-line-2-l2"
              />
            </Rnd>

            {/* Cyan Vertical Line 1 Image for L2 */}
            <Rnd
              key="cyan-vert-line-1-l2"
              data-testid="rnd-cyan-vert-line-1-l2"
              position={cyanVertLine1L2Position}
              size={cyanVertLine1L2Size}
              onDragStop={(e, d) => {
                setCyanVertLine1L2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setCyanVertLine1L2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setCyanVertLine1L2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={5}
              minHeight={50}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={cyanVertLine1Img} 
                alt="Cyan Vertical Line 1" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-cyan-vert-line-1-l2"
              />
            </Rnd>

            {/* Cyan Vertical Line 2 Image for L2 */}
            <Rnd
              key="cyan-vert-line-2-l2"
              data-testid="rnd-cyan-vert-line-2-l2"
              position={cyanVertLine2L2Position}
              size={cyanVertLine2L2Size}
              onDragStop={(e, d) => {
                setCyanVertLine2L2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setCyanVertLine2L2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setCyanVertLine2L2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={5}
              minHeight={50}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={cyanVertLine2Img} 
                alt="Cyan Vertical Line 2" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-cyan-vert-line-2-l2"
              />
            </Rnd>

            {/* Black Vertical Line Image for L2 */}
            <Rnd
              key="black-vert-line-l2"
              data-testid="rnd-black-vert-line-l2"
              position={blackVertLineL2Position}
              size={blackVertLineL2Size}
              onDragStop={(e, d) => {
                setBlackVertLineL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setBlackVertLineL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setBlackVertLineL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={5}
              minHeight={50}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 35 }}
            >
              <img 
                src={blackVertLineImg} 
                alt="Black Vertical Line" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-black-vert-line-l2"
              />
            </Rnd>

            {/* Furnace Area Orchestrator Outputs */}
            {orchestratorResult?.sensor_tags && (
              <Rnd
                key="process-data-panel-l2"
                data-testid="rnd-process-data-panel-l2"
                position={processDataPanelL2Position}
                size={processDataPanelL2Size}
                onDragStop={(e, d) => {
                  setProcessDataPanelL2Position({ x: d.x, y: d.y });
                  setIsL2Dirty(true);
                }}
                onResizeStop={(e, dir, ref, delta, position) => {
                  setProcessDataPanelL2Size({
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height)
                  });
                  setProcessDataPanelL2Position(position);
                  setIsL2Dirty(true);
                }}
                minWidth={280}
                minHeight={200}
                bounds="parent"
                disableDragging={isLockedL2}
                enableResizing={!isLockedL2}
                resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
                className={isLockedL2 ? "cursor-default" : "cursor-move"}
                style={{ zIndex: 50 }}
              >
              <div
                className="w-full h-full bg-gray-900/95 border border-gray-600 rounded-md p-3 overflow-auto"
                data-testid="furnace-orchestrator-outputs"
              >
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 border-b border-gray-600 pb-1">
                  Furnace Area — Process Data
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="text-gray-400">1540-TI-4010 Furnace T</div>
                  <div className="text-yellow-300 font-mono text-right" data-testid="value-furnace-temp">
                    {orchestratorResult.sensor_tags["1540-TI-4010"]?.toFixed(0) ?? "—"} °F
                  </div>
                  <div className="text-gray-400">1540-PI-4010 Furnace P</div>
                  <div className="text-yellow-300 font-mono text-right" data-testid="value-furnace-pressure">
                    {orchestratorResult.sensor_tags["1540-PI-4010"]?.toFixed(1) ?? "—"} inwc
                  </div>
                  <div className="text-gray-400">1540-TI-4021 WHB Mixed T</div>
                  <div className="text-yellow-300 font-mono text-right" data-testid="value-whb-mixed-temp">
                    {orchestratorResult.sensor_tags["1540-TI-4021"]?.toFixed(0) ?? "—"} °F
                  </div>
                  <div className="text-gray-400">1540-ZI-4020 Jug Valve</div>
                  <div className="text-yellow-300 font-mono text-right" data-testid="value-jug-valve-pos">
                    {orchestratorResult.sensor_tags["1540-ZI-4020"]?.toFixed(1) ?? "—"} %
                  </div>
                  <div className="text-gray-400">1530-FIC-2602 Sulfur Flow</div>
                  <div className="text-yellow-300 font-mono text-right" data-testid="value-sulfur-flow">
                    {orchestratorResult.sensor_tags["1530-FIC-2602"]?.toFixed(1) ?? "—"} gpm
                  </div>
                  <div className="text-gray-400">1540-FI-4030 Air Flow</div>
                  <div className="text-yellow-300 font-mono text-right" data-testid="value-air-flow">
                    {orchestratorResult.sensor_tags["1540-FI-4030"]?.toFixed(0) ?? "—"} scfm
                  </div>
                </div>
                {orchestratorResult.streams?.["5"] && (
                  <>
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mt-2 mb-1 border-t border-gray-600 pt-2">
                      Stream 5 — Furnace Outlet Gas
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="text-gray-400">SO2</div>
                      <div className="text-green-400 font-mono text-right" data-testid="value-s5-so2">
                        {orchestratorResult.streams["5"].SO2?.toFixed(1)} scfm
                      </div>
                      <div className="text-gray-400">SO3</div>
                      <div className="text-green-400 font-mono text-right" data-testid="value-s5-so3">
                        {orchestratorResult.streams["5"].SO3?.toFixed(1)} scfm
                      </div>
                      <div className="text-gray-400">O2</div>
                      <div className="text-green-400 font-mono text-right" data-testid="value-s5-o2">
                        {orchestratorResult.streams["5"].O2?.toFixed(1)} scfm
                      </div>
                      <div className="text-gray-400">N2</div>
                      <div className="text-green-400 font-mono text-right" data-testid="value-s5-n2">
                        {orchestratorResult.streams["5"].N2?.toFixed(0)} scfm
                      </div>
                    </div>
                  </>
                )}
              </div>
              </Rnd>
            )}

            {/* KPP Faceplate for L2 Furnace Area */}
            {orchestratorResult?.kpp && (
              <Rnd
                key="kpp-faceplate-l2"
                data-testid="rnd-kpp-faceplate-l2"
                position={kppFaceplateL2Position}
                size={kppFaceplateL2Size}
                onDragStop={(e, d) => {
                  setKppFaceplateL2Position({ x: d.x, y: d.y });
                  setIsL2Dirty(true);
                }}
                onResizeStop={(e, dir, ref, delta, position) => {
                  setKppFaceplateL2Size({
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height)
                  });
                  setKppFaceplateL2Position(position);
                  setIsL2Dirty(true);
                }}
                minWidth={200}
                minHeight={200}
                bounds="parent"
                disableDragging={isLockedL2}
                enableResizing={!isLockedL2}
                resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
                className={isLockedL2 ? "cursor-default" : "cursor-move"}
                style={{ zIndex: 50 }}
              >
                <div className="w-full h-full" data-testid="l2-kpp-faceplate">
                <KPPFaceplate className="w-full h-full" data={(() => {
                  const kpp = orchestratorResult.kpp;
                  const s24 = orchestratorResult.streams?.["24"];
                  const stpd = kpp.H2SO4_production_STPD;
                  const so2TailScfm = s24?.SO2 ?? 0;
                  const so2LbDay = (so2TailScfm / 5.984) * 64.064 * 24;
                  const emissionsLbPerST = stpd > 0 ? so2LbDay / stpd : null;
                  const o2Pct = s24 ? (s24.O2 / Math.max(s24.TOTAL, 1e-9)) * 100 : null;
                  const steamSTPD = stpd != null ? stpd * 1.3 : null;
                  const grossMW = stpd != null ? (stpd / 24 * 1.3 * 243) / 1000 : null;
                  return {
                    plantRate: stpd,
                    conversion: kpp.overall_SO2_conversion_pct,
                    pass1Strength: orchestratorResult.sensor_tags?.["1540-AI-4825"] ?? (() => {
                      const s9 = orchestratorResult.streams?.["9"];
                      return s9 ? (s9.SO2 / Math.max(s9.TOTAL, 1e-9)) * 100 : null;
                    })(),
                    o2TailGas: o2Pct,
                    emissionsPpmv: kpp.SO2_ppm_stack ?? null,
                    emissions: emissionsLbPerST,
                    steamGen: steamSTPD != null ? Math.round(steamSTPD) : null,
                    grossPowerMW: grossMW,
                    powerRatio: 243,
                  };
                })()} />
                </div>
              </Rnd>
            )}

            {/* Temperature Sensor 1540-TI-4200A Faceplate for L2 */}
            <Rnd
              key="temp-sensor-4200a-l2"
              data-testid="rnd-temp-sensor-4200a-l2"
              position={tempSensor4200AL2Position}
              size={tempSensor4200AL2Size}
              onDragStop={(e, d) => {
                setTempSensor4200AL2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setTempSensor4200AL2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setTempSensor4200AL2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={120}
              minHeight={80}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 40, visibility: sensorVisible ? 'visible' : 'hidden' }}
            >
              <div 
                className={`w-full h-full flex items-center justify-center overflow-hidden ${isLockedL2 ? 'cursor-pointer' : ''}`}
                onClick={handleTempSensor4200AClick}
                style={{
                  transform: `scale(${Math.min(tempSensor4200AL2Size.width / 180, tempSensor4200AL2Size.height / 120)})`,
                  transformOrigin: 'center center'
                }}
              >
                <TempSensorPrimaryFaceplate 
                  data={tempSensor4200AData}
                  isTransparent={true}
                />
              </div>
            </Rnd>

            {/* Temperature Sensor 1540-TI-4820 (Pass 1 Inlet Duct) for L2 */}
            <Rnd
              key="temp-sensor-4820-l2"
              position={tempSensor4820L2Position}
              size={tempSensor4820L2Size}
              onDragStop={(e, d) => {
                setTempSensor4820L2Position({ x: d.x, y: d.y });
                setIsL2Dirty(true);
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setTempSensor4820L2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setTempSensor4820L2Position(position);
                setIsL2Dirty(true);
              }}
              minWidth={120}
              minHeight={80}
              bounds="parent"
              disableDragging={isLockedL2}
              enableResizing={!isLockedL2}
              resizeHandleStyles={!isLockedL2 ? resizeHandleStyles : undefined}
              className={isLockedL2 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 40, visibility: sensorVisible ? 'visible' : 'hidden' }}
            >
              <div 
                className={`w-full h-full flex items-center justify-center overflow-hidden ${isLockedL2 ? 'cursor-pointer' : ''}`}
                onClick={handleTempSensor4820Click}
                data-testid="faceplate-4820-l2-container"
                style={{
                  transform: `scale(${Math.min(tempSensor4820L2Size.width / 180, tempSensor4820L2Size.height / 120)})`,
                  transformOrigin: 'center center'
                }}
              >
                <TempSensorPrimaryFaceplate 
                  data={tempSensor4820Data}
                  isTransparent={true}
                />
              </div>
            </Rnd>

          </div>
        )}

        {/* L3 - Compressor Area View - Blank Canvas */}
        {selectedScreen === "L3 – Compressor Area" && (
          <div className="relative bg-gray-50" style={{ width: '3680px', height: '1130px', minWidth: '3680px', minHeight: '1130px' }}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <p className="text-2xl font-semibold">L3 – Compressor Area</p>
                <p className="text-sm mt-2">Blank Canvas - Add equipment here</p>
              </div>
            </div>

            {/* Render vertical arrows for L3-Compressor Area */}
            {verticalArrows.filter(va => va.screen === 'L3 – Compressor Area').map((vArrow) => (
              <Rnd
                key={`${vArrow.id}-${vArrow.rotation}`}
                position={{ x: vArrow.x, y: vArrow.y }}
                size={{ width: vArrow.rotation % 180 === 0 ? vArrow.width : vArrow.height, height: vArrow.rotation % 180 === 0 ? vArrow.height : vArrow.width }}
                onDragStop={(e, d) => {
                  setVerticalArrows(prev => prev.map(va => 
                    va.id === vArrow.id ? { ...va, x: d.x, y: d.y } : va
                  ));
                }}
                onResizeStop={(e, dir, ref, delta, position) => {
                  const isHorizontal = vArrow.rotation % 180 !== 0;
                  setVerticalArrows(prev => prev.map(va => 
                    va.id === vArrow.id 
                      ? { 
                          ...va, 
                          height: isHorizontal ? parseInt(ref.style.width) : parseInt(ref.style.height), 
                          x: position.x, 
                          y: position.y 
                        }
                      : va
                  ));
                }}
                minWidth={vArrow.rotation % 180 === 0 ? 24 : 50}
                minHeight={vArrow.rotation % 180 === 0 ? 50 : 24}
                maxWidth={vArrow.rotation % 180 === 0 ? 24 : undefined}
                maxHeight={vArrow.rotation % 180 === 0 ? undefined : 24}
                bounds="parent"
                disableDragging={isLocked}
                enableResizing={!isLocked ? { 
                  top: vArrow.rotation % 180 === 0, 
                  bottom: vArrow.rotation % 180 === 0, 
                  left: vArrow.rotation % 180 !== 0, 
                  right: vArrow.rotation % 180 !== 0,
                  topLeft: false, topRight: false, bottomLeft: false, bottomRight: false
                } : false}
                className={`${isLocked ? "cursor-default" : "cursor-move"} group`}
                style={{ zIndex: 35 }}
              >
                <div className="relative w-full h-full">
                  <div 
                    style={{ 
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${vArrow.rotation}deg)`,
                      width: vArrow.rotation % 180 === 0 ? '100%' : vArrow.height,
                      height: vArrow.rotation % 180 === 0 ? '100%' : vArrow.width,
                    }}
                  >
                    <VerticalArrow width={vArrow.width} height={vArrow.height} color="#53B1D8" />
                  </div>
                  {!isLocked && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                                    flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                      <button
                        className="w-6 h-6 rounded-full bg-blue-500/80 hover:bg-blue-600 
                                   flex items-center justify-center shadow-lg"
                        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleRotateVerticalArrow(vArrow.id); }}
                        title={`Rotate 90° (current: ${vArrow.rotation}°)`}
                      >
                        <RotateCw className="w-3 h-3 text-white" />
                      </button>
                      <button
                        className="w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-600 
                                   flex items-center justify-center shadow-lg"
                        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteVerticalArrow(vArrow.id); }}
                        title="Delete arrow"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </Rnd>
            ))}

            {/* Render vertical lines for L3-Compressor Area */}
            {verticalLines.filter(vl => vl.screen === 'L3 – Compressor Area').map((vLine) => (
              <Rnd
                key={vLine.id}
                position={{ x: vLine.x, y: vLine.y }}
                size={{ width: vLine.width, height: vLine.height }}
                onDragStop={(e, d) => {
                  setVerticalLines(prev => prev.map(vl => 
                    vl.id === vLine.id ? { ...vl, x: d.x, y: d.y } : vl
                  ));
                }}
                onResizeStop={(e, dir, ref, delta, position) => {
                  setVerticalLines(prev => prev.map(vl => 
                    vl.id === vLine.id 
                      ? { ...vl, height: parseInt(ref.style.height), x: position.x, y: position.y }
                      : vl
                  ));
                }}
                minWidth={24}
                minHeight={50}
                maxWidth={24}
                bounds="parent"
                disableDragging={isLocked}
                enableResizing={!isLocked ? { 
                  top: true, bottom: true, left: false, right: false,
                  topLeft: false, topRight: false, bottomLeft: false, bottomRight: false
                } : false}
                className={`${isLocked ? "cursor-default" : "cursor-move"} group`}
                style={{ zIndex: 35 }}
              >
                <div className="relative w-full h-full">
                  <VerticalLine width={vLine.width} height={vLine.height} color="#53B1D8" />
                  {!isLocked && (
                    <button
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                                 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-600 
                                 flex items-center justify-center shadow-lg 
                                 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                      onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteVerticalLine(vLine.id); }}
                      title="Delete line"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
              </Rnd>
            ))}
          </div>
        )}

        {/* 6.1 L3_1540 Converter View */}
        {selectedScreen === "6.1 L3_1540 Converter" && (
          <div className="relative bg-white" style={{ width: '3680px', height: '2260px', minWidth: '3680px', minHeight: '2260px' }}>
            {/* Lock/Unlock Button */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLocked61(!isLocked61)}
                className={`${isLocked61 ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-green-500/20 border-green-500 text-green-400'}`}
                data-testid="button-lock-toggle-61"
              >
                {isLocked61 ? <Lock className="w-4 h-4 mr-1" /> : <LockOpen className="w-4 h-4 mr-1" />}
                {isLocked61 ? 'Locked' : 'Unlocked'}
              </Button>
            </div>

            {/* 4-Pass Converter Graphic */}
            <Rnd
              key="converter-61"
              position={converter61Position}
              size={converter61Size}
              onDragStop={(e, d) => {
                setConverter61Position({ x: d.x, y: d.y });
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setConverter61Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setConverter61Position(position);
              }}
              minWidth={200}
              minHeight={300}
              bounds="parent"
              disableDragging={isLocked61}
              enableResizing={!isLocked61}
              className={isLocked61 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 10 }}
              data-testid="converter-61-rnd"
            >
              <img 
                src={converter4PassImg} 
                alt="4-Pass Catalytic Converter" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-converter-61"
              />
            </Rnd>

            {/* 1540-TI-4825 Primary Faceplate (Pass 1 Catalyst In) */}
            <Rnd
              key="faceplate4825-61"
              position={faceplate4825_61Position}
              size={faceplate4825_61Size}
              onDragStop={(e, d) => {
                setFaceplate4825_61Position({ x: d.x, y: d.y });
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setFaceplate4825_61Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setFaceplate4825_61Position(position);
              }}
              minWidth={120}
              minHeight={180}
              bounds="parent"
              disableDragging={isLocked61}
              enableResizing={!isLocked61}
              className={isLocked61 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 20, visibility: sensorVisible ? 'visible' : 'hidden' }}
              data-testid="faceplate-4825-61-rnd"
            >
              <div 
                className="flex flex-col items-center gap-1 w-full h-full cursor-pointer" 
                data-testid="button-faceplate-4825-61-open"
                onClick={() => setShowSecondary4825_61(true)}
              >
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">1540-TI-4825</span>
                <TempSensorPrimaryFaceplate 
                  data={{
                    ...defaultControllerData,
                    instrumentTag: tempSensor4825Config.TAGNAME || '1540-TI-4825',
                    description: tempSensor4825Config.DESC || 'Pass 1 Catalyst In',
                    pvUnits: tempSensor4825Config.EU || 'F',
                    pvRangeMin: tempSensor4825Config.SP_LIM_LO ?? 0,
                    pvRangeMax: tempSensor4825Config.SP_LIM_HI ?? 2000,
                    pv: tempSensor4825SyncState.syncedPV,
                    sp: tempSensor4825SyncState.syncedSP,
                    out: tempSensor4825SyncState.syncedOUT,
                  }}
                  isTransparent={tempSensor4825Config.TRANSPARENT_BG ?? false}
                />
              </div>
            </Rnd>

            {/* Secondary Faceplate Dialog for 1540-TI-4825 */}
            <Dialog open={showSecondary4825_61} onOpenChange={setShowSecondary4825_61} modal={false}>
              <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
                <VisuallyHidden>
                  <DialogTitle>1540-TI-4825 Secondary Faceplate</DialogTitle>
                </VisuallyHidden>
                <TempSensorSecondaryFaceplate
                  data={tempSensor4825SecondaryData}
                  config={tempSensor4825SecondaryConfig}
                  sensorId="1540-TI-4825"
                  onClose={() => setShowSecondary4825_61(false)}
                />
              </DialogContent>
            </Dialog>

          </div>
        )}

        {/* L1 - System Overview */}
        {selectedScreen === "L1 – System Overview" && <L1SystemOverview instrumentFilter={instrumentFilter} orchestratorResult={orchestratorResult} />}

        {/* L2_1520 ACID View */}
        {selectedScreen === "L2_1520 ACID" && (
          <div className="relative bg-white" style={{ width: '3680px', height: '1130px', minWidth: '3680px', minHeight: '1130px' }}>
            {/* Lock/Unlock Button for L2_1520 */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLockedL21520(!isLockedL21520)}
                className={`${isLockedL21520 ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-green-500/20 border-green-500 text-green-400'}`}
                data-testid="button-lock-toggle-l2-1520"
              >
                {isLockedL21520 ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <LockOpen className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Acid Boiler Equipment Image */}
            <Rnd
              key="acid-boiler-l2-1520"
              data-testid="rnd-acid-boiler-l2-1520"
              position={acidBoilerPosition}
              size={acidBoilerSize}
              onDragStop={(e, d) => {
                setAcidBoilerPosition({ x: d.x, y: d.y });
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setAcidBoilerSize({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setAcidBoilerPosition(position);
              }}
              minWidth={200}
              minHeight={100}
              bounds="parent"
              disableDragging={isLockedL21520}
              enableResizing={!isLockedL21520}
              resizeHandleStyles={!isLockedL21520 ? resizeHandleStyles : undefined}
              className={isLockedL21520 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 10 }}
            >
              <img 
                src={acidBoilerImg} 
                alt="Acid Boiler Heat Exchanger" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-acid-boiler-l2-1520"
              />
            </Rnd>

            {/* Acid Tower 1 Equipment Image */}
            <Rnd
              key="acid-tower-1-l2-1520"
              data-testid="rnd-acid-tower-1-l2-1520"
              position={acidTower1Position}
              size={acidTower1Size}
              onDragStop={(e, d) => {
                setAcidTower1Position({ x: d.x, y: d.y });
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setAcidTower1Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setAcidTower1Position(position);
              }}
              minWidth={200}
              minHeight={100}
              bounds="parent"
              disableDragging={isLockedL21520}
              enableResizing={!isLockedL21520}
              resizeHandleStyles={!isLockedL21520 ? resizeHandleStyles : undefined}
              className={isLockedL21520 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 10 }}
            >
              <img 
                src={acidTower1Img} 
                alt="Acid Tower 1" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-acid-tower-1-l2-1520"
              />
            </Rnd>

            {/* Acid Tower 2 Equipment Image */}
            <Rnd
              key="acid-tower-2-l2-1520"
              data-testid="rnd-acid-tower-2-l2-1520"
              position={acidTower2Position}
              size={acidTower2Size}
              onDragStop={(e, d) => {
                setAcidTower2Position({ x: d.x, y: d.y });
              }}
              onResizeStop={(e, dir, ref, delta, position) => {
                setAcidTower2Size({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height)
                });
                setAcidTower2Position(position);
              }}
              minWidth={200}
              minHeight={100}
              bounds="parent"
              disableDragging={isLockedL21520}
              enableResizing={!isLockedL21520}
              resizeHandleStyles={!isLockedL21520 ? resizeHandleStyles : undefined}
              className={isLockedL21520 ? "cursor-default" : "cursor-move"}
              style={{ zIndex: 10 }}
            >
              <img 
                src={acidTower2Img} 
                alt="Acid Tower 2" 
                className="w-full h-full object-contain"
                draggable={false}
                data-testid="img-acid-tower-2-l2-1520"
              />
            </Rnd>

            {orchestratorResult?.kpp && (
              <Rnd
                key="kpp-faceplate-l2-1520"
                data-testid="rnd-kpp-faceplate-l2-1520"
                position={kppFaceplateL21520Position}
                size={kppFaceplateL21520Size}
                onDragStop={(e, d) => {
                  setKppFaceplateL21520Position({ x: d.x, y: d.y });
                }}
                onResizeStop={(e, dir, ref, delta, position) => {
                  setKppFaceplateL21520Size({
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height)
                  });
                  setKppFaceplateL21520Position(position);
                }}
                minWidth={200}
                minHeight={200}
                bounds="parent"
                disableDragging={isLockedL21520}
                enableResizing={!isLockedL21520}
                resizeHandleStyles={!isLockedL21520 ? resizeHandleStyles : undefined}
                className={isLockedL21520 ? "cursor-default" : "cursor-move"}
                style={{ zIndex: 50 }}
              >
                <div className="w-full h-full" data-testid="l2-1520-kpp-faceplate">
                <KPPFaceplate className="w-full h-full" data={(() => {
                  const kpp = orchestratorResult.kpp;
                  const s24 = orchestratorResult.streams?.["24"];
                  const stpd = kpp.H2SO4_production_STPD;
                  const so2TailScfm = s24?.SO2 ?? 0;
                  const so2LbDay = (so2TailScfm / 5.984) * 64.064 * 24;
                  const emissionsLbPerST = stpd > 0 ? so2LbDay / stpd : null;
                  const o2Pct = s24 ? (s24.O2 / Math.max(s24.TOTAL, 1e-9)) * 100 : null;
                  const steamSTPD = stpd != null ? stpd * 1.3 : null;
                  const grossMW = stpd != null ? (stpd / 24 * 1.3 * 243) / 1000 : null;
                  return {
                    plantRate: stpd,
                    conversion: kpp.overall_SO2_conversion_pct,
                    pass1Strength: orchestratorResult.sensor_tags?.["1540-AI-4825"] ?? (() => {
                      const s9 = orchestratorResult.streams?.["9"];
                      return s9 ? (s9.SO2 / Math.max(s9.TOTAL, 1e-9)) * 100 : null;
                    })(),
                    o2TailGas: o2Pct,
                    emissionsPpmv: kpp.SO2_ppm_stack ?? null,
                    emissions: emissionsLbPerST,
                    steamGen: steamSTPD != null ? Math.round(steamSTPD) : null,
                    grossPowerMW: grossMW,
                    powerRatio: 243,
                  };
                })()} />
                </div>
              </Rnd>
            )}
          </div>
        )}
      </div>

      {/* Alarm Banner - always visible at bottom */}
      <div className="flex-shrink-0">
        <AlarmBanner alarms={orchestratorResult?.alarms ?? []} />
      </div>

      {/* VFD Faceplate Modal */}
      <Dialog open={isVFDModalOpen} onOpenChange={setIsVFDModalOpen} modal={false}>
        <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>VFD Faceplate</DialogTitle>
          </VisuallyHidden>
          <VFDFaceplate
            data={compressorData}
            onStart={handleStart}
            onStop={handleStop}
            onModeChange={handleModeChange}
            onSpeedSPChange={handleSpeedSPChange}
            onClearAlarm={handleClearAlarm}
            onClose={() => setIsVFDModalOpen(false)}
            configTagName={vfdConfig?.tagName}
            configDescription={vfdConfig?.description}
            configUnit={vfdConfig?.unit}
          />
        </DialogContent>
      </Dialog>

      {/* Sulfur Flow Controller Secondary Faceplate Modal */}
      <Dialog open={isSulfurFlowModalOpen} onOpenChange={setIsSulfurFlowModalOpen} modal={false}>
        <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>Sulfur Flow Controller</DialogTitle>
          </VisuallyHidden>
          <SecondaryControllerFaceplate
            data={sulfurFlowSecondaryData}
            config={sulfurFlowSecondaryConfig}
            controllerId="1530-F-2602"
            onClose={() => setIsSulfurFlowModalOpen(false)}
            onModeChange={(mode) => updateSulfurMode(mode)}
            onRoutRcasChange={(mode) => setSulfurFlowRoutRcas(mode)}
            onBypassChange={(active) => setSulfurFlowBypass(active)}
            onSpChange={(value) => {
              updateSulfurSP(value);
              if (useStaticSulfurFlow) {
                setLoadedCaseValueSulfurFlow(value);
                savePVCaseValue('1530-F-2602', value);
              }
            }}
            onOutChange={(value) => {
              updateSulfurOUT(value);
              if (useStaticSulfurFlow) {
                setLoadedCaseValueSulfurFlow(value);
                savePVCaseValue('1530-F-2602', value);
              }
            }}
            onModelockOverrideChange={(active) => setSulfurFlowModelockOverride(active)}
            fromSource="home-screen"
            selectedMode={selectedMode}
            loadedCaseValue={useStaticSulfurFlow ? loadedCaseValueSulfurFlow : null}
          />
        </DialogContent>
      </Dialog>

      {/* Temperature Sensor 1520-TI-5821 Secondary Faceplate Modal */}
      <Dialog open={isTempSensorModalOpen} onOpenChange={setIsTempSensorModalOpen}>
        <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>Temperature Sensor 1520-TI-5821</DialogTitle>
          </VisuallyHidden>
          <TempSensorSecondaryFaceplate
            data={tempSensorSecondaryData}
            config={tempSensorSecondaryConfig}
            sensorId="1520-TI-5821"
            onClose={() => setIsTempSensorModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Temperature Sensor 1540-TI-4200A Secondary Faceplate Modal */}
      <Dialog open={isTempSensor4200AModalOpen} onOpenChange={setIsTempSensor4200AModalOpen}>
        <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>Temperature Sensor 1540-TI-4200A</DialogTitle>
          </VisuallyHidden>
          <TempSensorSecondaryFaceplate
            data={tempSensor4200ASecondaryData}
            config={tempSensor4200ASecondaryConfig}
            sensorId="1540-TI-4200A"
            onClose={() => setIsTempSensor4200AModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Temperature Sensor 1540-TI-4820 (Pass 1 Inlet Duct) Secondary Faceplate Modal */}
      <Dialog open={isTempSensor4820ModalOpen} onOpenChange={setIsTempSensor4820ModalOpen} modal={false}>
        <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>Temperature Sensor 1540-TI-4820</DialogTitle>
          </VisuallyHidden>
          <TempSensorSecondaryFaceplate
            data={tempSensor4820SecondaryData}
            config={tempSensor4820SecondaryConfig}
            sensorId="1540-TI-4820"
            onClose={() => setIsTempSensor4820ModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Temperature Sensor 1540-TI-4200B Secondary Faceplate Modal */}
      <Dialog open={isTempSensor4200BModalOpen} onOpenChange={setIsTempSensor4200BModalOpen}>
        <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>Temperature Sensor 1540-TI-4200B</DialogTitle>
          </VisuallyHidden>
          <TempSensorSecondaryFaceplate
            data={tempSensor4200BSecondaryData}
            config={tempSensor4200BSecondaryConfig}
            sensorId="1540-TI-4200B"
            onClose={() => setIsTempSensor4200BModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Temperature Sensor 1540-TI-4200C Secondary Faceplate Modal */}
      <Dialog open={isTempSensor4200CModalOpen} onOpenChange={setIsTempSensor4200CModalOpen}>
        <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>Temperature Sensor 1540-TI-4200C</DialogTitle>
          </VisuallyHidden>
          <TempSensorSecondaryFaceplate
            data={tempSensor4200CSecondaryData}
            config={tempSensor4200CSecondaryConfig}
            sensorId="1540-TI-4200C"
            onClose={() => setIsTempSensor4200CModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Hand Controller 1540-H-4030 Secondary Faceplate Modal */}
      <Dialog open={isHandControllerModalOpen} onOpenChange={setIsHandControllerModalOpen} modal={false}>
        <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>Hand Controller 1540-H-4030</DialogTitle>
          </VisuallyHidden>
          <SecondaryControllerFaceplate
            data={handControllerSecondaryData}
            config={handControllerSecondaryConfig}
            controllerId="1540-H-4030"
            onClose={() => setIsHandControllerModalOpen(false)}
            onModeChange={(mode) => updateHandControllerMode(mode)}
            onSpChange={(value) => {
              updateHandControllerSP(value);
              if (selectedMode === 'Static') {
                setLoadedCaseValue1540H4030(value);
                savePVCaseValue('1540-H-4030', value);
              }
            }}
            onOutChange={(value) => {
              updateHandControllerOUT(value);
              if (selectedMode === 'Static') {
                setLoadedCaseValue1540H4030(value);
                savePVCaseValue('1540-H-4030', value);
              }
            }}
            fromSource="home-screen"
            selectedMode={selectedMode}
            loadedCaseValue={loadedCaseValue1540H4030}
          />
        </DialogContent>
      </Dialog>

      {/* Jug Valve Hand Controller 1540-H-4282 Secondary Faceplate Modal */}
      <Dialog open={isJugValveHandControllerModalOpen} onOpenChange={setIsJugValveHandControllerModalOpen} modal={false}>
        <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>Jug Valve Hand Controller 1540-H-4282</DialogTitle>
          </VisuallyHidden>
          <SecondaryControllerFaceplate
            data={jugValveHandControllerSecondaryData}
            config={jugValveHandControllerSecondaryConfig}
            controllerId="1540-H-4282"
            onClose={() => setIsJugValveHandControllerModalOpen(false)}
            onModeChange={(mode) => updateJugValveHandControllerMode(mode)}
            onSpChange={(value) => {
              updateJugValveHandControllerSP(value);
              if (selectedMode === 'Static') {
                setLoadedCaseValueJugValve(value);
                savePVCaseValue('1540-H-4282', value);
              }
            }}
            onOutChange={(value) => {
              updateJugValveHandControllerOUT(value);
              if (selectedMode === 'Static') {
                setLoadedCaseValueJugValve(value);
                savePVCaseValue('1540-H-4282', value);
              }
            }}
            fromSource="home-screen"
            selectedMode={selectedMode}
            loadedCaseValue={loadedCaseValueJugValve}
          />
        </DialogContent>
      </Dialog>

      {/* WHB Hand Controller 1540-H-4283 Secondary Faceplate Modal */}
      <Dialog open={isWhbHandControllerModalOpen} onOpenChange={setIsWhbHandControllerModalOpen} modal={false}>
        <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>WHB Outlet dP Hand Controller 1540-H-4283</DialogTitle>
          </VisuallyHidden>
          <SecondaryControllerFaceplate
            data={whbHandControllerSecondaryData}
            config={whbHandControllerSecondaryConfig}
            controllerId="1540-H-4283"
            onClose={() => setIsWhbHandControllerModalOpen(false)}
            onModeChange={(mode) => updateWhbHandControllerMode(mode)}
            onSpChange={(value) => {
              updateWhbHandControllerSP(value);
              if (selectedMode === 'Static') {
                setLoadedCaseValueWHBdP(value);
                savePVCaseValue('1540-H-4283', value);
              }
            }}
            onOutChange={(value) => {
              updateWhbHandControllerOUT(value);
              if (selectedMode === 'Static') {
                setLoadedCaseValueWHBdP(value);
                savePVCaseValue('1540-H-4283', value);
              }
            }}
            fromSource="home-screen"
            selectedMode={selectedMode}
            loadedCaseValue={loadedCaseValueWHBdP}
          />
        </DialogContent>
      </Dialog>

      {/* Open PV Case Selection Dialog */}
      <Dialog open={isOpenPVCaseDialogOpen} onOpenChange={setIsOpenPVCaseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Open PV Case</DialogTitle>
            <DialogDescription>
              Select a Process Variable case to load.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup 
              value={selectedPVCase || ""} 
              onValueChange={(value) => setSelectedPVCase(value)}
              className="space-y-3"
            >
              {pvCaseData?.cases?.map((pvCase) => (
                <div 
                  key={pvCase.id} 
                  className="flex items-start space-x-3 p-3 rounded-md border hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedPVCase(pvCase.id)}
                >
                  <RadioGroupItem value={pvCase.id} id={pvCase.id} className="mt-0.5" />
                  <Label htmlFor={pvCase.id} className="flex flex-col cursor-pointer flex-1">
                    <span className="font-medium text-sm">{pvCase.name}</span>
                    <span className="text-xs text-muted-foreground">{pvCase.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {(!pvCaseData?.cases || pvCaseData.cases.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No PV cases available. Configure cases in the Process Variables settings.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOpenPVCaseDialogOpen(false)}
              data-testid="button-cancel-pv-case"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedPVCase && pvCaseData) {
                  // Find the 1540-H-4030 variable and extract the value for the selected case
                  const handControllerVar = pvCaseData.variables?.find(
                    (v: any) => v.tag === '1540-H-4030' || v.tagNumber === '1540-H-4030'
                  );
                  if (handControllerVar && handControllerVar.cases) {
                    const caseValue = handControllerVar.cases[selectedPVCase];
                    if (caseValue !== undefined && caseValue !== null && caseValue !== '') {
                      const numericValue = parseFloat(String(caseValue));
                      if (!isNaN(numericValue)) {
                        setLoadedCaseValue1540H4030(numericValue);
                        setActivePVCaseId(selectedPVCase);
                      }
                    }
                  }
                  toast({
                    title: "Case Loaded",
                    description: `Loaded PV Case: ${pvCaseData?.cases?.find(c => c.id === selectedPVCase)?.name || selectedPVCase}`,
                  });
                  setIsOpenPVCaseDialogOpen(false);
                }
              }}
              disabled={!selectedPVCase}
              data-testid="button-open-pv-case"
            >
              Open
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  </div>
  );
};

export default HomeScreen;
