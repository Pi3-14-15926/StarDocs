export interface CompressOptions {
  maxSize?: number;
  quality?: number;
  mimeType?: string;
  bgColor?: string;
}

export interface CompressResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  filename: string;
}

const DEFAULTS: Required<CompressOptions> = {
  maxSize: 2048,
  quality: 0.8,
  mimeType: 'image/webp',
  bgColor: '#FFFFFF',
};

export async function compressImage(
  file: File | Blob,
  opts: CompressOptions = {},
): Promise<CompressResult> {
  const o = { ...DEFAULTS, ...opts };
  if (!file) throw new Error('未提供文件');

  const originalSize = file.size;
  const img = await loadImage(file);

  const ratio = Math.min(1, o.maxSize / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D 不可用');

  const needAlpha = o.mimeType === 'image/webp' && (await hasAlpha(file));
  if (needAlpha) {
    ctx.clearRect(0, 0, w, h);
  } else {
    ctx.fillStyle = o.bgColor;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas 转换失败'))),
      o.mimeType,
      o.quality,
    );
  });

  const dataUrl = canvas.toDataURL(o.mimeType, o.quality);
  const originalName = (file as File).name || 'image';
  const filename = replaceExt(originalName, 'webp');

  return {
    blob,
    dataUrl,
    width: w,
    height: h,
    originalSize,
    compressedSize: blob.size,
    filename,
  };
}

function loadImage(src: string | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图像加载失败'));
    if (src instanceof Blob) {
      img.src = URL.createObjectURL(src);
    } else {
      img.src = src;
    }
  });
}

function replaceExt(name: string, ext: string): string {
  const base = name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  return `${base || 'image'}.${ext}`;
}

async function hasAlpha(file: File | Blob): Promise<boolean> {
  if (!(file instanceof File)) return false;
  if (file.type === 'image/png' || file.type === 'image/webp') {
    try {
      const buf = await file.slice(0, 32).arrayBuffer();
      const view = new Uint8Array(buf);
      if (file.type === 'image/png') {
        return view[25] === 6;
      }
      if (file.type === 'image/webp') {
        return view.some(
          (b, i) =>
            i > 0 && view[i - 1] === 0x41 && b === 0x4c && view[i + 1] === 0x50,
        );
      }
    } catch {
      /* ignore */
    }
  }
  return false;
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Base64 读取失败'));
    reader.readAsDataURL(blob);
  });
}

export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
