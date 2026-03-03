// Controller metadata for dynamic navigation
export interface ControllerMetadata {
  name: string;
  backRoute: string;
  label: string;
}

export const CONTROLLER_METADATA: Record<string, ControllerMetadata> = {
  '1520-T-6622': {
    name: '1520-T-6622',
    backRoute: '/settings/controller-outputs/faceplates/controller-6622',
    label: '1520-T-6622 Temperature Controller',
  },
  '1540-T-4822': {
    name: '1540-T-4822',
    backRoute: '/settings/controller-outputs/faceplates/controller/1540-T-4822',
    label: '1540-T-4822 Temperature Controller',
  },
  '1540-T-5220': {
    name: '1540-T-5220',
    backRoute: '/settings/controller-outputs/faceplates/controller/1540-T-5220',
    label: '1540-T-5220 Temperature Controller',
  },
  '1540-T-5224': {
    name: '1540-T-5224',
    backRoute: '/settings/controller-outputs/faceplates/controller/1540-T-5224',
    label: '1540-T-5224 Temperature Controller',
  },
  '1540-T-7221': {
    name: '1540-T-7221',
    backRoute: '/settings/controller-outputs/faceplates/controller/1540-T-7221',
    label: '1540-T-7221 Temperature Controller',
  },
  '1540-T-7224': {
    name: '1540-T-7224',
    backRoute: '/settings/controller-outputs/faceplates/controller/1540-T-7224',
    label: '1540-T-7224 Temperature Controller',
  },
  '1530-F-2602': {
    name: '1530-F-2602',
    backRoute: '/sulfur-flow-controller',
    label: '1530-F-2602 Sulfur Flow Controller',
  },
  '1540-H-4030': {
    name: '1540-H-4030',
    backRoute: '/hand-controller-4030',
    label: '1540-H-4030 Main Compressor Hand Controller',
  },
  '1540-H-4282': {
    name: '1540-H-4282',
    backRoute: '/hand-controller-4282-jug',
    label: '1540-H-4282 Jug Valve Hand Controller',
  },
  '1540-H-4283': {
    name: '1540-H-4283',
    backRoute: '/hand-controller-4283-whb',
    label: '1540-H-4283 WHB Outlet dP Hand Controller',
  },
  '1510-PP-001': {
    name: '1510-PP-001',
    backRoute: '/sulfur-pump',
    label: '1510-PP-001/002 Sulfur Feed Pump',
  },
  '1540-HCV-4282': {
    name: '1540-HCV-4282',
    backRoute: '/jug-valve',
    label: '1540-HCV-4282 Jug Valve',
  },
  '1540-HCV-4281': {
    name: '1540-HCV-4281',
    backRoute: '/jug-valve-positioner',
    label: '1540-HCV-4281 Jug Valve Positioner',
  },
  '1540-TI-4200C': {
    name: '1540-TI-4200C',
    backRoute: '/temp-sensor/1540-TI-4200C',
    label: '1540-TI-4200C Temperature Sensor',
  },
  'default': {
    name: 'Controller',
    backRoute: '/settings/controller-outputs/faceplates/sulfur-flow-controller-main',
    label: 'Primary & Secondary Faceplates',
  },
};

export const getControllerMetadata = (controllerId: string): ControllerMetadata => {
  return CONTROLLER_METADATA[controllerId] || CONTROLLER_METADATA['default'];
};
