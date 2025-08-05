// src/services/customersAPI.ts
import api from './api';
import { Customer } from '@/types';

export const customersAPI = {
  getCustomers: (): Promise<Customer[]> =>
    api.get('api/analytics/customers'),
};
