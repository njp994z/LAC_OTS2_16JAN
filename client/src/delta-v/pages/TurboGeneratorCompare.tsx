import { ArrowLeftRight, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const TurboGeneratorCompare = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link 
            to="/settings/controller-outputs/faceplates/turbo-generator-faceplate" 
            className="p-2 rounded-lg bg-card hover:bg-muted border border-border transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="text-primary" size={24} />
            <h1 className="text-2xl font-bold">Turbo Generator Compare</h1>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* TG 1 */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 border-b border-border">
              <h2 className="font-semibold">TG-001 (Primary)</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Speed</span>
                <span className="font-medium text-emerald-500">3580 RPM</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Power Output</span>
                <span className="font-medium">42.5 MW</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Steam Flow</span>
                <span className="font-medium">85.3%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-emerald-500">Running</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-medium">AUTO</span>
              </div>
            </div>
          </div>

          {/* TG 2 */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 border-b border-border">
              <h2 className="font-semibold">TG-002 (Backup)</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Speed</span>
                <span className="font-medium text-amber-500">0 RPM</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Power Output</span>
                <span className="font-medium">0.0 MW</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Steam Flow</span>
                <span className="font-medium">0.0%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-amber-500">Standby</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-medium">CAS</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Comparison Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-emerald-500">+3580 RPM</div>
              <div className="text-xs text-muted-foreground">Speed Difference</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-500">+42.5 MW</div>
              <div className="text-xs text-muted-foreground">Power Difference</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-500">+85.3%</div>
              <div className="text-xs text-muted-foreground">Steam Flow Difference</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurboGeneratorCompare;
