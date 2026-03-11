import React, { useState, useRef, useEffect } from "react";
import L2AcidElementsMap, {
  BlockType,
  ElementType,
  L2AcidElement,
  L2AcidElements,
} from "./L2_1520Acid.components.map";
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
import {
  useGetLayoutByIdQuery,
  useUpdateLayoutMutation,
} from "@/rtkServices/layoutManagerServices";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  FlowEdge,
  DrawingEdge,
} from "@/rtkServices/layoutManagerServices/type";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TempSensorSecondaryFaceplate } from "@/delta-v/components/faceplate/TempSensorSecondaryFaceplate";
import { SecondaryControllerFaceplate } from "@/delta-v/components/faceplate/SecondaryControllerFaceplate";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useSearch } from "wouter";

import {
  type SecondaryControllerData,
  type SecondaryControllerConfig,
} from "@/delta-v/types/secondaryController";
import { useControllerConfig } from "@/delta-v/contexts/ControllerConfigContext";
import { defaultPositionL2Acid } from "./defalutPosition.constant";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const LAYOUT_ID = "L2_1520_ACID";

const customColors = [
  { id: "light-blue", label: "Light Blue", fill: "rgb(130,204,237)" },
  { id: "yellow", label: "Yellow", fill: "rgb(252,253,1)" },
  { id: "light-green", label: "Light Green", fill: "rgb(142,217,115)" },
  { id: "orange", label: "Orange", fill: "rgb(192,79,21)" },
  { id: "gray-gradient", label: "Gray Gradient", fill: "rgb(133,132,130)" },
];

type TempSensor = {
  id: string;
  data: any;
  config: any;
};

export enum Mode {
  View = "view",
  Edit = "edit",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const L2_1520_ACID = () => {
  const { toast } = useToast();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const rawFilter = searchParams.get("filter");
  const instBlockFilter: "all" | "controllers" | "sensors" =
    rawFilter === "controllers" || rawFilter === "sensors" ? rawFilter : "all";


  // ── common secondary controller dialog ──────────────────────────────────
  const [commonSecondaryControllerDialog, setCommonSecondaryControllerDialog] =
    useState<{
      isModalOpen: boolean;
      data?: SecondaryControllerData;
      config?: SecondaryControllerConfig;
      controllerId?: string;
      description?: string;
    }>({ isModalOpen: false });

  const [tempSensor, setTempSensor] = useState<TempSensor | null>(null);
  const [mode, setMode] = useState<Mode>(Mode.View);
  const [editMode, setEditMode] = useState<"components" | "edges">(
    "components",
  );

  // ── layout persistence ──────────────────────────────────────────────────
  const {
    data: layoutData,
    isLoading,
    isUninitialized,
  } = useGetLayoutByIdQuery(LAYOUT_ID, { refetchOnMountOrArgChange: true });

  const [updateLayout, { isLoading: isUpdatingLayout }] =
    useUpdateLayoutMutation();
  const { getControllerConfig, getControllerData } = useControllerConfig();

  // ── elements ────────────────────────────────────────────────────────────
  const L2AcidElements_map = L2AcidElementsMap(getControllerConfig, false);

  // ── canvas state ────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number; z?: number; h?: number; w?: number }>
  >({});
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [drawingEdge, setDrawingEdge] = useState<DrawingEdge | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);

