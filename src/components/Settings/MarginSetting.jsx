/**
 * 边距设置组件
 * 简洁单栏样式
 */
import { useSettings } from '../../contexts/SettingsContext'

function MarginSetting() {
  const { settings, updateSetting } = useSettings()
  const { margin } = settings

  return (
    <div className="setting-item">
      <span className="setting-item-label">边距</span>
      <div className="setting-item-control">
        <input
          type="range"
          min="0"
          max="100"
          value={margin}
          onChange={(e) => updateSetting('margin', Number(e.target.value))}
          className="slider-input"
        />
        <span className="setting-item-value">{margin}px</span>
      </div>
    </div>
  )
}

export default MarginSetting
