import clsx from 'clsx';
import {
  Check,
  ChevronDown,
  Expand,
  FileText,
  HelpCircle,
  Languages,
  Loader2,
  MessageSquare,
  Shrink,
  Sparkles,
  Tag,
  Wand2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { showAlert } from '@/hooks/useAlert';
import { useConfigStore } from '@/stores/configStore';
import { useDocumentStore } from '@/stores/documentStore';
import type { AIAction } from '@/types';

interface AIToolbarProps {
  selectedText: string;
  onReplace: (text: string) => void;
  onInsert: (text: string) => void;
}

const AI_ACTIONS: Array<{
  action: AIAction;
  label: string;
  description: string;
  icon: typeof Sparkles;
}> = [
  { action: 'polish', label: '润色', description: '优化文本表达', icon: Wand2 },
  {
    action: 'expand',
    label: '扩写',
    description: '增加更多细节',
    icon: Expand,
  },
  {
    action: 'simplify',
    label: '精简',
    description: '去除冗余内容',
    icon: Shrink,
  },
  {
    action: 'summarize',
    label: '总结',
    description: '生成简短摘要',
    icon: MessageSquare,
  },
  {
    action: 'translate',
    label: '翻译',
    description: '中英互译',
    icon: Languages,
  },
  {
    action: 'generate-title',
    label: '生成标题',
    description: '智能生成标题',
    icon: FileText,
  },
  {
    action: 'generate-tags',
    label: '生成标签',
    description: '智能生成标签',
    icon: Tag,
  },
  {
    action: 'generate-description',
    label: '生成描述',
    description: 'SEO描述',
    icon: FileText,
  },
  {
    action: 'generate-faq',
    label: '生成FAQ',
    description: '常见问题',
    icon: HelpCircle,
  },
];

export function AIToolbar({
  selectedText,
  onReplace,
  onInsert,
}: AIToolbarProps) {
  const { aiService } = useConfigStore();
  const { currentFrontmatter } = useDocumentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
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
      if (
        !text &&
        ![
          'generate-title',
          'generate-tags',
          'generate-description',
          'generate-faq',
        ].includes(action)
      ) {
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

        if (
          ['generate-title', 'generate-tags', 'generate-description'].includes(
            action,
          )
        ) {
          onInsert(response);
        } else if (action === 'generate-faq') {
          onInsert('\n\n' + response);
        } else {
          onReplace(response);
        }
      } catch (error) {
        console.error('AI action failed:', error);
        showAlert(
          'error',
          'AI操作失败',
          error instanceof Error ? error.message : '请检查配置后重试',
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [aiService, selectedText, currentFrontmatter, onReplace, onInsert],
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isProcessing}
        className={clsx(
          'btn-primary px-3 py-1.5 text-xs',
          isProcessing && 'animate-pulse',
        )}
      >
        <Sparkles size={13} />
        AI
        <ChevronDown
          size={11}
          className={clsx(
            'transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="dropdown-menu fixed inset-x-0 bottom-0 z-50 max-h-[70vh] rounded-t-3xl sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64 sm:rounded-2xl">
            <div className="border-b border-surface-100 px-4 py-3 dark:border-surface-700 sm:hidden">
              <span className="text-sm font-bold text-surface-500 dark:text-surface-400">
                AI 工具
              </span>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2 sm:p-1.5">
              {AI_ACTIONS.map(({ action, label, description, icon: Icon }) => (
                <button
                  key={action}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAction(action)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-surface-100 active:bg-surface-200 dark:text-surface-200 dark:hover:bg-surface-700"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{label}</div>
                    <div className="text-xs text-surface-500 dark:text-surface-400">
                      {description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {isProcessing && (
        <div className="fixed inset-x-0 top-20 z-50 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-xl dark:bg-surface-800">
            <Loader2 size={18} className="animate-spin text-brand" />
            <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">
              AI 处理中...
            </span>
          </div>
        </div>
      )}

      {result && !isProcessing && (
        <div className="fixed inset-x-0 top-16 z-50 flex justify-center px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-surface-800">
            <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4 dark:border-surface-700">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10">
                  <Sparkles size={16} className="text-brand" />
                </div>
                <span className="text-sm font-bold text-surface-800 dark:text-surface-100">
                  AI 生成结果
                </span>
              </div>
              <button onClick={() => setResult('')} className="toolbar-btn">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[40vh] overflow-y-auto p-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-surface-700 dark:text-surface-200">
                {result}
              </p>
            </div>
            <div className="flex gap-3 border-t border-surface-100 px-5 py-4 dark:border-surface-700">
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
                className="btn-secondary flex-1"
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
