import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Switch } from 'react-native';
import { X } from 'lucide-react-native';
import { FilterOptions } from '@/types';

interface FilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  filterOptions: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  testID?: string;
}

export default function FilterModal({
  isVisible,
  onClose,
  filterOptions,
  onApplyFilters,
  testID,
}: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filterOptions);
  
  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };
  
  const handleReset = () => {
    const resetFilters: FilterOptions = {
      search: filterOptions.search, // Keep the search text
      belowMin: false,
      sortBy: 'internal',
      sortDirection: 'asc',
    };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };
  
  const toggleBelowMin = () => {
    setLocalFilters(prev => ({
      ...prev,
      belowMin: !prev.belowMin,
    }));
  };
  
  const setSortBy = (field: string) => {
    setLocalFilters(prev => {
      // If selecting the same field, toggle direction
      if (prev.sortBy === field) {
        return {
          ...prev,
          sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc',
        };
      }
      // Otherwise, set new field with ascending direction
      return {
        ...prev,
        sortBy: field,
        sortDirection: 'asc',
      };
    });
  };
  
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Options</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              testID={`${testID}-close`}
              accessibilityLabel="Close filter options"
            >
              <X size={24} color="#333" />
            </Pressable>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Filters</Text>
            
            <View style={styles.filterOption}>
              <Text style={styles.filterLabel}>Below Minimum</Text>
              <Switch
                value={localFilters.belowMin}
                onValueChange={toggleBelowMin}
                trackColor={{ false: '#e0e0e0', true: '#a7c4e5' }}
                thumbColor={localFilters.belowMin ? '#1a3a6a' : '#f5f5f5'}
                testID={`${testID}-below-min`}
                accessibilityLabel="Show items below minimum quantity"
              />
            </View>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            
            {['internal', 'custom', 'qty', 'min', 'max', 'bin'].map(field => (
              <Pressable
                key={field}
                style={styles.sortOption}
                onPress={() => setSortBy(field)}
                testID={`${testID}-sort-${field}`}
                accessibilityLabel={`Sort by ${field}`}
              >
                <Text style={styles.sortLabel}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </Text>
                <View style={styles.sortIndicator}>
                  {localFilters.sortBy === field && (
                    <Text style={styles.sortDirection}>
                      {localFilters.sortDirection === 'asc' ? '↑' : '↓'}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
          
          <View style={styles.buttonContainer}>
            <Pressable
              style={styles.resetButton}
              onPress={handleReset}
              testID={`${testID}-reset`}
              accessibilityLabel="Reset filters"
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </Pressable>
            <Pressable
              style={styles.applyButton}
              onPress={handleApply}
              testID={`${testID}-apply`}
              accessibilityLabel="Apply filters"
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterLabel: {
    fontSize: 16,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortLabel: {
    fontSize: 16,
  },
  sortIndicator: {
    width: 24,
    alignItems: 'center',
  },
  sortDirection: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a3a6a',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#1a3a6a',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});