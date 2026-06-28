import clsx from 'clsx';
import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  FileText,
  Folder,
  FolderInput,
  FolderOpen,
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
import { showAlert } from '@/hooks/useAlert';
import { useConfigStore } from '@/stores/configStore';
import { useDocumentStore } from '@/stores/documentStore';
import type { DocumentNode } from '@/types';
import { ConfirmDialog } from './ConfirmDialog';
import { MoveDialog } from './MoveDialog';

interface TreeNodeProps {
  node: DocumentNode;
  level?: number;
  onNewDocument?: (folderPath: string) => void;
  onUploadDocument?: (folderPath: string) => void;
}

function TreeNodeComponent({ node, level = 0, onNewDocument, onUploadDocument }: TreeNodeProps) {
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

  const handleRename = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setNewName(node.name);
      setIsRenaming(true);
      setShowMenu(false);
    },
    [node.name],
  );

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

  const handleNewDocument = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onNewDocument) {
        onNewDocument(node.path);
      }
      setShowMenu(false);
    },
    [node.path, onNewDocument],
  );

  const handleUploadDocument = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onUploadDocument) {
        onUploadDocument(node.path);
      }
      setShowMenu(false);
    },
    [node.path, onUploadDocument],
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
    <FileText size={16} className="text-surface-400" />
  );

  const chevron = isDir ? (
    isLoadingChildren ? null : isExpanded ? (
      <ChevronDown
        size={14}
        className="text-surface-400 transition-transform duration-200"
      />
    ) : (
      <ChevronRight
        size={14}
        className="text-surface-400 transition-transform duration-200"
      />
    )
  ) : null;

  return (
    <div>
      <div
        onClick={handleClick}
        className={clsx(
          'group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all duration-150',
          isActive
            ? 'bg-brand/10 text-brand font-medium shadow-sm'
            : 'text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800',
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {chevron}
        {icon}
        {isRenaming ? (
          <div
            className="flex flex-1 items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              onBlur={confirmRename}
              className="input-field py-1 px-2 text-xs"
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
              className="opacity-0 group-hover:opacity-100 text-surface-400 hover:text-surface-600 transition-all duration-150 p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700"
            >
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div className="dropdown-menu">
                {isDir && (
                  <>
                    <button onClick={handleNewDocument} className="dropdown-item">
                      <FilePlus size={15} />
                      新建文档
                    </button>
                    <button onClick={handleUploadDocument} className="dropdown-item">
                      <Upload size={15} />
                      上传文档
                    </button>
                    <div className="dropdown-divider" />
                    <button onClick={handleRename} className="dropdown-item">
                      <Pencil size={15} />
                      重命名
                    </button>
                    <button onClick={handleMove} className="dropdown-item">
                      <FolderInput size={15} />
                      移动
                    </button>
                    <div className="dropdown-divider" />
                    <button
                      onClick={handleDelete}
                      className="dropdown-item danger"
                    >
                      <Trash2 size={15} />
                      删除
                    </button>
                  </>
                )}
                {!isDir && (
                  <>
                    <button onClick={handleRename} className="dropdown-item">
                      <Pencil size={15} />
                      重命名
                    </button>
                    <button onClick={handleMove} className="dropdown-item">
                      <FolderInput size={15} />
                      移动
                    </button>
                    <div className="dropdown-divider" />
                    <button
                      onClick={handleDelete}
                      className="dropdown-item danger"
                    >
                      <Trash2 size={15} />
                      删除
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {isDir && isExpanded && node.children && (
        <div className="animate-fade-in">
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
                onNewDocument={onNewDocument}
                onUploadDocument={onUploadDocument}
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
  onNewDocument?: (folderPath?: string) => void;
  onUploadDocument?: (folderPath?: string) => void;
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
      <div className="flex items-center gap-2 border-b border-surface-200/60 p-3 dark:border-surface-700/60">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"
          />
          <input
            type="text"
            placeholder="搜索文档..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => onNewDocument?.()}
          className="toolbar-btn"
          title="新建文档"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => onNewFolder?.('')}
          className="toolbar-btn"
          title="新建文件夹"
        >
          <FolderOpen size={16} />
        </button>
        <button
          onClick={() => onUploadDocument?.()}
          className="toolbar-btn"
          title="上传文档"
        >
          <Upload size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-surface-500">
            <Loader2 size={18} className="animate-spin text-brand" />
            加载中...
          </div>
        ) : displayTree.length === 0 ? (
          <div className="py-8 text-center text-sm text-surface-500">
            {searchQuery ? '未找到匹配的文档' : '暂无文档'}
          </div>
        ) : (
          <div className="space-y-0.5">
            {displayTree
              .sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'directory' ? -1 : 1;
              })
              .map((node) => (
                <TreeNodeComponent
                  key={node.path}
                  node={node}
                  onNewDocument={onNewDocument}
                  onUploadDocument={onUploadDocument}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
