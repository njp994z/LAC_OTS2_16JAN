import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Power,
  Search,
  Filter,
  List,
  Table,
} from 'lucide-react';
import { InterlockCard, InterlockData, InterlockStatus, Toggle } from '@/components/InterlockFaceplate';
import { useToast } from '@/hooks/use-toast';

const interlockPages = [
  {
    title: 'Logic List',
    description: 'View interlock conditions and triggers',
    icon: List,
    path: '/settings/interlock-logic/logic-list',
  },
  {
    title: 'Cause & Effect',
    description: 'View detailed logic matrix',
    icon: Table,
    path: '/settings/interlock-logic/spreadsheet-logic',
  },
];

const interlockDefinitions: Omit<InterlockData, 'status' | 'enabled'>[] = [
  { id: "I-000", title: "Emergency Stop (E-STOP)", group: "Safety" },
  { id: "I-101", title: "C-101 Low Level", group: "C-101" },
  { id: "I-102", title: "C-101 High Level", group: "C-101" },
  { id: "I-103", title: "C-102 Sump Low Level", group: "C-102" },
  { id: "I-104", title: "C-102 Sump High Level", group: "C-102" },
  { id: "I-105", title: "C-105 Draw Off Tank Low", group: "C-105" },
  { id: "I-106", title: "C-105 Draw Off Tank High", group: "C-105" },
  { id: "I-107", title: "E-113 Low Level", group: "E-113" },
  { id: "I-108", title: "E-113 High Level", group: "E-113" },
  { id: "I-109", title: "C-104 Sump Low Level", group: "C-104" },
  { id: "I-110", title: "C-104 Sump High Level", group: "C-104" },
  { id: "I-111", title: "C-104 High Pressure", group: "C-104" },
  { id: "I-112", title: "C-105 Sump Low Level", group: "C-105" },
  { id: "I-113", title: "C-105 Sump High Level", group: "C-105" },
  { id: "I-114", title: "C-106 Sump Low Level", group: "C-106" },
  { id: "I-115", title: "C-106 Sump High Level", group: "C-106" },
  { id: "I-116", title: "T-104 Low Level", group: "T-104" },
  { id: "I-117", title: "DE-101 High Temperature", group: "DE-101" },
  { id: "I-118", title: "DE-101 Low Temperature", group: "DE-101" },
  { id: "I-119", title: "Acid High Conductivity", group: "Quality" },
  { id: "I-120", title: "Compressor Discharge High", group: "Compressor" },
  { id: "I-121", title: "Compressor Suction Low", group: "Compressor" },
  { id: "I-122", title: "Compressor Vibration High", group: "Compressor" },
  { id: "I-123", title: "Compressor Bearing Temp High", group: "Compressor" },
  { id: "I-124", title: "Compressor Oil Pressure Low", group: "Compressor" },
  { id: "I-125", title: "Furnace High Temperature", group: "Furnace" },
  { id: "I-126", title: "Furnace Low Temperature", group: "Furnace" },
  { id: "I-127", title: "Furnace Flame Failure", group: "Furnace" },
  { id: "I-128", title: "Converter Pass 1 High Temp", group: "Converter" },
  { id: "I-129", title: "Converter Pass 2 High Temp", group: "Converter" },
  { id: "I-130", title: "Converter Pass 3 High Temp", group: "Converter" },
  { id: "I-131", title: "Converter Pass 4 High Temp", group: "Converter" },
  { id: "I-132", title: "Converter Delta P High", group: "Converter" },
  { id: "I-133", title: "WHB Drum Level Low", group: "WHB" },
  { id: "I-134", title: "WHB Drum Level High", group: "WHB" },
  { id: "I-135", title: "WHB Steam Pressure High", group: "WHB" },
  { id: "I-136", title: "Economizer Outlet Temp High", group: "Economizer" },
  { id: "I-137", title: "Superheater Outlet Temp High", group: "Superheater" },
  { id: "I-138", title: "IPAT Acid Flow Low", group: "IPAT" },
  { id: "I-139", title: "IPAT Acid Temp High", group: "IPAT" },
  { id: "I-140", title: "FAT Acid Flow Low", group: "FAT" },
  { id: "I-141", title: "FAT Acid Temp High", group: "FAT" },
  { id: "I-142", title: "DAT Acid Flow Low", group: "DAT" },
  { id: "I-143", title: "DAT Acid Temp High", group: "DAT" },
  { id: "I-144", title: "Acid Cooler Outlet Temp High", group: "Acid Cooler" },
  { id: "I-145", title: "Acid Cooler Flow Low", group: "Acid Cooler" },
  { id: "I-146", title: "Cooling Water Pressure Low", group: "Utilities" },
  { id: "I-147", title: "Instrument Air Pressure Low", group: "Utilities" },
  { id: "I-148", title: "Plant Air Pressure Low", group: "Utilities" },
  { id: "I-149", title: "BFW Pressure Low", group: "Utilities" },
  { id: "I-150", title: "Steam Header Pressure Low", group: "Utilities" },
  { id: "I-151", title: "Stack SO2 High", group: "Emissions" },
  { id: "I-152", title: "Stack Opacity High", group: "Emissions" },
  { id: "I-153", title: "Sulfur Pit Level High", group: "Sulfur" },
  { id: "I-154", title: "Sulfur Pump Failure", group: "Sulfur" },
  { id: "I-155", title: "Sulfur Gun Plugged", group: "Sulfur" },
  { id: "I-156", title: "Dilution Air Fan Failure", group: "Air System" },
  { id: "I-157", title: "Main Blower Failure", group: "Air System" },
  { id: "I-158", title: "Gas-Gas HX Bypass Open", group: "Heat Exchange" },
  { id: "I-159", title: "Cold Reheat High Temp", group: "Heat Exchange" },
];

