import { FilePlus, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { showAlert } from '@/hooks/useAlert';
import { useConfigStore } from '@/stores/configStore';
import { useDocumentStore } from '@/stores/documentStore';
import type { DocumentNode } from '@/types';

interface NewDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function getDirectoryOptions(nodes: DocumentNode[], prefix = ''): string[] {
  const result: string[] = [];
  for (const node of nodes) {
    if (node.type === 'directory') {
      const fullPath = prefix ? `${prefix}/${node.name}` : node.name;
      result.push(fullPath);
      if (node.children) {
        result.push(...getDirectoryOptions(node.children, fullPath));
      }
    }
  }
  return result;
}

export function NewDocumentDialog({ isOpen, onClose }: NewDocumentDialogProps) {
  const { createDocument, tree } = useDocumentStore();
  const { github } = useConfigStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const docsDir = github.docsDir || 'docs';
  const directories = getDirectoryOptions(tree, docsDir);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;

    const fileName = name.endsWith('.md') ? name : `${name}.md`;
    const path = category
      ? `${category}/${fileName}`
      : `${docsDir}/${fileName}`;

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
      showAlert(
        'error',
        '创建失败',
        error instanceof Error ? error.message : '请重试',
      );
    } finally {
      setIsCreating(false);
    }
  }, [name, category, title, description, docsDir, createDocument, onClose]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <FilePlus size={20} className="text-brand" />
            </div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">
              新建文档
            </h3>
          </div>
          <button onClick={onClose} className="toolbar-btn">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-surface-700 dark:text-surface-300">
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
            <label className="mb-2 block text-sm font-semibold text-surface-700 dark:text-surface-300">
              分类目录
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
            >
              <option value="">根目录</option>
              {directories.map((dir) => (
                <option key={dir} value={dir}>
                  {dir.replace(`${docsDir}/`, '')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-surface-700 dark:text-surface-300">
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
            <label className="mb-2 block text-sm font-semibold text-surface-700 dark:text-surface-300">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[80px] resize-y"
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
