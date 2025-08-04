import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Search, X, Filter } from 'lucide-react-native';
import { FilterOptions } from '@/types';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
  filterOptions: FilterOptions;
  placeholder?: string;
  testID?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  onFilterPress,
  filterOptions,
  placeholder = 'Search items...',
  testID,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleClear = () => {
    onChangeText('');
  };
  
  const hasActiveFilters = filterOptions.belowMin || filterOptions.sortBy !== 'internal';
  
  return (
    <View style={styles.container} testID={testID}>
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="search"
          clearButtonMode="while-editing"
          testID={`${testID}-input`}
          accessibilityLabel="Search items"
        />
        {value.length > 0 && (
          <Pressable
            onPress={handleClear}
            style={styles.clearButton}
            testID={`${testID}-clear`}
            accessibilityLabel="Clear search"
          >
            <X size={20} color="#666" />
          </Pressable>
        )}
      </View>
      <Pressable
        style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
        onPress={onFilterPress}
        testID={`${testID}-filter`}
        accessibilityLabel="Filter options"
      >
        <Filter size={20} color={hasActiveFilters ? '#fff' : '#1a3a6a'} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchContainerFocused: {
    borderColor: '#1a3a6a',
    backgroundColor: '#fff',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#1a3a6a',
    borderColor: '#1a3a6a',
  },
});