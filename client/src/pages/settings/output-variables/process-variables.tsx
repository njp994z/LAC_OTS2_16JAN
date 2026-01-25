import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Activity, Save, Loader2, Plus, FolderPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import expLogo from "@/assets/exp-logo.png";

interface CaseColumn {
  id: string;
  name: string;
  description: string;
}

interface ProcessVariable {
  id?: number;
  count: string;
  tag: string;
  description: string;
  cases: Record<string, string>;
}

const defaultCases: CaseColumn[] = [
  { id: "case1", name: "Case 1", description: "PV_2480 STPD - Clean" },
  { id: "case2", name: "Case 2", description: "PV_2480 STPD - Dirty" },
  { id: "case3", name: "Case 3", description: "1240 STPD – Summer – Clean – 50% Turndown" },
  { id: "case4", name: "Case 4", description: "Start-Up: Summer – Clean" },
];

const defaultData: ProcessVariable[] = [
  { count: "0A", tag: "Ambient Pressure", description: "Inlet Air", cases: { case1: "Realtime – ATM", case2: "Realtime – ATM", case3: "0.84 ATM", case4: "0.84 ATM" } },
  { count: "0B", tag: "Ambient Temperature", description: "Inlet Air", cases: { case1: "Realtime – F", case2: "Realtime – F", case3: "93 F", case4: "93 F" } },
  { count: "0C", tag: "Ambient Moister", description: "Inlet Air", cases: { case1: "Realtime – gr / lb BDA", case2: "Realtime – gr / lb BDA", case3: "79 gr / lb BDA", case4: "79 gr / lb BDA" } },
  { count: "0D", tag: "Pass 1 Ash dP", description: "dP Pass 1 from Ash", cases: { case1: "0 inch wc", case2: "30 inch wc", case3: "0 inch wc", case4: "0 inch wc" } },
  { count: "01", tag: "1520-F-5870", description: "DT Acid Flow", cases: { case1: "3500 gpm", case2: "3500 gpm", case3: "3500 gpm", case4: "0 gpm" } },
  { count: "02", tag: "1520-T-5823", description: "DT Inlet Temp", cases: { case1: "150 F", case2: "150 F", case3: "150 F", case4: "93 F" } },
  { count: "03", tag: "1540-H-4030", description: "Main Comp", cases: { case1: "87%", case2: "92.5%", case3: "20.7%", case4: "0.0 %" } },
  { count: "04", tag: "1530-F-2602", description: "Sulfur Flow", cases: { case1: "79 gpm", case2: "79 gpm", case3: "35 gpm", case4: "0 gpm" } },
  { count: "05", tag: "1540-TI-4820", description: "Pass 1 Inlet Temp", cases: { case1: "779 F", case2: "779 F", case3: "779 F", case4: "93 F" } },
  { count: "06", tag: "1540-T-4828", description: "Pass 2 Inlet Temp", cases: { case1: "806 F", case2: "806 F", case3: "806 F", case4: "93 F" } },
  { count: "07", tag: "1540-T-5220", description: "Pass 3 Inlet Temp", cases: { case1: "806 F", case2: "806 F", case3: "806 F", case4: "93 F" } },
  { count: "08", tag: "1540-T-5224", description: "Pass 4 Inlet Temp", cases: { case1: "779 F", case2: "779 F", case3: "779 F", case4: "93 F" } },
  { count: "09", tag: "1540-T-7221", description: "Econ 4A Temp Outlet", cases: { case1: "275 F", case2: "275 F", case3: "275 F", case4: "93 F" } },
  { count: "10", tag: "1540-T-7224", description: "Econ 3B Temp Outlet", cases: { case1: "330 F", case2: "330 F", case3: "330 F", case4: "93 F" } },
  { count: "11", tag: "1520-T-6722", description: "IPAT Acid Temp In.", cases: { case1: "180 F", case2: "180 F", case3: "180 F", case4: "93 F" } },
  { count: "12", tag: "1520-T-6622", description: "FAT Acid Temp In.", cases: { case1: "180 F", case2: "180 F", case3: "180 F", case4: "93 F" } },
  { count: "13", tag: "1520-F-6770", description: "IPAT Acid Flow In.", cases: { case1: "4800 gpm", case2: "4800 gpm", case3: "4800 gpm", case4: "0 gpm" } },
  { count: "14", tag: "1520-F-6670", description: "FAT Acid Flow in.", cases: { case1: "3000 gpm", case2: "3000 gpm", case3: "3000 gpm", case4: "0 gpm" } },
];

