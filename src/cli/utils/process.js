/**
 * 进程管理工具
 * 用于检查和管理进程状态
 */

import { spawn, exec, execSync } from "child_process"
import net from "net"
import http from "http"

/**
 * 检查进程是否正在运行
 * @param {number} pid - 进程 ID
 * @returns {boolean} 进程是否存活
 */
export const isProcessRunning = (pid) => {
  if (!pid || isNaN(pid)) {
    return false
  }

  try {
    // 在 Windows 上使用 tasklist 命令
    if (process.platform === "win32") {
      const output = execSync(`tasklist /FI "PID eq ${pid}" /NH`, {
        encoding: "utf-8",
        timeout: 5000
      })
      // 检查输出中是否包含该 PID
      return output.includes(String(pid))
    } else {
      // 在 Unix 系统上使用 kill -0
      process.kill(pid, 0)
      return true
    }
  } catch (error) {
    // 进程不存在或无法访问
    return false
  }
}

/**
 * 终止单个进程
 * @param {number} pid - 进程 ID
 * @returns {Promise<boolean>} 是否成功终止
 */
export const killProcess = (pid) => {
  return new Promise((resolve) => {
    if (!pid || isNaN(pid)) {
      resolve(false)
      return
    }

    try {
      if (process.platform === "win32") {
        // Windows 使用 taskkill 命令
        exec(`taskkill /PID ${pid} /F`, (error) => {
          if (error) {
            resolve(false)
          } else {
            resolve(true)
          }
        })
      } else {
        // Unix 系统使用 SIGTERM
        process.kill(pid, "SIGTERM")
        
        // 等待进程结束
        let attempts = 0
        const checkInterval = setInterval(() => {
          attempts++
          
          if (!isProcessRunning(pid)) {
            clearInterval(checkInterval)
            resolve(true)
          } else if (attempts >= 10) {
            // 超时后强制终止
            try {
              process.kill(pid, "SIGKILL")
            } catch (e) {
              // 忽略错误
            }
            clearInterval(checkInterval)
            resolve(true)
          }
        }, 500)
      }
    } catch (error) {
      resolve(false)
    }
  })
}

/**
 * 终止进程树（包括所有子进程）
 * @param {number} pid - 进程 ID
 * @returns {Promise<boolean>} 是否成功终止
 */
export const killProcessTree = (pid) => {
  return new Promise((resolve) => {
    if (!pid || isNaN(pid)) {
      resolve(false)
      return
    }

    try {
      if (process.platform === "win32") {
        // Windows 使用 taskkill /T 终止进程树
        exec(`taskkill /F /T /PID ${pid}`, (error) => {
          if (error) {
            resolve(false)
          } else {
            resolve(true)
          }
        })
      } else {
        // Unix 系统使用 pkill 终止进程树
        exec(`pkill -TERM -P ${pid}`, (error) => {
          // 然后终止主进程
          try {
            process.kill(pid, "SIGTERM")
          } catch (e) {
            // 忽略错误
          }
          
          // 等待进程结束
          let attempts = 0
          const checkInterval = setInterval(() => {
            attempts++
            
            if (!isProcessRunning(pid)) {
              clearInterval(checkInterval)
              resolve(true)
            } else if (attempts >= 10) {
              // 超时后强制终止
              try {
                process.kill(pid, "SIGKILL")
              } catch (e) {
                // 忽略错误
              }
              clearInterval(checkInterval)
              resolve(true)
            }
          }, 500)
        })
      }
    } catch (error) {
      resolve(false)
    }
  })
}

/**
 * 通过端口号查找占用该端口的进程
 * @param {number} port - 端口号
 * @returns {Promise<number|null>} 进程 ID，如果未找到则返回 null
 */
export const findProcessByPort = (port) => {
  return new Promise((resolve) => {
    try {
      if (process.platform === "win32") {
        // Windows 使用 netstat 命令
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
          if (error || !stdout) {
            resolve(null)
            return
          }
          
          // 解析输出，查找 LISTENING 状态的进程
          const lines = stdout.split("\n")
          for (const line of lines) {
            if (line.includes("LISTENING")) {
              const parts = line.trim().split(/\s+/)
              const pid = parseInt(parts[parts.length - 1], 10)
              if (!isNaN(pid) && pid > 0) {
                resolve(pid)
                return
              }
            }
          }
          
          resolve(null)
        })
      } else {
        // Unix 系统使用 lsof 命令
        exec(`lsof -i :${port} -t`, (error, stdout) => {
          if (error || !stdout) {
            resolve(null)
            return
          }
          
          const pid = parseInt(stdout.trim().split("\n")[0], 10)
          if (!isNaN(pid) && pid > 0) {
            resolve(pid)
          } else {
            resolve(null)
          }
        })
      }
    } catch (error) {
      resolve(null)
    }
  })
}

/**
 * 通过端口终止占用该端口的进程
 * @param {number} port - 端口号
 * @returns {Promise<boolean>} 是否成功终止
 */
export const killProcessByPort = async (port) => {
  const pid = await findProcessByPort(port)
  
  if (!pid) {
    return false
  }
  
  return killProcessTree(pid)
}

/**
 * 检查端口是否被占用
 * @param {number} port - 端口号
 * @returns {Promise<boolean>} 端口是否被占用
 */
export const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer()
    
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(true)
      } else {
        resolve(false)
      }
    })
    
    server.once("listening", () => {
      server.close()
      resolve(false)
    })
    
    server.listen(port)
  })
}

/**
 * 等待端口开始监听（通过 HTTP 请求验证）
 * @param {number} port - 端口号
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<boolean>} 端口是否开始监听
 */
export const waitForPortListening = (port, timeout = 10000) => {
  return new Promise((resolve) => {
    const startTime = Date.now()
    
    const check = () => {
      // 使用 HTTP 请求验证服务器是否真正可用
      const req = http.request({
        hostname: "localhost",
        port: port,
        path: "/",
        method: "GET",
        timeout: 1000
      }, (res) => {
        // 服务器响应，说明已启动
        resolve(true)
      })
      
      req.on("error", () => {
        // 请求失败，检查是否超时
        if (Date.now() - startTime >= timeout) {
          resolve(false)
        } else {
          setTimeout(check, 200)
        }
      })
      
      req.on("timeout", () => {
        req.destroy()
        if (Date.now() - startTime >= timeout) {
          resolve(false)
        } else {
          setTimeout(check, 200)
        }
      })
      
      req.end()
    }
    
    check()
  })
}

/**
 * 启动后台进程
 * @param {string} command - 要执行的命令
 * @param {string[]} args - 命令参数
 * @param {Object} options - spawn 选项
 * @returns {ChildProcess} 子进程实例
 */
export const startBackgroundProcess = (command, args = [], options = {}) => {
  const defaultOptions = {
    detached: true,
    stdio: "ignore",
    shell: process.platform === "win32",
    windowsHide: true,
    ...options
  }

  const child = spawn(command, args, defaultOptions)
  
  // 让子进程在父进程退出后继续运行
  child.unref()
  
  return child
}
