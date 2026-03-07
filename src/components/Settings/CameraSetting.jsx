/**
 * 摄像头设置组件
 * 简洁单栏样式
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

  const shapes = [
    { value: 'circle', label: t('camera.shapeCircle') },
    { value: 'square', label: t('camera.shapeSquare') }
  ]

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
      {camera.enabled && (
        <div className="camera-setting-options">
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
        </div>
      )}
    </div>
  )
}

export default CameraSetting
