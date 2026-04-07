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
import {
  SYMBOLS,
  argsToConfig,
  formatConfigSummary,
  printBox,
  printError,
  printHeader,
  printInfo,
  printStep,
  printSuccess,
  printWarning,
  validateNonTuiArgs,
} from "./install-validators"

export async function runCliInstaller(args: InstallArgs, version: string): Promise<number> {
  const validation = validateNonTuiArgs(args)
  if (!validation.valid) {
    printHeader(false)
    printError("参数验证失败:")
    for (const err of validation.errors) {
      console.log(`  ${SYMBOLS.bullet} ${err}`)
    }
    console.log()
    printInfo(
      `用法: bunx ${PLUGIN_NAME} install --no-tui --odoo-version=17.0 --edition=community`,
    )
    console.log()
    return 1
  }

  const detected = detectCurrentConfig()
  const isUpdate = detected.isInstalled

  printHeader(isUpdate)

  const totalSteps = 4
  let step = 1

  // Step 1: Check OpenCode
  printStep(step++, totalSteps, "检查 OpenCode 安装状态...")
  const installed = await isOpenCodeInstalled()
  const openCodeVersion = await getOpenCodeVersion()
  if (!installed) {
    printWarning("OpenCode 未找到。插件配置将被创建，但你需要先安装 OpenCode 才能使用。")
    printInfo("安装: bun install -g opencode-ai | 文档: https://opencode.ai/docs")
  } else {
    printSuccess(`OpenCode ${openCodeVersion ?? ""} 已安装`)
  }

  // Step 2: Detect Odoo project
  printStep(step++, totalSteps, "检测 Odoo 项目...")
  if (detected.hasOdooBin || detected.customModuleCount > 0) {
    printSuccess(`检测到 Odoo 项目: ${detected.odooVersion ?? "未知版本"}, ${detected.customModuleCount} 个自定义模块`)
  } else {
    printInfo("未检测到 Odoo 项目（将使用默认配置）")
  }

  const config = argsToConfig(args)

  // Step 3: Add plugin
  printStep(step++, totalSteps, `注册 ${PLUGIN_NAME} 插件...`)
  const pluginResult = await addPluginToOpenCodeConfig(version)
  if (!pluginResult.success) {
    printError(`注册失败: ${pluginResult.error}`)
    return 1
  }
  printSuccess(`插件${isUpdate ? "已更新" : "已注册"} ${SYMBOLS.arrow} ${color.dim(pluginResult.configPath)}`)

  // Step 4: Write config
  printStep(step++, totalSteps, `写入 ${PLUGIN_NAME} 配置文件...`)
  const configResult = writeOdooConfig(config)
  if (!configResult.success) {
    printError(`写入失败: ${configResult.error}`)
    return 1
  }
  printSuccess(`配置已写入 ${SYMBOLS.arrow} ${color.dim(configResult.configPath)}`)

  printBox(formatConfigSummary(config), isUpdate ? "更新完成" : "安装完成")

  console.log(`${SYMBOLS.star} ${color.bold(color.green(isUpdate ? "配置更新成功！" : "安装成功！"))}`)
  console.log(`  运行 ${color.cyan("opencode")} 开始使用！`)
  console.log()

  printBox(
    `可用的 Odoo 专属工具:\n` +
    `  odoo_module_scanner   - 扫描所有自定义模块\n` +
    `  odoo_upgrade_analyze  - 版本升级兼容性分析 (14→19)\n` +
    `  odoo_security_checker - 安全审计\n` +
    `  odoo_scaffold         - 生成新模块骨架\n` +
    `  odoo_config_validator - 验证 odoo.conf\n` +
    `  odoo_xml_validator    - XML 视图验证`,
    "可用工具",
  )

  return 0
}
