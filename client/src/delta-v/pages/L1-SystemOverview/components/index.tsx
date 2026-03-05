import { TempSensorPrimaryFaceplate } from "@/delta-v/components/faceplate/TempSensorPrimaryFaceplate";
import { useControllerSync } from "@/delta-v/contexts/ControllerSyncContext";
import { SecondaryControllerConfig } from "@/delta-v/types/secondaryController";
import {
  defaultControllerData,
  type ControllerData,
} from "@/delta-v/types/controller";

import { ValveFaceplate } from "@/delta-v/components/faceplate/ValveFaceplate";
import jugValveImage from "./assets/jug-valve.png";
import SulferControllerValveImage from "./assets/open-valve-dark.png";

import IPAT from "./ipat";
import FAT from "./fat";
import CIP from "./cip";
import SH42EC4cEC4a from "./sh42ec4cec4a";
import HIP from "./hip";
import EC3B from "./ec3b";
import SH1B from "./sh1b";
import Converter4 from "./converter4";
import IndustrialFilter from "./industrialFilter";
import DryingTower from "./dryingTower";
import FurnaceWhbt from "./furnace-whb";
import { PrimaryCompressorFaceplate } from "@/delta-v/components/faceplate/PrimaryCompressorFaceplate";
import { CompressorContextType } from "@/delta-v/contexts/CompressorContext";

import { PrimaryTurboGeneratorFaceplate } from "@/delta-v/components/faceplate/PrimaryTurboGeneratorFaceplate";
import { TurboGeneratorProvider } from "@/delta-v/contexts/TurboGeneratorContext";
import KPICard from "@/pages/unit-operation/kpi-card";

export enum L1SystemElement {
  "1540-PI-4072" = "1540-PI-4072",
  "1540-TI-4200A" = "1540-TI-4200A",
  "1540-H-4030" = "1540-H-4030",
  "1540-GB-001" = "1540-GB-001",
  "1540-PI-4002" = "1540-PI-4002",
  "1540-VCF-2602" = "1540-VCF-2602",
  "1540-F-2602" = "1540-F-2602",
  "1540-PI-2604" = "1540-PI-2604",
  "1540-TI-4020" = "1540-TI-4020",
  "1540-HCV-4282" = "1540-HCV-4282",
  "1540-H-4282" = "1540-H-4282",
  "1540-TIC-4822" = "1540-TIC-4822",
  "1540-TI-8721" = "1540-TI-8721",
  "1560-TG-001" = "1560-TG-001",
  "1540-TIC-5224" = "1540-TIC-5224",
  "1540-TI-7225" = "1540-TI-7225",
  "1540-TIC-5220" = "1540-TIC-5220",
  "1540-TI-5232" = "1540-TI-5232",
  "1540-TIC-7221" = "1540-TIC-7221",
  "1540-TI-5231" = "1540-TI-5231",
  "1540-TI-8421" = "1540-TI-8421",
  "1540-TIC-7224" = "1540-TIC-7224",
  "1520-TI-6624" = "1520-TI-6624",
  "1540-TI-7821" = "1540-TI-7821",
  "1540-TI-4200A-1" = "1540-TI-4200A-1",
  "KPICard" = "KPICard",

  // Image Elements
  "IPAT" = "IPAT",
  "FAT" = "FAT",
  "CIP" = "CIP",
  "SH42EC4cEC4a" = "SH42EC4cEC4a",
  "HIP" = "HIP",
  "EC3B" = "EC3B",
  "SH1B" = "SH1B",
  "Converter4" = "Converter4",
  "IndustrialFilter" = "IndustrialFilter",
  "DT" = "DT",
  "FurnaceWhbt" = "FurnaceWhbt",

  //Text Elements
  "To Acid Pump Tank" = "To Acid Pump Tank",
  "From Acid System" = "From Acid System",
  "Ambient Air" = "Ambient Air",
  "SUPERHEATER 1B 1540-HX-003" = "SUPERHEATER 1B 1540-HX-003",
  "HOT INTERPASS HX 1540-HX-009" = "HOT INTERPASS HX 1540-HX-009",
  "COLD INTERPASS HX 1540-HX-008" = "COLD INTERPASS HX 1540-HX-008",
  "HP SUPERHEATER 4A ECONOMIZER 4C / 4A 1540-HX-004/006/007" = "HP SUPERHEATER 4A ECONOMIZER 4C / 4A 1540-HX-004/006/007",
  "ECONOMIZER 3B 1540-HX-002" = "ECONOMIZER 3B 1540-HX-002",
  "To Condenser" = "To Condenser",
  "SULFUR FURNACE 1540-ZM-001" = "SULFUR FURNACE 1540-ZM-001",
  "WASTE HEAT BOILER (WHB) 1540-HX-001" = "WASTE HEAT BOILER (WHB) 1540-HX-001",
  "DRYING TOWER 1520-TW-001" = "DRYING TOWER 1520-TW-001",
  "INLET AIR FILTER 1520-FL-001" = "INLET AIR FILTER 1520-FL-001",
  "FINAL TOWER 1520-TW-002" = "FINAL TOWER 1520-TW-002",
  "INTERPASS TOWER 1520-TW-003" = "INTERPASS TOWER 1520-TW-003",

  "To Acid Pump Tank 2" = "To Acid Pump Tank 2",
  "From Acid System 2" = "From Acid System 2",

  "To Acid Pump Tank 3" = "To Acid Pump Tank 3",
  "From Acid System 3" = "From Acid System 3",

  "From Sulfer Tank 1" = "From Sulfer Tank 1",
  "To SO2 Scrubber" = "To SO2 Scrubber",
}

export const L1SystemElements = [
  L1SystemElement["1540-PI-4072"],
  L1SystemElement["1540-TI-4200A"],
  L1SystemElement["1540-H-4030"],
  L1SystemElement["1540-GB-001"],
  L1SystemElement["1540-PI-4002"],
  L1SystemElement["1540-VCF-2602"],
  L1SystemElement["1540-F-2602"],
  L1SystemElement["1540-PI-2604"],
  L1SystemElement["1540-TI-4020"],
  L1SystemElement["1540-HCV-4282"],
  L1SystemElement["1540-H-4282"],
  L1SystemElement["1540-TIC-4822"],
  L1SystemElement["1540-TI-8721"],
  L1SystemElement["1560-TG-001"],
  L1SystemElement["1540-TIC-5224"],
  L1SystemElement["1540-TI-7225"],
  L1SystemElement["1540-TIC-5220"],
  L1SystemElement["1540-TI-5232"],
  L1SystemElement["1540-TIC-7221"],
  L1SystemElement["1540-TI-5231"],
  L1SystemElement["1540-TI-8421"],
  L1SystemElement["1540-TIC-7224"],
  L1SystemElement["1520-TI-6624"],
  L1SystemElement["1540-TI-7821"],
  L1SystemElement["1540-TI-4200A-1"],

  L1SystemElement["KPICard"],

  // Image Elements
  L1SystemElement["IPAT"],
  L1SystemElement["FAT"],
  L1SystemElement["CIP"],
  L1SystemElement["SH42EC4cEC4a"],
  L1SystemElement["HIP"],
  L1SystemElement["EC3B"],
  L1SystemElement["SH1B"],
  L1SystemElement["Converter4"],
  L1SystemElement["IndustrialFilter"],
  L1SystemElement["DT"],
  L1SystemElement["FurnaceWhbt"],

  //Text Elements
  L1SystemElement["To Acid Pump Tank"],
  L1SystemElement["From Acid System"],
  L1SystemElement["Ambient Air"],
  L1SystemElement["SUPERHEATER 1B 1540-HX-003"],
  L1SystemElement["HOT INTERPASS HX 1540-HX-009"],
  L1SystemElement["COLD INTERPASS HX 1540-HX-008"],
  L1SystemElement["HP SUPERHEATER 4A ECONOMIZER 4C / 4A 1540-HX-004/006/007"],
  L1SystemElement["ECONOMIZER 3B 1540-HX-002"],
  L1SystemElement["To Condenser"],
  L1SystemElement["SULFUR FURNACE 1540-ZM-001"],
  L1SystemElement["WASTE HEAT BOILER (WHB) 1540-HX-001"],
  L1SystemElement["DRYING TOWER 1520-TW-001"],
  L1SystemElement["INLET AIR FILTER 1520-FL-001"],
  L1SystemElement["FINAL TOWER 1520-TW-002"],
  L1SystemElement["INTERPASS TOWER 1520-TW-003"],

  L1SystemElement["To Acid Pump Tank 2"],
  L1SystemElement["From Acid System 2"],
  L1SystemElement["To Acid Pump Tank 3"],
  L1SystemElement["From Acid System 3"],
  L1SystemElement["From Sulfer Tank 1"],
  L1SystemElement["To SO2 Scrubber"],
];

