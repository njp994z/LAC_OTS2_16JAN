import React from "react";
import Converter4 from "../components/converter4";
import { TempSensorPrimaryFaceplate } from "@/delta-v/components/faceplate/TempSensorPrimaryFaceplate";
import { ControllerFaceplate } from "@/delta-v/components/faceplate/ControllerFaceplate";
import { SecondaryControllerConfig } from "@/delta-v/types/secondaryController";
import { useControllerSync } from "@/delta-v/contexts/ControllerSyncContext";
import { ControllerData, defaultControllerData } from "@/delta-v/types/controller";

export enum L2ConverterElement {
  // Image Elements
  "Converter4" = "Converter4",

  // TI Elements
  "1540-TI-4820" = "1540-TI-4820",

  // TIC Elements
  "1540-TIC-5224" = "1540-TIC-5224",
  "1540-TIC-5220" = "1540-TIC-5220",
  "1540-TIC-4822" = "1540-TIC-4822",

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

  // "1540-H-4282" = "1540-H-4282",

  // "1540-TI-7821" = "1540-TI-7821",

}

export const L2ConverterElements: string[] = Object.values(L2ConverterElement);

export enum ElementType {
  Image,
  Text,
  TemparatureSensor,
  TemperatureController,
  PressureSensor,
}

export enum BlockType {
  Image = "image",
  Text = "text",
  Controller = "controller",
  Sensor = "sensor",
}

