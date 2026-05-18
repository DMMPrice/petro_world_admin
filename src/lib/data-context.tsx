'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Product, Order, Customer, Coupon, Banner } from './mock-data';
import { api } from './supabase';
import { toast } from 'sonner';
import { useAuth } from './auth-context';

interface DataContextType {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<void>;

  // Categories
  categories: { id: string; title: string }[];
  addCategory: (title: string) => Promise<boolean>;
  updateCategory: (id: string, title: string) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<void>;

  // Sub-categories
  subCategories: { id: string; name: string; category_id: string }[];
  addSubCategory: (title: string, category_id: string) => Promise<boolean>;
  updateSubCategory: (id: string, title: string, category_id: string) => Promise<boolean>;
  deleteSubCategory: (id: string) => Promise<void>;

  // Orders
  orders: Order[];
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  updateOrderShipping: (id: string, shipping: Partial<Pick<Order, 'trackingNumber' | 'shippingLabelUrl' | 'courierStatus'>>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;

  // Customers
  customers: Customer[];
  admins: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  inviteAdmin: (email: string, name: string) => Promise<void>;
  revokeAdmin: (id: string) => Promise<void>;

  // Coupons
  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'id'>) => Promise<boolean>;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;

  // Banners
  banners: Banner[];
  addBanner: (banner: Omit<Banner, 'id'>) => Promise<boolean>;
  updateBanner: (id: string, banner: Partial<Banner>) => Promise<boolean>;
  deleteBanner: (id: string) => Promise<void>;

  // Delivery Estimates
  deliveryEstimates: { id: string; pincode_prefix: string; min_days: number; max_days: number; description: string }[];
  addDeliveryEstimate: (estimate: { pincode_prefix: string; min_days: number; max_days: number; description: string }) => Promise<void>;
  updateDeliveryEstimate: (id: string, estimate: Partial<{ pincode_prefix: string; min_days: number; max_days: number; description: string }>) => Promise<void>;
  deleteDeliveryEstimate: (id: string) => Promise<void>;

  settings: Record<string, string>;
  updateSettings: (newSettings: Record<string, string>) => Promise<void>;

