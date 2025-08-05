// src/services/salesAPI.ts
import api from './api';
import { Sale } from '@/types';

export const salesAPI = {
  getSales: (): Promise<Sale[]> =>
    api.get('analytics/sales'),
};
