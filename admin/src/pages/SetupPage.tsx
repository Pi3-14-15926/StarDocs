import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Github, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useConfigStore } from '@/stores/configStore';

export function SetupPage() {
  const navigate = useNavigate();
  const { github, setGitHubConfig, testConnection } = useConfigStore();
  const [owner, setOwner] = useState(github.owner);
  const [repo, setRepo] = useState(github.repo);
  const [branch, setBranch] = useState(github.branch || 'main');
  const [docsDir, setDocsDir] = useState(github.docsDir || 'docs');
  const [token, setToken] = useState(github.token);
  const [showToken, setShowToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);

  const handleTest = useCallback(async () => {
    setIsTesting(true);
    setTestResult(null);
    setGitHubConfig({ 
      owner, repo, branch, token, 
      docsDir, 
      assetsDir: `${docsDir}/assets`, 
      defaultBranch: branch 
    });
    const connected = await testConnection();
    setTestResult(connected ? 'success' : 'failed');
    setIsTesting(false);
  }, [owner, repo, branch, token, docsDir, setGitHubConfig, testConnection]);

  const handleSave = useCallback(async () => {
    setGitHubConfig({ 
      owner, repo, branch, token, 
      docsDir, 
      assetsDir: `${docsDir}/assets`, 
      defaultBranch: branch 
    });
    const connected = await testConnection();
    if (connected) {
      navigate('/admin');
    }
  }, [owner, repo, branch, token, docsDir, setGitHubConfig, testConnection, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
            <Settings size={32} className="text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rspress Admin</h1>
          <p className="mt-2 text-sm text-gray-500">配置 GitHub 仓库连接</p>
        </div>

        <div className="card space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              GitHub Owner
            </label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="input-field"
              placeholder="Pi3-14-15926"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Repository
            </label>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="input-field"
              placeholder="Docs"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Branch
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="input-field"
              placeholder="main"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              文档目录
            </label>
            <input
              type="text"
              value={docsDir}
              onChange={(e) => setDocsDir(e.target.value)}
              className="input-field"
              placeholder="docs"
            />
            <p className="mt-1 text-xs text-gray-400">
              GitHub 仓库中文档存放的目录
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              GitHub Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="input-field pr-10"
                placeholder="ghp_xxxxxxxxxxxx"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Token 仅存储在本地浏览器，不会上传到服务器
            </p>
          </div>

          {testResult && (
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                testResult === 'success'
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {testResult === 'success' ? (
                <>
                  <CheckCircle size={16} />
                  连接成功
                </>
              ) : (
                <>
                  <XCircle size={16} />
                  连接失败，请检查配置
                </>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleTest}
              disabled={isTesting || !owner || !repo || !token}
              className="btn-secondary flex-1"
            >
              <Github size={16} />
              {isTesting ? '测试中...' : '测试连接'}
            </button>
            <button
              onClick={handleSave}
              disabled={!owner || !repo || !token}
              className="btn-primary flex-1"
            >
              保存并进入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
