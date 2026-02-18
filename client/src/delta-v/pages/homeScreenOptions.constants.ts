import { HomeScreenLabels } from "@/rtkServices/layoutManagerServices/type";

export const homescreenOptions: Array<{ id: string, label: HomeScreenLabels }> = [
  { id: "L1", label: HomeScreenLabels.L1 },
  { id: "L2", label: HomeScreenLabels.L2 },
  { id: "L3", label: HomeScreenLabels.L3 },
  { id: "L4", label: HomeScreenLabels.L4 },
  // L2_1500 SULFUR UTILITY
  { id: "L2_1500_SULFUR_UTILITY", label: HomeScreenLabels.L2_1500_SULFUR_UTILITY },
  { id: "2.1", label: HomeScreenLabels._2_1 },
  { id: "2.2", label: HomeScreenLabels._2_2 },
  { id: "2.3", label: HomeScreenLabels._2_3 },
  { id: "2.4", label: HomeScreenLabels._2_4 },
  { id: "2.5", label: HomeScreenLabels._2_5 },
  // L2_1500 SULFUR TREATMENT
  { id: "L2_1500_SULFUR_TREATMENT", label: HomeScreenLabels.L2_1500_SULFUR_TREATMENT },
  { id: "3.1", label: HomeScreenLabels._3_1 },
  { id: "3.2", label: HomeScreenLabels._3_2 },
  { id: "3.3", label: HomeScreenLabels._3_3 },
  // L2_1520 ACID
  { id: "L2_1520_ACID", label: HomeScreenLabels.L2_1520_ACID },
  { id: "4.1", label: HomeScreenLabels._4_1 },
  { id: "4.2", label: HomeScreenLabels._4_2 },
  { id: "4.3", label: HomeScreenLabels._4_3 },
  { id: "4.4", label: HomeScreenLabels._4_4 },
  // L2_1540 SULFUR BURNER
  { id: "L2_1540_SULFUR_BURNER", label: HomeScreenLabels.L2_1540_SULFUR_BURNER },
  { id: "5.1", label: HomeScreenLabels._5_1 },
  { id: "5.2", label: HomeScreenLabels._5_2 },
  { id: "5.3", label: HomeScreenLabels._5_3 },
  // L2_1500 GAS
  { id: "L2_1500_GAS", label: HomeScreenLabels.L2_1500_GAS },
  { id: "6.1", label: HomeScreenLabels._6_1 },
  { id: "6.2", label: HomeScreenLabels._6_2 },
  { id: "6.3", label: HomeScreenLabels._6_3 },
  // L2_1560 TURBO GENERATOR
  { id: "L2_1560_TURBO_GENERATOR", label: HomeScreenLabels.L2_1560_TURBO_GENERATOR },
  { id: "7.1", label: HomeScreenLabels._7_1 },
  { id: "7.2", label: HomeScreenLabels._7_2 },
  { id: "7.3", label: HomeScreenLabels._7_3 },
  // L2_1500 PRODUCT ACID
  { id: "L2_1500_PRODUCT_ACID", label: HomeScreenLabels.L2_1500_PRODUCT_ACID },
  { id: "8.1", label: HomeScreenLabels._8_1 },
  { id: "8.2", label: HomeScreenLabels._8_2 },
  { id: "8.3", label: HomeScreenLabels._8_3 },
];


export enum ArrowColor {
  BLUE = 'blue',
  YELLOW = 'yellow',
  PURPLE = 'purple',
  GREEN = 'green',
  RED = 'red',
  ORANGE = 'orange',
  CYAN = 'cyan',
  MAGENTA = 'magenta',
  WHITE = 'white',
  BLACK = 'black',
}


