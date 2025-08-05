// src/services/reportsAPI.ts
import api from './api';
import { AxiosResponse } from 'axios';
import { ReportsAnalyticsResponse } from '../types';

export const reportsAPI = {
  getReportsAnalytics: (): Promise<AxiosResponse<ReportsAnalyticsResponse>> => {
    return api.get('api/analytics/reports');
  },

  getDashboardStats: async () => {
    try {
      const res = await reportsAPI.getReportsAnalytics();
      const data = res.data;

      // Calculate revenue from sales data
      const revenue = data.sales?.reduce((sum, sale) => {
        return sum + (parseFloat(sale.total) || 0);
      }, 0) || 0;

      // Calculate total from orders as backup
      const orderRevenue = data.orders?.reduce((sum, order) => {
        return sum + (parseFloat(order.total) || 0);
      }, 0) || 0;

      // Use sales revenue if available, otherwise use order revenue
      const totalRevenue = revenue > 0 ? revenue : orderRevenue;

      // Calculate total discounts
      const totalDiscounts = data.products?.reduce((sum, product) => {
        return sum + (parseFloat(product.total_discount) || 0);
      }, 0) || 0;

      const profit = totalRevenue - totalDiscounts;

      return {
        stats: {
          revenue: totalRevenue,
          revenueChange: 0, // You can calculate this based on time periods
          customers: data.customers?.length || 0,
          customersChange: 0, // You can calculate this based on time periods
          invoices: data.invoices?.length || 0,
          invoicesChange: 0, // You can calculate this based on time periods
          orders: data.orders?.length || 0,
          ordersChange: 0, // You can calculate this based on time periods
          quoteCount: data.quotes?.length || 0,
          quoteChange: 0, // You can calculate this based on time periods
          profit,
          profitChange: 0, // You can calculate this based on time periods
          monthlyExpenses: 0, // You'll need to add expense tracking
        },
        // You can add more processed data here
        salesData: data.sales?.map(sale => ({
          date: sale.createdAt,
          amount: parseFloat(sale.total) || 0,
          product: sale.product_name,
          company: sale.company_name
        })) || [],
        topProducts: data.products?.slice(0, 5).map(product => ({
          name: product.name,
          sales: product.sale_count,
          revenue: parseFloat(product.total_sale_value) || 0
        })) || [],
        topCustomers: data.customers?.slice(0, 5).map(customer => ({
          name: customer.name,
          orders: customer.order_count,
          totalValue: parseFloat(customer.total_order_value) || 0
        })) || []
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  },
};