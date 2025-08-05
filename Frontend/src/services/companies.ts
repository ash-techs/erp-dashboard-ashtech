import api from './api';


// Companies API functions
export const companiesAPI = {
  getCompanies: () => api.get(`api/companies`),
  getCompany: (id) => api.get(`api/companies/${id}`),
  createCompany: (companyData) => api.post(`api/companies/`, companyData),
  updateCompany: (id, companyData) => api.put(`api/companies/${id}`, companyData),
  deleteCompany: (id) => api.delete(`api/companies/${id}`),
  getCompaniesByStatus: (status) => api.get(`api/companies/${status}`), 
};