import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { FlashlightOff, Flashlight, RotateCcw } from 'lucide-react-native';
import { useWarehouse } from '@/context/WarehouseContext';
import { validateUPC } from '@/utils/validators';

export default function ScannerScreen() {
  const { returnToItem } = useLocalSearchParams<{ returnToItem?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  
  const { updateItem } = useWarehouse();
  
  // Debounce scanning to prevent multiple rapid scans
  const lastScanTimeRef = useRef(0);
  const scannedCodesRef = useRef<string[]>([]);
  
  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    const now = Date.now();
    
    // Debounce scans (minimum 1 second between scans)
    if (now - lastScanTimeRef.current < 1000) {
      return;
    }
    
    // Validate UPC format
    if (!validateUPC(data)) {
      Alert.alert('Invalid Barcode', 'The scanned barcode is not a valid UPC/EAN format.');
      return;
    }
    
    // Add to recent scans for stability check
    scannedCodesRef.current.push(data);
    if (scannedCodesRef.current.length > 2) {
      scannedCodesRef.current.shift();
    }
    
    // Only accept code if we've seen it twice in a row (stability check)
    if (scannedCodesRef.current.length >= 2 && 
        scannedCodesRef.current[0] === scannedCodesRef.current[1]) {
      
      setScannedCode(data);
      lastScanTimeRef.current = now;
      
      // If we're returning to an item edit screen, update that item's UPC
      if (returnToItem) {
        handleReturnWithUPC(data);
      }
    }
  };
  
  const handleReturnWithUPC = async (upc: string) => {
    try {
      if (returnToItem === 'new') {
        // Return to new item form with UPC
        router.back();
        // In a real app, we would pass the UPC back to the form
      } else {
        // Update existing item's UPC
        await updateItem(returnToItem!, { upc });
        Alert.alert('Success', 'UPC updated successfully');
        router.back();
      }
    } catch (error) {
      console.error('Failed to update UPC:', error);
      Alert.alert('Error', 'Failed to update UPC. Please try again.');
    }
  };
  
  const toggleFlashlight = () => {
    setIsFlashlightOn(prev => !prev);
  };
  
  const toggleCamera = () => {
    setFacing((current: CameraType) => (current === 'back' ? 'front' : 'back'));
  };
  
  const resetScan = () => {
    setScannedCode(null);
    scannedCodesRef.current = [];
  };
  
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          We need camera permission to scan barcodes
        </Text>
        <Pressable
          style={styles.permissionButton}
          onPress={requestPermission}
          testID="request-permission-button"
          accessibilityLabel="Grant camera permission"
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Barcode Scanner',
          headerRight: () => (
            <Pressable
              onPress={toggleCamera}
              style={styles.headerButton}
              testID="toggle-camera-button"
              accessibilityLabel="Toggle camera"
            >
              <RotateCcw size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />
      
      <CameraView
        style={styles.camera}
        facing={facing}
        onBarcodeScanned={scannedCode ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['upc_a', 'upc_e', 'ean8', 'ean13'],
        }}
        enableTorch={isFlashlightOn}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
        </View>
        
        {scannedCode && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Barcode Detected</Text>
            <Text style={styles.resultCode}>{scannedCode}</Text>
            <Pressable
              style={styles.resetButton}
              onPress={resetScan}
              testID="reset-scan-button"
              accessibilityLabel="Scan again"
            >
              <Text style={styles.resetButtonText}>Scan Again</Text>
            </Pressable>
          </View>
        )}
        
        <View style={styles.controls}>
          <Pressable
            style={styles.controlButton}
            onPress={toggleFlashlight}
            testID="flashlight-button"
            accessibilityLabel="Toggle flashlight"
          >
            {isFlashlightOn ? (
              <Flashlight size={24} color="#fff" />
            ) : (
              <FlashlightOff size={24} color="#fff" />
            )}
          </Pressable>
        </View>
      </CameraView>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Position the barcode within the frame to scan
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerButton: {
    padding: 8,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  resultContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resultTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultCode: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#1a3a6a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  instructions: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  permissionButton: {
    backgroundColor: '#1a3a6a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});