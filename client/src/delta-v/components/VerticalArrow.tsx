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
  color = "#6BB8D4",
  strokeColor = "#073B63",
  className = ""
}: VerticalArrowProps) {
  const shaftWidth = width * 0.55;
  const arrowHeadWidth = width * 0.95;
  const arrowHeadHeight = width * 0.6;
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
          ${centerX + shaftWidth/2},${height}
          ${centerX - shaftWidth/2},${height}
          ${centerX - shaftWidth/2},${arrowHeadHeight}
          ${centerX - arrowHeadWidth/2},${arrowHeadHeight}
        `}
        fill={color}
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
