import { type OhMyOdooConfig } from "./config";
export declare function loadConfigFromPath(configPath: string): OhMyOdooConfig | null;
export declare function mergeConfigs(base: OhMyOdooConfig, override: OhMyOdooConfig): OhMyOdooConfig;
export declare function loadPluginConfig(directory: string): OhMyOdooConfig;
