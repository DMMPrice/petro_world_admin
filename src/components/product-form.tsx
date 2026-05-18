'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product } from '@/lib/mock-data';
import { useData } from '@/lib/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  Upload,
  X,
  Package,
  Tag,
  Truck,
  ChevronRight,
  ChevronLeft,
  ImageIcon,
  Percent,
  IndianRupee,
  Weight,
  Ruler,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const productSchema = z
  .object({
    name: z.string().min(1, 'Product name is required'),
    category: z.string().min(1, 'Category is required'),
    price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
    stock: z.coerce.number().min(0, 'Stock cannot be negative'),
    description: z.string().optional(),
    discount_type: z.string().nullable().optional(),
    discount_value: z.coerce.number().min(0, 'Discount cannot be negative').nullable().optional(),
    category_id: z.string().optional(),
    sub_category_id: z.string().nullable().optional(),
    weight: z.coerce.number().min(0.001, 'Weight must be greater than 0'),
    length: z.coerce.number().min(0.1, 'Length must be greater than 0'),
    width: z.coerce.number().min(0.1, 'Width must be greater than 0'),
    height: z.coerce.number().min(0.1, 'Height must be greater than 0'),
  })
  .refine(
    (data) => {
      if (data.discount_type === 'percentage' && (data.discount_value || 0) > 100) return false;
      return true;
    },
    { message: 'Percentage discount cannot exceed 100%', path: ['discount_value'] }
  );

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onClose: () => void;
}

const TABS = [
  { id: 'details' as const, label: 'Details', icon: Package },
  { id: 'pricing' as const, label: 'Pricing', icon: Tag },
  { id: 'shipping' as const, label: 'Shipping', icon: Truck },
];
type TabId = 'details' | 'pricing' | 'shipping';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-500 animate-fade-in-up mt-1">
      <Info className="w-3 h-3 flex-shrink-0" />
      {message}
    </p>
  );
}

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

