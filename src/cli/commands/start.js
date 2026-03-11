/**
 * start 命令实现
 * 启动 TalkBoard 服务
 */

import chalk from "chalk"
import { spawn, execSync } from "child_process"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { readPid, writePid, writePort, writeStartTime, removePidFile, readPort } from "../utils/pid.js"
import { isProcessRunning, isPortInUse, waitForPortListening, killProcessByPort } from "../utils/process.js"
import { logInfo, logError } from "../utils/logger.js"

// 获取当前模块的目录路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 获取 dist 目录路径
 * 支持全局安装和本地开发两种场景
 * @returns {string|null} dist 目录路径，如果不存在则返回 null
 */
const getDistPath = () => {
  // 可能的 dist 路径列表
  const possiblePaths = [
    // 本地开发：从 src/cli/commands 向上三级
    path.resolve(__dirname, "..", "..", "..", "dist"),
    // 全局安装：bin 同级的 dist
    path.resolve(__dirname, "..", "..", "..", "..", "dist"),
    // lib/node_modules/talkboard/dist
    path.resolve(__dirname, "..", "..", "dist"),
  ]
  
  for (const distPath of possiblePaths) {
    if (fs.existsSync(distPath)) {
      return distPath
    }
  }
  
  return null
}

/**
 * 获取项目根目录
 * @returns {string} 项目根目录路径
 */
const getProjectRoot = () => {
  const distPath = getDistPath()
  if (distPath) {
    return path.dirname(distPath)
  }
  // 默认返回相对于当前文件的路径
  return path.resolve(__dirname, "..", "..", "..")
}

/**
 * 检查 dist 目录是否存在
 * @returns {boolean} dist 目录是否存在
 */
const checkDistExists = () => {
  return getDistPath() !== null
}

/**
 * 构建项目
 * @returns {Promise<boolean>} 构建是否成功
 */
const buildProject = () => {
  return new Promise((resolve) => {
    console.log(chalk.yellow("正在构建项目..."))
    logInfo("开始构建项目")
    
    const projectRoot = getProjectRoot()
    
    try {
      execSync("npm run build", {
        cwd: projectRoot,
        stdio: "inherit",
        timeout: 120000 // 2 分钟超时
      })
      
      console.log(chalk.green("构建完成"))
      logInfo("项目构建成功")
      resolve(true)
    } catch (error) {
      console.error(chalk.red(`构建失败: ${error.message}`))
      logError(`项目构建失败: ${error.message}`)
      resolve(false)
    }
  })
}

/**
 * 等待服务器启动
 * @param {number} port - 端口号
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<boolean>} 服务器是否成功启动
 */
const waitForServer = async (port, timeout = 10000) => {
  console.log(chalk.gray("等待服务器启动..."))
  
  const success = await waitForPortListening(port, timeout)
  
  if (success) {
    logInfo(`服务器启动成功，端口 ${port} 已开始监听`)
  } else {
    logError(`服务器启动超时，端口 ${port} 未响应`)
  }
  
  return success
}

/**
 * 设置前台模式退出处理
 * @param {number} port - 端口号
 */
const setupExitHandlers = (port) => {
  const cleanup = () => {
    console.log()
    console.log(chalk.gray("正在清理..."))
    
    // 清理 PID 文件
    removePidFile()
    
    // 尝试终止端口上的进程
    killProcessByPort(port).catch(() => {})
    
    logInfo("前台服务已停止")
    process.exit(0)
  }
  
  // 监听退出信号
  process.on("SIGINT", cleanup)
  process.on("SIGTERM", cleanup)
  
  // Windows 下监听 Ctrl+C
  if (process.platform === "win32") {
    process.on("SIGBREAK", cleanup)
  }
}

/**
 * 启动 HTTP 服务器
 * @param {number} port - 端口号
 * @param {boolean} daemon - 是否后台运行
 * @returns {Promise<Object>} 服务器信息
 */
const startHttpServer = (port, daemon) => {
  return new Promise((resolve, reject) => {
    const distPath = getDistPath()
    
    if (!distPath) {
      reject(new Error("未找到 dist 目录，请先构建项目"))
      return
    }
    
    // http-server 命令参数
    const args = [
      distPath,
      "-p", String(port),
      "-c-1", // 禁用缓存
      "--cors", // 启用 CORS
    ]
    
    if (daemon) {
      // 后台运行模式
      const child = spawn("npx", ["http-server", ...args], {
        cwd: getProjectRoot(),
        detached: true,
        stdio: "ignore",
        shell: true,
        windowsHide: true
      })
      
      child.unref()
      
      resolve({
        pid: child.pid,
        port,
        daemon: true
      })
    } else {
      // 前台运行模式
      console.log(chalk.blue(`正在启动服务器 (端口: ${port})...`))
      logInfo(`启动服务器，端口: ${port}`)
      
      const child = spawn("npx", ["http-server", ...args], {
        cwd: getProjectRoot(),
        stdio: "inherit",
        shell: true
      })
      
      resolve({
        pid: child.pid,
        port,
        daemon: false,
        process: child
      })
    }
  })
}

