interface VerticalArrowProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function VerticalArrow({ 
  width = 24, 
  height = 200, 
  color = "#53B1D8",
  className = ""
}: VerticalArrowProps) {
  const arrowHeadSize = Math.min(width * 0.8, 16);
  const shaftWidth = Math.max(width * 0.3, 4);
  const centerX = width / 2;
  const arrowHeadHeight = arrowHeadSize * 1.2;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="verticalArrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#073B63" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#073B63" />
        </linearGradient>
      </defs>
      
      <polygon
        points={`
          ${centerX},0
          ${centerX + arrowHeadSize/2},${arrowHeadHeight}
          ${centerX + shaftWidth/2},${arrowHeadHeight}
          ${centerX + shaftWidth/2},${height}
          ${centerX - shaftWidth/2},${height}
          ${centerX - shaftWidth/2},${arrowHeadHeight}
          ${centerX - arrowHeadSize/2},${arrowHeadHeight}
        `}
        fill={color}
        stroke="#073B63"
        strokeWidth="1"
      />
    </svg>
  );
}
