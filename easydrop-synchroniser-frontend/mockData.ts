
import { ProductConnection } from './types';

export const mockConnections: ProductConnection[] = [
  {
    id: '1',
    sourceId: 'PROD-001',
    targetId: 'EXT-9982',
    productName: 'Nike Air Max 270',
    connectedAt: '2023-10-15'
  },
  {
    id: '2',
    sourceId: 'PROD-045',
    targetId: 'EXT-1122',
    productName: 'Adidas Ultraboost',
    connectedAt: '2023-11-02'
  },
  {
    id: '3',
    sourceId: 'PROD-088',
    targetId: 'EXT-5541',
    productName: 'Reebok Classic',
    connectedAt: '2024-01-12'
  }
];
