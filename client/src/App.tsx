import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/contexts/SessionContext";
import Landing from "@/pages/landing";
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
          <Toaster />
          <Router />
        </SessionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
