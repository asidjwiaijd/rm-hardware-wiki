import { Author } from '@nolebase/vitepress-plugin-git-changelog';
import { defineLoader } from 'vitepress';
import contributors from '../helpers/contributors.ts';

export type ContributorsData = Author[];

declare const data: ContributorsData;
export { data };

// helpers/contributors.ts 是唯一数据源：
// 这里给客户端组件用，config.ts 里给 GitChangelog 的 mapAuthors 用。
export default defineLoader({
  load(): ContributorsData {
    return contributors;
  },
});
