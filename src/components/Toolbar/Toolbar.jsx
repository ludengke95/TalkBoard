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
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : { x: 20, y: 20 }
  })
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position))
  }, [position])

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('button')) return
    setIsDragging(true)
    setDragOffset({ 
      x: e.clientX - position.x, 
      y: e.clientY - position.y 
    })
  }, [position])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    setPosition({
      x: Math.max(0, e.clientX - dragOffset.x),
      y: Math.max(0, e.clientY - dragOffset.y)
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
      style={{ left: position.x, top: position.y }}
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
