import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { ValveFaceplate } from '@/delta-v/components/faceplate/ValveFaceplate';
import { defaultControllerData, type ControllerData } from '@/delta-v/types/controller';
import { type SecondaryControllerConfig } from '@/delta-v/types/secondaryController';
import { cn } from '@/lib/utils';
import { ArrowLeft, Settings } from 'lucide-react';
import { useControllerSync } from '@/delta-v/contexts/ControllerSyncContext';
import { useControllerConfig } from '@/delta-v/contexts/ControllerConfigContext';
import { Button } from '@/components/ui/button';
import jugValvePositionerImage from '@assets/delta-v/icons/jug-valve-positioner.png';

const jugValvePositioner = {
  name: '1540-HCV-4281',
  description: 'Jug Valve Positioner'
};

const JugValvePositionerDetail = () => {
  const activeControllerId = '1540-HCV-4281';
  
  const { state: syncState } = useControllerSync(activeControllerId);
  const { getControllerConfig } = useControllerConfig();
  const savedConfig = getControllerConfig(activeControllerId);
  
  const [controllerData, setControllerData] = useState<ControllerData>({
    ...defaultControllerData,
    instrumentTag: savedConfig.TAGNAME || jugValvePositioner.name,
    description: savedConfig.DESC || jugValvePositioner.description,
    pvUnits: savedConfig.EU || defaultControllerData.pvUnits,
    pvRangeMin: savedConfig.PV_SCALE_LO ?? defaultControllerData.pvRangeMin,
    pvRangeMax: savedConfig.PV_SCALE_HI ?? defaultControllerData.pvRangeMax,
    pv: syncState.syncedPV,
    sp: syncState.syncedSP,
    out: syncState.syncedOUT,
    valveTypeAction: savedConfig.VALVE_TYPE_ACTION || 'DA',
  });
  
  const [config, setConfig] = useState<SecondaryControllerConfig>(savedConfig);
  
  useEffect(() => {
    const syncConfigFromContext = () => {
      const savedConfig = getControllerConfig(activeControllerId);
      setConfig(savedConfig);
      setControllerData(prev => ({
        ...prev,
        instrumentTag: savedConfig.TAGNAME || jugValvePositioner.name,
        description: savedConfig.DESC || jugValvePositioner.description,
        pvUnits: savedConfig.EU || defaultControllerData.pvUnits,
        pvRangeMin: savedConfig.PV_SCALE_LO ?? defaultControllerData.pvRangeMin,
        pvRangeMax: savedConfig.PV_SCALE_HI ?? defaultControllerData.pvRangeMax,
        showOutputPathIndicator: savedConfig.SHOW_OUTPUT_PATH_INDICATOR,
        showInterlockIndicator: savedConfig.SHOW_INTERLOCK_INDICATOR,
        showInterlockDiamond: savedConfig.SHOW_INTERLOCK_DIAMOND_INDICATOR,
        showLockIndicator: savedConfig.SHOW_LOCK_INDICATOR,
        showAlarmCircle: savedConfig.SHOW_ALARM_CIRCLE,
        showNoSymbol: savedConfig.SHOW_NO_SYMBOL,
        showBlueAlarmIndicator: savedConfig.SHOW_BLUE_ALARM_INDICATOR,
        showBadIOIndicator: savedConfig.SHOW_BAD_IO_INDICATOR,
        showModuleNotRunning: savedConfig.SHOW_MODULE_NOT_RUNNING,
        showValveTypeLabel: savedConfig.SHOW_VALVE_TYPE_LABEL,
        holdActive: savedConfig.HOLD_ACTIVE ?? false,
        valveTypeAction: savedConfig.VALVE_TYPE_ACTION || 'DA',
      }));
    };
    syncConfigFromContext();
    window.addEventListener('focus', syncConfigFromContext);
    return () => window.removeEventListener('focus', syncConfigFromContext);
  }, [getControllerConfig]);
  
  const pv = syncState.syncedPV;
  const hasRedAlarm = (config.ALM_LL_LIM !== 0 && pv <= config.ALM_LL_LIM) || (config.ALM_HH_LIM !== 0 && pv >= config.ALM_HH_LIM);
  const hasYellowAlarm = (config.ALM_L_LIM !== 0 && pv <= config.ALM_L_LIM) || (config.ALM_H_LIM !== 0 && pv >= config.ALM_H_LIM);
  const primaryAlarmActive = hasRedAlarm || hasYellowAlarm;
  const primaryAlarmColor: 'red' | 'yellow' = hasRedAlarm ? 'red' : 'yellow';

  useEffect(() => {
    const interlockIsActive = (config.INTLK_HH_EN && config.ALM_HH_LIM !== 0 && syncState.syncedPV >= config.ALM_HH_LIM) || 
      (config.INTLK_LL_EN && config.ALM_LL_LIM !== 0 && syncState.syncedPV <= config.ALM_LL_LIM);
    setControllerData(prev => ({
      ...prev,
      pv: syncState.syncedPV,
      sp: syncState.syncedSP,
      out: syncState.syncedOUT,
      alarmActive: primaryAlarmActive,
      alarmColor: primaryAlarmColor,
      alarmType: hasRedAlarm ? 'HIHI' : (hasYellowAlarm ? 'HI' : undefined),
      mode: syncState.syncedMode,
      interlockActive: interlockIsActive,
      deviceLocked: interlockIsActive,
      holdActive: config.HOLD_ACTIVE ?? false,
      alarmLL: config.ALM_LL_LIM,
      alarmL: config.ALM_L_LIM,
      alarmH: config.ALM_H_LIM,
      alarmHH: config.ALM_HH_LIM,
      showOutputPathIndicator: config.SHOW_OUTPUT_PATH_INDICATOR,
      showInterlockIndicator: config.SHOW_INTERLOCK_INDICATOR,
      showInterlockDiamond: config.SHOW_INTERLOCK_DIAMOND_INDICATOR,
      showLockIndicator: config.SHOW_LOCK_INDICATOR,
      showAlarmCircle: config.SHOW_ALARM_CIRCLE,
      showNoSymbol: config.SHOW_NO_SYMBOL,
      showBlueAlarmIndicator: config.SHOW_BLUE_ALARM_INDICATOR,
      showBadIOIndicator: config.SHOW_BAD_IO_INDICATOR,
      showModuleNotRunning: config.SHOW_MODULE_NOT_RUNNING,
      showValveTypeLabel: config.SHOW_VALVE_TYPE_LABEL,
      valveTypeAction: config.VALVE_TYPE_ACTION || 'DA',
    }));
  }, [syncState.syncedPV, syncState.syncedSP, syncState.syncedOUT, syncState.syncedMode, primaryAlarmActive, primaryAlarmColor, hasRedAlarm, hasYellowAlarm, config]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
      </div>
      <div className="relative max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/settings/controller-outputs/faceplates/valve/hand-control" className={cn("inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200", "text-muted-foreground hover:text-foreground", "hover:bg-card/50 active:scale-95")}>
            <ArrowLeft size={18} />
            Back to Hand Control Valves
          </Link>
          <Link href="/settings/controller-outputs/faceplates/jug-valve-positioner/3e">
            <Button variant="outline" className={cn("gap-2 border-primary/30 hover:border-primary", "bg-card/50 hover:bg-card")}>
              <Settings size={18} />
              Configure (3E)
            </Button>
          </Link>
        </div>
        <header className="mb-10 text-center">
          <h1 className={cn("text-3xl font-bold mb-2 tracking-tight", "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent")}>
            {jugValvePositioner.name} - {jugValvePositioner.description}
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">Hand Control Valve • Primary Faceplate</p>
        </header>
        <main className="flex flex-col items-center gap-10">
          <section className="flex flex-col items-center">
            <ValveFaceplate data={controllerData} onSelect={() => console.log('Faceplate selected:', controllerData.instrumentTag)} isTransparent={config.TRANSPARENT_BG} valveImageSrc={jugValvePositionerImage} />
          </section>
        </main>
      </div>
    </div>
  );
};

export default JugValvePositionerDetail;