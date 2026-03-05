import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  defaultCompressorData,
  type CompressorData,
  type CompressorMode,
} from "@/delta-v/types/compressor";

interface VFDConfig {
  tagName: string;
  description: string;
  unit: string;
  engineeringUnits: string;
  transparentBackground: boolean;
}

const DEFAULT_VFD_CONFIG: VFDConfig = {
  tagName: "VFD-001",
  description: "Variable Frequency Drive",
  unit: "U-505",
  engineeringUnits: "Hz",
  transparentBackground: false,
};

export interface CompressorContextType {
  compressorData: CompressorData;
  handleStart: () => void;
  handleStop: () => void;
  handleModeChange: (mode: CompressorMode) => void;
  handleSpeedSPChange: (speedSP: number) => void;
  handleClearAlarm: () => void;
  setPermitActive: (active: boolean) => void;
  setFailAlarm: (active: boolean) => void;
  setStaticValues: (values: Partial<CompressorData>) => void;
  vfdConfig: VFDConfig;
  updateVFDConfig: (newConfig: Partial<VFDConfig>) => Promise<void>;
  setVFDConfigLocal: (newConfig: Partial<VFDConfig>) => void;
  saveVFDConfig: () => Promise<void>;
  isVFDConfigSaving: boolean;
  isVFDConfigLoading: boolean;
}

const CompressorContext = createContext<CompressorContextType | undefined>(
  undefined,
);

export const useCompressor = () => {
  const context = useContext(CompressorContext);
  if (!context) {
    throw new Error("useCompressor must be used within a CompressorProvider");
  }
  return context;
};

export const CompressorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { toast } = useToast();
  const controllerId = "VFD-001";
  const [compressorData, setCompressorData] = useState<CompressorData>(
    defaultCompressorData,
  );
  const [localVFDConfig, setLocalVFDConfig] =
    useState<VFDConfig>(DEFAULT_VFD_CONFIG);

  // Fetch VFD config from server
  const { data: serverVFDConfig, isLoading: isVFDConfigLoading } = useQuery({
    queryKey: ["/api/controller-configs", controllerId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/controller-configs/${controllerId}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.config as VFDConfig;
      } catch (e) {
        return null;
      }
    },
  });

  // Sync server config to local state
  useEffect(() => {
    if (serverVFDConfig) {
      setLocalVFDConfig(serverVFDConfig);
    }
  }, [serverVFDConfig]);

  // Mutation to save VFD config
  const vfdConfigMutation = useMutation({
    mutationFn: async (newConfig: VFDConfig) => {
      await apiRequest("POST", "/api/controller-configs", {
        controllerId,
        config: newConfig,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/controller-configs", controllerId],
      });
      toast({ title: "Success", description: "VFD settings saved" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save VFD settings",
        variant: "destructive",
      });
    },
  });

  const updateVFDConfig = async (newConfig: Partial<VFDConfig>) => {
    const updated = { ...localVFDConfig, ...newConfig };
    setLocalVFDConfig(updated);
    await vfdConfigMutation.mutateAsync(updated);
  };

  // Update local state only (no save)
  const setVFDConfigLocal = (newConfig: Partial<VFDConfig>) => {
    setLocalVFDConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // Explicitly save current local config to server
  const saveVFDConfig = async () => {
    await vfdConfigMutation.mutateAsync(localVFDConfig);
  };

  const handleStart = () => {
    if (!compressorData.permitActive) return;
    setCompressorData((prev) => ({
      ...prev,
      state: "STARTING",
      deviceState: "Starting...",
    }));
    setTimeout(() => {
      setCompressorData((prev) => ({
        ...prev,
        state: "RUNNING",
        deviceState: "Confirmed Running",
      }));
    }, 1500);
  };

  const handleStop = () => {
    setCompressorData((prev) => ({
      ...prev,
      state: "STOPPING",
      deviceState: "Stopping...",
    }));
    setTimeout(() => {
      setCompressorData((prev) => ({
        ...prev,
        state: "STOPPED",
        deviceState: "Confirmed Stopped",
        speedPV: 0,
        currentPV: 0,
        powerPV: 0,
        motorPowerHP: 0,
        vfdCurrentAmps: 0,
        motorSpeedRPM: 0,
        compressorSpeedRPM: 0,
      }));
    }, 1500);
  };

  const handleModeChange = (mode: CompressorMode) => {
    setCompressorData((prev) => ({ ...prev, mode }));
  };

  const handleSpeedSPChange = (speedSP: number) => {
    setCompressorData((prev) => ({ ...prev, speedSP }));
  };

  const handleClearAlarm = () => {
    setCompressorData((prev) => ({ ...prev, failAlarm: false }));
  };

  const setPermitActive = (active: boolean) => {
    setCompressorData((prev) => ({ ...prev, permitActive: active }));
  };

  const setFailAlarm = (active: boolean) => {
    setCompressorData((prev) => ({ ...prev, failAlarm: active }));
  };

  // Set static values from simulation results (used in Static mode)
  const setStaticValues = (values: Partial<CompressorData>) => {
    setCompressorData((prev) => ({ ...prev, ...values }));
  };

  // Simulate speed PV tracking speed SP when running - always fluctuate
  useEffect(() => {
    if (compressorData.state === "RUNNING") {
      const interval = setInterval(() => {
        setCompressorData((prev) => {
          const diff = prev.speedSP - prev.speedPV;
          // Approach setpoint with damping, plus small jitter for continuous fluctuation
          const approach = diff * 0.1;
          const jitter = (Math.random() - 0.5) * 0.3; // Small continuous jitter
          const newSpeedPV = Math.max(
            0,
            Math.min(100, prev.speedPV + approach + jitter),
          );
          const speedRatio = newSpeedPV / 100;

          return {
            ...prev,
            speedPV: newSpeedPV,
            currentPV:
              Math.round(
                (20 + speedRatio * 50 + (Math.random() - 0.5) * 2) * 10,
              ) / 10,
            powerPV:
              Math.round(
                (50 + speedRatio * 150 + (Math.random() - 0.5) * 5) * 10,
              ) / 10,
            motorPowerHP:
              Math.round((speedRatio * 150 + (Math.random() - 0.5) * 3) * 10) /
              10,
            vfdCurrentAmps:
              Math.round((speedRatio * 60 + (Math.random() - 0.5) * 2) * 10) /
              10,
            motorSpeedRPM: Math.round(
              speedRatio * 1800 + (Math.random() - 0.5) * 10,
            ),
            compressorSpeedRPM: Math.round(
              speedRatio * 10000 + (Math.random() - 0.5) * 50,
            ),
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
        setStaticValues,
        vfdConfig: localVFDConfig,
        updateVFDConfig,
        setVFDConfigLocal,
        saveVFDConfig,
        isVFDConfigSaving: vfdConfigMutation.isPending,
        isVFDConfigLoading,
      }}
    >
      {children}
    </CompressorContext.Provider>
  );
};
