import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Shield, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type InterlockStatus = "ok" | "tripped" | "disabled";

export interface InterlockData {
  id: string;
  title: string;
  group?: string;
  status: InterlockStatus;
  enabled: boolean;
}

interface StatusPillProps {
  status: InterlockStatus;
}

function StatusPill({ status }: StatusPillProps) {
  const config = {
    ok: {
      label: "OK",
      icon: <CheckCircle2 className="h-4 w-4" />,
      cls: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20",
    },
    tripped: {
      label: "Tripped",
      icon: <AlertTriangle className="h-4 w-4" />,
      cls: "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/25",
    },
    disabled: {
      label: "Disabled",
      icon: <Shield className="h-4 w-4" />,
      cls: "bg-slate-500/10 text-slate-300 ring-1 ring-slate-500/20",
    },
  }[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.cls
      )}
      data-testid={`status-pill-${status}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  testId?: string;
}

function Toggle({ checked, onChange, disabled, ariaLabel, testId }: ToggleProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      data-testid={testId}
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full transition",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        checked ? "bg-emerald-500/80" : "bg-slate-700"
      )}
    >
      <span
        className={cn(
          "inline-block h-6 w-6 transform rounded-full bg-white/90 shadow-sm transition",
          checked ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  );
}

interface InterlockCardProps {
  item: InterlockData;
  masterEnabled: boolean;
  onReset: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
}

export function InterlockCard({
  item,
  masterEnabled,
  onReset,
  onToggleEnabled,
}: InterlockCardProps) {
  const [isResetting, setIsResetting] = useState(false);
  const isEmergency = item.id === "I-000";
  const effectiveEnabled = masterEnabled && item.enabled;
  const effectiveStatus: InterlockStatus = effectiveEnabled ? item.status : "disabled";

  const accent =
    effectiveStatus === "tripped"
      ? "from-rose-500/20 to-rose-500/0"
      : effectiveStatus === "ok"
      ? "from-emerald-500/20 to-emerald-500/0"
      : "from-slate-500/20 to-slate-500/0";

  const handleReset = () => {
    setIsResetting(true);
    onReset(item.id);
    setTimeout(() => setIsResetting(false), 500);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur",
        isEmergency && "md:col-span-2 lg:col-span-3"
      )}
      data-testid={`faceplate-${item.id}`}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", accent)} />
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold text-white/90"
                data-testid={`text-interlock-id-${item.id}`}
              >
                {item.id}
              </span>
              <StatusPill status={effectiveStatus} />
            </div>
            <div
              className="mt-1 truncate text-sm text-white/70"
              data-testid={`text-interlock-title-${item.id}`}
            >
              {item.title}
            </div>
            {item.group && (
              <div className="mt-2 text-xs text-white/45">Group: {item.group}</div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Toggle
              ariaLabel={`Enable ${item.id}`}
              checked={item.enabled}
              onChange={(v) => onToggleEnabled(item.id, v)}
              disabled={!masterEnabled}
              testId={`switch-enable-${item.id}`}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={!masterEnabled || item.status !== "tripped" || isResetting}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
              !masterEnabled || item.status !== "tripped"
                ? "bg-white/5 text-white/35 cursor-not-allowed"
                : "bg-white/10 text-white/80 hover:bg-white/15"
            )}
            data-testid={`button-reset-${item.id}`}
          >
            <RotateCcw className={cn("h-4 w-4", isResetting && "animate-spin")} />
            Reset
          </button>

          <div className="text-xs text-white/45">
            {masterEnabled
              ? item.enabled
                ? "Interlock enabled"
                : "Interlock disabled"
              : "Master disabled"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { StatusPill, Toggle };
