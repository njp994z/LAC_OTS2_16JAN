// Screen Configuration for Static Simulation Multi-Screen System
import { SimulationInputs, SimulationOutputs, runSimulation } from './sulfurSimulation';
import { ConverterInputs, ConverterOutputs, runConverterSimulation } from './converterSimulation';
import compressorImage from "@assets/image_1764697627500.png";
import converterImage from "@assets/02_Converter_1_1764193011044.png";
import l2SulfurBurnerImage from "@assets/image_1764698625505.png";

export type ScreenId = 'compressor' | 'l2-sulfur-burner' | 'converter';

export interface OverlayConfig {
  id: string;
  label: string;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  width: string;
  getValue: (outputs: any) => string;
  testId: string;
}

export type ControlType = 'slider' | 'faceplate';

export interface InputControlConfig {
  id: string;
  label: string;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  width: string;
  min: number;
  max: number;
  step: number;
  decimals: number;
  unit?: string;
  stateKey: string;
  testId: string;
  controlType?: ControlType;
  faceplateConfig?: {
    tagName: string;
    subtitle?: string;
    outputKey?: string;
    pvKey?: string;
  };
}

export interface OutputSectionConfig {
  value: string;
  label: string;
  testId: string;
  fields: Array<{
    label: string;
    getValue: (outputs: any) => string;
    testId: string;
  }>;
}

export interface ScreenConfig<TInputs, TOutputs> {
  id: ScreenId;
  title: string;
  image: string;
  imageAlt: string;
  defaultInputs: TInputs;
  inputControls: InputControlConfig[];
  overlays: OverlayConfig[];
  outputSections: OutputSectionConfig[];
  runSimulation: (inputs: TInputs) => TOutputs;
}

// Helper to format numbers consistently
const formatNumber = (value: number, decimals: number = 1): string => {
  return value.toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
};

