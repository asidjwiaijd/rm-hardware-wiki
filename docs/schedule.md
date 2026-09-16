---
order: 2
title: 本周该做什么
---

# 本周该做什么

<script setup>
import WeekProgress from './.vitepress/theme/components/WeekProgress.vue'
</script>

<WeekProgress />

:::info 周表怎么改
所有周次、日期和要点都存在 `docs/.vitepress/data/schedule.json`，改完提交即可，页面会自动更新。
文件有 `schedule.schema.json` 约束，字段写错构建会直接失败并指出是哪一条，不会悄悄发上线。
:::
