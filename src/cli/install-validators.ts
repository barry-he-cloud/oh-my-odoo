import color from "picocolors"
import type { InstallArgs, InstallConfig, DetectedConfig } from "./types"

export const SYMBOLS = {
  check: color.green("✓"),
  cross: color.red("✗"),
  warn: color.yellow("⚠"),
  arrow: "→",
  bullet: "•",
  star: "★",
}

export function printHeader(isUpdate: boolean): void {
  console.log()
  console.log(color.bold(color.cyan(isUpdate ? "  oh-my-odoo — Update Configuration" : "  oh-my-odoo — Installation")))
  console.log(color.dim("  The Best AI Agent Harness for Odoo"))
  console.log()
}

export function printStep(step: number, total: number, message: string): void {
  console.log(`  ${color.dim(`[${step}/${total}]`)} ${message}`)
}

export function printSuccess(message: string): void {
  console.log(`  ${SYMBOLS.check} ${message}`)
}

export function printError(message: string): void {
  console.log(`  ${SYMBOLS.cross} ${color.red(message)}`)
}

export function printWarning(message: string): void {
  console.log(`  ${SYMBOLS.warn} ${color.yellow(message)}`)
}

export function printInfo(message: string): void {
  console.log(`  ${color.dim(message)}`)
}

export function printBox(content: string, title?: string): void {
  console.log()
  if (title) {
    console.log(`  ${color.bold(color.cyan(title))}`)
  }
  console.log(`  ┌${"─".repeat(56)}┐`)
  for (const line of content.split("\n")) {
    console.log(`  │ ${line.padEnd(55)}│`)
  }
  console.log(`  └${"─".repeat(56)}┘`)
  console.log()
}

export function validateNonTuiArgs(args: InstallArgs): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (args.odooVersion) {
    const valid = ["14.0", "15.0", "16.0", "17.0", "18.0", "19.0"]
    if (!valid.includes(args.odooVersion)) {
      errors.push(`Invalid Odoo version: ${args.odooVersion}. Valid: ${valid.join(", ")}`)
    }
  }

  if (args.edition && !["community", "enterprise"].includes(args.edition)) {
    errors.push(`Invalid edition: ${args.edition}. Valid: community, enterprise`)
  }

  return { valid: errors.length === 0, errors }
}

export function argsToConfig(args: InstallArgs): InstallConfig {
  return {
    odooVersion: args.odooVersion ?? "17.0",
    edition: (args.edition as "community" | "enterprise") ?? "community",
    pythonVersion: args.pythonVersion ?? "3.12",
    database: args.database ?? "",
    autoDetect: true,
    securityAudit: true,
    upgradeChecks: true,
  }
}

export function detectedToInitialValues(detected: DetectedConfig) {
  return {
    odooVersion: detected.odooVersion ?? "17.0",
    edition: detected.edition ?? "community",
    database: detected.database ?? "",
  }
}

export function formatConfigSummary(config: InstallConfig): string {
  const lines: string[] = []
  lines.push(`Odoo Version:    ${color.cyan(config.odooVersion)}`)
  lines.push(`Edition:         ${color.cyan(config.edition)}`)
  lines.push(`Python:          ${color.cyan(config.pythonVersion)}`)
  if (config.database) {
    lines.push(`Database:        ${color.cyan(config.database)}`)
  }
  lines.push(`Auto-detect:     ${config.autoDetect ? color.green("enabled") : color.dim("disabled")}`)
  lines.push(`Security Audit:  ${config.securityAudit ? color.green("enabled") : color.dim("disabled")}`)
  lines.push(`Upgrade Checks:  ${config.upgradeChecks ? color.green("enabled") : color.dim("disabled")}`)
  return lines.join("\n")
}
