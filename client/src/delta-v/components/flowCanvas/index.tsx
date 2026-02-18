import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Element, ELEMENTS } from "./elements.constant";
import { Input } from "@/components/ui/input";
import { Popover } from "@/components/ui/popover";
import { PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { Trash2 } from "lucide-react";

/**
 * Industrial FlowCanvas — Advanced Editor
 * ---------------------------------------
 * FIXES + NEW FEATURES
 * ✅ Edge handles stay ON edges (not floating)
 * ✅ Drag from edge midpoint to create connections
 * ✅ Connections can end ANYWHERE (free endpoint)
 * ✅ Click edge → change color
 * ✅ Orthogonal routing
 * ✅ Text node support
 */


interface FlowNode {
    id: number;
    label: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    component: React.ReactNode;
}

interface FlowEdge {
    id: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
    from?: number;
    to?: number;
}

interface DrawingEdge {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

const ELEMENT_LIST = Object.values(ELEMENTS);

let idCounter = 1;
let edgeCounter = 1;

interface props {
    defaultData?: any;
    onSave?: (data: { nodes: FlowNode[]; edges: FlowEdge[]; nodeMap: Record<number, { label: string; outputs: number[] }> }) => void;
}
const ElementNode = ({
    node,
    setDraggingId,
    startEdgeFromHandle,
    deleteNode,
    setResizingId
}: {
    node: FlowNode;
    setDraggingId: (id: number | null) => void;
    startEdgeFromHandle: (x: number, y: number) => void;
    deleteNode: (id: number) => void;
    setResizingId: (id: number | null) => void;
}) => (
    <motion.div
        className="absolute shadow-none hover:shadow-md bg-transparent"
        style={{
            left: node.x,
            top: node.y,
            width: node.width,
            height: node.height,
        }}
        onMouseDown={() => setDraggingId(node.id)}
        whileHover={{ scale: 1.02 }}
    >
        {node.component}
        {/* EDGE START HANDLES (center of edges) */}
        {[
            { x: node.width / 2, y: 0 },
            { x: node.width / 2, y: node.height },
            { x: 0, y: node.height / 2 },
            { x: node.width, y: node.height / 2 },
        ].map((p, i) => (
            <div
                key={i}
                className="absolute w-3 h-3 bg-blue-600 rounded-full cursor-crosshair"
                style={{ left: p.x - 6, top: p.y - 6 }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    startEdgeFromHandle(node.x + p.x, node.y + p.y);
                }}
            />
        ))}

        {/* Delete */}
        <div
            className="absolute w-4 h-4 bg-gray-600/20 hover:bg-gray-600/80 top-0 right-0 cursor-pointer"
            onMouseDown={(e) => {
                e.stopPropagation();
                deleteNode(node.id);
            }}
        >
            <Trash2 className="w-4 h-4" />
        </div>

        {/* Resize */}
        <div
            className="absolute w-4 h-4 bg-gray-600/20 hover:bg-gray-600/80 bottom-0 right-0 cursor-se-resize"
            onMouseDown={(e) => {
                e.stopPropagation();
                setResizingId(node.id);
            }}
        />
    </motion.div>
);

const FlowCanvas = ({
    defaultData,
    onSave
}: props) => {
    const canvasRef = useRef<HTMLDivElement>(null);

    const [nodes, setNodes] = useState<FlowNode[]>([]);
    const [edges, setEdges] = useState<FlowEdge[]>([]);

    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [resizingId, setResizingId] = useState<number | null>(null);

    const [drawingEdge, setDrawingEdge] = useState<DrawingEdge | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<number | null>(null);

    // --------------------
    // ADD NODE
    // --------------------
    const addNode = (el: Element, type = "process") => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        setNodes((prev) => [
            ...prev,
            {
                id: idCounter++,
                label: el.name,
                type,
                x: rect.width / 2 - 80,
                y: rect.height / 2 - 40,
                width: 160,
                height: 80,
                component: el.component(false, el.position, el.size, (position) => {
                    setNodes((prev) =>
                        prev.map((n) =>
                            n.id === idCounter - 1
                                ? { ...n, x: position.x, y: position.y }
                                : n
                        )
                    );
                }, (size) => {
                    setNodes((prev) =>
                        prev.map((n) =>
                            n.id === idCounter - 1
                                ? { ...n, width: size.width, height: size.height }
                                : n
                        )
                    );
                })
            },
        ]);
    };

    function deleteNode(id: number) {
        setNodes((prev) => prev.filter((n) => n.id !== id));
    }

    const addTextNode = () => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        setNodes((prev) => [
            ...prev,
            {
                id: idCounter++,
                label: "Text Node",
                type: "text",
                x: rect.width / 2 - 80,
                y: rect.height / 2 - 40,
                width: 160,
                height: 80,
                component: <Card>
                    <CardContent>
                        <Input
                            value="Text Node"
                            onChange={(e) => {
                                setNodes((prev) =>
                                    prev.map((n) =>
                                        n.id === idCounter - 1
                                            ? { ...n, label: e.target.value }
                                            : n
                                    )
                                );
                            }}
                        />
                    </CardContent>
                </Card>
            },
        ]);
    };

    // --------------------
    // DRAG + RESIZE
    // --------------------
    const onMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (draggingId) {
            setNodes((prev) =>
                prev.map((n) =>
                    n.id === draggingId
                        ? { ...n, x: x - n.width / 2, y: y - n.height / 2 }
                        : n
                )
            );
        }

        if (resizingId) {
            setNodes((prev) =>
                prev.map((n) =>
                    n.id === resizingId
                        ? {
                            ...n,
                            width: Math.max(60, x - n.x),
                            height: Math.max(30, y - n.y),
                        }
                        : n
                )
            );
        }

        if (drawingEdge) {
            setDrawingEdge((prev) => (prev ? { ...prev, x2: x, y2: y } : null));
        }
    };

    const onMouseUp = () => {
        if (drawingEdge) {
            setEdges((prev) => [
                ...prev,
                { ...drawingEdge, id: edgeCounter++, color: "black" },
            ]);
            setDrawingEdge(null);
        }

        setDraggingId(null);
        setResizingId(null);
    };

    useEffect(() => {
        window.addEventListener("mouseup", onMouseUp);
        return () => window.removeEventListener("mouseup", onMouseUp);
    }, [drawingEdge]);

    // --------------------
    // EDGE MIDPOINT HANDLE
    // --------------------
    const startEdgeFromHandle = (x: number, y: number) => {
        setDrawingEdge({ x1: x, y1: y, x2: x, y2: y });
    };

    // --------------------
    // ORTHOGONAL PATH
    // --------------------
    const orthogonalPath = (x1: number, y1: number, x2: number, y2: number) => {
        const midX = (x1 + x2) / 2;
        return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    };

    const getEdgeMidpoint = (edge: FlowEdge | DrawingEdge) => ({
        x: (edge.x1 + edge.x2) / 2,
        y: (edge.y1 + edge.y2) / 2,
    });

    // --------------------
    // SAVE LOGIC
    // --------------------
    const buildNodeMap = () => {
        const map: Record<number, { label: string; outputs: number[] }> = {};

        nodes.forEach((n) => (map[n.id] = { label: n.label, outputs: [] }));

        edges.forEach((e) => {
            if (e.from !== undefined && e.to !== undefined) {
                map[e.from]?.outputs.push(e.to);
            }
        });

        return map;
    };

    const handleSave = () => {
        const layout = { nodes, edges, nodeMap: buildNodeMap() };
        console.log(layout);
        onSave?.(layout);
    };

    // --------------------
    // EDGE COLOR CHANGE
    // --------------------
    const changeEdgeColor = (color: string) => {
        if (!selectedEdge) return;

        setEdges((prev) =>
            prev.map((e) =>
                e.id === selectedEdge ? { ...e, color } : e
            )
        );
    };

    // --------------------
    // RENDER EDGES
    // --------------------
    const renderEdges = () => (
        edges.map((edge) => {
            const mid = getEdgeMidpoint(edge);

            return (
                <g key={edge.id}>
                    <path
                        d={orthogonalPath(edge.x1, edge.y1, edge.x2, edge.y2)}
                        fill="none"
                        stroke={edge.color}
                        strokeWidth="4"
                        markerEnd="url(#arrow)"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEdge(edge.id);
                        }}
                        className="cursor-pointer"
                    />

                    {/* MID HANDLE */}
                    <circle
                        cx={mid.x}
                        cy={mid.y}
                        r={6}
                        fill="#2563eb"
                        className="cursor-crosshair"
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            startEdgeFromHandle(mid.x, mid.y);
                        }}
                    />
                </g>
            );
        })
    );

    // --------------------
    // UI
    // --------------------
    return (
        <div className="w-full h-screen flex flex-col">
            {/* Toolbar */}
            <div className="w-full flex justify-between h-fit max-h-[70px] px-2 border-b bg-white z-10">
                <div className=" overflow-x-scroll px-2 py-2">

                    <div className="flex space-x-2">
                        {ELEMENT_LIST.map((el) => (
                            <Button type={'button'} variant={'ghost'} key={el.name} className="w-fit px-2 " onClick={() => addNode(el)}>
                                {el.name}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex space-x-2 h-fit px-2 py-2">
                    <Button className="w-fit px-2" onClick={addTextNode}>
                        Add Text
                    </Button>

                    <Button className="w-fit px-2" onClick={handleSave}>
                        Save Layout
                    </Button>
                </div>

                {selectedEdge && (
                    <div className="space-y-2 pt-2 h-fit px-2">
                        <p className="text-sm">Edge Color</p>
                        <div className="flex gap-2">
                            {["black", "red", "green", "blue", "orange"].map((c) => (
                                <button
                                    key={c}
                                    className="w-6 h-6 rounded-full border"
                                    style={{ background: c }}
                                    onClick={() => changeEdgeColor(c)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Canvas */}
            <div
                ref={canvasRef}
                className="flex-1 relative bg-gray-50 overflow-hidden"
                onMouseMove={onMouseMove}
            >
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto">
                            <path d="M0,0 L10,3 L0,6 Z" fill="black" />
                        </marker>
                    </defs>
                    <g className="pointer-events-auto">{renderEdges()}</g>

                    {drawingEdge && (
                        <path
                            d={orthogonalPath(drawingEdge.x1, drawingEdge.y1, drawingEdge.x2, drawingEdge.y2)}
                            stroke="gray"
                            strokeDasharray="5 5"
                            fill="none"
                        />
                    )}
                </svg>

                {nodes.map((node) => (
                    <ElementNode 
                        key={node.id} 
                        node={node} 
                        setDraggingId={setDraggingId}
                        startEdgeFromHandle={startEdgeFromHandle}
                        deleteNode={deleteNode}
                        setResizingId={setResizingId}
                    />
                ))}
            </div>
        </div>
    );
}

export default FlowCanvas;
