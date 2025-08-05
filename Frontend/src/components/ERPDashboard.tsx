import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Invoices from "../components/Invoices";
import Quotes from "../components/Quotes";
import ManagementForm from "../components/ManagementForm";
import OrdersForm from "../components/OrdersForm";
import FinanceForm from "../components/FinanceForm";
import PaymentsForm from '../components/PaymentsForm';
import ProductForm from "../components/ProductForm";
import CustomerForm from "../components/CustomerForm";
import SaleForm from "../components/SaleForm";
import Comapanies from "../components/Companies";
import ReportsSection from "../components/ReportsSection";
import DashboardSection from "../components/DashboardSection";
import UserManagementForm from "../components/UserManagementForm";
import axios from 'axios';
import {
  Users,
  DollarSign,
  ShoppingCart,
  Banknote,
  Home,
  Receipt,
  Building2,
  Package,
  TrendingUp,
  UserCircle,
  BarChart,
  Save,
  X,
  Menu,
  User,
  Lock,
  Globe,
  Fingerprint,
  Briefcase,
  UserCog,
  LogOut,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ERPHomepage from '@/pages/ERPHomepage';
import { useToast } from '@/hooks/use-toast';
import { saleApi } from '@/services/sales';
import { orderAPI } from '@/services/orders';
import { customerAPI } from '@/services/customers';
import { invoiceAPI } from '@/services/invoices';
import { quoteAPI } from '@/services/quotes';
import { userApi } from '@/services/users';
import { reportsAPI } from '../services/reportsAPI';

interface StatsType {
  revenue: number;
  revenueChange: number;
  customers: number;
  customersChange: number;
  invoices: number;
  invoicesChange: number;
  orders: number;
  ordersChange: number;
  pendingPayments: number;
  paymentsReceived: number;
  refunds: number;
  refundAmount: number;
  quoteCount: number;
  profit: number;
  profitChange: number;
  monthlyExpenses: number;
}

interface Order {
  id: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
}

interface StatusCounts {
  [key: string]: number;
}

const ERPDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com'
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [stats, setStats] = useState<StatsType>({
    revenue: 0,
    revenueChange: 0,
    customers: 0,
    customersChange: 0,
    invoices: 0,
    invoicesChange: 0,
    orders: 0,
    ordersChange: 0,
    pendingPayments: 0,
    paymentsReceived: 0,
    refunds: 0,
    refundAmount: 0,
    quoteCount: 0,
    profit: 0,
    profitChange: 0,
    monthlyExpenses: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topCustomers, setTopCustomers] = useState<Customer[]>([]);
  const [quoteStatusCounts, setQuoteStatusCounts] = useState<StatusCounts>({});
  const [invoiceStatusCounts, setInvoiceStatusCounts] = useState<StatusCounts>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const companyId = 'default'; // Replace with actual company ID logic if needed

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'quotes', label: 'Quotes', icon: Receipt },
    { id: 'management', label: 'Management (HR)', icon: Building2 },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'payments', label: 'Payments', icon: Banknote },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'companies', label: 'Companies', icon: Briefcase },
    { id: 'reports', label: 'Reports', icon: BarChart },
    { id: 'user-management', label: 'User Management', icon: UserCog }
  ];

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch data from existing APIs
      const salesResponse = await saleApi.getSales();
      if (!Array.isArray(salesResponse.data)) {
        throw new Error('Expected an array of sales, received: ' + JSON.stringify(salesResponse.data));
      }

      const ordersResponse = await orderAPI.getOrders();
      if (!Array.isArray(ordersResponse.data)) {
        throw new Error('Expected an array of orders, received: ' + JSON.stringify(ordersResponse.data));
      }
      const formattedOrders: Order[] = ordersResponse.data.slice(0, 4).map((order: any) => ({
        id: order.id || `ORD-${Math.random().toString(36).slice(2, 7)}`,
        customer: order.customer || 'Unknown',
        amount: order.amount || 0,
        status: order.status || 'pending',
        date: order.date || new Date().toISOString().split('T')[0]
      }));
      setRecentOrders(formattedOrders);

      const customersResponse = await customerAPI.getCustomers();
      if (!Array.isArray(customersResponse.data)) {
        throw new Error('Expected an array of customers, received: ' + JSON.stringify(customersResponse.data));
      }
      const formattedCustomers: Customer[] = customersResponse.data.slice(0, 4).map((customer: any) => ({
        id: customer.id || `CUST-${Math.random().toString(36).slice(2, 7)}`,
        name: customer.name || 'Unknown',
        email: customer.email || 'N/A',
        totalSpent: customer.totalSpent || 0
      }));
      setTopCustomers(formattedCustomers);

      const invoicesResponse = await invoiceAPI.getInvoices();
      if (!Array.isArray(invoicesResponse.data)) {
        throw new Error('Expected an array of invoices, received: ' + JSON.stringify(invoicesResponse.data));
      }
      const invoices = invoicesResponse.data;

      const quotesResponse = await quoteAPI.getQuotes();
      if (!Array.isArray(quotesResponse.data)) {
        throw new Error('Expected an array of quotes, received: ' + JSON.stringify(quotesResponse.data));
      }
      const quotes = quotesResponse.data;

      // Calculate status counts
      const invoiceStatusCounts: StatusCounts = invoices.reduce((acc: any, inv: any) => {
        const status = inv.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      setInvoiceStatusCounts(invoiceStatusCounts);

      const quoteStatusCounts: StatusCounts = quotes.reduce((acc: any, quote: any) => {
        const status = quote.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      setQuoteStatusCounts(quoteStatusCounts);

      // Calculate additional stats
      const pendingPayments = invoices
        .filter((inv: any) => inv.status === 'pending')
        .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
      const paymentsReceived = invoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
      const refunds = invoices.filter((inv: any) => inv.status === 'refunded').length;
      const refundAmount = invoices
        .filter((inv: any) => inv.status === 'refunded')
        .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);

      // Fetch report stats and merge with local calculations
      const { stats: reportStats } = await reportsAPI.getDashboardStats(companyId);

      // Calculate ordersChange locally if not provided by API
      const prevOrders = ordersResponse.data.length; // Placeholder for previous period's orders
      const currOrders = ordersResponse.data.length;
      const ordersChange = prevOrders > 0 ? ((currOrders - prevOrders) / prevOrders) * 100 : 0;

      setStats({
        revenue: salesResponse.data.reduce((sum: number, sale: any) => sum + (sale.amount || 0), 0),
        revenueChange: reportStats.revenueChange || 0,
        customers: customersResponse.data.length,
        customersChange: reportStats.customersChange || 0,
        invoices: invoices.length,
        invoicesChange: reportStats.invoicesChange || 0,
        orders: currOrders,
        ordersChange,
        pendingPayments,
        paymentsReceived,
        refunds,
        refundAmount,
        quoteCount: quotesResponse.data.length,
        profit: reportStats.profit || 0,
        profitChange: reportStats.profitChange || 0,
        monthlyExpenses: reportStats.monthlyExpenses || 0
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      const errorMessage = err.message || 'Failed to fetch dashboard data';
      setError(errorMessage);
      setRecentOrders([]);
      setTopCustomers([]);
      setQuoteStatusCounts({});
      setInvoiceStatusCounts({});
      setStats({
        revenue: 0,
        revenueChange: 0,
        customers: 0,
        customersChange: 0,
        invoices: 0,
        invoicesChange: 0,
        orders: 0,
        ordersChange: 0,
        pendingPayments: 0,
        paymentsReceived: 0,
        refunds: 0,
        refundAmount: 0,
        quoteCount: 0,
        profit: 0,
        profitChange: 0,
        monthlyExpenses: 0
      });
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'text-success bg-success/10 border-success/20';
      case 'pending':
      case 'processing':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'overdue':
      case 'rejected':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'draft':
      case 'cancelled':
        return 'text-muted-foreground bg-muted border-border';
      case 'shipped':
      case 'sent':
      case 'approved':
        return 'text-info bg-info/10 border-info/20';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await userApi.updateUser(1, profileData);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      setShowProfileModal(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await userApi.updateUser(1, { password: passwordData.newPassword });
      toast({
        title: 'Success',
        description: 'Password updated successfully',
      });
      setShowPasswordModal(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error('Error updating password:', err);
      const errorMessage = err.message || 'Failed to update password';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFingerprintSignup = async () => {
    // Placeholder for fingerprint signup logic
  };

  const handleLogout = (): void => {
    navigate('/');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardSection
            stats={stats}
            recentOrders={recentOrders}
            topCustomers={topCustomers}
            quoteStatusCounts={quoteStatusCounts}
            invoiceStatusCounts={invoiceStatusCounts}
            getStatusColor={getStatusColor}
          />
        );
      case 'invoices':
        return <Invoices />;
      case 'quotes':
        return <Quotes />;
      case 'management':
        return <ManagementForm />;
      case 'orders':
        return <OrdersForm />;
      case 'finance':
        return <FinanceForm />;
      case 'sales':
        return <SaleForm />;
      case 'products':
        return <ProductForm />;
      case 'payments':
        return <PaymentsForm />;
      case 'customers':
        return <CustomerForm />;
      case 'reports':
        return (
          <ReportsSection
            companyId={companyId}
          />
        );
      case 'companies':
        return <Comapanies />;
      case 'user-management':
        return <UserManagementForm />;
      default:
        return <ERPHomepage />;
    }
  };

  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

  return (
    <div className="min-h-screen bg-background flex w-full">
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {error}
        </div>
      )}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
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
              disabled={loading}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
                    disabled={loading}
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground capitalize">
                {activeSection === 'management' ? 'HR Management' : activeSection}
              </h2>
              <p className="text-muted-foreground">
                {activeSection === 'dashboard'
                  ? 'Overview of your business metrics'
                  : `Manage your ${activeSection === 'management' ? 'employees and HR data' : activeSection}`}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="px-2" aria-label="Currency selection" disabled={loading}>
                    <DollarSign className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <span>USD</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>PKR</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="px-2" aria-label="Language selection" disabled={loading}>
                    <Globe className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <span>English</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Urdu</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="px-2" aria-label="User settings" disabled={loading}>
                    <UserCircle className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="h-4 w-4 mr-2" />
                    <span>Logged in as: Admin</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    <span>Update Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFingerprintSignup()}>
                    <Fingerprint className="h-4 w-4 mr-2" />
                    <span>Add Fingerprint</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLogout()}>
                    <LogOut className="h-4 w-4 mr-3" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Update Profile</h3>
              <button onClick={() => setShowProfileModal(false)} disabled={loading}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowProfileModal(false);
                    setShowPasswordModal(true);
                  }}
                  disabled={loading}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Update Password</h3>
              <button onClick={() => setShowPasswordModal(false)} disabled={loading}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ERPDashboard;