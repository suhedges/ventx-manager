import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Edit, Trash2, RefreshCw } from 'lucide-react-native';
import { Link } from 'expo-router';
import QuantityStepper from './QuantityStepper';
import { Item } from '@/types';
import { useWarehouse } from '@/context/WarehouseContext';

interface ItemCardProps {
  item: Item;
  onEdit: () => void;
  onDelete: () => void;
  onUndelete?: () => void;
  testID?: string;
}

export default function ItemCard({
  item,
  onEdit,
  onDelete,
  onUndelete,
  testID,
}: ItemCardProps) {

  
  const { adjustQuantity } = useWarehouse();
  
  const handleQtyChange = async (newValue: number) => {
    if (newValue !== item.qty) {
      const delta = newValue - item.qty;
      await adjustQuantity(item.internal, delta);
    }
  };
  
  const isBelowMin = item.min !== undefined && item.qty < item.min;
  const isAboveMax = item.max !== undefined && item.qty > item.max;
  
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.header}>
        <View style={styles.idContainer}>
          <Text style={styles.internalId} numberOfLines={1} ellipsizeMode="tail">
            {item.internal}
          </Text>
          {item.custom && (
            <Text style={styles.customId} numberOfLines={1} ellipsizeMode="tail">
              {item.custom}
            </Text>
          )}
        </View>
        
        <View style={styles.actions}>
          {item.deleted ? (
            onUndelete && (
              <Pressable
                onPress={onUndelete}
                style={styles.actionButton}
                testID={`${testID}-undelete`}
                accessibilityLabel="Undelete item"
              >
                <RefreshCw size={20} color="#1a3a6a" />
              </Pressable>
            )
          ) : (
            <>
              <Link href={`/item/${item.internal}` as any} asChild>
                <Pressable
                  style={styles.actionButton}
                  testID={`${testID}-edit`}
                  accessibilityLabel="Edit item"
                >
                  <Edit size={20} color="#1a3a6a" />
                </Pressable>
              </Link>
              <Pressable
                onPress={onDelete}
                style={styles.actionButton}
                testID={`${testID}-delete`}
                accessibilityLabel="Delete item"
              >
                <Trash2 size={20} color="#e53935" />
              </Pressable>
            </>
          )}
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>UPC:</Text>
          <Text style={styles.detailValue}>{item.upc || 'N/A'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Bin:</Text>
          <Text style={styles.detailValue}>{item.bin || 'N/A'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Min/Max:</Text>
          <Text style={styles.detailValue}>
            {item.min !== undefined ? item.min : 'N/A'} / {item.max !== undefined ? item.max : 'N/A'}
          </Text>
        </View>
      </View>
      
      <View style={styles.qtyContainer}>
        <Text style={[styles.qtyLabel, isBelowMin && styles.belowMin, isAboveMax && styles.aboveMax]}>
          Quantity:
        </Text>
        <QuantityStepper
          value={item.qty}
          onChange={handleQtyChange}
          min={0}
          max={item.max}
          testID={`${testID}-qty-stepper`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  idContainer: {
    flex: 1,
    marginRight: 8,
  },
  internalId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  customId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
  },
  qtyContainer: {
    marginTop: 8,
  },
  qtyLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  belowMin: {
    color: '#e53935',
  },
  aboveMax: {
    color: '#ff9800',
  },
});