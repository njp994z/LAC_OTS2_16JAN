import React from "react";
import Converter4 from "../components/converter4";
import { TempSensorPrimaryFaceplate } from "@/delta-v/components/faceplate/TempSensorPrimaryFaceplate";
import { ControllerFaceplate } from "@/delta-v/components/faceplate/ControllerFaceplate";
import { SecondaryControllerConfig } from "@/delta-v/types/secondaryController";
import { useControllerSync } from "@/delta-v/contexts/ControllerSyncContext";
import {
  ControllerData,
  defaultControllerData,
} from "@/delta-v/types/controller";

export enum L2ConverterElement {
  // Image Elements
  "Converter4" = "Converter4",

  // Text Elements
  "To CIP Bypass" = "To CIP Bypass",
  "From HIP Outlet Cold-Side" = "From HIP Outlet Cold-Side",
  "To HIP Bypass" = "To HIP Bypass",
  "From HIP Outlet Hot-Side" = "From HIP Outlet Hot-Side",
  "To SH 1B Bypass" = "To SH 1B Bypass",
  "From Superheater 1B Outlet" = "From Superheater 1B Outlet",
  "To Jug Valve on WHB" = "To Jug Valve on WHB",
  "From WHB Outlet" = "From WHB Outlet",

  "1540-RE-001 CONVERTER" = "1540-RE-001 CONVERTER",
  "To Superheater 4A" = "To Superheater 4A",
  "To CIP Hot-Side Inlet" = "To CIP Hot-Side Inlet",
  "To HIP Hot-Side Inlet" = "To HIP Hot-Side Inlet",
  "To Superheater 1B" = "To Superheater 1B",

  // Controllers (Left Side)
  "1540-TIC-5224" = "1540-TIC-5224",
  "1540-TIC-5220" = "1540-TIC-5220",
  "1540-TIC-4822" = "1540-TIC-4822",
  "1540-H-4282" = "1540-H-4282",
  "1540-TI-4820" = "1540-TI-4820",
  "1520-TI-5821" = "1520-TI-5821",

  // Sensors (Right Side Outlets)
  "1540-TI-7225" = "1540-TI-7225",
  "1540-TI-5231" = "1540-TI-5231",
  "1540-TI-5232" = "1540-TI-5232",

  // Sensors (Inside Converter Passes)
  "1540-TI-4844" = "1540-TI-4844",
  "1540-TI-4845" = "1540-TI-4845",
  "1540-TI-4842" = "1540-TI-4842",
  "1540-TI-4843" = "1540-TI-4843",
  "1540-TI-4840" = "1540-TI-4840",
  "1540-TI-4841" = "1540-TI-4841",
  "1540-TI-4825" = "1540-TI-4825",
  "1540-TI-4846" = "1540-TI-4846",
  "1540-TI-4827" = "1540-TI-4827",
  "1540-TI-4826" = "1540-TI-4826",
}

export const L2ConverterElements: string[] = Object.values(L2ConverterElement);

