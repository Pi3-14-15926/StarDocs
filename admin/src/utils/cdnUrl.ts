export type IconCdnMode =
  | 'jsdelivr'
  | 'statically'
  | 'githack'
  | 'custom'
  | 'none';

const GH_RAW = 'raw.githubusercontent.com';
const GITHUB_RE =
  /https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/([^/]+)\/(.+)/i;

export function resolveIconUrl(
  url: string,
  mode: IconCdnMode,
  customBase?: string,
  owner?: string,
  repo?: string,
): string {
  if (!url) return '';
  if (mode === 'none' || !mode) return url;

  if (owner && repo) {
    if (url.includes(`${GH_RAW}/${owner}/${repo}/`)) {
      return applyCdn(url, mode, customBase);
    }
    const m = url.match(GITHUB_RE);
    if (m && m[1] === owner && m[2] === repo) {
      const [, , , br, path] = m;
      return applyCdn(
        `https://${GH_RAW}/${owner}/${repo}/${br}/${path}`,
        mode,
        customBase,
      );
    }
  }

  if (url.includes(GH_RAW)) {
    return applyCdn(url, mode, customBase);
  }

  return url;
}

function applyCdn(
  rawUrl: string,
  mode: IconCdnMode,
  customBase?: string,
): string {
  if (mode === 'jsdelivr') return toJsdelivr(rawUrl);
  if (mode === 'statically') return toStatically(rawUrl);
  if (mode === 'githack') return toGithack(rawUrl);
  if (mode === 'custom') {
    if (!customBase) return rawUrl;
    return (
      customBase.replace(/\/+$/, '') + '/' + rawUrl.replace(/^https?:\/\//, '')
    );
  }
  return rawUrl;
}

function toJsdelivr(rawUrl: string): string {
  const m = rawUrl.match(
    /https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/,
  );
  if (!m) return rawUrl;
  return `https://cdn.jsdelivr.net/gh/${m[1]}/${m[2]}@${m[3]}/${m[4]}`;
}

function toStatically(rawUrl: string): string {
  const m = rawUrl.match(
    /https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/,
  );
  if (!m) return rawUrl;
  return `https://cdn.statically.io/gh/${m[1]}/${m[2]}/${m[3]}/${m[4]}`;
}

function toGithack(rawUrl: string): string {
  const m = rawUrl.match(
    /https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/,
  );
  if (!m) return rawUrl;
  return `https://raw.githack.com/${m[1]}/${m[2]}/${m[3]}/${m[4]}`;
}

export function describeCdn(mode: IconCdnMode): string {
  switch (mode) {
    case 'jsdelivr':
      return 'jsDelivr（国内可用，免费）';
    case 'statically':
      return 'Statically';
    case 'githack':
      return 'GitHack';
    case 'custom':
      return '自定义 CDN';
    case 'none':
      return '不使用加速';
  }
}
