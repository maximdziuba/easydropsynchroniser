
export interface ProductConnection {
  id: number;
  source_id: number;
  target_id: number;
  product_name: string;
  created_at: string;
}

export type ViewType = 'mappings' | 'settings' | 'history';

export interface AppSettings {
  sync_interval: number; // in minutes
  last_sync_run?: string;
}

export interface SyncLog {
  id: number;
  started_at: string;
  completed_at: string | null;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  items_updated: number;
  details: string | null;
}
