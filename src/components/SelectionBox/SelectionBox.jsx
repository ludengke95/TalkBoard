import { useState, useCallback, useEffect } from 'react'
import './SelectionBox.css'

const HANDLE_SIZE = 10

function SelectionBox({ 
  box, 
  recordingStep, 
  cornerRadius,
  onMouseDown,
  onCancel 
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialBox, setInitialBox] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const handleMouseDown = useCallback((e) => {
    if (!box) return
    
    const mouseX = e.clientX
    const mouseY = e.clientY
    
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
    if (Math.abs(mouseX - box.x) < HANDLE_SIZE) {
      setDragType('w')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
      return
    }
    if (Math.abs(mouseX - (box.x + box.width)) < HANDLE_SIZE) {
      setDragType('e')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
      return
    }
    if (Math.abs(mouseY - box.y) < HANDLE_SIZE) {
      setDragType('n')
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
      setInitialBox(box)
      return
    }
    if (Math.abs(mouseY - (box.y + box.height)) < HANDLE_SIZE) {
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
    
    if (onMouseDown) {
      onMouseDown(e)
    }
  }, [box, onMouseDown])

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
    
    if (box && box.onChange) {
      box.onChange(newBox)
    }
  }, [isDragging, dragType, dragStart, initialBox, box])

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
  const isLocked = isReady || isRecording

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
        
        {!isRecording && (
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
