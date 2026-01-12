// Secondary Controller mode types aligned with Python backend
export type AutoManMode = "AUTO" | "MAN";
export type RoutRcasMode = "DA" | "ROUT" | "RCAS";

// Alarm state interface matching Python backend's 6 alarms
export interface AlarmStates {
  LL: boolean; // Low Low
  L: boolean; // Low
  DL: boolean; // Deviation Low
  DH: boolean; // Deviation High
  H: boolean; // High
  HH: boolean; // High High
}

// Interlock action types
export type InterlockAction = "CLOSE" | "OPEN" | "HOLD";

// Valve Type/Action types for Primary Faceplate display
export type ValveTypeAction = "DA" | "RA" | "FO" | "FC" | "FL" | "NO" | "NC";

// Alarm log entry for tracking alarm events
export interface AlarmLogEntry {
  id: string;
  timestamp: Date;
  tag: string;
  alarmType: 'LL' | 'L' | 'DL' | 'DH' | 'H' | 'HH';
  alarmName: string;
  priority: 'critical' | 'warning';
  value: number;
  limit: number;
  acknowledged: boolean;
  acknowledgedAt?: Date;
}

// Static configuration from Python backend /config endpoint
export interface SecondaryControllerConfig {
  TAGNAME: string;
  DESC: string;
  EU: string;
  UNIT: string;
  // Valve Type/Action boolean flags
  VALVE_DA: boolean; // Direct Acting
  VALVE_RA: boolean; // Reverse Acting
  VALVE_FO: boolean; // Fail Open
  VALVE_FC: boolean; // Fail Close
  VALVE_FL: boolean; // Fail Locked
  VALVE_NO: boolean; // Normally Open
  VALVE_NC: boolean; // Normally Closed
  PV_SCALE_LO: number;
  PV_SCALE_HI: number;
  SP_LIM_LO: number;
  SP_LIM_HI: number;
  ALM_LL_LIM: number;
  ALM_L_LIM: number;
  ALM_DL_LIM: number;
  ALM_DH_LIM: number;
  ALM_H_LIM: number;
  ALM_HH_LIM: number;
  OUT_LIM_LO: number;
  OUT_LIM_HI: number;
  SP_RAMP_EN: boolean;
  SP_RAMP_RATE: number;
  HIST_LINK: string;
  TUNE_LINK: string;
  PROBSTAT_LINK: string;
  CAS_LINK: string;
  PIDOPT_LINK: string;
  DIAG_LINK: string;
  // Interlock configuration
  INTLK_HH_EN: boolean;
  INTLK_LL_EN: boolean;
  INTLK_ACTION: InterlockAction;
  // PV initial settings
  PV_INIT_VAL: number;
  PV_FILTER_TIME: number;
  PV_SQROOT_EN: boolean;
  PV_BAD_LIMIT: number;
  // Display settings
  TRANSPARENT_BG: boolean;
  // Indicator visibility settings
  SHOW_HOLD_INDICATOR: boolean;
  SHOW_OUTPUT_PATH_INDICATOR: boolean;
  SHOW_INTERLOCK_INDICATOR: boolean;
  SHOW_INTERLOCK_DIAMOND_INDICATOR: boolean;
  SHOW_LOCK_INDICATOR: boolean;
  SHOW_ALARM_CIRCLE: boolean;
  SHOW_NO_SYMBOL: boolean;
  SHOW_BLUE_ALARM_INDICATOR: boolean;
  SHOW_BAD_IO_INDICATOR: boolean;
  SHOW_MODULE_NOT_RUNNING: boolean;
  SHOW_VALVE_TYPE_LABEL: boolean;
  // Indicator state settings
  HOLD_ACTIVE: boolean;
  // Typical PV value for sensor range
  TYPICAL_PV?: number;
  // Valve Type/Action for Primary Faceplate mode display
  VALVE_TYPE_ACTION: ValveTypeAction;
}

// Live tags from Python backend /tags endpoint
export interface SecondaryControllerData {
  // Continuous values
  PV: number;
  SP: number;
  TSP: number; // Target SP / destination
  OUT_PCT: number; // PID OUT %
  AO_I_ACT_mA: number; // Actual AO current

  // Mode bits
  MODE_AUTOMAN: AutoManMode;
  MODE_ROUTRCAS: RoutRcasMode;

