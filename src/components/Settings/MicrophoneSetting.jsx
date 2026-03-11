/**
 * 麦克风设置组件
 * 简洁单栏样式，支持展开/收起动画
 */
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../contexts/SettingsContext'
import { useMediaDevices } from '../../hooks/useMediaDevices'
import Select from './Select'

function MicrophoneSetting() {
  const { t } = useTranslation()
  const { settings, updateSetting } = useSettings()
  const { microphone } = settings
  const { audioDevices, startAudio, stopAudio } = useMediaDevices()

  // 麦克风开关状态变化时，启动/停止音频流
  useEffect(() => {
    if (microphone.enabled && microphone.deviceId) {
      startAudio(microphone.deviceId)
    } else {
      stopAudio()
    }
    return () => stopAudio()
  }, [microphone.enabled])

  // 设备选项列表
  const deviceOptions = [
    { value: '', label: t('microphone.defaultDevice') },
    ...audioDevices.map((device, index) => ({
      value: device.deviceId,
      label: device.label || `麦克风 ${index + 1}`
    }))
  ]

  return (
    <div className="setting-item microphone-setting">
      {/* 头部：标签和开关 */}
      <div className="microphone-setting-header">
        <span className="setting-item-label">{t('microphone.label')}</span>
        <button
          className={`toggle-switch ${microphone.enabled ? 'active' : ''}`}
          onClick={() => updateSetting('microphone', { ...microphone, enabled: !microphone.enabled })}
        />
      </div>
      {/* 使用 CSS 类控制展开/收起动画 */}
      <div className={`microphone-setting-options ${microphone.enabled ? 'expanded' : 'collapsed'}`}>
        {/* 设备选择 */}
        <div className="microphone-setting-row">
          <span className="microphone-setting-label">{t('microphone.device')}</span>
          <Select
            value={microphone.deviceId || ''}
            onChange={(deviceId) => updateSetting('microphone', { ...microphone, deviceId })}
            options={deviceOptions}
            placeholder={t('microphone.selectDevice')}
          />
        </div>
      </div>
    </div>
  )
}

export default MicrophoneSetting
