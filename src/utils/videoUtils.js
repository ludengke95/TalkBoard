/**
 * 视频处理工具函数
 * 提供视频编码检测、格式转换等功能
 */
import {
  Input,
  Output,
  Mp4OutputFormat,
  BufferTarget,
  Conversion,
  BlobSource,
  ALL_FORMATS,
} from "mediabunny"

/**
 * 获取浏览器支持的最佳 MIME 类型
 * 优先级：H264 > VP9 > VP8
 * @returns {string} 支持的 MIME 类型
 */
export const getSupportedMimeType = () => {
  // 按优先级排列，优先 H264
  const mimeTypes = [
    "video/webm;codecs=h264,opus", // H264 视频 + Opus 音频
    "video/webm;codecs=h264", // H264 视频（无音频）
    "video/webm;codecs=vp9,opus", // VP9 视频 + Opus 音频
    "video/webm;codecs=vp9", // VP9 视频
    "video/webm;codecs=vp8,opus", // VP8 视频 + Opus 音频
    "video/webm;codecs=vp8", // VP8 视频
    "video/webm", // 默认
  ]

  // 查找第一个支持的类型
  for (const mime of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mime)) {
      console.log(`使用编码格式: ${mime}`)
      return mime
    }
  }

  // 降级到默认
  return "video/webm"
}

/**
 * 检测 WebCodecs API 是否可用
 * @returns {boolean} 是否支持
 */
export const isWebCodecsSupported = () => {
  return (
    typeof VideoEncoder !== "undefined" &&
    typeof VideoDecoder !== "undefined" &&
    typeof AudioEncoder !== "undefined" &&
    typeof AudioDecoder !== "undefined"
  )
}

/**
 * 检测视频编码是否为 H264
 * @param {Input} input - mediabunny Input 实例
 * @returns {Promise<boolean>} 是否为 H264 编码
 */
export const isH264Encoded = async (input) => {
  try {
    const videoTrack = await input.getPrimaryVideoTrack()
    // AVC 即 H264 编码
    return videoTrack?.codec === "avc" || videoTrack?.codec === "h264"
  } catch {
    return false
  }
}

/**
 * 智能转换视频，确保最佳兼容性
 * 实现四级降级策略，确保输出 H264 编码的 MP4
 * @param {Blob} webmBlob - 录制的 WebM 文件
 * @returns {Promise<{ blob: Blob, filename: string }>} 转换结果
 */
export const smartConvertVideo = async (webmBlob) => {
  // 创建输入源
  const input = new Input({
    source: new BlobSource(webmBlob),
    formats: ALL_FORMATS,
  })

  // 检测当前编码
  const isH264 = await isH264Encoded(input)
  const hasWebCodecs = isWebCodecsSupported()

  // Level 1: 已经是 H264，只需容器转换（快速）
  if (isH264) {
    console.log("Level 1: H264 编码，容器转换")
    const output = new Output({
      format: new Mp4OutputFormat(),
      target: new BufferTarget(),
    })
    const conversion = await Conversion.init({ input, output })
    await conversion.execute()
    return {
      blob: new Blob([output.target.buffer], { type: "video/mp4" }),
      filename: `talk-board-${Date.now()}.mp4`,
    }
  }

  // Level 2: 有 WebCodecs，进行编码转换（确保移动端兼容）
  if (hasWebCodecs) {
    console.log("Level 2: 编码转换为 H264")
    try {
      const output = new Output({
        format: new Mp4OutputFormat(),
        target: new BufferTarget(),
      })
      const conversion = await Conversion.init({
        input,
        output,
        videoConfig: {
          codec: "avc", // H264 编码
          bitrate: 10_000_000, // 10 Mbps
        },
        audioConfig: {
          codec: "aac", // AAC 音频（iOS 兼容）
          bitrate: 128_000, // 128 kbps
        },
      })
      await conversion.execute()
      return {
        blob: new Blob([output.target.buffer], { type: "video/mp4" }),
        filename: `talk-board-${Date.now()}.mp4`,
      }
    } catch (error) {
      console.warn("编码转换失败，尝试容器转换:", error)
    }
  }

  // Level 3: 容器转换（可能移动端不兼容）
  console.log("Level 3: 容器转换")
  try {
    const output = new Output({
      format: new Mp4OutputFormat(),
      target: new BufferTarget(),
    })
    const conversion = await Conversion.init({ input, output })
    await conversion.execute()
    return {
      blob: new Blob([output.target.buffer], { type: "video/mp4" }),
      filename: `talk-board-${Date.now()}.mp4`,
    }
  } catch (error) {
    console.warn("容器转换失败:", error)
  }

  // Level 4: 返回原始 WebM（兜底）
  console.log("Level 4: 返回原始 WebM")
  return {
    blob: webmBlob,
    filename: `talk-board-${Date.now()}.webm`,
  }
}
