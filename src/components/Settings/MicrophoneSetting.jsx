/**
 * 麦克风设置组件
 * 选择需要录制的麦克风设备
 */
import { useEffect } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useMediaDevices } from '../../hooks/useMediaDevices'

function MicrophoneSetting() {
  const { settings, updateSetting } = useSettings()
  const { microphone } = settings
  const { audioDevices, audioStream, startAudio, stopAudio, isLoading } = useMediaDevices()

  // 监听麦克风开关状态
  useEffect(() => {
    if (microphone.enabled && microphone.deviceId) {
      startAudio(microphone.deviceId)
    } else {
      stopAudio()
    }
    
    return () => {
      stopAudio()
    }
  }, [microphone.enabled])

  // 处理麦克风开关
  const handleToggle = (enabled) => {
    updateSetting('microphone', {
      ...microphone,
      enabled
    })
  }

  // 处理设备选择
  const handleDeviceChange = (deviceId) => {
    updateSetting('microphone', {
      ...microphone,
      deviceId
    })
  }

  return (
    <div className="setting-section">
      <h4 className="setting-title">麦克风</h4>
      
      {/* 开关 */}
      <div className="setting-row">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={microphone.enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="toggle-input"
          />
          <span className="toggle-switch"></span>
          <span>启用麦克风</span>
        </label>
      </div>

      {microphone.enabled && (
        <>
          {/* 音量指示器 */}
          <div className="audio-level">
            <div className="audio-label">音量</div>
            <div className="audio-meter">
              <div 
                className="audio-meter-fill"
                style={{ 
                  width: audioStream ? '60%' : '0%',
                  backgroundColor: audioStream ? '#4caf50' : '#ccc'
                }}
              />
            </div>
            <span className="audio-status">
              {audioStream ? '工作中' : '未就绪'}
            </span>
          </div>

          {/* 设备选择 */}
          <div className="setting-row">
            <label className="setting-label">选择麦克风</label>
            <select
              value={microphone.deviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="setting-select"
            >
              {audioDevices.length === 0 ? (
                <option value="">未检测到麦克风</option>
              ) : (
                <>
                  <option value="">默认麦克风</option>
                  {audioDevices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `麦克风 ${index + 1}`}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {isLoading && (
            <div className="loading-tip">正在加载设备列表...</div>
          )}
        </>
      )}
    </div>
  )
}

export default MicrophoneSetting
