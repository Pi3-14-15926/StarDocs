import { useState, useCallback } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { useDocumentStore } from '@/stores/documentStore';
import { useConfigStore } from '@/stores/configStore';
import { showAlert } from '@/hooks/useAlert';

interface NewDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewDocumentDialog({ isOpen, onClose }: NewDocumentDialogProps) {
  const { createDocument } = useDocumentStore();
  const { github } = useConfigStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;

    const fileName = name.endsWith('.md') ? name : `${name}.md`;
    const path = category
      ? `${github.docsDir || 'docs'}/${category}/${fileName}`
      : `${github.docsDir || 'docs'}/${fileName}`;

    const frontmatter: Record<string, unknown> = {};
    if (title) frontmatter.title = title;
    if (description) frontmatter.description = description;

    const body = `# ${title || name}\n`;

    setIsCreating(true);
    try {
      await createDocument(path, frontmatter, body);
      setName('');
      setCategory('');
      setTitle('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Failed to create document:', error);
      showAlert('error', '创建失败', error instanceof Error ? error.message : '请重试');
    } finally {
      setIsCreating(false);
    }
  }, [name, category, title, description, github.docsDir, createDocument, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <FolderPlus size={20} className="text-brand" />
            新建文档
          </h3>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              文件名 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="my-article.md"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              分类目录
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
              placeholder="如：实用工具、学习笔记"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="文档标题"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[60px] resize-y"
              placeholder="文档描述（可选）"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="btn-primary"
          >
            {isCreating ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
}
