import clsx from 'clsx';
import {
  Bold,
  Code,
  Edit3,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link,
  List,
  Pencil,
  Quote,
  Redo,
  Save,
  Strikethrough,
  Undo,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { showAlert } from '@/hooks/useAlert';
import { useDocumentStore } from '@/stores/documentStore';

interface HistoryState {
  content: string;
  timestamp: number;
}

interface EditorToolbarProps {
  onInsert: (before: string, after?: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

function EditorToolbar({
  onInsert,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-surface-200/60 px-3 py-2 dark:border-surface-700/60">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={clsx(
          'toolbar-btn',
          !canUndo && 'opacity-40 cursor-not-allowed',
        )}
        title="撤销 (Ctrl+Z)"
      >
        <Undo size={15} />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={clsx(
          'toolbar-btn',
          !canRedo && 'opacity-40 cursor-not-allowed',
        )}
        title="重做 (Ctrl+Y)"
      >
        <Redo size={15} />
      </button>
      <div className="mx-1.5 h-4 w-px bg-surface-200 dark:bg-surface-700" />
      <button
        onClick={() => onInsert('**', '**')}
        className="toolbar-btn"
        title="粗体"
      >
        <Bold size={15} />
      </button>
      <button
        onClick={() => onInsert('*', '*')}
        className="toolbar-btn"
        title="斜体"
      >
        <Italic size={15} />
      </button>
      <button
        onClick={() => onInsert('~~', '~~')}
        className="toolbar-btn"
        title="删除线"
      >
        <Strikethrough size={15} />
      </button>
      <button
        onClick={() => onInsert('`', '`')}
        className="toolbar-btn"
        title="行内代码"
      >
        <Code size={15} />
      </button>
      <div className="mx-1.5 h-4 w-px bg-surface-200 dark:bg-surface-700" />
      <button
        onClick={() => onInsert('> ')}
        className="toolbar-btn"
        title="引用"
      >
        <Quote size={15} />
      </button>
      <button
        onClick={() => onInsert('[', '](url)')}
        className="toolbar-btn"
        title="链接"
      >
        <Link size={15} />
      </button>
      <button
        onClick={() => onInsert('![alt](', ')')}
        className="toolbar-btn"
        title="图片"
      >
        <Image size={15} />
      </button>
      <div className="mx-1.5 h-4 w-px bg-surface-200 dark:bg-surface-700" />
      <button
        onClick={() => onInsert('# ')}
        className="toolbar-btn"
        title="一级标题"
      >
        <Heading1 size={15} />
      </button>
      <button
        onClick={() => onInsert('## ')}
        className="toolbar-btn"
        title="二级标题"
      >
        <Heading2 size={15} />
      </button>
      <button
        onClick={() => onInsert('### ')}
        className="toolbar-btn"
        title="三级标题"
      >
        <Heading3 size={15} />
      </button>
      <button
        onClick={() => onInsert('- ')}
        className="toolbar-btn"
        title="列表"
      >
        <List size={15} />
      </button>
    </div>
  );
}

const MAX_HISTORY = 100;

function extractTitle(content: string): string {
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  const h2Match = content.match(/^##\s+(.+)$/m);
  if (h2Match) return h2Match[1].trim();
  return '';
}

function setTitleInContent(content: string, newTitle: string): string {
  const lines = content.split('\n');
  let titleIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^#\s+/.test(lines[i])) {
      titleIndex = i;
      break;
    }
    if (/^##\s+/.test(lines[i]) && titleIndex === -1) {
      titleIndex = i;
      break;
    }
  }

  if (titleIndex >= 0) {
    const line = lines[titleIndex];
    const isH1 = line.startsWith('# ');
    lines[titleIndex] = (isH1 ? '# ' : '## ') + newTitle;
  } else {
    lines.unshift(`# ${newTitle}`, '');
  }

  return lines.join('\n');
}

interface MarkdownEditorProps {
  externalInsert?: string;
  externalInsertKey?: number;
  onExternalInsertDone?: () => void;
  externalAiText?: string;
  externalAiKey?: number;
  aiReplaceSelected?: boolean;
  onExternalAiDone?: () => void;
}

