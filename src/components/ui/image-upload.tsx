import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { useSettings } from "@/hooks/useSettings";
import { screenFileUpload } from "@/utils/file-screening";

interface ImageUploadProps {
  bucket?: string;
  onUpload: (url: string) => void;
  defaultImage?: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
}

export const ImageUpload = ({
  bucket = 'avatars',
  onUpload,
  defaultImage,
  fallbackText = 'U',
  size = 'md',
  disabled = false,
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(defaultImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { settings } = useSettings();

  React.useEffect(() => {
    if (defaultImage !== undefined) {
      setPreview(defaultImage);
    }
  }, [defaultImage]);

  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
    xl: 'h-32 w-32',
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // 1. Initial Type Check
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file.');
      }

      // 2. Windows-Server Style Screening (FSRM)
      const screening = screenFileUpload(file, settings);
      if (!screening.isValid) {
        throw new Error(screening.error);
      }

      // 3. Optional Soft-Limit Warning
      if (screening.isSoftLimitTriggered) {
        toast({ 
          title: 'Soft Quota Warning', 
          description: screening.error, 
          variant: 'default',
        });
      }

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Try Supabase Storage first
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          onUpload(publicUrl);
          setIsUploading(false);
          toast({ title: 'Image uploaded successfully' });
          return;
        }
        console.warn("[Storage] Supabase upload error, falling back to Base64:", uploadError);
      } catch (e) {
        console.warn("[Storage] Supabase storage exception, falling back to Base64:", e);
      }

      // Fallback: Base64 (Data URL)
      // This ensures photos work even if Supabase Storage is restricted during migration
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onUpload(base64String);
        setIsUploading(false);
        toast({ 
          title: 'Image Attached (Failsafe Mode)', 
          description: 'Photo will be stored directly in the record.' 
        });
      };
      reader.readAsDataURL(file);

    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      // Revert preview on failure
      setPreview(defaultImage);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearImage = () => {
    setPreview(undefined);
    onUpload('');
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} border-2 border-muted shadow-sm`}>
          <AvatarImage src={preview} className="object-cover" />
          <AvatarFallback className="bg-primary/5 text-primary text-xl font-semibold">
            {fallbackText}
          </AvatarFallback>
        </Avatar>
        
        {preview && !disabled && (
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={disabled || isUploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          {isUploading ? 'Uploading...' : 'Upload Photo'}
        </Button>
      </div>
    </div>
  );
};

