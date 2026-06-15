import type { DocumentNode, Frontmatter, DocumentMeta } from '@/types';

export interface Adapter {
  getDocumentTree(root: string): Promise<DocumentNode[]>;
  parseDocument(content: string): { frontmatter: Frontmatter; body: string };
  generateDocument(frontmatter: Frontmatter, body: string): string;
  getCategoryFromPath(path: string, docsDir: string): string;
}

function parseFrontmatter(content: string): { data: Frontmatter; content: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content };
  }

  const yamlStr = match[1];
  const body = match[2];
  const data: Frontmatter = {};

  let currentKey = '';
  let inArray = false;
  const arrayItems: string[] = [];

  for (const line of yamlStr.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (inArray) {
      const itemMatch = trimmed.match(/^-\s+(.*)$/);
      if (itemMatch) {
        arrayItems.push(itemMatch[1].replace(/^["']|["']$/g, ''));
        continue;
      } else {
        data[currentKey] = arrayItems;
        inArray = false;
        arrayItems.length = 0;
      }
    }

    const kvMatch = trimmed.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      let value: string | boolean = kvMatch[2].trim();

      if (value === '' || value === '[]') {
        currentKey = key;
        inArray = true;
        arrayItems.length = 0;
        continue;
      }

      if (String(value).startsWith('[') && String(value).endsWith(']')) {
        const inner = String(value).slice(1, -1);
        data[key] = inner
          ? inner.split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, ''))
          : [];
      } else {
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else value = String(value).replace(/^["']|["']$/g, '');
        data[key] = value;
      }
    }
  }

  if (inArray) {
    data[currentKey] = arrayItems;
  }

  return { data, content: body };
}

function generateFrontmatter(data: Frontmatter): string {
  const lines: string[] = ['---'];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - "${String(item).replace(/"/g, '\\"')}"`);
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'number') {
      lines.push(`${key}: "${value}"`);
    } else if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') continue;
      lines.push(`${key}: "${trimmed.replace(/"/g, '\\"')}"`);
    }
  }

  lines.push('---');
  return lines.join('\n');
}

export class RspressAdapter implements Adapter {
  async getDocumentTree(_root: string): Promise<DocumentNode[]> {
    return [];
  }

  parseDocument(content: string): { frontmatter: Frontmatter; body: string } {
    const { data, content: body } = parseFrontmatter(content);
    return { frontmatter: data, body };
  }

  generateDocument(frontmatter: Frontmatter, body: string): string {
    return generateFrontmatter(frontmatter) + '\n\n' + body;
  }

  getCategoryFromPath(path: string, docsDir: string): string {
    const relative = path.replace(docsDir + '/', '');
    const parts = relative.split('/');
    return parts.length > 1 ? parts[0] : '';
  }

  extractDocumentMeta(
    path: string,
    content: string,
    sha: string,
    docsDir: string,
  ): DocumentMeta {
    const { frontmatter } = this.parseDocument(content);
    const name = path.split('/').pop()?.replace('.md', '') ?? '';
    return {
      path,
      name,
      title: frontmatter.title ?? name,
      category: this.getCategoryFromPath(path, docsDir),
      lastModified: new Date().toISOString(),
      sha,
    };
  }
}

export const adapter = new RspressAdapter();
