import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Save, Trash2, BarcodeIcon } from 'lucide-react-native';
import { useWarehouse } from '@/context/WarehouseContext';
import QuantityStepper from '@/components/QuantityStepper';
import { validateItem, isDuplicateUPC } from '@/utils/validators';
import { Item } from '@/types';

export default function ItemDetailScreen() {
  const { id, scannedUPC } = useLocalSearchParams<{ id: string; scannedUPC?: string }>();
  const isNewItem = id === 'new';
  
  const { currentWarehouse, items, createItem, updateItem, deleteItem } = useWarehouse();
  
  const [item, setItem] = useState<Partial<Item>>({
    internal: '',
    custom: '',
    upc: '',
    qty: 0,
    min: undefined,
    max: undefined,
    bin: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Load item data if editing an existing item, or set scanned UPC for new items
  useEffect(() => {
    if (!isNewItem && currentWarehouse) {
      const existingItem = items.find(i => i.internal === id);
      if (existingItem) {
        setItem(existingItem);
      } else {
        Alert.alert('Error', 'Item not found');
        router.back();
      }
    } else if (isNewItem && scannedUPC) {
      // Set the scanned UPC for new items
      setItem(prev => ({ ...prev, upc: scannedUPC }));
    }
  }, [isNewItem, id, items, currentWarehouse, scannedUPC]);
  
  const handleSave = async () => {
    if (!currentWarehouse) {
      Alert.alert('Error', 'No warehouse selected');
      return;
    }
    
    // Validate item
    const validationErrors = validateItem(item);
    
    // Check for duplicate UPC
    if (item.upc && isDuplicateUPC(item.upc, items, isNewItem ? undefined : id)) {
      validationErrors.push('UPC is already in use by another item');
    }
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isNewItem) {
        await createItem({
          ...item,
          whId: currentWarehouse.id,
        });
        Alert.alert('Success', 'Item created successfully');
      } else {
        await updateItem(id, item);
        Alert.alert('Success', 'Item updated successfully');
      }
      
      router.back();
    } catch (error) {
      console.error('Failed to save item:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = () => {
    if (isNewItem) {
      router.back();
      return;
    }
    
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete ${item.internal}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteItem(id);
              Alert.alert('Success', 'Item deleted successfully');
              router.back();
            } catch (error) {
              console.error('Failed to delete item:', error);
              Alert.alert('Error', 'Failed to delete item. Please try again.');
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };
  
  const handleScanBarcode = () => {
    // Store current item state in params to restore after scanning
    router.push({
      pathname: '/scanner' as any,
      params: { returnToItem: id },
    });
  };
  
  // Update header buttons
  useEffect(() => {
    router.setParams({
      title: isNewItem ? 'New Item' : `Edit ${item.internal}`,
    });
  }, [isNewItem, item.internal]);
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen
        options={{
          title: isNewItem ? 'New Item' : `Edit ${item.internal}`,
          headerRight: () => (
            <View style={styles.headerButtons}>
              {!isNewItem && (
                <Pressable
                  onPress={handleDelete}
                  style={styles.headerButton}
                  testID="delete-button"
                  accessibilityLabel="Delete item"
                >
                  <Trash2 size={24} color="#e53935" />
                </Pressable>
              )}
              <Pressable
                onPress={handleSave}
                style={styles.headerButton}
                testID="save-button"
                accessibilityLabel="Save item"
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Save size={24} color="#fff" />
                )}
              </Pressable>
            </View>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        {errors.length > 0 && (
          <View style={styles.errorContainer}>
            {errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                • {error}
              </Text>
            ))}
          </View>
        )}
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Internal ID *</Text>
            <TextInput
              style={styles.input}
              value={item.internal}
              onChangeText={value => setItem(prev => ({ ...prev, internal: value }))}
              placeholder="Enter internal ID"
              editable={isNewItem} // Only editable for new items
              testID="internal-input"
              accessibilityLabel="Internal ID input"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Custom ID</Text>
            <TextInput
              style={styles.input}
              value={item.custom}
              onChangeText={value => setItem(prev => ({ ...prev, custom: value }))}
              placeholder="Enter custom ID"
              testID="custom-input"
              accessibilityLabel="Custom ID input"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <View style={styles.upcContainer}>
              <View style={styles.upcInputContainer}>
                <Text style={styles.label}>UPC</Text>
                <TextInput
                  style={styles.input}
                  value={item.upc}
                  onChangeText={value => setItem(prev => ({ ...prev, upc: value }))}
                  placeholder="Enter UPC"
                  keyboardType="numeric"
                  testID="upc-input"
                  accessibilityLabel="UPC input"
                />
              </View>
              <Pressable
                style={styles.scanButton}
                onPress={handleScanBarcode}
                testID="scan-button"
                accessibilityLabel="Scan barcode"
              >
                <BarcodeIcon size={24} color="#fff" />
              </Pressable>
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bin Location</Text>
            <TextInput
              style={styles.input}
              value={item.bin}
              onChangeText={value => setItem(prev => ({ ...prev, bin: value }))}
              placeholder="Enter bin location"
              testID="bin-input"
              accessibilityLabel="Bin location input"
            />
          </View>
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Quantity Management</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Quantity *</Text>
            <QuantityStepper
              value={item.qty ?? 0}
              onChange={value => setItem(prev => ({ ...prev, qty: value }))}
              min={0}
              max={item.max}
              testID="qty-stepper"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Minimum</Text>
            <TextInput
              style={styles.input}
              value={item.min !== undefined ? item.min.toString() : ''}
              onChangeText={value => {
                const numValue = value === '' ? undefined : parseInt(value, 10);
                setItem(prev => ({ ...prev, min: isNaN(numValue as number) ? undefined : numValue }));
              }}
              placeholder="Enter minimum quantity"
              keyboardType="numeric"
              testID="min-input"
              accessibilityLabel="Minimum quantity input"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Maximum</Text>
            <TextInput
              style={styles.input}
              value={item.max !== undefined ? item.max.toString() : ''}
              onChangeText={value => {
                const numValue = value === '' ? undefined : parseInt(value, 10);
                setItem(prev => ({ ...prev, max: isNaN(numValue as number) ? undefined : numValue }));
              }}
              placeholder="Enter maximum quantity"
              keyboardType="numeric"
              testID="max-input"
              accessibilityLabel="Maximum quantity input"
            />
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Pressable
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
          testID="save-button-footer"
          accessibilityLabel="Save item"
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {isNewItem ? 'Create Item' : 'Save Changes'}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e53935',
  },
  errorText: {
    color: '#e53935',
    fontSize: 14,
    marginBottom: 4,
  },
  formSection: {
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
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  upcContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  upcInputContainer: {
    flex: 1,
    marginRight: 8,
  },
  scanButton: {
    backgroundColor: '#4caf50',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#1a3a6a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});