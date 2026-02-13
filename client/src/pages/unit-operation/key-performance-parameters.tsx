import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, BarChart3, Construction } from "lucide-react";
import expLogo from "@/assets/exp-logo.png";

export default function KeyPerformanceParameters() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/unit-operation-simulator">
              <Button variant="ghost" size="icon" data-testid="button-back"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-lg font-bold leading-tight" data-testid="text-page-title">Key Performance Parameters</h1>
                <p className="text-xs text-muted-foreground">Critical plant performance indicators</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Construction className="h-5 w-5 text-yellow-500" />
                Coming Soon
              </CardTitle>
              <CardDescription>
                The Key Performance Parameters module is under development. This tool will provide real-time monitoring and evaluation of critical plant metrics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 border border-dashed">
                <h3 className="font-semibold text-lg mb-4" data-testid="text-planned-features">Planned Features</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">1.</span>
                    <span>Overall SO₂ conversion efficiency tracking across all catalyst passes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">2.</span>
                    <span>Energy recovery metrics including waste heat boiler and superheater performance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">3.</span>
                    <span>Stack emission rate monitoring for SO₂ and acid mist compliance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">4.</span>
                    <span>Acid production rate and concentration quality indicators</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">5.</span>
                    <span>Equipment effectiveness metrics for compressors, pumps, and heat exchangers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">6.</span>
                    <span>Historical trend analysis and performance benchmarking dashboards</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
