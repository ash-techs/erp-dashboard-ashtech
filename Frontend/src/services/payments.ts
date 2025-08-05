import api from './api';


// Payments API functions
export const paymentsAPI = {
  getPayments: () => api.get(`api/payments`),
  getPayment: (id) => api.get(`api/payments/${id}`),
  createPayment: (paymentData) => api.post(`api/payments/`, paymentData),
  updatePayment: (id, paymentData) => api.put(`api/payments/${id}`, paymentData),
  deletePayment: (id) => api.delete(`api/payments/${id}`),
  getPaymentsByClient: (client) => api.get(`api/payments/client/${client}`),
  downloadPaymentsPDF: () => api.get(`api/payments/download/pdf`, {
    responseType: 'blob',
  }),
};
