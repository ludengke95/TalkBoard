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
    <div className="setting-item">
      <span className="setting-item-label">{t('camera.label')}</span>
      <div className="setting-item-control">
        <button
          className={`toggle-switch ${camera.enabled ? 'active' : ''}`}
          onClick={() => updateSetting('camera', { ...camera, enabled: !camera.enabled })}
        />
        {camera.enabled && (
          <>
            <div className="radio-group" style={{ marginLeft: '12px' }}>
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
            <Select
              value={camera.deviceId || ''}
              onChange={(deviceId) => updateSetting('camera', { ...camera, deviceId })}
              options={deviceOptions}
              placeholder={t('camera.selectDevice')}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default CameraSetting
