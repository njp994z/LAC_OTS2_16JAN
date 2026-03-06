import React from "react";
import Converter4 from "../components/converter4";

export enum L2AcidElement {
  // Image Elements
  "Converter4" = "Converter4",
}

export const L2AcidElements: string[] = [
  L2AcidElement["Converter4"],
];

export enum ElementType {
  Image,
  Text,
  TemparatureSensor,
  TemperatureController,
  PressureSensor,
}

export enum BlockType {
  Image = "image",
  Text = "text",
  Controller = "controller",
  Sensor = "sensor",
}

// ---------------------------------------------------------------------------
// Elements map (no hooks needed for image-only elements)
// ---------------------------------------------------------------------------
const L2AcidElementsMap = () => {
  return {
    "Converter4": {
      tag: L2AcidElement["Converter4"],
      description: "4-Pass Catalytic Converter",
      type: ElementType.Image,
      blockType: BlockType.Image,
      component: <Converter4 />,
    },
  } as Record<string, {
    tag: string;
    description: string;
    type: ElementType;
    blockType: BlockType;
    component: React.ReactNode;
  }>;
};

export default L2AcidElementsMap;
