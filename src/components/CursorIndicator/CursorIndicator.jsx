import './CursorIndicator.css'

function CursorIndicator({ position, color = '#ffeb3b' }) {
  if (!position || position.x === 0 && position.y === 0) {
    return null
  }

  return (
    <div 
      className="cursor-indicator"
      style={{ 
        left: position.x, 
        top: position.y,
        backgroundColor: color
      }}
    />
  )
}

export default CursorIndicator
