import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      {/* Background pattern */}
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
        <h1
          className={cn(
            "text-4xl md:text-5xl font-bold mb-4 tracking-tight",
            "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent",
          )}
        >
          Faceplates
        </h1>

        <p className="text-muted-foreground text-lg mb-12 tracking-wide">
          Industrial HMI Interface Components • Python Backend Ready
        </p>

        <div className="flex flex-col gap-4 items-center">
          {[
            { href: "/settings/controller-outputs/faceplates/home-screen", label: "Home Screen" },
            { href: "/settings/controller-outputs/faceplates/controller-blocks", label: "Delta V Controller Faceplates" },
            { href: "/settings/controller-outputs/faceplates/rotating-equipment", label: "Compressor / Blower Faceplates" },
            { href: "/settings/controller-outputs/faceplates/sensor-blocks", label: "Delta V Sensor Faceplates" },
            { href: "/settings/controller-outputs/faceplates/valve-blocks", label: "Delta V Valve Faceplates" },
            { href: "/settings/controller-outputs/faceplates/alarm-blocks", label: "Delta V Alarm Faceplates" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
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

export default Landing;
