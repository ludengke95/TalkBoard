/**
 * 录制质量设置组件
 * 提供高、中、低三档质量选择
 */
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../contexts/SettingsContext'

// 质量等级选项
const qualityOptions = [
  { value: 'high', bitrate: 10_000_000 },
  { value: 'medium', bitrate: 5_000_000 },
  { value: 'low', bitrate: 2_000_000 },
]

function RecordingQualitySetting() {
  const { t } = useTranslation()
  const { settings, updateSetting } = useSettings()
  const { recording } = settings

  // 处理质量选择
  const handleQualityChange = (quality) => {
    updateSetting('recording', { ...recording, quality })
  }

  return (
    <div className="setting-item">
      <span className="setting-item-label">{t('recording.label')}</span>
      <div className="setting-item-control">
        <div className="radio-group">
          {qualityOptions.map((option) => (
            <button
              key={option.value}
              className={`radio-btn ${recording.quality === option.value ? 'active' : ''}`}
              onClick={() => handleQualityChange(option.value)}
              title={t(`recording.quality${option.value.charAt(0).toUpperCase() + option.value.slice(1)}Desc`)}
            >
              {t(`recording.quality${option.value.charAt(0).toUpperCase() + option.value.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RecordingQualitySetting
