import type { PluginInput } from "@opencode-ai/plugin"
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { readFile, readdir, stat } from "fs/promises"
import { join, resolve, basename } from "path"
import type { OdooModuleInfo, OdooScanResult } from "./types"

async function exists(p: string): Promise<boolean> {
  try { await stat(p); return true } catch { return false }
}

async function countFiles(dir: string, ext: string): Promise<number> {
  let count = 0
  try {
    const entries = await readdir(dir, { withFileTypes: true, recursive: true })
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(ext)) count++
    }
  } catch { /* dir may not exist */ }
  return count
}

async function parseManifest(modulePath: string): Promise<Record<string, unknown> | null> {
  const manifestPath = join(modulePath, "__manifest__.py")
  if (!(await exists(manifestPath))) return null

  try {
    const content = await readFile(manifestPath, "utf-8")
    // Extract the dict literal from __manifest__.py
    // This is a simplified parser for common Odoo manifest patterns
    const dictMatch = content.match(/\{[\s\S]*\}/)
    if (!dictMatch) return null

    let dictStr = dictMatch[0]
    // Convert Python booleans/None to JSON
    dictStr = dictStr
      .replace(/True/g, "true")
      .replace(/False/g, "false")
      .replace(/None/g, "null")
      // Single quotes to double quotes (naive but works for most manifests)
      .replace(/'/g, '"')
      // Remove trailing commas before closing brackets
      .replace(/,\s*([}\]])/g, "$1")

    return JSON.parse(dictStr)
  } catch {
    return null
  }
}

async function scanModule(modulePath: string): Promise<OdooModuleInfo | null> {
  const manifest = await parseManifest(modulePath)
  if (!manifest) return null

  const name = basename(modulePath)
  const depends = Array.isArray(manifest.depends)
    ? (manifest.depends as string[])
    : []

  return {
    name,
    path: modulePath,
    version: manifest.version as string | undefined,
    summary: manifest.summary as string | undefined,
    category: manifest.category as string | undefined,
    depends,
    odooVersionCompat: manifest.version
      ? (manifest.version as string).split(".").slice(0, 2).join(".")
      : undefined,
    hasModels: await exists(join(modulePath, "models")),
    hasViews: await exists(join(modulePath, "views")),
    hasControllers: await exists(join(modulePath, "controllers")),
    hasSecurity: await exists(join(modulePath, "security")),
    hasData: await exists(join(modulePath, "data")),
    hasDemo: await exists(join(modulePath, "demo")),
    hasTests: await exists(join(modulePath, "tests")),
    hasStaticAssets: await exists(join(modulePath, "static")),
    hasWizards: await exists(join(modulePath, "wizards")) || await exists(join(modulePath, "wizard")),
    hasReports: await exists(join(modulePath, "report")) || await exists(join(modulePath, "reports")),
    pythonFiles: await countFiles(modulePath, ".py"),
    xmlFiles: await countFiles(modulePath, ".xml"),
    jsFiles: await countFiles(modulePath, ".js"),
    installable: manifest.installable !== false,
    license: manifest.license as string | undefined,
  }
}

async function findAddonsDirs(projectRoot: string): Promise<string[]> {
  const candidates = [
    join(projectRoot, "addons"),
    join(projectRoot, "custom_addons"),
    join(projectRoot, "extra-addons"),
    join(projectRoot, "odoo", "addons"),
    projectRoot,
  ]

  const found: string[] = []
  for (const dir of candidates) {
    if (await exists(dir)) {
      const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
      const hasModule = entries.some(e =>
        e.isDirectory() && entries.length > 0
      )
      if (hasModule) {
        // Check if any subdirectory has __manifest__.py
        for (const entry of entries) {
          if (entry.isDirectory() && await exists(join(dir, entry.name, "__manifest__.py"))) {
            found.push(dir)
            break
          }
        }
      }
    }
  }

  return [...new Set(found)]
}

