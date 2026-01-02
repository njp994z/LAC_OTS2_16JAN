// Global Outputs Calculations for Sulfur Burning Process
// Based on thermodynamic heat balance and material balance

// Constants from Python code
const RPM_0 = 4500.0;
const ICFM_0 = 159550.0;
const P_COMP_IN0 = -13.0; // in wc
const P_COMP_OUT0_DT = 205.0; // in wc, dP_Dirty
const P_BAR = 0.84 * 14.696; // psia
const P_S = 14.696; // psia
const T_COMP_IN_F = 150.0; // F
const T_COMP_IN_R = T_COMP_IN_F + 460.0; // R
const T_S_F = 32.0; // F
const T_S_R = T_S_F + 459.67; // R
const ETA_S = 0.82; // isentropic efficiency
const GAMMA = 1.4;
const SG_SULF = 1.803357;
const LBPERGAL = 8.34;
const Q_LOSS_FRAC = 0.0001;
const HEAT_COMB = 3980.0; // Btu/lb S
const HEAT_SO3_RXN = 44400; // BTU/lbmol SO3
const CP_AIR = 0.24; // Btu/lb-F
const CP_SULF = 0.32; // Btu/lb-F
const T_SULF_IN_F = 275.0; // F
const CP_SO2 = 0.295; // Btu/lb-F
const CP_SO3 = 0.345; // BTU/lb-F
const CP_O2 = 0.294; // Btu/lb-F
const CP_N2 = 0.332; // Btu/lb-F
const MW_AIR = 28.846;
const MW_S = 32.06;
const MW_SO2 = 64.06;
const MW_SO3 = 80.06;
const MW_O2 = 32.0;
const MW_N2 = 28.01;
const IN_WC_TO_PSI = 0.03613;
const LBMOL_PER_SCFM = 0.002786;
const SO3FRAC = 0.018;
const CONV = 0.9985; // SO2 conversion
const MW_H2SO4 = 98.08;

export interface GlobalOutputs {
  furnaceOutletTemp: number; // °F
  so2Percent: number; // %
  acidProduction: number; // metric ton/day
}

export function calculateGlobalOutputs(
  sulfurFlowGpm: number,
  compressorRpm: number
): GlobalOutputs {
  // If inputs are zero or very small, return zeros
  if (sulfurFlowGpm < 0.01 || compressorRpm < 1) {
    return {
      furnaceOutletTemp: 0,
      so2Percent: 0,
      acidProduction: 0,
    };
  }

  // Calculate intermediate values following Python code logic

  // Compressor ICFM
  const comp_icfm = ICFM_0 * (compressorRpm / RPM_0);

  // Compressor inlet pressure (in wc)
  const comp_inlet_pressure = P_COMP_IN0 * Math.pow(comp_icfm / ICFM_0, 1.5);

  // P_comp_inlet_a (psia)
  const p_in_psi = comp_inlet_pressure * IN_WC_TO_PSI;
  const p_comp_in_a = P_BAR + p_in_psi;

  // Compressor SCFM
  const comp_scfm = comp_icfm * (p_comp_in_a / P_S) * (T_S_R / T_COMP_IN_R);

  // Compressor mass flow (lb/min air)
  const lbmol_air_min = comp_scfm * LBMOL_PER_SCFM;
  const comp_mass_flow = lbmol_air_min * MW_AIR;

  // Compressor outlet pressure (in wc gauge)
  const comp_outlet_pressure = P_COMP_OUT0_DT * Math.pow(comp_scfm / 109811.0, 1.7);

  // P_out (psia)
  const p_out_gauge_psi = comp_outlet_pressure * IN_WC_TO_PSI;
  const p_comp_out_a = P_BAR + p_out_gauge_psi;

  // Compressor outlet temperature (F)
  const exponent = (GAMMA - 1) / (GAMMA * ETA_S);
  const comp_outlet_temp_r = T_COMP_IN_R * Math.pow(p_comp_out_a / p_comp_in_a, exponent);
  const comp_outlet_temp = comp_outlet_temp_r - 460.0;

  // Sulfur mass flow (lb/min)
  const sulfur_flow_lbpermin = sulfurFlowGpm * SG_SULF * LBPERGAL;

  // Calculate molar flows (lbmol/min)
  const mass_s = sulfur_flow_lbpermin;
  const lbmol_s = mass_s / MW_S;
  const lbmol_o2_in = 0.2095 * lbmol_air_min;
  const lbmol_n2 = 0.7905 * lbmol_air_min;
  const lbmol_so2 = lbmol_s * (1 - SO3FRAC);
  const lbmol_so3 = lbmol_s * SO3FRAC;
  const lbmol_o2_consum = lbmol_so2 + lbmol_so3 * 1.5;
  const lbmol_o2_resid = lbmol_o2_in - lbmol_o2_consum;

  // Calculate mass flows (lb/min)
  const mass_so2 = lbmol_so2 * MW_SO2;
  const mass_so3 = lbmol_so3 * MW_SO3;
  const mass_o2_resid = lbmol_o2_resid * MW_O2;
  const mass_n2 = lbmol_n2 * MW_N2;
  const mass_air = comp_mass_flow;

  // Sensible heat entering furnace (BTU/min)
  const q_sulf = mass_s * CP_SULF * T_SULF_IN_F;
  const q_air = mass_air * CP_AIR * comp_outlet_temp;
  const q_in = q_sulf + q_air;

  // Total heat available to outlet gas
  const q_released = mass_s * HEAT_COMB;
  const net_heat = (1 - Q_LOSS_FRAC) * q_released;
  const q_so3_rxn = lbmol_so3 * HEAT_SO3_RXN;
  const q_total = net_heat + q_in + q_so3_rxn;

  // Outlet mixture properties
  const mass_total = mass_so2 + mass_so3 + mass_o2_resid + mass_n2;
  const cp_mix_out =
    (mass_so2 * CP_SO2 + mass_so3 * CP_SO3 + mass_o2_resid * CP_O2 + mass_n2 * CP_N2) /
    mass_total;

  // o11: Furnace Outlet Temperature (F)
  const furnaceOutletTemp = comp_outlet_temp + q_total / (mass_total * cp_mix_out);

  // o15: SO2 % (as percentage)
  const so2Percent = (lbmol_s / lbmol_air_min) * 100;

  // o16: Acid Production (metric ton/day)
  const mass_acid_lb_min = mass_s * (MW_H2SO4 / MW_S) * CONV;
  const acidProduction = (mass_acid_lb_min * 60 * 24) / 2204.62;

  return {
    furnaceOutletTemp,
    so2Percent,
    acidProduction,
  };
}
