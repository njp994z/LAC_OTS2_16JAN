import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ConverterCase, ConverterCaseParameters } from "@shared/schema";

interface ParameterRow {
  label: string;
  key: keyof ConverterCaseParameters;
  category: string;
  unit?: string;
}

const parameterDefinitions: ParameterRow[] = [
  { label: "SO2 %", key: "so2Percent", category: "Gas Composition", unit: "%" },
  { label: "SO3 %", key: "so3Percent", category: "Gas Composition", unit: "%" },
  { label: "O2 %", key: "o2Percent", category: "Gas Composition", unit: "%" },
  { label: "CO2 %", key: "co2Percent", category: "Gas Composition", unit: "%" },
  { label: "N2 %", key: "n2Percent", category: "Gas Composition", unit: "%" },
  { label: "P Barometric", key: "pBarr", category: "Gas Composition", unit: "atm" },
  { label: "IPAT SO3 Removal", key: "ipatSo3Removal", category: "Gas Composition", unit: "%" },
  { label: "Plant Rate", key: "plantRate", category: "Process Inputs", unit: "STPD" },
  { label: "Pass 1 Inlet Velocity", key: "pass1InletVelocity", category: "Process Inputs", unit: "ft/min" },
  { label: "Converter Diameter", key: "converterDiameter", category: "Process Inputs", unit: "ft" },
  { label: "Pass 1 Inlet Temp", key: "pass1InletTemp", category: "Process Inputs", unit: "°C" },
  { label: "Pass 2 Inlet Temp", key: "pass2InletTemp", category: "Process Inputs", unit: "°C" },
  { label: "Pass 3 Inlet Temp", key: "pass3InletTemp", category: "Process Inputs", unit: "°C" },
  { label: "Pass 4 Inlet Temp", key: "pass4InletTemp", category: "Process Inputs", unit: "°C" },
  { label: "Pass 1 Inlet Pressure", key: "pass1InletPres", category: "Process Inputs", unit: "in WC" },
  { label: "Pass 2 Inlet Pressure", key: "pass2InletPres", category: "Process Inputs", unit: "in WC" },
  { label: "Pass 3 Inlet Pressure", key: "pass3InletPres", category: "Process Inputs", unit: "in WC" },
  { label: "Pass 4 Inlet Pressure", key: "pass4InletPres", category: "Process Inputs", unit: "in WC" },
  { label: "Pass 1 Catalyst Type #1", key: "pass1Type1", category: "Pass 1 Catalyst" },
  { label: "Pass 1 Loading #1", key: "pass1Liters1", category: "Pass 1 Catalyst", unit: "L/STPD" },
  { label: "Pass 1 Activity #1", key: "pass1Activity1", category: "Pass 1 Catalyst", unit: "%" },
  { label: "Pass 1 Catalyst Type #2", key: "pass1Type2", category: "Pass 1 Catalyst" },
  { label: "Pass 1 Loading #2", key: "pass1Liters2", category: "Pass 1 Catalyst", unit: "L/STPD" },
  { label: "Pass 1 Activity #2", key: "pass1Activity2", category: "Pass 1 Catalyst", unit: "%" },
  { label: "Pass 2 Catalyst Type", key: "pass2Type1", category: "Pass 2 Catalyst" },
  { label: "Pass 2 Loading", key: "pass2Liters1", category: "Pass 2 Catalyst", unit: "L/STPD" },
  { label: "Pass 2 Activity", key: "pass2Activity1", category: "Pass 2 Catalyst", unit: "%" },
  { label: "Pass 3 Catalyst Type", key: "pass3Type1", category: "Pass 3 Catalyst" },
  { label: "Pass 3 Loading", key: "pass3Liters1", category: "Pass 3 Catalyst", unit: "L/STPD" },
  { label: "Pass 3 Activity", key: "pass3Activity1", category: "Pass 3 Catalyst", unit: "%" },
  { label: "Pass 4 Catalyst Type #1", key: "pass4Type1", category: "Pass 4 Catalyst" },
  { label: "Pass 4 Loading #1", key: "pass4Liters1", category: "Pass 4 Catalyst", unit: "L/STPD" },
  { label: "Pass 4 Activity #1", key: "pass4Activity1", category: "Pass 4 Catalyst", unit: "%" },
  { label: "Pass 4 Catalyst Type #2", key: "pass4Type2", category: "Pass 4 Catalyst" },
  { label: "Pass 4 Loading #2", key: "pass4Liters2", category: "Pass 4 Catalyst", unit: "L/STPD" },
  { label: "Pass 4 Activity #2", key: "pass4Activity2", category: "Pass 4 Catalyst", unit: "%" },
];

