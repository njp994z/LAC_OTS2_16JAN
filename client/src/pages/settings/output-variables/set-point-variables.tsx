import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Target, Save, Loader2, Plus, FolderPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import expLogo from "@/assets/exp-logo.png";

interface SetPointVariable {
  id?: number;
  count: string;
  tag: string;
  description: string;
  case1: string;
  case2: string;
  case3: string;
  case4: string;
}

const defaultData: SetPointVariable[] = [
  { count: "01", tag: "1540-TIC-4820", description: "Pass 1 Inlet Temp SP", case1: "779 F", case2: "779 F", case3: "779 F", case4: "93 F" },
  { count: "02", tag: "1540-TIC-4828", description: "Pass 2 Inlet Temp SP", case1: "806 F", case2: "806 F", case3: "806 F", case4: "93 F" },
  { count: "03", tag: "1540-TIC-5220", description: "Pass 3 Inlet Temp SP", case1: "806 F", case2: "806 F", case3: "806 F", case4: "93 F" },
  { count: "04", tag: "1540-TIC-5224", description: "Pass 4 Inlet Temp SP", case1: "779 F", case2: "779 F", case3: "779 F", case4: "93 F" },
  { count: "05", tag: "1540-FIC-2602", description: "Sulfur Flow SP", case1: "79 gpm", case2: "79 gpm", case3: "35 gpm", case4: "0 gpm" },
  { count: "06", tag: "1540-SIC-4030", description: "Main Comp Speed SP", case1: "87%", case2: "92.5%", case3: "20.7%", case4: "0.0 %" },
  { count: "07", tag: "1520-FIC-5870", description: "DT Acid Flow SP", case1: "3500 gpm", case2: "3500 gpm", case3: "3500 gpm", case4: "0 gpm" },
  { count: "08", tag: "1520-TIC-5823", description: "DT Inlet Temp SP", case1: "150 F", case2: "150 F", case3: "150 F", case4: "93 F" },
  { count: "09", tag: "1520-FIC-6770", description: "IPAT Acid Flow SP", case1: "4800 gpm", case2: "4800 gpm", case3: "4800 gpm", case4: "0 gpm" },
  { count: "10", tag: "1520-FIC-6670", description: "FAT Acid Flow SP", case1: "3000 gpm", case2: "3000 gpm", case3: "3000 gpm", case4: "0 gpm" },
  { count: "11", tag: "1520-TIC-6722", description: "IPAT Acid Temp SP", case1: "180 F", case2: "180 F", case3: "180 F", case4: "93 F" },
  { count: "12", tag: "1520-TIC-6622", description: "FAT Acid Temp SP", case1: "180 F", case2: "180 F", case3: "180 F", case4: "93 F" },
  { count: "13", tag: "1540-TIC-7221", description: "Econ 4A Temp SP", case1: "275 F", case2: "275 F", case3: "275 F", case4: "93 F" },
  { count: "14", tag: "1540-TIC-7224", description: "Econ 3B Temp SP", case1: "330 F", case2: "330 F", case3: "330 F", case4: "93 F" },
];

