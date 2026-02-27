/**
 * 鼠标效果设置组件
 * 设置鼠标高亮效果的颜色
 */
import { useSettings } from '../../contexts/SettingsContext'

// 柔和彩虹7色
const presetColors = [
  { value: '#ff6b6b', name: '珊瑚红' },
  { value: '#ffa94d', name: '杏色' },
  { value: '#ffe066', name: '淡黄' },
  { value: '#69db7c', name: '薄荷绿' },
  { value: '#74c0fc', name: '天蓝' },
  { value: '#b197fc', name: '淡紫' },
  { value: '#f783ac', name: '粉红' }
]

function MouseEffectSetting() {
  const { settings, updateSetting } = useSettings()
  const { mouseEffect } = settings

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
          {/* 预设颜色 */}
          <div className="setting-row">
            <label className="setting-label">颜色</label>
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
        </>
      )}
    </div>
  )
}

export default MouseEffectSetting
