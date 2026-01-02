import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

//todo: remove mock functionality
interface ProcessNodeProps {
  x: number;
  y: number;
  label: string;
  type: "tank" | "pump" | "reactor" | "valve";
  temp?: number;
  pressure?: number;
  flow?: number;
  status: "active" | "idle" | "warning";
}

function ProcessNode({ x, y, label, type, temp, pressure, flow, status }: ProcessNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const statusColors = {
    active: "hsl(142 65% 45%)",
    idle: "hsl(220 15% 60%)",
    warning: "hsl(38 92% 50%)"
  };
  
  return (
    <g 
      transform={`translate(${x}, ${y})`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer"
    >
      {type === "tank" && (
        <>
          <rect x="-30" y="-40" width="60" height="80" fill="none" stroke={statusColors[status]} strokeWidth="2" />
          <rect x="-30" y="20" width="60" height="20" fill={statusColors[status]} opacity="0.3" />
        </>
      )}
      {type === "reactor" && (
        <circle cx="0" cy="0" r="35" fill="none" stroke={statusColors[status]} strokeWidth="2" />
      )}
      {type === "pump" && (
        <polygon points="0,-20 20,0 0,20 -20,0" fill="none" stroke={statusColors[status]} strokeWidth="2" />
      )}
      {type === "valve" && (
        <>
          <line x1="-15" y1="-15" x2="15" y2="15" stroke={statusColors[status]} strokeWidth="2" />
          <line x1="-15" y1="15" x2="15" y2="-15" stroke={statusColors[status]} strokeWidth="2" />
        </>
      )}
      
      <text y="60" textAnchor="middle" className="fill-foreground text-xs font-mono">
        {label}
      </text>
      
      {isHovered && (temp || pressure || flow) && (
        <g>
          <rect x="40" y="-30" width="120" height="60" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" rx="4" />
          {temp && <text x="50" y="-10" className="fill-foreground text-xs font-mono">T: {temp}°C</text>}
          {pressure && <text x="50" y="5" className="fill-foreground text-xs font-mono">P: {pressure} psi</text>}
          {flow && <text x="50" y="20" className="fill-foreground text-xs font-mono">F: {flow} kg/h</text>}
        </g>
      )}
    </g>
  );
}

export default function ProcessDiagram() {
  //todo: remove mock functionality
  const nodes: ProcessNodeProps[] = [
    { x: 100, y: 150, label: "Feed Tank", type: "tank", temp: 85, pressure: 14.7, flow: 1250, status: "active" },
    { x: 250, y: 150, label: "Pump 1", type: "pump", pressure: 45, flow: 1250, status: "active" },
    { x: 400, y: 150, label: "Reactor 1", type: "reactor", temp: 450, pressure: 120, status: "active" },
    { x: 550, y: 150, label: "Valve 1", type: "valve", flow: 1180, status: "active" },
    { x: 700, y: 150, label: "Reactor 2", type: "reactor", temp: 420, pressure: 115, status: "warning" },
    { x: 700, y: 300, label: "Product Tank", type: "tank", temp: 95, pressure: 15, status: "active" },
  ];
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Process Flow Diagram</h3>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <div className="w-2 h-2 rounded-full bg-[hsl(142_65%_45%)]" />
            <span className="text-xs">Active</span>
          </Badge>
          <Badge variant="outline" className="gap-1">
            <div className="w-2 h-2 rounded-full bg-[hsl(38_92%_50%)]" />
            <span className="text-xs">Warning</span>
          </Badge>
        </div>
      </div>
      
      <div className="bg-muted/30 rounded-md overflow-auto" style={{ height: "400px" }}>
        <svg width="800" height="400" className="min-w-full">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" />
            </marker>
          </defs>
          
          <line x1="130" y1="150" x2="220" y2="150" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="280" y1="150" x2="365" y2="150" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="435" y1="150" x2="520" y2="150" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="580" y1="150" x2="665" y2="150" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="700" y1="185" x2="700" y2="260" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)" />
          
          {nodes.map((node, idx) => (
            <ProcessNode key={idx} {...node} />
          ))}
        </svg>
      </div>
    </Card>
  );
}
