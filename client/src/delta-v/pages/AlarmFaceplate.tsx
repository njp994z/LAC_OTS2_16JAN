import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { ArrowLeft, Bell, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useControllerSyncContext } from '@/delta-v/contexts/ControllerSyncContext';
import { toast } from '@/hooks/use-toast';
import { useMemo } from 'react';

const AlarmFaceplatePage = () => {
  const { controllers, acknowledgeAlarm, acknowledgeAllAlarms } = useControllerSyncContext();

  const allAlarms = useMemo(() => {
    return Object.entries(controllers).flatMap(([controllerId, state]) =>
      state.alarmLog.map(alarm => ({
        ...alarm,
        controllerId
      }))
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [controllers]);

  const activeAlarms = allAlarms.filter(a => !a.acknowledged);

  const criticalCount = activeAlarms.filter(a => a.priority === 'critical').length;
  const warningCount = activeAlarms.filter(a => a.priority === 'warning').length;
  const acknowledgedCount = allAlarms.filter(a => a.acknowledged).length;

  const handleAcknowledge = (controllerId: string, alarmId: string) => {
    acknowledgeAlarm(controllerId, alarmId);
    toast({ title: 'Alarm Acknowledged', description: 'Alarm has been acknowledged.' });
  };

  const handleAcknowledgeAll = () => {
    Object.keys(controllers).forEach(controllerId => {
      acknowledgeAllAlarms(controllerId);
    });
    toast({ title: 'All Alarms Acknowledged', description: 'All alarms have been globally acknowledged.' });
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour12: false });
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 deltav-grid-pattern p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>

        <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-8">
          <h1 className="text-2xl font-bold text-faceplate-border glow-text mb-2 flex items-center gap-3">
            <ShieldCheck className="text-cyan-400" />
            Global Alarm Faceplate
          </h1>
          <p className="text-muted-foreground mb-6">Plant-wide Active Alarms & Acknowledgement</p>

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
              <div className="max-h-[500px] overflow-y-auto w-full font-sans">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 sticky top-0 z-10 backdrop-blur">
                    <tr className="border-b border-border/50">
                      <th className="px-4 py-2 text-left text-muted-foreground">Time</th>
                      <th className="px-4 py-2 text-left text-muted-foreground">Source</th>
                      <th className="px-4 py-2 text-left text-muted-foreground">Alarm</th>
                      <th className="px-4 py-2 text-left text-muted-foreground">Value</th>
                      <th className="px-4 py-2 text-left text-muted-foreground">Priority</th>
                      <th className="px-4 py-2 text-center text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {allAlarms.length === 0 ? (
                      <tr className="border-b border-border/30">
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          No alarm history globally
                        </td>
                      </tr>
                    ) : (
                      allAlarms.map((alarm) => (
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
                          <td className="px-4 py-2 text-cyan-400 font-bold">{alarm.controllerId}</td>
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
                                onClick={() => handleAcknowledge(alarm.controllerId, alarm.id)}
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
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleAcknowledgeAll}
                disabled={activeAlarms.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/30 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <CheckCircle size={18} />
                Acknowledge All Global Alarms
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlarmFaceplatePage;
