interface CarHoodUpIconProps {
  className?: string;
}

export function CarHoodUpIcon({ className }: CarHoodUpIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Car body */}
      <path d="M3 14h18v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4z" />
      {/* Hood raised at angle */}
      <path d="M5 14V9l3-4h8l1 2" />
      {/* Hood prop/open hood */}
      <path d="M17 7l2 7" />
      <path d="M8 5l9 2" />
      {/* Engine block visible */}
      <rect x="7" y="8" width="6" height="4" rx="0.5" />
      {/* Engine details */}
      <path d="M8.5 9v2" />
      <path d="M10 9v2" />
      <path d="M11.5 9v2" />
      {/* Wheels */}
      <circle cx="6" cy="18" r="1.5" />
      <circle cx="18" cy="18" r="1.5" />
      {/* Wrench/tool */}
      <path d="M15 3l1.5 1.5-3 3L12 6l3-3z" />
    </svg>
  );
}
