import React, { useState } from 'react';
import {
  BarChart3,
  Users,
  FileText,
  DollarSign,
  ShoppingCart,
  Users2,
  Banknote,
  ClipboardList,
  ArrowUp,
  ArrowDown,
  Eye,
  Plus,
  Bell,
  Settings,
  Home,
  Receipt,
  Building2,
  Package,
  TrendingUp,
  UserCircle,
  BarChart,
  Calendar,
  Save,
  X,
  Menu
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ERPDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Mock data for charts
  const salesData = [
    { month: 'Jan', sales: 45000, target: 50000 },
    { month: 'Feb', sales: 52000, target: 55000 },
    { month: 'Mar', sales: 48000, target: 52000 },
    { month: 'Apr', sales: 61000, target: 58000 },
    { month: 'May', sales: 55000, target: 60000 },
    { month: 'Jun', sales: 67000, target: 65000 },
    { month: 'Jul', sales: 71000, target: 68000 },
    { month: 'Aug', sales: 69000, target: 70000 },
    { month: 'Sep', sales: 76000, target: 72000 },
    { month: 'Oct', sales: 82000, target: 75000 },
    { month: 'Nov', sales: 78000, target: 80000 },
    { month: 'Dec', sales: 85000, target: 82000 }
  ];

  // Mock data
  const stats = {
    revenue: 125450,
    revenueChange: 12.5,
    customers: 1247,
    customersChange: 8.2,
    invoices: 89,
    invoicesChange: -3.1,
    orders: 156,
    ordersChange: 15.7,
    pendingPayments: 23450,
    overdueInvoices: 12,
    activeEmployees: 28,
    monthlyExpenses: 45670
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'management', label: 'Management (HR)', icon: Building2 },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart }
  ];

  const recentInvoices = [
    { id: 'INV-001', customer: 'Acme Corp', amount: 2450, status: 'paid', date: '2024-01-25' },
    { id: 'INV-002', customer: 'TechStart Inc', amount: 1890, status: 'pending', date: '2024-01-24' },
    { id: 'INV-003', customer: 'Global Solutions', amount: 3200, status: 'overdue', date: '2024-01-23' },
    { id: 'INV-004', customer: 'Digital Agency', amount: 1750, status: 'paid', date: '2024-01-22' },
    { id: 'INV-005', customer: 'StartupXYZ', amount: 980, status: 'draft', date: '2024-01-21' }
  ];

  const recentOrders = [
    { id: 'ORD-001', customer: 'Acme Corp', items: 12, total: 2450, status: 'completed' },
    { id: 'ORD-002', customer: 'TechStart Inc', items: 8, total: 1890, status: 'processing' },
    { id: 'ORD-003', customer: 'Global Solutions', items: 15, total: 3200, status: 'shipped' },
    { id: 'ORD-004', customer: 'Digital Agency', items: 6, total: 1750, status: 'pending' }
  ];

  const topCustomers = [
    { name: 'Acme Corp', revenue: 15450, orders: 12, growth: 8.5 },
    { name: 'TechStart Inc', revenue: 12890, orders: 9, growth: 12.3 },
    { name: 'Global Solutions', revenue: 11200, orders: 8, growth: -2.1 },
    { name: 'Digital Agency', revenue: 9750, orders: 7, growth: 5.7 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'text-success bg-success/10 border-success/20';
      case 'pending':
      case 'processing':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'overdue':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'draft':
        return 'text-muted-foreground bg-muted border-border';
      case 'shipped':
        return 'text-info bg-info/10 border-info/20';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  // Form Components
  const InvoiceForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Create New Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Invoice Number</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="INV-001" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Customer</label>
              <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent">
                <option>Select Customer</option>
                <option>Acme Corp</option>
                <option>TechStart Inc</option>
                <option>Global Solutions</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Amount</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="0.00" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Due Date</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea 
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
              rows={3} 
              placeholder="Invoice description..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline">Cancel</Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Invoice
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const ManagementForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Employee Management</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Employee Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="John Doe" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Employee ID</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="EMP-001" 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Department</label>
              <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent">
                <option>Select Department</option>
                <option>Sales</option>
                <option>Marketing</option>
                <option>IT</option>
                <option>Finance</option>
                <option>HR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Position</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="Manager" 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Salary</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="50000" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Hire Date</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline">Cancel</Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Employee
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const OrderForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Create New Order</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Order Number</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="ORD-001" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Customer</label>
              <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent">
                <option>Select Customer</option>
                <option>Acme Corp</option>
                <option>TechStart Inc</option>
                <option>Global Solutions</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Product</label>
              <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent">
                <option>Select Product</option>
                <option>Product A</option>
                <option>Product B</option>
                <option>Product C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Quantity</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="1" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Price</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="0.00" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Order Notes</label>
            <textarea 
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
              rows={3} 
              placeholder="Special instructions..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline">Cancel</Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const FinanceForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Financial Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Transaction Type</label>
              <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent">
                <option>Select Type</option>
                <option>Income</option>
                <option>Expense</option>
                <option>Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Amount</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="0.00" 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent">
                <option>Select Category</option>
                <option>Office Supplies</option>
                <option>Marketing</option>
                <option>Travel</option>
                <option>Utilities</option>
                <option>Salaries</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Date</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea 
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
              rows={3} 
              placeholder="Transaction description..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline">Cancel</Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Transaction
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const SalesForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Sales Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Sales Rep</label>
              <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent">
                <option>Select Sales Rep</option>
                <option>John Smith</option>
                <option>Jane Doe</option>
                <option>Mike Johnson</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Sale Date</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Customer</label>
              <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent">
                <option>Select Customer</option>
                <option>Acme Corp</option>
                <option>TechStart Inc</option>
                <option>Global Solutions</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Sale Amount</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="0.00" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Products Sold</label>
            <textarea 
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
              rows={3} 
              placeholder="List products sold..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline">Cancel</Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Record Sale
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const ProductForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Product Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="Product Name" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">SKU</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="SKU-001" 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent">
                <option>Select Category</option>
                <option>Electronics</option>
                <option>Clothing</option>
                <option>Books</option>
                <option>Home & Garden</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Price</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="0.00" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Stock Quantity</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="0" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea 
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
              rows={3} 
              placeholder="Product description..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline">Cancel</Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const CustomerForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Add New Customer</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="Acme Corp" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Contact Person</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="John Doe" 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input 
                type="email" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="john@acme.com" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
              <input 
                type="tel" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="+1 234 567 8900" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Address</label>
            <textarea 
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
              rows={3} 
              placeholder="Customer address..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline">Cancel</Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const ReportsSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Sales Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                  name="Actual Sales"
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                  name="Target Sales"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Sales:</span>
                <span className="font-semibold">$789,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target:</span>
                <span className="font-semibold">$765,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Achievement:</span>
                <span className="font-semibold text-success">103.1%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Customers:</span>
                <span className="font-semibold">{stats.customers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New This Month:</span>
                <span className="font-semibold">42</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Growth Rate:</span>
                <span className="font-semibold text-success">+{stats.customersChange}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Revenue:</span>
                <span className="font-semibold">${stats.revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expenses:</span>
                <span className="font-semibold">${stats.monthlyExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net Profit:</span>
                <span className="font-semibold text-success">${(stats.revenue - stats.monthlyExpenses).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const DashboardSection = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${stats.revenue.toLocaleString()}</p>
                <p className="text-xs text-success flex items-center mt-2">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {stats.revenueChange}%
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{stats.customers.toLocaleString()}</p>
                <p className="text-xs text-success flex items-center mt-2">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {stats.customersChange}%
                </p>
              </div>
              <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.orders}</p>
                <p className="text-xs text-success flex items-center mt-2">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {stats.ordersChange}%
                </p>
              </div>
              <div className="h-12 w-12 bg-info/10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Invoices</p>
                <p className="text-2xl font-bold">{stats.invoices}</p>
                <p className="text-xs text-destructive flex items-center mt-2">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  {Math.abs(stats.invoicesChange)}%
                </p>
              </div>
              <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{invoice.id}</p>
                      <p className="text-sm text-muted-foreground">{invoice.customer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${invoice.amount.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-success/10 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-sm text-muted-foreground">{order.customer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${order.total.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCustomers.map((customer) => (
              <div key={customer.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                    <UserCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${customer.revenue.toLocaleString()}</p>
                  <p className={`text-xs ${customer.growth > 0 ? 'text-success' : 'text-destructive'}`}>
                    {customer.growth > 0 ? '+' : ''}{customer.growth}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection />;
      case 'invoices':
        return <InvoiceForm />;
      case 'management':
        return <ManagementForm />;
      case 'orders':
        return <OrderForm />;
      case 'finance':
        return <FinanceForm />;
      case 'sales':
        return <SalesForm />;
      case 'products':
        return <ProductForm />;
      case 'customers':
        return <CustomerForm />;
      case 'reports':
        return <ReportsSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-white">ERP Dashboard</h1>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-white hover:bg-slate-800"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-primary text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground capitalize">
                {activeSection === 'management' ? 'HR Management' : activeSection}
              </h2>
              <p className="text-muted-foreground">
                {activeSection === 'dashboard' 
                  ? 'Overview of your business metrics' 
                  : `Manage your ${activeSection === 'management' ? 'employees and HR data' : activeSection}`
                }
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default ERPDashboard;