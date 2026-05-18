'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Gauge,
  Tag,
  LogOut,
  Menu,
  ShieldCheck,
  Settings,
  HelpCircle,
  MessageSquare,
  Bell,
  FolderOpen,
  MapPin,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    title: 'Products',
    href: '/dashboard/products',
    icon: Package,
  },
  {
    title: 'Categories',
    href: '/dashboard/categories',
    icon: FolderOpen,
  },
  {
    title: 'Orders',
    href: '/dashboard/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Inventory',
    href: '/dashboard/inventory',
    icon: Gauge,
  },
  {
    title: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
  },
  {
    title: 'Addresses',
    href: '/dashboard/addresses',
    icon: MapPin,
  },
  {
    title: 'Promotions',
    href: '/dashboard/promotions',
    icon: Tag,
  },
  {
    title: 'Team',
    href: '/dashboard/team',
    icon: ShieldCheck,
  },
  {
    title: 'FAQs',
    href: '/dashboard/faqs',
    icon: HelpCircle,
  },
  {
    title: 'Support',
    href: '/dashboard/support',
    icon: MessageSquare,
  },
  {
    title: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(true);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <aside
        className={cn(
          'h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 z-40 flex flex-col',
          open ? 'w-64' : 'w-20'
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          {open && (
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="PETRO WORLD Logo" className="w-10 h-10 object-contain" />
              <span className="font-bold text-white text-lg">PETRO WORLD</span>
            </div>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-[#F57C00] text-white shadow-lg shadow-orange-900/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 shrink-0 transition-transform duration-200",
                  !isActive && "group-hover:scale-110"
                )} />
                {open && <span className="text-sm font-medium whitespace-nowrap">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm shrink-0">
          {open && user && (
            <div className="px-2 mb-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">
                Logged in as
              </p>
              <p className="text-sm text-slate-200 font-medium truncate">
                {user.name}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 text-sm group",
              !open && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
            {open && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

    </>
  );
}
