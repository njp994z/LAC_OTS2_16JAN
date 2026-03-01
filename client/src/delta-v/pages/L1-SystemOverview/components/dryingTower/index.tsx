import React from 'react'
import towerImg from "../assets/tower.png";

const DryingTower = () => {
  return (
    <div className="flex text-black relative h-full w-full object-contain">
      <img className="min-w-100 min-h-600" src={towerImg} alt="" />
      <span className="text-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">DT</span>
    </div>
  )
}

export default DryingTower