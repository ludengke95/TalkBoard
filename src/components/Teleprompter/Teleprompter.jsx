import { useState, useCallback, useEffect, useRef } from 'react'
import './Teleprompter.css'

const STORAGE_KEY = 'byv-teleprompter-position'

function Teleprompter({ content, onContentChange }) {
  const [isVisible, setIsVisible] = useState(false)
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
        return { x: 0.02, y: 0.02 }
      }
    }
    return { x: 0.02, y: 0.02 }
  })
  
  const [position, setPosition] = useState({ 
    x: percentPosition.x * window.innerWidth, 
    y: percentPosition.y * window.innerHeight 
  })
  const [speed, setSpeed] = useState(50)
  const [opacity, setOpacity] = useState(80)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  const teleprompterRef = useRef(null)
  const scrollIntervalRef = useRef(null)

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (!isDragging) {
        setPosition({
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
      const newX = Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragOffset.x))
      const newY = Math.max(0, Math.min(window.innerHeight - 300, e.clientY - dragOffset.y))
      setPosition({ x: newX, y: newY })
      setPercentPosition({ x: newX / window.innerWidth, y: newY / window.innerHeight })
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