export default function ProcessVariables() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [data, setData] = useState<ProcessVariable[]>(defaultData);
  const [caseColumns, setCaseColumns] = useState<CaseColumn[]>(defaultCases);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedData, isLoading } = useQuery<{ variables: ProcessVariable[]; cases: CaseColumn[] }>({
    queryKey: ['/api/process-variables'],
  });

  useEffect(() => {
    if (savedData) {
      if (savedData.variables && savedData.variables.length > 0) {
        setData(savedData.variables);
      }
      if (savedData.cases && savedData.cases.length > 0) {
        setCaseColumns(savedData.cases);
      }
    }
  }, [savedData]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { variables: ProcessVariable[]; cases: CaseColumn[] }) => {
      const response = await apiRequest("POST", "/api/process-variables", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/process-variables'] });
      toast({
        title: "Changes Saved",
        description: "Process variables have been saved to the database.",
      });
      setHasChanges(false);
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save",
        variant: "destructive",
      });
    },
  });

  const updateCell = (rowIndex: number, field: string, value: string) => {
    setData(prev => {
      const newData = [...prev];
      if (field === "count" || field === "tag" || field === "description") {
        newData[rowIndex] = { ...newData[rowIndex], [field]: value };
      } else {
        newData[rowIndex] = {
          ...newData[rowIndex],
          cases: { ...newData[rowIndex].cases, [field]: value }
        };
      }
      return newData;
    });
    setHasChanges(true);
  };

  const updateCaseHeader = (caseId: string, field: "name" | "description", value: string) => {
    setCaseColumns(prev => prev.map(c => 
      c.id === caseId ? { ...c, [field]: value } : c
    ));
    setHasChanges(true);
  };

  const handleAddCase = () => {
    const newCaseNum = caseColumns.length + 1;
    const newCaseId = `case${newCaseNum}`;
    const newCase: CaseColumn = {
      id: newCaseId,
      name: `Case ${newCaseNum}`,
      description: "New Case Description",
    };
    setCaseColumns([...caseColumns, newCase]);
    setData(prev => prev.map(row => ({
      ...row,
      cases: { ...row.cases, [newCaseId]: "" }
    })));
    setHasChanges(true);
    toast({
      title: "New Case Added",
      description: `Case ${newCaseNum} has been added to the table`,
    });
  };

  const handleAddVariable = () => {
    const newCount = String(data.length + 1).padStart(2, "0");
    const emptyCases: Record<string, string> = {};
    caseColumns.forEach(c => { emptyCases[c.id] = ""; });
    const newVariable: ProcessVariable = {
      count: newCount,
      tag: "",
      description: "",
      cases: emptyCases,
    };
    setData([...data, newVariable]);
    setHasChanges(true);
    toast({
      title: "New Variable Added",
      description: `Variable #${newCount} added to the table`,
    });
  };

  const handleSave = () => {
    const toSave = data.map(({ count, tag, description, cases }) => ({
      count, tag, description, cases
    }));
    saveMutation.mutate({ variables: toSave as ProcessVariable[], cases: caseColumns });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings/output-variables")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
              data-testid="button-save-changes"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={handleAddCase}
              data-testid="button-new-case"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              New Case
            </Button>
            <Button
              variant="outline"
              onClick={handleAddVariable}
              data-testid="button-new-variable"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Variable
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-semibold text-foreground">Initial Process Variables (PVs)</h1>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed max-w-5xl">
              Set initial process variables for each simulation case. Click on any cell to edit its value.
            </p>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>Process Variables</span>
                {hasChanges && (
                  <span className="text-sm font-normal text-amber-500">Unsaved changes</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" data-testid="table-process-variables">
                  <thead>
                    <tr className="bg-[#2d5a5a] text-white">
                      <th className="border border-border/30 px-3 py-3 text-left text-sm font-semibold w-20">Count</th>
                      <th className="border border-border/30 px-3 py-3 text-left text-sm font-semibold w-36">Tag</th>
                      <th className="border border-border/30 px-3 py-3 text-left text-sm font-semibold w-44">Description</th>
                      {caseColumns.map((caseCol) => (
                        <th key={caseCol.id} className="border border-border/30 px-3 py-2 text-left text-sm font-semibold min-w-[140px]">
                          <Input
                            value={caseCol.name}
                            onChange={(e) => updateCaseHeader(caseCol.id, "name", e.target.value)}
                            className="h-6 text-sm font-semibold border-0 bg-transparent p-0 text-white placeholder:text-white/60 focus-visible:ring-1 focus-visible:ring-white/50"
                            data-testid={`input-case-name-${caseCol.id}`}
                          />
                          <Input
                            value={caseCol.description}
                            onChange={(e) => updateCaseHeader(caseCol.id, "description", e.target.value)}
                            className="h-5 text-xs font-normal border-0 bg-transparent p-0 text-white/80 placeholder:text-white/50 focus-visible:ring-1 focus-visible:ring-white/50 mt-1"
                            data-testid={`input-case-desc-${caseCol.id}`}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => (
                      <tr 
                        key={row.count} 
                        className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                        data-testid={`row-pv-${row.count}`}
                      >
                        <td className="border border-border px-3 py-1">
                          <Input
                            value={row.count}
                            onChange={(e) => updateCell(index, "count", e.target.value)}
                            className="h-8 text-sm border-0 bg-transparent p-0 focus-visible:ring-1"
                            data-testid={`input-count-${row.count}`}
                          />
                        </td>
                        <td className="border border-border px-3 py-1">
                          <Input
                            value={row.tag}
                            onChange={(e) => updateCell(index, "tag", e.target.value)}
                            className="h-8 text-sm border-0 bg-transparent p-0 focus-visible:ring-1"
                            data-testid={`input-tag-${row.count}`}
                          />
                        </td>
                        <td className="border border-border px-3 py-1">
                          <Input
                            value={row.description}
                            onChange={(e) => updateCell(index, "description", e.target.value)}
                            className="h-8 text-sm border-0 bg-transparent p-0 focus-visible:ring-1"
                            data-testid={`input-desc-${row.count}`}
                          />
                        </td>
                        {caseColumns.map((caseCol) => (
                          <td key={caseCol.id} className="border border-border px-3 py-1">
                            <Input
                              value={row.cases[caseCol.id] || ""}
                              onChange={(e) => updateCell(index, caseCol.id, e.target.value)}
                              className="h-8 text-sm border-0 bg-transparent p-0 focus-visible:ring-1"
                              data-testid={`input-${caseCol.id}-${row.count}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
