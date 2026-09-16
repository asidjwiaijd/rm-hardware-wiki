<script setup lang="ts">
import { withBase } from 'vitepress';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { data, type TrainingWeek } from '../../data/schedule.data';
import LinkCard from './LinkCard.vue';

type WeekState = 'done' | 'current' | 'upcoming';

type DisplayWeek = TrainingWeek & {
  state: WeekState;
  rangeText: string;
  /** 0~100，仅当周有值 */
  progress?: number;
  daysRemaining?: number;
};

const weeks = data.weeks;

// SSG 阶段不能算"今天"，否则构建产物会被冻结在构建那天。
// 先渲染静态列表，挂载后再补时间相关的状态。
const ready = ref(false);
const today = ref('');

let dayTimer: ReturnType<typeof setInterval> | undefined;

function shanghaiDateKey(at = new Date()): string {
  // en-CA 的 short 格式就是 YYYY-MM-DD，正好能和 schedule.json 直接比字符串
  return at.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

function daysBetween(from: string, to: string): number {
  const ms =
    Date.parse(`${to}T00:00:00+08:00`) - Date.parse(`${from}T00:00:00+08:00`);
  return Math.round(ms / 86400000);
}

function formatRange(start: string, end: string): string {
  const fmt = (d: string) => {
    const [, m, day] = d.split('-');
    return `${Number(m)}月${Number(day)}日`;
  };
  return `${fmt(start)} - ${fmt(end)}`;
}

const displayWeeks = computed<DisplayWeek[]>(() =>
  weeks.map((week) => {
    const base = { ...week, rangeText: formatRange(week.start, week.end) };

    if (!ready.value || !today.value) {
      return { ...base, state: 'upcoming' as const };
    }

    if (today.value > week.end) {
      return { ...base, state: 'done' as const };
    }

    if (today.value < week.start) {
      return { ...base, state: 'upcoming' as const };
    }

    const total = daysBetween(week.start, week.end) + 1;
    const elapsed = daysBetween(week.start, today.value) + 1;

    return {
      ...base,
      state: 'current' as const,
      progress: Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))),
      daysRemaining: daysBetween(today.value, week.end),
    };
  }),
);

const currentWeek = computed(() =>
  displayWeeks.value.find((w) => w.state === 'current'),
);

const nextWeek = computed(() =>
  displayWeeks.value.find((w) => w.state === 'upcoming'),
);

// 培训还没开始 / 已经全部结束时的兜底文案
const phase = computed<'before' | 'during' | 'after'>(() => {
  if (!ready.value) return 'during';
  if (currentWeek.value) return 'during';
  return nextWeek.value ? 'before' : 'after';
});

onMounted(() => {
  today.value = shanghaiDateKey();
  ready.value = true;

  // 每 10 分钟对一次日期，跨零点时自动换周，长期开着页面也不会停在昨天
  dayTimer = setInterval(() => {
    const key = shanghaiDateKey();
    if (key !== today.value) {
      today.value = key;
    }
  }, 600000);
});

onUnmounted(() => {
  if (dayTimer) clearInterval(dayTimer);
});
</script>

<template>
  <div class="week-progress">
    <section class="focus" :class="phase">
      <template v-if="phase === 'during' && currentWeek">
        <div class="focus-head">
          <span class="chip now">进行中</span>
          <span class="chip"
            >第 {{ currentWeek.week }} 周 · {{ currentWeek.rangeText }}</span
          >
          <span v-if="currentWeek.lectures?.length" class="chip ghost">
            {{ currentWeek.lectures.join('、') }}
          </span>
        </div>

        <h3 class="focus-title">{{ currentWeek.title }}</h3>
        <p class="focus-desc">{{ currentWeek.focus }}</p>

        <div
          class="bar"
          role="progressbar"
          :aria-valuenow="currentWeek.progress"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            class="bar-fill"
            :style="{ width: `${currentWeek.progress}%` }"
          />
        </div>
        <div class="bar-meta">
          <span>本周已过 {{ currentWeek.progress }}%</span>
          <span v-if="currentWeek.daysRemaining === 0">今天是本周最后一天</span>
          <span v-else>还剩 {{ currentWeek.daysRemaining }} 天</span>
        </div>

        <ul class="highlights">
          <li v-for="item in currentWeek.highlights" :key="item">{{ item }}</li>
        </ul>

        <a class="focus-link" :href="withBase(currentWeek.href)"
          >查看本周详细任务 →</a
        >
      </template>

      <template v-else-if="phase === 'before' && nextWeek">
        <div class="focus-head"><span class="chip">尚未开始</span></div>
        <h3 class="focus-title">{{ nextWeek.title }}</h3>
        <p class="focus-desc">
          第 {{ nextWeek.week }} 周将于
          {{ nextWeek.rangeText }} 开始。可以先把环境装好。
        </p>
        <a class="focus-link" :href="withBase('/environment/')">先去配环境 →</a>
      </template>

      <template v-else-if="phase === 'after'">
        <div class="focus-head"><span class="chip">已结束</span></div>
        <h3 class="focus-title">第一个月培训已全部结束</h3>
        <p class="focus-desc">
          往下的周表仍可查阅。新一季的安排由硬件组更新
          <code>docs/.vitepress/data/schedule.json</code>。
        </p>
      </template>
    </section>

    <div class="grid">
      <LinkCard
        v-for="week in displayWeeks"
        :key="week.week"
        :href="week.href"
        :title="`第 ${week.week} 周 · ${week.title}`"
        :subtitle="week.rangeText"
      >
        <template #title-suffix>
          <span class="state" :class="week.state">
            {{
              week.state === 'done'
                ? '已结束'
                : week.state === 'current'
                  ? '进行中'
                  : '未开始'
            }}
          </span>
        </template>
        {{ week.focus }}
        <template #footer>
          {{ week.highlights.slice(0, 2).join(' · ') }}
        </template>
      </LinkCard>
    </div>
  </div>
</template>

<style scoped>
.week-progress {
  margin: 20px 0 8px;
}

.focus {
  padding: 20px 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.focus.during {
  border-color: var(--vp-c-brand-1);
}

.focus-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.chip {
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.chip.now {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.chip.ghost {
  background: transparent;
  border: 1px dashed var(--vp-c-divider);
}

.focus-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
  border: none;
  padding: 0;
}

.focus-desc {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.bar {
  height: 6px;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--vp-c-brand-1);
  transition: width 0.4s ease;
}

.bar-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.highlights {
  margin: 14px 0 0;
  padding-left: 20px;
  font-size: 14px;
  line-height: 1.9;
  color: var(--vp-c-text-2);
}

.focus-link {
  display: inline-block;
  margin-top: 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.focus-link:hover {
  text-decoration: underline;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.state {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.state.done {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-3);
}

.state.current {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.state.upcoming {
  background: var(--vp-c-warning-soft);
  color: var(--vp-c-warning-1);
}

@media (max-width: 640px) {
  .focus {
    padding: 16px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
