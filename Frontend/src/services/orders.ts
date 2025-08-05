import api from './api';


export const orderAPI = {
  getOrders: () => api.get('api/orders'),
  getOrder: (id) => api.get(`api/orders/${id}`),
  createOrder: (orderData) => api.post('api/orders/', orderData),
  updateOrder: (id, orderData) => api.put(`api/orders/${id}`, orderData),
  deleteOrder: (id) => api.delete(`api/orders/${id}`),
  getOrdersByStatus: (status) => api.get(`api/orders/status/${status}`),
  updateOrderStatus: (id, status) => api.put(`api/orders/${id}/status`, { status }),
  downloadOrdersPDF: () => api.get('api/orders/download/pdf', {
    responseType: 'blob',
  }),
};