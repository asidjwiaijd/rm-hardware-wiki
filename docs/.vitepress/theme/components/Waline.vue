<script setup lang="ts">
import { Waline } from '@waline/client/component';
import { useData, useRoute } from 'vitepress';
import { computed } from 'vue';

// 自建 Waline 服务端地址。部署方式见 https://waline.js.org/guide/get-started/
// 没配好之前留空，组件会自动不渲染，不会在页面上留下报错的空壳。
const serverURL = '';

const route = useRoute();
const { frontmatter } = useData();

const path = computed(() => route.path);
const enabled = computed(
  () => !!serverURL && frontmatter.value.comment !== false,
);
</script>

<template>
  <Waline
    v-if="enabled"
    class="waline-container"
    :serverURL="serverURL"
    :path="path"
    :emoji="[]"
    dark="html.dark"
    :pageSize="10"
    :wordLimit="[1, 1000]"
    noRss
    noCopyright
  />
</template>

<style scoped>
.waline-container {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
}
</style>
