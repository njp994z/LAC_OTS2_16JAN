import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Thermometer, Construction } from "lucide-react";
import { Link } from "wouter";
import expLogo from "@/assets/exp-logo.png";
import controlLoopDiagram from "@assets/image_1772155398688.png";

export default function Superheater4AEconomizer() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-[9999] border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/unit-operation-simulator")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-lg bg-primary/10">
              <Thermometer className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground" data-testid="text-page-title">
                Superheater 4A, Economizer 4C, Economizer 4A
              </h1>
              <p className="text-muted-foreground mt-1" data-testid="text-page-description">
                Heat recovery across SH-4A, ECON-4C, and ECON-4A for feedwater and steam circuit optimization
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <Construction className="h-16 w-16 text-muted-foreground" />
              <h2 className="text-2xl font-semibold text-foreground" data-testid="text-coming-soon">Coming Soon</h2>
              <p className="text-muted-foreground text-center max-w-md" data-testid="text-coming-soon-description">
                This simulator is currently under development. It will include static and dynamic modeling of Superheater 4A, Economizer 4C, and Economizer 4A heat exchangers.
              </p>
              <Button
                variant="outline"
                onClick={() => setLocation("/unit-operation-simulator")}
                className="mt-4"
                data-testid="button-back-to-simulators"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Unit Operations
              </Button>
            </CardContent>
          </Card>

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
