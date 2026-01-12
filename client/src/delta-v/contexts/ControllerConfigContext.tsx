import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  SecondaryControllerConfig,
  SecondaryControllerData,
} from '@/delta-v/types/secondaryController';
import {
  getDefaultSecondaryControllerConfig,
  getDefaultSecondaryControllerData,
} from '@/delta-v/lib/controllerDefaults';
import { apiRequest } from '@/lib/queryClient';

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
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from database API on mount, fallback to localStorage
  useEffect(() => {
    const loadFromDb = async () => {
      try {
        const response = await fetch('/api/controller-configs');
        if (response.ok) {
          const dbConfigs = await response.json();
          if (Array.isArray(dbConfigs) && dbConfigs.length > 0) {
            const newStore: ControllerConfigStore = { configs: {}, data: {} };
            for (const item of dbConfigs) {
              if (item.controllerId && item.config) {
                newStore.configs[item.controllerId] = item.config as SecondaryControllerConfig;
                if (item.data) {
                  newStore.data[item.controllerId] = item.data as SecondaryControllerData;
                }
              }
            }
            setStore(newStore);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newStore));
            console.log('Loaded controller configs from database:', newStore);
            setIsLoaded(true);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load from database, falling back to localStorage:', e);
      }
      
      // Fallback to localStorage
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
      setIsLoaded(true);
    };
    
    loadFromDb();
  }, []);

  // Auto-save to localStorage whenever store changes (for quick access/cache)
  useEffect(() => {
    if (isLoaded && (Object.keys(store.configs).length > 0 || Object.keys(store.data).length > 0)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      console.log('Auto-saved controller configs to localStorage:', store);
    }
  }, [store, isLoaded]);

  const getControllerConfig = useCallback((controllerId: string): SecondaryControllerConfig => {
    const defaults = getDefaultSecondaryControllerConfig(controllerId);
    const saved = store.configs[controllerId];
    // Merge defaults with saved config - saved values override defaults, then sanitize
    const merged = saved ? { ...defaults, ...saved } : defaults;
    return sanitizeConfig(controllerId, merged);
  }, [store.configs]);

  const updateControllerConfig = useCallback((controllerId: string, config: SecondaryControllerConfig) => {
    // Sanitize before storing to prevent NaN from entering the store
    const sanitized = sanitizeConfig(controllerId, config);
    setStore(prev => ({
      ...prev,
      configs: {
        ...prev.configs,
        [controllerId]: sanitized,
      },
    }));
  }, []);

  const getControllerData = useCallback((controllerId: string): SecondaryControllerData => {
    const raw = store.data[controllerId] || getDefaultSecondaryControllerData(controllerId);
    return sanitizeData(controllerId, raw);
  }, [store.data]);

  const updateControllerData = useCallback((controllerId: string, data: SecondaryControllerData) => {
    // Sanitize before storing to prevent NaN from entering the store
    const sanitized = sanitizeData(controllerId, data);
    setStore(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [controllerId]: sanitized,
      },
    }));
  }, []);

  const saveController = useCallback(async (controllerId: string) => {
    // Save to localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    
    // Also save to database
    try {
      const config = store.configs[controllerId];
      const data = store.data[controllerId];
      
      if (config) {
        await apiRequest('POST', `/api/controller-configs/${controllerId}`, { config, data });
        console.log(`Saved controller ${controllerId} configuration to database`);
      }
    } catch (e) {
      console.error(`Failed to save controller ${controllerId} to database:`, e);
    }
  }, [store]);

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
