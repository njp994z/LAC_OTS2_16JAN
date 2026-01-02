// Sulfur Burning Process Static Simulation
// Converted from Python simulation model

// Constants
const RPM_0 = 4500.0;
const ICFM_0 = 159550.0;
const P_COMP_IN0 = -13.0; // in wc
const P_COMP_OUT0_CL = 175.0; // in wc, dP_Clean; MECS
const P_COMP_OUT0_DT = 205.0; // in wc, dP_Dirty; MECS
const P_BAR = 0.84 * 14.696; // psia
const P_S = 14.696; // psia
const T_COMP_IN_F = 150.0; // F
const T_COMP_IN_R = T_COMP_IN_F + 460.0; // R
const T_S_F = 32.0; // F from notes
const T_S_R = T_S_F + 459.67; // R
const ETA_S = 0.82; // isentropic efficiency
const GAMMA = 1.4;
const SG_SULF = 1.803357;
const Q_LOSS_FRAC = 0.0001;
const HEAT_COMB = 3980.0; // Btu/lb S
const HEAT_SO3_RXN = 44400; // BTU/lbmol SO3
const CP_AIR = 0.24; // Btu/lb-F at ~250F
const CP_SULF = 0.32; // Btu/lb-F
const T_SULF_IN_F = 275.0; // in F
const CP_SO2 = 0.295; // Btu/lb-F @ 2100F
const CP_SO3 = 0.345; // BTU/lb-F @ 2100F
const CP_O2 = 0.294; // Btu/lb-F @ 2100F
const CP_N2 = 0.332; // Btu/lb-F @ 2100F
const MW_AIR = 28.846; // Dry Air
const MW_S = 32.06;
const MW_SO2 = 64.06;
const MW_SO3 = 80.06;
const MW_O2 = 32.0;
const MW_N2 = 28.01;
const IN_WC_TO_PSI = 0.03613; // psi per in wc
const LBMOL_PER_SCFM = 0.002786; // from previous
const DP_FURN_0 = 9.0; // in wc for furnace per basis flow
const SCFM_0 = 109811.0;
const CONV = 0.9985; // SO2 conversion
const MW_H2SO4 = 98.08;
const LBPERGAL = 8.34;
const SO3FRAC = 0.018;
const ETA_P     = 0.795;    // Polytropic efficiency — use your MECS curve value
const ETA_MOTOR = 0.967;    // Motor efficiency (nameplate)
const ETA_VFD   = 0.982;    // VFD efficiency (ABB ACS880 = 98.2% typical)
const F_D       = 1.018;    // Motor derating factor — 12-pulse VFD (1.01–1.02 typical)
const R_AIR_IMP = 53.35;    // R = 53.35 ft·lbf / (lb·°R)   → perfect for hp calculations

export interface SimulationInputs {
  compressorRpm: number;
  sulfurFlowGpm: number;
  compressorRunning: boolean;
}

export interface SimulationOutputs {
  o1_comp_rpm: number;
  o2_sulf_flow_gpm: number;
  o3_comp_icfm: number;
  o4_comp_inlet_pressure: number;
  o5_comp_scfm: number;
  o6_comp_mass_flow: number;
  o7_comp_outlet_pressure: number;
  o8_comp_outlet_temp: number;
  o9_comp_outlet_acfm: number;
  o10_sulfur_flow_lbpermin: number;
  o11_furn_outlet_temp_1: number;
  o12_furn_out_temp_2: number;
  o13_furn_out_temp_3: number;
  o14_furnace_outlet_scfm: number;
  o15_so2pct: number;
  o16_acid_production: number;
  o17_sulf_in_pressure: number;
  o18_comp_status: string;
  o19_furn_pres_out: number;
  o20_furn_out_acfm: number;
  o21_comp_electrical_power_hp: number;
  o22_comp_electrical_power_mw: number;
}

