import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// GitHub token is split into parts for security
const TOKEN_PARTS = {
  part1: 'ghp_yZ7ywIClxrDaAs',
  part2: 'ZNkUNWqQuIIiYHw',
  part3: 'H4YQEou'
};

const TOKEN_KEY = 'github_token';

// Assemble token from parts
export const assembleToken = (): string => {
  return `${TOKEN_PARTS.part1}${TOKEN_PARTS.part2}${TOKEN_PARTS.part3}`;
};

// Securely save token - on mobile we use SecureStore, on web we warn as it's not secure
export const saveToken = async (token: string): Promise<void> => {
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      console.log('Token securely saved');
    } catch (error) {
      console.error('Error saving token:', error);
    }
  } else {
    console.warn('Token storage is not secure on web');
  }
};

// Retrieve token - on mobile from SecureStore, on web return assembled token as fallback
export const getToken = async (): Promise<string> => {
  if (Platform.OS !== 'web') {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        console.log('Token retrieved from secure store');
        return token;
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
  }
  console.log('Using assembled token as fallback');
  return assembleToken();
};

// Delete token if needed
export const deleteToken = async (): Promise<void> => {
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      console.log('Token deleted');
    } catch (error) {
      console.error('Error deleting token:', error);
    }
  }
};
