// Backend python code for stand-alone converter simulation
// This is the code that would run on the server whenever the user makes a change to any of the input variables. It is called by the API endpoint /api/catalytic-Converter-simulation. 
// The code is written in Python and uses the numpy, matplotlib, and pandas libraries. The code is not executed in the browser, but rather on the server. The code is called by the API endpoint /api/catalytic-Converter-simulation. 

// Catalyst Bulk Density Database (Kg/m³)
export const CATALYST_BULK_DENSITIES: Record<string, number> = {
  "Topsoe VK69": 800,
  "MECS Super Gear XLP-310": 815,
  "MECS GR330": 865,
  "MECS GR330C": 865,  // Same as GR330
};

// Conversion factor: Kg to lbs
const KG_TO_LBS = 2.20462;

// Unit conversion constants
const INCHES_WC_TO_PSI = 1 / 27.68;  // 1 psi = 27.68 inches water column
const ATM_TO_PSIA = 14.696;          // 1 atm = 14.696 psia
const NM3H_TO_SCFM = 35.315 / 60;    // Nm³/h to scfm (at 0°C, 1 atm)
const T_STD_RANKINE = 459.67;        // 0°C in Rankine (standard temp reference)

// catalystCalculator.ts
export interface CatalystResult {
  matrix: number[][];        // 5 rows × 3 columns
  totalLiters: number;
  totalRatio: number;
}

export interface CatalystWeightResult {
  massKg: number;
  massLbs: number;
}

export interface PassCatalystWeight {
  typeA: CatalystWeightResult;
  typeB: CatalystWeightResult;
  total: CatalystWeightResult;
}

export interface CatalystWeightMatrix {
  passes: PassCatalystWeight[];  // 4 passes
  totals: CatalystWeightResult;  // Grand totals
}

/**
 * Calculate the weight of catalyst in each pass
 * 
 * Formula: Catalyst Mass (Kg) = Catalyst Load (Liters) × Bulk Density (Kg/m³) / 1000
 * Note: Division by 1000 converts liters to m³ (1 m³ = 1000 liters)
 * 
 * @param catalystLoadings - Array of 8 values: [P1A_liters, P1B_liters, P2A_liters, P2B_liters, P3A_liters, P3B_liters, P4A_liters, P4B_liters]
 * @param catalystTypes - Array of 8 catalyst type names corresponding to each loading
 * @returns CatalystWeightMatrix with weights in Kg and lbs for each pass and totals
 */
export function calculateCatalystWeight(
  catalystLoadings: number[],  // 8 values: liters for each [P1A, P1B, P2A, P2B, P3A, P3B, P4A, P4B]
  catalystTypes: string[]      // 8 catalyst type names
): CatalystWeightMatrix {
  if (catalystLoadings.length !== 8) throw new Error("Exactly 8 catalyst loadings required");
  if (catalystTypes.length !== 8) throw new Error("Exactly 8 catalyst types required");

  const passes: PassCatalystWeight[] = [];
  let totalMassKg = 0;

  // Calculate weight for each of the 4 passes
  for (let passIdx = 0; passIdx < 4; passIdx++) {
    const typeAIdx = passIdx * 2;
    const typeBIdx = passIdx * 2 + 1;

    // Get loadings (liters)
    const loadingA = catalystLoadings[typeAIdx] || 0;
    const loadingB = catalystLoadings[typeBIdx] || 0;

    // Get bulk densities (Kg/m³)
    const densityA = CATALYST_BULK_DENSITIES[catalystTypes[typeAIdx]] || 865;  // Default to GR330
    const densityB = CATALYST_BULK_DENSITIES[catalystTypes[typeBIdx]] || 865;

    // Calculate mass: Liters × (Kg/m³) / 1000 = Kg
    // (Dividing by 1000 converts liters to m³)
    const massKgA = (loadingA * densityA) / 1000;
    const massKgB = (loadingB * densityB) / 1000;
    const totalPassMassKg = massKgA + massKgB;

    passes.push({
      typeA: {
        massKg: Math.round(massKgA * 10) / 10,
        massLbs: Math.round(massKgA * KG_TO_LBS * 10) / 10
      },
      typeB: {
        massKg: Math.round(massKgB * 10) / 10,
        massLbs: Math.round(massKgB * KG_TO_LBS * 10) / 10
      },
      total: {
        massKg: Math.round(totalPassMassKg * 10) / 10,
        massLbs: Math.round(totalPassMassKg * KG_TO_LBS * 10) / 10
      }
    });

    totalMassKg += totalPassMassKg;
  }

  return {
    passes,
    totals: {
      massKg: Math.round(totalMassKg * 10) / 10,
      massLbs: Math.round(totalMassKg * KG_TO_LBS * 10) / 10
    }
  };
}

