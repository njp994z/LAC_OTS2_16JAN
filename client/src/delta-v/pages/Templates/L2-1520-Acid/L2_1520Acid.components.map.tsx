import React from "react";
import Converter4 from "../components/converter4";
import IPAT from "../components/ipat";
import FAT from "../components/fat";
import KPICard from "@/pages/unit-operation/kpi-card";
import { TempSensorPrimaryFaceplate } from "@/delta-v/components/faceplate/TempSensorPrimaryFaceplate";
import { ControllerFaceplate } from "@/delta-v/components/faceplate/ControllerFaceplate";
import { useControllerSync } from "@/delta-v/contexts/ControllerSyncContext";
import { SecondaryControllerConfig } from "@/delta-v/types/secondaryController";
import {
  defaultControllerData,
  type ControllerData,
} from "@/delta-v/types/controller";
import DryingTower from "../components/dryingTower";

export enum L2AcidElement {
  // Image Elements
  // "Converter4" = "Converter4",
  // "1540-H-4030" = "1540-H-4030",
  "IPAT" = "IPAT",
  "DT" = "DT",
  "FAT" = "FAT",
  "KPICard" = "KPICard",

  // Text Elements
  "DT Acid In" = "DT Acid In",
  "Process Gas from Inlet Air Filter" = "Process Gas from Inlet Air Filter",
  "Process Gas to Main Compressor" = "Process Gas to Main Compressor",
  "Acid to Pump Tank 1" = "Acid to Pump Tank 1",
  "FAT Acid In" = "FAT Acid In",
  "Process Gas from Econ 4A" = "Process Gas from Econ 4A",
  "Process Gas to Tail Gas Scrubber" = "Process Gas to Tail Gas Scrubber",
  "Acid to Pump Tank 2" = "Acid to Pump Tank 2",
  "IPAT Acid In" = "IPAT Acid In",
  "Process Gas from Econ 3B" = "Process Gas from Econ 3B",
  "Process Gas to CIP" = "Process Gas to CIP",
  "Acid to Pump Tank 3" = "Acid to Pump Tank 3",
  "INTERPASS TOWER 1520-TW-003" = "INTERPASS TOWER 1520-TW-003",
  "FINAL TOWER 1520-TW-002" = "FINAL TOWER 1520-TW-002",
  "DRYING TOWER 1520-TW-001" = "DRYING TOWER 1520-TW-001",

  // Sensors and Controllers
  "1540-TI-6623" = "1540-TI-6623",
  "1520-TI-6624" = "1520-TI-6624",
  "1540-TI-8421" = "1540-TI-8421",
  "1520-PI-4072" = "1520-PI-4072",
  // "1540-TI-5821" = "1540-TI-5821",
  "1520-TI-5821" = "1520-TI-5821",
  "1540-TI-5820" = "1540-TI-5820",
  "1540-TIC-7221" = "1540-TIC-7221",
  "1540-TIC-7224" = "1540-TIC-7224",
}

export const L2AcidElements: string[] = Object.values(L2AcidElement);

export enum ElementType {
  Image,
  Text,
  TemperatureSensor,
  TemperatureController,
  PressureSensor,
  KPI,
}

export enum BlockType {
  Image = "image",
  Text = "text",
  Controller = "controller",
  Sensor = "sensor",
}

