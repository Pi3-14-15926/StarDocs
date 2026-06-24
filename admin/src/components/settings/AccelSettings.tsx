import { Globe, Save } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useConfigStore } from '@/stores/configStore';
import { describeCdn, type IconCdnMode } from '@/utils/cdnUrl';

const CDN_OPTIONS: { label: string; value: IconCdnMode; desc: string }[] = [
  { label: 'jsDelivr', value: 'jsdelivr', desc: '国内可用，推荐' },
  { label: 'Statically', value: 'statically', desc: '海外加速' },
  { label: 'GitHack', value: 'githack', desc: '开源方案' },
  { label: '自定义', value: 'custom', desc: '自定义 Base URL' },
  { label: '不使用', value: 'none', desc: '直连 GitHub' },
];

export function AccelSettings() {
  const { accel, setAccelConfig } = useConfigStore();
  const [iconCdnMode, setIconCdnMode] = useState<IconCdnMode>(
    accel.iconCdnMode || 'jsdelivr',
  );
  const [iconCdnCustomBase, setIconCdnCustomBase] = useState(
    accel.iconCdnCustomBase || '',
  );
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    setAccelConfig({ iconCdnMode, iconCdnCustomBase });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [iconCdnMode, iconCdnCustomBase, setAccelConfig]);

  return (
    <div className="settings-page">
      <div className="page-head">
        <div>
          <h2 className="page-title">
            <span className="page-title-emoji">⚡</span>加速设置
          </h2>
          <p className="page-desc">配置图标 CDN 加速，让国内访问更顺畅</p>
        </div>
      </div>

      {/* CDN 加速策略 */}
      <section className="settings-card">
        <header className="card-head">
          <div className="card-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 6px 20px rgba(99, 102, 241, 0.28)' }}>
            <Globe size={20} />
          </div>
          <div>
            <h3 className="card-title">图标 CDN 加速</h3>
            <p className="card-desc">让所有 GitHub raw 图片自动走更快镜像</p>
          </div>
        </header>

        <div className="cdn-options">
          {CDN_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`cdn-option ${iconCdnMode === opt.value ? 'active' : ''}`}
            >
              <input
                type="radio"
                name="cdn-mode"
                value={opt.value}
                checked={iconCdnMode === opt.value}
                onChange={(e) => setIconCdnMode(e.target.value as IconCdnMode)}
                className="cdn-radio"
              />
              <div className="cdn-option-content">
                <div className="cdn-option-label">{opt.label}</div>
                <div className="cdn-option-desc">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <p className="card-hint">
          当前选择：
          <strong className="hint-highlight">{describeCdn(iconCdnMode)}</strong>
        </p>

        {iconCdnMode === 'custom' && (
          <div className="custom-url-field">
            <label className="field-label">自定义 Base URL</label>
            <input
              type="url"
              value={iconCdnCustomBase}
              onChange={(e) => setIconCdnCustomBase(e.target.value)}
              className="field-input"
              placeholder="https://your-cdn.example.com/"
            />
            <p className="field-hint">
              最终 URL 形如：{iconCdnCustomBase || 'https://your-cdn.example.com/'}raw.githubusercontent.com/owner/repo/branch/path
            </p>
          </div>
        )}
      </section>

      {/* 说明 */}
      <section className="settings-card hint-card">
        <div className="hint-content">
          <p className="hint-text">
            配置后 <code className="hint-code">raw.githubusercontent.com</code> 域名的图标 URL 会自动替换为更快镜像。
          </p>
          <p className="hint-text">
            GitHub 仓库配置（owner/repo/token）请到
            <span className="hint-link"> GitHub 仓库配置 </span>
            页面填写。
          </p>
        </div>
      </section>

      <div className="form-actions">
        <button type="button" onClick={handleSave} className="btn-primary btn-large">
          <Save size={16} />
          {saved ? '已保存 ✓' : '保存设置'}
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

        .cdn-options {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
        }
        .cdn-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1.5px solid rgba(15, 23, 42, 0.08);
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.18s;
        }
        .dark .cdn-option {
          background: rgba(30, 41, 59, 0.5);
          border-color: rgba(255, 255, 255, 0.08);
        }
        .cdn-option:hover {
          border-color: rgba(99, 102, 241, 0.3);
          background: rgba(99, 102, 241, 0.04);
        }
        .cdn-option.active {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.08);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
        }
        .dark .cdn-option.active {
          background: rgba(99, 102, 241, 0.15);
          border-color: #818cf8;
        }
        .cdn-radio {
          width: 16px;
          height: 16px;
          accent-color: #6366f1;
          cursor: pointer;
          flex-shrink: 0;
        }
        .cdn-option-content { min-width: 0; }
        .cdn-option-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #0f172a;
        }
        .dark .cdn-option-label { color: #f1f5f9; }
        .cdn-option-desc {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 1px;
        }

        .card-hint {
          font-size: 0.82rem;
          color: #94a3b8;
          margin: 16px 0 0;
          line-height: 1.6;
        }
        .hint-highlight {
          color: #6366f1;
          font-weight: 600;
        }

        .custom-url-field {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
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
        .field-hint {
          font-size: 0.78rem;
          color: #94a3b8;
          margin: 2px 0 0;
        }

        .hint-card {
          padding: 20px 24px;
          background: rgba(99, 102, 241, 0.03);
          border-color: rgba(99, 102, 241, 0.1);
        }
        .dark .hint-card {
          background: rgba(99, 102, 241, 0.06);
          border-color: rgba(99, 102, 241, 0.15);
        }
        .hint-content { display: flex; flex-direction: column; gap: 6px; }
        .hint-text {
          font-size: 0.82rem;
          color: #64748b;
          margin: 0;
          line-height: 1.6;
        }
        .dark .hint-text { color: #94a3b8; }
        .hint-code {
          font-family: 'JetBrains Mono', monospace;
          background: rgba(99, 102, 241, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.78rem;
          color: #6366f1;
        }
        .hint-link {
          color: #6366f1;
          font-weight: 600;
          cursor: pointer;
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
          .cdn-options {
            grid-template-columns: 1fr 1fr;
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
