<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import bom from '../../data/bom.json';

type Kind = 'buy' | 'tool' | 'optional';

const STORAGE_KEY = 'rm-wiki:bom-checked';

const weeks = bom.weeks;
const kinds = bom.kinds as Record<
  Kind,
  { label: string; icon: string; hint: string }
>;

// 每项的唯一 id，用"周次-名称"拼，改名会丢勾选状态，但比用下标稳
const idOf = (week: number, name: string) => `w${week}:${name}`;

const selectedWeeks = ref<number[]>([]);
const checked = ref<Set<string>>(new Set());
const copied = ref(false);

// localStorage 在 SSG 阶段不存在，挂载后再读。
// 读失败（隐私模式、被禁用）就当没存过，不能让整个组件挂掉。
const ready = ref(false);
onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      checked.value = new Set(JSON.parse(raw) as string[]);
    }
  } catch {
    // 忽略：勾选状态只是便利功能，丢了不影响看清单
  }
  ready.value = true;
});

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked.value]));
  } catch {
    // 同上
  }
}

function toggleItem(id: string) {
  const next = new Set(checked.value);
  next.has(id) ? next.delete(id) : next.add(id);
  checked.value = next;
  persist();
}

function toggleWeek(week: number) {
  const i = selectedWeeks.value.indexOf(week);
  selectedWeeks.value =
    i === -1
      ? [...selectedWeeks.value, week].sort((a, b) => a - b)
      : selectedWeeks.value.filter((w) => w !== week);
}

const noneSelected = computed(() => selectedWeeks.value.length === 0);

// 不选 = 全看。别让空选择变成空白页面。
const visibleWeeks = computed(() =>
  noneSelected.value
    ? weeks
    : weeks.filter((w) => selectedWeeks.value.includes(w.week)),
);

const stats = computed(() => {
  const items = visibleWeeks.value.flatMap((w) =>
    w.items.map((it) => idOf(w.week, it.name)),
  );
  const done = items.filter((id) => checked.value.has(id)).length;
  return {
    total: items.length,
    done,
    percent: items.length ? Math.round((done / items.length) * 100) : 0,
  };
});

// 只统计"要买"的，工具和可选项不该算进购物车
const buyCount = computed(
  () =>
    visibleWeeks.value.flatMap((w) => w.items).filter((it) => it.kind === 'buy')
      .length,
);

