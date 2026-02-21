import React from 'react';
import img from "../assets/tower.png";

const IPAT = () => {
  return (
    <div className="flex text-black">
      <div>
        <img className="w-100 h-600" src={img} alt="" />
        <span className="text-center">IPAT</span>
      </div>
    </div>
  );
};

export default IPAT;
