import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Upload, FileText, Check, AlertTriangle } from 'lucide-react-native';
import { useWarehouse } from '@/context/WarehouseContext';

// Mock data for preview
const MOCK_IMPORT_DATA = [
  { internal: 'TSB001', custom: 'CUST001', upc: '123456789012', qty: 10, min: 5, max: 20, bin: 'A1' },
  { internal: 'TSB002', custom: 'CUST002', upc: '234567890123', qty: 5, min: 2, max: 15, bin: 'A2' },
  { internal: 'TSB003', custom: 'CUST003', upc: '345678901234', qty: 20, min: 10, max: 30, bin: 'B1' },
  { internal: 'TSB004', custom: 'CUST004', upc: '456789012345', qty: 8, min: 5, max: 25, bin: 'B2' },
  { internal: 'TSB005', custom: 'CUST005', upc: '567890123456', qty: 15, min: 8, max: 40, bin: 'C1' },
];

export default function ImportScreen() {
  const { currentWarehouse, createItem } = useWarehouse();
  
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload');
  const [fieldMapping, setFieldMapping] = useState({
    internal: 'internal',
    custom: 'custom',
    upc: 'upc',
    qty: 'qty',
    min: 'min',
    max: 'max',
    bin: 'bin',
  });
  const [overwriteQty, setOverwriteQty] = useState(false);
  const [importData] = useState(MOCK_IMPORT_DATA);
  const [progress, setProgress] = useState(0);
  
  const handleUpload = () => {
    // In a real app, this would handle file selection and parsing
    // For now, just move to the mapping step with mock data
    setStep('mapping');
  };
  
  const handleFieldMappingChange = (field: string, value: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const handlePreview = () => {
    // In a real app, this would apply the field mapping to the parsed data
    // For now, just move to the preview step
    setStep('preview');
  };
  
  const handleImport = async () => {
    if (!currentWarehouse) {
      Alert.alert('Error', 'No warehouse selected');
      return;
    }
    
    setStep('importing');
    
    // Simulate import progress
    for (let i = 0; i <= importData.length; i++) {
      setProgress(Math.floor((i / importData.length) * 100));
      
      if (i < importData.length) {
        try {
          // In a real app, this would use the field mapping and handle conflicts
          await createItem({
            ...importData[i],
            whId: currentWarehouse.id,
          });
        } catch (error) {
          console.error(`Failed to import item ${importData[i].internal}:`, error);
          // Continue with next item
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    Alert.alert(
      'Import Complete',
      `Successfully imported ${importData.length} items.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };
  
  const renderUploadStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.uploadArea}>
        <FileText size={48} color="#1a3a6a" />
        <Text style={styles.uploadText}>Select a CSV or Excel file</Text>
        <Text style={styles.uploadSubtext}>
          Your file should contain columns for item data such as Internal ID, UPC, Quantity, etc.
        </Text>
        <Pressable
          style={styles.uploadButton}
          onPress={handleUpload}
          testID="select-file-button"
          accessibilityLabel="Select file"
        >
          <Upload size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>Select File</Text>
        </Pressable>
      </View>
    </View>
  );
  
  const renderMappingStep = () => (
    <ScrollView style={styles.stepContainer}>
      <View style={styles.mappingContainer}>
        <Text style={styles.mappingTitle}>Map File Columns</Text>
        <Text style={styles.mappingSubtitle}>
          Match your file columns to the inventory fields
        </Text>
        
        {Object.entries(fieldMapping).map(([field, value]) => (
          <View key={field} style={styles.mappingRow}>
            <Text style={styles.mappingLabel}>
              {field.charAt(0).toUpperCase() + field.slice(1)}
              {field === 'internal' && ' *'}
            </Text>
            <TextInput
              style={styles.mappingInput}
              value={value}
              onChangeText={text => handleFieldMappingChange(field, text)}
              placeholder={`Column for ${field}`}
              testID={`mapping-${field}`}
              accessibilityLabel={`Column mapping for ${field}`}
            />
          </View>
        ))}
        
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>Import Options</Text>
          
          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>Overwrite Quantities</Text>
              <Text style={styles.optionDescription}>
                If disabled, existing quantities will be preserved
              </Text>
            </View>
            <Switch
              value={overwriteQty}
              onValueChange={setOverwriteQty}
              trackColor={{ false: '#e0e0e0', true: '#a7c4e5' }}
              thumbColor={overwriteQty ? '#1a3a6a' : '#f5f5f5'}
              testID="overwrite-qty-switch"
              accessibilityLabel="Overwrite quantities"
            />
          </View>
        </View>
        
        <Pressable
          style={styles.continueButton}
          onPress={handlePreview}
          testID="preview-button"
          accessibilityLabel="Preview import"
        >
          <Text style={styles.continueButtonText}>Preview Import</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
  
  const renderPreviewStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.previewHeader}>
        <Text style={styles.previewTitle}>Preview Import</Text>
        <Text style={styles.previewSubtitle}>
          {importData.length} items will be imported
        </Text>
      </View>
      
      <ScrollView style={styles.previewList}>
        {importData.map((item, index) => (
          <View key={index} style={styles.previewItem}>
            <View style={styles.previewItemHeader}>
              <Text style={styles.previewItemId}>{item.internal}</Text>
              {item.custom && (
                <Text style={styles.previewItemCustom}>{item.custom}</Text>
              )}
            </View>
            <View style={styles.previewItemDetails}>
              <Text style={styles.previewItemDetail}>
                UPC: <Text style={styles.previewItemValue}>{item.upc || 'N/A'}</Text>
              </Text>
              <Text style={styles.previewItemDetail}>
                Qty: <Text style={styles.previewItemValue}>{item.qty}</Text>
              </Text>
              <Text style={styles.previewItemDetail}>
                Min/Max: <Text style={styles.previewItemValue}>{item.min || 'N/A'}/{item.max || 'N/A'}</Text>
              </Text>
              <Text style={styles.previewItemDetail}>
                Bin: <Text style={styles.previewItemValue}>{item.bin || 'N/A'}</Text>
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.previewFooter}>
        <View style={styles.warningContainer}>
          <AlertTriangle size={20} color="#ff9800" />
          <Text style={styles.warningText}>
            This will {overwriteQty ? 'overwrite' : 'preserve'} existing quantities.
          </Text>
        </View>
        
        <Pressable
          style={styles.importButton}
          onPress={handleImport}
          testID="import-button"
          accessibilityLabel="Import items"
        >
          <Check size={20} color="#fff" />
          <Text style={styles.importButtonText}>Import Items</Text>
        </Pressable>
      </View>
    </View>
  );
  
  const renderImportingStep = () => (
    <View style={styles.importingContainer}>
      <ActivityIndicator size="large" color="#1a3a6a" />
      <Text style={styles.importingText}>Importing Items...</Text>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>{progress}% Complete</Text>
      <Text style={styles.importingSubtext}>
        Imported {Math.floor((progress / 100) * importData.length)} of {importData.length} items
      </Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Import Items' }} />
      
      <View style={styles.stepsIndicator}>
        <View
          style={[
            styles.stepIndicator,
            step === 'upload' && styles.activeStepIndicator,
          ]}
        >
          <Text
            style={[
              styles.stepNumber,
              step === 'upload' && styles.activeStepNumber,
            ]}
          >
            1
          </Text>
          <Text
            style={[
              styles.stepText,
              step === 'upload' && styles.activeStepText,
            ]}
          >
            Upload
          </Text>
        </View>
        
        <View style={styles.stepConnector} />
        
        <View
          style={[
            styles.stepIndicator,
            step === 'mapping' && styles.activeStepIndicator,
          ]}
        >
          <Text
            style={[
              styles.stepNumber,
              step === 'mapping' && styles.activeStepNumber,
            ]}
          >
            2
          </Text>
          <Text
            style={[
              styles.stepText,
              step === 'mapping' && styles.activeStepText,
            ]}
          >
            Mapping
          </Text>
        </View>
        
        <View style={styles.stepConnector} />
        
        <View
          style={[
            styles.stepIndicator,
            (step === 'preview' || step === 'importing') && styles.activeStepIndicator,
          ]}
        >
          <Text
            style={[
              styles.stepNumber,
              (step === 'preview' || step === 'importing') && styles.activeStepNumber,
            ]}
          >
            3
          </Text>
          <Text
            style={[
              styles.stepText,
              (step === 'preview' || step === 'importing') && styles.activeStepText,
            ]}
          >
            Import
          </Text>
        </View>
      </View>
      
      {step === 'upload' && renderUploadStep()}
      {step === 'mapping' && renderMappingStep()}
      {step === 'preview' && renderPreviewStep()}
      {step === 'importing' && renderImportingStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stepIndicator: {
    alignItems: 'center',
  },
  activeStepIndicator: {
    // No specific style needed here
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    color: '#666',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activeStepNumber: {
    backgroundColor: '#1a3a6a',
    color: '#fff',
  },
  stepText: {
    fontSize: 12,
    color: '#666',
  },
  activeStepText: {
    color: '#1a3a6a',
    fontWeight: '500',
  },
  stepConnector: {
    width: 30,
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  stepContainer: {
    flex: 1,
  },
  uploadArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: '#1a3a6a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  mappingContainer: {
    padding: 16,
  },
  mappingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mappingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  mappingRow: {
    marginBottom: 16,
  },
  mappingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  mappingInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  optionsContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  optionInfo: {
    flex: 1,
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  continueButton: {
    backgroundColor: '#1a3a6a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  previewList: {
    flex: 1,
  },
  previewItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  previewItemHeader: {
    marginBottom: 8,
  },
  previewItemId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewItemCustom: {
    fontSize: 14,
    color: '#666',
  },
  previewItemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  previewItemDetail: {
    fontSize: 14,
    color: '#666',
    marginRight: 16,
    marginBottom: 4,
  },
  previewItemValue: {
    color: '#333',
    fontWeight: '500',
  },
  previewFooter: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#ff9800',
    marginLeft: 8,
    flex: 1,
  },
  importButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  importingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  importingText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  progressContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  importingSubtext: {
    fontSize: 14,
    color: '#666',
  },
});