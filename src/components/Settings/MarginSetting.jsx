/**
 * 录制区域边距设置组件
 * 设置录制区域与背景图的边距
 */
import { useSettings } from '../../contexts/SettingsContext'

function MarginSetting() {
  const { settings, updateSetting } = useSettings()
  const { margin } = settings

  // 处理边距变化
  const handleMarginChange = (value) => {
    updateSetting('margin', value)
  }

  return (
    <div className="setting-section">
      <h4 className="setting-title">录制区域边距</h4>
      
      {/* 滑块 */}
      <div className="margin-slider">
        <input
          type="range"
          min="0"
          max="150"
          value={margin}
          onChange={(e) => handleMarginChange(Number(e.target.value))}
          className="slider-input"
        />
        <span className="slider-value">{margin}px</span>
      </div>
    </div>
  )
}

export default MarginSetting
