import type { BuiltinSkill } from "../types"

export const odooUpgradeAnalysisSkill: BuiltinSkill = {
  name: "odoo-upgrade-analysis",
  description: "Odoo version upgrade — migration planning, breaking changes, ORM/OWL migration, migration scripts",
  template: `# Odoo Version Upgrade Expert

You help plan and execute Odoo version upgrades (14.0 → 15.0 → 16.0 → 17.0 → 18.0 → 19.0).

## Upgrade Process Overview

1. **Analyze** — Run odoo_upgrade_analyze tool to inventory all issues
2. **Plan** — Determine upgrade path (direct vs incremental)
3. **Migrate** — Write pre/post migration scripts
4. **Test** — Validate on copy of production database
5. **Deploy** — Apply upgrade with rollback plan

## Migration Scripts Convention
\`\`\`
my_module/
  migrations/
    17.0.1.0.0/
      pre-migrate.py    # Runs BEFORE module update
      post-migrate.py   # Runs AFTER module update
      end-migrate.py    # Runs after ALL modules updated
\`\`\`

## Key Breaking Changes by Version

### 15.0 → 16.0
- **OWL2 mandatory** — all legacy JS widgets must be converted
- **Asset bundles rewritten** — new manifest 'assets' key
- **Command triplets** — new \`Command.create()\`, \`Command.update()\` etc.

### 16.0 → 17.0
- **attrs={} deprecated** — use individual invisible/readonly/required
- **fields_view_get → get_views()**
- **Python 3.10+ required**
- **Onchange rework** — verify @api.onchange behavior

### 17.0 → 18.0
- **OWL3 upgrade** — setup() lifecycle changes
- **New REST API patterns**
- **Enhanced RBAC** — review group inheritance

### 18.0 → 19.0
- **OWL 4.0 with Signals** — useState() → useSignal() reactivity model
- **Native REST API /api/v2/** — /jsonrpc deprecated, OAuth2 bearer tokens
- **Vite asset bundling** — replaces legacy pipeline, update manifest assets
- **Python 3.12+ required** — distutils fully removed
- **Weasyprint PDF engine** — replaces wkhtmltopdf as default
- **fields.Dict() type** — JSONB-backed for unstructured data
- **Row-level security policies** — new alternative to ir.rule for new models

## Pre-Migration Script Template
\`\`\`python
import logging
from odoo.tools import sql

_logger = logging.getLogger(__name__)

def migrate(cr, version):
    # Rename columns before ORM drops them
    if sql.column_exists(cr, 'my_table', 'old_col'):
        cr.execute("ALTER TABLE my_table RENAME COLUMN old_col TO new_col")

    # Preserve data from removed fields
    if sql.column_exists(cr, 'my_table', 'deprecated_field'):
        cr.execute("""
            ALTER TABLE my_table ADD COLUMN IF NOT EXISTS backup_field VARCHAR
        """)
        cr.execute("UPDATE my_table SET backup_field = deprecated_field")
\`\`\`

## Post-Migration Script Template
\`\`\`python
from odoo import api, SUPERUSER_ID

def migrate(cr, version):
    env = api.Environment(cr, SUPERUSER_ID, {})

    # Recompute stored computed fields
    records = env['my.model'].search([])
    records._compute_my_field()

    # Data transformation
    for record in env['my.model'].search([('old_state', '!=', False)]):
        record.new_state = STATE_MAPPING.get(record.old_state, 'draft')

    # Set defaults for new required fields
    cr.execute("""
        UPDATE my_table SET new_field = 'default' WHERE new_field IS NULL
    """)
\`\`\`

## OCA Migration Helpers
Use \`openupgradelib\` for common patterns:
\`\`\`python
from openupgradelib import openupgrade

@openupgrade.migrate()
def migrate(env, version):
    openupgrade.rename_fields(env, [
        ('my.model', 'my_model', 'old_name', 'new_name'),
    ])
    openupgrade.rename_models(cr, [
        ('old.model', 'new.model'),
    ])
\`\`\`

## Testing Upgrade
1. Dump production DB: \`pg_dump -Fc prod_db > backup.dump\`
2. Restore to test: \`pg_restore -d test_db backup.dump\`
3. Run upgrade: \`odoo-bin -d test_db -u all --stop-after-init\`
4. Check logs for errors
5. Run test suite: \`odoo-bin -d test_db -u my_module --test-enable --stop-after-init\`
`,
}
