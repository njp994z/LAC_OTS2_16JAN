interface VerticalLineProps {
  width?: number;
  height?: number;
  color?: string;
  strokeColor?: string;
  className?: string;
}

export function VerticalLine({ 
  width = 24, 
  height = 200, 
  color = "#53A9CD",
  strokeColor = "#0A2F45",
  className = ""
}: VerticalLineProps) {
  const shaftWidth = width * 0.35;
  const centerX = width / 2;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ display: 'block' }}
    >
      <rect
        x={centerX - shaftWidth/2}
        y={2}
        width={shaftWidth}
        height={height - 4}
        fill={color}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      <line 
        x1={centerX - shaftWidth/2} 
        y1={2} 
        x2={centerX + shaftWidth/2} 
        y2={2} 
        stroke={strokeColor} 
        strokeWidth="2"
      />
      <line 
        x1={centerX - shaftWidth/2} 
        y1={height - 2} 
        x2={centerX + shaftWidth/2} 
        y2={height - 2} 
        stroke={strokeColor} 
        strokeWidth="2"
      />
    </svg>
  );
}
