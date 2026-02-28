import { useState, useCallback, useEffect } from 'react'
import './Toolbar.css'

const STORAGE_KEY = 'byv-toolbar-position'

function Toolbar({ 
  onSettingsClick, 
  onTeleprompterClick, 
  onRecordClick, 
  recordingStep,
  hasTeleprompterContent 
}) {
  // 使用百分比存储位置 (0-1)
  const [percentPosition, setPercentPosition] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // 检测是否是旧格式（像素值）
        if (parsed.x > 1 || parsed.y > 1) {
          // 转换为百分比
          return { 
            x: parsed.x / window.innerWidth, 
            y: parsed.y / window.innerHeight 
          }
        }
        return parsed
      } catch {
        return { x: 0.02, y: 0.02 }
      }
    }
    return { x: 0.02, y: 0.02 }
  })
  
  const [pixelPosition, setPixelPosition] = useState({ 
    x: percentPosition.x * window.innerWidth, 
    y: percentPosition.y * window.innerHeight 
  })
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // 监听窗口大小变化，重新计算像素位置
  useEffect(() => {
    const handleResize = () => {
      if (!isDragging) {
        setPixelPosition({
          x: percentPosition.x * window.innerWidth,
          y: percentPosition.y * window.innerHeight
        })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [percentPosition, isDragging])

  // 保存位置到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(percentPosition))
  }, [percentPosition])

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('button')) return
    setIsDragging(true)
    setDragOffset({ 
      x: e.clientX - pixelPosition.x, 
      y: e.clientY - pixelPosition.y 
    })
  }, [pixelPosition])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    
    const newPixelX = Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragOffset.x))
    const newPixelY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.y))
    
    setPixelPosition({ x: newPixelX, y: newPixelY })
    
    // 同时更新百分比位置
    setPercentPosition({
      x: newPixelX / window.innerWidth,
      y: newPixelY / window.innerHeight
    })
  }, [isDragging, dragOffset])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const getRecordButtonText = () => {
    switch (recordingStep) {
      case 'idle': return '⏺ 开始录制'
      case 'selecting': return '⏺ 确认区域'
      case 'ready':
      case 'recording': return '⏹ 停止录制'
      default: return '⏺ 开始录制'
    }
  }

  return (
    <div 
      className={`toolbar-floating ${isDragging ? 'dragging' : ''}`}
      style={{ left: pixelPosition.x, top: pixelPosition.y }}
      onMouseDown={handleMouseDown}
    >
      <div className="toolbar-left">
        <button 
          className="toolbar-btn" 
          onClick={onSettingsClick} 
          title="设置"
        >
          ⚙️
        </button>
        <button 
          className="toolbar-btn" 
          onClick={onTeleprompterClick}
          title="提词器"
        >
          📝
        </button>
      </div>
      <button 
        className={`record-btn ${recordingStep === 'recording' ? 'recording' : ''}`}
        onClick={onRecordClick}
      >
        {getRecordButtonText()}
      </button>
    </div>
  )
}

export default Toolbar
