/**
 * 设置弹窗主组件
 * 整合所有设置模块 - 左右布局：左侧预览，右侧配置
 */
import { useEffect } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useMediaDevices } from '../../hooks/useMediaDevices'
import AspectRatioSetting from './AspectRatioSetting'
import BackgroundSetting from './BackgroundSetting'
import CornerRadiusSetting from './CornerRadiusSetting'
import CameraSetting from './CameraSetting'
import MicrophoneSetting from './MicrophoneSetting'
import MouseEffectSetting from './MouseEffectSetting'
import MarginSetting from './MarginSetting'
import './SettingsModal.css'

function SettingsModal({ onClose }) {
  const { settings, resetSettings } = useSettings()
  const { videoStream, startVideo, stopVideo } = useMediaDevices()

  useEffect(() => {
    if (settings.camera.enabled && settings.camera.deviceId) {
      startVideo(settings.camera.deviceId)
    } else if (!settings.camera.enabled) {
      stopVideo()
    }
  }, [settings.camera.enabled, settings.camera.deviceId])

  // 计算画面比例
  const getAspectRatioStyle = () => {
    let ratio = 16 / 9 // 默认
    if (settings.aspectRatio && settings.aspectRatio.includes(':')) {
      const [w, h] = settings.aspectRatio.split(':').map(Number)
      if (w && h) {
        ratio = w / h
      }
    }
    return ratio
  }

  const aspectRatio = getAspectRatioStyle()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal settings-modal-new" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="modal-header">
          <h3>设置</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* 主内容区 - 左右布局 */}
        <div className="settings-container">
          {/* 左侧预览区 */}
          <div className="settings-preview">
            <div className="preview-label">预览</div>
            <div className="preview-content">
              <div 
                className="preview-canvas"
                style={{
                  aspectRatio: aspectRatio,
                  maxWidth: aspectRatio >= 1 ? '100%' : `${300 * aspectRatio}px`,
                  maxHeight: aspectRatio <= 1 ? '100%' : `${300 / aspectRatio}px`,
                  width: aspectRatio >= 1 ? '100%' : undefined,
                  height: aspectRatio <= 1 ? '100%' : undefined
                }}
              >
                {/* 背景层 */}
                <div 
                  className="preview-background"
                  style={{
                    backgroundColor: settings.background.type === 'color' ? settings.background.value : 'transparent',
                    backgroundImage: settings.background.type === 'image' ? `url(${settings.background.value})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                {/* 录制区域层 - 用 padding 控制边距 */}
                <div 
                  className="preview-recording-area"
                  style={{
                    padding: settings.margin ? `${settings.margin}px` : 0
                  }}
                >
                  {/* 白色录制内容层 - 圆角 */}
                  <div 
                    className="preview-recording-content"
                    style={{
                      borderRadius: settings.cornerRadius ? `${settings.cornerRadius}px` : 0
                    }}
                  >
                    <div className="preview-whiteboard">
                      <span>白板区域</span>
                      {/* 鼠标高亮效果预览 */}
                      {settings.mouseEffect.enabled && (
                        <div 
                          className="preview-mouse-effect"
                          style={{ backgroundColor: settings.mouseEffect.color }}
                        />
                      )}
                    </div>
                    {/* 摄像头预览 */}
                    <CameraPreview videoStream={videoStream} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧配置区 */}
          <div className="settings-config">
            <div className="settings-scroll">
              <AspectRatioSetting />
              <BackgroundSetting />
              <CornerRadiusSetting />
              <CameraSetting />
              <MicrophoneSetting />
              <MouseEffectSetting />
              <MarginSetting />
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="modal-footer">
          <button 
            className="btn-reset"
            onClick={resetSettings}
          >
            重置为默认
          </button>
          <button 
            className="btn-done"
            onClick={onClose}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}

function CameraPreview({ videoStream }) {
  const { settings } = useSettings()
  const { camera } = settings
  
  if (!camera.enabled) return null

  const positionStyle = {
    'bottom-right': { right: 10, bottom: 10 },
    'bottom-left': { left: 10, bottom: 10 },
    'top-right': { right: 10, top: 10 },
    'top-left': { left: 10, top: 10 }
  }[camera.position] || { right: 10, bottom: 10 }

  return (
    <div 
      className={`camera-overlay ${camera.shape}`}
      style={{
        ...positionStyle,
        width: camera.size,
        height: camera.shape === 'circle' ? camera.size : camera.size * 0.75
      }}
    >
      {videoStream && (
        <video
          ref={(video) => {
            if (video) {
              video.srcObject = videoStream
            }
          }}
          autoPlay
          muted
          playsInline
          className="camera-video"
        />
      )}
    </div>
  )
}

export default SettingsModal
