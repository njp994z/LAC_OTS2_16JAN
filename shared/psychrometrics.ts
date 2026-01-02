/**
 * Psychrometric Calculations
 * 
 * Utility functions for calculating air-water vapor properties
 * including humidity ratio, enthalpy, vapor pressure, and wet bulb temperature.
 */

/**
 * Calculate saturation vapor pressure using Magnus-type formula
 * Valid for typical ambient temperatures (-40°C to 50°C)
 * 
 * @param tempC - Temperature in Celsius
 * @returns Saturation vapor pressure in kPa
 */
export function saturationVaporPressure(tempC: number): number {
  return 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

/**
 * Calculate humidity ratio (specific humidity)
 * 
 * @param vaporPressureKpa - Vapor pressure in kPa
 * @param totalPressureKpa - Total atmospheric pressure in kPa
 * @returns Humidity ratio in kg water / kg dry air
 */
export function humidityRatio(vaporPressureKpa: number, totalPressureKpa: number): number {
  return 0.62198 * vaporPressureKpa / (totalPressureKpa - vaporPressureKpa);
}

/**
 * Calculate specific enthalpy of moist air
 * 
 * @param tempC - Dry bulb temperature in Celsius
 * @param humidityRatioValue - Humidity ratio in kg/kg
 * @returns Specific enthalpy in kJ/kg dry air
 */
export function specificEnthalpy(tempC: number, humidityRatioValue: number): number {
  return 1.006 * tempC + humidityRatioValue * (2501 + 1.86 * tempC);
}

/**
 * Calculate dew point temperature from vapor pressure
 * Using inverse of Magnus formula
 * 
 * @param vaporPressureKpa - Vapor pressure in kPa
 * @returns Dew point temperature in Celsius
 */
export function dewPointFromVaporPressure(vaporPressureKpa: number): number {
  const a = 17.27;
  const b = 237.3;
  const gamma = Math.log(vaporPressureKpa / 0.6108);
  return (b * gamma) / (a - gamma);
}

/**
 * Estimate wet bulb temperature using iterative approach
 * This is an approximation using the psychrometric relationship
 * 
 * @param tempC - Dry bulb temperature in Celsius
 * @param rhPercent - Relative humidity in percent
 * @returns Wet bulb temperature in Celsius
 */
export function wetBulbTemperature(tempC: number, rhPercent: number): number {
  // Stull formula approximation - accurate within 0.3°C for typical conditions
  const rh = rhPercent / 100;
  return tempC * Math.atan(0.151977 * Math.sqrt(rh + 8.313659))
    + Math.atan(tempC + rh)
    - Math.atan(rh - 1.676331)
    + 0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh)
    - 4.686035;
}

export interface PsychrometricInput {
  temperatureC: number;
  relativeHumidityPercent: number;
  pressureHpa: number;
  dewPointC?: number;
}

export interface PsychrometricResult {
  // Input conditions
  dryBulbTempC: number;
  relativeHumidityPercent: number;
  pressureHpa: number;
  
  // Calculated properties
  humidityRatio: number;           // kg water / kg dry air
  specificEnthalpy: number;        // kJ/kg dry air
  vaporPressureKpa: number;        // Actual vapor pressure
  saturationPressureKpa: number;   // Saturation vapor pressure
  dewPointC: number;               // Dew point temperature
  wetBulbC: number;                // Wet bulb temperature
  specificVolume: number;          // m³/kg dry air
  densityKgM3: number;             // kg/m³ moist air
}

/**
 * Calculate complete psychrometric properties from temperature, humidity, and pressure
 * 
 * @param input - Temperature (°C), relative humidity (%), and pressure (hPa)
 * @returns Complete psychrometric properties
 */
export function calculatePsychrometrics(input: PsychrometricInput): PsychrometricResult {
  const { temperatureC, relativeHumidityPercent, pressureHpa, dewPointC: providedDewPoint } = input;
  
  const rh = relativeHumidityPercent / 100;
  const pressureKpa = pressureHpa / 10; // Convert hPa to kPa
  
  // Calculate vapor pressures
  const satPressure = saturationVaporPressure(temperatureC);
  const actualVaporPressure = rh * satPressure;
  
  // Calculate humidity ratio
  const w = humidityRatio(actualVaporPressure, pressureKpa);
  
  // Calculate enthalpy
  const h = specificEnthalpy(temperatureC, w);
  
  // Calculate dew point (use provided or calculate)
  const dewPoint = providedDewPoint ?? dewPointFromVaporPressure(actualVaporPressure);
  
  // Calculate wet bulb temperature
  const wetBulb = wetBulbTemperature(temperatureC, relativeHumidityPercent);
  
  // Calculate specific volume (m³/kg dry air)
  // v = (287.058 * T_K) / (p - e) where p and e in Pa
  const tempK = temperatureC + 273.15;
  const pressurePa = pressureKpa * 1000;
  const vaporPressurePa = actualVaporPressure * 1000;
  const specificVol = (287.058 * tempK * (1 + 1.6078 * w)) / pressurePa;
  
  // Calculate density of moist air
  const density = (1 + w) / specificVol;
  
  return {
    dryBulbTempC: temperatureC,
    relativeHumidityPercent,
    pressureHpa,
    humidityRatio: w,
    specificEnthalpy: h,
    vaporPressureKpa: actualVaporPressure,
    saturationPressureKpa: satPressure,
    dewPointC: dewPoint,
    wetBulbC: wetBulb,
    specificVolume: specificVol,
    densityKgM3: density,
  };
}

/**
 * Format psychrometric value with appropriate precision
 */
export function formatPsychrometricValue(value: number, type: 'temperature' | 'humidity' | 'pressure' | 'ratio' | 'enthalpy' | 'volume' | 'density'): string {
  switch (type) {
    case 'temperature':
      return value.toFixed(1);
    case 'humidity':
      return value.toFixed(1);
    case 'pressure':
      return value.toFixed(2);
    case 'ratio':
      return value.toFixed(6);
    case 'enthalpy':
      return value.toFixed(2);
    case 'volume':
      return value.toFixed(4);
    case 'density':
      return value.toFixed(4);
    default:
      return value.toFixed(2);
  }
}
