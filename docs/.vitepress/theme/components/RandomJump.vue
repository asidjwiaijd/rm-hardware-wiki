<script setup lang="ts">
import { useRouter, withBase } from 'vitepress';
import { onMounted, ref } from 'vue';
import { data } from '../../data/links.data';

const target = ref<{ href: string; text: string } | null>(null);

onMounted(() => {
  if (!data.length) {
    return;
  }

  // 在挂载后才抽签，避免 SSG 把某一篇固化进静态产物
  const pick = data[Math.floor(Math.random() * data.length)];
  target.value = pick;
  useRouter().go(withBase(pick.href));
});
</script>

<template>
  <div class="random-jump">
    <div class="spinner" aria-hidden="true" />
    <p class="text">
      <template v-if="target">正在前往《{{ target.text }}》……</template>
      <template v-else>正在抽一篇文档……</template>
    </p>
  </div>
</template>

<style scoped>
.random-jump {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 60px 0;
}

.spinner {
  width: 34px;
  height: 34px;
  border: 3px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.text {
  font-size: 14px;
  color: var(--vp-c-text-2);
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation-duration: 3s;
  }
}
</style>