export function runSimulation(inputs: SimulationInputs): SimulationOutputs {
  let compRpm = inputs.compressorRpm;
  let sulfFlowGpm = inputs.sulfurFlowGpm;

  // If off, return zeroed outputs
  if (!inputs.compressorRunning) {
    return {
      o1_comp_rpm: 0.0,
      o2_sulf_flow_gpm: 0.0,
      o3_comp_icfm: 0.0,
      o4_comp_inlet_pressure: 0.0,
      o5_comp_scfm: 0.0,
      o6_comp_mass_flow: 0.0,
      o7_comp_outlet_pressure: 0.0,
      o8_comp_outlet_temp: 0.0,
      o9_comp_outlet_acfm: 0.0,
      o10_sulfur_flow_lbpermin: 0.0,
      o11_furn_outlet_temp_1: 0.0,
      o12_furn_out_temp_2: 0.0,
      o13_furn_out_temp_3: 0.0,
      o14_furnace_outlet_scfm: 0.0,
      o15_so2pct: 0.0,
      o16_acid_production: 0.0,
      o17_sulf_in_pressure: 0.0,
      o18_comp_status: "Off",
      o19_furn_pres_out: 0.0,
      o20_furn_out_acfm: 0.0,
      o21_comp_electrical_power_hp: 0.0,
      o22_comp_electrical_power_mw: 0.0,
    };
  }

  // o1. comp_rpm
  const o1_comp_rpm = compRpm;

  // o2. sulf_flow
  const o2_sulf_flow_gpm = sulfFlowGpm;

  // o3. comp_icfm (ACFM at inlet)
  const o3_comp_icfm = ICFM_0 * (o1_comp_rpm / RPM_0);

  // o4. comp_inlet_pressure (in wc)
  const o4_comp_inlet_pressure = P_COMP_IN0 * Math.pow(o3_comp_icfm / ICFM_0, 1.5);

  // Calculate p_comp_inlet_a (psia)
  const p_in_psi = o4_comp_inlet_pressure * IN_WC_TO_PSI;
  const p_comp_in_a = P_BAR + p_in_psi;

  // o5. comp_scfm
  const o5_comp_scfm = o3_comp_icfm * (p_comp_in_a / P_S) * (T_S_R / T_COMP_IN_R);

  // o6. comp_mass_flow (lb/min air)
  const lbmol_air_min = o5_comp_scfm * LBMOL_PER_SCFM;
  const o6_comp_mass_flow = lbmol_air_min * MW_AIR;

  // o7. comp_outlet_pressure (in wc gauge)
  const o7_comp_outlet_pressure = P_COMP_OUT0_DT * Math.pow(o5_comp_scfm / SCFM_0, 1.7);

  // Calculate P_out (psia)
  const p_out_gauge_psi = o7_comp_outlet_pressure * IN_WC_TO_PSI;
  const p_comp_out_a = P_BAR + p_out_gauge_psi;

  // o8. comp_outlet_temp (F)
  const exponent = (GAMMA - 1) / (GAMMA * ETA_S);
  const comp_outlet_temp_r = T_COMP_IN_R * Math.pow(p_comp_out_a / p_comp_in_a, exponent);
  const o8_comp_outlet_temp = comp_outlet_temp_r - 460.0;

  // o9. comp_outlet_acfm
  const o9_comp_outlet_acfm = o5_comp_scfm * (P_S / p_comp_out_a) * (comp_outlet_temp_r / T_S_R);

  // o10. sulfur_mass_flow (lb/min)
  const o10_sulfur_flow_lbpermin = o2_sulf_flow_gpm * SG_SULF * LBPERGAL;

  // o11. furn_outlet_temp (F) - heat balance
  const mass_s = o10_sulfur_flow_lbpermin;
  const lbmol_s = mass_s / MW_S;
  const lbmol_o2_in = 0.2095 * lbmol_air_min;
  const lbmol_n2 = 0.7905 * lbmol_air_min;
  const lbmol_so2 = lbmol_s * (1 - SO3FRAC);
  const lbmol_so3 = lbmol_s * SO3FRAC;
  const lbmol_o2_consum = lbmol_so2 + lbmol_so3 * 1.5;
  const lbmol_o2_resid = lbmol_o2_in - lbmol_o2_consum;

  const mass_so2 = lbmol_so2 * MW_SO2;
  const mass_so3 = lbmol_so3 * MW_SO3;
  const mass_o2_resid = lbmol_o2_resid * MW_O2;
  const mass_n2 = lbmol_n2 * MW_N2;
  const mass_air = o6_comp_mass_flow;

  const q_sulf = mass_s * CP_SULF * T_SULF_IN_F;
  const q_air = mass_air * CP_AIR * o8_comp_outlet_temp;
  const q_in = q_sulf + q_air;

  const q_released = mass_s * HEAT_COMB;
  const net_heat = (1 - Q_LOSS_FRAC) * q_released;
  const q_so3_rxn = lbmol_so3 * HEAT_SO3_RXN;
  const q_total = net_heat + q_in + q_so3_rxn;

  const mass_total = mass_so2 + mass_so3 + mass_o2_resid + mass_n2;
  const cp_mix_out = (mass_so2 * CP_SO2 + mass_so3 * CP_SO3 + mass_o2_resid * CP_O2 + mass_n2 * CP_N2) / mass_total;

  const o11_furn_outlet_temp_1 = o8_comp_outlet_temp + q_total / (mass_total * cp_mix_out);

  // o12. furn_out_temp_2 (F)
  const o12_furn_out_temp_2 = o11_furn_outlet_temp_1 + 3;

  // o13. furn_out_temp_3 (F)
  const o13_furn_out_temp_3 = o11_furn_outlet_temp_1 - 4;

  // o14. furnace_outlet_scfm (assume same as comp_scfm since moles equal)
  const o14_furnace_outlet_scfm = o5_comp_scfm;

  // o15. SO2 % to first pass (100% basis)
  const o15_so2pct = lbmol_s / lbmol_air_min;

  // o16. acid_production (metric ton/day)
  const mass_acid_lb_min = mass_s * (MW_H2SO4 / MW_S) * CONV;
  const o16_acid_production = (mass_acid_lb_min * 60 * 24) / 2204.62;

  // o17. Sulfur_Inlet_pressure (psig)
  const o17_sulf_in_pressure = o10_sulfur_flow_lbpermin > 0 ? 150.0 : p_out_gauge_psi;

  // o18. comp_status
  const o18_comp_status = inputs.compressorRunning ? "Normal" : "Off";

  // o19. Furnace Outlet Pressure in inches of wc
  const o19_furn_pres_out = P_COMP_OUT0_DT - DP_FURN_0 * Math.pow(o5_comp_scfm / SCFM_0, 1.7);

  // o20. Furnace Outlet ACFM
  const p_furn_out_gauge_psi = o19_furn_pres_out * IN_WC_TO_PSI;
  const p_furn_out_a = P_BAR + p_furn_out_gauge_psi;
  const furn_out_r = o11_furn_outlet_temp_1 + 460.0;
  const o20_furn_out_acfm = o14_furnace_outlet_scfm * (P_S / p_furn_out_a) * (furn_out_r / T_S_R);

  // ——— POLYTROPIC COMPRESSOR POWER — IMPERIAL ONLY ———
  const m_dot = o6_comp_mass_flow; // Mass flow rate in lb/min
  const T1_R = T_COMP_IN_R; // Compressor inlet temperature in Rankine
  const r = p_comp_out_a / p_comp_in_a; // Compression ratio
  
  const n = 1 / (1 - (GAMMA - 1) / (GAMMA * ETA_P));
  const polytropic_work_ftlbf_per_min = m_dot * (n / (n - 1)) * R_AIR_IMP * T1_R * (Math.pow(r, (n - 1) / n) - 1);
  const polytropic_hp = polytropic_work_ftlbf_per_min / 33000;
  const shaft_hp = polytropic_hp / ETA_P;
  const motor_input_hp = shaft_hp / (ETA_MOTOR * F_D);
  const o21_comp_electrical_power_hp = motor_input_hp / ETA_VFD;
  const o22_comp_electrical_power_mw = o21_comp_electrical_power_hp * 0.746 / 1000;
  

  return {
    o1_comp_rpm,
    o2_sulf_flow_gpm,
    o3_comp_icfm,
    o4_comp_inlet_pressure,
    o5_comp_scfm,
    o6_comp_mass_flow,
    o7_comp_outlet_pressure,
    o8_comp_outlet_temp,
    o9_comp_outlet_acfm,
    o10_sulfur_flow_lbpermin,
    o11_furn_outlet_temp_1,
    o12_furn_out_temp_2,
    o13_furn_out_temp_3,
    o14_furnace_outlet_scfm,
    o15_so2pct,
    o16_acid_production,
    o17_sulf_in_pressure,
    o18_comp_status,
    o19_furn_pres_out,
    o20_furn_out_acfm,
    o21_comp_electrical_power_hp,
    o22_comp_electrical_power_mw
  };
}
