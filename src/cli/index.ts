#!/usr/bin/env bun
import { Command } from "commander"
import { PLUGIN_NAME, PLUGIN_VERSION } from "../shared/plugin-identity"
import { install } from "./install"
import { runDoctorChecks, formatDoctorResults } from "./doctor/checks/odoo-system"
import type { InstallArgs } from "./types"

const program = new Command()

program
  .name(PLUGIN_NAME)
  .description("The Best AI Agent Harness for Odoo — OpenCode Plugin")
  .version(PLUGIN_VERSION, "-v, --version", "显示版本号")

program
  .command("install")
  .description("安装并配置 oh-my-odoo（交互式引导）")
  .option("--no-tui", "非交互模式（需提供所有选项）")
  .option("--odoo-version <version>", "Odoo 版本: 14.0, 15.0, 16.0, 17.0, 18.0, 19.0")
  .option("--edition <edition>", "版本类型: community, enterprise")
  .option("--python-version <version>", "Python 版本: 3.10, 3.11, 3.12, 3.13")
  .option("--database <name>", "默认数据库名称")
  .option("--skip-detect", "跳过项目自动检测")
  .addHelpText("after", `
示例:
  $ bunx oh-my-odoo install
  $ bunx oh-my-odoo install --no-tui --odoo-version=17.0 --edition=community
  $ bunx oh-my-odoo install --no-tui --odoo-version=19.0 --edition=enterprise --database=mydb

安装脚本会自动:
  1. 检查 OpenCode 是否已安装
  2. 检测当前 Odoo 项目信息
  3. 引导配置 Odoo 版本、版本类型等
  4. 注册插件到 .opencode/opencode.json
  5. 生成 .opencode/oh-my-odoo.jsonc 配置文件
`)
  .action(async (options) => {
    const args: InstallArgs = {
      tui: options.tui !== false,
      odooVersion: options.odooVersion,
      edition: options.edition,
      pythonVersion: options.pythonVersion,
      database: options.database,
      skipDetect: options.skipDetect ?? false,
    }
    const exitCode = await install(args)
    process.exit(exitCode)
  })

program
  .command("doctor")
  .description("检查系统环境和依赖（Python, PostgreSQL, odoo-bin 等）")
  .option("-d, --directory <path>", "项目根目录", process.cwd())
  .action((options) => {
    const results = runDoctorChecks(options.directory)
    console.log(formatDoctorResults(results))
  })

program
  .command("info")
  .description("显示插件信息和所有可用工具")
  .action(() => {
    console.log(`${PLUGIN_NAME} v${PLUGIN_VERSION}`)
    console.log(`OpenCode Plugin for Odoo ERP Development`)
    console.log()
    console.log("工具 (Tools):")
    console.log("  odoo_cli              - 安全执行 odoo-bin 命令")
    console.log("  odoo_module_update    - 更新 Odoo 模块")
    console.log("  odoo_module_install   - 安装 Odoo 模块")
    console.log("  odoo_test_module      - 运行 Odoo 模块测试")
    console.log("  odoo_module_scanner   - 扫描并清点所有自定义模块")
    console.log("  odoo_config_validator - 验证 odoo.conf 安全与性能配置")
    console.log("  odoo_upgrade_analyze  - 版本升级兼容性分析 (14.0→19.0)")
    console.log("  odoo_upgrade_migrate  - 生成迁移脚本")
    console.log("  odoo_security_checker - 安全审计")
    console.log("  odoo_xml_validator    - XML 视图验证")
    console.log("  odoo_scaffold         - 生成完整模块骨架")
    console.log()
    console.log("知识库 (Skills):")
    console.log("  odoo-orm-expert       - ORM 模型/字段/Recordset/域")
    console.log("  odoo-views-xml        - 视图/QWeb/继承/xpath")
    console.log("  odoo-security         - 访问权限/记录规则/sudo")
    console.log("  odoo-upgrade-analysis - 版本迁移规划")
    console.log("  odoo-debugging        - 日志分析/Shell/pdb/性能")
    console.log("  odoo-performance      - 查询优化/缓存/调优")
    console.log("  odoo-testing          - 测试类/Mock/CI")
    console.log("  odoo-api-integration  - JSON-RPC/XML-RPC/REST/Webhook")
    console.log()
    console.log("智能感知 (Hooks):")
    console.log("  odoo-context-injector - 自动检测 Odoo 项目并注入上下文")
    console.log("  odoo-module-guard     - 防止误改核心模块")
  })

program.parse()
