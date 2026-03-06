import React, { useState, useRef, useEffect } from "react";
import L2ConverterElementsMap, {
  BlockType,
  ElementType,
  L2ConverterElement,
  L2ConverterElements,
} from "./L2Converter.components.map";

export enum Mode {
  View = "view",
  Edit = "edit",
}

const L2Converter = () => {
  return (
    <div className="w-full h-screen flex flex-col pt-10 relative">
      <div className="flex-1 overflow-auto bg-gray-50">
        <div
          className="relative"
          style={{
            width: "5200px",
            height: "3000px",
            minWidth: "5200px",
            minHeight: "3000px",
          }}
        >
          {/* L2 Converter Canvas */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <p className="text-2xl font-semibold">L2 – Converter</p>
              <p className="text-sm mt-2">Canvas – Add elements here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default L2Converter;
