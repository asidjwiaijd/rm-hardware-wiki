---
order: 43
title: 开发环境
level: 入门
---

# 开发环境

## VS Code

[Visual Studio Code 官网](https://code.visualstudio.com/)

微软开发的免费、开源、轻量级编辑器。最大的特色是高度的自定义能力和扩展性，支持大量编程语言和框架。

::: info 为什么硬件组用 VS Code 而不是 CLion / Keil
硬件组与电控组在 MCU 开发上的区别在于：==硬件组不只开发 STM32 芯片==，其他 MCU 芯片也会涉及，写的语言也不一定是 C/C++。

所以像 CLion、Keil 这类针对单一平台深度优化的 IDE 不能满足硬件组的全面需求。VS Code 作为通用编辑器加上社区扩展，可以适配各个开发平台。
:::

**必装插件：**

| 插件           | 发布者    | 用途                               |
| -------------- | --------- | ---------------------------------- |
| C/C++          | Microsoft | 语法高亮、智能提示、跳转           |
| CMake Tools    | Microsoft | CMake 工程配置与构建               |
| Makefile Tools | Microsoft | 处理 CubeMX 生成的 Makefile 工程   |
| Cortex-Debug   | marus25   | ==STM32 在线调试、看寄存器和变量== |

## CMake

[下载页](https://cmake.org/download/)

开源的跨平台自动化构建系统，用来管理软件构建流程，不依赖特定编译器，支持多层目录、多个应用程序与多个函数库。

:::info
CMake **本身不是构建工具**，而是生成构建系统的工具。它生成的构建系统可以使用不同的编译器和工具链 —— 这正是硬件组需要跨平台开发时最看重的一点。
:::

## MinGW-w64

- 官网：[Pre-built Toolchains](https://www.mingw-w64.org/downloads/#msys2)
- SourceForge 下载：[MinGW-w64 for 32 and 64 bit Windows](https://sourceforge.net/projects/mingw-w64/)

用于 Windows 平台的开发工具集，提供一组 GNU 工具和库，目标是在 Windows 环境下提供类似 Unix/Linux 的开发体验。

硬件组用它在 Windows 上编译原生程序或做交叉编译（如 Arm 嵌入式），以及用 `make` 命令构建 CubeMX 生成的 Makefile 工程。

:::tip
第一周写 `hello world` 时用的就是它。装完记得==把 bin 目录加进 PATH==，否则在终端里敲 `gcc` 会提示找不到命令。
:::

## Arm GNU Toolchain

Arm 发布的 GNU 工具链（称为 **Arm GNU 工具链**），解压后==把 bin 目录加进 PATH==

[下载直链](https://gitlab.arm.com/api/v4/projects/tooling%2Fgnu-toolchains-for-arm/packages/generic/gnu-toolchain/15.3.rel1/arm-gnu-toolchain-15.3.rel1-mingw-w64-i686-arm-none-eabi.zip) ：点击就直接下载压缩包

[Arm GNU Toolchain](https://developer.arm.com/tools-and-software/gnu-toolchain#Downloads) ：官网

## Git

[Git for Windows 安装页](https://git-scm.com/install/windows)

团队协作必备，用于代码和文档的版本管理。

安装时建议选择 `Git from the command line and also from 3rd-party software`，==以便 VS Code 终端直接调用==。

:::info
这个 Wiki 本身也放在 Git 仓库里。学会 Git 之后，看到文档里写错的地方可以直接提 PR 改掉，见[参与编写](/about/contribute)。
:::
