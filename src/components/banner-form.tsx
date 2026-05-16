'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Banner } from '@/lib/mock-data';
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

const bannerSchema = z.object({
  title: z.string().optional(),
  linkTo: z.string().optional(),
  active: z.boolean().default(true),
});

type BannerFormData = z.infer<typeof bannerSchema>;

interface BannerFormProps {
  banner?: Banner;
  onClose: () => void;
}

export function BannerForm({ banner, onClose }: BannerFormProps) {
  const { addBanner, updateBanner } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(banner?.imageUrl || null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: banner?.title || '',
      linkTo: banner?.linkTo || '',
      active: banner?.active ?? true,
    },
  });

  const active = watch('active');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: BannerFormData) => {
    setIsSubmitting(true);
    try {
      let imageUrl = banner?.imageUrl || '';

      if (imageFile) {
        // File upload is not supported via the REST API.
        toast.error('File upload is not supported. Please provide an image URL directly.');
        setIsSubmitting(false);
        return;
      }

      if (!imageUrl) {
        toast.error('Banner image URL is required');
        setIsSubmitting(false);
        return;
      }

      const bannerData = {
        ...data,
        imageUrl,
      };

      let success = false;
      if (banner) {
        success = await updateBanner(banner.id, bannerData);
      } else {
        success = await addBanner(bannerData);
      }
      
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Failed to save banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{banner ? 'Edit Banner' : 'Add New Banner'}</DialogTitle>
          <DialogDescription>
            {banner ? 'Update the banner details' : 'Add a new promotional banner to the home screen carousel'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Banner Image</Label>
            <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg border-slate-200">
              {imagePreview ? (
                <div className="relative w-full aspect-2/1 rounded-md overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="object-cover w-full h-full"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => document.getElementById('banner-upload')?.click()}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center justify-center py-8 cursor-pointer w-full"
                  onClick={() => document.getElementById('banner-upload')?.click()}
                >
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600 font-medium">Click to upload banner</p>
                  <p className="text-xs text-slate-500 mt-1">Recommended: 1200x600px</p>
                </div>
              )}
              <input
                id="banner-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              placeholder="e.g., Summer Sale"
              {...register('title')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkTo">Link To (Optional)</Label>
            <Input
              id="linkTo"
              placeholder="e.g., /category/fuel"
              {...register('linkTo')}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="active">Active Status</Label>
              <p className="text-sm text-slate-500">Enable or disable this banner on the home screen</p>
            </div>
            <Switch
              id="active"
              checked={active}
              onCheckedChange={(checked) => setValue('active', checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Banner'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
