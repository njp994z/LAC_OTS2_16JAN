import { baseApi } from './index';

// ─── Input shape ────────────────────────────────────────────────────────────
export interface PlantSimulationInput {
  compressor_rpm_pct?:    number;  // % of max RPM (default 87)
  sulfur_flow_sp_gpm?:   number;  // GPM setpoint (default 79)
  sulfur_temp_F?:         number;  // °F (default 275)
  inlet_temp_F?:          number;  // Ambient °F (default 70)
  filter_dp_inwc?:        number;  // Filter dP, in wc (default 3)
  humidity_gr_lb?:        number;  // Grains per lb dry air (default 50)
  barometric_atm?:        number;  // Barometric pressure ATM (default 0.972)
  plant_condition?:       'clean' | 'dirty';
  jug_open_pct?:          number;  // Jug valve open % (default 10)
  positioner_open_pct?:  number;  // Positioner open % (default 100)
  pit_level_ft?:          number;  // Sulfur pit level ft (default 7)
  sulfur_valve_R?:        number;  // Equal-% exponent (default 85)
  catalyst_name?:         string;  // e.g. "MECS GR330"
  catalyst_volume_liters?: number;
  converter_diameter_ft?:  number;
  ipat_x_H2SO4?:          number;
  ipat_flow_gpm?:         number;
  fat_x_H2SO4?:           number;
  fat_flow_gpm?:          number;
}

// ─── Sensor tags — flat dict keyed by DCS tag number ────────────────────────
export interface SensorTags {
  // Ambient / Filter
  '1540-TI-5800': number;
  '1540-PI-5801': number;
  '1540-PDI-5801': number;
  // Compressor
  '1540-SIC-4030': number;
  '1540-TI-4031':  number;
  '1540-PI-4031':  number;
  '1540-FI-4030':  number;
  '1540-XI-4031':  number;
  // Sulfur
  '1530-FIC-2602': number;
  '1530-TI-2601':  number;
  '1530-ZIC-2602': number;
  // Furnace
  '1540-TI-3001':  number;
  '1540-PI-3001':  number;
  '1540-AI-3001':  number;
  '1540-QI-3001':  number;
  // WHB / Jug Valve
  '1540-TI-3050':  number;
  '1540-ZIC-3051': number;
  '1540-TI-4001':  number;
  // Converter passes
  '1540-TI-4010':  number;
  '1540-TI-4020':  number;
  '1540-TI-4030':  number;
  '1540-TI-4040':  number;
  '1540-AI-4001':  number;
  '1540-AI-4002':  number;
  '1540-AI-4003':  number;
  '1540-AI-4004':  number;
  // IPAT / FAT
  '1540-TI-5001':  number;
  '1540-FI-5001':  number;
  '1540-TI-5101':  number;
  '1540-FI-5101':  number;
  // KPIs (named keys for easy L1 display)
  KPI_SO2_PCT:              number;
  KPI_OVERALL_CONV_PCT:     number;
  KPI_ACID_PRODUCTION_MTPD: number;
  KPI_FURNACE_TEMP_F:       number;
  KPI_COMPRESSOR_POWER_MW:  number;
  KPI_SULFUR_FLOW_GPM:      number;
  KPI_PASS1_CONV_PCT:       number;
  KPI_PASS2_CONV_PCT:       number;
  KPI_PASS3_CONV_PCT:       number;
  KPI_PASS4_CONV_PCT:       number;
  [tag: string]: number;   // allow reading any tag by string key
}

// ─── Summary KPIs ────────────────────────────────────────────────────────────
export interface PlantSummary {
  compressor_rpm_pct:       number;
  compressor_rpm:           number;
  sulfur_flow_sp_gpm:       number;
  sulfur_flow_achieved_gpm: number;
  air_scfm:                 number;
  so2_pct_furnace_outlet:   number;
  furnace_outlet_temp_F:    number;
  pass1_conv_pct:           number;
  pass2_conv_pct:           number;
  pass3_conv_pct:           number;
  pass4_conv_pct:           number;
  overall_conv_pct:         number;
  acid_production_mtpd:     number;
  compressor_power_MW:      number;
  sulfur_flow_lb_min:       number;
  stack_mol_so2_hr:         number;
  stack_mol_so3_hr:         number;
  stack_mol_n2_hr:          number;
}

// ─── Full response ───────────────────────────────────────────────────────────
export interface PlantSimulationResult {
  success:         boolean;
  sensor_tags:     SensorTags;
  streams:         Record<string, Record<string, number>>;
  unit_operations: Record<string, unknown>;
  summary:         PlantSummary;
}

// ─── RTK Query endpoint ──────────────────────────────────────────────────────
const plantSimulationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    runPlantSimulation: builder.mutation<PlantSimulationResult, PlantSimulationInput>({
      query: (body) => ({
        url:    '/plant-simulation',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useRunPlantSimulationMutation } = plantSimulationApi;
