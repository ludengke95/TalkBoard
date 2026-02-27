/**
 * 白板应用主组件
 * 基于 Excalidraw 的带提词器和屏幕录制功能的白板应用
 */
import { useRef, useState, useCallback, useEffect } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import { SettingsProvider, useSettings } from './contexts/SettingsContext'
import SettingsModal from './components/Settings/SettingsModal'
import { useMediaDevices } from './hooks/useMediaDevices'
import './App.css'

// 内部组件 - 在 SettingsProvider 上下文中使用 useSettings
function AppWithSettings() {
  const { settings } = useSettings()
  const { mouseEffect, aspectRatio } = settings
  const { enumerateDevices } = useMediaDevices()
  
  const excalidrawRef = useRef(null)
  const [recordingStep, setRecordingStep] = useState('idle')
  const [selectionBox, setSelectionBox] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialBox, setInitialBox] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const mousePosRef = useRef({ x: 0, y: 0 })
  
  const [showSettings, setShowSettings] = useState(false)
  const [showTeleprompter, setShowTeleprompter] = useState(false)
  const [teleprompterContent, setTeleprompterContent] = useState('')
  const [teleprompterSpeed, setTeleprompterSpeed] = useState(50)
  const [teleprompterOpacity, setTeleprompterOpacity] = useState(80)
  const [isPlaying, setIsPlaying] = useState(false)
  const [teleprompterPos, setTeleprompterPos] = useState({ x: 20, y: 20 })
  const [isDraggingTeleprompter, setIsDraggingTeleprompter] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const teleprompterRef = useRef(null)
  const scrollIntervalRef = useRef(null)
  
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const recordCanvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const isCapturingRef = useRef(false)
  
  const initSelectionBox = useCallback(() => {
    // 解析画面比例
    let ratio = 16 / 9 // 默认比例
    if (aspectRatio && aspectRatio.includes(':')) {
      const [w, h] = aspectRatio.split(':').map(Number)
      if (w && h) {
        ratio = w / h
      }
    }
    
    // 根据比例计算选择框大小
    const maxWidth = window.innerWidth * 0.7
    const maxHeight = window.innerHeight * 0.7
    
    let width, height
    if (maxWidth / maxHeight > ratio) {
      // 高度受限制
      height = maxHeight
      width = height * ratio
    } else {
      // 宽度受限制
      width = maxWidth
      height = width / ratio
    }
    
    // 确保最小尺寸
    width = Math.max(width, 200)
    height = Math.max(height, 150)
    
    const x = (window.innerWidth - width) / 2
    const y = (window.innerHeight - height) / 2
    
    setSelectionBox({ x, y, width, height })
  }, [aspectRatio])

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        enumerateDevices()
      } catch (err) {
        console.warn('请求媒体权限失败:', err)
      }
    }
    requestPermissions()
  }, [enumerateDevices])

  const handleStartSelect = useCallback(() => {
    initSelectionBox()
    setRecordingStep('selecting')
  }, [initSelectionBox])

  const handleCancelSelect = useCallback(() => {
    setSelectionBox(null)
    setRecordingStep('idle')
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (recordingStep !== 'selecting' || !selectionBox) return
    
    const mouseX = e.clientX
    const mouseY = e.clientY
    const handleSize = 10
    const box = selectionBox
    
    if (Math.abs(mouseX - box.x) < handleSize && Math.abs(mouseY - box.y) < handleSize) {
      setDragType('nw')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
      return
    }
    if (Math.abs(mouseX - (box.x + box.width)) < handleSize && Math.abs(mouseY - box.y) < handleSize) {
      setDragType('ne')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
      return
    }
    if (Math.abs(mouseX - box.x) < handleSize && Math.abs(mouseY - (box.y + box.height)) < handleSize) {
      setDragType('sw')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
      return
    }
    if (Math.abs(mouseX - (box.x + box.width)) < handleSize && Math.abs(mouseY - (box.y + box.height)) < handleSize) {
      setDragType('se')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
      return
    }
    if (Math.abs(mouseX - box.x) < handleSize) {
      setDragType('w')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
      return
    }
    if (Math.abs(mouseX - (box.x + box.width)) < handleSize) {
      setDragType('e')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
      return
    }
    if (Math.abs(mouseY - box.y) < handleSize) {
      setDragType('n')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
      return
    }
    if (Math.abs(mouseY - (box.y + box.height)) < handleSize) {
      setDragType('s')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
      return
    }
    if (mouseX > box.x && mouseX < box.x + box.width && mouseY > box.y && mouseY < box.y + box.height) {
      setDragType('move')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
    }
  }, [recordingStep, selectionBox])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragType || !initialBox) return
    
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    let newBox = { ...initialBox }
    
    switch (dragType) {
      case 'move':
        newBox.x = Math.max(0, Math.min(window.innerWidth - initialBox.width, initialBox.x + dx))
        newBox.y = Math.max(0, Math.min(window.innerHeight - initialBox.height, initialBox.y + dy))
        break
      case 'nw':
        newBox.x = Math.max(0, initialBox.x + dx)
        newBox.y = Math.max(0, initialBox.y + dy)
        newBox.width = Math.max(50, initialBox.width - dx)
        newBox.height = Math.max(50, initialBox.height - dy)
        break
      case 'ne':
        newBox.y = Math.max(0, initialBox.y + dy)
        newBox.width = Math.max(50, initialBox.width + dx)
        newBox.height = Math.max(50, initialBox.height - dy)
        break
      case 'sw':
        newBox.x = Math.max(0, initialBox.x + dx)
        newBox.width = Math.max(50, initialBox.width - dx)
        newBox.height = Math.max(50, initialBox.height + dy)
        break
      case 'se':
        newBox.width = Math.max(50, initialBox.width + dx)
        newBox.height = Math.max(50, initialBox.height + dy)
        break
      case 'w':
        newBox.x = Math.max(0, initialBox.x + dx)
        newBox.width = Math.max(50, initialBox.width - dx)
        break
      case 'e':
        newBox.width = Math.max(50, initialBox.width + dx)
        break
      case 'n':
        newBox.y = Math.max(0, initialBox.y + dy)
        newBox.height = Math.max(50, initialBox.height - dy)
        break
      case 's':
        newBox.height = Math.max(50, initialBox.height + dy)
        break
    }
    
    setSelectionBox(newBox)
  }, [isDragging, dragType, dragStart, initialBox])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragType(null)
  }, [])

  const startRecording = useCallback(async () => {
    if (!selectionBox) return

    const recordCanvas = document.createElement('canvas')
    recordCanvas.width = selectionBox.width
    recordCanvas.height = selectionBox.height
    recordCanvasRef.current = recordCanvas
    const ctx = recordCanvas.getContext('2d')

    const getExcalidrawCanvas = () => {
      const canvas = document.querySelector('.excalidraw canvas')
      return canvas
    }

    const captureFrame = () => {
      const sourceCanvas = getExcalidrawCanvas()
      if (sourceCanvas && isCapturingRef.current) {
        ctx.drawImage(
          sourceCanvas,
          selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height,
          0, 0, selectionBox.width, selectionBox.height
        )
        
        const relX = mousePosRef.current.x - selectionBox.x
        const relY = mousePosRef.current.y - selectionBox.y
        
        if (relX >= 0 && relX <= selectionBox.width && 
            relY >= 0 && relY <= selectionBox.height) {
          ctx.beginPath()
          ctx.arc(relX, relY, 12, 0, Math.PI * 2)
          const highlightColor = mouseEffect.enabled ? mouseEffect.color : '#ffeb3b'
          ctx.fillStyle = highlightColor + 'e6'
          ctx.fill()
        }
        
        animationFrameRef.current = requestAnimationFrame(captureFrame)
      }
    }

    isCapturingRef.current = true
    captureFrame()

    const stream = recordCanvas.captureStream(30)
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    })

    chunksRef.current = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      isCapturingRef.current = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `whiteboard-${Date.now()}.webm`
      a.click()
      URL.revokeObjectURL(url)
      setRecordingStep('idle')
    }

    mediaRecorder.start()
    mediaRecorderRef.current = mediaRecorder
    setRecordingStep('recording')
  }, [selectionBox, mouseEffect])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    isCapturingRef.current = false
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      isCapturingRef.current = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const handleRecordClick = useCallback(() => {
    if (recordingStep === 'idle') {
      handleStartSelect()
    } else if (recordingStep === 'selecting') {
      startRecording()
    } else if (recordingStep === 'ready' || recordingStep === 'recording') {
      stopRecording()
    }
  }, [recordingStep, handleStartSelect, startRecording, stopRecording])

  useEffect(() => {
    const handleResize = () => {
      if (selectionBox && recordingStep === 'selecting') {
        setSelectionBox(prev => ({
          ...prev,
          x: Math.min(prev.x, window.innerWidth - prev.width),
          y: Math.min(prev.y, window.innerHeight - prev.height)
        }))
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [selectionBox, recordingStep])

  useEffect(() => {
    if (recordingStep !== 'recording') return
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
      mousePosRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [recordingStep])

  useEffect(() => {
    if (teleprompterContent.trim() && !showTeleprompter) {
      setShowTeleprompter(true)
    }
  }, [teleprompterContent])

  useEffect(() => {
    if (isPlaying) {
      const interval = Math.max(10, 110 - teleprompterSpeed)
      scrollIntervalRef.current = setInterval(() => {
        if (teleprompterRef.current) {
          teleprompterRef.current.scrollTop += 1
        }
      }, interval)
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
    }
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current)
    }
  }, [isPlaying, teleprompterSpeed])

  const handleTeleprompterDragStart = (e) => {
    setIsDraggingTeleprompter(true)
    setDragOffset({ x: e.clientX - teleprompterPos.x, y: e.clientY - teleprompterPos.y })
  }

  const handleTeleprompterDrag = (e) => {
    if (isDraggingTeleprompter) {
      setTeleprompterPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y })
    }
  }

  const handleTeleprompterDragEnd = () => {
    setIsDraggingTeleprompter(false)
  }

  const handleCombinedMouseMove = useCallback((e) => {
    handleMouseMove(e)
    handleTeleprompterDrag(e)
  }, [handleMouseMove, handleTeleprompterDrag])

  const handleCombinedMouseUp = useCallback(() => {
    handleMouseUp()
    handleTeleprompterDragEnd()
  }, [handleMouseUp])

  return (
    <div className="app" onMouseMove={handleCombinedMouseMove} onMouseUp={handleCombinedMouseUp} onMouseLeave={handleCombinedMouseUp}>
      <div className="floating-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn" onClick={() => setShowSettings(!showSettings)} title="设置">
            ⚙️
          </button>
          <button 
            className="toolbar-btn" 
            onClick={() => {
              if (teleprompterContent.trim()) {
                setShowTeleprompter(!showTeleprompter)
              } else {
                setShowTeleprompter(true)
              }
            }} 
            title="提词器"
          >
            📝
          </button>
        </div>
        <button 
          className={`record-btn ${recordingStep === 'recording' ? 'recording' : ''}`}
          onClick={handleRecordClick}
        >
          {recordingStep === 'idle' && '⏺ 开始录制'}
          {recordingStep === 'selecting' && '⏺ 确认区域'}
          {(recordingStep === 'ready' || recordingStep === 'recording') && '⏹ 停止录制'}
        </button>
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {showTeleprompter && (
        <div 
          className="teleprompter-container"
          style={{ 
            left: teleprompterPos.x, 
            top: teleprompterPos.y,
            opacity: teleprompterOpacity / 100 
          }}
        >
          <div className="teleprompter-header" onMouseDown={handleTeleprompterDragStart}>
            提词器
          </div>
          <div className="teleprompter-controls">
            <label>
              <span>速度</span>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={teleprompterSpeed} 
                onChange={e => setTeleprompterSpeed(Number(e.target.value))} 
              />
            </label>
            <label>
              <span>透明度</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={teleprompterOpacity} 
                onChange={e => setTeleprompterOpacity(Number(e.target.value))} 
              />
            </label>
            <button onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? '⏸' : '▶️'}
            </button>
            <button onClick={() => setShowTeleprompter(false)} className="close-btn">×</button>
          </div>
          <textarea 
            ref={teleprompterRef}
            className="teleprompter-content"
            placeholder="输入提词内容..."
            value={teleprompterContent}
            onChange={e => setTeleprompterContent(e.target.value)}
          />
        </div>
      )}

      {recordingStep === 'recording' && (
        <div 
          className="cursor-indicator"
          style={{ 
            left: mousePos.x, 
            top: mousePos.y,
            backgroundColor: mouseEffect.enabled ? mouseEffect.color : '#ffeb3b'
          }}
        />
      )}
      
      {selectionBox && (recordingStep === 'selecting' || recordingStep === 'ready' || recordingStep === 'recording') && (
        <div className={`selection-overlay ${recordingStep === 'recording' ? 'recording' : ''}`}>
          <div 
            className={`selection-box ${recordingStep === 'recording' ? 'recording' : ''}`}
            style={{
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.width,
              height: selectionBox.height,
              borderRadius: settings.cornerRadius ? `${settings.cornerRadius}px` : 0
            }}
            onMouseDown={handleMouseDown}
          >
            {(recordingStep === 'ready' || recordingStep === 'recording') && (
              <div className="rec-indicator">REC</div>
            )}
            
            {recordingStep !== 'recording' && (
              <>
                <div className="selection-handle nw" />
                <div className="selection-handle n" />
                <div className="selection-handle ne" />
                <div className="selection-handle w" />
                <div className="selection-handle e" />
                <div className="selection-handle sw" />
                <div className="selection-handle s" />
                <div className="selection-handle se" />
              </>
            )}
            
            {recordingStep !== 'recording' && (
              <div className="selection-size">
                {Math.round(selectionBox.width)} × {Math.round(selectionBox.height)}
              </div>
            )}
          </div>
          
          {recordingStep === 'selecting' && (
            <div className="selection-actions">
              <button className="btn-cancel" onClick={handleCancelSelect}>
                取消
              </button>
            </div>
          )}
        </div>
      )}
      
      <main className="canvas-container">
        <Excalidraw ref={excalidrawRef} langCode="zh-CN" />
      </main>
    </div>
  )
}

// 主应用组件 - 包裹 SettingsProvider
function App() {
  return (
    <SettingsProvider>
      <AppWithSettings />
    </SettingsProvider>
  )
}

export default App
