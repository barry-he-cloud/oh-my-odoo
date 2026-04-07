import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import { existsSync, readFileSync, readdirSync } from "fs"
import { join } from "path"
import { log } from "../../shared"

interface OdooProjectInfo {
  odooVersion?: string
  pythonVersion?: string
  edition?: string
  framework: "odoo"
  customModuleCount: number
  hasOCA: boolean
  hasWebsite: boolean
  hasEcommerce: boolean
  hasPOS: boolean
  dbName?: string
}

function detectOdooProject(projectRoot: string): OdooProjectInfo | null {
  // Check for Odoo markers
  const markers = [
    join(projectRoot, "odoo-bin"),
    join(projectRoot, "odoo", "__init__.py"),
    join(projectRoot, "odoo.conf"),
    join(projectRoot, "requirements.txt"),
  ]

  const hasSetupCfg = existsSync(join(projectRoot, "setup.cfg"))
  const hasOdooBin = existsSync(join(projectRoot, "odoo-bin"))

  // Check for custom modules (addons dirs with __manifest__.py)
  let customModuleCount = 0
  let hasOCA = false
  let hasWebsite = false
  let hasEcommerce = false
  let hasPOS = false

  const addonsDirs = ["addons", "custom_addons", "extra-addons"]
  for (const addonsDir of addonsDirs) {
    const addonsPath = join(projectRoot, addonsDir)
    if (existsSync(addonsPath)) {
      try {
        const modules = readdirSync(addonsPath, { withFileTypes: true })
        for (const mod of modules) {
          if (mod.isDirectory() && existsSync(join(addonsPath, mod.name, "__manifest__.py"))) {
            customModuleCount++
            if (mod.name.startsWith("website")) hasWebsite = true
            if (mod.name.includes("ecommerce") || mod.name.includes("sale_website")) hasEcommerce = true
            if (mod.name.startsWith("pos_") || mod.name === "point_of_sale") hasPOS = true
          }
        }
      } catch { /* ignore */ }
    }
  }

  // Check requirements.txt for OCA packages
  const requirementsPath = join(projectRoot, "requirements.txt")
  if (existsSync(requirementsPath)) {
    try {
      const reqs = readFileSync(requirementsPath, "utf-8")
      if (reqs.includes("odoo-addon-") || reqs.includes("odoo14-addon-") || reqs.includes("odoo15-addon-") || reqs.includes("odoo16-addon-") || reqs.includes("odoo17-addon-") || reqs.includes("odoo18-addon-")) {
        hasOCA = true
      }
    } catch { /* ignore */ }
  }

  // If no odoo-bin and no custom modules, not an Odoo project
  if (!hasOdooBin && customModuleCount === 0 && !hasSetupCfg) {
    // Last chance: check if there's __manifest__.py directly
    const directModules = readdirSync(projectRoot, { withFileTypes: true }).filter(
      e => e.isDirectory() && existsSync(join(projectRoot, e.name, "__manifest__.py"))
    )
    if (directModules.length === 0) return null
    customModuleCount = directModules.length
  }

  // Detect version from odoo/release.py or requirements
  let odooVersion: string | undefined
  const releasePy = join(projectRoot, "odoo", "release.py")
  if (existsSync(releasePy)) {
    try {
      const content = readFileSync(releasePy, "utf-8")
      const versionMatch = content.match(/version_info\s*=\s*\((\d+),\s*(\d+)/)
      if (versionMatch) {
        odooVersion = `${versionMatch[1]}.${versionMatch[2]}`
      }
    } catch { /* ignore */ }
  }

  // Detect from __manifest__.py version field
  if (!odooVersion) {
    for (const addonsDir of [...addonsDirs, "."]) {
      const addonsPath = join(projectRoot, addonsDir)
      if (!existsSync(addonsPath)) continue
      try {
        const entries = readdirSync(addonsPath, { withFileTypes: true })
        for (const e of entries) {
          if (!e.isDirectory()) continue
          const manifestPath = join(addonsPath, e.name, "__manifest__.py")
          if (existsSync(manifestPath)) {
            const content = readFileSync(manifestPath, "utf-8")
            const vMatch = content.match(/["']version["']\s*:\s*["'](\d+\.\d+)/)
            if (vMatch) {
              odooVersion = vMatch[1]
              break
            }
          }
        }
        if (odooVersion) break
      } catch { /* ignore */ }
    }
  }

  // Detect odoo.conf for db_name
  let dbName: string | undefined
  const confPath = join(projectRoot, "odoo.conf")
  if (existsSync(confPath)) {
    try {
      const content = readFileSync(confPath, "utf-8")
      const dbMatch = content.match(/db_name\s*=\s*(.+)/)
      if (dbMatch) dbName = dbMatch[1].trim()
    } catch { /* ignore */ }
  }

  return {
    odooVersion,
    edition: undefined,
    framework: "odoo",
    customModuleCount,
    hasOCA,
    hasWebsite,
    hasEcommerce,
    hasPOS,
    dbName,
  }
}

export function createOdooContextInjectorHook(ctx: PluginInput): Hooks {
  const injectedSessions = new Set<string>()
  let cachedInfo: OdooProjectInfo | null | undefined

  const getProjectInfo = (): OdooProjectInfo | null => {
    if (cachedInfo !== undefined) return cachedInfo
    cachedInfo = detectOdooProject(ctx.directory)
    if (cachedInfo) {
      log("[odoo-context-injector] Detected Odoo project", cachedInfo)
    }
    return cachedInfo
  }

  return {
    "tool.execute.before": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { args: Record<string, unknown>; message?: string },
    ): Promise<void> => {
      const toolName = input.tool?.toLowerCase()
      if (toolName !== "write" && toolName !== "read" && toolName !== "edit" && toolName !== "bash") return

      if (injectedSessions.has(input.sessionID)) return

      const info = getProjectInfo()
      if (!info) return

      injectedSessions.add(input.sessionID)

      const parts: string[] = ["[Odoo Project Context]"]
      if (info.odooVersion) parts.push(`Odoo Version: ${info.odooVersion}`)
      if (info.edition) parts.push(`Edition: ${info.edition}`)
      parts.push(`Custom Modules: ${info.customModuleCount}`)
      if (info.hasOCA) parts.push("Uses OCA (Odoo Community Association) addons")
      if (info.hasWebsite) parts.push("Has Website module(s)")
      if (info.hasEcommerce) parts.push("Has E-commerce module(s)")
      if (info.hasPOS) parts.push("Has POS module(s)")
      if (info.dbName) parts.push(`Database: ${info.dbName}`)

      parts.push("")
      parts.push("Odoo conventions:")
      parts.push("- Models in models/ dir, inheriting models.Model")
      parts.push("- Views in views/ dir (XML), using QWeb for templates")
      parts.push("- Security in security/ dir (ir.model.access.csv + ir.rule XML)")
      parts.push("- Data in data/ dir, demo in demo/ dir")
      parts.push("- Controllers in controllers/ for HTTP endpoints")
      parts.push("- Static assets in static/ dir")
      parts.push("- Always update __manifest__.py when adding files")

      output.message = parts.join("\n")
    },
  }
}