/**
 * Simple helper to calculate catalyst mass for a single loading
 * 
 * @param loadingLiters - Catalyst loading in liters
 * @param catalystType - Catalyst type name (to look up bulk density)
 * @returns Object with mass in Kg and lbs
 */
export function calculateSingleCatalystWeight(
  loadingLiters: number,
  catalystType: string
): CatalystWeightResult {
  const density = CATALYST_BULK_DENSITIES[catalystType] || 865;
  const massKg = (loadingLiters * density) / 1000;
  
  return {
    massKg: Math.round(massKg * 10) / 10,
    massLbs: Math.round(massKg * KG_TO_LBS * 10) / 10
  };
}

export function calculateCatalystLoading(
  plantRateSTPD: number,
  ratios: number[]                     // exactly 8 values: [P1A,P1B,P2A,P2B,P3A,P3B,P4A,P4B]
): CatalystResult {
  if (ratios.length !== 8) throw new Error("Exactly 8 ratios required");

  const matrix = Array(4).fill(null).map(() => [0, 0, 0]); // 4 passes × [A, B, Total]

  // Fill Type A and Type B
  for (let passIdx = 0; passIdx < 4; passIdx++) {
    matrix[passIdx][0] = ratios[passIdx * 2]     || 0; // Type A
    matrix[passIdx][1] = ratios[passIdx * 2 + 1] || 0; // Type B
    matrix[passIdx][2] = matrix[passIdx][0] + matrix[passIdx][1];
  }

  // Convert ratios → actual liters
  const litersMatrix = matrix.map(row =>
    row.map(val => Math.round(val * plantRateSTPD * 10) / 10)
  );

  const totalA = litersMatrix.reduce((sum, row) => sum + row[0], 0);
  const totalB = litersMatrix.reduce((sum, row) => sum + row[1], 0);
  const grandTotal = totalA + totalB;

  // Add total row
  const resultMatrix = [...litersMatrix, [totalA, totalB, grandTotal]];

  return {
    matrix: resultMatrix,
    totalLiters: grandTotal,
    totalRatio: Number(ratios.reduce((a, b) => a + b, 0).toFixed(3))
  };
}

// ========================================
// Converter Volumetric Flow Rate and Diameter Calculator
// Based on sulfuric acid plant converter calculations
// ========================================

export interface ConverterFlowInputs {
  gasFlowNm3h: number;        // Process gas flow in Nm³/h (dry basis at 0°C, 1 atm)
  temperatureC: number;        // Converter inlet temperature °C
  pressureInWC: number;        // Pressure in inches water column
  pBarometricAtm: number;      // Barometric pressure in atm
  targetVelocityFPM?: number;  // Target velocity in ft/min (optional, for diameter calc)
}

export interface ConverterFlowResult {
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

  // Converter dimensions (if velocity provided)
  ConverterAreaFt2?: number;     // Cross-sectional area in ft²
  ConverterDiameterFt?: number;  // Converter diameter in ft
  ConverterDiameterIn?: number;  // Converter diameter in inches
  ConverterDiameterM?: number;   // Converter diameter in meters
  actualVelocityFPM?: number;  // Calculated velocity in ft/min (verification)
}

/**
 * Calculate Converter volumetric flow rate and optionally Converter diameter
 * 
 * This converts gas flow from standard conditions (Nm³/h at 0°C, 1 atm) to
 * actual volumetric flow (acfm) at process temperature and pressure.
 * 
 * If targetVelocityFPM is provided, also calculates Converter diameter.
 * 
 * @param inputs - ConverterFlowInputs object with process conditions
 * @returns ConverterFlowResult with calculated values
 */
