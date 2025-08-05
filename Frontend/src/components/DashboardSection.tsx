import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FileText, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

type StatsType = {
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
};

type Order = {
  id: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
};

type StatusCounts = {
  [key: string]: number;
};

interface DashboardProps {
  stats: StatsType;
  recentOrders: Order[];
  topCustomers: Customer[];
  quoteStatusCounts: StatusCounts;
  invoiceStatusCounts: StatusCounts;
  getStatusColor: (status: string) => string;
}

const StatusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  draft: 'muted',
  sent: 'info',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'muted',
  completed: 'success',
  processing: 'warning',
  shipped: 'info'
};

const StatusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  draft: FileText,
  sent: CheckCircle,
  paid: CheckCircle,
  overdue: AlertTriangle,
  cancelled: XCircle,
  completed: CheckCircle,
  processing: Clock,
  shipped: CheckCircle
};

const DashboardSection = ({ 
  stats, 
  recentOrders = [], 
  topCustomers = [], 
  quoteStatusCounts = {}, 
  invoiceStatusCounts = {}, 
  getStatusColor 
}: DashboardProps) => {
  // Safe data with defaults
  const safeStats = stats || {
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
    quoteCount: 0
  };
  const safeQuoteStatusCounts = quoteStatusCounts || {};
  const safeInvoiceStatusCounts = invoiceStatusCounts || {};
  const safeRecentOrders = recentOrders || [];
  const safeTopCustomers = topCustomers || [];

  // Calculate metrics
  const totalQuotes = Object.values(safeQuoteStatusCounts).reduce((sum, count) => sum + (count || 0), 0);
  const totalInvoices = Object.values(safeInvoiceStatusCounts).reduce((sum, count) => sum + (count || 0), 0);
  
  const quoteStatusData = Object.entries(safeQuoteStatusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count || 0,
    percentage: totalQuotes > 0 ? ((count / totalQuotes) * 100) : 0,
    color: StatusColors[status.toLowerCase() as keyof typeof StatusColors] || 'muted'
  })).filter(item => item.value > 0);

  const invoiceStatusData = Object.entries(safeInvoiceStatusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count || 0,
    percentage: totalInvoices > 0 ? ((count / totalInvoices) * 100) : 0,
    color: StatusColors[status.toLowerCase() as keyof typeof StatusColors] || 'muted'
  })).filter(item => item.value > 0);

  // Chart colors based on design system
  const chartColors = {
    primary: 'hsl(var(--primary))',
    success: 'hsl(var(--success))',
    warning: 'hsl(var(--warning))',
    danger: 'hsl(var(--danger))',
    info: 'hsl(var(--info))',
    muted: 'hsl(var(--muted))'
  };

  const getColorByStatus = (colorKey: string) => {
    return chartColors[colorKey as keyof typeof chartColors] || chartColors.muted;
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const colorKey = StatusColors[status.toLowerCase() as keyof typeof StatusColors] || 'muted';
    const Icon = StatusIcons[status.toLowerCase() as keyof typeof StatusIcons] || FileText;
    
    const badgeColors = {
      success: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
      warning: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
      danger: 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/20',
      info: 'bg-info/10 text-info border-info/20 hover:bg-info/20',
      muted: 'bg-muted/10 text-muted-foreground border-muted/20 hover:bg-muted/20'
    };

    return (
      <Badge variant="outline" className={`${badgeColors[colorKey]} transition-colors duration-200`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Stat cards configuration
  const statCards = [
    { 
      title: 'Total Revenue', 
      value: `$${safeStats.revenue.toLocaleString()}`, 
      change: safeStats.revenueChange, 
      icon: DollarSign,
      color: 'primary',
      description: 'Total earnings this period'
    },
    { 
      title: 'Active Customers', 
      value: safeStats.customers.toLocaleString(), 
      change: safeStats.customersChange, 
      icon: Users,
      color: 'success',
      description: 'Registered customer base'
    },
    { 
      title: 'Total Orders', 
      value: safeStats.orders.toLocaleString(), 
      change: safeStats.ordersChange, 
      icon: ShoppingCart,
      color: 'info',
      description: 'Orders processed'
    },
    { 
      title: 'Invoices Issued', 
      value: safeStats.invoices.toLocaleString(), 
      change: safeStats.invoicesChange, 
      icon: FileText,
      color: 'warning',
      description: 'Total invoices created'
    }
  ];

  const secondaryStats = [
    { title: 'Pending Payments', value: safeStats.pendingPayments.toLocaleString(), color: 'warning' },
    { title: 'Payments Received', value: safeStats.paymentsReceived.toLocaleString(), color: 'success' },
    { title: 'Active Quotes', value: safeStats.quoteCount.toLocaleString(), color: 'info' },
    { title: 'Refund Amount', value: `$${safeStats.refundAmount.toLocaleString()}`, color: 'danger' }
  ];

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Track your business performance and key metrics</p>
      </div>

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change !== undefined && stat.change >= 0;
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;
          
          return (
            <Card key={index} className="group relative overflow-hidden bg-card border-border hover:bg-card-hover transition-all duration-300 hover:shadow-medium">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground/70">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-${stat.color}/10`}>
                  <Icon className={`h-4 w-4 text-${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                  {stat.change !== undefined && (
                    <div className="flex items-center space-x-1">
                      <TrendIcon className={`h-3 w-3 ${isPositive ? 'text-success' : 'text-danger'}`} />
                      <span className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {Math.abs(stat.change)}% from last period
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryStats.map((stat, index) => (
          <Card key={index} className="bg-surface border-border hover:bg-surface-light transition-colors duration-200">
            <CardContent className="p-4 text-center">
              <div className={`text-lg font-semibold text-${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quote Status Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-card-foreground">
              <FileText className="h-5 w-5" />
              <span>Quote Status Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quoteStatusData.length > 0 ? (
              <div className="space-y-6">
                {/* Progress Bars */}
                <div className="space-y-4">
                  {quoteStatusData.map((status, index) => (
                    <div key={status.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-card-foreground">{status.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{status.value}</span>
                          <Badge variant="outline" className="text-xs">
                            {status.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={status.percentage} 
                        className="h-2"
                        style={{
                          '--progress-background': getColorByStatus(status.color)
                        } as React.CSSProperties}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Pie Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={quoteStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                      >
                        {quoteStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColorByStatus(entry.color)} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No quote data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Status Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-card-foreground">
              <FileText className="h-5 w-5" />
              <span>Invoice Status Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoiceStatusData.length > 0 ? (
              <div className="space-y-6">
                {/* Progress Bars */}
                <div className="space-y-4">
                  {invoiceStatusData.map((status, index) => (
                    <div key={status.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-card-foreground">{status.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{status.value}</span>
                          <Badge variant="outline" className="text-xs">
                            {status.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={status.percentage} 
                        className="h-2"
                        style={{
                          '--progress-background': getColorByStatus(status.color)
                        } as React.CSSProperties}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Pie Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={invoiceStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                      >
                        {invoiceStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColorByStatus(entry.color)} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invoice data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-card-foreground">
              <ShoppingCart className="h-5 w-5" />
              <span>Recent Orders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {safeRecentOrders.length > 0 ? (
              <div className="space-y-4">
                {safeRecentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-surface hover:bg-surface-light transition-colors duration-200">
                    <div className="space-y-1">
                      <p className="font-medium text-card-foreground">{order.customer || 'Unknown Customer'}</p>
                      <p className="text-sm text-muted-foreground">{order.date || 'No date'}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-card-foreground">${order.amount.toLocaleString()}</p>
                      <StatusBadge status={order.status || 'Unknown'} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent orders available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-card-foreground">
              <Users className="h-5 w-5" />
              <span>Top Customers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {safeTopCustomers.length > 0 ? (
              <div className="space-y-4">
                {safeTopCustomers.slice(0, 5).map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 rounded-lg bg-surface hover:bg-surface-light transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">#{index + 1}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-card-foreground">{customer.name || 'Unknown Customer'}</p>
                        <p className="text-sm text-muted-foreground">{customer.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">${customer.totalSpent.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total spent</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No customer data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardSection;