import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useSessionSync, type SessionState } from '@/hooks/use-session-sync';

interface SessionContextType {
  sessionId: string;
  shortSessionId: string;
  state: SessionState;
  isInitialized: boolean;
  updateState: (key: string, value: unknown) => void;
  updateMultipleStates: (updates: Record<string, unknown>) => void;
  startNewSession: () => string;
  getStateValue: <T>(key: string, defaultValue: T) => T;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const {
    sessionId,
    shortSessionId,
    state,
    isInitialized,
    updateState,
    updateMultipleStates,
    startNewSession
  } = useSessionSync();

  const getStateValue = useCallback(<T,>(key: string, defaultValue: T): T => {
    const value = state[key];
    return value !== undefined ? (value as T) : defaultValue;
  }, [state]);

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        shortSessionId,
        state,
        isInitialized,
        updateState,
        updateMultipleStates,
        startNewSession,
        getStateValue
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
