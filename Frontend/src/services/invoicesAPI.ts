// src/services/invoicesAPI.ts
import api from './api';
import { Invoice } from '@/types';

export const invoicesAPI = {
  getInvoices: (): Promise<Invoice[]> =>
    api.get('api/analytics/invoices'),
};
