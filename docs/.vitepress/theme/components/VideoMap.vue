<script setup lang="ts">
import { withBase } from 'vitepress';
import { computed, ref } from 'vue';
import videos from '../../data/videos.json';

const lectures = videos.lectures;
const weeks = videos.weeks;

const CN = ['零', '一', '二', '三', '四', '五', '六'];

// hover 到哪一格/哪一行/哪一列，用来做十字高亮
const hoverLecture = ref<number | null>(null);
const hoverWeek = ref<number | null>(null);
const isCovered = (lectureNo: number, week: number) =>
  lectures.find((l) => l.no === lectureNo)?.weeks.includes(week) ?? false;

const isReview = (lectureNo: number, week: number) =>
  (
    lectures.find((l) => l.no === lectureNo) as { reviewWeeks?: number[] }
  )?.reviewWeeks?.includes(week) ?? false;

// 高亮规则：hover 行 → 整行 + 它覆盖的列；hover 列 → 整列 + 覆盖它的行
const litWeeks = computed<Set<number>>(() => {
  if (hoverWeek.value !== null) return new Set([hoverWeek.value]);
  if (hoverLecture.value !== null) {
    return new Set(
      lectures.find((l) => l.no === hoverLecture.value)?.weeks ?? [],
    );
  }
  return new Set();
});

const litLectures = computed<Set<number>>(() => {
  if (hoverLecture.value !== null) return new Set([hoverLecture.value]);
  if (hoverWeek.value !== null) {
    return new Set(
      lectures
        .filter((l) => l.weeks.includes(hoverWeek.value!))
        .map((l) => l.no),
    );
  }
  return new Set();
});

// 每周要看哪几讲，倒过来查
const lecturesOfWeek = (week: number) =>
  lectures.filter((l) => l.weeks.includes(week));

// 组件里的 href 不像 Markdown 链接那样会被自动加 base 前缀，必须自己过 withBase
const weekLink = (week: number) => withBase(`/training/week${week}`);
</script>

<template>
  <div class="vmap">
    <p class="hint">
      鼠标移到<b>某一讲</b>看它覆盖哪几周，移到<b>某一周</b>看这周该看哪几讲。链接就在讲次名下面。
    </p>

    <!-- 矩阵：行 = 讲次，列 = 周次 -->
    <div class="grid-wrap">
      <div class="grid" :style="{ '--cols': weeks.length }">
        <!-- 表头 -->
        <div class="cell corner" />
        <button
          v-for="w in weeks"
          :key="`h${w.week}`"
          type="button"
          class="cell head col-head"
          :class="{ lit: litWeeks.has(w.week) }"
          @mouseenter="hoverWeek = w.week"
          @mouseleave="hoverWeek = null"
          @focus="hoverWeek = w.week"
          @blur="hoverWeek = null"
        >
          <span class="head-no">第 {{ w.week }} 周</span>
          <span class="head-title">{{ w.title }}</span>
        </button>

        <!-- 每一讲一行 -->
        <template v-for="lec in lectures" :key="lec.no">
          <div
            class="cell head row-head"
            :class="{ lit: litLectures.has(lec.no) }"
            @mouseenter="hoverLecture = lec.no"
            @mouseleave="hoverLecture = null"
          >
            <span class="head-no">第{{ CN[lec.no] }}讲</span>
            <span class="head-title">{{ lec.title }}</span>
            <!-- 链接常驻，不藏在点击后面：这是本页最该被搜到的东西 -->
            <a
              :href="lec.url"
              target="_blank"
              rel="noreferrer"
              class="head-link"
              @focus="hoverLecture = lec.no"
              @blur="hoverLecture = null"
              >▶ {{ lec.linkText
              }}<span
                v-if="lec.needsDirectLink"
                class="warn"
                title="还没有直链，只能用 B 站搜索"
                >⚠</span
              ></a
            >
          </div>

          <button
            v-for="w in weeks"
            :key="`${lec.no}-${w.week}`"
            type="button"
            class="cell dot-cell"
            :class="{
              on: isCovered(lec.no, w.week),
              review: isReview(lec.no, w.week),
              lit: litLectures.has(lec.no) || litWeeks.has(w.week),
            }"
            :aria-label="`第${CN[lec.no]}讲 ${isCovered(lec.no, w.week) ? '对应' : '不对应'} 第${w.week}周`"
            @mouseenter="
              hoverLecture = lec.no;
              hoverWeek = w.week;
            "
            @mouseleave="
              hoverLecture = null;
              hoverWeek = null;
            "
          >
            <span v-if="isCovered(lec.no, w.week)" class="dot">
              <span v-if="isReview(lec.no, w.week)" class="dot-label"
                >复习</span
              >
            </span>
          </button>
        </template>
      </div>
    </div>

    <p class="legend">
      <span class="lg"><i class="dot on" /> 首次讲到</span>
      <span class="lg"><i class="dot on review" /> 复习/回顾</span>
    </p>

    <!-- 按周反查。SSR 也会渲染，搜索引擎和 Pagefind 都能读到 -->
    <h3 class="sub">按周次查</h3>
    <ul class="by-week">
      <li
        v-for="w in weeks"
        :key="`bw${w.week}`"
        :class="{ lit: litWeeks.has(w.week) }"
        @mouseenter="hoverWeek = w.week"
        @mouseleave="hoverWeek = null"
      >
        <a :href="weekLink(w.week)" class="wk-link">第 {{ w.week }} 周</a>
        <span class="arrow">→</span>
        <span
          v-for="lec in lecturesOfWeek(w.week)"
          :key="lec.no"
          class="lec-tag"
          :class="{ review: isReview(lec.no, w.week) }"
        >
          第{{ CN[lec.no] }}讲{{ isReview(lec.no, w.week) ? '（复习）' : '' }}
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.vmap {
  margin: 20px 0;
}

