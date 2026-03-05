# 获取 Frame 元素的屏幕绝对位置

## 问题分析

Excalidraw 使用三层坐标系统：

1. **场景坐标（Scene Coordinates）**：元素的 x, y 存储的是场景坐标，独立于缩放和平移
2. **页面坐标（Page Coordinates）**：屏幕上的实际像素位置（clientX/clientY）

Frame 元素的 `x`, `y`, `width`, `height` 是场景坐标，需要转换为屏幕坐标才能用于 `selectionBox`。

## 坐标转换公式

```javascript
// 场景坐标 -> 页面坐标（屏幕位置）
const rect = canvas.getBoundingClientRect();
const { scrollX, scrollY, zoom } = appState;

// 左上角屏幕位置
const screenX = (sceneX - scrollX) * zoom.value + rect.left;
const screenY = (sceneY - scrollY) * zoom.value + rect.top;

// 屏幕上的宽高
const screenWidth = sceneWidth * zoom.value;
const screenHeight = sceneHeight * zoom.value;
```

## 实现步骤

### 步骤 1：获取 appState

**文件**: `src/App.jsx`

使用 `excalidrawRef.current.getAppState()` 获取当前的 zoom、scrollX、scrollY。

### 步骤 2：修改 handleStartSelect 函数

**文件**: `src/App.jsx`

将场景坐标转换为屏幕坐标：

```javascript
if (firstFrame) {
  // 获取 appState（包含 zoom, scrollX, scrollY）
  const appState = excalidrawRef.current.getAppState();
  const canvas = document.querySelector(".excalidraw canvas:last-of-type");
  const rect = canvas.getBoundingClientRect();

  // 将场景坐标转换为屏幕坐标
  const screenX = (firstFrame.x - appState.scrollX) * appState.zoom.value + rect.left;
  const screenY = (firstFrame.y - appState.scrollY) * appState.zoom.value + rect.top;
  const screenWidth = firstFrame.width * appState.zoom.value;
  const screenHeight = firstFrame.height * appState.zoom.value;

  setSelectionBox({
    x: screenX,
    y: screenY,
    width: screenWidth,
    height: screenHeight,
    locked: true,
  });
}
```

## 涉及文件

| 文件            | 修改内容                               |
| ------------- | ---------------------------------- |
| `src/App.jsx` | 修改 `handleStartSelect` 函数，添加坐标转换逻辑 |

## 测试要点

1. 在不同缩放级别下测试，验证 selectionBox 位置是否正确
2. 在平移画布后测试，验证 selectionBox 位置是否正确
3. 测试组合操作：先缩放再平移，验证位置是否正确

