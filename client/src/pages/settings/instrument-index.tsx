import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, ClipboardList, Filter, X } from "lucide-react";
import instrumentData from "@/data/instrument-index.json";

interface Instrument {
  areaName: string;
  unitNumber: string;
  unitName: string;
  loopName: string;
  tagStatus: string;
  tagName: string;
  instrumentType: string;
  pId: string;
  service: string;
  lineNumber: string;
  equipment: string;
  supplyResp: string;
  iOSys: string;
  ioType: string;
  iOLocation: string;
  signalType: string;
  instrumentLocation: string;
  wbs: string;
  powerRequirementYN: string;
  jbPreassign: string;
  htRqd: string;
}

const columns: { key: keyof Instrument; label: string; width: string }[] = [
  { key: 'tagName', label: 'Tag Name', width: '140px' },
  { key: 'instrumentType', label: 'Instrument Type', width: '280px' },
  { key: 'service', label: 'Service', width: '240px' },
  { key: 'loopName', label: 'Loop Name', width: '130px' },
  { key: 'pId', label: 'P&ID', width: '200px' },
  { key: 'unitName', label: 'Unit Name', width: '180px' },
  { key: 'areaName', label: 'Area', width: '80px' },
  { key: 'unitNumber', label: 'Unit #', width: '80px' },
  { key: 'equipment', label: 'Equipment', width: '130px' },
  { key: 'lineNumber', label: 'Line Number', width: '220px' },
  { key: 'iOSys', label: 'I/O System', width: '100px' },
  { key: 'ioType', label: 'IO Type', width: '100px' },
  { key: 'iOLocation', label: 'I/O Location', width: '100px' },
  { key: 'signalType', label: 'Signal Type', width: '100px' },
  { key: 'instrumentLocation', label: 'Inst. Location', width: '120px' },
  { key: 'supplyResp', label: 'Supply Resp.', width: '100px' },
  { key: 'powerRequirementYN', label: 'Power Req.', width: '90px' },
  { key: 'jbPreassign', label: 'JB Preassign', width: '120px' },
  { key: 'htRqd', label: 'HT Req.', width: '80px' },
  { key: 'tagStatus', label: 'Status', width: '80px' },
  { key: 'wbs', label: 'WBS', width: '80px' },
];

export default function InstrumentIndex() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [instrumentTypeFilter, setInstrumentTypeFilter] = useState<string>("all");
  const [ioTypeFilter, setIoTypeFilter] = useState<string>("all");
  const [ioSystemFilter, setIoSystemFilter] = useState<string>("all");

  const instruments = (instrumentData as unknown as { instruments: Instrument[] }).instruments;

  // Get unique values for filters
  const instrumentTypes = useMemo(() => {
    const types = new Set<string>();
    instruments.forEach(inst => {
      if (inst.instrumentType) types.add(inst.instrumentType);
    });
    return Array.from(types).sort();
  }, [instruments]);

  const ioTypes = useMemo(() => {
    const types = new Set<string>();
    instruments.forEach(inst => {
      if (inst.ioType) types.add(inst.ioType);
    });
    return Array.from(types).sort();
  }, [instruments]);

  const ioSystems = useMemo(() => {
    const systems = new Set<string>();
    instruments.forEach(inst => {
      if (inst.iOSys) systems.add(inst.iOSys);
    });
    return Array.from(systems).sort();
  }, [instruments]);

  const filteredInstruments = useMemo(() => {
    return instruments.filter((inst) => {
      const matchesSearch = searchTerm === "" ||
        inst.tagName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.instrumentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.loopName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesInstrumentType = instrumentTypeFilter === "all" || inst.instrumentType === instrumentTypeFilter;
      const matchesIoType = ioTypeFilter === "all" || inst.ioType === ioTypeFilter;
      const matchesIoSystem = ioSystemFilter === "all" || inst.iOSys === ioSystemFilter;

      return matchesSearch && matchesInstrumentType && matchesIoType && matchesIoSystem;
    });
  }, [instruments, searchTerm, instrumentTypeFilter, ioTypeFilter, ioSystemFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setInstrumentTypeFilter("all");
    setIoTypeFilter("all");
    setIoSystemFilter("all");
  };

  const hasActiveFilters = searchTerm !== "" || instrumentTypeFilter !== "all" || ioTypeFilter !== "all" || ioSystemFilter !== "all";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/simulation-settings")}
              data-testid="button-back-settings"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">Instrument Index</h1>
              <p className="text-xs text-muted-foreground">Complete listing of all field instruments, transmitters, control valves, and measurement devices with tag numbers, ranges, calibration data, and P&ID references.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-muted-foreground" />
            <Badge variant="secondary" data-testid="badge-instrument-count">
              {filteredInstruments.length} of {instruments.length} instruments
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-full mx-auto">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Instrument Database</CardTitle>
                    <CardDescription>
                      Search and filter instruments by tag name, type, service, or loop name
                    </CardDescription>
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="gap-1"
                      data-testid="button-clear-filters"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by tag, type, service, or loop..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                      data-testid="input-search"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={instrumentTypeFilter} onValueChange={setInstrumentTypeFilter}>
                      <SelectTrigger className="w-[200px]" data-testid="select-instrument-type">
                        <SelectValue placeholder="Instrument Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types ({instrumentTypes.length})</SelectItem>
                        {instrumentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Select value={ioTypeFilter} onValueChange={setIoTypeFilter}>
                    <SelectTrigger className="w-[140px]" data-testid="select-io-type">
                      <SelectValue placeholder="IO Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All IO ({ioTypes.length})</SelectItem>
                      {ioTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={ioSystemFilter} onValueChange={setIoSystemFilter}>
                    <SelectTrigger className="w-[140px]" data-testid="select-io-system">
                      <SelectValue placeholder="I/O System" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Systems ({ioSystems.length})</SelectItem>
                      {ioSystems.map((sys) => (
                        <SelectItem key={sys} value={sys}>
                          {sys}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0 z-10">
                      <tr>
                        {columns.map((col, index) => (
                          <th
                            key={col.key}
                            className={`px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap border-b ${
                              index === 0 ? 'sticky left-0 bg-muted/50 z-20' : ''
                            }`}
                            style={{ minWidth: col.width }}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInstruments.length === 0 ? (
                        <tr>
                          <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                            No instruments match your search criteria
                          </td>
                        </tr>
                      ) : (
                        filteredInstruments.map((inst, rowIndex) => (
                          <tr
                            key={`${inst.tagName}-${rowIndex}`}
                            className="border-b border-border/50 hover:bg-muted/30"
                            data-testid={`row-instrument-${rowIndex}`}
                          >
                            {columns.map((col, colIndex) => (
                              <td
                                key={col.key}
                                className={`px-3 py-2 whitespace-nowrap ${
                                  colIndex === 0 ? 'sticky left-0 bg-background font-medium z-10' : ''
                                }`}
                              >
                                {inst[col.key] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Instrument Index | Reference Data</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
