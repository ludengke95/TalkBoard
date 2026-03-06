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
      {camera.enabled && (
        <div className="setting-item-control" style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '32px' }}>{t('camera.size')}</span>
            <input
              type="range"
              min="5"
              max="50"
              value={camera.size}
              onChange={(e) => updateSetting('camera', { ...camera, size: Number(e.target.value) })}
              style={{ width: '80px' }}
            />
            <span style={{ fontSize: '12px', width: '32px' }}>{camera.size}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '32px' }}>{t('camera.offset')}</span>
            <input
              type="range"
              min="0"
              max="20"
              value={camera.offset}
              onChange={(e) => updateSetting('camera', { ...camera, offset: Number(e.target.value) })}
              style={{ width: '60px' }}
            />
            <span style={{ fontSize: '12px', width: '28px' }}>{camera.offset}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CameraSetting