export function calculateConverterFlow(inputs: ConverterFlowInputs): ConverterFlowResult {
  const {
    gasFlowNm3h,
    temperatureC,
    pressureInWC,
    pBarometricAtm,
    targetVelocityFPM
  } = inputs;

  // ========================================
  // Step 1: Convert pressure to consistent units
  // ========================================
  
  // Convert pressure: inches water column → psig
  const pressurePsig = pressureInWC * INCHES_WC_TO_PSI;
  
  // Total absolute pressure: barometric + gauge
  const pressurePsia = pBarometricAtm * ATM_TO_PSIA + pressurePsig;
  const pressureAtm = pressurePsia / ATM_TO_PSIA;

  // ========================================
  // Step 2: Convert temperature to Kelvin and Rankine
  // ========================================
  
  const temperatureK = temperatureC + 273.15;
  const temperatureR = (temperatureC * 9/5) + 491.67;  // °C to °R

  // ========================================
  // Step 3: Calculate actual volumetric flow (acfm)
  // ========================================
  
  // Convert Nm³/h to scfm (standard cubic feet per minute at 0°C, 1 atm)
  const scfmDry = gasFlowNm3h * NM3H_TO_SCFM;
  
  // Expand to actual conditions using ideal gas law:
  // V_actual = V_std × (T_actual/T_std) × (P_std/P_actual)
  const volumetricFlowACFM = scfmDry * (temperatureR / T_STD_RANKINE) * (1.0 / pressureAtm);

  // Build result object
  const result: ConverterFlowResult = {
    pressurePsig: Math.round(pressurePsig * 100) / 100,
    pressurePsia: Math.round(pressurePsia * 100) / 100,
    pressureAtm: Math.round(pressureAtm * 1000) / 1000,
    temperatureK: Math.round(temperatureK * 10) / 10,
    temperatureR: Math.round(temperatureR * 10) / 10,
    scfmDry: Math.round(scfmDry),
    volumetricFlowACFM: Math.round(volumetricFlowACFM)
  };

  // ========================================
  // Step 4: Calculate Converter diameter from velocity and flow (optional)
  // ========================================
  
  if (targetVelocityFPM && targetVelocityFPM > 0) {
    // Area = Q / velocity  (ft² = acfm / fpm)
    const ConverterAreaFt2 = volumetricFlowACFM / targetVelocityFPM;
    
    // Diameter from Area = πD²/4  →  D = √(4A/π)
    const ConverterDiameterFt = Math.sqrt((4 * ConverterAreaFt2) / Math.PI);
    const ConverterDiameterIn = ConverterDiameterFt * 12;
    const ConverterDiameterM = ConverterDiameterFt * 0.3048;
    
    // Verify velocity: Q / A
    const actualVelocityFPM = volumetricFlowACFM / ConverterAreaFt2;

    result.ConverterAreaFt2 = Math.round(ConverterAreaFt2 * 10) / 10;
    result.ConverterDiameterFt = Math.round(ConverterDiameterFt * 100) / 100;
    result.ConverterDiameterIn = Math.round(ConverterDiameterIn * 10) / 10;
    result.ConverterDiameterM = Math.round(ConverterDiameterM * 100) / 100;
    result.actualVelocityFPM = Math.round(actualVelocityFPM);
  }

  return result;
}

/**
 * Calculate standard linear feet per minute (slfm) from actual conditions
 * 
 * slfpm = actual velocity × (P_actual/P_std) × (T_std/T_actual)
 * 
 * @param actualVelocityFPM - Actual linear velocity in ft/min
 * @param pressureAtm - Process pressure in atm
 * @param temperatureR - Process temperature in Rankine
 * @returns Standard linear feet per minute (slfpm)
 */
export function calculateStandardVelocity(
  actualVelocityFPM: number,
  pressureAtm: number,
  temperatureR: number
): number {
  // Convert actual velocity to standard velocity
  // slfpm = alfpm × (P_act/P_std) × (T_std/T_act)
  const slfm = actualVelocityFPM * (pressureAtm / 1.0) * (T_STD_RANKINE / temperatureR);
  return Math.round(slfm * 10) / 10;
}

/**
 * Calculate actual linear velocity from standard velocity
 * 
 * alfpm = slfpm × (P_std/P_actual) × (T_actual/T_std)
 * 
 * @param standardVelocitySLFPM - Standard linear velocity in slfpm
 * @param pressureAtm - Process pressure in atm
 * @param temperatureR - Process temperature in Rankine
 * @returns Actual linear feet per minute (alfpm)
 */
export function calculateActualVelocity(
  standardVelocitySLFM: number,
  pressureAtm: number,
  temperatureR: number
): number {
  // Convert standard velocity to actual velocity
  // alfpm = slfpm × (P_std/P_act) × (T_act/T_std)
  const alfpm = standardVelocitySLFM * (1.0 / pressureAtm) * (temperatureR / T_STD_RANKINE);
  return Math.round(alfpm * 10) / 10;
}

/**
 * Quick helper to calculate Converter diameter for a given pass
 * 
 * @param gasFlowNm3h - Gas flow in Nm³/h
 * @param temperatureC - Temperature in °C
 * @param pressureInWC - Pressure in inches water column
 * @param pBarometricAtm - Barometric pressure in atm
 * @param velocityFPM - Target velocity in ft/min
 * @returns Object with diameter in ft, inches, and meters
 */
export function calculateConverterDiameter(
  gasFlowNm3h: number,
  temperatureC: number,
  pressureInWC: number,
  pBarometricAtm: number,
  velocityFPM: number
): { diameterFt: number; diameterIn: number; diameterM: number; acfm: number } {
  const result = calculateConverterFlow({
    gasFlowNm3h,
    temperatureC,
    pressureInWC,
    pBarometricAtm,
    targetVelocityFPM: velocityFPM
  });

  return {
    diameterFt: result.ConverterDiameterFt || 0,
    diameterIn: result.ConverterDiameterIn || 0,
    diameterM: result.ConverterDiameterM || 0,
    acfm: result.volumetricFlowACFM
  };
}