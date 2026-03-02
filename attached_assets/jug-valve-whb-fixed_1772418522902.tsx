import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play, RotateCcw, Settings } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import processFlowDiagram from "@assets/image_1771460875737.png";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface StreamValues {
  so2: number;
  so3: number;
  o2: number;
  n2: number;
  h2o: number;
  h2so4: number;
  total: number;
  pressure: number;
  temperature: number;
}

interface ComputedStreams {
  GF1: StreamValues;   // Stream 5  – Furnace Outlet        (INPUT)
  GB0: StreamValues;   // Stream 6  – WHB Inlet
  GJV0: StreamValues;  // Stream 7  – Jug Valve Bypass Inlet
  GB1: StreamValues;   // Stream 8A – WHB Outlet            (cooled)
  GPV1: StreamValues;  // Stream 8B – Positioner/Damper Outlet
  GP10: StreamValues;  // Stream 9  – Gas Pass 1 Inlet      (mixed)
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const WHB_AREA      = 9800;  // ft²
const WHB_UO        = 16.0;  // BTU / (ft²·°F·hr)
const STEAM_TEMP_F  = 540.7; // saturation temp @ 915 psig
const CP_GAS        = 0.26;  // BTU / (scf·°F) approximate
const WHB_PRESS_DROP = 16;   // in. wc  (H&MB: 196 → 180)

const systemParameters = [
  { label: "Jug Valve Diameter (Inches)",  value: "36.0",  editable: false },
  { label: "Furnace Outlet Diameter (ft)", value: "9.0",   editable: false },
  { label: "WHB HT Area (ft²)",            value: "9800",  editable: false },
  { label: "Barometric P (psia)",          value: "14.3",  editable: false },
  { label: "Weather ZIP Code",             value: "89801", editable: true, key: "zipCode" },
  { label: "WHB Outlet Duct Dia. (ft)",    value: "7.5",   editable: false },
  { label: "Jug Valve Cv_max",             value: "12500", editable: false },
  { label: "WHB Uo (BTU/ft²·°F·hr)",      value: "16.0",  editable: false },
  { label: "WHB Steam Pressure (psig)",    value: "915.0", editable: false },
];

const streams = [
  { id: "GF1",  header: "Stream #5\nFurnace Outlet\n1540-TI-42220ABC\nGF1",  isInput: true  },
  { id: "GB0",  header: "Stream #6\nWaste Heat\nBoiler In\nGB0",              isInput: false },
  { id: "GJV0", header: "Stream #7\nJug Valve\nInlet\nGJV0",                 isInput: false },
  { id: "GB1",  header: "Stream #8A\nWaste Heat\nBoiler Out\nGB1",            isInput: false },
  { id: "GPV1", header: "Stream #8B\nPositioner\nOutlet\nGPV1",              isInput: false },
  { id: "GP10", header: "Stream #9\nGas Pass\n1 Inlet\nGP10",               isInput: false },
];

const rowItems = [
  { param: "SO2",         unit: "scfm"    },
  { param: "SO3",         unit: "scfm"    },
  { param: "O2",          unit: "scfm"    },
  { param: "N2",          unit: "scfm"    },
  { param: "H2O",         unit: "scfm"    },
  { param: "H2SO4",       unit: "scfm"    },
  { param: "TOTAL",       unit: "scfm"    },
  { param: "PRESSURE",    unit: "in. wc." },
  { param: "TEMPERATURE", unit: "F"       },
];

// ─────────────────────────────────────────────────────────────────────────────
// Simulation engine
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Process topology (from PFD / control-loop diagram):
 *
 *   Stream 5 (Furnace Outlet)
 *       │
 *       ├─[Jug Valve bypass %]──► Stream 7 (GJV0, hot bypass) ──────────────────┐
 *       │                                                                         │
 *       └─[WHB path %]──────────► Stream 6 (GB0) ──[WHB cool]──► Stream 8A (GB1)│
 *                                                                      │          │
 *                                                             [Damper / Positioner]
 *                                                                      │          │
 *                                                            Stream 8B (GPV1)     │
 *                                                                      └──────────┤
 *                                                                                 ▼
 *                                                                      Stream 9 (GP10)
 *
 * Jug Valve:
 *   jugBypassFrac = jugOpenPct / 100
 *   0%  → all flow through WHB  (Stream 7 = 0, Stream 6 = Stream 5)
 *   100%→ all flow bypasses WHB (Stream 6 = 0, Stream 7 = Stream 5)
 *
 * Damper / Positioner (WHB hot-side outlet):
 *   Used only at start-up. When 100% open it is transparent:
 *     Stream 8B composition = Stream 8A  (same flows, same temp)
 *     Stream 8B pressure    = Stream 8A  (no extra drop)
 *   When partially closed it adds a small pressure drop only.
 */
function computeAllStreams(
  s5: StreamValues,
  jugOpenPct: number,
  damperOpenPct: number,
): ComputedStreams {

  const jugBypassFrac = Math.min(1, Math.max(0, jugOpenPct  / 100));
  const whbFrac       = 1 - jugBypassFrac;

  // ── Stream 6: WHB Inlet ──────────────────────────────────────────────────
  const s6: StreamValues = {
    so2:         Math.round(s5.so2   * whbFrac),
    so3:         Math.round(s5.so3   * whbFrac),
    o2:          Math.round(s5.o2    * whbFrac),
    n2:          Math.round(s5.n2    * whbFrac),
    h2o:         Math.round(s5.h2o   * whbFrac),
    h2so4:       Math.round(s5.h2so4 * whbFrac),
    total:       Math.round(s5.total * whbFrac),
    pressure:    s5.pressure,
    temperature: s5.temperature,
  };

  // ── Stream 7: Jug Valve Bypass ───────────────────────────────────────────
  const s7: StreamValues = {
    so2:         Math.round(s5.so2   * jugBypassFrac),
    so3:         Math.round(s5.so3   * jugBypassFrac),
    o2:          Math.round(s5.o2    * jugBypassFrac),
    n2:          Math.round(s5.n2    * jugBypassFrac),
    h2o:         Math.round(s5.h2o   * jugBypassFrac),
    h2so4:       Math.round(s5.h2so4 * jugBypassFrac),
    total:       Math.round(s5.total * jugBypassFrac),
    pressure:    s5.pressure,
    temperature: s5.temperature,  // bypass stays hot
  };

  // ── WHB outlet temperature (NTU-effectiveness) ───────────────────────────
  let whbOutletTemp = s5.temperature;
  if (s6.total > 0) {
    const mCp = s6.total * 60 * CP_GAS;           // BTU/(hr·°F)
    const NTU = (WHB_UO * WHB_AREA) / mCp;
    const eff = 1 - Math.exp(-NTU);
    whbOutletTemp = s5.temperature - eff * (s5.temperature - STEAM_TEMP_F);
    whbOutletTemp = Math.max(STEAM_TEMP_F + 10, whbOutletTemp);
  }

  const s8aPress = s5.pressure - WHB_PRESS_DROP;

  // ── Stream 8A: WHB Outlet ────────────────────────────────────────────────
  const s8a: StreamValues = {
    so2:         s6.so2,
    so3:         s6.so3,
    o2:          s6.o2,
    n2:          s6.n2,
    h2o:         s6.h2o,
    h2so4:       s6.h2so4,
    total:       s6.total,
    pressure:    s8aPress,
    temperature: Math.round(whbOutletTemp),
  };

  // ── Stream 8B: Positioner/Damper Outlet ──────────────────────────────────
  // When damper = 100% open → 8B === 8A (no restriction, startup mode)
  // Quadratic throttle pressure drop model (max 5 in.wc when fully closed)
  const damperFrac   = Math.min(1, Math.max(0, damperOpenPct / 100));
  const damperDeltaP = 5 * Math.pow(1 - damperFrac, 2);

  const s8b: StreamValues = {
    so2:         s8a.so2,
    so3:         s8a.so3,
    o2:          s8a.o2,
    n2:          s8a.n2,
    h2o:         s8a.h2o,
    h2so4:       s8a.h2so4,
    total:       s8a.total,
    pressure:    parseFloat((s8aPress - damperDeltaP).toFixed(1)),
    temperature: s8a.temperature,
  };

  // ── Stream 9: Gas Pass 1 Inlet = 8B + 7 ─────────────────────────────────
  const totalFlow9 = s8b.total + s7.total;
  const mixedTemp9 = totalFlow9 > 0
    ? Math.round((s8b.temperature * s8b.total + s7.temperature * s7.total) / totalFlow9)
    : s5.temperature;
  const mixedPress9 = totalFlow9 > 0
    ? parseFloat(((s8b.pressure * s8b.total + s7.pressure * s7.total) / totalFlow9).toFixed(1))
    : s8b.pressure;

  const s9: StreamValues = {
    so2:         s8b.so2   + s7.so2,
    so3:         s8b.so3   + s7.so3,
    o2:          s8b.o2    + s7.o2,
    n2:          s8b.n2    + s7.n2,
    h2o:         s8b.h2o   + s7.h2o,
    h2so4:       s8b.h2so4 + s7.h2so4,
    total:       totalFlow9,
    pressure:    mixedPress9,
    temperature: mixedTemp9,
  };

  return { GF1: s5, GB0: s6, GJV0: s7, GB1: s8a, GPV1: s8b, GP10: s9 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function JugValveWHB() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [jugValveOpening, setJugValveOpening] = useState("10");
  const [damperOpening,   setDamperOpening]   = useState("100");
  const [zipCode,         setZipCode]         = useState("89801");

  // Stream 5 is now a fully editable input stream
  const [stream5Inputs, setStream5Inputs] = useState<Record<string, string>>({
    so2:         "12401",
    so3:         "227",
    o2:          "10261",
    n2:          "86808",
    h2o:         "0",
    h2so4:       "0",
    total:       "109697",
    pressure:    "196",
    temperature: "2080",
  });

  const [results, setResults] = useState<ComputedStreams | null>(null);

  const handleStream5Change = (key: string, value: string) => {
    setStream5Inputs(prev => ({ ...prev, [key]: value }));
  };

  const runCalculation = () => {
    const jugOpen    = parseFloat(jugValveOpening);
    const damperOpen = parseFloat(damperOpening);

    if (isNaN(jugOpen) || isNaN(damperOpen)) {
      toast({ title: "Input Error", description: "Please enter valid numbers for valve percentages.", variant: "destructive" });
      return;
    }
    if (jugOpen < 0 || jugOpen > 100 || damperOpen < 0 || damperOpen > 100) {
      toast({ title: "Input Error", description: "Valve percentages must be between 0 and 100.", variant: "destructive" });
      return;
    }

    const s5: StreamValues = {
      so2:         parseFloat(stream5Inputs.so2)         || 0,
      so3:         parseFloat(stream5Inputs.so3)         || 0,
      o2:          parseFloat(stream5Inputs.o2)          || 0,
      n2:          parseFloat(stream5Inputs.n2)          || 0,
      h2o:         parseFloat(stream5Inputs.h2o)         || 0,
      h2so4:       parseFloat(stream5Inputs.h2so4)       || 0,
      total:       parseFloat(stream5Inputs.total)       || 0,
      pressure:    parseFloat(stream5Inputs.pressure)    || 0,
      temperature: parseFloat(stream5Inputs.temperature) || 0,
    };

    setResults(computeAllStreams(s5, jugOpen, damperOpen));
    toast({ title: "Calculation Complete", description: "Jug valve simulation results updated." });
  };

  const resetCalculation = () => {
    setJugValveOpening("10");
    setDamperOpening("100");
    setZipCode("89801");
    setStream5Inputs({
      so2: "12401", so3: "227", o2: "10261", n2: "86808",
      h2o: "0", h2so4: "0", total: "109697", pressure: "196", temperature: "2080",
    });
    setResults(null);
  };

  const getOutputValue = (param: string, streamId: keyof ComputedStreams): string => {
    if (!results) return "---";
    const val = results[streamId][param.toLowerCase() as keyof StreamValues] as number;
    if (val === undefined) return "---";
    if (param === "PRESSURE") return val.toFixed(1);
    return Math.round(val).toLocaleString();
  };

  const isDamperFullyOpen = parseFloat(damperOpening) >= 100;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/unit-operation-simulator")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold" data-testid="text-page-title">
                Jug Valve, WHB Hot-side, Positioner
              </h1>
            </div>
            <Link href="/settings/controller-outputs/faceplates/valve-blocks/hand-control/1540-hcv-4282/3e">
              <Button variant="outline" className="gap-2" data-testid="button-configure-3e">
                <Settings className="h-4 w-4" />
                Configure (3E)
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* ── System Parameters ────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base" data-testid="text-system-params-title">
              System Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemParameters.map((param, idx) => (
                <div key={idx} className="flex items-center gap-3" data-testid={`param-row-${idx}`}>
                  <Label className="text-sm text-muted-foreground min-w-[180px]">
                    {param.label}
                  </Label>
                  {param.editable ? (
                    <Input
                      value={param.key === "zipCode" ? zipCode : param.value}
                      onChange={(e) => param.key === "zipCode" && setZipCode(e.target.value)}
                      className="w-24 h-8 text-sm"
                      data-testid={`input-${param.key}`}
                    />
                  ) : (
                    <div className="w-24 h-8 px-2 flex items-center bg-muted rounded text-sm">
                      {param.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── System Inputs (valve %s) ──────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base" data-testid="text-system-inputs-title">
              System Inputs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 items-end">
              <div className="flex items-center gap-3" data-testid="input-row-jug-valve">
                <Label className="text-sm text-muted-foreground" data-testid="label-jug-valve-opening">
                  Jug Valve Opening Percentage
                </Label>
                <Input
                  value={jugValveOpening}
                  onChange={(e) => setJugValveOpening(e.target.value)}
                  className="w-20 h-8 text-sm"
                  data-testid="input-jug-valve-opening"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>

              <div className="flex items-center gap-3" data-testid="input-row-damper">
                <Label className="text-sm text-muted-foreground" data-testid="label-damper-opening">
                  Damper (Positioner) Valve Opening
                </Label>
                <Input
                  value={damperOpening}
                  onChange={(e) => setDamperOpening(e.target.value)}
                  className="w-20 h-8 text-sm"
                  data-testid="input-damper-opening"
                />
                <span className="text-sm text-muted-foreground">%</span>
                <span className="text-xs text-amber-500 italic">
                  {isDamperFullyOpen
                    ? "⚡ Start-up mode: Stream 8A = Stream 8B"
                    : "Normal operation"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Simulation Outputs Table ─────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base" data-testid="text-outputs-title">
              Simulation Outputs – Static Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-simulation-outputs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-semibold">Parameter</th>
                    <th className="text-left py-2 px-2 font-semibold">Units</th>
                    {streams.map((stream) => (
                      <th
                        key={stream.id}
                        className={`text-center py-2 px-2 font-semibold whitespace-pre-line ${
                          stream.isInput ? "text-blue-400" : ""
                        }`}
                        data-testid={`header-stream-${stream.id}`}
                      >
                        {stream.header}
                        {stream.isInput && (
                          <div className="text-xs font-normal text-blue-400 mt-0.5">(Input)</div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowItems.map((row) => (
                    <tr key={row.param} className="border-b" data-testid={`row-${row.param}`}>
                      <td className="py-2 px-2 font-medium">{row.param}</td>
                      <td className="py-2 px-2 text-muted-foreground">{row.unit}</td>

                      {streams.map((stream) => (
                        <td
                          key={`${row.param}_${stream.id}`}
                          className="py-2 px-2 text-center"
                          data-testid={`cell-${row.param}-${stream.id}`}
                        >
                          {stream.isInput ? (
                            // Stream 5 — editable inputs
                            <Input
                              value={stream5Inputs[row.param.toLowerCase()] ?? ""}
                              onChange={(e) =>
                                handleStream5Change(row.param.toLowerCase(), e.target.value)
                              }
                              className="w-24 h-8 text-sm text-center border-blue-700 bg-blue-950/20"
                              data-testid={`input-stream5-${row.param}`}
                            />
                          ) : (
                            // Computed output streams
                            <div
                              className="bg-muted rounded px-2 py-1 min-w-[70px] text-center"
                              data-testid={`output-${row.param}-${stream.id}`}
                            >
                              {getOutputValue(row.param, stream.id as keyof ComputedStreams)}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isDamperFullyOpen && results && (
              <p className="mt-3 text-xs text-amber-500/80 italic">
                ℹ️ Damper is 100% open (start-up mode). Stream 8B composition, temperature, and
                pressure are equal to Stream 8A — the damper introduces no restriction.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Buttons ──────────────────────────────────────────────────── */}
        <div className="flex justify-center gap-4">
          <Button onClick={runCalculation} className="min-w-[140px]" data-testid="button-calculate">
            <Play className="w-4 h-4 mr-2" />
            Calculate
          </Button>
          <Button variant="outline" onClick={resetCalculation} className="min-w-[140px]" data-testid="button-reset">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* ── PFD Image ────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-4">
            <img
              src={processFlowDiagram}
              alt="Jug Valve & WHB Process Flow Diagram – Control Loop for Pass 1 Inlet Temperature"
              className="w-full rounded"
              data-testid="img-process-flow-diagram"
            />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