export default function SetPointVariables() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [data, setData] = useState<SetPointVariable[]>(defaultData);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedData, isLoading } = useQuery<SetPointVariable[]>({
    queryKey: ['/api/setpoint-variables'],
  });

  useEffect(() => {
    if (savedData && savedData.length > 0) {
      setData(savedData);
    }
  }, [savedData]);

  const saveMutation = useMutation({
    mutationFn: async (variables: SetPointVariable[]) => {
      const response = await apiRequest("POST", "/api/setpoint-variables", { variables });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/setpoint-variables'] });
      toast({
        title: "Changes Saved",
        description: "Set point variables have been saved to the database.",
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

  const updateCell = (rowIndex: number, field: keyof SetPointVariable, value: string) => {
    setData(prev => {
      const newData = [...prev];
      newData[rowIndex] = { ...newData[rowIndex], [field]: value };
      return newData;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    const toSave = data.map(({ id, count, tag, description, case1, case2, case3, case4 }) => ({
      count, tag, description, case1, case2, case3, case4
    }));
    saveMutation.mutate(toSave as SetPointVariable[]);
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
              onClick={() => {
                toast({
                  title: "New Case",
                  description: "Case creation functionality coming soon",
                });
              }}
              data-testid="button-new-case"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              New Case
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const newCount = String(data.length + 1).padStart(2, "0");
                const newVariable: SetPointVariable = {
                  count: newCount,
                  tag: "",
                  description: "",
                  case1: "",
                  case2: "",
                  case3: "",
                  case4: "",
                };
                setData([...data, newVariable]);
                setHasChanges(true);
                toast({
                  title: "New Variable Added",
                  description: `Variable #${newCount} added to the table`,
                });
              }}
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
              <Target className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-semibold text-foreground">Initial Set Point Variables (SPs)</h1>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed max-w-5xl">
              Set initial setpoint variables for each simulation case. Click on any cell to edit its value.
            </p>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>Set Point Variables</span>
                {hasChanges && (
                  <span className="text-sm font-normal text-amber-500">Unsaved changes</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" data-testid="table-setpoint-variables">
                  <thead>
                    <tr className="bg-[#2d5a5a] text-white">
                      <th className="border border-border/30 px-3 py-3 text-left text-sm font-semibold w-20">Count</th>
                      <th className="border border-border/30 px-3 py-3 text-left text-sm font-semibold w-36">Tag</th>
                      <th className="border border-border/30 px-3 py-3 text-left text-sm font-semibold w-44">Description</th>
                      <th className="border border-border/30 px-3 py-3 text-left text-sm font-semibold">
                        <div>Case 1</div>
                        <div className="font-normal text-xs opacity-80">SP_2480 STPD - Clean</div>
                      </th>
                      <th className="border border-border/30 px-3 py-3 text-left text-sm font-semibold">
                        <div>Case 2</div>
                        <div className="font-normal text-xs opacity-80">SP_2480 STPD - Dirty</div>
                      </th>
                      <th className="border border-border/30 px-3 py-3 text-left text-sm font-semibold">
                        <div>Case 3</div>
                        <div className="font-normal text-xs opacity-80">1240 STPD – Summer – Clean – 50% Turndown</div>
                      </th>
                      <th className="border border-border/30 px-3 py-3 text-left text-sm font-semibold">
                        <div>Case 4</div>
                        <div className="font-normal text-xs opacity-80">Start-Up: Summer – Clean</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => (
                      <tr 
                        key={row.count} 
                        className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                        data-testid={`row-sp-${row.count}`}
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
                        <td className="border border-border px-3 py-1">
                          <Input
                            value={row.case1}
                            onChange={(e) => updateCell(index, "case1", e.target.value)}
                            className="h-8 text-sm border-0 bg-transparent p-0 focus-visible:ring-1"
                            data-testid={`input-case1-${row.count}`}
                          />
                        </td>
                        <td className="border border-border px-3 py-1">
                          <Input
                            value={row.case2}
                            onChange={(e) => updateCell(index, "case2", e.target.value)}
                            className="h-8 text-sm border-0 bg-transparent p-0 focus-visible:ring-1"
                            data-testid={`input-case2-${row.count}`}
                          />
                        </td>
                        <td className="border border-border px-3 py-1">
                          <Input
                            value={row.case3}
                            onChange={(e) => updateCell(index, "case3", e.target.value)}
                            className="h-8 text-sm border-0 bg-transparent p-0 focus-visible:ring-1"
                            data-testid={`input-case3-${row.count}`}
                          />
                        </td>
                        <td className="border border-border px-3 py-1">
                          <Input
                            value={row.case4}
                            onChange={(e) => updateCell(index, "case4", e.target.value)}
                            className="h-8 text-sm border-0 bg-transparent p-0 focus-visible:ring-1"
                            data-testid={`input-case4-${row.count}`}
                          />
                        </td>
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
