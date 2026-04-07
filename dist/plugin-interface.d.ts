import type { OhMyOdooConfig } from "./config";
import type { ToolsRecord, CreatedHooks, PluginContext } from "./types";
export declare function createPluginInterface(args: {
    ctx: PluginContext;
    pluginConfig: OhMyOdooConfig;
    hooks: CreatedHooks;
    tools: ToolsRecord;
}): {
    tool: ToolsRecord;
    "tool.execute.before": (input: {
        tool: string;
        sessionID: string;
        callID: string;
    }, output: {
        args: Record<string, unknown>;
        message?: string;
    }) => Promise<void>;
};
