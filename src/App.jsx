/**
 * 白板应用主组件
 * 基于 Excalidraw 的带提词器和屏幕录制功能的白板应用
 */
import { useRef, useState, useCallback, useEffect } from "react";
import {
  Excalidraw,
  convertToExcalidrawElements,
  sceneCoordsToViewportCoords,
} from "@excalidraw/excalidraw";
import {
  Input,
  Output,
  Mp4OutputFormat,
  BufferTarget,
  Conversion,
  BlobSource,
  WEBM,
} from "mediabunny";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import SettingsModal from "./components/Settings/SettingsModal";
import Toolbar from "./components/Toolbar/Toolbar";
import Teleprompter from "./components/Teleprompter/Teleprompter";
import SelectionBox from "./components/SelectionBox/SelectionBox";
import CursorIndicator from "./components/CursorIndicator/CursorIndicator";
import SlideToolbar from "./components/SlideToolbar/SlideToolbar";
import { useMediaDevices } from "./hooks/useMediaDevices";
import CameraPreview from "./components/CameraPreview/CameraPreview";
import "./App.css";

function AppWithSettings() {
  const { settings, updateSetting } = useSettings();
  const { mouseEffect, aspectRatio, cornerRadius, camera, microphone, theme } =
    settings;
  const { enumerateDevices, startVideo, stopVideo } = useMediaDevices();

  const excalidrawRef = useRef(null);
  const [recordingStep, setRecordingStep] = useState("idle");
  const [selectionBox, setSelectionBox] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });

  const [showSettings, setShowSettings] = useState(false);
  const [teleprompterContent, setTeleprompterContent] = useState("");
  const [teleprompterVisible, setTeleprompterVisible] = useState(false);

  // 演讲页状态
  const [slides, setSlides] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);

  // 记录上一次 slides 长度，用于检测新增
  const prevSlidesLengthRef = useRef(slides.length);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isCapturingRef = useRef(false);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const audioStreamRef = useRef(null);
  const videoTrackRef = useRef(null);

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

  // 计算演讲页尺寸 - 根据画面比例返回固定尺寸
  const calculateSlideSize = useCallback(() => {
    // 固定尺寸映射表
    const sizeMap = {
      "16:9": { width: 1920, height: 1080 },
      "4:3": { width: 1280, height: 960 },
      "3:4": { width: 960, height: 1280 },
      "9:16": { width: 1080, height: 1920 },
      "1:1": { width: 800, height: 800 },
    };

    // 根据当前画面比例返回对应尺寸，默认 16:9
    return sizeMap[aspectRatio] || sizeMap["16:9"];
  }, [aspectRatio]);

  // 生成随机 ID
  const generateId = () => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

  // 创建演讲页 Frame 元素
  const createSlideElement = useCallback(
    (slideInfo) => {
      const { width, height } = calculateSlideSize();
      const frameData = {
        type: "frame",
        id: slideInfo.id,
        width: slideInfo.width || width,
        height: slideInfo.height || height,
        name: slideInfo.name,
        children: [],
      };
      const elements = convertToExcalidrawElements([frameData], {
        regenerateIds: false,
      });
      // 转换后再手动设置位置
      if (elements[0]) {
        elements[0].x = slideInfo.x;
        elements[0].y = slideInfo.y;
      }
      return elements[0];
    },
    [calculateSlideSize],
  );

  // 删除演讲页
  const handleDeleteSlide = useCallback(
    (index) => {
      if (!excalidrawRef.current) return;

      const pageToDelete = index !== undefined ? index : currentPage;

      // 通过索引获取画布上的 frame 元素
      const elements = excalidrawRef.current.getSceneElements();
      const frameElements = elements.filter((el) => el.type === "frame");
      const frameToDelete = frameElements[pageToDelete];

      if (!frameToDelete) return;

      // 从 Excalidraw 中删除 frame 元素
      const updatedElements = elements.map((el) => {
        if (el.id === frameToDelete.id) {
          return { ...el, isDeleted: true };
        }
        return el;
      });
      excalidrawRef.current.updateScene({ elements: updatedElements });

      // 更新演讲页数组
      const newSlides = slides.filter((_, idx) => idx !== pageToDelete);
      setSlides(newSlides);

      // 调整当前页码
      const newCurrentPage =
        pageToDelete <= currentPage ? currentPage - 1 : currentPage;
      setCurrentPage(Math.max(0, newCurrentPage));
    },
    [slides, currentPage],
  );

  // 翻页到指定页
  const scrollToPage = useCallback(
    (pageIndex) => {
      console.log(pageIndex + "," + slides.length);
      if (!excalidrawRef.current || pageIndex < 0 || pageIndex >= slides.length)
        return;

      const slide = slides[pageIndex];

      // 先设置当前页码
      setCurrentPage(pageIndex);
      // 获取画布中的所有 frame 元素
      const elements = excalidrawRef.current.getSceneElements();
      const frameElement = elements.filter(
        (el) => el.type === "frame" && el.id === slide.id,
      );

      if (frameElement && frameElement[0]) {
        // 使用 scrollToContent 自动滚动并缩放
        excalidrawRef.current.scrollToContent([frameElement[0]], {
          fitToContent: true,
          animate: true, // 是否动画
          duration: 500, // 动画时长
        });
      }
    },
    [slides, selectionBox],
  );

  // 选择演讲页 - 定位到画布对应位置
  const handleSelectSlide = useCallback(
    (index) => {
      scrollToPage(index);
    },
    [scrollToPage],
  );

  // 监听 slides 变化，新增演讲页时自动滚动到最后一个
  useEffect(() => {
    // 检测是否新增了演讲页
    if (slides.length > prevSlidesLengthRef.current && slides.length > 0) {
      // 滚动到最后一个演讲页
      handleSelectSlide(slides.length - 1);
    }
    // 更新记录的长度
    prevSlidesLengthRef.current = slides.length;
  }, [slides, handleSelectSlide]);

  // 添加演讲页
  const handleAddSlide = useCallback(() => {
    if (!excalidrawRef.current) return;

    const { width, height } = calculateSlideSize();
    const gap = 80;

    let newX = 100;
    // 从 React 状态中获取最后一个演讲页的位置
    if (slides.length > 0) {
      const lastSlide = slides[slides.length - 1];
      newX = lastSlide.x + lastSlide.width + gap;
    }

    const newSlide = {
      id: generateId(),
      name: `演讲页 ${slides.length + 1}`,
      x: newX,
      y: 100,
      width: width,
      height: height,
    };

    const frameElement = createSlideElement(newSlide);

    // 获取现有元素并追加新元素
    const existingElements = excalidrawRef.current.getSceneElements();
    excalidrawRef.current.updateScene({
      elements: [...existingElements, frameElement],
    });

    // 更新演讲页状态
    setSlides((prev) => [...prev, newSlide]);
  }, [slides, calculateSlideSize, createSlideElement]);

  // 重新排序演讲页
  const handleReorderSlides = useCallback((newOrder) => {
    setSlides(newOrder);
    setCurrentPage(0);
  }, []);

  // 上一页
  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      scrollToPage(currentPage - 1);
    }
  }, [currentPage, scrollToPage]);

  // 下一页
  const handleNextPage = useCallback(() => {
    if (currentPage < slides.length - 1) {
      scrollToPage(currentPage + 1);
    }
  }, [currentPage, slides.length, scrollToPage]);

  // 键盘快捷键处理
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

  const handleStartSelect = useCallback(async () => {
    // 如果有演讲页，自动定位到第一个演讲页
    if (slides.length > 0) {
      // 滚动到第一个演讲页
      scrollToPage(0);
      setTimeout(() => {
        const firstSlide = slides[0];
        // 从画布上获取第一个演讲页对应的 frame 元素的实际位置
        const elements = excalidrawRef.current?.getSceneElements() || [];
        const firstFrame = elements.find((el) => el.id === firstSlide.id);

        if (firstFrame) {
          // 获取 appState
          const appState = excalidrawRef.current.getAppState();

          // 使用 Excalidraw API 将场景坐标转换为视口坐标
          const topLeft = sceneCoordsToViewportCoords(
            { sceneX: firstFrame.x, sceneY: firstFrame.y },
            appState,
          );
          const bottomRight = sceneCoordsToViewportCoords(
            {
              sceneX: firstFrame.x + firstFrame.width,
              sceneY: firstFrame.y + firstFrame.height,
            },
            appState,
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
            locked: true, // 锁定录制区域
          });
        } else {
          // 如果画布上找不到，使用 slides 状态中的位置
          setSelectionBox({
            x: firstSlide.x,
            y: firstSlide.y,
            width: firstSlide.width,
            height: firstSlide.height,
            locked: true,
          });
        }
      }, 500);
    } else {
      initSelectionBox();
    }

    // 如果启用了摄像头，在选择区域时就开始预览
    if (camera.enabled) {
      const stream = await startVideo(camera.deviceId);
      if (stream) {
        cameraStreamRef.current = stream;
      }
    }
    setRecordingStep("selecting");
  }, [initSelectionBox, camera, startVideo, slides, scrollToPage]);

  const handleCancelSelect = useCallback(() => {
    setSelectionBox(null);
    setRecordingStep("idle");
    // 取消选择时停止摄像头预览
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    // 重置演讲页状态
    if (slides.length > 0) {
      setCurrentPage(0);
      scrollToPage(0);
    }
  }, [slides, scrollToPage]);

  const handleBoxChange = useCallback((newBox) => {
    setSelectionBox(newBox);
  }, []);

  const startRecording = useCallback(async () => {
    if (!selectionBox || !excalidrawRef.current) return;

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

    const recordCanvas = document.createElement("canvas");
    recordCanvas.width = totalWidth;
    recordCanvas.height = totalHeight;
    recordCanvasRef.current = recordCanvas;
    const ctx = recordCanvas.getContext("2d");

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

      // 直接绘制到 (0, 0)，使用录制画布的目标尺寸
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

      // 绘制摄像头画面
      if (camera.enabled && videoRef.current) {
        drawCameraToCanvas(ctx, totalWidth, totalHeight);
      }

      // 绘制鼠标指示器
      // 计算鼠标相对于 selectionBox 的位置
      const relX = mousePosRef.current.x - selectionBox.x;
      const relY = mousePosRef.current.y - selectionBox.y;

      // 检查鼠标是否在 selectionBox 范围内
      if (
        relX >= 0 &&
        relX <= selectionBox.width &&
        relY >= 0 &&
        relY <= selectionBox.height
      ) {
        // 按比例缩放鼠标位置到录制画布尺寸
        const scaledX = (relX / selectionBox.width) * totalWidth;
        const scaledY = (relY / selectionBox.height) * totalHeight;

        ctx.beginPath();
        ctx.arc(scaledX, scaledY, 12, 0, Math.PI * 2);
        const highlightColor = mouseEffect.enabled
          ? mouseEffect.color
          : "#ffeb3b";
        ctx.fillStyle = highlightColor + "e6";
        ctx.fill();
      }

      // 手动触发帧捕获，确保每一帧都被正确录制
      if (videoTrackRef.current && typeof videoTrackRef.current.requestFrame === 'function') {
        videoTrackRef.current.requestFrame();
      }

      animationFrameRef.current = requestAnimationFrame(captureFrame);
    };

    isCapturingRef.current = true;
    captureFrame();

    // 创建视频流（手动模式，由开发者控制帧捕获）
    const stream = recordCanvas.captureStream(0);

    // 获取视频轨道并保存引用，用于手动触发帧
    const videoTrack = stream.getVideoTracks()[0];
    videoTrackRef.current = videoTrack;

    // 如果启用了麦克风，添加音频轨道
    if (microphone.enabled) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: microphone.deviceId
            ? { deviceId: { exact: microphone.deviceId } }
            : true,
        });
        audioStreamRef.current = audioStream;
        // 将音频轨道添加到视频流
        audioStream.getAudioTracks().forEach((track) => {
          stream.addTrack(track);
        });
      } catch (err) {
        console.warn("获取麦克风失败:", err);
      }
    }

    const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
    const mimeType = isApple
      ? "video/webm;codecs=vp8"
      : "video/webm;codecs=vp9";

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 10_000_000,
    });

    chunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

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

      if (chunksRef.current.length > 0) {
        const webmBlob = new Blob(chunksRef.current, { type: "video/webm" });

        try {
          const input = new Input({
            source: new BlobSource(webmBlob),
            formats: [WEBM],
          });
          const output = new Output({
            format: new Mp4OutputFormat(),
            target: new BufferTarget(),
          });

          const conversion = await Conversion.init({ input, output });
          await conversion.execute();

          const mp4Buffer = output.target.buffer;
          const mp4Blob = new Blob([mp4Buffer], { type: "video/mp4" });

          const url = URL.createObjectURL(mp4Blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `whiteboard-${Date.now()}.mp4`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("视频转换失败:", error);
          const url = URL.createObjectURL(webmBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `whiteboard-${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }
      setRecordingStep("idle");
    };

    mediaRecorder.start(100);
    mediaRecorderRef.current = mediaRecorder;
    setRecordingStep("recording");
  }, [
    selectionBox,
    mouseEffect,
    camera,
    startVideo,
    drawCameraToCanvas,
    slides,
    calculateSlideSize,
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

  // 监听 ready 状态，启动录制
  useEffect(() => {
    if (recordingStep === "ready") {
      startRecording();
    }
  }, [recordingStep, startRecording]);

  // 同步主题到 html 元素
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // 页面打开时申请摄像头和麦克风权限
  useEffect(() => {
    const initDevices = async () => {
      try {
        await enumerateDevices();

        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some((d) => d.kind === "videoinput");
        const hasAudio = devices.some((d) => d.kind === "audioinput");

        if (hasVideo || hasAudio) {
          try {
            await navigator.mediaDevices.getUserMedia({
              video: hasVideo,
              audio: hasAudio,
            });
            await enumerateDevices();
          } catch (e) {
            console.error("申请权限失败:", e);
          }
        }
      } catch (err) {
        console.warn("获取设备列表失败:", err.message);
      }
    };
    initDevices();
  }, [enumerateDevices]);

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
        theme={theme}
        onSettingsClick={() => setShowSettings(!showSettings)}
        onTeleprompterClick={() => setTeleprompterVisible(!teleprompterVisible)}
        onRecordClick={handleRecordClick}
        recordingStep={recordingStep}
        hasTeleprompterContent={teleprompterContent.trim().length > 0}
      />

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

      {showSettings && (
        <SettingsModal theme={theme} onClose={() => setShowSettings(false)} />
      )}

      <Teleprompter
        theme={theme}
        isVisible={teleprompterVisible}
        onClose={() => setTeleprompterVisible(false)}
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
          theme={theme}
          viewBackgroundColor={theme === "dark" ? "#1a1a1a" : "#ffffff"}
          onChange={(elements, appState) => {
            if (appState.theme && appState.theme !== theme) {
              updateSetting("theme", appState.theme);
            }
          }}
          langCode="zh-CN"
          UIOptions={{
            canvasActions: {
              toggleTheme: true,
            },
          }}
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
