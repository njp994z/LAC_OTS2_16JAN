import { Bell, ArrowLeft, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";

const VFDAlarms = () => {
  const alarms = [
    { id: 1, time: "14:32:15", param: "OVERCURRENT", severity: "high", active: true, acknowledged: false },
    { id: 2, time: "13:45:10", param: "HIGH_TEMP", severity: "medium", active: false, acknowledged: true },
    { id: 3, time: "12:20:00", param: "LOW_SPEED", severity: "low", active: false, acknowledged: true },
    { id: 4, time: "10:15:30", param: "COMM_FAULT", severity: "high", active: false, acknowledged: true },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-500 bg-red-500/10 border-red-500/30";
      case "medium": return "text-amber-500 bg-amber-500/10 border-amber-500/30";
      case "low": return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      default: return "text-muted-foreground bg-muted border-border";
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
            <Bell className="text-primary" size={24} />
            <h1 className="text-2xl font-bold">VFD Alarms</h1>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-500">1</div>
            <div className="text-sm text-muted-foreground">Active Alarms</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-amber-500">1</div>
            <div className="text-sm text-muted-foreground">Unacknowledged</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-emerald-500">3</div>
            <div className="text-sm text-muted-foreground">Cleared Today</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Alarm History</h2>
            <button className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
              Acknowledge All
            </button>
          </div>
          <div className="divide-y divide-border">
            {alarms.map((alarm) => (
              <div key={alarm.id} className={`flex items-center gap-4 px-4 py-3 ${alarm.active ? 'bg-red-500/5' : ''}`}>
                <div className="flex items-center justify-center w-8">
                  {alarm.active ? (
                    <AlertTriangle size={18} className="text-red-500 animate-pulse" />
                  ) : alarm.acknowledged ? (
                    <CheckCircle size={18} className="text-emerald-500" />
                  ) : (
                    <XCircle size={18} className="text-amber-500" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-mono w-20">{alarm.time}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(alarm.severity)}`}>
                  {alarm.severity.toUpperCase()}
                </span>
                <span className="flex-1 font-medium">{alarm.param}</span>
                <span className={`text-xs ${alarm.active ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {alarm.active ? 'ACTIVE' : 'CLEARED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VFDAlarms;
