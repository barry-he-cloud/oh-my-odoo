export interface OdooCliResult {
    command: string;
    stdout: string;
    stderr: string;
    exitCode: number;
    duration: number;
}
export declare const ALLOWED_ODOO_COMMANDS: readonly ["scaffold", "shell", "db", "--update", "--init", "--test-enable", "--stop-after-init", "--dev", "cloc", "populate", "tsconfig", "neutralize", "genproxytoken"];
export declare const ALLOWED_ODOO_DB_COMMANDS: readonly ["list", "create", "duplicate", "drop", "backup", "restore"];
export type OdooCommand = (typeof ALLOWED_ODOO_COMMANDS)[number];
