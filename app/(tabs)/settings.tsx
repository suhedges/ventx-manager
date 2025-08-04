import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Alert, ScrollView, TextInput } from 'react-native';
import { Database, HelpCircle, Key, Save } from 'lucide-react-native';
import SyncStatus from '@/components/SyncStatus';
import { updateGitHubToken } from '@/utils/sync';

export default function SettingsScreen() {
  const [offlineMode, setOfflineMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [githubToken, setGithubToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  
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
  
  const handleUpdateToken = async () => {
    if (!githubToken.trim()) {
      Alert.alert('Error', 'Please enter a valid GitHub token.');
      return;
    }
    
    if (!githubToken.trim().startsWith('ghp_')) {
      Alert.alert('Error', 'Please enter a valid GitHub Personal Access Token (should start with "ghp_").');
      return;
    }
    
    try {
      await updateGitHubToken(githubToken.trim());
      setShowTokenInput(false);
      setGithubToken('');
      
      Alert.alert(
        'Success',
        'GitHub token has been updated successfully. You can now sync with GitHub.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to update GitHub token:', error);
      Alert.alert(
        'Error',
        'Failed to save the GitHub token. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const handleConfigureGitHub = () => {
    Alert.alert(
      'Configure GitHub Sync',
      'To sync with GitHub, you need a Personal Access Token with "repo" permissions.\n\n1. Go to https://github.com/settings/tokens\n2. Click "Generate new token (classic)"\n3. Select "repo" scope\n4. Copy the token and paste it below',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enter Token',
          onPress: () => setShowTokenInput(true),
        },
      ]
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
          <Text style={styles.sectionTitle}>GitHub Sync</Text>
          
          <Pressable
            style={styles.actionButton}
            onPress={handleConfigureGitHub}
            testID="configure-github-button"
            accessibilityLabel="Configure GitHub sync"
          >
            <Key size={20} color="#1a3a6a" />
            <Text style={styles.actionButtonText}>
              Configure GitHub Token
            </Text>
          </Pressable>
          
          {showTokenInput && (
            <View style={styles.tokenInputContainer}>
              <Text style={styles.tokenInputLabel}>
                Enter your GitHub Personal Access Token:
              </Text>
              <Text style={styles.tokenInstructions}>
                1. Go to https://github.com/settings/tokens{"\n"}
                2. Click &quot;Generate new token (classic)&quot;{"\n"}
                3. Select &quot;repo&quot; scope for full repository access{"\n"}
                4. Copy and paste the token below
              </Text>
              <TextInput
                style={styles.tokenInput}
                value={githubToken}
                onChangeText={setGithubToken}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                testID="github-token-input"
              />
              <View style={styles.tokenActions}>
                <Pressable
                  style={[styles.tokenButton, styles.cancelButton]}
                  onPress={() => {
                    setShowTokenInput(false);
                    setGithubToken('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.tokenButton, styles.saveButton]}
                  onPress={handleUpdateToken}
                >
                  <Save size={16} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Token</Text>
                </Pressable>
              </View>
            </View>
          )}
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
  tokenInputContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tokenInputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  tokenInstructions: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
    lineHeight: 16,
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#1a3a6a',
  },
  tokenInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    fontFamily: 'monospace',
  },
  tokenActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  tokenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#1a3a6a',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});