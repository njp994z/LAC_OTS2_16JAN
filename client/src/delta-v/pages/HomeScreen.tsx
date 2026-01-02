import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
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
  ]);
  
  
  const [isLocked, setIsLocked] = useState(true);
  const [selectedScreen, setSelectedScreen] = useState("L1 – System Overview");
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
  
  // Dashed Line Rotations
  const [dashedLine1Rotation, setDashedLine1Rotation] = useState(0);
  const [dashedLine2Rotation, setDashedLine2Rotation] = useState(0);
  const [dashedLine3Rotation, setDashedLine3Rotation] = useState(0);
  
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
    instrumentTag: '1530-F-2602',
    description: 'Sulfur Flow Controller',
    pv: sulfurSyncState.syncedPV,
    sp: sulfurSyncState.syncedSP,
    out: sulfurSyncState.syncedOUT,
    mode: sulfurSyncState.syncedMode,
    pvUnits: 'GPM',
    pvRangeMin: 0,
    pvRangeMax: 100,
    alarmActive: sulfurSyncState.alarmStates.HH || sulfurSyncState.alarmStates.H || 
                 sulfurSyncState.alarmStates.L || sulfurSyncState.alarmStates.LL,
    alarmColor: (sulfurSyncState.alarmStates.HH || sulfurSyncState.alarmStates.LL) ? 'red' : 
                (sulfurSyncState.alarmStates.H || sulfurSyncState.alarmStates.L) ? 'yellow' : undefined,
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
    instrumentTag: '1540-H-4030',
    description: 'Main Compressor Hand Controller',
    pv: handControllerSyncState.syncedPV,
    sp: handControllerSyncState.syncedSP,
    out: handControllerSyncState.syncedOUT,
    mode: handControllerSyncState.syncedMode,
    pvUnits: '%',
    pvRangeMin: 0,
    pvRangeMax: 100,
    alarmActive: handControllerSyncState.alarmStates.HH || handControllerSyncState.alarmStates.H || 
                 handControllerSyncState.alarmStates.L || handControllerSyncState.alarmStates.LL,
    alarmColor: (handControllerSyncState.alarmStates.HH || handControllerSyncState.alarmStates.LL) ? 'red' : 
                (handControllerSyncState.alarmStates.H || handControllerSyncState.alarmStates.L) ? 'yellow' : undefined,
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
      setLocation('/valve/flow-control/1540-fcv-2602/3e');
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

  const handleSaveLayout = async () => {
    setIsSaving(true);
    // Simulate save - layout positions are maintained in React state for this session
    setTimeout(() => {
      toast({ title: "Layout saved", description: "Icon positions saved for this session." });
      setIsSaving(false);
    }, 300);
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* DeltaV Live Toolbar */}
      <div className="bg-gray-100 border-b border-gray-300 px-2 py-1 flex items-center justify-between">
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
          </TooltipProvider>

          {/* Homescreen Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="bg-gray-700 text-white hover:bg-gray-600 hover:text-white px-3 py-1 text-sm h-8"
              >
                {selectedScreen}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white z-50">
              {homescreenOptions.map((option) => (
                <DropdownMenuItem 
                  key={option.id}
                  onClick={() => setSelectedScreen(option.label)}
                  className={selectedScreen === option.label ? "bg-gray-100" : ""}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
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

      {/* Main content area */}
      <div className="flex-1 relative">
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

      </div>

      {/* Alarm Banner */}
      <AlarmBanner />

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
          />
        </DialogContent>
      </Dialog>
  </div>
  );
};

export default HomeScreen;
