import { create } from 'zustand';
import type { DocumentNode, Frontmatter } from '@/types';
import { useConfigStore } from './configStore';
import { adapter } from '@/adapters/RspressAdapter';
import { showAlert } from '@/hooks/useAlert';

interface DocumentState {
  tree: DocumentNode[];
  currentPath: string | null;
  currentContent: string;
  currentFrontmatter: Frontmatter;
  currentSha: string;
  isLoading: boolean;
  isSaving: boolean;
  searchQuery: string;
  expandedPaths: Set<string>;
  lastSaved: string | null;

  loadTree: () => Promise<void>;
  loadChildren: (path: string) => Promise<void>;
  loadDocument: (path: string) => Promise<void>;
  setCurrentContent: (content: string) => void;
  setCurrentFrontmatter: (frontmatter: Frontmatter) => void;
  saveDocument: () => Promise<void>;
  createDocument: (path: string, frontmatter: Frontmatter, content: string) => Promise<void>;
  deleteDocument: (path: string) => Promise<void>;
  renameDocument: (newPath: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  toggleExpanded: (path: string) => Promise<void>;
}

function updateNodeChildren(nodes: DocumentNode[], path: string, children: DocumentNode[]): DocumentNode[] {
  return nodes.map((node) => {
    if (node.path === path) {
      return { ...node, children };
    }
    if (node.children) {
      return { ...node, children: updateNodeChildren(node.children, path, children) };
    }
    return node;
  });
}

function removeNode(nodes: DocumentNode[], path: string): DocumentNode[] {
  return nodes
    .filter((node) => node.path !== path)
    .map((node) => {
      if (node.children) {
        return { ...node, children: removeNode(node.children, path) };
      }
      return node;
    });
}

function findNode(nodes: DocumentNode[], path: string): DocumentNode | undefined {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findNode(node.children, path);
      if (found) return found;
    }
  }
  return undefined;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  tree: [],
  currentPath: null,
  currentContent: '',
  currentFrontmatter: {},
  currentSha: '',
  isLoading: false,
  isSaving: false,
  searchQuery: '',
  expandedPaths: new Set<string>(),
  lastSaved: null,

  loadTree: async () => {
    let { githubService } = useConfigStore.getState();
    const { github } = useConfigStore.getState();

    if (!githubService) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          githubService = useConfigStore.getState().githubService;
          resolve();
        }, 300);
        return () => clearTimeout(timer);
      });
    }

    if (!githubService) {
      console.error('GitHub service not initialized');
      return;
    }

    set({ isLoading: true });
    try {
      const docsDir = github.docsDir || 'docs';
      const tree = await githubService.getTree(
        github.owner,
        github.repo,
        docsDir,
        github.branch,
      );
      set({ tree });
    } catch (error) {
      console.error('Failed to load tree:', error);
      showAlert('error', '加载失败', error instanceof Error ? error.message : '加载文档树失败');
    } finally {
      set({ isLoading: false });
    }
  },

  loadChildren: async (path: string) => {
    const { githubService } = useConfigStore.getState();
    const { github } = useConfigStore.getState();
    if (!githubService) return;

    const { tree } = get();
    const node = findNode(tree, path);
    if (!node || node.type !== 'directory') return;

    try {
      const children = await githubService.getTree(
        github.owner,
        github.repo,
        path,
        github.branch,
      );
      set({ tree: updateNodeChildren(tree, path, children) });
    } catch (error) {
      console.error('Failed to load children:', error);
    }
  },

  loadDocument: async (path) => {
    const { githubService } = useConfigStore.getState();
    const { github } = useConfigStore.getState();
    if (!githubService) return;

    set({ isLoading: true });
    try {
      const { content, sha } = await githubService.getFile(
        github.owner,
        github.repo,
        path,
        github.branch,
      );
      const { frontmatter, body } = adapter.parseDocument(content);
      set({
        currentPath: path,
        currentContent: body,
        currentFrontmatter: frontmatter,
        currentSha: sha,
      });
    } catch (error) {
      console.error('Failed to load document:', error);
      showAlert('error', '加载失败', error instanceof Error ? error.message : '加载文档失败');
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentContent: (content) => set({ currentContent: content }),

  setCurrentFrontmatter: (frontmatter) => set({ currentFrontmatter: frontmatter }),

  saveDocument: async () => {
    const { githubService } = useConfigStore.getState();
    const { github } = useConfigStore.getState();
    const { currentPath, currentContent, currentFrontmatter, currentSha } = get();
    if (!githubService || !currentPath) return;

    set({ isSaving: true });
    try {
      const fullContent = adapter.generateDocument(currentFrontmatter, currentContent);
      const { sha } = await githubService.createOrUpdateFile(
        github.owner,
        github.repo,
        currentPath,
        fullContent,
        `docs: update ${currentPath.split('/').pop()}`,
        github.branch,
        currentSha,
      );
      set({ currentSha: sha, lastSaved: new Date().toISOString() });
      await get().loadTree();
    } catch (error) {
      console.error('Failed to save document:', error);
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  createDocument: async (path, frontmatter, content) => {
    const { githubService } = useConfigStore.getState();
    const { github } = useConfigStore.getState();
    if (!githubService) return;

    const fullContent = adapter.generateDocument(frontmatter, content);
    await githubService.createOrUpdateFile(
      github.owner,
      github.repo,
      path,
      fullContent,
      `docs: create ${path.split('/').pop()}`,
      github.branch,
    );
    await get().loadTree();
  },

  deleteDocument: async (path) => {
    const { githubService } = useConfigStore.getState();
    const { github } = useConfigStore.getState();
    const { tree } = get();
    if (!githubService) return;

    const node = findNode(tree, path);
    if (!node) return;

    await githubService.deleteFile(
      github.owner,
      github.repo,
      path,
      `docs: delete ${path.split('/').pop()}`,
      github.branch,
      node.sha || '',
    );
    await get().loadTree();
  },

  renameDocument: async (newPath) => {
    const { githubService } = useConfigStore.getState();
    const { github } = useConfigStore.getState();
    const { currentPath } = get();
    if (!githubService || !currentPath) return;

    set({ isLoading: true });
    try {
      await githubService.renameFile(
        github.owner,
        github.repo,
        currentPath,
        newPath,
        github.branch,
      );
      set({ currentPath: newPath });
      await get().loadTree();
    } catch (error) {
      console.error('Failed to rename document:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleExpanded: async (path) => {
    const { expandedPaths, tree } = get();
    const next = new Set(expandedPaths);
    const isExpanding = !next.has(path);

    if (isExpanding) {
      next.add(path);
      set({ expandedPaths: next });

      const node = findNode(tree, path);
      if (node && !node.children) {
        await get().loadChildren(path);
      }
    } else {
      next.delete(path);
      set({ expandedPaths: next });
    }
  },
}));
