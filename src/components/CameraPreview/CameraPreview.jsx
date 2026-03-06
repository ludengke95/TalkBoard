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
  size = 15,
  position = "bottom-right",
  offset = 3,
  selectionBox = null,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn("播放视频失败:", err);
      });
    }
  }, [stream]);

  if (!enabled || !stream || !selectionBox) {
    return null;
  }

  const { x, y, width, height } = selectionBox;

  const cameraSize = (size / 100) * height;
  const cameraOffset = (offset / 100) * Math.min(width, height);

  let left, top;
  switch (position) {
    case "top-left":
      left = x + cameraOffset;
      top = y + cameraOffset;
      break;
    case "top-right":
      left = x + width - cameraSize - cameraOffset;
      top = y + cameraOffset;
      break;
    case "bottom-left":
      left = x + cameraOffset;
      top = y + height - cameraSize - cameraOffset;
      break;
    case "bottom-right":
    default:
      left = x + width - cameraSize - cameraOffset;
      top = y + height - cameraSize - cameraOffset;
      break;
  }

  const containerStyle = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${cameraSize}px`,
    height: `${cameraSize}px`,
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
