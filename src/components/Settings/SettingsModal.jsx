/**
 * 设置弹窗主组件
 * 整合所有设置模块
 */
import { useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import AspectRatioSetting from './AspectRatioSetting'
import BackgroundSetting from './BackgroundSetting'
import CornerRadiusSetting from './CornerRadiusSetting'
import CameraSetting from './CameraSetting'
import MicrophoneSetting from './MicrophoneSetting'
import MouseEffectSetting from './MouseEffectSetting'
import MarginSetting from './MarginSetting'

function SettingsModal({ onClose }) {
  const { settings, resetSettings } = useSettings()
  const [activeTab, setActiveTab] = useState('all')

  // Tab 列表
  const tabs = [
    { id: 'all', label: '全部' },
    { id: 'ratio', label: '画面比例' },
    { id: 'background', label: '背景' },
    { id: 'corner', label: '圆角' },
    { id: 'camera', label: '摄像头' },
    { id: 'microphone', label: '麦克风' },
    { id: 'mouse', label: '鼠标' },
    { id: 'margin', label: '边距' }
  ]

  // 判断是否显示某个设置
  const shouldShow = (tabId) => {
    return activeTab === 'all' || activeTab === tabId
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal settings-modal-large" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="modal-header">
          <h3>设置</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Tab 导航 */}
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 设置内容 */}
        <div className="modal-body settings-body">
          {shouldShow('ratio') && <AspectRatioSetting />}
          {shouldShow('background') && <BackgroundSetting />}
          {shouldShow('corner') && <CornerRadiusSetting />}
          {shouldShow('camera') && <CameraSetting />}
          {shouldShow('microphone') && <MicrophoneSetting />}
          {shouldShow('mouse') && <MouseEffectSetting />}
          {shouldShow('margin') && <MarginSetting />}
        </div>

        {/* 底部按钮 */}
        <div className="modal-footer">
          <button 
            className="btn-reset"
            onClick={resetSettings}
          >
            重置为默认
          </button>
          <button 
            className="btn-done"
            onClick={onClose}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
