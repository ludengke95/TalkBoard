/**
 * Excalidraw 滚动管理中心
 * 统一管理画布滚动、视图锁定、演示页滚动等功能
 */
import { useCallback, useRef } from "react"
import { getCommonBounds } from "@excalidraw/excalidraw"

// 滚动阈值常量
const SCROLL_THRESHOLD_XY = 0.1
const SCROLL_THRESHOLD_ZOOM = 0.001
const ANIMATION_EASING = 0.15

/**
 * 滚动管理 Hook
 * @param {React.RefObject} excalidrawRef - Excalidraw API 引用
 * @returns {Object} 滚动相关方法和状态
 */
export const useExcalidrawScroll = (excalidrawRef) => {
  // 动画帧引用，用于取消动画
  const animationRef = useRef()
  
  // 视图锁定相关 Refs
  const lockedViewStateRef = useRef(null)
  const isPageTurningRef = useRef(false)

  /**
   * 平滑动画到目标状态
   * @param {Object} targetState - 目标状态
   * @param {number} targetState.scrollX - 目标 X 滚动位置
   * @param {number} targetState.scrollY - 目标 Y 滚动位置
   * @param {number} targetState.zoom - 目标缩放值
   * @param {Function} onComplete - 动画完成回调
   */
  const animateTo = useCallback(
    (targetState, onComplete) => {
      const api = excalidrawRef?.current
      if (!api) return

      const step = () => {
        const currentState = api.getAppState()

        // 计算当前位置与目标的差距
        const dx = targetState.scrollX - currentState.scrollX
        const dy = targetState.scrollY - currentState.scrollY
        const dz = targetState.zoom - currentState.zoom.value

        // 如果差距足够小，停止动画并设置最终值
        if (Math.abs(dx) < SCROLL_THRESHOLD_XY && Math.abs(dy) < SCROLL_THRESHOLD_XY && Math.abs(dz) < SCROLL_THRESHOLD_ZOOM) {
          api.updateScene({
            appState: {
              scrollX: targetState.scrollX,
              scrollY: targetState.scrollY,
              zoom: { value: targetState.zoom },
            },
          })
          onComplete?.()
          return
        }

        // 每一帧更新一小步（缓动效果）
        api.updateScene({
          appState: {
            scrollX: currentState.scrollX + dx * ANIMATION_EASING,
            scrollY: currentState.scrollY + dy * ANIMATION_EASING,
            zoom: { value: currentState.zoom.value + dz * ANIMATION_EASING },
          },
        })

        // 继续下一帧动画
        animationRef.current = requestAnimationFrame(step)
      }

      // 清除之前的动画，防止冲突
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      animationRef.current = requestAnimationFrame(step)
    },
    [excalidrawRef],
  )

  /**
   * 平滑缩放到指定元素
   * @param {Array} elements - Excalidraw 元素数组
   * @param {Object} padding - 边距配置
   * @param {number} padding.top - 上边距
   * @param {number} padding.right - 右边距
   * @param {number} padding.bottom - 下边距
   * @param {number} padding.left - 左边距
   * @param {Function} onComplete - 动画完成回调
   */
  const zoomToElementsSmooth = useCallback(
    (elements, padding = { top: 120, right: 60, bottom: 60, left: 60 }, onComplete) => {
      const api = excalidrawRef?.current
      if (!api || !elements.length) return

      const { width, height } = api.getAppState()
      const [minX, minY, maxX, maxY] = getCommonBounds(elements)

      // 计算有效视口尺寸（减去边距）
      const effectiveW = width - padding.left - padding.right
      const effectiveH = height - padding.top - padding.bottom

      // 计算目标缩放值，确保元素完整显示且不超过最大缩放 2
      const targetZoom = Math.min(
        effectiveW / (maxX - minX),
        effectiveH / (maxY - minY),
        2,
      )

      // 计算视觉中心（考虑边距偏移）
      const visualCenterX = (width + padding.left - padding.right) / 2
      const visualCenterY = (height + padding.top - padding.bottom) / 2

      // 计算目标滚动位置，使元素居中
      const targetScrollX = visualCenterX / targetZoom - (minX + maxX) / 2
      const targetScrollY = visualCenterY / targetZoom - (minY + maxY) / 2

      // 执行平滑动画
      animateTo({ scrollX: targetScrollX, scrollY: targetScrollY, zoom: targetZoom }, onComplete)
    },
    [excalidrawRef, animateTo],
  )

  /**
   * 滚动到指定演示页
   * @param {number} pageIndex - 页码索引
   * @param {Array} slides - 演示页数组
   * @param {Object} options - 可选配置
   * @param {Function} options.onPageTurnStart - 翻页开始回调
   * @param {Function} options.onPageTurnComplete - 翻页完成回调
   */
  const scrollToSlide = useCallback(
    (pageIndex, slides, options = {}) => {
      const { onPageTurnStart, onPageTurnComplete } = options
      const api = excalidrawRef?.current

      if (!api || pageIndex < 0 || pageIndex >= slides.length) return

      const slide = slides[pageIndex]
      const elements = api.getSceneElements()
      const frameElement = elements.find(
        (el) => el.type === "frame" && el.id === slide.id,
      )

      if (frameElement) {
        if (onPageTurnStart) onPageTurnStart()

        zoomToElementsSmooth([frameElement], undefined, () => {
          if (onPageTurnComplete) {
            const appState = api.getAppState()
            onPageTurnComplete({
              scrollX: appState.scrollX,
              scrollY: appState.scrollY,
              zoom: appState.zoom.value,
            })
          }
        })
      }
    },
    [excalidrawRef, zoomToElementsSmooth],
  )

  /**
   * 锁定当前视图状态
   */
  const lockViewState = useCallback(() => {
    const api = excalidrawRef?.current
    if (!api) return
    const appState = api.getAppState()
    lockedViewStateRef.current = {
      scrollX: appState.scrollX,
      scrollY: appState.scrollY,
      zoom: appState.zoom.value,
    }
  }, [excalidrawRef])

  /**
   * 解锁视图状态
   */
  const unlockViewState = useCallback(() => {
    lockedViewStateRef.current = null
    isPageTurningRef.current = false
  }, [])

  /**
   * 更新锁定的视图状态（翻页后调用）
   * @param {Object} newViewState - 新的视图状态
   */
  const updateLockedViewState = useCallback((newViewState) => {
    lockedViewStateRef.current = newViewState
  }, [])

  /**
   * 设置翻页状态标记
   * @param {boolean} isTurning - 是否正在翻页
   */
  const setIsPageTurning = useCallback((isTurning) => {
    isPageTurningRef.current = isTurning
  }, [])

  /**
   * 检测并恢复视图（在 onChange 中调用）
   * @param {Object} currentAppState - 当前 appState
   * @returns {boolean} 是否恢复了视图
   */
  const checkAndRestoreView = useCallback((currentAppState) => {
    if (!lockedViewStateRef.current || isPageTurningRef.current) {
      return false
    }

    const { scrollX, scrollY, zoom } = lockedViewStateRef.current

    if (
      Math.abs(currentAppState.scrollX - scrollX) > SCROLL_THRESHOLD_XY ||
      Math.abs(currentAppState.scrollY - scrollY) > SCROLL_THRESHOLD_XY ||
      Math.abs(currentAppState.zoom.value - zoom) > SCROLL_THRESHOLD_ZOOM
    ) {
      excalidrawRef?.current?.updateScene({
        appState: {
          scrollX,
          scrollY,
          zoom: { value: zoom },
        },
      })
      return true
    }
    return false
  }, [excalidrawRef])

  return {
    // 动画函数
    zoomToElementsSmooth,
    scrollToSlide,

    // 视图锁定
    lockedViewState: lockedViewStateRef.current,
    isPageTurning: isPageTurningRef.current,
    lockViewState,
    unlockViewState,
    updateLockedViewState,
    setIsPageTurning,
    checkAndRestoreView,
  }
}
