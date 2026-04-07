import * as p from "@clack/prompts"
import color from "picocolors"
import { PLUGIN_NAME } from "../shared/plugin-identity"
import type { InstallArgs } from "./types"
import {
  detectCurrentConfig,
  addPluginToOpenCodeConfig,
  writeOdooConfig,
  isOpenCodeInstalled,
  getOpenCodeVersion,
} from "./config-manager"
import { detectedToInitialValues, formatConfigSummary, SYMBOLS } from "./install-validators"
import { promptInstallConfig } from "./tui-install-prompts"

export async function runTuiInstaller(args: InstallArgs, version: string): Promise<number> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error("错误：交互式安装需要 TTY 终端。请使用 --no-tui 模式。")
    return 1
  }

  const detected = detectCurrentConfig()
  const isUpdate = detected.isInstalled

  p.intro(color.bgCyan(color.white(isUpdate ? " oh-my-odoo — 更新配置 " : " oh-my-odoo — 安装向导 ")))

  // Show detected info
  if (detected.hasOdooBin || detected.customModuleCount > 0) {
    const info: string[] = []
    if (detected.odooVersion) info.push(`版本: ${detected.odooVersion}`)
    if (detected.customModuleCount > 0) info.push(`自定义模块: ${detected.customModuleCount}`)
    if (detected.database) info.push(`数据库: ${detected.database}`)
    if (info.length > 0) {
      p.log.info(`检测到 Odoo 项目: ${info.join(", ")}`)
    }
  }

  if (isUpdate) {
    p.log.info("检测到已有配置，将进行更新。")
  }

  // Check OpenCode
  const spinner = p.spinner()
  spinner.start("检查 OpenCode 安装状态")

  const installed = await isOpenCodeInstalled()
  const openCodeVersion = await getOpenCodeVersion()
  if (!installed) {
    spinner.stop(`OpenCode 未安装 ${color.yellow("[!]")}`)
    p.log.warn("OpenCode 未找到。插件配置将被创建，但你需要先安装 OpenCode 才能使用。")
    p.note("安装 OpenCode: bun install -g opencode-ai\n文档: https://opencode.ai/docs", "安装指南")
  } else {
    spinner.stop(`OpenCode ${openCodeVersion ?? ""} 已安装 ${color.green("[OK]")}`)
  }

  // Interactive prompts
  const config = await promptInstallConfig(detected)
  if (!config) return 1

  // Add plugin to opencode.json
  spinner.start(`注册 ${PLUGIN_NAME} 插件到 OpenCode 配置`)
  const pluginResult = await addPluginToOpenCodeConfig(version)
  if (!pluginResult.success) {
    spinner.stop(`注册失败: ${pluginResult.error}`)
    p.outro(color.red("安装失败。"))
    return 1
  }
  spinner.stop(`插件已注册 ${SYMBOLS.arrow} ${color.cyan(pluginResult.configPath)}`)

  // Write oh-my-odoo config
  spinner.start(`写入 ${PLUGIN_NAME} 配置文件`)
  const configResult = writeOdooConfig(config)
  if (!configResult.success) {
    spinner.stop(`写入失败: ${configResult.error}`)
    p.outro(color.red("安装失败。"))
    return 1
  }
  spinner.stop(`配置已写入 ${SYMBOLS.arrow} ${color.cyan(configResult.configPath)}`)

  // Summary
  p.note(formatConfigSummary(config), isUpdate ? "更新完成" : "安装完成")

  p.log.success(color.bold(isUpdate ? "配置更新成功！" : "安装成功！"))
  p.log.message(`运行 ${color.cyan("opencode")} 开始使用！`)

  p.note(
    `可用的 Odoo 专属工具:\n` +
    `  ${color.cyan("odoo_module_scanner")}   扫描所有自定义模块\n` +
    `  ${color.cyan("odoo_upgrade_analyze")}  版本升级兼容性分析\n` +
    `  ${color.cyan("odoo_security_checker")} 安全审计\n` +
    `  ${color.cyan("odoo_scaffold")}         生成新模块骨架\n` +
    `  ${color.cyan("odoo_config_validator")} 验证 odoo.conf\n` +
    `  ${color.cyan("odoo_xml_validator")}    XML 视图验证`,
    "可用工具",
  )

  p.outro(color.green("oh-my-odoo 安装完成！祝开发愉快！"))

  return 0
}
