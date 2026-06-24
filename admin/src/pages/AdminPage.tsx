import clsx from 'clsx';
import {
  ChevronLeft,
  Copy,
  FileText,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIToolbar } from '@/components/AIToolbar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DocumentTree } from '@/components/DocumentTree';
import { ImageUploader } from '@/components/ImageUploader';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { NewDocumentDialog } from '@/components/NewDocumentDialog';
import { NewFolderDialog } from '@/components/NewFolderDialog';
import { UploadDocumentDialog } from '@/components/UploadDocumentDialog';
import { showAlert } from '@/hooks/useAlert';
import { useConfigStore } from '@/stores/configStore';
import { useDocumentStore } from '@/stores/documentStore';

export function AdminPage() {
  const navigate = useNavigate();
  const { loadTree, currentPath, deleteDocument } = useDocumentStore();
  const { github } = useConfigStore();
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderParentPath, setNewFolderParentPath] = useState('');
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );
  const [isMobile, setIsMobile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const handleSelect = () => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        if (start !== end) {
          const text = textarea.value.substring(start, end);
          setSelectedText(text);
        }
      }
    };
    document.addEventListener('selectionchange', handleSelect);
    document.addEventListener('mouseup', handleSelect);
    document.addEventListener('touchend', handleSelect);
    return () => {
      document.removeEventListener('selectionchange', handleSelect);
      document.removeEventListener('mouseup', handleSelect);
      document.removeEventListener('touchend', handleSelect);
    };
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('rspress-admin-config');
    navigate('/admin/setup');
  }, [navigate]);

  const handleDelete = useCallback(async () => {
    if (!currentPath) return;
    setShowDeleteConfirm(true);
  }, [currentPath]);

  const confirmDelete = useCallback(async () => {
    if (!currentPath) return;
    setShowDeleteConfirm(false);
    try {
      await deleteDocument(currentPath);
      showAlert('success', '删除成功', '文档已删除');
    } catch (error) {
      showAlert(
        'error',
        '删除失败',
        error instanceof Error ? error.message : '未知错误',
      );
    }
  }, [currentPath, deleteDocument]);

  const handleCopyPath = useCallback(() => {
    if (!currentPath) return;
    navigator.clipboard.writeText(currentPath);
    showAlert('success', '已复制', '路径已复制到剪贴板');
  }, [currentPath]);

  const handleNewFolder = useCallback((parentPath: string) => {
    setNewFolderParentPath(parentPath);
    setShowNewFolder(true);
  }, []);

  const fileName = currentPath?.split('/').pop() ?? '';

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* Mobile overlay */}
      {isMobile && showSidebar && (
        <div
          className="fixed inset-0 z-30 bg-surface-900/60 backdrop-blur-sm"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'sidebar fixed z-40 flex h-full w-72 flex-col transition-transform duration-300 ease-out md:relative md:translate-x-0',
          showSidebar ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark shadow-lg shadow-brand/25">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-surface-900 dark:text-surface-100">
                文档管理
              </span>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {github.owner}/{github.repo}
              </p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setShowSidebar(false)}
              className="toolbar-btn"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <DocumentTree
            onNewDocument={() => setShowNewDoc(true)}
            onUploadDocument={() => setShowUploadDoc(true)}
            onNewFolder={handleNewFolder}
          />
        </div>

        <div className="border-t border-surface-200/60 p-3 dark:border-surface-700/60">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsDark(!isDark)}
              className="toolbar-btn"
              title={isDark ? '浅色模式' : '深色模式'}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="toolbar-btn"
              title="设置"
            >
              <Settings size={17} />
            </button>
            <div className="flex-1" />
            <button
              onClick={handleLogout}
              className="toolbar-btn text-surface-400 hover:text-red-500 dark:text-surface-500 dark:hover:text-red-400"
              title="退出"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* PC Top bar */}
        {!isMobile && (
          <header className="header flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="toolbar-btn"
              >
                <ChevronLeft
                  size={18}
                  className={clsx(
                    'transition-transform duration-200',
                    !showSidebar && 'rotate-180',
                  )}
                />
              </button>
              <div className="flex items-center gap-1.5 text-sm text-surface-500">
                {currentPath?.split('/').map((part, i, arr) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <span className="text-surface-300 dark:text-surface-600">
                        /
                      </span>
                    )}
                    <span
                      className={
                        i === arr.length - 1
                          ? 'font-medium text-surface-700 dark:text-surface-200'
                          : ''
                      }
                    >
                      {part}
                    </span>
                  </span>
                )) ?? <span className="text-surface-400">未选择文档</span>}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <AIToolbar
                selectedText={selectedText}
                onReplace={(text) => {
                  const editor = document.querySelector('textarea');
                  if (editor) {
                    const start = editor.selectionStart;
                    const end = editor.selectionEnd;
                    const value = editor.value;
                    editor.value =
                      value.substring(0, start) + text + value.substring(end);
                    editor.setSelectionRange(start, start + text.length);
                  }
                }}
                onInsert={(text) => {
                  const editor = document.querySelector('textarea');
                  if (editor) {
                    const pos = editor.selectionStart;
                    const value = editor.value;
                    editor.value =
                      value.substring(0, pos) + text + value.substring(pos);
                    editor.setSelectionRange(
                      pos + text.length,
                      pos + text.length,
                    );
                  }
                }}
              />
              <ImageUploader
                onInsert={(url) => {
                  const editor = document.querySelector('textarea');
                  if (editor) {
                    const pos = editor.selectionStart;
                    const value = editor.value;
                    const insertion = `![image](${url})`;
                    editor.value =
                      value.substring(0, pos) +
                      insertion +
                      value.substring(pos);
                    editor.setSelectionRange(
                      pos + insertion.length,
                      pos + insertion.length,
                    );
                  }
                }}
              />
              {currentPath && (
                <>
                  <div className="mx-1 h-5 w-px bg-surface-200 dark:bg-surface-700" />
                  <button
                    onClick={handleCopyPath}
                    className="toolbar-btn"
                    title="复制路径"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="toolbar-btn text-red-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    title="删除文档"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          </header>
        )}

        {/* Mobile Top bar */}
        {isMobile && (
          <header className="header">
            <div className="flex items-center justify-between px-3 py-2.5">
              <button
                onClick={() => setShowSidebar(true)}
                className="toolbar-btn"
              >
                <Menu size={20} />
              </button>
              <span className="flex-1 truncate text-center text-sm font-semibold text-surface-700 dark:text-surface-200">
                {fileName || '文档管理'}
              </span>
              <div className="w-9" />
            </div>
            {currentPath && (
              <div className="flex items-center gap-1 border-t border-surface-100 px-2 py-1.5 dark:border-surface-800">
                <AIToolbar
                  selectedText={selectedText}
                  onReplace={(text) => {
                    const editor = document.querySelector('textarea');
                    if (editor) {
                      const start = editor.selectionStart;
                      const end = editor.selectionEnd;
                      const value = editor.value;
                      editor.value =
                        value.substring(0, start) + text + value.substring(end);
                      editor.setSelectionRange(start, start + text.length);
                    }
                  }}
                  onInsert={(text) => {
                    const editor = document.querySelector('textarea');
                    if (editor) {
                      const pos = editor.selectionStart;
                      const value = editor.value;
                      editor.value =
                        value.substring(0, pos) + text + value.substring(pos);
                      editor.setSelectionRange(
                        pos + text.length,
                        pos + text.length,
                      );
                    }
                  }}
                />
                <ImageUploader
                  onInsert={(url) => {
                    const editor = document.querySelector('textarea');
                    if (editor) {
                      const pos = editor.selectionStart;
                      const value = editor.value;
                      const insertion = `![image](${url})`;
                      editor.value =
                        value.substring(0, pos) +
                        insertion +
                        value.substring(pos);
                      editor.setSelectionRange(
                        pos + insertion.length,
                        pos + insertion.length,
                      );
                    }
                  }}
                />
                <div className="flex-1" />
                <button
                  onClick={handleCopyPath}
                  className="toolbar-btn"
                  title="复制路径"
                >
                  <Copy size={15} />
                </button>
                <button
                  onClick={handleDelete}
                  className="toolbar-btn text-red-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  title="删除"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </header>
        )}

        {/* Editor area */}
        <div className="flex flex-1 overflow-hidden bg-white dark:bg-surface-900">
          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <MarkdownEditor />
          </div>
        </div>
      </main>

      <NewDocumentDialog
        isOpen={showNewDoc}
        onClose={() => setShowNewDoc(false)}
      />
      <NewFolderDialog
        isOpen={showNewFolder}
        parentPath={newFolderParentPath}
        onClose={() => setShowNewFolder(false)}
      />
      <UploadDocumentDialog
        isOpen={showUploadDoc}
        onClose={() => setShowUploadDoc(false)}
      />
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="删除文档"
        message={`确定删除 ${currentPath?.split('/').pop()}？此操作不可恢复。`}
        confirmText="删除"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
