import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import type { AlarmLogEntry } from "@/delta-v/types/secondaryController";

type SyncedMode = "AUTO" | "MAN" | "BYPASS" | "RCAS" | "ROUT";

interface AlarmStates {
  LL: boolean;
  L: boolean;
  DL: boolean;
  DH: boolean;
  H: boolean;
  HH: boolean;
}

interface AlarmLimits {
  LL: number;
  L: number;
  H: number;
  HH: number;
}

interface SingleControllerState {
  syncedPV: number;
  syncedSP: number;
  syncedOUT: number;
  syncedMode: SyncedMode;
  alarmStates: AlarmStates;
  alarmLog: AlarmLogEntry[];
  pvRangeMin?: number;
  pvRangeMax?: number;
  initialized?: boolean;
  alarmLimits?: AlarmLimits;
}

interface ControllerSyncState {
  controllers: Record<string, SingleControllerState>;
}

interface ControllerSyncContextType {
  getControllerState: (controllerId: string) => SingleControllerState;
  initializeController: (controllerId: string, initialPV: number, initialSP?: number, pvRangeMin?: number, pvRangeMax?: number) => void;
  updateSyncedPV: (controllerId: string, value: number) => void;
  updateSyncedSP: (controllerId: string, value: number) => void;
  updateSyncedOUT: (controllerId: string, value: number) => void;
  updateSyncedMode: (controllerId: string, mode: SyncedMode) => void;
  updatePvRange: (controllerId: string, min: number, max: number) => void;
  updateAlarmStates: (controllerId: string, alarms: AlarmStates) => void;
  updateAlarmLimits: (controllerId: string, limits: AlarmLimits) => void;
  addAlarmLogEntry: (controllerId: string, entry: Omit<AlarmLogEntry, "id" | "acknowledged">) => void;
  acknowledgeAlarm: (controllerId: string, id: string) => void;
  acknowledgeAllAlarms: (controllerId: string) => void;
}

const defaultAlarmStates: AlarmStates = {
  LL: false,
  L: false,
  DL: false,
  DH: false,
  H: false,
  HH: false,
};

// Helper to ensure a value is a finite number, otherwise return fallback
const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

const createDefaultControllerState = (): SingleControllerState => ({
  syncedPV: 175.0,
  syncedSP: 75.0,
  syncedOUT: 47.3,
  syncedMode: "AUTO",
  alarmStates: { ...defaultAlarmStates },
  alarmLog: [],
});

const CHANNEL_NAME = "controller-sync";
const ALARM_LOG_KEY = "alarm-log";
const SYNC_STATE_KEY = "controller-sync-state";

const ControllerSyncContext = createContext<ControllerSyncContextType | undefined>(undefined);

