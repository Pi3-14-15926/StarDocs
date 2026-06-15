import type { AIConfig, AIAction } from '@/types';

const ACTION_PROMPTS: Record<AIAction, string> = {
  polish: '润色以下文本，使其更流畅、专业。仅返回Markdown，禁止解释。',
  expand: '扩写以下文本，增加更多细节和深度。仅返回Markdown，禁止解释。',
  simplify: '精简以下文本，去除冗余，保留核心意思。仅返回Markdown，禁止解释。',
  summarize: '为以下文本生成简短摘要。仅返回Markdown，禁止解释。',
  translate:
    '自动识别文本语言并翻译为另一种语言（中文翻译为英文，英文翻译为中文）。仅返回Markdown，禁止解释。',
  'generate-title': '为以下文本生成一个简洁的标题。仅返回标题文本，禁止解释。',
  'generate-tags': '为以下文本生成3-5个相关标签，以YAML数组格式返回。仅返回tags数组，禁止解释。',
  'generate-description':
    '为以下文本生成一段简短的SEO描述（100-150字）。仅返回描述文本，禁止解释。',
  'generate-faq':
    '为以下文本生成3-5个常见问题及答案，以Markdown格式返回。仅返回FAQ内容，禁止解释。',
};

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  updateConfig(config: AIConfig) {
    this.config = config;
  }

  async execute(
    action: AIAction,
    content: string,
    context?: { title?: string; frontmatter?: Record<string, unknown> },
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = `${ACTION_PROMPTS[action]}\n\n---\n\n${content}`;

    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() ?? '';
  }

  async streamExecute(
    action: AIAction,
    content: string,
    context?: { title?: string; frontmatter?: Record<string, unknown> },
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = `${ACTION_PROMPTS[action]}\n\n---\n\n${content}`;

    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n').filter((l) => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') break;

        try {
          const parsed = JSON.parse(data);
          const chunk = parsed.choices[0]?.delta?.content ?? '';
          if (chunk) {
            fullContent += chunk;
            onChunk?.(fullContent);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    return fullContent;
  }

  private buildSystemPrompt(context?: {
    title?: string;
    frontmatter?: Record<string, unknown>;
  }): string {
    const parts = ['你是一个专业的技术文档助手。', '要求：', '- 仅返回Markdown内容', '- 禁止解释、禁止废话、禁止前言后语'];

    if (context?.title) {
      parts.push(`- 文档标题: ${context.title}`);
    }
    if (context?.frontmatter) {
      parts.push(`- 文档元数据: ${JSON.stringify(context.frontmatter)}`);
    }

    return parts.join('\n');
  }
}
