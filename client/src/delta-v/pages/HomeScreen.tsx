// IMPORTANT: This file was recovered via checkpoint rollback on January 8, 2026
// Prefer local (HEAD) version over remote changes unless upstream contains critical fixes
// Reviewed and resolved manually - do not blindly overwrite in future merges


import { Link, useLocation } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { Rnd } from "react-rnd";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AlarmBanner from "@/delta-v/components/faceplate/AlarmBanner";
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
import menuIconImg from "@assets/image_1767651932939.png";
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
import { TempSensorSecondaryFaceplate } from "@/delta-v/components/faceplate/TempSensorSecondaryFaceplate";
import { useCompressor } from "@/delta-v/contexts/CompressorContext";
import { useControllerSync } from "@/delta-v/contexts/ControllerSyncContext";
import { useControllerConfig } from "@/delta-v/contexts/ControllerConfigContext";
import type { ControllerData } from "@/delta-v/types/controller";
import { defaultControllerData } from "@/delta-v/types/controller";
import type { SecondaryControllerData, SecondaryControllerConfig } from "@/delta-v/types/secondaryController";
import { defaultSecondaryData, defaultSecondaryConfig } from "@/delta-v/types/secondaryController";
import { useToast } from "@/hooks/use-toast";
import { VerticalArrow } from "@/delta-v/components/VerticalArrow";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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
  X,
  Lock,
  LockOpen,
  ChevronDown,
  Save,
  RotateCw,
  ArrowUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
  { id: "L2", label: "L2 – Furnace Area" },
  { id: "L3", label: "L3 – Compressor Area" },
  { id: "L4", label: "L4 – Cooling System" },
];

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
  const [verticalArrows, setVerticalArrows] = useState<Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>>([
    { id: 'v_arrow_1', x: 50, y: 200, width: 24, height: 150 },
  ]);
  
  const [isLocked, setIsLocked] = useState(true);
  const [selectedScreen, setSelectedScreen] = useState("L1 – System Overview");
  const [selectedMode, setSelectedMode] = useState("Static");
  const [location] = useLocation();
  
  // Mode options for the Mode dropdown
  const modeOptions = [
    { id: "static", label: "Static" },
    { id: "dynamic", label: "Dynamic" },
    { id: "startup", label: "Start-Up" },
    { id: "emergency", label: "Emergency Scenarios" },
  ];
  
  // Read mode from query parameter on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const modeParam = searchParams.get('mode');
    if (modeParam) {
      const modeMatch = modeOptions.find(m => m.id.toLowerCase() === modeParam.toLowerCase());
      if (modeMatch) {
        setSelectedMode(modeMatch.label);
      }
    }
  }, [location]);
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
  const sulfurFlowConfig = getControllerConfig('default');
  
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
  const { state: tempSensor4200ASyncState, initializeController: initTempSensor4200A, updateAlarmLimits: updateTempSensor4200AAlarmLimits } = useControllerSync('1540-TI-4200A');
  const tempSensor4200AConfig = getControllerConfig('1540-TI-4200A');
  
  // Get real-time synced state for Temperature Sensor 1540-TI-4200B
  const { state: tempSensor4200BSyncState, initializeController: initTempSensor4200B, updateAlarmLimits: updateTempSensor4200BAlarmLimits } = useControllerSync('1540-TI-4200B');
  const tempSensor4200BConfig = getControllerConfig('1540-TI-4200B');
  
  // Get real-time synced state for Temperature Sensor 1540-TI-4200C
  const { state: tempSensor4200CSyncState, initializeController: initTempSensor4200C, updateAlarmLimits: updateTempSensor4200CAlarmLimits } = useControllerSync('1540-TI-4200C');
  const tempSensor4200CConfig = getControllerConfig('1540-TI-4200C');
  
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
  const sulfurFlowData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: sulfurFlowConfig.TAGNAME || '1530-F-2602',
    description: sulfurFlowConfig.DESC || 'Sulfur Flow Controller',
    pv: sulfurSyncState.syncedPV,
    sp: sulfurSyncState.syncedSP,
    out: sulfurSyncState.syncedOUT,
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
  const handControllerData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: handControllerConfig.TAGNAME || '1540-H-4030',
    description: handControllerConfig.DESC || 'Main Compressor Hand Controller',
    pv: handControllerSyncState.syncedPV,
    sp: handControllerSyncState.syncedSP,
    out: handControllerSyncState.syncedOUT,
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
  const whbHandControllerData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: whbHandControllerConfig.TAGNAME || '1540-H-4283',
    description: whbHandControllerConfig.DESC || 'WHB Outlet dP Hand Controller',
    pv: whbHandControllerSyncState.syncedPV,
    sp: whbHandControllerSyncState.syncedSP,
    out: whbHandControllerSyncState.syncedOUT,
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
  const jugValveHandControllerData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: jugValveHandControllerConfig.TAGNAME || '1540-H-4282',
    description: jugValveHandControllerConfig.DESC || 'Jug Valve Hand Controller',
    pv: jugValveHandControllerSyncState.syncedPV,
    sp: jugValveHandControllerSyncState.syncedSP,
    out: jugValveHandControllerSyncState.syncedOUT,
    mode: jugValveHandControllerSyncState.syncedMode,
    pvUnits: jugValveHandControllerConfig.EU || '%',
    pvRangeMin: jugValveHandControllerConfig.PV_SCALE_LO ?? 0,
    pvRangeMax: jugValveHandControllerConfig.PV_SCALE_HI ?? 100,
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
  const tempSensor4200AData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: tempSensor4200AConfig.TAGNAME || '1540-TI-4200A',
    description: tempSensor4200AConfig.DESC || 'Furnace Temp Out A',
    pv: tempSensor4200ASyncState.syncedPV,
    sp: tempSensor4200ASyncState.syncedSP,
    out: tempSensor4200ASyncState.syncedOUT,
    mode: tempSensor4200ASyncState.syncedMode,
    pvUnits: tempSensor4200AConfig.EU || '°F',
    pvRangeMin: tempSensor4200AConfig.SP_LIM_LO ?? 0,
    pvRangeMax: tempSensor4200AConfig.SP_LIM_HI ?? 2500,
    alarmActive: tempSensor4200ASyncState.alarmStates.HH || tempSensor4200ASyncState.alarmStates.H || 
                 tempSensor4200ASyncState.alarmStates.L || tempSensor4200ASyncState.alarmStates.LL,
    alarmColor: (tempSensor4200ASyncState.alarmStates.HH || tempSensor4200ASyncState.alarmStates.LL) ? 'red' : 
                (tempSensor4200ASyncState.alarmStates.H || tempSensor4200ASyncState.alarmStates.L) ? 'yellow' : undefined,
    alarmLL: tempSensor4200AConfig.ALM_LL_LIM,
    alarmL: tempSensor4200AConfig.ALM_L_LIM,
    alarmH: tempSensor4200AConfig.ALM_H_LIM,
    alarmHH: tempSensor4200AConfig.ALM_HH_LIM,
  };

  // Build Temperature Sensor 1540-TI-4200B data from synced state
  const tempSensor4200BData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: tempSensor4200BConfig.TAGNAME || '1540-TI-4200B',
    description: tempSensor4200BConfig.DESC || 'Furnace Temp Out B',
    pv: tempSensor4200BSyncState.syncedPV,
    sp: tempSensor4200BSyncState.syncedSP,
    out: tempSensor4200BSyncState.syncedOUT,
    mode: tempSensor4200BSyncState.syncedMode,
    pvUnits: tempSensor4200BConfig.EU || '°F',
    pvRangeMin: tempSensor4200BConfig.SP_LIM_LO ?? 0,
    pvRangeMax: tempSensor4200BConfig.SP_LIM_HI ?? 2500,
    alarmActive: tempSensor4200BSyncState.alarmStates.HH || tempSensor4200BSyncState.alarmStates.H || 
                 tempSensor4200BSyncState.alarmStates.L || tempSensor4200BSyncState.alarmStates.LL,
    alarmColor: (tempSensor4200BSyncState.alarmStates.HH || tempSensor4200BSyncState.alarmStates.LL) ? 'red' : 
                (tempSensor4200BSyncState.alarmStates.H || tempSensor4200BSyncState.alarmStates.L) ? 'yellow' : undefined,
    alarmLL: tempSensor4200BConfig.ALM_LL_LIM,
    alarmL: tempSensor4200BConfig.ALM_L_LIM,
    alarmH: tempSensor4200BConfig.ALM_H_LIM,
    alarmHH: tempSensor4200BConfig.ALM_HH_LIM,
  };

  // Build Temperature Sensor 1540-TI-4200C data from synced state (Furnace temp 1800-2300°F)
  const tempSensor4200CData: ControllerData = {
    ...defaultControllerData,
    instrumentTag: '1540-TI-4200C',
    description: 'Furnace C',
    pv: tempSensor4200CSyncState.syncedPV,
    sp: tempSensor4200CSyncState.syncedSP,
    out: tempSensor4200CSyncState.syncedOUT,
    mode: tempSensor4200CSyncState.syncedMode,
    pvUnits: '°F',
    pvRangeMin: 1800,
    pvRangeMax: 2300,
    alarmActive: tempSensor4200CSyncState.alarmStates.HH || tempSensor4200CSyncState.alarmStates.H || 
                 tempSensor4200CSyncState.alarmStates.L || tempSensor4200CSyncState.alarmStates.LL,
    alarmColor: (tempSensor4200CSyncState.alarmStates.HH || tempSensor4200CSyncState.alarmStates.LL) ? 'red' : 
                (tempSensor4200CSyncState.alarmStates.H || tempSensor4200CSyncState.alarmStates.L) ? 'yellow' : undefined,
    alarmLL: 1850,
    alarmL: 1900,
    alarmH: 2200,
    alarmHH: 2250,
  };

  // Use shared compressor context
  const {
    compressorData,
    handleStart,
    handleStop,
    handleModeChange,
    handleSpeedSPChange,
    handleClearAlarm,
  } = useCompressor();

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

  const handleJugValveClick = () => {
    if (isLocked) {
      setLocation('/jug-valve/3e');
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
  const sulfurFlowSecondaryData: SecondaryControllerData = {
    ...defaultSecondaryData,
    PV: sulfurSyncState.syncedPV,
    SP: sulfurSyncState.syncedSP,
    TSP: sulfurSyncState.syncedSP,
    OUT_PCT: sulfurSyncState.syncedOUT,
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
    PV: jugValveHandControllerSyncState.syncedPV,
    SP: jugValveHandControllerSyncState.syncedSP,
    TSP: jugValveHandControllerSyncState.syncedSP,
    OUT_PCT: jugValveHandControllerSyncState.syncedOUT,
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
    PV: whbHandControllerSyncState.syncedPV,
    SP: whbHandControllerSyncState.syncedSP,
    TSP: whbHandControllerSyncState.syncedSP,
    OUT_PCT: whbHandControllerSyncState.syncedOUT,
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
    const savedVerticalArrows: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];
    layoutData.layouts.forEach((layout: { elementId: string; positionX: number; positionY: number; width: number; height: number }) => {
      if (layout.elementId.startsWith('v_arrow_')) {
        savedVerticalArrows.push({
          id: layout.elementId,
          x: layout.positionX,
          y: layout.positionY,
          width: layout.width,
          height: layout.height,
        });
      }
    });
    if (savedVerticalArrows.length > 0) {
      setVerticalArrows(savedVerticalArrows);
    }
    
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
        // Add all arrows
        ...arrows.map(arrow => ({
          elementId: arrow.id,
          positionX: Math.round(arrow.x),
          positionY: Math.round(arrow.y),
          width: arrow.width,
          height: arrow.height,
          rotation: arrow.rotation,
        })),
        // Add all vertical arrows
        ...verticalArrows.map(va => ({
          elementId: va.id,
          positionX: Math.round(va.x),
          positionY: Math.round(va.y),
          width: va.width,
          height: va.height,
          rotation: 0,
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
  
  // Add a new vertical arrow
  const handleAddVerticalArrow = () => {
    const newId = `v_arrow_${Date.now()}`;
    setVerticalArrows(prev => [...prev, {
      id: newId,
      x: 100,
      y: 100,
      width: 24,
      height: 150,
    }]);
    toast({ title: "Vertical Arrow Added", description: "A new vertical arrow has been added to the canvas." });
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
              <MenubarItem className="text-gray-800" data-testid="menu-file-open">Open</MenubarItem>
              <MenubarItem className="text-gray-800" data-testid="menu-file-save">Save</MenubarItem>
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

            {/* Lock Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-200"
                  onClick={() => setIsLocked(!isLocked)}
                >
                  {isLocked ? (
                    <Lock className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <LockOpen className="h-5 w-5 text-gray-500" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isLocked ? "Unlock Icons" : "Lock Icons"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Save Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-200"
                  onClick={handleSaveLayout}
                  disabled={isSaving}
                >
                  <Save className={`h-5 w-5 ${isSaving ? 'text-gray-400' : 'text-green-600'}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isSaving ? "Saving..." : "Save Layout"}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Add Vertical Arrow Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-200"
                  onClick={handleAddVerticalArrow}
                  disabled={isLocked}
                  data-testid="button-add-vertical-arrow"
                >
                  <ArrowUp className="h-5 w-5 text-cyan-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Add Vertical Arrow</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
                  className={`text-gray-800 ${selectedScreen === option.label ? "bg-gray-100" : ""}`}
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
          
          {/* Start Simulation Button - only visible when NOT in Static mode */}
          {selectedMode !== "Static" && (
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 text-sm h-8 gap-2"
              data-testid="button-start-simulation"
            >
              <Activity className="h-4 w-4" />
              Start
            </Button>
          )}
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
                  >
                    <Maximize2 className="h-5 w-5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Resize Window</p>
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

      {/* Main content area - scrollable container */}
      <div className="flex-1 overflow-auto">
        {/* L2 - Furnace Area View - Blank Canvas (half area of L1) */}
        {selectedScreen === "L2 – Furnace Area" && (
          <div className="relative bg-gray-50" style={{ width: '3680px', height: '1130px', minWidth: '3680px', minHeight: '1130px' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-2xl font-semibold">L2 – Furnace Area</p>
                <p className="text-sm mt-2">Blank Canvas - Add equipment here</p>
              </div>
            </div>
          </div>
        )}

        {/* L1 - System Overview - Fixed-size canvas for scrollable content */}
        {selectedScreen === "L1 – System Overview" && (
        <div className="relative" style={{ width: '5200px', height: '1600px', minWidth: '5200px', minHeight: '1600px' }}>
        <Rnd
          position={furnacePosition}
          size={furnaceSize}
          onDragStop={(e, d) => setFurnacePosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setFurnaceSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setFurnacePosition(position);
          }}
          minWidth={100}
          minHeight={40}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
          style={{ zIndex: 20 }}
        >
          <img 
            src={furnaceWhbImg} 
            alt="Furnace WHB" 
            className="w-full h-full object-contain"
            draggable={false}
          />
        </Rnd>

        <Rnd
          position={compressorPosition}
          size={compressorSize}
          onDragStop={(e, d) => setCompressorPosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setCompressorSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setCompressorPosition(position);
          }}
          minWidth={150}
          minHeight={120}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
        >
          <div 
            className={`w-full h-full flex items-center justify-center ${isLocked ? 'cursor-pointer' : ''}`}
            onClick={handleCompressorClick}
          >
            <PrimaryCompressorFaceplate 
              data={compressorData} 
              transparentBackground={true}
            />
          </div>
        </Rnd>

        {/* Sulfur Flow Controller Faceplate */}
        <Rnd
          position={sulfurFlowPosition}
          size={sulfurFlowSize}
          onDragStop={(e, d) => setSulfurFlowPosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setSulfurFlowSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setSulfurFlowPosition(position);
          }}
          minWidth={100}
          minHeight={90}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
        >
          <div 
            className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
            onClick={handleSulfurFlowClick}
            style={{
              transform: `scale(${Math.min(sulfurFlowSize.width / 220, sulfurFlowSize.height / 200)})`,
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

        {/* Sulfur Flow Control Valve Faceplate */}
        <Rnd
          position={sulfurValvePosition}
          size={sulfurValveSize}
          onDragStop={(e, d) => setSulfurValvePosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setSulfurValveSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setSulfurValvePosition(position);
          }}
          minWidth={80}
          minHeight={100}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
        >
          <div 
            className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
            onClick={handleSulfurValveClick}
            style={{
              transform: `scale(${Math.min(sulfurValveSize.width / 100, sulfurValveSize.height / 140)})`,
              transformOrigin: 'center center'
            }}
          >
            <ValveFaceplate 
              data={sulfurValveData}
              isTransparent={true}
            />
          </div>
        </Rnd>

        {/* Jug Valve Faceplate */}
        <Rnd
          position={jugValvePosition}
          size={jugValveSize}
          onDragStop={(e, d) => setJugValvePosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setJugValveSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setJugValvePosition(position);
          }}
          minWidth={80}
          minHeight={100}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
          style={{ zIndex: 10 }}
        >
          <div 
            className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
            onClick={handleJugValveClick}
            style={{
              transform: `scale(${Math.min(jugValveSize.width / 100, jugValveSize.height / 140)})`,
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

        {/* Jug Valve Positioner Faceplate */}
        <Rnd
          position={jugValvePositionerPosition}
          size={jugValvePositionerSize}
          onDragStop={(e, d) => setJugValvePositionerPosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setJugValvePositionerSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setJugValvePositionerPosition(position);
          }}
          minWidth={80}
          minHeight={100}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
        >
          <div 
            className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
            onClick={handleJugValvePositionerClick}
            style={{
              transform: `scale(${Math.min(jugValvePositionerSize.width / 100, jugValvePositionerSize.height / 140)})`,
              transformOrigin: 'center center'
            }}
          >
            <ValveFaceplate 
              data={jugValvePositionerData}
              isTransparent={true}
              valveImageSrc={jugValvePositionerImage}
            />
          </div>
        </Rnd>

        {/* Hand Controller 1540-H-4030 Faceplate */}
        <Rnd
          position={handControllerPosition}
          size={handControllerSize}
          onDragStop={(e, d) => setHandControllerPosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setHandControllerSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setHandControllerPosition(position);
          }}
          minWidth={100}
          minHeight={90}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
        >
          <div 
            className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
            onClick={handleHandControllerClick}
            style={{
              transform: `scale(${Math.min(handControllerSize.width / 220, handControllerSize.height / 200)})`,
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

        {/* WHB Outlet dP Hand Controller 1540-H-4283 Faceplate */}
        <Rnd
          position={whbHandControllerPosition}
          size={whbHandControllerSize}
          onDragStop={(e, d) => setWhbHandControllerPosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setWhbHandControllerSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setWhbHandControllerPosition(position);
          }}
          minWidth={100}
          minHeight={90}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
        >
          <div 
            className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
            onClick={handleWhbHandControllerClick}
            style={{
              transform: `scale(${Math.min(whbHandControllerSize.width / 220, whbHandControllerSize.height / 200)})`,
              transformOrigin: 'center center'
            }}
          >
            <ControllerFaceplate 
              data={whbHandControllerData}
              isTransparent={true}
              controllerId="1540-H-4283"
            />
          </div>
        </Rnd>

        {/* Jug Valve Hand Controller 1540-H-4282 Faceplate */}
        <Rnd
          position={jugValveHandControllerPosition}
          size={jugValveHandControllerSize}
          onDragStop={(e, d) => setJugValveHandControllerPosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setJugValveHandControllerSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setJugValveHandControllerPosition(position);
          }}
          minWidth={100}
          minHeight={90}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
        >
          <div 
            className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
            onClick={handleJugValveHandControllerClick}
            style={{
              transform: `scale(${Math.min(jugValveHandControllerSize.width / 220, jugValveHandControllerSize.height / 200)})`,
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

        <Rnd
          position={tempSensorPosition}
          size={tempSensorSize}
          onDragStop={(e, d) => setTempSensorPosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setTempSensorSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setTempSensorPosition(position);
          }}
          minWidth={120}
          minHeight={80}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
        >
          <div 
            className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
            onClick={handleTempSensorClick}
            style={{
              transform: `scale(${Math.min(tempSensorSize.width / 180, tempSensorSize.height / 120)})`,
              transformOrigin: 'center center'
            }}
          >
            <TempSensorPrimaryFaceplate 
              data={tempSensorData}
              isTransparent={true}
            />
          </div>
        </Rnd>

        {/* Temperature Sensor 1540-TI-4200A Faceplate */}
        <Rnd
          position={tempSensor4200APosition}
          size={tempSensor4200ASize}
          onDragStop={(e, d) => setTempSensor4200APosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setTempSensor4200ASize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setTempSensor4200APosition(position);
          }}
          minWidth={120}
          minHeight={80}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
        >
          <div 
            className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
            onClick={handleTempSensor4200AClick}
            style={{
              transform: `scale(${Math.min(tempSensor4200ASize.width / 180, tempSensor4200ASize.height / 120)})`,
              transformOrigin: 'center center'
            }}
          >
            <TempSensorPrimaryFaceplate 
              data={tempSensor4200AData}
              isTransparent={true}
            />
          </div>
        </Rnd>

        {/* Temperature Sensor 1540-TI-4200B Faceplate */}
        <Rnd
          position={tempSensor4200BPosition}
          size={tempSensor4200BSize}
          onDragStop={(e, d) => setTempSensor4200BPosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setTempSensor4200BSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setTempSensor4200BPosition(position);
          }}
          minWidth={120}
          minHeight={80}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
        >
          <div 
            className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
            onClick={handleTempSensor4200BClick}
            style={{
              transform: `scale(${Math.min(tempSensor4200BSize.width / 180, tempSensor4200BSize.height / 120)})`,
              transformOrigin: 'center center'
            }}
          >
            <TempSensorPrimaryFaceplate 
              data={tempSensor4200BData}
              isTransparent={true}
            />
          </div>
        </Rnd>

        {/* Temperature Sensor 1540-TI-4200C Faceplate */}
        <Rnd
          position={tempSensor4200CPosition}
          size={tempSensor4200CSize}
          onDragStop={(e, d) => setTempSensor4200CPosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setTempSensor4200CSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setTempSensor4200CPosition(position);
          }}
          minWidth={120}
          minHeight={80}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
          style={{ zIndex: 20 }}
        >
          <div 
            className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
            onClick={handleTempSensor4200CClick}
            style={{
              transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
              transformOrigin: 'center center'
            }}
          >
            <TempSensorPrimaryFaceplate 
              data={tempSensor4200CData}
              isTransparent={true}
            />
          </div>
        </Rnd>

        {/* Converter 4 Graphic */}
        <Rnd
          position={converter4Position}
          size={converter4Size}
          onDragStop={(e, d) => setConverter4Position({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setConverter4Size({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setConverter4Position(position);
          }}
          minWidth={80}
          minHeight={200}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          lockAspectRatio={false}
          className={isLocked ? "cursor-default" : "cursor-move"}
          style={{ zIndex: 1 }}
        >
          <img 
            src={converter4Img} 
            alt="Converter 4"
            className="w-full h-full object-fill"
            draggable={false}
          />
        </Rnd>

        {/* DT2 - Drying Tower Graphic */}
        <Rnd
          position={dt2Position}
          size={dt2Size}
          onDragStop={(e, d) => setDt2Position({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setDt2Size({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setDt2Position(position);
          }}
          minWidth={60}
          minHeight={150}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          lockAspectRatio={true}
          className={isLocked ? "cursor-default" : "cursor-move"}
          style={{ zIndex: 20 }}
        >
          <img 
            src={dt2Img} 
            alt="Drying Tower (DT)"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </Rnd>

        {/* FAT1 - Final Absorbing Tower */}
        <Rnd
          position={fat1Position}
          size={fat1Size}
          onDragStop={(e, d) => setFat1Position({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setFat1Size({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setFat1Position(position);
          }}
          minWidth={60}
          minHeight={150}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          lockAspectRatio={true}
          className={isLocked ? "cursor-default" : "cursor-move"}
          style={{ zIndex: 20 }}
        >
          <img 
            src={fat1Img} 
            alt="Final Absorbing Tower (FAT)"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </Rnd>

        {/* IPAT1 Graphic */}
        <Rnd
          position={ipat1Position}
          size={ipat1Size}
          onDragStop={(e, d) => setIpat1Position({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setIpat1Size({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setIpat1Position(position);
          }}
          minWidth={60}
          minHeight={150}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          lockAspectRatio={true}
          className={isLocked ? "cursor-default" : "cursor-move"}
          style={{ zIndex: 20 }}
        >
          <img 
            src={ipat1Img} 
            alt="IPAT Tower"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </Rnd>

        {/* HIP1 - Hot Interpass Absorber */}
        <Rnd
          position={hip1Position}
          size={hip1Size}
          onDragStop={(e, d) => setHip1Position({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setHip1Size({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setHip1Position(position);
          }}
          minWidth={50}
          minHeight={120}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          lockAspectRatio={true}
          className={isLocked ? "cursor-default" : "cursor-move"}
          style={{ zIndex: 20 }}
        >
          <img 
            src={hip1Img} 
            alt="Hot Interpass Absorber (HIP)"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </Rnd>

        {/* CIP - Cold Interpass Absorber */}
        <Rnd
          position={cipPosition}
          size={cipSize}
          onDragStop={(e, d) => setCipPosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setCipSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setCipPosition(position);
          }}
          minWidth={50}
          minHeight={120}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          lockAspectRatio={true}
          className={isLocked ? "cursor-default" : "cursor-move"}
          style={{ zIndex: 20 }}
        >
          <img 
            src={cipImg} 
            alt="Cold Interpass Absorber (CIP)"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </Rnd>

        {/* SH4A - Superheater 4A */}
        <Rnd
          position={sh4aPosition}
          size={sh4aSize}
          onDragStop={(e, d) => setSh4aPosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setSh4aSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setSh4aPosition(position);
          }}
          minWidth={50}
          minHeight={120}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          lockAspectRatio={true}
          className={isLocked ? "cursor-default" : "cursor-move"}
          style={{ zIndex: 20 }}
        >
          <img 
            src={sh4aImg} 
            alt="Superheater 4A (SH4A)"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </Rnd>

        {/* EC3B - Economizer 3B */}
        <Rnd
          position={ec3bPosition}
          size={ec3bSize}
          onDragStop={(e, d) => setEc3bPosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setEc3bSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setEc3bPosition(position);
          }}
          minWidth={50}
          minHeight={120}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          lockAspectRatio={true}
          className={isLocked ? "cursor-default" : "cursor-move"}
          style={{ zIndex: 20 }}
        >
          <img 
            src={ec3bImg} 
            alt="Economizer 3B (EC3B)"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </Rnd>

        {/* SH1B - Superheater 1B */}
        <Rnd
          position={sh1bPosition}
          size={sh1bSize}
          onDragStop={(e, d) => setSh1bPosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setSh1bSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setSh1bPosition(position);
          }}
          minWidth={50}
          minHeight={120}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          lockAspectRatio={true}
          className={isLocked ? "cursor-default" : "cursor-move"}
          style={{ zIndex: 20 }}
        >
          <img 
            src={sh1bImg} 
            alt="Superheater 1B (SH1B)"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </Rnd>

        {/* Industrial Filter */}
        <Rnd
          position={filterPosition}
          size={filterSize}
          onDragStop={(e, d) => setFilterPosition({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setFilterSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setFilterPosition(position);
          }}
          minWidth={40}
          minHeight={60}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          lockAspectRatio={true}
          className={isLocked ? "cursor-default" : "cursor-move"}
          style={{ zIndex: 20 }}
        >
          <img 
            src={industrialFilterImg} 
            alt="Industrial Filter"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </Rnd>

        {/* Render all arrows */}
        {arrows.map((arrow) => (
          <Rnd
            key={arrow.id}
            position={{ x: arrow.x, y: arrow.y }}
            size={{ width: arrow.width, height: arrow.height }}
            onDragStop={(e, d) => {
              setArrows(prev => prev.map(a => 
                a.id === arrow.id ? { ...a, x: d.x, y: d.y } : a
              ));
            }}
            onResizeStop={(e, dir, ref, delta, position) => {
              setArrows(prev => prev.map(a => 
                a.id === arrow.id 
                  ? { ...a, width: parseInt(ref.style.width), height: parseInt(ref.style.height), x: position.x, y: position.y }
                  : a
              ));
            }}
            minWidth={50}
            minHeight={20}
            bounds="window"
            disableDragging={isLocked}
            enableResizing={!isLocked}
            lockAspectRatio={false}
            className={isLocked ? "cursor-default" : "cursor-move"}
            cancel=".rotate-btn"
            style={{ zIndex: 30 }}
          >
            <div className="relative w-full h-full group">
              {/* Rotated image layer */}
              <div 
                className="w-full h-full"
                style={{ transform: `rotate(${arrow.rotation}deg)`, transformOrigin: 'center' }}
              >
                <img 
                  src={blueArrowImg} 
                  alt={`${arrow.color} Arrow`}
                  className="w-full h-full object-fill"
                  style={
                    arrow.color === 'yellow' ? { filter: 'hue-rotate(60deg) saturate(1.5)' } : 
                    arrow.color === 'purple' ? { filter: 'hue-rotate(270deg) saturate(1.2)' } : 
                    undefined
                  }
                  draggable={false}
                />
              </div>
              {/* Rotation Button Overlay - not rotated */}
              {!isLocked && (
                <button
                  className="rotate-btn absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                             w-8 h-8 rounded-full bg-blue-500/80 hover:bg-blue-600 
                             flex items-center justify-center shadow-lg 
                             transition-all duration-200 z-10
                             opacity-0 group-hover:opacity-100"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleRotateArrow(arrow.id);
                  }}
                  title={`Rotate 90° (current: ${arrow.rotation}°)`}
                >
                  <RotateCw className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </Rnd>
        ))}

        {/* Render vertical arrows */}
        {verticalArrows.map((vArrow) => (
          <Rnd
            key={vArrow.id}
            position={{ x: vArrow.x, y: vArrow.y }}
            size={{ width: vArrow.width, height: vArrow.height }}
            onDragStop={(e, d) => {
              setVerticalArrows(prev => prev.map(va => 
                va.id === vArrow.id ? { ...va, x: d.x, y: d.y } : va
              ));
            }}
            onResizeStop={(e, dir, ref, delta, position) => {
              setVerticalArrows(prev => prev.map(va => 
                va.id === vArrow.id 
                  ? { ...va, height: parseInt(ref.style.height), x: position.x, y: position.y }
                  : va
              ));
            }}
            minWidth={24}
            minHeight={50}
            maxWidth={24}
            bounds="window"
            disableDragging={isLocked}
            enableResizing={!isLocked ? { 
              top: true, 
              bottom: true, 
              left: false, 
              right: false,
              topLeft: false,
              topRight: false,
              bottomLeft: false,
              bottomRight: false
            } : false}
            className={isLocked ? "cursor-default" : "cursor-move"}
            style={{ zIndex: 35 }}
          >
            <VerticalArrow 
              width={vArrow.width} 
              height={vArrow.height} 
              color="#53B1D8"
            />
          </Rnd>
        ))}

        {/* Dashed Line 1 */}
        <Rnd
          position={dashedLine1Position}
          size={dashedLine1Size}
          onDragStop={(e, d) => setDashedLine1Position({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setDashedLine1Size({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setDashedLine1Position(position);
          }}
          minWidth={50}
          minHeight={2}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
        >
          <div className="relative w-full h-full group">
            <div 
              className="w-full h-full flex items-center"
              style={{ 
                borderTop: '3px dashed black',
                transform: `rotate(${dashedLine1Rotation}deg)`,
                transformOrigin: 'center'
              }}
            />
            {!isLocked && (
              <button
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                           w-6 h-6 rounded-full bg-gray-700/80 hover:bg-gray-800 
                           flex items-center justify-center shadow-lg 
                           transition-all duration-200 z-10
                           opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDashedLine1Rotation((prev) => (prev + 90) % 360);
                }}
                title={`Rotate 90° (current: ${dashedLine1Rotation}°)`}
              >
                <RotateCw className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        </Rnd>

        {/* Dashed Line 2 */}
        <Rnd
          position={dashedLine2Position}
          size={dashedLine2Size}
          onDragStop={(e, d) => setDashedLine2Position({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setDashedLine2Size({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setDashedLine2Position(position);
          }}
          minWidth={50}
          minHeight={2}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
        >
          <div className="relative w-full h-full group">
            <div 
              className="w-full h-full flex items-center"
              style={{ 
                borderTop: '3px dashed black',
                transform: `rotate(${dashedLine2Rotation}deg)`,
                transformOrigin: 'center'
              }}
            />
            {!isLocked && (
              <button
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                           w-6 h-6 rounded-full bg-gray-700/80 hover:bg-gray-800 
                           flex items-center justify-center shadow-lg 
                           transition-all duration-200 z-10
                           opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDashedLine2Rotation((prev) => (prev + 90) % 360);
                }}
                title={`Rotate 90° (current: ${dashedLine2Rotation}°)`}
              >
                <RotateCw className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        </Rnd>

        {/* Dashed Line 3 */}
        <Rnd
          position={dashedLine3Position}
          size={dashedLine3Size}
          onDragStop={(e, d) => setDashedLine3Position({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setDashedLine3Size({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setDashedLine3Position(position);
          }}
          minWidth={50}
          minHeight={2}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
        >
          <div className="relative w-full h-full group">
            <div 
              className="w-full h-full flex items-center"
              style={{ 
                borderTop: '3px dashed black',
                transform: `rotate(${dashedLine3Rotation}deg)`,
                transformOrigin: 'center'
              }}
            />
            {!isLocked && (
              <button
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                           w-6 h-6 rounded-full bg-gray-700/80 hover:bg-gray-800 
                           flex items-center justify-center shadow-lg 
                           transition-all duration-200 z-10
                           opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDashedLine3Rotation((prev) => (prev + 90) % 360);
                }}
                title={`Rotate 90° (current: ${dashedLine3Rotation}°)`}
              >
                <RotateCw className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        </Rnd>

        {/* Dashed Line 4 */}
        <Rnd
          position={dashedLine4Position}
          size={dashedLine4Size}
          onDragStop={(e, d) => setDashedLine4Position({ x: d.x, y: d.y })}
          onResizeStop={(e, dir, ref, delta, position) => {
            setDashedLine4Size({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            });
            setDashedLine4Position(position);
          }}
          minWidth={50}
          minHeight={2}
          bounds="parent"
          disableDragging={isLocked}
          enableResizing={!isLocked}
          className={isLocked ? "cursor-default" : "cursor-move"}
        >
          <div className="relative w-full h-full group">
            <div 
              className="w-full h-full flex items-center"
              style={{ 
                borderTop: '3px dashed black',
                transform: `rotate(${dashedLine4Rotation}deg)`,
                transformOrigin: 'center'
              }}
            />
            {!isLocked && (
              <button
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                           w-6 h-6 rounded-full bg-gray-700/80 hover:bg-gray-800 
                           flex items-center justify-center shadow-lg 
                           transition-all duration-200 z-10
                           opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDashedLine4Rotation((prev) => (prev + 90) % 360);
                }}
                title={`Rotate 90° (current: ${dashedLine4Rotation}°)`}
              >
                <RotateCw className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        </Rnd>

        </div>
        )}
      </div>

      {/* Alarm Banner - always visible at bottom */}
      <div className="flex-shrink-0">
        <AlarmBanner />
      </div>

      {/* VFD Faceplate Modal */}
      <Dialog open={isVFDModalOpen} onOpenChange={setIsVFDModalOpen}>
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
          />
        </DialogContent>
      </Dialog>

      {/* Sulfur Flow Controller Secondary Faceplate Modal */}
      <Dialog open={isSulfurFlowModalOpen} onOpenChange={setIsSulfurFlowModalOpen}>
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
            onSpChange={(value) => updateSulfurSP(value)}
            onOutChange={(value) => updateSulfurOUT(value)}
            onModelockOverrideChange={(active) => setSulfurFlowModelockOverride(active)}
            fromSource="home-screen"
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
      <Dialog open={isHandControllerModalOpen} onOpenChange={setIsHandControllerModalOpen}>
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
            onSpChange={(value) => updateHandControllerSP(value)}
            onOutChange={(value) => updateHandControllerOUT(value)}
            fromSource="home-screen"
          />
        </DialogContent>
      </Dialog>

      {/* Jug Valve Hand Controller 1540-H-4282 Secondary Faceplate Modal */}
      <Dialog open={isJugValveHandControllerModalOpen} onOpenChange={setIsJugValveHandControllerModalOpen}>
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
            onSpChange={(value) => updateJugValveHandControllerSP(value)}
            onOutChange={(value) => updateJugValveHandControllerOUT(value)}
            fromSource="home-screen"
          />
        </DialogContent>
      </Dialog>

      {/* WHB Hand Controller 1540-H-4283 Secondary Faceplate Modal */}
      <Dialog open={isWhbHandControllerModalOpen} onOpenChange={setIsWhbHandControllerModalOpen}>
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
            onSpChange={(value) => updateWhbHandControllerSP(value)}
            onOutChange={(value) => updateWhbHandControllerOUT(value)}
            fromSource="home-screen"
          />
        </DialogContent>
      </Dialog>
  </div>
  );
};

export default HomeScreen;
