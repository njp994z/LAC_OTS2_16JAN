import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Layout, Position, FlowEdge } from "./type";

const KNOWN_L1_MARKERS = new Set([
  "FurnaceWhbt", "IPAT", "FAT", "CIP", "DT",
  "1540-PI-4072", "1540-GB-001", "1540-H-4030",
]);

interface LayoutApiRow {
  elementId: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  viewScreen?: string;
}

function apiRowsToLayout(rows: LayoutApiRow[]): Layout {
  const positions: Record<string, Position> = {};
  const edges: FlowEdge[] = [];

  for (const row of rows) {
    if (row.elementId.startsWith("_edge_")) {
      const edgeData = JSON.parse(row.viewScreen || "{}");
      edges.push({
        id: parseInt(row.elementId.replace("_edge_", ""), 10),
        x1: row.positionX,
        y1: row.positionY,
        x2: row.width,
        y2: row.height,
        z: edgeData.z,
        color: edgeData.color || "gray-gradient",
        hasPointer: edgeData.hasPointer ?? false,
        style: edgeData.style,
        from: edgeData.from,
        to: edgeData.to,
      });
    } else {
      positions[row.elementId] = {
        x: row.positionX,
        y: row.positionY,
        z: row.rotation,
        w: row.width,
        h: row.height,
      };
    }
  }

  return { positions, edges };
}

function layoutToApiRows(layout: Layout): LayoutApiRow[] {
  const rows: LayoutApiRow[] = [];

  for (const [elementId, pos] of Object.entries(layout.positions)) {
    rows.push({
      elementId,
      positionX: Math.round(pos.x),
      positionY: Math.round(pos.y),
      width: pos.w ?? 100,
      height: pos.h ?? 100,
      rotation: pos.z ?? 0,
    });
  }

  for (const edge of layout.edges) {
    rows.push({
      elementId: `_edge_${edge.id}`,
      positionX: Math.round(edge.x1),
      positionY: Math.round(edge.y1),
      width: Math.round(edge.x2),
      height: Math.round(edge.y2),
      rotation: 0,
      viewScreen: JSON.stringify({
        z: edge.z,
        color: edge.color,
        hasPointer: edge.hasPointer,
        style: edge.style,
        from: edge.from,
        to: edge.to,
      }),
    });
  }

  return rows;
}

export function useGetLayoutByIdQuery(id: string) {
  const { data, isLoading, isFetching } = useQuery<Layout | undefined>({
    queryKey: ["/api/homescreen-layout", id],
    queryFn: async () => {
      const res = await fetch(`/api/homescreen-layout/${id}`);
      if (!res.ok) return undefined;
      const json = await res.json();
      const rows: LayoutApiRow[] = json.layouts || [];
      if (rows.length === 0) return undefined;
      const layout = apiRowsToLayout(rows);
      if (id === "L1") {
        const hasRecognizedPositions = Object.keys(layout.positions).some(
          (key) => KNOWN_L1_MARKERS.has(key)
        );
        if (!hasRecognizedPositions && layout.edges.length === 0) {
          return undefined;
        }
      }
      return layout;
    },
    staleTime: Infinity,
  });

  return {
    data,
    isLoading,
    isFetching,
    isUninitialized: false,
  };
}

export function useUpdateLayoutMutation(): [
  (args: { id: string; layout: Layout }) => { unwrap: () => Promise<void> },
  { isLoading: boolean }
] {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, layout }: { id: string; layout: Layout }) => {
      const rows = layoutToApiRows(layout);
      await apiRequest("PUT", `/api/homescreen-layout/${id}`, { layouts: rows });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/homescreen-layout", variables.id],
      });
    },
  });

  const wrappedMutate = (args: { id: string; layout: Layout }) => {
    const promise = mutation.mutateAsync(args);
    return {
      unwrap: () => promise,
    };
  };

  return [wrappedMutate, { isLoading: mutation.isPending }];
}