export function MarkdownEditor({
  externalInsert,
  externalInsertKey,
  onExternalInsertDone,
  externalAiText,
  externalAiKey,
  aiReplaceSelected,
  onExternalAiDone,
}: MarkdownEditorProps) {
  const {
    currentContent,
    currentPath,
    setCurrentContent,
    saveDocument,
    isSaving,
    lastSaved,
    renameDocument,
  } = useDocumentStore();
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);

  const displayContent = isEditing ? localContent : currentContent;
  const currentTitle = extractTitle(displayContent);

  useEffect(() => {
    setIsEditing(false);
    setLocalContent('');
    setIsPreview(false);
    setIsEditingTitle(false);
    setHistory([]);
    setHistoryIndex(-1);
  }, [currentPath]);

  useEffect(() => {
    if (isEditing && !isUndoRedoRef.current) {
      const now = Date.now();
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ content: displayContent, timestamp: now });
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    isUndoRedoRef.current = false;
  }, [displayContent, isEditing]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setLocalContent(history[newIndex].content);
      setIsEditing(true);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setLocalContent(history[newIndex].content);
      setIsEditing(true);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleSave = useCallback(async () => {
    setCurrentContent(displayContent);
    await saveDocument();
  }, [displayContent, setCurrentContent, saveDocument]);

  const handleTitleSave = useCallback(async () => {
    if (!editTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    const newContent = setTitleInContent(displayContent, editTitle.trim());
    setLocalContent(newContent);
    setIsEditing(true);
    setIsEditingTitle(false);
    setCurrentContent(newContent);
    await saveDocument();
  }, [editTitle, displayContent, setCurrentContent, saveDocument]);

  const handleInsert = useCallback(
    (before: string, after?: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (!isEditing) {
        setIsEditing(true);
        setLocalContent(currentContent);
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = displayContent.substring(start, end);
      const replacement = before + (selected || 'text') + (after || '');
      const newContent =
        displayContent.substring(0, start) +
        replacement +
        displayContent.substring(end);

      setLocalContent(newContent);

      setTimeout(() => {
        textarea.focus();
        const cursorPos = start + before.length;
        textarea.setSelectionRange(
          cursorPos,
          cursorPos + (selected || 'text').length,
        );
      }, 0);
    },
    [displayContent, currentContent, isEditing],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleUndo, handleRedo]);

  useEffect(() => {
    if (!externalInsert) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (!isEditing) {
      setIsEditing(true);
      setLocalContent(currentContent);
    }

    const currentVal = isEditing ? localContent : currentContent;
    const pos = textarea.selectionStart || currentVal.length;
    const insertion = `![image](${externalInsert})`;
    const newContent =
      currentVal.substring(0, pos) + insertion + currentVal.substring(pos);

    setLocalContent(newContent);
    setIsEditing(true);

    setTimeout(() => {
      textarea.focus();
      const cursorPos = pos + insertion.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);

    onExternalInsertDone?.();
  }, [externalInsert, externalInsertKey]);

  useEffect(() => {
    if (!externalAiText) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (!isEditing) {
      setIsEditing(true);
      setLocalContent(currentContent);
    }

    const currentVal = isEditing ? localContent : currentContent;

    if (aiReplaceSelected) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        currentVal.substring(0, start) + externalAiText + currentVal.substring(end);
      setLocalContent(newContent);
      setIsEditing(true);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + externalAiText.length);
      }, 0);
    } else {
      const pos = textarea.selectionStart || currentVal.length;
      const newContent =
        currentVal.substring(0, pos) + externalAiText + currentVal.substring(pos);
      setLocalContent(newContent);
      setIsEditing(true);
      setTimeout(() => {
        textarea.focus();
        const cursorPos = pos + externalAiText.length;
        textarea.setSelectionRange(cursorPos, cursorPos);
      }, 0);
    }

    onExternalAiDone?.();
  }, [externalAiText, externalAiKey]);

  if (!currentPath) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-surface-400">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
          <Edit3 size={24} className="text-surface-400" />
        </div>
        <p className="mt-4 text-sm font-medium">选择或创建一个文档开始编辑</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-surface-200/60 px-4 py-2.5 dark:border-surface-700/60">
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                className="input-field w-64 py-1.5 text-sm"
                autoFocus
                placeholder="输入文章标题"
              />
              <button
                onClick={handleTitleSave}
                className="btn-primary px-3 py-1.5 text-xs"
              >
                保存
              </button>
              <button
                onClick={() => setIsEditingTitle(false)}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                取消
              </button>
            </div>
          ) : (
            <>
              <span className="text-lg font-bold text-surface-700 dark:text-surface-200">
                {currentTitle || '无标题'}
              </span>
              <button
                onClick={() => {
                  setEditTitle(currentTitle);
                  setIsEditingTitle(true);
                }}
                className="text-surface-400 hover:text-brand transition-colors duration-150"
                title="编辑标题"
              >
                <Pencil size={15} />
              </button>
            </>
          )}
          {lastSaved && (
            <span className="text-xs text-surface-400">
              已保存 {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={clsx(
              'toolbar-btn',
              isPreview && 'bg-surface-100 dark:bg-surface-800',
            )}
          >
            {isPreview ? <Edit3 size={14} /> : <Eye size={14} />}
            <span className="text-xs font-medium">
              {isPreview ? '编辑' : '预览'}
            </span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary px-3 py-1.5 text-xs"
          >
            <Save size={13} />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <EditorToolbar
        onInsert={handleInsert}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <div className="flex-1 overflow-auto">
        {isPreview ? (
          <div
            className="h-full overflow-y-auto p-6 dark:text-surface-200"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent) }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={displayContent}
            onChange={(e) => {
              setIsEditing(true);
              setLocalContent(e.target.value);
            }}
            className="h-full w-full resize-none border-none bg-transparent p-6 font-mono text-sm leading-relaxed focus:outline-none dark:text-surface-200"
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
    .replace(
      /^### (.+)$/gm,
      '<h3 style="font-size:1.17em;font-weight:bold;margin:20px 0 10px;color:inherit">$1</h3>',
    )
    .replace(
      /^## (.+)$/gm,
      '<h2 style="font-size:1.5em;font-weight:bold;margin:24px 0 12px;color:inherit">$1</h2>',
    )
    .replace(
      /^# (.+)$/gm,
      '<h1 style="font-size:2em;font-weight:bold;margin:28px 0 16px;color:inherit">$1</h1>',
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="font-style:italic">$1</em>')
    .replace(
      /~~(.+?)~~/g,
      '<del style="text-decoration:line-through;color:#64748B">$1</del>',
    )
    .replace(
      /`(.+?)`/g,
      '<code style="background:rgba(99,102,241,0.1);padding:2px 8px;border-radius:6px;font-size:0.9em;color:#6366F1">$1</code>',
    )
    .replace(
      /^> (.+)$/gm,
      '<blockquote style="border-left:4px solid #6366F1;padding-left:16px;margin:12px 0;color:#64748B;font-style:italic">$1</blockquote>',
    )
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" style="max-width:100%;border-radius:12px;margin:12px 0" />',
    )
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener" style="color:#6366F1;text-decoration:underline;text-underline-offset:2px">$1</a>',
    )
    .replace(/^- (.+)$/gm, '<li style="margin:6px 0;margin-left:24px">$1</li>')
    .replace(
      /(<li.*>.*<\/li>\n?)+/g,
      '<ul style="list-style:disc;padding-left:24px;margin:12px 0">$&</ul>',
    )
    .replace(
      /^(\d+)\. (.+)$/gm,
      '<li style="margin:6px 0;margin-left:24px;list-style:decimal">$2</li>',
    )
    .replace(/\n\n/g, '</p><p style="margin:14px 0;line-height:1.8">')
    .replace(/\n/g, '<br/>');

  if (!html.startsWith('<'))
    html = `<p style="margin:14px 0;line-height:1.8">${html}</p>`;
  return html;
}
