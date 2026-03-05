# 修复 Frame 元素屏幕坐标转换问题

## 问题分析

当前代码手动计算坐标转换：

```javascript
const screenX = (firstFrame.x - appState.scrollX) * appState.zoom.value + rect.left;
const screenY = (firstFrame.y - appState.scrollY) * appState.zoom.value + rect.top;
```

**问题**：Excalidraw 内部有更复杂的坐标转换逻辑，手动计算可能不准确。

## 解决方案

使用 Excalidraw 提供的 `sceneCoordsToViewportCoords` API 进行坐标转换：

```javascript
const viewportCoords = sceneCoordsToViewportCoords(
  { sceneX: x, sceneY: y },
  appState
);
```

## 实现步骤

### 步骤 1：导入 sceneCoordsToViewportCoords

**文件**: `src/App.jsx`

```javascript
import {
  Excalidraw,
  convertToExcalidrawElements,
  sceneCoordsToViewportCoords,
} from "@excalidraw/excalidraw";
```

### 步骤 2：修改 handleStartSelect 函数

**文件**: `src/App.jsx`

将手动计算改为使用 API：

```javascript
if (firstFrame) {
  // 获取 appState
  const appState = excalidrawRef.current.getAppState();

  // 使用 Excalidraw API 将场景坐标转换为视口坐标
  const topLeft = sceneCoordsToViewportCoords(
    { sceneX: firstFrame.x, sceneY: firstFrame.y },
    appState
  );
  const bottomRight = sceneCoordsToViewportCoords(
    { sceneX: firstFrame.x + firstFrame.width, sceneY: firstFrame.y + firstFrame.height },
    appState
  );

  // 计算屏幕上的位置和大小
  const screenX = topLeft.x;
  const screenY = topLeft.y;
  const screenWidth = bottomRight.x - topLeft.x;
  const screenHeight = bottomRight.y - topLeft.y;

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

| 文件            | 修改内容                                      |
| ------------- | ----------------------------------------- |
| `src/App.jsx` | 导入 `sceneCoordsToViewportCoords`，修改坐标转换逻辑 |

## 测试要点

1. 在不同缩放级别下测试，验证 selectionBox 位置是否正确
2. 在平移画布后测试，验证 selectionBox 位置是否正确
3. 测试组合操作：先缩放再平移，验证位置是否正确

