/**
 * i18n 国际化配置
 * 使用 i18next + react-i18next 实现多语言支持
 */
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import zhCN from "./locales/zh-CN.json"
import enUS from "./locales/en-US.json"

// 语言资源
const resources = {
  "zh-CN": { translation: zhCN },
  "en-US": { translation: enUS },
}

i18n
  // 自动检测用户语言
  .use(LanguageDetector)
  // 绑定 react-i18next
  .use(initReactI18next)
  // 初始化配置
  .init({
    resources,
    // 回退语言
    fallbackLng: "zh-CN",
    // 插值配置
    interpolation: {
      // React 已经处理了 XSS，不需要再转义
      escapeValue: false,
    },
    // 语言检测配置
    detection: {
      // 检测顺序：先 localStorage，再浏览器语言
      order: ["localStorage", "navigator"],
      // 缓存到 localStorage
      caches: ["localStorage"],
      // localStorage 的 key
      lookupLocalStorage: "byv-language",
    },
  })

export default i18n
