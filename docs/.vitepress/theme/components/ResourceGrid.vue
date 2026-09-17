<script setup lang="ts">
import { computed, ref } from 'vue';
import links from '../../data/links.json';

const categories = links.categories;

const activeCat = ref<string>('');
const query = ref('');

// 所有 tag 去重，按出现次数排，常用的排前面
const allTags = computed(() => {
  const count = new Map<string, number>();
  for (const c of categories) {
    for (const it of c.items) {
      for (const t of it.tags) count.set(t, (count.get(t) ?? 0) + 1);
    }
  }
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t]) => t);
});

const activeTag = ref('');

const matches = (item: { name: string; purpose: string; tags: string[] }) => {
  const q = query.value.trim().toLowerCase();
  if (
    q &&
    ![item.name, item.purpose, ...item.tags].join(' ').toLowerCase().includes(q)
  ) {
    return false;
  }
  return !activeTag.value || item.tags.includes(activeTag.value);
};

const visible = computed(() =>
  categories
    .filter((c) => !activeCat.value || c.id === activeCat.value)
    .map((c) => ({ ...c, items: c.items.filter(matches) }))
    .filter((c) => c.items.length > 0),
);

const total = computed(() =>
  visible.value.reduce((n, c) => n + c.items.length, 0),
);
const hasFilter = computed(
  () => !!(activeCat.value || activeTag.value || query.value),
);

function reset() {
  activeCat.value = '';
  activeTag.value = '';
  query.value = '';
}

// 从 URL 里取域名，当作来源标识显示
function hostOf(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/^www\./, '');
}
</script>

<template>
  <div class="rg">
    <!-- 搜索 + 分类 -->
    <div class="toolbar">
      <input
        v-model="query"
        class="search"
        type="search"
        placeholder="搜资源名、用途或标签…"
      />
      <div class="cats">
        <button
          class="chip"
          :class="{ on: !activeCat }"
          type="button"
          @click="activeCat = ''"
        >
          全部
        </button>
        <button
          v-for="c in categories"
          :key="c.id"
          class="chip"
          :class="{ on: activeCat === c.id }"
          type="button"
          @click="activeCat = activeCat === c.id ? '' : c.id"
        >
          {{ c.icon }} {{ c.name }}
        </button>
      </div>
    </div>

    <!-- 标签 -->
    <div class="tags">
      <span class="tags-label">标签：</span>
      <button
        v-for="t in allTags"
        :key="t"
        class="tag"
        :class="{ on: activeTag === t }"
        type="button"
        @click="activeTag = activeTag === t ? '' : t"
      >
        {{ t }}
      </button>
      <button v-if="hasFilter" class="tag clear" type="button" @click="reset">
        ✕ 清空筛选
      </button>
    </div>

    <p class="count">
      共 <b>{{ total }}</b> 条<span v-if="hasFilter">（已筛选）</span>
    </p>

    <!-- 卡片 -->
    <div v-for="c in visible" :key="c.id" class="group">
      <h3 class="group-head">{{ c.icon }} {{ c.name }}</h3>
      <div class="cards">
        <a
          v-for="it in c.items"
          :key="it.url"
          :href="it.url"
          target="_blank"
          rel="noreferrer"
          class="card"
        >
          <span class="card-name">{{ it.name }}</span>
          <span class="card-purpose">{{ it.purpose }}</span>
          <span class="card-foot">
            <span class="host">{{ hostOf(it.url) }}</span>
            <span class="card-tags">
              <span v-for="t in it.tags" :key="t" class="mini-tag">{{
                t
              }}</span>
            </span>
          </span>
        </a>
      </div>
    </div>

    <p v-if="!total" class="empty">
      没有匹配的资源。<a href="#" @click.prevent="reset">清空筛选</a>
    </p>
  </div>
</template>

<style scoped>
.rg {
  margin: 20px 0;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.search {
  flex: 1 1 200px;
  min-width: 0;
  padding: 7px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
}

.search:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.chip:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.chip.on {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: #fff;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 12px 0 0;
}

.tags-label {
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}

.tag {
  padding: 2px 9px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
  cursor: pointer;
}

.tag:hover {
  color: var(--vp-c-brand-1);
}

.tag.on {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.tag.clear {
  background: transparent;
  border: 1px dashed var(--vp-c-divider);
  color: var(--vp-c-text-3);
}

.count {
  margin: 12px 0 0;
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}

.count b {
  color: var(--vp-c-brand-1);
}

.group {
  margin-top: 20px;
}

.group-head {
  margin: 0 0 10px;
  font-size: 15px;
}

.group-head::before {
  display: none;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 10px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  text-decoration: none;
  color: inherit;
  transition:
    border-color 0.15s,
    transform 0.15s;
}

.card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  line-height: 1.5;
}

.card-purpose {
  font-size: 12.5px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  flex: 1;
}

.card-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 3px;
}

.host {
  font-size: 11px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-left: auto;
}

.mini-tag {
  padding: 0 6px;
  border-radius: 4px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-3);
  font-size: 10.5px;
  line-height: 1.7;
}

.empty {
  margin-top: 24px;
  text-align: center;
  color: var(--vp-c-text-3);
  font-size: 14px;
}

/* VitePress 给外链自动加的小图标在卡片里是噪音 */
.card :deep(.vp-external-link-icon) {
  display: none;
}
</style>
