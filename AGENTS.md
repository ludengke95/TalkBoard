# AGENTS.md - Agentic Coding Guidelines

本文档为在此代码库中工作的 AI Agent 提供开发指南。

## 项目概述

- **项目名称**: byv-whiteboard (白板)
- **技术栈**: Vite + React 18 + Excalidraw + Vitest
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
| `npm run test -- --run <file>` | 运行单个测试文件 |
| `npm run test -- --run -t "<pattern>"` | 运行单个测试用例 (按名称匹配) |

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

---

## 项目结构

```
byv/
├── src/
│   ├── main.jsx              # 入口文件
│   ├── App.jsx               # 主应用组件
│   ├── App.css               # 主样式
│   ├── index.css             # 全局样式
│   ├── components/           # 组件目录
│   │   └── ComponentName/
│   │       ├── ComponentName.jsx
│   │       └── ComponentName.css
│   ├── contexts/             # React Context
│   ├── hooks/                # 自定义 Hooks
│   └── test/                 # 测试文件
│       ├── setup.js          # 测试环境配置
│       └── *.test.jsx
├── index.html
├── vite.config.js
└── package.json
```

---

## 开发注意事项

1. **Vite 配置**: 开发服务器运行在端口 3000，且不自动打开浏览器
2. **Excalidraw**: 项目集成了 Excalidraw 白板库，需注意其 API 兼容性
3. **媒体录制**: 使用 MediaRecorder API 进行屏幕录制
4. **视频转换**: 使用 mediabunny 库将 WebM 转换为 MP4

---

## 常用工具函数位置

- 状态逻辑: `src/App.jsx`
- Context: `src/contexts/SettingsContext.jsx`
- 自定义 Hooks: `src/hooks/`
- 测试设置: `src/test/setup.js`
