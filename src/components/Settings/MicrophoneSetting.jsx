/**
 * 麦克风设置组件
 * 简洁单栏样式
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
  const { audioDevices, audioStream, startAudio, stopAudio, isLoading } = useMediaDevices()

  useEffect(() => {
    if (microphone.enabled && microphone.deviceId) {
      startAudio(microphone.deviceId)
    } else {
      stopAudio()
    }
    return () => stopAudio()
  }, [microphone.enabled])

  const deviceOptions = [
    { value: '', label: t('microphone.defaultDevice') },
    ...audioDevices.map((device, index) => ({
      value: device.deviceId,
      label: device.label || `麦克风 ${index + 1}`
    }))
  ]

  return (
    <div className="setting-item">
      <span className="setting-item-label">{t('microphone.label')}</span>
      <div className="setting-item-control">
        <button
          className={`toggle-switch ${microphone.enabled ? 'active' : ''}`}
          onClick={() => updateSetting('microphone', { ...microphone, enabled: !microphone.enabled })}
        />
        {microphone.enabled && (
          <>
            {audioStream && (
              <div style={{ 
                width: '60px', 
                height: '6px', 
                background: 'var(--border-color)', 
                borderRadius: '3px',
                overflow: 'hidden',
                marginLeft: '12px'
              }}>
                <div style={{ 
                  width: '60%', 
                  height: '100%', 
                  background: 'var(--color-success)',
                  borderRadius: '3px'
                }} />
              </div>
            )}
            <Select
              value={microphone.deviceId || ''}
              onChange={(deviceId) => updateSetting('microphone', { ...microphone, deviceId })}
              options={deviceOptions}
              placeholder={t('microphone.selectDevice')}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default MicrophoneSetting
