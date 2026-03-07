/**
 * 白板应用主组件
 * 基于 Excalidraw 的带提词器和屏幕录制功能的白板应用
 */
import { useRef, useState, useCallback, useEffect } from "react"
import { Excalidraw } from "@excalidraw/excalidraw"
import { SettingsProvider, useSettings } from "./contexts/SettingsContext"
import SettingsModal from "./components/Settings/SettingsModal"
import Toolbar from "./components/Toolbar/Toolbar"
import Teleprompter from "./components/Teleprompter/Teleprompter"
import SelectionBox from "./components/SelectionBox/SelectionBox"
import CursorIndicator from "./components/CursorIndicator/CursorIndicator"
import SlideToolbar from "./components/SlideToolbar/SlideToolbar"
import CameraPreview from "./components/CameraPreview/CameraPreview"
import { useSlides } from "./hooks/useSlides"
import { useRecording } from "./hooks/useRecording"
import { useMediaDevices } from "./hooks/useMediaDevices"
import { useExcalidrawStorage } from "./hooks/useExcalidrawStorage"
import "./App.css"

/**
 * 主应用组件（包含 Settings Context）
 */
function AppWithSettings() {
  const { settings, updateSetting } = useSettings()
  const { mouseEffect, aspectRatio, cornerRadius, camera, microphone, theme, language } =
    settings
  const { enumerateDevices } = useMediaDevices()

  // Excalidraw API 引用
  const excalidrawRef = useRef(null)

  // 画布持久化
  const { saveToStorage, loadFromStorage } = useExcalidrawStorage()

  // 设置弹窗状态
  const [showSettings, setShowSettings] = useState(false)

  // 提词器状态
  const [teleprompterContent, setTeleprompterContent] = useState("")
  const [teleprompterVisible, setTeleprompterVisible] = useState(false)

  // 用于解决 useSlides 和 useRecording 之间的循环依赖
  // 使用 ref 传递 slides 相关数据给 useRecording
  const slidesRef = useRef([])
  const getSlideSizeRef = useRef(() => ({ width: 1920, height: 1080 }))
  const scrollToPageRef = useRef(() => {})

  // 使用录制管理 Hook
  const {
    recordingStep,
    selectionBox,
    mousePos,
    cameraStream,
    handleRecordClick,
    handleCancelSelect,
    handleBoxChange,
    // 视图锁定相关
    lockedViewState,
    isPageTurning,
    updateLockedViewState,
    setIsPageTurning,
    // 录制时长
    recordingDuration,
  } = useRecording({
    excalidrawRef,
    settings,
    slidesRef,
    getSlideSizeRef,
    scrollToPageRef,
  })

  /**
   * 翻页开始回调 - 设置翻页状态
   */
  const handlePageTurnStart = useCallback(() => {
    setIsPageTurning(true)
  }, [setIsPageTurning])

  /**
   * 翻页完成回调 - 更新锁定视图状态
   * @param {Object} newViewState - 新的视图状态
   */
  const handlePageTurnComplete = useCallback(
    (newViewState) => {
      updateLockedViewState(newViewState)
      setIsPageTurning(false)
    },
    [updateLockedViewState, setIsPageTurning],
  )

  // 使用演讲页管理 Hook
  const {
    slides,
    currentPage,
    handleAddSlide,
    handleDeleteSlide,
    handleSelectSlide,
    handleReorderSlides,
    handlePrevPage,
    handleNextPage,
    scrollToPage,
    getSlideSize,
    syncSlidesWithFrames,
  } = useSlides({
    excalidrawRef,
    aspectRatio,
    recordingStep,
    onPageTurnStart: handlePageTurnStart,
    onPageTurnComplete: handlePageTurnComplete,
  })

  // 更新 ref 以供 useRecording 使用
  useEffect(() => {
    slidesRef.current = slides
  }, [slides])

  useEffect(() => {
    getSlideSizeRef.current = getSlideSize
  }, [getSlideSize])

  useEffect(() => {
    scrollToPageRef.current = scrollToPage
  }, [scrollToPage])

  // 同步主题到 html 元素
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  // 页面打开时申请摄像头和麦克风权限
  useEffect(() => {
    const initDevices = async () => {
      try {
        await enumerateDevices()

        const devices = await navigator.mediaDevices.enumerateDevices()
        const hasVideo = devices.some((d) => d.kind === "videoinput")
        const hasAudio = devices.some((d) => d.kind === "audioinput")

        if (hasVideo || hasAudio) {
          try {
            await navigator.mediaDevices.getUserMedia({
              video: hasVideo,
              audio: hasAudio,
            })
            await enumerateDevices()
          } catch (e) {
            console.error("申请权限失败:", e)
          }
        }
      } catch (err) {
        console.warn("获取设备列表失败:", err.message)
      }
    }
    initDevices()
  }, [enumerateDevices])

  return (
    <div className="app">
      {/* 工具栏 */}
      <Toolbar
        theme={theme}
        onSettingsClick={() => setShowSettings(!showSettings)}
        onTeleprompterClick={() => setTeleprompterVisible(!teleprompterVisible)}
        onRecordClick={handleRecordClick}
        recordingStep={recordingStep}
        hasTeleprompterContent={teleprompterContent.trim().length > 0}
      />

      {/* 演讲页工具栏 */}
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

      {/* 设置弹窗 */}
      {showSettings && (
        <SettingsModal theme={theme} onClose={() => setShowSettings(false)} />
      )}

      {/* 提词器 */}
      <Teleprompter
        theme={theme}
        isVisible={teleprompterVisible}
        onClose={() => setTeleprompterVisible(false)}
        content={teleprompterContent}
        onContentChange={setTeleprompterContent}
      />

      {/* 录制时的鼠标指示器 */}
      {recordingStep === "recording" && (
        <CursorIndicator
          position={mousePos}
          color={mouseEffect.enabled ? mouseEffect.color : "#ffeb3b"}
        />
      )}

      {/* 选择框 */}
      <SelectionBox
        box={
          selectionBox ? { ...selectionBox, onChange: handleBoxChange } : null
        }
        recordingStep={recordingStep}
        cornerRadius={cornerRadius}
        aspectRatio={aspectRatio}
        onCancel={handleCancelSelect}
        recordingDuration={recordingDuration}
      />

      {/* 摄像头预览 */}
      {(recordingStep === "selecting" || recordingStep === "recording") && (
        <CameraPreview
          enabled={camera.enabled}
          stream={cameraStream}
          shape={camera.shape}
          size={camera.size}
          position={camera.position}
          offset={camera.offset}
          selectionBox={selectionBox}
        />
      )}

      {/* Excalidraw 画布 */}
      <main className="canvas-container">
        <Excalidraw
          excalidrawAPI={(api) => {
            excalidrawRef.current = api
          }}
          initialData={loadFromStorage()}
          theme={theme}
          viewBackgroundColor={theme === "dark" ? "#1a1a1a" : "#ffffff"}
          onChange={(elements, appState) => {
            if (appState.theme && appState.theme !== theme) {
              updateSetting("theme", appState.theme)
            }

            syncSlidesWithFrames(elements)

            // 保存画布内容到 localStorage
            saveToStorage(elements, appState)

            // 录制时锁定视图（翻页过程中不锁定）
            // selecting/ready/recording 状态都需要锁定视图
            if (
              (recordingStep === "selecting" ||
                recordingStep === "ready" ||
                recordingStep === "recording") &&
              lockedViewState &&
              !isPageTurning
            ) {
              const { scrollX, scrollY, zoom } = lockedViewState
              // 检测视图变化是否超过阈值
              if (
                Math.abs(appState.scrollX - scrollX) > 0.1 ||
                Math.abs(appState.scrollY - scrollY) > 0.1 ||
                Math.abs(appState.zoom.value - zoom) > 0.001
              ) {
                // 恢复到锁定的视图状态
                excalidrawRef.current?.updateScene({
                  appState: {
                    scrollX,
                    scrollY,
                    zoom: { value: zoom },
                  },
                })
              }
            }
          }}
          langCode={language}
          UIOptions={{
            canvasActions: {
              toggleTheme: true,
            },
          }}
        />
      </main>
    </div>
  )
}

/**
 * 应用入口组件
 */
function App() {
  return (
    <SettingsProvider>
      <AppWithSettings />
    </SettingsProvider>
  )
}

export default App
