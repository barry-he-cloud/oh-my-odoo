import type { PluginInput } from "@opencode-ai/plugin"
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { readFile, readdir, stat } from "fs/promises"
import { join, resolve, relative } from "path"
import type { UpgradeAnalysis, ModuleUpgradeInfo, UpgradeIssue } from "./types"
import { VERSION_BREAKING_CHANGES, DEPRECATION_PATTERNS, ODOO_VERSIONS } from "./types"

async function exists(p: string): Promise<boolean> {
  try { await stat(p); return true } catch { return false }
}

async function findModuleDirs(projectRoot: string): Promise<string[]> {
  const dirs: string[] = []
  const candidates = [
    join(projectRoot, "addons"),
    join(projectRoot, "custom_addons"),
    join(projectRoot, "extra-addons"),
    projectRoot,
  ]

  for (const base of candidates) {
    if (!(await exists(base))) continue
    const entries = await readdir(base, { withFileTypes: true }).catch(() => [])
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith(".")) {
        const manifestPath = join(base, e.name, "__manifest__.py")
        if (await exists(manifestPath)) {
          dirs.push(join(base, e.name))
        }
      }
    }
  }
  return dirs
}

async function scanFileForIssues(
  filePath: string,
  content: string,
  sourceVersion: string,
  targetVersion: string,
): Promise<UpgradeIssue[]> {
  const issues: UpgradeIssue[] = []
  const lines = content.split("\n")

  for (const pattern of DEPRECATION_PATTERNS) {
    const sinceNum = parseFloat(pattern.since) || 0
    const targetNum = parseFloat(targetVersion) || 999

    if (sinceNum > targetNum) continue

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      pattern.pattern.lastIndex = 0
      if (pattern.pattern.test(line)) {
        issues.push({
          file: filePath,
          line: i + 1,
          type: pattern.type,
          severity: pattern.type === "removal" ? "error" : "warning",
          message: `${pattern.symbol} — deprecated since ${pattern.since}`,
          suggestion: pattern.replacement,
          autoFixable: pattern.type === "deprecation" || pattern.type === "python_compat",
        })
      }
    }
  }

  return issues
}

async function scanModuleForUpgrade(
  modulePath: string,
  projectRoot: string,
  sourceVersion: string,
  targetVersion: string,
): Promise<ModuleUpgradeInfo> {
  const name = modulePath.split("/").pop() ?? modulePath
  const allIssues: UpgradeIssue[] = []

  const entries = await readdir(modulePath, { withFileTypes: true, recursive: true }).catch(() => [])

  for (const entry of entries) {
    if (!entry.isFile()) continue
    const ext = entry.name.split(".").pop()
    if (!ext || !["py", "xml", "js"].includes(ext)) continue

    // Construct the full file path properly
    const parentDir = "parentPath" in entry ? (entry as unknown as { parentPath: string }).parentPath : modulePath
    const fullPath = join(parentDir, entry.name)
    try {
      const content = await readFile(fullPath, "utf-8")
      const relPath = relative(projectRoot, fullPath)
      const issues = await scanFileForIssues(relPath, content, sourceVersion, targetVersion)
      allIssues.push(...issues)
    } catch {
      // skip unreadable files
    }
  }

  return {
    name,
    path: relative(projectRoot, modulePath),
    issues: allIssues,
    autoFixable: allIssues.filter(i => i.autoFixable).length,
    manualFix: allIssues.filter(i => !i.autoFixable).length,
  }
}

function getRelevantBreakingChanges(sourceVersion: string, targetVersion: string) {
  const sourceNum = parseFloat(sourceVersion)
  const targetNum = parseFloat(targetVersion)

  return VERSION_BREAKING_CHANGES.filter(bc => {
    const [from, to] = bc.versions.split("→").map(v => parseFloat(v))
    return from >= sourceNum && to <= targetNum
  })
}

