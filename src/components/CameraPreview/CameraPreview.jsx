/**
 * 摄像头预览组件
 * 在选择录制区域和录制时显示摄像头画面
 */
import { useEffect, useRef } from "react";
import "./CameraPreview.css";

function CameraPreview({
  enabled,
  stream,
  shape = "circle",
  size = 120,
  position = "bottom-right",
  offsetX = 20,
  offsetY = 20,
  selectionBox = null,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // 当视频流变化时，设置到 video 元素
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn("播放视频失败:", err);
      });
    }
  }, [stream]);

  // 如果未启用、没有视频流或没有选择区域，不显示
  if (!enabled || !stream || !selectionBox) {
    return null;
  }

  const { x, y, width, height } = selectionBox;

  // 计算摄像头位置（相对于录制区域）
  let left, top;
  switch (position) {
    case "top-left":
      left = x + offsetX;
      top = y + offsetY;
      break;
    case "top-right":
      left = x + width - size - offsetX;
      top = y + offsetY;
      break;
    case "bottom-left":
      left = x + offsetX;
      top = y + height - size - offsetY;
      break;
    case "bottom-right":
    default:
      left = x + width - size - offsetX;
      top = y + height - size - offsetY;
      break;
  }

  const containerStyle = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: shape === "circle" ? "50%" : "8px",
  };

  return (
    <div ref={containerRef} className="camera-preview" style={containerStyle}>
      <video
        ref={videoRef}
        className="camera-preview-video"
        autoPlay
        playsInline
        muted
        style={{
          borderRadius: shape === "circle" ? "50%" : "8px",
        }}
      />
    </div>
  );
}

export default CameraPreview;
