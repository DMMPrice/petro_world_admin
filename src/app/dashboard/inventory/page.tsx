'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingDown, Package, Loader2 } from 'lucide-react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

export default function InventoryPage() {
  const { products, loading } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const lowStockProducts = products.filter(p => p.stock < 100).sort((a, b) => a.stock - b.stock);
  const criticalStockProducts = products.filter(p => p.stock < 50);
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const averageStock = products.length > 0 ? Math.round(totalStock / products.length) : 0;

  const getStockPercentage = (stock: number) => {
    const maxStock = 5000;
    return Math.min((stock / maxStock) * 100, 100);
  };

  const getStockColor = (stock: number) => {
    if (stock < 50) return 'bg-red-500';
    if (stock < 100) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
        <p className="text-slate-600 mt-2">Track and monitor your stock levels</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Package className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock.toLocaleString()}</div>
            <p className="text-xs text-slate-600">Units in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageStock}</div>
            <p className="text-xs text-slate-600">Per product</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockProducts.length}</div>
            <p className="text-xs text-slate-600">Products below 100 units</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {criticalStockProducts.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{criticalStockProducts.length} products</strong> have critically low stock levels (below 50 units).
            Consider reordering immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>Stock levels and inventory status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const stockPercentage = getStockPercentage(product.stock);
                  let status = 'In Stock';
                  let statusVariant = 'default' as const;

                  if (product.stock < 50) {
                    status = 'Critical';
                    statusVariant = 'destructive';
                  } else if (product.stock < 100) {
                    status = 'Low';
                    statusVariant = 'secondary';
                  }

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.stock.toLocaleString()}</TableCell>
                      <TableCell className="w-32">
                        <div className="space-y-1">
                          <Progress
                            value={stockPercentage}
                            className="h-2"
                          />
                          <p className="text-xs text-slate-600">{stockPercentage.toFixed(0)}%</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant}>{status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low Stock Alert</CardTitle>
            <CardDescription>Products that need reordering</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-sm text-slate-600">{product.stock} units remaining</p>
                  </div>
                  <Badge variant={product.stock < 50 ? 'destructive' : 'secondary'}>
                    {product.stock < 50 ? 'CRITICAL' : 'LOW'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
