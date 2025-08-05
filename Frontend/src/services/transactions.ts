import api from './api';


// Transactions API functions
export const transactionsAPI = {
  getTransactions: () => api.get('api/transactions'),
  getTransaction: (id) => api.get(`api/transactions${id}`),
  createTransaction: (transactionData) => api.post('api/transactions', transactionData),
  updateTransaction: (id, transactionData) => api.put(`api/transactions/${id}`, transactionData),
  deleteTransaction: (id) => api.delete(`api/transactions/${id}`),
  getTransactionsByStatus: (status) => api.get(`api/transactions/status${status}`),
  getBalance: () => api.get('api/transactions/balance'),
  downloadTransactionssPDF: () => api.get('api/transactions/download/pdf', {
    responseType: 'blob',
  }),
};

