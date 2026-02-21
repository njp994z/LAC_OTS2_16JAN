import { TempSensorPrimaryFaceplate } from "@/delta-v/components/faceplate/TempSensorPrimaryFaceplate";
import { useControllerSync } from "@/delta-v/contexts/ControllerSyncContext";
import { SecondaryControllerConfig } from "@/delta-v/types/secondaryController";
import { defaultControllerData, type ControllerData } from "@/delta-v/types/controller";

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

export enum L1SystemElement {
    '1540-PI-4072' = '1540-PI-4072',
    '1540-TI-4200A' = '1540-TI-4200A',
    '1540-H-4030' = '1540-H-4030',
    '1540-GB-001' = '1540-GB-001',
    '1540-PI-4002' = '1540-PI-4002',
    '1540-VCF-2602' = '1540-VCF-2602',
    '1540-F-2602' = '1540-F-2602',
    '1540-PI-2604' = '1540-PI-2604',
    '1540-TI-4020' = '1540-TI-4020',
    '1540-HCV-4282' = '1540-HCV-4282',
    '1540-TIC-4822' = '1540-TIC-4822',
    '1540-TI-8721' = '1540-TI-8721',
    '1560-TG-001' = '1560-TG-001',
    '1540-TIC-5224' = '1540-TIC-5224',
    '1540-TI-7225' = '1540-TI-7225',
    '1540-TIC-5220' = '1540-TIC-5220',
    '1540-TI-5232' = '1540-TI-5232',
    '1540-TIC-7221' = '1540-TIC-7221',
    '1540-TI-5231' = '1540-TI-5231',
    '1540-TI-8421' = '1540-TI-8421',
    '1540-TIC-7224' = '1540-TIC-7224',
    '1520-TI-6624' = '1520-TI-6624',

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

    //Text Elements
    "To Acid Pump Tank" = "To Acid Pump Tank",
    "From Acid System" = "From Acid System",
    "To SO2 Scrubber" = "To SO2 Scrubber",
    "From SO2 Scrubber" = "From SO2 Scrubber",
    "Ambient Air" = "Ambient Air",
    "SUPERHEATER 1B 1540-HX-003" = "SUPERHEATER 1B 1540-HX-003",
    "HOT INTERPASS HX 1540-HX-009" = "HOT INTERPASS HX 1540-HX-009",
    "COLD INTERPASS HX 1540-HX-008" = "COLD INTERPASS HX 1540-HX-008",
    "HP SUPERHEATER 4A ECONOMIZER 4C / 4A 1540-HX-004/006/007" = "HP SUPERHEATER 4A ECONOMIZER 4C / 4A 1540-HX-004/006/007",
    "ECONOMIZER 3B 1540-HX-002" = "ECONOMIZER 3B 1540-HX-002",
    
}

