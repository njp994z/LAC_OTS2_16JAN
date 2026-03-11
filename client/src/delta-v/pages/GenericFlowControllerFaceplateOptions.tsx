import { Link, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft } from "lucide-react";

const GenericFlowControllerFaceplateOptions = () => {
  const [, params] = useRoute(
    "/settings/controller-outputs/faceplates/flow-controller/:id",
  );
  const controllerId = params?.id || "Unknown Controller";

  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const controllerName = searchParams.get("name") || controllerId;

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
          href="/settings/controller-outputs/faceplates/flow-controller"
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
          {controllerName} Faceplate Options
        </h1>

        <p className="text-muted-foreground text-lg mb-12 tracking-wide">
          Flow Controller HMI Components
        </p>

        <div className="flex flex-col gap-4 items-center">
          {[
            {
              href: `/settings/controller-outputs/faceplates/controller/${controllerId}`,
              label: `${controllerId} ${controllerName} Faceplate`,
            },
            {
              href: `/settings/controller-outputs/faceplates/faceplate-3a/${controllerId}`,
              label: "Faceplate 3A - PID Simulation",
            },
            {
              href: `/settings/controller-outputs/faceplates/faceplate-3b/${controllerId}`,
              label: "Faceplate 3B - Parameter Tracking",
            },
            {
              href: `/settings/controller-outputs/faceplates/faceplate-3c/${controllerId}`,
              label: "Faceplate 3C - Trend/Live Data",
            },
            {
              href: `/settings/controller-outputs/faceplates/faceplate-3d/${controllerId}`,
              label: "Faceplate 3D - Control Studio",
            },
            {
              href: `/settings/controller-outputs/faceplates/faceplate-3e/${controllerId}`,
              label: "Faceplate 3E - Controller Input GUI",
            },
            {
              href: `/settings/controller-outputs/faceplates/faceplate-3f/${controllerId}`,
              label: "Faceplate 3F - Acknowledge Alarm",
            },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "group w-full max-w-xl inline-flex items-center justify-between px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300",
                "bg-gradient-to-br from-primary/20 to-cyan-600/10",
                "text-primary border-2 border-primary/40",
                "hover:from-primary/30 hover:to-cyan-600/20 hover:border-primary/60",
                "hover:shadow-lg hover:shadow-primary/20",
                "active:scale-95",
              )}
            >
              <span>{label}</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GenericFlowControllerFaceplateOptions;
