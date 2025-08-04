import React, { createContext, useContext, useState, useEffect } from 'react';
import { Warehouse, Item, FilterOptions, Op } from '@/types';
import { getWarehouses, saveWarehouses, getItems, saveItems } from '@/utils/storage';
import { createOp, applyOpLocally, loadWarehousesFromGitHub } from '@/utils/sync';
import { useAuth } from './AuthContext';
import { useSyncHook } from './SyncHook';
import { v4 as uuidv4 } from 'uuid';

interface WarehouseContextType {
  warehouses: Warehouse[];
  currentWarehouse: Warehouse | null;
  items: Item[];
  filteredItems: Item[];
  filterOptions: FilterOptions;
  isLoading: boolean;
  createWarehouse: (name: string) => Promise<Warehouse>;
  deleteWarehouse: (id: string) => Promise<void>;
  selectWarehouse: (id: string) => Promise<void>;
  createItem: (item: Partial<Item>) => Promise<Item>;
  updateItem: (internal: string, updates: Partial<Item>) => Promise<Item>;
  deleteItem: (internal: string) => Promise<void>;
  undeleteItem: (internal: string) => Promise<void>;
  adjustQuantity: (internal: string, delta: number) => Promise<void>;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    search: '',
    belowMin: false,
    sortBy: 'internal',
    sortDirection: 'asc',
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useAuth();
  const { addPendingOp } = useSyncHook();
  
  // Load warehouses on startup
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        // First load local warehouses
        let storedWarehouses = await getWarehouses();
        setWarehouses(storedWarehouses);
        
        // Try to load and merge warehouses from GitHub
        try {
          const githubResult = await loadWarehousesFromGitHub();
          if (githubResult.success && githubResult.warehouses.length > 0) {
            // Use the merged warehouses from GitHub
            setWarehouses(githubResult.warehouses);
            storedWarehouses = githubResult.warehouses;
            console.log('Successfully loaded warehouses from GitHub');
          }
        } catch (error) {
          console.warn('Failed to load warehouses from GitHub, using local only:', error);
        }
        
