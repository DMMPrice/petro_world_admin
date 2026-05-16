'use client';

import { useState } from 'react';
import {
  Eye, Truck, Clock, CheckCircle, XCircle, Loader2,
  ExternalLink, Search, Filter, Trash2, ArrowUpRight,
  Package, RefreshCw, Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/data-context';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { Order } from '@/lib/mock-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { apiFetch } from '@/lib/supabase';

const ORDER_STATUSES = ['ordered', 'processing', 'shipped', 'delivered', 'canceled', 'returned'] as const;

const STATUS_CONFIG = {
  ordered:        { label: 'New Order',   color: 'bg-amber-100 text-amber-700',   icon: Bell },
  processing:     { label: 'Processing',  color: 'bg-blue-100 text-blue-700',     icon: Package },
  packed:         { label: 'Packed',      color: 'bg-indigo-100 text-indigo-700', icon: Package },
  shipped:        { label: 'Shipped',     color: 'bg-sky-100 text-sky-700',       icon: Truck },
  delivered:      { label: 'Delivered',   color: 'bg-green-100 text-green-700',   icon: CheckCircle },
  canceled:       { label: 'Canceled',    color: 'bg-red-100 text-red-600',       icon: XCircle },
  returned:       { label: 'Returned',    color: 'bg-orange-100 text-orange-600', icon: RefreshCw },
  awaitingPayment:{ label: 'Awaiting',    color: 'bg-yellow-100 text-yellow-700', icon: Clock },
} as const;

export default function OrdersPage() {
  const { orders, updateOrderStatus, deleteOrder, loading } = useData();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pushing, setPushing] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const newCount       = orders.filter(o => o.status === 'ordered').length;
  const activeCount    = orders.filter(o => ['processing','packed','shipped'].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const shiprocketCount = orders.filter(o => o.shiprocketOrderId).length;

  // Push order to Shiprocket (create order only — admin handles AWB/label in Shiprocket dashboard)
  const handlePushToShiprocket = async (order: Order) => {
    if (pushing) return;
    setPushing(order.id);
    try {
      const data = await apiFetch('/admin/shiprocket/create', {
        method: 'POST',
        body: JSON.stringify({ order_id: order.id }),
      });
      if (data?.success) {
        toast.success(`✓ Order pushed to Shiprocket! Open Shiprocket dashboard to assign AWB & ship.`);
        updateOrderStatus(order.id, 'processing');
        if (selectedOrder?.id === order.id) {
          setSelectedOrder({ ...selectedOrder, status: 'processing', shiprocketOrderId: data.shiprocket_order_id });
        }
      } else {
        throw new Error(data?.error || 'Failed to push order');
      }
    } catch (err: any) {
      console.error('Push to Shiprocket error:', err);
      toast.error(err.message || 'Failed to push to Shiprocket', { duration: 6000 });
    } finally {
      setPushing(null);
    }
  };

  const handleStatusChange = (orderId: string, status: typeof ORDER_STATUSES[number]) => {
    updateOrderStatus(orderId, status);
    toast.success(`Status updated to ${STATUS_CONFIG[status]?.label ?? status}`);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      setOrderToDelete(null);
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete order');
    }
  };

  const handleSync = async (order: Order) => {
    if (syncing) return;
    setSyncing(order.id);
    try {
      const data = await apiFetch('/admin/shiprocket/sync', {
        method: 'POST',
        body: JSON.stringify({
          order_id:        order.id,
          shipment_id:     order.shipmentId,
          tracking_number: order.trackingNumber,
        }),
      });
      toast.success(`Synced: ${data?.current_status ?? 'Status updated'}`);
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(prev => prev ? ({
          ...prev,
          trackingNumber: data?.tracking_number ?? prev.trackingNumber,
          courierStatus:  data?.current_status  ?? prev.courierStatus,
          shippingLabelUrl: data?.label_url     ?? prev.shippingLabelUrl,
        }) : null);
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncing(null);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.ordered;
    const Icon = cfg.icon;
    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold', cfg.color)}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Orders</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
            Incoming orders — push to Shiprocket, manage shipping there
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-slate-200 text-slate-600"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
            onClick={() => window.open('https://app.shiprocket.in', '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            Open Shiprocket
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'New Orders',     value: newCount,       color: 'text-amber-600', bg: 'bg-amber-50',  Icon: Bell },
          { label: 'Active',         value: activeCount,    color: 'text-blue-600',  bg: 'bg-blue-50',   Icon: Truck },
          { label: 'Delivered',      value: deliveredCount, color: 'text-green-600', bg: 'bg-green-50',  Icon: CheckCircle },
          { label: 'On Shiprocket',  value: shiprocketCount,color: 'text-indigo-600',bg: 'bg-indigo-50', Icon: Package },
        ].map(({ label, value, color, bg, Icon }) => (
          <Card key={label} className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</CardTitle>
              <div className={cn('p-1.5 rounded-lg', bg)}>
                <Icon className={cn('h-4 w-4', color)} />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className={cn('text-3xl font-bold', color)}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Orders Alert Banner */}
      {newCount > 0 && (
        <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-900">
              {newCount} new order{newCount > 1 ? 's' : ''} waiting!
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Push them to Shiprocket, then handle AWB assignment and label printing in the Shiprocket dashboard.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
            onClick={() => setFilter('ordered')}
          >
            View New Orders
          </Button>
        </div>
      )}

      {/* Orders Table */}
      <Card className="border-none shadow-md bg-white overflow-hidden">
        {/* Filters */}
        <CardHeader className="px-6 py-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search order # or customer..."
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-amber-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <Filter className="w-4 h-4" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-36 border-none bg-transparent h-auto p-0 focus:ring-0 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  {ORDER_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="px-6 font-semibold text-slate-500">Order</TableHead>
                  <TableHead className="font-semibold text-slate-500">Customer</TableHead>
                  <TableHead className="font-semibold text-slate-500">Items / Total</TableHead>
                  <TableHead className="font-semibold text-slate-500">Date</TableHead>
                  <TableHead className="font-semibold text-slate-500">Status</TableHead>
                  <TableHead className="font-semibold text-slate-500">Shiprocket</TableHead>
                  <TableHead className="text-right px-6 font-semibold text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? filteredOrders.map(order => (
                  <TableRow key={order.id} className="group hover:bg-slate-50 border-slate-100">
                    <TableCell className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        {order.orderNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{order.customerName}</p>
                        <p className="text-xs text-slate-400">{order.city}{order.state ? `, ${order.state}` : ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-bold text-slate-900">₹{order.total.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">{order.items} item{order.items !== 1 ? 's' : ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-600">{formatDate(order.date)}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      {order.shiprocketOrderId ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            #{order.shiprocketOrderId}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600"
                            onClick={() => window.open('https://app.shiprocket.in/orders', '_blank')}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : order.status === 'ordered' || order.status === 'processing' ? (
                        <Button
                          size="sm"
                          className="h-8 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3"
                          onClick={() => handlePushToShiprocket(order)}
                          disabled={pushing === order.id}
                        >
                          {pushing === order.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                            : <Truck className="w-3.5 h-3.5 mr-1" />
                          }
                          Push to Shiprocket
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right px-6 w-[100px]">
                      <div className="flex items-center justify-end gap-1 invisible group-hover:visible">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:text-amber-600 hover:bg-amber-50"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setOrderToDelete(order)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-slate-400">
                      <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No orders found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[640px] p-0 border-none shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              {/* Modal Header */}
              <div className="bg-slate-900 px-8 py-8 text-white">
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Order</span>
                    <span className="text-slate-400 text-xs">{formatDateTime(selectedOrder.date)}</span>
                  </div>
                  <DialogTitle className="text-2xl font-bold">{selectedOrder.orderNumber}</DialogTitle>
                  <DialogDescription className="text-slate-400 text-sm">
                    {selectedOrder.customerName} · ₹{selectedOrder.total.toLocaleString()}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-6 bg-white">
                {/* Status + Quick info */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Payment</p>
                    <span className="text-sm font-semibold text-slate-700">{selectedOrder.status === 'awaitingPayment' ? 'Pending' : 'Paid'}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Items</p>
                    <span className="text-sm font-semibold text-slate-700">{selectedOrder.items} unit{selectedOrder.items !== 1 ? 's' : ''}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total</p>
                    <span className="text-sm font-bold text-amber-600">₹{selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Shipping Address */}
                {selectedOrder.shippingAddress && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Delivery Address</p>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-700 leading-relaxed">
                      {selectedOrder.shippingAddress}
                      <div className="flex gap-2 mt-2">
                        {selectedOrder.city && <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">{selectedOrder.city}</span>}
                        {selectedOrder.state && <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">{selectedOrder.state}</span>}
                        {selectedOrder.pincode && <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">{selectedOrder.pincode}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Products</p>
                    <div className="space-y-2">
                      {selectedOrder.order_items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                              {item.products?.image_url
                                ? <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
                                : <Package className="w-5 h-5 text-slate-300" />
                              }
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 line-clamp-1">{item.products?.title || 'Product'}</p>
                              <p className="text-xs text-slate-400">₹{item.price_at_purchase} × {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-bold text-slate-800 text-sm">₹{(item.price_at_purchase * item.quantity).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Override — only for cancellations / returns */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-0.5">Manual Override</p>
                  <p className="text-xs text-slate-400 mb-3">
                    Use only for cancellations or returns. Shiprocket updates <em>processing → shipped → delivered</em> automatically.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(
                        'flex-1 h-9 rounded-lg border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600',
                        selectedOrder.status === 'canceled' && 'bg-red-50 border-red-300 text-red-600'
                      )}
                      onClick={() => {
                        handleStatusChange(selectedOrder.id, 'canceled');
                        setSelectedOrder({ ...selectedOrder, status: 'canceled' });
                      }}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />
                      Cancel Order
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(
                        'flex-1 h-9 rounded-lg border-slate-200 text-slate-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600',
                        selectedOrder.status === 'returned' && 'bg-orange-50 border-orange-300 text-orange-600'
                      )}
                      onClick={() => {
                        handleStatusChange(selectedOrder.id, 'returned');
                        setSelectedOrder({ ...selectedOrder, status: 'returned' });
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Mark Returned
                    </Button>
                  </div>
                  {(selectedOrder.status === 'canceled' || selectedOrder.status === 'returned') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full mt-2 h-8 text-xs text-slate-400 hover:text-slate-600"
                      onClick={() => {
                        handleStatusChange(selectedOrder.id, 'ordered');
                        setSelectedOrder({ ...selectedOrder, status: 'ordered' });
                      }}
                    >
                      Undo — restore to New Order
                    </Button>
                  )}
                </div>

                {/* Shiprocket Action */}
                <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold flex items-center gap-2"><Truck className="w-4 h-4 text-amber-400" /> Shiprocket</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {selectedOrder.shiprocketOrderId
                          ? `SR Order ID: ${selectedOrder.shiprocketOrderId}`
                          : 'Not yet pushed to Shiprocket'
                        }
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {selectedOrder.shiprocketOrderId && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-1.5"
                          onClick={() => handleSync(selectedOrder)}
                          disabled={syncing === selectedOrder.id}
                        >
                          {syncing === selectedOrder.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <RefreshCw className="w-3.5 h-3.5" />
                          }
                          Sync
                        </Button>
                      )}
                      {selectedOrder.shiprocketOrderId ? (
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                          onClick={() => window.open('https://app.shiprocket.in/orders', '_blank')}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Dashboard
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5 font-bold"
                          onClick={() => handlePushToShiprocket(selectedOrder)}
                          disabled={pushing === selectedOrder.id}
                        >
                          {pushing === selectedOrder.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Truck className="w-4 h-4" />
                          }
                          Push to Shiprocket
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Tracking number + Invoice */}
                  {selectedOrder.trackingNumber && (
                    <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3">
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">AWB / Tracking</p>
                        <p className="font-mono text-sm text-white">{selectedOrder.trackingNumber}</p>
                      </div>
                      {selectedOrder.shippingLabelUrl && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0"
                          onClick={() => window.open(selectedOrder.shippingLabelUrl, '_blank')}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Invoice
                        </Button>
                      )}
                    </div>
                  )}

                  {selectedOrder.shiprocketOrderId && !selectedOrder.trackingNumber && (
                    <p className="text-xs text-slate-400 bg-slate-800 rounded-lg px-3 py-2">
                      ✓ Order is live on Shiprocket. Assign AWB & select courier from the dashboard, then click Sync to update this panel.
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 text-red-600 border-slate-200 hover:bg-red-50 hover:border-red-200"
                    onClick={() => { setOrderToDelete(selectedOrder); setSelectedOrder(null); }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Order
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!orderToDelete} onOpenChange={open => !open && setOrderToDelete(null)}>
        <AlertDialogContent className="rounded-2xl max-w-[400px]">
          <AlertDialogHeader>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-3 mx-auto">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <AlertDialogTitle className="text-center text-xl font-bold">Delete Order?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500">
              Permanently delete <strong>#{orderToDelete?.orderNumber}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-3">
            <AlertDialogCancel className="flex-1 rounded-xl h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => orderToDelete && handleDeleteOrder(orderToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
