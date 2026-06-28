import { ImageIcon, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { showAlert } from '@/hooks/useAlert';
import { useConfigStore } from '@/stores/configStore';

interface ImageUploaderProps {
  onInsert: (url: string) => void;
  currentPath?: string;
}

export function ImageUploader({ onInsert, currentPath }: ImageUploaderProps) {
  const { imageService, github } = useConfigStore();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !imageService) return;

      setIsUploading(true);
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1] || '';
          const ext = file.name.split('.').pop() || 'png';
          const date = new Date();
          const filename = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}_${Date.now()}.${ext}`;

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
        };
        reader.readAsDataURL(file);
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
    [imageService, github, onInsert, currentPath],
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
