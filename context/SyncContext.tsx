import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { SyncStatus, Op, Conflict } from '@/types';
import { getOps, getSiteId } from '@/utils/storage';
import { syncWithServer, syncAllWarehousesToGitHub } from '@/utils/sync';
import { useWarehouse } from './WarehouseContext';
import { useSyncHook } from './SyncHook';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface SyncContextType {
  syncStatus: SyncStatus;
  triggerFullSync: () => Promise<void>;
  addPendingOp: (op: Op) => void;
  conflicts: Conflict[];
  resolveConflict: (conflictId: string, keepMine: boolean) => Promise<void>;
  lastSyncError: string | null;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncTime: null,
    pendingOps: 0,
    isOnline: true,
    isSyncing: false,
  });
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const { currentWarehouse } = useWarehouse();
  const { registerSyncCallback } = useSyncHook();
  
  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setSyncStatus(prev => ({
        ...prev,
        isOnline: state.isConnected ?? false,
      }));
      
      // Trigger sync when coming back online
      if (state.isConnected && currentWarehouse) {
        triggerFullSync();
      }
    });
    
    return () => unsubscribe();
  }, [currentWarehouse]);
  
  // Count pending ops when warehouse changes
  useEffect(() => {
    const countPendingOps = async () => {
      if (!currentWarehouse) {
        setSyncStatus(prev => ({ ...prev, pendingOps: 0 }));
        return;
      }
      
      try {
        const ops = await getOps(currentWarehouse.id);
        const pendingOps = ops.filter(op => !op.synced).length;
        
        setSyncStatus(prev => ({ ...prev, pendingOps }));
      } catch (error) {
        console.error('Failed to count pending ops:', error);
      }
    };
    
    countPendingOps();
  }, [currentWarehouse]);
  
  // Periodic sync (every 30 seconds)
  useEffect(() => {
    if (!currentWarehouse || !syncStatus.isOnline) return;
    
    const interval = setInterval(() => {
      if (syncStatus.pendingOps > 0 && !syncStatus.isSyncing) {
        triggerFullSync();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [currentWarehouse, syncStatus]);
  

  
  const triggerFullSync = async (): Promise<void> => {
    if (!syncStatus.isOnline || syncStatus.isSyncing) {
      return;
    }
    
    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      
      const result = await syncAllWarehousesToGitHub();
      
      if (result.success) {
        setSyncStatus(prev => ({
          ...prev,
          lastSyncTime: Date.now(),
          pendingOps: 0,
        }));
        setLastSyncError(null);
        
        // Handle conflicts
        if (result.conflicts.length > 0) {
          setConflicts(prev => [...prev, ...result.conflicts]);
        }
        
        console.log('Full sync to GitHub completed successfully');
        Alert.alert(
          'Sync Complete',
          'All data has been successfully synced to GitHub.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Full sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      setLastSyncError(errorMessage);
      
      // Show user-friendly error for GitHub authentication issues
      if (errorMessage.includes('GitHub authentication failed')) {
        Alert.alert(
          'Sync Failed',
          'GitHub authentication failed. Please update your GitHub token in Settings.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Sync Failed',
          `Failed to sync with GitHub: ${errorMessage}`,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };
  
  const addPendingOp = (op: Op) => {
    setSyncStatus(prev => ({
      ...prev,
      pendingOps: prev.pendingOps + 1,
    }));
    
    // Trigger sync if online
    if (syncStatus.isOnline && !syncStatus.isSyncing) {
      triggerFullSync();
    }
  };
  
  // Register the sync callback
  useEffect(() => {
    registerSyncCallback(addPendingOp);
  }, [registerSyncCallback]);
  
  const handleResolveConflict = async (conflictId: string, keepMine: boolean): Promise<void> => {
    // Find the conflict
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;
    
    // In a real app, this would call the resolveConflict utility function
    // For now, just remove the conflict from the list
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
  };
  
  return (
    <SyncContext.Provider
      value={{
        syncStatus,
        triggerFullSync,
        addPendingOp,
        conflicts,
        resolveConflict: handleResolveConflict,
        lastSyncError,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}