'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Users, TrendingUp, Loader2, ShieldCheck } from 'lucide-react';
import { mockChartData } from '@/lib/mock-data';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { orders, products, customers, admins, loading } = useData();
  
  const lowStockCount = products.filter(p => p.stock < 100).length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Group real orders by month for charts
  const groupedData = orders.reduce((acc: { [key: string]: { name: string; revenue: number; orders: number } }, order) => {
    const date = new Date(order.date);
    const month = date.toLocaleString('default', { month: 'short' });
    if (!acc[month]) {
      acc[month] = { name: month, revenue: 0, orders: 0 };
    }
    acc[month].revenue += Number(order.total);
    acc[month].orders += 1;
    return acc;
  }, {});

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = Object.values(groupedData).sort((a, b) => 
    months.indexOf(a.name) - months.indexOf(b.name)
  );

  const displayChartData = chartData.length > 0 ? chartData : mockChartData;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome to PetroWorld Admin Panel</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-green-600">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="w-4 h-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{orders.length}</div>
            <p className="text-xs text-green-600">+180.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="w-4 h-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-green-600">+19% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-slate-600">Active profiles in system</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={displayChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#f59e0b" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Volume</CardTitle>
            <CardDescription>Monthly order count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={displayChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockCount > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Low stock items</span>
                    <Badge variant="destructive">{lowStockCount}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {lowStockCount} products have stock below 100 units. Consider reordering soon.
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-600">All inventory levels are healthy!</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingOrders > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Orders awaiting processing</span>
                    <Badge>{pendingOrders}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {pendingOrders} order(s) need attention. Visit the Orders page to process them.
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-600">No pending orders at the moment!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