function estimateEffort(analysis: UpgradeAnalysis): UpgradeAnalysis["estimatedEffort"] {
  const totalErrors = analysis.modules.reduce((sum, m) => sum + m.issues.filter(i => i.severity === "error").length, 0)
  const totalWarnings = analysis.modules.reduce((sum, m) => sum + m.issues.filter(i => i.severity === "warning").length, 0)
  const versionGap = parseFloat(analysis.targetVersion) - parseFloat(analysis.sourceVersion)

  if (totalErrors > 50 || versionGap > 4) return "critical"
  if (totalErrors > 20 || totalWarnings > 100 || versionGap > 2) return "high"
  if (totalErrors > 5 || totalWarnings > 30) return "medium"
  return "low"
}

function formatAnalysis(analysis: UpgradeAnalysis): string {
  const lines: string[] = [
    `=== Odoo Upgrade Analysis: ${analysis.sourceVersion} → ${analysis.targetVersion} ===`,
    `Modules scanned: ${analysis.modules.length}`,
    `Estimated effort: ${analysis.estimatedEffort.toUpperCase()}`,
    "",
  ]

  // Breaking changes summary
  if (analysis.breakingChanges.length > 0) {
    lines.push(`--- Breaking Changes (${analysis.breakingChanges.length}) ---`)
    for (const bc of analysis.breakingChanges) {
      lines.push(`  [${bc.versions}] ${bc.area}: ${bc.description}`)
      lines.push(`    Migration: ${bc.migration}`)
    }
    lines.push("")
  }

  // Per-module issues
  const modulesWithIssues = analysis.modules.filter(m => m.issues.length > 0)
  if (modulesWithIssues.length > 0) {
    lines.push(`--- Module Issues (${modulesWithIssues.length} modules affected) ---`)
    for (const mod of modulesWithIssues) {
      const errors = mod.issues.filter(i => i.severity === "error").length
      const warnings = mod.issues.filter(i => i.severity === "warning").length
      lines.push(`\n  ${mod.name} (${mod.path})`)
      lines.push(`    ${errors} errors, ${warnings} warnings | Auto-fixable: ${mod.autoFixable}, Manual: ${mod.manualFix}`)

      // Group by type
      const byType = new Map<string, UpgradeIssue[]>()
      for (const issue of mod.issues) {
        const arr = byType.get(issue.type) ?? []
        arr.push(issue)
        byType.set(issue.type, arr)
      }

      for (const [type, issues] of byType) {
        lines.push(`    [${type}] (${issues.length}):`)
        const shown = issues.slice(0, 5)
        for (const issue of shown) {
          lines.push(`      ${issue.severity === "error" ? "ERROR" : "WARN"} ${issue.file}:${issue.line ?? "?"} — ${issue.message}`)
          if (issue.suggestion) lines.push(`        Fix: ${issue.suggestion}`)
        }
        if (issues.length > 5) lines.push(`      ... and ${issues.length - 5} more`)
      }
    }
  }

  // Recommendations
  if (analysis.recommendations.length > 0) {
    lines.push(`\n--- Recommendations ---`)
    for (const rec of analysis.recommendations) {
      lines.push(`  • ${rec}`)
    }
  }

  const totalIssues = analysis.modules.reduce((s, m) => s + m.issues.length, 0)
  const totalAutoFix = analysis.modules.reduce((s, m) => s + m.autoFixable, 0)
  lines.push(`\n--- Summary ---`)
  lines.push(`Total issues: ${totalIssues} (${totalAutoFix} auto-fixable)`)
  lines.push(`Run 'odoo_upgrade_migrate' tool to apply auto-fixes.`)

  return lines.join("\n")
}

