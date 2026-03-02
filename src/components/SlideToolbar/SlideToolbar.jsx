import { useState, useCallback } from 'react'
import './SlideToolbar.css'

function SlideToolbar({
  isSlideMode,
  onToggleSlideMode,
  slides,
  currentPage,
  onAddSlide,
  onDeleteSlide,
  onPrevPage,
  onNextPage,
  disabled
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDeleteClick = useCallback(() => {
    if (slides.length <= 1) {
      alert('至少需要保留一个演讲页')
      return
    }
    setShowDeleteConfirm(true)
  }, [slides.length])

  const handleConfirmDelete = useCallback(() => {
    onDeleteSlide()
    setShowDeleteConfirm(false)
  }, [onDeleteSlide])

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false)
  }, [])

  return (
    <div className={`slide-toolbar ${isSlideMode ? 'active' : ''} ${disabled ? 'disabled' : ''}`}>
      <button
        className={`slide-mode-btn ${isSlideMode ? 'active' : ''}`}
        onClick={onToggleSlideMode}
        disabled={disabled}
        title={isSlideMode ? '退出演讲模式' : '进入演讲模式'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="slide-icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
        <span>{isSlideMode ? '退出演讲' : '演讲模式'}</span>
      </button>

      {isSlideMode && (
        <>
          <div className="slide-divider" />

          <button
            className="slide-btn add-btn"
            onClick={onAddSlide}
            disabled={disabled}
            title="添加演讲页"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="slide-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>添加</span>
          </button>

          <div className="slide-divider" />

          <div className="slide-page-info">
            <button
              className="slide-btn nav-btn"
              onClick={onPrevPage}
              disabled={disabled || currentPage === 0}
              title="上一页 (←/↑/P)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="slide-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="page-number">{currentPage + 1} / {slides.length}</span>
            <button
              className="slide-btn nav-btn"
              onClick={onNextPage}
              disabled={disabled || currentPage >= slides.length - 1}
              title="下一页 (→/↓/N)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="slide-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          <div className="slide-divider" />

          <button
            className="slide-btn delete-btn"
            onClick={handleDeleteClick}
            disabled={disabled || slides.length <= 1}
            title="删除当前演讲页"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="slide-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            <span>删除</span>
          </button>
        </>
      )}

      {showDeleteConfirm && (
        <div className="delete-confirm-overlay" onClick={handleCancelDelete}>
          <div className="delete-confirm-dialog" onClick={e => e.stopPropagation()}>
            <p>确定要删除当前演讲页吗？</p>
            <div className="delete-confirm-actions">
              <button className="confirm-cancel" onClick={handleCancelDelete}>取消</button>
              <button className="confirm-delete" onClick={handleConfirmDelete}>删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SlideToolbar
