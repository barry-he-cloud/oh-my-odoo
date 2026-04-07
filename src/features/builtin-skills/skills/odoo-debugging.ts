import type { BuiltinSkill } from "../types"

export const odooDebuggingSkill: BuiltinSkill = {
  name: "odoo-debugging",
  description: "Odoo debugging — log analysis, shell, pdb, SQL debugging, performance profiling, common error resolution",
  template: `# Odoo Debugging Expert

You help diagnose and resolve Odoo issues systematically.

## Log Locations
- **Odoo log**: path set by \`logfile\` in odoo.conf, or stdout
- **PostgreSQL**: \`/var/log/postgresql/\`
- **Nginx**: \`/var/log/nginx/error.log\`
- **Systemd journal**: \`journalctl -u odoo\`

## Debug with Odoo Shell
\`\`\`bash
./odoo-bin shell -d mydb -c odoo.conf
>>> env['res.partner'].search_count([])
>>> env['sale.order'].search([('state','=','draft')], limit=5)
>>> env.cr.execute("SELECT count(*) FROM res_partner")
>>> env.cr.fetchone()
\`\`\`

## Common Error Patterns

### AccessError
\`\`\`
AccessError: (Record rules don't apply for model.name)
\`\`\`
→ Missing ir.model.access.csv or ir.rule blocks access
→ Check: does the user's group have permissions?

### ValidationError
\`\`\`
ValidationError: constraint failed
\`\`\`
→ Check \`_sql_constraints\` and \`@api.constrains\`

### MissingError
\`\`\`
MissingError: Record does not exist or has been deleted
\`\`\`
→ Stale recordset reference after unlink/archive
→ Use \`.exists()\` to filter deleted records

### psycopg2 errors
\`\`\`
UniqueViolation / ForeignKeyViolation / UndefinedColumn
\`\`\`
→ Schema mismatch: run \`-u module --stop-after-init\`
→ Or migration script needed

## Performance Debugging
\`\`\`python
# Enable SQL logging in odoo.conf
log_level = debug_sql

# Or programmatically
import logging
logging.getLogger('odoo.sql_db').setLevel(logging.DEBUG)

# Profile specific code
from odoo.tools.profiler import profile
@profile('/tmp/profile.json')
def my_method(self):
    ...

# Measure in shell
import time
start = time.time()
env['my.model'].search([])
print(f"Took {time.time() - start:.3f}s")
\`\`\`

## Using pdb / debugger
\`\`\`python
# In code
import pdb; pdb.set_trace()

# With ipdb (better)
import ipdb; ipdb.set_trace()

# Start Odoo with debugger
./odoo-bin -d mydb --dev=all

# Useful pdb commands
# n(ext) - step over
# s(tep) - step into
# c(ontinue) - resume
# l(ist) - show code
# p expression - print
# pp expression - pretty print
\`\`\`

## Database Debugging
\`\`\`sql
-- Find records with issues
SELECT id, name, state FROM my_model WHERE state IS NULL;

-- Check constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'my_model'::regclass;

-- Find slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle' ORDER BY duration DESC;

-- Table size
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC LIMIT 20;
\`\`\`

## Systematic Debug Approach
1. Check Odoo logs for the exact error traceback
2. Reproduce with \`--log-level=debug\`
3. If ORM issue: test in shell with \`./odoo-bin shell\`
4. If view issue: check browser console + network tab
5. If data issue: inspect DB directly with psql
6. If performance: enable SQL logging, check query counts
7. Always test fix with \`--test-enable\` before deploying
`,
}