export const defaultArrowPosition = [
  { id: 'arrow_1', x: 180, y: 280, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_2', x: 180, y: 360, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_3', x: 180, y: 440, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_4', x: 180, y: 520, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_5', x: 450, y: 280, width: 250, height: 60, rotation: 0, color: ArrowColor.YELLOW },
  { id: 'arrow_6', x: 450, y: 360, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_7', x: 450, y: 440, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_8', x: 450, y: 520, width: 250, height: 60, rotation: 0, color: ArrowColor.PURPLE },
  { id: 'arrow_9', x: 720, y: 280, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_10', x: 720, y: 360, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_11', x: 720, y: 440, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_12', x: 720, y: 520, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_13', x: 990, y: 280, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_14', x: 990, y: 360, width: 250, height: 60, rotation: 0, color: ArrowColor.PURPLE },
  { id: 'arrow_15', x: 1260, y: 280, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_16', x: 1260, y: 360, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_17', x: 1260, y: 440, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_18', x: 1260, y: 520, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_19', x: 1530, y: 280, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_20', x: 1530, y: 360, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_21', x: 1530, y: 440, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_22', x: 1530, y: 520, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_23', x: 1800, y: 280, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_24', x: 1800, y: 360, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_25', x: 1800, y: 440, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_26', x: 1800, y: 520, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_27', x: 2070, y: 280, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_28', x: 2070, y: 360, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_29', x: 2070, y: 440, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_30', x: 2070, y: 520, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_31', x: 2340, y: 280, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_32', x: 2340, y: 360, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_33', x: 2340, y: 440, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_34', x: 2340, y: 520, width: 250, height: 60, rotation: 0, color: ArrowColor.BLUE },
  { id: 'arrow_35', x: 2610, y: 280, width: 250, height: 60, rotation: 0, color: ArrowColor.PURPLE },
]

export enum element {
  DT = "Drying Tower (DT)",
  IF = "Industrial Filter",
  Furnace = "Furnace",

  EC3B = "EC3B",
  SH1B = "SH1B",
  CIP = "CIP",
  HIP = "HIP",
  IPAT = "IPAT",
  FAT = "Final Absorbing Tower",
  SH4A_EC4C_EC4A = "SH4A_EC4C_EC4A",

  FP = "FacePlates",
  JV = "Jug_Valve",
  JVP = "Jug_Valve_Positioner",

  Converter4 = "Converter 4",

}


export const defaultFilterPositions: Partial<Record<HomeScreenLabels, Array<{
  element: element;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
  borderColor?: string;
}>>> = {
  [HomeScreenLabels.L1]: [
    { element: element.IF, x: 180, y: 360, z: 0, width: 250, height: 60, rotation: 0 },
    { element: element.DT, x: 280, y: 360, z: 0, width: 250, height: 60, rotation: 0 },
    { element: element.Furnace, x: 780, y: 360, z: 0, width: 250, height: 60, rotation: 0 },
    { element: element.SH1B, x: 800, y: 360, z: 0, width: 250, height: 60, rotation: 0 },
    { element: element.Converter4, x: 1000, y: 270, z: 0, width: 150, height: 600, rotation: 0 },
    { element: element.CIP, x: 1450, y: 300, z: 0, width: 80, height: 100, rotation: 0 },
    { element: element.HIP, x: 1250, y: 360, z: 0, width: 80, height: 100, rotation: 0 },
    { element: element.SH4A_EC4C_EC4A, x: 1400, y: 180, z: 0, width: 250, height: 60, rotation: 0 },
    { element: element.FAT, x: 1600, y: 180, z: 0, width: 250, height: 200, rotation: 0 },
    { element: element.EC3B, x: 1400, y: 480, z: 0, width: 250, height: 200, rotation: 0 },
    { element: element.IPAT, x: 1600, y: 480, z: 0, width: 250, height: 200, rotation: 0 },
  ]
}

export const defaultArrowPositions: Partial<Record<HomeScreenLabels, Array<{
  id: string;
  x: number;
  y: number;
  // z: number;
  width: number;
  height: number;
  rotation: number;
  color: ArrowColor;
}>>> = {
  [HomeScreenLabels.L1]: [
    { id: 'arrow_1', x: 180, y: 300, width: 50, height: 60, rotation: 0, color: ArrowColor.BLACK },
    { id: 'arrow_2', x: 180, y: 350, width: 50, height: 60, rotation: 0, color: ArrowColor.BLACK },
    { id: 'arrow_3', x: 0, y: 400, width: 50, height: 60, rotation: 180, color: ArrowColor.BLACK },

    { id: 'arrow_4', x: 0, y: 300, width: 50, height: 60, rotation: 180, color: ArrowColor.RED },

    { id: 'arrow_5', x: 0, y: 350, width: 20, height: 60, rotation: 0, color: ArrowColor.BLUE },
    { id: 'arrow_6', x: 0, y: 350, width: 20, height: 60, rotation: 0, color: ArrowColor.BLUE },

    { id: 'arrow_7', x: 180, y: 300, width: 50, height: 60, rotation: 180, color: ArrowColor.RED },


  ]
}
