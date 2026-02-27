# AGENTS.md - Agentic Coding Guidelines

本文档为在此代码库中工作的 AI Agent 提供开发指南。

## 项目概述

- **项目名称**: byv-whiteboard (白板)
- **技术栈**: Vite + React 18 + Excalidraw
- **用途**: 基于 Excalidraw 的带提词器和屏幕录制功能的白板应用

---

## 构建与运行命令

### 核心命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 (端口 3000) |
| `npm run build` | 生产环境构建 |
| `npm run preview` | 预览生产构建 |

### 测试与检查

**注意**: 当前项目未配置测试框架和 lint 工具。

- 如需添加测试: 推荐使用 Vitest + React Testing Library
- 如需添加 lint: 推荐使用 ESLint + Prettier

---

## 代码风格指南

### 1. 文件命名规范

- **React 组件**: `PascalCase.jsx` (如 `App.jsx`, `SettingsModal.jsx`)
- **工具函数**: `camelCase.js` (如 `formatDate.js`)
- **样式文件**: 与组件同名 `.css` (如 `App.css`)

### 2. 导入顺序

```jsx
// 1. React 核心
import React, { useState, useCallback } from 'react'

// 2. 外部库
import { Excalidraw } from '@excalidraw/excalidraw'

// 3. 本地导入
import './App.css'
import { formatDate } from './utils'
```

### 3. 组件结构

```jsx
// 组件文件结构示例
import { useState, useCallback, useEffect, useRef } from 'react'
import { ExternalLib } from 'external-lib'
import './Component.css'

function ComponentName() {
  // 1. Refs (使用 useRef)
  const ref = useRef(null)
  
  // 2. State (使用 useState)
  const [state, setState] = useState(initialValue)
  
  // 3. Memoized callbacks (使用 useCallback)
  const handleClick = useCallback(() => {
    // 处理逻辑
  }, [dependencies])
  
  // 4. Effects (使用 useEffect)
  useEffect(() => {
    // 副作用逻辑
    return () => { /* 清理 */ }
  }, [dependencies])
  
  // 5. 渲染
  return (
    <div>
      {/* JSX */}
    </div>
  )
}

export default ComponentName
```

### 4. 变量与函数命名

- **组件/类**: `PascalCase` (如 `App`, `SettingsModal`)
- **函数/变量**: `camelCase` (如 `handleClick`, `isLoading`)
- **常量**: `UPPER_SNAKE_CASE` (如 `MAX_RETRY_COUNT`)
- **Boolean 变量**: 使用 `is`, `has`, `can` 前缀 (如 `isVisible`, `hasData`)

### 5. 注释规范

- **使用中文注释** - 代码库中主要使用中文注释
- **函数级注释**: 描述函数用途

```jsx
// 处理用户点击事件
function handleUserClick(userId) {
  // 参数验证
  if (!userId) return
  
  // 业务逻辑
  fetchUser(userId)
}
```

### 6. CSS 规范

- 使用 BEM 命名风格的简化版本
- 类名: `camelCase` (如 `.toolbarBtn`, `.selectionBox`)
- 避免内联样式，优先使用 CSS 类

```css
/* 选择器示例 */
.app { }
.toolbar { }
.toolbarBtn { }
.toolbarBtn:hover { }
.selectionBox { }
.selectionHandle { }
```

### 7. 状态管理

- **局部状态**: 使用 `useState`
- **跨组件共享**: 使用 React Context
- **避免不必要的全局状态**

### 8. 错误处理

- 使用 try-catch 捕获异步错误
- 提供用户友好的错误提示
- 记录错误日志

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
- 避免在渲染中创建新函数/对象

---

## 项目结构

```
byv/
├── src/
│   ├── main.jsx          # 入口文件
│   ├── App.jsx           # 主应用组件
│   ├── App.css           # 主样式
│   └── index.css         # 全局样式
├── index.html            # HTML 模板
├── vite.config.js        # Vite 配置
└── package.json          # 依赖配置
```

---

## 开发注意事项

1. **Vite 配置**: 开发服务器运行在端口 3000，且不自动打开浏览器
2. **Excalidraw**: 项目集成了 Excalidraw 白板库，需注意其 API 兼容性
3. **媒体录制**: 使用 MediaRecorder API 进行屏幕录制
4. **无测试**: 添加新功能时，建议同步添加测试

---

## 常用工具函数位置

- 样式工具: `src/App.css`
- 状态逻辑: `src/App.jsx` (单一组件项目)
- 工具函数: 如需添加，建议放在 `src/utils/` 目录
