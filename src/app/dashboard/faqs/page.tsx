'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/supabase';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const data = await api.get('/admin/faqs');
      setFaqs(data || []);
    } catch (e: any) {
      toast.error('Failed to load FAQs: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (faq: any) => {
    try {
      await api.patch(`/admin/faqs/${faq.id}`, { is_active: !faq.is_active });
      toast.success(`FAQ ${faq.is_active ? 'deactivated' : 'activated'}`);
      fetchFaqs();
    } catch (e: any) {
      toast.error('Update failed: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/faqs/${id}`);
      toast.success('FAQ deleted');
      fetchFaqs();
    } catch (e: any) {
      toast.error('Deletion failed: ' + e.message);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const question = formData.get('question') as string;
    const answer = formData.get('answer') as string;

    try {
      if (editingFaq) {
        await api.patch(`/admin/faqs/${editingFaq.id}`, { question, answer });
        toast.success('FAQ updated');
      } else {
        await api.post('/admin/faqs', { question, answer });
        toast.success('FAQ created');
      }
      setIsFormOpen(false);
      setEditingFaq(null);
      fetchFaqs();
    } catch (e: any) {
      toast.error('Failed to save FAQ: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">FAQs</h1>
          <p className="text-slate-600 mt-2">Manage Frequently Asked Questions</p>
        </div>
        <Button
          onClick={() => {
            setEditingFaq(null);
            setIsFormOpen(true);
          }}
          className="gap-2 bg-amber-500 hover:bg-amber-600"
        >
          <Plus className="w-4 h-4" />
          New FAQ
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All FAQs</CardTitle>
          <CardDescription>Questions and answers visible to users in the app</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Question</TableHead>
                  <TableHead className="w-1/3">Answer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="font-medium truncate max-w-xs">{faq.question}</TableCell>
                    <TableCell className="truncate max-w-xs">{faq.answer}</TableCell>
                    <TableCell>
                      <Badge className={faq.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'} variant="outline">
                        {faq.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(faq)}
                        >
                          {faq.is_active ? (
                            <ToggleRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-slate-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingFaq(faq);
                            setIsFormOpen(true);
                          }}
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
                            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this FAQ?
                            </AlertDialogDescription>
                            <div className="flex justify-end gap-2">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(faq.id)}
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
                ))}
                {faqs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                      No FAQs found. Create one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Edit FAQ' : 'New FAQ'}</DialogTitle>
            <DialogDescription>
              {editingFaq ? 'Update the details below.' : 'Add a new question and answer.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                name="question"
                defaultValue={editingFaq?.question || ''}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                name="answer"
                defaultValue={editingFaq?.answer || ''}
                required
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingFaq ? 'Update' : 'Create'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
