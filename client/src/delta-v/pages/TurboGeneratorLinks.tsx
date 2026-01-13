import { Link2, ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const TurboGeneratorLinks = () => {
  const linkedEquipment = [
    { id: 1, name: "Steam Turbine ST-1560", type: "Turbine", status: "Running" },
    { id: 2, name: "Generator G-1560", type: "Generator", status: "Synchronized" },
    { id: 3, name: "Steam Inlet Valve SV-1560", type: "Valve", status: "Open" },
    { id: 4, name: "Exhaust Valve EV-1560", type: "Valve", status: "Open" },
    { id: 5, name: "Speed Transmitter ST-1560", type: "Sensor", status: "Normal" },
    { id: 6, name: "Power Meter PM-1560", type: "Sensor", status: "Normal" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Running": return "text-emerald-500 bg-emerald-500/10";
      case "Synchronized": return "text-emerald-500 bg-emerald-500/10";
      case "Open": return "text-cyan-500 bg-cyan-500/10";
      case "Normal": return "text-blue-500 bg-blue-500/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link 
            to="/settings/controller-outputs/faceplates/turbo-generator-faceplate" 
            className="p-2 rounded-lg bg-card hover:bg-muted border border-border transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Link2 className="text-primary" size={24} />
            <h1 className="text-2xl font-bold">Turbo Generator Links</h1>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <h2 className="font-semibold">Linked Equipment</h2>
          </div>
          <div className="divide-y divide-border">
            {linkedEquipment.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  <ExternalLink size={16} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurboGeneratorLinks;
