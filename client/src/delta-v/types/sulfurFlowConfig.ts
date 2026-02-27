export interface SulfurFlowConfig {
  // Loop Info
  loop_tag: string;
  service_desc: string;
  eng_units: 'gpm' | 'klb/hr';
  sample_time_dt_s: number;
  controller_output_units: '%' | 'mA';

  // Design Conditions
  design_flow_gpm: number;
  design_dP_orifice_psi: number;
  design_dP_valve_psi: number;

  // PID Controller (PI form)
  mode: 'MAN' | 'AUTO' | 'CAS';
  acting: 'Direct Acting' | 'Reverse Acting';
  Kp: number;
  Ki: number;
  u_bias: number;
  u_min: number;
  u_max: number;
  rate_limit_pct_per_s: number;
  anti_windup: 'None' | 'Clamp' | 'Back-calc';

  // Final Element (Valve)
  Cv_max: number;
  valve_profile_type: 'linear' | 'equal_percentage' | 'quick_opening';
  R_value: number;
  tau_valve_s: number;
  fail_position: 'Fail Open' | 'Fail Closed' | 'Fail Last';

  // Piping & Hydraulics
  pipe_dia_in: number;
  line_length_ft: number;
  friction_factor: number;
  K_minor_losses: number;
  SG: number;

  // Pressure Drops
  deltaP_nozzle_psi: number;
  furnace_static_psi: number;
  barometric_psia: number;
  pit_level_ft: number;

  // Process Dynamics
  tau_flow_s: number;

  // Sensor / Transmitter
  tau_sensor_s: number;
  noise_sigma_gpm: number;
  pv_filter_tau_s: number;

  // Simulation
  setpoint_gpm: number;
  run_time_s: number;
  ic_mode: 'Nominal' | 'Custom';
}

export const defaultSulfurFlowConfig: SulfurFlowConfig = {
  // Loop Info
  loop_tag: 'FIC-2602',
  service_desc: 'Sulfur Flow to Furnace',
  eng_units: 'gpm',
  sample_time_dt_s: 0.5,
  controller_output_units: '%',

  // Design Conditions
  design_flow_gpm: 87.0,
  design_dP_orifice_psi: 50.0,
  design_dP_valve_psi: 20.0,

  // PID Controller (PI form)
  mode: 'AUTO',
  acting: 'Reverse Acting',
  Kp: 0.5,
  Ki: 0.1,
  u_bias: 50.0,
  u_min: 0.0,
  u_max: 100.0,
  rate_limit_pct_per_s: 10.0,
  anti_windup: 'Clamp',

  // Final Element (Valve)
  Cv_max: 548.0,
  valve_profile_type: 'equal_percentage',
  R_value: 85,
  tau_valve_s: 8.0,
  fail_position: 'Fail Closed',

  // Piping & Hydraulics
  pipe_dia_in: 4.0,
  line_length_ft: 80.0,
  friction_factor: 0.018,
  K_minor_losses: 7.5,
  SG: 1.79,

  // Pressure Drops
  deltaP_nozzle_psi: 150.0,
  furnace_static_psi: 7.0,
  barometric_psia: 14.696,
  pit_level_ft: 7.0,

  // Process Dynamics
  tau_flow_s: 4.0,

  // Sensor / Transmitter
  tau_sensor_s: 1.0,
  noise_sigma_gpm: 0.5,
  pv_filter_tau_s: 2.0,

  // Simulation
  setpoint_gpm: 87.0,
  run_time_s: 300.0,
  ic_mode: 'Nominal',
};

export const SULFUR_FLOW_STORAGE_KEY = 'sulfur-flow-config';
