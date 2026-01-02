import React, { createContext, useContext, useState, useEffect } from "react";
import { defaultCompressorData, type CompressorData, type CompressorMode } from "@/delta-v/types/compressor";
import { supabase } from "@/integrations/supabase/client";

interface CompressorContextType {
  compressorData: CompressorData;
  handleStart: () => void;
  handleStop: () => void;
  handleModeChange: (mode: CompressorMode) => void;
  handleSpeedSPChange: (speedSP: number) => void;
  handleClearAlarm: () => void;
  setPermitActive: (active: boolean) => void;
  setFailAlarm: (active: boolean) => void;
}

const CompressorContext = createContext<CompressorContextType | undefined>(undefined);

export const useCompressor = () => {
  const context = useContext(CompressorContext);
  if (!context) {
    throw new Error("useCompressor must be used within a CompressorProvider");
  }
  return context;
};

export const CompressorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compressorData, setCompressorData] = useState<CompressorData>(defaultCompressorData);

  const handleStart = () => {
    if (!compressorData.permitActive) return;
    setCompressorData(prev => ({ ...prev, state: "STARTING", deviceState: "Starting..." }));
    setTimeout(() => {
      setCompressorData(prev => ({ 
        ...prev, 
        state: "RUNNING", 
        deviceState: "Confirmed Running" 
      }));
    }, 1500);
  };

  const handleStop = () => {
    setCompressorData(prev => ({ ...prev, state: "STOPPING", deviceState: "Stopping..." }));
    setTimeout(() => {
      setCompressorData(prev => ({ 
        ...prev, 
        state: "STOPPED", 
        deviceState: "Confirmed Stopped",
        speedPV: 0,
        currentPV: 0,
        powerPV: 0,
        motorPowerHP: 0,
        vfdCurrentAmps: 0,
        motorSpeedRPM: 0,
        compressorSpeedRPM: 0
      }));
    }, 1500);
  };

  const handleModeChange = (mode: CompressorMode) => {
    setCompressorData(prev => ({ ...prev, mode }));
  };

  const handleSpeedSPChange = (speedSP: number) => {
    setCompressorData(prev => ({ ...prev, speedSP }));
  };

  const handleClearAlarm = () => {
    setCompressorData(prev => ({ ...prev, failAlarm: false }));
  };

  const setPermitActive = (active: boolean) => {
    setCompressorData(prev => ({ ...prev, permitActive: active }));
  };

  const setFailAlarm = (active: boolean) => {
    setCompressorData(prev => ({ ...prev, failAlarm: active }));
  };

  // Fetch VFD settings from database on mount
  useEffect(() => {
    const fetchVFDSettings = async () => {
      const { data, error } = await supabase
        .from('vfd_settings')
        .select('tag_name, description')
        .limit(1)
        .maybeSingle();
      
      if (data && !error) {
        setCompressorData(prev => ({
          ...prev,
          tag: data.tag_name,
          description: data.description || prev.description,
        }));
      }
    };
    
    fetchVFDSettings();
  }, []);

  // Simulate speed PV tracking speed SP when running - always fluctuate
  useEffect(() => {
    if (compressorData.state === "RUNNING") {
      const interval = setInterval(() => {
        setCompressorData(prev => {
          const diff = prev.speedSP - prev.speedPV;
          // Approach setpoint with damping, plus small jitter for continuous fluctuation
          const approach = diff * 0.1;
          const jitter = (Math.random() - 0.5) * 0.3; // Small continuous jitter
          const newSpeedPV = Math.max(0, Math.min(100, prev.speedPV + approach + jitter));
          const speedRatio = newSpeedPV / 100;
          
          return {
            ...prev,
            speedPV: newSpeedPV,
            currentPV: Math.round((20 + speedRatio * 50 + (Math.random() - 0.5) * 2) * 10) / 10,
            powerPV: Math.round((50 + speedRatio * 150 + (Math.random() - 0.5) * 5) * 10) / 10,
            motorPowerHP: Math.round((speedRatio * 150 + (Math.random() - 0.5) * 3) * 10) / 10,
            vfdCurrentAmps: Math.round((speedRatio * 60 + (Math.random() - 0.5) * 2) * 10) / 10,
            motorSpeedRPM: Math.round(speedRatio * 1800 + (Math.random() - 0.5) * 10),
            compressorSpeedRPM: Math.round(speedRatio * 10000 + (Math.random() - 0.5) * 50)
          };
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [compressorData.state]);

  return (
    <CompressorContext.Provider
      value={{
        compressorData,
        handleStart,
        handleStop,
        handleModeChange,
        handleSpeedSPChange,
        handleClearAlarm,
        setPermitActive,
        setFailAlarm,
      }}
    >
      {children}
    </CompressorContext.Provider>
  );
};
