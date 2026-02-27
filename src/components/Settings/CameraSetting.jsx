/**
 * 摄像头设置组件
 * 设置摄像头的开关、形状、大小和位置
 */
import { useState, useEffect } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useMediaDevices } from '../../hooks/useMediaDevices'

function CameraSetting() {
  const { settings, updateSetting } = useSettings()
  const { camera } = settings
  const { videoDevices, videoStream, startVideo, stopVideo, isLoading } = useMediaDevices()
  
  // 本地状态
  const [selectedDevice, setSelectedDevice] = useState(camera.deviceId || '')

  // 监听摄像头开关状态
  useEffect(() => {
    if (camera.enabled && selectedDevice) {
      startVideo(selectedDevice)
    } else {
      stopVideo()
    }
    
    return () => {
      stopVideo()
    }
  }, [camera.enabled])

  // 处理摄像头开关
  const handleToggle = (enabled) => {
    updateSetting('camera', {
      ...camera,
      enabled
    })
  }

  // 处理形状切换
  const handleShapeChange = (shape) => {
    updateSetting('camera', {
      ...camera,
      shape
    })
  }

  // 处理大小调整
  const handleSizeChange = (size) => {
    updateSetting('camera', {
      ...camera,
      size
    })
  }

  // 处理设备选择
  const handleDeviceChange = (deviceId) => {
    setSelectedDevice(deviceId)
    updateSetting('camera', {
      ...camera,
      deviceId
    })
  }

  // 位置选项
  const positions = [
    { value: 'bottom-right', label: '右下角' },
    { value: 'bottom-left', label: '左下角' },
    { value: 'top-right', label: '右上角' },
    { value: 'top-left', label: '左上角' }
  ]

  // 形状选项
  const shapes = [
    { value: 'circle', label: '圆形' },
    { value: 'square', label: '方形' }
  ]

  return (
    <div className="setting-section">
      <h4 className="setting-title">摄像头</h4>
      
      {/* 开关 */}
      <div className="setting-row">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={camera.enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="toggle-input"
          />
          <span className="toggle-switch"></span>
          <span>启用摄像头</span>
        </label>
      </div>

      {camera.enabled && (
        <>
          {/* 摄像头预览 */}
          <div className="camera-preview">
            {videoStream ? (
              <video
                ref={(video) => {
                  if (video) {
                    video.srcObject = videoStream
                  }
                }}
                autoPlay
                muted
                playsInline
                className={`preview-video ${camera.shape}`}
                style={{
                  width: camera.size,
                  height: camera.shape === 'circle' ? camera.size : camera.size * 0.75
                }}
              />
            ) : (
              <div className="preview-placeholder">
                {isLoading ? '加载中...' : '无视频'}
              </div>
            )}
          </div>

          {/* 设备选择 */}
          <div className="setting-row">
            <label className="setting-label">选择摄像头</label>
            <select
              value={selectedDevice}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="setting-select"
            >
              {videoDevices.length === 0 ? (
                <option value="">未检测到摄像头</option>
              ) : (
                videoDevices.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `摄像头 ${index + 1}`}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 形状选择 */}
          <div className="setting-row">
            <label className="setting-label">画面形状</label>
            <div className="shape-options">
              {shapes.map(shape => (
                <button
                  key={shape.value}
                  className={`shape-btn ${camera.shape === shape.value ? 'active' : ''}`}
                  onClick={() => handleShapeChange(shape.value)}
                >
                  {shape.label}
                </button>
              ))}
            </div>
          </div>

          {/* 大小调整 */}
          <div className="setting-row">
            <label className="setting-label">画面大小</label>
            <div className="size-slider">
              <input
                type="range"
                min="60"
                max="300"
                value={camera.size}
                onChange={(e) => handleSizeChange(Number(e.target.value))}
                className="slider-input"
              />
              <span className="slider-value">{camera.size}px</span>
            </div>
          </div>

          {/* 位置选择 */}
          <div className="setting-row">
            <label className="setting-label">显示位置</label>
            <div className="position-options">
              {positions.map(pos => (
                <button
                  key={pos.value}
                  className={`position-btn ${camera.position === pos.value ? 'active' : ''}`}
                  onClick={() => updateSetting('camera', { ...camera, position: pos.value })}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CameraSetting
