<script setup lang="ts">
import { withBase } from 'vitepress';
import { computed } from 'vue';

const props = defineProps<{
  /** 省略时渲染成不可点击的纯卡片，用于"页面还没写"的条目 */
  href?: string;
  title?: string;
  subtitle?: string;
}>();

const isExternal = computed(() => !!props.href && /^[a-z]+:/i.test(props.href));

// 站内链接必须过 withBase：组件里的 href 不像 Markdown 链接那样会被自动加 base 前缀
const resolved = computed(() =>
  props.href
    ? isExternal.value
      ? props.href
      : withBase(props.href)
    : undefined,
);
</script>

<template>
  <component
    :is="resolved ? 'a' : 'div'"
    :href="resolved"
    class="link-card"
    :class="{ 'link-card-static': !resolved }"
    :target="isExternal ? '_blank' : undefined"
    :rel="isExternal ? 'noreferrer' : undefined"
  >
    <div
      v-if="title || $slots.icon || $slots['title-suffix']"
      class="card-header"
    >
      <div class="title-group">
        <slot name="icon" />
        <span v-if="title" class="card-title">{{ title }}</span>
        <span v-if="subtitle" class="card-subtitle">{{ subtitle }}</span>
        <slot name="title-suffix" />
      </div>
      <slot name="right" />
    </div>
    <div v-if="$slots.default" class="card-body"><slot /></div>
    <div v-if="$slots.footer" class="card-footer"><slot name="footer" /></div>
  </component>
</template>

<style scoped>
.link-card {
  display: block;
  padding: 14px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  text-decoration: none !important;
  color: inherit;
  transition:
    border-color 0.25s,
    background-color 0.25s,
    transform 0.25s;
}

.link-card:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-elv);
  transform: translateY(-2px);
}

/* 没有 href 的卡片不假装可点 */
.link-card-static {
  cursor: default;
}

.link-card-static:hover {
  border-color: var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  transform: none;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.title-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.card-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--vp-c-text-1);
}

.card-subtitle {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.card-body {
  margin-top: 6px;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.card-footer {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--vp-c-divider);
  font-size: 12px;
  color: var(--vp-c-text-3);
}
</style>
