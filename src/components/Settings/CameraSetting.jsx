/**
 * 摄像头设置组件
 * 简洁单栏样式
 */
import { useSettings } from '../../contexts/SettingsContext'
import { useMediaDevices } from '../../hooks/useMediaDevices'
import Select from './Select'

function CameraSetting() {
  const { settings, updateSetting } = useSettings()
  const { camera } = settings
  const { videoDevices } = useMediaDevices()

  const shapes = [
    { value: 'circle', label: '圆形' },
    { value: 'square', label: '方形' }
  ]

  const deviceOptions = [
    { value: '', label: '默认' },
    ...videoDevices.map((device, index) => ({
      value: device.deviceId,
      label: device.label || `摄像头 ${index + 1}`
    }))
  ]

  return (
    <div className="setting-item">
      <span className="setting-item-label">摄像头</span>
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
              placeholder="选择设备"
            />
          </>
        )}
      </div>
    </div>
  )
}

export default CameraSetting
