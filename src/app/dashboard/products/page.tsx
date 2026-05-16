'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Loader2, Search, Filter, ArrowUpDown, ChevronDown, X } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu";

export default function ProductsPage() {
  const { products, deleteProduct, loading, categories } = useData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'newest'>('newest');

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.brand?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          const priceA = a.discount_type === 'fixed' ? a.price - (a.discount_value || 0) : (a.discount_type === 'percentage' ? a.price * (1 - (a.discount_value || 0) / 100) : a.price);
          const priceB = b.discount_type === 'fixed' ? b.price - (b.discount_value || 0) : (b.discount_type === 'percentage' ? b.price * (1 - (b.discount_value || 0) / 100) : b.price);
          return priceA - priceB;
        case 'stock':
          return a.stock - b.stock;
        case 'newest':
        default:
          // Assuming id contains some sort of chronological info or just keep existing order
          return 0; 
      }
    });

    return result;
  }, [products, searchQuery, categoryFilter, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const getStockStatus = (stock: number) => {
    if (stock < 50) return { label: 'Critical', variant: 'destructive' as const };
    if (stock < 100) return { label: 'Low', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600 mt-1">Manage your fuel and automotive products</p>
        </div>
        <Button
          onClick={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}
          className="gap-2 bg-amber-500 hover:bg-amber-600"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by name, brand, or category..." 
            className="pl-10 pr-10 border-slate-200 focus:border-amber-500 focus:ring-amber-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
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
                {categories.map(cat => (
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
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 gap-1">
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>
                {filteredProducts.length === products.length 
                  ? `Total products: ${products.length}`
                  : `Showing ${filteredProducts.length} of ${products.length} products`}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-white">
              {filteredProducts.length} Results
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filteredProducts.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-semibold">Name & Brand</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Price</TableHead>
                    <TableHead className="font-semibold">Discount</TableHead>
                    <TableHead className="font-semibold">Stock</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const status = getStockStatus(product.stock);
                    return (
                      <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 p-1">
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
                              <span className="text-xs text-slate-500">{product.brand || 'No Brand'}</span>
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
                                    ? (product.price * (1 - (product.discount_value || 0) / 100))
                                    : (product.price - (product.discount_value || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-slate-900">₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(product)}
                              className="h-8 w-8 text-slate-500 hover:text-amber-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <span className="font-bold text-slate-900">{product.name}</span>? This action cannot be undone.
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
                  We couldn't find any products matching "{searchQuery}" in {categoryFilter === 'all' ? 'any category' : categoryFilter}.
                </p>
                <Button variant="outline" onClick={clearFilters} className="mt-6 border-slate-200">
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Form Modal */}
      {isFormOpen && (
        <ProductForm
          product={editingProduct || undefined}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
