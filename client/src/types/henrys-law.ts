export interface HenrysLawRow {
  id: number;
  component1: string;
  component2: string;
  source: string;
  tempUnit: string;
  propUnits: string;
  AIJ: number | null;
  BIJ: number | null;
  CIJ: number | null;
  DIJ: number | null;
  TLOWER: number | null;
  TUPPER: number | null;
  EIJ: number | null;
}

export const henrysLawParameterKeys = [
  'AIJ', 'BIJ', 'CIJ', 'DIJ', 'TLOWER', 'TUPPER', 'EIJ'
] as const;

export type HenrysLawParameterKey = typeof henrysLawParameterKeys[number];

export const defaultHenrysLawData: HenrysLawRow[] = [
  { id: 1, component1: 'SO2', component2: 'H2O', source: 'APV140 EN', tempUnit: 'F', propUnits: 'psi', AIJ: 80.27199, BIJ: -10041.8, CIJ: -8.76152, DIJ: 0, TLOWER: 31.73, TUPPER: 211.73, EIJ: 0 },
  { id: 2, component1: 'N2', component2: 'H2O', source: 'APV140 BI', tempUnit: 'F', propUnits: 'psi', AIJ: 180.34, BIJ: -15179, CIJ: -21.558, DIJ: -0.00469, TLOWER: 31.73, TUPPER: 163.13, EIJ: 0 },
  { id: 3, component1: 'O2', component2: 'H2O', source: 'APV140 BI', tempUnit: 'F', propUnits: 'psi', AIJ: 157.8962, BIJ: -13995.1, CIJ: -18.3974, DIJ: -0.00525, TLOWER: 33.53, TUPPER: 166.73, EIJ: 0 },
  { id: 4, component1: 'SO2', component2: 'SO3', source: 'USER', tempUnit: 'F', propUnits: 'psi', AIJ: 11, BIJ: 0, CIJ: 0, DIJ: 0, TLOWER: -459.67, TUPPER: 3140.33, EIJ: 0 },
  { id: 5, component1: 'N2', component2: 'SO3', source: 'USER', tempUnit: 'F', propUnits: 'psi', AIJ: 11, BIJ: 0, CIJ: 0, DIJ: 0, TLOWER: -459.67, TUPPER: 3140.33, EIJ: 0 },
  { id: 6, component1: 'O2', component2: 'SO3', source: 'USER', tempUnit: 'F', propUnits: 'psi', AIJ: 11, BIJ: 0, CIJ: 0, DIJ: 0, TLOWER: -459.67, TUPPER: 3140.33, EIJ: 0 },
  { id: 7, component1: 'CO2', component2: 'H2O', source: 'APV140 EN', tempUnit: 'F', propUnits: 'psi', AIJ: 174.7804, BIJ: -15259.9, CIJ: -21.9574, DIJ: 0.003212, TLOWER: 31.73, TUPPER: 440.33, EIJ: 0 },
  { id: 8, component1: 'CO2', component2: 'SO3', source: 'USER', tempUnit: 'F', propUnits: 'psi', AIJ: 11, BIJ: 0, CIJ: 0, DIJ: 0, TLOWER: -459.67, TUPPER: 3140.33, EIJ: 0 },
  { id: 9, component1: 'N2', component2: 'AR', source: 'USER', tempUnit: 'F', propUnits: 'psi', AIJ: 11, BIJ: 0, CIJ: 0, DIJ: 0, TLOWER: -459.67, TUPPER: 3140.33, EIJ: 0 },
  { id: 10, component1: 'O2', component2: 'AR', source: 'USER', tempUnit: 'F', propUnits: 'psi', AIJ: 11, BIJ: 0, CIJ: 0, DIJ: 0, TLOWER: -459.67, TUPPER: 3140.33, EIJ: 0 },
  { id: 11, component1: 'SO2', component2: 'AR', source: 'USER', tempUnit: 'F', propUnits: 'psi', AIJ: 11, BIJ: 0, CIJ: 0, DIJ: 0, TLOWER: -459.67, TUPPER: 3140.33, EIJ: 0 },
];
