import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { ConfigMergeResult, InstallConfig } from "../types"
import { CONFIG_BASENAME } from "../../shared/plugin-identity"

function generateConfigContent(config: InstallConfig): Record<string, unknown> {
  const result: Record<string, unknown> = {
    odoo: {
      odoo_version: config.odooVersion,
      edition: config.edition,
      python_version: config.pythonVersion,
      ...(config.database ? { database_name: config.database } : {}),
    },
    auto_detect: config.autoDetect,
    security_audit: config.securityAudit,
    upgrade_safety_checks: config.upgradeChecks,
  }
  return result
}

export function writeOdooConfig(config: InstallConfig): ConfigMergeResult {
  const configDir = join(process.cwd(), ".opencode")
  const configPath = join(configDir, `${CONFIG_BASENAME}.jsonc`)

  try {
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true })
    }

    const content = generateConfigContent(config)
    const jsonStr = JSON.stringify(content, null, 2)

    // Add helpful comments
    const commented = `// oh-my-odoo configuration
// Docs: https://github.com/barry-he-cloud/oh-my-odoo#配置说明
${jsonStr}
`
    writeFileSync(configPath, commented)
    return { success: true, configPath }
  } catch (err) {
    return {
      success: false,
      configPath,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
