/**
 * 白板应用主组件
 * 基于 Excalidraw 的带提词器和屏幕录制功能的白板应用
 */
import { useRef, useState, useCallback, useEffect } from "react";
import {
  Excalidraw,
  convertToExcalidrawElements,
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

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isCapturingRef = useRef(false);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const audioStreamRef = useRef(null);

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

  // 计算演讲页尺寸
  const calculateSlideSize = useCallback(() => {
    const ratio = (() => {
      if (aspectRatio && aspectRatio.includes(":")) {
        const [w, h] = aspectRatio.split(":").map(Number);
        if (w && h) return w / h;
      }
      return 16 / 9;
    })();

    const slideWidth = window.innerWidth * 0.6;
    const slideHeight = slideWidth / ratio;
    return { width: slideWidth, height: slideHeight };
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
        id: slideInfo.frameId,
        width: slideInfo.width || width,
        height: slideInfo.height || height,
        name: slideInfo.name,
        children: [],
      };
      const elements = convertToExcalidrawElements([frameData]);
      // 转换后再手动设置位置
      if (elements[0]) {
        elements[0].x = slideInfo.x;
        elements[0].y = slideInfo.y;
      }
      return elements[0];
    },
    [calculateSlideSize],
  );

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
      frameId: generateId(),
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

    setSlides((prev) => [...prev, newSlide]);
    setCurrentPage((prev) => prev);
  }, [slides, calculateSlideSize, createSlideElement]);

  // 删除演讲页
  const handleDeleteSlide = useCallback(
    (index) => {
      if (!excalidrawRef.current) return;

      // 使用传入的 index 或当前的 currentPage
      const pageToDelete = index !== undefined ? index : 0;

      setSlides((prevSlides) => {
        if (prevSlides.length <= 1) return prevSlides;

        const slideToDelete = prevSlides[pageToDelete];
        if (!slideToDelete) return prevSlides;

        // 从 Excalidraw 中删除 frame 元素
        const elements = excalidrawRef.current.getSceneElements();
        const updatedElements = elements.map((el) => {
          if (el.id === slideToDelete.frameId) {
            return { ...el, isDeleted: true };
          }
          return el;
        });
        excalidrawRef.current.updateScene({ elements: updatedElements });

        // 更新演讲页数组
        const newSlides = prevSlides.filter((_, idx) => idx !== pageToDelete);

        // 调整当前页码
        if (pageToDelete >= newSlides.length) {
          setCurrentPage(Math.max(0, newSlides.length - 1));
        } else if (pageToDelete < currentPage) {
          setCurrentPage((prev) => Math.max(0, prev - 1));
        }

        return newSlides;
      });
    },
    [currentPage],
  );

  // 翻页到指定页
  const scrollToPage = useCallback(
    (pageIndex) => {
      if (!excalidrawRef.current || pageIndex < 0 || pageIndex >= slides.length)
        return;

      const slide = slides[pageIndex];
      
      console.log('scrollToPage - slide:', JSON.stringify(slide));
      
      // 先设置当前页码
      setCurrentPage(pageIndex);

      // 获取画布中的所有元素
      const elements = excalidrawRef.current.getSceneElements();
      const frameElements = elements.filter(el => el.type === 'frame');
      console.log('scrollToPage - frame ids on canvas:', frameElements.map(el => el.id));
      console.log('scrollToPage - looking for frameId:', slide.frameId);
      const frameElement = elements.find((el) => el.id === slide.frameId);
      
      console.log('scrollToPage - frameElement:', frameElement ? 'found' : 'NOT FOUND');
      console.log('scrollToPage - elements types:', elements.map(el => el.type));

      if (frameElement) {
        // 如果找到了 frame 元素，使用 Excalidraw 的 scrollToContent API
        excalidrawRef.current.scrollToContent([frameElement], {
          fitToContent: false,
        });
        
        // 额外设置缩放以确保完整显示
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 80;
        const scaleX = (viewportWidth - padding * 2) / frameElement.width;
        const scaleY = (viewportHeight - padding * 2) / frameElement.height;
        const newZoom = Math.min(scaleX, scaleY, 1);
        
        console.log('scrollToPage - calculated zoom:', newZoom);
        
        if (!isNaN(newZoom) && newZoom > 0) {
          excalidrawRef.current.updateScene({
            appState: { zoom: newZoom },
          });
        }
      } else {
        // 如果找不到元素，滚动到存储的坐标位置
        console.log('scrollToPage - sliding to stored position:', slide.x, slide.y);
        
        const defaultSize = calculateSlideSize();
        const x = slide.x || 100;
        const y = slide.y || 100;
        const width = slide.width || defaultSize.width;
        const height = slide.height || defaultSize.height;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 80;
        const scaleX = (viewportWidth - padding * 2) / width;
        const scaleY = (viewportHeight - padding * 2) / height;
        const newZoom = Math.min(scaleX, scaleY, 1);
        
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const scrollX = viewportWidth / 2 - centerX * newZoom;
        const scrollY = viewportHeight / 2 - centerY * newZoom;
        
        console.log('scrollToPage - fallback scroll:', scrollX, scrollY, 'zoom:', newZoom);
        
        excalidrawRef.current.updateScene({
          appState: {
            scrollX: isNaN(scrollX) ? 0 : scrollX,
            scrollY: isNaN(scrollY) ? 0 : scrollY,
            zoom: isNaN(newZoom) ? 1 : newZoom,
          },
        });
      }

      // 录制过程中翻页，自动更新录制区域位置
      if (selectionBox?.locked) {
        setSelectionBox({
          x: slide.x,
          y: slide.y,
          width: slide.width,
          height: slide.height,
          locked: true,
        });
      }
    },
    [slides, selectionBox, calculateSlideSize],
  );

  // 选择演讲页 - 定位到画布对应位置
  const handleSelectSlide = useCallback(
    (index) => {
      scrollToPage(index);
    },
    [scrollToPage],
  );

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

  const handleStartSelect = useCallback(async () => {
    // 如果有演讲页，自动定位到第一个演讲页
    if (slides.length > 0) {
      const firstSlide = slides[0];
      // 将 selectionBox 定位到第一个演讲页的位置
      setSelectionBox({
        x: firstSlide.x,
        y: firstSlide.y,
        width: firstSlide.width,
        height: firstSlide.height,
        locked: true, // 锁定录制区域
      });
      // 滚动到第一个演讲页
      scrollToPage(0);
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

      // 直接使用 canvas 的实际像素尺寸
      const dstW = excalidrawCanvas.width;
      const dstH = excalidrawCanvas.height;

      // 在边距位置绘制录制内容
      ctx.drawImage(
        excalidrawCanvas,
        srcX,
        srcY,
        srcW,
        srcH,
        margin,
        margin,
        dstW,
        dstH,
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

    // 创建视频流
    const stream = recordCanvas.captureStream(60);

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

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
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
        disabled={recordingStep === "recording"}
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
