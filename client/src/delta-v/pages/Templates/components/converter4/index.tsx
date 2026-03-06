import React from 'react';
import img from "../assets/converter.png";

const Converter4 = () => {
  return (
    <div className="flex text-black relative h-full w-full object-contain">
      <img className="min-w-200 min-h-600" src={img} alt="" />
      <span className="text-center absolute bottom-4 left-1/2 -translate-x-1/2">
        1540-RE-001
        <br />
        CONVERTER
      </span>
    </div>
  );
};

export default Converter4;
