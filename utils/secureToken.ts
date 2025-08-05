import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Split the token into parts for security
const TOKEN_PARTS = {
  PART_1: 'ventx:token:p1',
  PART_2: 'ventx:token:p2',
  PART_3: 'ventx:token:p3',
  PART_4: 'ventx:token:p4',
};

// Simple XOR encryption for obfuscation
const xorEncrypt = (text: string, key: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 encode
};

const xorDecrypt = (encrypted: string, key: string): string => {
  try {
    const decoded = atob(encrypted); // Base64 decode
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return '';
  }
};

// Generate encryption key based on device/platform info
const getEncryptionKey = (): string => {
  const baseKey = 'VentX2024';
  const platformKey = Platform.OS === 'web' ? 'WebApp' : 'MobileApp';
  return baseKey + platformKey;
};

// Store the GitHub token securely by splitting it into parts
export const storeSecureToken = async (): Promise<void> => {
  try {
    // The actual token split into parts
    const fullToken = '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';
    
    // Split token into 4 parts
    const partLength = Math.ceil(fullToken.length / 4);
    const part1 = fullToken.slice(0, partLength);
    const part2 = fullToken.slice(partLength, partLength * 2);
    const part3 = fullToken.slice(partLength * 2, partLength * 3);
    const part4 = fullToken.slice(partLength * 3);
    
    const encryptionKey = getEncryptionKey();
    
    // Encrypt and store each part
    await AsyncStorage.multiSet([
      [TOKEN_PARTS.PART_1, xorEncrypt(part1, encryptionKey + '1')],
      [TOKEN_PARTS.PART_2, xorEncrypt(part2, encryptionKey + '2')],
      [TOKEN_PARTS.PART_3, xorEncrypt(part3, encryptionKey + '3')],
      [TOKEN_PARTS.PART_4, xorEncrypt(part4, encryptionKey + '4')],
    ]);
    
    console.log('Secure token stored successfully');
  } catch (error) {
    console.error('Failed to store secure token:', error);
  }
};

// Retrieve and reconstruct the GitHub token
export const getSecureToken = async (): Promise<string | null> => {
  try {
    const encryptionKey = getEncryptionKey();
    
    // Retrieve all parts
    const parts = await AsyncStorage.multiGet([
      TOKEN_PARTS.PART_1,
      TOKEN_PARTS.PART_2,
      TOKEN_PARTS.PART_3,
      TOKEN_PARTS.PART_4,
    ]);
    
    // Decrypt each part
    const decryptedParts = parts.map(([key, value], index) => {
      if (!value) return '';
      const partKey = encryptionKey + (index + 1);
      return xorDecrypt(value, partKey);
    });
    
    // Check if all parts are present
    if (decryptedParts.some(part => part === '')) {
      return null;
    }
    
    // Reconstruct the token
    const reconstructedToken = decryptedParts.join('');
    
    // Validate token format
    if (reconstructedToken.startsWith('ghp_') && reconstructedToken.length === 40) {
      return reconstructedToken;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to retrieve secure token:', error);
    return null;
  }
};

// Initialize token on app startup
export const initializeSecureToken = async (): Promise<void> => {
  try {
    const existingToken = await getSecureToken();
    if (!existingToken) {
      await storeSecureToken();
      console.log('GitHub token initialized securely');
    } else {
      console.log('GitHub token already exists');
    }
  } catch (error) {
    console.error('Failed to initialize secure token:', error);
  }
};

// Clear stored token parts
export const clearSecureToken = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      TOKEN_PARTS.PART_1,
      TOKEN_PARTS.PART_2,
      TOKEN_PARTS.PART_3,
      TOKEN_PARTS.PART_4,
    ]);
    console.log('Secure token cleared');
  } catch (error) {
    console.error('Failed to clear secure token:', error);
  }
};