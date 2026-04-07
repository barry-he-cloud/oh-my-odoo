import type { Hooks, PluginInput } from "@opencode-ai/plugin";
/**
 * Prevents accidental edits to:
 * 1. Core Odoo modules (odoo/addons/*)
 * 2. OCA/third-party installed modules outside the project's custom addons
 * 3. __manifest__.py deletions without confirmation
 */
export declare function createOdooModuleGuardHook(ctx: PluginInput): Hooks;
