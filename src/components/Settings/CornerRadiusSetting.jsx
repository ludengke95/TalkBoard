/**
 * 圆角半径设置组件
 * 简洁单栏样式
 */
import { useSettings } from '../../contexts/SettingsContext'

function CornerRadiusSetting() {
  const { settings, updateSetting } = useSettings()
  const { cornerRadius } = settings

  return (
    <div className="setting-item">
      <span className="setting-item-label">圆角</span>
      <div className="setting-item-control">
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>直角</span>
        <input
          type="range"
          min="0"
          max="50"
          value={cornerRadius}
          onChange={(e) => updateSetting('cornerRadius', Number(e.target.value))}
          className="slider-input"
        />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>圆角</span>
        <span className="setting-item-value">{cornerRadius}px</span>
      </div>
    </div>
  )
}

export default CornerRadiusSetting
