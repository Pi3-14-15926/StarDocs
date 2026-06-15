import { useCallback, useEffect, useRef, useState } from 'react';
import { Save, Eye, Edit3, Bold, Italic, Code, Link, Image, List, Heading1, Heading2, Pencil } from 'lucide-react';
import { useDocumentStore } from '@/stores/documentStore';
import { showAlert } from '@/hooks/useAlert';
import clsx from 'clsx';

interface EditorToolbarProps {
  onInsert: (before: string, after?: string) => void;
}

function EditorToolbar({ onInsert }: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-1 border-b border-gray-200 px-3 py-1.5 dark:border-gray-700">
      <button onClick={() => onInsert('**', '**')} className="btn-ghost px-2 py-1" title="粗体">
        <Bold size={16} />
      </button>
      <button onClick={() => onInsert('*', '*')} className="btn-ghost px-2 py-1" title="斜体">
        <Italic size={16} />
      </button>
      <button onClick={() => onInsert('`', '`')} className="btn-ghost px-2 py-1" title="代码">
        <Code size={16} />
      </button>
      <button onClick={() => onInsert('[', '](url)')} className="btn-ghost px-2 py-1" title="链接">
        <Link size={16} />
      </button>
      <button onClick={() => onInsert('![alt](', ')')} className="btn-ghost px-2 py-1" title="图片">
        <Image size={16} />
      </button>
      <div className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />
      <button onClick={() => onInsert('# ')} className="btn-ghost px-2 py-1" title="一级标题">
        <Heading1 size={16} />
      </button>
      <button onClick={() => onInsert('## ')} className="btn-ghost px-2 py-1" title="二级标题">
        <Heading2 size={16} />
      </button>
      <button onClick={() => onInsert('- ')} className="btn-ghost px-2 py-1" title="列表">
        <List size={16} />
      </button>
    </div>
  );
}

export function MarkdownEditor() {
  const { currentContent, currentPath, setCurrentContent, saveDocument, isSaving, lastSaved, renameDocument, isLoading } =
    useDocumentStore();
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localContent, setLocalContent] = useState('');
  const [prevPath, setPrevPath] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (currentPath !== prevPath) {
      setPrevPath(currentPath);
      setLocalContent('');
      setIsPreview(false);
      setIsRenaming(false);
    }
  }, [currentPath, prevPath]);

  useEffect(() => {
    if (!isLoading && currentPath === prevPath) {
      setLocalContent(currentContent);
    }
  }, [currentContent, isLoading, currentPath, prevPath]);

  const handleSave = useCallback(async () => {
    setCurrentContent(localContent);
    await saveDocument();
  }, [localContent, setCurrentContent, saveDocument]);

  const handleRename = useCallback(async () => {
    if (!currentPath || !newName.trim()) return;
    const fileName = newName.trim();
    const finalName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    const dir = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const newPath = `${dir}/${finalName}`;
    try {
      await renameDocument(newPath);
      setIsRenaming(false);
    } catch (error) {
      showAlert('error', '重命名失败', error instanceof Error ? error.message : '未知错误');
    }
  }, [currentPath, newName, renameDocument]);

  const handleInsert = useCallback(
    (before: string, after?: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = localContent.substring(start, end);
      const replacement = before + (selected || 'text') + (after || '');
      const newContent =
        localContent.substring(0, start) + replacement + localContent.substring(end);

      setLocalContent(newContent);

      setTimeout(() => {
        textarea.focus();
        const cursorPos = start + before.length;
        textarea.setSelectionRange(cursorPos, cursorPos + (selected || 'text').length);
      }, 0);
    },
    [localContent],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (!currentPath) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        选择或创建一个文档开始编辑
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {isRenaming ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') setIsRenaming(false);
                }}
                className="input-field w-48 py-1 text-sm"
                autoFocus
                placeholder="新文件名"
              />
              <button onClick={handleRename} className="btn-primary px-2 py-1 text-xs">
                确认
              </button>
              <button onClick={() => setIsRenaming(false)} className="btn-ghost px-2 py-1 text-xs">
                取消
              </button>
            </div>
          ) : (
            <>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {currentPath.split('/').pop()}
              </span>
              <button
                onClick={() => {
                  setNewName(currentPath.split('/').pop() || '');
                  setIsRenaming(true);
                }}
                className="text-gray-400 hover:text-brand transition-colors"
                title="重命名"
              >
                <Pencil size={14} />
              </button>
            </>
          )}
          {lastSaved && (
            <span className="text-xs text-gray-400">
              已保存 {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={clsx('btn-ghost text-xs', isPreview && 'bg-gray-100 dark:bg-gray-800')}
          >
            {isPreview ? <Edit3 size={14} /> : <Eye size={14} />}
            {isPreview ? '编辑' : '预览'}
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary text-xs">
            <Save size={14} />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <EditorToolbar onInsert={handleInsert} />

      <div className="flex-1 overflow-auto">
        {isPreview ? (
          <div className="h-full overflow-y-auto p-4 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: renderMarkdown(localContent) }} />
        ) : (
          <textarea
            ref={textareaRef}
            key={currentPath}
            defaultValue={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            className="h-full w-full resize-none border-none bg-transparent p-4 font-mono text-sm focus:outline-none"
            placeholder="开始编写 Markdown..."
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
}

function renderMarkdown(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1.17em;font-weight:bold;margin:16px 0 8px;color:inherit">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.5em;font-weight:bold;margin:20px 0 10px;color:inherit">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:2em;font-weight:bold;margin:24px 0 12px;color:inherit">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="font-style:italic">$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:0.9em;color:#e11d48">$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:8px 0" />')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#3b82f6;text-decoration:underline">$1</a>')
    .replace(/^- (.+)$/gm, '<li style="margin:4px 0;margin-left:20px">$1</li>')
    .replace(/(<li.*>.*<\/li>\n?)+/g, '<ul style="list-style:disc;padding-left:20px;margin:8px 0">$&</ul>')
    .replace(/^(\d+)\. (.+)$/gm, '<li style="margin:4px 0;margin-left:20px;list-style:decimal">$2</li>')
    .replace(/\n\n/g, '</p><p style="margin:12px 0;line-height:1.7">')
    .replace(/\n/g, '<br/>');

  if (!html.startsWith('<')) html = `<p style="margin:12px 0;line-height:1.7">${html}</p>`;
  return html;
}
