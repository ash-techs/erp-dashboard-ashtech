// src/services/quotesAPI.ts
import api from './api';
import { Quote } from '@/types';

export const quotesAPI = {
  getQuotes: (): Promise<Quote[]> =>
    api.get('api/analytics/quotes'),
};
