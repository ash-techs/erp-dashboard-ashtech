// src/services/productsAPI.ts
import api from './api';
import { Product } from '@/types';

export const productsAPI = {
  getProducts: (): Promise<Product[]> =>
    api.get('api/analytics/products'),
};
