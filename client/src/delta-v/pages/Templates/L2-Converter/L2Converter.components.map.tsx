import React from "react";
import Converter4 from "../components/converter4";

export enum L2ConverterElement {
  // Image Elements
  "Converter4" = "Converter4",
}

export const L2ConverterElements: string[] = [
  L2ConverterElement["Converter4"],
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
// Elements map
// ---------------------------------------------------------------------------
const L2ConverterElementsMap = () => {
  return {
    "Converter4": {
      tag: L2ConverterElement["Converter4"],
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

export default L2ConverterElementsMap;
