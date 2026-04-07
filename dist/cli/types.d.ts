export interface InstallArgs {
    tui: boolean;
    odooVersion?: string;
    edition?: string;
    pythonVersion?: string;
    database?: string;
    skipDetect?: boolean;
}
export interface InstallConfig {
    odooVersion: string;
    edition: "community" | "enterprise";
    pythonVersion: string;
    database: string;
    autoDetect: boolean;
    securityAudit: boolean;
    upgradeChecks: boolean;
}
export interface DetectedConfig {
    isInstalled: boolean;
    odooVersion?: string;
    edition?: string;
    database?: string;
    hasOdooBin: boolean;
    hasOdooConf: boolean;
    customModuleCount: number;
}
export interface ConfigMergeResult {
    success: boolean;
    configPath: string;
    error?: string;
}
