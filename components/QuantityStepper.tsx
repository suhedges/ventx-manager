import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  testID?: string;
}

export default function QuantityStepper({
  value,
  onChange,
  min = 0,
  max,
  label,
  testID,
}: QuantityStepperProps) {
  const [localValue, setLocalValue] = useState(value.toString());
  const [isEditing, setIsEditing] = useState(false);
  const [longPressActive, setLongPressActive] = useState<'increment' | 'decrement' | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressIntervalRef = useRef<number | null>(null);
  const longPressCountRef = useRef(0);
  
  // Update local value when prop changes
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value.toString());
    }
  }, [value, isEditing]);
  
  // Handle long press for increment/decrement
  useEffect(() => {
    if (longPressActive) {
      // Clear any existing timers
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (longPressIntervalRef.current) {
        clearInterval(longPressIntervalRef.current);
      }
      
      // Set up initial delay
      longPressTimerRef.current = setTimeout(() => {
        // Start interval for repeated increments/decrements
        longPressIntervalRef.current = setInterval(() => {
          longPressCountRef.current += 1;
          
          // Accelerate based on how long the button has been held
          const delta = longPressActive === 'increment' ? 1 : -1;
          const acceleration = Math.min(10, Math.floor(longPressCountRef.current / 10) + 1);
          const newValue = Math.max(min, Math.min(max ?? Infinity, value + delta * acceleration));
          
          if (newValue !== value) {
            onChange(newValue);
          }
        }, 100); // Repeat every 100ms
      }, 500); // Initial delay of 500ms
    } else {
      // Clean up timers when long press ends
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (longPressIntervalRef.current) {
        clearInterval(longPressIntervalRef.current);
        longPressIntervalRef.current = null;
      }
      longPressCountRef.current = 0;
    }
    
    // Clean up on unmount
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (longPressIntervalRef.current) {
        clearInterval(longPressIntervalRef.current);
      }
    };
  }, [longPressActive, value, min, max, onChange]);
  
  const handleIncrement = () => {
    if (max !== undefined && value >= max) return;
    onChange(value + 1);
  };
  
  const handleDecrement = () => {
    if (value <= min) return;
    onChange(value - 1);
  };
  
  const handleInputChange = (text: string) => {
    setLocalValue(text);
  };
  
  const handleInputBlur = () => {
    let newValue = parseInt(localValue, 10);
    
    if (isNaN(newValue)) {
      newValue = value;
    } else {
      newValue = Math.max(min, Math.min(max ?? Infinity, newValue));
    }
    
    setLocalValue(newValue.toString());
    onChange(newValue);
    setIsEditing(false);
  };
  
  const handleInputFocus = () => {
    setIsEditing(true);
  };
  
  return (
    <View style={styles.container} testID={testID}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.stepperContainer}>
        <Pressable
          style={[
            styles.button,
            value <= min && styles.buttonDisabled,
          ]}
          onPress={handleDecrement}
          onPressIn={() => setLongPressActive('decrement')}
          onPressOut={() => setLongPressActive(null)}
          disabled={value <= min}
          testID={`${testID}-decrement`}
          accessibilityLabel="Decrease quantity"
        >
          <Minus size={20} color={value <= min ? '#ccc' : '#fff'} />
        </Pressable>
        
        <TextInput
          style={styles.input}
          value={localValue}
          onChangeText={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          keyboardType="numeric"
          selectTextOnFocus
          testID={`${testID}-input`}
          accessibilityLabel="Quantity value"
          accessibilityHint="Enter a number"
        />
        
        <Pressable
          style={[
            styles.button,
            max !== undefined && value >= max && styles.buttonDisabled,
          ]}
          onPress={handleIncrement}
          onPressIn={() => setLongPressActive('increment')}
          onPressOut={() => setLongPressActive(null)}
          disabled={max !== undefined && value >= max}
          testID={`${testID}-increment`}
          accessibilityLabel="Increase quantity"
        >
          <Plus size={20} color={max !== undefined && value >= max ? '#ccc' : '#fff'} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '500',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  button: {
    width: 44,
    height: 44,
    backgroundColor: '#1a3a6a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    minWidth: 80,
    height: 44,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#000',
  },
});