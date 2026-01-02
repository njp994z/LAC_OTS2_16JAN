import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Database, Filter, X } from "lucide-react";
import inputVariablesData from "@/data/input-variables.json";

interface InputTag {
  tagName: string;
  description: string;
  area: string;
  loopType: string;
  unit: string;
  rangeLow: string;
  rangeHigh: string;
  typicalSp: string;
  alarmHH: string;
  alarmH: string;
  alarmL: string;
  alarmLL: string;
  controlMode: string;
  controllerOutput: string;
  spSource: string;
  cascadeMaster: string;
  failPosition: string;
  interlocks: string;
  summary: string;
  onHold: string;
  page: string;
}

const columns: { key: keyof InputTag; label: string; width: string }[] = [
  { key: 'tagName', label: 'Tag Name', width: '130px' },
  { key: 'description', label: 'Description', width: '280px' },
  { key: 'area', label: 'Area', width: '130px' },
  { key: 'loopType', label: 'Loop Type', width: '110px' },
  { key: 'unit', label: 'Unit', width: '80px' },
  { key: 'rangeLow', label: 'Range Low', width: '90px' },
  { key: 'rangeHigh', label: 'Range High', width: '90px' },
  { key: 'typicalSp', label: 'Typical SP', width: '90px' },
  { key: 'alarmHH', label: 'Alarm HH', width: '80px' },
  { key: 'alarmH', label: 'Alarm H', width: '80px' },
  { key: 'alarmL', label: 'Alarm L', width: '80px' },
  { key: 'alarmLL', label: 'Alarm LL', width: '80px' },
  { key: 'controlMode', label: 'Control Mode', width: '100px' },
  { key: 'controllerOutput', label: 'Controller Output', width: '130px' },
  { key: 'spSource', label: 'SP Source', width: '100px' },
  { key: 'cascadeMaster', label: 'Cascade Master', width: '110px' },
  { key: 'failPosition', label: 'Fail Position', width: '100px' },
  { key: 'interlocks', label: 'Interlocks', width: '140px' },
  { key: 'summary', label: 'Summary', width: '150px' },
  { key: 'onHold', label: 'On Hold', width: '70px' },
  { key: 'page', label: 'Page', width: '60px' },
];

const loopTypes = [
  'Analysis', 'Controller', 'Density', 'Digital Input', 'Digital Output',
  'Flow', 'Hand Control', 'Level', 'Motor Control', 'Pressure', 
  'Pump Control', 'Temperature', 'Vibration'
];

const areas = [
  'Acid Storage', 'Aux Boiler', 'Cooling Tower', 'Drying/Absorbing',
  'Safety Shower', 'Startup Burner', 'Sulfur Burning', 'Sulfur Handling',
  'Tail Gas', 'Water Treatment'
];

const spSources = ['None', 'Operator'];
const cascadeMasters = ['FIC-0003', 'None', 'Yes'];

export default function InputVariables() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [loopTypeFilter, setLoopTypeFilter] = useState<string>("all");
  const [spSourceFilter, setSpSourceFilter] = useState<string>("all");
  const [cascadeMasterFilter, setCascadeMasterFilter] = useState<string>("all");

  const tags = inputVariablesData.tags as InputTag[];

  const filteredTags = useMemo(() => {
    return tags.filter((tag) => {
      const matchesSearch = searchTerm === "" ||
        tag.tagName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.area.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesArea = areaFilter === "all" || tag.area === areaFilter;
      const matchesLoopType = loopTypeFilter === "all" || tag.loopType === loopTypeFilter;
      const matchesSpSource = spSourceFilter === "all" || tag.spSource === spSourceFilter;
      const matchesCascadeMaster = cascadeMasterFilter === "all" || tag.cascadeMaster === cascadeMasterFilter;

      return matchesSearch && matchesArea && matchesLoopType && matchesSpSource && matchesCascadeMaster;
    });
  }, [tags, searchTerm, areaFilter, loopTypeFilter, spSourceFilter, cascadeMasterFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setAreaFilter("all");
    setLoopTypeFilter("all");
    setSpSourceFilter("all");
    setCascadeMasterFilter("all");
  };

  const hasActiveFilters = searchTerm !== "" || areaFilter !== "all" || loopTypeFilter !== "all" || spSourceFilter !== "all" || cascadeMasterFilter !== "all";

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
              <h1 className="font-semibold text-foreground">Input Variable Ranges and Alarm Set Points</h1>
              <p className="text-xs text-muted-foreground">Configure process variables, ranges, and alarm limits</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Database className="w-3 h-3" />
              {filteredTags.length} of {tags.length} tags
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-hidden flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Process Tags Configuration
                  </CardTitle>
                  <CardDescription>
                    Filter and view all {tags.length} process control tags
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
                <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by tag, description, or area..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>

                <Select value={areaFilter} onValueChange={setAreaFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-area">
                    <SelectValue placeholder="Area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={loopTypeFilter} onValueChange={setLoopTypeFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-loop-type">
                    <SelectValue placeholder="Loop Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Loop Types</SelectItem>
                    {loopTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={spSourceFilter} onValueChange={setSpSourceFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-sp-source">
                    <SelectValue placeholder="SP Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All SP Sources</SelectItem>
                    {spSources.map((source) => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={cascadeMasterFilter} onValueChange={setCascadeMasterFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-cascade-master">
                    <SelectValue placeholder="Cascade Master" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cascade Master</SelectItem>
                    {cascadeMasters.map((master) => (
                      <SelectItem key={master} value={master}>{master}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-0">
            <div className="h-full overflow-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-muted">
                  <tr>
                    {columns.map((col, idx) => (
                      <th
                        key={col.key}
                        className={`text-left p-3 font-semibold text-foreground whitespace-nowrap border-b ${
                          idx === 0 ? 'sticky left-0 z-20 bg-muted' : ''
                        }`}
                        style={{ minWidth: col.width }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTags.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                        No tags match the current filters
                      </td>
                    </tr>
                  ) : (
                    filteredTags.map((tag, rowIdx) => (
                      <tr
                        key={tag.tagName + rowIdx}
                        className={`${rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover-elevate`}
                        data-testid={`row-tag-${tag.tagName}`}
                      >
                        {columns.map((col, colIdx) => {
                          const value = tag[col.key];
                          const isFirstCol = colIdx === 0;
                          const isFilterColumn = col.key === 'loopType' || col.key === 'spSource' || col.key === 'cascadeMaster';
                          
                          return (
                            <td
                              key={col.key}
                              className={`p-3 ${
                                isFirstCol 
                                  ? 'sticky left-0 z-10 font-mono font-semibold text-primary whitespace-nowrap border-r bg-inherit' 
                                  : ''
                              } ${
                                isFilterColumn ? 'whitespace-nowrap' : ''
                              }`}
                              style={{ minWidth: col.width }}
                            >
                              {isFilterColumn ? (
                                <Badge 
                                  variant={value === 'None' || value === '-' ? 'outline' : 'secondary'}
                                  className="text-xs"
                                >
                                  {value}
                                </Badge>
                              ) : (
                                <span className={`${
                                  value === '-' || value === 'None' || value === 'N/A' || value === 'TBD' 
                                    ? 'text-muted-foreground' 
                                    : 'text-foreground'
                                }`}>
                                  {value}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Input Variables | Control Loops</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