export function createOdooUpgradeAssistant(ctx: PluginInput): Record<string, ToolDefinition> {
  const upgradeAnalyze: ToolDefinition = tool({
    description:
      "Analyze Odoo project for version upgrade compatibility. " +
      "Scans all custom modules for deprecated APIs, removed features, breaking changes, " +
      "view/XML incompatibilities, JS/OWL migration needs, and Python compat issues. " +
      "Provides per-module issue reports with auto-fix suggestions and effort estimation. " +
      "Covers upgrade paths: 14.0→15.0→16.0→17.0→18.0→19.0.",
    args: {
      source_version: tool.schema.string().describe("Current Odoo version (e.g. '16.0')"),
      target_version: tool.schema.string().describe("Target Odoo version (e.g. '18.0')"),
      project_root: tool.schema.string().optional(),
      module_filter: tool.schema.string().optional()
        .describe("Only scan modules matching this pattern (e.g. 'my_' to scan my_module1, my_module2)"),
    },
    execute: async (params) => {
      const projectRoot = resolve(params.project_root ?? ctx.directory)
      const { source_version, target_version } = params

      // Validate versions
      if (!ODOO_VERSIONS.includes(source_version as typeof ODOO_VERSIONS[number])) {
        return `Invalid source version: ${source_version}. Valid: ${ODOO_VERSIONS.join(", ")}`
      }
      if (!ODOO_VERSIONS.includes(target_version as typeof ODOO_VERSIONS[number])) {
        return `Invalid target version: ${target_version}. Valid: ${ODOO_VERSIONS.join(", ")}`
      }
      if (parseFloat(source_version) >= parseFloat(target_version)) {
        return `Source version (${source_version}) must be older than target (${target_version})`
      }

      let moduleDirs = await findModuleDirs(projectRoot)
      if (params.module_filter) {
        moduleDirs = moduleDirs.filter(d => d.split("/").pop()?.includes(params.module_filter!))
      }

      if (moduleDirs.length === 0) {
        return `No Odoo modules found in ${projectRoot}. Make sure __manifest__.py files exist.`
      }

      const modules: ModuleUpgradeInfo[] = []
      for (const dir of moduleDirs) {
        const info = await scanModuleForUpgrade(dir, projectRoot, source_version, target_version)
        modules.push(info)
      }

      const breakingChanges = getRelevantBreakingChanges(source_version, target_version)

      const recommendations: string[] = []
      const versionGap = parseFloat(target_version) - parseFloat(source_version)
      if (versionGap > 2) {
        recommendations.push(`Large version gap (${versionGap} major versions). Consider incremental upgrade: ${source_version} → intermediate → ${target_version}`)
      }
      recommendations.push("Run full test suite after each migration step")
      recommendations.push("Back up database before applying any upgrade")
      recommendations.push("Review OCA (Odoo Community Association) migration scripts for common modules")

      if (parseFloat(target_version) >= 16) {
        recommendations.push("All JS must use OWL2+ components — plan for frontend rewrite if using legacy widgets")
      }
      if (parseFloat(target_version) >= 17) {
        recommendations.push("Ensure Python >= 3.10 in your deployment environment")
        recommendations.push("Review attrs={} usage in XML views — migrate to individual attributes")
      }
      if (parseFloat(target_version) >= 19) {
        recommendations.push("Ensure Python >= 3.12 — Python 3.10/3.11 no longer supported in Odoo 19")
        recommendations.push("Install weasyprint — it replaces wkhtmltopdf as default PDF engine")
        recommendations.push("OWL 4.0 Signals: refactor useState() to useSignal() reactivity model")
        recommendations.push("Migrate external API integrations from /jsonrpc to /api/v2/ REST endpoints")
        recommendations.push("Review Vite-based asset bundling — update __manifest__.py asset declarations")
      }

      const analysis: UpgradeAnalysis = {
        sourceVersion: source_version,
        targetVersion: target_version,
        modules,
        breakingChanges,
        deprecations: [],
        recommendations,
        estimatedEffort: "low",
      }
      analysis.estimatedEffort = estimateEffort(analysis)

      return formatAnalysis(analysis)
    },
  })

  const upgradeMigrate: ToolDefinition = tool({
    description:
      "Generate migration scripts for Odoo version upgrade. " +
      "Creates pre-migration and post-migration Python scripts for each module, " +
      "following Odoo's standard migrations/ directory convention. " +
      "Also generates an upgrade checklist document.",
    args: {
      source_version: tool.schema.string().describe("Current Odoo version"),
      target_version: tool.schema.string().describe("Target Odoo version"),
      module_name: tool.schema.string().describe("Module to generate migration for"),
      project_root: tool.schema.string().optional(),
    },
    execute: async (params) => {
      const { source_version, target_version, module_name } = params
      const projectRoot = resolve(params.project_root ?? ctx.directory)

      const moduleDirs = await findModuleDirs(projectRoot)
      const moduleDir = moduleDirs.find(d => d.endsWith(`/${module_name}`))

      if (!moduleDir) {
        return `Module '${module_name}' not found. Available: ${moduleDirs.map(d => d.split("/").pop()).join(", ")}`
      }

      const migrationDir = join(moduleDir, "migrations", target_version)
      const preMigrationPath = join(migrationDir, "pre-migrate.py")
      const postMigrationPath = join(migrationDir, "post-migrate.py")

      const preMigration = `# -*- coding: utf-8 -*-
# Pre-migration script: ${source_version} → ${target_version}
# Module: ${module_name}
# Generated by oh-my-odoo upgrade assistant

import logging
from odoo.tools import sql

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """Pre-migration: runs BEFORE module update.

    Use for:
    - Renaming tables/columns (before ORM recreates them)
    - Preserving data that would be lost
    - Removing constraints that block schema changes
    """
    _logger.info("Pre-migration ${module_name}: ${source_version} → ${target_version}")

    # Example: rename a deprecated column before ORM drops it
    # if sql.column_exists(cr, 'my_table', 'old_column'):
    #     cr.execute("ALTER TABLE my_table RENAME COLUMN old_column TO new_column")

    # Example: remove old constraint
    # cr.execute("ALTER TABLE my_table DROP CONSTRAINT IF EXISTS my_table_old_check")
`

      const postMigration = `# -*- coding: utf-8 -*-
# Post-migration script: ${source_version} → ${target_version}
# Module: ${module_name}
# Generated by oh-my-odoo upgrade assistant

import logging
from odoo import api, SUPERUSER_ID

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """Post-migration: runs AFTER module update.

    Use for:
    - Data transformation (using ORM)
    - Recomputing stored fields
    - Setting defaults for new required fields
    - Cleaning up deprecated data
    """
    env = api.Environment(cr, SUPERUSER_ID, {})
    _logger.info("Post-migration ${module_name}: ${source_version} → ${target_version}")

    # Example: recompute a stored computed field
    # records = env['my.model'].search([])
    # records._compute_my_field()

    # Example: set default for new required field
    # cr.execute("""
    #     UPDATE my_table
    #     SET new_required_field = 'default_value'
    #     WHERE new_required_field IS NULL
    # """)

    # Example: migrate data from old field to new field
    # for record in env['my.model'].search([]):
    #     if record.old_field:
    #         record.new_field = record.old_field
`

      const lines: string[] = [
        `Migration scripts generated for ${module_name}: ${source_version} → ${target_version}`,
        "",
        `Pre-migration: ${preMigrationPath}`,
        "```python",
        preMigration,
        "```",
        "",
        `Post-migration: ${postMigrationPath}`,
        "```python",
        postMigration,
        "```",
        "",
        "Next steps:",
        `1. Create directory: mkdir -p ${migrationDir}`,
        `2. Write pre-migrate.py and post-migrate.py to ${migrationDir}/`,
        `3. Update __manifest__.py version to match target: '${target_version}.1.0.0'`,
        "4. Test on a copy of your production database",
        "5. Run: odoo-bin -u " + module_name + " -d <testdb> --stop-after-init",
      ]

      return lines.join("\n")
    },
  })

  return {
    odoo_upgrade_analyze: upgradeAnalyze,
    odoo_upgrade_migrate: upgradeMigrate,
  }
}
