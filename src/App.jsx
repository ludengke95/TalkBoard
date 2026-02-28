/**
 * 白板应用主组件
 * 基于 Excalidraw 的带提词器和屏幕录制功能的白板应用
 */
import { useRef, useState, useCallback, useEffect } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import SettingsModal from "./components/Settings/SettingsModal";
import Toolbar from "./components/Toolbar/Toolbar";
import Teleprompter from "./components/Teleprompter/Teleprompter";
import SelectionBox from "./components/SelectionBox/SelectionBox";
import CursorIndicator from "./components/CursorIndicator/CursorIndicator";
import { useMediaDevices } from "./hooks/useMediaDevices";
import CameraPreview from "./components/CameraPreview/CameraPreview";
import "./App.css";

function AppWithSettings() {
  const { settings } = useSettings();
  const { mouseEffect, aspectRatio, cornerRadius, camera } = settings;
  const { enumerateDevices, startVideo, stopVideo } = useMediaDevices();

  const excalidrawRef = useRef(null);
  const [recordingStep, setRecordingStep] = useState("idle");
  const [selectionBox, setSelectionBox] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });

  const [showSettings, setShowSettings] = useState(false);
  const [teleprompterContent, setTeleprompterContent] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isCapturingRef = useRef(false);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // 绘制摄像头画面到画布
  const drawCameraToCanvas = useCallback(
    (ctx, canvasWidth, canvasHeight) => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      const video = videoRef.current;
      const { size, shape, position } = camera;

      // 计算摄像头位置
      let x, y;
      const offsetX = 20;
      const offsetY = 20;

      switch (position) {
        case "top-left":
          x = offsetX;
          y = offsetY;
          break;
        case "top-right":
          x = canvasWidth - size - offsetX;
          y = offsetY;
          break;
        case "bottom-left":
          x = offsetX;
          y = canvasHeight - size - offsetY;
          break;
        case "bottom-right":
        default:
          x = canvasWidth - size - offsetX;
          y = canvasHeight - size - offsetY;
          break;
      }

      // 保存当前上下文
      ctx.save();

      // 创建裁剪区域
      ctx.beginPath();
      if (shape === "circle") {
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      } else {
        ctx.rect(x, y, size, size);
      }
      ctx.clip();

      // 绘制摄像头画面
      // 保持视频比例，进行覆盖填充
      const videoRatio = video.videoWidth / video.videoHeight;
      let drawWidth = size;
      let drawHeight = size / videoRatio;

      if (drawHeight < size) {
        drawHeight = size;
        drawWidth = size * videoRatio;
      }

      const drawX = x + (size - drawWidth) / 2;
      const drawY = y + (size - drawHeight) / 2;

      ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);

      ctx.restore();
    },
    [camera],
  );

  const initSelectionBox = useCallback(() => {
    let ratio = 16 / 9;
    if (aspectRatio && aspectRatio.includes(":")) {
      const [w, h] = aspectRatio.split(":").map(Number);
      if (w && h) {
        ratio = w / h;
      }
    }

    const maxWidth = window.innerWidth * 0.7;
    const maxHeight = window.innerHeight * 0.7;

    let width, height;
    if (maxWidth / maxHeight > ratio) {
      height = maxHeight;
      width = height * ratio;
    } else {
      width = maxWidth;
      height = width / ratio;
    }

    width = Math.max(width, 200);
    height = Math.max(height, 150);

    const x = (window.innerWidth - width) / 2;
    const y = (window.innerHeight - height) / 2;

    setSelectionBox({ x, y, width, height });
  }, [aspectRatio]);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        enumerateDevices();
      } catch (err) {
        console.warn("请求媒体权限失败:", err);
      }
    };
    requestPermissions();
  }, [enumerateDevices]);

  const handleStartSelect = useCallback(async () => {
    initSelectionBox();
    // 如果启用了摄像头，在选择区域时就开始预览
    if (camera.enabled) {
      const stream = await startVideo(camera.deviceId);
      if (stream) {
        cameraStreamRef.current = stream;
      }
    }
    setRecordingStep("selecting");
  }, [initSelectionBox, camera, startVideo]);

  const handleCancelSelect = useCallback(() => {
    setSelectionBox(null);
    setRecordingStep("idle");
    // 取消选择时停止摄像头预览
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  }, []);

  const handleBoxChange = useCallback((newBox) => {
    setSelectionBox(newBox);
  }, []);

  const startRecording = useCallback(async () => {
    if (!selectionBox || !excalidrawRef.current) return;

    const margin = settings.margin || 0;
    const bgType = settings.background.type;
    const bgValue = settings.background.value;

    // 计算包含边距的总尺寸
    const totalWidth = selectionBox.width + margin * 2;
    const totalHeight = selectionBox.height + margin * 2;

    const recordCanvas = document.createElement("canvas");
    recordCanvas.width = totalWidth;
    recordCanvas.height = totalHeight;
    recordCanvasRef.current = recordCanvas;
    const ctx = recordCanvas.getContext("2d");

    // 加载背景图
    let bgImage = null;
    if (bgType === "image" && bgValue) {
      bgImage = new Image();
      bgImage.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        bgImage.onload = resolve;
        bgImage.onerror = reject;
        bgImage.src = bgValue;
      });
    }

    // 如果启用了摄像头，初始化摄像头
    if (camera.enabled) {
      const stream = await startVideo(camera.deviceId);
      if (stream) {
        cameraStreamRef.current = stream;
        const video = document.createElement("video");
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            video.play();
            resolve();
          };
        });
        videoRef.current = video;
      }
    }

    const captureFrame = () => {
      if (!isCapturingRef.current) return;

      // 清空画布
      ctx.clearRect(0, 0, totalWidth, totalHeight);

      // 绘制背景
      if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, totalWidth, totalHeight);
      } else {
        ctx.fillStyle = bgValue || "#f5f5f5";
        ctx.fillRect(0, 0, totalWidth, totalHeight);
      }

      // 直接获取 Excalidraw 的 canvas
      const excalidrawCanvas = document.querySelector(
        ".excalidraw canvas:last-of-type",
      );
      if (!excalidrawCanvas) return;

      const containerRect = excalidrawCanvas.getBoundingClientRect();

      // 计算 selectionBox 相对于 canvas 的偏移
      const scaleX = excalidrawCanvas.width / containerRect.width;
      const scaleY = excalidrawCanvas.height / containerRect.height;

      const srcX = (selectionBox.x - containerRect.left) * scaleX;
      const srcY = (selectionBox.y - containerRect.top) * scaleY;
      const srcW = selectionBox.width * scaleX;
      const srcH = selectionBox.height * scaleY;

      // 在边距位置绘制录制内容
      ctx.drawImage(
        excalidrawCanvas,
        srcX,
        srcY,
        srcW,
        srcH,
        margin,
        margin,
        selectionBox.width,
        selectionBox.height,
      );

      // 绘制摄像头画面
      if (camera.enabled && videoRef.current) {
        drawCameraToCanvas(ctx, totalWidth, totalHeight);
      }

      // 绘制鼠标指示器
      const relX = mousePosRef.current.x - selectionBox.x + margin;
      const relY = mousePosRef.current.y - selectionBox.y + margin;

      if (
        relX >= margin &&
        relX <= margin + selectionBox.width &&
        relY >= margin &&
        relY <= margin + selectionBox.height
      ) {
        ctx.beginPath();
        ctx.arc(relX, relY, 12, 0, Math.PI * 2);
        const highlightColor = mouseEffect.enabled
          ? mouseEffect.color
          : "#ffeb3b";
        ctx.fillStyle = highlightColor + "e6";
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(captureFrame);
    };

    isCapturingRef.current = true;
    captureFrame();

    const stream = recordCanvas.captureStream(60);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
    });

    chunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      isCapturingRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // 停止摄像头
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
      videoRef.current = null;

      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `whiteboard-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      }
      setRecordingStep("idle");
    };

    mediaRecorder.start(1000);
    mediaRecorderRef.current = mediaRecorder;
    setRecordingStep("recording");
  }, [
    selectionBox,
    mouseEffect,
    settings,
    camera,
    startVideo,
    drawCameraToCanvas,
  ]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    isCapturingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // 清理摄像头
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    videoRef.current = null;
    setRecordingStep("idle");
  }, []);

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
    };
  }, []);

  // 监听 ready 状态，启动录制
  useEffect(() => {
    if (recordingStep === "ready") {
      startRecording();
    }
  }, [recordingStep, startRecording]);

  const handleRecordClick = useCallback(() => {
    if (recordingStep === "idle") {
      handleStartSelect();
    } else if (recordingStep === "selecting") {
      setRecordingStep("ready");
    } else if (recordingStep === "ready" || recordingStep === "recording") {
      stopRecording();
    }
  }, [recordingStep, handleStartSelect, stopRecording]);

  useEffect(() => {
    const handleResize = () => {
      if (selectionBox && recordingStep === "selecting") {
        setSelectionBox((prev) => ({
          ...prev,
          x: Math.min(prev.x, window.innerWidth - prev.width),
          y: Math.min(prev.y, window.innerHeight - prev.height),
        }));
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectionBox, recordingStep]);

  useEffect(() => {
    if (recordingStep !== "recording") return;
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [recordingStep]);

  return (
    <div className="app">
      <Toolbar
        onSettingsClick={() => setShowSettings(!showSettings)}
        onTeleprompterClick={() => {}}
        onRecordClick={handleRecordClick}
        recordingStep={recordingStep}
        hasTeleprompterContent={teleprompterContent.trim().length > 0}
      />

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      <Teleprompter
        content={teleprompterContent}
        onContentChange={setTeleprompterContent}
      />

      {recordingStep === "recording" && (
        <CursorIndicator
          position={mousePos}
          color={mouseEffect.enabled ? mouseEffect.color : "#ffeb3b"}
        />
      )}

      <SelectionBox
        box={
          selectionBox ? { ...selectionBox, onChange: handleBoxChange } : null
        }
        recordingStep={recordingStep}
        cornerRadius={cornerRadius}
        aspectRatio={aspectRatio}
        onCancel={handleCancelSelect}
      />

      {/* 在选择区域时显示摄像头预览 */}
      {(recordingStep === "selecting" || recordingStep === "recording") && (
        <CameraPreview
          enabled={camera.enabled}
          stream={cameraStreamRef.current}
          shape={camera.shape}
          size={camera.size}
          position={camera.position}
          offsetX={camera.offsetX}
          offsetY={camera.offsetY}
          selectionBox={selectionBox}
        />
      )}

      <main className="canvas-container">
        <Excalidraw
          excalidrawAPI={(api) => {
            excalidrawRef.current = api;
          }}
          langCode="zh-CN"
        />
      </main>
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppWithSettings />
    </SettingsProvider>
  );
}

export default App;
