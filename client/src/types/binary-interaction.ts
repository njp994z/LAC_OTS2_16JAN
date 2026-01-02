export interface BinaryInteractionRow {
  id: number;
  component1: string;
  component2: string;
  source: string;
  tempUnit: string;
  AIJ: number | null;
  AJI: number | null;
  BIJ: number | null;
  BJI: number | null;
  CIJ: number | null;
  DIJ: number | null;
  EIJ: number | null;
  EJI: number | null;
  FIJ: number | null;
  FJI: number | null;
  TLOWER: number | null;
  TUPPER: number | null;
}

export const binaryParameterKeys = [
  'AIJ', 'AJI', 'BIJ', 'BJI', 'CIJ', 'DIJ', 'EIJ', 'EJI', 'FIJ', 'FJI', 'TLOWER', 'TUPPER'
] as const;

export type BinaryParameterKey = typeof binaryParameterKeys[number];

export const defaultBinaryInteractions: BinaryInteractionRow[] = [
  { 
    id: 1,
    component1: 'H2O', 
    component2: 'CO2', 
    source: 'APV140 EN', 
    tempUnit: 'K',
    AIJ: 10.064, 
    AJI: 10.064, 
    BIJ: -3268.14, 
    BJI: -3268.14, 
    CIJ: 0.2, 
    DIJ: 0, 
    EIJ: 0, 
    EJI: 0, 
    FIJ: 0, 
    FJI: 0, 
    TLOWER: 273.15, 
    TUPPER: 473.15 
  },
  { 
    id: 2,
    component1: 'SO3', 
    component2: 'H2SO4', 
    source: 'USER', 
    tempUnit: 'K',
    AIJ: 5.839146, 
    AJI: 0, 
    BIJ: -614.293, 
    BJI: 0, 
    CIJ: 0.2, 
    DIJ: 0, 
    EIJ: 0, 
    EJI: 0, 
    FIJ: 0, 
    FJI: 0, 
    TLOWER: 0, 
    TUPPER: 1000 
  },
];
