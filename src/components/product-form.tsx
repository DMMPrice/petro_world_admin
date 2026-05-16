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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

const productSchema = z.object({
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
}).refine((data) => {
  if (data.discount_type === 'percentage' && (data.discount_value || 0) > 100) {
    return false;
  }
  return true;
}, {
  message: "Percentage discount cannot exceed 100%",
  path: ["discount_value"],
});

type ProductFormData = z.infer<typeof productSchema>;


interface ProductFormProps {
  product?: Product;
  onClose: () => void;
}

export function ProductForm({ product, onClose }: ProductFormProps) {
  const { addProduct, updateProduct, categories, subCategories } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]); // kept for removeNewImage index tracking
  const [existingImages, setExistingImages] = useState<string[]>(
    (product?.gallery && product.gallery.length > 0 
      ? product.gallery 
      : (product?.image ? [product.image] : [])).filter(url => url && url.trim() !== '')
  );
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

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
      category_id: product?.category_id || categories[0]?.id || '',
      sub_category_id: product?.sub_category_id || null,
      weight: product?.weight || 0.5,
      length: product?.length || 10,
      width: product?.width || 10,
      height: product?.height || 10,
    },
  });

  const selectedCategoryId = watch('category_id');
  
  // Get subcategories for the selected category
  const filteredSubCategories = subCategories.filter(
    (sc) => sc.category_id === selectedCategoryId
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const allGalleryUrls = [...existingImages, ...newImagePreviews];
      const mainImageUrl = allGalleryUrls.length > 0 ? allGalleryUrls[0] : '';

      const submissionData = {
        ...data,
        image: mainImageUrl,
        gallery: allGalleryUrls,
      };

      console.log('Submitting form with data:', submissionData);

      let success = false;
      
      // Add a timeout to the submission to prevent permanent "Saving..." state
      const submissionPromise = product 
        ? updateProduct(product.id, submissionData)
        : addProduct(submissionData);

      const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 60000)
      );

      try {
        success = await Promise.race([submissionPromise, timeoutPromise]) as boolean;
        if (success) {
          onClose();
        } else {
          // If addProduct/updateProduct returned false, it already showed a toast
          console.warn('Product save failed according to data-context');
        }
      } catch (timeoutErr: any) {
        console.error('Submission error or timeout:', timeoutErr);
        toast.error(timeoutErr.message || 'An error occurred during submission');
      }
    } catch (error) {
      console.error('Error in onSubmit:', error);
      toast.error('An unexpected error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {product ? 'Update the product details' : 'Add a new product to your catalog'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 space-y-4 py-2">
            <div className="space-y-2">
              <Label>Product Images</Label>
              <div className="flex flex-col gap-4 p-4 border-2 border-dashed rounded-lg border-slate-200">
                {(existingImages.length > 0 || newImagePreviews.length > 0) ? (
                  <div className="flex flex-wrap gap-4">
                    {existingImages.filter(url => url && url.trim() !== '').map((url, idx) => (
                      <div key={`existing-${idx}`} className="relative w-24 h-24 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                        <img src={url} alt="Preview" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    ))}
                    {newImagePreviews.filter(url => url && url.trim() !== '').map((url, idx) => (
                      <div key={`new-${idx}`} className="relative w-24 h-24 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                        <img src={url} alt="Preview" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => removeNewImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    ))}
                    <div 
                      className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => document.getElementById('product-image-upload')?.click()}
                    >
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-500 font-medium">Add More</span>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="flex flex-col items-center justify-center py-6 cursor-pointer w-full hover:bg-slate-50 transition-colors rounded-md"
                    onClick={() => document.getElementById('product-image-upload')?.click()}
                  >
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600 font-medium">Click to upload product images</p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB (Multiple allowed)</p>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                placeholder="e.g., Unleaded 95"
                {...register('name')}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={selectedCategoryId}
                onValueChange={(value) => {
                  setValue('category_id', value);
                  const cat = categories.find(c => c.id === value);
                  if (cat) setValue('category', cat.title);
                  setValue('sub_category_id', null); // Reset subcategory when category changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.title}
                    </SelectItem>
                  ))}
                  {categories.length === 0 && (
                    <SelectItem value="Uncategorized" disabled>No categories found</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub_category">Subcategory (Optional)</Label>
              <Select
                value={watch('sub_category_id') || 'none'}
                onValueChange={(value) => setValue('sub_category_id', value === 'none' ? null : value)}
                disabled={!selectedCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {filteredSubCategories.map((sc) => (
                    <SelectItem key={sc.id} value={sc.id}>
                      {sc.name}
                    </SelectItem>
                  ))}
                  {selectedCategoryId && filteredSubCategories.length === 0 && (
                    <SelectItem value="no-subs" disabled>No subcategories found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                rows={3}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter product description..."
                {...register('description')}
              />
            </div>


            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('price')}
                />
                {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register('stock')}
                />
                {errors.stock && <p className="text-sm text-red-600">{errors.stock.message}</p>}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Discount Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select
                    value={watch('discount_type') || 'none'}
                    onValueChange={(value) => setValue('discount_type', value === 'none' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No Discount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Discount</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_value">Discount Value</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    disabled={!watch('discount_type')}
                    {...register('discount_value')}
                  />
                </div>
              </div>
              
              {watch('discount_type') && (watch('discount_value') || 0) > 0 && (
                <div className="text-xs text-amber-600 font-medium bg-amber-50 p-2 rounded border border-amber-100">
                  Effective Price: ₹{
                    watch('discount_type') === 'percentage' 
                      ? ((watch('price') || 0) * (1 - (watch('discount_value') || 0) / 100)).toFixed(2)
                      : ((watch('price') || 0) - (watch('discount_value') || 0)).toFixed(2)
                  }
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Shipping & Dimensions (for Shiprocket)</h3>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="0.5"
                  {...register('weight')}
                />
                <p className="text-[10px] text-slate-500">Weight of the product including packaging in Kilograms.</p>
                {errors.weight && <p className="text-sm text-red-600">{errors.weight.message}</p>}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="length">Length (cm)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="10"
                    {...register('length')}
                  />
                  {errors.length && <p className="text-sm text-red-600">{errors.length.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Width (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="10"
                    {...register('width')}
                  />
                  {errors.width && <p className="text-sm text-red-600">{errors.width.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="10"
                    {...register('height')}
                  />
                  {errors.height && <p className="text-sm text-red-600">{errors.height.message}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 p-6 pt-4 border-t bg-slate-50/50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
