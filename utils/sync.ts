import { v4 as uuidv4 } from 'uuid';
import { Op, Item, Conflict, FieldType } from '@/types';
import { getSiteId, getItems, saveItems, getOps, saveOps, getConflicts, saveConflicts } from './storage';

// Apply an operation to an item
export const applyOpToItem = (item: Item, op: Op): Item => {
  const updatedItem = { ...item };
  
  switch (op.type) {
    case 'createItem':
      // For createItem, we use the entire op as the base for the new item
      return {
        whId: op.whId,
        internal: op.internal,
        custom: '',
        qty: 0,
        lastTs: op.ts,
        lastSiteId: op.siteId,
      };
    
    case 'adjustQty':
      if (op.delta !== undefined) {
        updatedItem.qty = Math.max(0, (updatedItem.qty || 0) + op.delta);
      }
      break;
    
    case 'setField':
      if (op.field && op.value !== undefined) {
        // Type assertion to make TypeScript happy
        (updatedItem as any)[op.field] = op.value;
      }
      break;
    
    case 'deleteItem':
      updatedItem.deleted = true;
      break;
    
    case 'undeleteItem':
      updatedItem.deleted = false;
      break;
  }
  
  // Update metadata
  updatedItem.lastTs = op.ts;
  updatedItem.lastSiteId = op.siteId;
  
  return updatedItem;
};

// Create a new operation
export const createOp = async (
  whId: string,
  internal: string,
  type: Op['type'],
  field?: FieldType,
  value?: string | number,
  delta?: number,
  userId?: string
): Promise<Op> => {
  const siteId = await getSiteId();
  const timestamp = Date.now();
  
  return {
    opId: uuidv4(),
    siteId,
    whId,
    internal,
    type,
    field,
    value,
    delta,
    ts: timestamp,
    userId,
    synced: false,
  };
};

// Apply an operation to the local state
export const applyOpLocally = async (op: Op): Promise<void> => {
  // Get current items
  const items = await getItems(op.whId);
  
  // Find the item or create a new one if it doesn't exist
  let item = items.find(i => i.internal === op.internal);
  
  if (!item && op.type === 'createItem') {
    item = {
      whId: op.whId,
      internal: op.internal,
      qty: 0,
      lastTs: 0,
      lastSiteId: '',
    };
    items.push(item);
  } else if (!item) {
    console.warn(`Item ${op.internal} not found for operation ${op.type}`);
    return;
  }
  
  // Apply the operation
  const updatedItem = applyOpToItem(item, op);
  
  // Update the item in the array
  const itemIndex = items.findIndex(i => i.internal === op.internal);
  if (itemIndex >= 0) {
    items[itemIndex] = updatedItem;
  }
  
  // Save updated items
  await saveItems(op.whId, items);
  
  // Add operation to the log
  const ops = await getOps(op.whId);
  ops.push(op);
  await saveOps(op.whId, ops);
};

// Check if an operation conflicts with existing state
export const checkConflict = (item: Item, op: Op): Conflict | null => {
  // Only check conflicts for setField operations
  if (op.type !== 'setField' || !op.field) return null;
  
  // If the item was last modified by a different site and the timestamp is newer or equal
  if (item.lastSiteId !== op.siteId && item.lastTs >= op.ts) {
    const currentValue = (item as any)[op.field];
    
    // If the values are different, we have a conflict
    if (currentValue !== op.value) {
      return {
        id: uuidv4(),
        whId: op.whId,
        internal: op.internal,
        field: op.field,
        mine: currentValue,
        theirs: op.value as string | number,
        baseTs: item.lastTs,
      };
    }
  }
  
  return null;
};

