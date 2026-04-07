export interface ConfigValidationResult {
  valid: boolean
  configPath: string
  errors: ConfigError[]
  warnings: ConfigWarning[]
  parsed: Record<string, string>
}

export interface ConfigError {
  key: string
  message: string
}

export interface ConfigWarning {
  key: string
  message: string
}

export const CRITICAL_ODOO_CONFIG_KEYS = [
  "db_host",
  "db_port",
  "db_user",
  "db_password",
  "db_name",
  "addons_path",
  "admin_passwd",
  "http_port",
  "xmlrpc_port",
  "data_dir",
  "logfile",
  "log_level",
  "workers",
  "limit_memory_hard",
  "limit_memory_soft",
  "limit_time_cpu",
  "limit_time_real",
  "proxy_mode",
  "list_db",
  "dbfilter",
  "server_wide_modules",
] as const

export const SECURITY_SENSITIVE_KEYS = [
  "admin_passwd",
  "db_password",
] as const
