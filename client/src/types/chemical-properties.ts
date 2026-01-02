export interface ChemicalPropertyRow {
  parameter: string;
  units: string;
  dataSet: number;
  SO2: number | null;
  SO3: number | null;
  O2: number | null;
  N2: number | null;
  CO2: number | null;
  H2O: number | null;
  H2SO4: number | null;
  S: number | null;
  H2S: number | null;
  H2: number | null;
  H3O: number | null;
  HSO4: number | null;
  SO4: number | null;
}

export const componentKeys = [
  'SO2', 'SO3', 'O2', 'N2', 'CO2', 'H2O', 'H2SO4', 'S', 'H2S', 'H2', 'H3O', 'HSO4', 'SO4'
] as const;

export type ComponentKey = typeof componentKeys[number];

export const defaultChemicalProperties: ChemicalPropertyRow[] = [
  { parameter: 'API', units: '', dataSet: 1, SO2: -28.2153, SO3: -57.29, O2: 340, N2: 340, CO2: 340, H2O: 10, H2SO4: -54.3114, S: -54.8196, H2S: 340, H2: 340, H3O: null, HSO4: -1, SO4: -2 },
  { parameter: 'CHARGE', units: '', dataSet: 1, SO2: 0, SO3: 0, O2: 0, N2: 0, CO2: 0, H2O: 0, H2SO4: 0, S: 0, H2S: 0, H2: 0, H3O: 0, HSO4: 0, SO4: 0 },
  { parameter: 'DCPLS', units: 'Btu/lbmol', dataSet: 1, SO2: 4.359176, SO3: null, O2: 2.135297, N2: 3.40556, CO2: 9.08288, H2O: 5.114957, H2SO4: 6.062984, S: null, H2S: null, H2: 1.646174, H3O: null, HSO4: null, SO4: null },
  { parameter: 'DGAQFM', units: 'Btu/lbmol', dataSet: 1, SO2: -129267, SO3: 7050.731, O2: null, N2: -165942, CO2: null, H2O: -320090, H2SO4: null, S: -11964.7, H2S: 7566.638, H2: -101947, H3O: -324983, HSO4: -320090, SO4: null },
  { parameter: 'DGAQHG', units: 'Btu/lbmol', dataSet: 1, SO2: -129564, SO3: null, O2: 7117.2, N2: 7824.6, CO2: -166050, H2O: null, H2SO4: null, S: null, H2S: -12011.4, H2: 7624.8, H3O: null, HSO4: -325134, SO4: -320274 },
  { parameter: 'DGFORM', units: 'Btu/lbmol', dataSet: 1, SO2: -129028, SO3: -159480, O2: 0, N2: 0, CO2: -169549, H2O: -98268.3, H2SO4: -280942, S: 101771.3, H2S: -14376.6, H2: 0, H3O: null, HSO4: null, SO4: null },
  { parameter: 'DGSFRM', units: 'Btu/lbmol', dataSet: 1, SO2: null, SO3: null, O2: null, N2: null, CO2: -101788, H2O: null, H2SO4: 0, S: null, H2S: null, H2: null, H3O: null, HSO4: null, SO4: null },
  { parameter: 'DHAQFM', units: 'Btu/lbmol', dataSet: 1, SO2: null, SO3: -5030.09, O2: null, N2: -177902, CO2: null, H2O: -390916, H2SO4: null, S: -17067.9, H2S: -1805.67, H2: -122885, H3O: -381488, HSO4: -390916, SO4: null },
  { parameter: 'DHAQHG', units: 'Btu/lbmol', dataSet: 1, SO2: -138949, SO3: null, O2: -5220, N2: -4491, CO2: -178020, H2O: null, H2SO4: null, S: null, H2S: -16201.8, H2: -1800, H3O: null, HSO4: -382500, SO4: -391320 },
  { parameter: 'DHFORM', units: 'Btu/lbmol', dataSet: 1, SO2: -127777, SO3: -170330, O2: 0, N2: 0, CO2: -169179, H2O: -103963, H2SO4: -316049, S: null, H2S: -8869.3, H2: 0, H3O: null, HSO4: null, SO4: null },
  { parameter: 'DHSFRM', units: 'Btu/lbmol', dataSet: 1, SO2: null, SO3: null, O2: null, N2: null, CO2: -125933, H2O: null, H2SO4: 0, S: null, H2S: null, H2: null, H3O: null, HSO4: null, SO4: null },
  { parameter: 'DHVLB', units: 'Btu/lbmol', dataSet: 1, SO2: 10894.2, SO3: 17508.13, O2: 2917.137, N2: 2393.942, CO2: 7037.962, H2O: 17495.14, H2SO4: null, S: 3874.437, H2S: 8049.871, H2: 385.445, H3O: null, HSO4: null, SO4: null },
  { parameter: 'FREEZEPT', units: 'F', dataSet: 1, SO2: -99.67, SO3: 62.24, O2: -361.82, N2: -346.002, CO2: -69.826, H2O: 32, H2SO4: 50.558, S: 239.378, H2S: -121.846, H2: null, H3O: -434.56, HSO4: null, SO4: null },
  { parameter: 'HCOM', units: 'Btu/lbmol', dataSet: 1, SO2: 0, SO3: 42529.66, O2: null, N2: null, CO2: 0, H2O: 0, H2SO4: 8426.483, S: -127618, H2S: -222700, H2: -103964, H3O: null, HSO4: null, SO4: null },
  { parameter: 'HFUS', units: 'Btu/lbmol', dataSet: 1, SO2: 3181.857, SO3: 3238.177, O2: 190.8856, N2: 309.5443, CO2: 3877.472, H2O: 2580.284, H2SO4: 4604.471, S: 742.4764, H2S: 1021.711, H2: 50.34394, H3O: null, HSO4: null, SO4: null },
  { parameter: 'IONRDL', units: 'Btu-ft/hr-s', dataSet: 1, SO2: null, SO3: null, O2: null, N2: null, CO2: null, H2O: null, H2SO4: null, S: null, H2S: null, H2: -0.08395, H3O: -0.07319, HSO4: 0.010764, SO4: null },
  { parameter: 'IONTYP', units: '', dataSet: 1, SO2: 0, SO3: null, O2: null, N2: null, CO2: null, H2O: null, H2SO4: 0, S: null, H2S: null, H2: null, H3O: null, HSO4: null, SO4: null },
  { parameter: 'MUP', units: '(Btu*cuft)', dataSet: 1, SO2: 9.44e-26, SO3: 0, O2: 0, N2: 0, CO2: 0, H2O: 1.07e-25, H2SO4: 1.58e-25, S: 0, H2S: 0, H2: 5.60e-26, H3O: null, HSO4: null, SO4: null },
  { parameter: 'MW', units: '', dataSet: 1, SO2: 64.0648, SO3: 80.0642, O2: 31.9988, N2: 28.01348, CO2: 44.0098, H2O: 18.01528, H2SO4: 98.07948, S: 32.066, H2S: 34.08188, H2: null, H3O: 19.02267, HSO4: 97.07209, SO4: 96.0647 },
  { parameter: 'OMEGA', units: '', dataSet: 1, SO2: 0.245381, SO3: 0.42396, O2: 0.02218, N2: 0.037722, CO2: 0.223621, H2O: 0.344861, H2SO4: 0.4666, S: 0.246346, H2S: 0.0941, H2: -0.21599, H3O: null, HSO4: null, SO4: null },
  { parameter: 'OMEGHG', units: 'Btu/lbmol', dataSet: 1, SO2: -44298, SO3: null, O2: -70974, N2: -62424, CO2: -3600, H2O: null, H2SO4: null, S: null, H2S: -18000, H2: -37620, H3O: null, HSO4: 211464, SO4: 566334 },
  { parameter: 'OMGPRS', units: '', dataSet: 1, SO2: 0.246, SO3: null, O2: 0.019, N2: 0.045, CO2: 0.231, H2O: 0.348, H2SO4: null, S: 0.1, H2S: null, H2: null, H3O: null, HSO4: null, SO4: null },
  { parameter: 'OMRKSS', units: '', dataSet: 1, SO2: null, SO3: null, O2: 0.019, N2: 0.045, CO2: 0.231, H2O: 0.348, H2SO4: null, S: null, H2S: null, H2: null, H3O: null, HSO4: null, SO4: null },
  { parameter: 'PC', units: 'psig', dataSet: 1, SO2: 1128.988, SO3: 1176.256, O2: 716.9217, N2: 478.6247, CO2: 1056.31, H2O: 3185.609, H2SO4: 913.7379, S: 2626.358, H2S: 1285.457, H2: 175.9309, H3O: null, HSO4: null, SO4: null },
  { parameter: 'PCPRS', units: 'psig', dataSet: 1, SO2: 1.13e+03, SO3: null, O2: 722.2881, N2: 4.78e+02, CO2: 1.06e+03, H2O: 3193.586, H2SO4: null, S: 1.29e+03, H2S: null, H2: 282.3886, H3O: null, HSO4: null, SO4: null },
  { parameter: 'PCRKSS', units: 'psig', dataSet: 1, SO2: 1128.829, SO3: null, O2: 722.2881, N2: 477.7545, CO2: 1055.295, H2O: null, H2SO4: null, S: 1291.851, H2S: 282.3886, H2: null, H3O: null, HSO4: null, SO4: null },
  { parameter: 'RGYR', units: 'ft', dataSet: 1, SO2: 5.45e-10, SO3: 7.18e-10, O2: 2.23e-10, N2: 1.79e-10, CO2: 3.41e-10, H2O: 2.02e-10, H2SO4: null, S: 0, H2S: 2.09e-10, H2: 1.22e-10, H3O: null, HSO4: null, SO4: null },
  { parameter: 'RKTZRA', units: '', dataSet: 1, SO2: 0.26603, SO3: 0.24835, O2: 0.28925, N2: 0.28997, CO2: 0.27256, H2O: 0.243172, H2SO4: 0.14799, S: 0.28135, H2S: 0.321, H2: null, H3O: null, HSO4: null, SO4: null },
  { parameter: 'S25HG', units: 'Btu/lbmol-', dataSet: 1, SO2: 38.7, SO3: null, O2: 26.04, N2: 22.9, CO2: 28.1, H2O: null, H2SO4: null, S: 30, H2S: 13.8, H2: null, H3O: null, HSO4: 30, SO4: 4.5 },
  { parameter: 'S025C', units: 'Btu/lbmol-', dataSet: 1, SO2: 38.66915, SO3: 26.48801, O2: null, N2: null, CO2: 28.08828, H2O: null, H2SO4: 4.800803, S: null, H2S: 28.90035, H2: 13.78141, H3O: 16.69772, HSO4: 31.47989, SO4: 4.800803 },
  { parameter: 'S02SE', units: 'Btu/lbmol-', dataSet: 1, SO2: 56.65496, SO3: null, O2: 48.99852, N2: 45.76502, CO2: 50.36959, H2O: null, H2SO4: 136.8659, S: null, H2S: 38.86883, H2: 31.21238, H3O: 55.71164, HSO4: 136.8659, SO4: 136.8659 },
  { parameter: 'SG', units: '', dataSet: 1, SO2: 1.37, SO3: 1.90675, O2: 0.3, N2: 0.3, CO2: 0.3, H2O: 1, H2SO4: 1.83317, S: 1.84532, H2S: 0.3, H2: 0.3, H3O: null, HSO4: null, SO4: null },
  { parameter: 'TB', units: 'F', dataSet: 1, SO2: 13.964, SO3: 112.55, O2: -297.332, N2: -320.451, CO2: -109.21, H2O: 212, H2SO4: 638.33, S: 832.4132, H2S: -76.63, H2: -422.968, H3O: null, HSO4: null, SO4: null },
  { parameter: 'TC', units: 'F', dataSet: 1, SO2: 315.68, SO3: 423.86, O2: -181.426, N2: -232.51, CO2: 87.908, H2O: 705.1028, H2SO4: 1205.33, S: 1903.73, H2S: 212.684, H2: -399.928, H3O: null, HSO4: null, SO4: null },
  { parameter: 'TCPRS', units: 'F', dataSet: 1, SO2: 315.68, SO3: null, O2: -181.084, N2: -232.6, CO2: 87.8, H2O: 705.56, H2SO4: null, S: 212.72, H2S: -381.19, H2: null, H3O: null, HSO4: null, SO4: null },
  { parameter: 'TCRKSS', units: 'F', dataSet: 1, SO2: 315.68, SO3: null, O2: -181.084, N2: null, CO2: -232.6, H2O: null, H2SO4: null, S: 212.72, H2S: -381.19, H2: null, H3O: null, HSO4: null, SO4: null },
  { parameter: 'TPT', units: 'F', dataSet: 1, SO2: -103.864, SO3: 62.24, O2: -361.82, N2: -346.002, CO2: -69.826, H2O: 32.018, H2SO4: 50.558, S: null, H2S: 239.378, H2: -121.846, H3O: null, HSO4: -434.56, SO4: null },
  { parameter: 'VB', units: 'cuft/lbmol', dataSet: 1, SO2: 0.701974, SO3: 0.709477, O2: 0.448877, N2: 0.555397, CO2: 0.560949, H2O: 0.301645, H2SO4: null, S: 0.318364, H2S: 0.574429, H2: 0.457617, H3O: null, HSO4: null, SO4: null },
  { parameter: 'VC', units: 'cuft/lbmol', dataSet: 1, SO2: 1.954253, SO3: 2.034345, O2: 1.175755, N2: 1.429007, CO2: 1.505736, H2O: 0.896188, H2SO4: 3.844431, S: 2.530917, H2S: 1.577819, H2: 1.027536, H3O: null, HSO4: null, SO4: null },
  { parameter: 'VLSTD', units: 'cuft/lbmol', dataSet: 1, SO2: 0.750946, SO3: 0.674304, O2: 0.857914, N2: 0.857914, CO2: 0.857914, H2O: 0.289133, H2SO4: null, S: 0.279046, H2S: 0.857914, H2: 0.857914, H3O: null, HSO4: null, SO4: null },
  { parameter: 'ZC', units: '', dataSet: 1, SO2: 0.269, SO3: 0.255, O2: 0.288, N2: 0.289, CO2: 0.274, H2O: 0.229, H2SO4: 0.2, S: 0.264, H2S: 0.284, H2: 0.305, H3O: null, HSO4: null, SO4: null },
];
