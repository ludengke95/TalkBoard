/**
 * 演讲页管理 Hook
 * 提供演讲页的 CRUD、翻页、快捷键等功能
 */
import { useState, useCallback, useEffect, useRef } from "react"
import { convertToExcalidrawElements } from "@excalidraw/excalidraw"
import { useExcalidrawScroll } from "./useExcalidrawScroll"
import i18n from "../i18n"

/**
 * 计算演讲页尺寸
 * 根据画面比例返回固定尺寸
 * @param {string} aspectRatio - 画面比例
 * @returns {{ width: number, height: number }} 尺寸对象
 */
export const calculateSlideSize = (aspectRatio) => {
  // 固定尺寸映射表
  const sizeMap = {
    "16:9": { width: 1920, height: 1080 },
    "4:3": { width: 1280, height: 960 },
    "3:4": { width: 960, height: 1280 },
    "9:16": { width: 1080, height: 1920 },
    "1:1": { width: 800, height: 800 },
  }

  // 根据当前画面比例返回对应尺寸，默认 16:9
  return sizeMap[aspectRatio] || sizeMap["16:9"]
}

/**
 * 生成随机 ID
 * @returns {string} 随机 ID
 */
const generateId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  )
}

/**
 * 演讲页管理 Hook
 * @param {Object} options - 配置选项
 * @param {React.RefObject} options.excalidrawRef - Excalidraw API 引用
 * @param {string} options.aspectRatio - 画面比例
 * @param {string} options.recordingStep - 录制状态
 * @param {Function} options.onPageTurnStart - 翻页开始回调
 * @param {Function} options.onPageTurnComplete - 翻页完成回调
 * @returns {Object} 演讲页状态和操作函数
 */
