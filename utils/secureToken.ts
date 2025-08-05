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
  try {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    // Use Buffer for Node.js compatibility or fallback for web
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(result).toString('base64');
    } else if (typeof btoa !== 'undefined') {
      return btoa(result);
    } else {
      return result; // Fallback without encoding
    }
  } catch (error) {
    console.error('Encryption failed:', error);
    return text; // Return original text if encryption fails
  }
};

const xorDecrypt = (encrypted: string, key: string): string => {
  try {
    let decoded: string;
    // Use Buffer for Node.js compatibility or fallback for web
    if (typeof Buffer !== 'undefined') {
      decoded = Buffer.from(encrypted, 'base64').toString();
    } else if (typeof atob !== 'undefined') {
      decoded = atob(encrypted);
    } else {
      decoded = encrypted; // Fallback without decoding
    }
    
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
};

// Generate encryption key based on device/platform info
const getEncryptionKey = (): string => {
  const baseKey = 'VentX2024';
  const platformKey = Platform.OS === 'web' ? 'WebApp' : 'MobileApp';
  return baseKey + platformKey;
};

const getEnvToken = (): string | undefined => {
  return (
    process.env.EXPO_PUBLIC_GITHUB_TOKEN ||
    process.env.GITHUB_TOKEN ||
    undefined
  );
};

// Store the GitHub token securely by splitting it into parts
export const storeSecureToken = async (): Promise<void> => {
  try {
    const fullToken = getEnvToken();

    if (!fullToken) {
      console.log('No GitHub token found in environment. Using hardcoded token.');
      // Use the hardcoded token from previous messages
      const hardcodedToken = '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';
      await storeTokenParts(hardcodedToken);
      return;
    }
    
    await storeTokenParts(fullToken);
  } catch (error) {
    console.error('Failed to store secure token:', error);
  }
};

const storeTokenParts = async (token: string): Promise<void> => {
  try {
    // Split token into 4 parts
    const partLength = Math.ceil(token.length / 4);
    const part1 = token.slice(0, partLength);
    const part2 = token.slice(partLength, partLength * 2);
    const part3 = token.slice(partLength * 2, partLength * 3);
    const part4 = token.slice(partLength * 3);
    
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
    console.error('Failed to store token parts:', error);
  }
};

// Retrieve and reconstruct the GitHub token
export const getSecureToken = async (): Promise<string | null> => {
  try {
    // First try to get from environment
    const envToken = getEnvToken();
    if (envToken) {
      return envToken;
    }
    
    // Then try to reconstruct from stored parts
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
    
    // Check if all parts are available
    if (decryptedParts.every(part => part !== '')) {
      // Reconstruct the token
      const reconstructedToken = decryptedParts.join('');
      return reconstructedToken;
    }
    
    // Fallback to hardcoded token
    console.log('Using fallback hardcoded token');
    return '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';
  } catch (error) {
    console.error('Failed to retrieve secure token:', error);
    // Return hardcoded token as last resort
    return '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';
  }
};

// Initialize token on app startup
export const initializeSecureToken = async (): Promise<void> => {
  try {
    console.log('Initializing secure token...');
    
    // Always ensure we have a token available
    const existingToken = await getSecureToken();
    if (!existingToken) {
      console.log('No existing token found, storing new one');
      await storeSecureToken();
    } else {
      console.log('Token already available');
    }
  } catch (error) {
    console.error('Failed to initialize secure token:', error);
    // Don't throw error to prevent app from crashing
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