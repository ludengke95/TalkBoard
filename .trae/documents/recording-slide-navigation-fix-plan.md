# 录制状态下演示页切换问题修复计划

## 问题分析

### 当前限制
1. **SlideToolbar 禁用**：在 `App.jsx` 第 817 行，`SlideToolbar` 组件接收 `disabled={recordingStep === "recording"}` 属性
2. **CSS 禁用交互**：`SlideToolbar.css` 第 27-30 行，`.slide-toolbar.disabled` 设置了 `pointer-events: none;`，导致整个工具栏无法点击
3. **键盘快捷键禁用**：`App.jsx` 第 350 行，在录制状态下直接返回，禁用了键盘翻页功能

### 用户需求
在录制状态下仍然可以切换演示页（翻页），但可能需要限制其他操作（如添加、删除、重新排序）。

## 实现方案

### 方案概述
将 `disabled` 属性细化为更精细的控制：
- **允许操作**：切换页面（点击 slide item、键盘快捷键）
- **禁用操作**：添加演讲页、删除演讲页、拖拽重新排序

### 实现步骤

#### 1. 修改 SlideToolbar 组件的 disabled 逻辑

**文件**: `src/components/SlideToolbar/SlideToolbar.jsx`

**修改内容**:
- 移除整体 `disabled` 属性
- 添加独立的 `readOnly` 属性，用于控制是否允许添加/删除/拖拽
- 保留点击切换页面的功能

```jsx
// 修改前
function SlideToolbar({
  slides,
  currentPage,
  onAddSlide,
  onDeleteSlide,
  onSelectSlide,
  onReorderSlides,
  onPrevPage,
  onNextPage,
  disabled,
}) {

// 修改后
function SlideToolbar({
  slides,
  currentPage,
  onAddSlide,
  onDeleteSlide,
  onSelectSlide,
  onReorderSlides,
  onPrevPage,
  onNextPage,
  readOnly, // 新增：只读模式，禁用添加/删除/拖拽，但允许切换页面
}) {
```

**修改拖拽相关代码**（第 18-48 行）:
```jsx
// 修改前
draggable={!disabled}

// 修改后
draggable={!readOnly}
```

**修改删除按钮**（第 80 行）:
```jsx
// 修改前
disabled={disabled}

// 修改后
disabled={readOnly}
```

**修改添加按钮**（第 105 行）:
```jsx
// 修改前
disabled={disabled}

// 修改后
disabled={readOnly}
```

**移除 disabled 类**（第 59 行）:
```jsx
// 修改前
<div className={`slide-toolbar ${disabled ? "disabled" : ""}`}>

// 修改后
<div className="slide-toolbar">
```

#### 2. 修改 SlideToolbar CSS

**文件**: `src/components/SlideToolbar/SlideToolbar.css`

**删除或注释掉**（第 27-30 行）:
```css
.slide-toolbar.disabled {
    opacity: 0.5;
    pointer-events: none;
}
```

#### 3. 修改 App.jsx 中的 SlideToolbar 调用

**文件**: `src/App.jsx`（第 808-818 行）

**修改内容**:
```jsx
// 修改前
<SlideToolbar
  slides={slides}
  currentPage={currentPage}
  onAddSlide={handleAddSlide}
  onDeleteSlide={handleDeleteSlide}
  onSelectSlide={handleSelectSlide}
  onReorderSlides={handleReorderSlides}
  onPrevPage={handlePrevPage}
  onNextPage={handleNextPage}
  disabled={recordingStep === "recording"}
/>

// 修改后
<SlideToolbar
  slides={slides}
  currentPage={currentPage}
  onAddSlide={handleAddSlide}
  onDeleteSlide={handleDeleteSlide}
  onSelectSlide={handleSelectSlide}
  onReorderSlides={handleReorderSlides}
  onPrevPage={handlePrevPage}
  onNextPage={handleNextPage}
  readOnly={recordingStep === "recording"}
/>
```

#### 4. 修改键盘快捷键处理逻辑

**文件**: `src/App.jsx`（第 348-379 行）

**修改内容**: 允许在录制状态下使用键盘翻页

```jsx
// 修改前
useEffect(() => {
  if (recordingStep === "recording") return;

  const handleKeyDown = (e) => {
    // 忽略输入框中的快捷键
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
      return;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "n":
      case "N":
        e.preventDefault();
        handleNextPage();
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "p":
      case "P":
        e.preventDefault();
        handlePrevPage();
        break;
      default:
        break;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [recordingStep, handleNextPage, handlePrevPage]);

// 修改后
useEffect(() => {
  const handleKeyDown = (e) => {
    // 忽略输入框中的快捷键
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
      return;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "n":
      case "N":
        e.preventDefault();
        handleNextPage();
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "p":
      case "P":
        e.preventDefault();
        handlePrevPage();
        break;
      default:
        break;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [handleNextPage, handlePrevPage]);
```

## 涉及文件

1. `src/components/SlideToolbar/SlideToolbar.jsx`
2. `src/components/SlideToolbar/SlideToolbar.css`
3. `src/App.jsx`

## 可能的问题和测试用例

### 可能的问题

1. **录制过程中添加/删除演讲页**：如果用户在录制过程中添加或删除演讲页，可能导致录制内容不完整或混乱
2. **拖拽重新排序**：在录制过程中拖拽重新排序可能导致录制内容与预期不符
3. **性能影响**：频繁翻页可能影响录制性能

### 建议的测试用例

1. **录制状态下切换页面测试**:
   - 开始录制
   - 点击 SlideToolbar 中的演讲页，验证能否切换
   - 使用键盘快捷键（方向键、n/p）验证能否翻页

2. **录制状态下禁用操作测试**:
   - 开始录制
   - 尝试添加演讲页，验证是否禁用
   - 尝试删除演讲页，验证是否禁用
   - 尝试拖拽演讲页，验证是否禁用

3. **非录制状态测试**:
   - 确保非录制状态下所有功能正常（添加、删除、拖拽、切换）

4. **录制内容验证**:
   - 录制一段包含翻页操作的视频
   - 检查输出视频是否正确记录了页面切换