export default function ConverterCases() {
  const { toast } = useToast();
  const [caseToDelete, setCaseToDelete] = useState<number | null>(null);

  const { data: cases = [], isLoading } = useQuery<ConverterCase[]>({
    queryKey: ["/api/converter-cases"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/converter-cases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/converter-cases"] });
      toast({
        title: "Case Deleted",
        description: "The converter case has been removed.",
      });
      setCaseToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete case.",
        variant: "destructive",
      });
    },
  });

  const categories = Array.from(new Set(parameterDefinitions.map((p) => p.category)));

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/unit-operation/catalytic-reactor">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Catalytic Reactor
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Converter Cases</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Saved Simulation Cases</span>
              <span className="text-sm font-normal text-muted-foreground">
                {cases.length} case{cases.length !== 1 ? "s" : ""} saved
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading cases...</span>
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No converter cases saved yet.</p>
                <p className="text-sm mt-2">
                  Go to the Catalytic Reactor simulator and click "Save as Case" to create one.
                </p>
                <Link href="/unit-operation/catalytic-reactor">
                  <Button className="mt-4" data-testid="button-go-to-simulator">
                    <Plus className="w-4 h-4 mr-2" />
                    Go to Simulator
                  </Button>
                </Link>
              </div>
            ) : (
              <ScrollArea className="w-full">
                <div className="min-w-max">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-2 font-semibold sticky left-0 bg-background z-10 min-w-[200px]">
                          Parameter
                        </th>
                        {cases.map((caseData) => (
                          <th
                            key={caseData.id}
                            className="text-center p-2 min-w-[150px]"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-semibold">{caseData.name}</span>
                              {caseData.description && (
                                <span className="text-xs text-muted-foreground font-normal">
                                  {caseData.description}
                                </span>
                              )}
                              <AlertDialog
                                open={caseToDelete === caseData.id}
                                onOpenChange={(open) =>
                                  setCaseToDelete(open ? caseData.id : null)
                                }
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    data-testid={`button-delete-case-${caseData.id}`}
                                  >
                                    <Trash2 className="w-3 h-3 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Case</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{caseData.name}"? This
                                      action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(caseData.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {deleteMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        "Delete"
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <>
                          <tr key={`cat-${category}`} className="bg-muted/50">
                            <td
                              colSpan={cases.length + 1}
                              className="p-2 font-semibold text-primary sticky left-0 bg-muted/50"
                            >
                              {category}
                            </td>
                          </tr>
                          {parameterDefinitions
                            .filter((p) => p.category === category)
                            .map((param) => (
                              <tr
                                key={param.key}
                                className="border-b border-border/50 hover:bg-muted/30"
                              >
                                <td className="p-2 sticky left-0 bg-background">
                                  <span>{param.label}</span>
                                  {param.unit && (
                                    <span className="text-muted-foreground ml-1">
                                      ({param.unit})
                                    </span>
                                  )}
                                </td>
                                {cases.map((caseData) => {
                                  // Parameters are stored in nested JSONB object
                                  const params = caseData.parameters as ConverterCaseParameters | undefined;
                                  const value = params?.[param.key];
                                  const displayValue = value ?? "-";
                                  return (
                                    <td
                                      key={`${caseData.id}-${param.key}`}
                                      className="p-2 text-center"
                                      data-testid={`cell-${param.key}-${caseData.id}`}
                                    >
                                      {displayValue}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
