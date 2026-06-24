import clsx from 'clsx';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderInput,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useConfigStore } from '@/stores/configStore';
import type { DocumentNode } from '@/types';
import { ConfirmDialog } from './ConfirmDialog';
import { MoveDialog } from './MoveDialog';
import { showAlert } from '@/hooks/useAlert';

interface TreeNodeProps {
  node: DocumentNode;
  level?: number;
  onNewFolder?: (parentPath: string) => void;
}

function TreeNodeComponent({ node, level = 0, onNewFolder }: TreeNodeProps) {
  const {
    currentPath,
    loadDocument,
    expandedPaths,
    toggleExpanded,
    deleteDocument,
    renameDirectory,
  } = useDocumentStore();
  const { github } = useConfigStore();
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isExpanded = expandedPaths.has(node.path);
  const isActive = currentPath === node.path;
  const isDir = node.type === 'directory';
  const docsDir = github.docsDir || 'docs';

  const handleClick = useCallback(async () => {
    if (isDir) {
      setIsLoadingChildren(true);
      await toggleExpanded(node.path);
      setIsLoadingChildren(false);
    } else {
      loadDocument(node.path);
    }
  }, [isDir, node.path, toggleExpanded, loadDocument]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
    setShowMenu(false);
  }, []);

  const confirmDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    await deleteDocument(node.path);
  }, [node.path, deleteDocument]);

  const handleRename = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setNewName(node.name);
    setIsRenaming(true);
    setShowMenu(false);
  }, [node.name]);

  const confirmRename = useCallback(async () => {
    if (!newName.trim() || newName === node.name) {
      setIsRenaming(false);
      return;
    }

    const oldDirPath = node.path;
    const parentPath = oldDirPath.substring(0, oldDirPath.lastIndexOf('/'));
    const newPath = `${parentPath}/${newName.trim()}`;

    try {
      await renameDirectory(oldDirPath, newPath);
      setIsRenaming(false);
      showAlert('success', '重命名成功', `文件夹已重命名为 ${newName.trim()}`);
    } catch (error) {
      showAlert(
        'error',
        '重命名失败',
        error instanceof Error ? error.message : '请重试',
      );
    }
  }, [newName, node.name, node.path, renameDirectory]);

  const handleMove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMoveDialog(true);
    setShowMenu(false);
  }, []);

  const handleNewSubfolder = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onNewFolder) {
        onNewFolder(node.path);
      }
      setShowMenu(false);
    },
    [node.path, onNewFolder],
  );

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  }, []);

  const icon = isDir ? (
    isLoadingChildren ? (
      <Loader2 size={16} className="text-brand animate-spin" />
    ) : isExpanded ? (
      <FolderOpen size={16} className="text-brand" />
    ) : (
      <Folder size={16} className="text-brand" />
    )
  ) : (
    <FileText size={16} className="text-gray-400" />
  );

  const chevron = isDir ? (
    isLoadingChildren ? null : isExpanded ? (
      <ChevronDown size={14} className="text-gray-400" />
    ) : (
      <ChevronRight size={14} className="text-gray-400" />
    )
  ) : null;

  return (
    <div>
      <div
        onClick={handleClick}
        className={clsx(
          'group flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
          isActive
            ? 'bg-brand/10 text-brand font-medium'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {chevron}
        {icon}
        {isRenaming ? (
          <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              onBlur={confirmRename}
              className="input-field py-0.5 text-xs"
              autoFocus
            />
          </div>
        ) : (
          <span className="truncate flex-1">{node.name}</span>
        )}
        {!isRenaming && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuToggle}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity p-0.5"
            >
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {isDir && (
                  <>
                    <button
                      onClick={handleNewSubfolder}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <FolderPlus size={14} />
                      新建子文件夹
                    </button>
                    <button
                      onClick={handleRename}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Pencil size={14} />
                      重命名
                    </button>
                    <button
                      onClick={handleMove}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <FolderInput size={14} />
                      移动
                    </button>
                    <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={handleDelete}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={14} />
                      删除
                    </button>
                  </>
                )}
                {!isDir && (
                  <button
                    onClick={handleMove}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <FolderInput size={14} />
                    移动
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {isDir && isExpanded && node.children && (
        <div>
          {node.children
            .sort((a, b) => {
              if (a.type === b.type) return a.name.localeCompare(b.name);
              return a.type === 'directory' ? -1 : 1;
            })
            .map((child) => (
              <TreeNodeComponent
                key={child.path}
                node={child}
                level={level + 1}
                onNewFolder={onNewFolder}
              />
            ))}
        </div>
      )}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={isDir ? '删除文件夹' : '删除文档'}
        message={
          isDir
            ? `确定删除文件夹 "${node.name}" 及其所有内容？此操作不可恢复。`
            : `确定删除 ${node.name}？此操作不可恢复。`
        }
        confirmText="删除"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      {showMoveDialog && (
        <MoveDialog
          isOpen={showMoveDialog}
          sourcePath={node.path}
          sourceName={node.name}
          sourceType={node.type}
          onClose={() => setShowMoveDialog(false)}
        />
      )}
    </div>
  );
}

interface DocumentTreeProps {
  onNewDocument?: () => void;
  onUploadDocument?: () => void;
  onNewFolder?: (parentPath: string) => void;
}

export function DocumentTree({
  onNewDocument,
  onUploadDocument,
  onNewFolder,
}: DocumentTreeProps) {
  const { tree, isLoading, searchQuery, setSearchQuery } = useDocumentStore();

  const filterTree = (nodes: DocumentNode[], query: string): DocumentNode[] => {
    if (!query) return nodes;
    return nodes
      .map((node) => {
        if (node.type === 'directory' && node.children) {
          const filtered = filterTree(node.children, query);
          if (filtered.length > 0) return { ...node, children: filtered };
          return null;
        }
        if (node.name.toLowerCase().includes(query.toLowerCase())) return node;
        return null;
      })
      .filter(Boolean) as DocumentNode[];
  };

  const displayTree = filterTree(tree, searchQuery);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 p-3 dark:border-gray-700">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="搜索文档..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-8 py-1.5 text-xs"
          />
        </div>
        <button
          onClick={onNewDocument}
          className="btn-primary px-2 py-1.5"
          title="新建文档"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => onNewFolder && onNewFolder('')}
          className="btn-primary px-2 py-1.5"
          title="新建文件夹"
        >
          <FolderPlus size={14} />
        </button>
        <button
          onClick={onUploadDocument}
          className="btn-primary px-2 py-1.5"
          title="上传文档"
        >
          <Upload size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            加载中...
          </div>
        ) : displayTree.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            {searchQuery ? '未找到匹配的文档' : '暂无文档'}
          </div>
        ) : (
          displayTree
            .sort((a, b) => {
              if (a.type === b.type) return a.name.localeCompare(b.name);
              return a.type === 'directory' ? -1 : 1;
            })
            .map((node) => (
              <TreeNodeComponent
                key={node.path}
                node={node}
                onNewFolder={onNewFolder}
              />
            ))
        )}
      </div>
    </div>
  );
}
