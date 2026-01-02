import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { SecondaryControllerFaceplate } from '@/delta-v/components/faceplate/SecondaryControllerFaceplate';
import { 
  defaultSecondaryConfig, 
  defaultSecondaryData, 
  type SecondaryControllerData,
  type SecondaryControllerConfig 
} from '@/delta-v/types/secondaryController';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useControllerSync } from '@/delta-v/contexts/ControllerSyncContext';

const SecondaryControllerFaceplatePage = () => {
  const { state: syncState, updateSyncedSP, updateSyncedOUT, updateSyncedMode } = useControllerSync('default');
  const [config] = useState<SecondaryControllerConfig>(defaultSecondaryConfig);
  const [data, setData] = useState<SecondaryControllerData>({
    ...defaultSecondaryData,
    PV: syncState.syncedPV,
    SP: syncState.syncedSP,
    OUT_PCT: syncState.syncedOUT,
  });
  
  // Sync values from context (single source of truth)
  useEffect(() => {
    setData(prev => {
      const newPV = syncState.syncedPV;
      const dev = newPV - syncState.syncedSP;
      
      return {
        ...prev,
        PV: newPV,
        SP: syncState.syncedSP,
        OUT_PCT: syncState.syncedOUT,
        ALM_LL_ACT: newPV <= config.ALM_LL_LIM,
        ALM_L_ACT: newPV <= config.ALM_L_LIM,
        ALM_DL_ACT: dev <= config.ALM_DL_LIM,
        ALM_DH_ACT: dev >= config.ALM_DH_LIM,
        ALM_H_ACT: newPV >= config.ALM_H_LIM,
        ALM_HH_ACT: newPV >= config.ALM_HH_LIM,
        PV_OK: !(newPV <= config.ALM_LL_LIM || newPV >= config.ALM_HH_LIM),
      };
    });
  }, [syncState.syncedPV, syncState.syncedSP, syncState.syncedOUT, config]);

  // Expose update function for Python integration
  useEffect(() => {
    (window as any).updateSecondaryControllerData = (newData: Partial<SecondaryControllerData>) => {
      setData(prev => ({ ...prev, ...newData }));
    };
    
    return () => {
      delete (window as any).updateSecondaryControllerData;
    };
  }, []);

  const handleModeChange = (mode: 'AUTO' | 'MAN') => {
    setData(prev => ({ ...prev, MODE_AUTOMAN: mode }));
    updateSyncedMode(mode);
  };

  const handleRoutRcasChange = (mode: 'DA' | 'ROUT' | 'RCAS') => {
    setData(prev => ({ ...prev, MODE_ROUTRCAS: mode }));
  };

  const handleSpChange = (value: number) => {
    setData(prev => ({ ...prev, TSP: value, SP: value }));
    // Sync SP to primary controller
    updateSyncedSP(value);
  };

  const handleOutChange = (value: number) => {
    setData(prev => ({ ...prev, OUT_PCT: value }));
    updateSyncedOUT(value);
  };

  const handleModelockOverrideChange = (active: boolean) => {
    setData(prev => ({ ...prev, MODELOCK_OVERRIDE: active }));
  };

  const handleBypassChange = (active: boolean) => {
    setData(prev => ({ ...prev, BYPASS_ACTIVE: active }));
    // When bypass is activated in MAN mode, sync BYPASS mode to primary controller
    if (active && data.MODE_AUTOMAN === 'MAN') {
      updateSyncedMode('BYPASS');
    } else if (!active && data.MODE_AUTOMAN === 'MAN') {
      updateSyncedMode('MAN');
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/controller"
          className={cn(
            "inline-flex items-center gap-2 mb-6 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-card/50 active:scale-95"
          )}
        >
          <ArrowLeft size={18} />
          Back
        </Link>

        <header className="mb-10 text-center">
          <h1 className={cn(
            "text-3xl font-bold mb-2 tracking-tight",
            "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent"
          )}>
            Delta V Temperature Controller Faceplate
          </h1>
          <p className="text-primary font-semibold text-lg mb-1">
            Secondary Controller Faceplate
          </p>
          <p className="text-muted-foreground text-sm tracking-wide">
            Industrial HMI Interface • Python Backend Ready
          </p>
        </header>

        <main className="flex flex-col items-center gap-10">
          {/* Main Faceplate Display */}
          <SecondaryControllerFaceplate 
            data={data}
            config={config}
            onModeChange={handleModeChange}
            onRoutRcasChange={handleRoutRcasChange}
            onSpChange={handleSpChange}
            onOutChange={handleOutChange}
            onModelockOverrideChange={handleModelockOverrideChange}
            onBypassChange={handleBypassChange}
          />

          {/* Demo Controls */}
          <div className={cn(
            "bg-card/80 backdrop-blur-sm p-5 rounded-xl border border-border/50",
            "shadow-xl w-full max-w-md"
          )}>
            <h2 className="font-semibold text-sm text-card-foreground mb-4 tracking-wide">
              Demo Controls
              <span className="text-muted-foreground font-normal ml-2">(Simulating Python Backend)</span>
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setData(prev => ({ 
                  ...prev, 
                  ALM_H_ACT: !prev.ALM_H_ACT,
                  ALM_HH_ACT: !prev.ALM_HH_ACT 
                }))}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  "bg-gradient-to-br from-red-500/20 to-red-600/10",
                  "text-red-400 border border-red-500/30",
                  "hover:from-red-500/30 hover:to-red-600/20 hover:border-red-500/50",
                  "active:scale-95"
                )}
              >
                Toggle High Alarm
              </button>
              
              <button
                onClick={() => setData(prev => ({ 
                  ...prev, 
                  MODE_AUTOMAN: prev.MODE_AUTOMAN === 'AUTO' ? 'MAN' : 'AUTO'
                }))}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  "bg-gradient-to-br from-primary/20 to-cyan-600/10",
                  "text-primary border border-primary/30",
                  "hover:from-primary/30 hover:to-cyan-600/20 hover:border-primary/50",
                  "active:scale-95"
                )}
              >
                Toggle AUTO/MAN
              </button>
              
              <button
                onClick={() => setData(prev => ({ 
                  ...prev, 
                  MODE_ROUTRCAS: prev.MODE_ROUTRCAS === 'DA' ? 'ROUT' : prev.MODE_ROUTRCAS === 'ROUT' ? 'RCAS' : 'DA'
                }))}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
                  "text-blue-400 border border-blue-500/30",
                  "hover:from-blue-500/30 hover:to-blue-600/20 hover:border-blue-500/50",
                  "active:scale-95"
                )}
              >
                Cycle ROUT/RCAS
              </button>
              
              <button
                onClick={() => setData(prev => ({ ...prev, INTLK_STATE: !prev.INTLK_STATE }))}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  "bg-gradient-to-br from-amber-500/20 to-amber-600/10",
                  "text-amber-400 border border-amber-500/30",
                  "hover:from-amber-500/30 hover:to-amber-600/20 hover:border-amber-500/50",
                  "active:scale-95"
                )}
              >
                Toggle Interlock
              </button>
            </div>
            
            <div className="mt-5 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground font-mono bg-faceplate-shadow/30 p-2 rounded">
                window.updateSecondaryControllerData({'{'} PV: 85.5, SP: 90 {'}'})
              </p>
            </div>
          </div>

          {/* Primary Controller Link */}
          <Link
            to="/controller"
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              "bg-gradient-to-br from-primary/20 to-cyan-600/10",
              "text-primary border border-primary/30",
              "hover:from-primary/30 hover:to-cyan-600/20 hover:border-primary/50",
              "active:scale-95"
            )}
          >
            Primary Controller Faceplate
          </Link>
        </main>
      </div>
    </div>
  );
};

export default SecondaryControllerFaceplatePage;
