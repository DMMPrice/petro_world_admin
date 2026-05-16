'use client';

import { useState } from 'react';
import { Plus, Copy, Trash2, ToggleLeft, ToggleRight, Loader2, Image as ImageIcon, ExternalLink, Edit2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/data-context';
import { formatDate } from '@/lib/utils';
import { Coupon, Banner } from '@/lib/mock-data';
import { BannerForm } from '@/components/banner-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function PromotionsPage() {
  const { coupons, addCoupon, deleteCoupon, updateCoupon, banners, deleteBanner, updateBanner, loading } = useData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBannerFormOpen, setIsBannerFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const activeCoupons = coupons.filter(c => c.active).length;
  const totalDiscount = coupons.reduce((sum, c) => sum + c.discount, 0);

  const handleToggle = (coupon: Coupon) => {
    updateCoupon(coupon.id, { active: !coupon.active });
    toast.success(`Coupon ${coupon.active ? 'deactivated' : 'activated'}`);
  };

  const handleBannerToggle = (banner: Banner) => {
    updateBanner(banner.id, { active: !banner.active });
    toast.success(`Banner ${banner.active ? 'deactivated' : 'activated'}`);
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setIsBannerFormOpen(true);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const isExpired = (expiry: string) => new Date(expiry) < new Date();

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Promotions</h1>
          <p className="text-slate-600 mt-2">Manage coupons and discount offers</p>
        </div>
      </div>


      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCoupons}</div>
            <p className="text-xs text-slate-600">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
            <p className="text-xs text-slate-600">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Combined Discount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDiscount}%</div>
            <p className="text-xs text-slate-600">Average value</p>
          </CardContent>
        </Card>
      </div>

      {/* Home Screen Banners */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Home Screen Banners</h2>
          <p className="text-slate-600 mt-1">Manage promotional banners for the mobile app carousel</p>
        </div>
        <Button
          onClick={() => {
            setEditingBanner(null);
            setIsBannerFormOpen(true);
          }}
          className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="w-4 h-4" />
          Add Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <Card key={banner.id} className="overflow-hidden group">
            <div className="aspect-2/1 relative bg-slate-100">
              <img
                src={banner.imageUrl}
                alt={banner.title || 'Banner'}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Badge className={banner.active ? 'bg-green-500' : 'bg-slate-500'}>
                  {banner.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-slate-900 truncate">
                  {banner.title || 'Untitled Banner'}
                </h3>
                {banner.linkTo && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate">{banner.linkTo}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBannerToggle(banner)}
                >
                  {banner.active ? (
                    <ToggleRight className="w-5 h-5 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-slate-400" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditBanner(banner)}
                >
                  <Edit2 className="w-4 h-4 text-slate-600" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Delete Banner</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this banner? This action cannot be undone.
                    </AlertDialogDescription>
                    <div className="flex justify-end gap-2">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteBanner(banner.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
        {banners.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl border-slate-200 bg-slate-50/50">
            <ImageIcon className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No banners uploaded yet</p>
            <Button
              variant="link"
              className="text-amber-600 mt-1"
              onClick={() => setIsBannerFormOpen(true)}
            >
              Add your first banner
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 pt-8 mt-8 flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Coupon Management</h2>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="gap-2 bg-amber-500 hover:bg-amber-600"
        >
          <Plus className="w-4 h-4" />
          New Coupon
        </Button>
      </div>

      {/* Featured Offers Carousel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Featured Offers</CardTitle>
          <CardDescription>Current active promotions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coupons.filter(c => c.active && !isExpired(c.expiry)).map((coupon) => (
              <div
                key={coupon.id}
                className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-amber-600">
                      {coupon.discount}{coupon.type === 'percentage' ? '%' : '₹'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {coupon.type === 'percentage' ? 'Discount' : 'Off'}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    Active
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-600">Code</p>
                    <p className="font-mono font-bold">{coupon.code}</p>
                  </div>
                  <p className="text-xs text-slate-600">
                    Expires: {formatDate(coupon.expiry)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1"
                  onClick={() => handleCopy(coupon.code)}
                >
                  <Copy className="w-3 h-3" />
                  Copy Code
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
          <CardDescription>Manage all promotional codes and discounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => {
                  const expired = isExpired(coupon.expiry);
                  return (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {coupon.discount}{coupon.type === 'percentage' ? '%' : '₹'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {coupon.type === 'percentage' ? 'Percentage' : 'Fixed'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(coupon.expiry)}</TableCell>
                      <TableCell>
                        {expired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : coupon.active ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!expired && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggle(coupon)}
                            >
                              {coupon.active ? (
                                <ToggleRight className="w-4 h-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-slate-400" />
                              )}
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete coupon {coupon.code}? This action cannot be undone.
                              </AlertDialogDescription>
                              <div className="flex justify-end gap-2">
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteCoupon(coupon.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Coupon Form */}
      {isFormOpen && (
        <AddCouponDialog onClose={() => setIsFormOpen(false)} />
      )}

      {/* Banner Form */}
      {isBannerFormOpen && (
        <BannerForm
          banner={editingBanner || undefined}
          onClose={() => {
            setIsBannerFormOpen(false);
            setEditingBanner(null);
          }}
        />
      )}
    </div>
  );
}

function AddCouponDialog({ onClose }: { onClose: () => void }) {
  const { addCoupon } = useData();
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      discount: 0,
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: any) => {
    if (isSubmitting) return;
    
    console.log('Form data:', data);
    setIsSubmitting(true);
    
    try {
      await addCoupon({
        code: data.code.toUpperCase().trim(),
        discount: Number(data.discount),
        type,
        expiry: data.expiry,
        active: true,
      });
      console.log('Coupon added successfully, closing dialog');
      reset();
      onClose();
    } catch (err: any) {
      console.error('Submit error:', err);
      // Toast is already handled in addCoupon, but we could add more here if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Coupon</DialogTitle>
          <DialogDescription>Add a new promotional discount code</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Coupon Code</Label>
            <Input
              id="code"
              placeholder="SAVE10"
              {...register('code', { required: 'Code is required' })}
            />
            {errors.code && <p className="text-sm text-red-600">{errors.code.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount Value</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                max={type === 'percentage' ? 100 : undefined}
                placeholder={type === 'percentage' ? "10" : "100"}
                {...register('discount', { 
                  required: 'Discount is required',
                  min: { value: 0, message: 'Discount cannot be negative' },
                  validate: (val) => {
                    if (type === 'percentage' && val > 100) {
                      return 'Percentage cannot exceed 100%';
                    }
                    return true;
                  }
                })}
              />
              {errors.discount && <p className="text-sm text-red-600">{errors.discount.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(val) => setType(val as 'percentage' | 'fixed')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry Date</Label>
            <Input
              id="expiry"
              type="date"
              {...register('expiry', { required: 'Expiry date is required' })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Coupon'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
