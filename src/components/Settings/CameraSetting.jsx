/**
 * 摄像头设置组件
 * 简洁单栏样式
 */
import { useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useMediaDevices } from '../../hooks/useMediaDevices'

function CameraSetting() {
  const { settings, updateSetting } = useSettings()
  const { camera } = settings
  const { videoDevices } = useMediaDevices()
  
  const [selectedDevice, setSelectedDevice] = useState(camera.deviceId || '')

  const shapes = [
    { value: 'circle', label: '圆形' },
    { value: 'square', label: '方形' }
  ]

  const positions = [
    { value: 'bottom-right', label: '右下' },
    { value: 'bottom-left', label: '左下' },
    { value: 'top-right', label: '右上' },
    { value: 'top-left', label: '左上' }
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
            <select
              value={selectedDevice}
              onChange={(e) => {
                setSelectedDevice(e.target.value)
                updateSetting('camera', { ...camera, deviceId: e.target.value })
              }}
              style={{ marginLeft: '8px', padding: '4px 8px', fontSize: '12px', borderRadius: '4px' }}
            >
              <option value="">默认</option>
              {videoDevices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `摄像头 ${index + 1}`}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
    </div>
  )
}

export default CameraSetting
