import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './Toolbar.css'

const STORAGE_KEY = 'byv-toolbar-position'

function Toolbar({ 
  theme,
  onSettingsClick, 
  onTeleprompterClick, 
  onRecordClick, 
  recordingStep,
  hasTeleprompterContent,
  onHelpClick
}) {
  const { t } = useTranslation()
  const [percentPosition, setPercentPosition] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.x > 1 || parsed.y > 1) {
          return { 
            x: parsed.x / window.innerWidth, 
            y: parsed.y / window.innerHeight 
          }
        }
        return parsed
      } catch {
        return { x: 0.8, y: 0.02 }
      }
    }
    return { x: 0.8, y: 0.02 }
  })
  
  const [pixelPosition, setPixelPosition] = useState({ 
    x: percentPosition.x * window.innerWidth, 
    y: percentPosition.y * window.innerHeight 
  })
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

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

  /**
   * 获取录制按钮文本
   * @returns {string} 按钮文本
   */
  const getRecordButtonText = () => {
    switch (recordingStep) {
      case 'idle': return t('toolbar.startRecording')
      case 'selecting': return t('toolbar.confirmArea')
      case 'ready':
      case 'recording': return t('toolbar.stopRecording')
      default: return t('toolbar.startRecording')
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
          onClick={onHelpClick} 
          title={t('toolbar.help', { defaultValue: '帮助' })}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="toolbar-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={onSettingsClick} 
          title={t('toolbar.settings')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="toolbar-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={onTeleprompterClick}
          title={t('toolbar.teleprompter')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="toolbar-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </button>
      </div>
      <button 
        className={`record-btn ${recordingStep === 'recording' ? 'recording' : ''}`}
        onClick={onRecordClick}
      >
        {recordingStep === 'recording' ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="record-icon">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="record-icon">
            <circle cx="12" cy="12" r="8" />
          </svg>
        )}
        <span>{getRecordButtonText()}</span>
      </button>
    </div>
  )
}

export default Toolbar
