/**
 * stop 命令实现
 * 停止 TalkBoard 服务
 */

import chalk from "chalk"
import { readPid, readPort, removePidFile } from "../utils/pid.js"
import { isProcessRunning, killProcessTree, findProcessByPort, killProcessByPort } from "../utils/process.js"
import { logInfo, logError } from "../utils/logger.js"

/**
 * stop 命令主函数
 */
export const stopCommand = async () => {
  console.log(chalk.blue("TalkBoard 服务停止器"))
  console.log()
  
  // 读取 PID 和端口
  const pid = readPid()
  const port = readPort()
  
  if (!pid && !port) {
    console.log(chalk.yellow("未找到运行中的服务"))
    console.log(chalk.gray("服务可能未启动或已停止"))
    return
  }
  
  // 尝试通过 PID 停止
  if (pid && isProcessRunning(pid)) {
    console.log(chalk.gray(`正在停止服务 (PID: ${pid}${port ? `, 端口: ${port}` : ""})...`))
    logInfo(`正在停止服务 - PID: ${pid}`)
    
    // 使用进程树终止
    const killed = await killProcessTree(pid)
    
    if (killed) {
      // 清理 PID 文件
      removePidFile()
      
      console.log(chalk.green("✓ 服务已停止"))
      logInfo(`服务已停止 - PID: ${pid}`)
      return
    }
    
    // PID 方式失败，尝试通过端口停止
    console.log(chalk.yellow("通过 PID 停止失败，尝试通过端口停止..."))
  }
  
  // 尝试通过端口停止
  if (port) {
    console.log(chalk.gray(`正在通过端口 ${port} 查找并停止服务...`))
    logInfo(`尝试通过端口停止服务 - 端口: ${port}`)
    
    // 查找占用端口的进程
    const portPid = await findProcessByPort(port)
    
    if (portPid) {
      console.log(chalk.gray(`找到进程 PID: ${portPid}`))
      
      const killed = await killProcessTree(portPid)
      
      if (killed) {
        // 清理 PID 文件
        removePidFile()
        
        console.log(chalk.green("✓ 服务已停止"))
        logInfo(`服务已停止 - PID: ${portPid}, 端口: ${port}`)
        return
      }
    }
    
    // 直接尝试通过端口终止
    const killed = await killProcessByPort(port)
    
    if (killed) {
      removePidFile()
      console.log(chalk.green("✓ 服务已停止"))
      logInfo(`服务已停止 - 端口: ${port}`)
      return
    }
  }
  
  // 所有方式都失败
  console.log(chalk.red("✗ 停止服务失败"))
  console.log(chalk.gray("请手动终止进程或检查权限"))
  
  if (pid) {
    console.log(chalk.gray(`提示: 可尝试运行 taskkill /F /T /PID ${pid}`))
  }
  if (port) {
    console.log(chalk.gray(`提示: 端口 ${port} 可能仍被占用`))
  }
  
  logError(`停止服务失败 - PID: ${pid}, 端口: ${port}`)
  
  // 清理 PID 文件（即使停止失败也清理，避免残留）
  removePidFile()
}
