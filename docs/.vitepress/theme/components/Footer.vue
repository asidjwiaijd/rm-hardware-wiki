<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';

const REPO = 'https://github.com/asidjwiaijd/rm-hardware-wiki';
const { frontmatter } = useData();

// 首页自带大段留白，页脚只在文档页显示
const isHome = computed(() => frontmatter.value.layout === 'home');
const year = new Date().getFullYear();
</script>

<template>
  <footer v-if="!isHome" class="site-footer">
    <p class="line">
      RM 苍穹战队硬件组 · 培训 Wiki ·
      <a :href="REPO" target="_blank" rel="noreferrer">GitHub</a>
    </p>
    <p class="line dim">
      内容由队员共同维护，不代表战队或学校官方立场；器件选型与安全规范请以最新通知和数据手册为准。
    </p>
    <p class="line dim">
      © {{ year }} · 除特别声明外，内容以
      <a
        href="https://creativecommons.org/licenses/by-sa/4.0/deed.zh"
        target="_blank"
        rel="noreferrer"
        >CC BY-SA 4.0</a
      >
      发布
    </p>
  </footer>
</template>

<style scoped>
.site-footer {
  padding: 28px 24px 36px;
  border-top: 1px solid var(--vp-c-divider);
  text-align: center;
  font-size: 13px;
  line-height: 1.8;
  color: var(--vp-c-text-2);
}

.line {
  margin: 2px 0;
}

.dim {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.site-footer a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.site-footer a:hover {
  text-decoration: underline;
}
</style>
