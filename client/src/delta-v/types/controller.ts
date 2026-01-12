// Controller mode types
export type ControllerMode = 'AUTO' | 'MAN' | 'CAS' | 'LO' | 'RCAS' | 'ROUT' | 'BYPASS';

// Status types
export type PVStatus = 'OK' | 'BAD' | 'UNC' | 'NAN';
export type OutputStatus = 'OK' | 'BAD' | 'LIMITED' | 'TRACKING';

// Main controller data interface - all fields can be fed from Python backend
export interface ControllerData {
  // Identification
  instrumentTag: string;
  description: string;
  functionBlock: string;
  
  // Process values
  pv: number;
  sp: number;
  out: number;
  
  // Range configuration
  pvRangeMin: number;
  pvRangeMax: number;
  outRangeMin: number;
  outRangeMax: number;
  
  // Engineering units
  pvUnits: string;
  outUnits: string;
  
  // Status indicators
  alarmActive: boolean;
  alarmType?: 'HI' | 'HIHI' | 'LO' | 'LOLO' | 'DEV';
  alarmColor?: 'red' | 'yellow';
  deviceLocked: boolean;
  interlockActive: boolean;
  manualMode: boolean;
  holdActive: boolean;
  
  // Mode
  mode: ControllerMode;
  
  // Status messages
  pvStatus: PVStatus;
  outputStatus: OutputStatus;
  
  // Output path indicator
  outputPathActive: boolean;
  
  // Alarm limits for range bar coloring
  alarmLL?: number;
  alarmL?: number;
  alarmH?: number;
  alarmHH?: number;
  
  // Indicator visibility flags
  showHoldIndicator?: boolean;
  showOutputPathIndicator?: boolean;
  showInterlockIndicator?: boolean;
  showInterlockDiamond?: boolean;
  showLockIndicator?: boolean;
  showAlarmCircle?: boolean;
  showNoSymbol?: boolean;
  showBlueAlarmIndicator?: boolean;
  showBadIOIndicator?: boolean;
  showModuleNotRunning?: boolean;
  showValveTypeLabel?: boolean;
  
  // Override for mode display (DA, RA, FO, FC, FL, NO, NC)
  valveTypeAction?: string;
}

// Default/demo data
export const defaultControllerData: ControllerData = {
  instrumentTag: '1520-TIC-6670',
  description: 'Final Tower Acid Temperature Controller',
  functionBlock: 'DA',
  pv: 80.0,
  sp: 75.0,
  out: 45.2,
  pvRangeMin: 0,
  pvRangeMax: 100,
  outRangeMin: 0,
  outRangeMax: 100,
  pvUnits: 'C',
  outUnits: '%',
  alarmActive: false,
  deviceLocked: false,
  interlockActive: false,
  manualMode: false,
  holdActive: false,
  mode: 'AUTO',
  pvStatus: 'OK',
  outputStatus: 'OK',
  outputPathActive: true,
};
