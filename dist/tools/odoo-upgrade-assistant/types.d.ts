export interface UpgradeAnalysis {
    sourceVersion: string;
    targetVersion: string;
    modules: ModuleUpgradeInfo[];
    breakingChanges: BreakingChange[];
    deprecations: Deprecation[];
    recommendations: string[];
    estimatedEffort: "low" | "medium" | "high" | "critical";
}
export interface ModuleUpgradeInfo {
    name: string;
    path: string;
    issues: UpgradeIssue[];
    autoFixable: number;
    manualFix: number;
}
export interface UpgradeIssue {
    file: string;
    line?: number;
    type: "api_change" | "deprecation" | "removal" | "field_change" | "view_change" | "security_change" | "python_compat" | "js_change";
    severity: "error" | "warning" | "info";
    message: string;
    suggestion?: string;
    autoFixable: boolean;
}
export interface BreakingChange {
    versions: string;
    area: string;
    description: string;
    migration: string;
}
export interface Deprecation {
    symbol: string;
    since: string;
    replacement: string;
}
export declare const ODOO_VERSIONS: readonly ["14.0", "15.0", "16.0", "17.0", "18.0", "19.0"];
/** Known breaking changes between Odoo versions */
export declare const VERSION_BREAKING_CHANGES: BreakingChange[];
/** Known deprecations to scan for in source code */
export declare const DEPRECATION_PATTERNS: Array<{
    pattern: RegExp;
    symbol: string;
    since: string;
    replacement: string;
    type: UpgradeIssue["type"];
}>;
