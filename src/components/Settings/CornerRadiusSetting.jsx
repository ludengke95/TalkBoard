/**
 * 圆角半径设置组件
 * 设置录制框的圆角半径
 */
import { useSettings } from '../../contexts/SettingsContext'

function CornerRadiusSetting() {
  const { settings, updateSetting } = useSettings()
  const { cornerRadius } = settings

  // 处理圆角变化
  const handleRadiusChange = (value) => {
    updateSetting('cornerRadius', value)
  }

  return (
    <div className="setting-section">
      <h4 className="setting-title">圆角半径</h4>
      
      {/* 滑块 */}
      <div className="corner-radius-slider">
        <span className="slider-label">直角</span>
        <input
          type="range"
          min="0"
          max="50"
          value={cornerRadius}
          onChange={(e) => handleRadiusChange(Number(e.target.value))}
          className="slider-input"
        />
        <span className="slider-label">圆角</span>
        <span className="slider-value">{cornerRadius}px</span>
      </div>
    </div>
  )
}

export default CornerRadiusSetting
