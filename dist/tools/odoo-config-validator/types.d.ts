export interface ConfigValidationResult {
    valid: boolean;
    configPath: string;
    errors: ConfigError[];
    warnings: ConfigWarning[];
    parsed: Record<string, string>;
}
export interface ConfigError {
    key: string;
    message: string;
}
export interface ConfigWarning {
    key: string;
    message: string;
}
export declare const CRITICAL_ODOO_CONFIG_KEYS: readonly ["db_host", "db_port", "db_user", "db_password", "db_name", "addons_path", "admin_passwd", "http_port", "xmlrpc_port", "data_dir", "logfile", "log_level", "workers", "limit_memory_hard", "limit_memory_soft", "limit_time_cpu", "limit_time_real", "proxy_mode", "list_db", "dbfilter", "server_wide_modules"];
export declare const SECURITY_SENSITIVE_KEYS: readonly ["admin_passwd", "db_password"];
