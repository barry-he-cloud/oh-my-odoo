import type { PluginInput } from "@opencode-ai/plugin"
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { readFile, stat } from "fs/promises"
import { join, resolve } from "path"
import type { ConfigValidationResult, ConfigError, ConfigWarning } from "./types"
import { SECURITY_SENSITIVE_KEYS } from "./types"

async function exists(p: string): Promise<boolean> {
  try { await stat(p); return true } catch { return false }
}

function parseOdooConf(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  const lines = content.split("\n")
  let currentSection = ""

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith("#") || line.startsWith(";")) continue

    const sectionMatch = line.match(/^\[(.+)\]$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      continue
    }

    const kvMatch = line.match(/^([^=]+?)\s*=\s*(.*)$/)
    if (kvMatch) {
      const key = kvMatch[1].trim()
      const value = kvMatch[2].trim()
      result[currentSection ? `${currentSection}.${key}` : key] = value
    }
  }

  return result
}

function validateConfig(configPath: string, parsed: Record<string, string>): ConfigValidationResult {
  const errors: ConfigError[] = []
  const warnings: ConfigWarning[] = []

  // Check admin password strength
  const adminPasswd = parsed["options.admin_passwd"] ?? parsed["admin_passwd"]
  if (adminPasswd === "admin" || adminPasswd === "master_password") {
    errors.push({ key: "admin_passwd", message: "Default admin password detected — critical security risk in production" })
  } else if (!adminPasswd) {
    warnings.push({ key: "admin_passwd", message: "No admin master password set. Database management will be open." })
  }

  // Check db_password
  const dbPassword = parsed["options.db_password"] ?? parsed["db_password"]
  if (!dbPassword || dbPassword === "False") {
    warnings.push({ key: "db_password", message: "No database password configured. Using peer/trust auth." })
  }

  // Check workers
  const workers = parsed["options.workers"] ?? parsed["workers"]
  if (!workers || workers === "0") {
    warnings.push({ key: "workers", message: "Workers set to 0 (single-process mode). Not recommended for production." })
  }

  // Check list_db in production
  const listDb = parsed["options.list_db"] ?? parsed["list_db"]
  if (listDb !== "False") {
    warnings.push({ key: "list_db", message: "Database listing is enabled. Set list_db = False for production security." })
  }

  // Check proxy_mode
  const proxyMode = parsed["options.proxy_mode"] ?? parsed["proxy_mode"]
  if (!proxyMode || proxyMode === "False") {
    warnings.push({ key: "proxy_mode", message: "proxy_mode is disabled. Enable if behind a reverse proxy (nginx/Apache)." })
  }

  // Check memory limits
  const memHard = parsed["options.limit_memory_hard"] ?? parsed["limit_memory_hard"]
  const memSoft = parsed["options.limit_memory_soft"] ?? parsed["limit_memory_soft"]
  if (workers && parseInt(workers) > 0) {
    if (!memHard) warnings.push({ key: "limit_memory_hard", message: "No hard memory limit set for multi-worker mode." })
    if (!memSoft) warnings.push({ key: "limit_memory_soft", message: "No soft memory limit set for multi-worker mode." })
  }

  // Check addons_path
  const addonsPath = parsed["options.addons_path"] ?? parsed["addons_path"]
  if (!addonsPath) {
    errors.push({ key: "addons_path", message: "No addons_path configured. Odoo won't find custom modules." })
  }

  // Check data_dir
  const dataDir = parsed["options.data_dir"] ?? parsed["data_dir"]
  if (!dataDir) {
    warnings.push({ key: "data_dir", message: "No data_dir set. Odoo will use default ~/.local/share/Odoo." })
  }

  return {
    valid: errors.length === 0,
    configPath,
    errors,
    warnings,
    parsed,
  }
}

function formatResult(result: ConfigValidationResult): string {
  const lines: string[] = [`Odoo config validation: ${result.configPath}`]
  lines.push(result.valid ? "Status: VALID (no errors)" : `Status: INVALID (${result.errors.length} error(s))`)
  lines.push("")

  if (result.errors.length > 0) {
    lines.push("ERRORS:")
    for (const err of result.errors) {
      lines.push(`  [ERROR] ${err.key}: ${err.message}`)
    }
  }

  if (result.warnings.length > 0) {
    lines.push("\nWARNINGS:")
    for (const warn of result.warnings) {
      lines.push(`  [WARN] ${warn.key}: ${warn.message}`)
    }
  }

  // Show config summary (mask sensitive values)
  lines.push("\nConfig summary:")
  for (const [key, value] of Object.entries(result.parsed)) {
    const shortKey = key.replace("options.", "")
    const isSensitive = SECURITY_SENSITIVE_KEYS.some(sk => key.includes(sk))
    lines.push(`  ${shortKey} = ${isSensitive ? "****" : value}`)
  }

  return lines.join("\n")
}

export function createOdooConfigValidator(ctx: PluginInput): Record<string, ToolDefinition> {
  const configValidator: ToolDefinition = tool({
    description:
      "Validate Odoo configuration file (odoo.conf). " +
      "Checks security settings (admin password, db listing), performance tuning (workers, memory limits), " +
      "reverse proxy config, and addons path. " +
      "Reports errors (must fix) and warnings (should fix). Masks sensitive values in output.",
    args: {
      config_path: tool.schema.string().optional()
        .describe("Path to odoo.conf. Auto-detects from project root, /etc/odoo/odoo.conf, or ~/.odoorc"),
      project_root: tool.schema.string().optional()
        .describe("Project root directory for auto-detection. Defaults to cwd."),
    },
    execute: async (params) => {
      const projectRoot = resolve(params.project_root ?? ctx.directory)

      const candidates = [
        params.config_path,
        join(projectRoot, "odoo.conf"),
        join(projectRoot, "config", "odoo.conf"),
        "/etc/odoo/odoo.conf",
        join(process.env.HOME ?? "", ".odoorc"),
      ].filter(Boolean) as string[]

      let configPath: string | null = null
      for (const candidate of candidates) {
        if (await exists(candidate)) {
          configPath = candidate
          break
        }
      }

      if (!configPath) {
        return `No odoo.conf found. Searched:\n${candidates.map(c => `  - ${c}`).join("\n")}\n\nCreate one with: odoo-bin --save --config=odoo.conf --stop-after-init`
      }

      try {
        const content = await readFile(configPath, "utf-8")
        const parsed = parseOdooConf(content)
        const result = validateConfig(configPath, parsed)
        return formatResult(result)
      } catch (err) {
        return `Error reading config: ${err instanceof Error ? err.message : String(err)}`
      }
    },
  })

  return { odoo_config_validator: configValidator }
}
