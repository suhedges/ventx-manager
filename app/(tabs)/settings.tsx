import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Alert, ScrollView } from 'react-native';
import { Database, HelpCircle } from 'lucide-react-native';
import SyncStatus from '@/components/SyncStatus';

export default function SettingsScreen() {
  const [offlineMode, setOfflineMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  
  const handleClearData = () => {
    Alert.alert(
      'Clear Local Data',
      'This will delete all locally stored data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            // In a real app, this would clear local storage
            Alert.alert('Success', 'Local data has been cleared.');
          },
        },
      ]
    );
  };
  
  const handleAbout = () => {
    Alert.alert(
      'About VentX',
      'VentX is a secure, offline-first inventory management application designed for multi-user environments. Version 1.0.0',
      [{ text: 'OK' }]
    );
  };
  
  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connectivity</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Offline Mode</Text>
              <Text style={styles.settingDescription}>
                Work without network connection
              </Text>
            </View>
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              trackColor={{ false: '#e0e0e0', true: '#a7c4e5' }}
              thumbColor={offlineMode ? '#1a3a6a' : '#f5f5f5'}
              testID="offline-mode-switch"
              accessibilityLabel="Toggle offline mode"
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Sync</Text>
              <Text style={styles.settingDescription}>
                Automatically sync when online
              </Text>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: '#e0e0e0', true: '#a7c4e5' }}
              thumbColor={autoSync ? '#1a3a6a' : '#f5f5f5'}
              testID="auto-sync-switch"
              accessibilityLabel="Toggle auto sync"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive alerts for inventory changes
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#e0e0e0', true: '#a7c4e5' }}
              thumbColor={notifications ? '#1a3a6a' : '#f5f5f5'}
              testID="notifications-switch"
              accessibilityLabel="Toggle notifications"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <Pressable
            style={styles.actionButton}
            onPress={handleClearData}
            testID="clear-data-button"
            accessibilityLabel="Clear local data"
          >
            <Database size={20} color="#e53935" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>
              Clear Local Data
            </Text>
          </Pressable>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <Pressable
            style={styles.actionButton}
            onPress={handleAbout}
            testID="about-button"
            accessibilityLabel="About VentX"
          >
            <HelpCircle size={20} color="#1a3a6a" />
            <Text style={styles.actionButtonText}>About VentX</Text>
          </Pressable>
        </View>
      </ScrollView>
      
      <SyncStatus testID="sync-status" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a3a6a',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a3a6a',
    marginLeft: 12,
  },
  dangerText: {
    color: '#e53935',
  },
});