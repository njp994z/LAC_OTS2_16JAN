import {
  SecondaryControllerConfig,
  SecondaryControllerData,
  defaultSecondaryConfig,
  defaultSecondaryData,
} from '@/delta-v/types/secondaryController';
import { getControllerMetadata } from './controllerMetadata';

/**
 * Returns a controller-aware default configuration.
 * When no saved config exists, the controller will show its own tag/description
 * instead of falling back to the 1520-TIC-6670 defaults.
 */
export const getDefaultSecondaryControllerConfig = (
  controllerId: string
): SecondaryControllerConfig => {
  const metadata = getControllerMetadata(controllerId);
  
  // Controller-specific default overrides
  const controllerDefaults: Record<string, Partial<SecondaryControllerConfig>> = {
    '1540-HCV-4282': {
      // Jug Valve: Start with all indicators hidden
      SHOW_ALARM_CIRCLE: false,
      SHOW_NO_SYMBOL: false,
      SHOW_INTERLOCK_DIAMOND_INDICATOR: false,
      SHOW_BLUE_ALARM_INDICATOR: false,
      SHOW_BAD_IO_INDICATOR: false,
      SHOW_MODULE_NOT_RUNNING: false,
      SHOW_VALVE_TYPE_LABEL: false,
      SHOW_LOCK_INDICATOR: false,
      SHOW_OUTPUT_PATH_INDICATOR: false,
      SHOW_HOLD_INDICATOR: false,
      SHOW_INTERLOCK_INDICATOR: false,
    },
    '1540-FCV-2602': {
      // Flow Control Valve: Start with all indicators hidden
      SHOW_ALARM_CIRCLE: false,
      SHOW_NO_SYMBOL: false,
      SHOW_INTERLOCK_DIAMOND_INDICATOR: false,
      SHOW_BLUE_ALARM_INDICATOR: false,
      SHOW_BAD_IO_INDICATOR: false,
      SHOW_MODULE_NOT_RUNNING: false,
      SHOW_VALVE_TYPE_LABEL: false,
      SHOW_LOCK_INDICATOR: false,
      SHOW_OUTPUT_PATH_INDICATOR: false,
      SHOW_HOLD_INDICATOR: false,
      SHOW_INTERLOCK_INDICATOR: false,
    },
    '1540-HCV-4281': {
      // Jug Valve Positioner: Start with all indicators hidden
      SHOW_ALARM_CIRCLE: false,
      SHOW_NO_SYMBOL: false,
      SHOW_INTERLOCK_DIAMOND_INDICATOR: false,
      SHOW_BLUE_ALARM_INDICATOR: false,
      SHOW_BAD_IO_INDICATOR: false,
      SHOW_MODULE_NOT_RUNNING: false,
      SHOW_VALVE_TYPE_LABEL: false,
      SHOW_LOCK_INDICATOR: false,
      SHOW_OUTPUT_PATH_INDICATOR: false,
      SHOW_HOLD_INDICATOR: false,
      SHOW_INTERLOCK_INDICATOR: false,
    },
    '1540-H-4030': {
      // Main Compressor Hand Controller: Start with all indicators hidden
      SHOW_ALARM_CIRCLE: false,
      SHOW_NO_SYMBOL: false,
      SHOW_INTERLOCK_DIAMOND_INDICATOR: false,
      SHOW_BLUE_ALARM_INDICATOR: false,
      SHOW_BAD_IO_INDICATOR: false,
      SHOW_MODULE_NOT_RUNNING: false,
      SHOW_VALVE_TYPE_LABEL: false,
      SHOW_LOCK_INDICATOR: false,
      SHOW_OUTPUT_PATH_INDICATOR: false,
      SHOW_HOLD_INDICATOR: false,
      SHOW_INTERLOCK_INDICATOR: false,
    },
    '1540-H-4282': {
      // Jug Valve Hand Controller: Start with all indicators hidden
      SHOW_ALARM_CIRCLE: false,
      SHOW_NO_SYMBOL: false,
      SHOW_INTERLOCK_DIAMOND_INDICATOR: false,
      SHOW_BLUE_ALARM_INDICATOR: false,
      SHOW_BAD_IO_INDICATOR: false,
      SHOW_MODULE_NOT_RUNNING: false,
      SHOW_VALVE_TYPE_LABEL: false,
      SHOW_LOCK_INDICATOR: false,
      SHOW_OUTPUT_PATH_INDICATOR: false,
      SHOW_HOLD_INDICATOR: false,
      SHOW_INTERLOCK_INDICATOR: false,
    },
    '1540-H-4283': {
      // WHB Outlet dP Hand Controller: Start with all indicators hidden
      SHOW_ALARM_CIRCLE: false,
      SHOW_NO_SYMBOL: false,
      SHOW_INTERLOCK_DIAMOND_INDICATOR: false,
      SHOW_BLUE_ALARM_INDICATOR: false,
      SHOW_BAD_IO_INDICATOR: false,
      SHOW_MODULE_NOT_RUNNING: false,
      SHOW_VALVE_TYPE_LABEL: false,
      SHOW_LOCK_INDICATOR: false,
      SHOW_OUTPUT_PATH_INDICATOR: false,
      SHOW_HOLD_INDICATOR: false,
      SHOW_INTERLOCK_INDICATOR: false,
    },
    '1540-T-4822': {
      TYPICAL_PV: 806,
      PV_SCALE_LO: 700,
      PV_SCALE_HI: 900,
      SP_LIM_LO: 700,
      SP_LIM_HI: 900,
      EU: '°F',
      DESC: 'Pass 2 Inlet Temperature',
      ALM_LL_LIM: 797,
      ALM_L_LIM: 0,
      ALM_H_LIM: 824,
      ALM_HH_LIM: 0,
      ALM_DL_LIM: 0,
      ALM_DH_LIM: 0,
    },
    '1540-T-5220': {
      TYPICAL_PV: 806,
      PV_SCALE_LO: 700,
      PV_SCALE_HI: 900,
      SP_LIM_LO: 700,
      SP_LIM_HI: 900,
      EU: '°F',
      DESC: 'Pass 3 Inlet Temperature',
      ALM_LL_LIM: 797,
      ALM_L_LIM: 0,
      ALM_H_LIM: 824,
      ALM_HH_LIM: 0,
      ALM_DL_LIM: 0,
      ALM_DH_LIM: 0,
    },
    '1540-T-5224': {
      TYPICAL_PV: 797,
      PV_SCALE_LO: 680,
      PV_SCALE_HI: 880,
      SP_LIM_LO: 680,
      SP_LIM_HI: 880,
      EU: '°F',
      DESC: 'Pass 4 Inlet Temperature',
      ALM_LL_LIM: 770,
      ALM_L_LIM: 0,
      ALM_H_LIM: 797,
      ALM_HH_LIM: 0,
      ALM_DL_LIM: 0,
      ALM_DH_LIM: 0,
    },
    '1540-T-7221': {
      TYPICAL_PV: 275,
      PV_SCALE_LO: 200,
      PV_SCALE_HI: 400,
      SP_LIM_LO: 200,
      SP_LIM_HI: 400,
      EU: '°F',
      DESC: 'Final Tower Gas Inlet Temperature',
      ALM_LL_LIM: 0,
      ALM_L_LIM: 265,
      ALM_H_LIM: 315,
      ALM_HH_LIM: 0,
      ALM_DL_LIM: 0,
      ALM_DH_LIM: 0,
    },
    '1540-T-7224': {
      TYPICAL_PV: 330,
      PV_SCALE_LO: 250,
      PV_SCALE_HI: 450,
      SP_LIM_LO: 250,
      SP_LIM_HI: 450,
      EU: '°F',
      DESC: 'Interpass Tower Gas Inlet Temperature',
      ALM_LL_LIM: 0,
      ALM_L_LIM: 320,
      ALM_H_LIM: 370,
      ALM_HH_LIM: 0,
      ALM_DL_LIM: 0,
      ALM_DH_LIM: 0,
    },
    '1540-TI-4200C': {
      // Furnace Temperature Sensor C: Configure proper ranges and typical PV
      TYPICAL_PV: 2050,
      PV_SCALE_LO: 1800,
      PV_SCALE_HI: 2300,
      SP_LIM_LO: 1800,
      SP_LIM_HI: 2300,
      EU: '°F',
      DESC: 'Furnace C',
      ALM_LL_LIM: 1850,
      ALM_L_LIM: 1900,
      ALM_H_LIM: 2200,
      ALM_HH_LIM: 2250,
      ALM_DL_LIM: 0,
      ALM_DH_LIM: 0,
      SHOW_ALARM_CIRCLE: false,
      SHOW_NO_SYMBOL: false,
      SHOW_INTERLOCK_DIAMOND_INDICATOR: false,
      SHOW_BLUE_ALARM_INDICATOR: false,
      SHOW_BAD_IO_INDICATOR: false,
      SHOW_MODULE_NOT_RUNNING: false,
      SHOW_VALVE_TYPE_LABEL: false,
      SHOW_LOCK_INDICATOR: false,
      SHOW_OUTPUT_PATH_INDICATOR: false,
      SHOW_HOLD_INDICATOR: false,
      SHOW_INTERLOCK_INDICATOR: false,
    },
  };
  
  const specificDefaults = controllerDefaults[controllerId] || {};
  
  return {
    ...defaultSecondaryConfig,
    ...specificDefaults,
    TAGNAME: controllerId || defaultSecondaryConfig.TAGNAME,
    DESC: metadata.label || defaultSecondaryConfig.DESC,
  };
};

/**
 * Returns controller-aware default live data.
 * Currently returns the same defaults for all controllers,
 * but can be extended per-controller if needed.
 */
export const getDefaultSecondaryControllerData = (
  controllerId: string
): SecondaryControllerData => {
  return { ...defaultSecondaryData };
};
