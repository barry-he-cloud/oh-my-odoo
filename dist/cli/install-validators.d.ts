import type { InstallArgs, InstallConfig, DetectedConfig } from "./types";
export declare const SYMBOLS: {
    check: string;
    cross: string;
    warn: string;
    arrow: string;
    bullet: string;
    star: string;
};
export declare function printHeader(isUpdate: boolean): void;
export declare function printStep(step: number, total: number, message: string): void;
export declare function printSuccess(message: string): void;
export declare function printError(message: string): void;
export declare function printWarning(message: string): void;
export declare function printInfo(message: string): void;
export declare function printBox(content: string, title?: string): void;
export declare function validateNonTuiArgs(args: InstallArgs): {
    valid: boolean;
    errors: string[];
};
export declare function argsToConfig(args: InstallArgs): InstallConfig;
export declare function detectedToInitialValues(detected: DetectedConfig): {
    odooVersion: string;
    edition: string;
    database: string;
};
export declare function formatConfigSummary(config: InstallConfig): string;
