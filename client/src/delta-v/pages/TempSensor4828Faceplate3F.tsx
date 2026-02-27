import { Link } from 'wouter';
import { ArrowLeft, Bell, CheckCircle, AlertTriangle } from 'lucide-react';
import { useControllerSync } from '@/delta-v/contexts/ControllerSyncContext';
import { useControllerConfig } from '@/delta-v/contexts/ControllerConfigContext';
import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

const ALARM_INFO: Record<string, { name: string; priority: 'critical' | 'warning' }> = {
  HH: { name: 'High-High Alarm', priority: 'critical' },
  LL: { name: 'Low-Low Alarm', priority: 'critical' },
  H: { name: 'High Alarm', priority: 'warning' },
  L: { name: 'Low Alarm', priority: 'warning' },
  DH: { name: 'Deviation High', priority: 'warning' },
  DL: { name: 'Deviation Low', priority: 'warning' },
};

const TempSensor4828Faceplate3F = () => {
  const activeControllerId = '1540-TI-4828';
  
  const { state, addAlarmLogEntry, acknowledgeAlarm, acknowledgeAllAlarms, updateAlarmStates } = useControllerSync(activeControllerId);
  const { getControllerConfig } = useControllerConfig();
  const config = getControllerConfig(activeControllerId);
  
  const prevAlarmStates = useRef(state.alarmStates);

  useEffect(() => {
    const prev = prevAlarmStates.current;
    const current = state.alarmStates;
    
    (Object.keys(ALARM_INFO) as Array<keyof typeof ALARM_INFO>).forEach((alarmType) => {
      const wasActive = prev[alarmType as keyof typeof prev];
      const isActive = current[alarmType as keyof typeof current];
      
      if (!wasActive && isActive) {
        const info = ALARM_INFO[alarmType];
        const limit = alarmType === 'HH' ? config.ALM_HH_LIM
          : alarmType === 'LL' ? config.ALM_LL_LIM
          : alarmType === 'H' ? config.ALM_H_LIM
          : alarmType === 'L' ? config.ALM_L_LIM
          : alarmType === 'DH' ? config.ALM_DH_LIM
          : config.ALM_DL_LIM;
        
        addAlarmLogEntry({
          timestamp: new Date(),
          tag: config.TAGNAME || '1540-TI-4828',
          alarmType: alarmType as 'LL' | 'L' | 'DL' | 'DH' | 'H' | 'HH',
          alarmName: info.name,
          priority: info.priority,
          value: state.syncedPV,
          limit,
        });
        
        toast({
          title: `${info.priority === 'critical' ? '🚨' : '⚠️'} ${info.name}`,
          description: `PV: ${state.syncedPV.toFixed(1)} | Limit: ${limit}`,
          variant: info.priority === 'critical' ? 'destructive' : 'default',
        });
      }
    });
    
    prevAlarmStates.current = current;
  }, [state.alarmStates, state.syncedPV, config, addAlarmLogEntry]);

  const criticalCount = state.alarmLog.filter(a => !a.acknowledged && a.priority === 'critical').length;
  const warningCount = state.alarmLog.filter(a => !a.acknowledged && a.priority === 'warning').length;
  const acknowledgedCount = state.alarmLog.filter(a => a.acknowledged).length;

  const handleAcknowledge = (id: string) => {
    acknowledgeAlarm(id);
    toast({ title: 'Alarm Acknowledged', description: 'Alarm has been acknowledged.' });
  };

  const handleAcknowledgeAll = () => {
    acknowledgeAllAlarms();
    toast({ title: 'All Alarms Acknowledged', description: 'All alarms have been acknowledged.' });
  };

  const simulateAlarm = (type: 'HH' | 'LL' | 'H' | 'L') => {
    updateAlarmStates({ ...state.alarmStates, [type]: true });
    setTimeout(() => {
      updateAlarmStates({ ...state.alarmStates, [type]: false });
    }, 3000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 deltav-grid-pattern">
      <div className="container mx-auto py-8 px-4">
        <Link
          to="/settings/controller-outputs/faceplates/temp-sensor/1540-TI-4828"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span>Back to 1540-TI-4828 Temperature Sensor</span>
        </Link>

        <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-8 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-faceplate-border glow-text mb-2 flex items-center gap-3">
            <Bell className="text-cyan-400" />
            Acknowledge Alarm
          </h1>
          <p className="text-muted-foreground mb-6">Faceplate 3F - Active alarms and acknowledgement</p>

          <div className="flex gap-2 mb-6">
            <span className="text-sm text-muted-foreground mr-2">Simulate:</span>
            <button onClick={() => simulateAlarm('HH')} className="px-3 py-1 text-xs bg-red-600/50 hover:bg-red-600 text-white rounded transition-colors">HH</button>
            <button onClick={() => simulateAlarm('LL')} className="px-3 py-1 text-xs bg-red-600/50 hover:bg-red-600 text-white rounded transition-colors">LL</button>
            <button onClick={() => simulateAlarm('H')} className="px-3 py-1 text-xs bg-yellow-600/50 hover:bg-yellow-600 text-white rounded transition-colors">H</button>
            <button onClick={() => simulateAlarm('L')} className="px-3 py-1 text-xs bg-yellow-600/50 hover:bg-yellow-600 text-white rounded transition-colors">L</button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className={`rounded-lg p-4 border text-center ${criticalCount > 0 ? 'bg-red-500/20 border-red-500/50 animate-pulse' : 'bg-red-500/10 border-red-500/30'}`}>
                <h3 className="text-sm font-medium text-red-400 mb-2">Critical Alarms</h3>
                <p className="text-3xl font-mono font-bold text-red-400">{criticalCount}</p>
              </div>
              <div className={`rounded-lg p-4 border text-center ${warningCount > 0 ? 'bg-yellow-500/20 border-yellow-500/50 animate-pulse' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                <h3 className="text-sm font-medium text-yellow-400 mb-2">Warning Alarms</h3>
                <p className="text-3xl font-mono font-bold text-yellow-400">{warningCount}</p>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30 text-center">
                <h3 className="text-sm font-medium text-emerald-400 mb-2">Acknowledged</h3>
                <p className="text-3xl font-mono font-bold text-emerald-400">{acknowledgedCount}</p>
              </div>
            </div>

            <div className="bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="border-b border-border/50">
                    <th className="px-4 py-2 text-left text-muted-foreground">Time</th>
                    <th className="px-4 py-2 text-left text-muted-foreground">Tag</th>
                    <th className="px-4 py-2 text-left text-muted-foreground">Alarm</th>
                    <th className="px-4 py-2 text-left text-muted-foreground">Value</th>
                    <th className="px-4 py-2 text-left text-muted-foreground">Priority</th>
                    <th className="px-4 py-2 text-center text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {state.alarmLog.length === 0 ? (
                    <tr className="border-b border-border/30">
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No alarm history
                      </td>
                    </tr>
                  ) : (
                    state.alarmLog.map((alarm) => (
                      <tr
                        key={alarm.id}
                        className={`border-b border-border/30 ${
                          !alarm.acknowledged
                            ? alarm.priority === 'critical'
                              ? 'bg-red-500/10'
                              : 'bg-yellow-500/10'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-2 text-muted-foreground">
                          <div>{formatTime(alarm.timestamp)}</div>
                          <div className="text-xs opacity-60">{formatDate(alarm.timestamp)}</div>
                        </td>
                        <td className="px-4 py-2 text-cyan-400">{alarm.tag}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            {!alarm.acknowledged && (
                              <AlertTriangle
                                size={14}
                                className={alarm.priority === 'critical' ? 'text-red-400 animate-pulse' : 'text-yellow-400 animate-pulse'}
                              />
                            )}
                            <span className={alarm.priority === 'critical' ? 'text-red-400' : 'text-yellow-400'}>
                              {alarm.alarmType}
                            </span>
                            <span className="text-muted-foreground">- {alarm.alarmName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-foreground">{alarm.value.toFixed(1)}</span>
                          <span className="text-muted-foreground text-xs ml-1">(lim: {alarm.limit})</span>
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              alarm.priority === 'critical'
                                ? 'bg-red-500/30 text-red-400'
                                : 'bg-yellow-500/30 text-yellow-400'
                            }`}
                          >
                            {alarm.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {alarm.acknowledged ? (
                            <span className="text-emerald-400 flex items-center justify-center gap-1">
                              <CheckCircle size={14} />
                              <span className="text-xs">ACK</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAcknowledge(alarm.id)}
                              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded transition-colors"
                            >
                              ACK
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleAcknowledgeAll}
                disabled={criticalCount + warningCount === 0}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/30 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <CheckCircle size={18} />
                Acknowledge All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TempSensor4828Faceplate3F;
