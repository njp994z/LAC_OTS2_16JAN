import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft } from "lucide-react";

const SulfurFlowControllerFaceplate = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="fixed inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative text-center max-w-2xl mx-auto">
        <Link
          to="/flow-controller"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Flow Controllers
        </Link>

        <h1
          className={cn(
            "text-4xl md:text-5xl font-bold mb-4 tracking-tight",
            "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent",
          )}
        >
          1530-F-2602 Sulfur Flow Controller
        </h1>

        <p className="text-muted-foreground text-lg mb-12 tracking-wide">
          Sulfur Flow Controller HMI Components
        </p>

        <div className="flex flex-col gap-4 items-center">
          {[
            { to: "/sulfur-flow-controller-main", label: "1530-F-2602 Sulfur Flow Controller Faceplate" },
            { to: "/settings/controller-outputs/faceplates/faceplate-3a/1530-F-2602", label: "Faceplate 3A - PID Simulation" },
            { to: "/settings/controller-outputs/faceplates/faceplate-3b/1530-F-2602", label: "Faceplate 3B - Parameter Tracking" },
            { to: "/settings/controller-outputs/faceplates/faceplate-3c/1530-F-2602", label: "Faceplate 3C - Trend/Live Data" },
            { to: "/settings/controller-outputs/faceplates/faceplate-3d/1530-F-2602", label: "Faceplate 3D - Control Studio" },
            { to: "/settings/controller-outputs/faceplates/faceplate-3e/1530-F-2602", label: "Faceplate 3E - Controller Input GUI" },
            { to: "/settings/controller-outputs/faceplates/faceplate-3f/1530-F-2602", label: "Faceplate 3F - Acknowledge Alarm" },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "group inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300",
                "bg-gradient-to-br from-primary/20 to-cyan-600/10",
                "text-primary border-2 border-primary/40",
                "hover:from-primary/30 hover:to-cyan-600/20 hover:border-primary/60",
                "hover:shadow-lg hover:shadow-primary/20",
                "active:scale-95",
              )}
            >
              {label}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SulfurFlowControllerFaceplate;
