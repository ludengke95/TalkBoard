/**
 * 设置弹窗主组件
 * 单栏紧凑布局 - 预览区在上，配置项在下
 */
import { useEffect } from "react";
import { useSettings } from "../../contexts/SettingsContext";
import { useMediaDevices } from "../../hooks/useMediaDevices";
import AspectRatioSetting from "./AspectRatioSetting";
import BackgroundSetting from "./BackgroundSetting";
import CornerRadiusSetting from "./CornerRadiusSetting";
import CameraSetting from "./CameraSetting";
import MicrophoneSetting from "./MicrophoneSetting";
import MouseEffectSetting from "./MouseEffectSetting";
import MarginSetting from "./MarginSetting";
import "./SettingsModal.css";

function SettingsModal({ onClose }) {
  const { settings, resetSettings } = useSettings();
  const { videoStream, startVideo, stopVideo, enumerateDevices } = useMediaDevices();

  // 打开设置时获取设备列表并请求权限
  useEffect(() => {
    const initDevices = async () => {
      try {
        // 先获取设备列表（不需要权限）
        await enumerateDevices();
        
        // 然后尝试请求权限（用于获取更完整的设备信息）
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some(d => d.kind === 'videoinput');
        const hasAudio = devices.some(d => d.kind === 'audioinput');
        
        if (hasVideo || hasAudio) {
          try {
            await navigator.mediaDevices.getUserMedia({ 
              video: hasVideo, 
              audio: hasAudio 
            });
            // 重新获取设备列表以获取更完整的信息
            await enumerateDevices();
          } catch (e) {
            // 权限被拒绝或其他错误，静默处理
          }
        }
      } catch (err) {
        console.warn("获取设备列表失败:", err.message);
      }
    };
    initDevices();
  }, [enumerateDevices]);

  useEffect(() => {
    if (settings.camera.enabled && settings.camera.deviceId) {
      startVideo(settings.camera.deviceId);
    } else if (!settings.camera.enabled) {
      stopVideo();
    }
  }, [settings.camera.enabled, settings.camera.deviceId]);

  const getAspectRatioStyle = () => {
    let ratio = 16 / 9;
    if (settings.aspectRatio && settings.aspectRatio.includes(":")) {
      const [w, h] = settings.aspectRatio.split(":").map(Number);
      if (w && h) {
        ratio = w / h;
      }
    }
    return ratio;
  };

  const aspectRatio = getAspectRatioStyle();
  const previewWidth = 220;
  const previewHeight = previewWidth / aspectRatio;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="settings-modal settings-modal-new"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="settings-header">
          <h3>设置</h3>
          <button className="close-btn" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 主体内容 */}
        <div className="settings-body">
          {/* 预览区 */}
          <div className="preview-section">
            <div className="preview-canvas-wrapper">
              <div
                className="preview-canvas"
                style={{
                  width: previewWidth,
                  height: previewHeight,
                }}
              >
                <div
                  className="preview-background"
                  style={{
                    backgroundColor:
                      settings.background.type === "color"
                        ? settings.background.value
                        : "transparent",
                    backgroundImage:
                      settings.background.type === "image"
                        ? `url(${settings.background.value})`
                        : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div
                  className="preview-recording-area"
                  style={{
                    padding: settings.margin ? `${settings.margin}px` : 0,
                  }}
                >
                  <div
                    className="preview-recording-content"
                    style={{
                      borderRadius: settings.cornerRadius
                        ? `${settings.cornerRadius}px`
                        : 0,
                    }}
                  >
                    <div className="preview-whiteboard">
                      <span>预览</span>
                      {settings.mouseEffect.enabled && (
                        <div
                          className="preview-mouse-effect"
                          style={{
                            backgroundColor: settings.mouseEffect.color,
                          }}
                        />
                      )}
                    </div>
                    <CameraPreview videoStream={videoStream} />
                  </div>
                </div>
              </div>
              <span className="preview-hint">录制效果预览</span>
            </div>
          </div>

          {/* 配置项列表 */}
          <div className="settings-list">
            <AspectRatioSetting />
            <BackgroundSetting />
            <CornerRadiusSetting />
            <CameraSetting />
            <MicrophoneSetting />
            <MouseEffectSetting />
            <MarginSetting />
          </div>

          {/* 底部操作区 */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button 
              className="btn-reset" 
              onClick={resetSettings}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              重置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CameraPreview({ videoStream }) {
  const { settings } = useSettings();
  const { camera } = settings;

  if (!camera.enabled) return null;

  const positionStyle = {
    "bottom-right": { right: 8, bottom: 8 },
    "bottom-left": { left: 8, bottom: 8 },
    "top-right": { right: 8, top: 8 },
    "top-left": { left: 8, top: 8 },
  }[camera.position] || { right: 8, bottom: 8 };

  return (
    <div
      className={`camera-overlay ${camera.shape}`}
      style={{
        ...positionStyle,
        width: camera.size * 0.5,
        height: camera.shape === "circle" ? camera.size * 0.5 : camera.size * 0.375,
      }}
    >
      {videoStream && (
        <video
          ref={(video) => {
            if (video) {
              video.srcObject = videoStream;
            }
          }}
          autoPlay
          muted
          playsInline
          className="camera-video"
        />
      )}
    </div>
  );
}

export default SettingsModal;
