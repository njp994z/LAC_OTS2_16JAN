import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FolderOpen, FileText, Workflow, Thermometer, GitBranch, ExternalLink } from "lucide-react";

interface DocumentEntry {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  filePath: string;
}

const documents: DocumentEntry[] = [
  {
    id: "pfd",
    title: "Process Flow Diagrams (PFDs)",
    description: "Thacker Pass Acid Plant process flow diagrams showing major equipment, process streams, and material flow paths including sulfur furnace, waste heat boiler, converter, and absorption towers.",
    icon: Workflow,
    filePath: "/assets/Process_Flow_Diagrams_PFDs_Thacker_Pass_Acid_Plant_1766796254178.pdf"
  },
  {
    id: "hmb",
    title: "Heat & Material Balances",
    description: "Comprehensive heat and material balance calculations for the Thacker Pass Acid Plant including stream compositions, temperatures, pressures, and flow rates for all process streams.",
    icon: Thermometer,
    filePath: "/assets/MASTER_Heat_+_Material_Balances_Thacker_Pass_Acid_Plant_1766796325339.pdf"
  },
  {
    id: "pid",
    title: "Piping & Instrumentation Diagrams (P&IDs)",
    description: "Detailed P&ID drawings showing instrumentation, control loops, valves, piping specifications, and equipment connections for the Thacker Pass sulfuric acid production facility.",
    icon: GitBranch,
    filePath: "/assets/Piping+Instrumentation_Diagrams_PIDs_Thacker_Pass_1766796331583.pdf"
  }
];

export default function PlantDocumentLibrary() {
  const [, setLocation] = useLocation();

  const handleOpenDocument = (filePath: string) => {
    window.open(filePath, '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings/databases")}
              data-testid="button-back-databases"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <FolderOpen className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Plant Document Library</h1>
                <p className="text-xs text-muted-foreground">Engineering documentation for Thacker Pass Acid Plant</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Engineering Documents</CardTitle>
                  <CardDescription>
                    Access technical drawings and reference materials for the sulfuric acid plant
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {documents.map((doc) => (
                  <Button
                    key={doc.id}
                    variant="default"
                    className="h-auto py-4 px-5 justify-start text-left"
                    onClick={() => handleOpenDocument(doc.filePath)}
                    data-testid={`button-document-${doc.id}`}
                  >
                    <doc.icon className="w-5 h-5 mr-4 flex-shrink-0" />
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{doc.title}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </div>
                      <span className="text-xs opacity-80 font-normal whitespace-normal">
                        {doc.description}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground text-sm">PFDs</h4>
                  <p className="text-xs text-muted-foreground">
                    Process Flow Diagrams show the overall plant layout, major equipment, and process stream connections at a high level.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground text-sm">H&M Balances</h4>
                  <p className="text-xs text-muted-foreground">
                    Heat and Material Balances provide stream data including compositions, temperatures, pressures, and flow rates.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground text-sm">P&IDs</h4>
                  <p className="text-xs text-muted-foreground">
                    Piping & Instrumentation Diagrams show detailed instrumentation, control systems, and piping specifications.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Plant Document Library | Thacker Pass Acid Plant</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
