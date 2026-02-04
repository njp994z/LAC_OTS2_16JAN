import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, Zap, Download } from "lucide-react";
import stgData from "@/data/stg-signals.json";

interface STGSignal {
  id: number;
  customerTag: string | null;
  signalName: string | null;
  projectKKS: string | null;
  projectSignalName: string | null;
  designation: string | null;
  signalSetting: string | null;
  subSystem: string | null;
  signalType: string | null;
  rangeLow: number | string | null;
  rangeHigh: number | string | null;
  unit: string | null;
  lowAlarm: number | string | null;
  lowWarning: number | string | null;
  highWarning: number | string | null;
  highAlarm: number | string | null;
  note: string | null;
  dcsType: string | null;
  modbusRegister: number | null;
  modbusBit: number | null;
  modbusDirection: string | null;
  modbusType: string | null;
}

type SortField = 'customerTag' | 'signalName' | 'designation' | 'subSystem' | 'signalType' | 'modbusRegister';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

export default function TurboGeneratorSignalExchange() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [subSystemFilter, setSubSystemFilter] = useState<string>("all");
  const [signalTypeFilter, setSignalTypeFilter] = useState<string>("all");
  const [dcsTypeFilter, setDcsTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortField, setSortField] = useState<SortField>('customerTag');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const signals: STGSignal[] = stgData.signals;
  const filters = stgData.filters;

  const filteredSignals = useMemo(() => {
    let result = signals;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.customerTag?.toLowerCase().includes(query) ||
        s.signalName?.toLowerCase().includes(query) ||
        s.designation?.toLowerCase().includes(query) ||
        s.signalSetting?.toLowerCase().includes(query) ||
        s.projectKKS?.toLowerCase().includes(query) ||
        s.dcsType?.toLowerCase().includes(query)
      );
    }

    if (subSystemFilter !== "all") {
      result = result.filter(s => s.subSystem === subSystemFilter);
    }

    if (signalTypeFilter !== "all") {
      result = result.filter(s => s.signalType === signalTypeFilter);
    }

    if (dcsTypeFilter !== "all") {
      result = result.filter(s => s.dcsType === dcsTypeFilter);
    }

    result = [...result].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [signals, searchQuery, subSystemFilter, signalTypeFilter, dcsTypeFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredSignals.length / pageSize);
  const paginatedSignals = filteredSignals.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSubSystemFilter("all");
    setSignalTypeFilter("all");
    setDcsTypeFilter("all");
    setCurrentPage(1);
  };

  const getSignalTypeBadgeColor = (type: string | null): string => {
    if (!type) return "secondary";
    const t = type.toLowerCase().trim();
    if (t.includes('alarm')) return "destructive";
    if (t.includes('warning')) return "outline";
    if (t.includes('fault')) return "destructive";
    if (t.includes('signal')) return "default";
    if (t.includes('status')) return "secondary";
    if (t.includes('command')) return "default";
    return "secondary";
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
    </TableHead>
  );

  const exportToCSV = () => {
    const headers = ['Customer Tag', 'Signal Name', 'Designation', 'Signal Setting', 'Sub System', 'Signal Type', 'Range Low', 'Range High', 'Unit', 'DCS Type', 'Modbus Register'];
    const rows = filteredSignals.map(s => [
      s.customerTag || '',
      s.signalName || '',
      s.designation || '',
      s.signalSetting || '',
      s.subSystem || '',
      s.signalType || '',
      s.rangeLow ?? '',
      s.rangeHigh ?? '',
      s.unit || '',
      s.dcsType || '',
      s.modbusRegister ?? ''
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stg-signal-list.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

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
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <div>
                <h1 className="font-semibold text-foreground">Turbo-Generator Signal Exchange</h1>
                <p className="text-xs text-muted-foreground">STG Signal List - {signals.length} total signals</p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV} data-testid="button-export-csv">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center justify-between gap-4 flex-wrap">
              <span>Signal List</span>
              <span className="text-sm font-normal text-muted-foreground">
                Showing {paginatedSignals.length} of {filteredSignals.length} signals
              </span>
            </CardTitle>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tags, signals, descriptions..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              
              <Select value={subSystemFilter} onValueChange={(v) => { setSubSystemFilter(v); setCurrentPage(1); }}>
                <SelectTrigger data-testid="select-subsystem">
                  <SelectValue placeholder="Sub System" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sub Systems</SelectItem>
                  {filters.subSystems.map(ss => (
                    <SelectItem key={ss} value={ss}>{ss}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={signalTypeFilter} onValueChange={(v) => { setSignalTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger data-testid="select-signaltype">
                  <SelectValue placeholder="Signal Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Signal Types</SelectItem>
                  {filters.signalTypes.map(st => (
                    <SelectItem key={st} value={st}>{st.trim()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={dcsTypeFilter} onValueChange={(v) => { setDcsTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger data-testid="select-dcstype">
                  <SelectValue placeholder="DCS Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All DCS Types</SelectItem>
                  {filters.dcsTypes.map(dt => (
                    <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(searchQuery || subSystemFilter !== "all" || signalTypeFilter !== "all" || dcsTypeFilter !== "all") && (
              <div className="mt-3">
                <Button variant="ghost" size="sm" onClick={resetFilters} data-testid="button-reset-filters">
                  Clear all filters
                </Button>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader field="customerTag">Tag</SortableHeader>
                    <SortableHeader field="signalName">Signal</SortableHeader>
                    <SortableHeader field="designation">Designation</SortableHeader>
                    <TableHead>Setting</TableHead>
                    <SortableHeader field="subSystem">Sub System</SortableHeader>
                    <SortableHeader field="signalType">Type</SortableHeader>
                    <TableHead>Range</TableHead>
                    <SortableHeader field="modbusRegister">Modbus</SortableHeader>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSignals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No signals found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSignals.map((signal) => (
                      <TableRow key={signal.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{signal.customerTag}</TableCell>
                        <TableCell className="font-mono text-sm">{signal.signalName}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={signal.designation || ''}>
                          {signal.designation}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-muted-foreground" title={signal.signalSetting || ''}>
                          {signal.signalSetting}
                        </TableCell>
                        <TableCell>
                          {signal.subSystem && (
                            <Badge variant="outline" className="text-xs">{signal.subSystem}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {signal.signalType && (
                            <Badge variant={getSignalTypeBadgeColor(signal.signalType) as any} className="text-xs whitespace-nowrap">
                              {signal.signalType.trim()}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {(signal.rangeLow !== null || signal.rangeHigh !== null) && (
                            <span className="whitespace-nowrap">
                              {signal.rangeLow ?? '?'} - {signal.rangeHigh ?? '?'} {signal.unit}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {signal.modbusRegister}
                          {signal.modbusBit !== null && <span className="text-muted-foreground">:{signal.modbusBit}</span>}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-20" data-testid="select-pagesize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map(size => (
                      <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    data-testid="button-first-page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage >= totalPages}
                    data-testid="button-last-page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Turbo-Generator Signal Exchange | STG Signal List</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
