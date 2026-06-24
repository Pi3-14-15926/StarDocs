import { Plus, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useConfigStore } from '@/stores/configStore';
import type { Frontmatter } from '@/types';

interface FrontmatterEditorProps {
  frontmatter: Frontmatter;
  onChange: (frontmatter: Frontmatter) => void;
}

export function FrontmatterEditor({
  frontmatter,
  onChange,
}: FrontmatterEditorProps) {
  const { github } = useConfigStore();
  const [newTag, setNewTag] = useState('');

  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...frontmatter, [key]: value });
    },
    [frontmatter, onChange],
  );

  const handleAddTag = useCallback(() => {
    if (!newTag.trim()) return;
    const tags = Array.isArray(frontmatter.tags) ? [...frontmatter.tags] : [];
    if (!tags.includes(newTag.trim())) {
      tags.push(newTag.trim());
      handleFieldChange('tags', tags);
    }
    setNewTag('');
  }, [newTag, frontmatter.tags, handleFieldChange]);

  const handleRemoveTag = useCallback(
    (tag: string) => {
      const tags = (frontmatter.tags as string[] | undefined) ?? [];
      handleFieldChange(
        'tags',
        tags.filter((t) => t !== tag),
      );
    },
    [frontmatter.tags, handleFieldChange],
  );

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
          标题
        </label>
        <input
          type="text"
          value={(frontmatter.title as string) ?? ''}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          className="input-field"
          placeholder="文档标题"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
          描述
        </label>
        <textarea
          value={(frontmatter.description as string) ?? ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          className="input-field min-h-[80px] resize-y"
          placeholder="文档描述（用于SEO）"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
          分类
        </label>
        <input
          type="text"
          value={(frontmatter.category as string) ?? ''}
          onChange={(e) => handleFieldChange('category', e.target.value)}
          className="input-field"
          placeholder="文档分类"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
          标签
        </label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {(Array.isArray(frontmatter.tags) ? frontmatter.tags : []).map(
            (tag) => (
              <span key={tag} className="badge badge-brand gap-1">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-0.5 rounded-full hover:bg-brand/20 p-0.5 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ),
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' && (e.preventDefault(), handleAddTag())
            }
            className="input-field flex-1"
            placeholder="添加标签"
          />
          <button onClick={handleAddTag} className="btn-secondary px-3">
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
          关键词
        </label>
        <input
          type="text"
          value={
            Array.isArray(frontmatter.keywords)
              ? frontmatter.keywords.join(', ')
              : ''
          }
          onChange={(e) =>
            handleFieldChange(
              'keywords',
              e.target.value
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean),
            )
          }
          className="input-field"
          placeholder="关键词（逗号分隔）"
        />
      </div>

      {github.defaultBranch && (
        <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800/50">
          <p className="text-xs text-surface-500 dark:text-surface-400">
            分支:{' '}
            <span className="font-medium text-surface-600 dark:text-surface-300">
              {github.defaultBranch}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
