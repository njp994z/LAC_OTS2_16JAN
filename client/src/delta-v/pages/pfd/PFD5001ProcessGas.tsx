import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, ChevronDown, Play, Settings, Loader2, Code, Download, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PFDNavigation } from "../../components/PFDNavigation";
import { useToast } from "@/hooks/use-toast";
import processGasDiagram from "@assets/image_1769045383009.png";

const spInputCases = [
  { id: "current-static", label: "Current Static", description: "Live Plant Orchestrator (Static)", caseNum: 0 },
  { id: "current-dynamic", label: "Current Dynamic", description: "Live Plant Orchestrator (Dynamic)", caseNum: 0 },
  { id: "case1", label: "Case 1", description: "SP_2480 STPD - Clean", caseNum: 1 },
  { id: "case2", label: "Case 2", description: "SP_2480 STPD - Dirty", caseNum: 2 },
  { id: "case3", label: "Case 3", description: "SP_1100 STPD - Clean", caseNum: 3 },
  { id: "case4", label: "Case 4", description: "SP_1100 STPD - Dirty", caseNum: 4 },
];

interface StreamResult {
  SO2: number;
  SO3: number;
  O2: number;
  N2: number;
  H2O: number;
  H2SO4: number;
  total: number;
  pressure: number;
  temperature: number;
}

