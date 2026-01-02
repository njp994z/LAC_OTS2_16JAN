// PID Controller Simulation for Sulfur Flow Control
// Converted from Python matplotlib interactive simulation

export interface PIDParameters {
  setpoint: number;
  kp: number;
  ki: number;
  kd: number;
  tau: number;
  dt: number;
  kProcess?: number; // Process gain (output units per mA)
}

export interface PIDState {
  time: number;
  processValue: number;
  integral: number;
  prevError: number;
  manipulatedVariable: number;
}

export interface DataPoint {
  time: number;
  pv: number;
  sp: number;
  mv: number;
}

const K_PROCESS_DEFAULT = 150 / 16.0; // 9.375 gpm per mA (default for sulfur flow)
const MV_MIN = 4.0;
const MV_MAX = 20.0;

export function createInitialState(): PIDState {
  return {
    time: 0.0,
    processValue: 0.0,
    integral: 0.0,
    prevError: 0.0,
    manipulatedVariable: 12.0,
  };
}

export function stepPID(
  state: PIDState,
  params: PIDParameters
): { newState: PIDState; dataPoint: DataPoint } {
  const { setpoint, kp, ki, kd, tau, dt, kProcess } = params;
  const { processValue, integral, prevError, manipulatedVariable, time } = state;

  // Use provided process gain or fall back to default
  const K_PROCESS = kProcess !== undefined ? kProcess : K_PROCESS_DEFAULT;

  // PID controller calculation
  const error = setpoint - processValue;
  let newIntegral = integral + error * dt;
  const derivative = dt > 0 ? (error - prevError) / dt : 0;

  // Calculate raw MV
  const mvRaw = kp * error + ki * newIntegral + kd * derivative;
  
  // Clamp MV to physical limits
  const newMV = Math.max(MV_MIN, Math.min(MV_MAX, mvRaw));

  // Anti-windup: prevent integral windup when saturated
  if (ki > 0 && mvRaw !== newMV) {
    newIntegral -= (mvRaw - newMV) / ki;
  }

  // First-order process response (exact solution using inverse Laplace)
  const target = K_PROCESS * (newMV - 4.0);
  const expFactor = Math.exp(-dt / tau);
  const newPV = processValue * expFactor + target * (1 - expFactor);

  const newTime = time + dt;

  const newState: PIDState = {
    time: newTime,
    processValue: newPV,
    integral: newIntegral,
    prevError: error,
    manipulatedVariable: newMV,
  };

  const dataPoint: DataPoint = {
    time: newTime,
    pv: newPV,
    sp: setpoint,
    mv: newMV,
  };

  return { newState, dataPoint };
}
