export interface KPPData {
  plantRate?: number | null;
  pass1Strength?: number | null;
  conversion?: number | null;
  o2TailGas?: number | null;
  emissions?: number | null;
  steamGen?: number | null;
  grossPowerMW?: number | null;
  powerRatio?: number | null;
}

function FaceplateRow({ label, value, unit, testId }: { label: string; value: string; unit: string; testId: string }) {
  return (
    <div className="flex items-baseline justify-between gap-1.5 py-1 border-b border-gray-200 dark:border-gray-700 last:border-0" data-testid={testId}>
      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{label}:</span>
      <span className="text-xs font-bold font-mono text-blue-700 dark:text-blue-400 whitespace-nowrap">{value} {unit}</span>
    </div>
  );
}

function fmt(val: number | null | undefined, decimals: number, placeholder: string): string {
  if (val == null || isNaN(val)) return placeholder;
  if (decimals === 0) return Math.round(val).toLocaleString();
  return val.toFixed(decimals);
}

export function KPPFaceplate({ data, className }: { data: KPPData | null; className?: string }) {
  return (
    <div
      className={`rounded-md border-[3px] border-green-500 dark:border-green-600 bg-white dark:bg-gray-900 p-3 shadow-sm max-w-[280px] ${className ?? ""}`}
      data-testid="faceplate-kpp"
    >
      <h3 className="text-center text-sm font-bold text-gray-900 dark:text-gray-100 mb-2" data-testid="text-faceplate-title">
        Key Performance Parameters
      </h3>
      <div className="space-y-0">
        <FaceplateRow label="Plant Rate" value={fmt(data?.plantRate, 0, "----")} unit="STPD" testId="faceplate-plant-rate" />
        <FaceplateRow label="Pass 1 Strength" value={fmt(data?.pass1Strength, 1, "--.-")} unit="% SO2" testId="faceplate-pass1" />
        <FaceplateRow label="SO2 Conversion" value={fmt(data?.conversion, 3, "--.---")} unit="%" testId="faceplate-conversion" />
        <FaceplateRow label="O2 Tail Gas" value={fmt(data?.o2TailGas, 1, "-.-")} unit="%" testId="faceplate-o2-tail" />
        <FaceplateRow label="Emissions" value={fmt(data?.emissions, 1, "--")} unit="lb/STPD" testId="faceplate-emissions" />
        <FaceplateRow label="Steam Gen." value={fmt(data?.steamGen, 0, "----")} unit="ST/ST" testId="faceplate-steam" />
        <FaceplateRow label="Gross Power Gen." value={fmt(data?.grossPowerMW, 2, "--.--")} unit="MW" testId="faceplate-power" />
        <FaceplateRow label="Specific Power Output" value={fmt(data?.powerRatio, 0, "---")} unit="KW/STPH" testId="faceplate-power-ratio" />
      </div>
    </div>
  );
}
