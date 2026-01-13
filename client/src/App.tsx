import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/contexts/SessionContext";
import { ControllerSyncProvider } from "@/delta-v/contexts/ControllerSyncContext";
import { ControllerConfigProvider } from "@/delta-v/contexts/ControllerConfigContext";
import { CompressorProvider } from "@/delta-v/contexts/CompressorContext";
import Landing from "@/pages/landing";

import HomeScreen from "@/delta-v/pages/HomeScreen";
import EquipmentFaceplates from "@/delta-v/pages/EquipmentFaceplates";
import ControllerFaceplates from "@/delta-v/pages/ControllerFaceplates";
import SensorFaceplate from "@/delta-v/pages/SensorFaceplate";
import ValveFaceplate from "@/delta-v/pages/ValveFaceplate";
import AlarmFaceplate from "@/delta-v/pages/AlarmFaceplate";
import CompressorFaceplate from "@/delta-v/pages/CompressorFaceplate";
import TurboGeneratorFaceplate from "@/delta-v/pages/TurboGeneratorFaceplate";
import TemperatureControllerFaceplates from "@/delta-v/pages/TemperatureControllerFaceplates";
import LevelControllerFaceplate from "@/delta-v/pages/LevelControllerFaceplate";
import ConcentrationControllerFaceplate from "@/delta-v/pages/ConcentrationControllerFaceplate";
import FlowControllerFaceplate from "@/delta-v/pages/FlowControllerFaceplate";
import SulfurFlowControllerFaceplate from "@/delta-v/pages/SulfurFlowControllerFaceplate";
import SulfurFlowControllerFaceplateMain from "@/delta-v/pages/SulfurFlowControllerFaceplateMain";
import MainCompressorHandControllerFaceplate from "@/delta-v/pages/MainCompressorHandControllerFaceplate";
import MainCompressorHandControllerFaceplateMain from "@/delta-v/pages/MainCompressorHandControllerFaceplateMain";
import HandController4030Faceplate3A from "@/delta-v/pages/HandController4030Faceplate3A";
import HandController4030Faceplate3B from "@/delta-v/pages/HandController4030Faceplate3B";
import HandController4030Faceplate3C from "@/delta-v/pages/HandController4030Faceplate3C";
import HandController4030Faceplate3D from "@/delta-v/pages/HandController4030Faceplate3D";
import HandController4030Faceplate3E from "@/delta-v/pages/HandController4030Faceplate3E";
import HandController4030Faceplate3F from "@/delta-v/pages/HandController4030Faceplate3F";
import JugValveHandControllerFaceplate from "@/delta-v/pages/JugValveHandControllerFaceplate";
import JugValveHandControllerFaceplateMain from "@/delta-v/pages/JugValveHandControllerFaceplateMain";
import HandController4282Faceplate3A from "@/delta-v/pages/HandController4282Faceplate3A";
import HandController4282Faceplate3B from "@/delta-v/pages/HandController4282Faceplate3B";
import HandController4282Faceplate3C from "@/delta-v/pages/HandController4282Faceplate3C";
import HandController4282Faceplate3D from "@/delta-v/pages/HandController4282Faceplate3D";
import HandController4282Faceplate3E from "@/delta-v/pages/HandController4282Faceplate3E";
import HandController4282Faceplate3F from "@/delta-v/pages/HandController4282Faceplate3F";
import WHBOutletHandControllerFaceplate from "@/delta-v/pages/WHBOutletHandControllerFaceplate";
import WHBOutletHandControllerFaceplateMain from "@/delta-v/pages/WHBOutletHandControllerFaceplateMain";
import HandController4283Faceplate3A from "@/delta-v/pages/HandController4283Faceplate3A";
import HandController4283Faceplate3B from "@/delta-v/pages/HandController4283Faceplate3B";
import HandController4283Faceplate3C from "@/delta-v/pages/HandController4283Faceplate3C";
import HandController4283Faceplate3D from "@/delta-v/pages/HandController4283Faceplate3D";
import HandController4283Faceplate3E from "@/delta-v/pages/HandController4283Faceplate3E";
import HandController4283Faceplate3F from "@/delta-v/pages/HandController4283Faceplate3F";
import HandIndicatedControllerFaceplate from "@/delta-v/pages/HandIndicatedControllerFaceplate";
import ControllerFaceplate from "@/delta-v/pages/ControllerFaceplate";
import SecondaryControllerFaceplate from "@/delta-v/pages/SecondaryControllerFaceplate";
import TemperatureSensorsPage from "@/delta-v/pages/TemperatureSensorsPage";
import TempSensorDetail from "@/delta-v/pages/TempSensorDetail";
import PressureSensorsPage from "@/delta-v/pages/PressureSensorsPage";
import PressureSensorDetail from "@/delta-v/pages/PressureSensorDetail";
import LevelSensorsPage from "@/delta-v/pages/LevelSensorsPage";
import LevelSensorDetail from "@/delta-v/pages/LevelSensorDetail";
import PositionSensorsPage from "@/delta-v/pages/PositionSensorsPage";
import PositionSensorDetail from "@/delta-v/pages/PositionSensorDetail";
import ValveTypeDetail from "@/delta-v/pages/ValveTypeDetail";
import FlowControlValveDetail from "@/delta-v/pages/FlowControlValveDetail";
import FlowControlValve3E from "@/delta-v/pages/FlowControlValve3E";
import TempControlValveDetail from "@/delta-v/pages/TempControlValveDetail";
import HandControlValveDetail from "@/delta-v/pages/HandControlValveDetail";
import JugValveDetail from "@/delta-v/pages/JugValveDetail";
import JugValve3E from "@/delta-v/pages/JugValve3E";
import JugValvePositionerDetail from "@/delta-v/pages/JugValvePositionerDetail";
import JugValvePositioner3E from "@/delta-v/pages/JugValvePositioner3E";
import Faceplate3A from "@/delta-v/pages/Faceplate3A";
import Faceplate3B from "@/delta-v/pages/Faceplate3B";
import Faceplate3C from "@/delta-v/pages/Faceplate3C";
import Faceplate3D from "@/delta-v/pages/Faceplate3D";
import Faceplate3E from "@/delta-v/pages/Faceplate3E";
import Faceplate3F from "@/delta-v/pages/Faceplate3F";
import VFDSettings from "@/delta-v/pages/VFDSettings";
import VFDHistory from "@/delta-v/pages/VFDHistory";
import VFDTrends from "@/delta-v/pages/VFDTrends";
import VFDLinks from "@/delta-v/pages/VFDLinks";
import VFDCompare from "@/delta-v/pages/VFDCompare";
import VFDAlarms from "@/delta-v/pages/VFDAlarms";
import TempSensor5821Landing from "@/delta-v/pages/TempSensor5821Landing";
import TempSensor5821Main from "@/delta-v/pages/TempSensor5821Main";
import TempSensor5821Faceplate3A from "@/delta-v/pages/TempSensor5821Faceplate3A";
import TempSensor5821Faceplate3B from "@/delta-v/pages/TempSensor5821Faceplate3B";
import TempSensor5821Faceplate3C from "@/delta-v/pages/TempSensor5821Faceplate3C";
import TempSensor5821Faceplate3D from "@/delta-v/pages/TempSensor5821Faceplate3D";
import TempSensor5821Faceplate3E from "@/delta-v/pages/TempSensor5821Faceplate3E";
import TempSensor5821Faceplate3F from "@/delta-v/pages/TempSensor5821Faceplate3F";
import TempSensor4200ALanding from "@/delta-v/pages/TempSensor4200ALanding";
import TempSensor4200AMain from "@/delta-v/pages/TempSensor4200AMain";
import TempSensor4200AFaceplate3A from "@/delta-v/pages/TempSensor4200AFaceplate3A";
import TempSensor4200AFaceplate3B from "@/delta-v/pages/TempSensor4200AFaceplate3B";
import TempSensor4200AFaceplate3C from "@/delta-v/pages/TempSensor4200AFaceplate3C";
import TempSensor4200AFaceplate3D from "@/delta-v/pages/TempSensor4200AFaceplate3D";
import TempSensor4200AFaceplate3E from "@/delta-v/pages/TempSensor4200AFaceplate3E";
import TempSensor4200AFaceplate3F from "@/delta-v/pages/TempSensor4200AFaceplate3F";
import TempSensor4200BLanding from "@/delta-v/pages/TempSensor4200BLanding";
import TempSensor4200BMain from "@/delta-v/pages/TempSensor4200BMain";
import TempSensor4200BFaceplate3A from "@/delta-v/pages/TempSensor4200BFaceplate3A";
import TempSensor4200BFaceplate3B from "@/delta-v/pages/TempSensor4200BFaceplate3B";
import TempSensor4200BFaceplate3C from "@/delta-v/pages/TempSensor4200BFaceplate3C";
import TempSensor4200BFaceplate3D from "@/delta-v/pages/TempSensor4200BFaceplate3D";
import TempSensor4200BFaceplate3E from "@/delta-v/pages/TempSensor4200BFaceplate3E";
import TempSensor4200BFaceplate3F from "@/delta-v/pages/TempSensor4200BFaceplate3F";
import TempSensor4200CLanding from "@/delta-v/pages/TempSensor4200CLanding";
import TempSensor4200CMain from "@/delta-v/pages/TempSensor4200CMain";
import TempSensor4200CFaceplate3A from "@/delta-v/pages/TempSensor4200CFaceplate3A";
import TempSensor4200CFaceplate3B from "@/delta-v/pages/TempSensor4200CFaceplate3B";
import TempSensor4200CFaceplate3C from "@/delta-v/pages/TempSensor4200CFaceplate3C";
import TempSensor4200CFaceplate3D from "@/delta-v/pages/TempSensor4200CFaceplate3D";
import TempSensor4200CFaceplate3F from "@/delta-v/pages/TempSensor4200CFaceplate3F";
import TempSensor4820Landing from "@/delta-v/pages/TempSensor4820Landing";
import TempSensor4820Main from "@/delta-v/pages/TempSensor4820Main";
import TempSensor4820Faceplate3C from "@/delta-v/pages/TempSensor4820Faceplate3C";
import TempSensor4820Faceplate3D from "@/delta-v/pages/TempSensor4820Faceplate3D";
import TempSensor4820Faceplate3F from "@/delta-v/pages/TempSensor4820Faceplate3F";
import TempSensor4825Landing from "@/delta-v/pages/TempSensor4825Landing";
import TempSensor4825Main from "@/delta-v/pages/TempSensor4825Main";
import TempSensor4825Faceplate3C from "@/delta-v/pages/TempSensor4825Faceplate3C";
import TempSensor4825Faceplate3D from "@/delta-v/pages/TempSensor4825Faceplate3D";
import TempSensor4825Faceplate3F from "@/delta-v/pages/TempSensor4825Faceplate3F";
import TempSensor4827Landing from "@/delta-v/pages/TempSensor4827Landing";
import TempSensor4827Main from "@/delta-v/pages/TempSensor4827Main";
import TempSensor4827Faceplate3C from "@/delta-v/pages/TempSensor4827Faceplate3C";
import TempSensor4827Faceplate3D from "@/delta-v/pages/TempSensor4827Faceplate3D";
import TempSensor4827Faceplate3F from "@/delta-v/pages/TempSensor4827Faceplate3F";
import Login from "@/pages/login";
import Demo from "@/pages/demo";
import Settings from "@/pages/settings";
import EquipmentSettings from "@/pages/equipment-settings";
import ConverterSettings from "@/pages/converter-settings";
import CatalystParameterDatabase from "@/pages/catalyst-parameter-database";
import ConverterCases from "@/pages/converter-cases";
import SimulationOperatingInstructions from "@/pages/simulation-operating-instructions";
import DifferentialEquationsEngineering from "@/pages/differential-equations-engineering";
import StaticSimulation from "@/pages/static-simulation";
import DynamicSimulation from "@/pages/dynamic-simulation";
import UnitOperationSimulator from "@/pages/unit-operation-simulator";
import CatalyticReactor from "@/pages/unit-operation/catalytic-reactor";
import ConverterSimulations from "@/pages/unit-operation/converter-simulations";
import GasGasHeatExchanger from "@/pages/unit-operation/gas-gas-heat-exchanger";
import SulfuricAcidTower from "@/pages/unit-operation/sulfuric-acid-tower";
import WasteHeatBoiler from "@/pages/unit-operation/waste-heat-boiler";
import Superheater from "@/pages/unit-operation/superheater";
import AcidCooler from "@/pages/unit-operation/acid-cooler";
import Economizer from "@/pages/unit-operation/economizer";
import TailGasScrubber from "@/pages/unit-operation/tail-gas-scrubber";
import SulfurFurnace from "@/pages/unit-operation/sulfur-furnace";
import Deaerator from "@/pages/unit-operation/deaerator";
import TurboGenerator from "@/pages/unit-operation/turbo-generator";
import StartUpBurner from "@/pages/unit-operation/start-up-burner";
import FinFanCooler from "@/pages/unit-operation/fin-fan-cooler";
import AirCooledCondenser from "@/pages/unit-operation/air-cooled-condenser";
import MainCompressor from "@/pages/unit-operation/main-compressor";
import MainCompressorPythonCode from "@/pages/unit-operation/main-compressor-python-code";
import AcidHydraulics from "@/pages/unit-operation/acid-hydraulics";
import SulfurControlHydraulics from "@/pages/unit-operation/sulfur-control-hydraulics";
import SulfurControlPythonCodeGui from "@/pages/unit-operation/sulfur-control-python-code-gui";
import SulfurControlPythonCodeStatic from "@/pages/unit-operation/sulfur-control-python-code-static";
import SulfurControlPythonCodeDynamic from "@/pages/unit-operation/sulfur-control-python-code-dynamic";
import AbsorbingTowerCircuit from "@/pages/unit-operation/absorbing-tower-circuit";
import DryingTowerCircuit from "@/pages/unit-operation/drying-tower-circuit";
import DryingTowerCircuitPythonCode from "@/pages/unit-operation/drying-tower-circuit-python-code";
import ProfitMaximizer from "@/pages/profit-maximizer";
import ESDTrainer from "@/pages/esd-trainer";
import OTSLearningHub from "@/pages/ots-learning-hub";
import DailyOperationsPlaybook from "@/pages/daily-operations-playbook";
import MaintenanceMastery from "@/pages/maintenance-mastery";
import CapitalProjectsAccelerator from "@/pages/capital-projects-accelerator";
import SafetyFirstAcademy from "@/pages/safety-first-academy";
import AcidPlantDocumentVault from "@/pages/acid-plant-document-vault";
import SulfuricAcidTechnologyDeepDive from "@/pages/sulfuric-acid-technology-deep-dive";
import OTSInstructionsVideos from "@/pages/ots-instructions-videos";
import Simulator from "@/pages/simulator";
import SimulationSettings from "@/pages/simulation-settings";
import EconomicsCosts from "@/pages/settings/economics-costs";
import InputVariables from "@/pages/settings/input-variables";
import ChemicalProperties from "@/pages/settings/chemical-properties";
import PureComponent from "@/pages/settings/chemical-properties/pure-component";
import BinaryInteraction from "@/pages/settings/chemical-properties/binary-interaction";
import HenrysLaw from "@/pages/settings/chemical-properties/henrys-law";
import GasHeatCapacity from "@/pages/settings/chemical-properties/gas-heat-capacity";
import PsychrometricData from "@/pages/settings/chemical-properties/psychrometric-data";
import GasPhaseViscosities from "@/pages/settings/chemical-properties/gas-phase-viscosities";
import OutputVariables from "@/pages/settings/output-variables";
import SetPointVariables from "@/pages/settings/output-variables/set-point-variables";
import ManipulatedVariables from "@/pages/settings/output-variables/manipulated-variables";
import ProcessVariables from "@/pages/settings/output-variables/process-variables";
import PVSPComparison from "@/pages/settings/output-variables/pv-sp-comparison";
import EquipmentSizesSettings from "@/pages/settings/equipment-sizes";
import EquipmentList from "@/pages/settings/equipment-list";
import InterlockLogic from "@/pages/settings/interlock-logic";
import LogicList from "@/pages/settings/interlock-logic/logic-list";
import SpreadsheetLogic from "@/pages/settings/interlock-logic/spreadsheet-logic";
import ControllerTuning from "@/pages/settings/controller-tuning";
import UnitOperationsSettings from "@/pages/settings/unit-operations";
import RunHistorian from "@/pages/settings/run-historian";
import ControllerOutputs from "@/pages/settings/controller-outputs";
import PvOutputMessages from "@/pages/settings/controller-outputs/pv-output-messages";
import ValveStatus from "@/pages/settings/controller-outputs/valve-status";
import Symbols from "@/pages/settings/controller-outputs/symbols";
import Faceplates from "@/pages/settings/controller-outputs/faceplates";
import SensorOutputs from "@/pages/settings/controller-outputs/sensor-outputs";
import SimulationAlgorithms from "@/pages/settings/simulation-algorithms";
import StaticSimulationAlgorithm from "@/pages/settings/simulation-algorithms/static-simulation";
import DynamicSimulationAlgorithm from "@/pages/settings/simulation-algorithms/dynamic-simulation";
import PlantStartup from "@/pages/settings/simulation-algorithms/plant-startup";
import EmergencyScenarios from "@/pages/settings/simulation-algorithms/emergency-scenarios";
import InstrumentIndex from "@/pages/settings/instrument-index";
import ModelPallet from "@/pages/settings/model-pallet";
import Databases from "@/pages/settings/databases";
import PlantDocumentLibrary from "@/pages/settings/plant-document-library";
import CatalyticReactorPythonCode from "@/pages/unit-operation/catalytic-reactor-python-code";
import AdminUsers from "@/pages/admin-users";
import NotFound from "@/pages/not-found";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/demo" component={Demo} />
      <Route path="/settings" component={Settings} />
      <Route path="/equipment-settings" component={EquipmentSettings} />
      <Route path="/converter-settings" component={ConverterSettings} />
      <Route path="/catalyst-parameter-database" component={CatalystParameterDatabase} />
      <Route path="/converter-cases" component={ConverterCases} />
      <Route path="/simulation-operating-instructions" component={SimulationOperatingInstructions} />
      <Route path="/differential-equations-engineering" component={DifferentialEquationsEngineering} />
      <Route path="/static-simulation" component={StaticSimulation} />
      <Route path="/dynamic-simulation" component={DynamicSimulation} />
      <Route path="/unit-operation-simulator" component={UnitOperationSimulator} />
      <Route path="/unit-operation/catalytic-reactor/python-code" component={CatalyticReactorPythonCode} />
      <Route path="/unit-operation/converter-simulations" component={ConverterSimulations} />
      <Route path="/unit-operation/catalytic-reactor" component={CatalyticReactor} />
      <Route path="/unit-operation/gas-gas-heat-exchanger" component={GasGasHeatExchanger} />
      <Route path="/unit-operation/sulfuric-acid-tower" component={SulfuricAcidTower} />
      <Route path="/unit-operation/waste-heat-boiler" component={WasteHeatBoiler} />
      <Route path="/unit-operation/superheater" component={Superheater} />
      <Route path="/unit-operation/acid-cooler" component={AcidCooler} />
      <Route path="/unit-operation/economizer" component={Economizer} />
      <Route path="/unit-operation/tail-gas-scrubber" component={TailGasScrubber} />
      <Route path="/unit-operation/sulfur-furnace" component={SulfurFurnace} />
      <Route path="/unit-operation/deaerator" component={Deaerator} />
      <Route path="/unit-operation/turbo-generator" component={TurboGenerator} />
      <Route path="/unit-operation/start-up-burner" component={StartUpBurner} />
      <Route path="/unit-operation/fin-fan-cooler" component={FinFanCooler} />
      <Route path="/unit-operation/air-cooled-condenser" component={AirCooledCondenser} />
      <Route path="/unit-operation/main-compressor/python-code" component={MainCompressorPythonCode} />
      <Route path="/unit-operation/main-compressor" component={MainCompressor} />
      <Route path="/unit-operation/acid-hydraulics/absorbing-tower-circuit" component={AbsorbingTowerCircuit} />
      <Route path="/unit-operation/acid-hydraulics/drying-tower-circuit/python-code" component={DryingTowerCircuitPythonCode} />
      <Route path="/unit-operation/sulfur-control-hydraulics" component={SulfurControlHydraulics} />
      <Route path="/unit-operation/sulfur-control-hydraulics/python-code/gui" component={SulfurControlPythonCodeGui} />
      <Route path="/unit-operation/sulfur-control-hydraulics/python-code/static" component={SulfurControlPythonCodeStatic} />
      <Route path="/unit-operation/sulfur-control-hydraulics/python-code/dynamic" component={SulfurControlPythonCodeDynamic} />
      <Route path="/unit-operation/acid-hydraulics/drying-tower-circuit" component={DryingTowerCircuit} />
      <Route path="/unit-operation/acid-hydraulics" component={AcidHydraulics} />
      <Route path="/profit-maximizer" component={ProfitMaximizer} />
      <Route path="/esd-trainer" component={ESDTrainer} />
      <Route path="/ots-learning-hub" component={OTSLearningHub} />
      <Route path="/daily-operations-playbook" component={DailyOperationsPlaybook} />
      <Route path="/maintenance-mastery" component={MaintenanceMastery} />
      <Route path="/capital-projects-accelerator" component={CapitalProjectsAccelerator} />
      <Route path="/safety-first-academy" component={SafetyFirstAcademy} />
      <Route path="/acid-plant-document-vault" component={AcidPlantDocumentVault} />
      <Route path="/sulfuric-acid-technology-deep-dive" component={SulfuricAcidTechnologyDeepDive} />
      <Route path="/ots-instructions-videos" component={OTSInstructionsVideos} />
      <Route path="/simulation-settings" component={SimulationSettings} />
      <Route path="/settings/economics-costs" component={EconomicsCosts} />
      <Route path="/settings/input-variables" component={InputVariables} />
      <Route path="/settings/chemical-properties/pure-component" component={PureComponent} />
      <Route path="/settings/chemical-properties/binary-interaction" component={BinaryInteraction} />
      <Route path="/settings/chemical-properties/henrys-law" component={HenrysLaw} />
      <Route path="/settings/chemical-properties/gas-heat-capacity" component={GasHeatCapacity} />
      <Route path="/settings/chemical-properties/psychrometric-data" component={PsychrometricData} />
      <Route path="/settings/chemical-properties/gas-phase-viscosities" component={GasPhaseViscosities} />
      <Route path="/settings/chemical-properties" component={ChemicalProperties} />
      <Route path="/settings/output-variables" component={OutputVariables} />
      <Route path="/settings/output-variables/set-point-variables" component={SetPointVariables} />
      <Route path="/settings/output-variables/manipulated-variables" component={ManipulatedVariables} />
      <Route path="/settings/output-variables/process-variables" component={ProcessVariables} />
      <Route path="/settings/output-variables/pv-sp-comparison" component={PVSPComparison} />
      <Route path="/settings/equipment-sizes" component={EquipmentSizesSettings} />
      <Route path="/settings/equipment-sizes/equipment-list" component={EquipmentList} />
      <Route path="/settings/interlock-logic/logic-list" component={LogicList} />
      <Route path="/settings/interlock-logic/spreadsheet-logic" component={SpreadsheetLogic} />
      <Route path="/settings/interlock-logic" component={InterlockLogic} />
      <Route path="/settings/controller-tuning" component={ControllerTuning} />
      <Route path="/settings/unit-operations" component={UnitOperationsSettings} />
      <Route path="/settings/run-historian" component={RunHistorian} />
      <Route path="/settings/controller-outputs/faceplates" component={Faceplates} />
      
      {/* Delta-V Faceplate Routes - Main Entry Points */}
      <Route path="/settings/controller-outputs/faceplates/home-screen" component={HomeScreen} />
      <Route path="/settings/controller-outputs/faceplates/rotating-equipment" component={EquipmentFaceplates} />
      <Route path="/settings/controller-outputs/faceplates/controller-blocks" component={ControllerFaceplates} />
      <Route path="/settings/controller-outputs/faceplates/sensor-blocks" component={SensorFaceplate} />
      <Route path="/settings/controller-outputs/faceplates/valve-blocks" component={ValveFaceplate} />
      <Route path="/settings/controller-outputs/faceplates/valve-blocks/:valveType" component={ValveTypeDetail} />
      <Route path="/settings/controller-outputs/faceplates/valve-blocks/flow-control/1540-fcv-2602" component={FlowControlValveDetail} />
      <Route path="/settings/controller-outputs/faceplates/valve-blocks/flow-control/1540-fcv-2602/3e" component={FlowControlValve3E} />
      <Route path="/settings/controller-outputs/faceplates/valve-blocks/flow-control/1520-fcv-5870" component={FlowControlValveDetail} />
      <Route path="/settings/controller-outputs/faceplates/valve-blocks/flow-control/1520-fcv-6770" component={FlowControlValveDetail} />
      <Route path="/settings/controller-outputs/faceplates/valve-blocks/flow-control/1520-fcv-6670" component={FlowControlValveDetail} />
      <Route path="/settings/controller-outputs/faceplates/valve-blocks/temperature-control/:id" component={TempControlValveDetail} />
      <Route path="/settings/controller-outputs/faceplates/valve-blocks/hand-control/:id" component={HandControlValveDetail} />
      <Route path="/settings/controller-outputs/faceplates/valve-blocks/hand-control/1540-hcv-4282" component={JugValveDetail} />
      <Route path="/settings/controller-outputs/faceplates/valve-blocks/hand-control/1540-hcv-4282/3e" component={JugValve3E} />
      <Route path="/settings/controller-outputs/faceplates/valve-blocks/hand-control/1540-hcv-4281" component={JugValvePositionerDetail} />
      <Route path="/settings/controller-outputs/faceplates/valve-blocks/hand-control/1540-hcv-4281/3e" component={JugValvePositioner3E} />
      <Route path="/settings/controller-outputs/faceplates/alarm-blocks" component={AlarmFaceplate} />
      
      {/* Delta-V Controller Faceplates */}
      <Route path="/settings/controller-outputs/faceplates/temperature-controller" component={TemperatureControllerFaceplates} />
      <Route path="/settings/controller-outputs/faceplates/controller-6622" component={ControllerFaceplate} />
      <Route path="/settings/controller-outputs/faceplates/level-controller" component={LevelControllerFaceplate} />
      <Route path="/settings/controller-outputs/faceplates/concentration-controller" component={ConcentrationControllerFaceplate} />
      <Route path="/settings/controller-outputs/faceplates/flow-controller" component={FlowControllerFaceplate} />
      <Route path="/settings/controller-outputs/faceplates/sulfur-flow-controller" component={SulfurFlowControllerFaceplate} />
      <Route path="/settings/controller-outputs/faceplates/sulfur-flow-controller-main" component={SulfurFlowControllerFaceplateMain} />
      <Route path="/settings/controller-outputs/faceplates/sulfur-flow-controller-faceplate-3a" component={Faceplate3A} />
      <Route path="/settings/controller-outputs/faceplates/sulfur-flow-controller-faceplate-3b" component={Faceplate3B} />
      <Route path="/settings/controller-outputs/faceplates/sulfur-flow-controller-faceplate-3c" component={Faceplate3C} />
      <Route path="/settings/controller-outputs/faceplates/sulfur-flow-controller-faceplate-3d" component={Faceplate3D} />
      <Route path="/settings/controller-outputs/faceplates/sulfur-flow-controller-faceplate-3e" component={Faceplate3E} />
      <Route path="/settings/controller-outputs/faceplates/sulfur-flow-controller-faceplate-3f" component={Faceplate3F} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4030" component={MainCompressorHandControllerFaceplate} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4030-main" component={MainCompressorHandControllerFaceplateMain} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4030-faceplate-3a" component={HandController4030Faceplate3A} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4030-faceplate-3b" component={HandController4030Faceplate3B} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4030-faceplate-3c" component={HandController4030Faceplate3C} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4030-faceplate-3d" component={HandController4030Faceplate3D} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4030-faceplate-3e" component={HandController4030Faceplate3E} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4030-faceplate-3f" component={HandController4030Faceplate3F} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4282-jug" component={JugValveHandControllerFaceplate} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4282-main" component={JugValveHandControllerFaceplateMain} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4282-faceplate-3a" component={HandController4282Faceplate3A} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4282-faceplate-3b" component={HandController4282Faceplate3B} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4282-faceplate-3c" component={HandController4282Faceplate3C} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4282-faceplate-3d" component={HandController4282Faceplate3D} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4282-faceplate-3e" component={HandController4282Faceplate3E} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4282-faceplate-3f" component={HandController4282Faceplate3F} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4283-whb" component={WHBOutletHandControllerFaceplate} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4283-main" component={WHBOutletHandControllerFaceplateMain} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4283-faceplate-3a" component={HandController4283Faceplate3A} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4283-faceplate-3b" component={HandController4283Faceplate3B} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4283-faceplate-3c" component={HandController4283Faceplate3C} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4283-faceplate-3d" component={HandController4283Faceplate3D} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4283-faceplate-3e" component={HandController4283Faceplate3E} />
      <Route path="/settings/controller-outputs/faceplates/hand-controller-4283-faceplate-3f" component={HandController4283Faceplate3F} />
      <Route path="/settings/controller-outputs/faceplates/hand-indicated-controller" component={HandIndicatedControllerFaceplate} />
      <Route path="/settings/controller-outputs/faceplates/controller" component={ControllerFaceplate} />
      <Route path="/settings/controller-outputs/faceplates/controller-secondary" component={SecondaryControllerFaceplate} />
      
      {/* Delta-V Sensor Faceplates */}
      <Route path="/settings/controller-outputs/faceplates/temperature-sensors" component={TemperatureSensorsPage} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor/:sensorId" component={TempSensorDetail} />
      <Route path="/settings/controller-outputs/faceplates/pressure-sensors" component={PressureSensorsPage} />
      <Route path="/settings/controller-outputs/faceplates/pressure-sensor/:sensorId" component={PressureSensorDetail} />
      <Route path="/settings/controller-outputs/faceplates/level-sensors" component={LevelSensorsPage} />
      <Route path="/settings/controller-outputs/faceplates/level-sensor/:sensorId" component={LevelSensorDetail} />
      <Route path="/settings/controller-outputs/faceplates/position-sensors" component={PositionSensorsPage} />
      <Route path="/settings/controller-outputs/faceplates/position-sensor/:sensorId" component={PositionSensorDetail} />
      
      {/* Delta-V Temperature Sensor Detail Pages */}
      <Route path="/settings/controller-outputs/faceplates/temp-sensor/1520-TI-5821" component={TempSensor5821Landing} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor/1540-TI-4200A" component={TempSensor4200ALanding} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-5821-main" component={TempSensor5821Main} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-5821-faceplate-3a" component={TempSensor5821Faceplate3A} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-5821-faceplate-3b" component={TempSensor5821Faceplate3B} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-5821-faceplate-3c" component={TempSensor5821Faceplate3C} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-5821-faceplate-3d" component={TempSensor5821Faceplate3D} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-5821-faceplate-3e" component={TempSensor5821Faceplate3E} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-5821-faceplate-3f" component={TempSensor5821Faceplate3F} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor/1540-TI-4200A" component={TempSensor4200ALanding} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200a-main" component={TempSensor4200AMain} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200a-faceplate-3a" component={TempSensor4200AFaceplate3A} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200a-faceplate-3b" component={TempSensor4200AFaceplate3B} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200a-faceplate-3c" component={TempSensor4200AFaceplate3C} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200a-faceplate-3d" component={TempSensor4200AFaceplate3D} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200a-faceplate-3e" component={TempSensor4200AFaceplate3E} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200a-faceplate-3f" component={TempSensor4200AFaceplate3F} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor/1540-TI-4200B" component={TempSensor4200BLanding} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200b-main" component={TempSensor4200BMain} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200b-faceplate-3a" component={TempSensor4200BFaceplate3A} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200b-faceplate-3b" component={TempSensor4200BFaceplate3B} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200b-faceplate-3c" component={TempSensor4200BFaceplate3C} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200b-faceplate-3d" component={TempSensor4200BFaceplate3D} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200b-faceplate-3e" component={TempSensor4200BFaceplate3E} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200b-faceplate-3f" component={TempSensor4200BFaceplate3F} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor/1540-TI-4200C" component={TempSensor4200CLanding} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200c-main" component={TempSensor4200CMain} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200c-faceplate-3a" component={TempSensor4200CFaceplate3A} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200c-faceplate-3b" component={TempSensor4200CFaceplate3B} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200c-faceplate-3c" component={TempSensor4200CFaceplate3C} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200c-faceplate-3d" component={TempSensor4200CFaceplate3D} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4200c-faceplate-3f" component={TempSensor4200CFaceplate3F} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4820-landing" component={TempSensor4820Landing} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4820-main" component={TempSensor4820Main} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4820-faceplate-3c" component={TempSensor4820Faceplate3C} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4820-faceplate-3d" component={TempSensor4820Faceplate3D} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4820-faceplate-3f" component={TempSensor4820Faceplate3F} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4825-landing" component={TempSensor4825Landing} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4825-main" component={TempSensor4825Main} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4825-faceplate-3c" component={TempSensor4825Faceplate3C} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4825-faceplate-3d" component={TempSensor4825Faceplate3D} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4825-faceplate-3f" component={TempSensor4825Faceplate3F} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4827-landing" component={TempSensor4827Landing} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4827-main" component={TempSensor4827Main} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4827-faceplate-3c" component={TempSensor4827Faceplate3C} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4827-faceplate-3d" component={TempSensor4827Faceplate3D} />
      <Route path="/settings/controller-outputs/faceplates/temp-sensor-4827-faceplate-3f" component={TempSensor4827Faceplate3F} />
      
      {/* Delta-V Valve Faceplates */}
      <Route path="/settings/controller-outputs/faceplates/valve/:valveType" component={ValveTypeDetail} />
      <Route path="/settings/controller-outputs/faceplates/valve/flow-control/:valveId" component={FlowControlValveDetail} />
      <Route path="/settings/controller-outputs/faceplates/valve/flow-control/:valveId/3e" component={FlowControlValve3E} />
      <Route path="/settings/controller-outputs/faceplates/valve/temperature-control/:valveId" component={TempControlValveDetail} />
      <Route path="/settings/controller-outputs/faceplates/valve/hand-control/:valveId" component={HandControlValveDetail} />
      <Route path="/settings/controller-outputs/faceplates/jug-valve" component={JugValveDetail} />
      <Route path="/settings/controller-outputs/faceplates/jug-valve/3e" component={JugValve3E} />
      <Route path="/settings/controller-outputs/faceplates/jug-valve-positioner" component={JugValvePositionerDetail} />
      <Route path="/settings/controller-outputs/faceplates/jug-valve-positioner/3e" component={JugValvePositioner3E} />
      
      {/* Delta-V Equipment Faceplates */}
      <Route path="/settings/controller-outputs/faceplates/compressor-faceplate" component={CompressorFaceplate} />
      <Route path="/settings/controller-outputs/faceplates/turbo-generator-faceplate" component={TurboGeneratorFaceplate} />
      <Route path="/settings/controller-outputs/faceplates/faceplate-3a/:controllerId?" component={Faceplate3A} />
      <Route path="/settings/controller-outputs/faceplates/faceplate-3b/:controllerId?" component={Faceplate3B} />
      <Route path="/settings/controller-outputs/faceplates/faceplate-3c/:controllerId?" component={Faceplate3C} />
      <Route path="/settings/controller-outputs/faceplates/faceplate-3d/:controllerId?" component={Faceplate3D} />
      <Route path="/settings/controller-outputs/faceplates/faceplate-3e/:controllerId?" component={Faceplate3E} />
      <Route path="/settings/controller-outputs/faceplates/faceplate-3f/:controllerId?" component={Faceplate3F} />
      
      {/* Short Path Redirects for Convenience */}
      <Route path="/delta-v/faceplate/3A" component={Faceplate3A} />
      <Route path="/delta-v/faceplate/3B" component={Faceplate3B} />
      <Route path="/delta-v/faceplate/3C" component={Faceplate3C} />
      <Route path="/delta-v/faceplate/3D" component={Faceplate3D} />
      <Route path="/delta-v/faceplate/3E" component={Faceplate3E} />
      <Route path="/delta-v/faceplate/3F" component={Faceplate3F} />
      
      {/* Delta-V VFD Pages */}
      <Route path="/settings/controller-outputs/faceplates/vfd-settings" component={VFDSettings} />
      <Route path="/settings/controller-outputs/faceplates/vfd-history" component={VFDHistory} />
      <Route path="/settings/controller-outputs/faceplates/vfd-trends" component={VFDTrends} />
      <Route path="/settings/controller-outputs/faceplates/vfd-links" component={VFDLinks} />
      <Route path="/settings/controller-outputs/faceplates/vfd-compare" component={VFDCompare} />
      <Route path="/settings/controller-outputs/faceplates/vfd-alarms" component={VFDAlarms} />
      
      <Route path="/settings/controller-outputs/pv-output-messages" component={PvOutputMessages} />
      <Route path="/settings/controller-outputs/valve-status" component={ValveStatus} />
      <Route path="/settings/controller-outputs/symbols" component={Symbols} />
      <Route path="/settings/controller-outputs/sensor-outputs" component={SensorOutputs} />
      <Route path="/settings/controller-outputs" component={ControllerOutputs} />
      <Route path="/settings/simulation-algorithms/static-simulation" component={StaticSimulationAlgorithm} />
      <Route path="/settings/simulation-algorithms/dynamic-simulation" component={DynamicSimulationAlgorithm} />
      <Route path="/settings/simulation-algorithms/plant-startup" component={PlantStartup} />
      <Route path="/settings/simulation-algorithms/emergency-scenarios" component={EmergencyScenarios} />
      <Route path="/settings/simulation-algorithms" component={SimulationAlgorithms} />
      <Route path="/settings/instrument-index" component={InstrumentIndex} />
      <Route path="/settings/model-pallet" component={ModelPallet} />
      <Route path="/settings/databases" component={Databases} />
      <Route path="/settings/plant-document-library" component={PlantDocumentLibrary} />
      <Route path="/simulator">
        <ProtectedRoute>
          <Simulator />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute>
          <AdminUsers />
        </ProtectedRoute>
      </Route>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Route path="/" component={Simulator} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SessionProvider>
          <ControllerSyncProvider>
            <ControllerConfigProvider>
              <CompressorProvider>
                <Toaster />
                <Router />
              </CompressorProvider>
            </ControllerConfigProvider>
          </ControllerSyncProvider>
        </SessionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