  const edgeCounterRef = useRef<number>(1);
  const isShiftHeldRef = useRef<boolean>(false);
  const resizingRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    handle: string;
  } | null>(null);

  // ── mouse handlers ───────────────────────────────────────────────────────
  const onMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    isShiftHeldRef.current = e.shiftKey;

    if (draggingId) {
      setPositions((prev) => {
        const p = prev || {};
        return {
          ...p,
          [draggingId]: { ...p[draggingId], x: x - 60, y: y - 40 },
        };
      });
    }
    if (resizingRef.current) {
      const { id, startX, startY, startW, startH, handle } =
        resizingRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      setPositions((prev) => {
        const cur = prev[id] || { x: 0, y: 0 };
        let newW = startW;
        let newH = startH;
        if (handle.includes("e")) newW = Math.max(40, startW + dx);
        if (handle.includes("w")) newW = Math.max(40, startW - dx);
        if (handle.includes("s")) newH = Math.max(40, startH + dy);
        if (handle.includes("n")) newH = Math.max(40, startH - dy);
        return { ...prev, [id]: { ...cur, w: newW, h: newH } };
      });
      return;
    }

    if (drawingEdge) {
      let x2 = x;
      let y2 = y;
      if (e.shiftKey) {
        const dx = Math.abs(x - drawingEdge.x1);
        const dy = Math.abs(y - drawingEdge.y1);
        if (dx >= dy) y2 = drawingEdge.y1;
        else x2 = drawingEdge.x1;
      }
      setDrawingEdge((prev) => (prev ? { ...prev, x2, y2 } : null));
    }
  };

  const onMouseUp = () => {
    if (drawingEdge) {
      const dist = Math.hypot(
        drawingEdge.x2 - drawingEdge.x1,
        drawingEdge.y2 - drawingEdge.y1,
      );
      if (dist > 5) {
        setEdges((prev) => [
          ...prev,
          {
            ...drawingEdge,
            id: edgeCounterRef.current++,
            color: customColors[0].id,
            hasPointer: true,
          },
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
    if (mode !== Mode.Edit || editMode !== "edges") return;
    if (e.button !== 0) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDrawingEdge({
      x1: e.clientX - rect.left,
      y1: e.clientY - rect.top,
      x2: e.clientX - rect.left,
      y2: e.clientY - rect.top,
    });
  };

  // ── edge helpers ─────────────────────────────────────────────────────────
  const orthogonalPath = (x1: number, y1: number, x2: number, y2: number) => {
    if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) {
      const midX = (x1 + x2) / 2;
      return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    }
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
  };

  const getEdgeMidpoint = (edge: FlowEdge | DrawingEdge) => ({
    x: (edge.x1 + edge.x2) / 2,
    y: (edge.y1 + edge.y2) / 2,
  });

  const startEdgeFromHandle = (x: number, y: number) =>
    setDrawingEdge({ x1: x, y1: y, x2: x, y2: y });

  const changeEdgeColor = (id: number, color: string) =>
    setEdges((prev) => prev.map((e) => (e.id === id ? { ...e, color } : e)));

  const changeEdgeZ = (id: number, z: number) =>
    setEdges((prev) => prev.map((e) => (e.id === id ? { ...e, z } : e)));

  const changeComponentZ = (id: string, z: number) =>
    setPositions((prev) => ({ ...prev, [id]: { ...prev[id], z } }));

  const toggleEdgePointer = (id: number) =>
    setEdges((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              hasPointer: e.hasPointer === undefined ? false : !e.hasPointer,
            }
          : e,
      ),
    );

  const deleteEdge = (id: number) =>
    setEdges((prev) => prev.filter((e) => e.id !== id));

  const setEdgeStyle = (id: number, style: "solid" | "dashed") =>
    setEdges((prev) => prev.map((e) => (e.id === id ? { ...e, style } : e)));

  function handleStopPropagation(e: React.MouseEvent, callback: () => void) {
    e.stopPropagation();
    callback();
  }

  // ── layout save / load ───────────────────────────────────────────────────
  const handleSave = () => {
    updateLayout({ id: LAYOUT_ID, layout: { positions, edges } })
      .unwrap()
      .then(() => {
        toast({ title: "Success", description: "Layout saved successfully" });
        setMode(Mode.View);
      });
  };

  const handleLoad = () => {
    if (layoutData) {
      setPositions(layoutData.positions);
      setEdges(layoutData.edges);
      if (layoutData.edges && layoutData.edges.length > 0) {
        edgeCounterRef.current =
          Math.max(...layoutData.edges.map((e) => e.id)) + 1;
      }
    }
  };

  useEffect(() => {
    if (layoutData) {
      handleLoad();
    } else if (!isLoading && !isUninitialized) {
      setPositions(defaultPositionL2Acid.positions);
      setEdges(defaultPositionL2Acid.edges);
      setMode(Mode.Edit);
    }
  }, [layoutData, isLoading, isUninitialized]);

  // ── rendering ────────────────────────────────────────────────────────────
  const getColorFill = (colorId: string) => {
    const c = customColors.find((c) => c.id === colorId);
    return c ? c.fill : customColors[0].fill;
  };

  const sortedEdges = [...edges].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

  const renderEdges = () =>
    sortedEdges.map((edge, index) => {
      const mid = getEdgeMidpoint(edge);
      return (
        <ContextMenu key={edge.id}>
          <ContextMenuTrigger asChild>
            <g
              style={{ zIndex: edge?.z ?? 10 }}
              id={`edge-${edge.id}-${index}`}
            >
              <path
                d={orthogonalPath(edge.x1, edge.y1, edge.x2, edge.y2)}
                fill="none"
                stroke="transparent"
                strokeWidth="20"
                className="cursor-pointer"
                onClick={(e) =>
                  handleStopPropagation(e, () => setSelectedEdge(edge.id))
                }
                onMouseDown={(e) => e.stopPropagation()}
              />
              <path
                d={orthogonalPath(edge.x1, edge.y1, edge.x2, edge.y2)}
                fill="none"
                stroke={getColorFill(edge.color)}
                strokeWidth={edge.style === "dashed" ? "3" : "6"}
                strokeDasharray={edge.style === "dashed" ? "12 8" : undefined}
                filter={
                  edge.style === "dashed" ? undefined : "url(#black-outline)"
                }
                markerEnd={
                  edge.hasPointer !== false
                    ? `url(#arrow-${edge.color})`
                    : undefined
                }
                className="pointer-events-none transition-all duration-300 ease-in-out"
              />
              <circle
                cx={mid.x}
                cy={mid.y}
                r={6}
                className="cursor-crosshair fill-transparent hover:fill-blue-500"
                onMouseDown={(e) => {
                  if (mode === Mode.Edit && editMode === "edges") {
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
                  <ContextMenuItem
                    key={c.id}
                    onClick={(e) =>
                      handleStopPropagation(e, () =>
                        changeEdgeColor(edge.id, c.id),
                      )
                    }
                  >
                    <div
                      style={{ background: c.fill }}
                      className="w-4 h-4 rounded-full mr-2 border border-black/20"
                    />
                    {c.label}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem>
              <div className="flex items-center gap-2">
                <p>Edge Z</p>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-full aspect-square bg-blue-500 text-white active:bg-blue-600"
                    onClick={(e) =>
                      handleStopPropagation(e, () =>
                        changeEdgeZ(edge.id, (edge?.z || 0) + 1),
                      )
                    }
                  >
                    +
                  </button>
                  <span className="min-w-[2rem] text-center font-mono font-bold text-sm border border-gray-300 rounded px-1 bg-gray-50 text-black">
                    {edge?.z ?? 0}
                  </span>
                  <button
                    className="p-2 rounded-full aspect-square bg-blue-500 text-white active:bg-blue-600"
                    onClick={(e) =>
                      handleStopPropagation(e, () =>
                        changeEdgeZ(edge.id, (edge?.z || 0) - 1),
                      )
                    }
                  >
                    -
                  </button>
                </div>
              </div>
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Edge Style</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem
                  onClick={(e) =>
                    handleStopPropagation(e, () =>
                      setEdgeStyle(edge.id, "solid"),
                    )
                  }
                >
                  Solid Line
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={(e) =>
                    handleStopPropagation(e, () =>
                      setEdgeStyle(edge.id, "dashed"),
                    )
                  }
                >
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
                <ContextMenuItem
                  onClick={(e) =>
                    handleStopPropagation(e, () => deleteEdge(edge.id))
                  }
                >
                  Confirm Delete
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={(e) =>
                    handleStopPropagation(e, () => deleteEdge(edge.id))
                  }
                >
                  Cancel Delete
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      );
    });

  const handleEdit = () => setMode(Mode.Edit);

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="w-full h-screen flex flex-col pt-10 relative">
        {(isUpdatingLayout || isLoading) && (
          <div className="absolute inset-0 w-full h-full flex justify-center items-center bg-white/50 backdrop-blur-sm z-50">
            <Loader2 className="animate-spin" size={50} color="#000" />
          </div>
        )}

        {/* Toolbar */}
        <div className="w-full flex justify-between items-center h-fit max-h-[70px] px-4 py-2 border-b bg-white shadow-sm">
          {mode === Mode.Edit ? (
            <div className="flex gap-4 items-center">
              <span className="text-sm font-semibold text-gray-700">
                Editing:
              </span>
              <div className="flex border border-gray-300 rounded overflow-hidden shadow-sm">
                <button
                  className={`px-4 py-1.5 text-sm transition-colors ${editMode === "components" ? "bg-blue-600 text-white font-medium" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                  onClick={() => setEditMode("components")}
                >
                  Components
                </button>
                <button
                  className={`px-4 py-1.5 text-sm transition-colors ${editMode === "edges" ? "bg-blue-600 text-white font-medium" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                  onClick={() => setEditMode("edges")}
                >
                  Edges
                </button>
              </div>
            </div>
          ) : (
            <div />
          )}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-medium transition-colors"
            onClick={mode === Mode.Edit ? handleSave : handleEdit}
          >
            {isLoading || isUpdatingLayout
              ? "Saving..."
              : mode === Mode.Edit
                ? "Save Layout"
                : "Edit Layout"}
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <div
            ref={canvasRef}
            className="relative"
            style={{
              width: "5200px",
              height: "3000px",
              minWidth: "5200px",
              minHeight: "3000px",
            }}
            onMouseMove={onMouseMove}
            onMouseDown={handleCanvasMouseDown}
          >
            {/* SVG edges layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
              <defs>
                <linearGradient id="gray-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgb(133,132,130)" />
                  <stop offset="100%" stopColor="rgb(193,193,193)" />
                </linearGradient>
                <filter
                  id="black-outline"
                  filterUnits="userSpaceOnUse"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feMorphology
                    in="SourceAlpha"
                    operator="dilate"
                    radius="1.5"
                    result="dilated"
                  />
                  <feFlood floodColor="black" result="blackColor" />
                  <feComposite
                    in="blackColor"
                    in2="dilated"
                    operator="in"
                    result="blackOutline"
                  />
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
                    <path
                      d="M 4 4 L 28 16 L 4 28 Z"
                      fill={color.fill}
                      stroke="black"
                      strokeWidth="2.5"
                      strokeLinejoin="miter"
                    />
                  </marker>
                ))}
              </defs>
              <g className="pointer-events-auto group">{renderEdges()}</g>
              {drawingEdge && (
                <path
                  d={
                    isShiftHeldRef.current
                      ? `M ${drawingEdge.x1} ${drawingEdge.y1} L ${drawingEdge.x2} ${drawingEdge.y2}`
                      : orthogonalPath(
                          drawingEdge.x1,
                          drawingEdge.y1,
                          drawingEdge.x2,
                          drawingEdge.y2,
                        )
                  }
                  stroke="gray"
                  strokeDasharray="5 5"
                  fill="none"
                />
              )}
            </svg>

            {/* Elements */}
            {L2AcidElements.map((element, index) => {
              const elData = L2AcidElements_map[element];
              if (!elData) return null;

              const pos = positions?.[element] || {
                x: (index % 5) * 200,
                y: Math.floor(index / 5) * 200,
              };
              const inComponentEdit =
                mode === Mode.Edit && editMode === "components";

              const ResizeHandle = ({ handle }: { handle: string }) => {
                const styles: React.CSSProperties = {
                  position: "absolute",
                  width: 10,
                  height: 10,
                  background: "#2563eb",
                  border: "1.5px solid white",
                  borderRadius: 2,
                  zIndex: 999,
                };
                if (handle.includes("n")) styles.top = -5;
                else if (handle.includes("s")) styles.bottom = -5;
                else styles.top = "50%";
                if (handle.includes("w")) styles.left = -5;
                else if (handle.includes("e")) styles.right = -5;
                else styles.left = "50%";
                if (!handle.includes("n") && !handle.includes("s"))
                  styles.transform = "translateY(-50%)";
                if (!handle.includes("e") && !handle.includes("w"))
                  styles.transform =
                    (styles.transform ? styles.transform + " " : "") +
                    "translateX(-50%)";
                const cursor: Record<string, string> = {
                  n: "n-resize",
                  s: "s-resize",
                  e: "e-resize",
                  w: "w-resize",
                  ne: "ne-resize",
                  nw: "nw-resize",
                  se: "se-resize",
                  sw: "sw-resize",
                };
                styles.cursor = cursor[handle] || "default";
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
                        handle,
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
                    display:
                      instBlockFilter === "all" ||
                      (instBlockFilter === "controllers" &&
                        elData?.blockType !== BlockType.Sensor) ||
                      (instBlockFilter === "sensors" &&
                        elData?.blockType !== BlockType.Controller)
                        ? "block"
                        : "none",
                    left: pos.x,
                    top: pos.y,
                    zIndex: pos.z || 1,
                    width: pos.w ? pos.w : undefined,
                    height: pos.h ? pos.h : undefined,
                    boxSizing: "border-box",
                    outline: inComponentEdit
                      ? "1.5px dashed #93c5fd"
                      : undefined,
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
                      cursor: inComponentEdit ? "move" : "pointer",
                      overflow: pos.w || pos.h ? "hidden" : undefined,
                    }}
                  >
                    <div
                      className={[
                        inComponentEdit
                          ? "pointer-events-none w-full h-full"
                          : "cursor-pointer",
                        pos.w || pos.h
                          ? "[&_img]:!w-full [&_img]:!h-full [&_img]:object-contain [&_img]:max-w-none [&_svg]:!w-full [&_svg]:!h-full w-full h-full"
                          : "",
                      ].join(" ")}
                      style={{ width: "100%", height: "100%" }}
                      onClick={() => {
                        if (
                          elData?.type === ElementType.TemperatureSensor ||
                          elData?.type === ElementType.PressureSensor
                        ) {
                          setTempSensor({
                            id: element,
                            data: (elData as any)?.data,
                            config: (elData as any)?.config,
                          });
                        } else if (elData?.blockType === BlockType.Controller) {
                          setCommonSecondaryControllerDialog({
                            isModalOpen: true,
                            data: (elData as any)?.data,
                            config: (elData as any)?.config,
                            controllerId: elData?.tag,
                            description: elData?.description,
                          });
                        }
                      }}
                    >
                      {elData.component}
                    </div>
                  </div>

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
                        style={{
                          position: "absolute",
                          top: -22,
                          left: "50%",
                          transform: "translateX(-50%)",
                          zIndex: 1000,
                          pointerEvents: "auto",
                        }}
                        className="flex items-center gap-0.5 bg-gray-800 text-white text-xs rounded shadow px-1 py-0.5 select-none"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <button
                          className="w-4 h-4 flex items-center justify-center hover:bg-gray-600 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            changeComponentZ(element, (pos.z ?? 1) + 1);
                          }}
                        >
                          +
                        </button>
                        <span className="min-w-[1.5rem] text-center font-mono">
                          {pos.z ?? 1}
                        </span>
                        <button
                          className="w-4 h-4 flex items-center justify-center hover:bg-gray-600 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            changeComponentZ(
                              element,
                              Math.max(1, (pos.z ?? 1) - 1),
                            );
                          }}
                        >
                          -
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Temp Sensor Secondary Modal */}
      <Dialog
        open={!!tempSensor}
        onOpenChange={(open) => setTempSensor(open ? tempSensor : null)}
      >
        <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>Temperature Sensor {tempSensor?.id}</DialogTitle>
          </VisuallyHidden>
          {tempSensor && (
            <TempSensorSecondaryFaceplate
              data={tempSensor?.data}
              config={tempSensor?.config}
              sensorId={tempSensor?.id!}
              onClose={() => setTempSensor(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Common Secondary Controllers Modal */}
      <Dialog
        open={commonSecondaryControllerDialog.isModalOpen}
        onOpenChange={(open) =>
          setCommonSecondaryControllerDialog({
            isModalOpen: open,
            data: undefined,
            config: undefined,
          })
        }
      >
        <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>
              {commonSecondaryControllerDialog.description}
            </DialogTitle>
          </VisuallyHidden>
          {commonSecondaryControllerDialog.data &&
            commonSecondaryControllerDialog.config &&
            commonSecondaryControllerDialog.controllerId && (
              <SecondaryControllerFaceplate
                data={commonSecondaryControllerDialog.data}
                config={commonSecondaryControllerDialog.config}
                controllerId={commonSecondaryControllerDialog.controllerId}
                onClose={() =>
                  setCommonSecondaryControllerDialog({
                    isModalOpen: false,
                    data: undefined,
                    config: undefined,
                  })
                }
                onModeChange={() => {}}
                onSpChange={() => {}}
                onOutChange={() => {}}
                fromSource="home-screen"
              />
            )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default L2_1520_ACID;
