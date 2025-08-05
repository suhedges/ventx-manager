import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, FlatList, TextInput, Alert } from 'react-native';
import { ChevronDown, Plus, Trash2 } from 'lucide-react-native';
import { Warehouse } from '@/types';
import { useWarehouse } from '@/context/WarehouseContext';

interface WarehouseSelectorProps {
  testID?: string;
}

export default function WarehouseSelector({ testID }: WarehouseSelectorProps) {
  const {
    warehouses,
    currentWarehouse,
    selectWarehouse,
    createWarehouse,
    deleteWarehouse,
  } = useWarehouse();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');
  
  const handleSelectWarehouse = async (warehouse: Warehouse) => {
    try {
      await selectWarehouse(warehouse.id);
      setIsModalVisible(false);
    } catch (error) {
      console.error('Failed to select warehouse:', error);
      Alert.alert('Error', 'Failed to select warehouse. Please try again.');
    }
  };
  
  const handleCreateWarehouse = async () => {
    if (!newWarehouseName.trim()) {
      Alert.alert('Error', 'Please enter a warehouse name.');
      return;
    }
    
    try {
      await createWarehouse(newWarehouseName);
      setNewWarehouseName('');
      setIsCreating(false);
      setIsModalVisible(false);
    } catch (error) {
      console.error('Failed to create warehouse:', error);
      Alert.alert('Error', 'Failed to create warehouse. Please try again.');
    }
  };
  
  const handleDeleteWarehouse = (warehouse: Warehouse) => {
    Alert.alert(
      'Delete Warehouse',
      `Are you sure you want to delete ${warehouse.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWarehouse(warehouse.id);
            } catch (error) {
              console.error('Failed to delete warehouse:', error);
              Alert.alert('Error', 'Failed to delete warehouse. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  const renderWarehouseItem = ({ item }: { item: Warehouse }) => (
    <Pressable
      style={[
        styles.warehouseItem,
        currentWarehouse?.id === item.id && styles.selectedWarehouse,
      ]}
      onPress={() => handleSelectWarehouse(item)}
      testID={`warehouse-${item.id}`}
    >
      <Text
        style={[
          styles.warehouseName,
          currentWarehouse?.id === item.id && styles.selectedWarehouseName,
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.name}
      </Text>
      {warehouses.length > 1 && (
        <Pressable
          onPress={() => handleDeleteWarehouse(item)}
          style={styles.deleteButton}
          testID={`delete-warehouse-${item.id}`}
          accessibilityLabel={`Delete warehouse ${item.name}`}
        >
          <Trash2 size={18} color="#e53935" />
        </Pressable>
      )}
    </Pressable>
  );
  
  return (
    <View testID={testID}>
      <Pressable
        style={styles.selector}
        onPress={() => setIsModalVisible(true)}
        testID={`${testID}-button`}
        accessibilityLabel="Select warehouse"
      >
        <Text style={styles.selectorText} numberOfLines={1} ellipsizeMode="tail">
          {currentWarehouse?.name || 'Select Warehouse'}
        </Text>
        <ChevronDown size={20} color="#1a3a6a" />
      </Pressable>
      
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
        testID={`${testID}-modal`}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Warehouse</Text>
            
            {warehouses.length > 0 && (
              <FlatList
                data={warehouses.filter(w => !w.softDeleted)}
                renderItem={renderWarehouseItem}
                keyExtractor={item => item.id}
                style={styles.warehouseList}
                testID={`${testID}-list`}
              />
            )}
            
            {isCreating ? (
              <View style={styles.createContainer}>
                <TextInput
                  style={styles.createInput}
                  value={newWarehouseName}
                  onChangeText={setNewWarehouseName}
                  placeholder="Warehouse name"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleCreateWarehouse}
                  testID={`${testID}-create-input`}
                  accessibilityLabel="New warehouse name"
                />
                <View style={styles.createActions}>
                  <Pressable
                    style={[styles.createButton, styles.cancelButton]}
                    onPress={() => {
                      setIsCreating(false);
                      setNewWarehouseName('');
                    }}
                    testID={`${testID}-create-cancel`}
                    accessibilityLabel="Cancel creating warehouse"
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.createButton, styles.saveButton]}
                    onPress={handleCreateWarehouse}
                    testID={`${testID}-create-save`}
                    accessibilityLabel="Save new warehouse"
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={styles.addButton}
                onPress={() => setIsCreating(true)}
                testID={`${testID}-add-button`}
                accessibilityLabel="Add new warehouse"
              >
                <Plus size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Warehouse</Text>
              </Pressable>
            )}
            
            <Pressable
              style={styles.closeButton}
              onPress={() => {
                setIsModalVisible(false);
                setIsCreating(false);
                setNewWarehouseName('');
              }}
              testID={`${testID}-close`}
              accessibilityLabel="Close warehouse selector"
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  warehouseList: {
    marginBottom: 16,
    maxHeight: 300,
  },
  warehouseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedWarehouse: {
    backgroundColor: '#e6f0ff',
  },
  warehouseName: {
    fontSize: 16,
    flex: 1,
  },
  selectedWarehouseName: {
    fontWeight: '600',
    color: '#1a3a6a',
  },
  deleteButton: {
    padding: 8,
  },
  createContainer: {
    marginBottom: 16,
  },
  createInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  createButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#1a3a6a',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a3a6a',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
    marginLeft: 8,
  },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  closeButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 16,
  },
});