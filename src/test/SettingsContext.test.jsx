/**
 * SettingsContext 单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { SettingsProvider, useSettings, defaultSettings } from '../contexts/SettingsContext'

describe('SettingsContext', () => {
  // 清理 localStorage
  beforeEach(() => {
    localStorage.clear()
  })

  it('应该提供默认设置值', () => {
    const wrapper = ({ children }) => <SettingsProvider>{children}</SettingsProvider>
    const { result } = renderHook(() => useSettings(), { wrapper })

    expect(result.current.settings.aspectRatio).toBe('16:9')
    expect(result.current.settings.mouseEffect.enabled).toBe(true)
    expect(result.current.settings.mouseEffect.color).toBe('#ffeb3b')
  })

  it('应该能够更新设置', () => {
    const wrapper = ({ children }) => <SettingsProvider>{children}</SettingsProvider>
    const { result } = renderHook(() => useSettings(), { wrapper })

    act(() => {
      result.current.updateSetting('aspectRatio', '9:16')
    })

    expect(result.current.settings.aspectRatio).toBe('9:16')
  })

  it('应该能够更新嵌套对象设置', () => {
    const wrapper = ({ children }) => <SettingsProvider>{children}</SettingsProvider>
    const { result } = renderHook(() => useSettings(), { wrapper })

    act(() => {
      result.current.updateSetting('mouseEffect', {
        enabled: false,
        color: '#ff0000'
      })
    })

    expect(result.current.settings.mouseEffect.enabled).toBe(false)
    expect(result.current.settings.mouseEffect.color).toBe('#ff0000')
  })

  it('应该能够重置设置', () => {
    const wrapper = ({ children }) => <SettingsProvider>{children}</SettingsProvider>
    const { result } = renderHook(() => useSettings(), { wrapper })

    // 修改设置
    act(() => {
      result.current.updateSetting('aspectRatio', 'custom')
    })

    expect(result.current.settings.aspectRatio).toBe('custom')

    // 重置设置
    act(() => {
      result.current.resetSettings()
    })

    expect(result.current.settings.aspectRatio).toBe('16:9')
  })

  it('应该将设置保存到 localStorage', () => {
    const wrapper = ({ children }) => <SettingsProvider>{children}</SettingsProvider>
    const { result } = renderHook(() => useSettings(), { wrapper })

    act(() => {
      result.current.updateSetting('aspectRatio', '4:3')
    })

    const stored = localStorage.getItem('byv-settings')
    const parsed = JSON.parse(stored)
    expect(parsed.aspectRatio).toBe('4:3')
  })

  it('应该从 localStorage 加载设置', () => {
    // 先保存设置到 localStorage
    localStorage.setItem('byv-settings', JSON.stringify({
      ...defaultSettings,
      aspectRatio: '1:1',
      cornerRadius: 24
    }))

    const wrapper = ({ children }) => <SettingsProvider>{children}</SettingsProvider>
    const { result } = renderHook(() => useSettings(), { wrapper })

    expect(result.current.settings.aspectRatio).toBe('1:1')
    expect(result.current.settings.cornerRadius).toBe(24)
  })
})
