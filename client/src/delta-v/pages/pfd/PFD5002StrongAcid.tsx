import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { PFDNavigation } from "../../components/PFDNavigation";
import strongAcidDiagram from "@assets/image_1769102728704.png";

const id = "5002";
const documentNumber = "1520-PR-PFD-0000-EXP-5002";
const title = "STRONG ACID";

export default function PFD5002StrongAcid() {
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
              src={strongAcidDiagram}
              alt="Strong Acid PFD Diagram"
              className="w-full h-auto"
              data-testid="img-strong-acid-diagram"
            />
          </div>
        </div>
      </main>

      <PFDNavigation position="bottom-right" />
    </div>
  );
}
