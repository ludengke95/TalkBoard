/**
 * 背景图片设置组件
 * 提供免费图片作为背景选项
 */
import { useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'

// 预设免费背景图片（来自 Pexels/Unsplash）
const presetBackgrounds = [
  { id: 'color', type: 'color', value: '#f5f5f5', name: '纯色背景', thumb: '' },
  { id: 'img1', type: 'image', value: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920', name: '山脉', thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200' },
  { id: 'img2', type: 'image', value: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920', name: '森林', thumb: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200' },
  { id: 'img3', type: 'image', value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920', name: '海滩', thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200' },
  { id: 'img4', type: 'image', value: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920', name: '星空', thumb: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200' },
  { id: 'img5', type: 'image', value: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1920', name: '湖泊', thumb: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=200' },
  { id: 'img6', type: 'image', value: 'https://images.unsplash.com/photo-1518173946687-a4c036bc7792?w=1920', name: '日落', thumb: 'https://images.unsplash.com/photo-1518173946687-a4c036bc7792?w=200' },
  { id: 'img7', type: 'image', value: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=1920', name: '花园', thumb: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=200' },
  { id: 'img8', type: 'image', value: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920', name: '山脉2', thumb: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=200' }
]

function BackgroundSetting() {
  const { settings, updateSetting } = useSettings()
  const { background } = settings
  const [customColor, setCustomColor] = useState(background.value || '#f5f5f5')
  const [customUrl, setCustomUrl] = useState('')

  // 处理背景选择
  const handleBackgroundSelect = (bg) => {
    updateSetting('background', {
      type: bg.type,
      value: bg.value
    })
  }

  // 处理自定义颜色
  const handleColorChange = (color) => {
    setCustomColor(color)
    updateSetting('background', {
      type: 'color',
      value: color
    })
  }

  // 处理自定义图片 URL
  const handleUrlSubmit = () => {
    if (customUrl.trim()) {
      updateSetting('background', {
        type: 'image',
        value: customUrl.trim()
      })
    }
  }

  return (
    <div className="setting-section">
      <h4 className="setting-title">背景选择</h4>
      
      {/* 预设背景网格 */}
      <div className="background-grid">
        {presetBackgrounds.map(bg => (
          <div
            key={bg.id}
            className={`background-option ${background.value === bg.value ? 'selected' : ''}`}
            onClick={() => handleBackgroundSelect(bg)}
            title={bg.name}
          >
            {bg.type === 'color' ? (
              <div 
                className="color-thumb" 
                style={{ backgroundColor: bg.value }}
              />
            ) : (
              <img 
                src={bg.thumb} 
                alt={bg.name}
                className="image-thumb"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            )}
            <span className="background-name">{bg.name}</span>
          </div>
        ))}
      </div>

      {/* 自定义颜色选择 */}
      <div className="custom-background">
        <h5>自定义颜色</h5>
        <div className="color-picker-row">
          <input
            type="color"
            value={customColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="color-input"
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="color-text"
            placeholder="#f5f5f5"
          />
        </div>
      </div>

      {/* 自定义图片 URL */}
      <div className="custom-background">
        <h5>自定义图片 URL</h5>
        <div className="url-input-row">
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="输入图片地址..."
            className="url-input"
          />
          <button 
            className="url-submit-btn"
            onClick={handleUrlSubmit}
          >
            应用
          </button>
        </div>
      </div>
    </div>
  )
}

export default BackgroundSetting
