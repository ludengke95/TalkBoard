import { useRef, useState, useCallback, useEffect } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import './App.css'

function App() {
  const excalidrawRef = useRef(null)
  const [recordingStep, setRecordingStep] = useState('idle') // idle → selecting → recording
  const [selectionBox, setSelectionBox] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialBox, setInitialBox] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const mousePosRef = useRef({ x: 0, y: 0 })
  
  // 设置和提词器状态
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
  
  // 默认选中页面中间区域
  const initSelectionBox = useCallback(() => {
    const defaultWidth = Math.min(window.innerWidth * 0.6, 800)
    const defaultHeight = Math.min(window.innerHeight * 0.6, 600)
    const x = (window.innerWidth - defaultWidth) / 2
    const y = (window.innerHeight - defaultHeight) / 2
    setSelectionBox({ x, y, width: defaultWidth, height: defaultHeight })
  }, [])

  const handleStartSelect = useCallback(() => {
    initSelectionBox()
    setRecordingStep('selecting')
  }, [initSelectionBox])

  const handleCancelSelect = useCallback(() => {
    setSelectionBox(null)
    setRecordingStep('idle')
  }, [])

  const handleConfirmSelect = useCallback(() => {
    setRecordingStep('ready')
  }, [])

  // 鼠标事件处理 - 选择框拖拽
  const handleMouseDown = useCallback((e) => {
    if (recordingStep !== 'selecting' || !selectionBox) return
    
    const rect = e.target.getBoundingClientRect()
    const mouseX = e.clientX
    const mouseY = e.clientY
    
    // 检查点击的是哪个部分
    const handleSize = 10
    const box = selectionBox
    
    // 角落调整
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
    
    // 边框调整
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
    
    // 拖拽整个框
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

  // 录制相关
  const startRecording = useCallback(async () => {
    if (!selectionBox) return

    // 创建录制用的 canvas
    const recordCanvas = document.createElement('canvas')
    recordCanvas.width = selectionBox.width
    recordCanvas.height = selectionBox.height
    recordCanvasRef.current = recordCanvas
    const ctx = recordCanvas.getContext('2d')

    // 获取 Excalidraw 的 canvas
    const getExcalidrawCanvas = () => {
      const canvas = document.querySelector('.excalidraw canvas')
      return canvas
    }

    // 捕获帧
    const captureFrame = () => {
      const sourceCanvas = getExcalidrawCanvas()
      if (sourceCanvas && isCapturingRef.current) {
        ctx.drawImage(
          sourceCanvas,
          selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height,
          0, 0, selectionBox.width, selectionBox.height
        )
        
        // 计算鼠标在选区中的相对位置
        const relX = mousePosRef.current.x - selectionBox.x
        const relY = mousePosRef.current.y - selectionBox.y
        
        // 检查鼠标是否在选区内
        if (relX >= 0 && relX <= selectionBox.width && 
            relY >= 0 && relY <= selectionBox.height) {
          // 绘制黄色圆
          ctx.beginPath()
          ctx.arc(relX, relY, 12, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255, 235, 59, 0.9)'
          ctx.fill()
        }
        
        animationFrameRef.current = requestAnimationFrame(captureFrame)
      }
    }

    // 开始捕获
    isCapturingRef.current = true
    captureFrame()

    // 创建 MediaRecorder
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
  }, [selectionBox])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    isCapturingRef.current = false
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  // 清理
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
      // 再次点击开始录制
      startRecording()
    } else if (recordingStep === 'ready' || recordingStep === 'recording') {
      stopRecording()
    }
  }, [recordingStep, handleStartSelect, startRecording, stopRecording])

  // 窗口大小变化时更新选区
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

  // 鼠标移动时更新位置
  useEffect(() => {
    if (recordingStep !== 'recording') return
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
      mousePosRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [recordingStep])

  // 提词器内容变化时自动显示
  useEffect(() => {
    if (teleprompterContent.trim() && !showTeleprompter) {
      setShowTeleprompter(true)
    }
  }, [teleprompterContent])

  // 提词器播放/暂停逻辑
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

  // 提词器拖拽处理
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

  // 组合事件处理函数 - 解决事件冲突
  const handleCombinedMouseMove = useCallback((e) => {
    // 处理选择框拖拽
    handleMouseMove(e)
    // 处理提词器拖拽
    handleTeleprompterDrag(e)
  }, [handleMouseMove, handleTeleprompterDrag])

  const handleCombinedMouseUp = useCallback(() => {
    // 处理选择框拖拽结束
    handleMouseUp()
    // 处理提词器拖拽结束
    handleTeleprompterDragEnd()
  }, [handleMouseUp, handleTeleprompterDragEnd])

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

      {/* 设置弹窗 */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>设置</h3>
              <button className="modal-close" onClick={() => setShowSettings(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* 空白内容 */}
            </div>
          </div>
        </div>
      )}

      {/* 提词器 */}
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

      {/* 鼠标指示器 */}
      {recordingStep === 'recording' && (
        <div 
          className="cursor-indicator"
          style={{ left: mousePos.x, top: mousePos.y }}
        />
      )}
      
      {/* 选择区域遮罩 */}
      {selectionBox && (recordingStep === 'selecting' || recordingStep === 'ready' || recordingStep === 'recording') && (
        <div className={`selection-overlay ${recordingStep === 'recording' ? 'recording' : ''}`}>
          <div 
            className={`selection-box ${recordingStep === 'recording' ? 'recording' : ''}`}
            style={{
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.width,
              height: selectionBox.height
            }}
            onMouseDown={handleMouseDown}
          >
            {/* 录制标识 */}
            {(recordingStep === 'ready' || recordingStep === 'recording') && (
              <div className="rec-indicator">REC</div>
            )}
            
            {/* 调整手柄 - 录制中隐藏 */}
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
            
            {/* 尺寸提示 - 录制中隐藏 */}
            {recordingStep !== 'recording' && (
              <div className="selection-size">
                {Math.round(selectionBox.width)} × {Math.round(selectionBox.height)}
              </div>
            )}
          </div>
          
          {/* 操作按钮 */}
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

export default App