.hint {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

/* 窄屏横向滚动，不要把格子压扁到看不清 */
.grid-wrap {
  overflow-x: auto;
  padding-bottom: 4px;
}

.grid {
  display: grid;
  grid-template-columns: minmax(150px, 1.6fr) repeat(
      var(--cols),
      minmax(76px, 1fr)
    );
  gap: 3px;
  min-width: 620px;
}

.cell {
  border: 0;
  background: transparent;
  padding: 0;
  font: inherit;
  color: inherit;
}

.head {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding: 7px 9px;
  border-radius: 7px;
  background: var(--vp-c-bg-soft);
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}

.col-head {
  align-items: center;
  text-align: center;
}

.head-no {
  font-size: 12.5px;
  font-weight: 700;
}

.head-title {
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--vp-c-text-3);
}

.head.lit {
  background: var(--vp-c-brand-soft);
}

.head.lit .head-no {
  color: var(--vp-c-brand-1);
}

.head-link {
  margin-top: 3px;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.5;
  word-break: break-all;
}

.warn {
  margin-left: 3px;
  color: var(--vp-c-warning-1);
  cursor: help;
}

/* 按周反查 */
.sub {
  margin: 26px 0 10px;
  font-size: 15px;
}

.sub::before {
  display: none;
}

.by-week {
  list-style: none;
  padding: 0;
  margin: 0;
}

.by-week li {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 7px;
  transition: background 0.15s;
}

.by-week li.lit {
  background: var(--vp-c-brand-soft);
}

.wk-link {
  font-weight: 600;
  font-size: 13.5px;
  flex: none;
  min-width: 62px;
}

.arrow {
  color: var(--vp-c-text-3);
}

.lec-tag {
  padding: 2px 9px;
  border-radius: 5px;
  background: var(--vp-c-default-soft);
  font-size: 12.5px;
}

.lec-tag.review {
  background: transparent;
  border: 1px dashed var(--vp-c-divider);
  color: var(--vp-c-text-3);
}

@media (max-width: 640px) {
  .legend {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
