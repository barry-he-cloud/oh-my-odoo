import type { PluginInput } from "@opencode-ai/plugin"
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { readFile, readdir, stat } from "fs/promises"
import { join, resolve, relative } from "path"

interface SecurityIssue {
  module: string
  file: string
  severity: "critical" | "high" | "medium" | "low"
  message: string
  suggestion: string
}

async function exists(p: string): Promise<boolean> {
  try { await stat(p); return true } catch { return false }
}

async function findModules(projectRoot: string): Promise<Array<{ name: string; path: string }>> {
  const result: Array<{ name: string; path: string }> = []
  const addonsDirs = ["addons", "custom_addons", "extra-addons"]

  for (const dir of addonsDirs) {
    const base = join(projectRoot, dir)
    if (!(await exists(base))) continue
    const entries = await readdir(base, { withFileTypes: true }).catch(() => [])
    for (const e of entries) {
      if (e.isDirectory() && await exists(join(base, e.name, "__manifest__.py"))) {
        result.push({ name: e.name, path: join(base, e.name) })
      }
    }
  }
  return result
}

async function checkAccessCsv(modulePath: string, moduleName: string, projectRoot: string): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = []
  const accessPath = join(modulePath, "security", "ir.model.access.csv")

  if (!(await exists(accessPath))) {
    const modelsDir = join(modulePath, "models")
    if (await exists(modelsDir)) {
      issues.push({
        module: moduleName,
        file: relative(projectRoot, join(modulePath, "security")),
        severity: "critical",
        message: "Module has models/ but no ir.model.access.csv — users won't be able to access any records",
        suggestion: "Create security/ir.model.access.csv with at least base user access rules",
      })
    }
    return issues
  }

  try {
    const content = await readFile(accessPath, "utf-8")
    const lines = content.split("\n").filter(l => l.trim() && !l.startsWith("id,"))

    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split(",")
      if (cols.length < 7) continue

      const [_id, _name, modelId, groupId, permRead, permWrite, permCreate, permUnlink] = cols.map(c => c.trim())

      // No group = public access
      if (!groupId || groupId === "") {
        issues.push({
          module: moduleName,
          file: relative(projectRoot, accessPath) + `:${i + 2}`,
          severity: "high",
          message: `Access rule for ${modelId} has no group — gives public access`,
          suggestion: "Specify a group (e.g. base.group_user) or create a custom group",
        })
      }

      // Full CRUD for non-admin
      if (permRead === "1" && permWrite === "1" && permCreate === "1" && permUnlink === "1") {
        if (groupId && !groupId.includes("group_system") && !groupId.includes("group_erp_manager")) {
          issues.push({
            module: moduleName,
            file: relative(projectRoot, accessPath) + `:${i + 2}`,
            severity: "medium",
            message: `Full CRUD permissions for ${modelId} granted to ${groupId}`,
            suggestion: "Consider if unlink (delete) permission is really needed for this group",
          })
        }
      }
    }
  } catch { /* skip parse errors */ }

  return issues
}

async function checkRecordRules(modulePath: string, moduleName: string, projectRoot: string): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = []
  const securityDir = join(modulePath, "security")

  if (!(await exists(securityDir))) return issues

  const files = await readdir(securityDir).catch(() => [])
  const xmlFiles = files.filter(f => f.endsWith(".xml"))

  if (xmlFiles.length === 0) {
    issues.push({
      module: moduleName,
      file: relative(projectRoot, securityDir),
      severity: "low",
      message: "No ir.rule XML files — consider adding record rules for multi-company or multi-user isolation",
      suggestion: "Create security rules using ir.rule to restrict record access per company/user",
    })
  }

  for (const xmlFile of xmlFiles) {
    try {
      const content = await readFile(join(securityDir, xmlFile), "utf-8")

      // Check for sudo() usage hints in record rules
      if (content.includes("[(1, '=', 1)]")) {
        issues.push({
          module: moduleName,
          file: relative(projectRoot, join(securityDir, xmlFile)),
          severity: "high",
          message: "Record rule with domain [(1,'=',1)] — this allows ALL records (effectively no restriction)",
          suggestion: "Use a meaningful domain that actually restricts access",
        })
      }
    } catch { /* skip */ }
  }

  return issues
}