// Resolve a conflict
export const resolveConflict = async (
  conflict: Conflict,
  keepMine: boolean,
  userId?: string
): Promise<void> => {
  // Mark conflict as resolved
  const resolvedConflict = {
    ...conflict,
    resolved: true,
    resolvedBy: userId,
    resolvedAt: Date.now(),
  };
  
  // Update conflicts list
  const conflicts = await getConflicts(conflict.whId);
  const conflictIndex = conflicts.findIndex(c => c.id === conflict.id);
  if (conflictIndex >= 0) {
    conflicts[conflictIndex] = resolvedConflict;
    await saveConflicts(conflict.whId, conflicts);
  }
  
  // If keeping theirs, create a new operation to set the field
  if (!keepMine) {
    const op = await createOp(
      conflict.whId,
      conflict.internal,
      'setField',
      conflict.field,
      conflict.theirs,
      undefined,
      userId
    );
    await applyOpLocally(op);
  }
};

// GitHub sync configuration
const GITHUB_CONFIG = {
  owner: 'suhedges',
  repo: 'ventx-manager',
  token: '', // Token will be set from storage or environment
  baseUrl: 'https://api.github.com',
};

// Initialize GitHub token from secure storage
const initializeGitHubToken = async (): Promise<string> => {
  try {
    const { getSecureToken } = await import('./secureToken');
    const secureToken = await getSecureToken();
    
    if (secureToken) {
      GITHUB_CONFIG.token = secureToken;
      return secureToken;
    }
    
    // Fallback to regular storage for backward compatibility
    const { getGitHubToken } = await import('./storage');
    const storedToken = await getGitHubToken();
    if (storedToken && storedToken !== 'ghp_YOUR_NEW_TOKEN_HERE') {
      GITHUB_CONFIG.token = storedToken;
      return storedToken;
    }
    
    // No valid token found - throw error with instructions
    throw new Error('GitHub token not configured. Please restart the app to initialize the secure token.');
  } catch (error) {
    console.error('Failed to initialize GitHub token:', error);
    throw new Error('GitHub token not configured. Please restart the app to initialize the secure token.');
  }
};

// Function to update GitHub token (for manual override if needed)
export const updateGitHubToken = async (newToken: string): Promise<void> => {
  GITHUB_CONFIG.token = newToken;
  
  // Save to regular storage (secure token is auto-managed)
  try {
    const { saveGitHubToken } = await import('./storage');
    await saveGitHubToken(newToken);
    console.log('GitHub token updated successfully');
  } catch (error) {
    console.error('Failed to save GitHub token:', error);
  }
};

// GitHub API helper functions
const githubRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  // Ensure token is initialized
  if (!GITHUB_CONFIG.token) {
    await initializeGitHubToken();
  }
  
  const url = `${GITHUB_CONFIG.baseUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'VentX-Manager/1.0',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorText = '';
    try {
      const errorData = await response.json();
      errorText = JSON.stringify(errorData);
    } catch {
      errorText = await response.text();
    }
    
    console.error(`GitHub API error: ${response.status}`, errorText);
    
    if (response.status === 401) {
      throw new Error(`GitHub authentication failed. Please check your token permissions and expiration. The token may need to be regenerated from https://github.com/settings/tokens with 'repo' scope.`);
    }
    
    if (response.status === 403) {
      throw new Error(`GitHub API rate limit exceeded or insufficient permissions. Please check your token scope includes 'repo' permissions.`);
    }
    
    throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

const getFileFromGitHub = async (path: string): Promise<{ content: string; sha: string } | null> => {
  try {
    const response = await githubRequest(`/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`);
    return {
      content: atob(response.content.replace(/\s/g, '')),
      sha: response.sha,
    };
  } catch (error) {
    // File doesn't exist
    return null;
  }
};

