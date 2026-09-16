<script setup lang="ts">
import { useData } from 'vitepress';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const { frontmatter } = useData();

const displayedText = ref('');
const hasTexts = computed(
  () =>
    Array.isArray(frontmatter.value.hero?.texts) &&
    frontmatter.value.hero.texts.length > 0,
);
const fallbackText = computed<string>(() => frontmatter.value.hero?.text ?? '');

let stopped = false;
let timer: ReturnType<typeof setTimeout> | undefined;

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const wait = (ms: number) =>
  new Promise<void>((done) => {
    timer = setTimeout(done, ms);
  });

// 逐字打出、停顿、再逐字删掉，循环播放 hero.texts
async function typewriter(texts: string[]) {
  let queue = shuffle(texts);
  let index = 0;

  while (!stopped) {
    const text = queue[index];

    for (let i = 1; i <= text.length && !stopped; i += 1) {
      displayedText.value = text.slice(0, i);
      await wait(90);
    }

    await wait(2200);

    for (let i = text.length - 1; i >= 0 && !stopped; i -= 1) {
      displayedText.value = text.slice(0, i);
      await wait(45);
    }

    await wait(300);

    index += 1;
    if (index >= queue.length) {
      queue = shuffle(texts);
      index = 0;
    }
  }
}

onMounted(() => {
  if (!hasTexts.value) {
    displayedText.value = fallbackText.value;
    return;
  }

  // prefers-reduced-motion 下不做动画，直接显示第一条
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    displayedText.value = frontmatter.value.hero.texts[0];
    return;
  }

  void typewriter(frontmatter.value.hero.texts as string[]);
});

onBeforeUnmount(() => {
  stopped = true;
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <h1 class="name">
    <span class="clip">{{ frontmatter.hero?.name }}</span>
  </h1>

  <p v-if="hasTexts || fallbackText" class="text">
    {{ displayedText }}<span class="caret" aria-hidden="true">|</span>
  </p>

  <p v-if="frontmatter.hero?.tagline" class="tagline">
    {{ frontmatter.hero.tagline }}
  </p>
</template>

<style scoped>
.name,
.text {
  width: 100%;
  max-width: 392px;
  letter-spacing: -0.4px;
  line-height: 1.2;
  font-size: 32px;
  font-weight: 700;
  white-space: pre-wrap;
}

.text {
  min-height: 1.2em;
}

.clip {
  background: -webkit-linear-gradient(
    120deg,
    var(--vp-c-brand-1) 30%,
    var(--vp-c-brand-3)
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.caret {
  margin-left: 2px;
  font-weight: 400;
  color: var(--vp-c-brand-1);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .caret {
    animation: none;
  }
}

.tagline {
  padding-top: 8px;
  max-width: 392px;
  line-height: 1.6;
  font-size: 16px;
  font-weight: 500;
  white-space: pre-wrap;
  color: var(--vp-c-text-2);
}

@media (min-width: 640px) {
  .name,
  .text {
    max-width: 576px;
    line-height: 1.25;
    font-size: 48px;
  }

  .tagline {
    padding-top: 12px;
    max-width: 576px;
    line-height: 1.6;
    font-size: 18px;
  }
}

@media (min-width: 960px) {
  .name,
  .text {
    line-height: 1.15;
    font-size: 56px;
  }
}
</style>
