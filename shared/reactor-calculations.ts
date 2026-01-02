// Shared reactor flow calculations for both client and server

// Unit conversion constants
const INCHES_WC_TO_PSI = 1 / 27.68;  // 1 psi = 27.68 inches water column
const ATM_TO_PSIA = 14.696;          // 1 atm = 14.696 psia
const NM3H_TO_SCFM = 35.315 / 60;    // Nm³/h to scfm (at 0°C, 1 atm)
const T_STD_RANKINE = 459.67;        // 0°C in Rankine (standard temp reference)

export interface ReactorFlowInputs {
  gasFlowNm3h: number;        // Process gas flow in Nm³/h (dry basis at 0°C, 1 atm)
  temperatureC: number;        // Reactor inlet temperature °C
  pressureInWC: number;        // Pressure in inches water column
  pBarometricAtm: number;      // Barometric pressure in atm
  targetVelocityFPM?: number;  // Target velocity in ft/min (optional, for diameter calc)
}

export interface ReactorFlowResult {
  // Pressure calculations
  pressurePsig: number;        // Gauge pressure in psig
  pressurePsia: number;        // Absolute pressure in psia
  pressureAtm: number;         // Total pressure in atm

  // Temperature conversions
  temperatureK: number;        // Temperature in Kelvin
  temperatureR: number;        // Temperature in Rankine

  // Flow calculations
  scfmDry: number;             // Standard cubic feet per minute (at 0°C, 1 atm)
  volumetricFlowACFM: number;  // Actual volumetric flow rate in acfm

  // Reactor dimensions (if velocity provided)
  reactorAreaFt2?: number;     // Cross-sectional area in ft²
  reactorDiameterFt?: number;  // Reactor diameter in ft
  reactorDiameterIn?: number;  // Reactor diameter in inches
  reactorDiameterM?: number;   // Reactor diameter in meters
  actualVelocityFPM?: number;  // Calculated velocity in ft/min (verification)
}

/**
 * Calculate reactor volumetric flow rate and optionally reactor diameter
 * 
 * This converts gas flow from standard conditions (Nm³/h at 0°C, 1 atm) to
 * actual volumetric flow (acfm) at process temperature and pressure.
 * 
 * If targetVelocityFPM is provided, also calculates reactor diameter.
 */
export function calculateReactorFlow(inputs: ReactorFlowInputs): ReactorFlowResult {
  const {
    gasFlowNm3h,
    temperatureC,
    pressureInWC,
    pBarometricAtm,
    targetVelocityFPM
  } = inputs;

  // Step 1: Convert pressure to consistent units
  const pressurePsig = pressureInWC * INCHES_WC_TO_PSI;
  const pressurePsia = pBarometricAtm * ATM_TO_PSIA + pressurePsig;
  const pressureAtm = pressurePsia / ATM_TO_PSIA;

  // Step 2: Convert temperature to Kelvin and Rankine
  const temperatureK = temperatureC + 273.15;
  const temperatureR = (temperatureC * 9/5) + 491.67;

  // Step 3: Calculate actual volumetric flow (acfm)
  const scfmDry = gasFlowNm3h * NM3H_TO_SCFM;
  const volumetricFlowACFM = scfmDry * (temperatureR / T_STD_RANKINE) * (1.0 / pressureAtm);

  const result: ReactorFlowResult = {
    pressurePsig: Math.round(pressurePsig * 100) / 100,
    pressurePsia: Math.round(pressurePsia * 100) / 100,
    pressureAtm: Math.round(pressureAtm * 1000) / 1000,
    temperatureK: Math.round(temperatureK * 10) / 10,
    temperatureR: Math.round(temperatureR * 10) / 10,
    scfmDry: Math.round(scfmDry),
    volumetricFlowACFM: Math.round(volumetricFlowACFM)
  };

  // Step 4: Calculate reactor diameter from velocity and flow (optional)
  if (targetVelocityFPM && targetVelocityFPM > 0) {
    const reactorAreaFt2 = volumetricFlowACFM / targetVelocityFPM;
    const reactorDiameterFt = Math.sqrt((4 * reactorAreaFt2) / Math.PI);
    const reactorDiameterIn = reactorDiameterFt * 12;
    const reactorDiameterM = reactorDiameterFt * 0.3048;
    const actualVelocityFPM = volumetricFlowACFM / reactorAreaFt2;

    result.reactorAreaFt2 = Math.round(reactorAreaFt2 * 10) / 10;
    result.reactorDiameterFt = Math.round(reactorDiameterFt * 100) / 100;
    result.reactorDiameterIn = Math.round(reactorDiameterIn * 10) / 10;
    result.reactorDiameterM = Math.round(reactorDiameterM * 100) / 100;
    result.actualVelocityFPM = Math.round(actualVelocityFPM);
  }

  return result;
}

/**
 * Calculate gas flow in Nm³/h from plant rate (STPD) and SO2 concentration
 * 
 * Based on stoichiometry of sulfuric acid production:
 * - 1 short ton H2SO4 requires approximately 7.4 Nm³/h of process gas per STPD
 * - This is derived from: S + O2 → SO2 + 1/2 O2 → SO3 + H2O → H2SO4
 */
export function calculateGasFlowFromPlantRate(
  plantRateSTPD: number,
  so2Percent: number
): number {
  // Empirical relationship: Nm³/h ≈ plantRate × 7.4 for typical acid plant
  // Adjusted for SO2 concentration (higher SO2 = less total gas flow needed)
  const baseGasFlow = plantRateSTPD * 7.4;
  const adjustedGasFlow = baseGasFlow * (11.5 / Math.max(so2Percent, 1));
  return Math.round(adjustedGasFlow);
}

/**
 * Calculate standard linear velocity (slfpm) from actual conditions
 */
export function calculateStandardVelocity(
  actualVelocityFPM: number,
  pressureAtm: number,
  temperatureR: number
): number {
  const slfpm = actualVelocityFPM * (pressureAtm / 1.0) * (T_STD_RANKINE / temperatureR);
  return Math.round(slfpm * 10) / 10;
}

/**
 * Calculate actual linear velocity from standard velocity
 */
export function calculateActualVelocity(
  standardVelocitySLFPM: number,
  pressureAtm: number,
  temperatureR: number
): number {
  const alfpm = standardVelocitySLFPM * (1.0 / pressureAtm) * (temperatureR / T_STD_RANKINE);
  return Math.round(alfpm * 10) / 10;
}