// L3-1540 Sulfur Burner Overview Screen Configuration
export const compressorScreen: ScreenConfig<SimulationInputs, SimulationOutputs> = {
  id: 'compressor',
  title: 'L3-1540 Sulfur Burner Overview',
  image: compressorImage,
  imageAlt: '1540 Sulfur Furnace process flow diagram showing main compressor, sulfur furnace, startup burner, instrument air receiver, and waste heat exchangers',
  defaultInputs: {
    compressorRpm: 4770.98,
    sulfurFlowGpm: 75,
    compressorRunning: true,
  },
  inputControls: [
    {
      id: 'comp-rpm',
      label: 'Compressor RPM',
      position: { top: '5%', left: '4%' },
      width: '160px',
      min: 0,
      max: 6000,
      step: 10,
      decimals: 0,
      stateKey: 'compressorRpm',
      testId: 'button-compressor-rpm',
      controlType: 'faceplate',
      faceplateConfig: {
        tagName: 'HIC-1071',
        subtitle: 'Main Air Compressor Speed Controller',
        outputKey: 'o22_comp_electrical_power_mw',
        pvKey: 'o1_comp_rpm',
      },
    },
    {
      id: 'sulf-flow',
      label: 'Sulfur Flow',
      position: { bottom: '8%', left: '4%' },
      width: '160px',
      min: 0,
      max: 150,
      step: 1,
      decimals: 1,
      unit: 'GPM',
      stateKey: 'sulfurFlowGpm',
      testId: 'button-sulfur-flow',
      controlType: 'faceplate',
      faceplateConfig: {
        tagName: '1540FIC2602',
        subtitle: 'Sulfur Flow Controller',
        outputKey: 'o2_sulf_flow_gpm',
        pvKey: 'o2_sulf_flow_gpm',
      },
    },
  ],
  overlays: [
    {
      id: 'power-mw',
      label: 'Electrical Power (MW)',
      position: { top: '5%', right: 'calc(4% + 180px)' },
      width: '170px',
      getValue: (outputs: SimulationOutputs) => formatNumber(outputs.o22_comp_electrical_power_mw, 3),
      testId: 'text-overlay-power-mw',
    },
    {
      id: 'so2-percent',
      label: 'SO₂% to First Pass',
      position: { top: '5%', right: '4%' },
      width: '170px',
      getValue: (outputs: SimulationOutputs) => `${formatNumber(outputs.o15_so2pct * 100, 2)}%`,
      testId: 'text-overlay-so2-percent',
    },
    {
      id: 'furn-temp',
      label: 'Furnace Outlet Temp 1',
      position: { top: '17%', right: 'calc(4% + 180px)' },
      width: '170px',
      getValue: (outputs: SimulationOutputs) => `${formatNumber(outputs.o11_furn_outlet_temp_1, 1)} °F`,
      testId: 'text-overlay-furn-temp',
    },
    {
      id: 'acid-production',
      label: 'Acid Production (metric ton/day)',
      position: { top: '17%', right: '4%' },
      width: '170px',
      getValue: (outputs: SimulationOutputs) => formatNumber(outputs.o16_acid_production, 2),
      testId: 'text-overlay-acid-production',
    },
  ],
  outputSections: [
    {
      value: 'compressor',
      label: 'Compressor',
      testId: 'tab-compressor',
      fields: [
        { label: 'Status', getValue: (o: SimulationOutputs) => o.o18_comp_status, testId: 'text-comp-status' },
        { label: 'RPM', getValue: (o: SimulationOutputs) => formatNumber(o.o1_comp_rpm, 0), testId: 'text-comp-rpm' },
        { label: 'Inlet ACFM', getValue: (o: SimulationOutputs) => formatNumber(o.o3_comp_icfm, 1), testId: 'text-comp-icfm' },
        { label: 'Inlet Pressure (in wc)', getValue: (o: SimulationOutputs) => formatNumber(o.o4_comp_inlet_pressure, 1), testId: 'text-comp-inlet-pressure' },
        { label: 'SCFM', getValue: (o: SimulationOutputs) => formatNumber(o.o5_comp_scfm, 1), testId: 'text-comp-scfm' },
        { label: 'Mass Flow (lb/min)', getValue: (o: SimulationOutputs) => formatNumber(o.o6_comp_mass_flow, 1), testId: 'text-comp-mass-flow' },
        { label: 'Outlet Pressure (in wc)', getValue: (o: SimulationOutputs) => formatNumber(o.o7_comp_outlet_pressure, 1), testId: 'text-comp-outlet-pressure' },
        { label: 'Outlet Temp (°F)', getValue: (o: SimulationOutputs) => formatNumber(o.o8_comp_outlet_temp, 1), testId: 'text-comp-outlet-temp' },
        { label: 'Outlet ACFM', getValue: (o: SimulationOutputs) => formatNumber(o.o9_comp_outlet_acfm, 1), testId: 'text-comp-outlet-acfm' },
        { label: 'Electrical Power (HP)', getValue: (o: SimulationOutputs) => formatNumber(o.o21_comp_electrical_power_hp, 1), testId: 'text-comp-power-hp' },
        { label: 'Electrical Power (MW)', getValue: (o: SimulationOutputs) => formatNumber(o.o22_comp_electrical_power_mw, 3), testId: 'text-comp-power-mw' },
      ],
    },
    {
      value: 'furnace',
      label: 'Furnace',
      testId: 'tab-furnace',
      fields: [
        { label: 'Sulfur Flow (GPM)', getValue: (o: SimulationOutputs) => formatNumber(o.o2_sulf_flow_gpm, 1), testId: 'text-sulf-flow' },
        { label: 'Sulfur Flow (lb/min)', getValue: (o: SimulationOutputs) => formatNumber(o.o10_sulfur_flow_lbpermin, 1), testId: 'text-sulf-mass-flow' },
        { label: 'Sulfur Inlet Pressure (psig)', getValue: (o: SimulationOutputs) => formatNumber(o.o17_sulf_in_pressure, 1), testId: 'text-sulf-inlet-pressure' },
        { label: 'Outlet Temp 1 (°F)', getValue: (o: SimulationOutputs) => formatNumber(o.o11_furn_outlet_temp_1, 1), testId: 'text-furn-temp-1' },
        { label: 'Outlet Temp 2 (°F)', getValue: (o: SimulationOutputs) => formatNumber(o.o12_furn_out_temp_2, 1), testId: 'text-furn-temp-2' },
        { label: 'Outlet Temp 3 (°F)', getValue: (o: SimulationOutputs) => formatNumber(o.o13_furn_out_temp_3, 1), testId: 'text-furn-temp-3' },
        { label: 'Outlet SCFM', getValue: (o: SimulationOutputs) => formatNumber(o.o14_furnace_outlet_scfm, 1), testId: 'text-furn-scfm' },
        { label: 'Outlet Pressure (in wc)', getValue: (o: SimulationOutputs) => formatNumber(o.o19_furn_pres_out, 1), testId: 'text-furn-pressure' },
        { label: 'Outlet ACFM', getValue: (o: SimulationOutputs) => formatNumber(o.o20_furn_out_acfm, 1), testId: 'text-furn-acfm' },
      ],
    },
    {
      value: 'production',
      label: 'Production',
      testId: 'tab-production',
      fields: [
        { label: 'SO₂ % to First Pass', getValue: (o: SimulationOutputs) => `${formatNumber(o.o15_so2pct * 100, 2)}%`, testId: 'text-so2-percent' },
        { label: 'Acid Production (metric ton/day)', getValue: (o: SimulationOutputs) => formatNumber(o.o16_acid_production, 2), testId: 'text-acid-production' },
      ],
    },
  ],
  runSimulation,
};

