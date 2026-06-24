import { Save, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useConfigStore } from '@/stores/configStore';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', apiUrl: 'https://api.openai.com/v1/chat/completions' },
  { id: 'deepseek', name: 'DeepSeek', apiUrl: 'https://api.deepseek.com/v1/chat/completions' },
  { id: 'openrouter', name: 'OpenRouter', apiUrl: 'https://openrouter.ai/api/v1/chat/completions' },
  { id: 'siliconflow', name: '硅基流动', apiUrl: 'https://api.siliconflow.cn/v1/chat/completions' },
  { id: 'moonshot', name: 'Moonshot', apiUrl: 'https://api.moonshot.cn/v1/chat/completions' },
  { id: 'dashscope', name: '阿里百炼', apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' },
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

export function AISettings() {
  const { ai, setAIConfig } = useConfigStore();
  const [provider, setProvider] = useState(ai.provider || 'deepseek');
  const [apiUrl, setApiUrl] = useState(ai.apiUrl);
  const [apiKey, setApiKey] = useState(ai.apiKey);
  const [model, setModel] = useState(ai.model);
  const [saved, setSaved] = useState(false);

  const handleProviderChange = useCallback((id: string) => {
    setProvider(id);
    const p = PROVIDERS.find((p) => p.id === id);
    if (p?.apiUrl) setApiUrl(p.apiUrl);
    const models = MODELS[id];
    if (models?.length) setModel(models[0]);
  }, []);

  const handleSave = useCallback(() => {
    setAIConfig({ apiUrl, apiKey, model, provider });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [apiUrl, apiKey, model, provider, setAIConfig]);

  return (
    <div className="settings-page">
      <div className="page-head">
        <div>
          <h2 className="page-title">
            <span className="page-title-emoji">🤖</span>AI 设置
          </h2>
          <p className="page-desc">配置 AI 辅助写作服务</p>
        </div>
      </div>

      {/* 服务商 */}
      <section className="settings-card">
        <header className="card-head">
          <div className="card-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 6px 20px rgba(99, 102, 241, 0.28)' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="card-title">服务商</h3>
            <p className="card-desc">选择 AI 服务提供商</p>
          </div>
        </header>
        <div className="provider-grid">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleProviderChange(p.id)}
              className={`provider-btn ${provider === p.id ? 'active' : ''}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </section>

      {/* 配置 */}
      <section className="settings-card">
        <header className="card-head">
          <div className="card-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 6px 20px rgba(59, 130, 246, 0.28)' }}>
            <Save size={20} />
          </div>
          <div>
            <h3 className="card-title">API 配置</h3>
            <p className="card-desc">填写 API 地址、密钥和模型</p>
          </div>
        </header>
        <div className="form-grid">
          <div className="field field-full">
            <label className="field-label">API URL</label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="field-input"
              placeholder="https://api.example.com/v1/chat/completions"
            />
          </div>
          <div className="field field-full">
            <label className="field-label">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="field-input"
              placeholder="sk-xxxxxxxxxxxx"
            />
            <p className="field-hint">API Key 仅存储在本地浏览器</p>
          </div>
          <div className="field field-full">
            <label className="field-label">模型</label>
            {MODELS[provider]?.length ? (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="field-input"
              >
                {MODELS[provider].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="field-input"
                placeholder="模型名称"
              />
            )}
          </div>
        </div>
      </section>

      <div className="form-actions">
        <button type="button" onClick={handleSave} className="btn-primary btn-large">
          <Save size={16} />
          {saved ? '已保存 ✓' : '保存配置'}
        </button>
      </div>

      <style>{`
        .settings-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 800px;
        }
        .page-head { margin-bottom: 4px; }
        .page-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dark .page-title { color: #f1f5f9; }
        .page-title-emoji { font-size: 1.2rem; }
        .page-desc {
          font-size: 0.88rem;
          color: #94a3b8;
          margin: 0;
        }

        .settings-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: box-shadow 0.25s;
        }
        .dark .settings-card {
          background: rgba(30, 36, 50, 0.8);
          border-color: rgba(255, 255, 255, 0.06);
        }
        .settings-card:hover {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .card-head {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .card-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }
        .card-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 2px;
        }
        .dark .card-title { color: #f1f5f9; }
        .card-desc {
          font-size: 0.82rem;
          color: #94a3b8;
          margin: 0;
        }

        .provider-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
        }
        .provider-btn {
          padding: 12px 8px;
          border-radius: 14px;
          border: 1.5px solid rgba(15, 23, 42, 0.08);
          background: #f8fafc;
          font-size: 0.88rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.18s;
          text-align: center;
        }
        .dark .provider-btn {
          background: rgba(30, 41, 59, 0.5);
          border-color: rgba(255, 255, 255, 0.08);
          color: #94a3b8;
        }
        .provider-btn:hover {
          border-color: rgba(99, 102, 241, 0.3);
          color: #6366f1;
          background: rgba(99, 102, 241, 0.04);
        }
        .provider-btn.active {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.08);
          color: #6366f1;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
        }
        .dark .provider-btn.active {
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          border-color: #818cf8;
        }

        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-full { grid-column: 1 / -1; }
        .field-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
        }
        .dark .field-label { color: #cbd5e1; }
        .field-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1.5px solid rgba(15, 23, 42, 0.08);
          background: #f8fafc;
          font-size: 0.9rem;
          color: #0f172a;
          outline: none;
          transition: all 0.18s;
          box-sizing: border-box;
        }
        .dark .field-input {
          background: rgba(30, 41, 59, 0.5);
          border-color: rgba(255, 255, 255, 0.08);
          color: #f1f5f9;
        }
        .field-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }
        .field-input::placeholder { color: #94a3b8; }
        select.field-input {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2394A3B8'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E");
          background-position: right 12px center;
          background-repeat: no-repeat;
          background-size: 1.2rem;
          padding-right: 40px;
        }
        .field-hint {
          font-size: 0.78rem;
          color: #94a3b8;
          margin: 2px 0 0;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 4px;
        }
        .btn-large {
          height: 48px;
          padding: 0 36px;
          font-size: 0.95rem;
        }

        @media (max-width: 768px) {
          .provider-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .form-actions {
            justify-content: stretch;
          }
          .form-actions .btn-primary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
