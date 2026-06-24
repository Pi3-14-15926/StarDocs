import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfigStore } from '@/stores/configStore';

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
  },
  {
    id: 'moonshot',
    name: 'Moonshot',
    apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
  },
  {
    id: 'dashscope',
    name: '阿里百炼',
    apiUrl:
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  },
  { id: 'custom', name: '自定义', apiUrl: '' },
];

const MODELS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  deepseek: ['deepseek-chat', 'deepseek-coder'],
  openrouter: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet'],
  siliconflow: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct'],
  moonshot: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  dashscope: ['qwen-plus', 'qwen-turbo', 'qwen-max'],
  custom: [],
};

export function AIConfigPage() {
  const navigate = useNavigate();
  const { ai, setAIConfig } = useConfigStore();
  const [provider, setProvider] = useState(ai.provider || 'deepseek');
  const [apiUrl, setApiUrl] = useState(ai.apiUrl);
  const [apiKey, setApiKey] = useState(ai.apiKey);
  const [model, setModel] = useState(ai.model);

  const handleProviderChange = useCallback((id: string) => {
    setProvider(id);
    const p = PROVIDERS.find((p) => p.id === id);
    if (p && p.apiUrl) setApiUrl(p.apiUrl);
    const models = MODELS[id];
    if (models?.length) setModel(models[0]);
  }, []);

  const handleSave = useCallback(() => {
    setAIConfig({ apiUrl, apiKey, model, provider });
    navigate('/admin');
  }, [apiUrl, apiKey, model, provider, setAIConfig, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-lg p-6">
        <button
          onClick={() => navigate('/admin')}
          className="mb-6 btn-ghost text-sm"
        >
          <ArrowLeft size={16} />
          返回后台
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
              <Sparkles size={24} className="text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                AI 设置
              </h1>
              <p className="text-sm text-gray-500">配置 AI 辅助写作服务</p>
            </div>
          </div>
        </div>

        <div className="card space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              服务商
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    provider === p.id
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              API URL
            </label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="input-field"
              placeholder="https://api.example.com/v1/chat/completions"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="input-field"
              placeholder="sk-xxxxxxxxxxxx"
            />
            <p className="mt-1 text-xs text-gray-400">
              API Key 仅存储在本地浏览器
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              模型
            </label>
            {MODELS[provider]?.length ? (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="input-field"
              >
                {MODELS[provider].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="input-field"
                placeholder="模型名称"
              />
            )}
          </div>

          <button onClick={handleSave} className="btn-primary w-full">
            <Save size={16} />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}