// L2-1540 Sulfur Burner Overview Screen Configuration
export const l2SulfurBurnerScreen: ScreenConfig<SimulationInputs, SimulationOutputs> = {
  id: 'l2-sulfur-burner',
  title: 'L2-1540 Sulfur Burner Overview',
  image: l2SulfurBurnerImage,
  imageAlt: '1540 Sulfur Burner Overview showing sulfur pit, drying tower, sulfur furnace, waste heat boiler, and converter',
  defaultInputs: {
    compressorRpm: 4770.98,
    sulfurFlowGpm: 75,
    compressorRunning: true,
  },
  inputControls: [],
  overlays: [],
  outputSections: [
    {
      value: 'compressor',
      label: 'Compressor',
      testId: 'tab-compressor',
      fields: [
        { label: 'Compressor RPM', getValue: (o: SimulationOutputs) => formatNumber(o.o1_comp_rpm, 0), testId: 'text-comp-rpm' },
        { label: 'Inlet ACFM', getValue: (o: SimulationOutputs) => formatNumber(o.o3_comp_icfm, 0), testId: 'text-air-vol-flow' },
        { label: 'Electrical Power (MW)', getValue: (o: SimulationOutputs) => formatNumber(o.o22_comp_electrical_power_mw, 3), testId: 'text-comp-power-mw' },
      ],
    },
    {
      value: 'furnace',
      label: 'Furnace',
      testId: 'tab-furnace',
      fields: [
        { label: 'Sulfur Flow (GPM)', getValue: (o: SimulationOutputs) => formatNumber(o.o2_sulf_flow_gpm, 1), testId: 'text-sulf-flow' },
        { label: 'Outlet Temp 1 (°F)', getValue: (o: SimulationOutputs) => formatNumber(o.o11_furn_outlet_temp_1, 1), testId: 'text-furn-temp-1' },
        { label: 'SO₂ % to First Pass', getValue: (o: SimulationOutputs) => `${formatNumber(o.o15_so2pct * 100, 2)}%`, testId: 'text-so2-percent' },
      ],
    },
    {
      value: 'production',
      label: 'Production',
      testId: 'tab-production',
      fields: [
        { label: 'Acid Production (metric ton/day)', getValue: (o: SimulationOutputs) => formatNumber(o.o16_acid_production, 2), testId: 'text-acid-production' },
      ],
    },
  ],
  runSimulation,
};

