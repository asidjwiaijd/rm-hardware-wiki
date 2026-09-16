<script setup lang="ts">
// 行内小标注：<Note>需要验证</Note>
// 长期存在的存疑内容应该改成脚注并补来源，这个标签只做临时占位。
withDefaults(defineProps<{ type?: 'info' | 'warn' }>(), { type: 'warn' });
</script>

<template>
  <span class="inline-note" :class="type"><slot /></span>
</template>

<style scoped>
.inline-note {
  display: inline-block;
  margin: 0 3px;
  padding: 1px 7px;
  border-radius: 5px;
  font-size: 12px;
  line-height: 1.6;
  vertical-align: middle;
  white-space: nowrap;
}

.inline-note.warn {
  background: var(--vp-c-warning-soft);
  color: var(--vp-c-warning-1);
}

.inline-note.info {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}
</style>
