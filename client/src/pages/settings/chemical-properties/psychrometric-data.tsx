import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Droplets, Thermometer, Wind, Cloud, RefreshCw, MapPin, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PsychrometricData } from '@shared/schema';
import { PythonCodeViewer } from '@/components/PythonCodeViewer';

const pythonCode = `# Psychrometric Data
# Variable names and data structure for programming reference

# Psychrometric conditions data structure
class PsychrometricConditions:
    temperature: float       # Dry bulb temperature (C or F)
    humidity: float          # Relative humidity (%)
    pressure: float          # Barometric pressure (hPa or inHg)
    dew_point: float         # Dew point temperature (C or F)

# Calculated psychrometric properties
class PsychrometricProperties:
    humidity_ratio: float       # kg water / kg dry air (or grains/lb)
    specific_enthalpy: float    # kJ/kg (or BTU/lb)
    wet_bulb_temp: float        # Wet bulb temperature (C or F)
    vapor_pressure_kpa: float   # Partial pressure of water vapor (kPa or psi)
    saturation_pressure: float  # Saturation pressure (kPa or psi)
    specific_volume: float      # m³/kg (or ft³/lb)
    air_density: float          # kg/m³ (or lb/ft³)

# Full psychrometric data structure
class PsychrometricData:
    location: dict              # {name, lat, lon, zip_code, country}
    conditions: PsychrometricConditions
    properties: PsychrometricProperties
    fetched_at: str             # ISO timestamp
    cached: bool                # Whether data is from cache

# Unit conversion functions (Metric to Imperial)
def celsius_to_fahrenheit(T_C: float) -> float:
    """Convert Celsius to Fahrenheit."""
    return T_C * 9/5 + 32

def hpa_to_inhg(P_hPa: float) -> float:
    """Convert hectopascals to inches of mercury."""
    return P_hPa * 0.02953

def kg_per_kg_to_grains_per_lb(W: float) -> float:
    """Convert kg/kg to grains/lb (1 lb = 7000 grains)."""
    return W * 7000

def kj_per_kg_to_btu_per_lb(h: float) -> float:
    """Convert kJ/kg to BTU/lb."""
    return h * 0.4299

def m3_per_kg_to_cuft_per_lb(v: float) -> float:
    """Convert m³/kg to ft³/lb."""
    return v * 16.0185

def kg_per_m3_to_lb_per_cuft(rho: float) -> float:
    """Convert kg/m³ to lb/ft³."""
    return rho * 0.06243

def kpa_to_psi(P_kPa: float) -> float:
    """Convert kPa to psi."""
    return P_kPa * 0.145038

# Psychrometric calculation functions
import math

def calc_saturation_pressure(T: float) -> float:
    """
    Calculate saturation vapor pressure using Antoine equation.
    
    Args:
        T: Temperature in Celsius
    Returns:
        Saturation pressure in kPa
    """
    # Antoine coefficients for water (valid 1-100°C)
    A, B, C = 8.07131, 1730.63, 233.426
    P_mmHg = 10 ** (A - B / (C + T))
    return P_mmHg * 0.133322  # mmHg to kPa

def calc_humidity_ratio(T_db: float, RH: float, P_atm: float) -> float:
    """
    Calculate humidity ratio (absolute humidity).
    W = 0.622 * (P_v / (P_atm - P_v))
    
    Args:
        T_db: Dry bulb temperature (C)
        RH: Relative humidity (0-100%)
        P_atm: Atmospheric pressure (kPa)
    Returns:
        Humidity ratio (kg water / kg dry air)
    """
    P_sat = calc_saturation_pressure(T_db)
    P_v = (RH / 100) * P_sat
    return 0.622 * P_v / (P_atm - P_v)

def calc_specific_enthalpy(T_db: float, W: float) -> float:
    """
    Calculate specific enthalpy of moist air.
    h = 1.006*T + W*(2501 + 1.86*T)
    
    Args:
        T_db: Dry bulb temperature (C)
        W: Humidity ratio (kg/kg)
    Returns:
        Specific enthalpy (kJ/kg dry air)
    """
    return 1.006 * T_db + W * (2501 + 1.86 * T_db)

def calc_dew_point(T_db: float, RH: float) -> float:
    """
    Calculate dew point temperature using Magnus formula.
    
    Args:
        T_db: Dry bulb temperature (C)
        RH: Relative humidity (0-100%)
    Returns:
        Dew point temperature (C)
    """
    a, b = 17.27, 237.7
    alpha = (a * T_db) / (b + T_db) + math.log(RH / 100)
    return (b * alpha) / (a - alpha)

def calc_wet_bulb(T_db: float, RH: float) -> float:
    """
    Estimate wet bulb temperature (iterative calculation).
    
    Args:
        T_db: Dry bulb temperature (C)
        RH: Relative humidity (0-100%)
    Returns:
        Wet bulb temperature (C)
    """
    # Simplified Stull formula approximation
    T_wb = T_db * math.atan(0.151977 * (RH + 8.313659)**0.5)
    T_wb += math.atan(T_db + RH) - math.atan(RH - 1.676331)
    T_wb += 0.00391838 * RH**1.5 * math.atan(0.023101 * RH) - 4.686035
    return T_wb

def calc_air_density(T_db: float, P_atm: float, W: float) -> float:
    """
    Calculate moist air density.
    
    Args:
        T_db: Dry bulb temperature (C)
        P_atm: Atmospheric pressure (kPa)
        W: Humidity ratio (kg/kg)
    Returns:
        Air density (kg/m³)
    """
    T_K = T_db + 273.15
    R_da = 287.058  # J/(kg·K) for dry air
    return (P_atm * 1000) / (R_da * T_K * (1 + 1.6078 * W))
`;

