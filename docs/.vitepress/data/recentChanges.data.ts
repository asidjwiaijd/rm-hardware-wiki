import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import removeMarkdown from 'remove-markdown';
import simpleGit, { type SimpleGit } from 'simple-git';
import { defineLoader } from 'vitepress';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const DOCS_PREFIX = 'docs/';
const MAX_ITEMS = 24;
const EXCLUDED = new Set([
  'docs/index.md',
  'docs/random.md',
  'docs/recent_update.md',
]);

export type RecentChange = {
  /** 相对仓库根的路径，如 docs/training/week1.md */
  path: string;
  /** 站内路由，如 /training/week1 */
  href: string;
  title: string;
  excerpt: string;
  authorName: string;
  updatedAt: string;
};

export type RecentChangesData = RecentChange[];

declare const data: RecentChangesData;
export { data };

function normalize(path: string): string {
  return path.replace(/\\/g, '/').trim();
}

function isDocsMarkdown(path: string): boolean {
  return (
    path.startsWith(DOCS_PREFIX) &&
    path.endsWith('.md') &&
    !path.startsWith('docs/.vitepress/') &&
    !EXCLUDED.has(path)
  );
}

function toHref(path: string): string {
  return (
    (
      '/' +
      path
        .slice(DOCS_PREFIX.length)
        .replace(/\.md$/, '')
        .replace(/(^|\/)index$/, '$1')
    ).replace(/\/$/, '') || '/'
  );
}

function splitFrontmatter(raw: string): { fm: string; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return match ? { fm: match[1], body: match[2] } : { fm: '', body: raw };
}

function readPage(path: string): { title: string; excerpt: string } | null {
  const file = resolve(ROOT, path);
  if (!existsSync(file)) {
    return null;
  }

  const { fm, body } = splitFrontmatter(readFileSync(file, 'utf-8'));

  const title =
    fm
      .match(/^title:\s*(.+)$/m)?.[1]
      .trim()
      .replace(/^['"]|['"]$/g, '') ??
    body.match(/^#\s+(.+)$/m)?.[1].trim() ??
    path.split('/').pop()!.replace(/\.md$/, '');

  // 取正文第一段非标题、非容器、非 HTML 的文字做摘要
  const excerpt =
    body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(
        (line) =>
          line.length > 0 &&
          !line.startsWith('#') &&
          !line.startsWith(':::') &&
          !line.startsWith('<') &&
          !line.startsWith('|') &&
          !line.startsWith('```') &&
          !line.startsWith('[^'),
      ) ?? '';

  return {
    title: removeMarkdown(title).trim(),
    excerpt: removeMarkdown(excerpt).replace(/\s+/g, ' ').trim().slice(0, 80),
  };
}

async function collect(git: SimpleGit): Promise<RecentChangesData> {
  // 一次 log 取够，再按文件去重，避免对每个文件单独调 git
  const log = await git.raw([
    'log',
    '-n',
    '400',
    '--date=iso-strict',
    '--pretty=format:%x00%an%x00%ad',
    '--name-only',
    '--',
    'docs',
  ]);

  const seen = new Set<string>();
  const result: RecentChangesData = [];

  let authorName = '';
  let updatedAt = '';

  for (const line of log.split(/\r?\n/)) {
    if (line.startsWith('\0')) {
      const [, author, date] = line.split('\0');
      authorName = author ?? '';
      updatedAt = date ?? '';
      continue;
    }

    const path = normalize(line);
    if (!path || seen.has(path) || !isDocsMarkdown(path)) {
      continue;
    }

    seen.add(path);

    const page = readPage(path);
    if (!page) {
      // 文件已被删除或改名，跳过
      continue;
    }

    result.push({ path, href: toHref(path), authorName, updatedAt, ...page });

    if (result.length >= MAX_ITEMS) {
      break;
    }
  }

  return result;
}

export default defineLoader({
  async load(): Promise<RecentChangesData> {
    try {
      const git = simpleGit({ baseDir: ROOT });
      if (!(await git.checkIsRepo())) {
        return [];
      }
      return await collect(git);
    } catch (error) {
      // 浅克隆或非 git 环境下静默降级，不要让整个构建挂掉
      console.warn('[recentChanges] 无法读取 git 历史：', error);
      return [];
    }
  },
});