async function scanAddonsDir(addonsDir: string): Promise<OdooModuleInfo[]> {
  const modules: OdooModuleInfo[] = []
  const entries = await readdir(addonsDir, { withFileTypes: true }).catch(() => [])

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue
    const modulePath = join(addonsDir, entry.name)
    const info = await scanModule(modulePath)
    if (info) modules.push(info)
  }

  return modules
}

function formatScanResult(result: OdooScanResult): string {
  if (result.totalModules === 0) {
    return `No custom Odoo modules found (${result.scanDuration}ms)\nSearched: ${result.addonsPaths.join(", ") || "no addons dirs detected"}`
  }

  const lines: string[] = [
    `Found ${result.totalModules} Odoo modules in ${result.addonsPaths.length} addons dir(s) (${result.scanDuration}ms)`,
    `Addons paths: ${result.addonsPaths.join(", ")}\n`,
  ]

  const installable = result.modules.filter(m => m.installable)
  const nonInstallable = result.modules.filter(m => !m.installable)

  if (installable.length > 0) {
    lines.push(`--- Installable (${installable.length}) ---`)
    for (const mod of installable) {
      const features = [
        mod.hasModels ? "models" : null,
        mod.hasViews ? "views" : null,
        mod.hasControllers ? "controllers" : null,
        mod.hasSecurity ? "security" : null,
        mod.hasWizards ? "wizards" : null,
        mod.hasReports ? "reports" : null,
        mod.hasTests ? "tests" : null,
        mod.hasStaticAssets ? "assets" : null,
      ].filter(Boolean).join(", ")

      lines.push(`  ${mod.name}${mod.version ? ` v${mod.version}` : ""} [${mod.pythonFiles}py/${mod.xmlFiles}xml/${mod.jsFiles}js]`)
      if (mod.summary) lines.push(`    ${mod.summary}`)
      if (features) lines.push(`    Components: ${features}`)
      if (mod.depends.length > 0) lines.push(`    Depends: ${mod.depends.join(", ")}`)
    }
  }

  if (nonInstallable.length > 0) {
    lines.push(`\n--- Non-installable (${nonInstallable.length}) ---`)
    for (const mod of nonInstallable) {
      lines.push(`  ${mod.name} (installable=false)`)
    }
  }

  return lines.join("\n")
}

export function createOdooModuleScanner(ctx: PluginInput): Record<string, ToolDefinition> {
  const moduleScanner: ToolDefinition = tool({
    description:
      "Scan Odoo project to inventory all custom modules. " +
      "Auto-detects addons directories and parses __manifest__.py for each module. " +
      "Reports dependencies, components (models, views, controllers, security, wizards, reports), " +
      "file counts, and installability. Essential for upgrade planning and impact analysis.",
    args: {
      project_root: tool.schema.string().optional()
        .describe("Odoo project root directory. Defaults to current working directory."),
      addons_path: tool.schema.string().optional()
        .describe("Explicit addons directory to scan. If omitted, auto-detects common locations."),
    },
    execute: async (params) => {
      const projectRoot = resolve(params.project_root ?? ctx.directory)
      const start = Date.now()

      try {
        let addonsPaths: string[]
        if (params.addons_path) {
          addonsPaths = [resolve(params.addons_path)]
        } else {
          addonsPaths = await findAddonsDirs(projectRoot)
        }

        const allModules: OdooModuleInfo[] = []
        for (const dir of addonsPaths) {
          const modules = await scanAddonsDir(dir)
          allModules.push(...modules)
        }

        const result: OdooScanResult = {
          modules: allModules,
          totalModules: allModules.length,
          scanDuration: Date.now() - start,
          addonsPaths,
        }
        return formatScanResult(result)
      } catch (err) {
        return `Error scanning modules: ${err instanceof Error ? err.message : String(err)}`
      }
    },
  })

  return { odoo_module_scanner: moduleScanner }
}
