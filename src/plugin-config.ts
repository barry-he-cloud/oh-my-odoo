import * as fs from "fs"
import * as path from "path"
import { OhMyOdooConfigSchema, type OhMyOdooConfig } from "./config"
import { log, parseJsonc } from "./shared"
import { CONFIG_BASENAME } from "./shared/plugin-identity"

export function loadConfigFromPath(
  configPath: string,
): OhMyOdooConfig | null {
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf-8")
      const rawConfig = parseJsonc<Record<string, unknown>>(content)
      const result = OhMyOdooConfigSchema.safeParse(rawConfig)

      if (result.success) {
        log(`Config loaded from ${configPath}`)
        return result.data
      }

      const errorMsg = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ")
      log(`Config validation error in ${configPath}: ${errorMsg}`)

      // Partial load: try section-by-section
      const partialConfig: Record<string, unknown> = {}
      for (const key of Object.keys(rawConfig)) {
        const sectionResult = OhMyOdooConfigSchema.safeParse({ [key]: rawConfig[key] })
        if (sectionResult.success) {
          const parsed = sectionResult.data as Record<string, unknown>
          if (parsed[key] !== undefined) {
            partialConfig[key] = parsed[key]
          }
        }
      }
      return partialConfig as OhMyOdooConfig
    }
  } catch (err) {
    log(`Error loading config from ${configPath}: ${err instanceof Error ? err.message : String(err)}`)
  }
  return null
}

export function mergeConfigs(
  base: OhMyOdooConfig,
  override: OhMyOdooConfig,
): OhMyOdooConfig {
  return {
    ...base,
    ...override,
    odoo: { ...base.odoo, ...override.odoo },
    disabled_hooks: [
      ...new Set([...(base.disabled_hooks ?? []), ...(override.disabled_hooks ?? [])]),
    ],
    disabled_tools: [
      ...new Set([...(base.disabled_tools ?? []), ...(override.disabled_tools ?? [])]),
    ],
    disabled_skills: [
      ...new Set([...(base.disabled_skills ?? []), ...(override.disabled_skills ?? [])]),
    ],
    disabled_commands: [
      ...new Set([...(base.disabled_commands ?? []), ...(override.disabled_commands ?? [])]),
    ],
  }
}

export function loadPluginConfig(
  directory: string,
): OhMyOdooConfig {
  const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? ""

  // User-level config: ~/.config/opencode/oh-my-odoo.json[c]
  const userConfigDir = path.join(homeDir, ".config", "opencode")
  const userJsoncPath = path.join(userConfigDir, `${CONFIG_BASENAME}.jsonc`)
  const userJsonPath = path.join(userConfigDir, `${CONFIG_BASENAME}.json`)
  const userConfigPath = fs.existsSync(userJsoncPath) ? userJsoncPath : userJsonPath

  // Project-level config: .opencode/oh-my-odoo.json[c]
  const projectBase = path.join(directory, ".opencode")
  const projectJsoncPath = path.join(projectBase, `${CONFIG_BASENAME}.jsonc`)
  const projectJsonPath = path.join(projectBase, `${CONFIG_BASENAME}.json`)
  const projectConfigPath = fs.existsSync(projectJsoncPath) ? projectJsoncPath : projectJsonPath

  const userConfig = loadConfigFromPath(userConfigPath)
  let config: OhMyOdooConfig = userConfig ?? OhMyOdooConfigSchema.parse({})

  const projectConfig = loadConfigFromPath(projectConfigPath)
  if (projectConfig) {
    config = mergeConfigs(config, projectConfig)
  }

  log("Final merged config", config)
  return config
}
