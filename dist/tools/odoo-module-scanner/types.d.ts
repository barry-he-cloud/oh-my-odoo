export interface OdooModuleInfo {
    name: string;
    path: string;
    version?: string;
    summary?: string;
    category?: string;
    depends: string[];
    odooVersionCompat?: string;
    hasModels: boolean;
    hasViews: boolean;
    hasControllers: boolean;
    hasSecurity: boolean;
    hasData: boolean;
    hasDemo: boolean;
    hasTests: boolean;
    hasStaticAssets: boolean;
    hasWizards: boolean;
    hasReports: boolean;
    pythonFiles: number;
    xmlFiles: number;
    jsFiles: number;
    installable: boolean;
    license?: string;
}
export interface OdooScanResult {
    modules: OdooModuleInfo[];
    totalModules: number;
    scanDuration: number;
    addonsPaths: string[];
}
