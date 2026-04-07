export interface UpgradeAnalysis {
  sourceVersion: string
  targetVersion: string
  modules: ModuleUpgradeInfo[]
  breakingChanges: BreakingChange[]
  deprecations: Deprecation[]
  recommendations: string[]
  estimatedEffort: "low" | "medium" | "high" | "critical"
}

export interface ModuleUpgradeInfo {
  name: string
  path: string
  issues: UpgradeIssue[]
  autoFixable: number
  manualFix: number
}

export interface UpgradeIssue {
  file: string
  line?: number
  type: "api_change" | "deprecation" | "removal" | "field_change" | "view_change" | "security_change" | "python_compat" | "js_change"
  severity: "error" | "warning" | "info"
  message: string
  suggestion?: string
  autoFixable: boolean
}

export interface BreakingChange {
  versions: string
  area: string
  description: string
  migration: string
}

export interface Deprecation {
  symbol: string
  since: string
  replacement: string
}

export const ODOO_VERSIONS = ["14.0", "15.0", "16.0", "17.0", "18.0", "19.0"] as const

/** Known breaking changes between Odoo versions */
export const VERSION_BREAKING_CHANGES: BreakingChange[] = [
  // 14.0 → 15.0
  { versions: "14.0→15.0", area: "ORM", description: "Fields renamed: field.string deprecated in favor of field.label pattern", migration: "Review all field definitions" },
  { versions: "14.0→15.0", area: "Web", description: "Legacy JS widgets → OWL component migration", migration: "Convert AbstractField widgets to OWL FieldComponent" },

  // 15.0 → 16.0
  { versions: "15.0→16.0", area: "ORM", description: "Command triplets for X2Many write operations changed format", migration: "Use Command.create(), Command.update(), Command.delete() etc." },
  { versions: "15.0→16.0", area: "Web", description: "Webclient fully migrated to OWL2. Legacy JS widget support removed.", migration: "All frontend JS must use OWL2 components" },
  { versions: "15.0→16.0", area: "Assets", description: "Asset bundle system rewritten. ir.qweb.css/ir.qweb.js removed.", migration: "Use new asset bundle declaration in __manifest__.py 'assets' key" },
  { versions: "15.0→16.0", area: "Security", description: "ir.rule domain evaluation changes for multi-company", migration: "Review all ir.rule domains with company_id checks" },

  // 16.0 → 17.0
  { versions: "16.0→17.0", area: "ORM", description: "Computed field store behavior changed, onchange rework", migration: "Review compute methods with store=True and onchange decorators" },
  { versions: "16.0→17.0", area: "Web", description: "Navbar and action manager rewritten", migration: "Update any custom action manager patches or navbar extensions" },
  { versions: "16.0→17.0", area: "Reports", description: "QWeb report engine changes, pdf generation updates", migration: "Test all PDF reports for layout regressions" },
  { versions: "16.0→17.0", area: "Upgrade", description: "Python 3.10+ required, dropped Python 3.8/3.9", migration: "Ensure Python >= 3.10 in deployment" },

  // 17.0 → 18.0
  { versions: "17.0→18.0", area: "ORM", description: "New model inheritance pattern, improved computed field caching", migration: "Review _inherit patterns and computed field dependencies" },
  { versions: "17.0→18.0", area: "Web", description: "OWL3 upgrade, component lifecycle changes", migration: "Update OWL components for OWL3 lifecycle (setup() changes)" },
  { versions: "17.0→18.0", area: "API", description: "JSON-RPC endpoint changes, new REST API patterns", migration: "Update external integrations using JSON-RPC" },
  { versions: "17.0→18.0", area: "Security", description: "Enhanced RBAC, group inheritance changes", migration: "Review security groups and implied_ids chains" },

  // 18.0 → 19.0
  { versions: "18.0→19.0", area: "ORM", description: "Field descriptor protocol rewrite, lazy computed field evaluation by default", migration: "Review all computed fields — lazy eval may change timing of side effects. Check field descriptor overrides." },
  { versions: "18.0→19.0", area: "ORM", description: "Model._get_id() removed, env.ref() behavior stricter on missing refs", migration: "Replace _get_id() calls with env.ref(). Add raise_if_not_found=False where optional refs are expected." },
  { versions: "18.0→19.0", area: "Web", description: "OWL 4.0 with Signals reactivity model replacing patched state objects", migration: "Refactor OWL components: replace useState() patches with useSignal(). Review all component reactivity patterns." },
  { versions: "18.0→19.0", area: "Web", description: "Legacy web.core.bus removed, new EventBus API for inter-component communication", migration: "Replace core.bus.trigger/on with new EventBus from @odoo/owl or custom event system" },
  { versions: "18.0→19.0", area: "API", description: "New native REST API (/api/v2/) with OpenAPI spec, JSON-RPC /jsonrpc deprecated", migration: "Migrate external integrations from /jsonrpc to /api/v2/. Update API authentication to use OAuth2 bearer tokens." },
  { versions: "18.0→19.0", area: "Security", description: "Row-level security policies replace ir.rule for new models, ir.rule kept for backward compat", migration: "New models should use _security_policy. Existing ir.rule continues to work but review for performance." },
  { versions: "18.0→19.0", area: "Assets", description: "Vite-based asset bundling replaces legacy asset pipeline for JS/CSS", migration: "Update __manifest__.py assets declarations for Vite. Review custom asset bundles." },
  { versions: "18.0→19.0", area: "Upgrade", description: "Python 3.12+ required, dropped Python 3.10/3.11 support", migration: "Ensure Python >= 3.12. Check for removed stdlib modules (e.g. distutils fully removed)." },
  { versions: "18.0→19.0", area: "Reports", description: "Weasyprint replaces wkhtmltopdf as default PDF engine", migration: "Install weasyprint. Test all PDF reports — CSS rendering may differ. wkhtmltopdf fallback still available." },
  { versions: "18.0→19.0", area: "Data", description: "JSONB fields for unstructured data, fields.Dict() type added", migration: "Consider migrating serialized fields or Text JSON fields to new fields.Dict() for better query support." },
]

