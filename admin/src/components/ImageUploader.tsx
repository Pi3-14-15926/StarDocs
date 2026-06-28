import { ImageIcon, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { showAlert } from '@/hooks/useAlert';
import { useConfigStore } from '@/stores/configStore';
import { compressImage, blobToBase64 } from '@/utils/imageCompressor';

interface ImageUploaderProps {
  onInsert: (url: string) => void;
  currentPath?: string;
}

export function ImageUploader({ onInsert, currentPath }: ImageUploaderProps) {
  const { imageService } = useConfigStore();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !imageService) return;

      setIsUploading(true);
      try {
        const compressed = await compressImage(file, {
          quality: 0.8,
          mimeType: 'image/webp',
        });
        const base64 = await blobToBase64(compressed.blob);

        let category = 'general';
        let docName = 'general';
        if (currentPath) {
          const parts = currentPath.replace(/^docs\//, '').split('/');
          if (parts.length >= 2) {
            category = parts.slice(0, -1).join('/');
            docName = parts[parts.length - 1].replace(/\.md$/, '');
          } else if (parts.length === 1) {
            docName = parts[0].replace(/\.md$/, '');
          }
        }

        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

        let seq = 1;
        try {
          const existing = await imageService.listImages(category, docName);
          const todayPrefix = `${dateStr}_`;
          const todayImages = existing.filter((img) =>
            img.name.startsWith(todayPrefix),
          );
          if (todayImages.length > 0) {
            const maxSeq = todayImages.reduce((max, img) => {
              const match = img.name.match(/_(\d+)\.webp$/);
              if (match) {
                const num = parseInt(match[1], 10);
                return num > max ? num : max;
              }
              return max;
            }, 0);
            seq = maxSeq + 1;
          }
        } catch {
          seq = 1;
        }

        const filename = `${dateStr}_${String(seq).padStart(4, '0')}.webp`;

        const result = await imageService.uploadImage(
          category,
          docName,
          filename,
          base64,
        );

        if (result.rawUrl) {
          onInsert(result.rawUrl);
          setPreview(null);
        }
      } catch (error) {
        console.error('Upload failed:', error);
        showAlert(
          'error',
          '上传失败',
          error instanceof Error ? error.message : '请重试',
        );
      } finally {
        setIsUploading(false);
      }
    },
    [imageService, onInsert, currentPath],
  );

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview && (
        <div className="mb-2 relative inline-block">
          <img src={preview} alt="Preview" className="max-h-20 rounded-lg" />
          <button
            onClick={() => setPreview(null)}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <button
        onClick={() => fileRef.current?.click()}
        disabled={isUploading}
        className="btn-secondary text-xs"
      >
        {isUploading ? (
          <>
            <div className="h-3 w-3 animate-spin rounded-full border border-brand border-t-transparent" />
            上传中...
          </>
        ) : (
          <>
            <ImageIcon size={14} />
            上传图片
          </>
        )}
      </button>
    </div>
  );
}
