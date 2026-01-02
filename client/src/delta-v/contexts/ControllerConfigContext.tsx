import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  SecondaryControllerConfig,
  SecondaryControllerData,
} from '@/delta-v/types/secondaryController';
import {
  getDefaultSecondaryControllerConfig,
  getDefaultSecondaryControllerData,
} from '@/delta-v/lib/controllerDefaults';

const STORAGE_KEY = 'controller-configs';

// Helper to ensure a value is a finite number, otherwise return fallback
const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

// Sanitize config to ensure all numeric fields are finite numbers
const sanitizeConfig = (controllerId: string, raw: SecondaryControllerConfig): SecondaryControllerConfig => {
  const defaults = getDefaultSecondaryControllerConfig(controllerId);
  return {
    ...raw,
    PV_INIT_VAL: toFiniteNumber(raw.PV_INIT_VAL, defaults.PV_INIT_VAL),
    PV_SCALE_LO: toFiniteNumber(raw.PV_SCALE_LO, defaults.PV_SCALE_LO),
    PV_SCALE_HI: toFiniteNumber(raw.PV_SCALE_HI, defaults.PV_SCALE_HI),
    SP_LIM_LO: toFiniteNumber(raw.SP_LIM_LO, defaults.SP_LIM_LO),
    SP_LIM_HI: toFiniteNumber(raw.SP_LIM_HI, defaults.SP_LIM_HI),
    OUT_LIM_LO: toFiniteNumber(raw.OUT_LIM_LO, defaults.OUT_LIM_LO),
    OUT_LIM_HI: toFiniteNumber(raw.OUT_LIM_HI, defaults.OUT_LIM_HI),
    ALM_LL_LIM: toFiniteNumber(raw.ALM_LL_LIM, defaults.ALM_LL_LIM),
    ALM_L_LIM: toFiniteNumber(raw.ALM_L_LIM, defaults.ALM_L_LIM),
    ALM_DL_LIM: toFiniteNumber(raw.ALM_DL_LIM, defaults.ALM_DL_LIM),
    ALM_DH_LIM: toFiniteNumber(raw.ALM_DH_LIM, defaults.ALM_DH_LIM),
    ALM_H_LIM: toFiniteNumber(raw.ALM_H_LIM, defaults.ALM_H_LIM),
    ALM_HH_LIM: toFiniteNumber(raw.ALM_HH_LIM, defaults.ALM_HH_LIM),
    PV_FILTER_TIME: toFiniteNumber(raw.PV_FILTER_TIME, defaults.PV_FILTER_TIME),
    PV_BAD_LIMIT: toFiniteNumber(raw.PV_BAD_LIMIT, defaults.PV_BAD_LIMIT),
    SP_RAMP_RATE: toFiniteNumber(raw.SP_RAMP_RATE, defaults.SP_RAMP_RATE),
  };
};

// Sanitize data to ensure all numeric fields are finite numbers
const sanitizeData = (controllerId: string, raw: SecondaryControllerData): SecondaryControllerData => {
  const defaults = getDefaultSecondaryControllerData(controllerId);
  return {
    ...raw,
    PV: toFiniteNumber(raw.PV, defaults.PV),
    SP: toFiniteNumber(raw.SP, defaults.SP),
    OUT_PCT: toFiniteNumber(raw.OUT_PCT, defaults.OUT_PCT),
    TSP: toFiniteNumber(raw.TSP, defaults.TSP),
    AO_I_ACT_mA: toFiniteNumber(raw.AO_I_ACT_mA, defaults.AO_I_ACT_mA),
  };
};

interface ControllerConfigStore {
  configs: Record<string, SecondaryControllerConfig>;
  data: Record<string, SecondaryControllerData>;
}

interface ControllerConfigContextType {
  getControllerConfig: (controllerId: string) => SecondaryControllerConfig;
  updateControllerConfig: (controllerId: string, config: SecondaryControllerConfig) => void;
  getControllerData: (controllerId: string) => SecondaryControllerData;
  updateControllerData: (controllerId: string, data: SecondaryControllerData) => void;
  saveController: (controllerId: string) => void;
}

const ControllerConfigContext = createContext<ControllerConfigContextType | null>(null);

export const useControllerConfig = () => {
  const context = useContext(ControllerConfigContext);
  if (!context) {
    throw new Error('useControllerConfig must be used within a ControllerConfigProvider');
  }
  return context;
};

interface ControllerConfigProviderProps {
  children: ReactNode;
}

export const ControllerConfigProvider: React.FC<ControllerConfigProviderProps> = ({ children }) => {
  const [store, setStore] = useState<ControllerConfigStore>({ configs: {}, data: {} });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ControllerConfigStore;
        setStore(parsed);
        console.log('Loaded controller configs from localStorage:', parsed);
      } catch (e) {
        console.error('Failed to load controller configs:', e);
      }
    }
  }, []);

  // Auto-save whenever store changes
  useEffect(() => {
    if (Object.keys(store.configs).length > 0 || Object.keys(store.data).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      console.log('Auto-saved controller configs:', store);
    }
  }, [store]);

  const getControllerConfig = (controllerId: string): SecondaryControllerConfig => {
    const defaults = getDefaultSecondaryControllerConfig(controllerId);
    const saved = store.configs[controllerId];
    // Merge defaults with saved config - saved values override defaults, then sanitize
    const merged = saved ? { ...defaults, ...saved } : defaults;
    return sanitizeConfig(controllerId, merged);
  };

  const updateControllerConfig = (controllerId: string, config: SecondaryControllerConfig) => {
    // Sanitize before storing to prevent NaN from entering the store
    const sanitized = sanitizeConfig(controllerId, config);
    setStore(prev => ({
      ...prev,
      configs: {
        ...prev.configs,
        [controllerId]: sanitized,
      },
    }));
  };

  const getControllerData = (controllerId: string): SecondaryControllerData => {
    const raw = store.data[controllerId] || getDefaultSecondaryControllerData(controllerId);
    return sanitizeData(controllerId, raw);
  };

  const updateControllerData = (controllerId: string, data: SecondaryControllerData) => {
    // Sanitize before storing to prevent NaN from entering the store
    const sanitized = sanitizeData(controllerId, data);
    setStore(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [controllerId]: sanitized,
      },
    }));
  };

  const saveController = (controllerId: string) => {
    // Force a save by triggering the auto-save effect
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    console.log(`Saved controller ${controllerId} configuration`);
  };

  return (
    <ControllerConfigContext.Provider
      value={{
        getControllerConfig,
        updateControllerConfig,
        getControllerData,
        updateControllerData,
        saveController,
      }}
    >
      {children}
    </ControllerConfigContext.Provider>
  );
};
