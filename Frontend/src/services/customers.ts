import api from './api';


export const customerAPI = {
  getCustomers: (params = {}) => api.get('api/customers', { params }),
  getCustomer: (id) => api.get(`api/customers/${id}`),
  createCustomer: (data) => api.post('api/customers/', data),
  updateCustomer: (id, data) => api.put(`api/customers/${id}`, data),
  toggleCustomerStatus: (id) => api.patch(`api/customers/${id}/status`),
  deleteCustomer: (id) => api.delete(`api/customers/${id}`),
  getCustomerStats: () => api.get('api/customers/stats'),

bulkUpdateStatus: (customerIds, status) => api.post('api/customers/bulk-update', {
    customerIds,
    status,
  }),
};
