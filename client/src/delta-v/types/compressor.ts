export type CompressorState = "STOPPED" | "STARTING" | "RUNNING" | "STOPPING";
export type CompressorMode = "CAS" | "AUTO" | "MAN";

export interface CompressorData {
  tag: string;
  description: string;
  permitActive: boolean;
  state: CompressorState;
  mode: CompressorMode;
  speedSP: number;
  speedPV: number;
  currentPV: number;
  powerPV: number;
  failAlarm: boolean;
  deviceState: string;
  motorPowerHP: number;
  vfdCurrentAmps: number;
  motorSpeedRPM: number;
  compressorSpeedRPM: number;
}

export const defaultCompressorData: CompressorData = {
  tag: "B-101",
  description: "Flue Gas Feed Blower",
  permitActive: true,
  state: "RUNNING",
  mode: "AUTO",
  speedSP: 75.0,
  speedPV: 74.8,
  currentPV: 45.2,
  powerPV: 125.5,
  failAlarm: false,
  deviceState: "Confirmed Running",
  motorPowerHP: 125.5,
  vfdCurrentAmps: 45.2,
  motorSpeedRPM: 1475,
  compressorSpeedRPM: 8500,
};
