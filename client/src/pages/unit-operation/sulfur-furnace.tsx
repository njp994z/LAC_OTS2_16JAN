import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Play, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type SimulationMode = "static" | "dynamic";

interface InputParams {
  airScfm: string;
  sulfurKlbHr: string;
  timeStepSeconds: string;
}

interface OutputParams {
  scfmSo2: string;
  scfmO2Out: string;
  scfmN2: string;
  scfmDryTotal: string;
  pctSo2: string;
  pctO2: string;
  pctN2: string;
  tOutF: string;
  tOutC: string;
  pOutInwc: string;
  heatReleaseBtuHr: string;
  massFlowLbHr: string;
}

const defaultOutputs: OutputParams = {
  scfmSo2: "---",
  scfmO2Out: "---",
  scfmN2: "---",
  scfmDryTotal: "---",
  pctSo2: "---",
  pctO2: "---",
  pctN2: "---",
  tOutF: "---",
  tOutC: "---",
  pOutInwc: "---",
  heatReleaseBtuHr: "---",
  massFlowLbHr: "---"
};

export default function SulfurFurnace() {
  const { toast } = useToast();
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>("static");
  const [previousTemp, setPreviousTemp] = useState<number>(2000.0);

  const [inputParams, setInputParams] = useState<InputParams>({
    airScfm: "115301",
    sulfurKlbHr: "67.68",
    timeStepSeconds: "60"
  });

  const [outputParams, setOutputParams] = useState<OutputParams>(defaultOutputs);

  const handleInputChange = (field: keyof InputParams, value: string) => {
    setInputParams(prev => ({ ...prev, [field]: value }));
  };

  const formatValue = (value: number | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(value)) return "---";
    if (Math.abs(value) >= 1000000) return value.toExponential(2);
    if (Math.abs(value) >= 10000) return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return value.toFixed(decimals);
  };

  const runSimulation = async () => {
    setIsRunningSimulation(true);

    try {
      const response = await apiRequest("POST", "/api/sulfur-furnace-simulation", {
        air_scfm: parseFloat(inputParams.airScfm),
        sulfur_klb_hr: parseFloat(inputParams.sulfurKlbHr),
        mode: simulationMode,
        time_step_seconds: parseFloat(inputParams.timeStepSeconds),
        previous_temp: previousTemp
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Simulation failed");
      }

      const r = data.results;

      setOutputParams({
        scfmSo2: formatValue(r.scfm_so2, 0),
        scfmO2Out: formatValue(r.scfm_o2_out, 0),
        scfmN2: formatValue(r.scfm_n2, 0),
        scfmDryTotal: formatValue(r.scfm_dry_total, 0),
        pctSo2: formatValue(r.pct_so2, 2),
        pctO2: formatValue(r.pct_o2, 2),
        pctN2: formatValue(r.pct_n2, 2),
        tOutF: formatValue(r.T_out_f, 0),
        tOutC: formatValue(r.T_out_c, 0),
        pOutInwc: formatValue(r.P_out_inwc, 0),
        heatReleaseBtuHr: formatValue(r.heat_release_btu_hr, 0),
        massFlowLbHr: formatValue(r.mass_flow_lb_hr, 0)
      });

      if (simulationMode === "dynamic" && r.new_temp) {
        setPreviousTemp(r.new_temp);
      }

      toast({
        title: "Simulation Complete",
        description: `${simulationMode === "static" ? "Static" : "Dynamic"} simulation completed successfully.`,
      });
    } catch (error) {
      console.error("Simulation error:", error);
      toast({
        title: "Simulation Error",
        description: error instanceof Error ? error.message : "Failed to run simulation",
        variant: "destructive"
      });
    } finally {
      setIsRunningSimulation(false);
    }
  };

  const resetDynamicState = () => {
    setPreviousTemp(2000.0);
    toast({
      title: "Dynamic State Reset",
      description: "Temperature state reset to initial value (2000°F).",
    });
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-sulfur-furnace">
      <header className="border-b bg-card" data-testid="header-sulfur-furnace">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/unit-operation-simulator">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold" data-testid="text-page-title">Lithium Americas</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4" data-testid="text-simulator-title">Sulfur Furnace Simulator</h2>
          <div className="flex justify-center gap-4 mb-6">
            <Button variant="default" className="gap-2" data-testid="button-documentation">
              <FileText className="w-4 h-4" />
              Documentation
            </Button>
            <Button variant="outline" className="gap-2" data-testid="button-download-codes">
              <Download className="w-4 h-4" />
              Download Codes
            </Button>
          </div>
        </div>

        <Card className="mb-6" data-testid="card-input-controls">
          <CardHeader>
            <CardTitle data-testid="text-input-title">Input Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground" data-testid="label-simulation-mode">Simulation Mode</label>
                <Select
                  value={simulationMode}
                  onValueChange={(value: SimulationMode) => setSimulationMode(value)}
                  data-testid="select-simulation-mode"
                >
                  <SelectTrigger data-testid="trigger-simulation-mode">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static" data-testid="option-static">Static</SelectItem>
                    <SelectItem value="dynamic" data-testid="option-dynamic">Dynamic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground" data-testid="label-air-flow">Air Flow GF0 (scfm dry)</label>
                <Input
                  type="text"
                  value={inputParams.airScfm}
                  onChange={(e) => handleInputChange("airScfm", e.target.value)}
                  data-testid="input-air-scfm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground" data-testid="label-sulfur-flow">Sulfur Flow (Klb/hr)</label>
                <Input
                  type="text"
                  value={inputParams.sulfurKlbHr}
                  onChange={(e) => handleInputChange("sulfurKlbHr", e.target.value)}
                  data-testid="input-sulfur-klb-hr"
                />
              </div>

              {simulationMode === "dynamic" && (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground" data-testid="label-time-step">Time Step (seconds)</label>
                  <Input
                    type="text"
                    value={inputParams.timeStepSeconds}
                    onChange={(e) => handleInputChange("timeStepSeconds", e.target.value)}
                    data-testid="input-time-step"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <Button
                onClick={runSimulation}
                disabled={isRunningSimulation}
                className="gap-2 min-w-[180px]"
                data-testid="button-run-simulation"
              >
                {isRunningSimulation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Run Simulation
              </Button>
              {simulationMode === "dynamic" && (
                <Button
                  variant="outline"
                  onClick={resetDynamicState}
                  data-testid="button-reset-dynamic"
                >
                  Reset Dynamic State
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-simulation-results">
          <CardHeader>
            <CardTitle data-testid="text-results-title">Simulation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-results">
                <thead>
                  <tr className="border-b" data-testid="row-results-header">
                    <th className="text-left py-3 px-4 font-semibold" data-testid="header-parameter">Parameter</th>
                    <th className="text-left py-3 px-4 font-semibold" data-testid="header-value">Value</th>
                    <th className="text-left py-3 px-4 font-semibold" data-testid="header-units">Units</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b" data-testid="row-mode">
                    <td className="py-3 px-4 font-medium" data-testid="label-mode">Mode</td>
                    <td className="py-3 px-4 font-mono" data-testid="value-mode">
                      <span className="bg-muted px-3 py-1 rounded">{simulationMode === "static" ? "Static" : "Dynamic"}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground" data-testid="unit-mode">-</td>
                  </tr>
                  <tr className="border-b" data-testid="row-so2-produced">
                    <td className="py-3 px-4 font-medium" data-testid="label-so2-produced">SO₂ Produced</td>
                    <td className="py-3 px-4 font-mono" data-testid="value-so2-produced">
                      <span className="bg-muted px-3 py-1 rounded">{outputParams.scfmSo2}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground" data-testid="unit-so2-produced">scfm</td>
                  </tr>
                  <tr className="border-b" data-testid="row-dry-gas-total">
                    <td className="py-3 px-4 font-medium" data-testid="label-dry-gas-total">Dry Gas Outlet Total</td>
                    <td className="py-3 px-4 font-mono" data-testid="value-dry-gas-total">
                      <span className="bg-muted px-3 py-1 rounded">{outputParams.scfmDryTotal}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground" data-testid="unit-dry-gas-total">scfm</td>
                  </tr>
                  <tr className="border-b bg-muted/30" data-testid="row-composition-header">
                    <td colSpan={3} className="py-2 px-4 font-semibold" data-testid="label-composition-header">Dry Gas Composition (vol%)</td>
                  </tr>
                  <tr className="border-b" data-testid="row-pct-so2">
                    <td className="py-3 px-4 pl-8" data-testid="label-pct-so2">SO₂</td>
                    <td className="py-3 px-4 font-mono" data-testid="value-pct-so2">
                      <span className="bg-muted px-3 py-1 rounded">{outputParams.pctSo2}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground" data-testid="unit-pct-so2">%</td>
                  </tr>
                  <tr className="border-b" data-testid="row-pct-o2">
                    <td className="py-3 px-4 pl-8" data-testid="label-pct-o2">O₂</td>
                    <td className="py-3 px-4 font-mono" data-testid="value-pct-o2">
                      <span className="bg-muted px-3 py-1 rounded">{outputParams.pctO2}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground" data-testid="unit-pct-o2">%</td>
                  </tr>
                  <tr className="border-b" data-testid="row-pct-n2">
                    <td className="py-3 px-4 pl-8" data-testid="label-pct-n2">N₂</td>
                    <td className="py-3 px-4 font-mono" data-testid="value-pct-n2">
                      <span className="bg-muted px-3 py-1 rounded">{outputParams.pctN2}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground" data-testid="unit-pct-n2">%</td>
                  </tr>
                  <tr className="border-b" data-testid="row-outlet-temp">
                    <td className="py-3 px-4 font-medium" data-testid="label-outlet-temp">Furnace Outlet Temperature</td>
                    <td className="py-3 px-4 font-mono" data-testid="value-outlet-temp">
                      <span className="bg-muted px-3 py-1 rounded">{outputParams.tOutF}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground" data-testid="unit-outlet-temp">°F</td>
                  </tr>
                  <tr className="border-b" data-testid="row-outlet-pressure">
                    <td className="py-3 px-4 font-medium" data-testid="label-outlet-pressure">Estimated Outlet Pressure</td>
                    <td className="py-3 px-4 font-mono" data-testid="value-outlet-pressure">
                      <span className="bg-muted px-3 py-1 rounded">{outputParams.pOutInwc}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground" data-testid="unit-outlet-pressure">in. w.c.</td>
                  </tr>
                  <tr className="border-b" data-testid="row-heat-release">
                    <td className="py-3 px-4 font-medium" data-testid="label-heat-release">Heat Release</td>
                    <td className="py-3 px-4 font-mono" data-testid="value-heat-release">
                      <span className="bg-muted px-3 py-1 rounded">{outputParams.heatReleaseBtuHr}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground" data-testid="unit-heat-release">BTU/hr</td>
                  </tr>
                  <tr data-testid="row-mass-flow">
                    <td className="py-3 px-4 font-medium" data-testid="label-mass-flow">Total Mass Flow</td>
                    <td className="py-3 px-4 font-mono" data-testid="value-mass-flow">
                      <span className="bg-muted px-3 py-1 rounded">{outputParams.massFlowLbHr}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground" data-testid="unit-mass-flow">lb/hr</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-md" data-testid="div-notes">
              <p className="text-sm text-muted-foreground" data-testid="text-notes">
                <strong>Note:</strong> Simplified model — assumes complete S → SO₂ conversion, 
                adiabatic operation, constant average Cp, no minor SO₃.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
