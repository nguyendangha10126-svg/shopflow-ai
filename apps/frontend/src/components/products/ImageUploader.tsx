import React, { useRef, useState } from 'react';
import { Upload, X, Star, AlertCircle, Loader2 } from 'lucide-react';
import {
  processImageFile,
  MAX_IMAGE_COUNT_PER_PRODUCT,
} from '../../utils/image';

export interface ImageItem {
  id: string;
  url: string;
  name: string;
  isCover?: boolean;
}

interface ImageUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxCount?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxCount = MAX_IMAGE_COUNT_PER_PRODUCT,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage('');

    const availableSlots = maxCount - images.length;
    if (availableSlots <= 0) {
      setErrorMessage(`Đã đạt giới hạn tối đa ${maxCount} ảnh cho mỗi sản phẩm`);
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, availableSlots);
    setIsProcessing(true);

    try {
      const newItems: ImageItem[] = [];
      for (const file of filesToProcess) {
        const processed = await processImageFile(file);
        newItems.push({
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          url: processed.dataUrl,
          name: file.name,
          isCover: images.length === 0 && newItems.length === 0,
        });
      }

      onChange([...images, ...newItems]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi xử lý tải ảnh lên');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (id: string) => {
    const next = images.filter((img) => img.id !== id);
    if (next.length > 0 && !next.some((img) => img.isCover)) {
      next[0].isCover = true;
    }
    onChange(next);
  };

  const handleSetCover = (id: string) => {
    const next = images.map((img) => ({
      ...img,
      isCover: img.id === id,
    }));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span>Hình ảnh sản phẩm</span>
          <span className="text-slate-400 font-normal">
            ({images.length}/{maxCount} ảnh)
          </span>
        </label>
        <span className="text-slate-400 text-[11px]">
          Tối đa 5MB/ảnh • Tự động nén WebP/JPG
        </span>
      </div>

      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid of uploaded images + upload button */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative aspect-square rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800"
          >
            <img
              src={img.url}
              alt={img.name}
              className="w-full h-full object-cover"
            />

            {/* Badges */}
            {img.isCover && (
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold shadow-sm flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-white" />
                <span>Ảnh bìa</span>
              </span>
            )}

            {/* Overlay actions */}
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
              {!img.isCover && (
                <button
                  type="button"
                  onClick={() => handleSetCover(img.id)}
                  className="px-2 py-1 rounded bg-white/90 text-slate-900 text-[10px] font-semibold hover:bg-white shadow"
                >
                  Đặt làm bìa
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                className="p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition"
                title="Xóa ảnh"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Upload Button */}
        {images.length < maxCount && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            disabled={isProcessing}
            className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-900/50'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
            <span className="text-[11px] font-medium text-center px-1">
              {isProcessing ? 'Đang nén...' : '+ Thêm ảnh'}
            </span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
};

export default ImageUploader;
