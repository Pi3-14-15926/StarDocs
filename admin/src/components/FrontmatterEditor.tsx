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
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
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
        <label className="mb-1 block text-xs font-medium text-gray-500">
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
        <label className="mb-1 block text-xs font-medium text-gray-500">
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
        <label className="mb-1 block text-xs font-medium text-gray-500">
          标签
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(Array.isArray(frontmatter.tags) ? frontmatter.tags : []).map(
            (tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs text-brand"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-brand-dark"
                >
                  <X size={12} />
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
          <button onClick={handleAddTag} className="btn-secondary px-2">
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
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
        <div className="pt-2 text-xs text-gray-400">
          分支: {github.defaultBranch}
        </div>
      )}
    </div>
  );
}
