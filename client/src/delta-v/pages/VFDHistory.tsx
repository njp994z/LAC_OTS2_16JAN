import { History, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const VFDHistory = () => {
  const historyEvents = [
    { id: 1, time: "14:32:15", event: "Mode changed to AUTO", type: "info" },
    { id: 2, time: "14:28:00", event: "Speed setpoint changed to 75%", type: "info" },
    { id: 3, time: "14:15:22", event: "VFD Started", type: "success" },
    { id: 4, time: "13:45:10", event: "Alarm cleared: OVERCURRENT", type: "warning" },
    { id: 5, time: "13:44:55", event: "Alarm: OVERCURRENT", type: "error" },
    { id: 6, time: "12:00:00", event: "VFD Stopped", type: "info" },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success": return "text-emerald-500";
      case "warning": return "text-amber-500";
      case "error": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link 
            to="/settings/controller-outputs/faceplates/compressor-faceplate" 
            className="p-2 rounded-lg bg-card hover:bg-muted border border-border transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <History className="text-primary" size={24} />
            <h1 className="text-2xl font-bold">VFD History</h1>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <h2 className="font-semibold">Event Log</h2>
          </div>
          <div className="divide-y divide-border">
            {historyEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-4 px-4 py-3">
                <span className="text-xs text-muted-foreground font-mono w-20">{event.time}</span>
                <span className={`flex-1 ${getTypeColor(event.type)}`}>{event.event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VFDHistory;
