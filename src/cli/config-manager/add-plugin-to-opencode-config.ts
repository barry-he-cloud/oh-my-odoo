import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { ConfigMergeResult } from "../types"
import { PLUGIN_NAME } from "../../shared/plugin-identity"

export async function addPluginToOpenCodeConfig(version: string): Promise<ConfigMergeResult> {
  const configDir = join(process.cwd(), ".opencode")
  const configPath = join(configDir, "opencode.json")
  const pluginEntry = `${PLUGIN_NAME}@${version}`

  try {
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true })
    }

    if (!existsSync(configPath)) {
      const config = { plugin: [pluginEntry] }
      writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n")
      return { success: true, configPath }
    }

    const content = readFileSync(configPath, "utf-8")
    const config = JSON.parse(content)
    const plugins: string[] = config.plugin ?? config.plugins ?? []

    // Remove existing oh-my-odoo entries
    const filtered = plugins.filter((p: string) =>
      p !== PLUGIN_NAME && !p.startsWith(`${PLUGIN_NAME}@`) && !p.includes("oh-my-odoo")
    )
    filtered.push(pluginEntry)

    config.plugin = filtered
    delete config.plugins

    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n")
    return { success: true, configPath }
  } catch (err) {
    return {
      success: false,
      configPath,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
