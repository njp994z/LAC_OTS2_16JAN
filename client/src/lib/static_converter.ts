// SO2 Converter Process Static Simulation
// Simulates SO2 to SO3 conversion across 4 catalyst passes

// Constants for converter calculations
const MW_SO2 = 64.06;
const MW_SO3 = 80.06;
const MW_O2 = 32.0;
const MW_N2 = 28.01;
const BASE_SO2_IN = 10.5; // Base SO2 concentration %
const BASE_FLOW_SCFM = 109811.0;
const HEAT_SO3_RXN = 44400; // BTU/lbmol SO3
const CP_GAS_AVG = 0.31; // Btu/lb-F average
const BLOWER_POWER_BASE = 450; // HP at base conditions
const CAUSTIC_CONSUMPTION_BASE = 12.5; // lb/min at base
const STEAM_RATIO = 1.8; // ST Steam / ST Acid ratio

export interface ConverterInputs {
  pass2InletTemp: number;  // °F
  pass3InletTemp: number;  // °F
  pass4InletTemp: number;  // °F
  jugValvePctOpen: number; // %
  ipatGasInletTemp: number; // °F
  fatGasInletTemp: number; // °F
}

export interface ConverterOutputs {
  // Pass temperatures
  pass1InletTemp: number;
  pass1OutletTemp: number;
  pass2OutletTemp: number;
  pass3OutletTemp: number;
  pass4OutletTemp: number;
  
  // SO2 concentrations
  so2ConcPass1: number; // % to Pass 1
  so2PpmToStack: number; // ppm to stack
  
  // SO2 conversions
  so2ConvPass1: number; // %
  so2ConvPass2: number; // %
  so2ConvPass3: number; // %
  so2ConvPass4: number; // %
  overallSo2Conversion: number; // %
  
  // Production & utilities
  acidProductionMtpd: number;
  steamFlowStSteam: number; // ST Steam / ST Acid
  causticConsumptionLbMin: number;
  totalPowerMw: number;
  compressorPowerConsumption: number; // MW
  blowerDischargePressure: number; // in wc
}

export function runConverterSimulation(inputs: ConverterInputs): ConverterOutputs {
  // Pass 1 inlet temperature is calculated based on incoming gas from burner
  // Using the jug valve position to control gas bypass/mixing
  const jugEffect = inputs.jugValvePctOpen / 100.0;
  const pass1InletTemp = 800 + (jugEffect * 50); // Base 800°F, up to 850°F
  
  // Calculate conversion per pass based on inlet temperatures
  // Higher temps = better kinetics = higher conversion
  const tempFactorPass1 = Math.min(1.0, (pass1InletTemp - 700) / 200);
  const tempFactorPass2 = Math.min(1.0, (inputs.pass2InletTemp - 700) / 200);
  const tempFactorPass3 = Math.min(1.0, (inputs.pass3InletTemp - 700) / 200);
  const tempFactorPass4 = Math.min(1.0, (inputs.pass4InletTemp - 700) / 200);
  
  // SO2 conversion per pass (equilibrium-limited)
  const so2ConvPass1 = 62.0 + (tempFactorPass1 * 5.0);
  const so2ConvPass2 = 21.0 + (tempFactorPass2 * 3.0);
  const so2ConvPass3 = 10.0 + (tempFactorPass3 * 2.0);
  const so2ConvPass4 = 4.5 + (tempFactorPass4 * 1.5);
  
  // Overall conversion (cascading through passes)
  const remainAfterPass1 = (100 - so2ConvPass1) / 100;
  const remainAfterPass2 = remainAfterPass1 * (100 - so2ConvPass2) / 100;
  const remainAfterPass3 = remainAfterPass2 * (100 - so2ConvPass3) / 100;
  const remainAfterPass4 = remainAfterPass3 * (100 - so2ConvPass4) / 100;
  const overallSo2Conversion = (1 - remainAfterPass4) * 100;
  
  // SO2 concentrations
  const so2ConcPass1 = BASE_SO2_IN;
  const so2PpmToStack = BASE_SO2_IN * remainAfterPass4 * 10000; // Convert to ppm
  
  // Outlet temperatures (exothermic reaction increases temp)
  const deltaT1 = so2ConvPass1 * 0.8; // ~50°F rise per % conversion
  const deltaT2 = so2ConvPass2 * 0.8;
  const deltaT3 = so2ConvPass3 * 0.8;
  const deltaT4 = so2ConvPass4 * 0.8;
  
  const pass1OutletTemp = pass1InletTemp + deltaT1;
  const pass2OutletTemp = inputs.pass2InletTemp + deltaT2;
  const pass3OutletTemp = inputs.pass3InletTemp + deltaT3;
  const pass4OutletTemp = inputs.pass4InletTemp + deltaT4;
  
  // Acid production based on overall conversion
  // Base calculation: SCFM * SO2% * conversion * MW ratio
  const lbmolSO2Converted = (BASE_FLOW_SCFM * 0.002786) * (BASE_SO2_IN / 100) * (overallSo2Conversion / 100);
  const lbH2SO4PerMin = lbmolSO2Converted * 98.08;
  const acidProductionMtpd = (lbH2SO4PerMin * 60 * 24) / 2204.62;
  
  // Steam production (from waste heat recovery)
  const steamFlowStSteam = acidProductionMtpd * STEAM_RATIO;
  
  // Caustic consumption for tail gas scrubbing (proportional to SO2 to stack)
  const causticFactor = remainAfterPass4;
  const causticConsumptionLbMin = CAUSTIC_CONSUMPTION_BASE * causticFactor;
  
  // Blower discharge pressure affected by valve position
  const blowerDischargePressure = 95 + (jugEffect * 15); // 95-110 in wc range
  
  // Power consumption
  // Compressor power from burner section (assumed constant for converter)
  const compressorPowerConsumption = 4.25; // MW
  
  // Blower power varies with discharge pressure
  const blowerPowerMw = (BLOWER_POWER_BASE / 1341) * (blowerDischargePressure / 95);
  
  const totalPowerMw = compressorPowerConsumption + blowerPowerMw;
  
  return {
    pass1InletTemp,
    pass1OutletTemp,
    pass2OutletTemp,
    pass3OutletTemp,
    pass4OutletTemp,
    so2ConcPass1,
    so2PpmToStack,
    so2ConvPass1,
    so2ConvPass2,
    so2ConvPass3,
    so2ConvPass4,
    overallSo2Conversion,
    acidProductionMtpd,
    steamFlowStSteam,
    causticConsumptionLbMin,
    totalPowerMw,
    compressorPowerConsumption,
    blowerDischargePressure,
  };
}