function getFaceplate(
  tag: string,
  description: string,
  config: any,
  data: any,
  isLocked: boolean,
  isController: boolean,
) {
  const FaceplateComponent = isController
    ? ControllerFaceplate
    : TempSensorPrimaryFaceplate;
  return (
    <div
      className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? "cursor-pointer" : ""}`}
      style={{ transformOrigin: "center center" }}
    >
      <FaceplateComponent
        data={
          {
            ...defaultControllerData,
            instrumentTag: config?.TAGNAME || tag,
            description: config?.DESC || description,
            pv: data?.state?.syncedPV ?? 0,
            sp: data?.state?.syncedSP ?? 0,
            out: data?.state?.syncedOUT ?? 0,
            mode: data?.state?.syncedMode ?? "AUTO",
            pvUnits: config?.EU || "°C",
            pvRangeMin: config?.SP_LIM_LO ?? 0,
            pvRangeMax: config?.SP_LIM_HI ?? 500,
            alarmActive:
              data?.state?.alarmStates?.HH ||
              data?.state?.alarmStates?.H ||
              data?.state?.alarmStates?.L ||
              data?.state?.alarmStates?.LL ||
              false,
            alarmColor:
              data?.state?.alarmStates?.HH || data?.state?.alarmStates?.LL
                ? "red"
                : data?.state?.alarmStates?.H || data?.state?.alarmStates?.L
                  ? "yellow"
                  : undefined,
            alarmLL: config?.ALM_LL_LIM,
            alarmL: config?.ALM_L_LIM,
            alarmH: config?.ALM_H_LIM,
            alarmHH: config?.ALM_HH_LIM,
          } as ControllerData
        }
        isTransparent={true}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Elements map (no hooks needed for image-only elements)
// ---------------------------------------------------------------------------
const L2AcidElementsMap = (
  getControllerConfig: (controllerId: string) => SecondaryControllerConfig,
  isLocked: boolean,
) => {
  const getTextComponent = (text: string) => (
    <span className="font-semibold text-[1.4rem] tracking-wider leading-relaxed text-black whitespace-pre-wrap text-center select-none">
      {text}
    </span>
  );

  const getHookData = (id: string) => ({
    config: getControllerConfig(id),
    data: useControllerSync(id),
  });

  // const c4030 = getHookData(L2AcidElement["1540-H-4030"]);
  const s6623 = getHookData(L2AcidElement["1540-TI-6623"]);
  const s6624 = getHookData(L2AcidElement["1520-TI-6624"]);
  const s8421 = getHookData(L2AcidElement["1540-TI-8421"]);
  const p4072 = getHookData(L2AcidElement["1520-PI-4072"]);
  // const s5821 = getHookData(L2AcidElement["1540-TI-5821"]);
  const s5821_1520 = getHookData(L2AcidElement["1520-TI-5821"]);
  const s5820 = getHookData(L2AcidElement["1540-TI-5820"]);
  const tic7221 = getHookData(L2AcidElement["1540-TIC-7221"]);
  const tic7224 = getHookData(L2AcidElement["1540-TIC-7224"]);

  return {
    // Converter4: {
    //   tag: L2AcidElement["Converter4"],
    //   description: "4-Pass Catalytic Converter",
    //   type: ElementType.Image,
    //   blockType: BlockType.Image,
    //   component: <Converter4 />,
    // },
    // "1540-H-4030": {
    //   tag: L2AcidElement["1540-H-4030"],
    //   description: "Jug Valve Controller",
    //   type: ElementType.TemperatureController,
    //   blockType: BlockType.Sensor,
    //   ...c4030,
    //   component: getFaceplate(
    //     "1540-H-4030",
    //     "Jug Valve Controller",
    //     c4030.config,
    //     c4030.data,
    //     isLocked,
    //     true,
    //   ),
    // },
    IPAT: {
      tag: L2AcidElement["IPAT"],
      description: "IPAT",
      type: ElementType.Image,
      blockType: BlockType.Image,
      component: <IPAT />,
    },
    DT: {
      tag: L2AcidElement["DT"],
      type: ElementType.Image,
      blockType: BlockType.Image,
      description: "Drying Tower",
      component: <DryingTower />,
    },
    FAT: {
      tag: L2AcidElement["FAT"],
      type: ElementType.Image,
      blockType: BlockType.Image,
      description: "Final Tower",
      component: <FAT />,
    },
    KPICard: {
      tag: L2AcidElement["KPICard"],
      description: "KPI Card",
      type: ElementType.KPI,
      blockType: BlockType.Text,
      component: (
        <div className="scale-75 origin-top-left">
          <KPICard />
        </div>
      ),
    },
    "DT Acid In": {
      tag: L2AcidElement["DT Acid In"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("DT\nAcid In"),
    },
    "Process Gas from Inlet Air Filter": {
      tag: L2AcidElement["Process Gas from Inlet Air Filter"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("Process Gas from\nInlet Air Filter"),
    },
    "Process Gas to Main Compressor": {
      tag: L2AcidElement["Process Gas to Main Compressor"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("Process Gas\nto Main Compressor"),
    },
    "Acid to Pump Tank 1": {
      tag: L2AcidElement["Acid to Pump Tank 1"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("Acid to\nPump Tank"),
    },

    "FAT Acid In": {
      tag: L2AcidElement["FAT Acid In"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("FAT\nAcid In"),
    },
    "Process Gas from Econ 4A": {
      tag: L2AcidElement["Process Gas from Econ 4A"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("Process Gas\nfrom Econ 4A"),
    },
    "Process Gas to Tail Gas Scrubber": {
      tag: L2AcidElement["Process Gas to Tail Gas Scrubber"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("Process Gas\nto Tail Gas Scrubber"),
    },
    "Acid to Pump Tank 2": {
      tag: L2AcidElement["Acid to Pump Tank 2"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("Acid to\nPump Tank"),
    },

    "IPAT Acid In": {
      tag: L2AcidElement["IPAT Acid In"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("IPAT\nAcid In"),
    },
    "Process Gas from Econ 3B": {
      tag: L2AcidElement["Process Gas from Econ 3B"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("Process Gas\nfrom Econ 3B"),
    },
    "Process Gas to CIP": {
      tag: L2AcidElement["Process Gas to CIP"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("Process Gas\nto CIP"),
    },
    "Acid to Pump Tank 3": {
      tag: L2AcidElement["Acid to Pump Tank 3"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("Acid to\nPump Tank"),
    },
    "INTERPASS TOWER 1520-TW-003": {
      tag: L2AcidElement["INTERPASS TOWER 1520-TW-003"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("INTERPASS TOWER\n1520-TW-003"),
    },
    "FINAL TOWER 1520-TW-002": {
      tag: L2AcidElement["FINAL TOWER 1520-TW-002"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("FINAL TOWER\n1520-TW-002"),
    },
    "DRYING TOWER 1520-TW-001": {
      tag: L2AcidElement["DRYING TOWER 1520-TW-001"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("DRYING TOWER\n1520-TW-001"),
    },

    "1540-TI-6623": {
      tag: L2AcidElement["1540-TI-6623"],
      description: "DT Acid In Temp",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...s6623,
      component: getFaceplate(
        "1540-TI-6623",
        "DT Acid In Temp",
        s6623.config,
        s6623.data,
        isLocked,
        false,
      ),
    },
    "1520-TI-6624": {
      tag: L2AcidElement["1520-TI-6624"],
      description: "Compressor Inlet Temp",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...s6624,
      component: getFaceplate(
        "1520-TI-6624",
        "Compressor Inlet Temp",
        s6624.config,
        s6624.data,
        isLocked,
        false,
      ),
    },
    "1540-TI-8421": {
      tag: L2AcidElement["1540-TI-8421"],
      description: "FAT Acid In Temp",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...s8421,
      component: getFaceplate(
        "1540-TI-8421",
        "FAT Acid In Temp",
        s8421.config,
        s8421.data,
        isLocked,
        false,
      ),
    },
    "1520-PI-4072": {
      tag: L2AcidElement["1520-PI-4072"],
      description: "Compressor Inlet Pressure",
      type: ElementType.PressureSensor,
      blockType: BlockType.Sensor,
      ...p4072,
      component: getFaceplate(
        "1520-PI-4072",
        "Compressor Inlet Pressure",
        p4072.config,
        p4072.data,
        isLocked,
        false,
      ),
    },
    // "1540-TI-5821": {
    //   tag: L2AcidElement["1540-TI-5821"],
    //   description: "Compressor Inlet Temp.",
    //   type: ElementType.TemperatureSensor,
    //   blockType: BlockType.Sensor,
    //   ...s5821,
    //   component: getFaceplate(
    //     "1540-TI-5821",
    //     "Compressor Inlet Temp.",
    //     s5821.config,
    //     s5821.data,
    //     isLocked,
    //     false,
    //   ),
    // },
    "1520-TI-5821": {
      tag: L2AcidElement["1520-TI-5821"],
      description: "Compressor Inlet Temp.",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...s5821_1520,
      component: getFaceplate(
        "1520-TI-5821",
        "Compressor Inlet Temp.",
        s5821_1520.config,
        s5821_1520.data,
        isLocked,
        false,
      ),
    },
    "1540-TI-5820": {
      tag: L2AcidElement["1540-TI-5820"],
      description: "DT Acid Outlet Temperature",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...s5820,
      component: getFaceplate(
        "1540-TI-5820",
        "DT Acid Outlet Temperature",
        s5820.config,
        s5820.data,
        isLocked,
        false,
      ),
    },
    "1540-TIC-7221": {
      tag: L2AcidElement["1540-TIC-7221"],
      description: "Econ 4A Outlet Temp.",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      ...tic7221,
      component: getFaceplate(
        "1540-TIC-7221",
        "Econ 4A Outlet Temp.",
        tic7221.config,
        tic7221.data,
        isLocked,
        true,
      ),
    },
    "1540-TIC-7224": {
      tag: L2AcidElement["1540-TIC-7224"],
      description: "Econ 3B Outlet Temp.",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      ...tic7224,
      component: getFaceplate(
        "1540-TIC-7224",
        "Econ 3B Outlet Temp.",
        tic7224.config,
        tic7224.data,
        isLocked,
        true,
      ),
    },
  } as Record<
    string,
    {
      tag: string;
      description: string;
      type: ElementType;
      blockType: BlockType;
      component: React.ReactNode;
      config?: SecondaryControllerConfig;
      data?: any;
    }
  >;
};

export default L2AcidElementsMap;
