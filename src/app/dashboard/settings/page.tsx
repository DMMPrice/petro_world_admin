'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/lib/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, RotateCcw, Save, Loader2, MapPin, Plus, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { 
    settings, 
    updateSettings, 
    loading, 
    deliveryEstimates, 
    addDeliveryEstimate, 
    deleteDeliveryEstimate 
  } = useData();
  const [formData, setFormData] = useState({
    shipping_info: '',
    return_policy: '',
    shipping_fee: '50',
    shipping_threshold: '999',
  });
  const [newEstimate, setNewEstimate] = useState({
    pincode_prefix: '',
    min_days: 3,
    max_days: 5,
    description: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        shipping_info: settings.shipping_info || '',
        return_policy: settings.return_policy || '',
        shipping_fee: settings.shipping_fee || '50',
        shipping_threshold: settings.shipping_threshold || '999',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSettings(formData);
    } catch (error) {
      console.error('Error in handleSave:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">App Settings</h1>
          <p className="text-muted-foreground">Manage global configurations for your application.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-amber-500 hover:bg-amber-600"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              Global Shipping Info
            </CardTitle>
            <CardDescription>
              This info is displayed on product pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipping_info">Details</Label>
              <textarea
                id="shipping_info"
                rows={4}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. Standard shipping takes 3-5 business days..."
                value={formData.shipping_info}
                onChange={(e) => setFormData(prev => ({ ...prev, shipping_info: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-500" />
              Global Return Policy
            </CardTitle>
            <CardDescription>
              This info is displayed on product pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="return_policy">Details</Label>
              <textarea
                id="return_policy"
                rows={4}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. Easy 7-day return policy for most items..."
                value={formData.return_policy}
                onChange={(e) => setFormData(prev => ({ ...prev, return_policy: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              Shipping Logistics
            </CardTitle>
            <CardDescription>
              Control delivery fees and free shipping thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipping_fee">Default Shipping Fee (₹)</Label>
              <Input
                id="shipping_fee"
                type="number"
                value={formData.shipping_fee}
                onChange={(e) => setFormData(prev => ({ ...prev, shipping_fee: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping_threshold">Free Shipping Above (₹)</Label>
              <Input
                id="shipping_threshold"
                type="number"
                value={formData.shipping_threshold}
                onChange={(e) => setFormData(prev => ({ ...prev, shipping_threshold: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            Pincode Delivery Estimates
          </CardTitle>
          <CardDescription>
            Define delivery timelines based on pincode prefixes. The app will match the longest prefix first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-5 items-end border p-4 rounded-lg bg-slate-50/50">
            <div className="space-y-2">
              <Label htmlFor="prefix">Pincode / Prefix</Label>
              <Input 
                id="prefix"
                placeholder="e.g. 400 or 400076"
                value={newEstimate.pincode_prefix}
                onChange={(e) => setNewEstimate(prev => ({ ...prev, pincode_prefix: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min">Min Days</Label>
              <Input 
                id="min"
                type="number"
                value={newEstimate.min_days === 0 ? '' : newEstimate.min_days}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setNewEstimate(prev => ({ ...prev, min_days: isNaN(val) ? 0 : val }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max">Max Days</Label>
              <Input 
                id="max"
                type="number"
                value={newEstimate.max_days === 0 ? '' : newEstimate.max_days}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setNewEstimate(prev => ({ ...prev, max_days: isNaN(val) ? 0 : val }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Region Name</Label>
              <Input 
                id="desc"
                placeholder="e.g. Mumbai"
                value={newEstimate.description}
                onChange={(e) => setNewEstimate(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <Button 
              onClick={async () => {
                if (!newEstimate.pincode_prefix) return;
                setIsSaving(true);
                try {
                  await addDeliveryEstimate(newEstimate);
                  setNewEstimate({ pincode_prefix: '', min_days: 3, max_days: 5, description: '' });
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving || !newEstimate.pincode_prefix}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add Rule
            </Button>
          </div>

          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="px-4 py-2 text-left font-medium">Pincode Prefix</th>
                  <th className="px-4 py-2 text-left font-medium">Estimate (Days)</th>
                  <th className="px-4 py-2 text-left font-medium">Region</th>
                  <th className="px-4 py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveryEstimates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No pincode rules defined yet. Standard delivery info will be used.
                    </td>
                  </tr>
                ) : (
                  deliveryEstimates.map((estimate) => (
                    <tr key={estimate.id} className="border-b">
                      <td className="px-4 py-2 font-mono">{estimate.pincode_prefix}</td>
                      <td className="px-4 py-2">{estimate.min_days} - {estimate.max_days} days</td>
                      <td className="px-4 py-2">{estimate.description || '-'}</td>
                      <td className="px-4 py-2 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteDeliveryEstimate(estimate.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