export enum ElementType {
  Image,
  Text,
  TemperatureSensor,
  TemperatureController,
  PressureSensor,
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
// Elements map
// ---------------------------------------------------------------------------
const L2ConverterElementsMap = (
  getControllerConfig: (controllerId: string) => SecondaryControllerConfig,
  isLocked: boolean,
) => {
  const getTextComponent = (text: string) => (
    <div className="text-black text-lg font-semibold text-center whitespace-pre-wrap select-none leading-relaxed tracking-wider">
      {text}
    </div>
  );

  const getHookData = (id: string, searchId?: string) => ({
    config: getControllerConfig(searchId || id),
    data: useControllerSync(searchId || id),
  });

  // Controllers Data
  const tic5224 = getHookData(L2ConverterElement["1540-TIC-5224"]);
  const tic5220 = getHookData(L2ConverterElement["1540-TIC-5220"]);
  const tic4822 = getHookData(L2ConverterElement["1540-TIC-4822"]);
  const h4282 = getHookData(L2ConverterElement["1540-H-4282"]);
  const ti4820_cont = getHookData(L2ConverterElement["1540-TI-4820"]);
  const ti5821_cont = getHookData(L2ConverterElement["1520-TI-5821"]);

  // Sensors Data (Outlets)
  const ti7225 = getHookData(L2ConverterElement["1540-TI-7225"]);
  const ti5231 = getHookData(L2ConverterElement["1540-TI-5231"]);
  const ti5232 = getHookData(L2ConverterElement["1540-TI-5232"]);

  // Sensors Data (Inlets - inside converter)

  const ti4844 = getHookData(L2ConverterElement["1540-TI-4844"]);
  const ti4845 = getHookData(L2ConverterElement["1540-TI-4845"]);
  const ti4842 = getHookData(L2ConverterElement["1540-TI-4842"]);
  const ti4843 = getHookData(L2ConverterElement["1540-TI-4843"]);
  const ti4840 = getHookData(L2ConverterElement["1540-TI-4840"]);
  const ti4841 = getHookData(L2ConverterElement["1540-TI-4841"]);
  const ti4825 = getHookData(L2ConverterElement["1540-TI-4825"]);
  const ti4846 = getHookData(L2ConverterElement["1540-TI-4846"]);
  const ti4827 = getHookData(L2ConverterElement["1540-TI-4827"]);
  const ti4826 = getHookData(L2ConverterElement["1540-TI-4826"]);

  return {
    Converter4: {
      tag: L2ConverterElement["Converter4"],
      description: "4-Pass Catalytic Converter",
      type: ElementType.Image,
      blockType: BlockType.Image,
      component: <Converter4 />,
    },

    // TEXT ELEMENTS (LEFT SIDE)
    "To CIP Bypass": {
      tag: L2ConverterElement["To CIP Bypass"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("To CIP\nBypass"),
    },
    "From HIP Outlet Cold-Side": {
      tag: L2ConverterElement["From HIP Outlet Cold-Side"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("From HIP Outlet\nCold-Side"),
    },
    "To HIP Bypass": {
      tag: L2ConverterElement["To HIP Bypass"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("To HIP\nBypass"),
    },
    "From HIP Outlet Hot-Side": {
      tag: L2ConverterElement["From HIP Outlet Hot-Side"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("From HIP Outlet\nHot-Side"),
    },
    "To SH 1B Bypass": {
      tag: L2ConverterElement["To SH 1B Bypass"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("To SH 1B\nBypass"),
    },
    "From Superheater 1B Outlet": {
      tag: L2ConverterElement["From Superheater 1B Outlet"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("From Superheater\n1B Outlet"),
    },
    "To Jug Valve on WHB": {
      tag: L2ConverterElement["To Jug Valve on WHB"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("To Jug Valve\non WHB"),
    },
    "From WHB Outlet": {
      tag: L2ConverterElement["From WHB Outlet"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("From WHB\nOutlet"),
    },

    // TEXT ELEMENTS (RIGHT SIDE & BOTTOM)
    "To Superheater 4A": {
      tag: L2ConverterElement["To Superheater 4A"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("To\nSuperheater 4A"),
    },
    "To CIP Hot-Side Inlet": {
      tag: L2ConverterElement["To CIP Hot-Side Inlet"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("To\nCIP Hot-Side\nInlet"),
    },
    "To HIP Hot-Side Inlet": {
      tag: L2ConverterElement["To HIP Hot-Side Inlet"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("To\nHIP Hot-Side\nInlet"),
    },
    "To Superheater 1B": {
      tag: L2ConverterElement["To Superheater 1B"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("To\nSuperheater 1B"),
    },
    "1540-RE-001 CONVERTER": {
      tag: L2ConverterElement["1540-RE-001 CONVERTER"],
      description: "Text",
      type: ElementType.Text,
      blockType: BlockType.Text,
      component: getTextComponent("1540-RE-001\nCONVERTER"),
    },

    // CONTROLLERS
    "1540-TIC-5224": {
      tag: L2ConverterElement["1540-TIC-5224"],
      description: "Pass 4 Inlet Temp Controller",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      ...tic5224,
      component: getFaceplate(
        "1540-TIC-5224",
        "Pass 4 Inlet Temp Controller",
        tic5224.config,
        tic5224.data,
        isLocked,
        true,
      ),
    },
    "1540-TIC-5220": {
      tag: L2ConverterElement["1540-TIC-5220"],
      description: "Pass 3 Inlet Temp Controller",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      ...tic5220,
      component: getFaceplate(
        "1540-TIC-5220",
        "Pass 3 Inlet Temp Controller",
        tic5220.config,
        tic5220.data,
        isLocked,
        true,
      ),
    },
    "1540-TIC-4822": {
      tag: L2ConverterElement["1540-TIC-4822"],
      description: "Pass 2 Inlet Temperature",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      ...tic4822,
      component: getFaceplate(
        "1540-TIC-4822",
        "Pass 2 Inlet Temperature",
        tic4822.config,
        tic4822.data,
        isLocked,
        true,
      ),
    },
    "1540-H-4282": {
      tag: L2ConverterElement["1540-H-4282"],
      description: "Jug Valve Controller",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      ...h4282,
      component: getFaceplate(
        "1540-H-4282",
        "Jug Valve Controller",
        h4282.config,
        h4282.data,
        isLocked,
        true,
      ),
    },
    "1540-TI-4820": {
      tag: L2ConverterElement["1540-TI-4820"],
      description: "Temperature Controller",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...ti4820_cont,
      component: getFaceplate(
        "1540-TI-4820",
        "Temperature Controller",
        ti4820_cont.config,
        ti4820_cont.data,
        isLocked,
        false,
      ),
    },
    "1520-TI-5821": {
      tag: L2ConverterElement["1520-TI-5821"],
      description: "Temperature Sensor",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...ti5821_cont,
      component: getFaceplate(
        "1520-TI-5821",
        "Temperature Sensor",
        ti5821_cont.config,
        ti5821_cont.data,
        isLocked,
        false,
      ),
    },

    // SENSORS (OUTLETS)
    "1540-TI-7225": {
      tag: L2ConverterElement["1540-TI-7225"],
      description: "Catalyst Pass 4 Outlet Temperature",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...ti7225,
      component: getFaceplate(
        "1540-TI-7225",
        "Catalyst Pass 4 Outlet Temperature",
        ti7225.config,
        ti7225.data,
        isLocked,
        false,
      ),
    },
    "1540-TI-5231": {
      tag: L2ConverterElement["1540-TI-5231"],
      description: "Catalyst Pass 3 Outlet Temperature",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...ti5231,
      component: getFaceplate(
        "1540-TI-5231",
        "Catalyst Pass 3 Outlet Temperature",
        ti5231.config,
        ti5231.data,
        isLocked,
        false,
      ),
    },
    "1540-TI-5232": {
      tag: L2ConverterElement["1540-TI-5232"],
      description: "Catalyst Pass 2 Outlet Temperature",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...ti5232,
      component: getFaceplate(
        "1540-TI-5232",
        "Catalyst Pass 2 Outlet Temperature",
        ti5232.config,
        ti5232.data,
        isLocked,
        false,
      ),
    },
    "1540-TI-4844": {
      tag: L2ConverterElement["1540-TI-4844"],
      description: "Temperature Sensor",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...ti4844,
      component: getFaceplate(
        "1540-TI-4844",
        "Temperature Sensor",
        ti4844.config,
        ti4844.data,
        isLocked,
        false,
      ),
    },
    "1540-TI-4845": {
      tag: L2ConverterElement["1540-TI-4845"],
      description: "Temperature Sensor",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...ti4845,
      component: getFaceplate(
        "1540-TI-4845",
        "Temperature Sensor",
        ti4845.config,
        ti4845.data,
        isLocked,
        false,
      ),
    },
    "1540-TI-4842": {
      tag: L2ConverterElement["1540-TI-4842"],
      description: "Temperature Sensor",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...ti4842,
      component: getFaceplate(
        "1540-TI-4842",
        "Temperature Sensor",
        ti4842.config,
        ti4842.data,
        isLocked,
        false,
      ),
    },
    "1540-TI-4843": {
      tag: L2ConverterElement["1540-TI-4843"],
      description: "Temperature Sensor",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...ti4843,
      component: getFaceplate(
        "1540-TI-4843",
        "Temperature Sensor",
        ti4843.config,
        ti4843.data,
        isLocked,
        false,
      ),
    },
    "1540-TI-4840": {
      tag: L2ConverterElement["1540-TI-4840"],
      description: "Temperature Sensor",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...ti4840,
      component: getFaceplate(
        "1540-TI-4840",
        "Temperature Sensor",
        ti4840.config,
        ti4840.data,
        isLocked,
        false,
      ),
    },
    "1540-TI-4841": {
      tag: L2ConverterElement["1540-TI-4841"],
      description: "Temperature Sensor",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...ti4841,
      component: getFaceplate(
        "1540-TI-4841",
        "Temperature Sensor",
        ti4841.config,
        ti4841.data,
        isLocked,
        false,
      ),
    },
    "1540-TI-4825": {
      tag: L2ConverterElement["1540-TI-4825"],
      description: "Temperature Sensor",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...ti4825,
      component: getFaceplate(
        "1540-TI-4825",
        "Temperature Sensor",
        ti4825.config,
        ti4825.data,
        isLocked,
        false,
      ),
    },
    "1540-TI-4846": {
      tag: L2ConverterElement["1540-TI-4846"],
      description: "Temperature Sensor",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...ti4846,
      component: getFaceplate(
        "1540-TI-4846",
        "Temperature Sensor",
        ti4846.config,
        ti4846.data,
        isLocked,
        false,
      ),
    },
    "1540-TI-4827": {
      tag: L2ConverterElement["1540-TI-4827"],
      description: "Temperature Sensor",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...ti4827,
      component: getFaceplate(
        "1540-TI-4827",
        "Temperature Sensor",
        ti4827.config,
        ti4827.data,
        isLocked,
        false,
      ),
    },
    "1540-TI-4826": {
      tag: L2ConverterElement["1540-TI-4826"],
      description: "Temperature Sensor",
      type: ElementType.TemperatureSensor,
      blockType: BlockType.Sensor,
      ...ti4826,
      component: getFaceplate(
        "1540-TI-4826",
        "Temperature Sensor",
        ti4826.config,
        ti4826.data,
        isLocked,
        false,
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

export default L2ConverterElementsMap;
