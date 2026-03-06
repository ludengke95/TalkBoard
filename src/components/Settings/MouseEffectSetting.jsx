/**
 * 鼠标效果设置组件
 * 简洁单栏样式
 */
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../contexts/SettingsContext'

const presetColors = [
  '#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#74c0fc', '#b197fc', '#f783ac'
]

function MouseEffectSetting() {
  const { t } = useTranslation()
  const { settings, updateSetting } = useSettings()
  const { mouseEffect } = settings

  return (
    <div className="setting-item">
      <span className="setting-item-label">{t('mouseEffect.label')}</span>
      <div className="setting-item-control">
        <button
          className={`toggle-switch ${mouseEffect.enabled ? 'active' : ''}`}
          onClick={() => updateSetting('mouseEffect', { 
            ...mouseEffect, 
            enabled: !mouseEffect.enabled,
            color: !mouseEffect.enabled && !mouseEffect.color ? presetColors[0] : mouseEffect.color
          })}
        />
        {mouseEffect.enabled && (
          <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
            {presetColors.map(color => (
              <button
                key={color}
                onClick={() => updateSetting('mouseEffect', { ...mouseEffect, color })}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  border: mouseEffect.color === color ? '2px solid var(--text-primary)' : '2px solid transparent',
                  backgroundColor: color,
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'transform 0.15s ease',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MouseEffectSetting
