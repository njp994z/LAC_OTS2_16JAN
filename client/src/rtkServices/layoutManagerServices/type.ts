export enum HomeScreenLabels {
  L1 = "L1 – System Overview",
  L2 = "L2 – Furnace Area",
  L3 = "L3 – Compressor Area",
  L4 = "L4-Converter",
  L2_1500_SULFUR_UTILITY = "L2_1500 SULFUR UTILITY",
  _2_1 = "2.1 L3_1520 Fin Fan Coolers",
  _2_2 = "2.2 L3_1520 Fin Fan Expansion Tank",
  _2_3 = "2.3 L3_1550 AP Cooling Tower",
  _2_4 = "2.4 L3_1560 Water Distribution",
  _2_5 = "2.5 L3_1560 Water Treatment",
  L2_1500_SULFUR_TREATMENT = "L2_1500 SULFUR TREATMENT",
  _3_1 = "3.1 L3_1510 Sulfur Scrubber",
  _3_2 = "3.2 L3_1520 Effluent Storage",
  _3_3 = "3.3 L3_1530 Tail Gas Scrubber",
  L2_1520_ACID = "L2_1520 ACID",
  _4_1 = "4.1 L3_1520 Combination Pump Tank",
  _4_2 = "4.2 L3_1520 Final Absorbing Tower",
  _4_3 = "4.3 L3_1520 Interpass Heat Exchanger",
  _4_4 = "4.4 L3_1520 Interpass Tower",
  L2_1540_SULFUR_BURNER = "L2_1540 SULFUR BURNER",
  _5_1 = "5.1 L3_1510 Sulfur Storage",
  _5_2 = "5.2 L3_1540 Compressor",
  _5_3 = "5.3 L3_1540 Sulfur Furnace",
  L2_1500_GAS = "L2_1500 GAS",
  _6_1 = "6.1 L3_1540 Converter",
  _6_2 = "6.2 L3_1540 Deaerator",
  _6_3 = "6.3 L3_1540 Waste Heat Boiler",
  L2_1560_TURBO_GENERATOR = "L2_1560 TURBO GENERATOR",
  _7_1 = "7.1 L3_1560 Air Cooled Condenser",
  _7_2 = "7.2 L3_1560 Generator",
  _7_3 = "7.3 L3_1560 IP Aux Boiler",
  L2_1500_PRODUCT_ACID = "L2_1500 PRODUCT ACID",
  _8_1 = "8.1 L3_1520 Dilution Pump Tank",
  _8_2 = "8.2 L3_1570 Product Acid",
  _8_3 = "8.3 L3_1570 Startup Acid",
}

export interface FlowEdge {
    id: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    z?: number;
    color: string;
    hasPointer?: boolean;
    style?: 'solid' | 'dashed';
    from?: string;
    to?: string;
}

export interface DrawingEdge {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    z?: number;
}

export interface Position {
    x: number;
    y: number;
    z?: number;
    h?: number;
    w?: number;
}

export interface Layout {
    edges: FlowEdge[];
    positions: Record<string, Position>;
}
