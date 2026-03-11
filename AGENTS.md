# AGENTS.md - Agentic Coding Guidelines

本文档为在此代码库中工作的 AI Agent 提供开发指南。

## 项目概述

- **项目名称**: byv-whiteboard (白板)
- **技术栈**: Vite + React 18 + Excalidraw + Vitest + i18next
- **用途**: 基于 Excalidraw 的带提词器和屏幕录制功能的白板应用

---

## 构建与运行命令

### 核心命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 (端口 3000) |
| `npm run build` | 生产环境构建 |
| `npm run preview` | 预览生产构建 |

### 测试命令

| 命令 | 说明 |
|------|------|
| `npm run test` | 启动 Vitest 测试监听模式 |
| `npm run test:run` | 单次运行所有测试 |
| `npm run test -- <file>` | 运行单个测试文件 |
| `npm run test -- -t "<pattern>"` | 运行单个测试用例 (按名称匹配) |
| `npm run test -- --coverage` | 运行测试并生成覆盖率报告 |

---

## 代码风格指南

### 1. 文件命名规范

- **React 组件**: `PascalCase.jsx` (如 `App.jsx`, `SettingsModal.jsx`)
- **工具函数**: `camelCase.js` (如 `formatDate.js`)
- **样式文件**: 与组件同名 `.css` (如 `App.css`)
- **测试文件**: `*.test.jsx` 或 `*.test.js`

### 2. 导入顺序

```jsx
// 1. React 核心
import { useState, useCallback, useEffect, useRef } from 'react'

// 2. 外部库
import { Excalidraw } from '@excalidraw/excalidraw'
import { useTranslation } from 'react-i18next'

// 3. 本地导入 (先相对路径，后别名)
import { useSettings } from './contexts/SettingsContext'
import SettingsModal from './components/Settings/SettingsModal'

// 4. 样式导入
import './App.css'
```

### 3. 组件结构

```jsx
import { useState, useCallback, useEffect, useRef } from 'react'
import { ExternalLib } from 'external-lib'
import './Component.css'

function ComponentName() {
  // 1. Refs
  const ref = useRef(null)
  
  // 2. State
  const [state, setState] = useState(initialValue)
  
  // 3. Memoized callbacks
  const handleClick = useCallback(() => {
    // 处理逻辑
  }, [dependencies])
  
  // 4. Effects
  useEffect(() => {
    return () => { /* 清理 */ }
  }, [dependencies])
  
  // 5. 渲染
  return <div>{/* JSX */}</div>
}

export default ComponentName
```

### 4. 变量与函数命名

- **组件/类**: `PascalCase` (如 `App`, `SettingsModal`)
- **函数/变量**: `camelCase` (如 `handleClick`, `isLoading`)
- **常量**: `UPPER_SNAKE_CASE` (如 `MAX_RETRY_COUNT`)
- **Boolean 变量**: 使用 `is`, `has`, `can` 前缀 (如 `isVisible`, `hasData`)
- **Ref 变量**: 使用 `Ref` 后缀 (如 `mediaRecorderRef`)

### 5. 注释规范

- **使用中文注释** - 代码库中主要使用中文注释
- **文件级注释**: 描述文件用途

```jsx
/**
 * 白板应用主组件
 * 基于 Excalidraw 的带提词器和屏幕录制功能的白板应用
 */
```

### 6. CSS 规范

- 使用 BEM 命名风格的简化版本
- 类名: `camelCase` (如 `.toolbarBtn`, `.selectionBox`)

```css
.app { }
.toolbar { }
.toolbarBtn { }
.toolbarBtn:hover { }
```

### 7. 字符串与代码风格

- **字符串**: 使用双引号 `"` (如 `import "react"`)
- **分号**: 不使用分号
- **引号**: JSX 属性使用双引号

### 8. 错误处理

- 使用 try-catch 捕获异步错误
- 提供用户友好的错误提示

```jsx
const fetchData = useCallback(async () => {
  try {
    const data = await api.getData()
    setData(data)
  } catch (error) {
    console.error('获取数据失败:', error)
    setError('数据加载失败，请重试')
  }
}, [])
```

### 9. 性能优化

- 使用 `useCallback` 缓存回调函数
- 使用 `useMemo` 缓存计算结果
- 合理使用 `useEffect` 的依赖数组
- 避免在 useEffect 中使用 async 函数，直接调用 async 函数而不是 await

### 10. TypeScript 注意事项

