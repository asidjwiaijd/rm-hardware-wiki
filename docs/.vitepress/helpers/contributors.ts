import { Author } from '@nolebase/vitepress-plugin-git-changelog';
import { Octokit } from 'octokit';

const OWNER = 'asidjwiaijd';
const REPO = 'rm-hardware-wiki';

type CustomAuthor = {
  /** GitHub 用户 ID，可通过 https://api.github.com/users/{username} 获取 */
  id: number;
  /** 用于匹配 git commit 作者名的别名列表 */
  mapByNameAliases: string[];
};

const octokit = new Octokit(
  process.env.GITHUB_TOKEN
    ? { auth: process.env.GITHUB_TOKEN, userAgent: 'RM-Hardware-Wiki' }
    : undefined,
);

// 用非 GitHub 名义提交过、或 co-author 形式参与的成员，在这里补映射
const customAuthors: CustomAuthor[] = [
  {
    id: 85775283,
    mapByNameAliases: ['Miriko H', 'MirikoHi'],
  },
];

// 完全不在 GitHub 上的贡献者，直接写死
const extraAuthors: Author[] = [];

async function getAuthors(): Promise<Author[]> {
  // 本地开发默认不打 GitHub API，避免频繁请求触发限流。
  // 需要本地验证时，先在终端导出 GITHUB_TOKEN：
  //   bash:       export GITHUB_TOKEN="ghp_xxx"
  //   powershell: $env:GITHUB_TOKEN = "ghp_xxx"
  if (process.env.NODE_ENV !== 'production' && !process.env.GITHUB_TOKEN) {
    return extraAuthors;
  }

  try {
    return concat([
      ...(await fetchContributors()),
      ...(await Promise.all(customAuthors.map(getAuthorDetail))),
      ...extraAuthors,
    ]);
  } catch (error) {
    console.error('Failed to fetch contributors from GitHub API:', error);
    return extraAuthors;
  }
}

function concat(authors: Author[]): Author[] {
  const uniqueMap = new Map<string, Author>();

  for (const author of authors) {
    if (!author.name) {
      continue;
    }

    const existing = uniqueMap.get(author.name);
    if (!existing) {
      uniqueMap.set(author.name, author);
      continue;
    }

    author.mapByNameAliases
      ?.filter((alias) => !existing.mapByNameAliases?.includes(alias))
      .forEach((alias) => existing.mapByNameAliases?.push(alias));
    author.mapByEmailAliases
      ?.filter((alias) => !existing.mapByEmailAliases?.includes(alias))
      .forEach((alias) => existing.mapByEmailAliases?.push(alias));
  }

  return Array.from(uniqueMap.values());
}

async function getAuthorDetail(custom: CustomAuthor): Promise<Author> {
  const user = await octokit.rest.users.getById({ account_id: custom.id });
  return {
    name: user.data.name || user.data.login,
    links: user.data.html_url,
    avatar: user.data.avatar_url,
    mapByNameAliases: custom.mapByNameAliases.concat(
      getNameAlias(user.data.login, user.data.name),
    ),
    mapByEmailAliases: [getDefaultEmail(user.data.id, user.data.login)],
  };
}

async function fetchContributors(): Promise<Author[]> {
  // 取头像的永久链接，避免默认地址跳转导致无法缓存
  const response = await octokit.rest.repos.listContributors({
    owner: OWNER,
    repo: REPO,
  });

  return response.data.map((author) => ({
    name: author.name || author.login,
    links: author.html_url,
    avatar: author.avatar_url,
    mapByNameAliases: getNameAlias(author.login, author.name),
    mapByEmailAliases:
      author.id && author.login
        ? [getDefaultEmail(author.id, author.login)]
        : [],
  }));
}

function getNameAlias(login?: string, name?: string | null): string[] {
  const result = new Set<string>();

  const add = (str: string) => {
    result.add(str);
    result.add(str.toUpperCase());
    result.add(str.toLowerCase());
    result.add(str.replace(/^[a-z]/, (c) => c.toUpperCase()));
    result.add(str.replaceAll('-', ''));
    result.add(str.replaceAll('-', ' '));
  };

  if (login) add(login);
  if (name) add(name);

  return Array.from(result);
}

function getDefaultEmail(id: number, login: string): string {
  return `${id}+${login}@users.noreply.github.com`;
}

export default await getAuthors();
