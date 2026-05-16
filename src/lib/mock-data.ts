// Mock data for the PETRO WORLD Admin Panel
export interface Product {
  id: string;
  name: string;
  category: string;
  category_id?: string;
  sub_category_id?: string;
  sub_category_name?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  price: number;
  stock: number;
  image?: string;
  gallery?: string[];
  description?: string;
  discount_type?: 'percentage' | 'fixed' | null;
  discount_value?: number | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  total: number;
  status: 'ordered' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'canceled' | 'returned' | 'awaitingPayment';
  date: string;
  items: number;
  trackingNumber?: string;
  shippingLabelUrl?: string;
  courierStatus?: string;
  shiprocketOrderId?: string;
  shipmentId?: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  order_items?: any[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  role: 'customer' | 'admin';
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  expiry: string;
  active: boolean;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  linkTo?: string;
  active: boolean;
}

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Unleaded 95',
    category: 'Fuel',
    price: 2.45,
    stock: 5000,
  },
  {
    id: '2',
    name: 'Unleaded 98',
    category: 'Fuel',
    price: 2.65,
    stock: 3200,
  },
  {
    id: '3',
    name: 'Diesel',
    category: 'Fuel',
    price: 2.35,
    stock: 4500,
  },
  {
    id: '4',
    name: 'LPG',
    category: 'Gas',
    price: 1.85,
    stock: 2000,
  },
  {
    id: '5',
    name: 'Motor Oil 5W-30',
    category: 'Lubricants',
    price: 8.99,
    stock: 450,
  },
  {
    id: '6',
    name: 'Brake Fluid DOT 4',
    category: 'Maintenance',
    price: 12.50,
    stock: 320,
  },
  {
    id: '7',
    name: 'Car Wash Shampoo',
    category: 'Detailing',
    price: 6.99,
    stock: 150,
  },
  {
    id: '8',
    name: 'Air Filter',
    category: 'Maintenance',
    price: 15.00,
    stock: 85,
  },
];

export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'PW-2024-001',
    customerId: 'c1',
    customerName: 'John Smith',
    total: 125.50,
    status: 'delivered',
    date: '2024-04-20',
    items: 3,
  },
  {
    id: '2',
    orderNumber: 'PW-2024-002',
    customerId: 'c2',
    customerName: 'Sarah Johnson',
    total: 89.99,
    status: 'shipped',
    date: '2024-04-22',
    items: 2,
  },
  {
    id: '3',
    orderNumber: 'PW-2024-003',
    customerId: 'c3',
    customerName: 'Mike Wilson',
    total: 245.00,
    status: 'processing',
    date: '2024-04-24',
    items: 5,
  },
  {
    id: '4',
    orderNumber: 'PW-2024-004',
    customerId: 'c4',
    customerName: 'Emily Davis',
    total: 56.75,
    status: 'pending',
    date: '2024-04-25',
    items: 1,
  },
  {
    id: '5',
    orderNumber: 'PW-2024-005',
    customerId: 'c5',
    customerName: 'Robert Brown',
    total: 312.00,
    status: 'delivered',
    date: '2024-04-18',
    items: 8,
  },
];

export const mockCoupons: Coupon[] = [
  {
    id: '1',
    code: 'SAVE10',
    discount: 10,
    type: 'percentage',
    expiry: '2024-12-31',
    active: true,
  },
  {
    id: '2',
    code: 'FUEL5',
    discount: 5,
    type: 'fixed',
    expiry: '2024-06-30',
    active: true,
  },
  {
    id: '3',
    code: 'SUMMER20',
    discount: 20,
    type: 'percentage',
    expiry: '2024-08-31',
    active: false,
  },
];

// Analytics mock data
export const mockAnalytics = {
  totalRevenue: 45230.50,
  totalOrders: 324,
  averageOrderValue: 139.70,
  totalCustomers: 128,
  lowStockItems: 12,
  pendingOrders: 7,
};

export const mockChartData = [
  { name: 'Jan', revenue: 4000, orders: 24 },
  { name: 'Feb', revenue: 3000, orders: 18 },
  { name: 'Mar', revenue: 2000, orders: 28 },
  { name: 'Apr', revenue: 2780, orders: 39 },
  { name: 'May', revenue: 1890, orders: 48 },
  { name: 'Jun', revenue: 2390, orders: 52 },
];
