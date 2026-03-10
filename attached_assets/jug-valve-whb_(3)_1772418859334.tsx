/**
 * jug-valve-whb.tsx
 * =================
 * GUI — Jug Valve / WHB Hot-side / Positioner Simulation
 *
 * All process calculations are delegated to the Flask API:
 *   POST /api/jug-valve-simulation
 *
 * Stream 5 (Furnace Outlet) is a fully-editable input stream.
 * Streams 6–9 are computed outputs returned by the API.
 *
 * Damper / Positioner notes
 * -------------------------
 *  - The damper valve sits on the WHB outlet (hot-side), used only at start-up.
 *  - When damper = 100 % open  →  Stream 8B is identical to Stream 8A
 *    (no flow restriction, no extra pressure drop).
 *  - When damper < 100 %       →  quadratic pressure drop applied to Stream 8B
 *    (composition and temperature are unchanged from Stream 8A).
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Button }                            from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input }                             from "@/components/ui/input";
import { Label }                             from "@/components/ui/label";
import { ArrowLeft, Play, RotateCcw, Settings } from "lucide-react";
import { Link }                              from "wouter";
import { useToast }                          from "@/hooks/use-toast";
import processFlowDiagram                    from "@assets/image_1771460875737.png";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Per-stream values returned by the API (keys match Python StreamValues) */
interface StreamValues {
  so2:         number;
  so3:         number;
  o2:          number;
  n2:          number;
  h2o:         number;
  h2so4:       number;
  total:       number;
  pressure:    number;
  temperature: number;
}

/** Full API response — one entry per stream */
interface SimulationResponse {
  GF1:  StreamValues;   // Stream 5  – Furnace Outlet   (echoed input)
  GB0:  StreamValues;   // Stream 6  – WHB Inlet
  GJV0: StreamValues;   // Stream 7  – Jug Valve Bypass Inlet
  GB1:  StreamValues;   // Stream 8A – WHB Outlet
  GPV1: StreamValues;   // Stream 8B – Positioner/Damper Outlet
  GP10: StreamValues;   // Stream 9  – Gas Pass 1 Inlet
}

// ─────────────────────────────────────────────────────────────────────────────
// Static UI data
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = "/api/jug-valve-simulation";

const systemParameters = [
  { label: "Jug Valve Diameter (Inches)",  value: "36.0"  },
  { label: "Furnace Outlet Diameter (ft)", value: "9.0"   },
  { label: "WHB HT Area (ft²)",            value: "9800"  },
  { label: "Barometric P (psia)",          value: "14.3"  },
  { label: "WHB Outlet Duct Dia. (ft)",    value: "7.5"   },
  { label: "Jug Valve Cv_max",             value: "12500" },
  { label: "WHB Uo (BTU/ft²·°F·hr)",      value: "16.0"  },
  { label: "WHB Steam Pressure (psig)",    value: "915.0" },
];

const streams: Array<{ id: keyof SimulationResponse; header: string; isInput: boolean }> = [
  { id: "GF1",  header: "Stream #5\nFurnace Outlet\n1540-TI-42220ABC\nGF1",  isInput: true  },
  { id: "GB0",  header: "Stream #6\nWaste Heat\nBoiler In\nGB0",              isInput: false },
  { id: "GJV0", header: "Stream #7\nJug Valve\nInlet\nGJV0",                 isInput: false },
  { id: "GB1",  header: "Stream #8A\nWaste Heat\nBoiler Out\nGB1",            isInput: false },
  { id: "GPV1", header: "Stream #8B\nPositioner\nOutlet\nGPV1",              isInput: false },
  { id: "GP10", header: "Stream #9\nGas Pass\n1 Inlet\nGP10",               isInput: false },
];

