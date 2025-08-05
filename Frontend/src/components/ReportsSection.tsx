import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar,Cell } from 'recharts';
import { DollarSign, Users, FileText, TrendingUp, TrendingDown, PieChartIcon} from 'lucide-react';
import { reportsAPI } from '../services/reportsAPI';
import { ReportsAnalyticsResponse } from '../types';

interface ReportsSectionProps {
  companyId?: string;
}

interface StatsType {
  revenue: number;
  revenueChange: number;
  customers: number;
  customersChange: number;
  invoices: number;
  invoicesChange: number;
  quoteCount: number;
    ordersChange?: number; // Add this line
  quoteChange: number;
  profit: number;
  profitChange: number;
  monthlyExpenses: number;
}

interface SalesDataPoint {
  month: string;
  sales: number;
  target?: number;
}

const ReportsSection: React.FC<ReportsSectionProps> = ({ companyId }) => {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { stats: fetchedStats, salesData: fetchedSalesData } = await reportsAPI.getDashboardStats(companyId);
        setStats(fetchedStats);
        
        // Transform sales data for chart
        const transformedSalesData = fetchedStats.monthlyExpenses
          ? [
              { month: 'Jan', sales: fetchedStats.revenue / 12, target: fetchedStats.revenue * 1.1 / 12 },
              { month: 'Feb', sales: fetchedStats.revenue / 12 * 1.05, target: fetchedStats.revenue * 1.1 / 12 },
              { month: 'Mar', sales: fetchedStats.revenue / 12 * 1.1, target: fetchedStats.revenue * 1.1 / 12 },
              { month: 'Apr', sales: fetchedStats.revenue / 12 * 0.95, target: fetchedStats.revenue * 1.1 / 12 },
              { month: 'May', sales: fetchedStats.revenue / 12 * 1.15, target: fetchedStats.revenue * 1.1 / 12 },
              { month: 'Jun', sales: fetchedStats.revenue / 12 * 1.2, target: fetchedStats.revenue * 1.1 / 12 },
            ]
          : [];
        setSalesData(transformedSalesData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch report data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  // Chart colors based on design system
  const chartColors = {
    primary: 'hsl(var(--primary))',
    success: 'hsl(var(--success))',
    warning: 'hsl(var(--warning))',
    danger: 'hsl(var(--danger))',
    info: 'hsl(var(--info))',
    muted: 'hsl(var(--muted))'
  };

  // Stat cards configuration
  const statCards = [
    {
      title: 'Total Revenue',
      value: stats?.revenue ? `$${stats.revenue.toLocaleString()}` : 'N/A',
      change: stats?.revenueChange,
      icon: DollarSign,
      color: 'primary',
      description: 'Total earnings this period'
    },
    {
      title: 'Active Customers',
      value: stats?.customers ? stats.customers.toLocaleString() : 'N/A',
      change: stats?.customersChange,
      icon: Users,
      color: 'success',
      description: 'Registered customer base'
    },
    {
      title: 'Invoices Issued',
      value: stats?.invoices ? stats.invoices.toLocaleString() : 'N/A',
      change: stats?.invoicesChange,
      icon: FileText,
      color: 'warning',
      description: 'Total invoices created'
    },
    {
      title: 'Total Profit',
      value: stats?.profit ? `$${stats.profit.toLocaleString()}` : 'N/A',
      change: stats?.profitChange,
      icon: PieChartIcon,
      color: 'info',
      description: 'Net profit this period'
    }
  ];

  const secondaryStats = [
    { title: 'Active Quotes', value: stats?.quoteCount ? stats.quoteCount.toLocaleString() : 'N/A', color: 'info' },
    { title: 'Monthly Expenses', value: stats?.monthlyExpenses ? `$${stats.monthlyExpenses.toLocaleString()}` : 'N/A', color: 'danger' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center text-danger">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports Dashboard</h1>
        <p className="text-muted-foreground">Detailed insights into your business performance</p>
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
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
        {secondaryStats.map((stat, index) => (
          <Card key={index} className="bg-surface border-border hover:bg-surface-light transition-colors duration-200">
            <CardContent className="p-4 text-center">
              <div className={`text-lg font-semibold text-${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Overview Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-card-foreground">
            <TrendingUp className="h-5 w-5" />
            <span>Sales Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {salesData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke={chartColors.primary} activeDot={{ r: 8 }} name="Sales" />
                  <Line type="monotone" dataKey="target" stroke={chartColors.success} name="Target" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sales data available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Report: Invoice and Quote Trends */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-card-foreground">
            <FileText className="h-5 w-5" />
            <span>Invoices and Quotes Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats && (stats.invoices > 0 || stats.quoteCount > 0) ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Invoices', value: stats.invoices, fill: chartColors.warning },
                    { name: 'Quotes', value: stats.quoteCount, fill: chartColors.info }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {[
                      { name: 'Invoices', value: stats.invoices, fill: chartColors.warning },
                      { name: 'Quotes', value: stats.quoteCount, fill: chartColors.info }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoice or quote data available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsSection;