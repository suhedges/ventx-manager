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

// Mock sync function (in a real app, this would communicate with a server)
export const syncWithServer = async (whId: string): Promise<{ success: boolean; conflicts: Conflict[] }> => {
  // In a real implementation, this would send pending ops to the server
  // and receive new ops from other clients
  
  // For now, just mark all ops as synced
  const ops = await getOps(whId);
  const unsyncedOps = ops.filter(op => !op.synced);
  
  for (const op of unsyncedOps) {
    op.synced = true;
  }
  
  await saveOps(whId, ops);
  
  // Return mock response
  return {
    success: true,
    conflicts: [], // In a real app, the server would return conflicts
  };
};