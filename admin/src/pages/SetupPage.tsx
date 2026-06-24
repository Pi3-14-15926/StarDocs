import { Eye, EyeOff, Github } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfigStore } from '@/stores/configStore';

const FIXED_CONFIG = {
  owner: 'Pi3-14-15926',
  repo: 'StarDocs',
  branch: 'main',
  docsDir: 'docs',
};

export function SetupPage() {
  const navigate = useNavigate();
  const { setGitHubConfig, testConnection } = useConfigStore();
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = useCallback(async () => {
    const trimmed = token.trim();
    if (!trimmed) {
      setErrorMsg('请输入 GitHub Token');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setGitHubConfig({
      ...FIXED_CONFIG,
      token: trimmed,
      assetsDir: `${FIXED_CONFIG.docsDir}/assets`,
      defaultBranch: FIXED_CONFIG.branch,
    });
    const connected = await testConnection();
    if (connected) {
      navigate('/admin');
    } else {
      setErrorMsg('连接失败，请检查 Token 是否正确');
    }
    setLoading(false);
  }, [token, setGitHubConfig, testConnection, navigate]);

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <div className="logo-mark">
            <img src="https://i.postimg.cc/j5yhCmXp/dog.png" alt="StarDocs" className="logo-img" />
          </div>
          <h1 className="brand-name">StarDocs</h1>
          <p className="brand-sub">管理员登录</p>
        </header>

        {errorMsg && (
          <div className="error-banner">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="form-field">
          <label className="form-label">GitHub Token</label>
          <div className="token-wrap">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="form-input"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button
              type="button"
              className="token-eye"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="button"
          className="login-btn"
          disabled={loading}
          onClick={handleLogin}
        >
          <Github size={18} />
          {loading ? '验证中...' : '登录'}
        </button>

        <div className="login-hint">
          <div className="hint-head">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="shield-icon">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
            <span className="hint-title">安全认证</span>
          </div>
          <p className="hint-desc">Token 仅存储在本地浏览器，不会上传到任何服务器</p>
        </div>
      </div>

      {/* 装饰 */}
      <div className="login-decoration" aria-hidden="true">
        <div className="deco-orb deco-orb-1" />
        <div className="deco-orb deco-orb-2" />
        <div className="deco-orb deco-orb-3" />
        <svg className="deco-shield" viewBox="0 0 200 200" width="240" height="240" fill="none">
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.06" />
            </linearGradient>
          </defs>
          <path
            d="M100 20 L170 50 L170 110 C170 145 138 175 100 185 C62 175 30 145 30 110 L30 50 Z"
            fill="url(#shieldGrad)"
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeOpacity="0.18"
          />
          <path
            d="M70 105 L92 127 L135 80"
            fill="none"
            stroke="#6366f1"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.22"
          />
        </svg>
      </div>

      <style>{`
        .login-page {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #EEF4FF 0%, #F6F2FF 100%);
          padding: 20px;
          overflow: hidden;
        }
        .dark .login-page {
          background: linear-gradient(135deg, #0f1219 0%, #0a0e14 100%);
        }

        .login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          padding: 40px 36px;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 28px;
          box-shadow: 0 20px 60px rgba(99, 102, 241, 0.15);
          backdrop-filter: blur(20px) saturate(180%);
          animation: card-rise 0.4s ease;
        }
        .dark .login-card {
          background: rgba(24, 29, 40, 0.85);
          border-color: rgba(255, 255, 255, 0.06);
        }
        @keyframes card-rise {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .login-header { text-align: center; margin-bottom: 28px; }
        .logo-mark {
          width: 72px;
          height: 72px;
          margin: 0 auto 16px;
          border-radius: 20px;
          background: #FFFFFF;
          border: 1px solid rgba(15, 23, 42, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          position: relative;
          overflow: hidden;
        }
        .dark .logo-mark {
          background: rgba(30, 41, 59, 0.8);
          border-color: rgba(255, 255, 255, 0.08);
        }
        .logo-mark::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 24px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          opacity: 0.12;
          filter: blur(12px);
          z-index: -1;
        }
        .logo-img {
          width: 48px;
          height: 48px;
          object-fit: contain;
        }
        .brand-name {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 4px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .brand-sub {
          font-size: 0.85rem;
          color: #94a3b8;
          margin: 0;
          letter-spacing: 0.5px;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          margin-bottom: 18px;
          background: rgba(239, 68, 68, 0.08);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 14px;
          font-size: 0.85rem;
        }

        .form-field { margin-bottom: 18px; }
        .form-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }
        .dark .form-label { color: #cbd5e1; }
        .token-wrap { position: relative; }
        .form-input {
          width: 100%;
          padding: 14px 44px 14px 16px;
          border-radius: 14px;
          border: 1.5px solid rgba(15, 23, 42, 0.08);
          background: #f8fafc;
          font-size: 0.92rem;
          color: #0f172a;
          outline: none;
          transition: all 0.18s;
          box-sizing: border-box;
        }
        .dark .form-input {
          background: rgba(30, 41, 59, 0.5);
          border-color: rgba(255, 255, 255, 0.08);
          color: #f1f5f9;
        }
        .form-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }
        .form-input::placeholder { color: #94a3b8; }
        .token-eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          display: flex;
        }
        .token-eye:hover { color: #6366f1; }

        .login-btn {
          width: 100%;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
          font-size: 0.98rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
          margin-bottom: 22px;
        }
        .login-btn:hover {
          box-shadow: 0 8px 28px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }
        .login-btn:active { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .login-hint {
          font-size: 0.82rem;
          color: #64748b;
          line-height: 1.6;
          background: #f8fafc;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid rgba(15, 23, 42, 0.06);
        }
        .dark .login-hint {
          background: rgba(30, 41, 59, 0.4);
          border-color: rgba(255, 255, 255, 0.06);
          color: #94a3b8;
        }
        .hint-head {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }
        .shield-icon { color: #6366f1; }
        .hint-title { font-weight: 700; color: #0f172a; font-size: 0.85rem; }
        .dark .hint-title { color: #f1f5f9; }
        .hint-desc { margin: 0; color: #94a3b8; font-size: 0.78rem; }

        .login-decoration {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .deco-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.55;
        }
        .deco-orb-1 {
          width: 420px; height: 420px;
          top: -120px; right: -120px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, transparent 70%);
        }
        .deco-orb-2 {
          width: 360px; height: 360px;
          bottom: -120px; left: -100px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.5) 0%, transparent 70%);
        }
        .deco-orb-3 {
          width: 280px; height: 280px;
          top: 40%; left: 60%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
        }
        .deco-shield {
          position: absolute;
          right: 6%;
          bottom: 8%;
          opacity: 0.85;
          filter: drop-shadow(0 8px 24px rgba(99, 102, 241, 0.18));
          animation: float-shield 8s ease-in-out infinite;
        }
        @keyframes float-shield {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-12px) rotate(2deg); }
        }

        @media (max-width: 768px) {
          .login-card { padding: 32px 24px; border-radius: 24px; }
          .logo-mark { width: 60px; height: 60px; }
          .logo-img { width: 40px; height: 40px; }
          .deco-shield { display: none; }
        }
      `}</style>
    </div>
  );
}
