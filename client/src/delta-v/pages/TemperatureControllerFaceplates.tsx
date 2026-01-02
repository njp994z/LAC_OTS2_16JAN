import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft } from "lucide-react";

const TemperatureControllerFaceplates = () => {
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
          Delta V Temperature Controller
        </h1>

        <p className="text-muted-foreground text-lg mb-12 tracking-wide">
          Temperature Controller HMI Components
        </p>

        <div className="flex flex-col gap-4 items-center">
          {[
            { to: "/controller-5823", label: "1520-T-5823 DT SA Inlet Temperature Controller" },
            { to: "/controller-6722", label: "1520-T-6722 IPAT SA Inlet Temperature Controller" },
            { to: "/controller", label: "1520-T-6622 FAT SA Inlet Temperature Controller" },
            { to: "/controller-4828", label: "1540-T-4828 Pass 2 Inlet Temperature Controller" },
            { to: "/controller-5220", label: "1540-T-5220 Pass 3 Inlet Temperature Controller" },
            { to: "/controller-5224", label: "1540-T-5224 Pass 4 Inlet Temperature Controller" },
            { to: "/controller-7221", label: "1540-T-7221 Econ 4A Outlet Temperature Controller" },
            { to: "/controller-7224", label: "1540-T-7224 Econ 3B Outlet Temperature Controller" },
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

export default TemperatureControllerFaceplates;
