/**
 * 语言设置组件
 * 用于切换界面语言
 */
import { useTranslation } from "react-i18next"
import { useSettings } from "../../contexts/SettingsContext"

// 支持的语言列表
const languages = [
  { value: "zh-CN", labelKey: "language.zhCN" },
  { value: "en-US", labelKey: "language.enUS" },
]

function LanguageSetting() {
  const { t } = useTranslation()
  const { settings, updateSetting } = useSettings()
  const { language } = settings

  /**
   * 处理语言切换
   * @param {string} lang - 语言代码
   */
  const handleLanguageChange = (lang) => {
    updateSetting("language", lang)
  }

  return (
    <div className="setting-item">
      <span className="setting-item-label">{t("language.label")}</span>
      <div className="setting-item-control">
        <div className="radio-group">
          {languages.map((lang) => (
            <button
              key={lang.value}
              className={`radio-btn ${language === lang.value ? "active" : ""}`}
              onClick={() => handleLanguageChange(lang.value)}
            >
              {t(lang.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LanguageSetting
