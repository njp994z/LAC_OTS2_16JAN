import { Link, useSearch } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Play, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import expLogo from "@/assets/exp-logo.png";

type SimulationMode = "static" | "dynamic";

interface InputParams {
  airScfm: string;
  sulfurKlbHr: string;
  sulfurTempF: string;
  timeStepSeconds: string;
}

interface StreamData {
  scfmSo2: string;
  scfmSo3: string;
  scfmO2: string;
  scfmN2: string;
  scfmDryTotal: string;
  pctSo2: string;
  pctSo3: string;
  pctO2: string;
  pctN2: string;
  tF: string;
  pInwc: string;
}

interface OutputParams {
  mode: string;
  airScfmGf0: string;
  sulfurKlbHr: string;
  sulfurTempF: string;
  heatReleaseBtuHr: string;
  stream5: StreamData;
  stream6: StreamData;
}

const defaultStream: StreamData = {
  scfmSo2: "---",
  scfmSo3: "---",
  scfmO2: "---",
  scfmN2: "---",
  scfmDryTotal: "---",
  pctSo2: "---",
  pctSo3: "---",
  pctO2: "---",
  pctN2: "---",
  tF: "---",
  pInwc: "---"
};

const defaultOutputs: OutputParams = {
  mode: "---",
  airScfmGf0: "---",
  sulfurKlbHr: "---",
  sulfurTempF: "---",
  heatReleaseBtuHr: "---",
  stream5: { ...defaultStream },
  stream6: { ...defaultStream }
};

const formatValue = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(value)) return "---";
  if (Math.abs(value) >= 1000000) return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (Math.abs(value) >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: decimals });
  return value.toFixed(decimals);
};

const formatStream = (stream: any): StreamData => ({
  scfmSo2: formatValue(stream?.scfm_so2, 0),
  scfmSo3: formatValue(stream?.scfm_so3, 0),
  scfmO2: formatValue(stream?.scfm_o2, 0),
  scfmN2: formatValue(stream?.scfm_n2, 0),
  scfmDryTotal: formatValue(stream?.scfm_dry_total, 0),
  pctSo2: formatValue(stream?.pct_so2, 2),
  pctSo3: formatValue(stream?.pct_so3, 2),
  pctO2: formatValue(stream?.pct_o2, 2),
  pctN2: formatValue(stream?.pct_n2, 2),
  tF: formatValue(stream?.T_f, 0),
  pInwc: formatValue(stream?.P_inwc, 0)
});

