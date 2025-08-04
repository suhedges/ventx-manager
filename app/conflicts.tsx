import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useSync } from '@/context/SyncContext';
import { Conflict } from '@/types';

export default function ConflictsScreen() {
  const { conflicts, resolveConflict } = useSync();
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  
  const handleResolveConflict = async (conflictId: string, keepMine: boolean) => {
    try {
      setResolvingId(conflictId);
      await resolveConflict(conflictId, keepMine);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      Alert.alert('Error', 'Failed to resolve conflict. Please try again.');
    } finally {
      setResolvingId(null);
    }
  };
  
  const renderConflictItem = ({ item }: { item: Conflict }) => (
    <View style={styles.conflictCard} testID={`conflict-${item.id}`}>
      <View style={styles.conflictHeader}>
        <Text style={styles.conflictTitle}>
          Conflict for Item: <Text style={styles.itemId}>{item.internal}</Text>
        </Text>
        <Text style={styles.conflictField}>
          Field: <Text style={styles.fieldName}>{item.field}</Text>
        </Text>
      </View>
      
      <View style={styles.valuesContainer}>
        <View style={styles.valueColumn}>
          <Text style={styles.valueLabel}>Your Value</Text>
          <View style={styles.valueBox}>
            <Text style={styles.valueText}>{item.mine}</Text>
          </View>
          <Pressable
            style={[styles.resolveButton, styles.keepMineButton]}
            onPress={() => handleResolveConflict(item.id, true)}
            disabled={resolvingId === item.id}
            testID={`keep-mine-${item.id}`}
            accessibilityLabel="Keep my value"
          >
            {resolvingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={16} color="#fff" />
                <Text style={styles.resolveButtonText}>Keep Mine</Text>
              </>
            )}
          </Pressable>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.valueColumn}>
          <Text style={styles.valueLabel}>Their Value</Text>
          <View style={styles.valueBox}>
            <Text style={styles.valueText}>{item.theirs}</Text>
          </View>
          <Pressable
            style={[styles.resolveButton, styles.keepTheirsButton]}
            onPress={() => handleResolveConflict(item.id, false)}
            disabled={resolvingId === item.id}
            testID={`keep-theirs-${item.id}`}
            accessibilityLabel="Keep their value"
          >
            {resolvingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={16} color="#fff" />
                <Text style={styles.resolveButtonText}>Keep Theirs</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Resolve Conflicts' }} />
      
      {conflicts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No conflicts to resolve</Text>
          <Text style={styles.emptySubtext}>
            All changes have been synchronized successfully
          </Text>
        </View>
      ) : (
        <FlatList
          data={conflicts}
          renderItem={renderConflictItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          testID="conflicts-list"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  conflictCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  conflictHeader: {
    marginBottom: 16,
  },
  conflictTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemId: {
    fontWeight: 'bold',
  },
  conflictField: {
    fontSize: 14,
    color: '#666',
  },
  fieldName: {
    fontWeight: '500',
    color: '#333',
  },
  valuesContainer: {
    flexDirection: 'row',
  },
  valueColumn: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  valueLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  valueBox: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  valueText: {
    fontSize: 16,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 4,
  },
  keepMineButton: {
    backgroundColor: '#1a3a6a',
  },
  keepTheirsButton: {
    backgroundColor: '#4caf50',
  },
  resolveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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