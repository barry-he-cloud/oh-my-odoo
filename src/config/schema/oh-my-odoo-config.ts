import { z } from "zod"
import { OdooConfigSchema } from "./odoo"

export const OhMyOdooConfigSchema = z.object({
  $schema: z.string().optional(),

  disabled_hooks: z.array(z.string()).optional(),
  disabled_tools: z.array(z.string()).optional(),
  disabled_skills: z.array(z.string()).optional(),
  disabled_commands: z.array(z.string()).optional(),

  /** Odoo domain-specific configuration */
  odoo: OdooConfigSchema.optional(),

  /** Enable auto-detection of Odoo project context (default: true) */
  auto_detect: z.boolean().optional().default(true),

  /** Enable upgrade safety checks (default: true) */
  upgrade_safety_checks: z.boolean().optional().default(true),

  /** Enable security audit on module scan (default: true) */
  security_audit: z.boolean().optional().default(true),

  /** Custom module template paths */
  module_templates: z.array(z.string()).optional(),
})

export type OhMyOdooConfig = z.infer<typeof OhMyOdooConfigSchema>