export default function SulfurFurnace() {
  const { toast } = useToast();
  const searchString = useSearch();
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>("static");
  const [previousTemp, setPreviousTemp] = useState<number>(2000.0);
  const hasAutoRun = useRef(false);

  const [inputParams, setInputParams] = useState<InputParams>({
    airScfm: "115301",
    sulfurKlbHr: "71.04",
    sulfurTempF: "275",
    timeStepSeconds: "60"
  });

  const [outputParams, setOutputParams] = useState<OutputParams>(defaultOutputs);

  // Parse URL parameters and auto-run simulation if sulfurFlowGpm is provided
  useEffect(() => {
    if (hasAutoRun.current) return;
    
    const params = new URLSearchParams(searchString);
    // Check for sulfurFlowGpm (explicit gpm unit) or fall back to sulfurFlow for backwards compatibility
    const sulfurFlowParam = params.get('sulfurFlowGpm') || params.get('sulfurFlow');
    
    if (sulfurFlowParam) {
      const sulfurFlowGpm = parseFloat(sulfurFlowParam);
      if (!isNaN(sulfurFlowGpm) && sulfurFlowGpm > 0) {
        // Convert sulfur flow from gpm to klb/hr
        // Conversion: sulfur flow (gpm) * SG * 60 min/hr * 8.33 lb/gal / 1000 = klb/hr
        // Molten sulfur SG ≈ 1.8, so: gpm * 1.8 * 60 * 8.33 / 1000 = klb/hr ≈ gpm * 0.8996
        const sulfurKlbHr = (sulfurFlowGpm * 1.8 * 60 * 8.33 / 1000).toFixed(2);
        
        // Calculate air flow from sulfur flow
        // Stoichiometric ratio: approximately 1624 SCFM air per klb/hr sulfur (based on typical plant data)
        const calculatedSulfurKlbHr = parseFloat(sulfurKlbHr);
        const airScfm = Math.round(calculatedSulfurKlbHr * 1624).toString();
        
        // Update input parameters with calculated values
        setInputParams(prev => ({
          ...prev,
          airScfm: airScfm,
          sulfurKlbHr: sulfurKlbHr
        }));
        
        hasAutoRun.current = true;
        
        // Auto-run simulation after a short delay to allow state to update
        setIsRunningSimulation(true);
        setTimeout(async () => {
          try {
            const response = await apiRequest("POST", "/api/sulfur-furnace-simulation", {
              air_scfm: parseFloat(airScfm),
              sulfur_klb_hr: calculatedSulfurKlbHr,
              sulfur_temp_f: 275, // Default inlet temperature
              mode: "static",
              time_step_seconds: 60,
              previous_temp: 2000.0
            });

            const data = await response.json();

            if (data.success) {
              const r = data.results;
              setOutputParams({
                mode: r.mode || "Static",
                airScfmGf0: formatValue(r.air_scfm_gf0, 0),
                sulfurKlbHr: formatValue(r.sulfur_klb_hr, 2),
                sulfurTempF: formatValue(r.sulfur_temp_f, 1),
                heatReleaseBtuHr: formatValue(r.heat_release_btu_hr, 0),
                stream5: formatStream(r.stream5),
                stream6: formatStream(r.stream6)
              });
              
              toast({
                title: "Auto-Calculation Complete",
                description: `Calculated furnace outputs for ${sulfurFlowGpm.toFixed(1)} gpm sulfur flow.`,
              });
            }
          } catch (error) {
            console.error("Auto-simulation error:", error);
          } finally {
            setIsRunningSimulation(false);
          }
        }, 100);
      }
    }
  }, [searchString, toast]);

  const handleInputChange = (field: keyof InputParams, value: string) => {
    setInputParams(prev => ({ ...prev, [field]: value }));
  };

  const runSimulation = async () => {
    setIsRunningSimulation(true);

    try {
      const response = await apiRequest("POST", "/api/sulfur-furnace-simulation", {
        air_scfm: parseFloat(inputParams.airScfm),
        sulfur_klb_hr: parseFloat(inputParams.sulfurKlbHr),
        sulfur_temp_f: parseFloat(inputParams.sulfurTempF),
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
        mode: r.mode || "Static",
        airScfmGf0: formatValue(r.air_scfm_gf0, 0),
        sulfurKlbHr: formatValue(r.sulfur_klb_hr, 2),
        sulfurTempF: formatValue(r.sulfur_temp_f, 1),
        heatReleaseBtuHr: formatValue(r.heat_release_btu_hr, 0),
        stream5: formatStream(r.stream5),
        stream6: formatStream(r.stream6)
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

  const StreamTable = ({ title, stream, testIdPrefix }: { title: string; stream: StreamData; testIdPrefix: string }) => (
    <Card className="mb-4" data-testid={`card-${testIdPrefix}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg" data-testid={`text-${testIdPrefix}-title`}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid={`table-${testIdPrefix}`}>
            <thead>
              <tr className="border-b" data-testid={`row-${testIdPrefix}-header`}>
                <th className="text-left py-2 px-3 font-semibold">Component</th>
                <th className="text-left py-2 px-3 font-semibold">Flow (scfm)</th>
                <th className="text-left py-2 px-3 font-semibold">Vol %</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b" data-testid={`row-${testIdPrefix}-so2`}>
                <td className="py-2 px-3">SO₂</td>
                <td className="py-2 px-3 font-mono"><span className="bg-muted px-2 py-0.5 rounded" data-testid={`value-${testIdPrefix}-scfm-so2`}>{stream.scfmSo2}</span></td>
                <td className="py-2 px-3 font-mono"><span className="bg-muted px-2 py-0.5 rounded" data-testid={`value-${testIdPrefix}-pct-so2`}>{stream.pctSo2}%</span></td>
              </tr>
              <tr className="border-b" data-testid={`row-${testIdPrefix}-so3`}>
                <td className="py-2 px-3">SO₃</td>
                <td className="py-2 px-3 font-mono"><span className="bg-muted px-2 py-0.5 rounded" data-testid={`value-${testIdPrefix}-scfm-so3`}>{stream.scfmSo3}</span></td>
                <td className="py-2 px-3 font-mono"><span className="bg-muted px-2 py-0.5 rounded" data-testid={`value-${testIdPrefix}-pct-so3`}>{stream.pctSo3}%</span></td>
              </tr>
              <tr className="border-b" data-testid={`row-${testIdPrefix}-o2`}>
                <td className="py-2 px-3">O₂</td>
                <td className="py-2 px-3 font-mono"><span className="bg-muted px-2 py-0.5 rounded" data-testid={`value-${testIdPrefix}-scfm-o2`}>{stream.scfmO2}</span></td>
                <td className="py-2 px-3 font-mono"><span className="bg-muted px-2 py-0.5 rounded" data-testid={`value-${testIdPrefix}-pct-o2`}>{stream.pctO2}%</span></td>
              </tr>
              <tr className="border-b" data-testid={`row-${testIdPrefix}-n2`}>
                <td className="py-2 px-3">N₂</td>
                <td className="py-2 px-3 font-mono"><span className="bg-muted px-2 py-0.5 rounded" data-testid={`value-${testIdPrefix}-scfm-n2`}>{stream.scfmN2}</span></td>
                <td className="py-2 px-3 font-mono"><span className="bg-muted px-2 py-0.5 rounded" data-testid={`value-${testIdPrefix}-pct-n2`}>{stream.pctN2}%</span></td>
              </tr>
              <tr className="border-b bg-muted/30" data-testid={`row-${testIdPrefix}-dry-total`}>
                <td className="py-2 px-3 font-medium">Dry Total</td>
                <td className="py-2 px-3 font-mono"><span className="bg-muted px-2 py-0.5 rounded" data-testid={`value-${testIdPrefix}-dry-total`}>{stream.scfmDryTotal}</span></td>
                <td className="py-2 px-3">-</td>
              </tr>
              <tr className="border-b" data-testid={`row-${testIdPrefix}-temp`}>
                <td className="py-2 px-3 font-medium">Temperature</td>
                <td colSpan={2} className="py-2 px-3 font-mono"><span className="bg-muted px-2 py-0.5 rounded" data-testid={`value-${testIdPrefix}-temp`}>{stream.tF} °F</span></td>
              </tr>
              <tr data-testid={`row-${testIdPrefix}-pressure`}>
                <td className="py-2 px-3 font-medium">Pressure</td>
                <td colSpan={2} className="py-2 px-3 font-mono"><span className="bg-muted px-2 py-0.5 rounded" data-testid={`value-${testIdPrefix}-pressure`}>{stream.pInwc} in. w.c.</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background" data-testid="page-sulfur-furnace">
      <header className="border-b bg-card" data-testid="header-sulfur-furnace">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
          <h1 className="text-xl font-semibold" data-testid="text-page-title">Lithium Americas</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
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

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground" data-testid="label-sulfur-temp">Sulfur Inlet Temp (°F)</label>
                <Input
                  type="text"
                  value={inputParams.sulfurTempF}
                  onChange={(e) => handleInputChange("sulfurTempF", e.target.value)}
                  data-testid="input-sulfur-temp-f"
                />
              </div>

              {simulationMode === "dynamic" && (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground" data-testid="label-time-step">Time step (s) - dynamic only</label>
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

        <Card className="mb-6" data-testid="card-summary">
          <CardHeader>
            <CardTitle data-testid="text-summary-title">Simulation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/50 rounded-md" data-testid="summary-mode">
                <div className="text-xs text-muted-foreground">Mode</div>
                <div className="font-semibold" data-testid="value-summary-mode">{outputParams.mode}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-md" data-testid="summary-air">
                <div className="text-xs text-muted-foreground">Air Flow (GF0)</div>
                <div className="font-semibold" data-testid="value-summary-air">{outputParams.airScfmGf0} scfm</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-md" data-testid="summary-sulfur">
                <div className="text-xs text-muted-foreground">Sulfur Feed</div>
                <div className="font-semibold" data-testid="value-summary-sulfur">{outputParams.sulfurKlbHr} Klb/hr</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-md" data-testid="summary-sulfur-temp">
                <div className="text-xs text-muted-foreground">Sulfur Inlet Temp</div>
                <div className="font-semibold" data-testid="value-summary-sulfur-temp">{outputParams.sulfurTempF} °F</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          <StreamTable title="Stream 5 – Furnace Outlet" stream={outputParams.stream5} testIdPrefix="stream5" />
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-md" data-testid="div-notes">
          <p className="text-sm text-muted-foreground" data-testid="text-notes">
            <strong>Notes:</strong>
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
            <li>Assumes complete S → SO₂ combustion with ~1.8% SO₃ formation</li>
            <li>Temperature calibrated to match plant data (~2073°F at base case)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
