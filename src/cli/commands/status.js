/**
 * status 命令实现
 * 查看 TalkBoard 服务状态
 */

import chalk from "chalk"
import { readPid, readPort, readStartTime, getPidFilePath, getPortFilePath } from "../utils/pid.js"
import { isProcessRunning } from "../utils/process.js"
import { readLogs, getLogFilePath } from "../utils/logger.js"

/**
 * 格式化运行时间
 * @param {number} startTime - 启动时间戳（毫秒）
 * @returns {string} 格式化的运行时间
 */
const formatUptime = (startTime) => {
  if (!startTime) {
    return "未知"
  }
  
  const now = Date.now()
  const diff = now - startTime
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days} 天 ${hours % 24} 小时`
  } else if (hours > 0) {
    return `${hours} 小时 ${minutes % 60} 分钟`
  } else if (minutes > 0) {
    return `${minutes} 分钟 ${seconds % 60} 秒`
  } else {
    return `${seconds} 秒`
  }
}

/**
 * 格式化启动时间
 * @param {number} timestamp - 时间戳（毫秒）
 * @returns {string} 格式化的时间字符串
 */
const formatStartTime = (timestamp) => {
  if (!timestamp) {
    return "未知"
  }
  
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * status 命令主函数
 */
export const statusCommand = async () => {
  console.log(chalk.blue("TalkBoard 服务状态"))
  console.log()
  
  // 读取服务信息
  const pid = readPid()
  const port = readPort()
  const startTime = readStartTime()
  
  // 检查服务状态
  if (!pid) {
    console.log(chalk.yellow("● 服务未运行"))
    console.log()
    console.log(chalk.gray("启动服务: talkboard start"))
    return
  }
  
  // 检查进程是否存活
  const running = isProcessRunning(pid)
  
  if (!running) {
    console.log(chalk.red("● 服务已停止 (进程不存在)"))
    console.log()
    console.log(chalk.gray(`上次 PID: ${pid}`))
    console.log(chalk.gray("启动服务: talkboard start"))
    return
  }
  
  // 服务正在运行
  console.log(chalk.green("● 服务运行中"))
  console.log()
  
  // 显示服务信息
  console.log(`  ${chalk.gray("PID:")}        ${chalk.cyan(pid)}`)
  
  if (port) {
    console.log(`  ${chalk.gray("端口:")}        ${chalk.cyan(port)}`)
    console.log(`  ${chalk.gray("访问地址:")}    ${chalk.cyan(`http://localhost:${port}`)}`)
  }
  
  if (startTime) {
    console.log(`  ${chalk.gray("启动时间:")}    ${chalk.cyan(formatStartTime(startTime))}`)
    console.log(`  ${chalk.gray("运行时长:")}    ${chalk.cyan(formatUptime(startTime))}`)
  }
  
  // 显示文件路径
  console.log()
  console.log(chalk.gray("─".repeat(40)))
  console.log(chalk.gray("文件位置:"))
  console.log(`  ${chalk.gray("PID 文件:")}    ${getPidFilePath()}`)
  console.log(`  ${chalk.gray("日志文件:")}    ${getLogFilePath()}`)
  
  // 显示最近日志
  const recentLogs = readLogs(5)
  if (recentLogs.length > 0) {
    console.log()
    console.log(chalk.gray("─".repeat(40)))
    console.log(chalk.gray("最近日志:"))
    recentLogs.forEach((log) => {
      // 截断过长的日志行
      const displayLog = log.length > 80 ? log.substring(0, 77) + "..." : log
      console.log(chalk.gray(`  ${displayLog}`))
    })
  }
  
  console.log()
  console.log(chalk.gray("停止服务: talkboard stop"))
}