// Load alarm log from localStorage for a specific controller
const loadAlarmLog = (controllerId: string): AlarmLogEntry[] => {
  try {
    const saved = localStorage.getItem(`${ALARM_LOG_KEY}-${controllerId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
        acknowledgedAt: entry.acknowledgedAt ? new Date(entry.acknowledgedAt) : undefined,
      }));
    }
  } catch (e) {
    console.error(`Failed to load alarm log for ${controllerId}:`, e);
  }
  return [];
};

// Save alarm log to localStorage (limit to 100 entries)
const saveAlarmLog = (controllerId: string, log: AlarmLogEntry[]) => {
  try {
    const limitedLog = log.slice(0, 100);
    localStorage.setItem(`${ALARM_LOG_KEY}-${controllerId}`, JSON.stringify(limitedLog));
  } catch (e) {
    console.error(`Failed to save alarm log for ${controllerId}:`, e);
  }
};

// Load all controller states from localStorage
const loadSyncState = (): Record<string, SingleControllerState> => {
  try {
    const saved = localStorage.getItem(SYNC_STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Restore alarm logs for each controller
      Object.keys(parsed).forEach(controllerId => {
        parsed[controllerId].alarmLog = loadAlarmLog(controllerId);
      });
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load sync state:", e);
  }
  return {};
};

// Save sync state to localStorage (without alarm logs which are saved separately)
const saveSyncState = (controllers: Record<string, SingleControllerState>) => {
  try {
    const stateToSave: Record<string, any> = {};
    Object.entries(controllers).forEach(([id, state]) => {
      stateToSave[id] = {
        ...state,
        alarmLog: [], // Don't duplicate alarm logs in main state
      };
    });
    localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(stateToSave));
  } catch (e) {
    console.error("Failed to save sync state:", e);
  }
};

export const ControllerSyncProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ControllerSyncState>(() => ({
    controllers: loadSyncState(),
  }));
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Get or create controller state
  const getOrCreateController = useCallback((controllerId: string): SingleControllerState => {
    return stateRef.current.controllers[controllerId] || createDefaultControllerState();
  }, []);

  // Run simulation for all active controllers
  useEffect(() => {
    const interval = setInterval(() => {
      const prev = stateRef.current;
      const channel = new BroadcastChannel(CHANNEL_NAME);
      const updates: Record<string, Partial<SingleControllerState>> = {};

      Object.entries(prev.controllers).forEach(([controllerId, controllerState]) => {
        // Sanitize current values before calculations to prevent NaN propagation
        const currentPV = toFiniteNumber(controllerState.syncedPV, 50);
        const currentSP = toFiniteNumber(controllerState.syncedSP, 50);
        const currentOUT = toFiniteNumber(controllerState.syncedOUT, 50);
        
        const disturbance = 0.6 * Math.sin(Date.now() / 15000);
        const noise = (Math.random() - 0.5) * 0.4;
        const error = currentSP - currentPV;

        // Use per-controller range if set, otherwise default to 50-200
        // Also sanitize range values
        let pvMin = toFiniteNumber(controllerState.pvRangeMin, 50);
        let pvMax = toFiniteNumber(controllerState.pvRangeMax, 200);
        // Ensure valid range
        if (pvMin >= pvMax) {
          pvMin = 0;
          pvMax = 100;
        }
        
        const newPV = Math.max(pvMin, Math.min(pvMax, currentPV + error * 0.05 + disturbance + noise));
        const formattedPV = toFiniteNumber(parseFloat(newPV.toFixed(1)), currentPV);

        if (controllerState.syncedMode === "AUTO") {
          const newOUT = Math.max(0, Math.min(100, currentOUT + (Math.random() - 0.5) * 0.5));
          const formattedOUT = toFiniteNumber(parseFloat(newOUT.toFixed(1)), currentOUT);
          updates[controllerId] = { syncedPV: formattedPV, syncedOUT: formattedOUT };
        } else {
          updates[controllerId] = { syncedPV: formattedPV };
        }

        // Auto-update alarm states based on PV vs alarm limits
        const limits = controllerState.alarmLimits;
        if (limits) {
          const newAlarms: AlarmStates = {
            LL: limits.LL > 0 && formattedPV <= limits.LL,
            L: limits.L > 0 && formattedPV <= limits.L,
            DL: false, // Deviation alarms handled separately
            DH: false,
            H: limits.H > 0 && formattedPV >= limits.H,
            HH: limits.HH > 0 && formattedPV >= limits.HH,
          };
          updates[controllerId] = { ...updates[controllerId], alarmStates: newAlarms };
        }
      });

      if (Object.keys(updates).length > 0) {
        setState((prevState) => {
          const newControllers = { ...prevState.controllers };
          Object.entries(updates).forEach(([controllerId, update]) => {
            newControllers[controllerId] = {
              ...newControllers[controllerId],
              ...update,
            };
          });
          return { controllers: newControllers };
        });

        // Broadcast updates for each controller
        Object.entries(updates).forEach(([controllerId, update]) => {
          if (update.syncedPV !== undefined) {
            channel.postMessage({ type: "pv", controllerId, value: update.syncedPV });
          }
          if (update.syncedOUT !== undefined) {
            channel.postMessage({ type: "out", controllerId, value: update.syncedOUT });
          }
        });
      }

      channel.close();
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // Save state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      saveSyncState(stateRef.current.controllers);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // BroadcastChannel for cross-tab sync
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);

    channel.onmessage = (event) => {
      const { type, controllerId, value } = event.data;
      if (!controllerId) return; // Ignore messages without controller ID

      setState((prev) => {
        const currentController = prev.controllers[controllerId] || createDefaultControllerState();
        let updatedController: SingleControllerState;

        switch (type) {
          case "pv":
            updatedController = { ...currentController, syncedPV: value };
            break;
          case "sp":
            updatedController = { ...currentController, syncedSP: value };
            break;
          case "out":
            updatedController = { ...currentController, syncedOUT: value };
            break;
          case "mode":
            updatedController = { ...currentController, syncedMode: value };
            break;
          case "alarms":
            updatedController = { ...currentController, alarmStates: value };
            break;
          case "alarmLog":
            updatedController = { ...currentController, alarmLog: value };
            break;
          case "controller":
            updatedController = value;
            break;
          default:
            return prev;
        }

        return {
          controllers: {
            ...prev.controllers,
            [controllerId]: updatedController,
          },
        };
      });
    };

    return () => channel.close();
  }, []);

  const getControllerState = useCallback((controllerId: string): SingleControllerState => {
    return state.controllers[controllerId] || createDefaultControllerState();
  }, [state.controllers]);

  // Initialize a controller with specific PV, SP, and range values
  const initializeController = useCallback((
    controllerId: string, 
    initialPV: number, 
    initialSP?: number,
    pvRangeMin?: number,
    pvRangeMax?: number
  ) => {
  setState((prev) => {
    const existing = prev.controllers[controllerId];
    // Sanitize incoming values
    const safePV = toFiniteNumber(initialPV, 50);
    const safeSP = toFiniteNumber(initialSP, safePV);
    const safeRangeMin = toFiniteNumber(pvRangeMin, 0);
    const safeRangeMax = toFiniteNumber(pvRangeMax, 100);
    
    // Skip if already initialized AND has valid (finite) PV/SP/OUT values
    // If existing state has NaN values, allow re-initialization to repair
    if (existing?.initialized) {
      const hasValidState = Number.isFinite(existing.syncedPV) && 
                           Number.isFinite(existing.syncedSP) && 
                           Number.isFinite(existing.syncedOUT);
      if (hasValidState) {
        return prev;
      }
      // State is corrupted with NaN, allow re-initialization
      console.log(`[ControllerSync] Re-initializing ${controllerId} due to invalid state`);
    }
      
      return {
        controllers: {
          ...prev.controllers,
          [controllerId]: {
            ...createDefaultControllerState(),
            ...existing,
            syncedPV: safePV,
            syncedSP: safeSP,
            pvRangeMin: safeRangeMin,
            pvRangeMax: safeRangeMax,
            initialized: true,
          },
        },
      };
    });
  }, []);

  const updatePvRange = useCallback((controllerId: string, min: number, max: number) => {
    const safeMin = toFiniteNumber(min, 0);
    const safeMax = toFiniteNumber(max, 100);
    setState((prev) => {
      const currentController = prev.controllers[controllerId] || createDefaultControllerState();
      return {
        controllers: {
          ...prev.controllers,
          [controllerId]: { ...currentController, pvRangeMin: safeMin, pvRangeMax: safeMax },
        },
      };
    });
  }, []);

  const updateSyncedPV = useCallback((controllerId: string, value: number) => {
    // Reject non-finite values to prevent NaN from entering state
    if (!Number.isFinite(value)) {
      console.warn(`[ControllerSync] Rejected non-finite PV value for ${controllerId}:`, value);
      return;
    }
    setState((prev) => {
      const currentController = prev.controllers[controllerId] || createDefaultControllerState();
      return {
        controllers: {
          ...prev.controllers,
          [controllerId]: { ...currentController, syncedPV: value },
        },
      };
    });
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "pv", controllerId, value });
    channel.close();
  }, []);

  const updateSyncedSP = useCallback((controllerId: string, value: number) => {
    // Reject non-finite values to prevent NaN from entering state
    if (!Number.isFinite(value)) {
      console.warn(`[ControllerSync] Rejected non-finite SP value for ${controllerId}:`, value);
      return;
    }
    setState((prev) => {
      const currentController = prev.controllers[controllerId] || createDefaultControllerState();
      return {
        controllers: {
          ...prev.controllers,
          [controllerId]: { ...currentController, syncedSP: value },
        },
      };
    });
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "sp", controllerId, value });
    channel.close();
  }, []);

  const updateSyncedOUT = useCallback((controllerId: string, value: number) => {
    // Reject non-finite values to prevent NaN from entering state
    if (!Number.isFinite(value)) {
      console.warn(`[ControllerSync] Rejected non-finite OUT value for ${controllerId}:`, value);
      return;
    }
    setState((prev) => {
      const currentController = prev.controllers[controllerId] || createDefaultControllerState();
      return {
        controllers: {
          ...prev.controllers,
          [controllerId]: { ...currentController, syncedOUT: value },
        },
      };
    });
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "out", controllerId, value });
    channel.close();
  }, []);

  const updateSyncedMode = useCallback((controllerId: string, mode: SyncedMode) => {
    setState((prev) => {
      const currentController = prev.controllers[controllerId] || createDefaultControllerState();
      return {
        controllers: {
          ...prev.controllers,
          [controllerId]: { ...currentController, syncedMode: mode },
        },
      };
    });
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "mode", controllerId, value: mode });
    channel.close();
  }, []);

  const updateAlarmStates = useCallback((controllerId: string, alarms: AlarmStates) => {
    setState((prev) => {
      const currentController = prev.controllers[controllerId] || createDefaultControllerState();
      return {
        controllers: {
          ...prev.controllers,
          [controllerId]: { ...currentController, alarmStates: alarms },
        },
      };
    });
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "alarms", controllerId, value: alarms });
    channel.close();
  }, []);

  const updateAlarmLimits = useCallback((controllerId: string, limits: AlarmLimits) => {
    setState((prev) => {
      const currentController = prev.controllers[controllerId] || createDefaultControllerState();
      return {
        controllers: {
          ...prev.controllers,
          [controllerId]: { ...currentController, alarmLimits: limits },
        },
      };
    });
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "alarmLimits", controllerId, value: limits });
    channel.close();
  }, []);

  const addAlarmLogEntry = useCallback((controllerId: string, entry: Omit<AlarmLogEntry, "id" | "acknowledged">) => {
    const newEntry: AlarmLogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      acknowledged: false,
    };
    setState((prev) => {
      const currentController = prev.controllers[controllerId] || createDefaultControllerState();
      const newLog = [newEntry, ...currentController.alarmLog].slice(0, 100);
      saveAlarmLog(controllerId, newLog);
      return {
        controllers: {
          ...prev.controllers,
          [controllerId]: { ...currentController, alarmLog: newLog },
        },
      };
    });
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const currentController = stateRef.current.controllers[controllerId] || createDefaultControllerState();
    channel.postMessage({ 
      type: "alarmLog", 
      controllerId, 
      value: [newEntry, ...currentController.alarmLog].slice(0, 100) 
    });
    channel.close();
  }, []);

  const acknowledgeAlarm = useCallback((controllerId: string, id: string) => {
    setState((prev) => {
      const currentController = prev.controllers[controllerId];
      if (!currentController) return prev;
      
      const newLog = currentController.alarmLog.map((entry) =>
        entry.id === id ? { ...entry, acknowledged: true, acknowledgedAt: new Date() } : entry,
      );
      saveAlarmLog(controllerId, newLog);
      return {
        controllers: {
          ...prev.controllers,
          [controllerId]: { ...currentController, alarmLog: newLog },
        },
      };
    });
  }, []);

  const acknowledgeAllAlarms = useCallback((controllerId: string) => {
    setState((prev) => {
      const currentController = prev.controllers[controllerId];
      if (!currentController) return prev;
      
      const newLog = currentController.alarmLog.map((entry) =>
        entry.acknowledged ? entry : { ...entry, acknowledged: true, acknowledgedAt: new Date() },
      );
      saveAlarmLog(controllerId, newLog);
      return {
        controllers: {
          ...prev.controllers,
          [controllerId]: { ...currentController, alarmLog: newLog },
        },
      };
    });
  }, []);

  return (
    <ControllerSyncContext.Provider
      value={{
        getControllerState,
        initializeController,
        updatePvRange,
        updateSyncedPV,
        updateSyncedSP,
        updateSyncedOUT,
        updateSyncedMode,
        updateAlarmStates,
        updateAlarmLimits,
        addAlarmLogEntry,
        acknowledgeAlarm,
        acknowledgeAllAlarms,
      }}
    >
      {children}
    </ControllerSyncContext.Provider>
  );
};

// Hook that returns controller-specific state and updaters
export const useControllerSync = (controllerId: string) => {
  const context = useContext(ControllerSyncContext);
  if (!context) {
    throw new Error("useControllerSync must be used within a ControllerSyncProvider");
  }

  const state = context.getControllerState(controllerId);

  return {
    state,
    initializeController: (initialPV: number, initialSP?: number, pvRangeMin?: number, pvRangeMax?: number) => 
      context.initializeController(controllerId, initialPV, initialSP, pvRangeMin, pvRangeMax),
    updatePvRange: (min: number, max: number) => context.updatePvRange(controllerId, min, max),
    updateSyncedPV: (value: number) => context.updateSyncedPV(controllerId, value),
    updateSyncedSP: (value: number) => context.updateSyncedSP(controllerId, value),
    updateSyncedOUT: (value: number) => context.updateSyncedOUT(controllerId, value),
    updateSyncedMode: (mode: SyncedMode) => context.updateSyncedMode(controllerId, mode),
    updateAlarmStates: (alarms: AlarmStates) => context.updateAlarmStates(controllerId, alarms),
    updateAlarmLimits: (limits: AlarmLimits) => context.updateAlarmLimits(controllerId, limits),
    addAlarmLogEntry: (entry: Omit<AlarmLogEntry, "id" | "acknowledged">) => context.addAlarmLogEntry(controllerId, entry),
    acknowledgeAlarm: (id: string) => context.acknowledgeAlarm(controllerId, id),
    acknowledgeAllAlarms: () => context.acknowledgeAllAlarms(controllerId),
  };
};

// Export types for external use
export type { SyncedMode, AlarmStates, SingleControllerState, AlarmLimits };
