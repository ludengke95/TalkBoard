/**
 * 帮助弹窗组件
 * 显示项目信息、使用说明、链接和常见问题
 */
import { useTranslation } from "react-i18next"
import "./HelpModal.css"

/**
 * 帮助弹窗组件
 * @param {Object} props - 组件属性
 * @param {Function} props.onClose - 关闭弹窗回调
 */
function HelpModal({ onClose }) {
  const { t } = useTranslation()

  // 链接配置
  const links = [
    {
      label: t("help.github"),
      url: "https://github.com/ludengke95/TalkBoard",
    },
    {
      label: t("help.demo"),
      url: "https://talkboard.20251005.xyz",
    },
    {
      label: t("help.demoBackup"),
      url: "https://ludengke95.github.io/TalkBoard",
    },
  ]

  // 画面比例对应的像素大小
  const resolutions = [
    { ratio: "16:9", width: 1920, height: 1080 },
    { ratio: "4:3", width: 1280, height: 960 },
    { ratio: "3:4", width: 960, height: 1280 },
    { ratio: "9:16", width: 1080, height: 1920 },
    { ratio: "1:1", width: 800, height: 800 },
  ]

  // 常见问题列表
  const faqs = [
    { question: t("help.faqCameraQ"), answer: t("help.faqCameraA"), link: "https://play.google.com/store/apps/details?id=com.dev47apps.obsdroidcam" },
    { question: t("help.faqMicrophoneQ"), answer: t("help.faqMicrophoneA") },
    { question: t("help.faqFormatQ"), answer: t("help.faqFormatA") },
    { question: t("help.faqBrowserQ"), answer: t("help.faqBrowserA") },
    { question: t("help.faqExportQ"), answer: t("help.faqExportA") },
    { question: t("help.faqFontQ"), answer: t("help.faqFontA") },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="help-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="help-header">
          <h3>{t("help.title")}</h3>
          <button className="close-btn" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 主体内容 */}
        <div className="help-body">
          {/* 链接区域 */}
          <section className="help-section">
            <h4 className="help-section-title">{t("help.links")}</h4>
            <div className="help-links">
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="help-link"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="link-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  <span>{link.label}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="external-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0h-11.25m11.25 0v11.25" />
                  </svg>
                </a>
              ))}
            </div>
          </section>

          {/* 项目简介 */}
          <section className="help-section">
            <p className="help-intro">{t("help.projectIntro")}</p>
          </section>

          {/* 视频像素说明 */}
          <section className="help-section">
            <h4 className="help-section-title">{t("help.videoResolution")}</h4>
            <div className="help-resolution">
              <p className="help-resolution-label">{t("help.presentationMode")}</p>
              <div className="help-resolution-table">
                {resolutions.map((res, index) => (
                  <div key={index} className="help-resolution-row">
                    <span className="help-resolution-ratio">{res.ratio}</span>
                    <span className="help-resolution-arrow">→</span>
                    <span className="help-resolution-size">{res.width} × {res.height}</span>
                  </div>
                ))}
              </div>
              <p className="help-resolution-label">{t("help.nonPresentationMode")}</p>
            </div>
          </section>

          {/* 使用说明 */}
          <section className="help-section">
            <h4 className="help-section-title">{t("help.usage")}</h4>
            <ol className="help-usage-list">
              <li>{t("help.usageStep1", { defaultValue: "在画布上绘图 - 使用 Excalidraw 工具进行绘制" })}</li>
              <li>{t("help.usageStep2", { defaultValue: "添加幻灯片 - 点击 \"+\" 添加演示页" })}</li>
              <li>{t("help.usageStep3", { defaultValue: "打开提词器 - 点击提词器图标" })}</li>
              <li>{t("help.usageStep4", { defaultValue: "开始录制 - 点击录制按钮，选择区域后开始" })}</li>
            </ol>
          </section>

          {/* 快捷键 */}
          <section className="help-section">
            <h4 className="help-section-title">{t("help.shortcuts")}</h4>
            <div className="help-shortcuts">
              <div className="help-shortcut-row">
                <kbd>N</kbd> / <kbd>→</kbd> / <kbd>↓</kbd>
                <span>{t("help.nextPage")}</span>
              </div>
              <div className="help-shortcut-row">
                <kbd>P</kbd> / <kbd>←</kbd> / <kbd>↑</kbd>
                <span>{t("help.prevPage")}</span>
              </div>
            </div>
          </section>

          {/* 常见问题 */}
          <section className="help-section">
            <h4 className="help-section-title">{t("help.faq")}</h4>
            <div className="help-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className="help-faq-item">
                  <p className="help-faq-question">
                    <strong>Q:</strong> {faq.question}
                  </p>
                  <p className="help-faq-answer">
                    <strong>A:</strong> {faq.answer}
                    {faq.link && (
                      <a
                        href={faq.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="help-faq-link"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0h-11.25m11.25 0v11.25" />
                        </svg>
                      </a>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 版本信息 */}
          <section className="help-section help-version">
            <span>{t("help.version")}: 1.0.0</span>
          </section>
        </div>
      </div>
    </div>
  )
}

export default HelpModal
