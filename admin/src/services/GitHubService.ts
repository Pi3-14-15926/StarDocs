import axios, { type AxiosInstance } from 'axios';
import type { DocumentNode, GitHubConfig, TreeNode } from '@/types';

const GITHUB_API = 'https://api.github.com';

export class GitHubService {
  private client: AxiosInstance;

  constructor(config: GitHubConfig) {
    this.client = axios.create({
      baseURL: GITHUB_API,
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  }

  async testConnection(owner: string, repo: string): Promise<boolean> {
    try {
      await this.client.get(`/repos/${owner}/${repo}`);
      return true;
    } catch {
      return false;
    }
  }

  async getFile(
    owner: string,
    repo: string,
    path: string,
    branch: string,
  ): Promise<{ content: string; sha: string }> {
    const { data } = await this.client.get(
      `/repos/${owner}/${repo}/contents/${path}`,
      { params: { ref: branch } },
    );
    const content = decodeURIComponent(
      escape(atob(data.content.replace(/\n/g, ''))),
    );
    return { content, sha: data.sha };
  }

  async getTree(
    owner: string,
    repo: string,
    path: string,
    branch: string,
  ): Promise<DocumentNode[]> {
    const url = `/repos/${owner}/${repo}/contents/${path}`;
    console.log('Fetching tree:', { owner, repo, path, branch, url });

    const { data } = await this.client.get(url, { params: { ref: branch } });

    console.log(
      'API response:',
      Array.isArray(data) ? data.length + ' items' : typeof data,
    );

    if (!Array.isArray(data)) {
      throw new Error('Invalid response from GitHub API');
    }

    return data
      .filter((item: { name: string }) => !item.name.startsWith('.'))
      .map(
        (item: { name: string; path: string; type: string; sha: string }) => ({
          name: item.name,
          path: item.path,
          type:
            item.type === 'dir' ? ('directory' as const) : ('file' as const),
          sha: item.sha,
        }),
      );
  }

  async getTreeRecursive(
    owner: string,
    repo: string,
    branch: string,
  ): Promise<TreeNode[]> {
    const { data } = await this.client.get(
      `/repos/${owner}/${repo}/git/trees/${branch}`,
      { params: { recursive: 1 } },
    );
    return data.tree;
  }

  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string,
    sha?: string,
  ): Promise<{ sha: string }> {
    const body: Record<string, unknown> = {
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      branch,
    };
    if (sha) body.sha = sha;

    const { data } = await this.client.put(
      `/repos/${owner}/${repo}/contents/${path}`,
      body,
    );
    return { sha: data.content.sha };
  }

  async deleteFile(
    owner: string,
    repo: string,
    path: string,
    message: string,
    branch: string,
    sha: string,
  ): Promise<void> {
    await this.client.delete(`/repos/${owner}/${repo}/contents/${path}`, {
      data: { message, sha, branch },
    });
  }

  async renameFile(
    owner: string,
    repo: string,
    oldPath: string,
    newPath: string,
    branch: string,
  ): Promise<void> {
    const { content, sha: oldSha } = await this.getFile(
      owner,
      repo,
      oldPath,
      branch,
    );
    await this.createOrUpdateFile(
      owner,
      repo,
      newPath,
      content,
      `docs: rename ${oldPath.split('/').pop()} → ${newPath.split('/').pop()}`,
      branch,
    );
    await this.deleteFile(
      owner,
      repo,
      oldPath,
      `docs: delete old file ${oldPath.split('/').pop()}`,
      branch,
      oldSha,
    );
  }

  async moveFile(
    owner: string,
    repo: string,
    oldPath: string,
    newPath: string,
    message: string,
    branch: string,
  ): Promise<void> {
    const { content, sha: oldSha } = await this.getFile(
      owner,
      repo,
      oldPath,
      branch,
    );
    await this.createOrUpdateFile(
      owner,
      repo,
      newPath,
      content,
      message,
      branch,
    );
    await this.deleteFile(
      owner,
      repo,
      oldPath,
      `docs: delete old ${oldPath.split('/').pop()}`,
      branch,
      oldSha,
    );
  }

  async moveDirectory(
    owner: string,
    repo: string,
    oldDirPath: string,
    newDirPath: string,
    branch: string,
  ): Promise<void> {
    const files = await this.getTreeRecursive(owner, repo, branch);
    const dirPrefix = oldDirPath.endsWith('/') ? oldDirPath : `${oldDirPath}/`;
    const affectedFiles = files.filter(
      (f) => f.type === 'blob' && f.path.startsWith(dirPrefix),
    );

    for (const file of affectedFiles) {
      const relativePath = file.path.slice(dirPrefix.length);
      const newPath = `${newDirPath}/${relativePath}`;
      const { content } = await this.getFile(owner, repo, file.path, branch);
      await this.createOrUpdateFile(
        owner,
        repo,
        newPath,
        content,
        `docs: move ${file.path.split('/').pop()}`,
        branch,
      );
      await this.deleteFile(
        owner,
        repo,
        file.path,
        `docs: delete old ${file.path.split('/').pop()}`,
        branch,
        file.sha,
      );
    }
  }

  async deleteDirectory(
    owner: string,
    repo: string,
    dirPath: string,
    branch: string,
  ): Promise<void> {
    const files = await this.getTreeRecursive(owner, repo, branch);
    const dirPrefix = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;
    const affectedFiles = files.filter(
      (f) => f.type === 'blob' && f.path.startsWith(dirPrefix),
    );

    for (const file of affectedFiles) {
      await this.deleteFile(
        owner,
        repo,
        file.path,
        `docs: delete ${file.path.split('/').pop()}`,
        branch,
        file.sha,
      );
    }
  }

  async renameDirectory(
    owner: string,
    repo: string,
    oldDirPath: string,
    newDirPath: string,
    branch: string,
  ): Promise<void> {
    await this.moveDirectory(owner, repo, oldDirPath, newDirPath, branch);
  }

  async getCommits(
    owner: string,
    repo: string,
    path: string,
    branch: string,
    perPage = 10,
  ): Promise<
    Array<{ sha: string; message: string; date: string; author: string }>
  > {
    const { data } = await this.client.get(`/repos/${owner}/${repo}/commits`, {
      params: { path, sha: branch, per_page: perPage },
    });
    return data.map(
      (commit: {
        sha: string;
        commit: {
          message: string;
          author: { name: string; date: string };
        };
      }) => ({
        sha: commit.sha,
        message: commit.commit.message,
        date: commit.commit.author.date,
        author: commit.commit.author.name,
      }),
    );
  }
}
