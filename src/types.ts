import type { PluginInput, ToolDefinition, Hooks } from "@opencode-ai/plugin"

export type PluginContext = PluginInput

export type ToolsRecord = Record<string, ToolDefinition>

export interface CreatedHooks {
  odooContextInjector?: Hooks | null
  odooModuleGuard?: Hooks | null
}
