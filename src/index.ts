import type { Plugin } from "@opencode-ai/plugin"
import type { OhMyOdooConfig } from "./config"
import type { ToolsRecord, CreatedHooks } from "./types"

import { loadPluginConfig } from "./plugin-config"
import { createPluginInterface } from "./plugin-interface"
import { createOdooContextInjectorHook } from "./hooks/odoo-context-injector"
import { createOdooModuleGuardHook } from "./hooks/odoo-module-guard"
import {
  createOdooCliTool,
  createOdooModuleScanner,
  createOdooConfigValidator,
  createOdooUpgradeAssistant,
  createOdooSecurityChecker,
  createOdooXmlValidator,
  createOdooScaffoldTool,
} from "./tools"
import { log, PLUGIN_NAME } from "./shared"

const OhMyOdooPlugin: Plugin = async (ctx) => {
  log(`[${PLUGIN_NAME}] ENTRY - plugin loading`, { directory: ctx.directory })

  const pluginConfig = loadPluginConfig(ctx.directory)
  const disabledTools = new Set(pluginConfig.disabled_tools ?? [])
  const disabledHooks = new Set(pluginConfig.disabled_hooks ?? [])

  // Create tools
  const allTools: ToolsRecord = {}

  const toolFactories: Array<{
    name: string
    factory: () => Record<string, import("@opencode-ai/plugin").ToolDefinition>
  }> = [
    { name: "odoo_cli", factory: () => createOdooCliTool(ctx) },
    { name: "odoo_module_scanner", factory: () => createOdooModuleScanner(ctx) },
    { name: "odoo_config_validator", factory: () => createOdooConfigValidator(ctx) },
    { name: "odoo_upgrade", factory: () => createOdooUpgradeAssistant(ctx) },
    { name: "odoo_security_checker", factory: () => createOdooSecurityChecker(ctx) },
    { name: "odoo_xml_validator", factory: () => createOdooXmlValidator(ctx) },
    { name: "odoo_scaffold", factory: () => createOdooScaffoldTool(ctx) },
  ]

  for (const { name, factory } of toolFactories) {
    if (!disabledTools.has(name)) {
      const tools = factory()
      Object.assign(allTools, tools)
    }
  }

  log(`[${PLUGIN_NAME}] Tools registered: ${Object.keys(allTools).join(", ")}`)

  // Create hooks
  const hooks: CreatedHooks = {}

  if (!disabledHooks.has("odoo-context-injector")) {
    hooks.odooContextInjector = createOdooContextInjectorHook(ctx)
  }
  if (!disabledHooks.has("odoo-module-guard")) {
    hooks.odooModuleGuard = createOdooModuleGuardHook(ctx)
  }

  log(`[${PLUGIN_NAME}] Hooks registered: ${Object.keys(hooks).filter(k => hooks[k as keyof CreatedHooks]).join(", ")}`)

  // Create plugin interface
  const pluginInterface = createPluginInterface({
    ctx,
    pluginConfig,
    hooks,
    tools: allTools,
  })

  return {
    name: PLUGIN_NAME,
    ...pluginInterface,
  }
}

export default OhMyOdooPlugin

export type { OhMyOdooConfig } from "./config"
export type { OdooConfig } from "./config"
