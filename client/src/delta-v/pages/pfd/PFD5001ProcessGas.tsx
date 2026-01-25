import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, ChevronDown, Play, Settings, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PFDNavigation } from "../../components/PFDNavigation";
import { useToast } from "@/hooks/use-toast";
import processGasDiagram from "@assets/image_1769045383009.png";

const pvInputCases = [
  { id: "case1", label: "Case 1", description: "PV_2480 STPD - Clean", caseNum: 1 },
  { id: "case2", label: "Case 2", description: "PV_2480 STPD - Dirty", caseNum: 2 },
  { id: "case3", label: "Case 3", description: "PV_1100 STPD - Clean", caseNum: 3 },
  { id: "case4", label: "Case 4", description: "PV_1100 STPD - Dirty", caseNum: 4 },
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
  const [selectedCase, setSelectedCase] = useState(pvInputCases[0]);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [calculatedStreams, setCalculatedStreams] = useState<{
    stream1: StreamResult;
    stream2: StreamResult;
    stream3: StreamResult;
    stream4: StreamResult;
  } | null>(null);
  const { toast } = useToast();

  const handleCaseChange = (pvCase: typeof pvInputCases[0]) => {
    setSelectedCase(pvCase);
    setHasSimulated(false);
    setCalculatedStreams(null);
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const response = await fetch(`/api/material-balance/streams-1-4?case=${selectedCase.caseNum}&zipCode=89414&countryCode=US`);
      if (!response.ok) {
        throw new Error('Failed to calculate streams');
      }
      const data = await response.json();
      setCalculatedStreams(data.streams);
      setHasSimulated(true);
      toast({
        title: "Simulation Complete",
        description: `Streams 1-4 calculated for ${selectedCase.label}`,
      });
    } catch (error) {
      console.error('Simulation error:', error);
      toast({
        title: "Simulation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const getStreamData = () => {
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

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      data-testid={`pfd-page-${id}`}
    >
      <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-4">
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
                      data-testid="dropdown-initial-pv-inputs"
                    >
                      {selectedCase.label}: {selectedCase.description}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" data-testid="dropdown-content-pv-inputs">
                    {pvInputCases.map((pvCase) => (
                      <DropdownMenuItem
                        key={pvCase.id}
                        onClick={() => handleCaseChange(pvCase)}
                        className={selectedCase.id === pvCase.id ? "bg-accent" : ""}
                        data-testid={`dropdown-item-${pvCase.id}`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{pvCase.label}</span>
                          <span className="text-xs text-muted-foreground">{pvCase.description}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
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
              <StreamTable headers={streamDataPart2.headers} rows={streamDataPart2.rows} title="streams-15-27" showValues={hasSimulated} />
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
