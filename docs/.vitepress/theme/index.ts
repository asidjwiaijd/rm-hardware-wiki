import { NolebaseGitChangelogPlugin } from '@nolebase/vitepress-plugin-git-changelog/client';
import { NolebasePagePropertiesPlugin } from '@nolebase/vitepress-plugin-page-properties';
import { NProgress } from 'nprogress-v2/dist/index.js';
import { inBrowser, type Theme } from 'vitepress';
import vitepressBackToTop from 'vitepress-plugin-back-to-top';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';
import DefaultTheme from 'vitepress/theme';
import locales from '../i18n/locales';
import BomPlanner from './components/BomPlanner.vue';
import LinkCard from './components/LinkCard.vue';
import Note from './components/Note.vue';
import ResourceGrid from './components/ResourceGrid.vue';
import ToDo from './components/ToDo.vue';
import VideoMap from './components/VideoMap.vue';
import Layout from './Layout.vue';

import '@mdit/plugin-spoiler/style';
import '@nolebase/vitepress-plugin-git-changelog/client/style.css';
import '@nolebase/vitepress-plugin-highlight-targeted-heading/client/style.css';
import '@nolebase/vitepress-plugin-page-properties/client/style.css';
import '@waline/client/style';
import 'nprogress-v2/dist/index.css';
import 'vitepress-markdown-timeline/dist/theme/index.css';
import 'vitepress-plugin-back-to-top/dist/style.css';

export default {
  extends: DefaultTheme,

  Layout,

  enhanceApp({ app, router }) {
    vitepressBackToTop({ threshold: 300 });

    // 全局注册，md 里可以直接写 <Note> / <ToDo> / <LinkCard>，不用 script setup
    app.component('Note', Note);
    app.component('ToDo', ToDo);
    app.component('LinkCard', LinkCard);

    // 资源区的三个可视化组件
    app.component('BomPlanner', BomPlanner);
    app.component('VideoMap', VideoMap);
    app.component('ResourceGrid', ResourceGrid);

    app.use(NolebaseGitChangelogPlugin);
    app.use(NolebasePagePropertiesPlugin<{ progress: number }>(), {
      properties: locales.pageProperties,
    });

    if (inBrowser) {
      NProgress.configure({ showSpinner: false });

      // 换页后把侧边栏当前项滚到可视区中央，长目录下很有用
      const scrollActiveSidebarItem = () => {
        const activeItem = document
          .querySelector('aside.VPSidebar')
          ?.querySelector('div.VPSidebarItem.is-link.is-active');

        if (!activeItem) {
          return;
        }

        activeItem.scrollIntoView({ block: 'center' });

        if (activeItem instanceof HTMLElement) {
          activeItem.setAttribute('tabindex', '-1');
        }
      };

      router.onBeforeRouteChange = () => void NProgress.start();
      router.onAfterRouteChange = () => {
        NProgress.done();
        requestAnimationFrame(() =>
          requestAnimationFrame(scrollActiveSidebarItem),
        );
      };
    }

    enhanceAppWithTabs(app);
  },
} satisfies Theme;
