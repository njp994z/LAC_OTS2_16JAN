interface VerticalArrowProps {
  width?: number;
  height?: number;
  color?: string;
  strokeColor?: string;
  className?: string;
}

export function VerticalArrow({ 
  width = 24, 
  height = 200, 
  color = "#53A9CD",
  strokeColor = "#0A2F45",
  className = ""
}: VerticalArrowProps) {
  // Thinner shaft to match the image (roughly 30% of width)
  const shaftWidth = width * 0.35;
  // Arrow head proportions
  const arrowHeadWidth = width * 0.85;
  const arrowHeadHeight = width * 0.8;
  const centerX = width / 2;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ display: 'block' }}
    >
      <polygon
        points={`
          ${centerX},0
          ${centerX + arrowHeadWidth/2},${arrowHeadHeight}
          ${centerX + shaftWidth/2},${arrowHeadHeight}
          ${centerX + shaftWidth/2},${height - 2}
          ${centerX - shaftWidth/2},${height - 2}
          ${centerX - shaftWidth/2},${arrowHeadHeight}
          ${centerX - arrowHeadWidth/2},${arrowHeadHeight}
        `}
        fill={color}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="miter"
      />
      {/* Bottom line to match the "end of the arrow" styling in the screenshot */}
      <line 
        x1={centerX - shaftWidth/2} 
        y1={height - 1} 
        x2={centerX + shaftWidth/2} 
        y2={height - 1} 
        stroke={strokeColor} 
        strokeWidth="2"
      />
    </svg>
  );
}
