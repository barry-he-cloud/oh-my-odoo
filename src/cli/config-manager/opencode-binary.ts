import { execSync } from "node:child_process"

export async function isOpenCodeInstalled(): Promise<boolean> {
  try {
    execSync("opencode --version", { stdio: "pipe", timeout: 10_000 })
    return true
  } catch {
    return false
  }
}

export async function getOpenCodeVersion(): Promise<string | null> {
  try {
    const output = execSync("opencode --version", { stdio: "pipe", timeout: 10_000 }).toString().trim()
    return output
  } catch {
    return null
  }
}
