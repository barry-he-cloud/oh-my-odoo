import * as p from "@clack/prompts"
import type { DetectedConfig, InstallConfig } from "./types"
import { detectedToInitialValues } from "./install-validators"

export async function promptInstallConfig(detected: DetectedConfig): Promise<InstallConfig | null> {
  const initial = detectedToInitialValues(detected)

  const odooVersion = await p.select({
    message: "Odoo 版本？",
    options: [
      { value: "14.0", label: "14.0", hint: "Legacy" },
      { value: "15.0", label: "15.0" },
      { value: "16.0", label: "16.0", hint: "OWL2 + 新 Asset Bundle" },
      { value: "17.0", label: "17.0", hint: "推荐 — attrs 废弃, Python 3.10+" },
      { value: "18.0", label: "18.0", hint: "OWL3 + 增强 RBAC" },
      { value: "19.0", label: "19.0", hint: "最新 — OWL4 Signals, Vite, Python 3.12+" },
    ],
    initialValue: initial.odooVersion,
  })
  if (p.isCancel(odooVersion)) { p.cancel("安装已取消。"); return null }

  const edition = await p.select({
    message: "Odoo 版本类型？",
    options: [
      { value: "community", label: "Community (CE)", hint: "开源社区版" },
      { value: "enterprise", label: "Enterprise (EE)", hint: "企业版（需许可证）" },
    ],
    initialValue: initial.edition,
  })
  if (p.isCancel(edition)) { p.cancel("安装已取消。"); return null }

  const pythonVersion = await p.select({
    message: "Python 版本？",
    options: [
      { value: "3.10", label: "Python 3.10", hint: "Odoo 17 最低要求" },
      { value: "3.11", label: "Python 3.11" },
      { value: "3.12", label: "Python 3.12", hint: "推荐 / Odoo 19 最低要求" },
      { value: "3.13", label: "Python 3.13", hint: "最新" },
    ],
    initialValue: "3.12",
  })
  if (p.isCancel(pythonVersion)) { p.cancel("安装已取消。"); return null }

  const database = await p.text({
    message: "默认数据库名称？（可留空）",
    placeholder: "mydb",
    defaultValue: initial.database,
  })
  if (p.isCancel(database)) { p.cancel("安装已取消。"); return null }

  const features = await p.multiselect({
    message: "启用哪些功能？",
    options: [
      { value: "auto_detect", label: "自动检测 Odoo 项目上下文", hint: "推荐" },
      { value: "security_audit", label: "安全审计", hint: "扫描 SQL 注入、sudo 滥用等" },
      { value: "upgrade_checks", label: "升级安全检查", hint: "版本升级兼容性提醒" },
    ],
    initialValues: ["auto_detect", "security_audit", "upgrade_checks"],
  })
  if (p.isCancel(features)) { p.cancel("安装已取消。"); return null }

  return {
    odooVersion: odooVersion as string,
    edition: edition as "community" | "enterprise",
    pythonVersion: pythonVersion as string,
    database: (database as string) || "",
    autoDetect: (features as string[]).includes("auto_detect"),
    securityAudit: (features as string[]).includes("security_audit"),
    upgradeChecks: (features as string[]).includes("upgrade_checks"),
  }
}
