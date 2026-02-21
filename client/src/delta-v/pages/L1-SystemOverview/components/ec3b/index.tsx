import React from 'react';
import img from "../assets/procesor.png";

const EC3B = () => {
  return (
    <div className="flex text-black">
      <div className='relative'>
        <img className="w-100 h-600" src={img} alt="" />
        <span className="text-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">EC3B</span>
      </div>
    </div>
  );
};

export default EC3B;
