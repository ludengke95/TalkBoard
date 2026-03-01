/**
 * 背景设置组件
 * 简洁单栏样式
 */
import { useSettings } from '../../contexts/SettingsContext'

const presetBackgrounds = [
  { id: 'color', type: 'color', value: '#f5f5f5' },
  { id: 'img1', type: 'image', value: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920' },
  { id: 'img2', type: 'image', value: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920' },
  { id: 'img3', type: 'image', value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920' },
  { id: 'img4', type: 'image', value: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920' },
  { id: 'img5', type: 'image', value: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1920' },
]

function BackgroundSetting() {
  const { settings, updateSetting } = useSettings()
  const { background } = settings

  const handleBackgroundSelect = (bg) => {
    updateSetting('background', {
      type: bg.type,
      value: bg.value
    })
  }

  return (
    <div className="setting-item">
      <span className="setting-item-label">背景</span>
      <div className="setting-item-control" style={{ gap: '4px' }}>
        {presetBackgrounds.map(bg => (
          <button
            key={bg.id}
            onClick={() => handleBackgroundSelect(bg)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: background.value === bg.value 
                ? '2px solid var(--color-primary)' 
                : '1px solid var(--border-color)',
              background: bg.type === 'color' 
                ? bg.value 
                : `url(${bg.value}) center/cover`,
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.15s ease',
            }}
            title={bg.type === 'color' ? '纯色' : '图片'}
          />
        ))}
        <input
          type="color"
          value={background.type === 'color' ? background.value : '#f5f5f5'}
          onChange={(e) => updateSetting('background', { type: 'color', value: e.target.value })}
          style={{
            width: '28px',
            height: '28px',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            padding: '2px',
          }}
          title="自定义颜色"
        />
      </div>
    </div>
  )
}

export default BackgroundSetting
