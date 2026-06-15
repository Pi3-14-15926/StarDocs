import { useState, useCallback, useEffect } from 'react';
import {
  Menu,
  X,
  FileText,
  Settings,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  Trash2,
  Copy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DocumentTree } from '@/components/DocumentTree';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { FrontmatterEditor } from '@/components/FrontmatterEditor';
import { AIToolbar } from '@/components/AIToolbar';
import { ImageUploader } from '@/components/ImageUploader';
import { NewDocumentDialog } from '@/components/NewDocumentDialog';
import { useDocumentStore } from '@/stores/documentStore';
import { useConfigStore } from '@/stores/configStore';
import clsx from 'clsx';

export function AdminPage() {
  const navigate = useNavigate();
  const { loadTree, currentPath, currentFrontmatter, setCurrentFrontmatter, deleteDocument } =
    useDocumentStore();
  const { github } = useConfigStore();
  const [showSidebar, setShowSidebar] = useState(true);
  const [showProperties, setShowProperties] = useState(false);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
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
    if (!confirm(`确定删除 ${currentPath.split('/').pop()}？`)) return;
    try {
      await deleteDocument(currentPath);
      alert('删除成功');
    } catch (error) {
      alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [currentPath, deleteDocument]);

  const handleCopyPath = useCallback(() => {
    if (!currentPath) return;
    navigator.clipboard.writeText(currentPath);
    alert('路径已复制');
  }, [currentPath]);

  const fileName = currentPath?.split('/').pop() ?? '';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Mobile overlay */}
      {isMobile && showSidebar && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed z-40 flex h-full w-64 flex-col border-r border-gray-200 bg-white transition-transform dark:border-gray-700 dark:bg-gray-800 md:relative md:translate-x-0',
          showSidebar ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-brand" />
            <span className="font-semibold text-gray-900 dark:text-gray-100">Rspress Admin</span>
          </div>
          {isMobile && (
            <button onClick={() => setShowSidebar(false)} className="btn-ghost p-1">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <DocumentTree onNewDocument={() => setShowNewDoc(true)} />
        </div>

        <div className="border-t border-gray-200 p-3 dark:border-gray-700">
          <div className="mb-2 text-xs text-gray-400">
            {github.owner}/{github.repo}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className="btn-ghost p-2"
              title={isDark ? '浅色模式' : '深色模式'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => navigate('/admin/ai-config')}
              className="btn-ghost p-2"
              title="AI设置"
            >
              <Settings size={16} />
            </button>
            <button onClick={handleLogout} className="btn-ghost p-2" title="退出">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* PC Top bar */}
        {!isMobile && (
          <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="btn-ghost p-1"
              >
                <ChevronLeft
                  size={18}
                  className={clsx('transition-transform', !showSidebar && 'rotate-180')}
                />
              </button>
              <span className="text-sm text-gray-500">
                {currentPath?.split('/').join(' / ') ?? '未选择文档'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <AIToolbar
                selectedText=""
                onReplace={(text) => {
                  const editor = document.querySelector('textarea');
                  if (editor) {
                    const start = editor.selectionStart;
                    const end = editor.selectionEnd;
                    const value = editor.value;
                    editor.value = value.substring(0, start) + text + value.substring(end);
                    editor.setSelectionRange(start, start + text.length);
                  }
                }}
                onInsert={(text) => {
                  const editor = document.querySelector('textarea');
                  if (editor) {
                    const pos = editor.selectionStart;
                    const value = editor.value;
                    editor.value = value.substring(0, pos) + text + value.substring(pos);
                    editor.setSelectionRange(pos + text.length, pos + text.length);
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
                    editor.value = value.substring(0, pos) + insertion + value.substring(pos);
                    editor.setSelectionRange(pos + insertion.length, pos + insertion.length);
                  }
                }}
              />
              {currentPath && (
                <>
                  <button onClick={handleCopyPath} className="btn-ghost p-1.5" title="复制路径">
                    <Copy size={16} />
                  </button>
                  <button onClick={handleDelete} className="btn-ghost p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="删除文档">
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </header>
        )}

        {/* Mobile Top bar */}
        {isMobile && (
          <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {/* 第一行：菜单 + 文件名 + 关闭侧边栏 */}
            <div className="flex items-center justify-between px-3 py-2">
              <button onClick={() => setShowSidebar(true)} className="btn-ghost p-1.5">
                <Menu size={20} />
              </button>
              <span className="flex-1 truncate text-center text-sm font-medium text-gray-700 dark:text-gray-200">
                {fileName || '未选择文档'}
              </span>
              <button
                onClick={() => setShowProperties(!showProperties)}
                className="btn-ghost p-1.5"
              >
                <Settings size={18} />
              </button>
            </div>
            {/* 第二行：操作按钮 */}
            {currentPath && (
              <div className="flex items-center gap-1 border-t border-gray-100 px-2 py-1.5 dark:border-gray-700">
                <AIToolbar
                  selectedText=""
                  onReplace={(text) => {
                    const editor = document.querySelector('textarea');
                    if (editor) {
                      const start = editor.selectionStart;
                      const end = editor.selectionEnd;
                      const value = editor.value;
                      editor.value = value.substring(0, start) + text + value.substring(end);
                      editor.setSelectionRange(start, start + text.length);
                    }
                  }}
                  onInsert={(text) => {
                    const editor = document.querySelector('textarea');
                    if (editor) {
                      const pos = editor.selectionStart;
                      const value = editor.value;
                      editor.value = value.substring(0, pos) + text + value.substring(pos);
                      editor.setSelectionRange(pos + text.length, pos + text.length);
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
                      editor.value = value.substring(0, pos) + insertion + value.substring(pos);
                      editor.setSelectionRange(pos + insertion.length, pos + insertion.length);
                    }
                  }}
                />
                <div className="flex-1" />
                <button onClick={handleCopyPath} className="btn-ghost p-1.5" title="复制路径">
                  <Copy size={16} />
                </button>
                <button onClick={handleDelete} className="btn-ghost p-1.5 text-red-500" title="删除">
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </header>
        )}

        {/* Editor area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <MarkdownEditor />
          </div>

          {/* Properties panel - PC */}
          {!isMobile && currentPath && (
            <aside className="w-72 overflow-y-auto border-l border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                文档属性
              </h3>
              <FrontmatterEditor
                frontmatter={currentFrontmatter}
                onChange={setCurrentFrontmatter}
              />
            </aside>
          )}

          {/* Mobile properties drawer */}
          {isMobile && showProperties && (
            <>
              <div
                className="fixed inset-0 z-30 bg-black/50"
                onClick={() => setShowProperties(false)}
              />
              <div className="fixed bottom-0 left-0 right-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white p-4 dark:bg-gray-800">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">文档属性</h3>
                  <button onClick={() => setShowProperties(false)} className="btn-ghost p-1">
                    <X size={16} />
                  </button>
                </div>
                <FrontmatterEditor
                  frontmatter={currentFrontmatter}
                  onChange={setCurrentFrontmatter}
                />
              </div>
            </>
          )}
        </div>
      </main>

      <NewDocumentDialog isOpen={showNewDoc} onClose={() => setShowNewDoc(false)} />
    </div>
  );
}