  // Status bits
  PV_OK: boolean;
  OUT_OK: boolean;
  TRK_STATE: boolean;
  INTLK_STATE: boolean;
  MODELOCK_OVERRIDE: boolean;
  BYPASS_ACTIVE: boolean;

  // Alarm state bits (6)
  ALM_LL_ACT: boolean;
  ALM_L_ACT: boolean;
  ALM_DL_ACT: boolean;
  ALM_DH_ACT: boolean;
  ALM_H_ACT: boolean;
  ALM_HH_ACT: boolean;

  // Derived convenience fields
  PV_PCT?: number;
  SP_PCT?: number;
  TSP_PCT?: number;
  AO_I_ACT_PCT?: number;
}

// Default config matching Python backend
export const defaultSecondaryConfig: SecondaryControllerConfig = {
  TAGNAME: "1520-TIC-6670",
  DESC: "Final Tower Acid Temperature Controller",
  EU: "C",
  UNIT: "Drying / Acid",
  // Valve Type/Action defaults
  VALVE_DA: true,
  VALVE_RA: false,
  VALVE_FO: false,
  VALVE_FC: false,
  VALVE_FL: false,
  VALVE_NO: false,
  VALVE_NC: false,
  PV_SCALE_LO: 0.0,
  PV_SCALE_HI: 100.0,
  SP_LIM_LO: 10.0,
  SP_LIM_HI: 90.0,
  ALM_LL_LIM: 60.0,
  ALM_L_LIM: 70.0,
  ALM_DL_LIM: -5.0,
  ALM_DH_LIM: 5.0,
  ALM_H_LIM: 87.0,
  ALM_HH_LIM: 92.0,
  OUT_LIM_LO: 0.0,
  OUT_LIM_HI: 100.0,
  SP_RAMP_EN: true,
  SP_RAMP_RATE: 1.5,
  HIST_LINK: "/historian/1540TIC4281_SEC",
  TUNE_LINK: "/tuning/1540TIC4281_SEC",
  PROBSTAT_LINK: "/probstatus/1540TIC4281_SEC",
  CAS_LINK: "/cascade/1540TIC4281_SEC",
  PIDOPT_LINK: "/pidoptions/1540TIC4281_SEC",
  DIAG_LINK: "/diagnostics/1540TIC4281_SEC",
  // Interlock configuration
  INTLK_HH_EN: false,
  INTLK_LL_EN: false,
  INTLK_ACTION: "CLOSE",
  // PV initial settings
  PV_INIT_VAL: 50.0,
  PV_FILTER_TIME: 0.5,
  PV_SQROOT_EN: false,
  PV_BAD_LIMIT: 0.0,
  // Display settings
  TRANSPARENT_BG: false,
  // Indicator visibility settings
  SHOW_HOLD_INDICATOR: true,
  SHOW_OUTPUT_PATH_INDICATOR: true,
  SHOW_INTERLOCK_INDICATOR: true,
  SHOW_INTERLOCK_DIAMOND_INDICATOR: true,
  SHOW_LOCK_INDICATOR: true,
  SHOW_ALARM_CIRCLE: true,
  SHOW_NO_SYMBOL: true,
  SHOW_BLUE_ALARM_INDICATOR: true,
  SHOW_BAD_IO_INDICATOR: true,
  SHOW_MODULE_NOT_RUNNING: true,
  SHOW_VALVE_TYPE_LABEL: true,
  // Indicator state settings
  HOLD_ACTIVE: false,
  // Valve Type/Action default
  VALVE_TYPE_ACTION: "DA",
};

// Default live data matching Python backend initial state
export const defaultSecondaryData: SecondaryControllerData = {
  PV: 74.5,
  SP: 75.0,
  TSP: 75.0,
  OUT_PCT: 45.3,
  AO_I_ACT_mA: 11.25,
  MODE_AUTOMAN: "AUTO",
  MODE_ROUTRCAS: "DA",
  PV_OK: true,
  OUT_OK: true,
  TRK_STATE: false,
  INTLK_STATE: false,
  MODELOCK_OVERRIDE: false,
  BYPASS_ACTIVE: false,
  ALM_LL_ACT: false,
  ALM_L_ACT: false,
  ALM_DL_ACT: false,
  ALM_DH_ACT: false,
  ALM_H_ACT: false,
  ALM_HH_ACT: false,
};
