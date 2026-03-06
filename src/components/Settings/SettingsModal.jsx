/**
 * 设置弹窗主组件
 * 单栏紧凑布局 - 预览区在上，配置项在下
 */
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useSettings } from "../../contexts/SettingsContext"
import { useMediaDevices } from "../../hooks/useMediaDevices"
import LanguageSetting from "./LanguageSetting"
import AspectRatioSetting from "./AspectRatioSetting"
import CameraSetting from "./CameraSetting"
import MicrophoneSetting from "./MicrophoneSetting"
import MouseEffectSetting from "./MouseEffectSetting"
import "./SettingsModal.css"

function SettingsModal({ onClose }) {
  const { t } = useTranslation()
  const { settings, resetSettings } = useSettings()
  const { videoStream, startVideo, stopVideo } = useMediaDevices()

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
          <h3>{t("settings.title")}</h3>
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
                  className="preview-recording-area"
                >
                  <div
                    className="preview-recording-content"
                  >
                    <div className="preview-whiteboard">
                      <span>{t("settings.preview")}</span>
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
              <span className="preview-hint">{t("settings.previewHint")}</span>
            </div>
          </div>

          {/* 配置项列表 */}
          <div className="settings-list">
            <LanguageSetting />
            <AspectRatioSetting />
            <CameraSetting />
            <MicrophoneSetting />
            <MouseEffectSetting />
          </div>

          {/* 底部操作区 */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button 
              className="btn-reset" 
              onClick={resetSettings}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              {t("settings.reset")}
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
