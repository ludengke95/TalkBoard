/**
 * 画面比例设置组件
 * 简洁单栏样式
 */
import { useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'

const aspectRatios = [
  { value: '16:9', label: '16:9' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
]

function AspectRatioSetting() {
  const { settings, updateSetting } = useSettings()
  const { aspectRatio } = settings

  const [customWidth, setCustomWidth] = useState(16)
  const [customHeight, setCustomHeight] = useState(9)

  const handleCustomChange = (width, height) => {
    setCustomWidth(width)
    setCustomHeight(height)
    updateSetting('aspectRatio', `${width}:${height}`)
  }

  const isCustom = !aspectRatios.find(r => r.value === aspectRatio)

  return (
    <div className="setting-item">
      <span className="setting-item-label">画面比例</span>
      <div className="setting-item-control">
        <div className="radio-group">
          {aspectRatios.map(ratio => (
            <button
              key={ratio.value}
              className={`radio-btn ${aspectRatio === ratio.value ? 'active' : ''}`}
              onClick={() => updateSetting('aspectRatio', ratio.value)}
            >
              {ratio.label}
            </button>
          ))}
        </div>
        {isCustom && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
            <input
              type="number"
              value={customWidth}
              onChange={(e) => handleCustomChange(Number(e.target.value), customHeight)}
              style={{ width: '40px', padding: '4px', fontSize: '12px' }}
            />
            <span>:</span>
            <input
              type="number"
              value={customHeight}
              onChange={(e) => handleCustomChange(customWidth, Number(e.target.value))}
              style={{ width: '40px', padding: '4px', fontSize: '12px' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default AspectRatioSetting
