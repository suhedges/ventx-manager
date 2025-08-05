import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { FileText, Upload, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { useWarehouse } from '@/context/WarehouseContext';
import WarehouseSelector from '@/components/WarehouseSelector';
import SyncStatus from '@/components/SyncStatus';
import { filterItemsForExport, convertItemsToCSV, downloadCSV, getExportFilename, ExportMode } from '@/utils/csvExport';

export default function ImportExportScreen() {
  const { currentWarehouse, items } = useWarehouse();
  
  const handleImport = () => {
    if (!currentWarehouse) {
      Alert.alert('No Warehouse Selected', 'Please select a warehouse first.');
      return;
    }
    
    router.push('/import' as any);
  };
  
  const handleExport = async (mode: ExportMode) => {
    if (!currentWarehouse) {
      Alert.alert('No Warehouse Selected', 'Please select a warehouse first.');
      return;
    }
    
    try {
      // Get all items (not just filtered ones) for export
      const allItems = items.filter(item => !item.deleted);
      const itemsToExport = filterItemsForExport(allItems, mode);
      
      if (itemsToExport.length === 0) {
        Alert.alert('No Items to Export', `No items found for ${mode} export.`);
        return;
      }
      
      const csvContent = convertItemsToCSV(itemsToExport);
      const filename = getExportFilename(mode, currentWarehouse.name);
      
      await downloadCSV(csvContent, filename);
      
      Alert.alert(
        'Export Successful',
        `Successfully exported ${itemsToExport.length} items as ${filename}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert(
        'Export Failed', 
        error instanceof Error ? error.message : 'An error occurred while exporting the data.'
      );
    }
  };
  
  const getExportCount = (mode: ExportMode): number => {
    if (!currentWarehouse) return 0;
    
    // Use all items (not just filtered ones) for export counts
    const allItems = items.filter(item => !item.deleted);
    const itemsToExport = filterItemsForExport(allItems, mode);
    return itemsToExport.length;
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
              onPress={() => handleExport('overstock')}
              testID="export-overstock-button"
              accessibilityLabel="Export overstock items"
            >
              <TrendingUp size={20} color="#9c27b0" />
              <Text style={styles.exportButtonText}>Overstock</Text>
              <Text style={styles.exportCount}>{getExportCount('overstock')}</Text>
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