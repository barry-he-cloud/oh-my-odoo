import { existsSync } from "fs"
import { execSync } from "child_process"
import { join } from "path"

interface CheckResult {
  name: string
  status: "pass" | "warn" | "fail"
  message: string
}

function checkBinary(name: string, command: string): CheckResult {
  try {
    const output = execSync(command, { timeout: 10_000 }).toString().trim()
    return { name, status: "pass", message: output }
  } catch {
    return { name, status: "fail", message: `${name} not found or not executable` }
  }
}

export function runDoctorChecks(projectRoot: string): CheckResult[] {
  const results: CheckResult[] = []

  // Python
  results.push(checkBinary("Python", "python3 --version"))

  // pip/pipenv/poetry
  results.push(checkBinary("pip", "pip3 --version"))

  // PostgreSQL client
  results.push(checkBinary("PostgreSQL (psql)", "psql --version"))

  // PostgreSQL server
  try {
    execSync("pg_isready", { timeout: 5000 })
    results.push({ name: "PostgreSQL Server", status: "pass", message: "PostgreSQL is running" })
  } catch {
    results.push({ name: "PostgreSQL Server", status: "warn", message: "PostgreSQL may not be running (pg_isready failed)" })
  }

  // odoo-bin
  const odooBinPath = join(projectRoot, "odoo-bin")
  if (existsSync(odooBinPath)) {
    results.push({ name: "odoo-bin", status: "pass", message: `Found at ${odooBinPath}` })
  } else {
    try {
      execSync("which odoo", { timeout: 5000 })
      results.push({ name: "odoo", status: "pass", message: "Found odoo in PATH" })
    } catch {
      results.push({ name: "odoo-bin", status: "warn", message: "odoo-bin not found in project root or PATH" })
    }
  }

  // odoo.conf
  const confCandidates = [
    join(projectRoot, "odoo.conf"),
    join(projectRoot, "config", "odoo.conf"),
    "/etc/odoo/odoo.conf",
  ]
  const foundConf = confCandidates.find(p => existsSync(p))
  if (foundConf) {
    results.push({ name: "odoo.conf", status: "pass", message: `Found at ${foundConf}` })
  } else {
    results.push({ name: "odoo.conf", status: "warn", message: "No odoo.conf found" })
  }

  // Custom addons
  const addonsDirs = ["addons", "custom_addons", "extra-addons"]
  let moduleCount = 0
  for (const dir of addonsDirs) {
    const addonsPath = join(projectRoot, dir)
    if (existsSync(addonsPath)) {
      try {
        const { readdirSync } = require("fs")
        const entries = readdirSync(addonsPath, { withFileTypes: true })
        const modules = entries.filter((e: any) =>
          e.isDirectory() && existsSync(join(addonsPath, e.name, "__manifest__.py"))
        )
        moduleCount += modules.length
      } catch { /* skip */ }
    }
  }

  if (moduleCount > 0) {
    results.push({ name: "Custom Modules", status: "pass", message: `Found ${moduleCount} module(s)` })
  } else {
    results.push({ name: "Custom Modules", status: "warn", message: "No custom modules found in standard addons directories" })
  }

  // Node.js (for JS asset building)
  results.push(checkBinary("Node.js", "node --version"))

  // wkhtmltopdf (for PDF reports)
  results.push(checkBinary("wkhtmltopdf", "wkhtmltopdf --version"))

  return results
}

export function formatDoctorResults(results: CheckResult[]): string {
  const lines: string[] = ["=== oh-my-odoo doctor ===", ""]

  const passed = results.filter(r => r.status === "pass")
  const warned = results.filter(r => r.status === "warn")
  const failed = results.filter(r => r.status === "fail")

  for (const r of results) {
    const icon = r.status === "pass" ? "[OK]" : r.status === "warn" ? "[WARN]" : "[FAIL]"
    lines.push(`  ${icon} ${r.name}: ${r.message}`)
  }

  lines.push("")
  lines.push(`Results: ${passed.length} passed, ${warned.length} warnings, ${failed.length} failures`)

  if (failed.length > 0) {
    lines.push("\nAction required:")
    for (const f of failed) {
      lines.push(`  - Install/fix: ${f.name}`)
    }
  }

  return lines.join("\n")
}