function buildShoppingList(): string {
  const lines: string[] = [];
  for (const w of visibleWeeks.value) {
    const rows = w.items.filter(
      (it) => it.kind === 'buy' && !checked.value.has(idOf(w.week, it.name)),
    );
    if (!rows.length) continue;
    lines.push(`【第 ${w.week} 周 · ${w.title}】`);
    for (const it of rows) {
      lines.push(it.spec ? `- ${it.name}（${it.spec}）` : `- ${it.name}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim() || '没有待买的东西了。';
}

async function copyList() {
  const text = buildShoppingList();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // 非 HTTPS 或权限被拒时 clipboard 不可用，退回选中文本让用户自己复制
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  copied.value = true;
  setTimeout(() => (copied.value = false), 1800);
}

function reset() {
  checked.value = new Set();
  persist();
}
</script>

<template>
  <div class="bom">
    <!-- 图例：先说清三种颜色是什么意思，再让人看表 -->
    <div class="legend">
      <span
        v-for="(k, key) in kinds"
        :key="key"
        class="legend-item"
        :class="key"
      >
        <span class="dot" />
        <b>{{ k.icon }} {{ k.label }}</b>
        <span class="legend-hint">{{ k.hint }}</span>
      </span>
    </div>

    <!-- 周次筛选 -->
    <div class="filters">
      <span class="filters-label">只看：</span>
      <button
        v-for="w in weeks"
        :key="w.week"
        class="chip"
        :class="{ on: selectedWeeks.includes(w.week) }"
        type="button"
        @click="toggleWeek(w.week)"
      >
        第 {{ w.week }} 周
      </button>
      <button
        v-if="!noneSelected"
        class="chip clear"
        type="button"
        @click="selectedWeeks = []"
      >
        ✕ 全部显示
      </button>
    </div>

    <!-- 进度条 + 动作 -->
    <div class="bar-row">
      <div class="bar-info">
        <template v-if="ready">
          已备齐 <b>{{ stats.done }}</b> / {{ stats.total }} 项
          <span class="muted">· 其中要买的 {{ buyCount }} 项</span>
        </template>
        <template v-else> 共 {{ stats.total }} 项 </template>
      </div>
      <div class="bar-track">
        <div
          class="bar-fill"
          :style="{ width: `${ready ? stats.percent : 0}%` }"
        />
      </div>
      <div class="actions">
        <button class="btn primary" type="button" @click="copyList">
          {{ copied ? '✓ 已复制' : '📋 复制待买清单' }}
        </button>
        <button
          v-if="ready && stats.done"
          class="btn"
          type="button"
          @click="reset"
        >
          清空勾选
        </button>
      </div>
    </div>

    <!-- 清单本体 -->
    <div class="weeks">
      <section v-for="w in visibleWeeks" :key="w.week" class="week">
        <h3 class="week-head">
          <span class="week-no">第 {{ w.week }} 周</span>
          <span class="week-title">{{ w.title }}</span>
          <span class="week-count">{{ w.items.length }} 项</span>
        </h3>

        <ul class="items">
          <li
            v-for="it in w.items"
            :key="it.name"
            class="item"
            :class="[it.kind, { done: checked.has(idOf(w.week, it.name)) }]"
          >
            <label class="item-main">
              <input
                type="checkbox"
                :checked="checked.has(idOf(w.week, it.name))"
                @change="toggleItem(idOf(w.week, it.name))"
              />
              <span class="item-text">
                <span class="item-name">
                  {{ it.name }}
                  <span v-if="it.essential" class="tag essential">必备</span>
                  <span v-if="it.byDesign" class="tag design"
                    >按你的设计定</span
                  >
                </span>
                <span v-if="it.spec" class="item-spec">{{ it.spec }}</span>
              </span>
              <span class="item-kind">{{ kinds[it.kind as Kind].icon }}</span>
            </label>
            <p v-if="it.warning" class="item-warning">⚠️ {{ it.warning }}</p>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.bom {
  margin: 20px 0;
}

/* 图例 */
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  font-size: 13px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-item .dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: none;
}

.legend-item.buy .dot {
  background: var(--vp-c-brand-1);
}
.legend-item.tool .dot {
  background: var(--vp-c-warning-1);
}
.legend-item.optional .dot {
  background: var(--vp-c-text-3);
}

.legend-hint {
  color: var(--vp-c-text-3);
}

/* 筛选 */
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 16px 0 12px;
}

.filters-label {
  font-size: 13px;
  color: var(--vp-c-text-2);
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

.chip.clear {
  border-style: dashed;
}

/* 进度 */
.bar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  margin-bottom: 18px;
}

.bar-info {
  font-size: 14px;
  flex: none;
}

.bar-info b {
  color: var(--vp-c-brand-1);
  font-size: 17px;
}

.muted {
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.bar-track {
  flex: 1 1 140px;
  height: 8px;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--vp-c-brand-1), var(--vp-c-brand-3));
  transition: width 0.3s ease;
}

.actions {
  display: flex;
  gap: 8px;
  flex: none;
}

.btn {
  padding: 5px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.btn.primary {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

/* 清单 */
.week + .week {
  margin-top: 22px;
}

.week-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 0 0 10px;
  padding: 0 0 8px;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 15px;
}

.week-head::before {
  display: none;
}

.week-no {
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 700;
}

.week-title {
  font-weight: 600;
}

.week-count {
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  color: var(--vp-c-text-3);
}

.items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.item {
  border-radius: 8px;
  transition: background 0.15s;
}

.item:hover {
  background: var(--vp-c-bg-soft);
}

.item-main {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  cursor: pointer;
}

.item-main input {
  margin: 3px 0 0;
  flex: none;
  width: 15px;
  height: 15px;
  accent-color: var(--vp-c-brand-1);
  cursor: pointer;
}

.item-text {
  flex: 1;
  min-width: 0;
}

.item-name {
  display: block;
  font-size: 14px;
  line-height: 1.6;
}

.item-spec {
  display: block;
  font-size: 12.5px;
  color: var(--vp-c-text-3);
  line-height: 1.6;
}

.item-kind {
  flex: none;
  font-size: 14px;
  opacity: 0.7;
}

/* 勾掉的项压暗，但不要完全看不见 */
.item.done .item-name,
.item.done .item-spec {
  text-decoration: line-through;
  opacity: 0.45;
}

.item.tool .item-name::after {
  content: '';
}

.tag {
  display: inline-block;
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  vertical-align: 1px;
}

.tag.essential {
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
}

.tag.design {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-3);
  font-weight: 400;
}

.item-warning {
  margin: 0 10px 8px 35px;
  padding: 7px 10px;
  border-radius: 7px;
  background: var(--vp-c-warning-soft);
  color: var(--vp-c-warning-1);
  font-size: 12.5px;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .bar-row {
    flex-direction: column;
    align-items: stretch;
  }

  .bar-track {
    flex: none;
  }

  .actions {
    justify-content: flex-start;
  }

  .legend {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
