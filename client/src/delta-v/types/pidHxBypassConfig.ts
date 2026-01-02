export interface PIDHxBypassConfig {
  // Loop Info
  loop_tag: string;
  service_desc: string;
  eng_units: 'C' | 'F' | 'K';
  sample_time_dt_s: number;
  controller_output_units: '%' | 'mA' | '0–1';

  // Operating Point
  Tin0: number;
  Thx0: number;
  Tout0: number;
  xbar: number;
  u0: number;

  // PID Controller
  mode: 'MAN' | 'AUTO' | 'CAS';
  acting: 'Direct Acting' | 'Reverse Acting';
  Kc: number;
  tauI_s: number;
  tauD_s: number;
  deriv_filter_type: 'N' | 'τf';
  deriv_N: number;
  deriv_tau_f_s: number;
  u_bias: number;
  u_min: number;
  u_max: number;
  rate_limit_pct_per_s: number;
  anti_windup: 'None' | 'Clamp' | 'Back-calc';
  tracking: boolean;

  // Final Element (Positioner + Valve)
  Kpos: number;
  tau_pos_s: number;
  Kv: number;
  tau_v_s: number;
  valve_characteristic: 'Linear' | 'Equal %' | 'Quick Opening';
  installed_slope_dx_du: number;
  deadband_pct: number;
  stiction_pct: number;
  fail_position: 'Fail Open' | 'Fail Closed' | 'Fail Last';
  x_min: number;
  x_max: number;

  // HX Model (FOPDT)
  Khx_degC_per_x: number;
  tau_hx_s: number;
  dead_time_theta_s: number;

  // Mixer
  use_exact_mixing: boolean;
  Kmix_degC_per_x: number;
  enable_Tin_disturb: boolean;
  tau_in_s: number;
  enable_utility_disturb: boolean;
  utility_gain_factor: number;

  // Sensor
  Ksens: number;
  tau_sens_s: number;
  noise_sigma_degC: number;
  pv_filter_tau_s: number;

  // Pipe Dynamics (downstream transport + thermal lag)
  enable_pipe_dynamics: boolean;
  theta_pipe_s: number;
  tau_pipe_s: number;

  // Simulation
  step_dTsp: number;
  step_dTin: number;
  step_dUtility: number;
  run_time_s: number;
  ic_mode: 'Nominal' | 'Custom';
}

export const defaultPIDHxBypassConfig: PIDHxBypassConfig = {
  // Loop Info
  loop_tag: 'TIC-101',
  service_desc: 'HX outlet temperature control via bypass',
  eng_units: 'C',
  sample_time_dt_s: 1.0,
  controller_output_units: '%',

  // Operating Point
  Tin0: 25.0,
  Thx0: 80.0,
  Tout0: 60.0,
  xbar: 0.30,
  u0: 30.0,

  // PID Controller
  mode: 'AUTO',
  acting: 'Reverse Acting',
  Kc: 2.0,
  tauI_s: 180.0,
  tauD_s: 10.0,
  deriv_filter_type: 'N',
  deriv_N: 10.0,
  deriv_tau_f_s: 1.0,
  u_bias: 0.0,
  u_min: 0.0,
  u_max: 100.0,
  rate_limit_pct_per_s: 5.0,
  anti_windup: 'Clamp',
  tracking: true,

  // Final Element
  Kpos: 1.0,
  tau_pos_s: 0.5,
  Kv: 1.0,
  tau_v_s: 1.0,
  valve_characteristic: 'Equal %',
  installed_slope_dx_du: 0.010,
  deadband_pct: 0.5,
  stiction_pct: 1.0,
  fail_position: 'Fail Closed',
  x_min: 0.0,
  x_max: 1.0,

  // HX Model
  Khx_degC_per_x: 40.0,
  tau_hx_s: 300.0,
  dead_time_theta_s: 15.0,

  // Mixer
  use_exact_mixing: true,
  Kmix_degC_per_x: 20.0,
  enable_Tin_disturb: true,
  tau_in_s: 30.0,
  enable_utility_disturb: false,
  utility_gain_factor: 1.0,

  // Sensor
  Ksens: 1.0,
  tau_sens_s: 2.0,
  noise_sigma_degC: 0.2,
  pv_filter_tau_s: 2.0,

  // Pipe Dynamics
  enable_pipe_dynamics: true,
  theta_pipe_s: 20.0,
  tau_pipe_s: 5.0,

  // Simulation
  step_dTsp: 5.0,
  step_dTin: 2.0,
  step_dUtility: 0.0,
  run_time_s: 3600.0,
  ic_mode: 'Nominal',
};

export const PID_HX_BYPASS_STORAGE_KEY = 'pid-hx-bypass-config';

// Time-series logging row (matches Python LoopTimeseriesRow)
export interface LoopTimeseriesRow {
  ts_utc: string;
  loop_tag: string;
  Tsp: number;
  Tmeas: number;
  Tin: number;
  Thx: number;
  Tout: number;
  e: number;
  u: number;
  x: number;
  mode: string;
  note: string;
}

export const LOOP_TIMESERIES_STORAGE_KEY = 'loop-timeseries-log';
