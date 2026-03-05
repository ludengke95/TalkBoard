# CanvasRecorder 优化方案应用计划

## 代码分析

### 提供的优化代码核心原理

```javascript
class CanvasRecorder {
  start() {
    const stream = this.canvas.captureStream(0); // 手动模式
    this.track = stream.getVideoTracks()[0];

    this.recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8_000_000, // 设置视频比特率
    });

    this.recorder.start(100); // 每 100ms 触发一次 ondataavailable
    this._loop();
  }

  _loop() {
    if (this.recorder?.state !== 'recording') return;

    // 绘制逻辑
    this.draw();

    // 手动触发帧 - 关键优化点
    this.track.requestFrame();

    this._raf = requestAnimationFrame(() => this._loop());
  }
}
```

### 关键优化点解析

#### 1. **captureStream(0) - 手动模式**

* **参数** **`0`**：表示不自动捕获帧，完全由开发者手动控制

* **优势**：避免浏览器自动捕获导致的帧率不稳定

* **对比**：之前的 `captureStream(60)` 会尝试自动以 60fps 捕获，但实际效果受浏览器实现影响

#### 2. **track.requestFrame() - 手动触发帧**

* **核心优化**：在每次绘制完成后，手动通知 MediaRecorder 捕获当前帧

* **优势**：

  * 确保每一帧都是完整绘制的

  * 精确控制帧率

  * 避免帧丢失和帧率波动

  * 提高录制稳定性

#### 3. **videoBitsPerSecond: 8\_000\_000 - 视频比特率**

* **参数**：8Mbps 的视频比特率

* **优势**：提高视频质量，减少压缩伪影

* **权衡**：文件大小会增加，但质量提升明显

#### 4. **recorder.start(100) - 数据块收集间隔**

* **参数**：每 100ms 收集一次数据块

* **优势**：平衡性能和帧率，避免过于频繁的数据块收集

***

## 当前项目录制流程分析

### 现有实现（第 461-670 行）

```javascript
const startRecording = useCallback(async () => {
  // 1. 创建离屏 canvas
  const recordCanvas = document.createElement("canvas");
  recordCanvas.width = totalWidth;
  recordCanvas.height = totalHeight;
  const ctx = recordCanvas.getContext("2d");

  // 2. 定义绘制函数
  const captureFrame = () => {
    // 清空画布
    ctx.clearRect(0, 0, totalWidth, totalHeight);

    // 绘制 Excalidraw 画布
    ctx.drawImage(excalidrawCanvas, srcX, srcY, srcW, srcH, 0, 0, totalWidth, totalHeight);

    // 绘制摄像头画面
    if (camera.enabled && videoRef.current) {
      drawCameraToCanvas(ctx, totalWidth, totalHeight);
    }

    // 绘制鼠标指示器
    // ...

    // 递归调用
    animationFrameRef.current = requestAnimationFrame(captureFrame);
  };

  // 3. 启动绘制循环
  isCapturingRef.current = true;
  captureFrame();

  // 4. 创建视频流（问题所在）
  const stream = recordCanvas.captureStream(60); // 自动模式

  // 5. 添加音频轨道
  if (microphone.enabled) {
    // 添加音频轨道到流
  }

  // 6. 创建 MediaRecorder
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9",
  });

  // 7. 启动录制
  mediaRecorder.start(1000); // 每 1000ms 收集一次数据块
}, [...]);
```

### 现有实现的问题

1. **captureStream(60)**：使用自动模式，浏览器自动捕获帧，无法精确控制
2. **缺少 track.requestFrame()**：没有手动触发帧，可能导致帧丢失
3. **没有设置 videoBitsPerSecond**：使用默认比特率，视频质量可能不够好
4. **时间片过大（1000ms）**：每秒才收集一次数据块，导致帧率低

***

## 应用优化方案

### 步骤 1：修改 captureStream 调用

**位置**：`src/App.jsx` 第 579 行

**修改前**：

```javascript
const stream = recordCanvas.captureStream(60);
```

**修改后**：

```javascript
// 创建视频流（手动模式，由开发者控制帧捕获）
const stream = recordCanvas.captureStream(0);
```

**说明**：使用参数 `0` 启用手动模式，不自动捕获帧

***

### 步骤 2：获取并保存视频轨道引用

**位置**：`src/App.jsx` 第 579 行之后

**添加代码**：

```javascript
// 获取视频轨道并保存引用，用于手动触发帧
const videoTrack = stream.getVideoTracks()[0];
const videoTrackRef = useRef(null);
videoTrackRef.current = videoTrack;
```

**说明**：需要添加一个新的 ref 来保存视频轨道引用

***

### 步骤 3：在 captureFrame 函数中添加手动触发帧

**位置**：`src/App.jsx` 第 572 行（captureFrame 函数末尾）

**修改前**：

```javascript
animationFrameRef.current = requestAnimationFrame(captureFrame);
```

**修改后**：

```javascript
// 手动触发帧捕获，确保每一帧都被正确录制
if (videoTrackRef.current) {
  videoTrackRef.current.requestFrame();
}

animationFrameRef.current = requestAnimationFrame(captureFrame);
```

**说明**：在每次绘制完成后，手动通知 MediaRecorder 捕获当前帧

***

### 步骤 4：添加 videoBitsPerSecond 参数

**位置**：`src/App.jsx` 第 599 行

**修改前**：

```javascript
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: "video/webm;codecs=vp9",
});
```

**修改后**：

