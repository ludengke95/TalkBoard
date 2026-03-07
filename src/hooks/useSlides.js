/**
 * 演讲页管理 Hook
 * 提供演讲页的 CRUD、翻页、快捷键等功能
 */
import { useState, useCallback, useEffect, useRef } from "react"
import { convertToExcalidrawElements } from "@excalidraw/excalidraw"
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
 * @param {Function} options.scrollToSlide - 滚动到指定演示页函数（从外部传入）
 * @param {Function} options.onPageTurnStart - 翻页开始回调
 * @param {Function} options.onPageTurnComplete - 翻页完成回调
 * @returns {Object} 演讲页状态和操作函数
 */
export const useSlides = ({
  excalidrawRef,
  aspectRatio,
  recordingStep,
  scrollToSlide,
  onPageTurnStart,
  onPageTurnComplete,
}) => {
  // 演讲页状态
  const [slides, setSlides] = useState([])
  const [currentPage, setCurrentPage] = useState(0)

  // 记录上一次 slides 长度，用于检测新增
  const prevSlidesLengthRef = useRef(slides.length)

  // 跟踪上一次的演示页 frameIds，用于检测变化
  const prevSlideFrameIdsRef = useRef(null)

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
        customData: {
          isSlide: true,
        },
      }
      const elements = convertToExcalidrawElements([frameData], {
        regenerateIds: false,
      })
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

      const slideToDelete = slides[pageToDelete]
      if (!slideToDelete) return

      const elements = excalidrawRef.current.getSceneElements()

      const frameToDelete = elements.find(
        (el) => el.type === "frame" && el.id === slideToDelete.id,
      )
      if (!frameToDelete) return

      const updatedElements = elements.map((el) => {
        if (el.id === frameToDelete.id) {
          return { ...el, isDeleted: true }
        }
        if (el.frameId === frameToDelete.id) {
          return { ...el, isDeleted: true }
        }
        return el
      })
      excalidrawRef.current.updateScene({ 
        elements: updatedElements,
        commitToHistory: true,
      })

      const newSlides = slides.filter((_, idx) => idx !== pageToDelete)
      setSlides(newSlides)

      if (prevSlideFrameIdsRef.current) {
        prevSlideFrameIdsRef.current.delete(slideToDelete.id)
      }

      let newCurrentPage = currentPage
      if (newSlides.length === 0) {
        newCurrentPage = 0
      } else if (pageToDelete < currentPage) {
        newCurrentPage = currentPage - 1
      } else if (pageToDelete === currentPage) {
        newCurrentPage = Math.min(currentPage, newSlides.length - 1)
      }
      setCurrentPage(newCurrentPage)
      // 使用外部传入的 scrollToSlide
      if (scrollToSlide) {
        scrollToSlide(newCurrentPage, newSlides)
      }
    },
    [slides, currentPage, excalidrawRef, scrollToSlide],
  )

  /**
   * 选择演讲页 - 定位到画布对应位置
   * @param {number} index - 页码索引
   */
  const handleSelectSlide = useCallback(
    (index) => {
      setCurrentPage(index)
      if (scrollToSlide) {
        scrollToSlide(index, slides)
      }
    },
    [scrollToSlide, slides],
  )

  /**
   * 添加演讲页
   */
  const handleAddSlide = useCallback(() => {
    if (!excalidrawRef.current) return

    const { width, height } = getSlideSize()
    const gap = 80

    let newX = 100
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

    const existingElements = excalidrawRef.current.getSceneElements()
    excalidrawRef.current.updateScene({
      elements: [...existingElements, frameElement],
      commitToHistory: true,
    })

    if (prevSlideFrameIdsRef.current) {
      prevSlideFrameIdsRef.current.add(newSlide.id)
    }

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
      
      if (scrollToSlide) {
        scrollToSlide(currentPage - 1, slides, {
          onPageTurnStart: isRecordingMode ? onPageTurnStart : undefined,
          onPageTurnComplete: isRecordingMode ? onPageTurnComplete : undefined,
        })
      }
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage, slides, scrollToSlide, recordingStep, onPageTurnStart, onPageTurnComplete])

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
      
      if (scrollToSlide) {
        scrollToSlide(currentPage + 1, slides, {
          onPageTurnStart: isRecordingMode ? onPageTurnStart : undefined,
          onPageTurnComplete: isRecordingMode ? onPageTurnComplete : undefined,
        })
      }
      setCurrentPage(currentPage + 1)
    }
  }, [currentPage, slides.length, scrollToSlide, recordingStep, onPageTurnStart, onPageTurnComplete])

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
   * 处理双向同步：frame 删除/新增（撤销/重做）
   * @param {Array} elements - 画布上的所有元素
   */
  const syncSlidesWithFrames = useCallback(
    (elements) => {
      const slideFrames = elements.filter(
        (el) => el.type === "frame" && !el.isDeleted && el.customData?.isSlide === true,
      )
      const slideFrameIds = new Set(slideFrames.map((el) => el.id))

      if (prevSlideFrameIdsRef.current === null) {
        prevSlideFrameIdsRef.current = slideFrameIds
        if (slideFrames.length > 0 && slides.length === 0) {
          const initialSlides = slideFrames.map((frame) => ({
            id: frame.id,
            name: frame.name || `${i18n.t('slide.name')}`,
            x: frame.x,
            y: frame.y,
            width: frame.width,
            height: frame.height,
          }))
          setSlides(initialSlides)
        }
        return
      }

      const prevSlideFrameIds = prevSlideFrameIdsRef.current

      const deletedIds = [...prevSlideFrameIds].filter((id) => !slideFrameIds.has(id))
      const addedIds = [...slideFrameIds].filter((id) => !prevSlideFrameIds.has(id))

      if (deletedIds.length === 0 && addedIds.length === 0) {
        return
      }

      prevSlideFrameIdsRef.current = slideFrameIds

      let newSlides = [...slides]

      if (deletedIds.length > 0) {
        newSlides = newSlides.filter((slide) => slideFrameIds.has(slide.id))
      }

      if (addedIds.length > 0) {
        const addedSlides = addedIds.map((id) => {
          const frame = slideFrames.find((el) => el.id === id)
          return {
            id: frame.id,
            name: frame.name || `${i18n.t('slide.name')}`,
            x: frame.x,
            y: frame.y,
            width: frame.width,
            height: frame.height,
          }
        })
        newSlides = [...newSlides, ...addedSlides]
      }

      setSlides(newSlides)

      if (newSlides.length === 0) {
        setCurrentPage(0)
      } else if (currentPage >= newSlides.length) {
        setCurrentPage(newSlides.length - 1)
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
    getSlideSize,
    syncSlidesWithFrames,
  }
}
