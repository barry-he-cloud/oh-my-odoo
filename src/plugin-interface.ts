import type { OhMyOdooConfig } from "./config"
import type { ToolsRecord, CreatedHooks, PluginContext } from "./types"

export function createPluginInterface(args: {
  ctx: PluginContext
  pluginConfig: OhMyOdooConfig
  hooks: CreatedHooks
  tools: ToolsRecord
}) {
  const { ctx, pluginConfig, hooks, tools } = args

  return {
    tool: tools,

    "tool.execute.before": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { args: Record<string, unknown>; message?: string },
    ): Promise<void> => {
      if (hooks.odooContextInjector) {
        await hooks.odooContextInjector["tool.execute.before"]?.(input, output)
      }
      if (hooks.odooModuleGuard) {
        await hooks.odooModuleGuard["tool.execute.before"]?.(input, output)
      }
    },
  }
}
