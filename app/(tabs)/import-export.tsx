import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { FileText, Upload } from 'lucide-react-native';
import { router } from 'expo-router';
import { useWarehouse } from '@/context/WarehouseContext';
import WarehouseSelector from '@/components/WarehouseSelector';
import SyncStatus from '@/components/SyncStatus';

export default function ImportExportScreen() {
  const { currentWarehouse, filteredItems } = useWarehouse();
  
  const handleImport = () => {
    if (!currentWarehouse) {
      Alert.alert('No Warehouse Selected', 'Please select a warehouse first.');
      return;
    }
    
    router.push('/import' as any);
  };
  
  const handleExport = (mode: 'all' | 'belowMin' | 'belowMax' | 'currentView') => {
    if (!currentWarehouse) {
      Alert.alert('No Warehouse Selected', 'Please select a warehouse first.');
      return;
    }
    
    // In a real app, this would trigger a file download
    // For now, just show a success message
    Alert.alert(
      'Export Successful',
      `Exported ${getExportCount(mode)} items as CSV.`,
      [{ text: 'OK' }]
    );
  };
  
  const getExportCount = (mode: 'all' | 'belowMin' | 'belowMax' | 'currentView'): number => {
    if (!currentWarehouse) return 0;
    
    switch (mode) {
      case 'all':
        return filteredItems.length;
      case 'belowMin':
        return filteredItems.filter(item => item.min !== undefined && item.qty < item.min).length;
      case 'belowMax':
        return filteredItems.filter(item => item.max !== undefined && item.qty < item.max).length;
      case 'currentView':
        return filteredItems.length;
      default:
        return 0;
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <WarehouseSelector testID="warehouse-selector" />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import</Text>
          <Text style={styles.sectionDescription}>
            Import items from CSV or Excel files. You can map fields and preview data before importing.
          </Text>
          
          <Pressable
            style={styles.actionButton}
            onPress={handleImport}
            testID="import-button"
            accessibilityLabel="Import items"
          >
            <Upload size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Import Items</Text>
          </Pressable>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export</Text>
          <Text style={styles.sectionDescription}>
            Export your inventory data to CSV files for backup or analysis.
          </Text>
          
          <View style={styles.exportOptions}>
            <Pressable
              style={styles.exportButton}
              onPress={() => handleExport('all')}
              testID="export-all-button"
              accessibilityLabel="Export all items"
            >
              <FileText size={20} color="#1a3a6a" />
              <Text style={styles.exportButtonText}>All Items</Text>
              <Text style={styles.exportCount}>{getExportCount('all')}</Text>
            </Pressable>
            
            <Pressable
              style={styles.exportButton}
              onPress={() => handleExport('belowMin')}
              testID="export-below-min-button"
              accessibilityLabel="Export items below minimum"
            >
              <FileText size={20} color="#e53935" />
              <Text style={styles.exportButtonText}>Below Min</Text>
              <Text style={styles.exportCount}>{getExportCount('belowMin')}</Text>
            </Pressable>
            
            <Pressable
              style={styles.exportButton}
              onPress={() => handleExport('belowMax')}
              testID="export-below-max-button"
              accessibilityLabel="Export items below maximum"
            >
              <FileText size={20} color="#ff9800" />
              <Text style={styles.exportButtonText}>Below Max</Text>
              <Text style={styles.exportCount}>{getExportCount('belowMax')}</Text>
            </Pressable>
            
            <Pressable
              style={styles.exportButton}
              onPress={() => handleExport('currentView')}
              testID="export-current-view-button"
              accessibilityLabel="Export current view"
            >
              <FileText size={20} color="#4caf50" />
              <Text style={styles.exportButtonText}>Current View</Text>
              <Text style={styles.exportCount}>{getExportCount('currentView')}</Text>
            </Pressable>
          </View>
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
  header: {
    padding: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a3a6a',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#1a3a6a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  exportOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  exportButton: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    color: '#333',
  },
  exportCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});