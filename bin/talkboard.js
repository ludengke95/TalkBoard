#!/usr/bin/env node

/**
 * TalkBoard CLI 入口文件
 * 提供命令行工具来管理白板服务
 */

import { program } from "commander"
import chalk from "chalk"
import { startCommand } from "../src/cli/commands/start.js"
import { stopCommand } from "../src/cli/commands/stop.js"
import { statusCommand } from "../src/cli/commands/status.js"

// 从 package.json 读取版本号
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const packageJson = require("../package.json")

// 配置 CLI 程序
program
  .name("talkboard")
  .description("A web-based whiteboard application with teleprompter and screen recording capabilities")
  .version(packageJson.version)

// start 命令 - 启动服务
program
  .command("start")
  .description("启动 TalkBoard 服务")
  .option("-p, --port <port>", "指定端口号", "3000")
  .option("-d, --daemon", "后台运行模式")
  .action(async (options) => {
    try {
      await startCommand(options)
    } catch (error) {
      console.error(chalk.red(`启动失败: ${error.message}`))
      process.exit(1)
    }
  })

// stop 命令 - 停止服务
program
  .command("stop")
  .description("停止 TalkBoard 服务")
  .action(async () => {
    try {
      await stopCommand()
    } catch (error) {
      console.error(chalk.red(`停止失败: ${error.message}`))
      process.exit(1)
    }
  })

// status 命令 - 查看状态
program
  .command("status")
  .description("查看 TalkBoard 服务状态")
  .action(async () => {
    try {
      await statusCommand()
    } catch (error) {
      console.error(chalk.red(`查询状态失败: ${error.message}`))
      process.exit(1)
    }
  })

// 解析命令行参数
program.parse()
