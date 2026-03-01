import React, { useState, useRef, useEffect } from "react";
import { useControllerConfig } from "@/delta-v/contexts/ControllerConfigContext";
import L1SystemElementsMap, { ElementType, L1SystemElements } from "./components";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent,
    ContextMenuCheckboxItem,
} from "@/components/ui/context-menu";
import { useGetLayoutByIdQuery, useUpdateLayoutMutation } from "@/rtkServices/layoutManagerServices";
import { useCompressor } from "@/delta-v/contexts/CompressorContext";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FlowEdge, DrawingEdge } from "@/rtkServices/layoutManagerServices/type";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogHeader,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { TempSensorSecondaryFaceplate } from "@/delta-v/components/faceplate/TempSensorSecondaryFaceplate";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useLocation } from "wouter";
import { defaultPositionL1 } from "./defalutPosition.constant";

const customColors = [
    { id: "light-blue", label: "Light Blue", fill: "rgb(130,204,237)" },
    { id: "yellow", label: "Yellow", fill: "rgb(252,253,1)" },
    { id: "light-green", label: "Light Green", fill: "rgb(142,217,115)" },
    { id: "orange", label: "Orange", fill: "rgb(192,79,21)" },
    { id: "gray-gradient", label: "Gray Gradient", fill: "rgb(133,132,130)" }
];

type TempSensor = {
    id: string;
    data: any;
    config: any;
}

export enum Mode {
    Static = 'static',
    View = 'view',
    Edit = 'edit'
}

