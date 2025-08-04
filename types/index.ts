export type User = {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'worker';
  createdAt: number;
  disabled?: boolean;
};

export type Warehouse = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  softDeleted?: boolean;
};

export type Item = {
  whId: string;
  internal: string;
  custom?: string;
  upc?: string;
  qty: number;
  min?: number;
  max?: number;
  bin?: string;
  deleted?: boolean;
  lastTs: number;
  lastSiteId: string;
};

export type OpType = 'createItem' | 'adjustQty' | 'setField' | 'deleteItem' | 'undeleteItem';
export type FieldType = 'custom' | 'upc' | 'min' | 'max' | 'bin' | 'qty';

export type Op = {
  opId: string;
  siteId: string;
  whId: string;
  internal: string;
  type: OpType;
  field?: FieldType;
  value?: string | number;
  delta?: number;
  ts: number;
  userId?: string;
  synced?: boolean;
};

export type Conflict = {
  id: string;
  whId: string;
  internal: string;
  field: FieldType;
  mine: string | number;
  theirs: string | number;
  baseTs: number;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
};

export type SyncStatus = {
  lastSyncTime: number | null;
  pendingOps: number;
  isOnline: boolean;
  isSyncing: boolean;
};

export type FilterOptions = {
  search: string;
  belowMin: boolean;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
};