---
order: 4
title: 环境配置
level: 入门
---

# 环境配置

硬件组要装的软件比想象中多。这里按用途分成四类，==第一周先把「生产工具」和「开发环境」装好==，其余可以边用边补。

原始版本由 **谢忠宝** 于 2026-08-31 编写，本站在其基础上拆分和补充。

## 装什么

<LinkCard href="/environment/eda" title="PCB 设计工具" subtitle="第一周必装">
嘉立创 EDA 专业版、嘉立创下单助手。画板和打样都靠它。
</LinkCard>

<LinkCard href="/environment/embedded" title="嵌入式工具链" subtitle="第四周前装好">
STM32CubeMX（含 JRE 依赖）、Ozone 调试器。
</LinkCard>

<LinkCard href="/environment/devtools" title="开发环境" subtitle="第一周必装">
VS Code、CMake、MinGW-w64、Git。
</LinkCard>

<LinkCard href="/environment/simulation" title="电路仿真" subtitle="可选">
Multisim。第二周的运放仿真会用到，也可以用其他仿真工具替代。
</LinkCard>

## 按周次的最低要求

| 周次    | 至少要装好                                                     |
| ------- | -------------------------------------------------------------- |
| 第 1 周 | 嘉立创 EDA、C 语言编译环境（MinGW-w64 或等价物）、VS Code、Git |
| 第 2 周 | 仿真工具（Multisim 或替代品）、嘉立创下单助手                  |
| 第 3 周 | 无新增，但要备齐芯片数据手册                                   |
| 第 4 周 | STM32CubeMX、JRE、VS Code 的嵌入式插件、CMake                  |
| 第 5 周 | 无新增                                                         |
| 第 6 周 | 串口调试助手                                                   |

:::tip
装不上先问，不要自己耗一整天。==大部分安装问题别人已经踩过==。
:::
