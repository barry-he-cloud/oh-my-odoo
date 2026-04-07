import { z } from "zod";
export declare const OdooConfigSchema: z.ZodObject<{
    /** Odoo version (e.g. "17.0", "18.0") */
    odoo_version: z.ZodOptional<z.ZodString>;
    /** Odoo edition: community (CE) or enterprise (EE) */
    edition: z.ZodOptional<z.ZodEnum<["community", "enterprise"]>>;
    /** Python version used by the project (e.g. "3.10", "3.12") */
    python_version: z.ZodOptional<z.ZodString>;
    /** Path to odoo-bin or odoo executable */
    odoo_bin_path: z.ZodOptional<z.ZodString>;
    /** Path to the Odoo configuration file (odoo.conf) */
    odoo_conf_path: z.ZodOptional<z.ZodString>;
    /** Odoo project root directory (default: plugin ctx.directory) */
    project_root: z.ZodOptional<z.ZodString>;
    /** Database name for the Odoo instance */
    database_name: z.ZodOptional<z.ZodString>;
    /** Custom addons paths (comma-separated or array) */
    addons_paths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    /** Source version for upgrade operations */
    upgrade_source_version: z.ZodOptional<z.ZodString>;
    /** Target version for upgrade operations */
    upgrade_target_version: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    odoo_version?: string | undefined;
    edition?: "community" | "enterprise" | undefined;
    python_version?: string | undefined;
    odoo_bin_path?: string | undefined;
    odoo_conf_path?: string | undefined;
    project_root?: string | undefined;
    database_name?: string | undefined;
    addons_paths?: string[] | undefined;
    upgrade_source_version?: string | undefined;
    upgrade_target_version?: string | undefined;
}, {
    odoo_version?: string | undefined;
    edition?: "community" | "enterprise" | undefined;
    python_version?: string | undefined;
    odoo_bin_path?: string | undefined;
    odoo_conf_path?: string | undefined;
    project_root?: string | undefined;
    database_name?: string | undefined;
    addons_paths?: string[] | undefined;
    upgrade_source_version?: string | undefined;
    upgrade_target_version?: string | undefined;
}>;
export type OdooConfig = z.infer<typeof OdooConfigSchema>;