export enum ElementType {
  Text,
  Image,
  TemperatureController,
  PressureController,
  FlowController,
  Compressor,
  ValveController,
  CompressorController,
  TurboGenerator,
  KPI,
  SulfurFlowController,
  HandController,
  JugValveHandController,
  WhbHandController,
}

export enum BlockType {
  Controller = "controller",
  Sensor = "sensor",
  Image = "image",
  Text = "text",
}

const L1SystemElementsMap = (
  getControllerConfig: (controllerId: string) => SecondaryControllerConfig,
  isLocked: boolean,
  compressor: CompressorContextType,
) => {
  //1540-PI-4072
  //Compressor Inlet Pressure
  const compressorInletPressure4072Config = getControllerConfig(
    L1SystemElement["1540-PI-4072"],
  );
  const compressorInletPressure4072Data = useControllerSync(
    L1SystemElement["1540-PI-4072"],
  );

  //1540-TI-4200A
  //Furnace Outlet Temperature A
  const furnaceOutletTemperature4200AConfig = getControllerConfig(
    L1SystemElement["1540-TI-4200A"],
  );
  const furnaceOutletTemperature4200AData = useControllerSync(
    L1SystemElement["1540-TI-4200A"],
  );

  //1540-H-4030
  //1540-H-4030 Main Compressor Controller
  const compressorController4030Config = getControllerConfig(
    L1SystemElement["1540-H-4030"],
  );
  const compressorController4030Data = useControllerSync(
    L1SystemElement["1540-H-4030"],
  );

  //1540-GB-001
  //Main Compressor
  const mainCompressor001Config = getControllerConfig(
    L1SystemElement["1540-GB-001"],
  );
  const mainCompressor001Data = useControllerSync(
    L1SystemElement["1540-GB-001"],
  );
  const { vfdConfig, setVFDConfigLocal, saveVFDConfig } = compressor;

  //1540-PI-4002
  // compressor outlet pressure
  const compressorOutletPressure4002Config = getControllerConfig(
    L1SystemElement["1540-PI-4002"],
  );
  const compressorOutletPressure4002Data = useControllerSync(
    L1SystemElement["1540-PI-4002"],
  );

  //1540-VCF-2602
  // Sulpur Controller Valve
  const sulfurControllerValve2602Config = getControllerConfig(
    L1SystemElement["1540-VCF-2602"],
  );
  const sulfurControllerValve2602Data = useControllerSync(
    L1SystemElement["1540-VCF-2602"],
  );

  //1540-F-2602
  //Sulphuric Flow Controller
  const sulphuricFlowController2602Config = getControllerConfig(
    L1SystemElement["1540-F-2602"],
  );
  const sulphuricFlowController2602Data = useControllerSync(
    L1SystemElement["1540-F-2602"],
  );

  //1540-PI-2604
  //Furnace Sulfur Inlet Pressure
  const furnaceSulfurInletPressure2604Config = getControllerConfig(
    L1SystemElement["1540-PI-2604"],
  );
  const furnaceSulfurInletPressure2604Data = useControllerSync(
    L1SystemElement["1540-PI-2604"],
  );

  //1540-TI-4020
  //Furnace Inlet Temperature
  const furnaceInletTemperature4020Config = getControllerConfig(
    L1SystemElement["1540-TI-4020"],
  );
  const furnaceInletTemperature4020Data = useControllerSync(
    L1SystemElement["1540-TI-4020"],
  );

  //1540-HCV-4282
  //Jug Controller Valve
  const jugControllerValve4282Config = getControllerConfig(
    L1SystemElement["1540-HCV-4282"],
  );
  const jugControllerValve4282Data = useControllerSync(
    L1SystemElement["1540-HCV-4282"],
  );

  //1540-H-4282
  //Jug Controller
  const jugController4282Config = getControllerConfig(
    L1SystemElement["1540-H-4282"],
  );
  const jugController4282Data = useControllerSync(
    L1SystemElement["1540-H-4282"],
  );

  //1540-TIC-4822
  // Pass 2 Inlet Temperature
  const pass2InletTemperature4822Config = getControllerConfig(
    L1SystemElement["1540-TIC-4822"],
  );
  const pass2InletTemperature4822Data = useControllerSync(
    L1SystemElement["1540-TIC-4822"],
  );

  //1540-TI-8721
  //Pass 1 Outlet Temperature
  const pass1OutletTemperature8721Config = getControllerConfig(
    L1SystemElement["1540-TI-8721"],
  );
  const pass1OutletTemperature8721Data = useControllerSync(
    L1SystemElement["1540-TI-8721"],
  );

  //1560-TG-001
  //Pass 2 Turbo Generator Set
  const pass2TurboGeneratorSet001Config = getControllerConfig(
    L1SystemElement["1560-TG-001"],
  );
  const pass2TurboGeneratorSet001Data = useControllerSync(
    L1SystemElement["1560-TG-001"],
  );

  //1540-TIC-5224
  //Pass 4 Inlet Temperature
  const pass4InletTemperature5224Config = getControllerConfig(
    L1SystemElement["1540-TIC-5224"],
  );
  const pass4InletTemperature5224Data = useControllerSync(
    L1SystemElement["1540-TIC-5224"],
  );

  //1540-TI-7225
  //Pass 4 Outlet Temperature
  const pass4OutletTemperature7225Config = getControllerConfig(
    L1SystemElement["1540-TI-7225"],
  );
  const pass4OutletTemperature7225Data = useControllerSync(
    L1SystemElement["1540-TI-7225"],
  );

  //1540-TIC-5220
  //Pass 2 Inlet Temperature
  const pass2InletTemperature5220Config = getControllerConfig(
    L1SystemElement["1540-TIC-5220"],
  );
  const pass2InletTemperature5220Data = useControllerSync(
    L1SystemElement["1540-TIC-5220"],
  );

  //1540-TI-5232
  //Pass 2 Outlet Temperature
  const pass2OutletTemperature5232Config = getControllerConfig(
    L1SystemElement["1540-TI-5232"],
  );
  const pass2OutletTemperature5232Data = useControllerSync(
    L1SystemElement["1540-TI-5232"],
  );

  //1540-TIC-7221
  //Economizer 4A Outlet Temp.
  const economizer4AOutletTemp7221Config = getControllerConfig(
    L1SystemElement["1540-TIC-7221"],
  );
  const economizer4AOutletTemp7221Data = useControllerSync(
    L1SystemElement["1540-TIC-7221"],
  );

  //1540-TI-5231
  //Pass 3 Outlet Temperature
  const pass3OutletTemperature5231Config = getControllerConfig(
    L1SystemElement["1540-TI-5231"],
  );
  const pass3OutletTemperature5231Data = useControllerSync(
    L1SystemElement["1540-TI-5231"],
  );

  //1540-TI-8421
  //CIP Inlet Temperature
  const cipInletTemperature8421Config = getControllerConfig(
    L1SystemElement["1540-TI-8421"],
  );
  const cipInletTemperature8421Data = useControllerSync(
    L1SystemElement["1540-TI-8421"],
  );

  //1540-TIC-7224
  //Economizer 3B Outlet Temp.
  const economizer3BOutletTemp7224Config = getControllerConfig(
    L1SystemElement["1540-TIC-7224"],
  );
  const economizer3BOutletTemp7224Data = useControllerSync(
    L1SystemElement["1540-TIC-7224"],
  );

  //1520-TI-6624
  //FAT Outlet Temperature
  const fatOutletTemperature6624Config = getControllerConfig(
    L1SystemElement["1520-TI-6624"],
  );
  const fatOutletTemperature6624Data = useControllerSync(
    L1SystemElement["1520-TI-6624"],
  );

  //1540-TI-7821
  //IPAT Outlet Temperature
  const ipatOutletTemperature7821Config = getControllerConfig(
    L1SystemElement["1540-TI-7821"],
  );
  const ipatOutletTemperature7821Data = useControllerSync(
    L1SystemElement["1540-TI-7821"],
  );

  return {
    "1540-H-4282": {
      tag: L1SystemElement["1540-H-4282"],
      description: "Jug Valve Controller",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      config: jugController4282Config,
      data: jugController4282Data,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: jugController4282Config?.TAGNAME,
                description:
                  jugController4282Config?.DESC || "Jug Valve Controller",
                pv: jugController4282Data?.state?.syncedPV ?? 0,
                sp: jugController4282Data?.state?.syncedSP ?? 0,
                out: jugController4282Data?.state?.syncedOUT ?? 0,
                mode: jugController4282Data?.state?.syncedMode ?? "AUTO",
                pvUnits: jugController4282Config?.EU || "°C",
                pvRangeMin: jugController4282Config?.SP_LIM_LO ?? 0,
                pvRangeMax: jugController4282Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  jugController4282Data?.state?.alarmStates?.HH ||
                  jugController4282Data?.state?.alarmStates?.H ||
                  jugController4282Data?.state?.alarmStates?.L ||
                  jugController4282Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  jugController4282Data?.state?.alarmStates?.HH ||
                  jugController4282Data?.state?.alarmStates?.LL
                    ? "red"
                    : jugController4282Data?.state?.alarmStates?.H ||
                        jugController4282Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: jugController4282Config?.ALM_LL_LIM,
                alarmL: jugController4282Config?.ALM_L_LIM,
                alarmH: jugController4282Config?.ALM_H_LIM,
                alarmHH: jugController4282Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-TI-7821": {
      tag: L1SystemElement["1540-TI-7821"],
      description: "Pass 1 Outlet Temperature",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      data: ipatOutletTemperature7821Data,
      config: ipatOutletTemperature7821Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: ipatOutletTemperature7821Config?.TAGNAME,
                description:
                  ipatOutletTemperature7821Config?.DESC ||
                  "Pass 1 Outlet Temperature",
                pv: ipatOutletTemperature7821Data?.state?.syncedPV ?? 0,
                sp: ipatOutletTemperature7821Data?.state?.syncedSP ?? 0,
                out: ipatOutletTemperature7821Data?.state?.syncedOUT ?? 0,
                mode:
                  ipatOutletTemperature7821Data?.state?.syncedMode ?? "AUTO",
                pvUnits: ipatOutletTemperature7821Config?.EU || "°C",
                pvRangeMin: ipatOutletTemperature7821Config?.SP_LIM_LO ?? 0,
                pvRangeMax: ipatOutletTemperature7821Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  ipatOutletTemperature7821Data?.state?.alarmStates?.HH ||
                  ipatOutletTemperature7821Data?.state?.alarmStates?.H ||
                  ipatOutletTemperature7821Data?.state?.alarmStates?.L ||
                  ipatOutletTemperature7821Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  ipatOutletTemperature7821Data?.state?.alarmStates?.HH ||
                  ipatOutletTemperature7821Data?.state?.alarmStates?.LL
                    ? "red"
                    : ipatOutletTemperature7821Data?.state?.alarmStates?.H ||
                        ipatOutletTemperature7821Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: ipatOutletTemperature7821Config?.ALM_LL_LIM,
                alarmL: ipatOutletTemperature7821Config?.ALM_L_LIM,
                alarmH: ipatOutletTemperature7821Config?.ALM_H_LIM,
                alarmHH: ipatOutletTemperature7821Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-PI-4072": {
      tag: L1SystemElement["1540-PI-4072"],
      description: "Compressor Inlet Pressure",
      type: ElementType.PressureController,
      blockType: BlockType.Sensor,
      data: compressorInletPressure4072Data,
      config: compressorInletPressure4072Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: compressorInletPressure4072Config?.TAGNAME,
                description:
                  compressorInletPressure4072Config?.DESC ||
                  "Compressor Inlet Pressure",
                pv: compressorInletPressure4072Data?.state?.syncedPV ?? 0,
                sp: compressorInletPressure4072Data?.state?.syncedSP ?? 0,
                out: compressorInletPressure4072Data?.state?.syncedOUT ?? 0,
                mode:
                  compressorInletPressure4072Data?.state?.syncedMode ?? "AUTO",
                pvUnits: compressorInletPressure4072Config?.EU || "°C",
                pvRangeMin: compressorInletPressure4072Config?.SP_LIM_LO ?? 0,
                pvRangeMax: compressorInletPressure4072Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  compressorInletPressure4072Data?.state?.alarmStates?.HH ||
                  compressorInletPressure4072Data?.state?.alarmStates?.H ||
                  compressorInletPressure4072Data?.state?.alarmStates?.L ||
                  compressorInletPressure4072Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  compressorInletPressure4072Data?.state?.alarmStates?.HH ||
                  compressorInletPressure4072Data?.state?.alarmStates?.LL
                    ? "red"
                    : compressorInletPressure4072Data?.state?.alarmStates?.H ||
                        compressorInletPressure4072Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: compressorInletPressure4072Config?.ALM_LL_LIM,
                alarmL: compressorInletPressure4072Config?.ALM_L_LIM,
                alarmH: compressorInletPressure4072Config?.ALM_H_LIM,
                alarmHH: compressorInletPressure4072Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-H-4030": {
      tag: L1SystemElement["1540-H-4030"],
      description: "1540-H-4030 Main Compressor Controller",
      type: ElementType.CompressorController,
      blockType: BlockType.Controller,
      data: compressorController4030Data,
      config: compressorController4030Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: compressorController4030Config?.TAGNAME,
                description:
                  compressorController4030Config?.DESC ||
                  "Main Compressor Controller",
                pv: compressorController4030Data?.state?.syncedPV ?? 0,
                sp: compressorController4030Data?.state?.syncedSP ?? 0,
                out: compressorController4030Data?.state?.syncedOUT ?? 0,
                mode: compressorController4030Data?.state?.syncedMode ?? "AUTO",
                pvUnits: compressorController4030Config?.EU || "°C",
                pvRangeMin: compressorController4030Config?.SP_LIM_LO ?? 0,
                pvRangeMax: compressorController4030Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  compressorController4030Data?.state?.alarmStates?.HH ||
                  compressorController4030Data?.state?.alarmStates?.H ||
                  compressorController4030Data?.state?.alarmStates?.L ||
                  compressorController4030Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  compressorController4030Data?.state?.alarmStates?.HH ||
                  compressorController4030Data?.state?.alarmStates?.LL
                    ? "red"
                    : compressorController4030Data?.state?.alarmStates?.H ||
                        compressorController4030Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: compressorInletPressure4072Config?.ALM_LL_LIM,
                alarmL: compressorInletPressure4072Config?.ALM_L_LIM,
                alarmH: compressorInletPressure4072Config?.ALM_H_LIM,
                alarmHH: compressorInletPressure4072Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-GB-001": {
      tag: L1SystemElement["1540-GB-001"],
      description: "Main Compressor",
      type: ElementType.Compressor,
      blockType: BlockType.Controller,
      data: mainCompressor001Data,
      config: mainCompressor001Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <PrimaryCompressorFaceplate
            data={compressor.compressorData}
            transparentBackground={true}
            configTagName={compressor.vfdConfig?.tagName}
            configDescription={compressor.vfdConfig?.description}
            configUnit={compressor.vfdConfig?.unit}
          />
        </div>
      ),
    },
    "1540-PI-4002": {
      tag: "1540-PI-4002",
      description: "Compressor Outlet Pressure",
      type: ElementType.PressureController,
      blockType: BlockType.Sensor,
      data: compressorOutletPressure4002Data,
      config: compressorOutletPressure4002Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: compressorOutletPressure4002Config?.TAGNAME,
                description:
                  compressorOutletPressure4002Config?.DESC ||
                  "DT Gas Out Temperature",
                pv: compressorOutletPressure4002Data?.state?.syncedPV ?? 0,
                sp: compressorOutletPressure4002Data?.state?.syncedSP ?? 0,
                out: compressorOutletPressure4002Data?.state?.syncedOUT ?? 0,
                mode:
                  compressorOutletPressure4002Data?.state?.syncedMode ?? "AUTO",
                pvUnits: compressorOutletPressure4002Config?.EU || "°C",
                pvRangeMin: compressorOutletPressure4002Config?.SP_LIM_LO ?? 0,
                pvRangeMax:
                  compressorOutletPressure4002Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  compressorOutletPressure4002Data?.state?.alarmStates?.HH ||
                  compressorOutletPressure4002Data?.state?.alarmStates?.H ||
                  compressorOutletPressure4002Data?.state?.alarmStates?.L ||
                  compressorOutletPressure4002Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  compressorOutletPressure4002Data?.state?.alarmStates?.HH ||
                  compressorOutletPressure4002Data?.state?.alarmStates?.LL
                    ? "red"
                    : compressorOutletPressure4002Data?.state?.alarmStates?.H ||
                        compressorOutletPressure4002Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: compressorOutletPressure4002Config?.ALM_LL_LIM,
                alarmL: compressorOutletPressure4002Config?.ALM_L_LIM,
                alarmH: compressorOutletPressure4002Config?.ALM_H_LIM,
                alarmHH: compressorOutletPressure4002Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-VCF-2602": {
      tag: "1540-VCF-2602",
      description: "Sulpur Controller Valve",
      type: ElementType.ValveController,
      blockType: BlockType.Controller,
      data: sulfurControllerValve2602Data,
      config: sulfurControllerValve2602Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <ValveFaceplate
            data={{
              ...defaultControllerData,
              instrumentTag: sulfurControllerValve2602Config?.TAGNAME,
              description:
                sulfurControllerValve2602Config?.DESC ||
                "Sulfer Controller Valve",
              pv: sulfurControllerValve2602Data?.state?.syncedPV ?? 0,
              sp: sulfurControllerValve2602Data?.state?.syncedSP ?? 0,
              out: sulfurControllerValve2602Data?.state?.syncedOUT ?? 0,
              mode: sulfurControllerValve2602Data?.state?.syncedMode ?? "AUTO",
              pvUnits: sulfurControllerValve2602Config?.EU || "°C",
              pvRangeMin: sulfurControllerValve2602Config?.SP_LIM_LO ?? 0,
              pvRangeMax: sulfurControllerValve2602Config?.SP_LIM_HI ?? 500,
              alarmActive:
                sulfurControllerValve2602Data?.state?.alarmStates?.HH ||
                sulfurControllerValve2602Data?.state?.alarmStates?.H ||
                sulfurControllerValve2602Data?.state?.alarmStates?.L ||
                sulfurControllerValve2602Data?.state?.alarmStates?.LL ||
                false,
              alarmColor:
                sulfurControllerValve2602Data?.state?.alarmStates?.HH ||
                sulfurControllerValve2602Data?.state?.alarmStates?.LL
                  ? "red"
                  : sulfurControllerValve2602Data?.state?.alarmStates?.H ||
                      sulfurControllerValve2602Data?.state?.alarmStates?.L
                    ? "yellow"
                    : undefined,
              alarmLL: sulfurControllerValve2602Config?.ALM_LL_LIM,
              alarmL: sulfurControllerValve2602Config?.ALM_L_LIM,
              alarmH: sulfurControllerValve2602Config?.ALM_H_LIM,
              alarmHH: sulfurControllerValve2602Config?.ALM_HH_LIM,
            }}
            isTransparent={true}
            valveImageSrc={SulferControllerValveImage}
          />
        </div>
      ),
    },
    "1540-F-2602": {
      tag: "1540-F-2602",
      description: "Sulphuric Flow Controller",
      type: ElementType.FlowController,
      blockType: BlockType.Controller,
      data: sulphuricFlowController2602Data,
      config: sulphuricFlowController2602Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: sulphuricFlowController2602Config?.TAGNAME,
                description:
                  sulphuricFlowController2602Config?.DESC ||
                  "DT Gas Out Temperature",
                pv: sulphuricFlowController2602Data?.state?.syncedPV ?? 0,
                sp: sulphuricFlowController2602Data?.state?.syncedSP ?? 0,
                out: sulphuricFlowController2602Data?.state?.syncedOUT ?? 0,
                mode:
                  sulphuricFlowController2602Data?.state?.syncedMode ?? "AUTO",
                pvUnits: sulphuricFlowController2602Config?.EU || "°C",
                pvRangeMin: sulphuricFlowController2602Config?.SP_LIM_LO ?? 0,
                pvRangeMax: sulphuricFlowController2602Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  sulphuricFlowController2602Data?.state?.alarmStates?.HH ||
                  sulphuricFlowController2602Data?.state?.alarmStates?.H ||
                  sulphuricFlowController2602Data?.state?.alarmStates?.L ||
                  sulphuricFlowController2602Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  sulphuricFlowController2602Data?.state?.alarmStates?.HH ||
                  sulphuricFlowController2602Data?.state?.alarmStates?.LL
                    ? "red"
                    : sulphuricFlowController2602Data?.state?.alarmStates?.H ||
                        sulphuricFlowController2602Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: sulphuricFlowController2602Config?.ALM_LL_LIM,
                alarmL: sulphuricFlowController2602Config?.ALM_L_LIM,
                alarmH: sulphuricFlowController2602Config?.ALM_H_LIM,
                alarmHH: sulphuricFlowController2602Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-PI-2604": {
      tag: "1540-PI-2604",
      description: "Furnace Sulfur Inlet Pressure",
      type: ElementType.PressureController,
      blockType: BlockType.Sensor,
      data: furnaceSulfurInletPressure2604Data,
      config: furnaceSulfurInletPressure2604Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: furnaceSulfurInletPressure2604Config?.TAGNAME,
                description:
                  furnaceSulfurInletPressure2604Config?.DESC ||
                  "DT Gas Out Temperature",
                pv: furnaceSulfurInletPressure2604Data?.state?.syncedPV ?? 0,
                sp: furnaceSulfurInletPressure2604Data?.state?.syncedSP ?? 0,
                out: furnaceSulfurInletPressure2604Data?.state?.syncedOUT ?? 0,
                mode:
                  furnaceSulfurInletPressure2604Data?.state?.syncedMode ??
                  "AUTO",
                pvUnits: furnaceSulfurInletPressure2604Config?.EU || "°C",
                pvRangeMin:
                  furnaceSulfurInletPressure2604Config?.SP_LIM_LO ?? 0,
                pvRangeMax:
                  furnaceSulfurInletPressure2604Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  furnaceSulfurInletPressure2604Data?.state?.alarmStates?.HH ||
                  furnaceSulfurInletPressure2604Data?.state?.alarmStates?.H ||
                  furnaceSulfurInletPressure2604Data?.state?.alarmStates?.L ||
                  furnaceSulfurInletPressure2604Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  furnaceSulfurInletPressure2604Data?.state?.alarmStates?.HH ||
                  furnaceSulfurInletPressure2604Data?.state?.alarmStates?.LL
                    ? "red"
                    : furnaceSulfurInletPressure2604Data?.state?.alarmStates
                          ?.H ||
                        furnaceSulfurInletPressure2604Data?.state?.alarmStates
                          ?.L
                      ? "yellow"
                      : undefined,
                alarmLL: furnaceSulfurInletPressure2604Config?.ALM_LL_LIM,
                alarmL: furnaceSulfurInletPressure2604Config?.ALM_L_LIM,
                alarmH: furnaceSulfurInletPressure2604Config?.ALM_H_LIM,
                alarmHH: furnaceSulfurInletPressure2604Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-TI-4020": {
      tag: "1540-TI-4020",
      description: "Furnace Inlet Temperature",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      data: furnaceInletTemperature4020Data,
      config: furnaceInletTemperature4020Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: furnaceInletTemperature4020Config?.TAGNAME,
                description:
                  furnaceInletTemperature4020Config?.DESC ||
                  "Furnace Inlet Temperature",
                pv: furnaceInletTemperature4020Data?.state?.syncedPV ?? 0,
                sp: furnaceInletTemperature4020Data?.state?.syncedSP ?? 0,
                out: furnaceInletTemperature4020Data?.state?.syncedOUT ?? 0,
                mode:
                  furnaceInletTemperature4020Data?.state?.syncedMode ?? "AUTO",
                pvUnits: furnaceInletTemperature4020Config?.EU || "°C",
                pvRangeMin: furnaceInletTemperature4020Config?.SP_LIM_LO ?? 0,
                pvRangeMax: furnaceInletTemperature4020Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  furnaceInletTemperature4020Data?.state?.alarmStates?.HH ||
                  furnaceInletTemperature4020Data?.state?.alarmStates?.H ||
                  furnaceInletTemperature4020Data?.state?.alarmStates?.L ||
                  furnaceInletTemperature4020Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  furnaceInletTemperature4020Data?.state?.alarmStates?.HH ||
                  furnaceInletTemperature4020Data?.state?.alarmStates?.LL
                    ? "red"
                    : furnaceInletTemperature4020Data?.state?.alarmStates?.H ||
                        furnaceInletTemperature4020Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: furnaceInletTemperature4020Config?.ALM_LL_LIM,
                alarmL: furnaceInletTemperature4020Config?.ALM_L_LIM,
                alarmH: furnaceInletTemperature4020Config?.ALM_H_LIM,
                alarmHH: furnaceInletTemperature4020Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-HCV-4282": {
      tag: "1540-HCV-4282",
      description: "Jug Controller Valve",
      type: ElementType.ValveController,
      blockType: BlockType.Controller,
      data: jugControllerValve4282Data,
      config: jugControllerValve4282Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <ValveFaceplate
            data={{
              ...defaultControllerData,
              instrumentTag: jugControllerValve4282Config?.TAGNAME,
              description:
                jugControllerValve4282Config?.DESC || "Jug Controller Valve",
              pv: jugControllerValve4282Data?.state?.syncedPV ?? 0,
              sp: jugControllerValve4282Data?.state?.syncedSP ?? 0,
              out: jugControllerValve4282Data?.state?.syncedOUT ?? 0,
              mode: jugControllerValve4282Data?.state?.syncedMode ?? "AUTO",
              pvUnits: jugControllerValve4282Config?.EU || "°C",
              pvRangeMin: jugControllerValve4282Config?.SP_LIM_LO ?? 0,
              pvRangeMax: jugControllerValve4282Config?.SP_LIM_HI ?? 500,
              alarmActive:
                jugControllerValve4282Data?.state?.alarmStates?.HH ||
                jugControllerValve4282Data?.state?.alarmStates?.H ||
                jugControllerValve4282Data?.state?.alarmStates?.L ||
                jugControllerValve4282Data?.state?.alarmStates?.LL ||
                false,
              alarmColor:
                jugControllerValve4282Data?.state?.alarmStates?.HH ||
                jugControllerValve4282Data?.state?.alarmStates?.LL
                  ? "red"
                  : jugControllerValve4282Data?.state?.alarmStates?.H ||
                      jugControllerValve4282Data?.state?.alarmStates?.L
                    ? "yellow"
                    : undefined,
              alarmLL: jugControllerValve4282Config?.ALM_LL_LIM,
              alarmL: jugControllerValve4282Config?.ALM_L_LIM,
              alarmH: jugControllerValve4282Config?.ALM_H_LIM,
              alarmHH: jugControllerValve4282Config?.ALM_HH_LIM,
            }}
            isTransparent={true}
            valveImageSrc={jugValveImage}
          />
        </div>
      ),
    },
    "1540-TIC-4822": {
      tag: "1540-TIC-4822",
      description: "Pass 2 Inlet Temperature",
      type: ElementType.TemperatureController,
      blockType: BlockType.Controller,
      data: pass2InletTemperature4822Data,
      config: pass2InletTemperature4822Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: pass2InletTemperature4822Config?.TAGNAME,
                description:
                  pass2InletTemperature4822Config?.DESC ||
                  "DT Gas Out Temperature",
                pv: pass2InletTemperature4822Data?.state?.syncedPV ?? 0,
                sp: pass2InletTemperature4822Data?.state?.syncedSP ?? 0,
                out: pass2InletTemperature4822Data?.state?.syncedOUT ?? 0,
                mode:
                  pass2InletTemperature4822Data?.state?.syncedMode ?? "AUTO",
                pvUnits: pass2InletTemperature4822Config?.EU || "°C",
                pvRangeMin: pass2InletTemperature4822Config?.SP_LIM_LO ?? 0,
                pvRangeMax: pass2InletTemperature4822Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  pass2InletTemperature4822Data?.state?.alarmStates?.HH ||
                  pass2InletTemperature4822Data?.state?.alarmStates?.H ||
                  pass2InletTemperature4822Data?.state?.alarmStates?.L ||
                  pass2InletTemperature4822Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  pass2InletTemperature4822Data?.state?.alarmStates?.HH ||
                  pass2InletTemperature4822Data?.state?.alarmStates?.LL
                    ? "red"
                    : pass2InletTemperature4822Data?.state?.alarmStates?.H ||
                        pass2InletTemperature4822Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: pass2InletTemperature4822Config?.ALM_LL_LIM,
                alarmL: pass2InletTemperature4822Config?.ALM_L_LIM,
                alarmH: pass2InletTemperature4822Config?.ALM_H_LIM,
                alarmHH: pass2InletTemperature4822Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-TI-8721": {
      tag: "1540-TI-8721",
      description: "Pass 1 Outlet Temperature",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      data: pass1OutletTemperature8721Data,
      config: pass1OutletTemperature8721Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: pass1OutletTemperature8721Config?.TAGNAME,
                description:
                  pass1OutletTemperature8721Config?.DESC ||
                  "DT Gas Out Temperature",
                pv: pass1OutletTemperature8721Data?.state?.syncedPV ?? 0,
                sp: pass1OutletTemperature8721Data?.state?.syncedSP ?? 0,
                out: pass1OutletTemperature8721Data?.state?.syncedOUT ?? 0,
                mode:
                  pass1OutletTemperature8721Data?.state?.syncedMode ?? "AUTO",
                pvUnits: pass1OutletTemperature8721Config?.EU || "°C",
                pvRangeMin: pass1OutletTemperature8721Config?.SP_LIM_LO ?? 0,
                pvRangeMax: pass1OutletTemperature8721Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  pass1OutletTemperature8721Data?.state?.alarmStates?.HH ||
                  pass1OutletTemperature8721Data?.state?.alarmStates?.H ||
                  pass1OutletTemperature8721Data?.state?.alarmStates?.L ||
                  pass1OutletTemperature8721Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  pass1OutletTemperature8721Data?.state?.alarmStates?.HH ||
                  pass1OutletTemperature8721Data?.state?.alarmStates?.LL
                    ? "red"
                    : pass1OutletTemperature8721Data?.state?.alarmStates?.H ||
                        pass1OutletTemperature8721Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: pass1OutletTemperature8721Config?.ALM_LL_LIM,
                alarmL: pass1OutletTemperature8721Config?.ALM_L_LIM,
                alarmH: pass1OutletTemperature8721Config?.ALM_H_LIM,
                alarmHH: pass1OutletTemperature8721Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1560-TG-001": {
      tag: "1560-TG-001",
      description: "Pass 2 Turbo Generator Set",
      type: ElementType.TurboGenerator,
      blockType: BlockType.Controller,
      data: pass2TurboGeneratorSet001Data,
      config: pass2TurboGeneratorSet001Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TurboGeneratorProvider>
            <PrimaryTurboGeneratorFaceplate
              data={compressor.compressorData}
              transparentBackground={true}
            />
          </TurboGeneratorProvider>
        </div>
      ),
    },
    "1540-TIC-5224": {
      tag: "1540-TIC-5224",
      description: "Pass 4 Inlet Temperature",
      type: ElementType.TemperatureController,
      blockType: BlockType.Controller,
      data: pass4InletTemperature5224Data,
      config: pass4InletTemperature5224Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: pass4InletTemperature5224Config?.TAGNAME,
                description:
                  pass4InletTemperature5224Config?.DESC ||
                  "DT Gas Out Temperature",
                pv: pass4InletTemperature5224Data?.state?.syncedPV ?? 0,
                sp: pass4InletTemperature5224Data?.state?.syncedSP ?? 0,
                out: pass4InletTemperature5224Data?.state?.syncedOUT ?? 0,
                mode:
                  pass4InletTemperature5224Data?.state?.syncedMode ?? "AUTO",
                pvUnits: pass4InletTemperature5224Config?.EU || "°C",
                pvRangeMin: pass4InletTemperature5224Config?.SP_LIM_LO ?? 0,
                pvRangeMax: pass4InletTemperature5224Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  pass4InletTemperature5224Data?.state?.alarmStates?.HH ||
                  pass4InletTemperature5224Data?.state?.alarmStates?.H ||
                  pass4InletTemperature5224Data?.state?.alarmStates?.L ||
                  pass4InletTemperature5224Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  pass4InletTemperature5224Data?.state?.alarmStates?.HH ||
                  pass4InletTemperature5224Data?.state?.alarmStates?.LL
                    ? "red"
                    : pass4InletTemperature5224Data?.state?.alarmStates?.H ||
                        pass4InletTemperature5224Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: pass4InletTemperature5224Config?.ALM_LL_LIM,
                alarmL: pass4InletTemperature5224Config?.ALM_L_LIM,
                alarmH: pass4InletTemperature5224Config?.ALM_H_LIM,
                alarmHH: pass4InletTemperature5224Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-TI-7225": {
      tag: "1540-TI-7225",
      description: "Pass 4 Outlet Temperature",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      data: pass4OutletTemperature7225Data,
      config: pass4OutletTemperature7225Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: pass4OutletTemperature7225Config?.TAGNAME,
                description:
                  pass4OutletTemperature7225Config?.DESC ||
                  "DT Gas Out Temperature",
                pv: pass4OutletTemperature7225Data?.state?.syncedPV ?? 0,
                sp: pass4OutletTemperature7225Data?.state?.syncedSP ?? 0,
                out: pass4OutletTemperature7225Data?.state?.syncedOUT ?? 0,
                mode:
                  pass4OutletTemperature7225Data?.state?.syncedMode ?? "AUTO",
                pvUnits: pass4OutletTemperature7225Config?.EU || "°C",
                pvRangeMin: pass4OutletTemperature7225Config?.SP_LIM_LO ?? 0,
                pvRangeMax: pass4OutletTemperature7225Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  pass4OutletTemperature7225Data?.state?.alarmStates?.HH ||
                  pass4OutletTemperature7225Data?.state?.alarmStates?.H ||
                  pass4OutletTemperature7225Data?.state?.alarmStates?.L ||
                  pass4OutletTemperature7225Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  pass4OutletTemperature7225Data?.state?.alarmStates?.HH ||
                  pass4OutletTemperature7225Data?.state?.alarmStates?.LL
                    ? "red"
                    : pass4OutletTemperature7225Data?.state?.alarmStates?.H ||
                        pass4OutletTemperature7225Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: pass4OutletTemperature7225Config?.ALM_LL_LIM,
                alarmL: pass4OutletTemperature7225Config?.ALM_L_LIM,
                alarmH: pass4OutletTemperature7225Config?.ALM_H_LIM,
                alarmHH: pass4OutletTemperature7225Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-TIC-5220": {
      tag: "1540-TIC-5220",
      description: "Pass 2 Inlet Temperature",
      type: ElementType.TemperatureController,
      blockType: BlockType.Controller,
      data: pass2InletTemperature5220Data,
      config: pass2InletTemperature5220Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: pass2InletTemperature5220Config?.TAGNAME,
                description:
                  pass2InletTemperature5220Config?.DESC ||
                  "DT Gas Out Temperature",
                pv: pass2InletTemperature5220Data?.state?.syncedPV ?? 0,
                sp: pass2InletTemperature5220Data?.state?.syncedSP ?? 0,
                out: pass2InletTemperature5220Data?.state?.syncedOUT ?? 0,
                mode:
                  pass2InletTemperature5220Data?.state?.syncedMode ?? "AUTO",
                pvUnits: pass2InletTemperature5220Config?.EU || "°C",
                pvRangeMin: pass2InletTemperature5220Config?.SP_LIM_LO ?? 0,
                pvRangeMax: pass2InletTemperature5220Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  pass2InletTemperature5220Data?.state?.alarmStates?.HH ||
                  pass2InletTemperature5220Data?.state?.alarmStates?.H ||
                  pass2InletTemperature5220Data?.state?.alarmStates?.L ||
                  pass2InletTemperature5220Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  pass2InletTemperature5220Data?.state?.alarmStates?.HH ||
                  pass2InletTemperature5220Data?.state?.alarmStates?.LL
                    ? "red"
                    : pass2InletTemperature5220Data?.state?.alarmStates?.H ||
                        pass2InletTemperature5220Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: pass2InletTemperature5220Config?.ALM_LL_LIM,
                alarmL: pass2InletTemperature5220Config?.ALM_L_LIM,
                alarmH: pass2InletTemperature5220Config?.ALM_H_LIM,
                alarmHH: pass2InletTemperature5220Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-TI-5232": {
      tag: "1540-TI-5232",
      description: "Pass 2 Outlet Temperature",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      data: pass2OutletTemperature5232Data,
      config: pass2OutletTemperature5232Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: pass2OutletTemperature5232Config?.TAGNAME,
                description:
                  pass2OutletTemperature5232Config?.DESC ||
                  "DT Gas Out Temperature",
                pv: pass2OutletTemperature5232Data?.state?.syncedPV ?? 0,
                sp: pass2OutletTemperature5232Data?.state?.syncedSP ?? 0,
                out: pass2OutletTemperature5232Data?.state?.syncedOUT ?? 0,
                mode:
                  pass2OutletTemperature5232Data?.state?.syncedMode ?? "AUTO",
                pvUnits: pass2OutletTemperature5232Config?.EU || "°C",
                pvRangeMin: pass2OutletTemperature5232Config?.SP_LIM_LO ?? 0,
                pvRangeMax: pass2OutletTemperature5232Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  pass2OutletTemperature5232Data?.state?.alarmStates?.HH ||
                  pass2OutletTemperature5232Data?.state?.alarmStates?.H ||
                  pass2OutletTemperature5232Data?.state?.alarmStates?.L ||
                  pass2OutletTemperature5232Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  pass2OutletTemperature5232Data?.state?.alarmStates?.HH ||
                  pass2OutletTemperature5232Data?.state?.alarmStates?.LL
                    ? "red"
                    : pass2OutletTemperature5232Data?.state?.alarmStates?.H ||
                        pass2OutletTemperature5232Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: pass2OutletTemperature5232Config?.ALM_LL_LIM,
                alarmL: pass2OutletTemperature5232Config?.ALM_L_LIM,
                alarmH: pass2OutletTemperature5232Config?.ALM_H_LIM,
                alarmHH: pass2OutletTemperature5232Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-TIC-7221": {
      tag: "1540-TIC-7221",
      description: "Economizer 4A Outlet Temp",
      type: ElementType.TemperatureController,
      blockType: BlockType.Controller,
      data: economizer4AOutletTemp7221Data,
      config: economizer4AOutletTemp7221Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: economizer4AOutletTemp7221Config?.TAGNAME,
                description:
                  economizer4AOutletTemp7221Config?.DESC ||
                  "DT Gas Out Temperature",
                pv: economizer4AOutletTemp7221Data?.state?.syncedPV ?? 0,
                sp: economizer4AOutletTemp7221Data?.state?.syncedSP ?? 0,
                out: economizer4AOutletTemp7221Data?.state?.syncedOUT ?? 0,
                mode:
                  economizer4AOutletTemp7221Data?.state?.syncedMode ?? "AUTO",
                pvUnits: economizer4AOutletTemp7221Config?.EU || "°C",
                pvRangeMin: economizer4AOutletTemp7221Config?.SP_LIM_LO ?? 0,
                pvRangeMax: economizer4AOutletTemp7221Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  economizer4AOutletTemp7221Data?.state?.alarmStates?.HH ||
                  economizer4AOutletTemp7221Data?.state?.alarmStates?.H ||
                  economizer4AOutletTemp7221Data?.state?.alarmStates?.L ||
                  economizer4AOutletTemp7221Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  economizer4AOutletTemp7221Data?.state?.alarmStates?.HH ||
                  economizer4AOutletTemp7221Data?.state?.alarmStates?.LL
                    ? "red"
                    : economizer4AOutletTemp7221Data?.state?.alarmStates?.H ||
                        economizer4AOutletTemp7221Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: economizer4AOutletTemp7221Config?.ALM_LL_LIM,
                alarmL: economizer4AOutletTemp7221Config?.ALM_L_LIM,
                alarmH: economizer4AOutletTemp7221Config?.ALM_H_LIM,
                alarmHH: economizer4AOutletTemp7221Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-TI-5231": {
      tag: "1540-TI-5231",
      description: "Pass 3 Outlet Temperature",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      data: pass3OutletTemperature5231Data,
      config: pass3OutletTemperature5231Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: pass3OutletTemperature5231Config?.TAGNAME,
                description:
                  pass3OutletTemperature5231Config?.DESC ||
                  "DT Gas Out Temperature",
                pv: pass3OutletTemperature5231Data?.state?.syncedPV ?? 0,
                sp: pass3OutletTemperature5231Data?.state?.syncedSP ?? 0,
                out: pass3OutletTemperature5231Data?.state?.syncedOUT ?? 0,
                mode:
                  pass3OutletTemperature5231Data?.state?.syncedMode ?? "AUTO",
                pvUnits: pass3OutletTemperature5231Config?.EU || "°C",
                pvRangeMin: pass3OutletTemperature5231Config?.SP_LIM_LO ?? 0,
                pvRangeMax: pass3OutletTemperature5231Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  pass3OutletTemperature5231Data?.state?.alarmStates?.HH ||
                  pass3OutletTemperature5231Data?.state?.alarmStates?.H ||
                  pass3OutletTemperature5231Data?.state?.alarmStates?.L ||
                  pass3OutletTemperature5231Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  pass3OutletTemperature5231Data?.state?.alarmStates?.HH ||
                  pass3OutletTemperature5231Data?.state?.alarmStates?.LL
                    ? "red"
                    : pass3OutletTemperature5231Data?.state?.alarmStates?.H ||
                        pass3OutletTemperature5231Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: pass3OutletTemperature5231Config?.ALM_LL_LIM,
                alarmL: pass3OutletTemperature5231Config?.ALM_L_LIM,
                alarmH: pass3OutletTemperature5231Config?.ALM_H_LIM,
                alarmHH: pass3OutletTemperature5231Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-TI-8421": {
      tag: "1540-TI-8421",
      description: "CIP Inlet Temperature",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      data: cipInletTemperature8421Data,
      config: cipInletTemperature8421Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: cipInletTemperature8421Config?.TAGNAME,
                description:
                  cipInletTemperature8421Config?.DESC ||
                  "DT Gas Out Temperature",
                pv: cipInletTemperature8421Data?.state?.syncedPV ?? 0,
                sp: cipInletTemperature8421Data?.state?.syncedSP ?? 0,
                out: cipInletTemperature8421Data?.state?.syncedOUT ?? 0,
                mode: cipInletTemperature8421Data?.state?.syncedMode ?? "AUTO",
                pvUnits: cipInletTemperature8421Config?.EU || "°C",
                pvRangeMin: cipInletTemperature8421Config?.SP_LIM_LO ?? 0,
                pvRangeMax: cipInletTemperature8421Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  cipInletTemperature8421Data?.state?.alarmStates?.HH ||
                  cipInletTemperature8421Data?.state?.alarmStates?.H ||
                  cipInletTemperature8421Data?.state?.alarmStates?.L ||
                  cipInletTemperature8421Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  cipInletTemperature8421Data?.state?.alarmStates?.HH ||
                  cipInletTemperature8421Data?.state?.alarmStates?.LL
                    ? "red"
                    : cipInletTemperature8421Data?.state?.alarmStates?.H ||
                        cipInletTemperature8421Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: cipInletTemperature8421Config?.ALM_LL_LIM,
                alarmL: cipInletTemperature8421Config?.ALM_L_LIM,
                alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-TIC-7224": {
      tag: "1540-TIC-7224",
      description: "Economizer 3B Outlet Temp",
      type: ElementType.TemperatureController,
      blockType: BlockType.Controller,
      data: economizer3BOutletTemp7224Data,
      config: economizer3BOutletTemp7224Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: economizer3BOutletTemp7224Config?.TAGNAME,
                description:
                  economizer3BOutletTemp7224Config?.DESC ||
                  "Economizer 3B Outlet Temp",
                pv: economizer3BOutletTemp7224Data?.state?.syncedPV ?? 0,
                sp: economizer3BOutletTemp7224Data?.state?.syncedSP ?? 0,
                out: economizer3BOutletTemp7224Data?.state?.syncedOUT ?? 0,
                mode:
                  economizer3BOutletTemp7224Data?.state?.syncedMode ?? "AUTO",
                pvUnits: economizer3BOutletTemp7224Config?.EU || "°C",
                pvRangeMin: economizer3BOutletTemp7224Config?.SP_LIM_LO ?? 0,
                pvRangeMax: economizer3BOutletTemp7224Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  economizer3BOutletTemp7224Data?.state?.alarmStates?.HH ||
                  economizer3BOutletTemp7224Data?.state?.alarmStates?.H ||
                  economizer3BOutletTemp7224Data?.state?.alarmStates?.L ||
                  economizer3BOutletTemp7224Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  economizer3BOutletTemp7224Data?.state?.alarmStates?.HH ||
                  economizer3BOutletTemp7224Data?.state?.alarmStates?.LL
                    ? "red"
                    : economizer3BOutletTemp7224Data?.state?.alarmStates?.H ||
                        economizer3BOutletTemp7224Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: economizer3BOutletTemp7224Config?.ALM_LL_LIM,
                alarmL: economizer3BOutletTemp7224Config?.ALM_L_LIM,
                alarmH: economizer3BOutletTemp7224Config?.ALM_H_LIM,
                alarmHH: economizer3BOutletTemp7224Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1520-TI-6624": {
      tag: "1520-TI-6624",
      description: "FAT Outlet Temperature",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      data: fatOutletTemperature6624Data,
      config: fatOutletTemperature6624Config,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: fatOutletTemperature6624Config?.TAGNAME,
                description:
                  fatOutletTemperature6624Config?.DESC ||
                  "FAT Outlet Temperature",
                pv: fatOutletTemperature6624Data?.state?.syncedPV ?? 0,
                sp: fatOutletTemperature6624Data?.state?.syncedSP ?? 0,
                out: fatOutletTemperature6624Data?.state?.syncedOUT ?? 0,
                mode: fatOutletTemperature6624Data?.state?.syncedMode ?? "AUTO",
                pvUnits: fatOutletTemperature6624Config?.EU || "°C",
                pvRangeMin: fatOutletTemperature6624Config?.SP_LIM_LO ?? 0,
                pvRangeMax: fatOutletTemperature6624Config?.SP_LIM_HI ?? 500,
                alarmActive:
                  fatOutletTemperature6624Data?.state?.alarmStates?.HH ||
                  fatOutletTemperature6624Data?.state?.alarmStates?.H ||
                  fatOutletTemperature6624Data?.state?.alarmStates?.L ||
                  fatOutletTemperature6624Data?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  fatOutletTemperature6624Data?.state?.alarmStates?.HH ||
                  fatOutletTemperature6624Data?.state?.alarmStates?.LL
                    ? "red"
                    : fatOutletTemperature6624Data?.state?.alarmStates?.H ||
                        fatOutletTemperature6624Data?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: fatOutletTemperature6624Config?.ALM_LL_LIM,
                alarmL: fatOutletTemperature6624Config?.ALM_L_LIM,
                alarmH: fatOutletTemperature6624Config?.ALM_H_LIM,
                alarmHH: fatOutletTemperature6624Config?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-TI-4200A": {
      tag: L1SystemElement["1540-TI-4200A"],
      description: "Furnace Outlet Temperature A",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      data: furnaceOutletTemperature4200AData,
      config: furnaceOutletTemperature4200AConfig,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                description:
                  furnaceOutletTemperature4200AConfig?.DESC ||
                  "DT Gas Out Temperature",
                pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                mode:
                  furnaceOutletTemperature4200AData?.state?.syncedMode ??
                  "AUTO",
                pvUnits: furnaceOutletTemperature4200AConfig?.EU || "°C",
                pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                pvRangeMax:
                  furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                alarmActive:
                  furnaceOutletTemperature4200AData?.state?.alarmStates?.HH ||
                  furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                  furnaceOutletTemperature4200AData?.state?.alarmStates?.L ||
                  furnaceOutletTemperature4200AData?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  furnaceOutletTemperature4200AData?.state?.alarmStates?.HH ||
                  furnaceOutletTemperature4200AData?.state?.alarmStates?.LL
                    ? "red"
                    : furnaceOutletTemperature4200AData?.state?.alarmStates
                          ?.H ||
                        furnaceOutletTemperature4200AData?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    "1540-TI-4200A-1": {
      tag: L1SystemElement["1540-TI-4200A"],
      description: "Furnace Outlet Temperature A",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      data: furnaceOutletTemperature4200AData,
      config: furnaceOutletTemperature4200AConfig,
      component: (
        <div
          className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
          style={{
            //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
            transformOrigin: "center center",
          }}
        >
          <TempSensorPrimaryFaceplate
            data={
              {
                ...defaultControllerData,
                instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                description:
                  furnaceOutletTemperature4200AConfig?.DESC ||
                  "DT Gas Out Temperature",
                pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                mode:
                  furnaceOutletTemperature4200AData?.state?.syncedMode ??
                  "AUTO",
                pvUnits: furnaceOutletTemperature4200AConfig?.EU || "°C",
                pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                pvRangeMax:
                  furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                alarmActive:
                  furnaceOutletTemperature4200AData?.state?.alarmStates?.HH ||
                  furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                  furnaceOutletTemperature4200AData?.state?.alarmStates?.L ||
                  furnaceOutletTemperature4200AData?.state?.alarmStates?.LL ||
                  false,
                alarmColor:
                  furnaceOutletTemperature4200AData?.state?.alarmStates?.HH ||
                  furnaceOutletTemperature4200AData?.state?.alarmStates?.LL
                    ? "red"
                    : furnaceOutletTemperature4200AData?.state?.alarmStates
                          ?.H ||
                        furnaceOutletTemperature4200AData?.state?.alarmStates?.L
                      ? "yellow"
                      : undefined,
                alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
              } as ControllerData
            }
            isTransparent={true}
          />
        </div>
      ),
    },
    KPICard: {
      tag: L1SystemElement["KPICard"],
      type: ElementType.KPI,
      blockType: BlockType.Sensor,
      description: "KPI Card",
      component: <KPICard />,
    },
    DT: {
      tag: L1SystemElement["DT"],
      type: ElementType.Image,
      blockType: BlockType.Image,
      description: "Drying Tower",
      component: <DryingTower />,
    },
    IPAT: {
      tag: L1SystemElement["IPAT"],
      type: ElementType.Image,
      blockType: BlockType.Image,
      description: "IPAT Tower",
      component: <IPAT />,
    },
    FAT: {
      tag: L1SystemElement["FAT"],
      type: ElementType.Image,
      blockType: BlockType.Image,
      description: "Final Absorbing Tower",
      component: <FAT />,
    },
    CIP: {
      tag: L1SystemElement["CIP"],
      type: ElementType.Image,
      blockType: BlockType.Image,
      description: "Cold Interpass Absorber",
      component: <CIP />,
    },
    SH42EC4cEC4a: {
      tag: L1SystemElement["SH42EC4cEC4a"],
      type: ElementType.Image,
      blockType: BlockType.Image,
      description: "SH42EC4cEC4a",
      component: <SH42EC4cEC4a />,
    },
    HIP: {
      tag: L1SystemElement["HIP"],
      type: ElementType.Image,
      blockType: BlockType.Image,
      description: "Hot Interpass Absorber",
      component: <HIP />,
    },
    EC3B: {
      tag: L1SystemElement["EC3B"],
      type: ElementType.Image,
      blockType: BlockType.Image,
      description: "Economizer 3B",
      component: <EC3B />,
    },
    SH1B: {
      tag: L1SystemElement["SH1B"],
      type: ElementType.Image,
      blockType: BlockType.Image,
      description: "Superheater 1B",
      component: <SH1B />,
    },
    Converter4: {
      tag: L1SystemElement["Converter4"],
      type: ElementType.Image,
      blockType: BlockType.Image,
      description: "Converter 4",
      component: <Converter4 />,
    },
    IndustrialFilter: {
      tag: L1SystemElement["IndustrialFilter"],
      type: ElementType.Image,
      blockType: BlockType.Image,
      description: "Industrial Filter",
      component: <IndustrialFilter />,
    },
    FurnaceWhbt: {
      tag: L1SystemElement["FurnaceWhbt"],
      type: ElementType.Image,
      blockType: BlockType.Image,
      description: "Furnace Whbt",
      component: <FurnaceWhbt />,
    },

    "To Acid Pump Tank": {
      tag: L1SystemElement["To Acid Pump Tank"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "To Acid Pump Tank",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            To Acid
            <br />
            Pump Tank
          </p>
        </div>
      ),
    },
    "From Acid System": {
      tag: L1SystemElement["From Acid System"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "From Acid System",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            From Acid
            <br />
            System
          </p>
        </div>
      ),
    },
    "Ambient Air": {
      tag: L1SystemElement["Ambient Air"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "Ambient Air",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            Ambient
            <br />
            Air
          </p>
        </div>
      ),
    },

    "SUPERHEATER 1B 1540-HX-003": {
      tag: L1SystemElement["SUPERHEATER 1B 1540-HX-003"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "SUPERHEATER 1B 1540-HX-003",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            SUPERHEATER 1B
            <br />
            1540-HX-003
          </p>
        </div>
      ),
    },
    "HOT INTERPASS HX 1540-HX-009": {
      tag: L1SystemElement["HOT INTERPASS HX 1540-HX-009"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "HOT INTERPASS HX 1540-HX-009",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            HOT INTERPASS HX
            <br />
            1540-HX-009
          </p>
        </div>
      ),
    },
    "COLD INTERPASS HX 1540-HX-008": {
      tag: L1SystemElement["COLD INTERPASS HX 1540-HX-008"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "COLD INTERPASS HX 1540-HX-008",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            COLD INTERPASS HX
            <br />
            1540-HX-008
          </p>
        </div>
      ),
    },
    "HP SUPERHEATER 4A ECONOMIZER 4C / 4A 1540-HX-004/006/007": {
      tag: L1SystemElement[
        "HP SUPERHEATER 4A ECONOMIZER 4C / 4A 1540-HX-004/006/007"
      ],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "HP SUPERHEATER 4A ECONOMIZER 4C / 4A 1540-HX-004/006/007",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            HP SUPERHEATER 4A
            <br />
            ECONOMIZER 4C / 4A
            <br />
            1540-HX-004/006/007
          </p>
        </div>
      ),
    },
    "ECONOMIZER 3B 1540-HX-002": {
      tag: L1SystemElement["ECONOMIZER 3B 1540-HX-002"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "ECONOMIZER 3B 1540-HX-002",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            ECONOMIZER 3B
            <br />
            1540-HX-002
          </p>
        </div>
      ),
    },
    "To Condenser": {
      tag: L1SystemElement["To Condenser"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "To Condenser",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>To Condenser</p>
        </div>
      ),
    },
    "SULFUR FURNACE 1540-ZM-001": {
      tag: L1SystemElement["SULFUR FURNACE 1540-ZM-001"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "SULFUR FURNACE 1540-ZM-001",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            SULFUR FURNACE
            <br />
            1540-ZM-001
          </p>
        </div>
      ),
    },
    "WASTE HEAT BOILER (WHB) 1540-HX-001": {
      tag: L1SystemElement["WASTE HEAT BOILER (WHB) 1540-HX-001"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "WASTE HEAT BOILER (WHB) 1540-HX-001",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            WASTE HEAT BOILER
            <br />
            {`(WHB)`}
            <br />
            1540-HX-001
          </p>
        </div>
      ),
    },
    "DRYING TOWER 1520-TW-001": {
      tag: L1SystemElement["DRYING TOWER 1520-TW-001"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "DRYING TOWER 1520-TW-001",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p className=" text-center text-lg self-end font-bold">
            DRYING TOWER
            <br />
            1520-TW-001
          </p>
        </div>
      ),
    },
    "INLET AIR FILTER 1520-FL-001": {
      tag: L1SystemElement["INLET AIR FILTER 1520-FL-001"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "INLET AIR FILTER 1520-FL-001",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p className=" text-center text-lg self-end font-bold">
            INLET AIR FILTER
            <br />
            1520-FL-001
          </p>
        </div>
      ),
    },
    "FINAL TOWER 1520-TW-002": {
      tag: L1SystemElement["FINAL TOWER 1520-TW-002"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "FINAL TOWER 1520-TW-002",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p className=" text-center text-lg self-end font-bold">
            FINAL TOWER
            <br />
            1520-TW-002
          </p>
        </div>
      ),
    },
    "INTERPASS TOWER 1520-TW-003": {
      tag: L1SystemElement["INTERPASS TOWER 1520-TW-003"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "INTERPASS TOWER 1520-TW-003",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p className=" text-center text-lg self-end font-bold">
            INTERPASS TOWER
            <br />
            1520-TW-003
          </p>
        </div>
      ),
    },
    "To Acid Pump Tank 2": {
      tag: L1SystemElement["To Acid Pump Tank 2"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "To Acid Pump Tank",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            To Acid
            <br />
            Pump Tank
          </p>
        </div>
      ),
    },
    "From Acid System 2": {
      tag: L1SystemElement["From Acid System 2"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "From Acid System",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            From Acid
            <br />
            System
          </p>
        </div>
      ),
    },

    "To Acid Pump Tank 3": {
      tag: L1SystemElement["To Acid Pump Tank 3"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "To Acid Pump Tank",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            To Acid
            <br />
            Pump Tank
          </p>
        </div>
      ),
    },
    "From Acid System 3": {
      tag: L1SystemElement["From Acid System 3"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "From Acid System",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            From Acid
            <br />
            System
          </p>
        </div>
      ),
    },
    "From Sulfer Tank 1": {
      tag: L1SystemElement["From Sulfer Tank 1"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "From Sulfer Tank 1",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            From Sulfer
            <br />
            Tank
          </p>
        </div>
      ),
    },
    "To SO2 Scrubber": {
      tag: L1SystemElement["To SO2 Scrubber"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "To SO2 Scrubber",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            To SO2
            <br />
            Scrubber
          </p>
        </div>
      ),
    },
  };
};

export default L1SystemElementsMap;
