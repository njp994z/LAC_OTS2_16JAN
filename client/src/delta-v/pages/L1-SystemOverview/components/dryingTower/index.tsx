import React from 'react'
import towerImg from "../assets/tower.png";

const DryingTower = () => {
  return (
    <div className="flex flex-col space-y-2 text-black">
                <div className='relative'>
                    <img className="w-100 h-600" src={towerImg} alt="" />
                    <span className="text-center absolute top-1/2 left-1/2">DT</span>
                </div>
                <p className=" text-center text-lg self-end font-bold">
                    DRYING TOWER
                    <br />
                    1520-TW-001
                </p>
            </div>
  )
}

export default DryingTower