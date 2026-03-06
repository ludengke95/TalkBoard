/**
 * Excalidraw 平滑滚动 Hook
 * 提供平滑的视图滚动和缩放动画功能
 */
import { useCallback, useRef } from "react"
import { getCommonBounds } from "@excalidraw/excalidraw"

/**
 * 平滑滚动 Hook
 * @param {React.RefObject} excalidrawRef - Excalidraw API 引用
 * @returns {Object} 滚动相关方法
 */
export const useExcalidrawScroll = (excalidrawRef) => {
  // 动画帧引用，用于取消动画
  const animationRef = useRef()

  /**
   * 平滑动画到目标状态
   * @param {Object} targetState - 目标状态
   * @param {number} targetState.scrollX - 目标 X 滚动位置
   * @param {number} targetState.scrollY - 目标 Y 滚动位置
   * @param {number} targetState.zoom - 目标缩放值
   */
  const animateTo = useCallback(
    (targetState) => {
      const api = excalidrawRef?.current
      if (!api) return

      const step = () => {
        const currentState = api.getAppState()
        const easing = 0.15 // 灵敏度，越小越平滑

        // 计算当前位置与目标的差距
        const dx = targetState.scrollX - currentState.scrollX
        const dy = targetState.scrollY - currentState.scrollY
        const dz = targetState.zoom - currentState.zoom.value

        // 如果差距足够小，停止动画并设置最终值
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && Math.abs(dz) < 0.001) {
          api.updateScene({
            appState: {
              scrollX: targetState.scrollX,
              scrollY: targetState.scrollY,
              zoom: { value: targetState.zoom },
            },
          })
          return
        }

        // 每一帧更新一小步（缓动效果）
        api.updateScene({
          appState: {
            scrollX: currentState.scrollX + dx * easing,
            scrollY: currentState.scrollY + dy * easing,
            zoom: { value: currentState.zoom.value + dz * easing },
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
   */
  const zoomToElementsSmooth = useCallback(
    (elements, padding = { top: 120, right: 60, bottom: 60, left: 60 }) => {
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
      animateTo({ scrollX: targetScrollX, scrollY: targetScrollY, zoom: targetZoom })
    },
    [excalidrawRef, animateTo],
  )

  return { zoomToElementsSmooth }
}
