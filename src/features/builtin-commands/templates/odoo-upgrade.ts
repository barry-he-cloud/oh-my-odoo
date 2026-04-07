export const ODOO_UPGRADE_TEMPLATE = `Plan and execute an Odoo version upgrade.

This command will:
1. Run odoo_upgrade_analyze to scan all custom modules for compatibility issues
2. Identify breaking changes between source and target versions
3. Generate migration scripts (pre-migrate.py / post-migrate.py) for each module
4. Provide step-by-step upgrade checklist

HUMAN-IN-THE-LOOP PROTOCOL:
Version upgrades are high-risk operations. This command will:
- Present the full analysis report BEFORE any changes
- Require confirmation before generating migration scripts
- Generate scripts as proposals — never apply them automatically

Workflow:
1. Specify source version (e.g. "16.0") and target version (e.g. "18.0")
2. Review the upgrade analysis report
3. For large version gaps (>2 major), plan incremental upgrade path
4. Generate migration scripts per module
5. Test on a copy of production database
6. Validate with full test suite

Key concerns per version jump:
- 15→16: OWL2 mandatory, asset bundle rewrite
- 16→17: attrs={} deprecated, Python 3.10+ required
- 17→18: OWL3, REST API changes, enhanced RBAC
- 18→19: OWL4 Signals, Vite assets, /api/v2/ REST, weasyprint PDF, Python 3.12+

Arguments:
- source_version: Current Odoo version (e.g. "16.0")
- target_version: Target Odoo version (e.g. "18.0")
- Optional: --module=NAME (analyze specific module only)
- Optional: --generate-scripts (create migration script files)`
