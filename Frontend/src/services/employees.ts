import api from './api';


// Employees API functions
export const employeesAPI = {
  getEmployees: () => api.get('api/employees'),
  getEmployee: (id) => api.get(`api/employees/${id}`),
  createEmployee: (employeeData) => api.post('api/employees/', employeeData),
  updateEmployee: (id, employeeData) => api.put(`api/employees/${id}`, employeeData),
  deleteEmployee: (id) => api.delete(`api/employees/${id}`),
  getEmployeesByStatus: (status) => api.get(`api/employees/status/${status}`),
  updateEmployeeStatus: (id, status) => api.put(`api/employees/${id}/status`, { status }),
};
