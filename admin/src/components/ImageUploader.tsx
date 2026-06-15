import { useCallback, useRef, useState } from 'react';
import { X, ImageIcon } from 'lucide-react';
import { useConfigStore } from '@/stores/configStore';

interface ImageUploaderProps {
  onInsert: (url: string) => void;
}

export function ImageUploader({ onInsert }: ImageUploaderProps) {
  const { githubService, github } = useConfigStore();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !githubService) return;

      setIsUploading(true);
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          const ext = file.name.split('.').pop() || 'png';
          const date = new Date();
          const path = `${github.assetsDir || 'docs/assets'}/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${Date.now()}.${ext}`;

          const { sha } = await githubService.createOrUpdateFile(
            github.owner,
            github.repo,
            path,
            base64,
            `assets: upload ${file.name}`,
            github.branch,
          );

          if (sha) {
            const url = `https://raw.githubusercontent.com/${github.owner}/${github.repo}/${github.branch}/${path}`;
            onInsert(url);
            setPreview(null);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Upload failed:', error);
        alert('上传失败');
      } finally {
        setIsUploading(false);
      }
    },
    [githubService, github, onInsert],
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
