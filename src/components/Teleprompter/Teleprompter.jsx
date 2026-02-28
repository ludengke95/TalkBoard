import { useState, useCallback, useEffect, useRef } from 'react'
import './Teleprompter.css'

const STORAGE_KEY = 'byv-teleprompter-position'

function Teleprompter({ content, onContentChange }) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : { x: 20, y: 20 }
  })
  const [speed, setSpeed] = useState(50)
  const [opacity, setOpacity] = useState(80)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  const teleprompterRef = useRef(null)
  const scrollIntervalRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position))
  }, [position])

  useEffect(() => {
    if (content.trim() && !isVisible) {
      setIsVisible(true)
    }
  }, [content, isVisible])

  useEffect(() => {
    if (isPlaying) {
      const interval = Math.max(10, 110 - speed)
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
  }, [isPlaying, speed])

  const handleDragStart = useCallback((e) => {
    setIsDragging(true)
    setDragOffset({ 
      x: e.clientX - position.x, 
      y: e.clientY - position.y 
    })
  }, [position])

  const handleDrag = useCallback((e) => {
    if (isDragging) {
      setPosition({
        x: Math.max(0, e.clientX - dragOffset.x),
        y: Math.max(0, e.clientY - dragOffset.y)
      })
    }
  }, [isDragging, dragOffset])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag)
      window.addEventListener('mouseup', handleDragEnd)
      return () => {
        window.removeEventListener('mousemove', handleDrag)
        window.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [isDragging, handleDrag, handleDragEnd])

  const handleToggle = useCallback(() => {
    if (content.trim()) {
      setIsVisible(!isVisible)
    } else {
      setIsVisible(true)
    }
  }, [content, isVisible])

  if (!isVisible) return null

  return (
    <div 
      className={`teleprompter-container ${isDragging ? 'dragging' : ''}`}
      style={{ 
        left: position.x, 
        top: position.y,
        opacity: opacity / 100 
      }}
    >
      <div className="teleprompter-header" onMouseDown={handleDragStart}>
        提词器
      </div>
      <div className="teleprompter-controls">
        <label>
          <span>速度</span>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={speed} 
            onChange={e => setSpeed(Number(e.target.value))} 
          />
        </label>
        <label>
          <span>透明度</span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={opacity} 
            onChange={e => setOpacity(Number(e.target.value))} 
          />
        </label>
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? '⏸' : '▶️'}
        </button>
        <button onClick={() => setIsVisible(false)} className="close-btn">×</button>
      </div>
      <textarea 
        ref={teleprompterRef}
        className="teleprompter-content"
        placeholder="输入提词内容..."
        value={content}
        onChange={e => onContentChange(e.target.value)}
      />
    </div>
  )
}

export default Teleprompter
