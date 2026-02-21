import React from 'react';
import img from "../assets/converter.png";

const Converter4 = () => {
  return (
    <div className="flex relative text-black">
      <div className='relative'>
        <img className="w-200 h-600" src={img} alt="" />
        <span className="text-center absolute bottom-4 left-1/2 -translate-x-1/2">
        1540-RE-001
        <br />
        CONVERTER
        </span>
      </div>
    </div>
  );
};

export default Converter4;
