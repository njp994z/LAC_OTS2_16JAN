/**
 * Weather Service
 * 
 * Fetches weather data from Open-Meteo API (free, no API key required)
 * and calculates psychrometric properties.
 */

import { calculatePsychrometrics } from '../../shared/psychrometrics';
import type { WeatherConditions, PsychrometricData } from '../../shared/schema';

const CACHE_TTL_CURRENT = 5 * 60 * 1000; // 5 minutes for current data
const CACHE_TTL_HISTORY = 60 * 60 * 1000; // 1 hour for historical data

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface GeoLocation {
  lat: number;
  lon: number;
  name: string;
}

interface HourlyData {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  dew_point_2m: number[];
  pressure_msl: number[];
}

export interface HistoricalPsychrometricData {
  location: {
    name: string;
    lat: number;
    lon: number;
    zipCode: string;
    country: string;
  };
  hourlyData: Array<{
    time: string;
    temperature: number;
    humidity: number;
    dewPoint: number;
    pressure: number;
    humidityRatio: number;
    specificEnthalpy: number;
    vaporPressureKpa: number;
  }>;
  fetchedAt: string;
  cached: boolean;
}

// In-memory cache
const currentCache = new Map<string, CacheEntry<PsychrometricData>>();
const historyCache = new Map<string, CacheEntry<HistoricalPsychrometricData>>();
const geoCache = new Map<string, GeoLocation>();

export class WeatherServiceError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

/**
 * Get coordinates for a ZIP code using Open-Meteo Geocoding API (free, no key)
 */
async function getCoordinatesForZip(zipCode: string, countryCode: string = 'US'): Promise<GeoLocation> {
  const cacheKey = `${zipCode}-${countryCode}`;
  
  const cached = geoCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', zipCode);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  url.searchParams.set('country', countryCode);

  const response = await fetch(url.toString(), { 
    signal: AbortSignal.timeout(10000) 
  });

  if (!response.ok) {
    throw new WeatherServiceError(`Geocoding failed: ${response.statusText}`, response.status);
  }

  const data = await response.json();
  const results = data.results || [];
  
  if (results.length === 0) {
    throw new WeatherServiceError(`Location not found for ZIP ${zipCode}, ${countryCode}`, 404);
  }

  const loc = results[0];
  const location: GeoLocation = {
    lat: loc.latitude,
    lon: loc.longitude,
    name: loc.name || 'Unknown',
  };

  geoCache.set(cacheKey, location);
  return location;
}

/**
 * Fetch current weather from Open-Meteo forecast API (free, no key)
 */
async function fetchCurrentWeather(lat: number, lon: number): Promise<HourlyData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat.toString());
  url.searchParams.set('longitude', lon.toString());
  url.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,dew_point_2m,pressure_msl');
  url.searchParams.set('past_days', '1');
  url.searchParams.set('forecast_days', '1');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new WeatherServiceError(`Weather API failed: ${response.statusText}`, response.status);
  }

  const data = await response.json();
  return data.hourly || {};
}

/**
 * Fetch historical ERA5 data from Open-Meteo archive API
 */
async function fetchHistoricalWeather(lat: number, lon: number, startDate: string, endDate: string): Promise<HourlyData> {
  const url = new URL('https://archive-api.open-meteo.com/v1/era5');
  url.searchParams.set('latitude', lat.toString());
  url.searchParams.set('longitude', lon.toString());
  url.searchParams.set('start_date', startDate);
  url.searchParams.set('end_date', endDate);
  url.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,dew_point_2m,pressure_msl');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new WeatherServiceError(`Historical API failed: ${response.statusText}`, response.status);
  }

  const data = await response.json();
  return data.hourly || {};
}

/**
 * Parse hourly data and get the most recent entry
 */
function getLatestConditions(hourly: HourlyData): WeatherConditions {
  const times = hourly.time || [];
  const temps = hourly.temperature_2m || [];
  const rhs = hourly.relative_humidity_2m || [];
  const dewPoints = hourly.dew_point_2m || [];
  const pressures = hourly.pressure_msl || [];

  if (times.length === 0) {
    throw new WeatherServiceError('No weather data available', 404);
  }

  // Get the last (most recent) entry
  const idx = times.length - 1;

  return {
    temperature: temps[idx] ?? 0,
    humidity: rhs[idx] ?? 0,
    pressure: pressures[idx] ?? 1013.25,
    dewPoint: dewPoints[idx] ?? 0,
    windSpeed: 0,
    windDeg: 0,
    clouds: 0,
    visibility: 10000,
    description: 'Current conditions',
    icon: '01d',
    timestamp: Math.floor(new Date(times[idx]).getTime() / 1000),
  };
}

