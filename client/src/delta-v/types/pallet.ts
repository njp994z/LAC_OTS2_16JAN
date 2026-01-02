export interface PlacedIcon {
  id: string;
  type: 'controller' | 'sensor' | 'valve' | 'alarm' | 'drying-tower' | 'sulfur-furnace' | 'arrow-up' | 'arrow-down' | 'arrow-left' | 'arrow-right' | 'tag' | 'label';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  rotation?: number;
}

export type IconType = PlacedIcon['type'];

export interface ProcessDiagram {
  id: string;
  name: string;
  imagePath: string;
}
