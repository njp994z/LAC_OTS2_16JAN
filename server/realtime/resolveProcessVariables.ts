export interface PsychrometricData {
  conditions: {
    temperature: number;
    humidity: number;
    pressure: number;
    dew_point?: number;
  };
  properties?: {
    humidity_ratio?: number;
    specific_enthalpy?: number;
    wet_bulb_temperature?: number;
    vapor_pressure?: number;
    saturation_pressure?: number;
    specific_volume?: number;
    air_density?: number;
  };
  units?: {
    temperature?: string;
    humidity?: string;
    pressure?: string;
  };
  fetched_at?: string;
}

export interface PvRow {
  count: string;
  tag: string;
  description: string;
  cases: Record<string, string>;
}

export type CaseKey = 1 | 2 | 3 | 4;

const GRAINS_PER_LB_FROM_KGKG = 7000;
const F_FROM_C = (c: number) => c * 9 / 5 + 32;
const ATM_FROM_HPA = (hpa: number) => hpa / 1013.25;

type SentinelKind = "currentTemp" | "currentPressure" | "currentMoisture";

function parseSentinel(v: string): { kind: SentinelKind } | null {
  const s = v.trim().toLowerCase();
  if (s.includes("realtime") && (s.includes("temperature") || s.includes("f"))) {
    return { kind: "currentTemp" };
  }
  if (s.includes("realtime") && (s.includes("pressure") || s.includes("atm"))) {
    return { kind: "currentPressure" };
  }
  if (s.includes("realtime") && (s.includes("moist") || s.includes("gr") || s.includes("humidity"))) {
    return { kind: "currentMoisture" };
  }
  return null;
}

function getPvCell(row: PvRow, which: CaseKey): string {
  const caseId = `case${which}`;
  return row.cases[caseId] || "";
}

function setPvCell(row: PvRow, which: CaseKey, value: string): void {
  const caseId = `case${which}`;
  row.cases[caseId] = value;
}

export interface ResolvedPvValues {
  ambientPressure_atm: number;
  ambientTemperature_F: number;
  ambientMoisture_grLb: number;
  mainCompRpm_pct: number;
  filterDp_inwc: number;
}

export async function resolveRealtimePV({
  processVariables,
  whichCase,
  psychroData,
}: {
  processVariables: PvRow[];
  whichCase: CaseKey;
  psychroData: PsychrometricData | null;
}): Promise<PvRow[]> {
  const out = processVariables.map(r => ({ 
    ...r, 
    cases: { ...r.cases }
  }));

  for (const row of out) {
    const cell = getPvCell(row, whichCase);
    const sentinel = parseSentinel(cell);
    if (!sentinel || !psychroData) continue;

    if (sentinel.kind === "currentTemp") {
      const tempF = psychroData.conditions.temperature;
      setPvCell(row, whichCase, `${tempF.toFixed(1)} F`);
    }
    if (sentinel.kind === "currentPressure") {
      const pressureAtm = ATM_FROM_HPA(psychroData.conditions.pressure);
      setPvCell(row, whichCase, `${pressureAtm.toFixed(4)} ATM`);
    }
    if (sentinel.kind === "currentMoisture") {
      const humidityKgKg = psychroData.properties?.humidity_ratio ?? 0;
      const moistureGrLb = humidityKgKg * GRAINS_PER_LB_FROM_KGKG;
      setPvCell(row, whichCase, `${moistureGrLb.toFixed(2)} gr / lb BDA`);
    }
  }

  return out;
}

export function extractPvValues(
  resolvedPVs: PvRow[],
  whichCase: CaseKey
): ResolvedPvValues {
  let ambientPressure_atm = 0.84;
  let ambientTemperature_F = 93;
  let ambientMoisture_grLb = 79;
  let mainCompRpm_pct = 87;
  let filterDp_inwc = 2;

  for (const row of resolvedPVs) {
    const cell = getPvCell(row, whichCase);
    const numMatch = cell.match(/([\d.]+)/);
    const numVal = numMatch ? parseFloat(numMatch[1]) : 0;

    if (row.count === "0A") {
      ambientPressure_atm = numVal;
    } else if (row.count === "0B") {
      ambientTemperature_F = numVal;
    } else if (row.count === "0C") {
      ambientMoisture_grLb = numVal;
    } else if (row.count === "03") {
      mainCompRpm_pct = numVal;
    } else if (row.tag?.includes("Filter") && row.tag?.includes("dP")) {
      filterDp_inwc = numVal;
    }
  }

  return {
    ambientPressure_atm,
    ambientTemperature_F,
    ambientMoisture_grLb,
    mainCompRpm_pct,
    filterDp_inwc,
  };
}
