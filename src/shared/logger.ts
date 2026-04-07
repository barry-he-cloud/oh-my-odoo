import { appendFileSync, mkdirSync, existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { LOG_FILENAME } from "./plugin-identity"

const logPath = join(tmpdir(), LOG_FILENAME)

export function log(message: string, data?: unknown): void {
  const ts = new Date().toISOString()
  const line = data
    ? `[${ts}] ${message} ${JSON.stringify(data)}`
    : `[${ts}] ${message}`
  try {
    appendFileSync(logPath, line + "\n")
  } catch {
    // best effort
  }
}
