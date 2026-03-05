# 解决 scrollToPage 异步问题

## 问题分析

`scrollToPage` 函数内部调用 `excalidrawRef.current.scrollToContent`，这是一个异步操作，有 500ms 的动画时长。当前代码在 `scrollToPage(0)` 之后立即执行坐标转换，此时画布可能还在滚动中，导致获取的视口坐标不准确。

## 解决方案

使用 `setTimeout` 延迟执行后续操作，等待滚动动画完成后再进行坐标转换。

## 实现步骤

### 步骤 1：修改 handleStartSelect 函数
**文件**: `src/App.jsx`

将后续操作放入 `setTimeout` 中，延迟时间略大于动画时长（500ms + 缓冲）：

```javascript
if (slides.length > 0) {
  // 先滚动到第一个演讲页
  scrollToPage(0);

  // 等待滚动动画完成后再设置 selectionBox
  setTimeout(() => {
    const firstSlide = slides[0];
    const elements = excalidrawRef.current?.getSceneElements() || [];
    const firstFrame = elements.find((el) => el.id === firstSlide.frameId);

    if (firstFrame) {
      const appState = excalidrawRef.current.getAppState();

      const topLeft = sceneCoordsToViewportCoords(
        { sceneX: firstFrame.x, sceneY: firstFrame.y },
        appState
      );
      const bottomRight = sceneCoordsToViewportCoords(
        { sceneX: firstFrame.x + firstFrame.width, sceneY: firstFrame.y + firstFrame.height },
        appState
      );

      setSelectionBox({
        x: topLeft.x,
        y: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
        locked: true,
      });
    } else {
      setSelectionBox({
        x: firstSlide.x,
        y: firstSlide.y,
        width: firstSlide.width,
        height: firstSlide.height,
        locked: true,
      });
    }
  }, 600); // 动画时长 500ms + 100ms 缓冲
} else {
  initSelectionBox();
}
```

## 涉及文件

| 文件 | 修改内容 |
|------|----------|
| `src/App.jsx` | 将坐标转换逻辑放入 setTimeout 中延迟执行 |

## 测试要点

1. 测试滚动动画完成后，selectionBox 是否正确显示在 frame 位置
2. 测试快速连续点击是否正常工作