        // If there's at least one warehouse, select the first one
        if (storedWarehouses.length > 0) {
          await selectWarehouse(storedWarehouses[0].id);
        }
      } catch (error) {
        console.error('Failed to load warehouses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadWarehouses();
    }
  }, [user]);
  
  // Apply filters when items or filter options change
  useEffect(() => {
    if (!items.length) {
      setFilteredItems([]);
      return;
    }
    
    let filtered = [...items];
    
    // Filter out deleted items
    filtered = filtered.filter(item => !item.deleted);
    
    // Apply search filter
    if (filterOptions.search) {
      const searchLower = filterOptions.search.toLowerCase();
      filtered = filtered.filter(
        item =>
          (item.internal && item.internal.toLowerCase().includes(searchLower)) ||
          (item.custom && item.custom.toLowerCase().includes(searchLower)) ||
          (item.bin && item.bin.toLowerCase().includes(searchLower)) ||
          (item.upc && item.upc.includes(searchLower))
      );
    }
    
    // Apply below min filter
    if (filterOptions.belowMin) {
      filtered = filtered.filter(
        item => item.min !== undefined && item.qty < item.min
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = (a as any)[filterOptions.sortBy];
      const bValue = (b as any)[filterOptions.sortBy];
      
      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filterOptions.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return filterOptions.sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }
    });
    
    setFilteredItems(filtered);
  }, [items, filterOptions]);
  
  const createWarehouse = async (name: string): Promise<Warehouse> => {
    if (!user) throw new Error('User not authenticated');
    
    const newWarehouse: Warehouse = {
      id: uuidv4(),
      name,
      ownerId: user.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const updatedWarehouses = [...warehouses, newWarehouse];
    await saveWarehouses(updatedWarehouses);
    setWarehouses(updatedWarehouses);
    
    return newWarehouse;
  };
  
  const deleteWarehouse = async (id: string): Promise<void> => {
    const updatedWarehouses = warehouses.map(wh =>
      wh.id === id ? { ...wh, softDeleted: true, updatedAt: Date.now() } : wh
    );
    
    await saveWarehouses(updatedWarehouses);
    setWarehouses(updatedWarehouses);
    
    // If the deleted warehouse was the current one, select another one
    if (currentWarehouse?.id === id) {
      const activeWarehouses = updatedWarehouses.filter(wh => !wh.softDeleted);
      if (activeWarehouses.length > 0) {
        await selectWarehouse(activeWarehouses[0].id);
      } else {
        setCurrentWarehouse(null);
        setItems([]);
        setFilteredItems([]);
      }
    }
  };
  
  const selectWarehouse = async (id: string): Promise<void> => {
    const warehouse = warehouses.find(wh => wh.id === id);
    if (!warehouse) throw new Error('Warehouse not found');
    
    setCurrentWarehouse(warehouse);
    
    // Load items for the selected warehouse
    try {
      const warehouseItems = await getItems(id);
      setItems(warehouseItems);
    } catch (error) {
      console.error('Failed to load items:', error);
      setItems([]);
    }
  };
  
  const createItem = async (itemData: Partial<Item>): Promise<Item> => {
    if (!currentWarehouse) throw new Error('No warehouse selected');
    if (!itemData.internal) throw new Error('Internal ID is required');
    
    // Check if item already exists
    const existingItem = items.find(item => item.internal === itemData.internal);
    if (existingItem && !existingItem.deleted) {
      throw new Error('Item with this Internal ID already exists');
    }
    
    // Create operation
    const op = await createOp(
      currentWarehouse.id,
      itemData.internal,
      'createItem',
      undefined,
      undefined,
      undefined,
      user?.id
    );
    
    // Apply operation locally
    await applyOpLocally(op);
    
    // If the item has additional fields, create operations for each field
    const fieldsToSet: Array<{ field: keyof Item; value: any }> = [];
    
    if (itemData.custom) fieldsToSet.push({ field: 'custom', value: itemData.custom });
    if (itemData.upc) fieldsToSet.push({ field: 'upc', value: itemData.upc });
    if (itemData.min !== undefined) fieldsToSet.push({ field: 'min', value: itemData.min });
    if (itemData.max !== undefined) fieldsToSet.push({ field: 'max', value: itemData.max });
    if (itemData.bin) fieldsToSet.push({ field: 'bin', value: itemData.bin });
    if (itemData.qty !== undefined) fieldsToSet.push({ field: 'qty', value: itemData.qty });
    
    for (const { field, value } of fieldsToSet) {
      const fieldOp = await createOp(
        currentWarehouse.id,
        itemData.internal,
        'setField',
        field as any,
        value,
        undefined,
        user?.id
      );
      
      await applyOpLocally(fieldOp);
      addPendingOp(fieldOp);
    }
    
    // Add the create operation to pending ops
    addPendingOp(op);
    
    // Reload items
    const updatedItems = await getItems(currentWarehouse.id);
    setItems(updatedItems);
    
    // Return the created item
    const createdItem = updatedItems.find(item => item.internal === itemData.internal);
    if (!createdItem) throw new Error('Failed to create item');
    
    return createdItem;
  };
  
  const updateItem = async (internal: string, updates: Partial<Item>): Promise<Item> => {
    if (!currentWarehouse) throw new Error('No warehouse selected');
    
    // Find the item
    const item = items.find(item => item.internal === internal);
    if (!item) throw new Error('Item not found');
    
    // Create operations for each field update
    const fieldsToUpdate: Array<{ field: keyof Item; value: any }> = [];
    
    if (updates.custom !== undefined) fieldsToUpdate.push({ field: 'custom', value: updates.custom });
    if (updates.upc !== undefined) fieldsToUpdate.push({ field: 'upc', value: updates.upc });
    if (updates.min !== undefined) fieldsToUpdate.push({ field: 'min', value: updates.min });
    if (updates.max !== undefined) fieldsToUpdate.push({ field: 'max', value: updates.max });
    if (updates.bin !== undefined) fieldsToUpdate.push({ field: 'bin', value: updates.bin });
    if (updates.qty !== undefined) fieldsToUpdate.push({ field: 'qty', value: updates.qty });
    
    for (const { field, value } of fieldsToUpdate) {
      const op = await createOp(
        currentWarehouse.id,
        internal,
        'setField',
        field as any,
        value,
        undefined,
        user?.id
      );
      
      await applyOpLocally(op);
      addPendingOp(op);
    }
    
    // Reload items
    const updatedItems = await getItems(currentWarehouse.id);
    setItems(updatedItems);
    
    // Return the updated item
    const updatedItem = updatedItems.find(item => item.internal === internal);
    if (!updatedItem) throw new Error('Failed to update item');
    
    return updatedItem;
  };
  
  const deleteItem = async (internal: string): Promise<void> => {
    if (!currentWarehouse) throw new Error('No warehouse selected');
    
    // Create delete operation
    const op = await createOp(
      currentWarehouse.id,
      internal,
      'deleteItem',
      undefined,
      undefined,
      undefined,
      user?.id
    );
    
    // Apply operation locally
    await applyOpLocally(op);
    addPendingOp(op);
    
    // Reload items
    const updatedItems = await getItems(currentWarehouse.id);
    setItems(updatedItems);
  };
  
  const undeleteItem = async (internal: string): Promise<void> => {
    if (!currentWarehouse) throw new Error('No warehouse selected');
    
    // Create undelete operation
    const op = await createOp(
      currentWarehouse.id,
      internal,
      'undeleteItem',
      undefined,
      undefined,
      undefined,
      user?.id
    );
    
    // Apply operation locally
    await applyOpLocally(op);
    addPendingOp(op);
    
    // Reload items
    const updatedItems = await getItems(currentWarehouse.id);
    setItems(updatedItems);
  };
  
  const adjustQuantity = async (internal: string, delta: number): Promise<void> => {
    if (!currentWarehouse) throw new Error('No warehouse selected');
    
    // Create adjust quantity operation
    const op = await createOp(
      currentWarehouse.id,
      internal,
      'adjustQty',
      'qty',
      undefined,
      delta,
      user?.id
    );
    
    // Apply operation locally
    await applyOpLocally(op);
    addPendingOp(op);
    
    // Reload items
    const updatedItems = await getItems(currentWarehouse.id);
    setItems(updatedItems);
  };
  
  const updateFilterOptions = (options: Partial<FilterOptions>) => {
    setFilterOptions(prev => ({ ...prev, ...options }));
  };
  
  return (
    <WarehouseContext.Provider
      value={{
        warehouses,
        currentWarehouse,
        items,
        filteredItems,
        filterOptions,
        isLoading,
        createWarehouse,
        deleteWarehouse,
        selectWarehouse,
        createItem,
        updateItem,
        deleteItem,
        undeleteItem,
        adjustQuantity,
        setFilterOptions: updateFilterOptions,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
}