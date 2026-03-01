/**
 * 麦克风设置组件
 * 简洁单栏样式
 */
import { useEffect } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useMediaDevices } from '../../hooks/useMediaDevices'

function MicrophoneSetting() {
  const { settings, updateSetting } = useSettings()
  const { microphone } = settings
  const { audioDevices, audioStream, startAudio, stopAudio, isLoading } = useMediaDevices()

  useEffect(() => {
    if (microphone.enabled && microphone.deviceId) {
      startAudio(microphone.deviceId)
    } else {
      stopAudio()
    }
    return () => stopAudio()
  }, [microphone.enabled])

  return (
    <div className="setting-item">
      <span className="setting-item-label">麦克风</span>
      <div className="setting-item-control">
        <button
          className={`toggle-switch ${microphone.enabled ? 'active' : ''}`}
          onClick={() => updateSetting('microphone', { ...microphone, enabled: !microphone.enabled })}
        />
        {microphone.enabled && (
          <>
            {audioStream && (
              <div style={{ 
                width: '60px', 
                height: '6px', 
                background: 'var(--border-color)', 
                borderRadius: '3px',
                overflow: 'hidden',
                marginLeft: '12px'
              }}>
                <div style={{ 
                  width: '60%', 
                  height: '100%', 
                  background: 'var(--color-success)',
                  borderRadius: '3px'
                }} />
              </div>
            )}
            <select
              value={microphone.deviceId}
              onChange={(e) => updateSetting('microphone', { ...microphone, deviceId: e.target.value })}
              style={{ marginLeft: '8px', padding: '4px 8px', fontSize: '12px', borderRadius: '4px' }}
            >
              <option value="">默认</option>
              {audioDevices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `麦克风 ${index + 1}`}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
    </div>
  )
}

export default MicrophoneSetting