// Unit conversion functions (Metric to Imperial)
const toFahrenheit = (celsius: number) => celsius * 9/5 + 32;
const toInHg = (hPa: number) => hPa * 0.02953;  // hPa to inches of mercury
const toGrainsPerLb = (kgPerKg: number) => kgPerKg * 7000;  // kg/kg to grains/lb
const toBtuPerLb = (kJPerKg: number) => kJPerKg * 0.4299;  // kJ/kg to BTU/lb
const toCuFtPerLb = (m3PerKg: number) => m3PerKg * 16.0185;  // m³/kg to ft³/lb
const toLbPerCuFt = (kgPerM3: number) => kgPerM3 * 0.06243;  // kg/m³ to lb/ft³
const toPsi = (kPa: number) => kPa * 0.145038;  // kPa to psi

interface HistoricalData {
  location: { name: string; lat: number; lon: number; zipCode: string; country: string };
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

export default function PsychrometricDataPage() {
  const [, setLocation] = useLocation();
  const [zipCode, setZipCode] = useState('89445');
  const [countryCode, setCountryCode] = useState('US');
  const [queryZip, setQueryZip] = useState('89445');

  // Fetch current psychrometric data
  const currentQuery = useQuery<PsychrometricData>({
    queryKey: ['/api/psychrometrics/current', queryZip, countryCode],
    queryFn: async () => {
      const res = await fetch(`/api/psychrometrics/current?zipCode=${queryZip}&countryCode=${countryCode}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch data');
      }
      return res.json();
    },
    enabled: queryZip.length >= 5,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Fetch historical data
  const historyQuery = useQuery<HistoricalData>({
    queryKey: ['/api/psychrometrics/history', queryZip, countryCode],
    queryFn: async () => {
      const res = await fetch(`/api/psychrometrics/history?zipCode=${queryZip}&countryCode=${countryCode}&daysBack=7`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch historical data');
      }
      return res.json();
    },
    enabled: queryZip.length >= 5,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const handleSearch = () => {
    if (zipCode.length >= 5) {
      setQueryZip(zipCode);
    }
  };

  const handleRefresh = () => {
    currentQuery.refetch();
    historyQuery.refetch();
  };

  const data = currentQuery.data;
  const historyData = historyQuery.data;

  // Format chart data - sample every 3 hours for readability, convert to imperial
  const chartData = historyData?.hourlyData
    .filter((_, idx) => idx % 3 === 0)
    .map(item => ({
      time: new Date(item.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' }),
      temperature: toFahrenheit(item.temperature),
      humidity: item.humidity,
      dewPoint: toFahrenheit(item.dewPoint),
      enthalpy: toBtuPerLb(item.specificEnthalpy),
      humidityRatio: toGrainsPerLb(item.humidityRatio),
    })) || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/settings/chemical-properties')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Droplets className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Psychrometric Data</h1>
                <p className="text-xs text-muted-foreground">Real-time air-water vapor properties (Open-Meteo)</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PythonCodeViewer
              title="Psychrometric Data - Python Variables"
              description="Variable names, data structures, and calculation functions for psychrometric properties"
              code={pythonCode}
            />
            {data && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={currentQuery.isFetching}
                data-testid="button-refresh"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${currentQuery.isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Location Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </CardTitle>
              <CardDescription>Enter a ZIP code to fetch weather and psychrometric data (powered by Open-Meteo - no API key required)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="89445"
                    className="w-32"
                    data-testid="input-zip-code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countryCode">Country</Label>
                  <Input
                    id="countryCode"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                    placeholder="US"
                    className="w-20"
                    maxLength={2}
                    data-testid="input-country-code"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={zipCode.length < 5 || currentQuery.isFetching}
                  data-testid="button-search"
                >
                  {currentQuery.isFetching ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Get Weather Data'
                  )}
                </Button>
              </div>

              {data?.location && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">{data.location.name}</span>
                    <span className="text-muted-foreground ml-2">
                      ({data.location.lat.toFixed(2)}°, {data.location.lon.toFixed(2)}°)
                    </span>
                    {data.cached && <span className="ml-2 text-xs text-muted-foreground">(cached)</span>}
                  </p>
                </div>
              )}

              {currentQuery.error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/50 rounded-md">
                  <p className="text-sm text-destructive">{(currentQuery.error as Error).message}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Display with Tabs */}
          {data && (
            <Tabs defaultValue="current" className="space-y-4">
              <TabsList>
                <TabsTrigger value="current" data-testid="tab-current">Current Conditions</TabsTrigger>
                <TabsTrigger value="history" data-testid="tab-history">Historical Trends</TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="space-y-4">
                {/* Weather Conditions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cloud className="w-5 h-5" />
                      Current Weather
                    </CardTitle>
                    <CardDescription>
                      {new Date(data.conditions.timestamp * 1000).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <MetricCard
                        icon={<Thermometer className="w-5 h-5 text-red-500" />}
                        label="Temperature"
                        value={toFahrenheit(data.conditions.temperature).toFixed(1)}
                        unit="°F"
                        testId="metric-temperature"
                      />
                      <MetricCard
                        icon={<Droplets className="w-5 h-5 text-blue-500" />}
                        label="Relative Humidity"
                        value={data.conditions.humidity.toFixed(0)}
                        unit="%"
                        testId="metric-humidity"
                      />
                      <MetricCard
                        icon={<Thermometer className="w-5 h-5 text-cyan-500" />}
                        label="Dew Point"
                        value={toFahrenheit(data.conditions.dewPoint).toFixed(1)}
                        unit="°F"
                        testId="metric-dewpoint"
                      />
                      <MetricCard
                        icon={<Cloud className="w-5 h-5 text-gray-500" />}
                        label="Pressure"
                        value={toInHg(data.conditions.pressure).toFixed(2)}
                        unit="inHg"
                        testId="metric-pressure"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Psychrometric Properties */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="w-5 h-5" />
                      Calculated Psychrometric Properties
                    </CardTitle>
                    <CardDescription>Derived air-water vapor thermodynamic properties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <PropertyCard
                        label="Humidity Ratio"
                        value={toGrainsPerLb(data.psychrometrics.humidityRatio).toFixed(2)}
                        unit="grains/lb dry air"
                        description="Mass of water vapor per mass of dry air"
                        testId="prop-humidity-ratio"
                      />
                      <PropertyCard
                        label="Specific Enthalpy"
                        value={toBtuPerLb(data.psychrometrics.specificEnthalpy).toFixed(2)}
                        unit="BTU/lb"
                        description="Total heat content of moist air"
                        testId="prop-enthalpy"
                      />
                      <PropertyCard
                        label="Wet Bulb"
                        value={toFahrenheit(data.psychrometrics.wetBulbC).toFixed(1)}
                        unit="°F"
                        description="Adiabatic saturation temperature"
                        testId="prop-wet-bulb"
                      />
                      <PropertyCard
                        label="Vapor Pressure"
                        value={toPsi(data.psychrometrics.vaporPressureKpa).toFixed(4)}
                        unit="psi"
                        description="Partial pressure of water vapor"
                        testId="prop-vapor-pressure"
                      />
                      <PropertyCard
                        label="Saturation Pressure"
                        value={toPsi(data.psychrometrics.saturationPressureKpa).toFixed(4)}
                        unit="psi"
                        description="Max vapor pressure at temperature"
                        testId="prop-sat-pressure"
                      />
                      <PropertyCard
                        label="Specific Volume"
                        value={toCuFtPerLb(data.psychrometrics.specificVolume).toFixed(3)}
                        unit="ft³/lb"
                        description="Volume per unit mass of dry air"
                        testId="prop-specific-volume"
                      />
                      <PropertyCard
                        label="Air Density"
                        value={toLbPerCuFt(data.psychrometrics.densityKgM3).toFixed(4)}
                        unit="lb/ft³"
                        description="Density of moist air"
                        testId="prop-density"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      7-Day Historical Trends
                    </CardTitle>
                    <CardDescription>
                      Temperature, humidity, and psychrometric properties over time (ERA5 reanalysis data)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {historyQuery.isLoading ? (
                      <div className="h-80 flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : chartData.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                            <YAxis yAxisId="temp" orientation="left" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="humidity" orientation="right" tick={{ fontSize: 11 }} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                              labelStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Legend />
                            <Line yAxisId="temp" type="monotone" dataKey="temperature" stroke="#ef4444" name="Temp (°F)" dot={false} />
                            <Line yAxisId="temp" type="monotone" dataKey="dewPoint" stroke="#06b6d4" name="Dew Point (°F)" dot={false} />
                            <Line yAxisId="humidity" type="monotone" dataKey="humidity" stroke="#3b82f6" name="RH (%)" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center text-muted-foreground">
                        No historical data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Enthalpy Chart */}
                {chartData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Enthalpy & Humidity Ratio Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                            <YAxis yAxisId="enthalpy" orientation="left" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="ratio" orientation="right" tick={{ fontSize: 11 }} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                              labelStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Legend />
                            <Line yAxisId="enthalpy" type="monotone" dataKey="enthalpy" stroke="#8b5cf6" name="Enthalpy (BTU/lb)" dot={false} />
                            <Line yAxisId="ratio" type="monotone" dataKey="humidityRatio" stroke="#22c55e" name="W (grains/lb)" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Initial state */}
          {!data && !currentQuery.isFetching && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Droplets className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Enter a ZIP code to get started</p>
                  <p className="text-sm mt-1">
                    Real-time weather data will be used to calculate psychrometric properties
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Psychrometric Data | Open-Meteo API</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({ icon, label, value, unit, testId }: { icon: React.ReactNode; label: string; value: string; unit: string; testId: string }) {
  return (
    <div className="p-4 bg-muted/30 rounded-lg" data-testid={testId}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold font-mono">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function PropertyCard({ label, value, unit, description, testId }: { label: string; value: string; unit: string; description: string; testId: string }) {
  return (
    <div className="p-4 border rounded-lg" data-testid={testId}>
      <div className="text-sm font-medium mb-1">{label}</div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-xl font-semibold font-mono">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