export const useSlides = ({
  excalidrawRef,
  aspectRatio,
  recordingStep,
  onPageTurnStart,
  onPageTurnComplete,
}) => {
  // 演讲页状态
  const [slides, setSlides] = useState([])
  const [currentPage, setCurrentPage] = useState(0)

  // 记录上一次 slides 长度，用于检测新增
  const prevSlidesLengthRef = useRef(slides.length)

  // 平滑滚动 Hook
  const { zoomToElementsSmooth } = useExcalidrawScroll(excalidrawRef)

  /**
   * 获取当前演讲页尺寸
   * @returns {{ width: number, height: number }}
   */
  const getSlideSize = useCallback(() => {
    return calculateSlideSize(aspectRatio)
  }, [aspectRatio])

  /**
   * 创建演讲页 Frame 元素
   * @param {Object} slideInfo - 演讲页信息
   * @returns {Object} Excalidraw Frame 元素
   */
  const createSlideElement = useCallback(
    (slideInfo) => {
      const { width, height } = getSlideSize()
      const frameData = {
        type: "frame",
        id: slideInfo.id,
        width: slideInfo.width || width,
        height: slideInfo.height || height,
        name: slideInfo.name,
        children: [],
      }
      const elements = convertToExcalidrawElements([frameData], {
        regenerateIds: false,
      })
      // 转换后再手动设置位置
      if (elements[0]) {
        elements[0].x = slideInfo.x
        elements[0].y = slideInfo.y
      }
      return elements[0]
    },
    [getSlideSize],
  )

  /**
   * 删除演讲页
   * @param {number} index - 要删除的页码索引
   */
  const handleDeleteSlide = useCallback(
    (index) => {
      if (!excalidrawRef.current) return

      const pageToDelete = index !== undefined ? index : currentPage

      // 获取要删除的 slide 信息
      const slideToDelete = slides[pageToDelete]
      if (!slideToDelete) return

      // 获取画布上的所有元素
      const elements = excalidrawRef.current.getSceneElements()

      // 通过 slide.id 精确匹配 frame 元素（而不是依赖索引）
      const frameToDelete = elements.find(
        (el) => el.type === "frame" && el.id === slideToDelete.id,
      )
      if (!frameToDelete) return

      // 删除 frame 及其内部所有子元素
      const updatedElements = elements.map((el) => {
        // 删除 frame 本身
        if (el.id === frameToDelete.id) {
          return { ...el, isDeleted: true }
        }
        // 删除 frame 内部的子元素（通过 frameId 关联）
        if (el.frameId === frameToDelete.id) {
          return { ...el, isDeleted: true }
        }
        return el
      })
      excalidrawRef.current.updateScene({ elements: updatedElements })

      // 更新演讲页数组
      const newSlides = slides.filter((_, idx) => idx !== pageToDelete)
      setSlides(newSlides)

      // 调整当前页码
      let newCurrentPage = currentPage
      if (newSlides.length === 0) {
        // 如果没有剩余页面，重置为 0
        newCurrentPage = 0
      } else if (pageToDelete < currentPage) {
        // 如果删除的是当前页之前的页面，当前页码减 1
        newCurrentPage = currentPage - 1
      } else if (pageToDelete === currentPage) {
        // 如果删除的是当前页，保持在当前索引（或最后一页）
        newCurrentPage = Math.min(currentPage, newSlides.length - 1)
      }
      setCurrentPage(newCurrentPage)
    },
    [slides, currentPage, excalidrawRef],
  )

  /**
   * 翻页到指定页
   * @param {number} pageIndex - 目标页码
   * @param {Object} options - 可选配置
   * @param {boolean} options.isRecording - 是否正在录制
   * @param {Function} options.onPageTurnStart - 翻页开始回调
   * @param {Function} options.onPageTurnComplete - 翻页完成回调
   */
  const scrollToPage = useCallback(
    (pageIndex, options = {}) => {
      const { isRecording, onPageTurnStart, onPageTurnComplete } = options
      console.log(pageIndex + "," + slides.length)
      if (!excalidrawRef.current || pageIndex < 0 || pageIndex >= slides.length)
        return

      const slide = slides[pageIndex]

      // 先设置当前页码
      setCurrentPage(pageIndex)
      // 获取画布中的所有 frame 元素
      const elements = excalidrawRef.current.getSceneElements()
      const frameElement = elements.filter(
        (el) => el.type === "frame" && el.id === slide.id,
      )

      if (frameElement && frameElement[0]) {
        // 如果正在录制，通知开始翻页
        if (isRecording && onPageTurnStart) {
          onPageTurnStart()
        }

        // 使用平滑滚动动画定位到演讲页
        // 传入完成回调
        zoomToElementsSmooth([frameElement[0]], undefined, () => {
          // 翻页动画完成后，如果正在录制，通知完成并更新锁定视图
          if (isRecording && onPageTurnComplete) {
            const appState = excalidrawRef.current.getAppState()
            onPageTurnComplete({
              scrollX: appState.scrollX,
              scrollY: appState.scrollY,
              zoom: appState.zoom.value,
            })
          }
        })
      }
    },
    [slides, excalidrawRef, zoomToElementsSmooth],
  )

  /**
   * 选择演讲页 - 定位到画布对应位置
   * @param {number} index - 页码索引
   */
  const handleSelectSlide = useCallback(
    (index) => {
      scrollToPage(index)
    },
    [scrollToPage],
  )

  /**
   * 添加演讲页
   */
  const handleAddSlide = useCallback(() => {
    if (!excalidrawRef.current) return

    const { width, height } = getSlideSize()
    const gap = 80

    let newX = 100
    // 从 React 状态中获取最后一个演讲页的位置
    if (slides.length > 0) {
      const lastSlide = slides[slides.length - 1]
      newX = lastSlide.x + lastSlide.width + gap
    }

    const newSlide = {
      id: generateId(),
      name: `${i18n.t('slide.name')} ${slides.length + 1}`,
      x: newX,
      y: 100,
      width: width,
      height: height,
    }

    const frameElement = createSlideElement(newSlide)

    // 获取现有元素并追加新元素
    const existingElements = excalidrawRef.current.getSceneElements()
    excalidrawRef.current.updateScene({
      elements: [...existingElements, frameElement],
    })

    // 更新演讲页状态
    setSlides((prev) => [...prev, newSlide])
  }, [slides, getSlideSize, createSlideElement, excalidrawRef])

  /**
   * 重新排序演讲页
   * @param {Array} newOrder - 新的演讲页顺序
   */
  const handleReorderSlides = useCallback((newOrder) => {
    setSlides(newOrder)
    setCurrentPage(0)
  }, [])

  /**
   * 上一页
   */
  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      // selecting/ready/recording 状态都需要翻页回调来更新锁定视图
      const isRecordingMode =
        recordingStep === "selecting" ||
        recordingStep === "ready" ||
        recordingStep === "recording"
      scrollToPage(currentPage - 1, {
        isRecording: isRecordingMode,
        onPageTurnStart,
        onPageTurnComplete,
      })
    }
  }, [currentPage, scrollToPage, recordingStep, onPageTurnStart, onPageTurnComplete])

  /**
   * 下一页
   */
  const handleNextPage = useCallback(() => {
    if (currentPage < slides.length - 1) {
      // selecting/ready/recording 状态都需要翻页回调来更新锁定视图
      const isRecordingMode =
        recordingStep === "selecting" ||
        recordingStep === "ready" ||
        recordingStep === "recording"
      scrollToPage(currentPage + 1, {
        isRecording: isRecordingMode,
        onPageTurnStart,
        onPageTurnComplete,
      })
    }
  }, [currentPage, slides.length, scrollToPage, recordingStep, onPageTurnStart, onPageTurnComplete])

  // 监听 slides 变化，新增演讲页时自动滚动到最后一个
  useEffect(() => {
    // 检测是否新增了演讲页
    if (slides.length > prevSlidesLengthRef.current && slides.length > 0) {
      // 滚动到最后一个演讲页
      handleSelectSlide(slides.length - 1)
    }
    // 更新记录的长度
    prevSlidesLengthRef.current = slides.length
  }, [slides, handleSelectSlide])

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 忽略输入框中的快捷键
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "n":
        case "N":
          e.preventDefault()
          handleNextPage()
          break
        case "ArrowLeft":
        case "ArrowUp":
        case "p":
        case "P":
          e.preventDefault()
          handlePrevPage()
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleNextPage, handlePrevPage])

  /**
   * 同步 slides 与画布上的 frame 元素
   * 当 frame 被删除时，同步删除对应的 slide
   * @param {Array} elements - 画布上的所有元素
   */
  const syncSlidesWithFrames = useCallback(
    (elements) => {
      const frameElements = elements.filter(
        (el) => el.type === "frame" && !el.isDeleted,
      )
      const frameIds = new Set(frameElements.map((el) => el.id))

      const deletedSlides = slides.filter((slide) => !frameIds.has(slide.id))

      if (deletedSlides.length > 0) {
        const newSlides = slides.filter((slide) => frameIds.has(slide.id))
        setSlides(newSlides)

        if (newSlides.length === 0) {
          setCurrentPage(0)
        } else if (currentPage >= newSlides.length) {
          setCurrentPage(newSlides.length - 1)
        }
      }
    },
    [slides, currentPage],
  )

  return {
    slides,
    currentPage,
    setSlides,
    setCurrentPage,
    handleAddSlide,
    handleDeleteSlide,
    handleSelectSlide,
    handleReorderSlides,
    handlePrevPage,
    handleNextPage,
    scrollToPage,
    getSlideSize,
    syncSlidesWithFrames,
  }
}
