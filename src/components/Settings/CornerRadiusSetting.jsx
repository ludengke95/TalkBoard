/**
 * 圆角半径设置组件
 * 设置录制框的圆角半径
 */
import { useSettings } from '../../contexts/SettingsContext'

function CornerRadiusSetting() {
  const { settings, updateSetting } = useSettings()
  const { cornerRadius } = settings

  // 预设圆角值
  const presets = [
    { value: 0, label: '0px', name: '无圆角' },
    { value: 4, label: '4px', name: '轻微' },
    { value: 8, label: '8px', name: '小' },
    { value: 12, label: '12px', name: '中等' },
    { value: 16, label: '16px', name: '大' },
    { value: 24, label: '24px', name: '很大' },
    { value: 32, label: '32px', name: '超大' }
  ]

  // 处理圆角变化
  const handleRadiusChange = (value) => {
    updateSetting('cornerRadius', value)
  }

  return (
    <div className="setting-section">
      <h4 className="setting-title">圆角半径</h4>
      <p className="setting-desc">设置录制框四个角的圆角程度</p>
      
      {/* 预览区域 */}
      <div className="corner-radius-preview">
        <div 
          className="preview-box"
          style={{ borderRadius: `${cornerRadius}px` }}
        >
          录制区域
        </div>
      </div>

      {/* 预设按钮 */}
      <div className="corner-radius-presets">
        {presets.map(preset => (
          <button
            key={preset.value}
            className={`preset-btn ${cornerRadius === preset.value ? 'active' : ''}`}
            onClick={() => handleRadiusChange(preset.value)}
            title={preset.name}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* 滑块 */}
      <div className="corner-radius-slider">
        <input
          type="range"
          min="0"
          max="50"
          value={cornerRadius}
          onChange={(e) => handleRadiusChange(Number(e.target.value))}
          className="slider-input"
        />
        <span className="slider-value">{cornerRadius}px</span>
      </div>
    </div>
  )
}

export default CornerRadiusSetting
