import type { PluginInput } from "@opencode-ai/plugin"
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { readFile, readdir, stat } from "fs/promises"
import { join, resolve, relative } from "path"

interface XmlIssue {
  file: string
  line?: number
  severity: "error" | "warning"
  message: string
  suggestion?: string
}

async function exists(p: string): Promise<boolean> {
  try { await stat(p); return true } catch { return false }
}

async function validateOdooXml(filePath: string, content: string): Promise<XmlIssue[]> {
  const issues: XmlIssue[] = []
  const lines = content.split("\n")

  // Basic well-formedness
  const openTags: string[] = []
  let inComment = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Track comments
    if (line.includes("<!--")) inComment = true
    if (line.includes("-->")) { inComment = false; continue }
    if (inComment) continue

    // Check for common Odoo XML patterns

    // Deprecated attrs usage (Odoo 17+)
    if (line.match(/attrs\s*=\s*["']\{/)) {
      issues.push({
        file: filePath, line: i + 1, severity: "warning",
        message: "Deprecated attrs={} syntax found",
        suggestion: "Use individual invisible/readonly/required attributes with domain expressions (Odoo 17+)",
      })
    }

    // Deprecated states= attribute
    if (line.match(/states\s*=\s*["']/)) {
      issues.push({
        file: filePath, line: i + 1, severity: "warning",
        message: "Deprecated states= attribute",
        suggestion: "Use invisible attribute with state-based domain: invisible=\"state not in ('draft', 'confirm')\"",
      })
    }

    // Missing noupdate on data records
    if (line.match(/<record\s/) && !content.includes("noupdate=")) {
      // Only warn once per file
      if (i === lines.findIndex(l => l.match(/<record\s/))) {
        if (filePath.includes("/data/") || filePath.includes("/security/")) {
          issues.push({
            file: filePath, line: i + 1, severity: "warning",
            message: "Data file missing noupdate attribute on <odoo> or <data> tag",
            suggestion: "Add noupdate=\"1\" to <odoo> tag for data that shouldn't be overwritten on update",
          })
        }
      }
    }

    // Check for model reference without module prefix in ref()
    const refMatch = line.match(/ref\s*\(\s*["']([^"']+)["']\s*\)/)
    if (refMatch && !refMatch[1].includes(".")) {
      issues.push({
        file: filePath, line: i + 1, severity: "warning",
        message: `ref('${refMatch[1]}') without module prefix — may break in multi-module setups`,
        suggestion: `Use ref('module_name.${refMatch[1]}') for explicit reference`,
      })
    }

    // Check for position="replace" on core views (risky)
    if (line.match(/position\s*=\s*["']replace["']/)) {
      issues.push({
        file: filePath, line: i + 1, severity: "warning",
        message: "xpath position=\"replace\" — completely replaces matched element",
        suggestion: "Consider position=\"attributes\" or position=\"inside\" for safer inheritance",
      })
    }

    // Check for duplicate record IDs in same file
    const recordIdMatch = line.match(/<record\s+[^>]*id\s*=\s*["']([^"']+)["']/)
    if (recordIdMatch) {
      const recordId = recordIdMatch[1]
      const firstOccurrence = lines.findIndex(l => l.includes(`id="${recordId}"`) || l.includes(`id='${recordId}'`))
      if (firstOccurrence !== i && firstOccurrence >= 0) {
        issues.push({
          file: filePath, line: i + 1, severity: "error",
          message: `Duplicate record ID '${recordId}' — first defined at line ${firstOccurrence + 1}`,
          suggestion: "Use unique IDs for each record definition",
        })
      }
    }

    // Check for menuitem without parent or action
    if (line.match(/<menuitem\s/) && !line.includes("parent=") && !line.includes("action=") && !line.includes("parent_id=")) {
      issues.push({
        file: filePath, line: i + 1, severity: "warning",
        message: "Menuitem without parent or action — may create orphaned menu entry",
        suggestion: "Specify parent and/or action attributes",
      })
    }

    // Check for field without name attribute
    if (line.match(/<field\s/) && !line.includes("name=")) {
      issues.push({
        file: filePath, line: i + 1, severity: "error",
        message: "<field> element without name attribute",
        suggestion: "All <field> elements must have a name attribute",
      })
    }
  }

  return issues
}

export function createOdooXmlValidator(ctx: PluginInput): Record<string, ToolDefinition> {
  const xmlValidator: ToolDefinition = tool({
    description:
      "Validate Odoo XML files (views, data, security) for common issues. Checks: " +
      "deprecated attributes (attrs, states), missing noupdate, unqualified ref(), " +
      "risky xpath replace, duplicate record IDs, malformed field tags, and more.",
    args: {
      file_path: tool.schema.string().optional()
        .describe("Specific XML file to validate. If omitted, scans all XML in custom modules."),
      project_root: tool.schema.string().optional(),
    },
    execute: async (params) => {
      const projectRoot = resolve(params.project_root ?? ctx.directory)
      const allIssues: XmlIssue[] = []

      if (params.file_path) {
        const absPath = resolve(projectRoot, params.file_path)
        if (!(await exists(absPath))) {
          return `File not found: ${params.file_path}`
        }
        const content = await readFile(absPath, "utf-8")
        const issues = await validateOdooXml(params.file_path, content)
        allIssues.push(...issues)
      } else {
        // Scan all modules
        const addonsDirs = ["addons", "custom_addons", "extra-addons"]
        for (const dir of addonsDirs) {
          const base = join(projectRoot, dir)
          if (!(await exists(base))) continue

          const modules = await readdir(base, { withFileTypes: true }).catch(() => [])
          for (const mod of modules) {
            if (!mod.isDirectory()) continue
            const modPath = join(base, mod.name)

            const entries = await readdir(modPath, { withFileTypes: true, recursive: true }).catch(() => [])
            for (const entry of entries) {
              if (!entry.isFile() || !entry.name.endsWith(".xml")) continue
              const parentDir = "parentPath" in entry ? (entry as unknown as { parentPath: string }).parentPath : modPath
              const fullPath = join(parentDir, entry.name)
              try {
                const content = await readFile(fullPath, "utf-8")
                const relPath = relative(projectRoot, fullPath)
                const issues = await validateOdooXml(relPath, content)
                allIssues.push(...issues)
              } catch { /* skip */ }
            }
          }
        }
      }

      if (allIssues.length === 0) {
        return "XML validation passed. No issues found."
      }

      const lines: string[] = [
        `=== Odoo XML Validation ===`,
        `Issues: ${allIssues.length} (${allIssues.filter(i => i.severity === "error").length} errors, ${allIssues.filter(i => i.severity === "warning").length} warnings)`,
        "",
      ]

      const errors = allIssues.filter(i => i.severity === "error")
      const warnings = allIssues.filter(i => i.severity === "warning")

      if (errors.length > 0) {
        lines.push("ERRORS:")
        for (const issue of errors) {
          lines.push(`  ${issue.file}:${issue.line ?? "?"} — ${issue.message}`)
          if (issue.suggestion) lines.push(`    Fix: ${issue.suggestion}`)
        }
      }

      if (warnings.length > 0) {
        lines.push("\nWARNINGS:")
        for (const issue of warnings) {
          lines.push(`  ${issue.file}:${issue.line ?? "?"} — ${issue.message}`)
          if (issue.suggestion) lines.push(`    Fix: ${issue.suggestion}`)
        }
      }

      return lines.join("\n")
    },
  })

  return { odoo_xml_validator: xmlValidator }
}
