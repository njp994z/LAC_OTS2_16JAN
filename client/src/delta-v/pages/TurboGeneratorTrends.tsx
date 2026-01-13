import { TrendingUp, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const TurboGeneratorTrends = () => {
  const trendData = [
    { time: "00:00", speed: 3200, power: 32, steamFlow: 65 },
    { time: "04:00", speed: 3400, power: 38, steamFlow: 72 },
    { time: "08:00", speed: 3550, power: 45, steamFlow: 88 },
    { time: "12:00", speed: 3600, power: 48, steamFlow: 95 },
    { time: "16:00", speed: 3500, power: 42, steamFlow: 82 },
    { time: "20:00", speed: 3400, power: 38, steamFlow: 75 },
    { time: "24:00", speed: 3300, power: 35, steamFlow: 68 },
  ];

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
            <TrendingUp className="text-primary" size={24} />
            <h1 className="text-2xl font-bold">Turbo Generator Trends</h1>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">24-Hour Performance Trends</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="speed" stroke="#22c55e" strokeWidth={2} name="Speed RPM" />
                <Line type="monotone" dataKey="power" stroke="#3b82f6" strokeWidth={2} name="Power MW" />
                <Line type="monotone" dataKey="steamFlow" stroke="#f59e0b" strokeWidth={2} name="Steam Flow %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-500">3421 RPM</div>
            <div className="text-sm text-muted-foreground">Avg Speed</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">39.7 MW</div>
            <div className="text-sm text-muted-foreground">Avg Power</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">77.9%</div>
            <div className="text-sm text-muted-foreground">Avg Steam Flow</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurboGeneratorTrends;
