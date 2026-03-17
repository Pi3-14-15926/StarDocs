import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { transformerNotationHighlight } from '@shikijs/transformers';
import readingTimePlugin from 'rspress-plugin-reading-time';
import { pluginGiscus } from 'rspress-plugin-giscus';

export default defineConfig({
  // base: '/Docs/',
  root: path.join(__dirname, 'docs'),
  lang: 'zh',
  i18nSource: {
    editLinkText: {
      zh: '编辑此页',
      en: 'Edit this page',
    },
    lastUpdatedText: {
      zh: '最后更新时间',
      en: 'Last Updated',
    },
  },
  title: '齐尹秦',
  icon: 'https://i.postimg.cc/j5yhCmXp/dog.png',
  logo: {
    light: 'https://i.postimg.cc/j5yhCmXp/dog.png',
    dark: 'https://i.postimg.cc/j5yhCmXp/dog.png',
  },
  plugins: [
    readingTimePlugin(
      { defaultLocale: 'zh-CN' }
    ),
    pluginGiscus({
      repo: 'Pi3-14-15926/Docs',
      repoId: 'R_kgDORnVr5Q',
      category: 'Announcements',
      categoryId: 'DIC_kwDORnVr5c4C4hIa',
    }),

  ],
  markdown: {
    showLineNumbers: true,
    shiki: {
      transformers: [transformerNotationHighlight()],
    },
  },
  themeConfig: {
    editLink: {
      docRepoBaseUrl:
        'https://github.com/Pi3-14-15926/Docs/tree/main/docs/',
    },
    editLinkText: '编辑此页',
    lastUpdated: true,
    lastUpdatedText: '最后更新时间',
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/web-infra-dev/rspress',
      },
    ],
    footer: {
      message: '© 2026 齐尹秦的知识库 • Powered by Rspress',
    },
  },
});
