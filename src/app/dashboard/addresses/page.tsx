'use client';

import { useEffect, useState } from 'react';
import { Edit2, Loader2, Trash2 } from 'lucide-react';
import { api } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

type Address = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Address | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setAddresses((await api.get('/admin/addresses')) || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const saveAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await api.patch(`/admin/addresses/${editing.id}`, {
        name: String(formData.get('name') || '').trim(),
        phone: String(formData.get('phone') || '').trim() || null,
        address_line1: String(formData.get('address_line1') || '').trim(),
        address_line2: String(formData.get('address_line2') || '').trim() || null,
        city: String(formData.get('city') || '').trim(),
        state: String(formData.get('state') || '').trim(),
        pincode: String(formData.get('pincode') || '').trim(),
        is_default: isDefault,
      });
      toast.success('Address updated');
      setEditing(null);
      await loadAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update address');
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await api.delete(`/admin/addresses/${id}`);
      toast.success('Address deleted');
      await loadAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete address');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Addresses</h1>
        <p className="mt-2 text-slate-600">Review and update customer delivery addresses.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Addresses</CardTitle>
          <CardDescription>{addresses.length} saved addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Receiver</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addresses.map((address) => (
                <TableRow key={address.id}>
                  <TableCell>
                    <div className="font-medium">
                      {`${address.first_name || ''} ${address.last_name || ''}`.trim() ||
                        address.email?.split('@')[0] ||
                        'Customer'}
                    </div>
                    <div className="text-xs text-slate-500">{address.email}</div>
                  </TableCell>
                  <TableCell>
                    <div>{address.name}</div>
                    <div className="text-xs text-slate-500">{address.phone || '-'}</div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    {address.address_line1}
                    {address.address_line2 ? `, ${address.address_line2}` : ''}, {address.city}, {address.state} - {address.pincode}
                  </TableCell>
                  <TableCell>
                    <Badge variant={address.is_default ? 'default' : 'outline'}>
                      {address.is_default ? 'Default' : 'Secondary'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(address);
                          setIsDefault(address.is_default);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteAddress(address.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {addresses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                    No addresses found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
            <DialogDescription>Update the saved delivery address.</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={saveAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Receiver Name</Label>
                  <Input id="name" name="name" defaultValue={editing.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" defaultValue={editing.phone || ''} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input id="address_line1" name="address_line1" defaultValue={editing.address_line1} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input id="address_line2" name="address_line2" defaultValue={editing.address_line2 || ''} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" defaultValue={editing.city} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" defaultValue={editing.state} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" name="pincode" defaultValue={editing.pincode} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_default">Default address</Label>
                <Switch
                  id="is_default"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
              </div>
              <Button className="w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Save Address'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
