import { existsSync, readFileSync } from 'node:fs';
import { generateSidebar } from 'vitepress-sidebar';
import type {
  SidebarItem,
  SidebarMulti,
  VitePressSidebarOptions,
} from 'vitepress-sidebar/types';

// 被判定为"空壳页"的文件会在这里登记，交给 config.ts 的 srcExclude 一并排除
export const excludedPages: string[] = [];

// 需要默认折叠的目录
const shouldCollapse: string[] = ['resources/'];

// frontmatter 的 level 字段 → 侧边栏徽标
const levelLabel: Record<string, { text: string; type: string }> = {
  入门: { text: '入门', type: 'tip' },
  进阶: { text: '进阶', type: 'warning' },
  核心: { text: '核心', type: 'danger' },
  待补充: { text: '待补充', type: 'info' },
};

function readFrontmatter(link?: string): string | undefined {
  if (!link) return undefined;

  const rel = link.replace(/^\//, '').replace(/\/$/, '');
  const file = (
    rel.endsWith('.md')
      ? [`docs/${rel}`]
      : [`docs/${rel}.md`, `docs/${rel}/index.md`]
  ).find((p) => existsSync(p));

  if (!file) return undefined;

  return readFileSync(file, 'utf-8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
}

// 只有标题没有正文的页面不值得占一个链接位，扫出来交给 srcExclude
function whetherToExcludeLink(path?: string): boolean {
  if (!path || path === '/' || !existsSync(`docs/${path}`)) {
    return false;
  }

  const content = readFileSync(`docs/${path}`, 'utf-8');

  // 显式排除
  if (/^exclude:\s*true\s*$/m.test(content)) {
    return true;
  }

  const body = content
    // 移除 front matter
    .replace(/^---[\s\S]*?---\r?\n?/, '')
    // 移除 markdown 标题行
    .replace(/^#{1,6}\s+.*$/gm, '')
    // 移除空行
    .replace(/^\s*$/gm, '');

  return body.trim().length === 0;
}

// 后处理：折叠、摘掉空壳页、追加难度徽标
function postProcessSidebar(sidebar: SidebarMulti) {
  const walk = (items: SidebarItem[]) => {
    items.forEach((item) => {
      const link = item.link?.replace(/\/?index\.md$/, '/');
      const fm = readFrontmatter(item.link);
      const level = fm?.match(/^level:\s*(\S+)/m)?.[1];

      if (item.link && link) {
        if (shouldCollapse.includes(link)) {
          item.collapsed = true;
        }

        if (whetherToExcludeLink(item.link)) {
          excludedPages.push(item.link);
          delete item.link;
        }
      }

      // 复用 VitePress 原生 <Badge> 的 .VPBadge 类。
      // VPSidebarItem 用 v-html 渲染 text，所以可以直接拼 HTML。
      const badge = level ? levelLabel[level] : undefined;
      if (badge && item.text) {
        item.text += `<span class="VPBadge ${badge.type} sidebar-badge">${badge.text}</span>`;
      }

      if (item.items?.length) {
        walk(item.items);
      }
    });
  };

  Object.values(sidebar).forEach((group) => {
    if (group.items?.length) {
      walk(group.items);
    }
  });

  return sidebar;
}

const defaultSidebar: VitePressSidebarOptions = {
  useTitleFromFileHeading: true,
  useTitleFromFrontmatter: true,
  useFolderLinkFromIndexFile: true,
  useFolderTitleFromIndexFile: true,
  sortMenusByFrontmatterOrder: true,
  frontmatterOrderDefaultValue: 100,
};

export default postProcessSidebar(
  generateSidebar(
    (
      [
        {
          documentRootPath: '/docs',
          resolvePath: '/',
          excludeFilesByFrontmatterFieldName: 'exclude',
          excludeByGlobPattern: ['about/**', 'part_*.md'],
          collapsed: false,
          collapseDepth: 2,
          manualSortFileNameByPriority: ['intro.md', 'schedule.md', 'training'],
        },
        {
          documentRootPath: 'docs',
          scanStartPath: 'about',
          resolvePath: '/about/',
          rootGroupText: '❤️ 关于',
          rootGroupLink: '/',
        },
      ] satisfies VitePressSidebarOptions[]
    ).map((item) => ({ ...defaultSidebar, ...item })),
  ) as SidebarMulti,
);
