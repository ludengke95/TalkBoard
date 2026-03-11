/**
 * 中文手写字体加载器
 * 
 * 由于 Excalidraw 通过 JS 动态注入字体 CSS，会覆盖我们在 HTML 中定义的字体
 * 因此需要使用动态 CSS 注入方式，确保字体定义在 Excalidraw 之后生效
 * 
 * 方案：完全替换 Virgil 字体，使用中文字体作为主字体
 * 这样中文字符会使用手写字体，英文字符会 fallback 到系统字体
 */

/**
 * 动态注入中文字体样式
 * 在 Excalidraw 加载后注入，确保覆盖其字体定义
 */
function injectChineseFontStyle() {
  // 检查是否已经注入
  if (document.getElementById("chinese-font-style")) {
    return
  }

  // 创建样式元素
  const style = document.createElement("style")
  style.id = "chinese-font-style"
  
  // 定义字体样式
  // 方案：定义一个新的字体家族，包含中文手写字体和英文 Virgil 字体
  style.textContent = `
    /* 
     * 中文手写字体扩展
     * 使用 unicode-range 分别定义中英文字体
     * 中文字符使用杨任东朱石体，英文字符使用原始 Virgil
     */
    
    /* 英文字符使用原始 Virgil 字体 */
    @font-face {
      font-family: "Virgil";
      src: url("/fonts/Virgil.woff2") format("woff2");
      font-display: swap;
      unicode-range: U+0000-007F, U+0080-00FF, U+0100-017F, U+0180-024F;
    }
    
    /* 中文字符使用手写字体 */
    @font-face {
      font-family: "Virgil";
      src: url("/fonts/YangRenDongZhuShiTi-Light-2.ttf") format("truetype");
      font-display: swap;
      unicode-range: 
        U+4E00-9FFF,
        U+3400-4DBF,
        U+20000-2A6DF,
        U+2A700-2B73F,
        U+2B740-2B81F,
        U+2B820-2CEAF,
        U+F900-FAFF,
        U+2F800-2FA1F,
        U+3000-303F,
        U+FF00-FFEF;
    }
  `
  
  // 添加到文档头部
  document.head.appendChild(style)
  console.log("[ChineseFont] 中文字体样式已注入")
}

/**
 * 使用 FontFace API 加载字体
 * 这是一种更可靠的方式，可以确保字体正确加载
 */
async function loadChineseFontWithAPI() {
  try {
    // 先加载中文字体
    const chineseFont = new FontFace(
      "Virgil",
      "url(/fonts/YangRenDongZhuShiTi-Light-2.ttf)",
      {
        display: "swap",
      }
    )
    await chineseFont.load()
    document.fonts.add(chineseFont)

    console.log("[ChineseFont] 中文字体通过 FontFace API 加载成功")
    return true
  } catch (error) {
    console.error("[ChineseFont] FontFace API 加载失败:", error)
    return false
  }
}

/**
 * 等待 Excalidraw 字体加载完成
 */
async function waitForExcalidrawFonts() {
  try {
    // 设置超时，避免无限等待
    const timeout = 5000
    await Promise.race([
      document.fonts.load("16px Virgil"),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), timeout)
      )
    ])
    console.log("[ChineseFont] Excalidraw Virgil 字体已加载")
    return true
  } catch (error) {
    console.warn("[ChineseFont] 等待 Excalidraw 字体超时:", error.message)
    return false
  }
}

/**
 * 初始化中文字体加载
 */
async function initChineseFont() {
  console.log("[ChineseFont] 开始初始化中文字体...")
  
  // 等待 Excalidraw 字体加载
  await waitForExcalidrawFonts()
  
  // 注入 CSS 样式（在 Excalidraw 之后）
  injectChineseFontStyle()
  
  // 使用 FontFace API 作为备用方案
  await loadChineseFontWithAPI()
  
  console.log("[ChineseFont] 中文字体初始化完成")
}

// 页面加载完成后初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChineseFont)
} else {
  // 延迟执行，确保 Excalidraw 有时间加载
  setTimeout(initChineseFont, 100)
}

export { loadChineseFontWithAPI, initChineseFont, injectChineseFontStyle }
