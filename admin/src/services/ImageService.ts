import axios, { type AxiosInstance } from 'axios';
import type { GitHubConfig } from '@/types';

const GITHUB_API = 'https://api.github.com';
const RAW_BASE = 'https://raw.githubusercontent.com';
const IMAGE_BRANCH = 'image';

export interface ImageItem {
  name: string;
  path: string;
  sha: string;
  size: number;
  rawUrl: string;
  category: string;
  docName: string;
  uploadedAt?: string;
}

export interface UploadImageResult {
  name: string;
  path: string;
  sha: string;
  size: number;
  rawUrl: string;
  cdnUrl: string;
  commitUrl: string;
  overwritten: boolean;
  branchCreated: boolean;
}

export class ImageService {
  private client: AxiosInstance;
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: GITHUB_API,
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  }

  private get owner() {
    return this.config.owner;
  }

  private get repo() {
    return this.config.repo;
  }

  async branchExists(branch: string = IMAGE_BRANCH): Promise<boolean> {
    try {
      await this.client.get(
        `/repos/${this.owner}/${this.repo}/branches/${encodeURIComponent(branch)}`,
      );
      return true;
    } catch {
      return false;
    }
  }

  async createBranch(
    branch: string = IMAGE_BRANCH,
    fromBranch?: string,
  ): Promise<void> {
    const base = fromBranch || this.config.defaultBranch || 'main';
    const refData = await this.client.get(
      `/repos/${this.owner}/${this.repo}/git/ref/heads/${encodeURIComponent(base)}`,
    );
    const sha = refData.data.object.sha;
    await this.client.post(`/repos/${this.owner}/${this.repo}/git/refs`, {
      ref: `refs/heads/${branch}`,
      sha,
    });
  }

  async ensureBranch(
    branch: string = IMAGE_BRANCH,
  ): Promise<{ created: boolean }> {
    if (await this.branchExists(branch)) return { created: false };
    await this.createBranch(branch);
    return { created: true };
  }

  async listImages(category?: string, docName?: string): Promise<ImageItem[]> {
    const branch = IMAGE_BRANCH;
    if (!(await this.branchExists(branch))) return [];

    const images: ImageItem[] = [];

    if (category && docName) {
      const dirPath = `images/${category}/${docName}`;
      try {
        const { data } = await this.client.get(
          `/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(dirPath)}`,
          { params: { ref: branch } },
        );
        if (Array.isArray(data)) {
          for (const item of data) {
            if (
              item.type === 'file' &&
              /\.(png|jpe?g|webp|gif|svg)$/i.test(item.name)
            ) {
              images.push(this.mapItem(item, category, docName, branch));
            }
          }
        }
      } catch {
        /* dir not found */
      }
    } else if (category) {
      const catPath = `images/${category}`;
      try {
        const { data: docs } = await this.client.get(
          `/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(catPath)}`,
          { params: { ref: branch } },
        );
        if (Array.isArray(docs)) {
          for (const doc of docs) {
            if (doc.type === 'dir') {
              const docPath = `${catPath}/${doc.name}`;
              try {
                const { data: files } = await this.client.get(
                  `/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(docPath)}`,
                  { params: { ref: branch } },
                );
                if (Array.isArray(files)) {
                  for (const f of files) {
                    if (
                      f.type === 'file' &&
                      /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name)
                    ) {
                      images.push(this.mapItem(f, category, doc.name, branch));
                    }
                  }
                }
              } catch {
                /* skip */
              }
            }
          }
        }
      } catch {
        /* cat not found */
      }
    } else {
      try {
        const { data: categories } = await this.client.get(
          `/repos/${this.owner}/${this.repo}/contents/images`,
          { params: { ref: branch } },
        );
        if (Array.isArray(categories)) {
          for (const cat of categories) {
            if (cat.type === 'dir') {
              const catPath2 = `images/${cat.name}`;
              try {
                const { data: docs } = await this.client.get(
                  `/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(catPath2)}`,
                  { params: { ref: branch } },
                );
                if (Array.isArray(docs)) {
                  for (const doc of docs) {
                    if (doc.type === 'dir') {
                      const docPath = `${catPath2}/${doc.name}`;
                      try {
                        const { data: files } = await this.client.get(
                          `/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(docPath)}`,
                          { params: { ref: branch } },
                        );
                        if (Array.isArray(files)) {
                          for (const f of files) {
                            if (
                              f.type === 'file' &&
                              /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name)
                            ) {
                              images.push(
                                this.mapItem(f, cat.name, doc.name, branch),
                              );
                            }
                          }
                        }
                      } catch {
                        /* skip */
                      }
                    }
                  }
                }
              } catch {
                /* skip */
              }
            }
          }
        }
      } catch {
        /* no images dir */
      }
    }

    return images;
  }

  private mapItem(
    item: { name: string; path: string; sha: string; size: number },
    category: string,
    docName: string,
    branch: string,
  ): ImageItem {
    return {
      name: item.name,
      path: item.path,
      sha: item.sha,
      size: item.size,
      rawUrl: `${RAW_BASE}/${this.owner}/${this.repo}/${branch}/${item.path}`,
      category,
      docName,
    };
  }

  async uploadImage(
    category: string,
    docName: string,
    filename: string,
    contentBase64: string,
  ): Promise<UploadImageResult> {
    const branch = IMAGE_BRANCH;
    let branchCreated = false;
    if (!(await this.branchExists(branch))) {
      await this.createBranch(branch);
      branchCreated = true;
    }

    const safeCategory =
      category
        .replace(/[/\\\x00-\x1f]/g, '_')
        .replace(/^[.\s]+|[.\s]+$/g, '')
        .slice(0, 60) || 'default';
    const safeDocName =
      docName
        .replace(/[/\\\x00-\x1f]/g, '_')
        .replace(/^[.\s]+|[.\s]+$/g, '')
        .slice(0, 60) || 'default';
    const safeName =
      filename
        .replace(/[/\\\x00-\x1f]/g, '_')
        .replace(/^[.\s]+|[.\s]+$/g, '')
        .slice(0, 80) || 'image';

    const fullPath = `images/${safeCategory}/${safeDocName}/${safeName}`;

    let existingSha: string | undefined;
    try {
      const exist = await this.client.get(
        `/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(fullPath)}`,
        { params: { ref: branch } },
      );
      existingSha = exist.data.sha;
    } catch {
      /* 404 = new file */
    }

    const putRes = await this.client.put(
      `/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(fullPath)}`,
      {
        message: existingSha
          ? `chore(images): update ${safeName}`
          : `chore(images): add ${safeName}`,
        content: contentBase64,
        branch,
        sha: existingSha,
      },
    );

    const rawUrl = `${RAW_BASE}/${this.owner}/${this.repo}/${branch}/${putRes.data.content.path}`;
    return {
      name: putRes.data.content.name,
      path: putRes.data.content.path,
      sha: putRes.data.content.sha,
      size: putRes.data.content.size,
      rawUrl,
      cdnUrl: rawUrl,
      commitUrl: putRes.data.commit.html_url,
      overwritten: !!existingSha,
      branchCreated,
    };
  }

  async deleteImage(path: string, sha: string): Promise<void> {
    await this.client.delete(
      `/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(path)}`,
      {
        data: {
          message: `chore(images): remove ${path.split('/').pop()}`,
          sha,
          branch: IMAGE_BRANCH,
        },
      },
    );
  }

  async listCategories(): Promise<string[]> {
    const branch = IMAGE_BRANCH;
    if (!(await this.branchExists(branch))) return [];
    try {
      const { data } = await this.client.get(
        `/repos/${this.owner}/${this.repo}/contents/images`,
        { params: { ref: branch } },
      );
      if (!Array.isArray(data)) return [];
      return data
        .filter((d: { type: string }) => d.type === 'dir')
        .map((d: { name: string }) => d.name);
    } catch {
      return [];
    }
  }

  async listDocNames(category: string): Promise<string[]> {
    const branch = IMAGE_BRANCH;
    if (!(await this.branchExists(branch))) return [];
    try {
      const { data } = await this.client.get(
        `/repos/${this.owner}/${this.repo}/contents/images/${encodeURIComponent(category)}`,
        { params: { ref: branch } },
      );
      if (!Array.isArray(data)) return [];
      return data
        .filter((d: { type: string }) => d.type === 'dir')
        .map((d: { name: string }) => d.name);
    } catch {
      return [];
    }
  }
}
