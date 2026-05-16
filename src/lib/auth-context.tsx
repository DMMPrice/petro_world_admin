'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { setIsLoading(false); return; }

    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.role === 'admin') {
          setUser({
            id: data.id,
            email: data.email,
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email,
            role: data.role,
          });
        } else {
          localStorage.removeItem('admin_token');
        }
      })
      .catch(() => localStorage.removeItem('admin_token'))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    if (data.user?.role !== 'admin') throw new Error('Access denied. Admin privileges required.');

    localStorage.setItem('admin_token', data.token);
    setUser({
      id: data.user.id,
      email: data.user.email,
      name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.email,
      role: data.user.role,
    });
    toast.success(`Welcome back, ${data.user.firstName || 'Admin'}!`);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
