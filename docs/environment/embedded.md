---
order: 42
title: 嵌入式工具链
level: 入门
---

# 嵌入式工具链

## STM32CubeMX

[STM32CubeMX 官方页（意法半导体）](https://www.st.com.cn/zh/development-tools/stm32cubemx.html)

图形化配置工具，可简化 STM32 产品的配置，并通过分步引导生成初始化代码。

使用流程大致是：

1. 选择一款符合所需外设集的 STM32 微控制器（MCU）、微处理器（MPU）或开发平台，也可以直接选一个在特定开发平台上运行的示例
2. 交互式地配置 GPIO、设置系统时钟树，并为应用选择和配置所需的外设及中间件
3. 生成初始化代码

::: info 为什么 RM 队伍都用 STM32
RM 绝大多数队伍的嵌入式环境基于 STM32：

- **RoboMaster 开发板 C 型**（俗称 C 板）→ STM32F407IGH6
- **达妙 MC02 H7 开发板** → STM32H723VGT6

培训期间用的 STM32F103C8T6 比它们简单得多，但概念是相通的。
:::

### Java Runtime Environment（JRE）

STM32CubeMX ==需要 Java 运行时环境==，装之前先把 JRE 装上。

如果已经装了 JDK（Java Development Kit），那么 JDK 里已经包含 JRE，不必单独下载。

- [JRE 8 下载](https://www.java.com/en/download/manual.jsp)
- [JDK 下载（Oracle 中国）](https://www.oracle.com/cn/java/technologies/downloads/)

:::warning
这是新人装 CubeMX 最常卡住的地方：装完双击没反应、或者报一个看不懂的错，==八成是 JRE 没装==。
:::

## Ozone

[SEGGER 下载页（J-Link / J-Trace）](https://www.segger.cn/downloads/jlink/#Ozone)

SEGGER 公司发布的嵌入式调试器和性能分析器，一般搭配 SEGGER J-Link 使用。

- 适用于 Arm 和 RISC-V 嵌入式应用的全功能图形调试器
- 支持大多数工具链和 IDE 的 C、C++ 和 Rust 源代码级调试
- 集成性能分析工具，包括指令追踪、代码分析和代码覆盖

:::info
培训前期用不到 Ozone，用 ST-Link + VS Code 的 Cortex-Debug 插件就够。等到调复杂问题、需要看指令追踪时再装。
:::
