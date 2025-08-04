import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Op } from '@/types';

interface SyncHookContextType {
  addPendingOp: (op: Op) => void;
  registerSyncCallback: (callback: (op: Op) => void) => void;
}

const SyncHookContext = createContext<SyncHookContextType | undefined>(undefined);

export function SyncHookProvider({ children }: { children: React.ReactNode }) {
  const syncCallbackRef = useRef<((op: Op) => void) | null>(null);
  
  const addPendingOp = (op: Op) => {
    if (syncCallbackRef.current) {
      syncCallbackRef.current(op);
    }
  };
  
  const registerSyncCallback = (callback: (op: Op) => void) => {
    syncCallbackRef.current = callback;
  };
  
  return (
    <SyncHookContext.Provider value={{ addPendingOp, registerSyncCallback }}>
      {children}
    </SyncHookContext.Provider>
  );
}

export function useSyncHook() {
  const context = useContext(SyncHookContext);
  if (context === undefined) {
    throw new Error('useSyncHook must be used within a SyncHookProvider');
  }
  return context;
}