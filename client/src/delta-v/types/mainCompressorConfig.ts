export interface MainCompressorConfig {
  // Loop Info
  loop_tag: string;
  service_desc: string;
  eng_units: '% HIC' | 'RPM' | 'HP';
  sample_time_dt_s: number;

  // PID Controller
  mode: 'MAN' | 'AUTO' | 'CAS';
  acting: 'Direct Acting' | 'Reverse Acting';
  Kp: number;        // Proportional gain (dimensionless)
  Ki: number;        // Integral gain (1/s)
  Kd: number;        // Derivative gain (s)

  // VFD Transfer Function
  eta_VFD: number;   // VFD efficiency (0-1)
  K_VFD: number;     // VFD gain (HP)
  tau_VFD: number;   // VFD time constant (s)

  // Motor Transfer Function  
  eta_MTR: number;   // Motor efficiency (0-1)
  K_MTR: number;     // Motor gain (dimensionless)
  tau_MTR: number;   // Motor time constant (s)

  // Compressor Transfer Function (2nd order)
  eta_CMP: number;   // Compressor efficiency (0-1)
  K_CMP: number;     // Compressor gain (RPM/HP)
  omega_n: number;   // Natural frequency (rad/s)
  zeta: number;      // Damping ratio (dimensionless)

  // System Parameters
  K_RPM_Max: number; // Maximum RPM scaling factor
  theta: number;     // Dead time (s)
  tau_LPF: number;   // Low-pass filter time constant (s)
}

export const defaultMainCompressorConfig: MainCompressorConfig = {
  // Loop Info
  loop_tag: '1540-H-4030',
  service_desc: 'Main Compressor Hand Controller',
  eng_units: '% HIC',
  sample_time_dt_s: 1.0,

  // PID Controller
  mode: 'AUTO',
  acting: 'Direct Acting',
  Kp: 1.0,
  Ki: 0.5,
  Kd: 0.1,

  // VFD Transfer Function
  eta_VFD: 0.98,
  K_VFD: 7800,
  tau_VFD: 0.05,

  // Motor Transfer Function
  eta_MTR: 0.96,
  K_MTR: 1.0,
  tau_MTR: 2.0,

  // Compressor Transfer Function
  eta_CMP: 0.86,
  K_CMP: 0.728,
  omega_n: 158.5,
  zeta: 0.15,

  // System Parameters
  K_RPM_Max: 4595,
  theta: 0.1,
  tau_LPF: 0.2,
};

export const MAIN_COMPRESSOR_CONFIG_KEY = 'main-compressor-config';
