import { useState, useCallback } from 'react';
import { X, FolderPlus, Loader2 } from 'lucide-react';
import { useDocumentStore } from '@/stores/documentStore';
import { useConfigStore } from '@/stores/configStore';
import { showAlert } from '@/hooks/useAlert';

interface NewFolderDialogProps {
  isOpen: boolean;
  parentPath: string;
  onClose: () => void;
}

export function NewFolderDialog({ isOpen, parentPath, onClose }: NewFolderDialogProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <FolderPlus size={20} className="text-brand" />
            新建文件夹
          </h3>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                位置: {parentPath}
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
