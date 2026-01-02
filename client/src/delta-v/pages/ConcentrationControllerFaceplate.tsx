import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { ArrowLeft, Clock } from "lucide-react";

const ConcentrationControllerFaceplate = () => {
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
          to="/controller-faceplates"
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
          Delta V Concentration Controller
        </h1>

        <div className="flex flex-col items-center gap-6 mt-12">
          <Clock className="w-16 h-16 text-muted-foreground" />
          <p className="text-2xl text-muted-foreground font-medium">Coming Soon</p>
          <p className="text-muted-foreground">Concentration controller faceplates are under development.</p>
        </div>
      </div>
    </div>
  );
};

export default ConcentrationControllerFaceplate;
