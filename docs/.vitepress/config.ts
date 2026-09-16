import { align } from '@mdit/plugin-align';
import { figure } from '@mdit/plugin-figure';
import { katex } from '@mdit/plugin-katex';
import { mark } from '@mdit/plugin-mark';
import { spoiler } from '@mdit/plugin-spoiler';
import { sup } from '@mdit/plugin-sup';
import { BiDirectionalLinks } from '@nolebase/markdown-it-bi-directional-links';
import {
  GitChangelog,
  GitChangelogMarkdownSection,
} from '@nolebase/vitepress-plugin-git-changelog/vite';
import {
  PageProperties,
  PagePropertiesMarkdownSection,
} from '@nolebase/vitepress-plugin-page-properties/vite';
import {
  type DefaultTheme,
  defineConfig,
  type HeadConfig,
  type PageData,
  type TransformPageContext,
  type UserConfig,
} from 'vitepress';
import timeline from 'vitepress-markdown-timeline';
import {
  chineseSearchOptimize,
  pagefindPlugin,
} from 'vitepress-plugin-pagefind';
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs';
import keywords from './data/keywords.json' with { type: 'json' };
import contributors from './helpers/contributors.ts';
import customElements from './helpers/customElements.ts';
import locales from './i18n/locales.ts';
import preserveMarkSyntaxInsideContainers from './plugins/preserveMarkSyntaxInsideContainers.ts';
import sidebar, { excludedPages } from './sidebar.ts';

// 站点部署地址。默认值对应 GitHub Pages 项目页
// （<user>.github.io/<repo>/，必须带 base）。
//
// 自托管时用环境变量覆盖，一份代码可以构建出两个部署目标：
//   SITE_BASE=/ SITE_ORIGIN=http://192.168.8.244:18086 pnpm build
//
// SITE_ORIGIN 只影响 sitemap 和 og/canonical，不影响资源路径。
const BASE = process.env.SITE_BASE ?? '/rm-hardware-wiki/';
const ORIGIN = process.env.SITE_ORIGIN ?? 'https://asidjwiaijd.github.io';
const REPO = 'https://github.com/asidjwiaijd/rm-hardware-wiki';

// 站点根的绝对地址，用于 canonical / og:url / sitemap
const SITE_URL = ORIGIN.replace(/\/$/, '') + BASE;

const time =
  new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) +
  ' GMT+8:00';

// 首页、随机跳转、最近更新这类非正文页面不挂"页面属性"和"页面历史"区块
const excludes = ['index.md', 'random.md', 'recent_update.md'];

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'RM 硬件组 Wiki',
  description: '苍穹战队硬件组培训与知识库',
  base: BASE,
  head: getHead(),
  cleanUrls: true,
  lastUpdated: true,
  lang: 'zh-CN',

  markdown: {
    ...locales.markdown,
    config: (md) =>
      void md
        .use(spoiler)
        .use(sup)
        .use(figure, { linkImage: false })
        .use(align)
        .use(mark)
        .use(katex)
        .use(timeline)
        .use(BiDirectionalLinks({ dir: 'docs' }))
        .use(tabsMarkdownPlugin)
        .use(preserveMarkSyntaxInsideContainers),
    toc: {
      level: [2, 3, 4],
    },
    image: {
      lazyLoading: true,
    },
  },

  vite: {
    plugins: [
      GitChangelog({
        repoURL: REPO,
        mapAuthors: contributors,
      }),
      PageProperties(),
      PagePropertiesMarkdownSection({
        excludes: excludes.concat(['schedule.md']),
      }),
      GitChangelogMarkdownSection({
        excludes,
      }),
      pagefindPlugin({
        customSearchQuery: chineseSearchOptimize,
        showDate: true,
        ...locales.search,
        excludeSelector: [
          '.vp-nolebase-page-properties',
          '.vp-nolebase-git-changelog',
          'h2#贡献者',
          'h2#页面历史',
        ],
      }),
    ],

    optimizeDeps: {
      include: [
        '@nolebase/vitepress-plugin-page-properties > date-fns',
        '@nolebase/vitepress-plugin-page-properties > date-fns/locale',
      ],
      exclude: ['@nolebase/ui', 'vitepress'],
    },
    ssr: {
      noExternal: [
        '@nolebase/vitepress-plugin-highlight-targeted-heading',
        '@nolebase/ui',
      ],
    },
  },

  vue: {
    template: {
      compilerOptions: {
        isCustomElement: customElements.includes,
      },
    },
  },

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '培训计划', link: '/training/' },
      { text: '本周进度', link: '/schedule' },
      { text: '环境配置', link: '/environment/' },
      { text: '资源', link: '/resources/' },
      {
        text: '反馈',
        items: [
          { text: '提 Issue', link: `${REPO}/issues/new` },
          { text: '参与编写', link: '/about/contribute' },
        ],
      },
    ],

    externalLinkIcon: true,

    sidebar,

    socialLinks: [{ icon: 'github', link: REPO }],

    // Footer 详见 ./theme/components/Footer.vue

    editLink: {
      pattern: `${REPO}/edit/main/docs/:path`,
      text: '在 GitHub 上编辑此页面',
    },

    ...locales.main,
  },

  sitemap: {
    hostname: SITE_URL,
  },

  srcExclude: excludedPages.concat(['**/part_*.md']),

  transformPageData,
});

function transformPageData(
  pageData: PageData,
  ctx: TransformPageContext<NoInfer<DefaultTheme.Config>>,
) {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const url = new URL(
    pageData.relativePath.replace(/(?:(^|\/)index)?\.md$/, '$1'),
    SITE_URL,
  ).href;
  // 单语言站点直接取 site 即可；多语言时才需要按路由解析 locale
  const site = ctx.siteConfig.site;
  const title = pageData.title
    ? `${pageData.title} | ${site.title}`
    : site.title;
  const description = pageData.description || site.description;

  ((pageData.frontmatter.head ??= []) as HeadConfig[]).push(
    ['meta', { property: 'og:url', content: url }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: site.title }],
    ['link', { rel: 'canonical', href: url }],
  );
}

function getHead() {
  const head: UserConfig<DefaultTheme.Config>['head'] = [
    ['link', { rel: 'icon', href: BASE + 'logo.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'theme-color', content: '#c8321e' }],
    ['meta', { name: 'mobile-web-app-capable', content: 'yes' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css',
        crossorigin: 'anonymous',
      },
    ],
    ['meta', { name: 'keywords', content: keywords.join(',') }],
    [
      'script',
      {},
      `console.log("%c RM 硬件组 Wiki %c Built at ${time}", "font-weight:700;background:#c8321e;color:white;font-size:16px","color:#64748b")`,
    ],
  ];

  return head;
}
