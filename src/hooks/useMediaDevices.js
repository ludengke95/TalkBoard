/**
 * 媒体设备管理 Hook
 * 提供摄像头和麦克风设备的枚举、开启、关闭功能
 */
import { useState, useEffect, useCallback } from 'react'

export function useMediaDevices() {
  // 摄像头设备列表
  const [videoDevices, setVideoDevices] = useState([])
  // 麦克风设备列表
  const [audioDevices, setAudioDevices] = useState([])
  // 当前摄像头流
  const [videoStream, setVideoStream] = useState(null)
  // 当前麦克风流
  const [audioStream, setAudioStream] = useState(null)
  // 加载状态
  const [isLoading, setIsLoading] = useState(false)
  // 错误信息
  const [error, setError] = useState(null)

  // 检查媒体设备 API 是否可用
  const isMediaDevicesSupported = typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function'

  // 枚举所有媒体设备
  const enumerateDevices = useCallback(async () => {
    try {
      if (!isMediaDevicesSupported) {
        console.warn('浏览器不支持媒体设备 API')
        setError('浏览器不支持媒体设备')
        return
      }

      setIsLoading(true)
      setError(null)

      // 请求权限并获取设备列表
      const devices = await navigator.mediaDevices.enumerateDevices()
      
      const videos = devices.filter(device => device.kind === 'videoinput')
      const audios = devices.filter(device => device.kind === 'audioinput')

      setVideoDevices(videos)
      setAudioDevices(audios)
    } catch (err) {
      console.error('获取设备列表失败:', err)
      setError('无法获取媒体设备列表')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初始化时枚举设备
  useEffect(() => {
    if (!isMediaDevicesSupported) return

    enumerateDevices()

    // 监听设备变化
    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices)
    }
  }, [enumerateDevices, isMediaDevicesSupported])

  // 开启摄像头
  const startVideo = useCallback(async (deviceId, constraints = {}) => {
    try {
      if (!isMediaDevicesSupported) {
        setError('浏览器不支持媒体设备')
        return null
      }

      setError(null)
      // 停止之前的流
      if (videoStream) {
        stopVideo()
      }

      const constraints_ = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } }
          : true,
        ...constraints
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints_)
      setVideoStream(stream)
      return stream
    } catch (err) {
      console.error('开启摄像头失败:', err)
      setError('无法开启摄像头')
      return null
    }
  }, [videoStream])

  // 关闭摄像头
  const stopVideo = useCallback(() => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop())
      setVideoStream(null)
    }
  }, [videoStream])

  // 开启麦克风
  const startAudio = useCallback(async (deviceId) => {
    try {
      if (!isMediaDevicesSupported) {
        setError('浏览器不支持媒体设备')
        return null
      }

      setError(null)
      // 停止之前的流
      if (audioStream) {
        stopAudio()
      }

      const constraints = deviceId
        ? { audio: { deviceId: { exact: deviceId } } }
        : { audio: true }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setAudioStream(stream)
      return stream
    } catch (err) {
      console.error('开启麦克风失败:', err)
      setError('无法开启麦克风')
      return null
    }
  }, [audioStream])

  // 关闭麦克风
  const stopAudio = useCallback(() => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop())
      setAudioStream(null)
    }
  }, [audioStream])

  // 清理所有媒体流
  const cleanup = useCallback(() => {
    stopVideo()
    stopAudio()
  }, [stopVideo, stopAudio])

  return {
    // 设备列表
    videoDevices,
    audioDevices,
    // 当前流
    videoStream,
    audioStream,
    // 状态
    isLoading,
    error,
    // 方法
    enumerateDevices,
    startVideo,
    stopVideo,
    startAudio,
    stopAudio,
    cleanup
  }
}
