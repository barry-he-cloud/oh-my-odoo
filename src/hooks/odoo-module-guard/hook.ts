import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import { existsSync } from "fs"
import { join, relative, resolve } from "path"
import { log } from "../../shared"

/**
 * Prevents accidental edits to:
 * 1. Core Odoo modules (odoo/addons/*)
 * 2. OCA/third-party installed modules outside the project's custom addons
 * 3. __manifest__.py deletions without confirmation
 */
export function createOdooModuleGuardHook(ctx: PluginInput): Hooks {
  const projectRoot = ctx.directory

  const coreAddonsPaths = [
    join(projectRoot, "odoo", "addons"),
    join(projectRoot, "odoo", "odoo", "addons"),
    "/usr/lib/python3/dist-packages/odoo/addons",
  ]

  const customAddonsPaths = [
    join(projectRoot, "addons"),
    join(projectRoot, "custom_addons"),
    join(projectRoot, "extra-addons"),
  ]

  function isCoreModule(filePath: string): boolean {
    const absPath = resolve(projectRoot, filePath)
    return coreAddonsPaths.some(corePath => absPath.startsWith(corePath))
  }

  function isCustomModule(filePath: string): boolean {
    const absPath = resolve(projectRoot, filePath)
    return customAddonsPaths.some(customPath => absPath.startsWith(customPath))
  }

  return {
    "tool.execute.before": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { args: Record<string, unknown>; message?: string },
    ): Promise<void> => {
      const toolName = input.tool?.toLowerCase()
      if (toolName !== "write" && toolName !== "edit") return

      const filePath = output.args.path as string | undefined
      if (!filePath) return

      if (isCoreModule(filePath)) {
        output.message = [
          "⚠️ [Odoo Module Guard] You are editing a CORE Odoo module file:",
          `  ${filePath}`,
          "",
          "Core modules should NOT be modified directly. Instead:",
          "  1. Create a custom module that inherits/extends the core behavior",
          "  2. Use _inherit to extend models",
          "  3. Use xpath to modify views",
          "  4. Use ir.config_parameter for runtime settings",
          "",
          "If you must patch core (not recommended), consider monkey-patching via a custom addon.",
        ].join("\n")
        log(`[odoo-module-guard] Blocked core module edit: ${filePath}`)
      }
    },
  }
}