const L1SystemOverview = ({
    defaultMode = Mode.Static
}: {
    defaultMode?: Mode;
}) => {
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [tempSensor, setTempSensor] = useState<TempSensor | null>(null);
    const [mode, setMode] = useState<Mode>(defaultMode);
    const [editMode, setEditMode] = useState<'components' | 'edges'>('components');
    const {
        data: layoutData,
        isLoading,
        isUninitialized
    } = useGetLayoutByIdQuery("L1");

    const [updateLayout, { isLoading: isUpdatingLayout }] = useUpdateLayoutMutation();

    const { getControllerConfig } = useControllerConfig();
    const compressor1540GB001 = useCompressor();

    const L1Elements = L1SystemElementsMap(getControllerConfig, false, compressor1540GB001);

    const canvasRef = useRef<HTMLDivElement>(null);
    const [positions, setPositions] = useState<Record<string, { x: number, y: number, z?: number, h?: number, w?: number }>>({});
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const [edges, setEdges] = useState<FlowEdge[]>([]);
    const [drawingEdge, setDrawingEdge] = useState<DrawingEdge | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<number | null>(null);


    // Instead of global edgeCounter which can reset on HMR, use a ref
    const edgeCounterRef = useRef<number>(1);

    // Track shift key state for straight-line drawing
    const isShiftHeldRef = useRef<boolean>(false);

    // Track resize state for components
    const resizingRef = useRef<{ id: string; startX: number; startY: number; startW: number; startH: number; handle: string } | null>(null);

    const onMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Track shift key
        isShiftHeldRef.current = e.shiftKey;

        if (draggingId) {
            setPositions((prev) => ({
                ...prev,
                [draggingId]: {
                    ...prev[draggingId],
                    x: x - 60,
                    y: y - 40
                }
            }));
        }

        // Handle resize
        if (resizingRef.current) {
            const { id, startX, startY, startW, startH, handle } = resizingRef.current;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            setPositions((prev) => {
                const cur = prev[id] || { x: 0, y: 0 };
                let newW = startW;
                let newH = startH;
                if (handle.includes('e')) newW = Math.max(40, startW + dx);
                if (handle.includes('w')) newW = Math.max(40, startW - dx);
                if (handle.includes('s')) newH = Math.max(40, startH + dy);
                if (handle.includes('n')) newH = Math.max(40, startH - dy);
                return { ...prev, [id]: { ...cur, w: newW, h: newH } };
            });
            return;
        }

        if (drawingEdge) {
            let x2 = x;
            let y2 = y;
            // Snap to straight line when shift held
            if (e.shiftKey) {
                const dx = Math.abs(x - drawingEdge.x1);
                const dy = Math.abs(y - drawingEdge.y1);
                if (dx >= dy) {
                    y2 = drawingEdge.y1; // horizontal
                } else {
                    x2 = drawingEdge.x1; // vertical
                }
            }
            setDrawingEdge((prev) => (prev ? { ...prev, x2, y2 } : null));
        }
    };

    const onMouseUp = () => {
        if (drawingEdge) {
            const dist = Math.hypot(drawingEdge.x2 - drawingEdge.x1, drawingEdge.y2 - drawingEdge.y1);
            if (dist > 5) {
                setEdges((prev) => [
                    ...prev,
                    { ...drawingEdge, id: edgeCounterRef.current++, color: customColors[0].id, hasPointer: true },
                ]);
            }
            setDrawingEdge(null);
        }
        setDraggingId(null);
        resizingRef.current = null;
    };

    useEffect(() => {
        window.addEventListener("mouseup", onMouseUp);
        return () => window.removeEventListener("mouseup", onMouseUp);
    }, [drawingEdge]);

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (mode !== Mode.Edit || editMode !== 'edges') return;
        if (e.button !== 0) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setDrawingEdge({ x1: x, y1: y, x2: x, y2: y });
    };

    // const orthogonalPath = (x1: number, y1: number, x2: number, y2: number) => {
    //     const midX = (x1 + x2) / 2;
    //     return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    // };

    const orthogonalPath = (x1: number, y1: number, x2: number, y2: number) => {
        if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) {
            const midX = (x1 + x2) / 2;
            return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
        } else {
            const midY = (y1 + y2) / 2;
            return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
        }
    };
    const getEdgeMidpoint = (edge: FlowEdge | DrawingEdge) => ({
        x: (edge.x1 + edge.x2) / 2,
        y: (edge.y1 + edge.y2) / 2,
    });

    const startEdgeFromHandle = (x: number, y: number) => {
        setDrawingEdge({ x1: x, y1: y, x2: x, y2: y });
    };

    const changeEdgeColor = (id: number, color: string) => {
        setEdges((prev) =>
            prev.map((e) =>
                e.id === id ? { ...e, color } : e
            )
        );
    };

    const changeEdgeZ = (id: number, z: number) => {
        setEdges((prev) =>
            prev.map((e) =>
                e.id === id ? { ...e, z } : e
            )
        );
    };

    const changeComponentZ = (id: string, z: number) => {
        setPositions((prev) => ({
            ...prev,
            [id]: { ...prev[id], z }
        }));
    };

    const toggleEdgePointer = (id: number) => {
        setEdges((prev) =>
            prev.map((e) =>
                e.id === id ? { ...e, hasPointer: e.hasPointer === undefined ? false : !e.hasPointer } : e
            )
        );
    };

    const deleteEdge = (id: number) => {
        setEdges((prev) => prev.filter((e) => e.id !== id));
    };

    const cancelDeleteEdge = (id: number) => {
        setEdges((prev) => prev.filter((e) => e.id !== id));
    };

    const handleSave = () => {
        const layout = { positions, edges };
        updateLayout({ id: "L1", layout }).unwrap().then(() => {
            toast({ title: "Success", description: "Layout saved successfully" });
            setMode(Mode.View);
        });
    };

    const handleLoad = () => {
        if (layoutData) {
            setPositions(layoutData.positions);
            setEdges(layoutData.edges);
            // Fix 1: Seed edge counter from max existing ID to avoid duplicate IDs on next save/load
            if (layoutData.edges && layoutData.edges.length > 0) {
                const maxId = Math.max(...layoutData.edges.map((e) => e.id));
                edgeCounterRef.current = maxId + 1;
            }
        }
    };

    useEffect(() => {
        handleLoad();
        if (!layoutData && !isLoading && !isUninitialized) {
            updateLayout({ id: "L1", layout: defaultPositionL1 }).unwrap()
        }
    }, [layoutData, isLoading, isUninitialized]);

    const getColorFill = (colorId: string) => {
        const c = customColors.find(c => c.id === colorId);
        return c ? c.fill : customColors[0].fill;
    };

    const setEdgeStyle = (id: number, style: 'solid' | 'dashed') => {
        setEdges((prev) =>
            prev.map((e) =>
                e.id === id ? { ...e, style } : e
            )
        );
    };

    function handleStopPropagation(e: React.MouseEvent, callback: () => void) {
        e.stopPropagation();
        callback();
    }

    // Fix 3: SVG <g> ignores CSS zIndex — sort by z so higher-z edges paint last (on top)
    const sortedEdges = [...edges].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

    const renderEdges = () => (
        sortedEdges.map((edge, index) => {
            const mid = getEdgeMidpoint(edge);

            return (
                <ContextMenu key={edge.id}>
                    <ContextMenuTrigger asChild>
                        <g style={{ zIndex: edge?.z ?? 10 }} id={`edge-${edge.id}-${index}`}>
                            <path
                                d={orthogonalPath(edge.x1, edge.y1, edge.x2, edge.y2)}
                                fill="none"
                                stroke="transparent"
                                strokeWidth="20"
                                className="cursor-pointer"
                                onClick={(e) => handleStopPropagation(e, () => setSelectedEdge(edge.id))}
                                onMouseDown={(e) => e.stopPropagation()}
                            />
                            <path
                                d={orthogonalPath(edge.x1, edge.y1, edge.x2, edge.y2)}
                                fill="none"
                                stroke={getColorFill(edge.color)}
                                strokeWidth={edge.style === 'dashed' ? "3" : "6"}
                                strokeDasharray={edge.style === 'dashed' ? "12 8" : undefined}
                                filter={edge.style === 'dashed' ? undefined : "url(#black-outline)"}
                                markerEnd={edge.hasPointer !== false ? `url(#arrow-${edge.color})` : undefined}
                                className="pointer-events-none transition-all duration-300 ease-in-out"
                            />
                            <circle
                                cx={mid.x}
                                cy={mid.y}
                                r={6}
                                className="cursor-crosshair fill-transparent hover:fill-blue-500"
                                onMouseDown={(e) => {
                                    if (mode === Mode.Edit && editMode === 'edges') {
                                        e.stopPropagation();
                                        startEdgeFromHandle(mid.x, mid.y);
                                    }
                                }}
                            />
                        </g>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ContextMenuSub>
                            <ContextMenuSubTrigger>Edge Color</ContextMenuSubTrigger>
                            <ContextMenuSubContent>
                                {customColors.map((c) => (
                                    <ContextMenuItem key={c.id} onClick={(e) => handleStopPropagation(e, () => changeEdgeColor(edge.id, c.id))}>
                                        <div style={{ background: c.fill }} className="w-4 h-4 rounded-full mr-2 border border-black/20" />
                                        {c.label}
                                    </ContextMenuItem>
                                ))}
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                        <ContextMenuItem>
                            <div className="flex items-center gap-2">
                                <p>Edge Z</p>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 rounded-full aspect-square bg-blue-500 text-white active:bg-blue-600" onClick={(e) => handleStopPropagation(e, () => changeEdgeZ(edge.id, (edge?.z || 0) + 1))}>+</button>
                                    <span className="min-w-[2rem] text-center font-mono font-bold text-sm border border-gray-300 rounded px-1 bg-gray-50 text-black">{edge?.z ?? 0}</span>
                                    <button className="p-2 rounded-full aspect-square bg-blue-500 text-white active:bg-blue-600" onClick={(e) => handleStopPropagation(e, () => changeEdgeZ(edge.id, (edge?.z || 0) - 1))}>-</button>
                                </div>
                            </div>
                        </ContextMenuItem>
                        <ContextMenuSub>
                            <ContextMenuSubTrigger>Edge Style</ContextMenuSubTrigger>
                            <ContextMenuSubContent>
                                <ContextMenuItem onClick={(e) => handleStopPropagation(e, () => setEdgeStyle(edge.id, 'solid'))}>
                                    Solid Line
                                </ContextMenuItem>
                                <ContextMenuItem onClick={(e) => handleStopPropagation(e, () => setEdgeStyle(edge.id, 'dashed'))}>
                                    Dashed Line
                                </ContextMenuItem>
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                        <ContextMenuCheckboxItem
                            checked={edge.hasPointer !== false}
                            onCheckedChange={() => toggleEdgePointer(edge.id)}
                        >
                            Show Arrow Pointer
                        </ContextMenuCheckboxItem>
                        <ContextMenuSub>
                            <ContextMenuSubTrigger>
                                <Trash2 />
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent>
                                <ContextMenuItem onClick={(e) => handleStopPropagation(e, () => deleteEdge(edge.id))}>
                                    Confirm Delete
                                </ContextMenuItem>
                                <ContextMenuItem onClick={(e) => handleStopPropagation(e, () => cancelDeleteEdge(edge.id))}>
                                    Cancel Delete
                                </ContextMenuItem>
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                    </ContextMenuContent>
                </ContextMenu>
            );
        })
    );

    const handleEdit = () => {
        setMode(Mode.Edit);
    };

    return (
        <>
            <div className="w-full h-screen flex flex-col pt-10">
                {mode !== Mode.Static && <div className="w-full flex justify-between items-center h-fit max-h-[70px] px-4 py-2 border-b bg-white shadow-sm">
                    {mode === Mode.Edit ? (
                        <div className="flex gap-4 items-center">
                            <span className="text-sm font-semibold text-gray-700">Editing:</span>
                            <div className="flex border border-gray-300 rounded overflow-hidden shadow-sm">
                                <button
                                    className={`px-4 py-1.5 text-sm transition-colors ${editMode === 'components' ? 'bg-blue-600 text-white font-medium' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                    onClick={() => setEditMode('components')}
                                >
                                    Components
                                </button>
                                <button
                                    className={`px-4 py-1.5 text-sm transition-colors ${editMode === 'edges' ? 'bg-blue-600 text-white font-medium' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                    onClick={() => setEditMode('edges')}
                                >
                                    Edges
                                </button>
                            </div>
                        </div>
                    ) : <div />}
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-medium transition-colors"
                        onClick={mode === Mode.Edit ? handleSave : handleEdit}
                    >
                        {isLoading ? 'Saving...' : mode === Mode.Edit ? 'Save Layout' : 'Edit Layout'}
                    </button>
                </div>}
                <div className="flex-1 overflow-auto bg-gray-50">
                    <div
                        ref={canvasRef}
                        className="relative"
                        style={{ width: '5200px', height: '3000px', minWidth: '5200px', minHeight: '3000px' }}
                        onMouseMove={onMouseMove}
                        onMouseDown={handleCanvasMouseDown}
                    >
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                            <defs>
                                <linearGradient id="gray-gradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="rgb(133,132,130)" />
                                    <stop offset="100%" stopColor="rgb(193,193,193)" />
                                </linearGradient>
                                <filter id="black-outline" filterUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
                                    <feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="dilated" />
                                    <feFlood floodColor="black" result="blackColor" />
                                    <feComposite in="blackColor" in2="dilated" operator="in" result="blackOutline" />
                                    <feMerge>
                                        <feMergeNode in="blackOutline" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                {customColors.map((color) => (
                                    <marker
                                        key={color.id}
                                        id={`arrow-${color.id}`}
                                        markerWidth="32"
                                        markerHeight="32"
                                        refX="10"
                                        refY="16"
                                        orient="auto-start-reverse"
                                        markerUnits="userSpaceOnUse"
                                    >
                                        <path d="M 4 4 L 28 16 L 4 28 Z" fill={color.fill} stroke="black" strokeWidth="2.5" strokeLinejoin="miter" />
                                    </marker>
                                ))}
                            </defs>
                            <g className="pointer-events-auto group">{renderEdges()}</g>

                            {drawingEdge && (
                                <path
                                    d={isShiftHeldRef.current
                                        ? `M ${drawingEdge.x1} ${drawingEdge.y1} L ${drawingEdge.x2} ${drawingEdge.y2}`
                                        : orthogonalPath(drawingEdge.x1, drawingEdge.y1, drawingEdge.x2, drawingEdge.y2)}
                                    stroke="gray"
                                    strokeDasharray="5 5"
                                    fill="none"
                                />
                            )}
                        </svg>

                        {
                            L1SystemElements.map((element, index) => {
                                const elData = L1Elements[element];
                                if (!elData) return null;

                                const pos = positions?.[element] || { x: (index % 5) * 200, y: Math.floor(index / 5) * 200 };
                                const inComponentEdit = mode === Mode.Edit && editMode === 'components';

                                // Resize handle helper — renders a small grab square
                                const ResizeHandle = ({ handle }: { handle: string }) => {
                                    const styles: React.CSSProperties = {
                                        position: 'absolute',
                                        width: 10,
                                        height: 10,
                                        background: '#2563eb',
                                        border: '1.5px solid white',
                                        borderRadius: 2,
                                        zIndex: 999,
                                    };
                                    if (handle.includes('n')) styles.top = -5; else if (handle.includes('s')) styles.bottom = -5; else styles.top = '50%';
                                    if (handle.includes('w')) styles.left = -5; else if (handle.includes('e')) styles.right = -5; else styles.left = '50%';
                                    if (!handle.includes('n') && !handle.includes('s')) styles.transform = 'translateY(-50%)';
                                    if (!handle.includes('e') && !handle.includes('w')) styles.transform = (styles.transform ? styles.transform + ' ' : '') + 'translateX(-50%)';
                                    const cursor: Record<string, string> = {
                                        'n': 'n-resize', 's': 's-resize', 'e': 'e-resize', 'w': 'w-resize',
                                        'ne': 'ne-resize', 'nw': 'nw-resize', 'se': 'se-resize', 'sw': 'sw-resize'
                                    };
                                    styles.cursor = cursor[handle] || 'default';
                                    return (
                                        <div
                                            style={styles}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                resizingRef.current = {
                                                    id: element,
                                                    startX: e.clientX,
                                                    startY: e.clientY,
                                                    startW: pos.w ?? 0,
                                                    startH: pos.h ?? 0,
                                                    handle
                                                };
                                            }}
                                        />
                                    );
                                };

                                return (
                                    <div
                                        key={`${elData.tag}-${index}`}
                                        className="absolute pointer-events-auto"
                                        style={{
                                            left: pos.x,
                                            top: pos.y,
                                            zIndex: pos.z || 1,
                                            width: pos.w ? pos.w : undefined,
                                            height: pos.h ? pos.h : undefined,
                                            boxSizing: 'border-box',
                                            outline: inComponentEdit ? '1.5px dashed #93c5fd' : undefined,
                                        }}
                                        onMouseDown={(e) => {
                                            if (inComponentEdit) {
                                                e.stopPropagation();
                                                setDraggingId(element);
                                            }
                                        }}
                                    >
                                        <div
                                            className="bg-transparent rounded flex flex-col items-center w-full h-full"
                                            style={{
                                                cursor: inComponentEdit ? 'move' : 'pointer',
                                                overflow: pos.w || pos.h ? 'hidden' : undefined
                                            }}
                                        >
                                            <div
                                                className={[
                                                    inComponentEdit ? "pointer-events-none w-full h-full" : "cursor-pointer",
                                                    // When a custom size is set, force all child images/SVGs to fill the container
                                                    (pos.w || pos.h)
                                                        ? "[&_img]:!w-full [&_img]:!h-full [&_img]:object-contain [&_img]:max-w-none [&_svg]:!w-full [&_svg]:!h-full [&_video]:!w-full [&_video]:!h-full w-full h-full"
                                                        : ""
                                                ].join(" ")}
                                                style={{ width: '100%', height: '100%' }}
                                                onClick={(e) => {
                                                    console.log(elData);
                                                    if (elData?.type === ElementType.TemperatureController) {
                                                        setTempSensor({
                                                            id: element,
                                                            data: (elData as any)?.data,
                                                            config: (elData as any)?.config,
                                                        });
                                                    }
                                                    else if (elData?.type === ElementType.TurboGenerator) {
                                                        setLocation('/settings/controller-outputs/faceplates/turbo-generator-faceplate');
                                                    }
                                                }}
                                            >
                                                {elData.component}
                                            </div>
                                        </div>
                                        {/* Resize handles + Z-index badge — only in component edit mode */}
                                        {inComponentEdit && (
                                            <>
                                                <ResizeHandle handle="nw" />
                                                <ResizeHandle handle="n" />
                                                <ResizeHandle handle="ne" />
                                                <ResizeHandle handle="w" />
                                                <ResizeHandle handle="e" />
                                                <ResizeHandle handle="sw" />
                                                <ResizeHandle handle="s" />
                                                <ResizeHandle handle="se" />
                                                {/* Z-index badge */}
                                                <div
                                                    style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, pointerEvents: 'auto' }}
                                                    className="flex items-center gap-0.5 bg-gray-800 text-white text-xs rounded shadow px-1 py-0.5 select-none"
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        className="w-4 h-4 flex items-center justify-center hover:bg-gray-600 rounded"
                                                        onClick={(e) => { e.stopPropagation(); changeComponentZ(element, (pos.z ?? 1) + 1); }}
                                                    >+</button>
                                                    <span className="min-w-[1.5rem] text-center font-mono">{pos.z ?? 1}</span>
                                                    <button
                                                        className="w-4 h-4 flex items-center justify-center hover:bg-gray-600 rounded"
                                                        onClick={(e) => { e.stopPropagation(); changeComponentZ(element, Math.max(1, (pos.z ?? 1) - 1)); }}
                                                    >-</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>
            <Dialog open={!!tempSensor} onOpenChange={(open) => setTempSensor(open ? tempSensor : null)}>
                <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
                    <VisuallyHidden>
                        <DialogTitle>Temperature Sensor {tempSensor?.id}</DialogTitle>
                    </VisuallyHidden>
                    {tempSensor && <TempSensorSecondaryFaceplate
                        data={tempSensor?.data}
                        config={tempSensor?.config}
                        sensorId={tempSensor?.id!}
                        onClose={() => setTempSensor(null)}
                    />}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default L1SystemOverview;


//         <div className="relative" style={{ width: '5200px', height: '1600px', minWidth: '5200px', minHeight: '1600px' }}>
//           <Rnd
//             position={{x:0,y:0}}
//             size={{width:100,height:100}}>

//           </Rnd>
//         <Rnd
//           position={furnacePosition}
//           size={furnaceSize}
//           onDragStop={(e, d) => setFurnacePosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setFurnaceSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setFurnacePosition(position);
//           }}
//           minWidth={100}
//           minHeight={40}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//           style={{ zIndex: 20 }}
//         >
//           <img
//             src={furnaceWhbImg}
//             alt="Furnace WHB"
//             className="w-full h-full object-contain"
//             draggable={false}
//           />
//         </Rnd>

//         <Rnd
//           position={compressorPosition}
//           size={compressorSize}
//           onDragStop={(e, d) => setCompressorPosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setCompressorSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setCompressorPosition(position);
//           }}
//           minWidth={150}
//           minHeight={120}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           resizeHandleStyles={!isLocked ? resizeHandleStyles : undefined}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//         >
//           <div
//             className={`w-full h-full flex items-center justify-center ${isLocked ? 'cursor-pointer' : ''}`}
//             onClick={handleCompressorClick}
//           >
//             <PrimaryCompressorFaceplate
//               data={compressorData}
//               transparentBackground={vfdConfig?.transparentBackground ?? true}
//               configTagName={vfdConfig?.tagName}
//               configDescription={vfdConfig?.description}
//               configUnit={vfdConfig?.unit}
//             />
//           </div>
//         </Rnd>

//         {/* Turbo Generator Faceplate */}
//         <TurboGeneratorProvider>
//           <Rnd
//             position={turboGeneratorPosition}
//             size={turboGeneratorSize}
//             onDragStop={(e, d) => setTurboGeneratorPosition({ x: d.x, y: d.y })}
//             onResizeStop={(e, dir, ref, delta, position) => {
//               setTurboGeneratorSize({
//                 width: parseInt(ref.style.width),
//                 height: parseInt(ref.style.height)
//               });
//               setTurboGeneratorPosition(position);
//             }}
//             minWidth={150}
//             minHeight={120}
//             bounds="parent"
//             disableDragging={isLocked}
//             enableResizing={!isLocked}
//             resizeHandleStyles={!isLocked ? resizeHandleStyles : undefined}
//             className={isLocked ? "cursor-default" : "cursor-move"}
//           >
//             <div
//               className={`w-full h-full flex items-center justify-center ${isLocked ? 'cursor-pointer' : ''}`}
//               onClick={handleTurboGeneratorClick}
//             >
//               <PrimaryTurboGeneratorFaceplate
//                 data={compressorData}
//                 transparentBackground={true}
//               />
//             </div>
//           </Rnd>
//         </TurboGeneratorProvider>

//         {/* Sulfur Flow Controller Faceplate */}
//         <Rnd
//           position={sulfurFlowPosition}
//           size={sulfurFlowSize}
//           onDragStop={(e, d) => setSulfurFlowPosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setSulfurFlowSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setSulfurFlowPosition(position);
//           }}
//           minWidth={100}
//           minHeight={90}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           resizeHandleStyles={!isLocked ? resizeHandleStyles : undefined}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//         >
//           <div
//             className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
//             onClick={handleSulfurFlowClick}
//             style={{
//               transform: `scale(${Math.min(sulfurFlowSize.width / 220, sulfurFlowSize.height / 200)})`,
//               transformOrigin: 'center center'
//             }}
//           >
//             <ControllerFaceplate
//               data={sulfurFlowData}
//               isTransparent={true}
//               controllerId="1530-F-2602"
//               showAlarmLimits={false}
//             />
//           </div>
//         </Rnd>

//         {/* Sulfur Flow Control Valve Faceplate */}
//         <Rnd
//           position={sulfurValvePosition}
//           size={sulfurValveSize}
//           onDragStop={(e, d) => setSulfurValvePosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setSulfurValveSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setSulfurValvePosition(position);
//           }}
//           minWidth={80}
//           minHeight={100}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           resizeHandleStyles={!isLocked ? resizeHandleStyles : undefined}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//         >
//           <div
//             className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
//             onClick={handleSulfurValveClick}
//             style={{
//               transform: `scale(${Math.min(sulfurValveSize.width / 100, sulfurValveSize.height / 140)})`,
//               transformOrigin: 'center center'
//             }}
//           >
//             <ValveFaceplate
//               data={sulfurValveData}
//               isTransparent={true}
//             />
//           </div>
//         </Rnd>

//         {/* Jug Valve Faceplate */}
//         <Rnd
//           position={jugValvePosition}
//           size={jugValveSize}
//           onDragStop={(e, d) => setJugValvePosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setJugValveSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setJugValvePosition(position);
//           }}
//           minWidth={80}
//           minHeight={100}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           resizeHandleStyles={!isLocked ? resizeHandleStyles : undefined}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//           style={{ zIndex: 10 }}
//         >
//           <div
//             className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
//             onClick={handleJugValveClick}
//             style={{
//               transform: `scale(${Math.min(jugValveSize.width / 100, jugValveSize.height / 140)})`,
//               transformOrigin: 'center center'
//             }}
//           >
//             <ValveFaceplate
//               data={jugValveData}
//               isTransparent={true}
//               valveImageSrc={jugValveImage}
//             />
//           </div>
//         </Rnd>

//         {/* Jug Valve Positioner Faceplate */}
//         {/* <Rnd
//           position={jugValvePositionerPosition}
//           size={jugValvePositionerSize}
//           onDragStop={(e, d) => setJugValvePositionerPosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setJugValvePositionerSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setJugValvePositionerPosition(position);
//           }}
//           minWidth={80}
//           minHeight={100}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           resizeHandleStyles={!isLocked ? resizeHandleStyles : undefined}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//         >
//           <div
//             className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
//             onClick={handleJugValvePositionerClick}
//             style={{
//               transform: `scale(${Math.min(jugValvePositionerSize.width / 100, jugValvePositionerSize.height / 140)})`,
//               transformOrigin: 'center center'
//             }}
//           >
//             <ValveFaceplate
//               data={jugValvePositionerData}
//               isTransparent={true}
//               valveImageSrc={jugValvePositionerImage}
//             />
//           </div>
//         </Rnd> */}

//         {/* Hand Controller 1540-H-4030 Faceplate */}
//         <Rnd
//           position={handControllerPosition}
//           size={handControllerSize}
//           onDragStop={(e, d) => setHandControllerPosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setHandControllerSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setHandControllerPosition(position);
//           }}
//           minWidth={100}
//           minHeight={90}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           resizeHandleStyles={!isLocked ? resizeHandleStyles : undefined}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//         >
//           <div
//             className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
//             onClick={handleHandControllerClick}
//             style={{
//               transform: `scale(${Math.min(handControllerSize.width / 220, handControllerSize.height / 200)})`,
//               transformOrigin: 'center center'
//             }}
//           >
//             <ControllerFaceplate
//               data={handControllerData}
//               isTransparent={true}
//               controllerId="1540-H-4030"
//             />
//           </div>
//         </Rnd>

//         {/* WHB Outlet dP Hand Controller 1540-H-4283 Faceplate */}
//         <Rnd
//           position={whbHandControllerPosition}
//           size={whbHandControllerSize}
//           onDragStop={(e, d) => setWhbHandControllerPosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setWhbHandControllerSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setWhbHandControllerPosition(position);
//           }}
//           minWidth={100}
//           minHeight={90}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           resizeHandleStyles={!isLocked ? resizeHandleStyles : undefined}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//         >
//           <div
//             className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
//             onClick={handleWhbHandControllerClick}
//             style={{
//               transform: `scale(${Math.min(whbHandControllerSize.width / 220, whbHandControllerSize.height / 200)})`,
//               transformOrigin: 'center center'
//             }}
//           >
//             <ControllerFaceplate
//               data={whbHandControllerData}
//               isTransparent={true}
//               controllerId="1540-H-4283"
//             />
//           </div>
//         </Rnd>

//         {/* Jug Valve Hand Controller 1540-H-4282 Faceplate */}
//         <Rnd
//           position={jugValveHandControllerPosition}
//           size={jugValveHandControllerSize}
//           onDragStop={(e, d) => setJugValveHandControllerPosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setJugValveHandControllerSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setJugValveHandControllerPosition(position);
//           }}
//           minWidth={100}
//           minHeight={90}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           resizeHandleStyles={!isLocked ? resizeHandleStyles : undefined}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//         >
//           <div
//             className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
//             onClick={handleJugValveHandControllerClick}
//             style={{
//               transform: `scale(${Math.min(jugValveHandControllerSize.width / 220, jugValveHandControllerSize.height / 200)})`,
//               transformOrigin: 'center center'
//             }}
//           >
//             <ControllerFaceplate
//               data={jugValveHandControllerData}
//               isTransparent={true}
//               controllerId="1540-H-4282"
//             />
//           </div>
//         </Rnd>

//         <Rnd
//           position={tempSensorPosition}
//           size={tempSensorSize}
//           onDragStop={(e, d) => setTempSensorPosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setTempSensorSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setTempSensorPosition(position);
//           }}
//           minWidth={120}
//           minHeight={80}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           resizeHandleStyles={!isLocked ? resizeHandleStyles : undefined}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//         >
//           <div
//             className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
//             onClick={handleTempSensorClick}
//             style={{
//               transform: `scale(${Math.min(tempSensorSize.width / 180, tempSensorSize.height / 120)})`,
//               transformOrigin: 'center center'
//             }}
//           >
//             <TempSensorPrimaryFaceplate
//               data={tempSensorData}
//               isTransparent={true}
//             />
//           </div>
//         </Rnd>

//         {/* Temperature Sensor 1540-TI-4200A Faceplate */}
//         <Rnd
//           position={tempSensor4200APosition}
//           size={tempSensor4200ASize}
//           onDragStop={(e, d) => setTempSensor4200APosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setTempSensor4200ASize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setTempSensor4200APosition(position);
//           }}
//           minWidth={120}
//           minHeight={80}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           resizeHandleStyles={!isLocked ? resizeHandleStyles : undefined}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//         >
//           <div
//             className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
//             onClick={handleTempSensor4200AClick}
//             style={{
//               transform: `scale(${Math.min(tempSensor4200ASize.width / 180, tempSensor4200ASize.height / 120)})`,
//               transformOrigin: 'center center'
//             }}
//           >
//             <TempSensorPrimaryFaceplate
//               data={tempSensor4200AData}
//               isTransparent={true}
//             />
//           </div>
//         </Rnd>

//         {/* Temperature Sensor 1540-TI-4200B Faceplate */}
//         <Rnd
//           position={tempSensor4200BPosition}
//           size={tempSensor4200BSize}
//           onDragStop={(e, d) => setTempSensor4200BPosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setTempSensor4200BSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setTempSensor4200BPosition(position);
//           }}
//           minWidth={120}
//           minHeight={80}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           resizeHandleStyles={!isLocked ? resizeHandleStyles : undefined}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//         >
//           <div
//             className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
//             onClick={handleTempSensor4200BClick}
//             style={{
//               transform: `scale(${Math.min(tempSensor4200BSize.width / 180, tempSensor4200BSize.height / 120)})`,
//               transformOrigin: 'center center'
//             }}
//           >
//             <TempSensorPrimaryFaceplate
//               data={tempSensor4200BData}
//               isTransparent={true}
//             />
//           </div>
//         </Rnd>

//         {/* Temperature Sensor 1540-TI-4200C Faceplate */}
//         <Rnd
//           position={tempSensor4200CPosition}
//           size={tempSensor4200CSize}
//           onDragStop={(e, d) => setTempSensor4200CPosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setTempSensor4200CSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setTempSensor4200CPosition(position);
//           }}
//           minWidth={120}
//           minHeight={80}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           resizeHandleStyles={!isLocked ? resizeHandleStyles : undefined}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//           style={{ zIndex: 20 }}
//         >
//           <div
//             className={`w-full h-full flex items-center justify-center overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
//             onClick={handleTempSensor4200CClick}
//             style={{
//               transform: `scale(${Math.min(tempSensor4200CSize.width / 180, tempSensor4200CSize.height / 120)})`,
//               transformOrigin: 'center center'
//             }}
//           >
//             <TempSensorPrimaryFaceplate
//               data={tempSensor4200CData}
//               isTransparent={true}
//             />
//           </div>
//         </Rnd>

//         {/* Converter 4 Graphic */}
//         <Rnd
//           position={converter4Position}
//           size={converter4Size}
//           onDragStop={(e, d) => setConverter4Position({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setConverter4Size({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setConverter4Position(position);
//           }}
//           minWidth={80}
//           minHeight={200}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           lockAspectRatio={false}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//           style={{ zIndex: 1 }}
//         >
//           <img
//             src={converter4Img}
//             alt="Converter 4"
//             className="w-full h-full object-fill"
//             draggable={false}
//           />
//         </Rnd>

//         {/* DT2 - Drying Tower Graphic */}
//         <Rnd
//           position={dt2Position}
//           size={dt2Size}
//           onDragStop={(e, d) => setDt2Position({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setDt2Size({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setDt2Position(position);
//           }}
//           minWidth={60}
//           minHeight={150}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           lockAspectRatio={true}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//           style={{ zIndex: 20 }}
//         >
//           <div className="flex flex-col items-center justify-center relative ">

//           <img
//             src={dt2Img}
//             alt="Drying Tower (DT)"
//             className="w-full h-full object-contain"
//             draggable={false}
//           />
//           <p className="text-xs text-black absolute bottom-0 right-0 text-center">DRYING TOWER
//             <br />
// 1520-TW-001</p>
//           </div>
//         </Rnd>

//         {/* FAT1 - Final Absorbing Tower */}
//         <Rnd
//           position={fat1Position}
//           size={fat1Size}
//           onDragStop={(e, d) => setFat1Position({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setFat1Size({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setFat1Position(position);
//           }}
//           minWidth={60}
//           minHeight={150}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           lockAspectRatio={true}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//           style={{ zIndex: 20 }}
//         >
//           <img
//             src={fat1Img}
//             alt="Final Absorbing Tower (FAT)"
//             className="w-full h-full object-contain"
//             draggable={false}
//           />
//         </Rnd>

//         {/* IPAT1 Graphic */}
//         <Rnd
//           position={ipat1Position}
//           size={ipat1Size}
//           onDragStop={(e, d) => setIpat1Position({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setIpat1Size({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setIpat1Position(position);
//           }}
//           minWidth={60}
//           minHeight={150}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           lockAspectRatio={true}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//           style={{ zIndex: 20 }}
//         >
//           <img
//             src={ipat1Img}
//             alt="IPAT Tower"
//             className="w-full h-full object-contain"
//             draggable={false}
//           />
//         </Rnd>

//         {/* HIP1 - Hot Interpass Absorber */}
//         <Rnd
//           position={hip1Position}
//           size={hip1Size}
//           onDragStop={(e, d) => setHip1Position({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setHip1Size({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setHip1Position(position);
//           }}
//           minWidth={50}
//           minHeight={120}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           lockAspectRatio={true}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//           style={{ zIndex: 20 }}
//         >
//           <img
//             src={hip1Img}
//             alt="Hot Interpass Absorber (HIP)"
//             className="w-full h-full object-contain"
//             draggable={false}
//           />
//         </Rnd>

//         {/* CIP - Cold Interpass Absorber */}
//         <Rnd
//           position={cipPosition}
//           size={cipSize}
//           onDragStop={(e, d) => setCipPosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setCipSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setCipPosition(position);
//           }}
//           minWidth={50}
//           minHeight={120}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           lockAspectRatio={true}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//           style={{ zIndex: 20 }}
//         >
//           <img
//             src={cipImg}
//             alt="Cold Interpass Absorber (CIP)"
//             className="w-full h-full object-contain"
//             draggable={false}
//           />
//         </Rnd>

//         {/* SH4A - Superheater 4A */}
//         <Rnd
//           position={sh4aPosition}
//           size={sh4aSize}
//           onDragStop={(e, d) => setSh4aPosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setSh4aSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setSh4aPosition(position);
//           }}
//           minWidth={50}
//           minHeight={120}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           lockAspectRatio={true}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//           style={{ zIndex: 20 }}
//         >
//           <img
//             src={sh4aImg}
//             alt="Superheater 4A (SH4A)"
//             className="w-full h-full object-contain"
//             draggable={false}
//           />
//         </Rnd>

//         {/* EC3B - Economizer 3B */}
//         <Rnd
//           position={ec3bPosition}
//           size={ec3bSize}
//           onDragStop={(e, d) => setEc3bPosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setEc3bSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setEc3bPosition(position);
//           }}
//           minWidth={50}
//           minHeight={120}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           lockAspectRatio={true}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//           style={{ zIndex: 20 }}
//         >
//           <img
//             src={ec3bImg}
//             alt="Economizer 3B (EC3B)"
//             className="w-full h-full object-contain"
//             draggable={false}
//           />
//         </Rnd>

//         {/* SH1B - Superheater 1B */}
//         <Rnd
//           position={sh1bPosition}
//           size={sh1bSize}
//           onDragStop={(e, d) => setSh1bPosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setSh1bSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setSh1bPosition(position);
//           }}
//           minWidth={50}
//           minHeight={120}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           lockAspectRatio={true}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//           style={{ zIndex: 20 }}
//         >
//           <img
//             src={sh1bImg}
//             alt="Superheater 1B (SH1B)"
//             className="w-full h-full object-contain"
//             draggable={false}
//           />
//         </Rnd>

//         {/* Industrial Filter */}
//         <Rnd
//           position={filterPosition}
//           size={filterSize}
//           onDragStop={(e, d) => setFilterPosition({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setFilterSize({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setFilterPosition(position);
//           }}
//           minWidth={40}
//           minHeight={60}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           lockAspectRatio={true}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//           style={{ zIndex: 20 }}
//         >
//           <div className="flex flex-col items-center justify-center ">
//             <p className="text-xs text-black">INLET AIR FILTER
//             <br />
// 1520-FL-001</p>
//           <img
//             src={industrialFilterImg}
//             alt="Industrial Filter"
//             className="w-full h-full object-contain"
//             draggable={false}
//           />
//           </div>
//         </Rnd>

//         {/* Render all arrows */}
//         {arrows.map((arrow) => (
//           <Rnd
//             key={arrow.id}
//             position={{ x: arrow.x, y: arrow.y }}
//             size={{ width: arrow.width, height: arrow.height }}
//             onDragStop={(e, d) => {
//               setArrows(prev => prev.map(a =>
//                 a.id === arrow.id ? { ...a, x: d.x, y: d.y } : a
//               ));
//             }}
//             onResizeStop={(e, dir, ref, delta, position) => {
//               setArrows(prev => prev.map(a =>
//                 a.id === arrow.id
//                   ? { ...a, width: parseInt(ref.style.width), height: parseInt(ref.style.height), x: position.x, y: position.y }
//                   : a
//               ));
//             }}
//             minWidth={50}
//             minHeight={20}
//             bounds="window"
//             disableDragging={isLocked}
//             enableResizing={!isLocked}
//             lockAspectRatio={false}
//             className={isLocked ? "cursor-default" : "cursor-move"}
//             cancel=".rotate-btn"
//             style={{ zIndex: 30 }}
//           >
//             <div className="relative w-full h-full group">
//               {/* Rotated image layer */}
//               <div
//                 className="w-full h-full"
//                 style={{ transform: `rotate(${arrow.rotation}deg)`, transformOrigin: 'center' }}
//               >
//                 <img
//                   src={blueArrowImg}
//                   alt={`${arrow.color} Arrow`}
//                   className="w-full h-full object-fill"
//                   style={
//                     arrow.color === 'yellow' ? { filter: 'hue-rotate(60deg) saturate(1.5)' } :
//                     arrow.color === 'purple' ? { filter: 'hue-rotate(270deg) saturate(1.2)' } :
//                     arrow.color === 'black' ? { filter: 'hue-rotate(0deg) saturate(1.2)' } :
//                     arrow.color === 'red' ? { filter: 'hue-rotate(0deg) saturate(1.2)' } :
//                     arrow.color === 'green' ? { filter: 'hue-rotate(0deg) saturate(1.2)' } :
//                     undefined
//                   }
//                   draggable={false}
//                 />
//               </div>
//               {/* Rotation Button Overlay - not rotated */}
//               {!isLocked && (
//                 <button
//                   className="rotate-btn absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
//                              w-8 h-8 rounded-full bg-blue-500/80 hover:bg-blue-600
//                              flex items-center justify-center shadow-lg
//                              transition-all duration-200 z-10
//                              opacity-0 group-hover:opacity-100"
//                   onMouseDown={(e) => {
//                     e.stopPropagation();
//                     e.preventDefault();
//                   }}
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     e.preventDefault();
//                     handleRotateArrow(arrow.id);
//                   }}
//                   title={`Rotate 90° (current: ${arrow.rotation}°)`}
//                 >
//                   <RotateCw className="w-4 h-4 text-white" />
//                 </button>
//               )}
//             </div>
//           </Rnd>
//         ))}

//         {/* Render vertical arrows for this screen */}
//         {verticalArrows.filter(va => va.screen === 'L1 – System Overview').map((vArrow) => (
//           <Rnd
//             key={`${vArrow.id}-${vArrow.rotation}`}
//             position={{ x: vArrow.x, y: vArrow.y }}
//             size={{ width: vArrow.rotation % 180 === 0 ? vArrow.width : vArrow.height, height: vArrow.rotation % 180 === 0 ? vArrow.height : vArrow.width }}
//             onDragStop={(e, d) => {
//               setVerticalArrows(prev => prev.map(va =>
//                 va.id === vArrow.id ? { ...va, x: d.x, y: d.y } : va
//               ));
//             }}
//             onResizeStop={(e, dir, ref, delta, position) => {
//               const isHorizontal = vArrow.rotation % 180 !== 0;
//               setVerticalArrows(prev => prev.map(va =>
//                 va.id === vArrow.id
//                   ? {
//                       ...va,
//                       height: isHorizontal ? parseInt(ref.style.width) : parseInt(ref.style.height),
//                       x: position.x,
//                       y: position.y
//                     }
//                   : va
//               ));
//             }}
//             minWidth={vArrow.rotation % 180 === 0 ? 24 : 50}
//             minHeight={vArrow.rotation % 180 === 0 ? 50 : 24}
//             maxWidth={vArrow.rotation % 180 === 0 ? 24 : undefined}
//             maxHeight={vArrow.rotation % 180 === 0 ? undefined : 24}
//             bounds="window"
//             disableDragging={isLocked}
//             enableResizing={!isLocked ? {
//               top: vArrow.rotation % 180 === 0,
//               bottom: vArrow.rotation % 180 === 0,
//               left: vArrow.rotation % 180 !== 0,
//               right: vArrow.rotation % 180 !== 0,
//               topLeft: false,
//               topRight: false,
//               bottomLeft: false,
//               bottomRight: false
//             } : false}
//             className={`${isLocked ? "cursor-default" : "cursor-move"} group`}
//             style={{ zIndex: 35 }}
//           >
//             <div className="relative w-full h-full">
//               <div
//                 style={{
//                   position: 'absolute',
//                   top: '50%',
//                   left: '50%',
//                   transform: `translate(-50%, -50%) rotate(${vArrow.rotation}deg)`,
//                   width: vArrow.rotation % 180 === 0 ? '100%' : vArrow.height,
//                   height: vArrow.rotation % 180 === 0 ? '100%' : vArrow.width,
//                 }}
//               >
//                 <VerticalArrow
//                   width={vArrow.width}
//                   height={vArrow.height}
//                   color="#53B1D8"
//                 />
//               </div>
//               {!isLocked && (
//                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
//                                 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
//                   <button
//                     className="w-6 h-6 rounded-full bg-blue-500/80 hover:bg-blue-600
//                                flex items-center justify-center shadow-lg"
//                     onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
//                     onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleRotateVerticalArrow(vArrow.id); }}
//                     title={`Rotate 90° (current: ${vArrow.rotation}°)`}
//                   >
//                     <RotateCw className="w-3 h-3 text-white" />
//                   </button>
//                   <button
//                     className="w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-600
//                                flex items-center justify-center shadow-lg"
//                     onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
//                     onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteVerticalArrow(vArrow.id); }}
//                     title="Delete arrow"
//                   >
//                     <Trash2 className="w-3 h-3 text-white" />
//                   </button>
//                 </div>
//               )}
//             </div>
//           </Rnd>
//         ))}

//         {/* Render vertical lines (without arrowheads) for this screen */}
//         {verticalLines.filter(vl => vl.screen === 'L1 – System Overview').map((vLine) => (
//           <Rnd
//             key={vLine.id}
//             position={{ x: vLine.x, y: vLine.y }}
//             size={{ width: vLine.width, height: vLine.height }}
//             onDragStop={(e, d) => {
//               setVerticalLines(prev => prev.map(vl =>
//                 vl.id === vLine.id ? { ...vl, x: d.x, y: d.y } : vl
//               ));
//             }}
//             onResizeStop={(e, dir, ref, delta, position) => {
//               setVerticalLines(prev => prev.map(vl =>
//                 vl.id === vLine.id
//                   ? { ...vl, height: parseInt(ref.style.height), x: position.x, y: position.y }
//                   : vl
//               ));
//             }}
//             minWidth={24}
//             minHeight={50}
//             maxWidth={24}
//             bounds="window"
//             disableDragging={isLocked}
//             enableResizing={!isLocked ? {
//               top: true,
//               bottom: true,
//               left: false,
//               right: false,
//               topLeft: false,
//               topRight: false,
//               bottomLeft: false,
//               bottomRight: false
//             } : false}
//             className={`${isLocked ? "cursor-default" : "cursor-move"} group`}
//             style={{ zIndex: 35 }}
//           >
//             <div className="relative w-full h-full">
//               <VerticalLine
//                 width={vLine.width}
//                 height={vLine.height}
//                 color="#53B1D8"
//               />
//               {!isLocked && (
//                 <button
//                   className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
//                              w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-600
//                              flex items-center justify-center shadow-lg
//                              opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
//                   onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
//                   onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteVerticalLine(vLine.id); }}
//                   title="Delete line"
//                 >
//                   <Trash2 className="w-3 h-3 text-white" />
//                 </button>
//               )}
//             </div>
//           </Rnd>
//         ))}

//         {/* Dashed Line 1 */}
//         <Rnd
//           position={dashedLine1Position}
//           size={dashedLine1Size}
//           onDragStop={(e, d) => setDashedLine1Position({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setDashedLine1Size({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setDashedLine1Position(position);
//           }}
//           minWidth={50}
//           minHeight={2}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//         >
//           <div className="relative w-full h-full group">
//             <div
//               className="w-full h-full flex items-center"
//               style={{
//                 borderTop: '3px dashed black',
//                 transform: `rotate(${dashedLine1Rotation}deg)`,
//                 transformOrigin: 'center'
//               }}
//             />
//             {!isLocked && (
//               <button
//                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
//                            w-6 h-6 rounded-full bg-gray-700/80 hover:bg-gray-800
//                            flex items-center justify-center shadow-lg
//                            transition-all duration-200 z-10
//                            opacity-0 group-hover:opacity-100"
//                 onMouseDown={(e) => {
//                   e.stopPropagation();
//                   e.preventDefault();
//                 }}
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   e.preventDefault();
//                   setDashedLine1Rotation((prev) => (prev + 90) % 360);
//                 }}
//                 title={`Rotate 90° (current: ${dashedLine1Rotation}°)`}
//               >
//                 <RotateCw className="w-3 h-3 text-white" />
//               </button>
//             )}
//           </div>
//         </Rnd>

//         {/* Dashed Line 2 */}
//         <Rnd
//           position={dashedLine2Position}
//           size={dashedLine2Size}
//           onDragStop={(e, d) => setDashedLine2Position({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setDashedLine2Size({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setDashedLine2Position(position);
//           }}
//           minWidth={50}
//           minHeight={2}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//         >
//           <div className="relative w-full h-full group">
//             <div
//               className="w-full h-full flex items-center"
//               style={{
//                 borderTop: '3px dashed black',
//                 transform: `rotate(${dashedLine2Rotation}deg)`,
//                 transformOrigin: 'center'
//               }}
//             />
//             {!isLocked && (
//               <button
//                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
//                            w-6 h-6 rounded-full bg-gray-700/80 hover:bg-gray-800
//                            flex items-center justify-center shadow-lg
//                            transition-all duration-200 z-10
//                            opacity-0 group-hover:opacity-100"
//                 onMouseDown={(e) => {
//                   e.stopPropagation();
//                   e.preventDefault();
//                 }}
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   e.preventDefault();
//                   setDashedLine2Rotation((prev) => (prev + 90) % 360);
//                 }}
//                 title={`Rotate 90° (current: ${dashedLine2Rotation}°)`}
//               >
//                 <RotateCw className="w-3 h-3 text-white" />
//               </button>
//             )}
//           </div>
//         </Rnd>

//         {/* Dashed Line 3 */}
//         <Rnd
//           position={dashedLine3Position}
//           size={dashedLine3Size}
//           onDragStop={(e, d) => setDashedLine3Position({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setDashedLine3Size({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setDashedLine3Position(position);
//           }}
//           minWidth={50}
//           minHeight={2}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//         >
//           <div className="relative w-full h-full group">
//             <div
//               className="w-full h-full flex items-center"
//               style={{
//                 borderTop: '3px dashed black',
//                 transform: `rotate(${dashedLine3Rotation}deg)`,
//                 transformOrigin: 'center'
//               }}
//             />
//             {!isLocked && (
//               <button
//                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
//                            w-6 h-6 rounded-full bg-gray-700/80 hover:bg-gray-800
//                            flex items-center justify-center shadow-lg
//                            transition-all duration-200 z-10
//                            opacity-0 group-hover:opacity-100"
//                 onMouseDown={(e) => {
//                   e.stopPropagation();
//                   e.preventDefault();
//                 }}
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   e.preventDefault();
//                   setDashedLine3Rotation((prev) => (prev + 90) % 360);
//                 }}
//                 title={`Rotate 90° (current: ${dashedLine3Rotation}°)`}
//               >
//                 <RotateCw className="w-3 h-3 text-white" />
//               </button>
//             )}
//           </div>
//         </Rnd>

//         {/* Dashed Line 4 */}
//         <Rnd
//           position={dashedLine4Position}
//           size={dashedLine4Size}
//           onDragStop={(e, d) => setDashedLine4Position({ x: d.x, y: d.y })}
//           onResizeStop={(e, dir, ref, delta, position) => {
//             setDashedLine4Size({
//               width: parseInt(ref.style.width),
//               height: parseInt(ref.style.height)
//             });
//             setDashedLine4Position(position);
//           }}
//           minWidth={50}
//           minHeight={2}
//           bounds="parent"
//           disableDragging={isLocked}
//           enableResizing={!isLocked}
//           className={isLocked ? "cursor-default" : "cursor-move"}
//         >
//           <div className="relative w-full h-full group">
//             <div
//               className="w-full h-full flex items-center"
//               style={{
//                 borderTop: '3px dashed black',
//                 transform: `rotate(${dashedLine4Rotation}deg)`,
//                 transformOrigin: 'center'
//               }}
//             />
//             {!isLocked && (
//               <button
//                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
//                            w-6 h-6 rounded-full bg-gray-700/80 hover:bg-gray-800
//                            flex items-center justify-center shadow-lg
//                            transition-all duration-200 z-10
//                            opacity-0 group-hover:opacity-100"
//                 onMouseDown={(e) => {
//                   e.stopPropagation();
//                   e.preventDefault();
//                 }}
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   e.preventDefault();
//                   setDashedLine4Rotation((prev) => (prev + 90) % 360);
//                 }}
//                 title={`Rotate 90° (current: ${dashedLine4Rotation}°)`}
//               >
//                 <RotateCw className="w-3 h-3 text-white" />
//               </button>
//             )}
//           </div>
//         </Rnd>

//         </div>