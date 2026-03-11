# TalkBoard

基于 Excalidraw 的带提词器和屏幕录制功能的白板应用。

[English](./README.md) | [中文](./README_ZH.md)

## 功能特性

- **白板绘图** - 基于 Excalidraw 的完整白板功能
- **提词器** - 内置提词器，适用于演讲和教学
- **屏幕录制** - 录制白板内容，支持摄像头叠加
- **多幻灯片** - 创建和管理多个演示幻灯片
- **自定义设置** - 画面比例、摄像头位置、鼠标效果等

## 在线演示

**[立即体验 1 →](https://talkboard.20251005.xyz)**
**[立即体验 2（备用） →](https://ludengke95.github.io/TalkBoard)**

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装

```bash
# 克隆仓库
git clone https://github.com/ludengke95/TalkBoard.git
cd talkboard

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

### 构建

```bash
npm run build
```

构建产物将生成在 `dist` 目录。

## 使用方法

1. **在画布上绘图** - 使用 Excalidraw 工具进行绘制、标注和创建内容
2. **添加幻灯片** - 点击幻灯片工具栏的 "+" 按钮添加演示页
3. **打开提词器** - 点击提词器图标打开脚本面板
4. **开始录制** - 点击录制按钮，选择录制区域后开始

### 快捷键

| 按键 | 操作 |
|------|------|
| `N` / `→` | 下一页 |
| `P` / `←` | 上一页 |

## 配置选项

通过齿轮图标访问设置：

- **画面比例** - 16:9, 4:3, 3:4, 9:16, 1:1
- **摄像头** - 启用/禁用、位置、大小、形状
- **麦克风** - 启用/禁用、设备选择
- **鼠标效果** - 启用/禁用、高亮颜色
- **主题** - 浅色/深色模式

## 技术栈

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Excalidraw](https://excalidraw.com/)
- [mediabunny](https://www.npmjs.com/package/mediabunny)
- [Vitest](https://vitest.dev/) (测试)

## 鸣谢

本项目的诞生离不开以下创作者和项目的启发与支持：

- **张咋啦** - 自媒体创作者，本项目的灵感来源
- **[Excalicord](https://excalicord.com)** - 影响本项目的原作品
- **[Excalidraw](https://excalidraw.com/)** - 优秀的虚拟白板库
- **杨任东** - 中文手写字体（杨任东朱石体）创作者
- **[excalidraw-cn](https://github.com/korbinzhao/excalidraw-cn)** - Excalidraw 中文字体支持方案

感谢以上所有创作者的开源贡献！

## 许可证

MIT License - 详见 [LICENSE](LICENSE)。

---

如果这个项目对你有帮助，请考虑给个 ⭐！

## 星星历史

<a href="https://www.star-history.com/?repos=ludengke95%2FTalkBoard&type=date&legend=bottom-right">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/image?repos=ludengke95/TalkBoard&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/image?repos=ludengke95/TalkBoard&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/image?repos=ludengke95/TalkBoard&type=date&legend=top-left" />
 </picture>
</a>
