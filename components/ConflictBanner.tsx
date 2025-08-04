import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useSync } from '@/context/SyncContext';
import { router } from 'expo-router';

interface ConflictBannerProps {
  testID?: string;
}

export default function ConflictBanner({ testID }: ConflictBannerProps) {
  const { conflicts } = useSync();
  
  if (conflicts.length === 0) {
    return null;
  }
  
  const handlePress = () => {
    router.push('/conflicts' as any);
  };
  
  return (
    <Pressable
      style={styles.container}
      onPress={handlePress}
      testID={testID}
      accessibilityLabel={`${conflicts.length} conflicts need resolution`}
    >
      <AlertTriangle size={20} color="#fff" />
      <Text style={styles.text}>
        {conflicts.length} {conflicts.length === 1 ? 'conflict' : 'conflicts'} need resolution
      </Text>
      <Text style={styles.actionText}>Tap to resolve</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff9800',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});