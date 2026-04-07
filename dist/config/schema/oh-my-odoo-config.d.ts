import { z } from "zod";
export declare const OhMyOdooConfigSchema: z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    disabled_hooks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    disabled_tools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    disabled_skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    disabled_commands: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    /** Odoo domain-specific configuration */
    odoo: z.ZodOptional<z.ZodObject<{
        odoo_version: z.ZodOptional<z.ZodString>;
        edition: z.ZodOptional<z.ZodEnum<["community", "enterprise"]>>;
        python_version: z.ZodOptional<z.ZodString>;
        odoo_bin_path: z.ZodOptional<z.ZodString>;
        odoo_conf_path: z.ZodOptional<z.ZodString>;
        project_root: z.ZodOptional<z.ZodString>;
        database_name: z.ZodOptional<z.ZodString>;
        addons_paths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        upgrade_source_version: z.ZodOptional<z.ZodString>;
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
    }>>;
    /** Enable auto-detection of Odoo project context (default: true) */
    auto_detect: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    /** Enable upgrade safety checks (default: true) */
    upgrade_safety_checks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    /** Enable security audit on module scan (default: true) */
    security_audit: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    /** Custom module template paths */
    module_templates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    auto_detect: boolean;
    upgrade_safety_checks: boolean;
    security_audit: boolean;
    $schema?: string | undefined;
    disabled_hooks?: string[] | undefined;
    disabled_tools?: string[] | undefined;
    disabled_skills?: string[] | undefined;
    disabled_commands?: string[] | undefined;
    odoo?: {
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
    } | undefined;
    module_templates?: string[] | undefined;
}, {
    $schema?: string | undefined;
    disabled_hooks?: string[] | undefined;
    disabled_tools?: string[] | undefined;
    disabled_skills?: string[] | undefined;
    disabled_commands?: string[] | undefined;
    odoo?: {
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
    } | undefined;
    auto_detect?: boolean | undefined;
    upgrade_safety_checks?: boolean | undefined;
    security_audit?: boolean | undefined;
    module_templates?: string[] | undefined;
}>;
export type OhMyOdooConfig = z.infer<typeof OhMyOdooConfigSchema>;