项目目前使用 JavaScript (JSX)，暂无 TypeScript 配置。如需添加 TypeScript：
- 安装 `typescript` 和 `@vitejs/plugin-react-swc`
- 创建 `tsconfig.json` 配置文件
- 修改 `vite.config.js` 使用 SWC 插件

### 11. 国际化 (i18n)

项目使用 i18next 进行国际化，支持中文和英文。

```jsx
// 在组件中使用
import { useTranslation } from 'react-i18next'

function Component() {
  const { t } = useTranslation()
  
  return <div>{t('key.path')}</div>
}
```

语言文件位于 `src/i18n/locales/`:
- `zh-CN.json` - 简体中文
- `en-US.json` - 英文

---

## 项目结构

```
TalkBoard/
├── src/
│   ├── main.jsx              # 入口文件
│   ├── App.jsx               # 主应用组件
│   ├── App.css               # 主样式
│   ├── index.css             # 全局样式
│   ├── components/           # 组件目录
│   │   ├── CameraPreview/    # 摄像头预览组件
│   │   │   ├── CameraPreview.jsx
│   │   │   └── CameraPreview.css
│   │   ├── CursorIndicator/  # 光标指示器组件
│   │   │   ├── CursorIndicator.jsx
│   │   │   └── CursorIndicator.css
│   │   ├── SelectionBox/     # 选择框组件
│   │   │   ├── SelectionBox.jsx
│   │   │   └── SelectionBox.css
│   │   ├── Settings/         # 设置相关组件
│   │   │   ├── SettingsModal.jsx
│   │   │   ├── SettingsModal.css
│   │   │   ├── AspectRatioSetting.jsx
│   │   │   ├── CameraSetting.jsx
│   │   │   ├── LanguageSetting.jsx
│   │   │   ├── MicrophoneSetting.jsx
│   │   │   ├── MouseEffectSetting.jsx
│   │   │   ├── Select.jsx
│   │   │   └── Select.css
│   │   ├── SlideToolbar/     # 幻灯片工具栏组件
│   │   │   ├── SlideToolbar.jsx
│   │   │   └── SlideToolbar.css
│   │   ├── Teleprompter/     # 提词器组件
│   │   │   ├── Teleprompter.jsx
│   │   │   └── Teleprompter.css
│   │   └── Toolbar/          # 主工具栏组件
│   │       ├── Toolbar.jsx
│   │       └── Toolbar.css
│   ├── contexts/             # React Context
│   │   └── SettingsContext.jsx
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useExcalidrawScroll.js
│   │   ├── useExcalidrawStorage.js
│   │   ├── useMediaDevices.js
│   │   ├── useRecording.js
│   │   └── useSlides.js
│   ├── i18n/                 # 国际化配置
│   │   ├── index.js
│   │   └── locales/
│   │       ├── en-US.json
│   │       └── zh-CN.json
│   ├── utils/                # 工具函数
│   │   └── videoUtils.js
│   └── test/                 # 测试文件
│       ├── setup.js          # 测试环境配置
│       └── SettingsContext.test.jsx
├── index.html
├── vite.config.js
└── package.json
```

---

## Lint 与代码检查

项目目前未配置 ESLint 或其他代码检查工具。建议添加：
- ESLint + Prettier 用于代码格式化和风格检查
- 可以在 VS Code 中安装 ESLint 插件获得即时反馈

## 开发注意事项

1. **Vite 配置**: 开发服务器运行在端口 3000，且不自动打开浏览器
2. **Excalidraw**: 项目集成了 Excalidraw 白板库，需注意其 API 兼容性
3. **媒体录制**: 使用 MediaRecorder API 进行屏幕录制
4. **视频转换**: 使用 mediabunny 库将 WebM 转换为 MP4
5. **国际化**: 使用 i18next + react-i18next 实现多语言支持，语言文件位于 `src/i18n/locales/`
6. **CLI 工具**: 项目包含 CLI 工具，可通过 `npx talkboard` 调用，位于 `bin/talkboard.js`
7. **测试环境**: 使用 jsdom + @testing-library/react 进行组件测试

---

## 常用工具函数位置

- 状态逻辑: `src/App.jsx`
- Context: `src/contexts/SettingsContext.jsx`
- 自定义 Hooks: `src/hooks/`
  - `useExcalidrawScroll.js` - Excalidraw 滚动控制
  - `useExcalidrawStorage.js` - Excalidraw 存储管理
  - `useMediaDevices.js` - 媒体设备管理
  - `useRecording.js` - 录制功能
  - `useSlides.js` - 幻灯片管理
- 国际化: `src/i18n/`
- 视频工具: `src/utils/videoUtils.js`
- 测试设置: `src/test/setup.js`
