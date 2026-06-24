import {
  ArrowLeft,
  ChevronLeft,
  Globe,
  ImageIcon,
  Menu,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccelSettings } from '@/components/settings/AccelSettings';
import { AISettings } from '@/components/settings/AISettings';
import { ImageManager } from '@/components/settings/ImageManager';

type SettingsTab = 'ai' | 'accel' | 'images';

const MENU_ITEMS: {
  key: SettingsTab;
  label: string;
  icon: typeof Sparkles;
  emoji: string;
  description: string;
}[] = [
  {
    key: 'ai',
    label: 'AI 设置',
    icon: Sparkles,
    emoji: '🤖',
    description: '配置 AI 辅助写作服务',
  },
  {
    key: 'accel',
    label: '加速设置',
    icon: Globe,
    emoji: '⚡',
    description: '图标 CDN 加速配置',
  },
  {
    key: 'images',
    label: '图片管理',
    icon: ImageIcon,
    emoji: '🖼️',
    description: '上传和管理文档图片',
  },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, sidebarOpen]);

  const handleNav = (key: SettingsTab) => {
    setActiveTab(key);
    if (isMobile) setSidebarOpen(false);
  };

  const currentMenu = MENU_ITEMS.find((m) => m.key === activeTab);

  return (
    <div className="settings-root">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`settings-sidebar ${isMobile ? 'mobile' : ''} ${sidebarOpen ? 'open' : ''}`}
      >
        <div className="sidebar-header">
          <button
            onClick={() => navigate('/admin')}
            className="sidebar-back"
          >
            <ArrowLeft size={16} />
            返回后台
          </button>
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <Settings size={20} />
            </div>
            <div>
              <h1 className="sidebar-brand-title">设置</h1>
              <p className="sidebar-brand-desc">系统配置管理</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <div>
                  <div className="sidebar-nav-label">{item.label}</div>
                  <div className="sidebar-nav-desc">{item.description}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="settings-main">
        {/* Mobile header */}
        {isMobile && (
          <header className="mobile-header">
            <button
              onClick={() => setSidebarOpen(true)}
              className="mobile-menu-btn"
            >
              <Menu size={20} />
            </button>
            <span className="mobile-title">
              {currentMenu?.emoji} {currentMenu?.label}
            </span>
            <div className="w-8" />
          </header>
        )}

        <div className="settings-content">
          {activeTab === 'ai' && <AISettings />}
          {activeTab === 'accel' && <AccelSettings />}
          {activeTab === 'images' && <ImageManager />}
        </div>
      </main>

      <style>{`
        .settings-root {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%);
        }
        .dark .settings-root {
          background: linear-gradient(135deg, #0f1219 0%, #0a0e14 100%);
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          z-index: 40;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
        }

        .settings-sidebar {
          width: 260px;
          flex-shrink: 0;
          border-right: 1px solid rgba(15, 23, 42, 0.06);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .dark .settings-sidebar {
          border-right-color: rgba(255, 255, 255, 0.06);
          background: rgba(18, 22, 30, 0.92);
        }
        .settings-sidebar.mobile {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 50;
          transform: translateX(-100%);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: none;
        }
        .settings-sidebar.mobile.open {
          transform: translateX(0);
          box-shadow: 20px 0 60px rgba(0, 0, 0, 0.15);
        }

        .sidebar-header {
          padding: 20px 20px 16px;
        }
        .sidebar-back {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          margin-bottom: 16px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #64748b;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
          width: 100%;
          text-align: left;
        }
        .sidebar-back:hover {
          background: rgba(99, 102, 241, 0.08);
          color: #6366f1;
        }
        .dark .sidebar-back { color: #94a3b8; }
        .dark .sidebar-back:hover { background: rgba(99, 102, 241, 0.15); color: #818cf8; }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 4px;
        }
        .sidebar-brand-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
          flex-shrink: 0;
        }
        .sidebar-brand-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .dark .sidebar-brand-title { color: #f1f5f9; }
        .sidebar-brand-desc {
          font-size: 0.78rem;
          color: #94a3b8;
          margin: 2px 0 0;
        }

        .sidebar-nav {
          padding: 8px 12px;
          flex: 1;
        }
        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 14px;
          border-radius: 14px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.18s;
          text-align: left;
          color: #475569;
          margin-bottom: 4px;
        }
        .dark .sidebar-nav-item { color: #94a3b8; }
        .sidebar-nav-item:hover {
          background: rgba(99, 102, 241, 0.06);
          color: #334155;
        }
        .dark .sidebar-nav-item:hover { background: rgba(99, 102, 241, 0.1); color: #e2e8f0; }
        .sidebar-nav-item.active {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.06));
          color: #6366f1;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
        }
        .dark .sidebar-nav-item.active { color: #818cf8; }
        .sidebar-nav-label {
          font-size: 0.9rem;
          font-weight: 600;
        }
        .sidebar-nav-desc {
          font-size: 0.75rem;
          opacity: 0.6;
          margin-top: 1px;
        }

        .settings-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
          position: sticky;
          top: 0;
          z-index: 30;
        }
        .dark .mobile-header {
          background: rgba(18, 22, 30, 0.88);
          border-bottom-color: rgba(255, 255, 255, 0.06);
        }
        .mobile-menu-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;
        }
        .dark .mobile-menu-btn { color: #94a3b8; }
        .mobile-menu-btn:hover { background: rgba(99, 102, 241, 0.08); }
        .mobile-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }
        .dark .mobile-title { color: #f1f5f9; }

        .settings-content {
          flex: 1;
          overflow-y: auto;
          padding: 25px;
        }

        @media (max-width: 768px) {
          .settings-content {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
