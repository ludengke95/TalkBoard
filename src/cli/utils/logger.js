/**
 * 日志管理工具
 * 用于记录和读取服务运行日志
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
 * 获取日志文件路径
 * @returns {string} 日志文件的完整路径
 */
export const getLogFilePath = () => {
  return path.join(getDataDir(), "talkboard.log")
}

/**
 * 格式化时间戳
 * @param {Date} date - 日期对象
 * @returns {string} 格式化的时间字符串
 */
const formatTimestamp = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 写入日志
 * @param {string} message - 日志消息
 * @param {string} level - 日志级别 (INFO, WARN, ERROR)
 */
export const writeLog = (message, level = "INFO") => {
  const logFile = getLogFilePath()
  const timestamp = formatTimestamp()
  const logLine = `[${timestamp}] [${level}] ${message}\n`
  
  try {
    // 追加写入日志
    fs.appendFileSync(logFile, logLine, "utf-8")
    
    // 检查日志文件大小，如果超过 1MB 则轮转
    const stats = fs.statSync(logFile)
    const maxSize = 1024 * 1024 // 1MB
    
    if (stats.size > maxSize) {
      rotateLog()
    }
  } catch (error) {
    // 日志写入失败时，输出到控制台
    console.error(`写入日志失败: ${error.message}`)
  }
}

/**
 * 轮转日志文件
 * 保留最近的日志，删除旧日志
 */
const rotateLog = () => {
  const logFile = getLogFilePath()
  const backupFile = `${logFile}.old`
  
  try {
    // 删除旧的备份文件
    if (fs.existsSync(backupFile)) {
      fs.unlinkSync(backupFile)
    }
    
    // 将当前日志重命名为备份
    if (fs.existsSync(logFile)) {
      fs.renameSync(logFile, backupFile)
    }
  } catch (error) {
    console.error(`日志轮转失败: ${error.message}`)
  }
}

/**
 * 读取最近的日志
 * @param {number} lines - 要读取的行数
 * @returns {string[]} 日志行数组
 */
export const readLogs = (lines = 50) => {
  const logFile = getLogFilePath()
  
  if (!fs.existsSync(logFile)) {
    return []
  }
  
  try {
    const content = fs.readFileSync(logFile, "utf-8")
    const allLines = content.trim().split("\n")
    
    // 返回最后 N 行
    return allLines.slice(-lines)
  } catch (error) {
    console.error(`读取日志失败: ${error.message}`)
    return []
  }
}

/**
 * 清空日志文件
 */
export const clearLogs = () => {
  const logFile = getLogFilePath()
  
  try {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile)
    }
  } catch (error) {
    console.error(`清空日志失败: ${error.message}`)
  }
}

/**
 * 记录信息日志
 * @param {string} message - 日志消息
 */
export const logInfo = (message) => {
  writeLog(message, "INFO")
}

/**
 * 记录警告日志
 * @param {string} message - 日志消息
 */
export const logWarn = (message) => {
  writeLog(message, "WARN")
}

/**
 * 记录错误日志
 * @param {string} message - 日志消息
 */
export const logError = (message) => {
  writeLog(message, "ERROR")
}
