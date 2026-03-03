import React from 'react';
import img from "../assets/filter.png";

const IndustrialFilter = () => {
  return (
    <div className="flex flex-col space-y-2 text-black">
      <p className="text-center font-bold">
        INLET AIR FILTER
        <br />
        1520-FL-001
      </p>
      <div>
        <img className="w-120 h-120" src={img} alt="" />
      </div>
    </div>
  );
};

export default IndustrialFilter;
