/**
 * 画面比例设置组件
 * 支持 16:9, 4:3, 3:4, 9:16, 1:1, 自定义
 */
import { useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'

// 可选比例列表
const aspectRatios = [
  { value: '16:9', label: '16:9', desc: '宽屏 (常见于电脑)' },
  { value: '4:3', label: '4:3', desc: '标准 (常见于旧显示器)' },
  { value: '3:4', label: '3:4', desc: '竖屏 (常见于小红书)' },
  { value: '9:16', label: '9:16', desc: '竖屏 (常见于抖音)' },
  { value: '1:1', label: '1:1', desc: '正方形 (常见于Instagram)' },
  { value: 'custom', label: '自定义', desc: '自定义宽高比' }
]

function AspectRatioSetting() {
  const { settings, updateSetting } = useSettings()
  const { aspectRatio } = settings

  // 自定义宽高比输入值
  const [customWidth, setCustomWidth] = useState(16)
  const [customHeight, setCustomHeight] = useState(9)

  // 处理比例选择
  const handleRatioChange = (ratio) => {
    updateSetting('aspectRatio', ratio)
  }

  // 处理自定义宽高输入
  const handleCustomChange = (width, height) => {
    setCustomWidth(width)
    setCustomHeight(height)
    // 保存为自定义比例
    updateSetting('aspectRatio', `${width}:${height}`)
  }

  return (
    <div className="setting-section">
      <h4 className="setting-title">画面比例</h4>
      <div className="aspect-ratio-grid">
        {aspectRatios.map(ratio => (
          <label 
            key={ratio.value} 
            className={`aspect-ratio-option ${aspectRatio === ratio.value || 
              (ratio.value === 'custom' && !aspectRatios.find(r => r.value === aspectRatio)) 
              ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="aspectRatio"
              value={ratio.value}
              checked={aspectRatio === ratio.value || 
                (ratio.value === 'custom' && !aspectRatios.find(r => r.value === aspectRatio))}
              onChange={() => handleRatioChange(ratio.value)}
            />
            <span className="ratio-label">{ratio.label}</span>
            <span className="ratio-desc">{ratio.desc}</span>
          </label>
        ))}
      </div>

      {/* 自定义比例输入 */}
      {aspectRatio === 'custom' || !aspectRatios.find(r => r.value === aspectRatio) ? (
        <div className="custom-ratio-input">
          <input
            type="number"
            min="1"
            max="100"
            value={customWidth}
            onChange={(e) => handleCustomChange(Number(e.target.value), customHeight)}
            placeholder="宽度"
          />
          <span>:</span>
          <input
            type="number"
            min="1"
            max="100"
            value={customHeight}
            onChange={(e) => handleCustomChange(customWidth, Number(e.target.value))}
            placeholder="高度"
          />
        </div>
      ) : null}
    </div>
  )
}

export default AspectRatioSetting
