import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import expLogo from "@/assets/exp-logo.png";
import controlLoopDiagram from "@assets/image_1772155236627.png";

export default function Economizer() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <h1 className="text-3xl font-semibold text-foreground mb-4" data-testid="text-page-title">Economizer Simulator</h1>
          <p className="text-muted-foreground" data-testid="text-coming-soon">Coming Soon</p>

          <Card>
            <CardContent className="p-4">
              <img
                src={controlLoopDiagram}
                alt="Control Loop - Economizer 4A FAT Inlet Temperature"
                className="w-full rounded"
                data-testid="img-control-loop-diagram"
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
