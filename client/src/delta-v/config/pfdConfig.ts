export interface PFDConfig {
  id: string;
  documentNumber: string;
  title: string;
  route: string;
}

export const pfdConfigs: PFDConfig[] = [
  {
    id: "5001",
    documentNumber: "1540-PR-PFD-0000-EXP-5001",
    title: "PROCESS GAS",
    route: "/delta-v/pfd/5001-process-gas",
  },
  {
    id: "5002",
    documentNumber: "1520-PR-PFD-0000-EXP-5002",
    title: "STRONG ACID",
    route: "/delta-v/pfd/5002-strong-acid",
  },
  {
    id: "5003",
    documentNumber: "1530-PR-PFD-0000-EXP-5003",
    title: "TAILGAS TREATMENT",
    route: "/delta-v/pfd/5003-tailgas-treatment",
  },
  {
    id: "5004",
    documentNumber: "1540-PR-PFD-0000-EXP-5004",
    title: "BFW AND STEAM",
    route: "/delta-v/pfd/5004-bfw-and-steam",
  },
  {
    id: "5005",
    documentNumber: "1520-PR-PFD-0000-EXP-5005",
    title: "COOLING WATER",
    route: "/delta-v/pfd/5005-cooling-water",
  },
  {
    id: "5010",
    documentNumber: "1570-PR-PFD-0000-EXP-5010",
    title: "PRODUCT ACID",
    route: "/delta-v/pfd/5010-product-acid",
  },
  {
    id: "5012",
    documentNumber: "1510-PR-PFD-0000-EXP-5012",
    title: "SULFUR",
    route: "/delta-v/pfd/5012-sulfur",
  },
  {
    id: "5014",
    documentNumber: "1520-PR-PFD-0000-EXP-5014",
    title: "FIN FAN COOLING SYSTEM",
    route: "/delta-v/pfd/5014-fin-fan-cooling-system",
  },
  {
    id: "5016",
    documentNumber: "1550-PR-PFD-0000-EXP-5016",
    title: "ACID PLANT COOLING TOWER",
    route: "/delta-v/pfd/5016-acid-plant-cooling-tower",
  },
  {
    id: "5018",
    documentNumber: "1560-PR-PFD-0000-EXP-5018",
    title: "WATER TREATMENT",
    route: "/delta-v/pfd/5018-water-treatment",
  },
  {
    id: "5020",
    documentNumber: "1560-PR-PFD-0000-EXP-5020",
    title: "LP AUX BOILER AND TURBINE",
    route: "/delta-v/pfd/5020-lp-aux-boiler-and-turbine",
  },
  {
    id: "5026",
    documentNumber: "1510-PR-PFD-0000-EXP-5026",
    title: "CAUSTIC UNLOADING AND STORAGE",
    route: "/delta-v/pfd/5026-caustic-unloading-and-storage",
  },
  {
    id: "5028",
    documentNumber: "1520-PR-PFD-0000-EXP-5028",
    title: "SCRUBBER EFFLUENT",
    route: "/delta-v/pfd/5028-scrubber-effluent",
  },
  {
    id: "5030",
    documentNumber: "1510-PR-PFD-0000-EXP-5030",
    title: "SULFUR VAPOR SCRUBBER",
    route: "/delta-v/pfd/5030-sulfur-vapor-scrubber",
  },
  {
    id: "5032",
    documentNumber: "1500-PR-PFD-0000-EXP-5032",
    title: "PROPANE",
    route: "/delta-v/pfd/5032-propane",
  },
];

export function getPFDById(id: string): PFDConfig | undefined {
  return pfdConfigs.find((pfd) => pfd.id === id);
}

export function getPFDByRoute(route: string): PFDConfig | undefined {
  return pfdConfigs.find((pfd) => pfd.route === route);
}
