import { Link } from 'wouter';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useControllerSync } from '@/delta-v/contexts/ControllerSyncContext';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface TrendDataPoint {
  time: number;
  timeLabel: string;
  pv: number;
  sp: number;
  out: number;
}

const chartConfig = {
  pv: {
    label: 'PV',
    color: 'hsl(45, 93%, 58%)',
  },
  sp: {
    label: 'SP',
    color: 'hsl(0, 0%, 100%)',
  },
  out: {
    label: 'OUT',
    color: 'hsl(195, 80%, 50%)',
  },
};

const TempSensor4826Faceplate3C = () => {
  const activeControllerId = '1540-TI-4826';
  
  const { state } = useControllerSync(activeControllerId);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);

  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  }, []);

  useEffect(() => {
    const addDataPoint = () => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      setTrendData(prev => {
        const newPoint: TrendDataPoint = {
          time: now,
          timeLabel: formatTime(now),
          pv: state.syncedPV,
          sp: state.syncedSP,
          out: state.syncedOUT,
        };

        const filtered = prev.filter(p => p.time > oneHourAgo);
        return [...filtered, newPoint];
      });
    };

    addDataPoint();

    const interval = setInterval(addDataPoint, 2000);
    return () => clearInterval(interval);
  }, [state.syncedPV, state.syncedSP, state.syncedOUT, formatTime]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 deltav-grid-pattern">
      <div className="container mx-auto py-8 px-4">
        <Link
          to="/settings/controller-outputs/faceplates/temp-sensor/1540-TI-4826"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span>Back to 1540-TI-4826 Temperature Sensor</span>
        </Link>

        <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-8 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-faceplate-border glow-text mb-2 flex items-center gap-3">
            <TrendingUp className="text-cyan-400" />
            Trend (Live Data Only)
          </h1>
          <p className="text-muted-foreground mb-8">Faceplate 3C - Real-time process data trending (1 hour window)</p>

          <div className="space-y-6">
            <div className="flex gap-6 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-400 rounded" />
                <span className="text-sm text-muted-foreground">PV (Process Value): {state.syncedPV.toFixed(1)} F</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white rounded" />
                <span className="text-sm text-muted-foreground">SP (Setpoint): {state.syncedSP.toFixed(1)} F</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-cyan-400 rounded" />
                <span className="text-sm text-muted-foreground">OUT (Output): {state.syncedOUT.toFixed(1)}%</span>
              </div>
            </div>

            <div className="h-80 bg-slate-950 rounded-lg border border-border/50 p-4">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 30%)" />
                  <XAxis 
                    dataKey="timeLabel" 
                    stroke="hsl(215 20% 65%)"
                    fontSize={11}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    stroke="hsl(215 20% 65%)"
                    fontSize={11}
                    tickLine={false}
                    domain={[0, 2000]}
                    label={{ value: 'Temp (F)', angle: -90, position: 'insideLeft', fill: 'hsl(215 20% 65%)' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="pv" 
                    stroke="hsl(45, 93%, 58%)" 
                    strokeWidth={2}
                    dot={false}
                    name="PV"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sp" 
                    stroke="hsl(0, 0%, 100%)" 
                    strokeWidth={2}
                    dot={false}
                    name="SP"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="out" 
                    stroke="hsl(195, 80%, 50%)" 
                    strokeWidth={2}
                    dot={false}
                    name="OUT"
                  />
                </LineChart>
              </ChartContainer>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-sm text-muted-foreground">
              <span>-60 min</span>
              <span>-45 min</span>
              <span>-30 min</span>
              <span>-15 min</span>
              <span>Now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TempSensor4826Faceplate3C;
