import React from 'react';
import img from "../assets/procesor.png";

const SH1B = () => {
  return (
    <div className="flex text-black">
      <div className='relative'>
        <img className="w-200 h-800" src={img} alt="" />
        <span className="text-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">SH1B</span>
      </div>
    </div>
  );
};

export default SH1B;
