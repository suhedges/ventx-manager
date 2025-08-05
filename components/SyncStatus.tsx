import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react-native';
import { useSync } from '@/context/SyncContext';

interface SyncStatusProps {
  testID?: string;
}

export default function SyncStatus({ testID }: SyncStatusProps) {
  const { syncStatus, triggerFullSync, lastSyncError } = useSync();
  
  const formatLastSyncTime = () => {
    if (!syncStatus.lastSyncTime) return 'Never';
    
    const now = Date.now();
    const diff = now - syncStatus.lastSyncTime;
    
    // Less than a minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Format as date
    const date = new Date(syncStatus.lastSyncTime);
    return date.toLocaleString();
  };
  
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.statusContainer}>
        <View style={styles.statusIndicator}>
          {syncStatus.isOnline ? (
            <Wifi size={16} color="#4caf50" />
          ) : (
            <WifiOff size={16} color="#e53935" />
          )}
          <Text style={[
            styles.statusText,
            syncStatus.isOnline ? styles.onlineText : styles.offlineText,
          ]}>
            {syncStatus.isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        
        <View style={styles.syncInfo}>
          <Text style={styles.syncText}>
            Last sync: {formatLastSyncTime()}
          </Text>
          {syncStatus.pendingOps > 0 && (
            <Text style={styles.pendingText}>
              {syncStatus.pendingOps} pending {syncStatus.pendingOps === 1 ? 'change' : 'changes'}
            </Text>
          )}
          {lastSyncError && (
            <View style={styles.errorContainer}>
              <AlertTriangle size={12} color="#e53935" />
              <Text style={styles.errorText} numberOfLines={1}>
                {lastSyncError.includes('GitHub authentication failed') 
                  ? 'GitHub token expired' 
                  : 'Sync error'}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Pressable
          style={[
            styles.syncButton,
            (!syncStatus.isOnline || syncStatus.isSyncing) && styles.syncButtonDisabled,
          ]}
          onPress={triggerFullSync}
          disabled={!syncStatus.isOnline || syncStatus.isSyncing}
          testID={`${testID}-sync-button`}
          accessibilityLabel="Sync all data"
        >
          {syncStatus.isSyncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <RefreshCw size={16} color="#fff" />
          )}
          <Text style={styles.syncButtonText}>
            {syncStatus.isSyncing ? 'Syncing...' : 'Sync'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statusContainer: {
    flex: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  onlineText: {
    color: '#4caf50',
  },
  offlineText: {
    color: '#e53935',
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  syncText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  pendingText: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  errorText: {
    fontSize: 11,
    color: '#e53935',
    marginLeft: 4,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1a3a6a',
  },
  syncButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});