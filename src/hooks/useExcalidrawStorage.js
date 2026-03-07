/**
 * Excalidraw 画布持久化 Hook
 * 提供画布内容的 localStorage 存储、加载和版本迁移功能
 */
import { useCallback, useRef, useEffect } from "react"

const STORAGE_VERSION = 1
const STORAGE_KEY = "byv-excalidraw-data"

const migrations = {
  "0->1": (data) => data,
}

/**
 * 执行版本迁移
 * @param {Object} storedData - 存储的数据
 * @param {number} targetVersion - 目标版本
 * @returns {Object} 迁移后的数据
 */
function migrateData(storedData, targetVersion) {
  let currentVersion = storedData.version || 0
  let data = storedData.data || storedData

  while (currentVersion < targetVersion) {
    const migrationKey = `${currentVersion}->${currentVersion + 1}`
    if (migrations[migrationKey]) {
      data = migrations[migrationKey](data)
    }
    currentVersion++
  }

  return { version: targetVersion, data }
}

/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, delay) {
  let timer = null
  return (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Excalidraw 画布持久化 Hook
 * @returns {Object} 存储相关方法
 */
export const useExcalidrawStorage = () => {
  const pendingSaveRef = useRef(null)
  const debouncedSaveRef = useRef(null)

  const saveToStorage = useCallback((elements, appState) => {
    pendingSaveRef.current = { elements, appState }

    if (!debouncedSaveRef.current) {
      debouncedSaveRef.current = debounce((els, state) => {
        try {
          const payload = {
            version: STORAGE_VERSION,
            timestamp: Date.now(),
            data: {
              elements: els,
              appState: {
                viewBackgroundColor: state.viewBackgroundColor,
                scrollX: state.scrollX,
                scrollY: state.scrollY,
                zoom: state.zoom?.value ?? state.zoom,
              },
            },
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
        } catch (error) {
          console.error("保存画布数据失败:", error)
        }
      }, 500)
    }

    debouncedSaveRef.current(elements, appState)
  }, [])

  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const parsed = JSON.parse(stored)

      if (parsed.version !== STORAGE_VERSION) {
        const migrated = migrateData(parsed, STORAGE_VERSION)
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...migrated,
            timestamp: Date.now(),
          })
        )
        return migrated.data
      }

      return parsed.data
    } catch (error) {
      console.error("加载画布数据失败:", error)
      return null
    }
  }, [])

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error("清除画布数据失败:", error)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (pendingSaveRef.current && debouncedSaveRef.current) {
        const { elements, appState } = pendingSaveRef.current
        try {
          const payload = {
            version: STORAGE_VERSION,
            timestamp: Date.now(),
            data: {
              elements,
              appState: {
                viewBackgroundColor: appState.viewBackgroundColor,
                scrollX: appState.scrollX,
                scrollY: appState.scrollY,
                zoom: appState.zoom?.value ?? appState.zoom,
              },
            },
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
        } catch (error) {
          console.error("组件卸载时保存画布数据失败:", error)
        }
      }
    }
  }, [])

  return {
    saveToStorage,
    loadFromStorage,
    clearStorage,
    currentVersion: STORAGE_VERSION,
  }
}
