import api from './api';


// Quotes API functions
export const quoteAPI = {
  getQuotes: () => api.get('api/quotes'),
  getQuote: (id) => api.get(`api/quotes/${id}`),
  createQuote: (quoteData) => api.post('api/quotes/', quoteData),
  updateQuote: (id, quoteData) => api.put(`api/quotes/${id}`, quoteData),
  deleteQuote: (id) => api.delete(`api/quotes/${id}`),
  getQuotesByStatus: (status) => api.get(`api/quotes/status/${status}`),
  updateQuoteStatus: (id, status) => api.put(`api/quotes/${id}/status`, { status }),
  downloadQuotesPDF: () => api.get('api/quotes/download/pdf', {
    responseType: 'blob',
  }),
};
