/**
 * 鼠标效果设置组件
 * 设置鼠标高亮效果的颜色
 */
import { useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'

// 预设颜色列表
const presetColors = [
  { value: '#ffeb3b', name: '黄色', default: true },
  { value: '#ff5722', name: '橙红' },
  { value: '#e91e63', name: '粉红' },
  { value: '#9c27b0', name: '紫色' },
  { value: '#2196f3', name: '蓝色' },
  { value: '#00bcd4', name: '青色' },
  { value: '#4caf50', name: '绿色' },
  { value: '#ffffff', name: '白色' },
  { value: '#000000', name: '黑色' }
]

function MouseEffectSetting() {
  const { settings, updateSetting } = useSettings()
  const { mouseEffect } = settings
  const [customColor, setCustomColor] = useState(mouseEffect.color)

  // 处理开关
  const handleToggle = (enabled) => {
    updateSetting('mouseEffect', {
      ...mouseEffect,
      enabled
    })
  }

  // 处理颜色选择
  const handleColorSelect = (color) => {
    updateSetting('mouseEffect', {
      ...mouseEffect,
      color
    })
  }

  // 处理自定义颜色
  const handleCustomColorChange = (color) => {
    setCustomColor(color)
    updateSetting('mouseEffect', {
      ...mouseEffect,
      color
    })
  }

  return (
    <div className="setting-section">
      <h4 className="setting-title">鼠标效果</h4>
      
      {/* 开关 */}
      <div className="setting-row">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={mouseEffect.enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="toggle-input"
          />
          <span className="toggle-switch"></span>
          <span>启用鼠标高亮</span>
        </label>
      </div>

      {mouseEffect.enabled && (
        <>
          {/* 预览 */}
          <div className="mouse-effect-preview">
            <div className="preview-label">预览</div>
            <div 
              className="preview-cursor"
              style={{ backgroundColor: mouseEffect.color }}
            >
              <span className="cursor-icon">🖱️</span>
            </div>
          </div>

          {/* 预设颜色 */}
          <div className="setting-row">
            <label className="setting-label">预设颜色</label>
            <div className="color-presets">
              {presetColors.map(color => (
                <button
                  key={color.value}
                  className={`color-preset-btn ${mouseEffect.color === color.value ? 'active' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorSelect(color.value)}
                  title={color.name}
                >
                  {mouseEffect.color === color.value && (
                    <span className="check-mark">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 自定义颜色 */}
          <div className="setting-row">
            <label className="setting-label">自定义颜色</label>
            <div className="custom-color-picker">
              <input
                type="color"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="color-picker-input"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="color-text-input"
                placeholder="#ffeb3b"
              />
            </div>
          </div>

          {/* 当前颜色显示 */}
          <div className="current-color">
            当前颜色: 
            <span 
              className="color-swatch" 
              style={{ backgroundColor: mouseEffect.color }}
            />
            {mouseEffect.color}
          </div>
        </>
      )}
    </div>
  )
}

export default MouseEffectSetting
