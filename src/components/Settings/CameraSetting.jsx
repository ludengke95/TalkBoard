/**
 * 摄像头设置组件
 * 简洁单栏样式，支持展开/收起动画
 */
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../contexts/SettingsContext'
import { useMediaDevices } from '../../hooks/useMediaDevices'
import Select from './Select'

function CameraSetting() {
  const { t } = useTranslation()
  const { settings, updateSetting } = useSettings()
  const { camera } = settings
  const { videoDevices } = useMediaDevices()

  // 形状选项列表
  const shapes = [
    { value: 'circle', label: t('camera.shapeCircle') },
    { value: 'square', label: t('camera.shapeSquare') }
  ]

  // 位置选项列表（按网格顺序：左上、右上、左下、右下）
  const positions = [
    { value: 'top-left', label: t('camera.positionTopLeft') },
    { value: 'top-right', label: t('camera.positionTopRight') },
    { value: 'bottom-left', label: t('camera.positionBottomLeft') },
    { value: 'bottom-right', label: t('camera.positionBottomRight') }
  ]

  // 设备选项列表
  const deviceOptions = [
    { value: '', label: t('camera.defaultDevice') },
    ...videoDevices.map((device, index) => ({
      value: device.deviceId,
      label: device.label || `摄像头 ${index + 1}`
    }))
  ]

  return (
    <div className="setting-item camera-setting">
      <div className="camera-setting-header">
        <span className="setting-item-label">{t('camera.label')}</span>
        <button
          className={`toggle-switch ${camera.enabled ? 'active' : ''}`}
          onClick={() => updateSetting('camera', { ...camera, enabled: !camera.enabled })}
        />
      </div>
      {/* 使用 CSS 类控制展开/收起动画，而不是条件渲染 */}
      <div className={`camera-setting-options ${camera.enabled ? 'expanded' : 'collapsed'}`}>
        <div className="camera-setting-row">
          <span className="camera-setting-label">{t('camera.shape')}</span>
          <div className="radio-group">
            {shapes.map(shape => (
              <button
                key={shape.value}
                className={`radio-btn ${camera.shape === shape.value ? 'active' : ''}`}
                onClick={() => updateSetting('camera', { ...camera, shape: shape.value })}
              >
                {shape.label}
              </button>
            ))}
          </div>
        </div>
        <div className="camera-setting-row">
          <span className="camera-setting-label">{t('camera.device')}</span>
          <Select
            value={camera.deviceId || ''}
            onChange={(deviceId) => updateSetting('camera', { ...camera, deviceId })}
            options={deviceOptions}
            placeholder={t('camera.selectDevice')}
          />
        </div>
        <div className="camera-setting-row">
          <span className="camera-setting-label">{t('camera.size')}</span>
          <div className="setting-item-control">
            <input
              type="range"
              className="slider-input"
              min="5"
              max="50"
              value={camera.size}
              onChange={(e) => updateSetting('camera', { ...camera, size: Number(e.target.value) })}
            />
            <span className="setting-item-value">{camera.size}%</span>
          </div>
        </div>
        <div className="camera-setting-row">
          <span className="camera-setting-label">{t('camera.offset')}</span>
          <div className="setting-item-control">
            <input
              type="range"
              className="slider-input"
              min="0"
              max="20"
              value={camera.offset}
              onChange={(e) => updateSetting('camera', { ...camera, offset: Number(e.target.value) })}
            />
            <span className="setting-item-value">{camera.offset}%</span>
          </div>
        </div>
        {/* 位置选择器 - 2x2 网格布局 */}
        <div className="camera-setting-row">
          <span className="camera-setting-label">{t('camera.position')}</span>
          <div className="position-grid">
            {positions.map(pos => (
              <button
                key={pos.value}
                className={`position-btn ${camera.position === pos.value ? 'active' : ''}`}
                onClick={() => updateSetting('camera', { ...camera, position: pos.value })}
                title={pos.label}
              >
                {/* 使用小圆点指示位置 */}
                <span className={`position-dot ${pos.value}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CameraSetting