const streamDataPart1 = {
  headers: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"],
  rows: [
    { component: "SO2", unit: "SCFM", values: [0, 0, 0, 0, 13020, 12369, 651, 12369, 13020, 4900, 4900, 1416, 1416, 518] },
    { component: "SO3", unit: "SCFM", values: [0, 0, 0, 0, 239, 227, 12, 227, 239, 8360, 8360, 11844, 11844, 12742] },
    { component: "O2", unit: "SCFM", values: [24153, 24153, 24153, 24153, 10774, 10235, 539, 10235, 10774, 6713, 6713, 4971, 4971, 4522] },
    { component: "N2", unit: "SCFM", values: [91148, 91148, 91148, 91148, 91148, 86591, 4557, 86591, 91148, 91148, 91148, 91148, 91148, 91148] },
    { component: "H2O", unit: "SCFM", values: [2098, 2098, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { component: "Total", unit: "SCFM", values: [117400, 117400, 115301, 115301, 115182, 109422, 5759, 109422, 115182, 111121, 111121, 109379, 109379, 108930] },
    { component: "PRESSURE", unit: "IN W.C.", values: [0, -2, -13, 186, 176, 176, 176, 159, 158, 154, 144, 139, 125, 119] },
    { component: "TEMPERATURE", unit: "°F", values: [93, 93, 150, 254, 2073, 2073, 2073, 706, 779, 1145, 806, 964, 806, 847] },
  ],
};

const streamDataPart2 = {
  headers: ["15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27"],
  rows: [
    { component: "SO2", unit: "SCFM", values: [518, 518, 518, 518, 19, 19, 19, 19, 19, 0, 0.65, 0, 0] },
    { component: "SO3", unit: "SCFM", values: [12742, 12742, 0, 0, 0, 498, 498, 498, 498, 0, 0, 0, 0] },
    { component: "O2", unit: "SCFM", values: [4522, 4522, 4522, 4522, 4522, 4273, 4273, 4273, 4273, 4273, 4378, 115, 115] },
    { component: "N2", unit: "SCFM", values: [91148, 91148, 91148, 91148, 91148, 91148, 91148, 91148, 91148, 91148, 91581, 432, 432] },
    { component: "H2O", unit: "SCFM", values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3594, 10, 41] },
    { component: "Total", unit: "SCFM", values: [108930, 108930, 96188, 96188, 96188, 95939, 95939, 95939, 95939, 95440, 99554, 557, 588] },
    { component: "PRESSURE", unit: "IN W.C.", values: [106, 96, 73, 64, 54, 49, 40, 37, 33, 17, 0, 0, 343] },
    { component: "TEMPERATURE", unit: "°F", values: [547, 330, 180, 573, 779, 809, 641, 460, 275, 172, 76, 93, 120] },
  ],
};

const sulfurStreamData = {
  headers: ["50A", "50B", "50C"],
  equipmentLabels: [
    { name: "Sulfur Pump", type: "Outlet" },
    { name: "Control Valve", type: "Inlet" },
    { name: "Sulfur Spray Nozzle", type: "Inlet" },
  ],
  instrumentTags: ["1540-PI-2600", "1540-FIC-2602", "1540-PI-2604"],
  rows: [
    { label: "FLUID", values: ["Sulfur", "Sulfur", "Sulfur"] },
    { label: "FLOW", unit: "LB/MIN", values: ["--", "--", "--"] },
    { label: "FLOW", unit: "GPM", values: ["--", "--", "--"] },
    { label: "TEMPERATURE", unit: "°F", values: ["275", "275", "275"] },
    { label: "PRESSURE", unit: "PSIG", values: ["--", "--", "--"] },
  ],
};

function SulfurStreamTable({ data, title }: { data: typeof sulfurStreamData; title: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse" data-testid={`table-${title}`}>
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-2 bg-muted font-semibold min-w-[120px]">STREAM NUMBER</th>
            <th className="text-left p-2 bg-muted font-semibold min-w-[60px]"></th>
            {data.headers.map((h) => (
              <th key={h} className="text-center p-2 bg-muted font-semibold min-w-[100px]">{h}</th>
            ))}
          </tr>
          <tr className="border-b border-border">
            <th className="text-left p-2 bg-muted/50 font-medium" rowSpan={2}></th>
            <th className="text-left p-2 bg-muted/50 font-medium" rowSpan={2}></th>
            {data.equipmentLabels.map((eq, i) => (
              <th key={`equip-${i}`} className="text-center p-2 bg-muted/50">
                <div className="font-semibold">{eq.name}</div>
                <div className="text-muted-foreground font-normal">{eq.type}</div>
              </th>
            ))}
          </tr>
          <tr className="border-b border-border">
            {data.instrumentTags.map((tag, i) => (
              <th key={`tag-${i}`} className="text-center p-2 bg-muted/50 text-muted-foreground font-normal">{tag}</th>
            ))}
          </tr>
          <tr className="border-b border-border">
            <th className="text-left p-2 bg-muted/50 font-medium">COMPONENT</th>
            <th className="text-left p-2 bg-muted/50 font-medium"></th>
            {data.headers.map((h) => (
              <th key={`blank-${h}`} className="p-2 bg-muted/50"></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, idx) => (
            <tr key={`${row.label}-${row.unit || idx}`} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
              <td className="p-2 font-medium">{row.label}</td>
              <td className="p-2 text-muted-foreground">{row.unit || ""}</td>
              {row.values.map((val, i) => (
                <td key={i} className="p-2 text-center tabular-nums min-w-[100px]">{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StreamTable({ headers, rows, title, showValues }: { headers: string[]; rows: typeof streamDataPart1.rows; title: string; showValues: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse" data-testid={`table-${title}`}>
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-2 bg-muted font-semibold sticky left-0 z-10 min-w-[120px]">STREAM NUMBER</th>
            <th className="text-left p-2 bg-muted font-semibold min-w-[60px]"></th>
            {headers.map((h) => (
              <th key={h} className="text-center p-2 bg-muted font-semibold min-w-[70px]">{h}</th>
            ))}
          </tr>
          <tr className="border-b border-border">
            <th className="text-left p-2 bg-muted/50 font-medium sticky left-0 z-10">COMPONENT</th>
            <th className="text-left p-2 bg-muted/50 font-medium"></th>
            {headers.map((h) => (
              <th key={`blank-${h}`} className="p-2 bg-muted/50"></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.component} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
              <td className="p-2 font-medium sticky left-0 z-10 bg-inherit">{row.component}</td>
              <td className="p-2 text-muted-foreground">{row.unit}</td>
              {row.values.map((val, i) => (
                <td key={i} className="p-2 text-center tabular-nums">
                  {showValues ? (typeof val === 'number' ? val.toLocaleString() : val) : "--"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PFD5001ProcessGas() {
  const id = "5001";
  const documentNumber = "1540-PR-PFD-0000-EXP-5001";
  const title = "PROCESS GAS";
  const [selectedCase, setSelectedCase] = useState(spInputCases[0]);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [calculatedStreams, setCalculatedStreams] = useState<{
    stream1: StreamResult;
    stream2: StreamResult;
    stream3: StreamResult;
    stream4: StreamResult;
  } | null>(null);
  const [orchestratorStreams, setOrchestratorStreams] = useState<Record<string, {
    SO2: number; SO3: number; O2: number; N2: number; H2O: number;
    H2SO4: number; TOTAL: number; PRESSURE: number; TEMPERATURE: number;
  }> | null>(null);
  const { toast } = useToast();

  const isOrchestratorCase = (caseId: string) =>
    caseId === "current-static" || caseId === "current-dynamic";

  const abortControllerRef = useRef<AbortController | null>(null);

  const simulateForCase = useCallback(async (spCase: typeof spInputCases[0], silent = false) => {
    if (!silent) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
    const controller = silent ? new AbortController() : (() => {
      const c = new AbortController();
      abortControllerRef.current = c;
      return c;
    })();

    if (!silent) setIsSimulating(true);
    try {
      if (isOrchestratorCase(spCase.id)) {
        const mode = spCase.id === "current-static" ? "static" : "dynamic";

        const [pvRes, spRes] = await Promise.all([
          fetch('/api/process-variables', { signal: controller.signal }),
          fetch('/api/setpoint-variables', { signal: controller.signal }),
        ]);
        const pvData = await pvRes.json();
        const spData = await spRes.json();

        let rpmPercent = 78.5;
        let inletTemp = 70;
        let barometricPressure = 0.850;
        let plantCondition = "clean";
        let sulfurFlowGpm = 72;
        let jugValvePct = 4.5;
        let damperOpenPct = 100;
        const caseId = "case1";

        const extractCaseValue = (variables: any[], tagPatterns: string[]): number | null => {
          if (!variables) return null;
          for (const pattern of tagPatterns) {
            const lowerPattern = pattern.toLowerCase();
            const variable = variables.find((v: any) =>
              v.tag === pattern ||
              v.tagNumber === pattern ||
              v.tag?.toLowerCase().includes(lowerPattern) ||
              v.description?.toLowerCase().includes(lowerPattern)
            );
            if (variable?.cases?.[caseId]) {
              const val = parseFloat(String(variable.cases[caseId]).replace(/[^0-9.-]/g, ''));
              if (!isNaN(val)) return val;
            }
          }
          return null;
        };

        if (pvData?.variables) {
          const rpmVal = extractCaseValue(pvData.variables, ['1540-H-4030', 'main_comp', 'compressor']);
          if (rpmVal !== null) rpmPercent = rpmVal;
          const tempVal = extractCaseValue(pvData.variables, ['Ambient Temperature', 'dt_inlet_temp', 'TI-4', 'inlet temp']);
          if (tempVal !== null) inletTemp = tempVal;
          const baroVal = extractCaseValue(pvData.variables, ['Ambient Pressure', 'ambient_pressure', 'barometric']);
          if (baroVal !== null) barometricPressure = baroVal;
          const plantVar = pvData.variables.find((v: any) =>
            v.tag?.includes('plant_condition') || v.description?.toLowerCase().includes('plant condition')
          );
          if (plantVar?.cases?.[caseId]) {
            const val = String(plantVar.cases[caseId]).toLowerCase();
            if (val === 'dirty' || val === 'clean') plantCondition = val;
          }
          const sulfurVal = extractCaseValue(pvData.variables, ['1530-F-2602', 'sulfur_flow', 'sulfur flow']);
          if (sulfurVal !== null) sulfurFlowGpm = sulfurVal;
          const jugVal = extractCaseValue(pvData.variables, ['1540-H-4282', 'jug_valve', 'jug valve']);
          if (jugVal !== null) jugValvePct = jugVal;
          const damperVal = extractCaseValue(pvData.variables, ['1540-H-4283', 'damper', 'whb_dp']);
          if (damperVal !== null) damperOpenPct = damperVal;
        }
        if (spData?.variables) {
          const rpmSpVal = extractCaseValue(spData.variables, ['main_comp_speed_sp', '1540-H-4030']);
          if (rpmSpVal !== null && rpmPercent === 78.5) rpmPercent = rpmSpVal;
        }

        const orchInput = {
          compressor_rpm_pct: rpmPercent,
          barometric_atm: barometricPressure,
          plant_condition: plantCondition,
          sulfur_flow_sp_gpm: sulfurFlowGpm,
          jug_valve_pct: jugValvePct,
          damper_open_pct: damperOpenPct,
          dt_acid_inlet_temp_F: inletTemp,
          mode,
        };

        const response = await fetch('/api/plant-orchestrator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orchInput),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Plant orchestrator simulation failed');
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Orchestrator returned an error');
        }
        setOrchestratorStreams(data.streams);
        setCalculatedStreams(null);
        setHasSimulated(true);
      } else {
        const response = await fetch(`/api/material-balance/streams-1-4?case=${spCase.caseNum}&zipCode=89414&countryCode=US`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Failed to calculate streams');
        }
        const data = await response.json();
        setCalculatedStreams(data.streams);
        setOrchestratorStreams(null);
        setHasSimulated(true);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Simulation error:', error);
      toast({
        title: "Simulation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      if (!silent && !controller.signal.aborted) {
        setIsSimulating(false);
      }
    }
  }, [toast]);

  const handleCaseChange = (spCase: typeof spInputCases[0]) => {
    setSelectedCase(spCase);
    setHasSimulated(false);
    setCalculatedStreams(null);
    setOrchestratorStreams(null);
    simulateForCase(spCase);
  };

  const handleSimulate = () => {
    simulateForCase(selectedCase);
  };

  const hasAutoSimulated = useRef(false);
  useEffect(() => {
    if (!hasAutoSimulated.current) {
      hasAutoSimulated.current = true;
      simulateForCase(spInputCases[0]);
    }
  }, [simulateForCase]);

  useEffect(() => {
    if (selectedCase.id !== "current-dynamic" || !hasSimulated) return;

    let cancelled = false;

    const loop = async () => {
      while (!cancelled) {
        try {
          await simulateForCase(selectedCase, true);
        } catch {
          // ignore errors in continuous loop
        }
        if (!cancelled) {
          await new Promise(r => setTimeout(r, 100));
        }
      }
    };

    loop();
    return () => { cancelled = true; };
  }, [selectedCase, hasSimulated, simulateForCase]);

  const getOrchestratorValue = (streamNum: number, field: string): number => {
    if (!orchestratorStreams) return 0;
    const s = orchestratorStreams[String(streamNum)];
    if (!s) return 0;
    return (s as any)[field] ?? 0;
  };

  const getStreamData = () => {
    if (orchestratorStreams) {
      const streamNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
      return {
        headers: streamDataPart1.headers,
        rows: [
          { component: "SO2", unit: "SCFM", values: streamNums.map(n => getOrchestratorValue(n, "SO2")) },
          { component: "SO3", unit: "SCFM", values: streamNums.map(n => getOrchestratorValue(n, "SO3")) },
          { component: "O2", unit: "SCFM", values: streamNums.map(n => getOrchestratorValue(n, "O2")) },
          { component: "N2", unit: "SCFM", values: streamNums.map(n => getOrchestratorValue(n, "N2")) },
          { component: "H2O", unit: "SCFM", values: streamNums.map(n => getOrchestratorValue(n, "H2O")) },
          { component: "Total", unit: "SCFM", values: streamNums.map(n => getOrchestratorValue(n, "TOTAL")) },
          { component: "PRESSURE", unit: "IN W.C.", values: streamNums.map(n => getOrchestratorValue(n, "PRESSURE")) },
          { component: "TEMPERATURE", unit: "°F", values: streamNums.map(n => getOrchestratorValue(n, "TEMPERATURE")) },
        ],
      };
    }

    if (!calculatedStreams) return streamDataPart1;

    const { stream1, stream2, stream3, stream4 } = calculatedStreams;

    return {
      headers: streamDataPart1.headers,
      rows: [
        { component: "SO2", unit: "SCFM", values: [stream1.SO2, stream2.SO2, stream3.SO2, stream4.SO2, 13020, 12369, 651, 12369, 13020, 4900, 4900, 1416, 1416, 518] },
        { component: "SO3", unit: "SCFM", values: [stream1.SO3, stream2.SO3, stream3.SO3, stream4.SO3, 239, 227, 12, 227, 239, 8360, 8360, 11844, 11844, 12742] },
        { component: "O2", unit: "SCFM", values: [stream1.O2, stream2.O2, stream3.O2, stream4.O2, 10774, 10235, 539, 10235, 10774, 6713, 6713, 4971, 4971, 4522] },
        { component: "N2", unit: "SCFM", values: [stream1.N2, stream2.N2, stream3.N2, stream4.N2, 91148, 86591, 4557, 86591, 91148, 91148, 91148, 91148, 91148, 91148] },
        { component: "H2O", unit: "SCFM", values: [stream1.H2O, stream2.H2O, stream3.H2O, stream4.H2O, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { component: "Total", unit: "SCFM", values: [stream1.total, stream2.total, stream3.total, stream4.total, 115182, 109422, 5759, 109422, 115182, 111121, 111121, 109379, 109379, 108930] },
        { component: "PRESSURE", unit: "IN W.C.", values: [stream1.pressure, stream2.pressure, stream3.pressure, stream4.pressure, 176, 176, 176, 159, 158, 154, 144, 139, 125, 119] },
        { component: "TEMPERATURE", unit: "°F", values: [stream1.temperature, stream2.temperature, stream3.temperature, stream4.temperature, 2073, 2073, 2073, 706, 779, 1145, 806, 964, 806, 847] },
      ],
    };
  };

  const getStreamDataPart2 = () => {
    if (orchestratorStreams) {
      const streamNums = [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27];
      return {
        headers: streamDataPart2.headers,
        rows: [
          { component: "SO2", unit: "SCFM", values: streamNums.map(n => getOrchestratorValue(n, "SO2")) },
          { component: "SO3", unit: "SCFM", values: streamNums.map(n => getOrchestratorValue(n, "SO3")) },
          { component: "O2", unit: "SCFM", values: streamNums.map(n => getOrchestratorValue(n, "O2")) },
          { component: "N2", unit: "SCFM", values: streamNums.map(n => getOrchestratorValue(n, "N2")) },
          { component: "H2O", unit: "SCFM", values: streamNums.map(n => getOrchestratorValue(n, "H2O")) },
          { component: "Total", unit: "SCFM", values: streamNums.map(n => getOrchestratorValue(n, "TOTAL")) },
          { component: "PRESSURE", unit: "IN W.C.", values: streamNums.map(n => getOrchestratorValue(n, "PRESSURE")) },
          { component: "TEMPERATURE", unit: "°F", values: streamNums.map(n => getOrchestratorValue(n, "TEMPERATURE")) },
        ],
      };
    }
    return streamDataPart2;
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      data-testid={`pfd-page-${id}`}
    >
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground font-mono" data-testid="text-document-number">
                {documentNumber}
              </div>
              <h1 className="text-lg font-semibold" data-testid="text-page-title">{title}</h1>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              data-testid="dropdown-source-code"
            >
              <Code className="w-4 h-4" />
              Source Code
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-testid="dropdown-content-source-code">
            <DropdownMenuLabel>GUI Code (TypeScript)</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => window.open('/api/gui-code/process-gas?action=view', '_blank')}
              data-testid="dropdown-item-view-gui-code"
            >
              <Eye className="w-4 h-4 mr-2" />
              View GUI Code
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/api/gui-code/process-gas?action=download';
                link.download = 'PFD5001ProcessGas.tsx';
                link.click();
              }}
              data-testid="dropdown-item-download-gui-code"
            >
              <Download className="w-4 h-4 mr-2" />
              Download GUI Code
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Simulation Code (Python)</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => window.open('/api/python-code/process-gas?action=view', '_blank')}
              data-testid="dropdown-item-view-simulation-code"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Simulation Code
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/api/python-code/process-gas?action=download';
                link.download = 'static_simulator.py';
                link.click();
              }}
              data-testid="dropdown-item-download-simulation-code"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Simulation Code
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="flex-1 overflow-auto p-4">
        <div className="space-y-6">
          <div className="bg-white rounded-md overflow-hidden border border-border">
            <img
              src={processGasDiagram}
              alt="Process Gas PFD Diagram"
              className="w-full h-auto"
              data-testid="img-process-gas-diagram"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-lg font-semibold" data-testid="text-section-streams-1-14">Stream Data - Streams 1-14</h2>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="bg-[#1a5f5f] border border-[#1a5f5f] text-white gap-2"
                      data-testid="dropdown-initial-sp-inputs"
                    >
                      {selectedCase.label}: {selectedCase.description}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" data-testid="dropdown-content-sp-inputs">
                    {spInputCases.flatMap((spCase, idx) => {
                      const items = [];
                      if (idx === 2) {
                        items.push(<DropdownMenuSeparator key="separator-orchestrator" />);
                      }
                      items.push(
                        <DropdownMenuItem
                          key={spCase.id}
                          onClick={() => handleCaseChange(spCase)}
                          className={selectedCase.id === spCase.id ? "bg-accent" : ""}
                          data-testid={`dropdown-item-${spCase.id}`}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{spCase.label}</span>
                            <span className="text-xs text-muted-foreground">{spCase.description}</span>
                          </div>
                        </DropdownMenuItem>
                      );
                      return items;
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  className="bg-[#1a5f5f] border border-[#1a5f5f] text-white gap-2"
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  data-testid="button-simulate"
                >
                  {isSimulating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {isSimulating ? "Simulating..." : "Simulate"}
                </Button>
                <Button
                  asChild
                  className="bg-[#1a5f5f] border border-[#1a5f5f] text-white gap-2"
                >
                  <Link href="/settings/output-variables/set-point-variables" data-testid="link-initial-sp-settings">
                    <Settings className="w-4 h-4" />
                    Initial SP Settings
                  </Link>
                </Button>
              </div>
            </div>
            <div className="bg-card rounded-md border border-border p-2">
              <StreamTable headers={getStreamData().headers} rows={getStreamData().rows} title="streams-1-14" showValues={hasSimulated} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold" data-testid="text-section-streams-15-27">Stream Data - Streams 15-27</h2>
            <div className="bg-card rounded-md border border-border p-2">
              <StreamTable headers={getStreamDataPart2().headers} rows={getStreamDataPart2().rows} title="streams-15-27" showValues={hasSimulated} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold" data-testid="text-section-sulfur-streams">Stream Data - Sulfur Streams</h2>
            <div className="bg-card rounded-md border border-border p-2">
              <SulfurStreamTable data={sulfurStreamData} title="sulfur-streams" />
            </div>
          </div>
        </div>
      </main>

      <PFDNavigation position="bottom-right" />
    </div>
  );
}
