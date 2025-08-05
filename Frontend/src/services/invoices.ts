import api from './api';

export const invoiceAPI = {
  getInvoices: () => api.get('api/invoices'),
  getInvoice: (id: number) => api.get(`api/invoices/${id}`),
  createInvoice: (data: any) => api.post('api/invoices/', data),
  updateInvoice: (id: number, data: any) => api.put(`api/invoices/${id}`, data),
  deleteInvoice: (id: number) => api.delete(`api/invoices/${id}`),
  downloadInvoicesPDF: () => api.get('api/invoices/download/pdf', { responseType: 'blob' }),
};
