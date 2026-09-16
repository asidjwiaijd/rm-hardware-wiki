<script setup lang="ts">
import { computed } from 'vue';
import { data as contributors } from '../../data/contributors.data';
import { data as recentChanges } from '../../data/recentChanges.data';
import LinkCard from './LinkCard.vue';

// git 里的作者名 → GitHub 头像。别名匹配规则和 GitChangelog 保持一致。
const avatarOf = (authorName: string): string | undefined =>
  contributors.find(
    (c) =>
      c.name === authorName ||
      c.mapByNameAliases?.includes(authorName) ||
      c.mapByEmailAliases?.includes(authorName),
  )?.avatar;

const linkOf = (authorName: string): string | undefined => {
  const links = contributors.find((c) => c.name === authorName)?.links;
  return typeof links === 'string' ? links : undefined;
};

function formatDate(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) {
    return iso;
  }
  return at.toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

const items = computed(() =>
  recentChanges.map((change) => ({
    ...change,
    dateText: formatDate(change.updatedAt),
    avatar: avatarOf(change.authorName),
    profile: linkOf(change.authorName),
  })),
);
</script>

<template>
  <div class="recent">
    <p v-if="!items.length" class="empty">
      没有读到 git 历史。本地开发时这是正常的（浅克隆同理）；线上构建用了
      <code>fetch-depth: 0</code>，会正常显示。
    </p>

    <div v-else class="list">
      <LinkCard
        v-for="item in items"
        :key="item.path"
        :href="item.href"
        :title="item.title"
        :subtitle="item.dateText"
      >
        <template #right>
          <a
            v-if="item.profile"
            class="who"
            :href="item.profile"
            target="_blank"
            rel="noreferrer"
            @click.stop
          >
            <img
              v-if="item.avatar"
              :src="item.avatar"
              :alt="item.authorName"
              loading="lazy"
            />
            <span>{{ item.authorName }}</span>
          </a>
          <span v-else class="who">
            <img
              v-if="item.avatar"
              :src="item.avatar"
              :alt="item.authorName"
              loading="lazy"
            />
            <span>{{ item.authorName }}</span>
          </span>
        </template>
        {{ item.excerpt || '（这一页暂时没有可预览的正文）' }}
      </LinkCard>
    </div>
  </div>
</template>

<style scoped>
.recent {
  margin: 18px 0;
}

.list {
  display: grid;
  gap: 10px;
}

.who {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  font-size: 12px;
  color: var(--vp-c-text-3);
  text-decoration: none;
}

.who img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.empty {
  padding: 16px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 10px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}
</style>