export const L1SystemElements = [
    L1SystemElement['1540-PI-4072'],
    L1SystemElement['1540-TI-4200A'],
    L1SystemElement['1540-H-4030'],
    L1SystemElement['1540-GB-001'],
    L1SystemElement['1540-PI-4002'],
    L1SystemElement['1540-VCF-2602'],
    L1SystemElement['1540-F-2602'],
    L1SystemElement['1540-PI-2604'],
    L1SystemElement['1540-TI-4020'],
    L1SystemElement['1540-HCV-4282'],
    L1SystemElement['1540-TIC-4822'],
    L1SystemElement['1540-TI-8721'],
    L1SystemElement['1560-TG-001'],
    L1SystemElement['1540-TIC-5224'],
    L1SystemElement['1540-TI-7225'],
    L1SystemElement['1540-TIC-5220'],
    L1SystemElement['1540-TI-5232'],
    L1SystemElement['1540-TIC-7221'],
    L1SystemElement['1540-TI-5231'],
    L1SystemElement['1540-TI-8421'],
    L1SystemElement['1540-TIC-7224'],
    L1SystemElement['1520-TI-6624'],

    // Image Elements
    L1SystemElement['IPAT'],
    L1SystemElement['FAT'],
    L1SystemElement['CIP'],
    L1SystemElement['SH42EC4cEC4a'],
    L1SystemElement['HIP'],
    L1SystemElement['EC3B'],
    L1SystemElement['SH1B'],
    L1SystemElement['Converter4'],
    L1SystemElement['IndustrialFilter'],
    L1SystemElement['DT'],

    //Text Elements
    L1SystemElement['To Acid Pump Tank'],
    L1SystemElement['From Acid System'],
    L1SystemElement['To SO2 Scrubber'],
    L1SystemElement['From SO2 Scrubber'],
    L1SystemElement['Ambient Air'],
    L1SystemElement['SUPERHEATER 1B 1540-HX-003'],
    L1SystemElement['HOT INTERPASS HX 1540-HX-009'],
    L1SystemElement['COLD INTERPASS HX 1540-HX-008'],
    L1SystemElement['HP SUPERHEATER 4A ECONOMIZER 4C / 4A 1540-HX-004/006/007'],
    L1SystemElement['ECONOMIZER 3B 1540-HX-002']
];

