import { defineLoader } from 'vitepress';
import type { SidebarItem } from 'vitepress-sidebar/types';
import sidebar from '../sidebar.ts';

export type SidebarLink = { href: string; text: string };
export type SidebarData = SidebarLink[];

declare const data: SidebarData;
export { data };

// 扁平化全站链接，供 /random 随机跳转使用
export default defineLoader({
  load(): SidebarData {
    const links: SidebarLink[] = [];
    const skip = new Set(['/random', '/recent_update', '/']);

    function add(item: SidebarItem) {
      if (item.link && item.text) {
        const href = item.link.replace(/\.md$/, '');
        if (!skip.has(href)) {
          // 侧边栏文本里可能带徽标 HTML，取纯文本
          links.push({ href, text: item.text.replace(/<[^>]*>/g, '').trim() });
        }
      }

      item.items?.forEach(add);
    }

    sidebar['/']?.items?.forEach(add);

    return links;
  },
});
