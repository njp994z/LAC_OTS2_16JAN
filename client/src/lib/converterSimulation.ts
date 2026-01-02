// Converter Operator Screen Simulation

export interface ConverterInputs {
  pass2InletTemp: number;
  pass3InletTemp: number;
  pass4InletTemp: number;
  jugValvePctOpen: number;
  ipatGasInletTemp: number;
  fatGasInletTemp: number;
}

export interface ConverterOutputs {
  pass1InletTemp: number;
  pass1OutletTemp: number;
  pass2OutletTemp: number;
  pass3OutletTemp: number;
  pass4OutletTemp: number;
  so2ConcPass1: number;
  so2ConvPass1: number;
  so2ConvPass2: number;
  so2ConvPass3: number;
  so2ConvPass4: number;
  overallSo2Conversion: number;
  so2PpmToStack: number;
  acidProductionMtpd: number;
  steamFlowStSteam: number;
  causticConsumptionLbMin: number;
  totalPowerMw: number;
  compressorPowerConsumption: number;
  blowerDischargePressure: number;
}

export function runConverterSimulation(inputs: ConverterInputs): ConverterOutputs {
  // Base case values
  const basePass1InletTemp = 750;
  const basePass2InletTemp = 780;
  const basePass3InletTemp = 775;
  const basePass4InletTemp = 770;

  // Calculate Pass 1 inlet temperature based on jug valve position
  // Jug valve affects the proportion of hot gas from Pass 4 recycled to Pass 1
  const jugValveEffect = (inputs.jugValvePctOpen / 100) * 50; // Up to 50°F effect
  const pass1InletTemp = basePass1InletTemp + jugValveEffect;

  // Calculate outlet temperatures based on inlet temperatures
  // Assume ~30°F temperature drop across each pass
  const pass1OutletTemp = pass1InletTemp - 30;
  const pass2OutletTemp = inputs.pass2InletTemp - 35;
  const pass3OutletTemp = inputs.pass3InletTemp - 35;
  const pass4OutletTemp = inputs.pass4InletTemp - 30;

  // SO2 conversion calculations based on temperature (higher temps generally reduce conversion)
  // Use simplified kinetic model
  const baseConversion = 95; // Base SO2 conversion %
  const tempEffect = (pass1InletTemp - 750) * -0.05; // -0.05% conversion per °F above 750°F
  const so2ConvPass1 = Math.max(88, Math.min(98, baseConversion + tempEffect));

  // Each pass adds a small increment of conversion
  const so2ConvPass2 = so2ConvPass1 + 1.5;
  const so2ConvPass3 = so2ConvPass2 + 1.0;
  const so2ConvPass4 = so2ConvPass3 + 0.5;
  const overallSo2Conversion = so2ConvPass4;

  // SO2 concentration to Pass 1 (decreases with higher conversion in previous pass)
  const so2ConcPass1 = 9.0 * (1 - so2ConvPass1 / 100);

  // SO2 ppmv to stack (based on overall conversion)
  const so2PpmToStack = Math.max(10, 500 * (1 - overallSo2Conversion / 100));

  // Acid production (base of 2450 MTPD, affected by conversion)
  const baseAcidProduction = 2450;
  const acidProductionMtpd = baseAcidProduction * (overallSo2Conversion / 95);

  // Steam flow (ST steam per ST acid) - decreases at higher conversion efficiency
  const baseStreamFlow = 0.95;
  const steamFlowStSteam = baseStreamFlow * (96 / overallSo2Conversion);

  // Caustic consumption (lb/min) - for neutralization
  const baseCaustic = 180;
  const causticConsumptionLbMin = baseCaustic * (2480 / baseAcidProduction);

  // Power calculations
  const baseCompressorPower = 1.85; // MW
  const compressorPowerConsumption = baseCompressorPower * (1 + (pass1InletTemp - 750) / 1000);

  const baseTotalPower = 3.50; // MW
  const totalPowerMw = baseTotalPower + compressorPowerConsumption;

  // Blower discharge pressure (in wc)
  const baseBlowerPressure = 30;
  const blowerDischargePressure = baseBlowerPressure * (1 + (inputs.pass2InletTemp - basePass2InletTemp) / 200);

  return {
    pass1InletTemp,
    pass1OutletTemp,
    pass2OutletTemp,
    pass3OutletTemp,
    pass4OutletTemp,
    so2ConcPass1,
    so2ConvPass1,
    so2ConvPass2,
    so2ConvPass3,
    so2ConvPass4,
    overallSo2Conversion,
    so2PpmToStack,
    acidProductionMtpd,
    steamFlowStSteam,
    causticConsumptionLbMin,
    totalPowerMw,
    compressorPowerConsumption,
    blowerDischargePressure,
  };
}