/**
 * Get current psychrometric data for a location
 */
export async function getCurrentPsychrometrics(
  zipCode: string,
  countryCode: string = 'US'
): Promise<PsychrometricData> {
  const cacheKey = `current-${zipCode}-${countryCode}`;
  
  // Check cache
  const cached = currentCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.data, cached: true };
  }

  // Fetch fresh data
  const location = await getCoordinatesForZip(zipCode, countryCode);
  const hourlyData = await fetchCurrentWeather(location.lat, location.lon);
  const conditions = getLatestConditions(hourlyData);

  // Calculate psychrometric properties
  const psychro = calculatePsychrometrics({
    temperatureC: conditions.temperature,
    relativeHumidityPercent: conditions.humidity,
    pressureHpa: conditions.pressure,
    dewPointC: conditions.dewPoint,
  });

  const result: PsychrometricData = {
    conditions,
    psychrometrics: {
      humidityRatio: psychro.humidityRatio,
      specificEnthalpy: psychro.specificEnthalpy,
      vaporPressureKpa: psychro.vaporPressureKpa,
      saturationPressureKpa: psychro.saturationPressureKpa,
      dewPointC: psychro.dewPointC,
      wetBulbC: psychro.wetBulbC,
      specificVolume: psychro.specificVolume,
      densityKgM3: psychro.densityKgM3,
    },
    location: {
      name: location.name,
      lat: location.lat,
      lon: location.lon,
      zipCode,
      country: countryCode,
    },
    cached: false,
    fetchedAt: new Date().toISOString(),
  };

  // Store in cache
  currentCache.set(cacheKey, {
    data: result,
    expiresAt: Date.now() + CACHE_TTL_CURRENT,
  });

  return result;
}

/**
 * Get historical psychrometric data for a location
 */
export async function getHistoricalPsychrometrics(
  zipCode: string,
  countryCode: string = 'US',
  daysBack: number = 7
): Promise<HistoricalPsychrometricData> {
  const cacheKey = `history-${zipCode}-${countryCode}-${daysBack}`;
  
  // Check cache
  const cached = historyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.data, cached: true };
  }

  // Fetch fresh data
  const location = await getCoordinatesForZip(zipCode, countryCode);
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  
  const hourlyData = await fetchHistoricalWeather(
    location.lat, 
    location.lon,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );

  const times = hourlyData.time || [];
  const temps = hourlyData.temperature_2m || [];
  const rhs = hourlyData.relative_humidity_2m || [];
  const dewPoints = hourlyData.dew_point_2m || [];
  const pressures = hourlyData.pressure_msl || [];

  // Calculate psychrometrics for each hour
  const processedData = times.map((time, idx) => {
    const temp = temps[idx] ?? 0;
    const humidity = rhs[idx] ?? 0;
    const pressure = pressures[idx] ?? 1013.25;
    
    const psychro = calculatePsychrometrics({
      temperatureC: temp,
      relativeHumidityPercent: humidity,
      pressureHpa: pressure,
    });

    return {
      time,
      temperature: temp,
      humidity,
      dewPoint: dewPoints[idx] ?? 0,
      pressure,
      humidityRatio: psychro.humidityRatio,
      specificEnthalpy: psychro.specificEnthalpy,
      vaporPressureKpa: psychro.vaporPressureKpa,
    };
  });

  const result: HistoricalPsychrometricData = {
    location: {
      name: location.name,
      lat: location.lat,
      lon: location.lon,
      zipCode,
      country: countryCode,
    },
    hourlyData: processedData,
    fetchedAt: new Date().toISOString(),
    cached: false,
  };

  // Store in cache
  historyCache.set(cacheKey, {
    data: result,
    expiresAt: Date.now() + CACHE_TTL_HISTORY,
  });

  return result;
}

/**
 * Clear the weather cache
 */
export function clearWeatherCache(): void {
  currentCache.clear();
  historyCache.clear();
}

/**
 * Weather service is always configured (Open-Meteo is free, no key needed)
 */
export function isWeatherServiceConfigured(): boolean {
  return true;
}
