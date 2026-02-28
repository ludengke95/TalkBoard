/**
 * 白板应用主组件
 * 基于 Excalidraw 的带提词器和屏幕录制功能的白板应用
 */
import { useRef, useState, useCallback, useEffect } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import { SettingsProvider, useSettings } from './contexts/SettingsContext'
import SettingsModal from './components/Settings/SettingsModal'
import Toolbar from './components/Toolbar/Toolbar'
import Teleprompter from './components/Teleprompter/Teleprompter'
import SelectionBox from './components/SelectionBox/SelectionBox'
import CursorIndicator from './components/CursorIndicator/CursorIndicator'
import { useMediaDevices } from './hooks/useMediaDevices'
import './App.css'

function AppWithSettings() {
  const { settings } = useSettings()
  const { mouseEffect, aspectRatio, cornerRadius } = settings
  const { enumerateDevices } = useMediaDevices()
  
  const excalidrawRef = useRef(null)
  const [recordingStep, setRecordingStep] = useState('idle')
  const [selectionBox, setSelectionBox] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const mousePosRef = useRef({ x: 0, y: 0 })
  
  const [showSettings, setShowSettings] = useState(false)
  const [teleprompterContent, setTeleprompterContent] = useState('')
  
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const recordCanvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const isCapturingRef = useRef(false)
  
  const initSelectionBox = useCallback(() => {
    let ratio = 16 / 9
    if (aspectRatio && aspectRatio.includes(':')) {
      const [w, h] = aspectRatio.split(':').map(Number)
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

  const handleBoxChange = useCallback((newBox) => {
    setSelectionBox(newBox)
  }, [])

  const startRecording = useCallback(async () => {
    if (!selectionBox || !excalidrawRef.current) return

    const recordCanvas = document.createElement('canvas')
    recordCanvas.width = selectionBox.width
    recordCanvas.height = selectionBox.height
    recordCanvasRef.current = recordCanvas
    const ctx = recordCanvas.getContext('2d')

    const captureFrame = () => {
      if (!isCapturingRef.current) return

      // 直接获取 Excalidraw 的 canvas
      const excalidrawCanvas = document.querySelector('.excalidraw canvas:last-of-type')
      if (!excalidrawCanvas) return

      const containerRect = excalidrawCanvas.getBoundingClientRect()
      
      // 计算 selectionBox 相对于 canvas 的偏移
      const scaleX = excalidrawCanvas.width / containerRect.width
      const scaleY = excalidrawCanvas.height / containerRect.height
      
      const srcX = (selectionBox.x - containerRect.left) * scaleX
      const srcY = (selectionBox.y - containerRect.top) * scaleY
      const srcW = selectionBox.width * scaleX
      const srcH = selectionBox.height * scaleY

      ctx.drawImage(
        excalidrawCanvas,
        srcX, srcY, srcW, srcH,
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

    isCapturingRef.current = true
    captureFrame()

    const stream = recordCanvas.captureStream(60)
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
      
      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `whiteboard-${Date.now()}.webm`
        a.click()
        URL.revokeObjectURL(url)
      }
      setRecordingStep('idle')
    }

    mediaRecorder.start(1000)
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
    setRecordingStep('idle')
  }, [])

  useEffect(() => {
    return () => {
      isCapturingRef.current = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // 监听 ready 状态，启动录制
  useEffect(() => {
    if (recordingStep === 'ready') {
      startRecording()
    }
  }, [recordingStep, startRecording])

  const handleRecordClick = useCallback(() => {
    if (recordingStep === 'idle') {
      handleStartSelect()
    } else if (recordingStep === 'selecting') {
      setRecordingStep('ready')
    } else if (recordingStep === 'ready' || recordingStep === 'recording') {
      stopRecording()
    }
  }, [recordingStep, handleStartSelect, stopRecording])

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

  return (
    <div className="app">
      <Toolbar 
        onSettingsClick={() => setShowSettings(!showSettings)}
        onTeleprompterClick={() => {}}
        onRecordClick={handleRecordClick}
        recordingStep={recordingStep}
        hasTeleprompterContent={teleprompterContent.trim().length > 0}
      />

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      <Teleprompter 
        content={teleprompterContent}
        onContentChange={setTeleprompterContent}
      />

      {recordingStep === 'recording' && (
        <CursorIndicator 
          position={mousePos}
          color={mouseEffect.enabled ? mouseEffect.color : '#ffeb3b'}
        />
      )}
      
      <SelectionBox 
        box={selectionBox ? { ...selectionBox, onChange: handleBoxChange } : null}
        recordingStep={recordingStep}
        cornerRadius={cornerRadius}
        aspectRatio={aspectRatio}
        onCancel={handleCancelSelect}
      />
      
      <main className="canvas-container">
        <Excalidraw 
          excalidrawAPI={(api) => {
            excalidrawRef.current = api
          }} 
          langCode="zh-CN" 
        />
      </main>
    </div>
  )
}

function App() {
  return (
    <SettingsProvider>
      <AppWithSettings />
    </SettingsProvider>
  )
}

export default App
