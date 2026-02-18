import { Rnd } from "react-rnd";
import dt2Img from "@assets/delta-v/process-diagrams/dt2.png";
import furnaceWhbImg from "@assets/delta-v/icons/furnace-whb.png";
import blueArrowImg from "@assets/delta-v/icons/blue-arrow.png";
import jugValveImage from "@assets/delta-v/icons/jug-valve.png";
import jugValvePositionerImage from "@assets/delta-v/icons/jug-valve-positioner.png";
import converter4Img from "@assets/delta-v/process-diagrams/converter4.png";
import fat1Img from "@assets/delta-v/process-diagrams/final-absorbing-tower.png";
import ipat1Img from "@assets/delta-v/process-diagrams/ipat1.png";
import hip1Img from "@assets/delta-v/process-diagrams/hip1.png";
import cipImg from "@assets/delta-v/process-diagrams/cip.png";
import sh4aImg from "@assets/delta-v/process-diagrams/sh4a.png";
import ec3bImg from "@assets/delta-v/process-diagrams/ec3b.png";
import sh1bImg from "@assets/delta-v/process-diagrams/sh1b.png";
import industrialFilterImg from "@assets/delta-v/process-diagrams/industrial-filter.png";
import converter4L4Img from "@assets/image_1769028207381.png";
import converter4PassImg from "@assets/image_1769036205978.png";
import menuIconImg from "@assets/image_1767651932939.png";
import wasteHeatBoilerImg from "@assets/image_1769462283790.png";
import yellowHorizArrowImg from "@assets/image_1769462953963.png";
import cyanLongArrowImg from "@assets/image_1769463862442.png";
import cyanUpArrowImg from "@assets/image_1769463870663.png";
import cyanLeftArrowImg from "@assets/image_1769463876416.png";
import cyanLongLeftArrowImg from "@assets/image_1769463882873.png";
import cyanUpArrow2Img from "@assets/image_1769463889633.png";
import cyanUpArrow3Img from "@assets/image_1769466572930.png";
import cyanDownArrowImg from "@assets/image_1769469181228.png";
import metalTankImg from "@assets/image_1769466606997.png";
import grayYellowArrowImg from "@assets/image_1769466978719.png";
import cyanHorizArrow2Img from "@assets/image_1769466999516.png";
import grayArrowCyanLineImg from "@assets/image_1769467350102.png";
import cyanThinLine1Img from "@assets/image_1769467420791.png";
import cyanThinLine2Img from "@assets/image_1769467426528.png";
import cyanVertLine1Img from "@assets/image_1769467433951.png";
import cyanVertLine2Img from "@assets/image_1769467436693.png";
import blackVertLineImg from "@assets/image_1769482798195.png";
import { twMerge } from "tailwind-merge";

export enum element {
    DT = "Drying Tower (DT)",
    IF = "Industrial Filter",
    Furnace = "Furnace",

    EC3B = "EC3B",
    SH1B = "SH1B",
    CIP = "CIP",
    HIP = "HIP",
    IPAT = "IPAT",
    FAT = "Final Absorbing Tower",
    SH4A_EC4C_EC4A = "SH4A_EC4C_EC4A",

    FP = "FacePlates",
    JV = "Jug_Valve",
    JVP = "Jug_Valve_Positioner",

    Converter4 = "Converter 4",
    Converter4_L4 = "Converter 4 L4",
    Converter4_Pass = "Converter 4 Pass",

    WasteHeatBoiler = "Waste Heat Boiler",
    BlueArrow = "Blue Arrow",
    YellowHorizArrow = "Yellow Horizontal Arrow",
    CyanLongArrow = "Cyan Long Arrow",
    CyanUpArrow = "Cyan Up Arrow",
    CyanLeftArrow = "Cyan Left Arrow",
    CyanLongLeftArrow = "Cyan Long Left Arrow",
    CyanUpArrow2 = "Cyan Up Arrow 2",
    CyanUpArrow3 = "Cyan Up Arrow 3",
    CyanDownArrow = "Cyan Down Arrow",
    MetalTank = "Metal Tank",
    GrayYellowArrow = "Gray Yellow Arrow",
    CyanHorizArrow2 = "Cyan Horizontal Arrow 2",
    GrayArrowCyanLine = "Gray Arrow Cyan Line",
    CyanThinLine1 = "Cyan Thin Line 1",
    CyanThinLine2 = "Cyan Thin Line 2",
    CyanVertLine1 = "Cyan Vertical Line 1",
    CyanVertLine2 = "Cyan Vertical Line 2",
    BlackVertLine = "Black Vertical Line",
}

export interface Element {
    name: string;
    position: { x: number; y: number; };
    size: { width: number; height: number; };
    img: string;
    component: (isLocked: boolean, position: { x: number; y: number; }, size: { width: number; height: number; }, setPosition: (position: { x: number; y: number; }) => void, setSize: (size: { width: number; height: number; }) => void) => React.ReactNode;
}

