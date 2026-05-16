'use client';

import { useState, useEffect } from 'react';
import { Loader2, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      const data = await apiFetch('/admin/support-tickets');
      setTickets(data || []);
    } catch (e: any) {
      // Support tickets endpoint may not be available yet
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const data = await apiFetch(`/admin/support-tickets/${ticketId}/messages`);
      setMessages(data || []);
    } catch (e: any) {
      setMessages([]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    try {
      await apiFetch(`/admin/support-tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: replyText, is_admin: true }),
      });
      setReplyText('');
      fetchMessages(selectedTicket.id);

      if (selectedTicket.status === 'Open') {
        await apiFetch(`/admin/support-tickets/${selectedTicket.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'In Progress' }),
        });
        fetchTickets();
      }
    } catch (e: any) {
      toast.error('Failed to send message: ' + e.message);
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      await apiFetch(`/admin/support-tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast.success('Status updated');
      fetchTickets();
    } catch (e: any) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Closed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1"/> Closed</Badge>;
      case 'In Progress':
        return <Badge className="bg-orange-100 text-orange-800"><Clock className="w-3 h-3 mr-1"/> In Progress</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800"><MessageSquare className="w-3 h-3 mr-1"/> Open</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-slate-600 mt-2">Manage customer inquiries and requests</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
          <CardDescription>Recent support requests from users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{formatDate(ticket.updated_at || ticket.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {ticket.profiles?.first_name} {ticket.profiles?.last_name}
                        </span>
                        <span className="text-xs text-slate-500">{ticket.profiles?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{ticket.subject || 'No Subject'}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setIsFormOpen(true);
                        }}
                      >
                        Open Chat
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {tickets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No support tickets found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Support Chat: {selectedTicket?.subject || 'No Subject'}</DialogTitle>
            <DialogDescription>
              Conversation with {selectedTicket?.profiles?.first_name || 'the customer'}.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="flex flex-col flex-1 overflow-hidden gap-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-md border text-sm">
                <div className="space-y-1">
                  <p className="text-slate-500 font-medium uppercase text-[10px]">Customer Details</p>
                  <p className="font-semibold text-slate-900">
                    {selectedTicket.profiles?.first_name} {selectedTicket.profiles?.last_name}
                  </p>
                  <p className="text-slate-600">{selectedTicket.profiles?.email}</p>
                  <p className="text-slate-600">{selectedTicket.profiles?.phone_number}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-slate-500 font-medium uppercase text-[10px]">Ticket Info</p>
                  <div className="flex justify-end gap-2 mb-1">
                    <span className="text-slate-500">Status:</span>
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <Select 
                    defaultValue={selectedTicket.status} 
                    onValueChange={updateStatus}
                  >
                    <SelectTrigger className="w-[140px] h-8 ml-auto">
                      <SelectValue placeholder="Change Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 border rounded-md">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${msg.is_admin ? 'items-end' : 'items-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.is_admin 
                          ? 'bg-amber-500 text-white rounded-tr-none' 
                          : 'bg-slate-100 text-slate-900 rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {formatDateTime(msg.created_at)}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response..."
                  className="flex-1 min-h-[80px]"
                />
                <Button 
                  type="submit" 
                  className="bg-amber-500 hover:bg-amber-600 self-end px-6"
                  disabled={!replyText.trim()}
                >
                  Send
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
