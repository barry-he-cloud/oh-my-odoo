import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import type { DetectedConfig } from "../types"
import { parseJsonc } from "../../shared"
import { PLUGIN_NAME } from "../../shared/plugin-identity"

function detectOdooVersion(projectRoot: string): string | undefined {
  // Try odoo/release.py
  const releasePy = join(projectRoot, "odoo", "release.py")
  if (existsSync(releasePy)) {
    try {
      const content = readFileSync(releasePy, "utf-8")
      const match = content.match(/version_info\s*=\s*\((\d+),\s*(\d+)/)
      if (match) return `${match[1]}.${match[2]}`
    } catch { /* ignore */ }
  }

  // Try __manifest__.py version field
  const addonsDirs = ["addons", "custom_addons", "extra-addons"]
  for (const dir of addonsDirs) {
    const addonsPath = join(projectRoot, dir)
    if (!existsSync(addonsPath)) continue
    try {
      const entries = readdirSync(addonsPath, { withFileTypes: true })
      for (const e of entries) {
        if (!e.isDirectory()) continue
        const manifestPath = join(addonsPath, e.name, "__manifest__.py")
        if (existsSync(manifestPath)) {
          const content = readFileSync(manifestPath, "utf-8")
          const vMatch = content.match(/["']version["']\s*:\s*["'](\d+\.\d+)/)
          if (vMatch) return vMatch[1]
        }
      }
    } catch { /* ignore */ }
  }
  return undefined
}

function detectDatabase(projectRoot: string): string | undefined {
  const confPath = join(projectRoot, "odoo.conf")
  if (!existsSync(confPath)) return undefined
  try {
    const content = readFileSync(confPath, "utf-8")
    const match = content.match(/db_name\s*=\s*(.+)/)
    if (match) return match[1].trim()
  } catch { /* ignore */ }
  return undefined
}

function countCustomModules(projectRoot: string): number {
  let count = 0
  for (const dir of ["addons", "custom_addons", "extra-addons"]) {
    const addonsPath = join(projectRoot, dir)
    if (!existsSync(addonsPath)) continue
    try {
      const entries = readdirSync(addonsPath, { withFileTypes: true })
      for (const e of entries) {
        if (e.isDirectory() && existsSync(join(addonsPath, e.name, "__manifest__.py"))) {
          count++
        }
      }
    } catch { /* ignore */ }
  }
  return count
}

export function detectCurrentConfig(projectRoot?: string): DetectedConfig {
  const cwd = projectRoot ?? process.cwd()

  const result: DetectedConfig = {
    isInstalled: false,
    hasOdooBin: existsSync(join(cwd, "odoo-bin")),
    hasOdooConf: existsSync(join(cwd, "odoo.conf")) || existsSync(join(cwd, "config", "odoo.conf")),
    customModuleCount: countCustomModules(cwd),
    odooVersion: detectOdooVersion(cwd),
    database: detectDatabase(cwd),
  }

  // Check if plugin is already in opencode.json
  const opencodeConfigPath = join(cwd, ".opencode", "opencode.json")
  if (existsSync(opencodeConfigPath)) {
    try {
      const content = readFileSync(opencodeConfigPath, "utf-8")
      const config = JSON.parse(content)
      const plugins = config.plugin ?? config.plugins ?? []
      result.isInstalled = plugins.some((p: string) =>
        p === PLUGIN_NAME || p.startsWith(`${PLUGIN_NAME}@`) || p.includes("oh-my-odoo")
      )
    } catch { /* ignore */ }
  }

  return result
}
