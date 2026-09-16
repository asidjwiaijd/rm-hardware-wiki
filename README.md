<img src="docs/public/logo.svg" width="96" align="right" alt="RM 硬件组" />

# RM 苍穹战队硬件组 Wiki

硬件组招新培训与知识库。基于 VitePress 构建，部署在 GitHub Pages。

> [!warning]
> 这**不是**战队或学校的官方文档。内容由队员维护，涉及器件参数、安全规范和考核安排的部分请以最新通知和数据手册为准。

## 内容

- **六周培训计划** —— 2027 秋季招新第一个月的任务、顺序、提交物和物料清单
- **环境配置指引** —— 嘉立创 EDA、STM32CubeMX、VS Code、CMake、MinGW-w64 等
- **资源与清单** —— 视频入口、六周物料总表、外部资料

## 本地开发

需要 Node.js 20+ 和 pnpm。

```sh
pnpm install
pnpm dev       # 开发服务器
pnpm build     # 构建，产物在 docs/.vitepress/dist
pnpm preview   # 预览构建产物
pnpm format    # 格式化 md / ts / vue
```

## 目录结构

```
docs/
  index.md                    首页
  intro.md  schedule.md       入口页
  training/                   六周培训计划
  environment/                环境配置
  resources/                  视频、物料、外链
  about/                      关于与参与方式
  .vitepress/
    config.ts                 站点总装配
    sidebar.ts                侧边栏自动生成 + 后处理
    i18n/locales.ts           全站中文文案
    data/*.data.ts            构建期数据加载器
    data/schedule.json        周计划数据（改这里更新"本周进度"）
    helpers/                  构建期工具
    plugins/                  自写 markdown-it 插件
    theme/                    自定义主题
.agents/skills/               文档写作规范（供 AI 辅助写作时读取）
```

## 怎么加内容

**新建一个 md 文件 = 侧边栏自动出现一个条目**，不需要改配置。

frontmatter 支持 `order`（排序）、`title`、`level`（难度徽标）、`exclude`、`comment`。
详见[参与编写](https://asidjwiaijd.github.io/rm-hardware-wiki/about/contribute)。

## 部署

推到 `main` 且改动落在 `docs/**` 时，GitHub Actions 自动构建并发布到 GitHub Pages。

首次部署前需要在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。

若换成 `<user>.github.io` 这类用户页仓库，把 `docs/.vitepress/config.ts` 顶部的 `BASE` 改成 `'/'`。

## 许可

除特别声明外，内容以 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh) 发布。
