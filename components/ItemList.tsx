import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Item } from '@/types';
import ItemCard from './ItemCard';
import { useWarehouse } from '@/context/WarehouseContext';

interface ItemListProps {
  items: Item[];
  isLoading?: boolean;
  onItemPress?: (item: Item) => void;
  testID?: string;
}

export default function ItemList({
  items,
  isLoading = false,
  onItemPress,
  testID,
}: ItemListProps) {
  const { deleteItem, undeleteItem } = useWarehouse();
  const [, setDeletingItemId] = useState<string | null>(null);
  
  const handleDeleteItem = useCallback((item: Item) => {
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
              setDeletingItemId(item.internal);
              await deleteItem(item.internal);
            } catch (error) {
              console.error('Failed to delete item:', error);
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            } finally {
              setDeletingItemId(null);
            }
          },
        },
      ]
    );
  }, [deleteItem]);
  
  const handleUndeleteItem = useCallback(async (item: Item) => {
    try {
      setDeletingItemId(item.internal);
      await undeleteItem(item.internal);
    } catch (error) {
      console.error('Failed to undelete item:', error);
      Alert.alert('Error', 'Failed to undelete item. Please try again.');
    } finally {
      setDeletingItemId(null);
    }
  }, [undeleteItem]);
  
  const renderItem = useCallback(({ item }: { item: Item }) => (
    <ItemCard
      item={item}
      onEdit={() => onItemPress?.(item)}
      onDelete={() => handleDeleteItem(item)}
      onUndelete={() => handleUndeleteItem(item)}
      testID={`item-${item.internal}`}
    />
  ), [handleDeleteItem, handleUndeleteItem, onItemPress]);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a3a6a" />
        <Text style={styles.loadingText}>Loading items...</Text>
      </View>
    );
  }
  
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No items found</Text>
        <Text style={styles.emptySubtext}>
          Add new items or adjust your search filters
        </Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={item => item.internal}
      contentContainerStyle={styles.listContent}
      testID={testID}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});