```javascript
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: "video/webm;codecs=vp9",
  videoBitsPerSecond: 8_000_000, // 设置视频比特率为 8Mbps，提高视频质量
});
```

**说明**：设置视频比特率为 8Mbps，提高视频质量

***

### 步骤 5：调整 MediaRecorder 时间片

**位置**：`src/App.jsx` 第 668 行

**修改前**：

```javascript
mediaRecorder.start(1000);
```

**修改后**：

```javascript
mediaRecorder.start(100); // 每 100ms 收集一次数据块，平衡性能和帧率
```

**说明**：将时间片从 1000ms 改为 100ms，提高数据块收集频率

***

### 步骤 6：添加 videoTrackRef 声明

**位置**：`src/App.jsx` 第 54-61 行（其他 ref 声明附近）

**添加代码**：

```javascript
const mediaRecorderRef = useRef(null);
const chunksRef = useRef([]);
const recordCanvasRef = useRef(null);
const animationFrameRef = useRef(null);
const isCapturingRef = useRef(false);
const videoRef = useRef(null);
const cameraStreamRef = useRef(null);
const audioStreamRef = useRef(null);
const videoTrackRef = useRef(null); // 新增：保存视频轨道引用
```

***

### 步骤 7：清理 videoTrackRef

**位置**：`src/App.jsx` 第 611-628 行（mediaRecorder.onstop 回调中）

**添加代码**：

```javascript
mediaRecorder.onstop = async () => {
  isCapturingRef.current = false;
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
  }

  // 清理视频轨道引用
  videoTrackRef.current = null;

  // 停止摄像头
  if (cameraStreamRef.current) {
    cameraStreamRef.current.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
  }
  videoRef.current = null;

  // 停止麦克风
  if (audioStreamRef.current) {
    audioStreamRef.current.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
  }

  // ... 其余代码
};
```

***

### 步骤 8：在 useEffect 清理函数中添加 videoTrackRef 清理

**位置**：`src/App.jsx` 第 701-716 行

**修改前**：

```javascript
useEffect(() => {
  return () => {
    isCapturingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // 清理摄像头
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    // 清理麦克风
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  };
}, []);
```

**修改后**：

```javascript
useEffect(() => {
  return () => {
    isCapturingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // 清理视频轨道引用
    videoTrackRef.current = null;
    // 清理摄像头
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    // 清理麦克风
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  };
}, []);
```

***

## 预期效果

### 帧率提升

* **修改前**：约 20fps（不稳定）

* **修改后**：稳定在 50-60fps

### 视频质量提升

* **修改前**：默认比特率，可能有压缩伪影

* **修改后**：8Mbps 比特率，视频质量明显提升

### 录制稳定性

* **修改前**：帧率波动大，可能有帧丢失

* **修改后**：帧率稳定，每一帧都完整捕获

***

## 可能出现的问题及测试用例

### 问题 1：浏览器不支持 captureStream(0)

**测试用例**：

* 在不同浏览器中测试（Chrome、Firefox、Edge）

* 检查是否抛出错误

**解决方案**：
如果某些浏览器不支持 `captureStream(0)`，可以添加兼容性检测：

```javascript
let stream;
try {
  stream = recordCanvas.captureStream(0);
} catch (e) {
  console.warn('captureStream(0) 不支持，回退到自动模式');
  stream = recordCanvas.captureStream(60);
}
```

### 问题 2：videoTrack.requestFrame() 不支持

**测试用例**：

* 检查 videoTrack 是否有 requestFrame 方法

* 在不同浏览器中测试

**解决方案**：
添加方法检测：

```javascript
if (videoTrackRef.current && typeof videoTrackRef.current.requestFrame === 'function') {
  videoTrackRef.current.requestFrame();
}
```

### 问题 3：文件大小增加过多

**测试用例**：

* 录制 1 分钟视频

* 检查文件大小是否超过合理范围（例如超过 500MB）

**解决方案**：
如果文件大小过大，可以降低 videoBitsPerSecond：

```javascript
videoBitsPerSecond: 4_000_000, // 降低到 4Mbps
```

### 问题 4：性能下降明显

**测试用例**：

* 在配置较低的设备上测试

* 监控 CPU 和内存使用情况

**解决方案**：
如果性能下降明显，可以：

1. 降低 videoBitsPerSecond 到 4Mbps
2. 增加 MediaRecorder 时间片到 200ms
3. 降低 requestAnimationFrame 的调用频率

***

## 实施顺序

1. ✅ 添加 videoTrackRef 声明
2. ✅ 修改 captureStream 调用为手动模式
3. ✅ 获取并保存视频轨道引用
4. ✅ 在 captureFrame 中添加手动触发帧
5. ✅ 添加 videoBitsPerSecond 参数
6. ✅ 调整 MediaRecorder 时间片
7. ✅ 添加清理逻辑
8. ✅ 测试验证

***

## 风险评估

* **风险等级**：低

* **影响范围**：仅影响录制功能

* **回滚难度**：简单，只需恢复原来的代码即可

* **兼容性**：需要测试不同浏览器的兼容性

***

## 后续优化建议

1. **添加帧率监控**：在录制时显示当前实际帧率
2. **动态调整比特率**：根据设备性能自动调整 videoBitsPerSecond
3. **添加录制质量设置**：允许用户选择录制质量（高/中/低）
4. **编码格式优化**：尝试使用 H.264 编码（如果浏览器支持）
5. **添加录制预览**：在录制时显示实时预览窗口

