import { FileText, Loader2, Upload, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { showAlert } from '@/hooks/useAlert';
import { useConfigStore } from '@/stores/configStore';
import { useDocumentStore } from '@/stores/documentStore';
import type { DocumentNode } from '@/types';

interface UploadDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedDocument {
  fileName: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

function getDirectoryOptions(nodes: DocumentNode[], prefix = ''): string[] {
  const result: string[] = [];
  for (const node of nodes) {
    if (node.type === 'directory') {
      const fullPath = prefix ? `${prefix}/${node.name}` : node.name;
      result.push(fullPath);
      if (node.children) {
        result.push(...getDirectoryOptions(node.children, fullPath));
      }
    }
  }
  return result;
}

function parseFrontmatter(content: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content };
  }

  const yamlStr = match[1];
  const body = match[2];
  const data: Record<string, unknown> = {};

  let currentKey = '';
  let inArray = false;
  const arrayItems: string[] = [];

  for (const line of yamlStr.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (inArray) {
      const itemMatch = trimmed.match(/^-\s+(.*)$/);
      if (itemMatch) {
        arrayItems.push(itemMatch[1].replace(/^["']|["']$/g, ''));
        continue;
      } else {
        data[currentKey] = arrayItems;
        inArray = false;
        arrayItems.length = 0;
      }
    }

    const kvMatch = trimmed.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      let value: string | boolean = kvMatch[2].trim();

      if (value === '' || value === '[]') {
        currentKey = key;
        inArray = true;
        arrayItems.length = 0;
        continue;
      }

      if (String(value).startsWith('[') && String(value).endsWith(']')) {
        const inner = String(value).slice(1, -1);
        data[key] = inner
          ? inner
              .split(',')
              .map((s: string) => s.trim().replace(/^["']|["']$/g, ''))
          : [];
      } else {
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else value = String(value).replace(/^["']|["']$/g, '');
        data[key] = value;
      }
    }
  }

  if (inArray) {
    data[currentKey] = arrayItems;
  }

  return { data, content: body };
}

function extractTitleFromContent(body: string): string {
  const h1Match = body.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();

  const h2Match = body.match(/^##\s+(.+)$/m);
  if (h2Match) return h2Match[1].trim();

  const firstLine = body.split('\n').find((line) => line.trim().length > 0);
  if (firstLine) return firstLine.trim().substring(0, 50);

  return '';
}

export function UploadDocumentDialog({
  isOpen,
  onClose,
}: UploadDocumentDialogProps) {
  const { createDocument, tree } = useDocumentStore();
  const { github } = useConfigStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const docsDir = github.docsDir || 'docs';
  const directories = getDirectoryOptions(tree, docsDir);

  const resetState = useCallback(() => {
    setParsedDoc(null);
    setCategory('');
    setTitle('');
    setDescription('');
    setDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.md')) {
      showAlert('error', '格式错误', '请选择 .md 文件');
      return;
    }

    try {
      const content = await file.text();
      const { data: frontmatter, content: body } = parseFrontmatter(content);
      const fileName = file.name;

      setParsedDoc({ fileName, frontmatter, body });

      const extractedTitle =
        (frontmatter.title as string) || extractTitleFromContent(body);
      setTitle(extractedTitle);

      if (frontmatter.description) {
        setDescription(frontmatter.description as string);
      }
    } catch (error) {
      showAlert(
        'error',
        '解析失败',
        error instanceof Error ? error.message : '无法解析文件',
      );
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!parsedDoc) return;

    const fileName = parsedDoc.fileName.endsWith('.md')
      ? parsedDoc.fileName
      : `${parsedDoc.fileName}.md`;

    const path = category
      ? `${category}/${fileName}`
      : `${docsDir}/${fileName}`;

    const frontmatter: Record<string, unknown> = {};
    if (parsedDoc.frontmatter.title)
      frontmatter.title = parsedDoc.frontmatter.title;
    if (title && title !== (parsedDoc.frontmatter.title as string))
      frontmatter.title = title;
    if (description) frontmatter.description = description;
    if (parsedDoc.frontmatter.category)
      frontmatter.category = parsedDoc.frontmatter.category;
    if (parsedDoc.frontmatter.tags)
      frontmatter.tags = parsedDoc.frontmatter.tags;
    if (parsedDoc.frontmatter.keywords)
      frontmatter.keywords = parsedDoc.frontmatter.keywords;

    setIsUploading(true);
    try {
      await createDocument(path, frontmatter, parsedDoc.body);
      showAlert(
        'success',
        '上传成功',
        `${fileName} 已上传到 ${category || '根目录'}`,
      );
      handleClose();
    } catch (error) {
      console.error('Failed to upload document:', error);
      showAlert(
        'error',
        '上传失败',
        error instanceof Error ? error.message : '请重试',
      );
    } finally {
      setIsUploading(false);
    }
  }, [
    parsedDoc,
    category,
    title,
    description,
    docsDir,
    createDocument,
    handleClose,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Upload size={20} className="text-brand" />
            上传 MD 文档
          </h3>
          <button onClick={handleClose} className="btn-ghost p-1">
            <X size={18} />
          </button>
        </div>

        {!parsedDoc ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
              dragOver
                ? 'border-brand bg-brand/5'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <FileText size={48} className="mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              拖拽 .md 文件到此处，或
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary text-sm"
            >
              选择文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
              <FileText size={16} className="text-brand" />
              <span className="flex-1 truncate text-sm">
                {parsedDoc.fileName}
              </span>
              <button
                onClick={resetState}
                className="text-xs text-gray-500 hover:text-brand"
              >
                重新选择
              </button>
            </div>

            {Object.keys(parsedDoc.frontmatter).length > 0 && (
              <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                <p className="mb-1 text-xs font-medium text-green-700 dark:text-green-400">
                  已解析 Frontmatter
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(parsedDoc.frontmatter).map((key) => (
                    <span
                      key={key}
                      className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-800 dark:text-green-300"
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                分类目录
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
              >
                <option value="">根目录</option>
                {directories.map((dir) => (
                  <option key={dir} value={dir}>
                    {dir.replace(`${docsDir}/`, '')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                标题
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="文档标题"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field min-h-[60px] resize-y"
                placeholder="文档描述（可选）"
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={handleClose} className="btn-secondary">
            取消
          </button>
          <button
            onClick={handleUpload}
            disabled={!parsedDoc || isUploading}
            className="btn-primary"
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                上传中...
              </>
            ) : (
              '上传'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