const createRndElement = (name: string, img: string, minWidth = 60, minHeight = 150): Element => ({
    name,
    position: { x: 0, y: 0 },
    size: { width: 100, height: 50 },
    img,
    // type: "image",
    component: (isLocked: boolean, position: { x: number; y: number; }, size: { width: number; height: number; }, setPosition: (position: { x: number; y: number; }) => void, setSize: (size: { width: number; height: number; }) => void) => <div
        // position={position}
        // size={size}
        // // onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
        // onResizeStop={(e, dir, ref, delta, position) => {
        //     setSize({
        //         width: parseInt(ref.style.width),
        //         height: parseInt(ref.style.height)
        //     });
        //     // setPosition(position);
        // }}
        // minWidth={minWidth}
        // minHeight={minHeight}
        // bounds="parent"
        // disableDragging={isLocked}
        // enableResizing={!isLocked}
        // lockAspectRatio={true}
        className={twMerge("object-contain w-full h-full bg-transparent", isLocked ? "cursor-default" : "cursor-move")}
        style={{ zIndex: 20,
            minWidth,
            minHeight
         }}
    >
        <img
            src={img}
            alt={name}
            className="w-full h-full object-contain"
            draggable={false}
        />
    </div>
});

export const ELEMENTS = {
    [element.DT]: createRndElement(element.DT, dt2Img),
    [element.Furnace]: createRndElement(element.Furnace, furnaceWhbImg),
    [element.IF]: createRndElement(element.IF, industrialFilterImg),
    [element.EC3B]: createRndElement(element.EC3B, ec3bImg),
    [element.SH1B]: createRndElement(element.SH1B, sh1bImg),
    [element.CIP]: createRndElement(element.CIP, cipImg),
    [element.HIP]: createRndElement(element.HIP, hip1Img),
    [element.IPAT]: createRndElement(element.IPAT, ipat1Img),
    [element.FAT]: createRndElement(element.FAT, fat1Img),
    [element.SH4A_EC4C_EC4A]: createRndElement(element.SH4A_EC4C_EC4A, sh4aImg),
    [element.FP]: createRndElement(element.FP, menuIconImg),
    [element.JV]: createRndElement(element.JV, jugValveImage),
    [element.JVP]: createRndElement(element.JVP, jugValvePositionerImage),
    [element.Converter4]: createRndElement(element.Converter4, converter4Img),
    [element.Converter4_L4]: createRndElement(element.Converter4_L4, converter4L4Img),
    [element.Converter4_Pass]: createRndElement(element.Converter4_Pass, converter4PassImg),
    [element.WasteHeatBoiler]: createRndElement(element.WasteHeatBoiler, wasteHeatBoilerImg),
    [element.BlueArrow]: createRndElement(element.BlueArrow, blueArrowImg),
    [element.YellowHorizArrow]: createRndElement(element.YellowHorizArrow, yellowHorizArrowImg),
    [element.CyanLongArrow]: createRndElement(element.CyanLongArrow, cyanLongArrowImg),
    [element.CyanUpArrow]: createRndElement(element.CyanUpArrow, cyanUpArrowImg),
    [element.CyanLeftArrow]: createRndElement(element.CyanLeftArrow, cyanLeftArrowImg),
    [element.CyanLongLeftArrow]: createRndElement(element.CyanLongLeftArrow, cyanLongLeftArrowImg),
    [element.CyanUpArrow2]: createRndElement(element.CyanUpArrow2, cyanUpArrow2Img),
    [element.CyanUpArrow3]: createRndElement(element.CyanUpArrow3, cyanUpArrow3Img),
    [element.CyanDownArrow]: createRndElement(element.CyanDownArrow, cyanDownArrowImg),
    [element.MetalTank]: createRndElement(element.MetalTank, metalTankImg),
    [element.GrayYellowArrow]: createRndElement(element.GrayYellowArrow, grayYellowArrowImg),
    [element.CyanHorizArrow2]: createRndElement(element.CyanHorizArrow2, cyanHorizArrow2Img),
    [element.GrayArrowCyanLine]: createRndElement(element.GrayArrowCyanLine, grayArrowCyanLineImg),
    [element.CyanThinLine1]: createRndElement(element.CyanThinLine1, cyanThinLine1Img),
    [element.CyanThinLine2]: createRndElement(element.CyanThinLine2, cyanThinLine2Img),
    [element.CyanVertLine1]: createRndElement(element.CyanVertLine1, cyanVertLine1Img),
    [element.CyanVertLine2]: createRndElement(element.CyanVertLine2, cyanVertLine2Img),
    [element.BlackVertLine]: createRndElement(element.BlackVertLine, blackVertLineImg),
};