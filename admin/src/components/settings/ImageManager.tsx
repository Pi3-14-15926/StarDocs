import { FolderInput, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { ImageItem } from '@/services/ImageService';
import { useConfigStore } from '@/stores/configStore';
import { resolveIconUrl } from '@/utils/cdnUrl';
import { blobToBase64, compressImage, fmtSize } from '@/utils/imageCompressor';

export function ImageManager() {
  const { imageService, accel, github } = useConfigStore();

  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [docNames, setDocNames] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDocName, setFilterDocName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadDocName, setUploadDocName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<ImageItem | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [moveTarget, setMoveTarget] = useState<ImageItem | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveCategory, setMoveCategory] = useState('');
  const [moveDocName, setMoveDocName] = useState('');
  const [moving, setMoving] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!imageService) return;
    try {
      const cats = await imageService.listCategories();
      setCategories(cats);
    } catch {
      setCategories([]);
    }
  }, [imageService]);

  const loadDocNames = useCallback(
    async (category: string) => {
      if (!imageService || !category) { setDocNames([]); return; }
      try {
        const names = await imageService.listDocNames(category);
        setDocNames(names);
      } catch {
        setDocNames([]);
      }
    },
    [imageService],
  );

  const loadImages = useCallback(async () => {
    if (!imageService) return;
    setLoading(true);
    try {
      const items = await imageService.listImages(
        filterCategory || undefined,
        filterDocName || undefined,
      );
      setImages(items);
    } catch {
      setImages([]);
    }
    setLoading(false);
  }, [imageService, filterCategory, filterDocName]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  useEffect(() => {
    if (filterCategory) {
      loadDocNames(filterCategory);
      setFilterDocName('');
    } else {
      setDocNames([]);
      setFilterDocName('');
    }
  }, [filterCategory, loadDocNames]);

  useEffect(() => { loadImages(); }, [loadImages]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!imageService) return;
      const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (list.length === 0) return;
      if (!uploadCategory.trim() || !uploadDocName.trim()) {
        alert('请先填写分类和文档名称');
        return;
      }

      setUploading(true);
      setUploadProgress({ done: 0, total: list.length });

      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        try {
          const now = new Date();
          const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
          const seq = String(i + 1).padStart(2, '0');
          const filename = `${dateStr}${seq}.webp`;

          const compressed = await compressImage(file, { maxSize: 2048, quality: 0.8 });
          const base64 = await blobToBase64(compressed.blob);

          await imageService.uploadImage(
            uploadCategory.trim(),
            uploadDocName.trim(),
            filename,
            base64,
          );
        } catch (e: any) {
          console.error('Upload failed:', e);
        }
        setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      }

      setUploading(false);
      loadImages();
      loadCategories();
    },
    [imageService, uploadCategory, uploadDocName, loadImages, loadCategories],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDelete = useCallback(async () => {
    if (!imageService || !deleteTarget) return;
    try {
      await imageService.deleteImage(deleteTarget.path, deleteTarget.sha);
      setImages((prev) => prev.filter((img) => img.sha !== deleteTarget.sha));
      setShowDeleteDialog(false);
      setDeleteTarget(null);
      loadCategories();
    } catch (e: any) {
      console.error('Delete failed:', e);
    }
  }, [imageService, deleteTarget, loadCategories]);

  const handleMove = useCallback(async () => {
    if (!imageService || !moveTarget) return;
    const newCat = moveCategory.trim();
    const newDoc = moveDocName.trim();
    if (!newCat || !newDoc) return;

    setMoving(true);
    try {
      await imageService.moveImage(
        moveTarget.path,
        moveTarget.sha,
        newCat,
        newDoc,
        moveTarget.name,
      );
      setShowMoveDialog(false);
      setMoveTarget(null);
      setMoveCategory('');
      setMoveDocName('');
      loadImages();
      loadCategories();
    } catch (e: any) {
      console.error('Move failed:', e);
    }
    setMoving(false);
  }, [imageService, moveTarget, moveCategory, moveDocName, loadImages, loadCategories]);

  const getImageUrl = useCallback(
    (item: ImageItem) => resolveIconUrl(item.rawUrl, accel.iconCdnMode, accel.iconCdnCustomBase, github.owner, github.repo),
    [accel, github],
  );

  const copyUrl = useCallback(async (url: string) => {
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
  }, []);

  return (
    <div className="img-page">
      <div className="page-head">
        <div>
          <h2 className="page-title"><span className="page-title-emoji">🖼️</span>图片管理</h2>
          <p className="page-desc">上传和管理文档图片，自动压缩为 WebP 格式</p>
        </div>
      </div>

      {/* 上传区 */}
      <section className="settings-card">
        <header className="card-head">
          <div className="card-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 6px 20px rgba(99, 102, 241, 0.28)' }}>
            <Upload size={20} />
          </div>
          <div>
            <h3 className="card-title">上传图片</h3>
            <p className="card-desc">图片将上传到 GitHub image 分支</p>
          </div>
        </header>

        <div className="form-grid-2">
          <div className="field">
            <label className="field-label">分类</label>
            <input
              type="text"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="field-input"
              placeholder="例如：实用工具"
              disabled={uploading}
            />
          </div>
          <div className="field">
            <label className="field-label">文档名称</label>
            <input
              type="text"
              value={uploadDocName}
              onChange={(e) => setUploadDocName(e.target.value)}
              className="field-input"
              placeholder="例如：向日葵安装与使用"
              disabled={uploading}
            />
          </div>
        </div>

        <div
          className={`upload-zone ${dragOver ? 'active' : ''} ${uploading ? 'disabled' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="upload-icon">
            <Upload size={28} />
          </div>
          <div className="upload-text">
            <div className="upload-title">
              {uploading ? `上传中 ${uploadProgress.done} / ${uploadProgress.total}` : '拖拽图片到此处，或点击选择'}
            </div>
            <div className="upload-desc">
              支持 PNG / JPG / GIF / SVG · 自动压缩为 80% 质量 WebP · 文件名：日期+序号
            </div>
          </div>
        </div>
      </section>

      {/* 图片库 */}
      <section className="settings-card">
        <header className="card-head">
          <div className="card-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 6px 20px rgba(59, 130, 246, 0.28)' }}>
            <span style={{ fontSize: '1.2rem' }}>📁</span>
          </div>
          <div>
            <h3 className="card-title">图片库</h3>
            <p className="card-desc">共 {images.length} 张图片{filterCategory ? ` · ${filterCategory}` : ''}{filterDocName ? ` / ${filterDocName}` : ''}</p>
          </div>
        </header>

        <div className="filter-row">
          <div className="filter-field">
            <label className="field-label">按分类</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="field-input"
            >
              <option value="">全部分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="filter-field">
            <label className="field-label">按文档</label>
            <select
              value={filterDocName}
              onChange={(e) => setFilterDocName(e.target.value)}
              className="field-input"
              disabled={!filterCategory}
            >
              <option value="">全部文档</option>
              {docNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="filter-actions">
            <button type="button" onClick={loadImages} className="btn-secondary" disabled={loading}>
              刷新
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>加载中...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="empty-state">
            <p>暂无图片</p>
          </div>
        ) : (
          <div className="image-grid">
            {images.map((img) => {
              const url = getImageUrl(img);
              return (
                <div key={img.sha} className="image-tile">
                  <div className="image-preview">
                    <img src={url} alt={img.name} loading="lazy" />
                  </div>
                  <div className="image-meta">
                    <div className="image-name" title={img.name}>{img.name}</div>
                    <div className="image-info">{img.category}/{img.docName} · {fmtSize(img.size)}</div>
                    <div className="image-actions">
                      <button type="button" onClick={() => copyUrl(url)} className="action-btn">复制 URL</button>
                      <button type="button" onClick={() => { setMoveTarget(img); setMoveCategory(img.category); setMoveDocName(img.docName); setShowMoveDialog(true); }} className="action-btn">
                        <FolderInput size={12} />
                      </button>
                      <button type="button" onClick={() => { setDeleteTarget(img); setShowDeleteDialog(true); }} className="action-btn danger">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onCancel={() => { setShowDeleteDialog(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="删除图片"
        message={`确定要删除图片「${deleteTarget?.name}」吗？此操作不可恢复。`}
        confirmText="确认删除"
        danger
      />

      {showMoveDialog && moveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !moving && setShowMoveDialog(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-surface-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-base font-bold text-surface-800 dark:text-surface-100">移动图片</h3>
            <p className="mb-4 text-xs text-surface-500 dark:text-surface-400 truncate">
              {moveTarget.name} → {moveCategory}/{moveDocName}
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-surface-600 dark:text-surface-300">目标分类</label>
                <select
                  value={moveCategory}
                  onChange={(e) => setMoveCategory(e.target.value)}
                  className="field-input w-full"
                  disabled={moving}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={moveCategory}
                  onChange={(e) => setMoveCategory(e.target.value)}
                  className="field-input mt-1 w-full"
                  placeholder="或输入新分类"
                  disabled={moving}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-surface-600 dark:text-surface-300">目标文档</label>
                <select
                  value={moveDocName}
                  onChange={(e) => setMoveDocName(e.target.value)}
                  className="field-input w-full"
                  disabled={moving}
                >
                  {moveCategory && docNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={moveDocName}
                  onChange={(e) => setMoveDocName(e.target.value)}
                  className="field-input mt-1 w-full"
                  placeholder="或输入新文档名"
                  disabled={moving}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => !moving && setShowMoveDialog(false)} className="btn-secondary px-4 py-2 text-xs" disabled={moving}>取消</button>
              <button
                onClick={handleMove}
                className="btn-primary px-4 py-2 text-xs"
                disabled={moving || !moveCategory.trim() || !moveDocName.trim()}
              >
                {moving ? '移动中...' : '确认移动'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .img-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 900px;
        }
        .page-head { margin-bottom: 4px; }
        .page-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dark .page-title { color: #f1f5f9; }
        .page-title-emoji { font-size: 1.2rem; }
        .page-desc { font-size: 0.88rem; color: #94a3b8; margin: 0; }

        .settings-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: box-shadow 0.25s;
        }
        .dark .settings-card {
          background: rgba(30, 36, 50, 0.8);
          border-color: rgba(255, 255, 255, 0.06);
        }
        .settings-card:hover { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); }

        .card-head { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .card-icon {
          width: 44px; height: 44px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          color: #fff; flex-shrink: 0;
        }
        .card-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
        .dark .card-title { color: #f1f5f9; }
        .card-desc { font-size: 0.82rem; color: #94a3b8; margin: 0; }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 0.85rem; font-weight: 600; color: #334155; }
        .dark .field-label { color: #cbd5e1; }
        .field-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1.5px solid rgba(15, 23, 42, 0.08);
          background: #f8fafc;
          font-size: 0.9rem;
          color: #0f172a;
          outline: none;
          transition: all 0.18s;
          box-sizing: border-box;
        }
        .dark .field-input {
          background: rgba(30, 41, 59, 0.5);
          border-color: rgba(255, 255, 255, 0.08);
          color: #f1f5f9;
        }
        .field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12); }
        .field-input::placeholder { color: #94a3b8; }
        select.field-input {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2394A3B8'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E");
          background-position: right 12px center;
          background-repeat: no-repeat;
          background-size: 1.2rem;
          padding-right: 40px;
        }

        .upload-zone {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px;
          border: 2px dashed rgba(15, 23, 42, 0.1);
          border-radius: 16px;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dark .upload-zone { background: rgba(30, 41, 59, 0.3); border-color: rgba(255, 255, 255, 0.08); }
        .upload-zone:hover { border-color: #6366f1; background: rgba(99, 102, 241, 0.04); }
        .upload-zone.active { border-color: #6366f1; background: rgba(99, 102, 241, 0.06); }
        .upload-zone.disabled { opacity: 0.5; cursor: not-allowed; }
        .upload-icon { color: #6366f1; opacity: 0.6; flex-shrink: 0; }
        .upload-zone:hover .upload-icon { opacity: 1; }
        .upload-text { min-width: 0; }
        .upload-title { font-size: 0.9rem; font-weight: 600; color: #0f172a; }
        .dark .upload-title { color: #f1f5f9; }
        .upload-desc { font-size: 0.78rem; color: #94a3b8; margin-top: 2px; }

        .filter-row {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .filter-field { flex: 1; min-width: 150px; display: flex; flex-direction: column; gap: 4px; }
        .filter-actions { padding-bottom: 1px; }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border-radius: 14px;
          border: 1.5px solid rgba(15, 23, 42, 0.1);
          background: #fff;
          font-size: 0.88rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.18s;
        }
        .dark .btn-secondary { background: rgba(30, 41, 59, 0.5); border-color: rgba(255, 255, 255, 0.1); color: #94a3b8; }
        .btn-secondary:hover { border-color: #6366f1; color: #6366f1; }

        .loading-state, .empty-state {
          text-align: center;
          padding: 48px 20px;
          color: #94a3b8;
          font-size: 0.9rem;
          background: #f8fafc;
          border: 1px dashed rgba(15, 23, 42, 0.08);
          border-radius: 16px;
        }
        .dark .loading-state, .dark .empty-state { background: rgba(30, 41, 59, 0.3); border-color: rgba(255, 255, 255, 0.06); }
        .spinner {
          width: 32px; height: 32px;
          border: 3px solid rgba(99, 102, 241, 0.15);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }
        .image-tile {
          background: #fff;
          border: 1.5px solid rgba(15, 23, 42, 0.06);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.2s;
        }
        .dark .image-tile { background: rgba(30, 41, 59, 0.5); border-color: rgba(255, 255, 255, 0.06); }
        .image-tile:hover { border-color: #6366f1; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06); }
        .image-preview {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          padding: 12px;
        }
        .image-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .image-meta { padding: 10px 12px; }
        .image-name {
          font-size: 0.76rem;
          font-weight: 600;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
        }
        .dark .image-name { color: #f1f5f9; }
        .image-info { font-size: 0.68rem; color: #94a3b8; margin-bottom: 6px; }
        .image-actions { display: flex; gap: 4px; }
        .action-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 5px 8px;
          border-radius: 8px;
          background: #f1f5f9;
          color: #475569;
          border: none;
          font-size: 0.68rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .dark .action-btn { background: rgba(30, 41, 59, 0.8); color: #94a3b8; }
        .action-btn:hover { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
        .action-btn.danger { color: #ef4444; }
        .action-btn.danger:hover { background: rgba(239, 68, 68, 0.1); }

        .hidden { display: none; }

        .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }
        .btn-large { height: 48px; padding: 0 36px; font-size: 0.95rem; }

        @media (max-width: 768px) {
          .form-grid-2 { grid-template-columns: 1fr; }
          .filter-row { flex-direction: column; align-items: stretch; }
          .filter-field { min-width: 0; }
          .image-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; }
        }
      `}</style>
    </div>
  );
}
