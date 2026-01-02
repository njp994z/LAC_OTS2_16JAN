import { useState, useEffect, useCallback, useRef } from 'react';

const SESSION_KEY = 'ots-sessionId';
const CHANNEL_PREFIX = 'ots-channel-';
const STATE_PREFIX = 'ots-state-';

export interface SessionState {
  [key: string]: unknown;
}

interface SessionSyncOptions {
  onStateChange?: (state: SessionState) => void;
}

export function useSessionSync(options: SessionSyncOptions = {}) {
  const [sessionId, setSessionId] = useState<string>('');
  const [state, setState] = useState<SessionState>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const { onStateChange } = options;

  const generateSessionId = useCallback(() => {
    return crypto.randomUUID();
  }, []);

  const getStorageKey = useCallback((key: string, sid?: string) => {
    const id = sid || sessionId;
    return `${STATE_PREFIX}${id}-${key}`;
  }, [sessionId]);

  const loadStateFromStorage = useCallback((sid: string): SessionState => {
    try {
      const stored = localStorage.getItem(`${STATE_PREFIX}${sid}-state`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load state from storage:', e);
    }
    return {};
  }, []);

  const saveStateToStorage = useCallback((newState: SessionState, sid?: string) => {
    const id = sid || sessionId;
    if (!id) return;
    
    try {
      localStorage.setItem(`${STATE_PREFIX}${id}-state`, JSON.stringify(newState));
    } catch (e) {
      console.warn('Failed to save state to storage (quota exceeded?):', e);
    }
  }, [sessionId]);

  const broadcastState = useCallback((newState: SessionState) => {
    if (channelRef.current) {
      try {
        channelRef.current.postMessage({
          type: 'STATE_UPDATE',
          payload: newState,
          timestamp: Date.now()
        });
      } catch (e) {
        console.warn('Failed to broadcast state:', e);
      }
    }
  }, []);

  const updateState = useCallback((key: string, value: unknown) => {
    setState(prev => {
      const newState = { ...prev, [key]: value };
      saveStateToStorage(newState);
      broadcastState(newState);
      onStateChange?.(newState);
      return newState;
    });
  }, [saveStateToStorage, broadcastState, onStateChange]);

  const updateMultipleStates = useCallback((updates: Record<string, unknown>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      saveStateToStorage(newState);
      broadcastState(newState);
      onStateChange?.(newState);
      return newState;
    });
  }, [saveStateToStorage, broadcastState, onStateChange]);

  const clearSessionData = useCallback((sid: string) => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${STATE_PREFIX}${sid}`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, []);

  const startNewSession = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.close();
      channelRef.current = null;
    }

    if (sessionId) {
      clearSessionData(sessionId);
    }

    const newSessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, newSessionId);
    setSessionId(newSessionId);
    setState({});
    saveStateToStorage({}, newSessionId);

    channelRef.current = new BroadcastChannel(`${CHANNEL_PREFIX}${newSessionId}`);
    setupChannelListener(channelRef.current);

    return newSessionId;
  }, [sessionId, generateSessionId, clearSessionData, saveStateToStorage]);

  const setupChannelListener = useCallback((channel: BroadcastChannel) => {
    channel.onmessage = (event) => {
      const { type, payload, requestSync } = event.data;
      
      if (type === 'STATE_UPDATE' && payload) {
        setState(payload);
        onStateChange?.(payload);
      }
      
      // Handle sync request from newly opened tabs
      if (type === 'REQUEST_SYNC') {
        // Respond with current state
        setState(currentState => {
          if (Object.keys(currentState).length > 0) {
            channel.postMessage({
              type: 'STATE_UPDATE',
              payload: currentState,
              timestamp: Date.now()
            });
          }
          return currentState;
        });
      }
    };

    channel.onmessageerror = (event) => {
      console.warn('BroadcastChannel message error:', event);
    };
  }, [onStateChange]);

  useEffect(() => {
    let existingSessionId = localStorage.getItem(SESSION_KEY);
    
    if (!existingSessionId) {
      existingSessionId = generateSessionId();
      localStorage.setItem(SESSION_KEY, existingSessionId);
    }

    setSessionId(existingSessionId);

    const loadedState = loadStateFromStorage(existingSessionId);
    setState(loadedState);

    channelRef.current = new BroadcastChannel(`${CHANNEL_PREFIX}${existingSessionId}`);
    setupChannelListener(channelRef.current);

    // Request sync from other tabs that may have more recent state
    channelRef.current.postMessage({
      type: 'REQUEST_SYNC',
      timestamp: Date.now()
    });

    // Fallback: Listen for localStorage changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === `${STATE_PREFIX}${existingSessionId}-state` && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue);
          setState(newState);
          onStateChange?.(newState);
        } catch (e) {
          console.warn('Failed to parse storage event:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    setIsInitialized(true);

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [generateSessionId, loadStateFromStorage, setupChannelListener, onStateChange]);

  const getShortSessionId = useCallback(() => {
    return sessionId ? sessionId.substring(0, 8) : '';
  }, [sessionId]);

  return {
    sessionId,
    shortSessionId: getShortSessionId(),
    state,
    isInitialized,
    updateState,
    updateMultipleStates,
    startNewSession,
    getStorageKey
  };
}
