<script setup lang="ts">
// 标记还没写完的章节：<ToDo>等硬件组补充电机驱动部分</ToDo>
</script>

<template>
  <div class="todo-block">
    <span class="todo-tag">待补充</span>
    <span class="todo-text"><slot>这一节还没有人写，欢迎提 PR。</slot></span>
  </div>
</template>

<style scoped>
.todo-block {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 16px 0;
  padding: 12px 16px;
  border-left: 3px solid var(--vp-c-warning-1);
  border-radius: 0 8px 8px 0;
  background: var(--vp-c-warning-soft);
  font-size: 14px;
}

.todo-tag {
  flex: none;
  font-weight: 700;
  font-size: 12px;
  color: var(--vp-c-warning-1);
}

.todo-text {
  color: var(--vp-c-text-2);
}
</style>
