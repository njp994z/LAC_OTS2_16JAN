import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Play, Square, Trash2, Download } from 'lucide-react';
import { useControllerSync } from '@/delta-v/contexts/ControllerSyncContext';
import { LoopTimeseriesRow, defaultPIDHxBypassConfig } from '@/delta-v/types/pidHxBypassConfig';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const TEMP_SENSOR_4821_TIMESERIES_KEY = 'temp_sensor_4821_timeseries';
const TEMP_SENSOR_4821_PID_CONFIG_KEY = 'temp_sensor_4821_pid_config';

const TempSensor4821Faceplate3B = () => {
  const activeControllerId = '1540-TI-4821';
  
  const { state } = useControllerSync(activeControllerId);
  const [isLogging, setIsLogging] = useState(false);
  const [sampleRate, setSampleRate] = useState(1000);
  const [maxRows, setMaxRows] = useState(100);
  const [autoScroll, setAutoScroll] = useState(true);
  const [logData, setLogData] = useState<LoopTimeseriesRow[]>([]);
  const tableEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const captureRef = useRef<() => void>(() => {});

  const [config, setConfig] = useState({
    ...defaultPIDHxBypassConfig,
    loop_tag: '1540-TI-4821',
    service_desc: 'Pass 1 Temperature',
    eng_units: 'F',
  });

  useEffect(() => {
    const saved = localStorage.getItem(TEMP_SENSOR_4821_PID_CONFIG_KEY);
    if (saved) {
      try {
        setConfig({ ...defaultPIDHxBypassConfig, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Failed to load config:', e);
      }
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(TEMP_SENSOR_4821_TIMESERIES_KEY);
    if (saved) {
      try {
        setLogData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load log data:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (logData.length > 0) {
      localStorage.setItem(TEMP_SENSOR_4821_TIMESERIES_KEY, JSON.stringify(logData.slice(-maxRows)));
    }
  }, [logData, maxRows]);

  useEffect(() => {
    if (autoScroll && tableEndRef.current) {
      tableEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logData, autoScroll]);

  const captureDataPoint = useCallback(() => {
    const now = new Date().toISOString();
    const Tsp = state.syncedSP;
    const Tmeas = state.syncedPV;
    const u = state.syncedOUT;
    
    const e = Tsp - Tmeas;
    const x = (u / 100) * (config.x_max - config.x_min) + config.x_min;
    const Tin = config.Tin0;
    const Thx = config.Thx0;
    const Tout = config.use_exact_mixing 
      ? x * Tin + (1 - x) * Thx 
      : config.Tout0 + config.Kmix_degC_per_x * (x - config.xbar);

    const row: LoopTimeseriesRow = {
      ts_utc: now,
      loop_tag: config.loop_tag,
      Tsp,
      Tmeas,
      Tin,
      Thx,
      Tout,
      e,
      u,
      x,
      mode: state.syncedMode,
      note: '',
    };

    setLogData(prev => {
      const updated = [...prev, row];
      return updated.slice(-maxRows);
    });
  }, [state, config, maxRows]);

  useEffect(() => {
    captureRef.current = captureDataPoint;
  }, [captureDataPoint]);

  useEffect(() => {
    if (isLogging) {
      intervalRef.current = setInterval(() => {
        captureRef.current();
      }, sampleRate);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLogging, sampleRate]);

  const handleClearLog = () => {
    setLogData([]);
    localStorage.removeItem(TEMP_SENSOR_4821_TIMESERIES_KEY);
  };

  const handleExportCSV = () => {
    if (logData.length === 0) return;
    
    const headers = ['Timestamp', 'Loop Tag', 'Tsp', 'Tmeas', 'Tin', 'Thx', 'Tout', 'e', 'u', 'x', 'Mode', 'Note'];
    const csvRows = [
      headers.join(','),
      ...logData.map(row => [
        row.ts_utc,
        row.loop_tag,
        row.Tsp.toFixed(2),
        row.Tmeas.toFixed(2),
        row.Tin.toFixed(2),
        row.Thx.toFixed(2),
        row.Tout.toFixed(2),
        row.e.toFixed(3),
        row.u.toFixed(2),
        row.x.toFixed(4),
        row.mode,
        row.note,
      ].join(','))
    ];
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `temp_sensor_4821_timeseries_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    const time = date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0').slice(0, 1);
    return `${time}.${ms}`;
  };

  const getRowClassName = (row: LoopTimeseriesRow) => {
    const absError = Math.abs(row.e);
    if (row.mode === 'MAN') return 'bg-orange-500/10';
    if (row.mode === 'BYPASS') return 'bg-purple-500/10';
    if (absError > 5) return 'bg-red-500/15';
    if (absError > 2) return 'bg-yellow-500/10';
    return '';
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'AUTO': return 'text-emerald-400';
      case 'MAN': return 'text-orange-400';
      case 'BYPASS': return 'text-purple-400';
      case 'CAS': case 'RCAS': return 'text-cyan-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 deltav-grid-pattern">
      <div className="container mx-auto py-6 px-4">
        <Link
          to="/settings/controller-outputs/faceplates/temp-sensor/1540-TI-4821"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          <span>Back to 1540-TI-4821 Temperature Sensor</span>
        </Link>

        <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-6 max-w-6xl mx-auto">
          <h1 className="text-xl font-bold text-faceplate-border glow-text mb-1">
            Parameter Tracking
          </h1>
          <p className="text-muted-foreground text-sm mb-6">Faceplate 3B - Control Loop Data Logger</p>

          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50 text-center">
              <h3 className="text-xs font-medium text-muted-foreground mb-1">Mode</h3>
              <p className={`text-lg font-mono font-bold ${getModeColor(state.syncedMode)}`}>
                {state.syncedMode}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50 text-center">
              <h3 className="text-xs font-medium text-muted-foreground mb-1">PV (Tmeas)</h3>
              <p className="text-lg font-mono font-bold text-amber-400">
                {state.syncedPV.toFixed(1)} {config.eng_units}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50 text-center">
              <h3 className="text-xs font-medium text-muted-foreground mb-1">SP (Tsp)</h3>
              <p className="text-lg font-mono font-bold text-white">
                {state.syncedSP.toFixed(1)} {config.eng_units}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50 text-center">
              <h3 className="text-xs font-medium text-muted-foreground mb-1">OUT (u)</h3>
              <p className="text-lg font-mono font-bold text-cyan-400">
                {state.syncedOUT.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-muted/20 rounded-lg border border-border/30">
            <Button
              onClick={() => {
                if (!isLogging) {
                  captureDataPoint();
                }
                setIsLogging(!isLogging);
              }}
              variant={isLogging ? "destructive" : "default"}
              size="sm"
              className="gap-2"
            >
              {isLogging ? <Square size={14} /> : <Play size={14} />}
              {isLogging ? 'Stop' : 'Start'}
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rate:</span>
              <Select value={sampleRate.toString()} onValueChange={(v) => setSampleRate(Number(v))}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="250">250ms</SelectItem>
                  <SelectItem value="500">500ms</SelectItem>
                  <SelectItem value="1000">1s</SelectItem>
                  <SelectItem value="2000">2s</SelectItem>
                  <SelectItem value="5000">5s</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Max:</span>
              <Select value={maxRows.toString()} onValueChange={(v) => setMaxRows(Number(v))}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
                id="auto-scroll"
              />
              <label htmlFor="auto-scroll" className="text-xs text-muted-foreground cursor-pointer">
                Auto-scroll
              </label>
            </div>

            <div className="flex-1" />

            <Button
              onClick={handleClearLog}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={logData.length === 0}
            >
              <Trash2 size={14} />
              Clear
            </Button>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={logData.length === 0}
            >
              <Download size={14} />
              Export CSV
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
            <span>
              {isLogging ? (
                <span className="text-emerald-400">● Recording</span>
              ) : (
                <span className="text-muted-foreground">○ Stopped</span>
              )}
            </span>
            <span>{logData.length} / {maxRows} rows</span>
            <span>Loop: {config.loop_tag}</span>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-slate-800 z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-cyan-400 w-24">Time</TableHead>
                    <TableHead className="text-xs font-semibold text-white w-16 text-right">Tsp</TableHead>
                    <TableHead className="text-xs font-semibold text-amber-400 w-16 text-right">Tmeas</TableHead>
                    <TableHead className="text-xs font-semibold text-red-400 w-16 text-right">e</TableHead>
                    <TableHead className="text-xs font-semibold text-cyan-400 w-14 text-right">u%</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground w-16 text-center">Mode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No data logged. Click "Start" to begin recording.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logData.map((row, idx) => (
                      <TableRow key={idx} className={`${getRowClassName(row)} hover:bg-muted/30`}>
                        <TableCell className="font-mono text-xs text-cyan-300 py-1.5">
                          {formatTimestamp(row.ts_utc)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-white text-right py-1.5">
                          {row.Tsp.toFixed(1)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-amber-400 text-right py-1.5">
                          {row.Tmeas.toFixed(1)}
                        </TableCell>
                        <TableCell className={`font-mono text-xs text-right py-1.5 ${
                          Math.abs(row.e) > 5 ? 'text-red-400' : 
                          Math.abs(row.e) > 2 ? 'text-yellow-400' : 'text-emerald-400'
                        }`}>
                          {row.e >= 0 ? '+' : ''}{row.e.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-cyan-400 text-right py-1.5">
                          {row.u.toFixed(1)}
                        </TableCell>
                        <TableCell className={`font-mono text-xs text-center py-1.5 ${getModeColor(row.mode)}`}>
                          {row.mode}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div ref={tableEndRef} />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" /> |e| &gt; 5
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/30" /> |e| &gt; 2
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/30" /> MAN mode
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TempSensor4821Faceplate3B;
