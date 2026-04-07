import { z } from "zod"

export const OdooConfigSchema = z.object({
  /** Odoo version (e.g. "17.0", "18.0") */
  odoo_version: z.string().optional(),
  /** Odoo edition: community (CE) or enterprise (EE) */
  edition: z.enum(["community", "enterprise"]).optional(),
  /** Python version used by the project (e.g. "3.10", "3.12") */
  python_version: z.string().optional(),
  /** Path to odoo-bin or odoo executable */
  odoo_bin_path: z.string().optional(),
  /** Path to the Odoo configuration file (odoo.conf) */
  odoo_conf_path: z.string().optional(),
  /** Odoo project root directory (default: plugin ctx.directory) */
  project_root: z.string().optional(),
  /** Database name for the Odoo instance */
  database_name: z.string().optional(),
  /** Custom addons paths (comma-separated or array) */
  addons_paths: z.array(z.string()).optional(),
  /** Source version for upgrade operations */
  upgrade_source_version: z.string().optional(),
  /** Target version for upgrade operations */
  upgrade_target_version: z.string().optional(),
})

export type OdooConfig = z.infer<typeof OdooConfigSchema>
