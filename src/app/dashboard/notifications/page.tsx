'use client';

import { useState, useEffect } from 'react';
import { Bell, Send, Users, User, Search, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/lib/data-context';
import { api } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const { customers } = useData();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [type, setType] = useState<'global' | 'individual'>('global');
  const [selectedUser, setSelectedUser] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/admin/notifications');
      setNotifications(data || []);
    } catch {
      // Notifications endpoint may not be available yet
      setNotifications([]);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error('Please fill in all fields');
      return;
    }
    if (type === 'individual' && !selectedUser) {
      toast.error('Please select a user');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/notifications', {
        title,
        message,
        type,
        user_id: type === 'individual' ? selectedUser : null,
      });
      toast.success('Notification sent successfully');
      setTitle('');
      setMessage('');
      setSelectedUser('');
      await fetchNotifications();
    } catch (error: any) {
      console.error('Notification error:', error);
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await api.delete(`/admin/notifications/${id}`);
      toast.success('Notification deleted');
      fetchNotifications();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredNotifications = notifications.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6 min-w-0 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-600 mt-1">Send announcements and personal alerts to users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Notification Form */}
        <Card className="lg:col-span-1 border-slate-200 shadow-sm h-fit">
          <CardHeader>
            <CardTitle>Compose Notification</CardTitle>
            <CardDescription>Send a message to all users or a specific person</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Target Audience</label>
                <Tabs value={type} onValueChange={(v) => setType(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="global" className="gap-2">
                      <Users className="w-4 h-4" />
                      Global
                    </TabsTrigger>
                    <TabsTrigger value="individual" className="gap-2">
                      <User className="w-4 h-4" />
                      Specific
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {type === 'individual' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Select User</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Title</label>
                <Input 
                  placeholder="e.g., New Flash Sale!" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Message</label>
                <Textarea 
                  placeholder="Type your message here..." 
                  className="min-h-[120px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full gap-2 bg-[#F57C00] hover:bg-[#E65100] text-white" 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? 'Sending...' : 'Send Notification'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Notifications List */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>History of sent messages</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search history..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((n) => (
                  <div key={n.id} className="flex items-start justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        n.type === 'global' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {n.type === 'global' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">{n.title}</h4>
                          <Badge variant="outline" className={cn(
                            "text-[10px] uppercase px-1.5 py-0",
                            n.type === 'global' ? "border-amber-200 text-amber-700 bg-amber-50" : "border-blue-200 text-blue-700 bg-blue-50"
                          )}>
                            {n.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(n.created_at), 'PPP p')}
                          </span>
                          {n.type === 'individual' && (
                            <span className="text-slate-500 font-medium">
                              To: {customers.find(c => c.id === n.user_id)?.name || 'Unknown User'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteNotification(n.id)}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500">No notifications found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper for conditional classes
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
