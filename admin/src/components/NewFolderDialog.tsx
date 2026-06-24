import { FolderPlus, Loader2, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { showAlert } from '@/hooks/useAlert';
import { useConfigStore } from '@/stores/configStore';
import { useDocumentStore } from '@/stores/documentStore';

interface NewFolderDialogProps {
  isOpen: boolean;
  parentPath: string;
  onClose: () => void;
}

export function NewFolderDialog({
  isOpen,
  parentPath,
  onClose,
}: NewFolderDialogProps) {
  const { createDirectory } = useDocumentStore();
  const { github } = useConfigStore();
  const [folderName, setFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!folderName.trim()) return;

    const docsDir = github.docsDir || 'docs';
    const basePath = parentPath || docsDir;
    const path = `${basePath}/${folderName.trim()}`;

    setIsCreating(true);
    try {
      await createDirectory(path);
      showAlert('success', '创建成功', `文件夹 ${folderName.trim()} 已创建`);
      setFolderName('');
      onClose();
    } catch (error) {
      showAlert(
        'error',
        '创建失败',
        error instanceof Error ? error.message : '请重试',
      );
    } finally {
      setIsCreating(false);
    }
  }, [folderName, parentPath, github.docsDir, createDirectory, onClose]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <FolderPlus size={20} className="text-brand" />
            </div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">
              新建文件夹
            </h3>
          </div>
          <button onClick={onClose} className="toolbar-btn">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-surface-700 dark:text-surface-300">
              文件夹名称
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
              className="input-field"
              placeholder="新文件夹"
              autoFocus
            />
            {parentPath && (
              <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">
                位置: <span className="font-medium">{parentPath}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={!folderName.trim() || isCreating}
            className="btn-primary"
          >
            {isCreating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                创建中...
              </>
            ) : (
              '创建'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
