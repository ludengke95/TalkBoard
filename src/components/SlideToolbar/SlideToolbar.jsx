import { useState, useCallback, useRef } from 'react'
import './SlideToolbar.css'

function SlideToolbar({
  slides,
  currentPage,
  onAddSlide,
  onDeleteSlide,
  onSelectSlide,
  onReorderSlides,
  onPrevPage,
  onNextPage,
  disabled
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const dragOverIndexRef = useRef(null);

  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    dragOverIndexRef.current = index;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndexRef.current !== null && draggedIndex !== dragOverIndexRef.current) {
      const newSlides = [...slides];
      const draggedItem = newSlides[draggedIndex];
      newSlides.splice(draggedIndex, 1);
      newSlides.splice(draggedIndex < dragOverIndexRef.current ? dragOverIndexRef.current - 1 : dragOverIndexRef.current, 0, draggedItem);
      onReorderSlides(newSlides);
    }
    setDraggedIndex(null);
    dragOverIndexRef.current = null;
  }, [draggedIndex, slides, onReorderSlides]);

  const handleDelete = useCallback((e, index) => {
    e.stopPropagation();
    if (slides.length > 1) {
      onDeleteSlide(index);
    }
  }, [slides.length, onDeleteSlide]);

  return (
    <div className={`slide-toolbar ${disabled ? 'disabled' : ''}`}>
      <div className="slide-toolbar-header">演讲页</div>
      
      <div className="slide-list">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slide-item ${currentPage === index ? 'active' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelectSlide(index)}
          >
            <div className="slide-thumbnail">
              <span className="slide-number">{index + 1}</span>
            </div>
            {slides.length > 1 && (
              <button
                className="slide-delete-btn"
                onClick={(e) => handleDelete(e, index)}
                disabled={disabled}
                title="删除演讲页"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        className="slide-add-btn"
        onClick={onAddSlide}
        disabled={disabled}
        title="添加演讲页"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  )
}

export default SlideToolbar