// ---------------------------------------------------------------------------
// Elements map
// ---------------------------------------------------------------------------
const L2ConverterElementsMap = (
  getControllerConfig: (controllerId: string) => SecondaryControllerConfig,
  isLocked: boolean,
) => {
  // 1540-TI-4820
  //Catalyst Pass 4 Inlet Temperature
  const TI4820Config = getControllerConfig(
    L2ConverterElement["1540-TI-4820"],
  );
  const TI4820Data = useControllerSync(
    L2ConverterElement["1540-TI-4820"],
  );

    // 1540-TIC-5224
  //Pass 4 Inlet Temperature
  const TIC5224Config = getControllerConfig(
    L2ConverterElement["1540-TIC-5224"],
  );
  const TIC5224Data = useControllerSync(
    L2ConverterElement["1540-TIC-5224"],
  );

  //1540-TIC-5220
  // Pass 3 Inlet Temperature
  const TIC5220Config = getControllerConfig(
    L2ConverterElement["1540-TIC-5220"],
  );
  const TIC5220Data = useControllerSync(
    L2ConverterElement["1540-TIC-5220"],
  );

  //1540-TIC-4822
  //Pass 2 Inlet Temperature
  const TIC4822Config = getControllerConfig(
    L2ConverterElement["1540-TIC-4822"],
  );
  const TIC4822Data = useControllerSync(
    L2ConverterElement["1540-TIC-4822"],
  );




  return {
    "1540-TIC-5224": {
      tag: L2ConverterElement["1540-TIC-5224"],
      description: "Pass 4 Inlet Temperature Controller",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      config: TIC5224Config,
      data: TIC5224Data,
      component: <div
        className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
        style={{ transformOrigin: 'center center' }}
      >
        <ControllerFaceplate
          data={{
            ...defaultControllerData,
            instrumentTag: TIC5224Config?.TAGNAME,
            description: TIC5224Config?.DESC || 'Pass 4 Inlet Temperature Controller',
            pv: TIC5224Data?.state?.syncedPV ?? 0,
            sp: TIC5224Data?.state?.syncedSP ?? 0,
            out: TIC5224Data?.state?.syncedOUT ?? 0,
            mode: TIC5224Data?.state?.syncedMode ?? 'AUTO',
            pvUnits: TIC5224Config?.EU || '°C',
            pvRangeMin: TIC5224Config?.SP_LIM_LO ?? 0,
            pvRangeMax: TIC5224Config?.SP_LIM_HI ?? 500,
            alarmActive: TIC5224Data?.state?.alarmStates?.HH || TIC5224Data?.state?.alarmStates?.H ||
              TIC5224Data?.state?.alarmStates?.L || TIC5224Data?.state?.alarmStates?.LL || false,
            alarmColor: (TIC5224Data?.state?.alarmStates?.HH || TIC5224Data?.state?.alarmStates?.LL) ? 'red' :
              (TIC5224Data?.state?.alarmStates?.H || TIC5224Data?.state?.alarmStates?.L) ? 'yellow' : undefined,
            alarmLL: TIC5224Config?.ALM_LL_LIM,
            alarmL: TIC5224Config?.ALM_L_LIM,
            alarmH: TIC5224Config?.ALM_H_LIM,
            alarmHH: TIC5224Config?.ALM_HH_LIM,
          } as ControllerData}
          isTransparent={true}
        />
      </div>
    },
    "1540-TIC-5220": {
      tag: L2ConverterElement["1540-TIC-5220"],
      description: "Pass 3 Inlet Temperature Controller",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      config: TIC5220Config,
      data: TIC5220Data,
      component: <div
        className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
        style={{ transformOrigin: 'center center' }}
      >
        <ControllerFaceplate
          data={{
            ...defaultControllerData,
            instrumentTag: TIC5220Config?.TAGNAME,
            description: TIC5220Config?.DESC || 'Pass 3 Inlet Temperature Controller',
            pv: TIC5220Data?.state?.syncedPV ?? 0,
            sp: TIC5220Data?.state?.syncedSP ?? 0,
            out: TIC5220Data?.state?.syncedOUT ?? 0,
            mode: TIC5220Data?.state?.syncedMode ?? 'AUTO',
            pvUnits: TIC5220Config?.EU || '°C',
            pvRangeMin: TIC5220Config?.SP_LIM_LO ?? 0,
            pvRangeMax: TIC5220Config?.SP_LIM_HI ?? 500,
            alarmActive: TIC5220Data?.state?.alarmStates?.HH || TIC5220Data?.state?.alarmStates?.H ||
              TIC5220Data?.state?.alarmStates?.L || TIC5220Data?.state?.alarmStates?.LL || false,
            alarmColor: (TIC5220Data?.state?.alarmStates?.HH || TIC5220Data?.state?.alarmStates?.LL) ? 'red' :
              (TIC5220Data?.state?.alarmStates?.H || TIC5220Data?.state?.alarmStates?.L) ? 'yellow' : undefined,
            alarmLL: TIC5220Config?.ALM_LL_LIM,
            alarmL: TIC5220Config?.ALM_L_LIM,
            alarmH: TIC5220Config?.ALM_H_LIM,
            alarmHH: TIC5220Config?.ALM_HH_LIM,
          } as ControllerData}
          isTransparent={true}
        />
      </div>
    },
    "1540-TIC-4822": {
      tag: L2ConverterElement["1540-TIC-4822"],
      description: "Pass 2 Inlet Temperature Controller",
      type: ElementType.TemperatureController,
      blockType: BlockType.Sensor,
      config: TIC4822Config,
      data: TIC4822Data,
      component: <div
        className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
        style={{ transformOrigin: 'center center' }}
      >
        <ControllerFaceplate
          data={{
            ...defaultControllerData,
            instrumentTag: TIC4822Config?.TAGNAME,
            description: TIC4822Config?.DESC || 'Pass 2 Inlet Temperature Controller',
            pv: TIC4822Data?.state?.syncedPV ?? 0,
            sp: TIC4822Data?.state?.syncedSP ?? 0,
            out: TIC4822Data?.state?.syncedOUT ?? 0,
            mode: TIC4822Data?.state?.syncedMode ?? 'AUTO',
            pvUnits: TIC4822Config?.EU || '°C',
            pvRangeMin: TIC4822Config?.SP_LIM_LO ?? 0,
            pvRangeMax: TIC4822Config?.SP_LIM_HI ?? 500,
            alarmActive: TIC4822Data?.state?.alarmStates?.HH || TIC4822Data?.state?.alarmStates?.H ||
              TIC4822Data?.state?.alarmStates?.L || TIC4822Data?.state?.alarmStates?.LL || false,
            alarmColor: (TIC4822Data?.state?.alarmStates?.HH || TIC4822Data?.state?.alarmStates?.LL) ? 'red' :
              (TIC4822Data?.state?.alarmStates?.H || TIC4822Data?.state?.alarmStates?.L) ? 'yellow' : undefined,
            alarmLL: TIC4822Config?.ALM_LL_LIM,
            alarmL: TIC4822Config?.ALM_L_LIM,
            alarmH: TIC4822Config?.ALM_H_LIM,
            alarmHH: TIC4822Config?.ALM_HH_LIM,
          } as ControllerData}
          isTransparent={true}
        />
      </div>
    },
    "1540-TI-4820": {
      tag: L2ConverterElement["1540-TI-4820"],
      description: "Pass 1 Outlet Temperature",
      type: ElementType.TemparatureSensor,
      blockType: BlockType.Sensor,
      data: TI4820Data,
      config: TI4820Config,
      component: <div
        className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}

        style={{
          //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
          transformOrigin: 'center center'
        }}
      >
        <TempSensorPrimaryFaceplate
          data={{
            ...defaultControllerData,
            instrumentTag: TI4820Config?.TAGNAME,
            description: TI4820Config?.DESC || 'Pass 1 Outlet Temperature',
            pv: TI4820Data?.state?.syncedPV ?? 0,
            sp: TI4820Data?.state?.syncedSP ?? 0,
            out: TI4820Data?.state?.syncedOUT ?? 0,
            mode: TI4820Data?.state?.syncedMode ?? 'AUTO',
            pvUnits: TI4820Config?.EU || '°C',
            pvRangeMin: TI4820Config?.SP_LIM_LO ?? 0,
            pvRangeMax: TI4820Config?.SP_LIM_HI ?? 500,
            alarmActive: TI4820Data?.state?.alarmStates?.HH || TI4820Data?.state?.alarmStates?.H ||
              TI4820Data?.state?.alarmStates?.L || TI4820Data?.state?.alarmStates?.LL || false,
            alarmColor: (TI4820Data?.state?.alarmStates?.HH || TI4820Data?.state?.alarmStates?.LL) ? 'red' :
              (TI4820Data?.state?.alarmStates?.H || TI4820Data?.state?.alarmStates?.L) ? 'yellow' : undefined,
            alarmLL: TI4820Config?.ALM_LL_LIM,
            alarmL: TI4820Config?.ALM_L_LIM,
            alarmH: TI4820Config?.ALM_H_LIM,
            alarmHH: TI4820Config?.ALM_HH_LIM,
          } as ControllerData}
          isTransparent={true}
        />
      </div>
    },
    "Converter4": {
      tag: L2ConverterElement["Converter4"],
      description: "4-Pass Catalytic Converter",
      type: ElementType.Image,
      blockType: BlockType.Image,
      component: <Converter4 />,
    },
    "To CIP Bypass": {
      tag: L2ConverterElement["To CIP Bypass"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "To CIP Bypass",
      component: (
        <div className=" text-black text-lg font-semibold text-center">
          <p>
            To CIP
            <br />
            Bypass
          </p>
        </div>
      ),
    },
    "From HIP Outlet Cold-Side": {
      tag: L2ConverterElement["From HIP Outlet Cold-Side"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "From HIP Outlet Cold-Side",
      component: (
        <div className="text-black text-lg font-semibold text-center">
          <p>From HIP Outlet<br />Cold-Side</p>
        </div>
      ),
    },
    "To HIP Bypass": {
      tag: L2ConverterElement["To HIP Bypass"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "To HIP Bypass",
      component: (
        <div className="text-black text-lg font-semibold text-center">
          <p>To HIP<br />Bypass</p>
        </div>
      ),
    },
    "From HIP Outlet Hot-Side": {
      tag: L2ConverterElement["From HIP Outlet Hot-Side"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "From HIP Outlet Hot-Side",
      component: (
        <div className="text-black text-lg font-semibold text-center">
          <p>From HIP Outlet<br />Hot-Side</p>
        </div>
      ),
    },
    "To SH 1B Bypass": {
      tag: L2ConverterElement["To SH 1B Bypass"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "To SH 1B Bypass",
      component: (
        <div className="text-black text-lg font-semibold text-center">
          <p>To SH 1B<br />Bypass</p>
        </div>
      ),
    },
    "From Superheater 1B Outlet": {
      tag: L2ConverterElement["From Superheater 1B Outlet"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "From Superheater 1B Outlet",
      component: (
        <div className="text-black text-lg font-semibold text-center">
          <p>From Superheater<br />1B Outlet</p>
        </div>
      ),
    },
    "To Jug Valve on WHB": {
      tag: L2ConverterElement["To Jug Valve on WHB"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "To Jug Valve on WHB",
      component: (
        <div className="text-black text-lg font-semibold text-center">
          <p>To Jug Valve<br />on WHB</p>
        </div>
      ),
    },
    "From WHB Outlet": {
      tag: L2ConverterElement["From WHB Outlet"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "From WHB Outlet",
      component: (
        <div className="text-black text-lg font-semibold text-center">
          <p>From WHB<br />Outlet</p>
        </div>
      ),
    },
    "1540-RE-001 CONVERTER": {
      tag: L2ConverterElement["1540-RE-001 CONVERTER"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "1540-RE-001 CONVERTER",
      component: (
        <div className="text-black text-lg font-semibold text-center">
          <p>1540-RE-001<br />CONVERTER</p>
        </div>
      ),
    },
    "To Superheater 4A": {
      tag: L2ConverterElement["To Superheater 4A"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "To Superheater 4A",
      component: (
        <div className="text-black text-lg font-semibold text-center">
          <p>To Superheater<br />4A</p>
        </div>
      ),
    },
    "To CIP Hot-Side Inlet": {
      tag: L2ConverterElement["To CIP Hot-Side Inlet"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "To CIP Hot-Side Inlet",
      component: (
        <div className="text-black text-lg font-semibold text-center">
          <p>To CIP<br />Hot-Side Inlet</p>
        </div>
      ),
    },
    "To HIP Hot-Side Inlet": {
      tag: L2ConverterElement["To HIP Hot-Side Inlet"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "To HIP Hot-Side Inlet",
      component: (
        <div className="text-black text-lg font-semibold text-center">
          <p>To HIP<br />Hot-Side Inlet</p>
        </div>
      ),
    },
    "To Superheater 1B": {
      tag: L2ConverterElement["To Superheater 1B"],
      type: ElementType.Text,
      blockType: BlockType.Text,
      description: "To Superheater 1B",
      component: (
        <div className="text-black text-lg font-semibold text-center">
          <p>To Superheater<br />1B</p>
        </div>
      ),
    },
  } as Record<string, {
    tag: string;
    description: string;
    type: ElementType;
    blockType: BlockType;
    component: React.ReactNode;
  }>;
};

export default L2ConverterElementsMap;
