import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { TempSensorPrimaryFaceplate } from '@/delta-v/components/faceplate/TempSensorPrimaryFaceplate';
import { TempSensorSecondaryFaceplate } from '@/delta-v/components/faceplate/TempSensorSecondaryFaceplate';
import { defaultControllerData, type ControllerData } from '@/delta-v/types/controller';
import { defaultSecondaryConfig, defaultSecondaryData, type SecondaryControllerData, type SecondaryControllerConfig } from '@/delta-v/types/secondaryController';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useControllerSync } from '@/delta-v/contexts/ControllerSyncContext';
import { useControllerConfig } from '@/delta-v/contexts/ControllerConfigContext';

const TempSensor4825Main = () => {
  const activeControllerId = '1540-TI-4825';
  const { state: syncState, initializeController } = useControllerSync(activeControllerId);
  const { getControllerConfig } = useControllerConfig();
  const savedConfig = getControllerConfig(activeControllerId);
  
  const [controllerData, setControllerData] = useState<ControllerData>({ ...defaultControllerData, instrumentTag: '1540-TI-4825', description: 'Pass 1 Catalyst In', pvUnits: 'F', pvRangeMin: 0, pvRangeMax: 2000 });
  const [config, setConfig] = useState<SecondaryControllerConfig>(savedConfig);
  const [secondaryData, setSecondaryData] = useState<SecondaryControllerData>({ ...defaultSecondaryData, PV: syncState.syncedPV, SP: syncState.syncedSP, OUT_PCT: syncState.syncedOUT });
  
  useEffect(() => { const c = getControllerConfig(activeControllerId); setConfig(c); }, [getControllerConfig, activeControllerId]);
  useEffect(() => { if (savedConfig.TYPICAL_PV) initializeController(savedConfig.TYPICAL_PV, savedConfig.TYPICAL_PV, 0, 2000); }, [savedConfig.TYPICAL_PV, initializeController]);
  useEffect(() => { setControllerData(prev => ({ ...prev, pv: syncState.syncedPV, sp: syncState.syncedSP, out: syncState.syncedOUT, mode: syncState.syncedMode })); }, [syncState]);
  useEffect(() => { setSecondaryData(prev => ({ ...prev, PV: syncState.syncedPV, SP: syncState.syncedSP, OUT_PCT: syncState.syncedOUT })); }, [syncState]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="fixed inset-0 opacity-5"><div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`, backgroundSize: '32px 32px' }} /></div>
      <div className="relative max-w-4xl mx-auto">
        <Link href="/settings/controller-outputs/faceplates/temp-sensor/1540-TI-4825" className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft size={18} />Back</Link>
        <header className="mb-8 text-center"><h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent">1540-TI-4825 Pass 1 Catalyst In</h1></header>
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex flex-col items-center gap-2"><span className="text-xs text-muted-foreground uppercase">Primary</span><TempSensorPrimaryFaceplate data={controllerData} /></div>
          <div className="flex flex-col items-center gap-2"><span className="text-xs text-muted-foreground uppercase">Secondary</span><TempSensorSecondaryFaceplate data={secondaryData} config={config} sensorId="1540-TI-4825" /></div>
        </div>
      </div>
    </div>
  );
};
export default TempSensor4825Main;