type FilterType = "all" | "tripped" | "ok" | "disabled";

export default function InterlockLogic() {
  const [, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [items, setItems] = useState<InterlockData[]>(() =>
    interlockDefinitions.map((def) => ({
      ...def,
      status: def.id === "I-000" ? "tripped" : "ok",
      enabled: true,
    }))
  );
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const effectiveEnabledCount = masterEnabled 
      ? items.filter((i) => i.enabled).length 
      : 0;
    const effectiveTrippedCount = masterEnabled
      ? items.filter((i) => i.enabled && i.status === "tripped").length
      : 0;
    return { enabledCount: effectiveEnabledCount, trippedCount: effectiveTrippedCount, total: items.length };
  }, [items, masterEnabled]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const matchesQ =
        !q ||
        i.id.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        (i.group ?? "").toLowerCase().includes(q);

      const effStatus: InterlockStatus = masterEnabled && i.enabled ? i.status : "disabled";
      const matchesFilter = filter === "all" ? true : effStatus === filter;

      return matchesQ && matchesFilter;
    });
  }, [items, query, filter, masterEnabled]);

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled } : item))
    );
    toast({
      title: enabled ? "Interlock Enabled" : "Interlock Disabled",
      description: `${id} has been ${enabled ? "enabled" : "disabled"}`,
    });
  };

  const handleReset = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "ok" } : item))
    );
    toast({
      title: "Interlock Reset",
      description: `${id} has been reset`,
    });
  };

  const handleResetAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, status: "ok" })));
    toast({
      title: "All Interlocks Reset",
      description: "All tripped interlocks have been reset",
    });
  };

  const handleMasterToggle = (enabled: boolean) => {
    setMasterEnabled(enabled);
    toast({
      title: enabled ? "Master Enabled" : "Master Disabled",
      description: `All interlocks are now ${enabled ? "active" : "bypassed"}`,
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_circle_at_10%_0%,rgba(56,189,248,0.12),transparent_45%),radial-gradient(900px_circle_at_90%_20%,rgba(34,197,94,0.12),transparent_40%),radial-gradient(900px_circle_at_50%_100%,rgba(244,63,94,0.10),transparent_45%)] bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/simulation-settings')}
                className="h-10 w-10 text-white/70 hover:text-white hover:bg-white/10"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <Shield className="h-5 w-5 text-white/80" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-white">Interlocks</h1>
                <p className="text-sm text-white/55">Overview and control of safety interlocks</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-sm text-white/75 ring-1 ring-white/10">
              <AlertTriangle className="h-4 w-4 text-rose-300" />
              Tripped: <span className="font-semibold text-white" data-testid="text-tripped-count">{stats.trippedCount}</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-sm text-white/75 ring-1 ring-white/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Enabled: <span className="font-semibold text-white" data-testid="text-enabled-count">{stats.enabledCount}/{stats.total}</span>
            </span>
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white/85 ring-1 ring-white/10 transition hover:bg-white/15"
              data-testid="button-reset-all"
            >
              <RotateCcw className="h-4 w-4" />
              Reset all
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-white/45 font-mono">
          <span>{currentTime.toLocaleDateString()}</span>
          <span>•</span>
          <span>{currentTime.toLocaleTimeString()}</span>
        </div>

        <div className="mt-6 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur md:grid-cols-[1fr_auto_auto]">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-950/40 px-4 py-3 ring-1 ring-white/10">
            <Search className="h-4 w-4 text-white/55" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search interlocks (e.g., I-111, C-104, pressure)…"
              className="w-full bg-transparent text-sm text-white/85 placeholder:text-white/35 outline-none"
              data-testid="input-search"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/40 px-4 py-3 ring-1 ring-white/10">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Power className="h-4 w-4" />
              Master enable
            </div>
            <Toggle
              checked={masterEnabled}
              onChange={handleMasterToggle}
              ariaLabel="Master enable"
              testId="switch-master-enable"
            />
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-slate-950/40 px-3 py-2 ring-1 ring-white/10">
            <Filter className="h-4 w-4 text-white/55" />
            {(["all", "tripped", "ok", "disabled"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                  filter === k
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white/80"
                }`}
                data-testid={`button-filter-${k}`}
              >
                {k === "all" ? "All" : k[0].toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {interlockPages.map((page) => (
            <Button
              key={page.path}
              variant="default"
              size="sm"
              onClick={() => setLocation(page.path)}
              className="gap-2"
              data-testid={`button-nav-${page.path.split('/').pop()}`}
            >
              <page.icon className="w-4 h-4" />
              {page.title}
            </Button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => (
              <InterlockCard
                key={item.id}
                item={item}
                masterEnabled={masterEnabled}
                onReset={handleReset}
                onToggleEnabled={handleToggleEnabled}
              />
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center"
          >
            <Shield className="mx-auto h-12 w-12 text-white/20" />
            <p className="mt-4 text-sm text-white/50">No interlocks match your search or filter.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
