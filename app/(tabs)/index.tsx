import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, Alert, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { Plus, ScanLine } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useWarehouse } from '@/context/WarehouseContext';
import { useSync } from '@/context/SyncContext';
import WarehouseSelector from '@/components/WarehouseSelector';
import SearchBar from '@/components/SearchBar';
import FilterModal from '@/components/FilterModal';
import ItemList from '@/components/ItemList';
import SyncStatus from '@/components/SyncStatus';
import ConflictBanner from '@/components/ConflictBanner';
import { FilterOptions, Item } from '@/types';

export default function InventoryScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentWarehouse, filteredItems, filterOptions, setFilterOptions, isLoading } = useWarehouse();
  const { conflicts } = useSync();
  
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  
  const handleSearchChange = useCallback((text: string) => {
    setFilterOptions({ search: text });
  }, [setFilterOptions]);
  
  const handleFilterPress = useCallback(() => {
    setIsFilterModalVisible(true);
  }, []);
  
  const handleApplyFilters = useCallback((filters: FilterOptions) => {
    setFilterOptions(filters);
  }, [setFilterOptions]);
  
  const handleAddItem = useCallback(() => {
    if (!currentWarehouse) {
      Alert.alert('No Warehouse Selected', 'Please select a warehouse first.');
      return;
    }
    
    router.push('/item/new' as any);
  }, [currentWarehouse]);
  
  const handleOpenScanner = useCallback(() => {
    if (!currentWarehouse) {
      Alert.alert('No Warehouse Selected', 'Please select a warehouse first.');
      return;
    }
    
    router.push('/scanner' as any);
  }, [currentWarehouse]);
  
  const handleItemPress = useCallback((item: Item) => {
    router.push(`/item/${item.internal}` as any);
  }, []);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, authLoading]);
  
  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a3a6a" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      {conflicts.length > 0 && <ConflictBanner testID="conflict-banner" />}
      
      <View style={styles.header}>
        <WarehouseSelector testID="warehouse-selector" />
      </View>
      
      <SearchBar
        value={filterOptions.search}
        onChangeText={handleSearchChange}
        onFilterPress={handleFilterPress}
        filterOptions={filterOptions}
        testID="search-bar"
      />
      
      <ItemList
        items={filteredItems}
        isLoading={isLoading}
        onItemPress={handleItemPress}
        testID="item-list"
      />
      
      <View style={styles.fabContainer}>
        <Pressable
          style={[styles.fab, styles.scannerFab]}
          onPress={handleOpenScanner}
          testID="scanner-fab"
          accessibilityLabel="Scan barcode"
        >
          <ScanLine size={24} color="#fff" />
        </Pressable>
        <Pressable
          style={styles.fab}
          onPress={handleAddItem}
          testID="add-item-fab"
          accessibilityLabel="Add new item"
        >
          <Plus size={24} color="#fff" />
        </Pressable>
      </View>
      
      <SyncStatus testID="sync-status" />
      
      <FilterModal
        isVisible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        filterOptions={filterOptions}
        onApplyFilters={handleApplyFilters}
        testID="filter-modal"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 16,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    flexDirection: 'column',
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a3a6a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 16,
  },
  scannerFab: {
    backgroundColor: '#4caf50',
  },
});