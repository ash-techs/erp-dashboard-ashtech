export interface Order {
  id: string;
  number: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  status: string;
  phone: string;
  state: string;
  city: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  productId: string;
  companyId: string;
  company_name: string;
  customer_name: string;
  product_name: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  companyId: string;
  company_name: string;
  order_count: number;
  invoice_count: number;
  payment_count: number;
  quote_count: number;
  sale_count: number;
  total_order_value: number;
  avg_order_value: number;
}

export interface Sale {
  id: string;
  saleId: string;
  customerId: string;
  date: string;
  companyId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  amount: number;
  paymentMethod: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  company_name: string;
  customer_name: string;
  product_name: string;
  total_sale_amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  date: string;
  expireDate: string;
  year: number;
  currency: string;
  status: string;
  paid: boolean;
  note: string;
  tax: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  company_name: string;
  customer_name: string;
  item_count: number;
  total_item_value: number;
}

export interface Quote {
  id: string;
  number: string;
  customerId: string;
  companyId: string;
  date: string;
  expireDate: string;
  year: number;
  currency: string;
  status: string;
  paid: boolean;
  note: string;
  tax: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  company_name: string;
  customer_name: string;
  item_count: number;
  total_quote_value: number;
}

export interface Product {
  id: string;
  sku: string;
  image: string;
  name: string;
  price: number;
  quantity: number;
  description: string;
  order_count: number;
  sale_count: number;
  total_sale_value: number;
  total_discount: number;
}

export interface ReportsAnalyticsResponse {
  orders: Order[];
  customers: Customer[];
  sales: Sale[];
  invoices: Invoice[];
  quotes: Quote[];
  products: Product[];
}

