import { useState, useCallback, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';
import type { AIAction } from '@/types';
import { useConfigStore } from '@/stores/configStore';
import { useDocumentStore } from '@/stores/documentStore';
import clsx from 'clsx';

interface AIToolbarProps {
  selectedText: string;
  onReplace: (text: string) => void;
  onInsert: (text: string) => void;
}

const AI_ACTIONS: Array<{ action: AIAction; label: string; description: string }> = [
  { action: 'polish', label: '润色', description: '优化文本表达' },
  { action: 'expand', label: '扩写', description: '增加更多细节' },
  { action: 'simplify', label: '精简', description: '去除冗余内容' },
  { action: 'summarize', label: '总结', description: '生成简短摘要' },
  { action: 'translate', label: '翻译', description: '中英互译' },
  { action: 'generate-title', label: '生成标题', description: '智能生成标题' },
  { action: 'generate-tags', label: '生成标签', description: '智能生成标签' },
  { action: 'generate-description', label: '生成描述', description: 'SEO描述' },
  { action: 'generate-faq', label: '生成FAQ', description: '常见问题' },
];

export function AIToolbar({ selectedText, onReplace, onInsert }: AIToolbarProps) {
  const { aiService } = useConfigStore();
  const { currentFrontmatter } = useDocumentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = useCallback(
    async (action: AIAction) => {
      if (!aiService) {
        alert('请先配置AI服务');
        return;
      }

      const text = selectedText || '';
      if (!text && !['generate-title', 'generate-tags', 'generate-description', 'generate-faq'].includes(action)) {
        alert('请先选择要处理的文本');
        return;
      }

      setIsProcessing(true);
      setIsOpen(false);
      try {
        const response = await aiService.execute(action, text, {
          title: currentFrontmatter.title as string,
          frontmatter: currentFrontmatter,
        });

        setResult(response);

        if (['generate-title', 'generate-tags', 'generate-description'].includes(action)) {
          onInsert(response);
        } else if (action === 'generate-faq') {
          onInsert('\n\n' + response);
        } else {
          onReplace(response);
        }
      } catch (error) {
        console.error('AI action failed:', error);
        alert('AI操作失败，请检查配置');
      } finally {
        setIsProcessing(false);
      }
    },
    [aiService, selectedText, currentFrontmatter, onReplace, onInsert],
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isProcessing}
        className={clsx(
          'btn-primary text-xs',
          isProcessing && 'animate-pulse',
        )}
      >
        <Sparkles size={14} />
        AI
        <ChevronDown size={12} className={clsx('transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {AI_ACTIONS.map(({ action, label, description }) => (
            <button
              key={action}
              onClick={() => handleAction(action)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{label}</div>
                <div className="text-xs text-gray-500">{description}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              <span className="text-sm">AI处理中...</span>
            </div>
          </div>
        </div>
      )}

      {result && !isProcessing && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 text-xs font-medium text-gray-500">AI结果</div>
          <div className="max-h-40 overflow-y-auto text-sm whitespace-pre-wrap">{result}</div>
          <div className="mt-2 flex justify-end">
            <button onClick={() => setResult('')} className="btn-ghost text-xs">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