/**
 * start 命令主函数
 * @param {Object} options - 命令选项
 * @param {string} options.port - 端口号
 * @param {boolean} options.daemon - 是否后台运行
 */
export const startCommand = async (options) => {
  const port = parseInt(options.port, 10)
  const daemon = options.daemon || false
  
  // 验证端口号
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`无效的端口号: ${options.port}`)
  }
  
  console.log(chalk.blue("TalkBoard 服务启动器"))
  console.log()
  
  // 检查是否已有服务在运行（通过端口检测）
  const portInUse = await isPortInUse(port)
  if (portInUse) {
    // 检查是否是我们启动的服务
    const existingPid = readPid()
    const existingPort = readPort()
    
    if (existingPid && existingPort === port && isProcessRunning(existingPid)) {
      console.log(chalk.yellow(`服务已在运行中 (PID: ${existingPid}, 端口: ${port})`))
      console.log(chalk.gray("如需重启，请先运行: talkboard stop"))
      return
    }
    
    // 端口被其他进程占用
    throw new Error(`端口 ${port} 已被其他进程占用，请使用其他端口或先停止占用该端口的进程`)
  }
  
  // 检查是否有残留的 PID 文件
  const existingPid = readPid()
  if (existingPid) {
    if (isProcessRunning(existingPid)) {
      const existingPort = readPort()
      console.log(chalk.yellow(`发现其他运行中的服务 (PID: ${existingPid}, 端口: ${existingPort || "未知"})`))
      console.log(chalk.gray("如需启动新服务，请先运行: talkboard stop"))
      return
    }
    // 进程已不存在，清理 PID 文件
    removePidFile()
  }
  
  // 检查 dist 目录是否存在
  if (!checkDistExists()) {
    console.log(chalk.yellow("未找到构建产物，正在构建..."))
    const buildSuccess = await buildProject()
    if (!buildSuccess) {
      throw new Error("构建失败，无法启动服务")
    }
    // 再次检查 dist 目录
    if (!checkDistExists()) {
      throw new Error("构建完成但未找到 dist 目录，请检查构建配置")
    }
  }
  
  // 启动服务器
  const serverInfo = await startHttpServer(port, daemon)
  
  // 等待服务器启动（后台模式）
  if (daemon) {
    const started = await waitForServer(port, 10000)
    
    if (!started) {
      // 启动失败，清理
      removePidFile()
      throw new Error("服务启动超时，请检查日志或尝试其他端口")
    }
    
    // 通过端口查找实际的进程 PID
    const { findProcessByPort } = await import("../utils/process.js")
    const actualPid = await findProcessByPort(port)
    
    // 记录服务信息
    const startTime = Date.now()
    writePid(actualPid || serverInfo.pid)
    writePort(port)
    writeStartTime(startTime)
    
    // 记录日志
    logInfo(`服务启动成功 - PID: ${actualPid || serverInfo.pid}, 端口: ${port}, 后台模式: ${daemon}`)
    
    console.log(chalk.green("✓ 服务已在后台启动"))
    console.log()
    console.log(`  端口: ${chalk.cyan(port)}`)
    if (actualPid) {
      console.log(`  PID:  ${chalk.cyan(actualPid)}`)
    }
    console.log()
    console.log(chalk.gray(`访问地址: http://localhost:${port}`))
    console.log(chalk.gray("查看状态: talkboard status"))
    console.log(chalk.gray("停止服务: talkboard stop"))
  } else {
    // 前台模式
    // 记录服务信息
    const startTime = Date.now()
    writePid(serverInfo.pid)
    writePort(port)
    writeStartTime(startTime)
    
    // 设置退出处理
    setupExitHandlers(port)
    
    // 记录前台启动日志
    logInfo(`前台模式启动 - 端口: ${port}`)
    
    console.log()
    console.log(chalk.green(`✓ 服务已启动，访问地址: http://localhost:${port}`))
    console.log(chalk.gray("按 Ctrl+C 停止服务"))
    console.log()
    
    // 等待子进程退出
    serverInfo.process.on("close", (code) => {
      removePidFile()
      if (code !== 0 && code !== null) {
        console.log(chalk.red(`服务异常退出，退出码: ${code}`))
        logError(`服务异常退出，退出码: ${code}`)
      }
      process.exit(code || 0)
    })
  }
}
