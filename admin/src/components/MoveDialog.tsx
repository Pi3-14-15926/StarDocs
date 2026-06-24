import { useState, useCallback } from 'react';
import {
  X,
  FolderInput,
  ChevronRight,
  ChevronDown,
  Folder,
  Loader2,
} from 'lucide-react';
import { useDocumentStore } from '@/stores/documentStore';
import { useConfigStore } from '@/stores/configStore';
import { showAlert } from '@/hooks/useAlert';
import clsx from 'clsx';

interface MoveDialogProps {
  isOpen: boolean;
  sourcePath: string;
  sourceName: string;
  sourceType: 'file' | 'directory';
  onClose: () => void;
}

interface FolderItem {
  name: string;
  path: string;
  children?: FolderItem[];
}

function FolderNode({
  node,
  selectedPath,
  onSelect,
  level = 0,
}: {
  node: FolderItem;
  selectedPath: string;
  onSelect: (path: string) => void;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSelected = selectedPath === node.path;

  const handleClick = useCallback(() => {
    onSelect(node.path);
    setIsExpanded(!isExpanded);
  }, [node.path, onSelect, isExpanded]);

  return (
    <div>
      <div
        onClick={handleClick}
        className={clsx(
          'flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
          isSelected
            ? 'bg-brand/10 text-brand font-medium'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {node.children && node.children.length > 0 ? (
          isExpanded ? (
            <ChevronDown size={14} className="text-gray-400" />
          ) : (
            <ChevronRight size={14} className="text-gray-400" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        <Folder size={16} className="text-brand" />
        <span className="truncate flex-1">{node.name}</span>
      </div>
      {isExpanded && node.children && (
        <div>
          {node.children
            .filter((child) => child.name !== '.git')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((child) => (
              <FolderNode
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelect={onSelect}
                level={level + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function buildFolderTree(
  nodes: { name: string; path: string; type: string }[],
  docsDir: string,
): FolderItem[] {
  const root: FolderItem[] = [];
  const map = new Map<string, FolderItem>();

  const sorted = [...nodes]
    .filter((n) => n.type === 'directory')
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const node of sorted) {
    const relativePath = node.path.replace(`${docsDir}/`, '');
    const parts = relativePath.split('/');

    let currentPath = docsDir;
    let parentChildren = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = `${currentPath}/${part}`;

      let existing = map.get(currentPath);
      if (!existing) {
        existing = { name: part, path: currentPath, children: [] };
        map.set(currentPath, existing);
        parentChildren.push(existing);
      }
      parentChildren = existing.children!;
    }
  }

  return root;
}

export function MoveDialog({
  isOpen,
  sourcePath,
  sourceName,
  sourceType,
  onClose,
}: MoveDialogProps) {
  const { tree, moveDocument, loadTree } = useDocumentStore();
  const { github } = useConfigStore();
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [isMoving, setIsMoving] = useState(false);

  const docsDir = github.docsDir || 'docs';
  const folderTree = buildFolderTree(tree, docsDir);

  const isSourceChild = useCallback(
    (targetPath: string) => {
      if (sourceType !== 'directory') return false;
      return targetPath.startsWith(`${sourcePath}/`);
    },
    [sourcePath, sourceType],
  );

  const handleMove = useCallback(async () => {
    if (!selectedFolder) {
      showAlert('error', '请选择目标', '请选择一个目标文件夹');
      return;
    }

    if (isSourceChild(selectedFolder)) {
      showAlert('error', '无法移动', '不能将文件夹移动到自身内部');
      return;
    }

    const fileName = sourcePath.split('/').pop() || '';
    const newPath = `${selectedFolder}/${fileName}`;

    if (newPath === sourcePath) {
      showAlert('error', '无法移动', '目标位置与当前位置相同');
      return;
    }

    setIsMoving(true);
    try {
      await moveDocument(sourcePath, newPath);
      showAlert('success', '移动成功', `${sourceName} 已移动`);
      onClose();
    } catch (error) {
      showAlert(
        'error',
        '移动失败',
        error instanceof Error ? error.message : '请重试',
      );
    } finally {
      setIsMoving(false);
    }
  }, [selectedFolder, sourcePath, sourceName, moveDocument, onClose, isSourceChild]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <FolderInput size={20} className="text-brand" />
            移动到
          </h3>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            移动: {sourceName}
          </p>
        </div>

        <div className="mb-4 max-h-64 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
          <div
            onClick={() => setSelectedFolder(docsDir)}
            className={clsx(
              'flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
              selectedFolder === docsDir
                ? 'bg-brand/10 text-brand font-medium'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
            )}
          >
            <span className="w-3.5" />
            <Folder size={16} className="text-brand" />
            <span className="truncate flex-1">{docsDir} (根目录)</span>
          </div>
          {folderTree.map((node) => (
            <FolderNode
              key={node.path}
              node={node}
              selectedPath={selectedFolder}
              onSelect={setSelectedFolder}
              level={1}
            />
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button
            onClick={handleMove}
            disabled={!selectedFolder || isMoving}
            className="btn-primary"
          >
            {isMoving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                移动中...
              </>
            ) : (
              '移动'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
