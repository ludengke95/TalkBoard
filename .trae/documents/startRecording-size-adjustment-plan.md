# startRecording 方法调整计划

## 需求描述

调整 `startRecording` 方法，根据录制模式决定视频输出尺寸：
- **演示模式录制**（有演讲页）：使用演示页的固定尺寸（如 16:9 对应 1920x1080）
- **非演示模式录制**（无演讲页）：使用 selectionBox 的实际尺寸

## 实现步骤

### 1. 修改 startRecording 方法中的画布尺寸计算逻辑

**位置**: `src/App.jsx` 第 469-471 行

**修改内容**:
```jsx
// 修改前
const totalWidth = selectionBox.width;
const totalHeight = selectionBox.height;

// 修改后
// 判断是否为演示模式
const isPresentationMode = slides.length > 0;

// 根据模式决定视频输出尺寸
let totalWidth, totalHeight;
if (isPresentationMode) {
  // 演示模式：使用演示页的固定尺寸
  const slideSize = calculateSlideSize();
  totalWidth = slideSize.width;
  totalHeight = slideSize.height;
} else {
  // 非演示模式：使用 selectionBox 的实际尺寸
  totalWidth = selectionBox.width;
  totalHeight = selectionBox.height;
}
```

### 2. 更新 captureFrame 函数中的绘制逻辑

**位置**: `src/App.jsx` 第 499-564 行

**说明**: 
- 由于录制画布尺寸可能大于或小于 selectionBox 尺寸，需要调整 `drawImage` 的目标尺寸参数
- 当前代码中 `dstW` 和 `dstH` 使用的是 `excalidrawCanvas.width/height`，这是错误的
- 应该使用 `totalWidth` 和 `totalHeight` 作为目标尺寸

**修改内容**:
```jsx
// 修改前（第 523-537 行）
const dstW = excalidrawCanvas.width;
const dstH = excalidrawCanvas.height;

ctx.drawImage(
  excalidrawCanvas,
  srcX,
  srcY,
  srcW,
  srcH,
  0,
  0,
  dstW,
  dstH,
);

// 修改后
ctx.drawImage(
  excalidrawCanvas,
  srcX,
  srcY,
  srcW,
  srcH,
  0,
  0,
  totalWidth,
  totalHeight,
);
```

### 3. 更新 useCallback 依赖项

**位置**: `src/App.jsx` 第 662-668 行

**修改内容**: 在依赖数组中添加 `slides` 和 `calculateSlideSize`

```jsx
// 修改前
}, [
  selectionBox,
  mouseEffect,
  camera,
  startVideo,
  drawCameraToCanvas,
]);

// 修改后
}, [
  selectionBox,
  mouseEffect,
  camera,
  startVideo,
  drawCameraToCanvas,
  slides,
  calculateSlideSize,
]);
```

## 可能的问题和测试用例

### 可能的问题

1. **画面拉伸/压缩**: 演示模式下，如果 selectionBox 的宽高比与演示页固定尺寸的宽高比不一致，可能导致画面变形
2. **性能影响**: 演示模式下使用固定的高分辨率（如 1920x1080），可能增加录制性能开销
3. **摄像头位置**: 摄像头绘制使用 `totalWidth/totalHeight`，已正确适配

### 建议的测试用例

1. **演示模式录制测试**:
   - 创建一个或多个演讲页
   - 开始录制，验证输出视频尺寸是否为演示页固定尺寸（如 1920x1080）
   
2. **非演示模式录制测试**:
   - 不创建演讲页
   - 手动调整 selectionBox 大小
   - 开始录制，验证输出视频尺寸是否与 selectionBox 尺寸一致

3. **宽高比一致性测试**:
   - 确保演示模式下 selectionBox 的宽高比与演示页固定尺寸的宽高比一致
   - 验证画面无变形

## 涉及文件

- `src/App.jsx`