// 1540 Converter Screen Configuration
export const converterScreen: ScreenConfig<ConverterInputs, ConverterOutputs> = {
  id: 'converter',
  title: '1540 Converter',
  image: converterImage,
  imageAlt: 'SO2 Converter Process Flow Diagram showing catalyst passes, heat exchangers, and conversion stages',
  defaultInputs: {
    pass2InletTemp: 780,
    pass3InletTemp: 775,
    pass4InletTemp: 770,
    jugValvePctOpen: 50,
    ipatGasInletTemp: 300,
    fatGasInletTemp: 295,
  },
  inputControls: [
    {
      id: 'jug-valve',
      label: 'Jug Valve, % Open',
      position: { top: '5%', left: '1.5%' },
      width: '115px',
      min: 0,
      max: 100,
      step: 1,
      decimals: 0,
      unit: '',
      stateKey: 'jugValvePctOpen',
      testId: 'slider-jug-valve',
    },
    {
      id: 'pass2-inlet',
      label: 'Pass 2 Inlet Temp',
      position: { top: '17%', left: '1.5%' },
      width: '115px',
      min: 700,
      max: 850,
      step: 5,
      decimals: 0,
      unit: '',
      stateKey: 'pass2InletTemp',
      testId: 'slider-pass2-inlet',
    },
    {
      id: 'pass3-inlet',
      label: 'Pass 3 Inlet Temp',
      position: { top: '29%', left: '1.5%' },
      width: '115px',
      min: 700,
      max: 850,
      step: 5,
      decimals: 0,
      unit: '',
      stateKey: 'pass3InletTemp',
      testId: 'slider-pass3-inlet',
    },
    {
      id: 'pass4-inlet',
      label: 'Pass 4 Inlet Temp',
      position: { top: '41%', left: '1.5%' },
      width: '115px',
      min: 700,
      max: 850,
      step: 5,
      decimals: 0,
      unit: '',
      stateKey: 'pass4InletTemp',
      testId: 'slider-pass4-inlet',
    },
    {
      id: 'ipat-inlet',
      label: 'IPAT Gas Inlet Temp',
      position: { top: '53%', left: '1.5%' },
      width: '115px',
      min: 250,
      max: 350,
      step: 5,
      decimals: 0,
      unit: '',
      stateKey: 'ipatGasInletTemp',
      testId: 'slider-ipat-inlet',
    },
    {
      id: 'fat-inlet',
      label: 'FAT Gas Inlet Temp',
      position: { top: '65%', left: '1.5%' },
      width: '115px',
      min: 250,
      max: 350,
      step: 5,
      decimals: 0,
      unit: '',
      stateKey: 'fatGasInletTemp',
      testId: 'slider-fat-inlet',
    },
  ],
  overlays: [
    {
      id: 'pass1-inlet-temp',
      label: 'Pass 1 Inlet Temperature',
      position: { top: '3%', right: '1.5%' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => formatNumber(outputs.pass1InletTemp, 0),
      testId: 'text-overlay-pass1-inlet',
    },
    {
      id: 'so2-conc-pass1',
      label: 'SO2 Concentration to Pass 1',
      position: { top: '9%', right: '1.5%' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => `${formatNumber(outputs.so2ConcPass1, 2)}%`,
      testId: 'text-overlay-so2-conc',
    },
    {
      id: 'pass1-outlet-temp',
      label: 'Pass 1 Outlet Temperature',
      position: { top: '15%', right: '1.5%' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => formatNumber(outputs.pass1OutletTemp, 0),
      testId: 'text-overlay-pass1-outlet',
    },
    {
      id: 'so2-ppm-stack',
      label: 'SO2 ppmv to Stack',
      position: { top: '21%', right: '1.5%' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => formatNumber(outputs.so2PpmToStack, 0),
      testId: 'text-overlay-so2-ppm',
    },
    {
      id: 'pass3-outlet-temp',
      label: 'Pass 3 Outlet Temperature',
      position: { top: '27%', right: '1.5%' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => formatNumber(outputs.pass3OutletTemp, 0),
      testId: 'text-overlay-pass3-outlet',
    },
    {
      id: 'steam-flow',
      label: 'Steam Flow ST Steam / ST Acid',
      position: { top: '33%', right: '1.5%' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => formatNumber(outputs.steamFlowStSteam, 2),
      testId: 'text-overlay-steam-flow',
    },
    {
      id: 'pass4-outlet-temp',
      label: 'Pass 4 Outlet Temperature',
      position: { top: '39%', right: '1.5%' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => formatNumber(outputs.pass4OutletTemp, 0),
      testId: 'text-overlay-pass4-outlet',
    },
    {
      id: 'acid-prod-mtpd',
      label: 'Acid Production MTPD',
      position: { top: '45%', right: '1.5%' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => formatNumber(outputs.acidProductionMtpd, 1),
      testId: 'text-overlay-acid-mtpd',
    },
    {
      id: 'blower-pressure',
      label: 'Blower Discharge Pressure',
      position: { top: '51%', right: '1.5%' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => formatNumber(outputs.blowerDischargePressure, 1),
      testId: 'text-overlay-blower-pressure',
    },
    {
      id: 'caustic-consumption',
      label: 'Caustic Consumption lb/min',
      position: { top: '57%', right: '1.5%' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => formatNumber(outputs.causticConsumptionLbMin, 2),
      testId: 'text-overlay-caustic',
    },
    {
      id: 'so2-conv-pass1',
      position: { bottom: '26%', right: '1.5%' },
      label: 'SO2 Conv. Pass 1',
      width: '130px',
      getValue: (outputs: ConverterOutputs) => `${formatNumber(outputs.so2ConvPass1, 1)}%`,
      testId: 'text-overlay-conv-pass1',
    },
    {
      id: 'total-power',
      label: 'Total Power MW',
      position: { bottom: '20%', right: '1.5%' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => formatNumber(outputs.totalPowerMw, 2),
      testId: 'text-overlay-total-power',
    },
    {
      id: 'so2-conv-pass2',
      label: 'SO2 Conv. Pass 2',
      position: { bottom: '14%', right: '1.5%' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => `${formatNumber(outputs.so2ConvPass2, 1)}%`,
      testId: 'text-overlay-conv-pass2',
    },
    {
      id: 'compressor-power',
      label: 'Compressor Power Consumption',
      position: { bottom: '8%', right: '1.5%' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => formatNumber(outputs.compressorPowerConsumption, 2),
      testId: 'text-overlay-comp-power',
    },
    {
      id: 'so2-conv-pass3',
      label: 'SO2 Conv. Pass 3',
      position: { bottom: '2%', right: '1.5%' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => `${formatNumber(outputs.so2ConvPass3, 1)}%`,
      testId: 'text-overlay-conv-pass3',
    },
    {
      id: 'so2-conv-pass4',
      label: 'SO2 Conv. Pass 4',
      position: { bottom: '2%', right: 'calc(1.5% + 140px)' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => `${formatNumber(outputs.so2ConvPass4, 1)}%`,
      testId: 'text-overlay-conv-pass4',
    },
    {
      id: 'overall-conversion',
      label: 'Overall SO2 Conversion',
      position: { bottom: '8%', right: 'calc(1.5% + 140px)' },
      width: '130px',
      getValue: (outputs: ConverterOutputs) => `${formatNumber(outputs.overallSo2Conversion, 2)}%`,
      testId: 'text-overlay-overall-conv',
    },
  ],
  outputSections: [
    {
      value: 'temperatures',
      label: 'Temperatures',
      testId: 'tab-temperatures',
      fields: [
        { label: 'Pass 1 Inlet Temp (°F)', getValue: (o: ConverterOutputs) => formatNumber(o.pass1InletTemp, 1), testId: 'text-pass1-inlet' },
        { label: 'Pass 1 Outlet Temp (°F)', getValue: (o: ConverterOutputs) => formatNumber(o.pass1OutletTemp, 1), testId: 'text-pass1-outlet' },
        { label: 'Pass 2 Outlet Temp (°F)', getValue: (o: ConverterOutputs) => formatNumber(o.pass2OutletTemp, 1), testId: 'text-pass2-outlet' },
        { label: 'Pass 3 Outlet Temp (°F)', getValue: (o: ConverterOutputs) => formatNumber(o.pass3OutletTemp, 1), testId: 'text-pass3-outlet' },
        { label: 'Pass 4 Outlet Temp (°F)', getValue: (o: ConverterOutputs) => formatNumber(o.pass4OutletTemp, 1), testId: 'text-pass4-outlet' },
      ],
    },
    {
      value: 'conversions',
      label: 'SO2 Conversions',
      testId: 'tab-conversions',
      fields: [
        { label: 'SO2 Conc. to Pass 1 (%)', getValue: (o: ConverterOutputs) => formatNumber(o.so2ConcPass1, 2), testId: 'text-so2-conc' },
        { label: 'SO2 ppm to Stack', getValue: (o: ConverterOutputs) => formatNumber(o.so2PpmToStack, 0), testId: 'text-so2-ppm' },
        { label: 'Pass 1 Conversion (%)', getValue: (o: ConverterOutputs) => formatNumber(o.so2ConvPass1, 1), testId: 'text-conv-pass1' },
        { label: 'Pass 2 Conversion (%)', getValue: (o: ConverterOutputs) => formatNumber(o.so2ConvPass2, 1), testId: 'text-conv-pass2' },
        { label: 'Pass 3 Conversion (%)', getValue: (o: ConverterOutputs) => formatNumber(o.so2ConvPass3, 1), testId: 'text-conv-pass3' },
        { label: 'Pass 4 Conversion (%)', getValue: (o: ConverterOutputs) => formatNumber(o.so2ConvPass4, 1), testId: 'text-conv-pass4' },
        { label: 'Overall SO2 Conversion (%)', getValue: (o: ConverterOutputs) => formatNumber(o.overallSo2Conversion, 2), testId: 'text-overall-conv' },
      ],
    },
    {
      value: 'production',
      label: 'Production & Utilities',
      testId: 'tab-production-util',
      fields: [
        { label: 'Acid Production (MTPD)', getValue: (o: ConverterOutputs) => formatNumber(o.acidProductionMtpd, 2), testId: 'text-acid-mtpd' },
        { label: 'Steam Flow (ST Steam/ST Acid)', getValue: (o: ConverterOutputs) => formatNumber(o.steamFlowStSteam, 2), testId: 'text-steam' },
        { label: 'Caustic Consumption (lb/min)', getValue: (o: ConverterOutputs) => formatNumber(o.causticConsumptionLbMin, 2), testId: 'text-caustic' },
        { label: 'Total Power (MW)', getValue: (o: ConverterOutputs) => formatNumber(o.totalPowerMw, 3), testId: 'text-total-power' },
        { label: 'Compressor Power (MW)', getValue: (o: ConverterOutputs) => formatNumber(o.compressorPowerConsumption, 3), testId: 'text-comp-power' },
        { label: 'Blower Discharge Pressure (in wc)', getValue: (o: ConverterOutputs) => formatNumber(o.blowerDischargePressure, 1), testId: 'text-blower-pressure' },
      ],
    },
  ],
  runSimulation: runConverterSimulation,
};

// Screen Registry
export const operatorScreens: Record<ScreenId, ScreenConfig<any, any>> = {
  compressor: compressorScreen,
  'l2-sulfur-burner': l2SulfurBurnerScreen,
  converter: converterScreen,
};
