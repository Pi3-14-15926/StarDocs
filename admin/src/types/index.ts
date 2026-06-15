export interface AdminConfig {
  docsDir: string;
  assetsDir: string;
  defaultBranch: string;
  frontmatterFields: string[];
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  docsDir: string;
  assetsDir: string;
  defaultBranch: string;
}

export interface DocumentMeta {
  path: string;
  name: string;
  title: string;
  category: string;
  lastModified: string;
  sha: string;
}

export interface Frontmatter {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  keywords?: string[];
  [key: string]: unknown;
}

export interface DocumentNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DocumentNode[];
  sha?: string;
}

export interface AIConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  provider: string;
}

export type AIAction =
  | 'polish'
  | 'expand'
  | 'simplify'
  | 'summarize'
  | 'translate'
  | 'generate-title'
  | 'generate-tags'
  | 'generate-description'
  | 'generate-faq';

export interface EditorState {
  content: string;
  frontmatter: Frontmatter;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: string | null;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  sha: string;
  size?: number;
  url?: string;
}