export function ProductForm({ product, onClose }: ProductFormProps) {
  const { addProduct, updateProduct, categories, subCategories } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(
    (product?.gallery && product.gallery.length > 0
      ? product.gallery
      : product?.image
      ? [product.image]
      : []
    ).filter((url) => url && url.trim() !== '')
  );
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      name: '',
      category: categories[0]?.title || '',
      price: 0,
      stock: 0,
      description: '',
      discount_type: null,
      discount_value: 0,
      category_id: categories[0]?.id || '',
      sub_category_id: null,
      weight: 0.5,
      length: 10,
      width: 10,
      height: 10,
    },
  });

  const selectedCategoryId = watch('category_id');
  const filteredSubCategories = subCategories.filter(
    (sc) => sc.category_id === selectedCategoryId
  );

  const addFiles = (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    setImageFiles((prev) => [...prev, ...imageFiles]);
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setNewImagePreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeExistingImage = (index: number) =>
    setExistingImages((prev) => prev.filter((_, i) => i !== index));

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const allGalleryUrls = [...existingImages, ...newImagePreviews];
      const mainImageUrl = allGalleryUrls[0] || '';
      const submissionData = {
        ...data,
        image: mainImageUrl,
        gallery: allGalleryUrls,
        sub_category_id: data.sub_category_id ?? undefined,
        discount_type: (data.discount_type ?? undefined) as 'percentage' | 'fixed' | undefined,
        discount_value: data.discount_value ?? undefined,
      };

      const submissionPromise = product
        ? updateProduct(product.id, submissionData)
        : addProduct(submissionData);

      const timeoutPromise = new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 60000)
      );

      const success = (await Promise.race([submissionPromise, timeoutPromise])) as boolean;
      if (success) onClose();
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const price = watch('price') || 0;
  const discountType = watch('discount_type');
  const discountValue = watch('discount_value') || 0;

  const effectivePrice =
    discountType === 'percentage'
      ? price * (1 - discountValue / 100)
      : discountType === 'fixed'
      ? Math.max(0, price - discountValue)
      : price;

  const savings = price - effectivePrice;
  const savingsPct = price > 0 ? (savings / price) * 100 : 0;

  const allImages = [...existingImages, ...newImagePreviews];
  const tabIndex = TABS.findIndex((t) => t.id === activeTab);

  const goNext = () => {
    const next = TABS[tabIndex + 1];
    if (next) setActiveTab(next.id);
  };
  const goPrev = () => {
    const prev = TABS[tabIndex - 1];
    if (prev) setActiveTab(prev.id);
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[600px] p-0 flex flex-col overflow-hidden border-l border-slate-200 shadow-2xl"
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="relative flex-shrink-0 bg-gradient-to-br from-amber-500 via-amber-500 to-orange-500 px-6 pt-6 pb-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.18),_transparent_65%)] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />

          <SheetHeader className="relative mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner">
                {allImages[0] ? (
                  <img
                    src={allImages[0]}
                    alt="product"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <Package className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <SheetTitle className="text-white text-lg font-bold leading-tight">
                  {product ? 'Edit Product' : 'New Product'}
                </SheetTitle>
                <p className="text-amber-100/80 text-xs mt-0.5 font-medium">
                  {product ? product.name : 'Fill in the details below to add a product'}
                </p>
              </div>
            </div>
          </SheetHeader>

          {/* Tab Nav */}
          <div className="flex bg-black/15 rounded-t-xl overflow-hidden">
            {TABS.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-all duration-200 relative',
                    isActive
                      ? 'bg-white text-amber-600'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {isActive && idx < TABS.length - 1 && (
                    <span className="absolute right-0 top-0 bottom-0 w-3 overflow-hidden">
                      <span className="absolute inset-y-0 -left-3 w-6 bg-white [clip-path:polygon(0_0,100%_0,100%_100%)] opacity-0" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Form ─────────────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden bg-slate-50"
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* ── TAB: Details ────────────────────────────────────── */}
            {activeTab === 'details' && (
              <div className="p-5 space-y-4 animate-fade-in-up">
                {/* Image upload */}
                <SectionCard className="animate-fade-in-up stagger-1">
                  <SectionHeader icon={ImageIcon} title="Product Images" subtitle="Upload one or more product photos" />
                  <div className="p-4">
                    {allImages.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-3">
                          {existingImages.map((url, idx) => (
                            <div
                              key={`ex-${idx}`}
                              className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 animate-scale-in shadow-sm"
                              style={{ animationDelay: `${idx * 60}ms` }}
                            >
                              {idx === 0 && (
                                <span className="absolute top-1 left-1 z-10 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                  Main
                                </span>
                              )}
                              <img
                                src={url}
                                alt="preview"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />
                              <button
                                type="button"
                                onClick={() => removeExistingImage(idx)}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 shadow-sm"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {newImagePreviews.map((url, idx) => (
                            <div
                              key={`new-${idx}`}
                              className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-blue-200 bg-blue-50 animate-scale-in shadow-sm"
                              style={{ animationDelay: `${idx * 60}ms` }}
                            >
                              <img
                                src={url}
                                alt="preview"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />
                              <button
                                type="button"
                                onClick={() => removeNewImage(idx)}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 shadow-sm"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => document.getElementById('product-image-upload')?.click()}
                            className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-1 hover:border-amber-400 hover:bg-amber-50 transition-all duration-200 group"
                          >
                            <Upload className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                            <span className="text-[10px] text-slate-400 group-hover:text-amber-500 font-medium transition-colors">
                              Add
                            </span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-400">
                          First image is the main product image. Hover to remove.
                        </p>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200',
                          dragOver
                            ? 'border-amber-400 bg-amber-50 scale-[1.01]'
                            : 'border-slate-200 bg-slate-50/50 hover:border-amber-300 hover:bg-amber-50/30'
                        )}
                        onClick={() => document.getElementById('product-image-upload')?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                          <Upload className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">
                          Drop images here or click to upload
                        </p>
                        <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5 MB · Multiple allowed</p>
                      </div>
                    )}
                    <input
                      id="product-image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                </SectionCard>

                {/* Basic info */}
                <SectionCard className="animate-fade-in-up stagger-2">
                  <SectionHeader icon={Package} title="Basic Information" />
                  <div className="p-4 space-y-4">
                    <div>
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Product Name <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        placeholder="e.g., Unleaded 95 — 1L"
                        className="mt-1.5 border-slate-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all"
                        {...register('name')}
                      />
                      <FieldError message={errors.name?.message} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Category <span className="text-red-400">*</span>
                        </Label>
                        <Select
                          value={selectedCategoryId}
                          onValueChange={(value) => {
                            setValue('category_id', value);
                            const cat = categories.find((c) => c.id === value);
                            if (cat) setValue('category', cat.title);
                            setValue('sub_category_id', null);
                          }}
                        >
                          <SelectTrigger className="mt-1.5 border-slate-200 focus:border-amber-400">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.title}
                              </SelectItem>
                            ))}
                            {categories.length === 0 && (
                              <SelectItem value="none" disabled>
                                No categories
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FieldError message={errors.category?.message} />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Subcategory
                        </Label>
                        <Select
                          value={watch('sub_category_id') || 'none'}
                          onValueChange={(v) =>
                            setValue('sub_category_id', v === 'none' ? null : v)
                          }
                          disabled={!selectedCategoryId}
                        >
                          <SelectTrigger className="mt-1.5 border-slate-200 focus:border-amber-400">
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {filteredSubCategories.map((sc) => (
                              <SelectItem key={sc.id} value={sc.id}>
                                {sc.name}
                              </SelectItem>
                            ))}
                            {selectedCategoryId && filteredSubCategories.length === 0 && (
                              <SelectItem value="no-subs" disabled>
                                No subcategories
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Description
                      </Label>
                      <textarea
                        rows={3}
                        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all resize-none"
                        placeholder="Describe the product…"
                        {...register('description')}
                      />
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ── TAB: Pricing ────────────────────────────────────── */}
            {activeTab === 'pricing' && (
              <div className="p-5 space-y-4 animate-fade-in-up">
                <SectionCard className="animate-fade-in-up stagger-1">
                  <SectionHeader icon={IndianRupee} title="Price & Stock" />
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Price (₹) <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                          ₹
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-7 border-slate-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all"
                          {...register('price')}
                        />
                      </div>
                      <FieldError message={errors.price?.message} />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Stock Qty <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        className="mt-1.5 border-slate-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all"
                        {...register('stock')}
                      />
                      <FieldError message={errors.stock?.message} />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard className="animate-fade-in-up stagger-2">
                  <SectionHeader
                    icon={Percent}
                    title="Discount"
                    subtitle="Optional — leave as 'No Discount' to skip"
                  />
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Type
                        </Label>
                        <Select
                          value={watch('discount_type') || 'none'}
                          onValueChange={(v) => setValue('discount_type', v === 'none' ? null : v)}
                        >
                          <SelectTrigger className="mt-1.5 border-slate-200 focus:border-amber-400">
                            <SelectValue placeholder="No Discount" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Discount</SelectItem>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Value
                        </Label>
                        <div className="relative mt-1.5">
                          {discountType === 'percentage' ? (
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                              ₹
                            </span>
                          )}
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0"
                            disabled={!watch('discount_type')}
                            className={cn(
                              'border-slate-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all',
                              discountType ? 'pl-7' : ''
                            )}
                            {...register('discount_value')}
                          />
                        </div>
                        <FieldError message={errors.discount_value?.message} />
                      </div>
                    </div>

                    {/* Live price preview */}
                    {price > 0 && (
                      <div
                        className={cn(
                          'rounded-xl border p-4 transition-all duration-300 animate-fade-in-up',
                          savings > 0
                            ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
                            : 'bg-slate-50 border-slate-200'
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            Price Preview
                          </span>
                          {savings > 0 && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                              Save {savingsPct.toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-end gap-3">
                          <div>
                            <p className="text-2xl font-bold text-slate-900">
                              ₹{effectivePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">Customer pays</p>
                          </div>
                          {savings > 0 && (
                            <div className="mb-1">
                              <p className="text-sm text-slate-400 line-through">
                                ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs font-semibold text-emerald-600">
                                −₹{savings.toLocaleString('en-IN', { minimumFractionDigits: 2 })} off
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ── TAB: Shipping ───────────────────────────────────── */}
            {activeTab === 'shipping' && (
              <div className="p-5 space-y-4 animate-fade-in-up">
                <SectionCard className="animate-fade-in-up stagger-1">
                  <SectionHeader
                    icon={Weight}
                    title="Weight"
                    subtitle="Including packaging, in kilograms"
                  />
                  <div className="p-4">
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="0.500"
                        className="pr-12 border-slate-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all"
                        {...register('weight')}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        kg
                      </span>
                    </div>
                    <FieldError message={errors.weight?.message} />
                  </div>
                </SectionCard>

                <SectionCard className="animate-fade-in-up stagger-2">
                  <SectionHeader
                    icon={Ruler}
                    title="Package Dimensions"
                    subtitle="Outer dimensions including packaging, in centimetres"
                  />
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-3">
                      {(
                        [
                          { id: 'length', label: 'Length' },
                          { id: 'width', label: 'Width' },
                          { id: 'height', label: 'Height' },
                        ] as const
                      ).map(({ id, label }) => (
                        <div key={id}>
                          <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            {label}
                          </Label>
                          <div className="relative mt-1.5">
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              placeholder="10"
                              className="pr-10 border-slate-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all"
                              {...register(id)}
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">
                              cm
                            </span>
                          </div>
                          <FieldError message={errors[id]?.message} />
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionCard>

                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 flex gap-3 animate-fade-in-up stagger-3">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Accurate weight and dimensions are used by Shiprocket to calculate shipping rates.
                    Incorrect values may cause billing discrepancies.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              {tabIndex > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={goPrev}
                  className="gap-1.5 text-slate-600 hover:text-slate-900"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              {/* Step indicators */}
              <div className="flex gap-1.5 ml-1">
                {TABS.map((tab, i) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === tabIndex
                        ? 'w-5 bg-amber-500'
                        : i < tabIndex
                        ? 'w-2 bg-amber-300'
                        : 'w-2 bg-slate-200'
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="border-slate-200"
              >
                Cancel
              </Button>
              {tabIndex < TABS.length - 1 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={goNext}
                  className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200 min-w-[110px] transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {product ? 'Save Changes' : 'Add Product'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