async function checkPythonSecurity(modulePath: string, moduleName: string, projectRoot: string): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = []

  const entries = await readdir(modulePath, { withFileTypes: true, recursive: true }).catch(() => [])

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".py")) continue

    const parentDir = "parentPath" in entry ? (entry as unknown as { parentPath: string }).parentPath : modulePath
    const fullPath = join(parentDir, entry.name)
    try {
      const content = await readFile(fullPath, "utf-8")
      const relPath = relative(projectRoot, fullPath)
      const lines = content.split("\n")

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // SQL injection
        if (line.match(/cr\.execute\s*\(\s*[f"'].*%s.*%s/i) || line.match(/cr\.execute\s*\(\s*f["']/)) {
          issues.push({
            module: moduleName, file: `${relPath}:${i + 1}`, severity: "critical",
            message: "Potential SQL injection — using f-string or % formatting in cr.execute()",
            suggestion: "Use parameterized queries: cr.execute('SELECT ... WHERE id = %s', (id,))",
          })
        }

        // Dangerous sudo usage
        if (line.match(/\.sudo\(\)\.write\(/) || line.match(/\.sudo\(\)\.create\(/)) {
          if (!line.includes("# nosec")) {
            issues.push({
              module: moduleName, file: `${relPath}:${i + 1}`, severity: "medium",
              message: "sudo() used for write/create — bypasses access control",
              suggestion: "Verify sudo() is necessary. Add '# nosec' comment if intentional.",
            })
          }
        }

        // eval usage
        if (line.match(/\beval\s*\(/)) {
          issues.push({
            module: moduleName, file: `${relPath}:${i + 1}`, severity: "critical",
            message: "eval() usage detected — potential code injection vulnerability",
            suggestion: "Use safe_eval from odoo.tools.safe_eval instead, or ast.literal_eval for simple cases",
          })
        }

        // os.system / subprocess with shell=True
        if (line.match(/os\.system\s*\(/) || line.match(/subprocess.*shell\s*=\s*True/)) {
          issues.push({
            module: moduleName, file: `${relPath}:${i + 1}`, severity: "high",
            message: "Shell command execution — potential command injection",
            suggestion: "Use subprocess.run() with shell=False and a list of arguments",
          })
        }
      }
    } catch { /* skip */ }
  }

  return issues
}

export function createOdooSecurityChecker(ctx: PluginInput): Record<string, ToolDefinition> {
  const securityChecker: ToolDefinition = tool({
    description:
      "Comprehensive security audit for Odoo custom modules. Checks: " +
      "1) ir.model.access.csv completeness and permission levels, " +
      "2) ir.rule record rules for multi-company/user isolation, " +
      "3) Python code for SQL injection, eval(), sudo() misuse, shell commands. " +
      "Reports issues by severity (critical/high/medium/low) with fix suggestions.",
    args: {
      project_root: tool.schema.string().optional(),
      module_filter: tool.schema.string().optional()
        .describe("Only audit modules matching this pattern"),
    },
    execute: async (params) => {
      const projectRoot = resolve(params.project_root ?? ctx.directory)
      let modules = await findModules(projectRoot)

      if (params.module_filter) {
        modules = modules.filter(m => m.name.includes(params.module_filter!))
      }

      if (modules.length === 0) {
        return "No Odoo modules found to audit."
      }

      const allIssues: SecurityIssue[] = []

      for (const mod of modules) {
        const accessIssues = await checkAccessCsv(mod.path, mod.name, projectRoot)
        const ruleIssues = await checkRecordRules(mod.path, mod.name, projectRoot)
        const codeIssues = await checkPythonSecurity(mod.path, mod.name, projectRoot)
        allIssues.push(...accessIssues, ...ruleIssues, ...codeIssues)
      }

      if (allIssues.length === 0) {
        return `Security audit passed for ${modules.length} module(s). No issues found.`
      }

      const lines: string[] = [
        `=== Odoo Security Audit ===`,
        `Modules scanned: ${modules.length}`,
        `Issues found: ${allIssues.length}`,
        `  Critical: ${allIssues.filter(i => i.severity === "critical").length}`,
        `  High: ${allIssues.filter(i => i.severity === "high").length}`,
        `  Medium: ${allIssues.filter(i => i.severity === "medium").length}`,
        `  Low: ${allIssues.filter(i => i.severity === "low").length}`,
        "",
      ]

      const byModule = new Map<string, SecurityIssue[]>()
      for (const issue of allIssues) {
        const arr = byModule.get(issue.module) ?? []
        arr.push(issue)
        byModule.set(issue.module, arr)
      }

      for (const [modName, issues] of byModule) {
        lines.push(`--- ${modName} (${issues.length} issues) ---`)
        const sorted = issues.sort((a, b) => {
          const order = { critical: 0, high: 1, medium: 2, low: 3 }
          return order[a.severity] - order[b.severity]
        })
        for (const issue of sorted) {
          lines.push(`  [${issue.severity.toUpperCase()}] ${issue.file}`)
          lines.push(`    ${issue.message}`)
          lines.push(`    Fix: ${issue.suggestion}`)
        }
        lines.push("")
      }

      return lines.join("\n")
    },
  })

  return { odoo_security_checker: securityChecker }
}
