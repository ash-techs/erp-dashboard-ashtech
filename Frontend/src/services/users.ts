import api from './api';


export const userApi = {
  getUsers: () => api.get('api/users'),
  getUser: (id) => api.get(`api/users/${id}`),
  createUser: (userData) => api.post('api/users/', userData),
  updateUser: (id, userData) => api.put(`api/users/${id}`, userData),
  deleteUser: (id) => api.delete(`api/users/${id}`),
  downloadUsersPDF: () => api.get('api/users/download/pdf', {
    responseType: 'blob',
  }),
};