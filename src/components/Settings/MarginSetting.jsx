/**
 * 录制区域边距设置组件
 * 设置录制区域与背景图的边距
 */
import { useSettings } from '../../contexts/SettingsContext'

function MarginSetting() {
  const { settings, updateSetting } = useSettings()
  const { margin } = settings

  // 预设边距值
  const presets = [
    { value: 0, label: '0' },
    { value: 10, label: '10' },
    { value: 20, label: '20' },
    { value: 30, label: '30' },
    { value: 50, label: '50' },
    { value: 80, label: '80' },
    { value: 100, label: '100' }
  ]

  // 处理边距变化
  const handleMarginChange = (value) => {
    updateSetting('margin', value)
  }

  return (
    <div className="setting-section">
      <h4 className="setting-title">录制区域边距</h4>
      <p className="setting-desc">
        设置录制区域与背景图边界之间的距离
      </p>

      {/* 预览区域 */}
      <div className="margin-preview">
        <div className="preview-bg">
          <span className="bg-label">背景图</span>
        </div>
        <div 
          className="preview-recording"
          style={{ 
            padding: margin,
            top: margin,
            left: margin,
            right: margin,
            bottom: margin
          }}
        >
          <span className="recording-label">录制区域</span>
        </div>
      </div>

      {/* 预设按钮 */}
      <div className="margin-presets">
        {presets.map(preset => (
          <button
            key={preset.value}
            className={`preset-btn ${margin === preset.value ? 'active' : ''}`}
            onClick={() => handleMarginChange(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>

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

      {/* 说明文字 */}
      <div className="margin-tip">
        边距越大，录制区域越小
      </div>
    </div>
  )
}

export default MarginSetting
