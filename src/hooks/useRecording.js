/**
 * 录制管理 Hook
 * 提供屏幕录制、摄像头绘制、选择区域等功能
 */
import { useState, useCallback, useEffect, useRef } from "react"
import { sceneCoordsToViewportCoords } from "@excalidraw/excalidraw"
import { getSupportedMimeType, smartConvertVideo } from "../utils/videoUtils"
import { useMediaDevices } from "./useMediaDevices"

/**
 * 录制管理 Hook
 * @param {Object} options - 配置选项
 * @param {React.RefObject} options.excalidrawRef - Excalidraw API 引用
 * @param {Object} options.settings - 设置对象
 * @param {React.MutableRefObject} options.slidesRef - 演讲页数组的 ref
 * @param {React.MutableRefObject} options.getSlideSizeRef - 获取演讲页尺寸函数的 ref
 * @param {React.MutableRefObject} options.scrollToPageRef - 翻页函数的 ref
 * @returns {Object} 录制状态和操作函数
 */
export const useRecording = ({
  excalidrawRef,
  settings,
  slidesRef,
  getSlideSizeRef,
  scrollToPageRef,
}) => {
  const { mouseEffect, aspectRatio, cornerRadius, camera, microphone } = settings
  const { startVideo } = useMediaDevices()

  // 录制状态
  const [recordingStep, setRecordingStep] = useState("idle")
  const [selectionBox, setSelectionBox] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Refs
  const mousePosRef = useRef({ x: 0, y: 0 })
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const recordCanvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const isCapturingRef = useRef(false)
  const videoRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const audioStreamRef = useRef(null)
  const videoTrackRef = useRef(null)

  // 视图锁定相关 Refs
  const lockedViewStateRef = useRef(null)
  const isPageTurningRef = useRef(false)

  /**
   * 绘制摄像头画面到画布
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {number} canvasWidth - 画布宽度
   * @param {number} canvasHeight - 画布高度
   */
  const drawCameraToCanvas = useCallback(
    (ctx, canvasWidth, canvasHeight) => {
      if (!videoRef.current || videoRef.current.readyState < 2) return

      const video = videoRef.current
      const { size, shape, position } = camera

      // 计算摄像头位置
      let x, y
      const offsetX = 20
      const offsetY = 20

      switch (position) {
        case "top-left":
          x = offsetX
          y = offsetY
          break
        case "top-right":
          x = canvasWidth - size - offsetX
          y = offsetY
          break
        case "bottom-left":
          x = offsetX
          y = canvasHeight - size - offsetY
          break
        case "bottom-right":
        default:
          x = canvasWidth - size - offsetX
          y = canvasHeight - size - offsetY
          break
      }

      // 保存当前上下文
      ctx.save()

      // 创建裁剪区域
      ctx.beginPath()
      if (shape === "circle") {
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
      } else {
        ctx.rect(x, y, size, size)
      }
      ctx.clip()

      // 绘制摄像头画面
      // 保持视频比例，进行覆盖填充
      const videoRatio = video.videoWidth / video.videoHeight
      let drawWidth = size
      let drawHeight = size / videoRatio

      if (drawHeight < size) {
        drawHeight = size
        drawWidth = size * videoRatio
      }

      const drawX = x + (size - drawWidth) / 2
      const drawY = y + (size - drawHeight) / 2

      ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight)

      ctx.restore()
    },
    [camera],
  )

  /**
   * 初始化选择框
   */
  const initSelectionBox = useCallback(() => {
    let ratio = 16 / 9
    if (aspectRatio && aspectRatio.includes(":")) {
      const [w, h] = aspectRatio.split(":").map(Number)
      if (w && h) {
        ratio = w / h
      }
    }

    const maxWidth = window.innerWidth * 0.7
    const maxHeight = window.innerHeight * 0.7

    let width, height
    if (maxWidth / maxHeight > ratio) {
      height = maxHeight
      width = height * ratio
    } else {
      width = maxWidth
      height = width / ratio
    }

    width = Math.max(width, 200)
    height = Math.max(height, 150)

    const x = (window.innerWidth - width) / 2
    const y = (window.innerHeight - height) / 2

    setSelectionBox({ x, y, width, height })
  }, [aspectRatio])

  /**
   * 开始选择区域
   */
  const handleStartSelect = useCallback(async () => {
    // 如果有演讲页，自动定位到第一个演讲页
    const currentSlides = slidesRef.current
    if (currentSlides.length > 0) {
      // 滚动到第一个演讲页
      scrollToPageRef.current(0)
      setTimeout(() => {
        const firstSlide = currentSlides[0]
        // 从画布上获取第一个演讲页对应的 frame 元素的实际位置
        const elements = excalidrawRef.current?.getSceneElements() || []
        const firstFrame = elements.find((el) => el.id === firstSlide.id)

        if (firstFrame) {
          // 获取 appState
          const appState = excalidrawRef.current.getAppState()

          // 使用 Excalidraw API 将场景坐标转换为视口坐标
          const topLeft = sceneCoordsToViewportCoords(
            { sceneX: firstFrame.x, sceneY: firstFrame.y },
            appState,
          )
          const bottomRight = sceneCoordsToViewportCoords(
            {
              sceneX: firstFrame.x + firstFrame.width,
              sceneY: firstFrame.y + firstFrame.height,
            },
            appState,
          )

          // 计算屏幕上的位置和大小
          const screenX = topLeft.x
          const screenY = topLeft.y
          const screenWidth = bottomRight.x - topLeft.x
          const screenHeight = bottomRight.y - topLeft.y

          setSelectionBox({
            x: screenX,
            y: screenY,
            width: screenWidth,
            height: screenHeight,
            locked: true, // 锁定录制区域
          })

          // 保存视图状态（演讲模式下，滚动完成后保存）
          lockedViewStateRef.current = {
            scrollX: appState.scrollX,
            scrollY: appState.scrollY,
            zoom: appState.zoom.value,
          }
        } else {
          // 如果画布上找不到，使用 slides 状态中的位置
          setSelectionBox({
            x: firstSlide.x,
            y: firstSlide.y,
            width: firstSlide.width,
            height: firstSlide.height,
            locked: true,
          })
        }
      }, 500)
    } else {
      // 非演讲模式，直接保存当前视图状态
      if (excalidrawRef.current) {
        const appState = excalidrawRef.current.getAppState()
        lockedViewStateRef.current = {
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
          zoom: appState.zoom.value,
        }
      }
      initSelectionBox()
    }

    // 如果启用了摄像头，在选择区域时就开始预览
    if (camera.enabled) {
      const stream = await startVideo(camera.deviceId)
      if (stream) {
        cameraStreamRef.current = stream
      }
    }
    setRecordingStep("selecting")
  }, [initSelectionBox, camera, startVideo, slidesRef, scrollToPageRef, excalidrawRef])

  /**
   * 取消选择
   */
  const handleCancelSelect = useCallback(() => {
    setSelectionBox(null)
    setRecordingStep("idle")
    // 取消选择时停止摄像头预览
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = null
    }
    // 重置演讲页状态
    if (slidesRef.current.length > 0) {
      scrollToPageRef.current(0)
    }
  }, [slidesRef, scrollToPageRef])

  /**
   * 选择框变化处理
   * @param {Object} newBox - 新的选择框
   */
  const handleBoxChange = useCallback((newBox) => {
    setSelectionBox(newBox)
  }, [])

  /**
   * 开始录制
   */
  const startRecording = useCallback(async () => {
    if (!selectionBox || !excalidrawRef.current) return

    // 判断是否为演示模式
    const isPresentationMode = slidesRef.current.length > 0

    // 保存录制开始时的视图状态
    const appState = excalidrawRef.current.getAppState()
    lockedViewStateRef.current = {
      scrollX: appState.scrollX,
      scrollY: appState.scrollY,
      zoom: appState.zoom.value,
    }

    // 根据模式决定视频输出尺寸
    let totalWidth, totalHeight
    if (isPresentationMode) {
      // 演示模式：使用演示页的固定尺寸
      const slideSize = getSlideSizeRef.current()
      totalWidth = slideSize.width
      totalHeight = slideSize.height
    } else {
      // 非演示模式：使用 selectionBox 的实际尺寸
      totalWidth = selectionBox.width
      totalHeight = selectionBox.height
    }

    const recordCanvas = document.createElement("canvas")
    recordCanvas.width = totalWidth
    recordCanvas.height = totalHeight
    recordCanvasRef.current = recordCanvas
    const ctx = recordCanvas.getContext("2d")

    // 如果启用了摄像头，初始化摄像头
    if (camera.enabled) {
      const stream = await startVideo(camera.deviceId)
      if (stream) {
        cameraStreamRef.current = stream
        const video = document.createElement("video")
        video.srcObject = stream
        video.autoplay = true
        video.muted = true
        video.playsInline = true
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            video.play()
            resolve()
          }
        })
        videoRef.current = video
      }
    }

    const captureFrame = () => {
      if (!isCapturingRef.current) return

      // 清空画布
      ctx.clearRect(0, 0, totalWidth, totalHeight)

      // 直接获取 Excalidraw 的 canvas
      const excalidrawCanvas = document.querySelector(
        ".excalidraw canvas:last-of-type",
      )
      if (!excalidrawCanvas) return

      const containerRect = excalidrawCanvas.getBoundingClientRect()

      // 计算 selectionBox 相对于 canvas 的偏移
      const scaleX = excalidrawCanvas.width / containerRect.width
      const scaleY = excalidrawCanvas.height / containerRect.height

      const srcX = (selectionBox.x - containerRect.left) * scaleX
      const srcY = (selectionBox.y - containerRect.top) * scaleY
      const srcW = selectionBox.width * scaleX
      const srcH = selectionBox.height * scaleY

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
      )

      // 绘制摄像头画面
      if (camera.enabled && videoRef.current) {
        drawCameraToCanvas(ctx, totalWidth, totalHeight)
      }

      // 绘制鼠标指示器
      // 计算鼠标相对于 selectionBox 的位置
      const relX = mousePosRef.current.x - selectionBox.x
      const relY = mousePosRef.current.y - selectionBox.y

      // 检查鼠标是否在 selectionBox 范围内
      if (
        relX >= 0 &&
        relX <= selectionBox.width &&
        relY >= 0 &&
        relY <= selectionBox.height
      ) {
        // 按比例缩放鼠标位置到录制画布尺寸
        const scaledX = (relX / selectionBox.width) * totalWidth
        const scaledY = (relY / selectionBox.height) * totalHeight

        ctx.beginPath()
        ctx.arc(scaledX, scaledY, 12, 0, Math.PI * 2)
        const highlightColor = mouseEffect.enabled
          ? mouseEffect.color
          : "#ffeb3b"
        ctx.fillStyle = highlightColor + "e6"
        ctx.fill()
      }

      // 手动触发帧捕获，确保每一帧都被正确录制
      if (videoTrackRef.current && typeof videoTrackRef.current.requestFrame === 'function') {
        videoTrackRef.current.requestFrame()
      }

      animationFrameRef.current = requestAnimationFrame(captureFrame)
    }

    isCapturingRef.current = true
    captureFrame()

    // 创建视频流（手动模式，由开发者控制帧捕获）
    const stream = recordCanvas.captureStream(0)

    // 获取视频轨道并保存引用，用于手动触发帧
    const videoTrack = stream.getVideoTracks()[0]
    videoTrackRef.current = videoTrack

    // 如果启用了麦克风，添加音频轨道
    if (microphone.enabled) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: microphone.deviceId
            ? { deviceId: { exact: microphone.deviceId } }
            : true,
        })
        audioStreamRef.current = audioStream
        // 将音频轨道添加到视频流
        audioStream.getAudioTracks().forEach((track) => {
          stream.addTrack(track)
        })
      } catch (err) {
        console.warn("获取麦克风失败:", err)
      }
    }

    // 获取浏览器支持的最佳 MIME 类型（优先 H264）
    const mimeType = getSupportedMimeType()

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 10_000_000,
    })

    chunksRef.current = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      isCapturingRef.current = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // 清理视频轨道引用
      videoTrackRef.current = null

      // 停止摄像头
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop())
        cameraStreamRef.current = null
      }
      videoRef.current = null

      // 停止麦克风
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop())
        audioStreamRef.current = null
      }

      if (chunksRef.current.length > 0) {
        const webmBlob = new Blob(chunksRef.current, { type: "video/webm" })

        try {
          // 使用智能转换，确保输出 H264 编码的 MP4
          const { blob, filename } = await smartConvertVideo(webmBlob)

          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = filename
          a.click()
          URL.revokeObjectURL(url)
        } catch (error) {
          console.error("视频转换失败:", error)
          // 降级：下载原始 WebM 文件
          const url = URL.createObjectURL(webmBlob)
          const a = document.createElement("a")
          a.href = url
          a.download = `whiteboard-${Date.now()}.webm`
          a.click()
          URL.revokeObjectURL(url)
        }
      }
      setRecordingStep("idle")
    }

    mediaRecorder.start(100)
    mediaRecorderRef.current = mediaRecorder
    setRecordingStep("recording")
  }, [
    selectionBox,
    mouseEffect,
    camera,
    microphone,
    startVideo,
    drawCameraToCanvas,
    slidesRef,
    getSlideSizeRef,
    excalidrawRef,
  ])

  /**
   * 停止录制
   */
  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop()
    }
    isCapturingRef.current = false
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    // 清理摄像头
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = null
    }
    videoRef.current = null
    // 清除视图锁定状态
    lockedViewStateRef.current = null
    isPageTurningRef.current = false
    setRecordingStep("idle")
  }, [])

  /**
   * 更新锁定的视图状态（翻页后调用）
   * @param {Object} newViewState - 新的视图状态
   */
  const updateLockedViewState = useCallback((newViewState) => {
    lockedViewStateRef.current = newViewState
  }, [])

  /**
   * 设置翻页状态标记
   * @param {boolean} isTurning - 是否正在翻页
   */
  const setIsPageTurning = useCallback((isTurning) => {
    isPageTurningRef.current = isTurning
  }, [])

  /**
   * 录制按钮点击处理
   */
  const handleRecordClick = useCallback(() => {
    if (recordingStep === "idle") {
      handleStartSelect()
    } else if (recordingStep === "selecting") {
      setRecordingStep("ready")
    } else if (recordingStep === "ready" || recordingStep === "recording") {
      stopRecording()
    }
  }, [recordingStep, handleStartSelect, stopRecording])

  // 清理 effect
  useEffect(() => {
    return () => {
      isCapturingRef.current = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      // 清理视频轨道引用
      videoTrackRef.current = null
      // 清理摄像头
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      // 清理麦克风
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // 监听 ready 状态，启动录制
  useEffect(() => {
    if (recordingStep === "ready") {
      startRecording()
    }
  }, [recordingStep, startRecording])

  // 窗口调整 effect
  useEffect(() => {
    const handleResize = () => {
      if (selectionBox && recordingStep === "selecting") {
        setSelectionBox((prev) => ({
          ...prev,
          x: Math.min(prev.x, window.innerWidth - prev.width),
          y: Math.min(prev.y, window.innerHeight - prev.height),
        }))
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [selectionBox, recordingStep])

  // 鼠标追踪 effect
  useEffect(() => {
    if (recordingStep !== "recording") return
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
      mousePosRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [recordingStep])

  return {
    // 状态
    recordingStep,
    selectionBox,
    mousePos,
    cameraStream: cameraStreamRef.current,
    // 视图锁定相关
    lockedViewState: lockedViewStateRef.current,
    isPageTurning: isPageTurningRef.current,
    // 操作函数
    handleRecordClick,
    handleCancelSelect,
    handleBoxChange,
    setRecordingStep,
    // 视图锁定操作函数
    updateLockedViewState,
    setIsPageTurning,
  }
}
