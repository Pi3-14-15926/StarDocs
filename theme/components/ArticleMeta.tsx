import { useEffect, useState } from 'react';
import { usePage } from '@rspress/core/runtime';
import './ArticleMeta.css';

function countWords(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = text
    .replace(/[\u4e00-\u9fff]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  return chineseChars + englishWords;
}

function getReadingTime(words: number): string {
  const minutes = Math.ceil(words / 400);
  if (minutes < 1) return '小于 1 分钟';
  return `${minutes} 分钟`;
}

export function ArticleMeta() {
  const { page } = usePage();
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState('');

  useEffect(() => {
    const calc = () => {
      const el = document.querySelector('.rspress-doc');
      if (!el) return;
      const text = el.textContent || '';
      const words = countWords(text);
      setWordCount(words);
      setReadingTime(getReadingTime(words));
    };

    calc();
    const observer = new MutationObserver(calc);
    const target = document.querySelector('.rspress-doc');
    if (target) {
      observer.observe(target, { childList: true, subtree: true });
    }
    return () => observer.disconnect();
  }, [page?.pagePath]);

  if (!wordCount) return null;

  return (
    <div className="rp-article-meta">
      <div className="rp-article-meta__item">
        <span className="rp-article-meta__icon">📝</span>
        <span className="rp-article-meta__label">字数</span>
        <span className="rp-article-meta__value">{wordCount.toLocaleString()} 字</span>
      </div>
      <div className="rp-article-meta__item">
        <span className="rp-article-meta__icon">🕐</span>
        <span className="rp-article-meta__label">阅读时间</span>
        <span className="rp-article-meta__value">{readingTime}</span>
      </div>
      <div className="rp-article-meta__divider" />
    </div>
  );
}
