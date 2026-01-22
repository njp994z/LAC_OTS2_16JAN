import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { PFDNavigation } from "../../components/PFDNavigation";

interface PFDPageTemplateProps {
  id: string;
  documentNumber: string;
  title: string;
}

export function PFDPageTemplate({
  id,
  documentNumber,
  title,
}: PFDPageTemplateProps) {
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
            <div className="text-xs text-muted-foreground font-mono">
              {documentNumber}
            </div>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <FileText className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Process Flow Diagram
          </h2>
          <p className="text-muted-foreground mb-4">
            {title}
          </p>
          <div className="text-sm text-muted-foreground font-mono bg-muted px-4 py-2 rounded-md inline-block">
            {documentNumber}
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            This PFD page is a placeholder. The actual process flow diagram content will be added here.
          </p>
        </div>
      </main>

      <PFDNavigation position="bottom-right" />
    </div>
  );
}