const L1SystemElementsMap = (getControllerConfig: (controllerId: string) => SecondaryControllerConfig, isLocked: boolean) => {

        //1540-PI-4072
    //Compressor Inlet Pressure
    const compressorInletPressure4072Config = getControllerConfig(L1SystemElement['1540-PI-4072']);
    const compressorInletPressure4072Data = useControllerSync(L1SystemElement['1540-PI-4072']);


    //1540-TI-4200A
    //Furnace Outlet Temperature A
    const furnaceOutletTemperature4200AConfig = getControllerConfig(L1SystemElement['1540-TI-4200A']);
    const furnaceOutletTemperature4200AData = useControllerSync(L1SystemElement['1540-TI-4200A']);

    //1540-H-4030
    //1540-H-4030 Main Compressor Controller
    const compressorController4030Config = getControllerConfig(L1SystemElement['1540-H-4030']);
    const compressorController4030Data = useControllerSync(L1SystemElement['1540-H-4030']);


    //1540-GB-001
    //Main Compressor
    const mainCompressor001Config = getControllerConfig(L1SystemElement['1540-GB-001']);
    const mainCompressor001Data = useControllerSync(L1SystemElement['1540-GB-001']);

    //1540-PI-4002
    // compressor outlet pressure
    const compressorOutletPressure4002Config = getControllerConfig(L1SystemElement['1540-PI-4002']);
    const compressorOutletPressure4002Data = useControllerSync(L1SystemElement['1540-PI-4002']);

    //1540-VCF-2602
    // Sulpur Controller Valve
    const sulfurControllerValve2602Config = getControllerConfig(L1SystemElement['1540-VCF-2602']);
    const sulfurControllerValve2602Data = useControllerSync(L1SystemElement['1540-VCF-2602']);
 

    //1540-F-2602
    //Sulphuric Flow Controller
    const sulphuricFlowController2602Config = getControllerConfig(L1SystemElement['1540-F-2602']);
    const sulphuricFlowController2602Data = useControllerSync(L1SystemElement['1540-F-2602']);

    //1540-PI-2604
    //Furnace Sulfur Inlet Pressure
    const furnaceSulfurInletPressure2604Config = getControllerConfig(L1SystemElement['1540-PI-2604']);
    const furnaceSulfurInletPressure2604Data = useControllerSync(L1SystemElement['1540-PI-2604']);

    //1540-TI-4020
    //Furnace Inlet Temperature
    const furnaceInletTemperature4020Config = getControllerConfig(L1SystemElement['1540-TI-4020']);
    const furnaceInletTemperature4020Data = useControllerSync(L1SystemElement['1540-TI-4020']);



    //1540-HCV-4282
    //Jug Controller Valve
    const jugControllerValve4282Config = getControllerConfig(L1SystemElement['1540-HCV-4282']);
    const jugControllerValve4282Data = useControllerSync(L1SystemElement['1540-HCV-4282']);

    //1540-TIC-4822
    // Pass 2 Inlet Temperature
    const pass2InletTemperature4822Config = getControllerConfig(L1SystemElement['1540-TIC-4822']);
    const pass2InletTemperature4822Data = useControllerSync(L1SystemElement['1540-TIC-4822']);

    //1540-TI-8721
    //Pass 1 Outlet Temperature
    const pass1OutletTemperature8721Config = getControllerConfig(L1SystemElement['1540-TI-8721']);
    const pass1OutletTemperature8721Data = useControllerSync(L1SystemElement['1540-TI-8721']);

    //1560-TG-001
    //Pass 2 Turbo Generator Set
    const pass2TurboGeneratorSet001Config = getControllerConfig(L1SystemElement['1560-TG-001']);
    const pass2TurboGeneratorSet001Data = useControllerSync(L1SystemElement['1560-TG-001']);

    //1540-TIC-5224
    //Pass 4 Inlet Temperature
    const pass4InletTemperature5224Config = getControllerConfig(L1SystemElement['1540-TIC-5224']);
    const pass4InletTemperature5224Data = useControllerSync(L1SystemElement['1540-TIC-5224']);

    //1540-TI-7225
    //Pass 4 Outlet Temperature
    const pass4OutletTemperature7225Config = getControllerConfig(L1SystemElement['1540-TI-7225']);
    const pass4OutletTemperature7225Data = useControllerSync(L1SystemElement['1540-TI-7225']);

    //1540-TIC-5220
    //Pass 2 Inlet Temperature
    const pass2InletTemperature5220Config = getControllerConfig(L1SystemElement['1540-TIC-5220']);
    const pass2InletTemperature5220Data = useControllerSync(L1SystemElement['1540-TIC-5220']);

    //1540-TI-5232
    //Pass 2 Outlet Temperature
    const pass2OutletTemperature5232Config = getControllerConfig(L1SystemElement['1540-TI-5232']);
    const pass2OutletTemperature5232Data = useControllerSync(L1SystemElement['1540-TI-5232']);

    //1540-TIC-7221
    //Economizer 4A Outlet Temp.
    const economizer4AOutletTemp7221Config = getControllerConfig(L1SystemElement['1540-TIC-7221']);
    const economizer4AOutletTemp7221Data = useControllerSync(L1SystemElement['1540-TIC-7221']);

    //1540-TI-5231
    //Pass 3 Outlet Temperature
    const pass3OutletTemperature5231Config = getControllerConfig(L1SystemElement['1540-TI-5231']);
    const pass3OutletTemperature5231Data = useControllerSync(L1SystemElement['1540-TI-5231']);

    //1540-TI-8421
    //CIP Inlet Temperature
    const cipInletTemperature8421Config = getControllerConfig(L1SystemElement['1540-TI-8421']);
    const cipInletTemperature8421Data = useControllerSync(L1SystemElement['1540-TI-8421']);

    //1540-TIC-7224
    //Economizer 3B Outlet Temp.
    const economizer3BOutletTemp7224Config = getControllerConfig(L1SystemElement['1540-TIC-7224']);
    const economizer3BOutletTemp7224Data = useControllerSync(L1SystemElement['1540-TIC-7224']);

    //1520-TI-6624
    //FAT Outlet Temperature
    const fatOutletTemperature6624Config = getControllerConfig(L1SystemElement['1520-TI-6624']);
    const fatOutletTemperature6624Data = useControllerSync(L1SystemElement['1520-TI-6624']);

    return {
        "1540-PI-4072": {
            tag: L1SystemElement["1540-PI-4072"],
            description: "Compressor Inlet Pressure",
            config: compressorInletPressure4072Config,
            data: compressorInletPressure4072Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: compressorInletPressure4072Config?.TAGNAME,
                        description: compressorInletPressure4072Config?.DESC || 'Compressor Inlet Pressure',
                        pv: compressorInletPressure4072Data?.state?.syncedPV ?? 0,
                        sp: compressorInletPressure4072Data?.state?.syncedSP ?? 0,
                        out: compressorInletPressure4072Data?.state?.syncedOUT ?? 0,
                        mode: compressorInletPressure4072Data?.state?.syncedMode ?? 'AUTO',
                        pvUnits: compressorInletPressure4072Config?.EU || '°C',
                        pvRangeMin: compressorInletPressure4072Config?.SP_LIM_LO ?? 0,
                        pvRangeMax: compressorInletPressure4072Config?.SP_LIM_HI ?? 500,
                        alarmActive: compressorInletPressure4072Data?.state?.alarmStates?.HH || compressorInletPressure4072Data?.state?.alarmStates?.H ||
                            compressorInletPressure4072Data?.state?.alarmStates?.L || compressorInletPressure4072Data?.state?.alarmStates?.LL || false,
                        alarmColor: (compressorInletPressure4072Data?.state?.alarmStates?.HH || compressorInletPressure4072Data?.state?.alarmStates?.LL) ? 'red' :
                            (compressorInletPressure4072Data?.state?.alarmStates?.H || compressorInletPressure4072Data?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: compressorInletPressure4072Config?.ALM_LL_LIM,
                        alarmL: compressorInletPressure4072Config?.ALM_L_LIM,
                        alarmH: compressorInletPressure4072Config?.ALM_H_LIM,
                        alarmHH: compressorInletPressure4072Config?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-H-4030": {
            tag: L1SystemElement["1540-H-4030"],
            description: "1540-H-4030 Main Compressor Controller",
            config: compressorController4030Config,
            data: compressorController4030Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: compressorController4030Config?.TAGNAME,
                        description: compressorController4030Config?.DESC || 'Main Compressor Controller',
                        pv: compressorController4030Data?.state?.syncedPV ?? 0,
                        sp: compressorController4030Data?.state?.syncedSP ?? 0,
                        out: compressorController4030Data?.state?.syncedOUT ?? 0,
                        mode: compressorController4030Data?.state?.syncedMode ?? 'AUTO',
                        pvUnits: compressorController4030Config?.EU || '°C',
                        pvRangeMin: compressorController4030Config?.SP_LIM_LO ?? 0,
                        pvRangeMax: compressorController4030Config?.SP_LIM_HI ?? 500,
                        alarmActive: compressorController4030Data?.state?.alarmStates?.HH || compressorController4030Data?.state?.alarmStates?.H ||
                            compressorController4030Data?.state?.alarmStates?.L || compressorController4030Data?.state?.alarmStates?.LL || false,
                        alarmColor: (compressorController4030Data?.state?.alarmStates?.HH || compressorController4030Data?.state?.alarmStates?.LL) ? 'red' :
                            (compressorController4030Data?.state?.alarmStates?.H || compressorController4030Data?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: compressorInletPressure4072Config?.ALM_LL_LIM,
                        alarmL: compressorInletPressure4072Config?.ALM_L_LIM,
                        alarmH: compressorInletPressure4072Config?.ALM_H_LIM,
                        alarmHH: compressorInletPressure4072Config?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-GB-001": {
            tag: L1SystemElement["1540-GB-001"],
            description: "Main Compressor",
            config: mainCompressor001Config,
            data: mainCompressor001Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: mainCompressor001Config?.TAGNAME,
                        description: mainCompressor001Config?.DESC || 'Main Compressor',
                        pv: mainCompressor001Data?.state?.syncedPV ?? 0,
                        sp: mainCompressor001Data?.state?.syncedSP ?? 0,
                        out: mainCompressor001Data?.state?.syncedOUT ?? 0,
                        mode: mainCompressor001Data?.state?.syncedMode ?? 'AUTO',
                        pvUnits: mainCompressor001Config?.EU || '°C',
                        pvRangeMin: mainCompressor001Config?.SP_LIM_LO ?? 0,
                        pvRangeMax: mainCompressor001Config?.SP_LIM_HI ?? 500,
                        alarmActive: mainCompressor001Data?.state?.alarmStates?.HH || mainCompressor001Data?.state?.alarmStates?.H ||
                            mainCompressor001Data?.state?.alarmStates?.L || mainCompressor001Data?.state?.alarmStates?.LL || false,
                        alarmColor: (mainCompressor001Data?.state?.alarmStates?.HH || mainCompressor001Data?.state?.alarmStates?.LL) ? 'red' :
                            (mainCompressor001Data?.state?.alarmStates?.H || mainCompressor001Data?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: mainCompressor001Config?.ALM_LL_LIM,
                        alarmL: mainCompressor001Config?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-PI-4002": {
            tag: "1540-PI-4002",
            description: "Compressor Outlet Pressure",
            config: compressorOutletPressure4002Config,
            data: compressorOutletPressure4002Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-VCF-2602": {
            tag: "1540-VCF-2602",
            description: "Sulpur Controller Valve",
            config: sulfurControllerValve2602Config,
            data: sulfurControllerValve2602Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-F-2602": {
            tag: "1540-F-2602",
            description: "Sulphuric Flow Controller",
            config: sulphuricFlowController2602Config,
            data: sulphuricFlowController2602Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-PI-2604": {
            tag: "1540-PI-2604",
            description: "Furnace Sulfur Inlet Pressure",
            config: furnaceSulfurInletPressure2604Config,
            data: furnaceSulfurInletPressure2604Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-TI-4020": {
            tag: "1540-TI-4020",
            description: "Furnace Inlet Temperature",
            config: furnaceInletTemperature4020Config,
            data: furnaceInletTemperature4020Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-HCV-4282": {
            tag: "1540-HCV-4282",
            description: "Jug Controller Valve",
            config: jugControllerValve4282Config,
            data: jugControllerValve4282Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-TIC-4822": {
            tag: "1540-TIC-4822",
            description: "Pass 2 Inlet Temperature",
            config: pass2InletTemperature4822Config,
            data: pass2InletTemperature4822Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-TI-8721": {
            tag: "1540-TI-8721",
            description: "Pass 1 Outlet Temperature",
            config: pass1OutletTemperature8721Config,
            data: pass1OutletTemperature8721Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1560-TG-001": {
            tag: "1560-TG-001",
            description: "Pass 2 Turbo Generator Set",
            config: pass2TurboGeneratorSet001Config,
            data: pass2TurboGeneratorSet001Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-TIC-5224": {
            tag: "1540-TIC-5224",
            description: "Pass 4 Inlet Temperature",
            config: pass4InletTemperature5224Config,
            data: pass4InletTemperature5224Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-TI-7225": {
            tag: "1540-TI-7225",
            description: "Pass 4 Outlet Temperature",
            config: pass4OutletTemperature7225Config,
            data: pass4OutletTemperature7225Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-TIC-5220": {
            tag: "1540-TIC-5220",
            description: "Pass 2 Inlet Temperature",
            config: pass2InletTemperature5220Config,
            data: pass2InletTemperature5220Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-TI-5232": {
            tag: "1540-TI-5232",
            description: "Pass 2 Outlet Temperature",
            config: pass2OutletTemperature5232Config,
            data: pass2OutletTemperature5232Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-TIC-7221": {
            tag: "1540-TIC-7221",
            description: "Economizer 4A Outlet Temp",
            config: economizer4AOutletTemp7221Config,
            data: economizer4AOutletTemp7221Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-TI-5231": {
            tag: "1540-TI-5231",
            description: "Pass 3 Outlet Temperature",
            config: pass3OutletTemperature5231Config,
            data: pass3OutletTemperature5231Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-TI-8421": {
            tag: "1540-TI-8421",
            description: "CIP Inlet Temperature",
            config: cipInletTemperature8421Config,
            data: cipInletTemperature8421Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-TIC-7224": {
            tag: "1540-TIC-7224",
            description: "Economizer 3B Outlet Temp",
            config: economizer3BOutletTemp7224Config,
            data: economizer3BOutletTemp7224Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1520-TI-6624": {
            tag: "1520-TI-6624",
            description: "FAT Outlet Temperature",
            config: fatOutletTemperature6624Config,
            data: fatOutletTemperature6624Data,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "1540-TI-4200A": {
            tag: "1540-TI-4200A",
            description: "Furnace Outlet Temperature A",
            config: furnaceOutletTemperature4200AConfig,
            data: furnaceOutletTemperature4200AData,
            component: <div
                className={`w-full p-4 h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                onClick={() => { }}
                style={{
                    //   transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
                    transformOrigin: 'center center'
                }}
            >
                <TempSensorPrimaryFaceplate
                    data={{
                        ...defaultControllerData,
                        instrumentTag: furnaceOutletTemperature4200AConfig?.TAGNAME,
                        description: furnaceOutletTemperature4200AConfig?.DESC || 'DT Gas Out Temperature',
                        pv: furnaceOutletTemperature4200AData?.state?.syncedPV ?? 0,
                        sp: furnaceOutletTemperature4200AData?.state?.syncedSP ?? 0,
                        out: furnaceOutletTemperature4200AData?.state?.syncedOUT ?? 0,
                        mode: furnaceOutletTemperature4200AData?.state?.syncedMode ?? 'AUTO',
                        pvUnits: furnaceOutletTemperature4200AConfig?.EU || '°C',
                        pvRangeMin: furnaceOutletTemperature4200AConfig?.SP_LIM_LO ?? 0,
                        pvRangeMax: furnaceOutletTemperature4200AConfig?.SP_LIM_HI ?? 500,
                        alarmActive: furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.H ||
                            furnaceOutletTemperature4200AData?.state?.alarmStates?.L || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL || false,
                        alarmColor: (furnaceOutletTemperature4200AData?.state?.alarmStates?.HH || furnaceOutletTemperature4200AData?.state?.alarmStates?.LL) ? 'red' :
                            (furnaceOutletTemperature4200AData?.state?.alarmStates?.H || furnaceOutletTemperature4200AData?.state?.alarmStates?.L) ? 'yellow' : undefined,
                        alarmLL: furnaceOutletTemperature4200AConfig?.ALM_LL_LIM,
                        alarmL: furnaceOutletTemperature4200AConfig?.ALM_L_LIM,
                        alarmH: furnaceOutletTemperature4200AConfig?.ALM_H_LIM,
                        alarmHH: furnaceOutletTemperature4200AConfig?.ALM_HH_LIM,
                    } as ControllerData}
                    isTransparent={true}
                />
            </div>
        },
        "DT": { tag: L1SystemElement["DT"], description: "Drying Tower", component: <DryingTower /> },
        "IPAT": { tag: L1SystemElement["IPAT"], description: "IPAT Tower", component: <IPAT /> },
        "FAT": { tag: L1SystemElement["FAT"], description: "Final Absorbing Tower", component: <FAT /> },
        "CIP": { tag: L1SystemElement["CIP"], description: "Cold Interpass Absorber", component: <CIP /> },
        "SH42EC4cEC4a": { tag: L1SystemElement["SH42EC4cEC4a"], description: "SH42EC4cEC4a", component: <SH42EC4cEC4a /> },
        "HIP": { tag: L1SystemElement["HIP"], description: "Hot Interpass Absorber", component: <HIP /> },
        "EC3B": { tag: L1SystemElement["EC3B"], description: "Economizer 3B", component: <EC3B /> },
        "SH1B": { tag: L1SystemElement["SH1B"], description: "Superheater 1B", component: <SH1B /> },
        "Converter4": { tag: L1SystemElement["Converter4"], description: "Converter 4", component: <Converter4 /> },
        "IndustrialFilter": { tag: L1SystemElement["IndustrialFilter"], description: "Industrial Filter", component: <IndustrialFilter /> },
        "To Acid Pump Tank": { tag: L1SystemElement["To Acid Pump Tank"], description: "To Acid Pump Tank", 
        component: <div className=" text-black text-lg font-semibold text-center">
                <p>
                    To Acid 
                    <br />
                    Pump Tank
                </p>
            </div> },
        "From Acid System": { tag: L1SystemElement["From Acid System"], description: "From Acid System", 
        component: <div className=" text-black text-lg font-semibold text-center">
                <p>From Acid
                <br />
                System</p>
            </div> },
        "Ambient Air": { tag: L1SystemElement["Ambient Air"], description: "Ambient Air", 
        component: <div className=" text-black text-lg font-semibold text-center">
                <p>Ambient
                <br />
                Air</p>
            </div> },
        "To SO2 Scrubber": { tag: L1SystemElement["To SO2 Scrubber"], description: "To SO2 Scrubber", 
        component: <div className=" text-black text-lg font-semibold text-center">
                <p>
                    To SO2
                    <br />
                    Scrubber
                </p>
            </div> },
        "From SO2 Scrubber": { tag: L1SystemElement["From SO2 Scrubber"], description: "From SO2 Scrubber", 
        component: <div className=" text-black text-lg font-semibold text-center">
                <p>
                    From SO2
                    <br />
                    Scrubber
                </p>
            </div> },

        "SUPERHEATER 1B 1540-HX-003": { tag: L1SystemElement["SUPERHEATER 1B 1540-HX-003"], description: "SUPERHEATER 1B 1540-HX-003", 
        component: <div className=" text-black text-lg font-semibold text-center">
                <p>
                    SUPERHEATER 1B
                    <br />
                    1540-HX-003
                </p>
            </div> },
        "HOT INTERPASS HX 1540-HX-009": { tag: L1SystemElement["HOT INTERPASS HX 1540-HX-009"], description: "HOT INTERPASS HX 1540-HX-009", 
        component: <div className=" text-black text-lg font-semibold text-center">
                <p>
                    HOT INTERPASS HX
                    <br />
                    1540-HX-009
                </p>
            </div> },
        "COLD INTERPASS HX 1540-HX-008": { tag: L1SystemElement["COLD INTERPASS HX 1540-HX-008"], description: "COLD INTERPASS HX 1540-HX-008", 
        component: <div className=" text-black text-lg font-semibold text-center">
                <p>
                    COLD INTERPASS HX
                    <br />
                    1540-HX-008
                </p>
            </div> },
        "HP SUPERHEATER 4A ECONOMIZER 4C / 4A 1540-HX-004/006/007": { tag: L1SystemElement["HP SUPERHEATER 4A ECONOMIZER 4C / 4A 1540-HX-004/006/007"], description: "HP SUPERHEATER 4A ECONOMIZER 4C / 4A 1540-HX-004/006/007", 
        component: <div className=" text-black text-lg font-semibold text-center">
                <p>
                    HP SUPERHEATER 4A
                    <br />
                    ECONOMIZER 4C / 4A
                    <br />
                    1540-HX-004/006/007
                </p>
            </div> },
        "ECONOMIZER 3B 1540-HX-002": { tag: L1SystemElement["ECONOMIZER 3B 1540-HX-002"], description: "ECONOMIZER 3B 1540-HX-002", 
        component: <div className=" text-black text-lg font-semibold text-center">
                <p>
                    ECONOMIZER 3B
                    <br />
                    1540-HX-002
                </p>
            </div> },
    }

}

export default L1SystemElementsMap;