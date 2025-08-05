// src/services/ordersAPI.ts
import api from './api';
import { Order } from '@/types';

export const ordersAPI = {
  getOrders: (): Promise<Order[]> =>
    api.get('api/analytics/orders'),
};