  loading: boolean;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [admins, setAdmins] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categoriesList, setCategoriesList] = useState<{ id: string; title: string }[]>([]);
  const [subCategoriesList, setSubCategoriesList] = useState<{ id: string; name: string; category_id: string }[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [deliveryEstimates, setDeliveryEstimates] = useState<{ id: string; pincode_prefix: string; min_days: number; max_days: number; description: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get('/admin/categories'),
        api.get('/admin/sub-categories'),
        api.get('/admin/products'),
        api.get('/admin/orders'),
        api.get('/admin/users'),
        api.get('/admin/coupons'),
        api.get('/admin/banners'),
        api.get('/admin/settings'),
        api.get('/admin/delivery-estimates'),
      ]);

      const [
        categoriesRes,
        subCategoriesRes,
        productsRes,
        ordersRes,
        usersRes,
        couponsRes,
        bannersRes,
        settingsRes,
        deliveryEstimatesRes,
      ] = results;

      const categoriesData = categoriesRes.status === 'fulfilled' ? (categoriesRes.value || []) : [];
      const subCategoriesData = subCategoriesRes.status === 'fulfilled' ? (subCategoriesRes.value || []) : [];
      const productsData = productsRes.status === 'fulfilled' ? (productsRes.value || []) : [];
      const ordersData = ordersRes.status === 'fulfilled' ? (ordersRes.value || []) : [];
      const usersData = usersRes.status === 'fulfilled' ? (usersRes.value || []) : [];
      const couponsData = couponsRes.status === 'fulfilled' ? (couponsRes.value || []) : [];
      const bannersData = bannersRes.status === 'fulfilled' ? (bannersRes.value || []) : [];
      const settingsData = settingsRes.status === 'fulfilled' ? (settingsRes.value || {}) : {};
      const deliveryEstimatesData = deliveryEstimatesRes.status === 'fulfilled' ? (deliveryEstimatesRes.value || []) : [];

      const cats = (categoriesData as any[]).map((c: any) => ({ id: c.id, title: c.title }));
      setCategoriesList(cats);

      const subCats = (subCategoriesData as any[]).map((sc: any) => ({
        id: sc.id,
        name: sc.title || sc.name,
        category_id: sc.category_id,
      }));
      setSubCategoriesList(subCats);

      const categoryMap = cats.reduce((acc: Record<string, string>, cat: { id: string; title: string }) => {
        acc[cat.id] = cat.title;
        return acc;
      }, {});

      const subCategoryMap = subCats.reduce((acc: Record<string, string>, sc: { id: string; name: string }) => {
        acc[sc.id] = sc.name;
        return acc;
      }, {});

      setProducts((productsData as any[]).map((p: any) => {
        const gallery = Array.from(
          new Set(
            [
              p.image_url,
              ...(Array.isArray(p.gallery_urls) ? p.gallery_urls : []),
              ...(Array.isArray(p.images) ? p.images : []),
            ].filter(Boolean)
          )
        ) as string[];

        return {
          id: p.id,
          name: p.title,
          category: categoryMap[p.category_id] || 'Uncategorized',
          category_id: p.category_id,
          sub_category_id: p.sub_category_id,
          sub_category_name: subCategoryMap[p.sub_category_id] || '',
          price: Number(p.price),
          stock: p.stock_quantity,
          image: gallery[0],
          gallery,
          description: p.description,
          discount_type: p.discount_type,
          discount_value: Number(p.discount_value),
          price_after_discount: Number(p.price_after_discount),
          discount_percent: p.discount_percent,
          weight: p.weight,
          length: p.length,
          width: p.width,
          height: p.height,
        };
      }));

      setOrders((ordersData as any[]).map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number || `ORD-${o.id.slice(0, 8)}`,
        customerId: o.user_id,
        customerName: o.first_name
          ? `${o.first_name} ${o.last_name || ''}`.trim()
          : o.user_email || 'Unknown Customer',
        total: o.total_amount,
        status: (o.status || 'ordered').toLowerCase() as Order['status'],
        date: new Date(o.created_at).toISOString().split('T')[0],
        items: o.order_items?.length || 0,
        order_items: o.order_items || [],
        trackingNumber: o.tracking_number,
        shippingLabelUrl: o.shipping_label_url,
        courierStatus: o.courier_status,
        shippingAddress: o.address_line1,
        city: o.city,
        state: o.state,
        pincode: o.pincode,
      })));

      const allUsers: any[] = usersData as any[];
      const processedCustomers = allUsers
        .filter((u: any) => u.role === 'customer')
        .map((u: any) => ({
          id: u.id,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email?.split('@')[0] || 'No Name',
          email: u.email || 'N/A',
          phone: u.phone || 'N/A',
          totalOrders: 0,
          totalSpent: 0,
          joinDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : 'N/A',
          role: 'customer' as const,
        }));

      const processedAdmins = allUsers
        .filter((u: any) => u.role === 'admin')
        .map((u: any) => ({
          id: u.id,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email?.split('@')[0] || 'No Name',
          email: u.email || 'N/A',
          phone: u.phone || 'N/A',
          totalOrders: 0,
          totalSpent: 0,
          joinDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : 'N/A',
          role: 'admin' as const,
        }));

      setCustomers(processedCustomers);
      setAdmins(processedAdmins);

      setCoupons((couponsData as any[]).map((c: any) => ({
        id: c.id,
        code: c.code,
        discount: c.discount_value ?? c.discount,
        type: (c.discount_type || c.type || 'percentage') as 'percentage' | 'fixed',
        expiry: new Date(c.expiry).toISOString().split('T')[0],
        active: c.active,
      })));

      setBanners((bannersData as any[]).map((b: any) => ({
        id: b.id,
        imageUrl: b.image_url,
        title: b.title,
        active: b.active,
      })));

      // settings may come as object or array of {key, value}
      if (Array.isArray(settingsData)) {
        const settingsObj = (settingsData as any[]).reduce((acc: Record<string, string>, s: any) => {
          acc[s.key] = s.value;
          return acc;
        }, {});
        setSettings(settingsObj);
      } else {
        setSettings(settingsData as Record<string, string>);
      }

      setDeliveryEstimates(deliveryEstimatesData as any[]);
    } catch (error) {
      console.error('Unexpected error fetching dashboard data:', error);
      toast.error('Unable to load some dashboard information.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    if (user) fetchData();
  }, [fetchData, user?.id]);

  // ── Categories ────────────────────────────────────────────────────────────
  const addCategory = async (title: string): Promise<boolean> => {
    try {
      await api.post('/admin/categories', { title });
      toast.success('Category created');
      await fetchData(true);
      return true;
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to create category');
      return false;
    }
  };

  const updateCategory = async (id: string, title: string): Promise<boolean> => {
    try {
      await api.patch(`/admin/categories/${id}`, { title });
      toast.success('Category updated');
      await fetchData(true);
      return true;
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to update category');
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deleted');
      await fetchData(true);
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  // ── Sub-categories ────────────────────────────────────────────────────────
  const addSubCategory = async (title: string, category_id: string): Promise<boolean> => {
    try {
      await api.post('/admin/sub-categories', { title, category_id });
      toast.success('Subcategory created');
      await fetchData(true);
      return true;
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to create subcategory');
      return false;
    }
  };

  const updateSubCategory = async (id: string, title: string, category_id: string): Promise<boolean> => {
    try {
      await api.patch(`/admin/sub-categories/${id}`, { title, category_id });
      toast.success('Subcategory updated');
      await fetchData(true);
      return true;
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to update subcategory');
      return false;
    }
  };

  const deleteSubCategory = async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/sub-categories/${id}`);
      toast.success('Subcategory deleted');
      await fetchData(true);
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete subcategory');
    }
  };

  // ── Products ──────────────────────────────────────────────────────────────
  const addProduct = async (product: Omit<Product, 'id'>): Promise<boolean> => {
    try {
      const categoryId = (product.category_id && product.category_id !== '')
        ? product.category_id
        : (categoriesList.find(c => c.title === product.category)?.id || null);

      let priceAfterDiscount = product.price;
      let discountPercent = 0;

      if (product.discount_type === 'percentage') {
        discountPercent = Math.round(product.discount_value || 0);
        priceAfterDiscount = Number((product.price * (1 - discountPercent / 100)).toFixed(2));
      } else if (product.discount_type === 'fixed') {
        const discountVal = product.discount_value || 0;
        priceAfterDiscount = Math.max(0, Number((product.price - discountVal).toFixed(2)));
        discountPercent = product.price > 0 ? Math.round(((product.price - priceAfterDiscount) / product.price) * 100) : 0;
      }

      await api.post('/admin/products', {
        title: product.name,
        category_id: categoryId,
        sub_category_id: (product.sub_category_id && product.sub_category_id !== '') ? product.sub_category_id : null,
        price: product.price,
        image_url: product.image,
        description: product.description,
        stock_quantity: product.stock,
        discount_type: product.discount_type || null,
        discount_value: product.discount_value || 0,
        price_after_discount: priceAfterDiscount,
        discount_percent: discountPercent,
        gallery_urls: product.gallery && product.gallery.length > 0 ? product.gallery : [product.image],
        weight: product.weight || 0.5,
        length: product.length || 10,
        width: product.width || 10,
        height: product.height || 10,
      });

      toast.success('Product added successfully');
      await refreshData();
      return true;
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred while saving');
      return false;
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>): Promise<boolean> => {
    try {
      const currentProduct = products.find(p => p.id === id);
      const pPrice = product.price ?? currentProduct?.price ?? 0;
      const pType = product.discount_type !== undefined ? product.discount_type : (currentProduct?.discount_type ?? null);
      const pValue = (product.discount_value !== undefined ? product.discount_value : (currentProduct?.discount_value ?? 0)) ?? 0;

      let priceAfterDiscount = pPrice;
      let discountPercent = 0;

      if (pType === 'percentage') {
        discountPercent = Math.round(pValue);
        priceAfterDiscount = Number((pPrice * (1 - discountPercent / 100)).toFixed(2));
      } else if (pType === 'fixed') {
        priceAfterDiscount = Math.max(0, Number((pPrice - pValue).toFixed(2)));
        discountPercent = pPrice > 0 ? Math.round(((pPrice - priceAfterDiscount) / pPrice) * 100) : 0;
      }

      const updateData: Record<string, unknown> = {
        ...(product.name && { title: product.name }),
        ...(product.price !== undefined && { price: product.price }),
        ...(product.stock !== undefined && { stock_quantity: product.stock }),
        ...(product.image && { image_url: product.image }),
        ...(product.gallery && { gallery_urls: product.gallery }),
        ...(product.description !== undefined && { description: product.description }),
        ...(product.category_id !== undefined && { category_id: product.category_id || null }),
        ...(product.sub_category_id !== undefined && { sub_category_id: product.sub_category_id || null }),
        discount_type: pType,
        discount_value: pValue,
        price_after_discount: priceAfterDiscount,
        discount_percent: discountPercent,
        ...(product.weight !== undefined && { weight: product.weight }),
        ...(product.length !== undefined && { length: product.length }),
        ...(product.width !== undefined && { width: product.width }),
        ...(product.height !== undefined && { height: product.height }),
      };

      await api.patch(`/admin/products/${id}`, updateData);

      toast.success('Product updated successfully');
      await refreshData();
      return true;
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred while updating');
      return false;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Product deleted');
      await refreshData();
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  // ── Orders ────────────────────────────────────────────────────────────────
  const addOrder = async (_order: Omit<Order, 'id'>) => {
    toast.info('Order creation not implemented for Admin Panel');
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      await api.patch(`/admin/orders/${id}`, { status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Order status updated');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  const updateOrderShipping = async (id: string, shipping: Partial<Pick<Order, 'trackingNumber' | 'shippingLabelUrl' | 'courierStatus'>>) => {
    try {
      await api.patch(`/admin/orders/${id}`, {
        tracking_number: shipping.trackingNumber,
        shipping_label_url: shipping.shippingLabelUrl,
        courier_status: shipping.courierStatus,
      });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...shipping } : o));
      toast.success('Shipping information updated');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to update shipping');
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await api.delete(`/admin/orders/${id}`);
      setOrders(prev => prev.filter(o => o.id !== id));
      toast.success('Order deleted');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete order');
    }
  };

  // ── Customers / Users ─────────────────────────────────────────────────────
  const addCustomer = async (_customer: Omit<Customer, 'id'>) => {
    toast.info('Customer creation usually happens via Auth');
  };

  const updateCustomer = async (id: string, customer: Partial<Customer>) => {
    try {
      const [firstName, ...lastNames] = (customer.name || '').split(' ');
      await api.patch(`/admin/users/${id}`, {
        firstName,
        lastName: lastNames.join(' '),
        phone: customer.phone,
      });
      toast.success('Customer updated');
      await refreshData();
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to update customer');
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success('User deleted');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const inviteAdmin = async (email: string, name: string) => {
    try {
      const [firstName, ...rest] = name.split(' ');
      await api.post('/admin/users', {
        email,
        firstName,
        lastName: rest.join(' '),
        role: 'admin',
        password: 'Admin@123',
      });
      await refreshData();
      toast.success(`Admin invite sent to ${email}`);
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to create admin');
      throw err;
    }
  };

  const revokeAdmin = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}`, { role: 'customer' });
      await refreshData();
      toast.success('Admin access revoked');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke admin');
    }
  };

  // ── Coupons ───────────────────────────────────────────────────────────────
  const addCoupon = async (coupon: Omit<Coupon, 'id'>): Promise<boolean> => {
    try {
      await api.post('/admin/coupons', {
        code: coupon.code,
        discount_value: coupon.discount,
        discount_type: coupon.type,
        expiry: coupon.expiry,
        active: coupon.active,
      });
      toast.success('Coupon created successfully');
      await fetchData(true);
      return true;
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to create coupon');
      return false;
    }
  };

  const updateCoupon = async (id: string, coupon: Partial<Coupon>) => {
    try {
      await api.patch(`/admin/coupons/${id}`, {
        code: coupon.code,
        discount_value: coupon.discount,
        discount_type: coupon.type,
        expiry: coupon.expiry,
        active: coupon.active,
      });
      toast.success('Coupon updated');
      await fetchData(true);
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to update coupon');
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      await api.delete(`/admin/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success('Coupon deleted');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete coupon');
    }
  };

  // ── Banners ───────────────────────────────────────────────────────────────
  const addBanner = async (banner: Omit<Banner, 'id'>): Promise<boolean> => {
    try {
      await api.post('/admin/banners', {
        image_url: banner.imageUrl,
        title: banner.title,
        active: banner.active,
      });
      toast.success('Banner added');
      await fetchData(true);
      return true;
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to create banner');
      return false;
    }
  };

  const updateBanner = async (id: string, banner: Partial<Banner>): Promise<boolean> => {
    try {
      await api.patch(`/admin/banners/${id}`, {
        image_url: banner.imageUrl,
        title: banner.title,
        active: banner.active,
      });
      toast.success('Banner updated');
      await fetchData(true);
      return true;
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to update banner');
      return false;
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      await api.delete(`/admin/banners/${id}`);
      setBanners(prev => prev.filter(b => b.id !== id));
      toast.success('Banner deleted');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete banner');
    }
  };

  // ── Settings ──────────────────────────────────────────────────────────────
  const updateSettings = async (newSettings: Record<string, string>) => {
    try {
      const updated = await api.patch('/admin/settings', newSettings);
      if (updated && typeof updated === 'object' && !Array.isArray(updated)) {
        setSettings(updated as Record<string, string>);
      } else {
        setSettings(prev => ({ ...prev, ...newSettings }));
      }
      toast.success('Settings updated successfully');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to update settings');
    }
  };

  // ── Delivery Estimates ────────────────────────────────────────────────────
  const addDeliveryEstimate = async (estimate: { pincode_prefix: string; min_days: number; max_days: number; description: string }) => {
    try {
      const created = await api.post('/admin/delivery-estimates', estimate);
      setDeliveryEstimates(prev => [...prev, created]);
      toast.success('Delivery estimate added');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to add delivery estimate');
    }
  };

  const updateDeliveryEstimate = async (id: string, estimate: Partial<{ pincode_prefix: string; min_days: number; max_days: number; description: string }>) => {
    try {
      const updated = await api.patch(`/admin/delivery-estimates/${id}`, estimate);
      setDeliveryEstimates(prev => prev.map(d => d.id === id ? updated : d));
      toast.success('Delivery estimate updated');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to update delivery estimate');
    }
  };

  const deleteDeliveryEstimate = async (id: string) => {
    try {
      await api.delete(`/admin/delivery-estimates/${id}`);
      setDeliveryEstimates(prev => prev.filter(d => d.id !== id));
      toast.success('Delivery estimate deleted');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete delivery estimate');
    }
  };

  return (
    <DataContext.Provider value={{
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      orders,
      addOrder,
      updateOrderStatus,
      updateOrderShipping,
      deleteOrder,
      customers,
      admins,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      inviteAdmin,
      revokeAdmin,
      coupons,
      addCoupon,
      updateCoupon,
      deleteCoupon,
      banners,
      addBanner,
      updateBanner,
      deleteBanner,
      settings,
      updateSettings,
      deliveryEstimates,
      addDeliveryEstimate,
      updateDeliveryEstimate,
      deleteDeliveryEstimate,
      categories: categoriesList,
      addCategory,
      updateCategory,
      deleteCategory,
      subCategories: subCategoriesList,
      addSubCategory,
      updateSubCategory,
      deleteSubCategory,
      loading,
      refreshData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
