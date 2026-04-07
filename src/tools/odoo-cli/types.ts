export interface OdooCliResult {
  command: string
  stdout: string
  stderr: string
  exitCode: number
  duration: number
}

export const ALLOWED_ODOO_COMMANDS = [
  "scaffold",
  "shell",
  "db",
  "--update",
  "--init",
  "--test-enable",
  "--stop-after-init",
  "--dev",
  "cloc",
  "populate",
  "tsconfig",
  "neutralize",
  "genproxytoken",
] as const

export const ALLOWED_ODOO_DB_COMMANDS = [
  "list",
  "create",
  "duplicate",
  "drop",
  "backup",
  "restore",
] as const

export type OdooCommand = (typeof ALLOWED_ODOO_COMMANDS)[number]
