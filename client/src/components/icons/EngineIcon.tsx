interface EngineIconProps {
  className?: string;
}

export function EngineIcon({ className }: EngineIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      {/* Check engine light style icon */}
      <path d="M7 4h2v2H7V4zm8 0h2v2h-2V4zM5 7h14v2h2v6h-2v2H5v-2H3V9h2V7zm2 2v6h10V9H7zm1 1h2v4H8v-4zm3 0h2v4h-2v-4zm3 0h2v4h-2v-4zM7 18h2v2H7v-2zm8 0h2v2h-2v-2z" />
    </svg>
  );
}
