
export interface ProductConnection {
  id: number;
  source_id: number;
  target_id: number;
  product_name: string;
  created_at: string;
}

export type ViewType = 'mappings' | 'settings';

export interface AppSettings {
  sync_interval: number; // in minutes
}
