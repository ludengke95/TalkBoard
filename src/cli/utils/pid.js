/**
 * PID 文件管理工具
 * 用于管理服务进程的 PID 文件
 */

import fs from "fs"
import path from "path"
import os from "os"

// 获取 TalkBoard 数据目录路径
const getDataDir = () => {
  const homeDir = os.homedir()
  const dataDir = path.join(homeDir, ".talkboard")
  
  // 如果目录不存在，创建它
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  
  return dataDir
}

/**
 * 获取 PID 文件路径
 * @returns {string} PID 文件的完整路径
 */
export const getPidFilePath = () => {
  return path.join(getDataDir(), "talkboard.pid")
}

/**
 * 获取端口文件路径
 * @returns {string} 端口文件的完整路径
 */
export const getPortFilePath = () => {
  return path.join(getDataDir(), "talkboard.port")
}

/**
 * 获取启动时间文件路径
 * @returns {string} 启动时间文件的完整路径
 */
export const getStartTimeFilePath = () => {
  return path.join(getDataDir(), "talkboard.starttime")
}

/**
 * 写入 PID 到文件
 * @param {number} pid - 进程 ID
 */
export const writePid = (pid) => {
  const pidFile = getPidFilePath()
  fs.writeFileSync(pidFile, String(pid), "utf-8")
}

/**
 * 从文件读取 PID
 * @returns {number|null} 进程 ID，如果文件不存在则返回 null
 */
export const readPid = () => {
  const pidFile = getPidFilePath()
  
  if (!fs.existsSync(pidFile)) {
    return null
  }
  
  const pid = fs.readFileSync(pidFile, "utf-8").trim()
  return parseInt(pid, 10)
}

/**
 * 写入端口号到文件
 * @param {number} port - 端口号
 */
export const writePort = (port) => {
  const portFile = getPortFilePath()
  fs.writeFileSync(portFile, String(port), "utf-8")
}

/**
 * 从文件读取端口号
 * @returns {number|null} 端口号，如果文件不存在则返回 null
 */
export const readPort = () => {
  const portFile = getPortFilePath()
  
  if (!fs.existsSync(portFile)) {
    return null
  }
  
  const port = fs.readFileSync(portFile, "utf-8").trim()
  return parseInt(port, 10)
}

/**
 * 写入启动时间到文件
 * @param {number} timestamp - 启动时间戳（毫秒）
 */
export const writeStartTime = (timestamp) => {
  const startTimeFile = getStartTimeFilePath()
  fs.writeFileSync(startTimeFile, String(timestamp), "utf-8")
}

/**
 * 从文件读取启动时间
 * @returns {number|null} 启动时间戳，如果文件不存在则返回 null
 */
export const readStartTime = () => {
  const startTimeFile = getStartTimeFilePath()
  
  if (!fs.existsSync(startTimeFile)) {
    return null
  }
  
  const timestamp = fs.readFileSync(startTimeFile, "utf-8").trim()
  return parseInt(timestamp, 10)
}

/**
 * 删除 PID 文件及相关文件
 */
export const removePidFile = () => {
  const files = [getPidFilePath(), getPortFilePath(), getStartTimeFilePath()]
  
  files.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file)
    }
  })
}
