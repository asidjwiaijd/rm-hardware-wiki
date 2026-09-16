<script setup lang="ts">
import { NolebaseHighlightTargetedHeading } from '@nolebase/vitepress-plugin-highlight-targeted-heading/client';
import mediumZoom from 'medium-zoom';
import { useData, useRoute } from 'vitepress';
import { createMermaidRenderer } from 'vitepress-mermaid-renderer';
import DefaultTheme from 'vitepress/theme';
import { nextTick, onBeforeMount, onMounted, provide, ref, watch } from 'vue';
import locales from '../i18n/locales';
import CustomHeroInfo from './components/CustomHeroInfo.vue';
import Footer from './components/Footer.vue';
import Waline from './components/Waline.vue';

const { Layout } = DefaultTheme;
const route = useRoute();
const { isDark } = useData();
const isTransitionsEnabled = ref(false);

// 视图过渡 API 只能在浏览器里探测，SSG 阶段访问 document 会直接报错
onBeforeMount(() => {
  isTransitionsEnabled.value =
    'startViewTransition' in document &&
    window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
});

onMounted(() => {
  document.documentElement.classList.toggle(
    'transitions-enabled',
    isTransitionsEnabled.value,
  );
});

// 主题切换的圆形扩散过渡。连续点击时用自增 id 作废旧回调，避免快照堆叠。
{
  let activeTransition: ViewTransition | null = null;
  let toggleSeq = 0;
  let requestedDark: boolean | null = null;

  provide(
    'toggle-appearance',
    async ({ clientX: x, clientY: y }: MouseEvent) => {
      requestedDark = !(requestedDark ?? isDark.value);
      const targetDark = requestedDark;

      if (!isTransitionsEnabled.value) {
        isDark.value = targetDark;
        return;
      }

      const toggleId = ++toggleSeq;

      const interrupted = activeTransition;
      interrupted?.skipTransition();

      if (interrupted) {
        try {
          // 必须等浏览器清理旧快照树，不能 skipTransition() 后立刻开新过渡
          await interrupted.finished;
        } catch {
          // 旧过渡已被取代，清理失败不影响最新请求
        }

        if (toggleId !== toggleSeq) {
          return;
        }
      }

      const radius = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y),
      );
      const direction = targetDark ? 'to-dark' : 'to-light';
      const root = document.documentElement;

      root.dataset.appearanceTransition = direction;
      root.style.setProperty('--appearance-transition-x', `${x}px`);
      root.style.setProperty('--appearance-transition-y', `${y}px`);
      root.style.setProperty('--appearance-transition-radius', `${radius}px`);

      const clear = () => {
        if (root.dataset.appearanceTransition === direction) {
          delete root.dataset.appearanceTransition;
          root.style.removeProperty('--appearance-transition-x');
          root.style.removeProperty('--appearance-transition-y');
          root.style.removeProperty('--appearance-transition-radius');
        }
      };

      const transition = document.startViewTransition(async () => {
        if (toggleId !== toggleSeq) {
          return;
        }
        isDark.value = targetDark;
        await nextTick();
      });
      activeTransition = transition;

      try {
        await transition.ready;
        if (toggleId !== toggleSeq) {
          transition.skipTransition();
        }
        await transition.finished;
      } catch {
        // skipTransition() 会 reject ready / finished，连点时属预期行为
      } finally {
        if (activeTransition === transition) {
          activeTransition = null;
        }
        clear();
      }
    },
  );
}

// Mermaid：跟随明暗主题重新渲染
{
  const initMermaid = () =>
    createMermaidRenderer({
      theme: isDark.value ? 'dark' : 'base',
    }).setToolbar({
      showLanguageLabel: false,
      i18n: { tooltips: locales.mermaidToolbarText },
    });

  nextTick(initMermaid);
  watch(() => isDark.value, initMermaid);
}

// 正文图片点击放大（原理图、PCB 截图很需要）
{
  const initZoom = () =>
    mediumZoom('main img:not(a *)', { background: 'var(--vp-c-bg)' });

  onMounted(initZoom);
  watch(
    () => route.path,
    () => nextTick(initZoom),
  );
}
</script>

<template>
  <Layout>
    <template #home-hero-info>
      <CustomHeroInfo />
    </template>

    <template #doc-after>
      <Waline />
    </template>

    <template #layout-top>
      <NolebaseHighlightTargetedHeading />
    </template>

    <template #layout-bottom>
      <Footer />
    </template>
  </Layout>
</template>

<style>
@import './styles/index.css';

::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

[data-appearance-transition='to-dark']::view-transition-old(root),
[data-appearance-transition='to-light']::view-transition-new(root) {
  z-index: 9999;
}

[data-appearance-transition='to-dark']::view-transition-old(root) {
  animation: appearance-contract 300ms ease-in both;
}

[data-appearance-transition='to-light']::view-transition-new(root) {
  animation: appearance-expand 300ms ease-in both;
}

[data-appearance-transition='to-dark']::view-transition-new(root),
[data-appearance-transition='to-light']::view-transition-old(root) {
  z-index: 1;
}

@keyframes appearance-contract {
  from {
    clip-path: circle(
      var(--appearance-transition-radius) at var(--appearance-transition-x)
        var(--appearance-transition-y)
    );
  }
  to {
    clip-path: circle(
      0 at var(--appearance-transition-x) var(--appearance-transition-y)
    );
  }
}

@keyframes appearance-expand {
  from {
    clip-path: circle(
      0 at var(--appearance-transition-x) var(--appearance-transition-y)
    );
  }
  to {
    clip-path: circle(
      var(--appearance-transition-radius) at var(--appearance-transition-x)
        var(--appearance-transition-y)
    );
  }
}

.transitions-enabled .VPSwitchAppearance {
  width: 22px !important;
}

.transitions-enabled .VPSwitchAppearance .check {
  transform: none !important;
}
</style>