const rowItems: Array<{ param: string; apiKey: keyof StreamValues; unit: string }> = [
  { param: "SO2",         apiKey: "so2",         unit: "scfm"    },
  { param: "SO3",         apiKey: "so3",         unit: "scfm"    },
  { param: "O2",          apiKey: "o2",          unit: "scfm"    },
  { param: "N2",          apiKey: "n2",          unit: "scfm"    },
  { param: "H2O",         apiKey: "h2o",         unit: "scfm"    },
  { param: "H2SO4",       apiKey: "h2so4",       unit: "scfm"    },
  { param: "TOTAL",       apiKey: "total",       unit: "scfm"    },
  { param: "PRESSURE",    apiKey: "pressure",    unit: "in. wc." },
  { param: "TEMPERATURE", apiKey: "temperature", unit: "F"       },
];

/** Default Stream 5 values matching the H&MB baseline */
const DEFAULT_STREAM5: Record<keyof StreamValues, string> = {
  so2:         "12401",
  so3:         "227",
  o2:          "10261",
  n2:          "86808",
  h2o:         "0",
  h2so4:       "0",
  total:       "109697",
  pressure:    "196",
  temperature: "2080",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatValue(val: number, apiKey: keyof StreamValues): string {
  if (apiKey === "pressure") return val.toFixed(1);
  return Math.round(val).toLocaleString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function JugValveWHB() {
  const [, setLocation] = useLocation();
  const { toast }       = useToast();

  // ── Valve inputs ────────────────────────────────────────────────────────────
  const [jugValveOpening, setJugValveOpening] = useState("10");
  const [damperOpening,   setDamperOpening]   = useState("100");
  const [zipCode,         setZipCode]         = useState("89801");

  // ── Stream 5 — editable input stream ────────────────────────────────────────
  const [stream5Inputs, setStream5Inputs] =
    useState<Record<keyof StreamValues, string>>(DEFAULT_STREAM5);

  // ── API state ────────────────────────────────────────────────────────────────
  const [results,       setResults]       = useState<SimulationResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleStream5Change = (key: keyof StreamValues, value: string) =>
    setStream5Inputs(prev => ({ ...prev, [key]: value }));

  const runCalculation = async () => {
    // ── Validate valve %s ──────────────────────────────────────────────────
    const jugOpen    = parseFloat(jugValveOpening);
    const damperOpen = parseFloat(damperOpening);

    if (isNaN(jugOpen) || isNaN(damperOpen)) {
      toast({
        title: "Input Error",
        description: "Please enter valid numbers for valve percentages.",
        variant: "destructive",
      });
      return;
    }
    if (jugOpen < 0 || jugOpen > 100 || damperOpen < 0 || damperOpen > 100) {
      toast({
        title: "Input Error",
        description: "Valve percentages must be between 0 and 100.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);

    try {
      // ── Build API request body ─────────────────────────────────────────
      const body = {
        s5_so2:          parseFloat(stream5Inputs.so2)         || 0,
        s5_so3:          parseFloat(stream5Inputs.so3)         || 0,
        s5_o2:           parseFloat(stream5Inputs.o2)          || 0,
        s5_n2:           parseFloat(stream5Inputs.n2)          || 0,
        s5_h2o:          parseFloat(stream5Inputs.h2o)         || 0,
        s5_h2so4:        parseFloat(stream5Inputs.h2so4)       || 0,
        s5_total:        parseFloat(stream5Inputs.total)       || 0,
        s5_pressure:     parseFloat(stream5Inputs.pressure)    || 0,
        s5_temperature:  parseFloat(stream5Inputs.temperature) || 0,
        jug_open_pct:    jugOpen,
        damper_open_pct: damperOpen,
      };

      // ── Call Flask API ─────────────────────────────────────────────────
      const response = await fetch(API_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${response.status}`);
      }

      const data: SimulationResponse = await response.json();
      setResults(data);

      toast({
        title:       "Calculation Complete",
        description: "Jug valve simulation results updated.",
      });
    } catch (error) {
      toast({
        title:       "Calculation Error",
        description: error instanceof Error ? error.message : "Failed to run simulation.",
        variant:     "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const resetCalculation = () => {
    setJugValveOpening("10");
    setDamperOpening("100");
    setZipCode("89801");
    setStream5Inputs(DEFAULT_STREAM5);
    setResults(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Display helpers
  // ─────────────────────────────────────────────────────────────────────────

  const getOutputValue = (
    apiKey: keyof StreamValues,
    streamId: keyof SimulationResponse,
  ): string => {
    if (!results) return "---";
    return formatValue(results[streamId][apiKey], apiKey);
  };

  const isDamperFullyOpen = parseFloat(damperOpening) >= 100;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
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

        {/* ── System Parameters (read-only display) ────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base" data-testid="text-system-params-title">
              System Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemParameters.map((param, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3"
                  data-testid={`param-row-${idx}`}
                >
                  <Label className="text-sm text-muted-foreground min-w-[200px]">
                    {param.label}
                  </Label>
                  <div className="w-24 h-8 px-2 flex items-center bg-muted rounded text-sm">
                    {param.value}
                  </div>
                </div>
              ))}

              {/* ZIP Code — only editable system param */}
              <div className="flex items-center gap-3" data-testid="param-row-zip">
                <Label className="text-sm text-muted-foreground min-w-[200px]">
                  Weather ZIP Code
                </Label>
                <Input
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-24 h-8 text-sm"
                  data-testid="input-zipCode"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── System Inputs — valve positions ──────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base" data-testid="text-system-inputs-title">
              System Inputs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 items-center">

              {/* Jug Valve */}
              <div className="flex items-center gap-3" data-testid="input-row-jug-valve">
                <Label
                  className="text-sm text-muted-foreground"
                  data-testid="label-jug-valve-opening"
                >
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

              {/* Damper / Positioner */}
              <div className="flex items-center gap-3" data-testid="input-row-damper">
                <Label
                  className="text-sm text-muted-foreground"
                  data-testid="label-damper-opening"
                >
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
                    ? "⚡ Start-up mode — Stream 8A = Stream 8B"
                    : "Normal operation"}
                </span>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ── Simulation Outputs Table ──────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base" data-testid="text-outputs-title">
              Simulation Outputs — Static Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-simulation-outputs">

                {/* Column headers */}
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
                          <div className="text-xs font-normal text-blue-400 mt-0.5">
                            (Input)
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Data rows */}
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
                            /* Stream 5 — editable input fields */
                            <Input
                              value={stream5Inputs[row.apiKey]}
                              onChange={(e) =>
                                handleStream5Change(row.apiKey, e.target.value)
                              }
                              className="w-24 h-8 text-sm text-center border-blue-700 bg-blue-950/20"
                              data-testid={`input-stream5-${row.param}`}
                            />
                          ) : (
                            /* Computed output streams */
                            <div
                              className="bg-muted rounded px-2 py-1 min-w-[70px] text-center"
                              data-testid={`output-${row.param}-${stream.id}`}
                            >
                              {getOutputValue(row.apiKey, stream.id)}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

            {/* Start-up mode notice */}
            {isDamperFullyOpen && results && (
              <p className="mt-3 text-xs text-amber-500/80 italic">
                ℹ️ Damper is 100 % open (start-up mode). Stream 8B composition,
                temperature, and pressure are equal to Stream 8A — the damper
                introduces no flow restriction.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Action Buttons ────────────────────────────────────────────── */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={runCalculation}
            disabled={isCalculating}
            className="min-w-[140px]"
            data-testid="button-calculate"
          >
            <Play className="w-4 h-4 mr-2" />
            {isCalculating ? "Calculating…" : "Calculate"}
          </Button>
          <Button
            variant="outline"
            onClick={resetCalculation}
            className="min-w-[140px]"
            data-testid="button-reset"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* ── Process Flow Diagram ──────────────────────────────────────── */}
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
