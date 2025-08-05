import api from './api';

// Types
export interface Sale {
  saleId: number;
  item: string;
  quantity: number;
  unitPrice: number;
  status: string;
  date: string;
  customerName:string;
  productName;string;
  discount:string;
  amount:number;
  paymentMethod:string;
  notes: string;
  customerId: number;
  productId:number;
  createdBy: string;
  companyId:number;
  // Add any other fields your backend returns
}

export interface CreateSaleData {
  
  quantity: number;
  unitPrice: number;
  status: string;
  date: string;
  customerId: number;
  productId:number;
  discount:string;
  amount:number;
  paymentMethod:string;
  notes: string;
  createdBy:string;
  companyId:number;
  item:string;
}

// API functions
export const saleApi = {
  getSales: () => api.get<Sale[]>('api/sales'),
  getSale: (id: number) => api.get<Sale>(`api/sales/${id}`),
  createSale: (saleData: CreateSaleData) =>
    api.post<Sale>('api/sales/', saleData),
  updateSale: (id: number, saleData: Partial<CreateSaleData>) =>
    api.put<Sale>(`api/sales/${id}`, saleData),
  deleteSale: (id: number) => api.delete(`api/sales/${id}`),
  getRevenue: () => api.get<number>('api/sales/revenue'),
  getSalesByStatus: (status: string) =>
    api.get<Sale[]>(`api/sales/status/${status}`),
  downloadSalesPDF: () =>
    api.get('api/sales/download/pdf', { responseType: 'blob' }),
};
