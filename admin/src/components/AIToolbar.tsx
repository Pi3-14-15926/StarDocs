import { useState, useCallback, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown, Wand2, Expand, Shrink, MessageSquare, Languages, Tag, FileText, HelpCircle, X, Check, Loader2 } from 'lucide-react';
import type { AIAction } from '@/types';
import { useConfigStore } from '@/stores/configStore';
import { useDocumentStore } from '@/stores/documentStore';
import { showAlert } from '@/hooks/useAlert';
import clsx from 'clsx';

interface AIToolbarProps {
  selectedText: string;
  onReplace: (text: string) => void;
  onInsert: (text: string) => void;
}

const AI_ACTIONS: Array<{ action: AIAction; label: string; description: string; icon: typeof Sparkles }> = [
  { action: 'polish', label: '润色', description: '优化文本表达', icon: Wand2 },
  { action: 'expand', label: '扩写', description: '增加更多细节', icon: Expand },
  { action: 'simplify', label: '精简', description: '去除冗余内容', icon: Shrink },
  { action: 'summarize', label: '总结', description: '生成简短摘要', icon: MessageSquare },
  { action: 'translate', label: '翻译', description: '中英互译', icon: Languages },
  { action: 'generate-title', label: '生成标题', description: '智能生成标题', icon: FileText },
  { action: 'generate-tags', label: '生成标签', description: '智能生成标签', icon: Tag },
  { action: 'generate-description', label: '生成描述', description: 'SEO描述', icon: FileText },
  { action: 'generate-faq', label: '生成FAQ', description: '常见问题', icon: HelpCircle },
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
        showAlert('warning', '未配置AI', '请先在设置中配置AI服务');
        return;
      }

      const text = selectedText || '';
      if (!text && !['generate-title', 'generate-tags', 'generate-description', 'generate-faq'].includes(action)) {
        showAlert('warning', '无内容', '请先选择要处理的文本');
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
        showAlert('error', 'AI操作失败', error instanceof Error ? error.message : '请检查配置后重试');
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
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white shadow-2xl dark:bg-gray-800 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-1 sm:w-56 sm:rounded-xl">
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700 sm:hidden">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">AI 工具</span>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2 sm:p-1">
              {AI_ACTIONS.map(({ action, label, description, icon: Icon }) => (
                <button
                  key={action}
                  onClick={() => handleAction(action)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 sm:px-3 sm:py-2"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {isProcessing && (
        <div className="fixed inset-x-0 top-20 z-50 flex justify-center">
          <div className="flex items-center gap-3 rounded-full bg-white px-6 py-3 shadow-lg ring-1 ring-black/5 dark:bg-gray-800">
            <Loader2 size={18} className="animate-spin text-brand" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">AI 处理中...</span>
          </div>
        </div>
      )}

      {result && !isProcessing && (
        <div className="fixed inset-x-0 top-16 z-50 flex justify-center px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10">
                  <Sparkles size={12} className="text-brand" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">AI 生成结果</span>
              </div>
              <button
                onClick={() => setResult('')}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[40vh] overflow-y-auto p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">{result}</p>
            </div>
            <div className="flex gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-700">
              <button
                onClick={() => {
                  onReplace(result);
                  setResult('');
                }}
                className="btn-primary flex-1"
              >
                <Check size={14} />
                应用替换
              </button>
              <button
                onClick={() => setResult('')}
                className="btn-ghost flex-1"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