const saveFileToGitHub = async (path: string, content: string, sha?: string): Promise<void> => {
  const body: any = {
    message: `Update ${path} - ${new Date().toISOString()}`,
    content: btoa(content),
  };

  if (sha) {
    body.sha = sha;
  }

  await githubRequest(`/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

// Sync data structure for GitHub
type GitHubSyncData = {
  warehouses: any[];
  items: Record<string, any[]>;
  operations: Record<string, any[]>;
  conflicts: Record<string, any[]>;
  lastSync: number;
  siteId: string;
};

// Merge operations from multiple sites
const mergeOperations = (localOps: Op[], remoteOps: Op[]): { merged: Op[]; conflicts: Conflict[] } => {
  const allOps = [...localOps, ...remoteOps];
  const uniqueOps = new Map<string, Op>();
  const conflicts: Conflict[] = [];

  // Remove duplicates by opId
  allOps.forEach(op => {
    if (!uniqueOps.has(op.opId)) {
      uniqueOps.set(op.opId, op);
    }
  });

  // Sort by timestamp for deterministic ordering
  const sortedOps = Array.from(uniqueOps.values()).sort((a, b) => {
    if (a.ts !== b.ts) return a.ts - b.ts;
    return a.siteId.localeCompare(b.siteId);
  });

  // Detect conflicts for concurrent field updates
  const fieldUpdates = new Map<string, Op[]>();
  
  sortedOps.forEach(op => {
    if (op.type === 'setField' && op.field) {
      const key = `${op.whId}:${op.internal}:${op.field}`;
      if (!fieldUpdates.has(key)) {
        fieldUpdates.set(key, []);
      }
      fieldUpdates.get(key)!.push(op);
    }
  });

  // Check for conflicts in concurrent field updates
  fieldUpdates.forEach((ops, key) => {
    if (ops.length > 1) {
      // Group by timestamp to find concurrent updates
      const timeGroups = new Map<number, Op[]>();
      ops.forEach(op => {
        if (!timeGroups.has(op.ts)) {
          timeGroups.set(op.ts, []);
        }
        timeGroups.get(op.ts)!.push(op);
      });

      timeGroups.forEach(group => {
        if (group.length > 1) {
          // Multiple operations at the same timestamp - conflict!
          const [whId, internal, field] = key.split(':');
          const baseOp = group[0];
          
          for (let i = 1; i < group.length; i++) {
            const conflictOp = group[i];
            conflicts.push({
              id: uuidv4(),
              whId,
              internal,
              field: field as FieldType,
              mine: baseOp.value as string | number,
              theirs: conflictOp.value as string | number,
              baseTs: baseOp.ts,
            });
          }
        }
      });
    }
  });

  return { merged: sortedOps, conflicts };
};

// Apply operations to rebuild item state
const rebuildItemsFromOps = (ops: Op[]): Item[] => {
  const itemsMap = new Map<string, Item>();

  ops.forEach(op => {
    const key = `${op.whId}:${op.internal}`;
    let item = itemsMap.get(key);

    if (!item && op.type === 'createItem') {
      item = {
        whId: op.whId,
        internal: op.internal,
        qty: 0,
        lastTs: 0,
        lastSiteId: '',
      };
      itemsMap.set(key, item);
    }

    if (item) {
      const updatedItem = applyOpToItem(item, op);
      itemsMap.set(key, updatedItem);
    }
  });

  return Array.from(itemsMap.values()).filter(item => !item.deleted);
};

// Load warehouses from GitHub on startup
export const loadWarehousesFromGitHub = async (): Promise<{ success: boolean; warehouses: any[] }> => {
  try {
    const dataPath = 'data/sync-data.json';
    
    // Get remote data from GitHub
    const remoteFile = await getFileFromGitHub(dataPath);
    if (!remoteFile) {
      return { success: true, warehouses: [] };
    }

    try {
      const remoteData: GitHubSyncData = JSON.parse(remoteFile.content);
      
      // Merge with local warehouses
      const { getWarehouses, saveWarehouses } = await import('./storage');
      const localWarehouses = await getWarehouses();
      
      // Merge warehouses (prefer remote if newer)
      const mergedWarehouses = [...remoteData.warehouses];
      localWarehouses.forEach(localWh => {
        const existingIndex = mergedWarehouses.findIndex(w => w.id === localWh.id);
        if (existingIndex >= 0) {
          // Keep the newer version
          if (localWh.updatedAt > mergedWarehouses[existingIndex].updatedAt) {
            mergedWarehouses[existingIndex] = localWh;
          }
        } else {
          // Add local warehouse if not in remote
          mergedWarehouses.push(localWh);
        }
      });
      
      // Save merged warehouses locally
      await saveWarehouses(mergedWarehouses);
      
      console.log(`Loaded ${mergedWarehouses.length} warehouses from GitHub`);
      
      return {
        success: true,
        warehouses: mergedWarehouses,
      };
    } catch (error) {
      console.warn('Failed to parse remote warehouse data:', error);
      return { success: true, warehouses: [] };
    }
  } catch (error) {
    console.error('Failed to load warehouses from GitHub:', error);
    return { success: false, warehouses: [] };
  }
};

// Sync all warehouses to GitHub
export const syncAllWarehousesToGitHub = async (): Promise<{ success: boolean; conflicts: Conflict[] }> => {
  try {
    console.log('syncAllWarehousesToGitHub: Starting sync process');
    const siteId = await getSiteId();
    const dataPath = 'data/sync-data.json';
    console.log('syncAllWarehousesToGitHub: Site ID:', siteId);
    
    // Get all local warehouses
    const { getWarehouses } = await import('./storage');
    const localWarehouses = await getWarehouses();
    console.log('syncAllWarehousesToGitHub: Local warehouses count:', localWarehouses.length);
    
    // Get remote data from GitHub
    console.log('syncAllWarehousesToGitHub: Fetching remote data from GitHub');
    const remoteFile = await getFileFromGitHub(dataPath);
    let remoteData: GitHubSyncData = {
      warehouses: [],
      items: {},
      operations: {},
      conflicts: {},
      lastSync: 0,
      siteId: '',
    };

    if (remoteFile) {
      try {
        remoteData = JSON.parse(remoteFile.content);
        console.log('syncAllWarehousesToGitHub: Remote data loaded successfully');
      } catch (error) {
        console.warn('Failed to parse remote data, using empty state');
      }
    } else {
      console.log('syncAllWarehousesToGitHub: No remote file found, using empty state');
    }

    // Merge warehouses (simple last-writer-wins for now)
    const mergedWarehouses = [...remoteData.warehouses];
    localWarehouses.forEach(localWh => {
      const existingIndex = mergedWarehouses.findIndex(w => w.id === localWh.id);
      if (existingIndex >= 0) {
        // Update if local is newer
        if (localWh.updatedAt > mergedWarehouses[existingIndex].updatedAt) {
          mergedWarehouses[existingIndex] = localWh;
        }
      } else {
        // Add new warehouse
        mergedWarehouses.push(localWh);
      }
    });

    // Collect all conflicts from all warehouses
    const allConflicts: Conflict[] = [];
    const updatedItems: Record<string, any[]> = {};
    const updatedOperations: Record<string, any[]> = {};
    const updatedConflicts: Record<string, any[]> = {};

    // Sync each warehouse's data
    for (const warehouse of mergedWarehouses) {
      const whId = warehouse.id;
      
      // Get local data for this warehouse
      const localOps = await getOps(whId);
      const localItems = await getItems(whId);
      const localConflicts = await getConflicts(whId);
      
      // Get remote operations for this warehouse
      const remoteOps = remoteData.operations[whId] || [];
      
      // Merge operations and detect conflicts
      const { merged: mergedOps, conflicts: newConflicts } = mergeOperations(localOps, remoteOps);
      
      // Rebuild items from merged operations
      const rebuiltItems = rebuildItemsFromOps(mergedOps);
      
      // Mark all operations as synced
      const syncedOps = mergedOps.map(op => ({ ...op, synced: true }));
      
      // Store updated data
      updatedItems[whId] = rebuiltItems;
      updatedOperations[whId] = syncedOps;
      updatedConflicts[whId] = [...localConflicts, ...newConflicts];
      
      // Collect conflicts
      allConflicts.push(...newConflicts);
      
      // Update local storage for this warehouse
      await saveItems(whId, rebuiltItems);
      await saveOps(whId, syncedOps);
      await saveConflicts(whId, updatedConflicts[whId]);
    }
    
    // Prepare updated data for GitHub
    const updatedData: GitHubSyncData = {
      warehouses: mergedWarehouses,
      items: updatedItems,
      operations: updatedOperations,
      conflicts: updatedConflicts,
      lastSync: Date.now(),
      siteId,
    };
    
    // Save to GitHub
    console.log('syncAllWarehousesToGitHub: Saving data to GitHub...');
    await saveFileToGitHub(dataPath, JSON.stringify(updatedData, null, 2), remoteFile?.sha);
    console.log('syncAllWarehousesToGitHub: Data saved to GitHub successfully');
    
    // Update local warehouses
    const { saveWarehouses } = await import('./storage');
    await saveWarehouses(mergedWarehouses);
    console.log('syncAllWarehousesToGitHub: Local warehouses updated');
    
    console.log(`syncAllWarehousesToGitHub: Full sync completed successfully. Warehouses: ${mergedWarehouses.length}, Total conflicts: ${allConflicts.length}`);
    
    return {
      success: true,
      conflicts: allConflicts,
    };
  } catch (error) {
    console.error('Full sync failed:', error);
    return {
      success: false,
      conflicts: [],
    };
  }
};

// Main sync function with GitHub (for single warehouse)
export const syncWithServer = async (whId: string): Promise<{ success: boolean; conflicts: Conflict[] }> => {
  try {
    const siteId = await getSiteId();
    const dataPath = 'data/sync-data.json';
    
    // Get current local data
    const localOps = await getOps(whId);
    const localItems = await getItems(whId);
    const localConflicts = await getConflicts(whId);
    
    // Get remote data from GitHub
    const remoteFile = await getFileFromGitHub(dataPath);
    let remoteData: GitHubSyncData = {
      warehouses: [],
      items: {},
      operations: {},
      conflicts: {},
      lastSync: 0,
      siteId: '',
    };

    if (remoteFile) {
      try {
        remoteData = JSON.parse(remoteFile.content);
      } catch (error) {
        console.warn('Failed to parse remote data, using empty state');
      }
    }

    // Get remote operations for this warehouse
    const remoteOps = remoteData.operations[whId] || [];
    
    // Merge operations and detect conflicts
    const { merged: mergedOps, conflicts: newConflicts } = mergeOperations(localOps, remoteOps);
    
    // Rebuild items from merged operations
    const rebuiltItems = rebuildItemsFromOps(mergedOps);
    
    // Mark all operations as synced
    const syncedOps = mergedOps.map(op => ({ ...op, synced: true }));
    
    // Prepare updated data for GitHub
    const updatedData: GitHubSyncData = {
      ...remoteData,
      operations: {
        ...remoteData.operations,
        [whId]: syncedOps,
      },
      items: {
        ...remoteData.items,
        [whId]: rebuiltItems,
      },
      conflicts: {
        ...remoteData.conflicts,
        [whId]: [...localConflicts, ...newConflicts],
      },
      lastSync: Date.now(),
      siteId,
    };
    
    // Save to GitHub
    await saveFileToGitHub(dataPath, JSON.stringify(updatedData, null, 2), remoteFile?.sha);
    
    // Update local storage with merged data
    await saveItems(whId, rebuiltItems);
    await saveOps(whId, syncedOps);
    await saveConflicts(whId, updatedData.conflicts[whId]);
    
    console.log(`Sync completed for warehouse ${whId}. Operations: ${syncedOps.length}, Conflicts: ${newConflicts.length}`);
    
    return {
      success: true,
      conflicts: newConflicts,
    };
  } catch (error) {
    console.error('Sync failed:', error);
    return {
      success: false,
      conflicts: [],
    };
  }
};