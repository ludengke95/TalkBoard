/**
 * 设置状态管理上下文
 * 使用 localStorage 持久化保存用户设置
 */
import { createContext, useContext, useState, useEffect } from 'react'
import i18n from '../i18n'

// localStorage 存储键名
const STORAGE_KEY = 'byv-settings'

// 默认设置值
const defaultSettings = {
  // 主题模式
  theme: 'light',
  // 语言设置
  language: 'zh-CN',
  // 1. 画面比例
  aspectRatio: '16:9',
  // 2. 圆角半径
  cornerRadius: 12,
  // 3. 摄像头设置
  camera: {
    enabled: false,
    shape: 'circle', // 'circle' | 'square'
    size: 120, // 摄像头画面大小
    position: 'bottom-right',
    offsetX: 20, // 距离右边界的距离
    offsetY: 20  // 距离下边界的距离
  },
  // 4. 麦克风设置
  microphone: {
    enabled: false,
    deviceId: '' // 选中的麦克风设备 ID
  },
  // 5. 鼠标效果设置
  mouseEffect: {
    enabled: true,
    color: '#ffeb3b' // 鼠标高亮颜色
  }
}

// 从 localStorage 加载设置
function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      // 合并默认设置和存储的设置，确保新字段有值
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
  return defaultSettings
}

// 保存设置到 localStorage
function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('保存设置失败:', error)
  }
}

// 创建 React Context
const SettingsContext = createContext(null)

// Provider 组件
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => loadSettings())

  // 当设置变化时自动保存到 localStorage
  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  // 同步语言设置到 i18n
  useEffect(() => {
    if (settings.language && i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language)
    }
  }, [settings.language])

  // 更新单个设置项
  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 重置为默认设置
  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  const value = {
    settings,
    updateSetting,
    resetSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

// 自定义 Hook：使用设置上下文
export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings 必须在 SettingsProvider 内部使用')
  }
  return context
}

export { defaultSettings }