/** Known deprecations to scan for in source code */
export const DEPRECATION_PATTERNS: Array<{
  pattern: RegExp
  symbol: string
  since: string
  replacement: string
  type: UpgradeIssue["type"]
}> = [
  // ORM deprecations
  { pattern: /\.browse\(\s*cr\s*,\s*uid/g, symbol: "Old API browse(cr, uid, ...)", since: "10.0", replacement: "Use new API self.browse(ids)", type: "api_change" },
  { pattern: /fields\.(one2many|many2one|many2many)\(/gi, symbol: "Lowercase field types", since: "12.0", replacement: "Use fields.One2many, fields.Many2one, fields.Many2many", type: "api_change" },
  { pattern: /\bopenerp\b/g, symbol: "openerp namespace", since: "10.0", replacement: "Use 'odoo' namespace instead of 'openerp'", type: "deprecation" },
  { pattern: /from openerp/g, symbol: "from openerp import", since: "10.0", replacement: "from odoo import ...", type: "deprecation" },
  { pattern: /api\.multi/g, symbol: "@api.multi decorator", since: "13.0", replacement: "Remove @api.multi (methods are multi by default)", type: "removal" },
  { pattern: /api\.one/g, symbol: "@api.one decorator", since: "13.0", replacement: "Remove @api.one and loop over self manually", type: "removal" },
  { pattern: /\._columns\b/g, symbol: "_columns dict", since: "10.0", replacement: "Use new-style field declarations", type: "removal" },
  { pattern: /\.pool\.get\(/g, symbol: "self.pool.get()", since: "10.0", replacement: "Use self.env['model.name']", type: "removal" },
  { pattern: /fields_view_get/g, symbol: "fields_view_get", since: "17.0", replacement: "Use get_views() instead of fields_view_get()", type: "api_change" },
  { pattern: /\bonchange_\w+/g, symbol: "onchange_ methods (old style)", since: "13.0", replacement: "Use @api.onchange('field') decorator", type: "deprecation" },

  // View/XML deprecations
  { pattern: /<tree\s[^>]*editable=/g, symbol: "editable tree attribute", since: "17.0", replacement: "Use <tree editable='...'/> with new syntax or list view", type: "view_change" },
  { pattern: /attrs\s*=\s*["']\{/g, symbol: "attrs={} in XML views", since: "17.0", replacement: "Use individual invisible/readonly/required attributes", type: "view_change" },
  { pattern: /states\s*=\s*["']/g, symbol: "states= attribute in views", since: "16.0", replacement: "Use invisible attribute with domain expression", type: "view_change" },

  // JS/Web deprecations
  { pattern: /require\(\s*["']web\./g, symbol: "require('web.xxx') AMD modules", since: "16.0", replacement: "Use OWL imports: import { Component } from '@odoo/owl'", type: "js_change" },
  { pattern: /Widget\.extend\(/g, symbol: "Widget.extend() legacy pattern", since: "16.0", replacement: "Use OWL Component class", type: "js_change" },
  { pattern: /AbstractField\.extend\(/g, symbol: "AbstractField.extend()", since: "16.0", replacement: "Use OWL FieldComponent", type: "js_change" },

  // 19.0 specific deprecations
  { pattern: /\._get_id\s*\(/g, symbol: "Model._get_id()", since: "19.0", replacement: "Use self.env.ref('xml_id') instead", type: "removal" },
  { pattern: /\/jsonrpc/g, symbol: "/jsonrpc endpoint", since: "19.0", replacement: "Migrate to /api/v2/ REST endpoints with OAuth2", type: "api_change" },
  { pattern: /core\.bus\.(trigger|on)\(/g, symbol: "web.core.bus event bus", since: "19.0", replacement: "Use new EventBus from @odoo/owl", type: "js_change" },
  { pattern: /useState\s*\(/g, symbol: "useState() (OWL <=3)", since: "19.0", replacement: "Consider useSignal() for OWL 4.0 Signals reactivity", type: "js_change" },
  { pattern: /import\s+distutils/g, symbol: "distutils (removed in Python 3.12)", since: "19.0", replacement: "Use setuptools or packaging module", type: "python_compat" },
  { pattern: /wkhtmltopdf/gi, symbol: "wkhtmltopdf reference", since: "19.0", replacement: "Default PDF engine is now weasyprint. Update deployment scripts.", type: "deprecation" },

  // Python compat
  { pattern: /\.has_key\(/g, symbol: "dict.has_key()", since: "Python3", replacement: "Use 'key in dict' syntax", type: "python_compat" },
  { pattern: /print\s+[^(]/g, symbol: "print statement (Python 2)", since: "Python3", replacement: "Use print() function", type: "python_compat" },
  { pattern: /except\s+\w+\s*,\s*\w+/g, symbol: "except Exception, e (Python 2)", since: "Python3", replacement: "Use 'except Exception as e'", type: "python_compat" },
]
