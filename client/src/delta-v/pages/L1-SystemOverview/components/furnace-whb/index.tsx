import React from 'react';
import img from "../assets/furnace-whb.png";

const FurnaceWhbt = () => {
  return (
    <div className="flex flex-col space-y-2 text-black w-[300px]">
      <div className='relative'>
        <img className="w-50 h-200" src={img} alt="" />
      </div>
    </div>
  );
};

export default FurnaceWhbt;
