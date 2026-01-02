export type ControllerMode = 'AUTO' | 'MAN' | 'CAS';

export interface ControllerData {
  instrumentTag: string;
  description: string;
  pv: number;
  sp: number;
  out: number;
  pvMin: number;
  pvMax: number;
  outMin: number;
  outMax: number;
  pvUnit: string;
  outUnit: string;
  mode: ControllerMode;
  manualMode: boolean;
  alarmActive: boolean;
  interlockActive: boolean;
}

export const defaultControllerData: ControllerData = {
  instrumentTag: 'FIC-101',
  description: 'Flow Controller - Main Feed',
  pv: 75.5,
  sp: 80.0,
  out: 62.3,
  pvMin: 0,
  pvMax: 100,
  outMin: 0,
  outMax: 100,
  pvUnit: 'GPM',
  outUnit: '%',
  mode: 'AUTO',
  manualMode: false,
  alarmActive: false,
  interlockActive: false,
};
