'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus, Trash2, Edit2, Loader2, Search, Filter,
  ArrowUpDown, ChevronDown, X, CheckSquare2,
  Minus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useData } from '@/lib/data-context';
import { Product } from '@/lib/mock-data';
import { ProductForm } from '@/components/product-form';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// ── Checkbox ──────────────────────────────────────────────────────────────────
function Checkbox({
  checked,
  indeterminate,
  onChange,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={cn(
        'w-4.5 h-4.5 rounded flex items-center justify-center border-2 transition-all duration-150 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1',
        checked || indeterminate
          ? 'bg-amber-500 border-amber-500 text-white'
          : 'bg-white border-slate-300 hover:border-amber-400',
        className,
      )}
    >
      {indeterminate ? (
        <Minus className="w-2.5 h-2.5 stroke-[3]" />
      ) : checked ? (
        <svg className="w-2.5 h-2.5 stroke-[3]" viewBox="0 0 12 12" fill="none" stroke="currentColor">
          <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </button>
  );
}

export default function ProductsPage() {
  const { products, deleteProduct, loading, categories } = useData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'newest'>('newest');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 whenever filters / sort change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, categoryFilter, sortBy, pageSize]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'price': {
          const pa = a.discount_type === 'fixed' ? a.price - (a.discount_value || 0) : a.discount_type === 'percentage' ? a.price * (1 - (a.discount_value || 0) / 100) : a.price;
          const pb = b.discount_type === 'fixed' ? b.price - (b.discount_value || 0) : b.discount_type === 'percentage' ? b.price * (1 - (b.discount_value || 0) / 100) : b.price;
          return pa - pb;
        }
        case 'stock': return a.stock - b.stock;
        default: return 0;
      }
    });
    return result;
  }, [products, searchQuery, categoryFilter, sortBy]);

  // ── Pagination derived values ────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safePage, pageSize]);

  // ── Selection helpers ────────────────────────────────────────────────────────
  // Selection only operates on the current page's visible rows
  const visibleIds = useMemo(() => new Set(paginatedProducts.map((p) => p.id)), [paginatedProducts]);

  const selectedVisible = useMemo(
    () => filteredProducts.filter((p) => selectedIds.has(p.id)),
    [filteredProducts, selectedIds]
  );

  const allVisibleSelected = visibleIds.size > 0 && selectedVisible.length === visibleIds.size;
  const someVisibleSelected = selectedVisible.length > 0 && !allVisibleSelected;

  const toggleSelectAll = useCallback(() => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...visibleIds]));
    }
  }, [allVisibleSelected, visibleIds]);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const clearSelection = () => setSelectedIds(new Set());

  // ── Bulk delete ──────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all([...selectedIds].map((id) => deleteProduct(id)));
      clearSelection();
    } finally {
      setIsBulkDeleting(false);
      setBulkDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const handleEdit = (product: Product) => { setEditingProduct(product); setIsFormOpen(true); };
  const handleFormClose = () => { setIsFormOpen(false); setEditingProduct(null); };

  const getStockStatus = (stock: number) => {
    if (stock < 50) return { label: 'Critical', variant: 'destructive' as const };
    if (stock < 100) return { label: 'Low', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const clearFilters = () => { setSearchQuery(''); setCategoryFilter('all'); setSortBy('newest'); };

  const selectionCount = selectedIds.size;

  return (
    <div className="p-8 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up stagger-1">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600 mt-1">Manage your fuel and automotive products</p>
        </div>
        <Button
          onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}
          className="gap-2 bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-200 transition-all hover:shadow-amber-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-fade-in-up stagger-2">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or category..."
            className="pl-10 pr-10 border-slate-200 focus:border-amber-500 focus:ring-amber-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] border-slate-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.title}>{cat.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-slate-200 min-w-[140px]">
                <ArrowUpDown className="w-4 h-4" />
                Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('newest')}>Newest First</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name')}>Name (A-Z)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('price')}>Price (Lowest First)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('stock')}>Stock (Lowest First)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(searchQuery || categoryFilter !== 'all' || sortBy !== 'newest') && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 gap-1">Reset</Button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden animate-fade-in-up stagger-3">
        {/* Card Header — switches between normal and bulk-selection mode */}
        <CardHeader className="border-b border-slate-200 transition-colors duration-200 bg-slate-50/50">
          {selectionCount > 0 ? (
            /* ── Bulk action bar ── */
            <div className="flex items-center justify-between animate-fade-in-up">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                  <CheckSquare2 className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700">
                    {selectionCount} selected
                  </span>
                </div>
                <button
                  onClick={clearSelection}
                  className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
                >
                  Clear selection
                </button>
              </div>

              <AlertDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2 bg-red-600 hover:bg-red-700 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete {selectionCount} {selectionCount === 1 ? 'product' : 'products'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md p-0 overflow-hidden gap-0">
                  {/* Dialog header */}
                  <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <AlertDialogTitle className="text-base font-semibold leading-tight">
                        Delete {selectionCount} {selectionCount === 1 ? 'product' : 'products'}?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-xs text-slate-500 mt-0.5">
                        This cannot be undone. All data will be permanently removed.
                      </AlertDialogDescription>
                    </div>
                  </div>

                  {/* Product list — scrollable, shows all */}
                  <div className="px-5 py-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Products to be deleted ({selectionCount})
                    </p>
                    <div className="relative">
                      <div className="max-h-[260px] overflow-y-auto custom-scrollbar rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white">
                        {selectedVisible.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                            <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                              {p.image
                                ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                : <div className="w-full h-full bg-slate-100" />
                              }
                            </div>
                            <span className="text-sm text-slate-800 font-medium leading-tight">{p.name}</span>
                          </div>
                        ))}
                      </div>
                      {/* Fade-out hint when list is tall enough to scroll */}
                      {selectionCount > 5 && (
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/90 to-transparent rounded-b-lg pointer-events-none" />
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end gap-2 px-5 py-4 bg-slate-50 border-t border-slate-100">
                    <AlertDialogCancel className="border-slate-200 h-9" disabled={isBulkDeleting}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      disabled={isBulkDeleting}
                      className="bg-red-600 hover:bg-red-700 text-white gap-2 min-w-[130px] h-9"
                    >
                      {isBulkDeleting ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting…</>
                      ) : (
                        <><Trash2 className="w-3.5 h-3.5" /> Delete {selectionCount === 1 ? 'product' : 'all'}</>
                      )}
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            /* ── Normal header ── */
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>
                  {filteredProducts.length === 0
                    ? 'No products match your filters'
                    : `Showing ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredProducts.length)} of ${filteredProducts.length} products`}
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-white">
                {filteredProducts.length} Results
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filteredProducts.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    {/* Select-all checkbox */}
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        checked={allVisibleSelected}
                        indeterminate={someVisibleSelected}
                        onChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Price</TableHead>
                    <TableHead className="font-semibold">Discount</TableHead>
                    <TableHead className="font-semibold">Stock</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product, idx) => {
                    const status = getStockStatus(product.stock);
                    const isSelected = selectedIds.has(product.id);
                    return (
                      <TableRow
                        key={product.id}
                        onClick={() => toggleRow(product.id)}
                        className={cn(
                          'transition-colors duration-150 animate-fade-in-up cursor-pointer',
                          isSelected
                            ? 'bg-amber-50/70 hover:bg-amber-50'
                            : 'hover:bg-slate-50/60'
                        )}
                        style={{ animationDelay: `${Math.min(idx * 40, 480)}ms` }}
                      >
                        {/* Row checkbox */}
                        <TableCell className="w-10 pl-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={isSelected} onChange={() => toggleRow(product.id)} />
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border p-1 transition-all duration-150',
                                isSelected ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-100'
                              )}
                            >
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <Plus className="w-4 h-4 opacity-20" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">{product.name}</span>
                              {(product.gallery?.length || 0) > 1 && (
                                <span className="text-xs text-slate-500">
                                  {product.gallery!.length} images
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="font-normal border-slate-200">
                            {product.category}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            {product.discount_type ? (
                              <>
                                <span className="text-xs text-slate-400 line-through font-medium">
                                  ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-sm font-bold text-emerald-600">
                                  ₹{(product.discount_type === 'percentage'
                                    ? product.price * (1 - (product.discount_value || 0) / 100)
                                    : product.price - (product.discount_value || 0)
                                  ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-slate-900">
                                ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {product.discount_type ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 font-bold px-2 py-0.5">
                              {product.discount_type === 'percentage'
                                ? `${product.discount_value}% OFF`
                                : `₹${product.discount_value} OFF`}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">None</span>
                          )}
                        </TableCell>

                        <TableCell className="font-medium text-slate-700">
                          {product.stock.toLocaleString()}
                        </TableCell>

                        <TableCell>
                          <Badge variant={status.variant} className="font-semibold">{status.label}</Badge>
                        </TableCell>

                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(product)}
                              className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all hover:scale-110 active:scale-95"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all hover:scale-110 active:scale-95"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete{' '}
                                  <span className="font-bold text-slate-900">{product.name}</span>? This action cannot be undone.
                                </AlertDialogDescription>
                                <div className="flex justify-end gap-2 pt-4">
                                  <AlertDialogCancel className="border-slate-200">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteProduct(product.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Delete Product
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
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No products found</h3>
                <p className="text-slate-500 max-w-sm mt-1">
                  {searchQuery
                    ? `We couldn't find any products matching "${searchQuery}" in ${categoryFilter === 'all' ? 'any category' : categoryFilter}.`
                    : 'No products exist in this category yet.'}
                </p>
                <Button variant="outline" onClick={clearFilters} className="mt-6 border-slate-200">
                  Clear all filters
                </Button>
              </div>
            )}
          </div>

          {/* ── Pagination footer ── */}
          {filteredProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              {/* Rows-per-page */}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Rows per page</span>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="h-7 w-16 text-xs border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50].map((n) => (
                      <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Page info + controls */}
              <div className="flex items-center gap-1">
                <span className="text-sm text-slate-500 mr-2">
                  Page <span className="font-semibold text-slate-700">{safePage}</span> of{' '}
                  <span className="font-semibold text-slate-700">{totalPages}</span>
                </span>

                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage === 1}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="First page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Page number pills */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (totalPages <= 7) return true;
                    if (p === 1 || p === totalPages) return true;
                    if (Math.abs(p - safePage) <= 1) return true;
                    return false;
                  })
                  .reduce<(number | '…')[]>((acc, p, i, arr) => {
                    if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === '…' ? (
                      <span key={`ellipsis-${i}`} className="h-7 w-7 flex items-center justify-center text-slate-400 text-xs select-none">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item as number)}
                        className={cn(
                          'h-7 w-7 flex items-center justify-center rounded-md text-xs font-semibold border transition-all',
                          safePage === item
                            ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        )}
                      >
                        {item}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage === totalPages}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Last page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Form */}
      {isFormOpen && (
        <ProductForm product={editingProduct || undefined} onClose={handleFormClose} />
      )}
    </div>
  );
}
