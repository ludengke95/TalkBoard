import { useState, useCallback, useEffect } from 'react'
import './SelectionBox.css'

const HANDLE_SIZE = 10

function SelectionBox({ 
  box, 
  recordingStep, 
  cornerRadius,
  aspectRatio,
  onCancel 
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialBox, setInitialBox] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const isBoxLocked = box?.locked || false

  // 计算当前宽高比
  const getRatio = () => {
    if (aspectRatio && aspectRatio.includes(':')) {
      const [w, h] = aspectRatio.split(':').map(Number)
      if (w && h) return w / h
    }
    return 16 / 9
  }

  const ratio = getRatio()

  const handleMouseDown = useCallback((e) => {
    if (!box || isBoxLocked) return
    
    const mouseX = e.clientX
    const mouseY = e.clientY
    
    // 只处理四角拖拽
    if (Math.abs(mouseX - box.x) < HANDLE_SIZE && Math.abs(mouseY - box.y) < HANDLE_SIZE) {
      setDragType('nw')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
      return
    }
    if (Math.abs(mouseX - (box.x + box.width)) < HANDLE_SIZE && Math.abs(mouseY - box.y) < HANDLE_SIZE) {
      setDragType('ne')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
      return
    }
    if (Math.abs(mouseX - box.x) < HANDLE_SIZE && Math.abs(mouseY - (box.y + box.height)) < HANDLE_SIZE) {
      setDragType('sw')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
      return
    }
    if (Math.abs(mouseX - (box.x + box.width)) < HANDLE_SIZE && Math.abs(mouseY - (box.y + box.height)) < HANDLE_SIZE) {
      setDragType('se')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
      return
    }
    
    // 中心拖拽移动整个框
    if (mouseX > box.x && mouseX < box.x + box.width && mouseY > box.y && mouseY < box.y + box.height) {
      setDragType('move')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
    }
  }, [box])

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
        newBox.height = newBox.width / ratio
        break
      case 'ne':
        newBox.y = Math.max(0, initialBox.y + dy)
        newBox.width = Math.max(50, initialBox.width + dx)
        newBox.height = newBox.width / ratio
        break
      case 'sw':
        newBox.x = Math.max(0, initialBox.x + dx)
        newBox.width = Math.max(50, initialBox.width - dx)
        newBox.height = newBox.width / ratio
        break
      case 'se':
        newBox.width = Math.max(50, initialBox.width + dx)
        newBox.height = newBox.width / ratio
        break
    }
    
    if (box && box.onChange) {
      box.onChange(newBox)
    }
  }, [isDragging, dragType, dragStart, initialBox, box, ratio])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragType(null)
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

  if (!box || (recordingStep !== 'selecting' && recordingStep !== 'ready' && recordingStep !== 'recording')) {
    return null
  }

  const isSelecting = recordingStep === 'selecting'
  const isReady = recordingStep === 'ready'
  const isRecording = recordingStep === 'recording'
  const isLocked = isReady || isRecording || isBoxLocked

  return (
    <div className={`selection-overlay ${isSelecting ? 'selecting' : ''} ${isLocked ? 'locked' : ''}`}>
      <div 
        className={`selection-box ${isRecording ? 'recording' : ''} ${isLocked ? 'locked' : ''}`}
        style={{
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
          borderRadius: cornerRadius ? `${cornerRadius}px` : 0
        }}
        onMouseDown={handleMouseDown}
      >
        {(recordingStep === 'ready' || isRecording) && (
          <div className="rec-indicator">REC</div>
        )}

        {isBoxLocked && isSelecting && (
          <div className="locked-indicator">已锁定</div>
        )}
        
        {!isRecording && isSelecting && !isBoxLocked && (
          <>
            <div className="selection-handle nw" />
            <div className="selection-handle ne" />
            <div className="selection-handle sw" />
            <div className="selection-handle se" />
          </>
        )}
        
        {!isRecording && (
          <div className="selection-size">
            {Math.round(box.width)} × {Math.round(box.height)}
          </div>
        )}
      </div>
      
      {recordingStep === 'selecting' && (
        <div className="selection-actions">
          <button className="btn-cancel" onClick={onCancel}>
            取消
          </button>
        </div>
      )}
    </div>
  )
}

export default SelectionBox
