#!/usr/bin/env bash
#
# RM 硬件组 Wiki · 自托管部署脚本（正本，纳入版本控制）
#
#   ./deploy.sh          有新提交才重建（cron 用这个）
#   ./deploy.sh --force  无论如何都重建
#
# 流程：git pull → 装依赖 → 构建 → rsync 到 www → 容器直接读新文件
# 容器挂的是 www 目录本身，rsync 完成即生效，不需要重启。
#
# 【这个文件与它部署的仓库在同一个 checkout 里】—— 脚本执行期间那次
# `git merge --ff-only` 可能把脚本自身换掉，而 bash 是按字节偏移惰性读取
# 脚本文件的，读到自己被改写的位置就会执行出错乱内容。
# 所以线上入口是 srv/deploy.sh（包装器）：它先把本文件拷到临时文件再 exec，
# 拉取就不会伤到正在运行的副本。改完这里记得让包装器指过来（它走仓库路径，
# 拉到新版本即自动生效）。
#
# 运行时依赖：nvm 提供的 node/pnpm、~/.local/bin/gh（用于取 GITHUB_TOKEN）。
# cron 不读 ~/.bashrc，PATH 只有 /usr/bin:/bin，两个都不在里面，脚本里已显式补。

set -euo pipefail

REPO_DIR=/mnt/data/rm_hardware/hardtrain
SRV_DIR=/mnt/data/rm_hardware/srv
WWW_DIR="$SRV_DIR/www"
STAGE_DIR="$SRV_DIR/.stage"
LOCK_FILE="$SRV_DIR/.deploy.lock"
STAMP_FILE="$SRV_DIR/.deployed-sha"

CONTAINER=rm-wiki
PORT=18086
export SITE_BASE=/
export SITE_ORIGIN="http://192.168.8.244:${PORT}"

FORCE=0
[[ "${1:-}" == "--force" ]] && FORCE=1

log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*"; }

# 防止 cron 与手动执行叠在一起
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "已有部署在运行，跳过"
  exit 0
fi

cd "$REPO_DIR"

# ---- 工具链解析 ---------------------------------------------------------
# cron 不读 ~/.bashrc，PATH 只有 /usr/bin:/bin，于是会踩两个坑：
#   1. pnpm 由 nvm 管理（~/.nvm/versions/node/<ver>/bin），根本不在 PATH 里
#   2. /usr/bin/node 是另一个更老的系统 node（v18），会被优先选中
# 所以必须显式把 nvm 的 bin 目录放到 PATH 最前面。
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

resolve_toolchain() {
  # 优先走 nvm 自己的解析，它会尊重 default 别名
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    set +u
    # shellcheck disable=SC1091
    . "$NVM_DIR/nvm.sh" >/dev/null 2>&1 || true
    set -u
  fi
  command -v pnpm >/dev/null 2>&1 && return 0

  # 兜底：直接挑版本号最大、且带 pnpm 的 node 目录
  local d
  for d in $(ls -d "$NVM_DIR"/versions/node/*/bin 2>/dev/null | sort -Vr); do
    if [[ -x "$d/pnpm" ]]; then
      export PATH="$d:$PATH"
      return 0
    fi
  done
  return 1
}

if ! resolve_toolchain; then
  log "错误：找不到 pnpm。需要 nvm 装在 $NVM_DIR 且已 corepack 启用 pnpm。"
  exit 1
fi

log "工具链 node=$(node -v) pnpm=$(pnpm -v) ($(command -v pnpm))"

# ---- GitHub API token ---------------------------------------------------
# 构建时 contributors.ts 会调 GitHub API 拉贡献者头像。匿名额度只有 60 次/小时，
# 用光之后 octokit 打包的限流插件**不会抛错，而是静静等到额度重置**（最长一小时）。
# 构建就此挂死，而且它一直占着上面的 flock，后面每一轮 cron 全被跳过。
# Actions 那边传的是 github.token，这里复用 gh 的登录态，等价。
export PATH="$HOME/.local/bin:$PATH"   # gh 装在这里，cron 的 PATH 里没有

if [[ -z "${GITHUB_TOKEN:-}" ]] && command -v gh >/dev/null 2>&1; then
  GITHUB_TOKEN=$(gh auth token 2>/dev/null || true)
fi

if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  export GITHUB_TOKEN
  log "GitHub token 已加载（贡献者 API 额度 5000/h）"
else
  log "警告：未取到 GITHUB_TOKEN，贡献者 API 走匿名额度（60/h）"
fi

log "拉取 origin/main"
git fetch --quiet origin main
LOCAL_SHA=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse origin/main)
DEPLOYED_SHA=$(cat "$STAMP_FILE" 2>/dev/null || echo '')

if [[ $FORCE -eq 0 && "$REMOTE_SHA" == "$DEPLOYED_SHA" && -f "$WWW_DIR/index.html" ]]; then
  log "已是最新 (${REMOTE_SHA:0:7})，无需重建"
  exit 0
fi

if [[ "$LOCAL_SHA" != "$REMOTE_SHA" ]]; then
  # 本地有未提交改动时不要硬来，宁可失败也不丢东西
  if ! git diff --quiet || ! git diff --cached --quiet; then
    log "错误：工作区有未提交改动，拒绝自动 pull。先处理干净再跑。"
    exit 1
  fi
  log "更新 ${LOCAL_SHA:0:7} → ${REMOTE_SHA:0:7}"
  git merge --ff-only origin/main
fi

log "安装依赖"
pnpm install --frozen-lockfile --silent

log "构建 (SITE_BASE=$SITE_BASE SITE_ORIGIN=$SITE_ORIGIN)"
rm -rf "$STAGE_DIR"
pnpm run build >/dev/null

DIST="$REPO_DIR/docs/.vitepress/dist"
[[ -f "$DIST/index.html" ]] || { log "错误：构建产物缺少 index.html，中止发布"; exit 1; }

log "发布到 $WWW_DIR"
mkdir -p "$WWW_DIR"
# 先落到暂存目录再整体同步，避免构建中途被访问到半成品
cp -a "$DIST" "$STAGE_DIR"
rsync -a --delete "$STAGE_DIR/" "$WWW_DIR/"
rm -rf "$STAGE_DIR"

# 容器不在就拉起来（首次部署 / 机器重启后 docker 未自动恢复时）
if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  log "启动容器 $CONTAINER"
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  docker run -d \
    --name "$CONTAINER" \
    --restart unless-stopped \
    -p "${PORT}:80" \
    -v "$WWW_DIR:/usr/share/nginx/html:ro" \
    -v "$SRV_DIR/conf/default.conf:/etc/nginx/conf.d/default.conf:ro" \
    nginx:alpine >/dev/null
else
  # 配置可能改过，reload 一下；失败不影响已发布的内容
  docker exec "$CONTAINER" nginx -s reload >/dev/null 2>&1 || true
fi

echo "$REMOTE_SHA" > "$STAMP_FILE"

CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/" || echo 000)
log "完成 ${REMOTE_SHA:0:7} · 首页 HTTP $CODE · $(find "$WWW_DIR" -name '*.html' | wc -l) 个页面"
[[ "$CODE" == "200" ]] || { log "警告：首页未返回 200"; exit 1; }
