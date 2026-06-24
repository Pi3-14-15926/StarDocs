import { create } from 'zustand';
import { AIService } from '@/services/AIService';
import { GitHubService } from '@/services/GitHubService';
import type { AIConfig, GitHubConfig } from '@/types';

const CONFIG_KEY = 'rspress-admin-config';
const AI_CONFIG_KEY = 'rspress-admin-ai-config';

function loadConfig(): GitHubConfig {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    owner: '',
    repo: '',
    branch: 'main',
    token: '',
    docsDir: 'docs',
    assetsDir: 'docs/assets',
    defaultBranch: 'main',
  };
}

function loadAIConfig(): AIConfig {
  try {
    const saved = localStorage.getItem(AI_CONFIG_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: '',
    model: 'deepseek-chat',
    provider: 'deepseek',
  };
}

interface ConfigState {
  github: GitHubConfig;
  ai: AIConfig;
  isConnected: boolean;
  githubService: GitHubService | null;
  aiService: AIService | null;

  setGitHubConfig: (config: GitHubConfig) => void;
  setAIConfig: (config: AIConfig) => void;
  testConnection: () => Promise<boolean>;
  initServices: () => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  github: loadConfig(),
  ai: loadAIConfig(),
  isConnected: false,
  githubService: null,
  aiService: null,

  setGitHubConfig: (config) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    set({ github: config });
    get().initServices();
  },

  setAIConfig: (config) => {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
    set({ ai: config });
    get().initServices();
  },

  testConnection: async () => {
    const { github } = get();
    const service = new GitHubService(github);
    const connected = await service.testConnection(github.owner, github.repo);
    set({ isConnected: connected, githubService: service });
    return connected;
  },

  initServices: () => {
    const { github, ai } = get();
    if (github.token && github.owner && github.repo) {
      set({ githubService: new GitHubService(github) });
    }
    if (ai.apiKey) {
      set({ aiService: new AIService(ai) });
    }
  },
}));
