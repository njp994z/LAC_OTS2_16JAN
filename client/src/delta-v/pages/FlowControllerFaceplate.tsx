import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

const flowControllers = [
  { id: "1530-F-2602", name: "Sulfur Flow Controller", to: "/sulfur-flow-controller" },
  { id: "1520-F-5870", name: "DT SA Inlet Flow Controller", to: null },
  { id: "1520-F-6770", name: "IPAT SA Inlet Controller", to: null },
  { id: "1520-F-6670", name: "FAT SA Inlet Controller", to: null },
];

const FlowControllerFaceplate = () => {
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
          to="/settings/controller-outputs/faceplates/controller-blocks"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Controller Faceplates
        </Link>

        <h1
          className={cn(
            "text-4xl md:text-5xl font-bold mb-4 tracking-tight",
            "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent",
          )}
        >
          Delta V Flow Controller
        </h1>

        <p className="text-muted-foreground mb-12">
          Select a flow controller faceplate to view
        </p>

        <div className="flex flex-col items-center gap-4">
          {flowControllers.map((controller) => 
            controller.to ? (
              <Link
                key={controller.id}
                to={controller.to}
                className={cn(
                  "w-full max-w-md px-6 py-4 rounded-lg border-2 border-blue-600",
                  "bg-blue-700 hover:bg-blue-600 transition-colors",
                  "text-white font-semibold text-center"
                )}
              >
                <div className="text-lg">{controller.id}</div>
                <div className="text-sm">{controller.name}</div>
              </Link>
            ) : (
              <button
                key={controller.id}
                className={cn(
                  "w-full max-w-md px-6 py-4 rounded-lg border-2 border-blue-600",
                  "bg-blue-700 hover:bg-blue-600 transition-colors",
                  "text-white font-semibold text-center",
                  "cursor-not-allowed opacity-80"
                )}
                disabled
                title="Coming Soon"
              >
                <div className="text-lg">{controller.id}</div>
                <div className="text-sm">{controller.name}</div>
              </button>
            )
          )}
        </div>

        <p className="text-muted-foreground mt-8 text-sm">
          Flow controller faceplates are coming soon
        </p>
      </div>
    </div>
  );
};

export default FlowControllerFaceplate;
