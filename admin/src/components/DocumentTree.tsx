import React, { useCallback, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Search,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import type { DocumentNode } from '@/types';
import { useDocumentStore } from '@/stores/documentStore';
import clsx from 'clsx';

interface TreeNodeProps {
  node: DocumentNode;
  level?: number;
}

function TreeNodeComponent({ node, level = 0 }: TreeNodeProps) {
  const { currentPath, loadDocument, expandedPaths, toggleExpanded, deleteDocument } =
    useDocumentStore();
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
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

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm(`确定删除 ${node.name}？`)) {
        deleteDocument(node.path);
      }
    },
    [node.path, node.name, deleteDocument],
  );

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
        <span className="truncate flex-1">{node.name}</span>
        {!isDir && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
          >
            <Trash2 size={14} />
          </button>
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
              <TreeNodeComponent key={child.path} node={child} level={level + 1} />
            ))}
        </div>
      )}
    </div>
  );
}

interface DocumentTreeProps {
  onNewDocument?: () => void;
}

export function DocumentTree({ onNewDocument }: DocumentTreeProps) {
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
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索文档..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-8 py-1.5 text-xs"
          />
        </div>
        <button onClick={onNewDocument} className="btn-primary px-2 py-1.5" title="新建文档">
          <Plus size={14} />
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
            .map((node) => <TreeNodeComponent key={node.path} node={node} />)
        )}
      </div>
    </div>
  );
}
