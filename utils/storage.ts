import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Item, Op, Warehouse, User, Conflict } from '@/types';

// Storage keys
const KEYS = {
  SITE_ID: 'ventx:siteId',
  CURRENT_USER: 'ventx:currentUser',
  USERS: 'ventx:users',
  WAREHOUSES: 'ventx:warehouses',
  ITEMS_PREFIX: 'ventx:items:',
  OPS_PREFIX: 'ventx:ops:',
  CONFLICTS_PREFIX: 'ventx:conflicts:',
  SYNC_CURSOR: 'ventx:syncCursor',
};

// Generate or retrieve site ID
export const getSiteId = async (): Promise<string> => {
  let siteId = await AsyncStorage.getItem(KEYS.SITE_ID);
  if (!siteId) {
    siteId = uuidv4();
    await AsyncStorage.setItem(KEYS.SITE_ID, siteId);
  }
  return siteId;
};

// User storage
export const saveCurrentUser = async (user: User | null): Promise<void> => {
  if (user) {
    await AsyncStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(KEYS.CURRENT_USER);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  const userJson = await AsyncStorage.getItem(KEYS.CURRENT_USER);
  return userJson ? JSON.parse(userJson) : null;
};

// Warehouse storage
export const saveWarehouses = async (warehouses: Warehouse[]): Promise<void> => {
  await AsyncStorage.setItem(KEYS.WAREHOUSES, JSON.stringify(warehouses));
};

export const getWarehouses = async (): Promise<Warehouse[]> => {
  const warehousesJson = await AsyncStorage.getItem(KEYS.WAREHOUSES);
  return warehousesJson ? JSON.parse(warehousesJson) : [];
};

// Item storage
export const getItemsKey = (whId: string): string => `${KEYS.ITEMS_PREFIX}${whId}`;

export const saveItems = async (whId: string, items: Item[]): Promise<void> => {
  await AsyncStorage.setItem(getItemsKey(whId), JSON.stringify(items));
};

export const getItems = async (whId: string): Promise<Item[]> => {
  const itemsJson = await AsyncStorage.getItem(getItemsKey(whId));
  return itemsJson ? JSON.parse(itemsJson) : [];
};

// Operations storage
export const getOpsKey = (whId: string): string => `${KEYS.OPS_PREFIX}${whId}`;

export const saveOps = async (whId: string, ops: Op[]): Promise<void> => {
  await AsyncStorage.setItem(getOpsKey(whId), JSON.stringify(ops));
};

export const getOps = async (whId: string): Promise<Op[]> => {
  const opsJson = await AsyncStorage.getItem(getOpsKey(whId));
  return opsJson ? JSON.parse(opsJson) : [];
};

export const addOp = async (op: Op): Promise<void> => {
  const ops = await getOps(op.whId);
  ops.push(op);
  await saveOps(op.whId, ops);
};

// Conflicts storage
export const getConflictsKey = (whId: string): string => `${KEYS.CONFLICTS_PREFIX}${whId}`;

export const saveConflicts = async (whId: string, conflicts: Conflict[]): Promise<void> => {
  await AsyncStorage.setItem(getConflictsKey(whId), JSON.stringify(conflicts));
};

export const getConflicts = async (whId: string): Promise<Conflict[]> => {
  const conflictsJson = await AsyncStorage.getItem(getConflictsKey(whId));
  return conflictsJson ? JSON.parse(conflictsJson) : [];
};

// Sync cursor
export const saveSyncCursor = async (cursor: string): Promise<void> => {
  await AsyncStorage.setItem(KEYS.SYNC_CURSOR, cursor);
};

export const getSyncCursor = async (): Promise<string | null> => {
  return AsyncStorage.getItem(KEYS.SYNC_CURSOR);
};

// Clear all data (for logout)
export const clearAllData = async (): Promise<void> => {
  const keys = await AsyncStorage.getAllKeys();
  const ventxKeys = keys.filter(key => key.startsWith('ventx:'));
  await AsyncStorage.multiRemove(ventxKeys);
};